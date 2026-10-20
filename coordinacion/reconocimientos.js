(function () {
  "use strict";

  // Reconocimientos médicos del personal (botón de la pestaña Personal).
  // Tabla del esquema `coordinacion`: personal_reconocimiento_medico, una fila por
  // persona y campaña (año): si autoriza el reconocimiento, la fecha y el resultado.
  // La periodicidad sale del puesto (puestos.rec_medico: 1 = anual, 2 = bienal) y el
  // puesto de la persona, de su historial laboral.

  const RESULTADOS = ["Apta", "Con limitaciones", "No apta"];
  // Personal que pertenece a la empresa: Activo (1) y No activo (2), como el filtro «Pertenece»
  // de la pestaña Personal. Los Pendiente de desvincular (3) y No pertenece (4) no cuentan,
  // aunque les falte documentación; tampoco lo que no es una persona (los puestos «zz …»).
  const PERTENECE_IDS = [1, 2];

  const state = {
    initialized: false,
    personalId: null,
    persona: null,
    puesto: null,
    periodicidad: null,
    registros: [],
    editingId: null,
    autoriza: null,
    confirmDeleteId: null,
    listado: { loaded: false, loading: false, year: new Date().getFullYear(), filter: "todos", text: "", rows: [] },
  };

  const el = {};

  function q(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function currentYear() {
    return new Date().getFullYear();
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const [y, m, d] = String(iso).slice(0, 10).split("-");
    return y && m && d ? `${d}/${m}/${y}` : "—";
  }

  function setStatus(message, tone = "") {
    if (!el.status) return;
    el.status.textContent = message || "";
    el.status.dataset.tone = tone;
  }

  async function getClient() {
    if (!window.SupabaseApp?.getClient) {
      throw new Error("El cliente de Supabase no está disponible.");
    }
    return window.SupabaseApp.getClient();
  }

  function periodicityText(value) {
    if (value === 1) return "Anual";
    if (value === 2) return "Bienal";
    return "No se ofrece";
  }

  // Anual: siempre toca. Bienal: toca si no se ha hecho ninguno (con fecha) en el año
  // anterior ni en el actual.
  function dueThisYear() {
    if (!state.periodicidad) return false;
    if (state.periodicidad === 1) return true;
    const last = state.registros
      .filter((r) => r.autoriza === true && r.fecha)
      .map((r) => Number(String(r.fecha).slice(0, 4)))
      .reduce((max, y) => Math.max(max, y), 0);
    return last === 0 || currentYear() - last >= state.periodicidad;
  }

  function sortRegistros(rows) {
    const key = (r) => r.fecha || `${r.anio ?? 1900}-12-31`;
    return [...rows].sort((a, b) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : b.id - a.id));
  }

  // ------------------------------------------------------------------ carga

  async function loadPerson(personalId) {
    const supabase = await getClient();
    const [personal, historial, registros] = await Promise.all([
      supabase.from("personal").select("id, personal").eq("id", personalId).maybeSingle(),
      supabase
        .from("historiales_laborales")
        .select("puesto_id, fecha_alta, fecha_baja")
        .eq("personal_id", personalId),
      supabase
        .from("personal_reconocimiento_medico")
        .select("id, anio, autoriza, resultado, fecha, observacion")
        .eq("personal_id", personalId),
    ]);
    const failed = [personal, historial, registros].find((r) => r.error);
    if (failed) throw failed.error;

    const puestoIds = [...new Set((historial.data || []).map((h) => h.puesto_id).filter(Boolean))];
    let puestos = [];
    if (puestoIds.length) {
      const result = await supabase.from("puestos").select("id, puesto, rec_medico").in("id", puestoIds);
      if (result.error) throw result.error;
      puestos = result.data || [];
    }

    // Periodos vigentes hoy; si no hay ninguno (persona de baja), el último.
    const today = new Date().toISOString().slice(0, 10);
    const periods = (historial.data || []).filter((h) => h.puesto_id);
    let chosen = periods.filter((h) => h.fecha_alta <= today && (!h.fecha_baja || h.fecha_baja >= today));
    if (!chosen.length && periods.length) {
      chosen = [[...periods].sort((a, b) => (a.fecha_alta < b.fecha_alta ? 1 : -1))[0]];
    }
    const chosenPuestos = chosen.map((h) => puestos.find((p) => p.id === h.puesto_id)).filter(Boolean);
    const withRec = chosenPuestos.filter((p) => p.rec_medico > 0).sort((a, b) => a.rec_medico - b.rec_medico);

    state.persona = personal.data;
    state.periodicidad = withRec.length ? withRec[0].rec_medico : null;
    state.puesto = (withRec[0] || chosenPuestos[0])?.puesto || null;
    state.registros = sortRegistros(registros.data || []);
  }

  // ------------------------------------------------------------------ pintado

  function authorizeBadge(value) {
    if (value === true) return '<span class="status-pill">Autoriza</span>';
    if (value === false) return '<span class="status-pill">No autoriza</span>';
    return '<span class="status-pill">Sin respuesta</span>';
  }

  function latestOfYear(registros, year) {
    return registros.filter((r) => r.anio === year).sort((a, b) => b.id - a.id)[0] || null;
  }

  function thisYearText() {
    const row = latestOfYear(state.registros, currentYear());
    if (row) {
      if (row.autoriza === true) return row.fecha ? `Autoriza · ${formatDate(row.fecha)}` : "Autoriza";
      if (row.autoriza === false) return "No autoriza";
      return "Sin respuesta";
    }
    if (!state.periodicidad) return "—";
    return dueThisYear() ? "Toca ofrecerlo" : "No toca";
  }

  function render() {
    const hasPerson = Boolean(state.persona);
    el.empty.classList.toggle("hidden", hasPerson);
    el.content.classList.toggle("hidden", !hasPerson);
    el.title.textContent = hasPerson ? state.persona.personal || `Persona ${state.persona.id}` : "Reconocimientos médicos";
    if (!hasPerson) return;

    el.summary.innerHTML = `
      <article class="summary-chip"><span class="summary-label">Puesto</span><strong>${escapeHtml(state.puesto || "—")}</strong></article>
      <article class="summary-chip"><span class="summary-label">Periodicidad</span><strong>${escapeHtml(periodicityText(state.periodicidad))}</strong></article>
      <article class="summary-chip"><span class="summary-label">Este año (${currentYear()})</span><strong>${escapeHtml(thisYearText())}</strong></article>`;

    el.count.textContent = String(state.registros.length);
    if (!state.registros.length) {
      el.body.innerHTML = '<tr><td colspan="6" class="empty-state">Sin reconocimientos registrados.</td></tr>';
    } else {
      el.body.innerHTML = state.registros
        .map(
          (r) => `<tr>
            <td>${escapeHtml(r.anio ?? (r.fecha ? String(r.fecha).slice(0, 4) : "Sin año"))}</td>
            <td>${authorizeBadge(r.autoriza)}</td>
            <td>${escapeHtml(formatDate(r.fecha))}</td>
            <td>${escapeHtml(r.resultado || "—")}</td>
            <td>${escapeHtml(r.observacion || "")}</td>
            <td>${
              state.confirmDeleteId === r.id
                ? `<button type="button" class="danger-button" data-rec-delete-confirm="${r.id}">Confirmar</button>
                   <button type="button" class="secondary-button" data-rec-delete-cancel>Cancelar</button>`
                : `<button type="button" class="secondary-button" data-rec-edit="${r.id}">Editar</button>
                   <button type="button" class="secondary-button" data-rec-delete="${r.id}">Eliminar</button>`
            }</td>
          </tr>`,
        )
        .join("");
    }
    renderForm();
  }

  function setAuthorize(value) {
    state.autoriza = value;
    el.autorizaButtons.forEach((button) => {
      const active = button.dataset.recAutoriza === String(value);
      button.classList.toggle("secondary-button", !active);
      button.setAttribute("aria-pressed", String(active));
    });
    el.detailFields.classList.toggle("hidden", value !== true);
    if (value !== true) {
      el.fecha.value = "";
      el.resultado.value = "";
    }
  }

  function renderForm() {
    el.formTitle.textContent = state.editingId ? "Editar reconocimiento" : `Registrar reconocimiento ${el.anio.value || currentYear()}`;
    el.cancelEdit.classList.toggle("hidden", !state.editingId);
    el.save.textContent = state.editingId ? "Guardar cambios" : "Guardar";
  }

  function resetForm() {
    state.editingId = null;
    el.anio.value = String(currentYear());
    el.fecha.value = "";
    el.resultado.value = "";
    el.observacion.value = "";
    setAuthorize(null);
    renderForm();
  }

  function fillForm(row) {
    state.editingId = row.id;
    el.anio.value = String(row.anio ?? (row.fecha ? String(row.fecha).slice(0, 4) : currentYear()));
    el.fecha.value = row.fecha || "";
    el.resultado.value = row.resultado || "";
    el.observacion.value = row.observacion || "";
    setAuthorize(row.autoriza);
    renderForm();
  }

  // ------------------------------------------------------------------ acciones

  async function open(personalId) {
    state.personalId = personalId ? Number(personalId) : null;
    state.persona = null;
    state.registros = [];
    el.panel.classList.remove("hidden");
    setStatus("");
    if (!state.personalId) {
      render();
      return;
    }
    setStatus("Cargando…");
    resetForm();
    try {
      await loadPerson(state.personalId);
      setStatus("");
    } catch (error) {
      setStatus(`No se pudieron cargar los reconocimientos: ${error.message}`, "error");
    }
    render();
  }

  function close() {
    el.panel.classList.add("hidden");
  }

  async function save(event) {
    event.preventDefault();
    if (!state.personalId) return;
    const anio = Number(el.anio.value);
    if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
      setStatus("El año no es válido.", "error");
      return;
    }
    if (state.autoriza == null) {
      setStatus("Indica si autoriza o no el reconocimiento.", "error");
      return;
    }
    if (state.autoriza && !el.fecha.value) {
      setStatus("Si autoriza el reconocimiento, indica la fecha.", "error");
      return;
    }
    const payload = {
      personal_id: state.personalId,
      anio,
      autoriza: state.autoriza,
      resultado: state.autoriza ? el.resultado.value || null : null,
      fecha: state.autoriza ? el.fecha.value || null : null,
      observacion: el.observacion.value.trim() || null,
    };
    setStatus("Guardando…");
    const supabase = await getClient();
    const result = state.editingId
      ? await supabase.from("personal_reconocimiento_medico").update(payload).eq("id", state.editingId)
      : await supabase.from("personal_reconocimiento_medico").insert(payload);
    if (result.error) {
      setStatus(`No se pudo guardar: ${result.error.message}`, "error");
      return;
    }
    resetForm();
    await loadPerson(state.personalId);
    setStatus("Reconocimiento guardado.", "success");
    render();
  }

  async function remove(id) {
    const supabase = await getClient();
    const { data, error } = await supabase.from("personal_reconocimiento_medico").delete().eq("id", id).select("id");
    state.confirmDeleteId = null;
    if (error) {
      setStatus(`No se pudo eliminar: ${error.message}`, "error");
      render();
      return;
    }
    if (!data || !data.length) {
      setStatus("No se eliminó nada: no tienes permiso sobre esta persona o el registro ya no existe.", "error");
      render();
      return;
    }
    if (state.editingId === id) resetForm();
    await loadPerson(state.personalId);
    setStatus("Reconocimiento eliminado.", "success");
    render();
  }


  // ------------------------------------------------------------------ listado de autorizaciones

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

  function todayIso() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  }

  // Quién debe recibir el documento de autorización del año `year`:
  //  · solo personal que pertenece a la empresa (vinculación Activo o No activo) con un puesto
  //    que ofrece reconocimiento (puestos.rec_medico = cada cuántos años);
  //  · anual → siempre; si rechazó el año anterior → siempre; ingreso este año → siempre;
  //  · nunca lo ha realizado → se ofrece;
  //  · si no, le toca cuando han pasado rec_medico años desde el último que realizó
  //    (autorizado y con fecha). Con varios registros en un año manda el último.
  function computeListado(year, data) {
    const today = todayIso();
    const puestoById = new Map(data.puestos.map((p) => [p.id, p]));
    const periodsByPerson = new Map();
    data.historiales.forEach((h) => {
      if (!h.puesto_id) return;
      if (!periodsByPerson.has(h.personal_id)) periodsByPerson.set(h.personal_id, []);
      periodsByPerson.get(h.personal_id).push(h);
    });
    const recsByPerson = new Map();
    data.registros.forEach((r) => {
      if (!recsByPerson.has(r.personal_id)) recsByPerson.set(r.personal_id, []);
      recsByPerson.get(r.personal_id).push(r);
    });

    const rows = [];
    data.personal.forEach((person) => {
      if (!PERTENECE_IDS.includes(Number(person.vinculacion_id)) || person.persona === false) return;
      const periods = periodsByPerson.get(person.id) || [];
      let chosen = periods.filter((h) => h.fecha_alta <= today && (!h.fecha_baja || h.fecha_baja >= today));
      if (!chosen.length && periods.length) {
        chosen = [[...periods].sort((a, b) => (a.fecha_alta < b.fecha_alta ? 1 : -1))[0]];
      }
      const puestos = chosen.map((h) => puestoById.get(h.puesto_id)).filter(Boolean);
      const withRec = puestos.filter((p) => p.rec_medico > 0).sort((a, b) => a.rec_medico - b.rec_medico);
      const recs = recsByPerson.get(person.id) || [];
      const thisYear = latestOfYear(recs, year);
      const estado = thisYear ? (thisYear.autoriza === true ? "autoriza" : thisYear.autoriza === false ? "no" : "sin") : null;
      const base = {
        id: person.id,
        nombre: person.personal || `Persona ${person.id}`,
        dni: person.dni || "",
        email: person.email || "",
        registros: recs.filter((r) => r.anio === year).length,
        fecha: thisYear?.fecha || null,
      };
      if (!withRec.length) {
        rows.push({
          ...base,
          corresponde: false,
          puesto: puestos[0]?.puesto || "",
          cada: null,
          motivo: puestos.length ? "Su puesto no ofrece reconocimiento" : "Sin puesto en el historial laboral",
          estado,
        });
        return;
      }
      const every = withRec[0].rec_medico;
      const prevYear = latestOfYear(recs, year - 1);
      const doneBefore = recs
        .filter((r) => r.autoriza === true && r.fecha && r.anio < year)
        .reduce((max, r) => Math.max(max, r.anio), 0);
      const joinedThisYear = chosen.some((h) => String(h.fecha_alta).slice(0, 4) === String(year));

      let motivo = "";
      if (prevYear && prevYear.autoriza === false) motivo = "Rechazó el año anterior";
      else if (every === 1) motivo = "Anual";
      else if (joinedThisYear) motivo = "Ingreso este año";
      else if (!doneBefore) motivo = "Nunca lo ha realizado";
      else if (year - doneBefore >= every) motivo = `Le toca (cada ${every} años, último ${doneBefore})`;
      else if (thisYear) motivo = "Ya tiene registro este año";
      const corresponde = Boolean(motivo);
      if (!corresponde) motivo = `No le toca (cada ${every} años, último ${doneBefore})`;

      rows.push({
        ...base,
        corresponde,
        puesto: withRec[0].puesto,
        cada: every,
        motivo,
        estado: estado || (corresponde ? "sin" : null),
      });
    });
    return rows.sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  }

  async function loadListado(force = false) {
    if (state.listado.loading || (state.listado.loaded && !force)) {
      renderListado();
      return;
    }
    state.listado.loading = true;
    el.listadoStatus.textContent = "Cargando…";
    try {
      const supabase = await getClient();
      const [personal, historiales, puestos, registros] = await Promise.all([
        fetchAll(supabase, "personal", "id, personal, dni, email, vinculacion_id, persona", "id"),
        fetchAll(supabase, "historiales_laborales", "id, personal_id, puesto_id, fecha_alta, fecha_baja", "id"),
        fetchAll(supabase, "puestos", "id, puesto, rec_medico", "id"),
        fetchAll(supabase, "personal_reconocimiento_medico", "id, personal_id, anio, autoriza, fecha", "id"),
      ]);
      const failed = [personal, historiales, puestos, registros].find((r) => r.error);
      if (failed) throw failed.error;
      state.listado.data = {
        personal: personal.data,
        historiales: historiales.data,
        puestos: puestos.data,
        registros: registros.data,
      };
      state.listado.loaded = true;
      el.listadoStatus.textContent = "";
    } catch (error) {
      el.listadoStatus.textContent = `No se pudo cargar el listado: ${error.message}`;
    } finally {
      state.listado.loading = false;
    }
    renderListado();
  }

  const ESTADO_TEXTO = { sin: "Sin respuesta", autoriza: "Autoriza", no: "No autoriza" };

  function estadoTexto(row) {
    return row.estado ? ESTADO_TEXTO[row.estado] : "—";
  }

  // Fecha del reconocimiento: solo para quien autoriza; sin fecha todavía = pendiente.
  function fechaTexto(row) {
    if (row.estado !== "autoriza") return "—";
    return row.fecha ? formatDate(row.fecha) : "Pendiente";
  }

  function listadoVisible() {
    const text = state.listado.text.trim().toLowerCase();
    return state.listado.rows.filter((row) => {
      if (state.listado.filter === "nocorresponde") {
        if (row.corresponde) return false;
      } else {
        if (!row.corresponde) return false;
        if (state.listado.filter !== "todos" && row.estado !== state.listado.filter) return false;
      }
      if (!text) return true;
      return [row.nombre, row.dni, row.puesto, row.motivo].join(" ").toLowerCase().includes(text);
    });
  }

  function renderListado() {
    if (!state.listado.data) return;
    state.listado.rows = computeListado(state.listado.year, state.listado.data);
    const all = state.listado.rows.filter((r) => r.corresponde);
    const excluidos = state.listado.rows.length - all.length;
    const count = (key) => all.filter((r) => r.estado === key).length;
    el.listadoFilters.innerHTML = [
      ["todos", "Todos", all.length],
      ["sin", "Sin respuesta", count("sin")],
      ["autoriza", "Autorizan", count("autoriza")],
      ["no", "No autorizan", count("no")],
      ["nocorresponde", "No les corresponde", excluidos],
    ]
      .map(
        ([key, label, n]) =>
          `<button type="button" class="settings-subtab-button${state.listado.filter === key ? " active" : ""}" data-rec-filter="${key}" aria-pressed="${state.listado.filter === key}">${escapeHtml(label)} · ${n}</button>`,
      )
      .join("");
    const rows = listadoVisible();
    el.listadoSummary.textContent =
      state.listado.filter === "nocorresponde"
        ? `${rows.length} de ${excluidos} personas a las que no les corresponde · campaña ${state.listado.year}`
        : `${rows.length} de ${all.length} personas · campaña ${state.listado.year}`;
    if (!rows.length) {
      el.listadoBody.innerHTML = '<tr><td colspan="7" class="empty-state">Nadie en este grupo.</td></tr>';
      return;
    }
    el.listadoBody.innerHTML = rows
      .map(
        (r) => `<tr>
          <td>${escapeHtml(r.nombre)}</td>
          <td>${escapeHtml(r.dni)}</td>
          <td>${escapeHtml(r.puesto)}</td>
          <td>${escapeHtml(r.motivo)}</td>
          <td>${r.estado ? `<span class="status-pill">${ESTADO_TEXTO[r.estado]}</span>` : "—"}${r.registros > 1 ? ` <span class="muted-text">(${r.registros} registros)</span>` : ""}</td>
          <td>${fechaTexto(r) === "Pendiente" ? '<span class="muted-text">Pendiente</span>' : escapeHtml(fechaTexto(r))}</td>
          <td><button type="button" class="secondary-button" data-rec-open-person="${r.id}">Abrir</button></td>
        </tr>`,
      )
      .join("");
  }

  function downloadListadoCsv() {
    const rows = listadoVisible();
    const cell = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const lines = [["Persona", "DNI", "Correo", "Puesto", "Motivo", "Estado", "Fecha reconocimiento"].map(cell).join(";")].concat(
      rows.map((r) => [r.nombre, r.dni, r.email, r.puesto, r.motivo, estadoTexto(r), fechaTexto(r)].map(cell).join(";")),
    );
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `autorizaciones-reconocimiento-medico-${state.listado.year}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function openListado() {
    el.listadoPanel.classList.remove("hidden");
    void loadListado(true);
  }

  function closeListado() {
    el.listadoPanel.classList.add("hidden");
  }

  function bind() {
    el.closeButton.addEventListener("click", close);
    el.overlay.addEventListener("click", close);
    el.form.addEventListener("submit", (event) => void save(event));
    el.cancelEdit.addEventListener("click", resetForm);
    el.anio.addEventListener("input", renderForm);
    el.autorizaButtons.forEach((button) =>
      button.addEventListener("click", () => setAuthorize(button.dataset.recAutoriza === "true")),
    );
    el.body.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-rec-edit]");
      if (editButton) {
        const row = state.registros.find((r) => String(r.id) === editButton.dataset.recEdit);
        if (row) fillForm(row);
        return;
      }
      const deleteButton = event.target.closest("[data-rec-delete]");
      if (deleteButton) {
        state.confirmDeleteId = Number(deleteButton.dataset.recDelete);
        setStatus("");
        render();
        return;
      }
      const confirmButton = event.target.closest("[data-rec-delete-confirm]");
      if (confirmButton) {
        void remove(Number(confirmButton.dataset.recDeleteConfirm));
        return;
      }
      if (event.target.closest("[data-rec-delete-cancel]")) {
        state.confirmDeleteId = null;
        render();
      }
    });
    el.listadoButton.addEventListener("click", openListado);
    el.listadoCloseButton.addEventListener("click", closeListado);
    el.listadoOverlay.addEventListener("click", closeListado);
    el.listadoYear.addEventListener("change", () => {
      state.listado.year = Number(el.listadoYear.value);
      renderListado();
    });
    el.listadoText.addEventListener("input", () => {
      state.listado.text = el.listadoText.value;
      renderListado();
    });
    el.listadoFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-rec-filter]");
      if (!button) return;
      state.listado.filter = button.dataset.recFilter;
      renderListado();
    });
    el.listadoCsv.addEventListener("click", downloadListadoCsv);
    el.listadoBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-rec-open-person]");
      if (!button) return;
      closeListado();
      void open(Number(button.dataset.recOpenPerson));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!el.listadoPanel.classList.contains("hidden")) closeListado();
      else if (!el.panel.classList.contains("hidden")) close();
    });
    el.openButton?.addEventListener("click", () => void open(window.CoordinacionPersonalSeleccion?.getId?.()));
  }

  function init() {
    if (state.initialized) return;
    if (!q("#personal-reconocimientos-panel")) return;
    Object.assign(el, {
      openButton: q("#personal-reconocimientos-button"),
      panel: q("#personal-reconocimientos-panel"),
      overlay: q("#personal-reconocimientos-overlay"),
      closeButton: q("#personal-reconocimientos-close-button"),
      title: q("#personal-reconocimientos-title"),
      status: q("#personal-reconocimientos-status"),
      empty: q("#personal-reconocimientos-empty"),
      content: q("#personal-reconocimientos-content"),
      summary: q("#personal-reconocimientos-summary"),
      form: q("#personal-reconocimientos-form"),
      formTitle: q("#personal-reconocimientos-form-title"),
      anio: q("#personal-reconocimientos-anio"),
      autorizaButtons: Array.from(document.querySelectorAll("[data-rec-autoriza]")),
      detailFields: q("#personal-reconocimientos-detail-fields"),
      fecha: q("#personal-reconocimientos-fecha"),
      resultado: q("#personal-reconocimientos-resultado"),
      observacion: q("#personal-reconocimientos-observacion"),
      save: q("#personal-reconocimientos-save-button"),
      cancelEdit: q("#personal-reconocimientos-cancel-button"),
      count: q("#personal-reconocimientos-count"),
      body: q("#personal-reconocimientos-body"),
      listadoButton: q("#personal-reconocimientos-listado-button"),
      listadoPanel: q("#personal-reconocimientos-listado-panel"),
      listadoOverlay: q("#personal-reconocimientos-listado-overlay"),
      listadoCloseButton: q("#personal-reconocimientos-listado-close-button"),
      listadoYear: q("#personal-reconocimientos-listado-year"),
      listadoText: q("#personal-reconocimientos-listado-text"),
      listadoCsv: q("#personal-reconocimientos-listado-csv"),
      listadoStatus: q("#personal-reconocimientos-listado-status"),
      listadoFilters: q("#personal-reconocimientos-listado-filters"),
      listadoSummary: q("#personal-reconocimientos-listado-summary"),
      listadoBody: q("#personal-reconocimientos-listado-body"),
    });
    const thisYear = currentYear();
    el.listadoYear.innerHTML = [thisYear - 1, thisYear, thisYear + 1]
      .map((y) => `<option value="${y}"${y === thisYear ? " selected" : ""}>${y}</option>`)
      .join("");
    el.resultado.innerHTML =
      '<option value="">Pendiente</option>' +
      RESULTADOS.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("");
    state.initialized = true;
    bind();
    resetForm();
  }

  window.CoordinacionReconocimientos = { init, open };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
