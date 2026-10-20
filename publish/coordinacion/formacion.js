(function () {
  "use strict";

  // Pestaña Formación. Tablas del esquema `coordinacion`: formacion (ediciones de
  // un curso), formacion_personal (asistentes, o formación externa si no tiene
  // formacion_id), formacion_cursos, formacion_cursos_tipologia y
  // formacion_titulaciones (con los años de renovación de cada titulación).

  const ESTADOS = ["Planificado", "Realizado", "No superado"];
  const MODALIDADES = ["Presencial", "Teleformación"];
  const RESULTADOS = ["Apto", "Eficaz", "Paralizado", "Pospuesto"];
  const RENEWAL_WARNING_DAYS = 90;

  const state = {
    initialized: false,
    loaded: false,
    view: "ediciones",
    isAdmin: false,
    titulaciones: [],
    tipologias: [],
    cursos: [],
    formaciones: [],
    asistentes: [],
    personal: [],
    selectedId: "", // "" = nada, "new" = alta, o el id de la formación
    filters: { year: "", course: "", text: "" },
    externalPerson: null,
    dea: { rows: [], filter: "todos" },
    draft: null, // valores iniciales del formulario en una formación nueva o duplicada
  };

  const el = {};

  function q(selector) {
    return document.querySelector(selector);
  }

  function qa(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function norm(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }

  function setStatus(message, tone = "") {
    if (!el.status) return;
    el.status.textContent = message || "";
    el.status.className = `panel-status-message${tone ? ` ${tone}` : ""}`;
  }

  async function getClient() {
    if (!window.SupabaseApp?.getClient) {
      throw new Error("El cliente de Supabase no está disponible.");
    }
    return window.SupabaseApp.getClient();
  }

  async function fetchAll(supabase, table, select, orderColumn) {
    const pageSize = 1000;
    const rows = [];
    for (let from = 0; ; from += pageSize) {
      const result = await supabase
        .from(table)
        .select(select)
        .order(orderColumn, { ascending: true })
        .range(from, from + pageSize - 1);
      if (result.error) return result;
      rows.push(...(result.data || []));
      if ((result.data || []).length < pageSize) return { data: rows, error: null };
    }
  }

  // ---------------------------------------------------------------- fechas

  function todayIso() {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function formatDate(iso) {
    if (!iso) return "";
    const [y, m, d] = String(iso).slice(0, 10).split("-");
    return y && m && d ? `${d}/${m}/${y}` : "";
  }

  // Suma años a una fecha ISO sin pasar por Date (evita desfases de zona
  // horaria). Un 29/02 que cae en año no bisiesto pasa al 28/02.
  function addYears(iso, years) {
    const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return null;
    const ty = y + Number(years);
    const lastDay = new Date(Date.UTC(ty, m, 0)).getUTCDate();
    return [ty, String(m).padStart(2, "0"), String(Math.min(d, lastDay)).padStart(2, "0")].join("-");
  }

  function daysBetween(fromIso, toIso) {
    const a = Date.UTC(...fromIso.split("-").map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))));
    const b = Date.UTC(...toIso.split("-").map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))));
    return Math.round((b - a) / 86400000);
  }

  // ------------------------------------------------------------- catálogos

  function titulacionById(id) {
    return state.titulaciones.find((row) => String(row.id) === String(id));
  }

  function cursoById(id) {
    return state.cursos.find((row) => String(row.id) === String(id));
  }

  function personaById(id) {
    return state.personal.find((row) => String(row.id) === String(id));
  }

  function personaLabel(id) {
    return personaById(id)?.personal || `Persona ${id}`;
  }

  function formacionById(id) {
    return state.formaciones.find((row) => String(row.id) === String(id));
  }

  // Titulación a la que da acceso el curso de una formación (null si no da ninguna).
  function cursoTitulacionOf(formacionId) {
    const formacion = formacionById(formacionId);
    return cursoById(formacion?.formacion_curso_id)?.titulacion ?? null;
  }

  function titulacionOptions(selected, { empty = "— Sin titulación —" } = {}) {
    return [`<option value="">${escapeHtml(empty)}</option>`]
      .concat(
        state.titulaciones
          .filter((row) => row.titulacion)
          .map(
            (row) =>
              `<option value="${row.id}"${String(row.id) === String(selected ?? "") ? " selected" : ""}>${escapeHtml(row.titulacion)}</option>`
          )
      )
      .join("");
  }

  function selectOptions(list, selected, { empty = "" } = {}) {
    const items = list.map((value) => {
      const text = typeof value === "object" ? value.label : value;
      const key = typeof value === "object" ? value.value : value;
      return `<option value="${escapeHtml(key)}"${String(key) === String(selected ?? "") ? " selected" : ""}>${escapeHtml(text)}</option>`;
    });
    return [`<option value="">${escapeHtml(empty)}</option>`].concat(items).join("");
  }

  // Renovación = fecha de la formación + años de renovación de su titulación.
  // Solo cuenta lo ya hecho: ni lo planificado ni lo no superado.
  function renewalFor(row) {
    if (!row.fecha || row.estado === "Planificado" || row.estado === "No superado") return null;
    const years = titulacionById(row.titulacion)?.renovacion_anios;
    if (!years) return null;
    return addYears(row.fecha, years);
  }

  function renewalCell(row) {
    const renewal = renewalFor(row);
    if (!renewal) return '<span class="muted-text">—</span>';
    const days = daysBetween(todayIso(), renewal);
    let tone = "";
    let note = "";
    if (days < 0) {
      tone = " formacion-renewal-expired";
      note = " · vencida";
    } else if (days <= RENEWAL_WARNING_DAYS) {
      tone = " formacion-renewal-soon";
      note = ` · en ${days} d`;
    }
    return `<span class="formacion-renewal${tone}">${escapeHtml(formatDate(renewal))}${escapeHtml(note)}</span>`;
  }

  // ------------------------------------------------------------------ carga

  async function load({ force = false } = {}) {
    if (state.loaded && !force) {
      render();
      return;
    }
    setStatus("Cargando formación…");
    const supabase = await getClient();
    const [titulaciones, tipologias, cursos, formaciones, asistentes, personal, admin] = await Promise.all([
      fetchAll(supabase, "formacion_titulaciones", "*", "id"),
      fetchAll(supabase, "formacion_cursos_tipologia", "*", "id"),
      fetchAll(supabase, "formacion_cursos", "*", "id"),
      fetchAll(supabase, "formacion", "*", "id"),
      fetchAll(supabase, "formacion_personal", "*", "id"),
      fetchAll(supabase, "personal", "id, personal, dni, vinculacion_id, persona", "id"),
      supabase.rpc("is_coordinacion_admin"),
    ]);
    const failed = [titulaciones, tipologias, cursos, formaciones, asistentes, personal].find((r) => r.error);
    if (failed) {
      setStatus(`No se pudo cargar la formación: ${failed.error.message}`, "error");
      throw failed.error;
    }
    state.titulaciones = titulaciones.data || [];
    state.tipologias = tipologias.data || [];
    state.cursos = cursos.data || [];
    state.formaciones = formaciones.data || [];
    state.asistentes = asistentes.data || [];
    state.personal = (personal.data || []).filter((row) => row.persona !== false);
    state.isAdmin = !admin.error && Boolean(admin.data);
    state.loaded = true;
    if (state.selectedId && state.selectedId !== "new" && !formacionById(state.selectedId)) {
      state.selectedId = "";
    }
    setStatus("");
    render();
  }

  // ------------------------------------------------------------------ listado

  function attendeesOf(formacionId) {
    return state.asistentes.filter((row) => String(row.formacion_id) === String(formacionId));
  }

  function formacionDisplayName(row) {
    return row.identificacion || cursoById(row.formacion_curso_id)?.curso || `Formación ${row.id}`;
  }

  function filteredFormaciones() {
    const { year, course, text } = state.filters;
    const term = norm(text);
    return state.formaciones
      .filter((row) => {
        if (year && String(row.anio ?? "") !== year) return false;
        if (course && String(row.formacion_curso_id ?? "") !== course) return false;
        if (term) {
          const haystack = norm(
            [row.identificacion, cursoById(row.formacion_curso_id)?.curso, row.lugar, row.impartido].join(" ")
          );
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const byYear = (b.anio ?? 0) - (a.anio ?? 0);
        if (byYear) return byYear;
        const aStart = a.fecha_inicio || "";
        const bStart = b.fecha_inicio || "";
        if (aStart !== bStart) return bStart.localeCompare(aStart);
        return Number(b.id) - Number(a.id);
      });
  }

  function renderFilters() {
    const years = Array.from(new Set(state.formaciones.map((row) => row.anio).filter((y) => y != null))).sort(
      (a, b) => b - a
    );
    el.yearFilter.innerHTML =
      '<option value="">Todos los años</option>' +
      years
        .map((y) => `<option value="${y}"${String(y) === state.filters.year ? " selected" : ""}>${y}</option>`)
        .join("");
    const usedCourseIds = new Set(state.formaciones.map((row) => String(row.formacion_curso_id)));
    el.courseFilter.innerHTML =
      '<option value="">Todos los cursos</option>' +
      state.cursos
        .filter((row) => usedCourseIds.has(String(row.id)))
        .sort((a, b) => String(a.curso).localeCompare(String(b.curso), "es"))
        .map(
          (row) =>
            `<option value="${row.id}"${String(row.id) === state.filters.course ? " selected" : ""}>${escapeHtml(row.curso)}</option>`
        )
        .join("");
  }

  function renderList() {
    const rows = filteredFormaciones();
    el.listSummary.textContent = `${rows.length} de ${state.formaciones.length} formaciones`;
    if (!rows.length) {
      el.list.innerHTML = '<p class="empty-state">No hay formaciones con estos filtros.</p>';
      return;
    }
    el.list.innerHTML = rows
      .map((row) => {
        const selected = String(row.id) === String(state.selectedId);
        const count = attendeesOf(row.id).length;
        const dates = row.fecha_inicio
          ? row.fecha_fin && row.fecha_fin !== row.fecha_inicio
            ? `${formatDate(row.fecha_inicio)} – ${formatDate(row.fecha_fin)}`
            : formatDate(row.fecha_inicio)
          : "Sin fecha";
        const badge = row.realizado
          ? ""
          : '<span class="personal-list-badge personal-list-badge-inactive">Pendiente</span>';
        const avatarTone = row.realizado ? "ok" : "inactivo";
        return `
          <button type="button" class="personal-list-item${selected ? " active" : ""}" data-formacion-id="${row.id}"
            role="option" aria-selected="${selected}">
            <span class="personal-list-avatar personal-list-avatar-${avatarTone}">${escapeHtml(String(row.anio ?? "").slice(-2) || "--")}</span>
            <span class="personal-list-item-body">
              <span class="personal-list-item-name">${escapeHtml(formacionDisplayName(row))}</span>
              <span class="personal-list-item-meta">${escapeHtml(dates)} · ${count} asist.</span>
            </span>
            ${badge}
          </button>`;
      })
      .join("");
  }

  // ----------------------------------------------------------------- ficha

  // La ficha se compone de tres bloques: columna izquierda, columna derecha y,
  // debajo y a todo el ancho, los textos. Cada línea es una `detail-field-row cols-N`.
  function formLayout() {
    const cursoOptions = state.cursos
      .slice()
      .sort((a, b) => String(a.curso).localeCompare(String(b.curso), "es"))
      .map((row) => ({ value: row.id, label: `${row.curso}${row.esta_activo ? "" : " (inactivo)"}` }));
    return {
      left: [
        [{ key: "formacion_curso_id", label: "Curso", type: "select", options: cursoOptions, required: true }],
        [
          { key: "lugar", label: "Lugar", type: "text" },
          { key: "duracion", label: "Duración (h)", type: "number" },
          { key: "impartido", label: "Impartido por", type: "text" },
        ],
        [
          { key: "personal", label: "Personal destinatario", type: "text" },
          { key: "lenguaje_inclusivo", label: "Lenguaje inclusivo", type: "checkbox" },
          { key: "curso_para_promocion", label: "Curso para promoción", type: "checkbox" },
        ],
        Object.assign(
          [
            { key: "realizado", label: "Realizado", type: "checkbox" },
            { key: "bonificado", label: "Bonificado", type: "checkbox" },
          ],
          { cols: 3 }
        ),
      ],
      right: [
        [
          { key: "anio", label: "Año", type: "number", required: true },
          { key: "identificacion", label: "Identificación", type: "text", required: true },
          { key: "modalidad", label: "Modalidad", type: "select", options: MODALIDADES },
        ],
        [
          { key: "fecha_inicio", label: "Fecha inicio", type: "date" },
          { key: "fecha_fin", label: "Fecha fin", type: "date" },
          { key: "resultado", label: "Resultado", type: "select", options: RESULTADOS },
        ],
      ],
      text: [
        [
          { key: "observacion", label: "Observación", type: "textarea" },
          { key: "descripcion", label: "Descripción", type: "textarea" },
        ],
        [
          { key: "medios_pedagogicos", label: "Medios pedagógicos", type: "textarea" },
          { key: "valoracion", label: "Valoración", type: "textarea" },
        ],
      ],
    };
  }

  function formFields() {
    const layout = formLayout();
    return [...layout.left, ...layout.right, ...layout.text].flat();
  }

  function fieldHtml(field, value) {
    const id = `formacion-field-${field.key}`;
    const name = `name="${field.key}" id="${id}"`;
    if (field.type === "checkbox") {
      return `<label class="checkbox-item"><input type="checkbox" ${name}${value ? " checked" : ""} /><span>${escapeHtml(field.label)}</span></label>`;
    }
    const label = field.required ? `${field.label} *` : field.label;
    let control;
    if (field.type === "select") {
      control = `<select ${name}>${selectOptions(field.options, value, { empty: field.required ? "— Elige —" : "" })}</select>`;
    } else if (field.type === "textarea") {
      control = `<textarea ${name} rows="2">${escapeHtml(value ?? "")}</textarea>`;
    } else {
      control = `<input type="${field.type}" ${name} value="${escapeHtml(value ?? "")}"${field.type === "number" ? ' step="1"' : ""} />`;
    }
    return `<label>${escapeHtml(label)}${control}</label>`;
  }

  function renderForm(record) {
    const rowsHtml = (rows) =>
      rows
        .map(
          (row) =>
            `<div class="detail-field-row cols-${row.cols || row.length}">${row.map((field) => fieldHtml(field, record[field.key])).join("")}</div>`
        )
        .join("");
    const layout = formLayout();
    el.formFields.innerHTML = `
      <div class="formacion-form-top">
        <div class="formacion-form-col">${rowsHtml(layout.left)}</div>
        <div class="formacion-form-col">${rowsHtml(layout.right)}</div>
      </div>
      <div class="formacion-form-col formacion-form-text">${rowsHtml(layout.text)}</div>`;
  }

  function collectForm() {
    const out = {};
    formFields().forEach((field) => {
        const input = el.form.elements[field.key];
        if (!input) return;
        if (field.type === "checkbox") {
          out[field.key] = Boolean(input.checked);
        } else if (field.type === "number") {
          out[field.key] = input.value === "" ? null : Math.trunc(Number(input.value));
        } else if (field.type === "select" && field.key === "formacion_curso_id") {
          out[field.key] = input.value === "" ? null : Number(input.value);
        } else {
          const text = String(input.value ?? "").trim();
          out[field.key] = text === "" ? null : text;
        }
      });
    return out;
  }

  function showFormActions(visible) {
    el.saveButton.classList.toggle("hidden", !visible);
    el.cancelButton.classList.toggle("hidden", !visible);
  }

  function renderDetail() {
    const isNew = state.selectedId === "new";
    const record = isNew
      ? state.draft || { anio: new Date().getFullYear(), realizado: false, bonificado: false, lenguaje_inclusivo: false, curso_para_promocion: false }
      : formacionById(state.selectedId);

    if (!record) {
      el.formTitle.textContent = "Selecciona una formación";
      el.detailMeta.textContent = "";
      el.duplicateButton.classList.add("hidden");
      el.tableButton.classList.add("hidden");
      el.form.classList.add("hidden");
      el.attendeesSection.classList.add("hidden");
      el.deleteButton.classList.add("hidden");
      showFormActions(false);
      return;
    }

    el.form.classList.remove("hidden");
    renderForm(record);
    el.deleteButton.classList.toggle("hidden", isNew);
    el.duplicateButton.classList.toggle("hidden", isNew);
    el.tableButton.classList.toggle("hidden", isNew);
    showFormActions(isNew);

    if (isNew) {
      el.formTitle.textContent = state.draft?.__copyOf ? "Nueva formación (copia)" : "Nueva formación";
      el.detailMeta.textContent = state.draft?.__copyOf
        ? `Copia de ${state.draft.__copyOf}. Rellena año, identificación y fechas; guarda para añadir asistentes.`
        : "Guarda la formación para poder añadir asistentes.";
      el.attendeesSection.classList.add("hidden");
      return;
    }

    el.formTitle.textContent = formacionDisplayName(record);
    const curso = cursoById(record.formacion_curso_id);
    const titulacion = titulacionById(curso?.titulacion);
    const meta = [curso?.curso, titulacion?.titulacion].filter(Boolean);
    if (titulacion?.renovacion_anios) meta.push(`renovación a ${titulacion.renovacion_anios} años`);
    el.detailMeta.textContent = meta.join(" · ");
    el.attendeesSection.classList.remove("hidden");
    renderAttendees();
  }

  // -------------------------------------------------------------- asistentes

  function renderAttendees() {
    const formacion = formacionById(state.selectedId);
    if (!formacion) return;
    const rows = attendeesOf(formacion.id).sort((a, b) =>
      personaLabel(a.personal_id).localeCompare(personaLabel(b.personal_id), "es")
    );
    el.attendeesCount.textContent = `(${rows.length})`;
    if (!rows.length) {
      el.attendeesBody.innerHTML = '<tr><td colspan="8" class="empty-state">Sin asistentes. Añade personal con el buscador.</td></tr>';
      return;
    }
    el.attendeesBody.innerHTML = rows
      .map(
        (row) => `
        <tr data-attendee-id="${row.id}">
          <td>${escapeHtml(personaLabel(row.personal_id))}</td>
          <td><select data-field="estado">${selectOptions(ESTADOS, row.estado, { empty: "—" })}</select></td>
          <td><input type="date" data-field="fecha" value="${escapeHtml(row.fecha || "")}" /></td>
          <td><select data-field="titulacion">${titulacionOptions(row.titulacion)}</select></td>
          <td class="formacion-center"><input type="checkbox" data-field="dentro_jornada"${row.dentro_jornada ? " checked" : ""} /></td>
          <td class="formacion-center"><input type="checkbox" data-field="tiene_titulo"${row.tiene_titulo ? " checked" : ""} /></td>
          <td data-renewal>${renewalCell(row)}</td>
          <td><button type="button" class="secondary-button row-action" data-remove-attendee="${row.id}">Quitar</button></td>
        </tr>`
      )
      .join("");
  }

  async function updateAttendee(id, patch) {
    const supabase = await getClient();
    const { data, error } = await supabase.from("formacion_personal").update(patch).eq("id", id).select().maybeSingle();
    if (error || !data) {
      setStatus(error ? `No se pudo guardar: ${error.message}` : "No se pudo guardar: sin permiso sobre esta persona.", "error");
      return null;
    }
    const index = state.asistentes.findIndex((row) => String(row.id) === String(id));
    if (index >= 0) state.asistentes[index] = data;
    return data;
  }

  async function onAttendeeChange(event) {
    const control = event.target.closest("[data-field]");
    const tr = event.target.closest("tr[data-attendee-id]");
    if (!control || !tr) return;
    const id = tr.dataset.attendeeId;
    const field = control.dataset.field;
    const row = state.asistentes.find((item) => String(item.id) === String(id));
    if (!row) return;
    let value;
    if (control.type === "checkbox") value = control.checked;
    else if (field === "titulacion") value = control.value === "" ? null : Number(control.value);
    else value = control.value === "" ? null : control.value;

    const patch = { [field]: value };
    // Si deja de estar Realizado, la asistencia pierde la fecha de realización
    // y la titulación (y con ella la renovación).
    if (field === "estado" && row.estado === "Realizado" && value !== "Realizado") {
      patch.fecha = null;
      patch.titulacion = null;
    }
    // Al dar una asistencia por realizada sin fecha, se toma la fecha de fin del curso.
    if (field === "estado" && value === "Realizado" && !row.fecha) {
      patch.fecha = formacionById(row.formacion_id)?.fecha_fin || null;
    }
    // Al realizarla se le asigna la titulación del curso (y con ella la renovación).
    if (field === "estado" && value === "Realizado" && !row.titulacion) {
      patch.titulacion = cursoTitulacionOf(row.formacion_id);
    }
    const saved = await updateAttendee(id, patch);
    if (saved) {
      setStatus("");
      renderAttendees();
      renderList();
    } else {
      renderAttendees();
    }
  }

  async function removeAttendee(id) {
    const row = state.asistentes.find((item) => String(item.id) === String(id));
    if (!row || !window.confirm(`¿Quitar a ${personaLabel(row.personal_id)} de esta formación?`)) return;
    const supabase = await getClient();
    const { data, error } = await supabase.from("formacion_personal").delete().eq("id", id).select();
    if (error || !data?.length) {
      setStatus(error ? `No se pudo quitar: ${error.message}` : "No se pudo quitar: sin permiso sobre esta persona.", "error");
      return;
    }
    state.asistentes = state.asistentes.filter((item) => String(item.id) !== String(id));
    setStatus("");
    renderAttendees();
    renderList();
  }

  async function addAttendee(persona) {
    const formacion = formacionById(state.selectedId);
    if (!formacion || !persona) return;
    if (attendeesOf(formacion.id).some((row) => String(row.personal_id) === String(persona.id))) {
      setStatus(`${persona.personal} ya está en esta formación.`, "error");
      return;
    }
    const curso = cursoById(formacion.formacion_curso_id);
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("formacion_personal")
      .insert({
        formacion_id: formacion.id,
        personal_id: persona.id,
        estado: formacion.realizado ? "Realizado" : "Planificado",
        // Fecha por defecto: la de fin del curso. La titulación del curso se
        // asigna cuando la asistencia pasa a Realizado.
        fecha: formacion.fecha_fin || null,
        titulacion: formacion.realizado ? curso?.titulacion ?? null : null,
      })
      .select()
      .single();
    if (error) {
      setStatus(`No se pudo añadir: ${error.message}`, "error");
      return;
    }
    state.asistentes.push(data);
    setStatus("");
    renderAttendees();
    renderList();
  }

  async function markAllDone() {
    const formacion = formacionById(state.selectedId);
    if (!formacion) return;
    const pending = attendeesOf(formacion.id).filter((row) => row.estado !== "Realizado" && row.estado !== "No superado");
    if (!pending.length) {
      setStatus("No hay asistentes pendientes de marcar.");
      return;
    }
    if (!window.confirm(`¿Marcar como realizado a ${pending.length} asistente(s)?`)) return;
    const results = await Promise.all(
      pending.map((row) =>
        updateAttendee(row.id, {
          estado: "Realizado",
          fecha: row.fecha || formacion.fecha_fin || null,
          titulacion: row.titulacion ?? cursoTitulacionOf(formacion.id),
        })
      )
    );
    const failures = results.filter((r) => !r).length;
    setStatus(failures ? `${failures} asistente(s) no se pudieron actualizar.` : "Asistentes marcados como realizados.", failures ? "error" : "success");
    renderAttendees();
  }

  // -------------------------------------------------- guardar / eliminar edición

  async function saveFormacion(event) {
    event.preventDefault();
    const payload = collectForm();
    const missing = [];
    if (!payload.formacion_curso_id) missing.push("curso");
    if (payload.anio == null) missing.push("año");
    if (!payload.identificacion) missing.push("identificación");
    if (missing.length) {
      setStatus(`No se puede guardar: falta ${missing.join(", ")}.`, "error");
      return;
    }
    if (payload.fecha_inicio && payload.fecha_fin && payload.fecha_fin < payload.fecha_inicio) {
      setStatus("La fecha de fin no puede ser anterior a la de inicio.", "error");
      return;
    }

    const supabase = await getClient();
    const isNew = state.selectedId === "new";
    const query = isNew
      ? supabase.from("formacion").insert(payload).select().single()
      : supabase.from("formacion").update(payload).eq("id", state.selectedId).select().maybeSingle();
    const { data, error } = await query;
    if (error || !data) {
      setStatus(error ? `No se pudo guardar: ${error.message}` : "No se pudo guardar la formación.", "error");
      return;
    }
    if (isNew) {
      state.formaciones.push(data);
    } else {
      const index = state.formaciones.findIndex((row) => String(row.id) === String(data.id));
      if (index >= 0) state.formaciones[index] = data;
    }
    state.draft = null;
    state.selectedId = String(data.id);
    setStatus("Formación guardada.", "success");
    renderFilters();
    renderList();
    renderDetail();
  }

  async function deleteFormacion() {
    const formacion = formacionById(state.selectedId);
    if (!formacion) return;
    if (attendeesOf(formacion.id).length) {
      setStatus("Quita primero a los asistentes para poder eliminar la formación.", "error");
      return;
    }
    if (!window.confirm(`¿Eliminar la formación ${formacionDisplayName(formacion)}? Esta acción no se puede deshacer.`)) return;
    const supabase = await getClient();
    const { data, error } = await supabase.from("formacion").delete().eq("id", formacion.id).select();
    if (error || !data?.length) {
      setStatus(error ? `No se pudo eliminar: ${error.message}` : "No se pudo eliminar la formación.", "error");
      return;
    }
    state.formaciones = state.formaciones.filter((row) => String(row.id) !== String(formacion.id));
    state.selectedId = "";
    setStatus("Formación eliminada.", "success");
    renderFilters();
    renderList();
    renderDetail();
  }

  // Duplica la formación seleccionada: mismos datos salvo año, identificación y
  // fechas (inicio, fin y caducidad), y sin asistentes. Queda como alta sin guardar.
  function duplicateFormacion() {
    const source = formacionById(state.selectedId);
    if (!source) return;
    const { id, anio, identificacion, fecha_inicio, fecha_fin, fecha_caducidad, ...rest } = source;
    state.draft = {
      ...rest,
      anio: null,
      identificacion: null,
      fecha_inicio: null,
      fecha_fin: null,
      fecha_caducidad: null,
      __copyOf: formacionDisplayName(source),
    };
    state.selectedId = "new";
    setStatus("");
    renderList();
    renderDetail();
  }

  // ------------------------------------------------ tabla de asistentes (copiar)

  const COPY_COLUMNS = ["Nombre y apellidos", "DNI", "Email", "Teléfono móvil", "Seguridad Social", "Fecha de nacimiento", "TC"];
  let copyRows = [];

  async function fetchInChunks(supabase, table, select, column, ids, size = 30) {
    const rows = [];
    for (let i = 0; i < ids.length; i += size) {
      const { data, error } = await supabase.from(table).select(select).in(column, ids.slice(i, i + size));
      if (error) return { data: rows, error };
      rows.push(...(data || []));
    }
    return { data: rows, error: null };
  }

  // TC = "clave duración jornada" del historial laboral vigente hoy; si no hay
  // ninguno vigente, el de alta más reciente.
  function contractLabel(historiales) {
    const withContract = historiales.filter((h) => h.contrato_laboral_clave);
    if (!withContract.length) return "";
    const today = todayIso();
    const byRecent = (a, b) => String(b.fecha_alta || "").localeCompare(String(a.fecha_alta || ""));
    const active = withContract
      .filter((h) => (!h.fecha_alta || h.fecha_alta <= today) && (!h.fecha_baja || h.fecha_baja >= today))
      .sort(byRecent);
    const chosen = active[0] || withContract.sort(byRecent)[0];
    return [chosen.contrato_laboral_clave, chosen.contrato_laboral_duracion, chosen.contrato_laboral_jornada]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean)
      .join(" ");
  }

  async function openAttendeesTable() {
    const formacion = formacionById(state.selectedId);
    if (!formacion) return;
    const ids = Array.from(new Set(attendeesOf(formacion.id).map((row) => row.personal_id)));
    if (!ids.length) {
      setStatus("Esta formación no tiene asistentes.", "error");
      return;
    }
    el.tableTitle.textContent = `Asistentes · ${formacionDisplayName(formacion)}`;
    el.tableNote.textContent = "Cargando datos…";
    el.tableBody.innerHTML = "";
    el.tablePanel.classList.remove("hidden");

    const supabase = await getClient();
    const [personal, confidencial, historiales] = await Promise.all([
      fetchInChunks(supabase, "personal", "id, personal, dni, email, movil, telefono", "id", ids),
      fetchInChunks(supabase, "personal_confidencial", "personal_id, ss, fecha_nacimiento", "personal_id", ids),
      fetchInChunks(
        supabase,
        "historiales_laborales_detalle",
        "personal_id, fecha_alta, fecha_baja, contrato_laboral_clave, contrato_laboral_duracion, contrato_laboral_jornada",
        "personal_id",
        ids
      ),
    ]);
    if (personal.error) {
      el.tableNote.textContent = `No se pudieron cargar los datos: ${personal.error.message}`;
      return;
    }
    const notes = [];
    if (confidencial.error) notes.push("sin acceso a Seguridad Social y fecha de nacimiento");
    if (historiales.error) notes.push("no se pudo leer el historial laboral (TC)");

    const confById = new Map((confidencial.data || []).map((row) => [row.personal_id, row]));
    const histById = new Map();
    (historiales.data || []).forEach((row) => {
      if (!histById.has(row.personal_id)) histById.set(row.personal_id, []);
      histById.get(row.personal_id).push(row);
    });

    copyRows = (personal.data || [])
      .map((row) => {
        const conf = confById.get(row.id);
        return [
          row.personal || "",
          row.dni || "",
          row.email || "",
          row.movil || row.telefono || "",
          conf?.ss || "",
          formatDate(conf?.fecha_nacimiento),
          contractLabel(histById.get(row.id) || []),
        ];
      })
      .sort((a, b) => a[0].localeCompare(b[0], "es"));

    el.tableBody.innerHTML = copyRows
      .map((cells) => `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("");
    const missing = ids.length - copyRows.length;
    if (missing > 0) notes.push(`${missing} persona(s) sin permiso de lectura`);
    el.tableNote.textContent = [`${copyRows.length} personas`, ...notes].join(" · ");
  }

  async function copyAttendeesTable() {
    if (!copyRows.length) return;
    const withHeader = el.tableHeaderCheck.checked;
    const rows = withHeader ? [COPY_COLUMNS, ...copyRows] : copyRows;
    const text = rows.map((cells) => cells.join("\t")).join("\n");
    const html =
      "<table>" +
      rows
        .map((cells, index) => {
          const tag = withHeader && index === 0 ? "th" : "td";
          return `<tr>${cells.map((cell) => `<${tag}>${escapeHtml(cell)}</${tag}>`).join("")}</tr>`;
        })
        .join("") +
      "</table>";
    try {
      if (navigator.clipboard && typeof window.ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setStatus("Tabla copiada. Pégala en Excel o Word.", "success");
    } catch (_error) {
      setStatus("No se pudo copiar automáticamente; selecciona la tabla y cópiala con Ctrl+C.", "error");
    }
  }

  function selectFormacion(id) {
    state.draft = null;
    state.selectedId = id ? String(id) : "";
    renderList();
    renderDetail();
  }

  // ---------------------------------------------------------- buscador personas

  function bindPicker(input, results, { exclude, onPick }) {
    const render = () => {
      const term = norm(input.value);
      if (term.length < 2) {
        results.classList.add("hidden");
        return;
      }
      const excluded = exclude();
      const matches = state.personal
        .filter((row) => !excluded.has(String(row.id)) && norm(`${row.personal} ${row.dni || ""}`).includes(term))
        .slice(0, 8);
      results.innerHTML = matches.length
        ? matches
            .map(
              (row) =>
                `<button type="button" class="filter-suggestion-option" data-person-id="${row.id}">${escapeHtml(row.personal)}<span class="muted-text"> ${escapeHtml(row.dni || "")}</span></button>`
            )
            .join("")
        : '<p class="empty-state">Sin coincidencias.</p>';
      results.classList.remove("hidden");
    };
    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    results.addEventListener("click", (event) => {
      const button = event.target.closest("[data-person-id]");
      if (!button) return;
      const persona = personaById(button.dataset.personId);
      results.classList.add("hidden");
      input.value = "";
      if (persona) onPick(persona);
    });
    document.addEventListener("click", (event) => {
      if (!input.parentElement.contains(event.target)) results.classList.add("hidden");
    });
  }

  // ----------------------------------------------------------- formación externa

  function externalRows() {
    const titulacion = el.externalFilterTitulacion.value;
    const term = norm(el.externalFilterText.value);
    return state.asistentes
      .filter((row) => row.formacion_id == null)
      .filter((row) => !titulacion || String(row.titulacion ?? "") === titulacion)
      .filter((row) => !term || norm(`${personaLabel(row.personal_id)} ${personaById(row.personal_id)?.dni || ""}`).includes(term))
      .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  }

  function renderExternalFilters() {
    const current = el.externalFilterTitulacion.value;
    el.externalFilterTitulacion.innerHTML = titulacionOptions(current, { empty: "Todas las titulaciones" });
    el.externalTitulacion.innerHTML = titulacionOptions(el.externalTitulacion.value, { empty: "— Elige —" });
  }

  function renderExternal() {
    renderExternalFilters();
    const rows = externalRows();
    const total = state.asistentes.filter((row) => row.formacion_id == null).length;
    el.externalSummary.textContent = `${rows.length} de ${total} registros`;
    if (!rows.length) {
      el.externalBody.innerHTML = '<tr><td colspan="6" class="empty-state">Sin registros.</td></tr>';
      return;
    }
    el.externalBody.innerHTML = rows
      .map(
        (row) => `
        <tr data-attendee-id="${row.id}">
          <td>${escapeHtml(personaLabel(row.personal_id))}</td>
          <td><select data-field="titulacion">${titulacionOptions(row.titulacion)}</select></td>
          <td><input type="date" data-field="fecha" value="${escapeHtml(row.fecha || "")}" /></td>
          <td>${renewalCell(row)}</td>
          <td><input type="text" data-field="observacion" value="${escapeHtml(row.observacion || "")}" /></td>
          <td><button type="button" class="secondary-button row-action" data-remove-external="${row.id}">Quitar</button></td>
        </tr>`
      )
      .join("");
  }

  async function onExternalChange(event) {
    const control = event.target.closest("[data-field]");
    const tr = event.target.closest("tr[data-attendee-id]");
    if (!control || !tr) return;
    const field = control.dataset.field;
    let value = control.value === "" ? null : control.value;
    if (field === "titulacion" && value != null) value = Number(value);
    if (field === "observacion" && value != null) value = value.trim() || null;
    const saved = await updateAttendee(tr.dataset.attendeeId, { [field]: value });
    if (saved) setStatus("");
    renderExternal();
  }

  async function removeExternal(id) {
    const row = state.asistentes.find((item) => String(item.id) === String(id));
    if (!row || !window.confirm(`¿Quitar la formación externa de ${personaLabel(row.personal_id)}?`)) return;
    const supabase = await getClient();
    const { data, error } = await supabase.from("formacion_personal").delete().eq("id", id).select();
    if (error || !data?.length) {
      setStatus(error ? `No se pudo quitar: ${error.message}` : "No se pudo quitar: sin permiso sobre esta persona.", "error");
      return;
    }
    state.asistentes = state.asistentes.filter((item) => String(item.id) !== String(id));
    renderExternal();
  }

  async function addExternal(event) {
    event.preventDefault();
    if (!state.externalPerson) {
      setStatus("Elige la persona.", "error");
      return;
    }
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("formacion_personal")
      .insert({
        formacion_id: null,
        personal_id: state.externalPerson.id,
        estado: "Realizado",
        titulacion: Number(el.externalTitulacion.value),
        fecha: el.externalFecha.value,
        observacion: el.externalObservacion.value.trim() || null,
      })
      .select()
      .single();
    if (error) {
      setStatus(`No se pudo añadir: ${error.message}`, "error");
      return;
    }
    state.asistentes.push(data);
    state.externalPerson = null;
    el.externalPersonChosen.textContent = "Ninguna persona elegida";
    el.externalFecha.value = "";
    el.externalObservacion.value = "";
    setStatus("Formación externa añadida.", "success");
    renderExternal();
  }

  // ------------------------------------------------------------------- catálogos

  function renderCatalogs() {
    const readonly = state.isAdmin ? "" : " disabled";
    el.titulacionesBody.innerHTML = state.titulaciones
      .filter((row) => row.titulacion)
      .map(
        (row) => `
        <tr data-titulacion-id="${row.id}">
          <td>${escapeHtml(row.titulacion)}</td>
          <td><input type="number" min="1" step="1" data-field="renovacion_anios" value="${row.renovacion_anios ?? ""}" placeholder="No caduca"${readonly} /></td>
        </tr>`
      )
      .join("");

    const tipologiaOptions = (selected) =>
      selectOptions(
        state.tipologias.map((row) => ({ value: row.id, label: row.tipologia })),
        selected,
        { empty: "—" }
      );
    el.cursosBody.innerHTML = state.cursos
      .slice()
      .sort((a, b) => String(a.curso).localeCompare(String(b.curso), "es"))
      .map(
        (row) => `
        <tr data-curso-id="${row.id}">
          <td><input type="text" data-field="curso" value="${escapeHtml(row.curso)}"${readonly} /></td>
          <td><input type="text" data-field="empresa" value="${escapeHtml(row.empresa || "")}"${readonly} /></td>
          <td><select data-field="titulacion"${readonly}>${titulacionOptions(row.titulacion)}</select></td>
          <td><select data-field="tipologia"${readonly}>${tipologiaOptions(row.tipologia)}</select></td>
          <td class="formacion-center"><input type="checkbox" data-field="esta_activo"${row.esta_activo ? " checked" : ""}${readonly} /></td>
        </tr>`
      )
      .join("");

    el.cursoTitulacion.innerHTML = titulacionOptions(el.cursoTitulacion.value);
    el.cursoTipologia.innerHTML = tipologiaOptions(el.cursoTipologia.value);
    qa("#private-tab-panel-formacion .formacion-admin-only").forEach((node) => node.classList.toggle("hidden", !state.isAdmin));
    q("#private-tab-panel-formacion .formacion-readonly-note")?.classList.toggle("hidden", state.isAdmin);
  }

  async function onTitulacionChange(event) {
    const control = event.target.closest("[data-field]");
    const tr = event.target.closest("tr[data-titulacion-id]");
    if (!control || !tr) return;
    const years = control.value === "" ? null : Math.trunc(Number(control.value));
    if (years !== null && !(years > 0)) {
      setStatus("Los años de renovación deben ser un número mayor que 0.", "error");
      renderCatalogs();
      return;
    }
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("formacion_titulaciones")
      .update({ renovacion_anios: years })
      .eq("id", tr.dataset.titulacionId)
      .select()
      .maybeSingle();
    if (error || !data) {
      setStatus(error ? `No se pudo guardar: ${error.message}` : "No tienes permiso para modificar el catálogo.", "error");
    } else {
      const index = state.titulaciones.findIndex((row) => String(row.id) === String(data.id));
      if (index >= 0) state.titulaciones[index] = data;
      setStatus("Renovación guardada.", "success");
    }
    renderCatalogs();
  }

  async function onCursoChange(event) {
    const control = event.target.closest("[data-field]");
    const tr = event.target.closest("tr[data-curso-id]");
    if (!control || !tr) return;
    const field = control.dataset.field;
    let value;
    if (control.type === "checkbox") value = control.checked;
    else if (field === "titulacion" || field === "tipologia") value = control.value === "" ? null : Number(control.value);
    else value = control.value.trim() || null;
    if (field === "curso" && !value) {
      setStatus("El curso necesita un nombre.", "error");
      renderCatalogs();
      return;
    }
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("formacion_cursos")
      .update({ [field]: value })
      .eq("id", tr.dataset.cursoId)
      .select()
      .maybeSingle();
    if (error || !data) {
      setStatus(error ? `No se pudo guardar: ${error.message}` : "No tienes permiso para modificar el catálogo.", "error");
    } else {
      const index = state.cursos.findIndex((row) => String(row.id) === String(data.id));
      if (index >= 0) state.cursos[index] = data;
      setStatus("Curso guardado.", "success");
    }
    renderCatalogs();
    renderFilters();
    renderList();
  }

  async function addTitulacion(event) {
    event.preventDefault();
    const name = el.titulacionName.value.trim();
    const years = el.titulacionYears.value === "" ? null : Math.trunc(Number(el.titulacionYears.value));
    if (!name) return;
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("formacion_titulaciones")
      .insert({ titulacion: name, renovacion_anios: years })
      .select()
      .single();
    if (error) {
      setStatus(`No se pudo añadir: ${error.message}`, "error");
      return;
    }
    state.titulaciones.push(data);
    el.titulacionForm.reset();
    setStatus("Titulación añadida.", "success");
    renderCatalogs();
  }

  async function addCurso(event) {
    event.preventDefault();
    const name = el.cursoName.value.trim();
    if (!name) return;
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("formacion_cursos")
      .insert({
        curso: name,
        empresa: el.cursoEmpresa.value.trim() || null,
        titulacion: el.cursoTitulacion.value === "" ? null : Number(el.cursoTitulacion.value),
        tipologia: el.cursoTipologia.value === "" ? null : Number(el.cursoTipologia.value),
        esta_activo: true,
      })
      .select()
      .single();
    if (error) {
      setStatus(`No se pudo añadir: ${error.message}`, "error");
      return;
    }
    state.cursos.push(data);
    el.cursoForm.reset();
    setStatus("Curso añadido.", "success");
    renderCatalogs();
  }

  // ------------------------------------------------------------------- vistas

  // -------------------------------------------------------------------- DEA
  // Botón DEA: personal que pertenece a la empresa con el DEA caducado, por caducar (seis
  // meses) o sin DEA. Lo calcula coordinacion.get_formacion_dea (supabase/tables/formacion_dea.sql).

  const DEA_ESTADOS = {
    caducado: { texto: "Caducado", clase: "formacion-renewal-expired" },
    por_caducar: { texto: "Caduca pronto", clase: "formacion-renewal-soon" },
    sin_dea: { texto: "Sin DEA", clase: "" },
  };

  function deaFilteredRows() {
    const { rows, filter } = state.dea;
    if (filter === "todos") return rows;
    if (filter === "puntual") return rows.filter((row) => row.motivo === "puntual");
    return rows.filter((row) => row.estado_dea === filter);
  }

  function renderDeaFilters() {
    const rows = state.dea.rows;
    const count = (fn) => rows.filter(fn).length;
    const chips = [
      ["todos", "Todos", rows.length],
      ["caducado", "Caducados", count((r) => r.estado_dea === "caducado")],
      ["por_caducar", "Caducan en 6 meses", count((r) => r.estado_dea === "por_caducar")],
      ["sin_dea", "Sin DEA", count((r) => r.estado_dea === "sin_dea")],
      ["puntual", "Puesto puntual", count((r) => r.motivo === "puntual")],
    ];
    el.deaFilters.innerHTML = chips
      .map(
        ([key, label, n]) =>
          `<button type="button" class="settings-subtab-button${state.dea.filter === key ? " active" : ""}" data-dea-filter="${key}" aria-pressed="${state.dea.filter === key}">${escapeHtml(label)} · ${n}</button>`
      )
      .join("");
  }

  function deaDueCell(row) {
    if (!row.caducidad) return '<span class="muted-text">No consta ningún DEA</span>';
    const info = DEA_ESTADOS[row.estado_dea];
    const days = row.dias;
    const note = days < 0 ? `hace ${-days} d` : days === 0 ? "hoy" : `en ${days} d`;
    return `<span class="formacion-renewal ${info?.clase || ""}">${escapeHtml(formatDate(row.caducidad))}</span> <span class="muted-text">${escapeHtml(note)}</span>`;
  }

  function renderDea() {
    renderDeaFilters();
    const rows = deaFilteredRows();
    if (!rows.length) {
      el.deaBody.innerHTML = '<tr><td colspan="6" class="empty-state">Nadie en este grupo.</td></tr>';
      return;
    }
    el.deaBody.innerHTML = rows
      .map((row) => {
        const info = DEA_ESTADOS[row.estado_dea] || { texto: row.estado_dea, clase: "" };
        const puestos = (row.puestos || []).length
          ? row.puestos
              .map(
                (p) =>
                  `<span class="formacion-dea-puesto${p.vigente ? "" : " muted-text"}" title="${p.vigente ? "Vigente" : `Hasta ${escapeHtml(formatDate(p.hasta))}`}">${escapeHtml(p.puesto)}</span>`
              )
              .join(" ")
          : '<span class="muted-text">Ninguno en el historial (puesto puntual)</span>';
        const registros = (row.registros || []).length
          ? row.registros.map((r) => `${escapeHtml(r.puesto)}: ${r.registros}`).join(" · ")
          : '<span class="muted-text">—</span>';
        return `<tr>
          <td>${escapeHtml(row.personal)}${row.vinculacion_id === 2 ? ' <span class="muted-text">(no activo)</span>' : ""}</td>
          <td><span class="formacion-renewal ${info.clase}">${escapeHtml(info.texto)}</span></td>
          <td>${deaDueCell(row)}</td>
          <td>${row.ultima_fecha ? escapeHtml(formatDate(row.ultima_fecha)) : '<span class="muted-text">—</span>'}</td>
          <td>${puestos}</td>
          <td>${registros}</td>
        </tr>`;
      })
      .join("");
  }

  async function openDea() {
    el.deaPanel.classList.remove("hidden");
    el.deaStatus.textContent = "Calculando…";
    el.deaStatus.className = "panel-status-message";
    el.deaNote.textContent =
      "Personal que pertenece a la empresa (activo y no activo) con el DEA caducado o que caduca en los próximos seis meses, " +
      "con un puesto con requisito DEA en su historial laboral (aunque no conste ningún DEA) o que ha cubierto un puesto con DEA en el último año.";
    try {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc("get_formacion_dea");
      if (error) throw error;
      state.dea.rows = data || [];
      el.deaStatus.textContent = "";
      renderDea();
    } catch (error) {
      el.deaStatus.textContent = `No se pudo calcular el listado DEA: ${error.message || error}`;
      el.deaStatus.className = "panel-status-message error";
    }
  }

  function closeDea() {
    el.deaPanel.classList.add("hidden");
  }

  function switchView(view) {
    state.view = view;
    qa("#private-tab-panel-formacion [data-formacion-view]").forEach((button) => {
      const active = button.dataset.formacionView === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    el.viewEdiciones.classList.toggle("hidden", view !== "ediciones");
    el.viewExterna.classList.toggle("hidden", view !== "externa");
    el.viewCatalogos.classList.toggle("hidden", view !== "catalogos");
    render();
  }

  function render() {
    if (!state.initialized || !state.loaded) return;
    if (state.view === "ediciones") {
      renderFilters();
      renderList();
      renderDetail();
    } else if (state.view === "externa") {
      renderExternal();
    } else {
      renderCatalogs();
    }
  }

  function bind() {
    qa("#private-tab-panel-formacion [data-formacion-view]").forEach((button) =>
      button.addEventListener("click", () => switchView(button.dataset.formacionView))
    );
    el.deaButton.addEventListener("click", () => void openDea());
    el.deaCloseButton.addEventListener("click", closeDea);
    el.deaOverlay.addEventListener("click", closeDea);
    el.deaFilters.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-dea-filter]");
      if (!chip) return;
      state.dea.filter = chip.dataset.deaFilter;
      renderDea();
    });
    el.refresh.addEventListener("click", () => void load({ force: true }).catch(() => {}));
    el.newButton.addEventListener("click", () => {
      if (state.view !== "ediciones") switchView("ediciones");
      state.draft = null;
      state.selectedId = "new";
      renderList();
      renderDetail();
    });

    el.yearFilter.addEventListener("change", () => {
      state.filters.year = el.yearFilter.value;
      renderList();
    });
    el.courseFilter.addEventListener("change", () => {
      state.filters.course = el.courseFilter.value;
      renderList();
    });
    el.textFilter.addEventListener("input", () => {
      state.filters.text = el.textFilter.value;
      renderList();
    });
    el.list.addEventListener("click", (event) => {
      const item = event.target.closest("[data-formacion-id]");
      if (item) selectFormacion(item.dataset.formacionId);
    });

    el.form.addEventListener("submit", (event) => void saveFormacion(event));
    el.form.addEventListener("input", () => showFormActions(true));
    el.form.addEventListener("change", () => showFormActions(true));
    el.cancelButton.addEventListener("click", () => {
      if (state.selectedId === "new") state.selectedId = "";
      state.draft = null;
      renderList();
      renderDetail();
    });
    el.deleteButton.addEventListener("click", () => void deleteFormacion());
    el.duplicateButton.addEventListener("click", duplicateFormacion);
    el.tableButton.addEventListener("click", () => void openAttendeesTable());
    el.tableCopyButton.addEventListener("click", () => void copyAttendeesTable());
    el.tableCloseButton.addEventListener("click", () => el.tablePanel.classList.add("hidden"));
    el.tableOverlay.addEventListener("click", () => el.tablePanel.classList.add("hidden"));

    el.attendeesBody.addEventListener("change", (event) => void onAttendeeChange(event));
    el.attendeesBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-attendee]");
      if (button) void removeAttendee(button.dataset.removeAttendee);
    });
    el.attendeesDone.addEventListener("click", () => void markAllDone());
    bindPicker(el.attendeeSearch, el.attendeeResults, {
      exclude: () => new Set(attendeesOf(state.selectedId).map((row) => String(row.personal_id))),
      onPick: (persona) => void addAttendee(persona),
    });

    bindPicker(el.externalPersonSearch, el.externalPersonResults, {
      exclude: () => new Set(),
      onPick: (persona) => {
        state.externalPerson = persona;
        el.externalPersonChosen.textContent = persona.personal;
      },
    });
    el.externalForm.addEventListener("submit", (event) => void addExternal(event));
    el.externalFilterTitulacion.addEventListener("change", renderExternal);
    el.externalFilterText.addEventListener("input", renderExternal);
    el.externalBody.addEventListener("change", (event) => void onExternalChange(event));
    el.externalBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-external]");
      if (button) void removeExternal(button.dataset.removeExternal);
    });

    el.titulacionesBody.addEventListener("change", (event) => void onTitulacionChange(event));
    el.cursosBody.addEventListener("change", (event) => void onCursoChange(event));
    el.titulacionForm.addEventListener("submit", (event) => void addTitulacion(event));
    el.cursoForm.addEventListener("submit", (event) => void addCurso(event));
  }

  function init() {
    if (state.initialized) return;
    if (!q("#private-tab-panel-formacion")) return;
    Object.assign(el, {
      status: q("#formacion-status"),
      refresh: q("#formacion-refresh-button"),
      newButton: q("#formacion-new-button"),
      deaButton: q("#formacion-dea-button"),
      deaPanel: q("#formacion-dea-panel"),
      deaOverlay: q("#formacion-dea-overlay"),
      deaCloseButton: q("#formacion-dea-close-button"),
      deaNote: q("#formacion-dea-note"),
      deaFilters: q("#formacion-dea-filters"),
      deaStatus: q("#formacion-dea-status"),
      deaBody: q("#formacion-dea-body"),
      viewEdiciones: q("#formacion-view-ediciones"),
      viewExterna: q("#formacion-view-externa"),
      viewCatalogos: q("#formacion-view-catalogos"),
      yearFilter: q("#formacion-year-filter"),
      courseFilter: q("#formacion-course-filter"),
      textFilter: q("#formacion-text-filter"),
      listSummary: q("#formacion-list-summary"),
      list: q("#formacion-list"),
      formTitle: q("#formacion-form-title"),
      detailMeta: q("#formacion-detail-meta"),
      form: q("#formacion-form"),
      formFields: q("#formacion-form-fields"),
      saveButton: q("#formacion-save-button"),
      cancelButton: q("#formacion-cancel-button"),
      deleteButton: q("#formacion-delete-button"),
      duplicateButton: q("#formacion-duplicate-button"),
      tableButton: q("#formacion-table-button"),
      tablePanel: q("#formacion-table-panel"),
      tableOverlay: q("#formacion-table-overlay"),
      tableCloseButton: q("#formacion-table-close-button"),
      tableCopyButton: q("#formacion-table-copy-button"),
      tableHeaderCheck: q("#formacion-table-header-check"),
      tableTitle: q("#formacion-table-title"),
      tableNote: q("#formacion-table-note"),
      tableBody: q("#formacion-table-copy-body"),
      attendeesSection: q("#formacion-attendees-section"),
      attendeesCount: q("#formacion-attendees-count"),
      attendeesDone: q("#formacion-attendees-done-button"),
      attendeeSearch: q("#formacion-attendee-search"),
      attendeeResults: q("#formacion-attendee-results"),
      attendeesBody: q("#formacion-attendees-body"),
      externalForm: q("#formacion-external-form"),
      externalPersonSearch: q("#formacion-external-person-search"),
      externalPersonResults: q("#formacion-external-person-results"),
      externalPersonChosen: q("#formacion-external-person-chosen"),
      externalTitulacion: q("#formacion-external-titulacion"),
      externalFecha: q("#formacion-external-fecha"),
      externalObservacion: q("#formacion-external-observacion"),
      externalFilterTitulacion: q("#formacion-external-filter-titulacion"),
      externalFilterText: q("#formacion-external-filter-text"),
      externalSummary: q("#formacion-external-summary"),
      externalBody: q("#formacion-external-body"),
      titulacionesBody: q("#formacion-titulaciones-body"),
      titulacionForm: q("#formacion-titulacion-form"),
      titulacionName: q("#formacion-titulacion-name"),
      titulacionYears: q("#formacion-titulacion-years"),
      cursosBody: q("#formacion-cursos-body"),
      cursoForm: q("#formacion-curso-form"),
      cursoName: q("#formacion-curso-name"),
      cursoEmpresa: q("#formacion-curso-empresa"),
      cursoTitulacion: q("#formacion-curso-titulacion"),
      cursoTipologia: q("#formacion-curso-tipologia"),
    });
    state.initialized = true;
    bind();
  }

  window.CoordinacionFormacion = { init, load };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
