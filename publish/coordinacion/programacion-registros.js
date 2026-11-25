/* Programación · pasar a Registros.
 *
 * Modal con la programación filtrada convertida en jornadas: una fila por persona, día e
 * instalación con la hora de entrada y de salida del día, siguiendo el mismo criterio que el
 * Informe individual (los tramos que enlazan, con un hueco menor de 30 min, se unen en uno;
 * si queda más de un tramo, cada uno es una fila). Ej.: Alba Queipo, 07/11, Florida Arena,
 * 08:30–21:00.
 *
 * De cada fila se elige el contrato entre los posibles para esa persona e instalación
 * (contrato_personal ∩ contrato_instalaciones, vigentes ese día) y el puesto según el
 * contrato (los puestos de las actividades del contrato; se propone el de la actividad de
 * esa misma persona e instalación si la hay).
 *
 * Cada jornada marcada crea un registro con tipo de hora REG y situación NORM. La empresa sale
 * del historial laboral vigente ese día (sin ella el registro no entraría en la nómina: esas
 * jornadas se omiten avisando). Función y modalidad se toman de la actividad de esa persona en
 * esa instalación/contrato/puesto; si no la hay, de la función más usada con ese puesto en el
 * contrato, o de la única función activa del contrato.
 *
 * No duplica: una jornada que se solapa con un registro que la persona ya tiene ese día se
 * muestra como «Ya en Registros» y sale desmarcada.
 *
 * Reutiliza de app.js (scripts clásicos, mismo ámbito global): filteredProgrammingRows,
 * getSupabaseClient, normalizeImportedDate, formatDisplayDate, escapeHtml,
 * getControlWeekdayInfo, setStatus.
 */
(function () {
  const MERGE_GAP_MINUTES = 30;
  const TIPO_HORA_REG = 1;
  const SITUACION_NORM = 1;

  const state = {
    rows: [], // jornadas
    unlinked: 0, // filas de programación sin personal_id / instalacion_id
    contratos: new Map(), // id -> { id, contrato }
    personalContratos: [], // { personal_id, contrato_id, fecha_inicio, fecha_fin }
    instalacionContratos: [], // { instalacion_id, contrato_id, fecha_inicio, fecha_fin }
    puestos: new Map(), // id -> nombre
    contratoPuestos: new Map(), // contrato_id -> Set(puesto_id)
    actividades: [], // { id, contrato_id, personal_id, instalacion_id, puesto_id, funcion_id, modalidad_id, ... }
    contratoFunciones: [], // { contrato_id, funcion_id, modalidad_id }
    existentes: [], // registros ya creados de esas personas en el intervalo
    loading: false,
    busy: false,
  };

  let dialog = null;
  const esc = (value) => escapeHtml(String(value ?? ""));
  const $ = (selector) => dialog.querySelector(selector);

  /* ---------- horario del día (mismo criterio que el Informe individual) ---------- */

  const toMinutes = (value) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(value ?? "").trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const fmtMinutes = (n) => {
    const v = ((n % 1440) + 1440) % 1440;
    return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
  };

  function mergedSpans(rows) {
    const spans = [];
    rows.forEach((row) => {
      const start = toMinutes(row.inicio);
      if (start === null) return;
      let end = toMinutes(row.fin);
      if (end === null) end = start;
      else if (end < start) end += 1440;
      spans.push([start, end]);
    });
    spans.sort((a, b) => a[0] - b[0]);
    const merged = [];
    spans.forEach(([start, end]) => {
      const last = merged[merged.length - 1];
      if (last && start - last[1] < MERGE_GAP_MINUTES) last[1] = Math.max(last[1], end);
      else merged.push([start, end]);
    });
    return merged;
  }

  function hoursBetween(entrada, salida) {
    const start = toMinutes(entrada);
    let end = toMinutes(salida);
    if (start === null || end === null) return null;
    if (end < start) end += 1440;
    return Math.round(((end - start) / 60) * 100) / 100;
  }

  const fmtHours = (h) => (h == null ? "–" : `${String(h).replace(".", ",")} h`);

  /* ---------- jornadas a partir de la programación filtrada ---------- */

  function buildJornadas() {
    const source = typeof filteredProgrammingRows !== "undefined" ? filteredProgrammingRows : [];
    const groups = new Map();
    let unlinked = 0;
    source.forEach((row) => {
      if (!row.personalId || !row.instalacionId) {
        unlinked += 1;
        return;
      }
      const fecha = normalizeImportedDate(row.fecha) || "";
      if (!fecha) return;
      const key = `${row.personalId}|${fecha}|${row.instalacionId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          personalId: Number(row.personalId),
          persona: row.personal || "",
          instalacionId: Number(row.instalacionId),
          instalacion: row.instalacion || "",
          fecha,
          rows: [],
        });
      }
      groups.get(key).rows.push(row);
    });

    const jornadas = [];
    groups.forEach((group) => {
      mergedSpans(group.rows).forEach(([start, end], index) => {
        jornadas.push({
          key: `${group.personalId}|${group.fecha}|${group.instalacionId}|${index}`,
          personalId: group.personalId,
          persona: group.persona,
          instalacionId: group.instalacionId,
          instalacion: group.instalacion,
          fecha: group.fecha,
          entrada: fmtMinutes(start),
          salida: fmtMinutes(end),
          turnos: group.rows.length,
          selected: true,
          contratoId: "",
          puestoId: "",
        });
      });
    });
    jornadas.sort(
      (a, b) =>
        a.fecha.localeCompare(b.fecha) ||
        a.persona.localeCompare(b.persona, "es") ||
        a.instalacion.localeCompare(b.instalacion, "es") ||
        a.entrada.localeCompare(b.entrada)
    );
    return { jornadas, unlinked };
  }

  /* ---------- catálogos: contratos posibles y puestos del contrato ---------- */

  const vigente = (link, fecha) =>
    (!link.fecha_inicio || link.fecha_inicio <= fecha) && (!link.fecha_fin || link.fecha_fin >= fecha);

  async function loadCatalogs() {
    const personalIds = [...new Set(state.rows.map((r) => r.personalId))];
    const instalacionIds = [...new Set(state.rows.map((r) => r.instalacionId))];
    if (!personalIds.length) return;
    const supabase = await getSupabaseClient();
    const [cp, ci] = await Promise.all([
      supabase
        .from("contrato_personal")
        .select("personal_id, contrato_id, fecha_inicio, fecha_fin")
        .in("personal_id", personalIds)
        .is("removed_at", null),
      supabase
        .from("contrato_instalaciones")
        .select("instalacion_id, contrato_id, fecha_inicio, fecha_fin")
        .in("instalacion_id", instalacionIds)
        .is("removed_at", null),
    ]);
    if (cp.error) throw new Error(`No se pudo cargar el personal de los contratos: ${cp.error.message}`);
    if (ci.error) throw new Error(`No se pudieron cargar las instalaciones de los contratos: ${ci.error.message}`);
    state.personalContratos = cp.data || [];
    state.instalacionContratos = ci.data || [];

    const contratoIds = [
      ...new Set(state.personalContratos.map((x) => x.contrato_id)),
    ].filter((id) => state.instalacionContratos.some((x) => x.contrato_id === id));

    state.existentes = await loadExistentes(supabase, personalIds);

    state.contratos = new Map();
    state.contratoPuestos = new Map();
    state.actividades = [];
    state.contratoFunciones = [];
    if (!contratoIds.length) return;

    const [contratos, actividades, puestos, funciones] = await Promise.all([
      supabase.from("contratos").select("id, contrato, activo").in("id", contratoIds),
      supabase
        .from("actividades")
        .select("id, contrato_id, personal_id, instalacion_id, puesto_id, funcion_id, modalidad_id, fecha_inicio, fecha_fin, activo")
        .in("contrato_id", contratoIds)
        .not("puesto_id", "is", null)
        .limit(10000),
      supabase.from("puestos").select("id, puesto").order("puesto", { ascending: true }).limit(500),
      supabase
        .from("contratos_funciones")
        .select("contrato_id, funcion_id, modalidad_id, activo")
        .in("contrato_id", contratoIds),
    ]);
    if (contratos.error) throw new Error(`No se pudieron cargar los contratos: ${contratos.error.message}`);
    if (actividades.error) throw new Error(`No se pudieron cargar las actividades: ${actividades.error.message}`);
    if (puestos.error) throw new Error(`No se pudieron cargar los puestos: ${puestos.error.message}`);
    if (funciones.error) throw new Error(`No se pudieron cargar las funciones del contrato: ${funciones.error.message}`);
    state.contratoFunciones = (funciones.data || []).filter((f) => f.activo !== false && f.funcion_id);

    (contratos.data || [])
      .filter((c) => c.activo !== false)
      .forEach((c) => state.contratos.set(c.id, { id: c.id, contrato: c.contrato || `Contrato ${c.id}` }));
    state.puestos = new Map((puestos.data || []).map((p) => [p.id, p.puesto || `Puesto ${p.id}`]));
    state.actividades = actividades.data || [];
    state.actividades.forEach((a) => {
      if (!state.contratoPuestos.has(a.contrato_id)) state.contratoPuestos.set(a.contrato_id, new Set());
      state.contratoPuestos.get(a.contrato_id).add(a.puesto_id);
    });
  }

  function contratosPosibles(row) {
    const dePersona = new Set(
      state.personalContratos
        .filter((x) => x.personal_id === row.personalId && vigente(x, row.fecha))
        .map((x) => x.contrato_id)
    );
    return state.instalacionContratos
      .filter((x) => x.instalacion_id === row.instalacionId && vigente(x, row.fecha) && dePersona.has(x.contrato_id))
      .map((x) => state.contratos.get(x.contrato_id))
      .filter(Boolean)
      .filter((c, i, list) => list.findIndex((o) => o.id === c.id) === i)
      .sort((a, b) => a.contrato.localeCompare(b.contrato, "es"));
  }

  // Sin actividades en el contrato no hay de dónde acotar: se ofrecen todos los puestos.
  function puestosPosibles(contratoId) {
    const ids = state.contratoPuestos.get(Number(contratoId));
    const list = ids?.size ? [...ids] : [...state.puestos.keys()];
    return list
      .map((id) => ({ id, puesto: state.puestos.get(id) || `Puesto ${id}` }))
      .sort((a, b) => a.puesto.localeCompare(b.puesto, "es"));
  }

  // Puesto propuesto: el de la actividad de esa persona en esa instalación y contrato;
  // si no, el de esa persona en el contrato; si el contrato solo tiene uno, ese.
  function puestoPropuesto(row) {
    const contratoId = Number(row.contratoId);
    const delContrato = state.actividades.filter((a) => a.contrato_id === contratoId);
    const exacta = delContrato.find(
      (a) => a.personal_id === row.personalId && a.instalacion_id === row.instalacionId
    );
    if (exacta) return String(exacta.puesto_id);
    const persona = delContrato.find((a) => a.personal_id === row.personalId);
    if (persona) return String(persona.puesto_id);
    const posibles = puestosPosibles(contratoId);
    return posibles.length === 1 ? String(posibles[0].id) : "";
  }

  /* ---------- registros ya existentes (para no duplicar) ---------- */

  async function loadExistentes(supabase, personalIds) {
    const fechas = state.rows.map((r) => r.fecha).sort();
    const rows = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("registros")
        .select("id, personal_id, fecha, hora_inicio, hora_fin, instalacion_id")
        .in("personal_id", personalIds)
        .gte("fecha", fechas[0])
        .lte("fecha", fechas[fechas.length - 1])
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`No se pudieron comprobar los registros existentes: ${error.message}`);
      rows.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    return rows;
  }

  function spanOf(inicio, fin) {
    const start = toMinutes(inicio);
    if (start === null) return null;
    let end = toMinutes(fin);
    if (end === null) end = start;
    else if (end < start) end += 1440;
    return [start, end];
  }

  // Registro de la persona ese día cuyo horario se pisa con la jornada (los bordes que se
  // tocan no cuentan). Sin horario en el registro existente se toma como coincidente.
  function existenteDe(row) {
    const span = spanOf(row.entrada, row.salida);
    return state.existentes.find((r) => {
      if (Number(r.personal_id) !== row.personalId || r.fecha !== row.fecha) return false;
      const other = spanOf(r.hora_inicio, r.hora_fin);
      if (!span || !other) return true;
      return span[0] < other[1] && other[0] < span[1];
    });
  }

  /* ---------- función y modalidad ---------- */

  const actividadVigente = (a, fecha) =>
    a.activo !== false && (!a.fecha_inicio || a.fecha_inicio <= fecha) && (!a.fecha_fin || a.fecha_fin >= fecha);

  function resolverFuncion(row) {
    const contratoId = Number(row.contratoId);
    const puestoId = Number(row.puestoId);
    const delContrato = state.actividades.filter((a) => a.contrato_id === contratoId && a.funcion_id);
    const exacta =
      delContrato.find(
        (a) =>
          a.personal_id === row.personalId &&
          a.instalacion_id === row.instalacionId &&
          a.puesto_id === puestoId &&
          actividadVigente(a, row.fecha)
      ) ||
      delContrato.find(
        (a) => a.personal_id === row.personalId && a.instalacion_id === row.instalacionId && a.puesto_id === puestoId
      );
    if (exacta) {
      return { funcionId: exacta.funcion_id, modalidadId: exacta.modalidad_id ?? null, actividadId: actividadVigente(exacta, row.fecha) ? exacta.id : null };
    }
    const conteo = new Map();
    delContrato
      .filter((a) => a.puesto_id === puestoId)
      .forEach((a) => {
        const key = `${a.funcion_id}|${a.modalidad_id ?? ""}`;
        conteo.set(key, (conteo.get(key) || 0) + 1);
      });
    const masUsada = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0];
    if (masUsada) {
      const [funcionId, modalidadId] = masUsada[0].split("|");
      return { funcionId: Number(funcionId), modalidadId: modalidadId ? Number(modalidadId) : null, actividadId: null };
    }
    const funciones = state.contratoFunciones.filter((f) => f.contrato_id === contratoId);
    if (funciones.length === 1) {
      return { funcionId: funciones[0].funcion_id, modalidadId: funciones[0].modalidad_id ?? null, actividadId: null };
    }
    return { funcionId: null, modalidadId: null, actividadId: null };
  }

  function prefill() {
    state.rows.forEach((row) => {
      row.existente = existenteDe(row) || null;
      if (row.existente) row.selected = false;
      const contratos = contratosPosibles(row);
      if (!row.contratoId && contratos.length === 1) row.contratoId = String(contratos[0].id);
      if (row.contratoId && !row.puestoId) row.puestoId = puestoPropuesto(row);
    });
  }

  /* ---------- interfaz ---------- */

  function buildDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "programming-registros-dialog";
    dialog.className = "facturacion-dialog programming-carga-dialog programming-registros-dialog";
    dialog.innerHTML = `
      <div class="facturacion-dialog-header">
        <h3>Pasar programación a Registros</h3>
        <button type="button" data-pr-close aria-label="Cerrar">×</button>
      </div>
      <p class="inline-note" id="pr-intro"></p>
      <div class="programming-registros-bulk" id="pr-bulk"></div>
      <div id="pr-body" class="programming-carga-body"></div>
      <p id="pr-status" class="panel-status-message" role="status" aria-live="polite"></p>
      <div class="detail-actions programming-carga-footer">
        <button type="button" class="secondary-button" data-pr-close data-icon="close" data-icon-mode="icon-text">Cerrar</button>
        <span class="programming-carga-spacer"></span>
        <strong id="pr-count" class="programming-registros-count"></strong>
        <button type="button" id="pr-generate" data-icon="calendar" data-icon-mode="icon-text" disabled
          title="Crea un registro REG / NORM por cada jornada marcada">Pasar a Registros</button>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelectorAll("[data-pr-close]").forEach((b) => b.addEventListener("click", close));
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    $("#pr-body").addEventListener("change", onBodyChange);
    $("#pr-body").addEventListener("click", onSuggestClick);
    $("#pr-generate").addEventListener("click", () => void generate());
    $("#pr-bulk").addEventListener("change", onBulkChange);
    return dialog;
  }

  function setMsg(message = "", tone = "default") {
    const el = $("#pr-status");
    el.textContent = message;
    el.dataset.tone = tone;
  }

  async function open() {
    buildDialog();
    const { jornadas, unlinked } = buildJornadas();
    state.rows = jornadas;
    state.unlinked = unlinked;
    setMsg("");
    $("#pr-bulk").innerHTML = "";
    $("#pr-body").innerHTML = '<p class="empty-state">Cargando contratos y puestos...</p>';
    renderIntro();
    if (!dialog.open) dialog.showModal();
    if (!jornadas.length) {
      $("#pr-body").innerHTML =
        '<p class="empty-state">No hay programación con personal e instalación enlazados en los filtros actuales.</p>';
      updateCount();
      return;
    }
    try {
      state.loading = true;
      await loadCatalogs();
      prefill();
      render();
    } catch (error) {
      $("#pr-body").innerHTML = "";
      setMsg(error.message, "error");
    } finally {
      state.loading = false;
      updateCount();
    }
  }

  function close() {
    dialog?.close();
  }

  function renderIntro() {
    const personas = new Set(state.rows.map((r) => r.personalId)).size;
    const aviso = state.unlinked
      ? ` · ${state.unlinked} ${state.unlinked === 1 ? "turno queda fuera" : "turnos quedan fuera"} por no tener personal o instalación enlazados.`
      : "";
    $("#pr-intro").textContent =
      `Programación filtrada: ${state.rows.length} ${state.rows.length === 1 ? "jornada" : "jornadas"} de ` +
      `${personas} ${personas === 1 ? "persona" : "personas"}. Entrada y salida diarias según el Informe individual ` +
      `(los tramos con menos de 30 min de hueco se unen).${aviso}`;
  }

  const contratoOptions = (row) => {
    const list = contratosPosibles(row);
    if (!list.length) return '<option value="">Sin contrato común</option>';
    return (
      `<option value="">— Elige contrato —</option>` +
      list.map((c) => `<option value="${c.id}" ${String(c.id) === row.contratoId ? "selected" : ""}>${esc(c.contrato)}</option>`).join("")
    );
  };

  const puestoOptions = (row) => {
    if (!row.contratoId) return '<option value="">— Elige antes el contrato —</option>';
    return (
      `<option value="">— Elige puesto —</option>` +
      puestosPosibles(row.contratoId)
        .map((p) => `<option value="${p.id}" ${String(p.id) === row.puestoId ? "selected" : ""}>${esc(p.puesto)}</option>`)
        .join("")
    );
  };

  // Opciones en pequeño bajo el desplegable sin elegir (mismo patrón que la carga de datos).
  const MAX_CHIPS = 6;
  function suggestionChips(field, options) {
    if (!options.length) return "";
    return `<div class="programming-carga-suggest">¿Quizá?
      ${options
        .slice(0, MAX_CHIPS)
        .map((o) => `<button type="button" class="secondary-button" data-pr-suggest="${field}" data-id="${o.id}">${esc(o.label)}</button>`)
        .join("")}</div>`;
  }

  const contratoChips = (row) =>
    row.contratoId ? "" : suggestionChips("contratoId", contratosPosibles(row).map((c) => ({ id: c.id, label: c.contrato })));

  // Primero los puestos que la persona ya tiene en sus actividades (de cualquier contrato).
  function puestoChips(row) {
    if (!row.contratoId || row.puestoId) return "";
    const suyos = new Set(state.actividades.filter((a) => a.personal_id === row.personalId).map((a) => a.puesto_id));
    const list = puestosPosibles(row.contratoId).sort((a, b) => Number(suyos.has(b.id)) - Number(suyos.has(a.id)));
    return suggestionChips("puestoId", list.map((p) => ({ id: p.id, label: p.puesto })));
  }

  function isPending(row) {
    return row.selected && (!row.contratoId || !row.puestoId);
  }

  function rowHtml(row) {
    const weekday = getControlWeekdayInfo(row.fecha);
    const sinContrato = !contratosPosibles(row).length;
    return `<tr data-key="${esc(row.key)}" class="${isPending(row) ? "is-pending" : ""} ${row.selected ? "" : "is-off"}">
      <td><input type="checkbox" data-pr-select ${row.selected ? "checked" : ""} aria-label="Incluir jornada" /></td>
      <td class="programming-carga-day">
        <span class="weekday-marker records-date-weekday" style="color: ${esc(weekday.color)};" title="${esc(weekday.label)}">${esc(weekday.letter)}</span>
        ${esc(formatDisplayDate(row.fecha))}
      </td>
      <td>${esc(row.persona)}${
        row.existente
          ? `<span class="programming-registros-badge" title="La persona ya tiene un registro ese día que se solapa con esta jornada">Ya en Registros${
              row.existente.hora_inicio ? ` · ${esc(String(row.existente.hora_inicio).slice(0, 5))}–${esc(String(row.existente.hora_fin || "").slice(0, 5))}` : ""
            }</span>`
          : ""
      }</td>
      <td>${esc(row.instalacion)}</td>
      <td><input type="time" data-pr-field="entrada" value="${esc(row.entrada)}" /></td>
      <td><input type="time" data-pr-field="salida" value="${esc(row.salida)}" /></td>
      <td class="num" data-pr-hours title="${row.turnos} turno(s) de programación">${esc(fmtHours(hoursBetween(row.entrada, row.salida)))}</td>
      <td><select data-pr-field="contratoId" ${sinContrato ? "disabled" : ""}
        title="${sinContrato ? "La persona y la instalación no comparten ningún contrato vigente ese día" : ""}">${contratoOptions(row)}</select>${contratoChips(row)}</td>
      <td><select data-pr-field="puestoId" ${row.contratoId ? "" : "disabled"}>${puestoOptions(row)}</select>${puestoChips(row)}</td>
    </tr>`;
  }

  function renderBulk() {
    // Contrato para todas: solo los que son posibles en alguna fila marcada.
    const ids = new Map();
    state.rows.forEach((row) => contratosPosibles(row).forEach((c) => ids.set(c.id, c)));
    const contratos = [...ids.values()].sort((a, b) => a.contrato.localeCompare(b.contrato, "es"));
    if (contratos.length < 2) {
      $("#pr-bulk").innerHTML = "";
      return;
    }
    $("#pr-bulk").innerHTML = `
      <label>Contrato para todas las que lo admitan
        <select data-pr-bulk="contratoId">
          <option value="">—</option>
          ${contratos.map((c) => `<option value="${c.id}">${esc(c.contrato)}</option>`).join("")}
        </select>
      </label>`;
  }

  function render() {
    renderBulk();
    const allSelected = state.rows.every((r) => r.selected);
    $("#pr-body").innerHTML = `
      <div class="table-wrapper programming-carga-table programming-registros-table">
        <table>
          <thead><tr>
            <th><input type="checkbox" data-pr-select-all ${allSelected ? "checked" : ""} aria-label="Marcar todas" /></th>
            <th>Día</th><th>Persona</th><th>Instalación</th><th>Entrada</th><th>Salida</th><th>Horas</th><th>Contrato</th><th>Puesto</th>
          </tr></thead>
          <tbody>${state.rows.map(rowHtml).join("")}</tbody>
        </table>
      </div>`;
    updateCount();
  }

  function updateCount() {
    const selected = state.rows.filter((r) => r.selected);
    const pending = selected.filter(isPending).length;
    const horas = selected.reduce((sum, r) => sum + (hoursBetween(r.entrada, r.salida) || 0), 0);
    $("#pr-count").textContent = selected.length
      ? `${selected.length} ${selected.length === 1 ? "jornada" : "jornadas"} · ${fmtHours(Math.round(horas * 100) / 100)}` +
        (pending ? ` · ${pending} sin contrato o puesto` : "")
      : "Ninguna jornada marcada";
    const yaHechas = selected.filter((r) => r.existente).length;
    if (yaHechas) $("#pr-count").textContent += ` · ${yaHechas} ya en Registros`;
    $("#pr-generate").disabled = state.busy || state.loading || !selected.length || pending > 0;
  }

  /* ---------- creación de los registros ---------- */

  async function generate() {
    if (state.busy) return;
    const selected = state.rows.filter((r) => r.selected);
    if (!selected.length || selected.some(isPending)) return;
    const invalid = selected.find((r) => !hoursBetween(r.entrada, r.salida));
    if (invalid) {
      setMsg(`La jornada de ${invalid.persona} del ${formatDisplayDate(invalid.fecha)} no tiene un horario válido.`, "error");
      return;
    }

    state.busy = true;
    updateCount();
    setMsg("Comprobando historial laboral...");
    try {
      const supabase = await getSupabaseClient();
      const personalIds = [...new Set(selected.map((r) => r.personalId))];
      const fechas = selected.map((r) => r.fecha).sort();
      const { data: historiales, error: historialesError } = await supabase
        .from("historiales_laborales")
        .select("personal_id, empresa_id, fecha_alta, fecha_baja")
        .in("personal_id", personalIds)
        .lte("fecha_alta", fechas[fechas.length - 1])
        .or(`fecha_baja.is.null,fecha_baja.gte.${fechas[0]}`);
      if (historialesError) throw historialesError;
      const empresaDe = (personalId, fecha) =>
        (historiales || []).find(
          (h) => Number(h.personal_id) === personalId && h.fecha_alta <= fecha && (!h.fecha_baja || h.fecha_baja >= fecha)
        )?.empresa_id ?? null;

      const filas = [];
      const sinHistorial = new Set();
      const sinFuncion = new Set();
      selected.forEach((row) => {
        const empresaId = empresaDe(row.personalId, row.fecha);
        if (empresaId == null) {
          sinHistorial.add(`${row.persona} (${formatDisplayDate(row.fecha)})`);
          return;
        }
        const { funcionId, modalidadId, actividadId } = resolverFuncion(row);
        if (!funcionId) sinFuncion.add(`${row.persona} (${formatDisplayDate(row.fecha)})`);
        filas.push({
          fecha: row.fecha,
          personal_id: row.personalId,
          contrato_id: Number(row.contratoId),
          empresa_id: empresaId,
          instalacion_id: row.instalacionId,
          puesto_id: Number(row.puestoId),
          funcion_id: funcionId,
          modalidad_id: modalidadId,
          actividad_id: actividadId,
          situacion_id: SITUACION_NORM,
          tipo_hora_id: TIPO_HORA_REG,
          hora_inicio: `${row.entrada}:00`,
          hora_fin: `${row.salida}:00`,
          horas: hoursBetween(row.entrada, row.salida),
          activo: true,
          facturar: true,
          abonar: true,
          descanso: false,
          sustitucion: false,
          anio: Number(row.fecha.slice(0, 4)),
          observacion: "Desde Programación",
        });
      });

      if (!filas.length) {
        throw new Error(
          `Ninguna jornada tiene historial laboral vigente ese día: ${[...sinHistorial].join(", ")}. Sin empresa, las horas no entrarían en la nómina.`
        );
      }
      const yaHechas = selected.filter((r) => r.existente).length;
      const avisos = [
        sinHistorial.size ? `Se quedan fuera ${sinHistorial.size} jornada(s) sin historial laboral: ${[...sinHistorial].join(", ")}.` : "",
        sinFuncion.size ? `Irán sin función (revísalas en Registros): ${[...sinFuncion].join(", ")}.` : "",
        yaHechas ? `${yaHechas} jornada(s) marcadas se solapan con registros que ya existen.` : "",
      ].filter(Boolean);
      const horas = filas.reduce((sum, f) => sum + f.horas, 0);
      if (
        !window.confirm(
          `Se van a crear ${filas.length} registro${filas.length === 1 ? "" : "s"} (REG, NORM) con ${fmtHours(Math.round(horas * 100) / 100)}.` +
            (avisos.length ? `\n\n${avisos.join("\n\n")}` : "") +
            "\n\n¿Continuar?"
        )
      ) {
        setMsg("");
        return;
      }

      setMsg("Creando registros...");
      const { error: insertError } = await supabase.from("registros").insert(filas);
      if (insertError) throw insertError;

      window.CoordinacionRegistros?.refresh?.();
      // Lo recién creado pasa a «Ya en Registros» y se desmarca.
      state.existentes = await loadExistentes(supabase, [...new Set(state.rows.map((r) => r.personalId))]);
      state.rows.forEach((row) => {
        row.existente = existenteDe(row) || null;
        if (row.existente) row.selected = false;
      });
      render();
      const mensaje = `Pasadas a Registros ${filas.length} jornada${filas.length === 1 ? "" : "s"}.${
        sinHistorial.size ? ` ${sinHistorial.size} sin historial quedaron fuera.` : ""
      }`;
      setMsg(mensaje, "success");
      setStatus(mensaje, "success");
    } catch (error) {
      setMsg(`No se pudieron crear los registros: ${error.message}`, "error");
    } finally {
      state.busy = false;
      updateCount();
    }
  }

  const findRow = (el) => state.rows.find((r) => r.key === el.closest("tr")?.dataset.key);

  function refreshRow(row) {
    const tr = $("#pr-body").querySelector(`tr[data-key="${CSS.escape(row.key)}"]`);
    if (tr) tr.outerHTML = rowHtml(row);
  }

  function onBodyChange(event) {
    const target = event.target;
    if (target.matches("[data-pr-select-all]")) {
      state.rows.forEach((r) => (r.selected = target.checked));
      render();
      return;
    }
    const row = findRow(target);
    if (!row) return;
    if (target.matches("[data-pr-select]")) {
      row.selected = target.checked;
    } else if (target.dataset.prField === "contratoId") {
      row.contratoId = target.value;
      row.puestoId = target.value ? puestoPropuesto(row) : "";
    } else if (target.dataset.prField) {
      row[target.dataset.prField] = target.value;
      if (target.dataset.prField === "entrada" || target.dataset.prField === "salida") {
        row.existente = existenteDe(row) || null;
      }
    }
    refreshRow(row);
    updateCount();
  }

  function onSuggestClick(event) {
    const chip = event.target.closest("[data-pr-suggest]");
    if (!chip) return;
    const row = findRow(chip);
    if (!row) return;
    if (chip.dataset.prSuggest === "contratoId") {
      row.contratoId = chip.dataset.id;
      row.puestoId = puestoPropuesto(row);
    } else {
      row.puestoId = chip.dataset.id;
    }
    refreshRow(row);
    updateCount();
  }

  function onBulkChange(event) {
    const target = event.target;
    if (target.dataset.prBulk !== "contratoId" || !target.value) return;
    let applied = 0;
    state.rows.forEach((row) => {
      if (!row.selected) return;
      if (!contratosPosibles(row).some((c) => String(c.id) === target.value)) return;
      if (row.contratoId !== target.value) {
        row.contratoId = target.value;
        row.puestoId = puestoPropuesto(row);
      }
      applied += 1;
    });
    target.value = "";
    render();
    setMsg(`Contrato aplicado a ${applied} ${applied === 1 ? "jornada" : "jornadas"}.`);
  }

  window.CoordinacionProgramacionRegistros = { open };
})();
