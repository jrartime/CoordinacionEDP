/* Programación · asistente modal de carga de datos.
 *
 * Pasos: 1) arrastrar Word/CSV → 2) enlazar cada instalación del archivo con la tabla
 * `instalaciones` → 3) elegir personal (tabla `personal`) por instalación y día →
 * generar los registros de programacion_conserjes con personal_id / instalacion_id.
 *
 * Reutiliza de app.js (scripts clásicos, mismo ámbito global): getSupabaseClient,
 * ensurePrivateSession, getMammothClient, extractProgrammingRowsFromWordHtml,
 * normalizeProgrammingRows, isProgrammingCsvFile, normalizeProgrammingText,
 * getProgrammingTextDistance, normalizeImportedDate/Time,
 * insertProgrammingRowsWithDiagnostics, reloadProgramming, setStatus.
 * El alcance (qué personal e instalaciones ve cada perfil) lo da el RLS por contrato.
 */
(function () {
  const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const STEP_LABELS = ["Archivo", "Instalaciones", "Fechas", "Personal"];
  const GENERIC_WORDS = new Set(["polideportivo", "pabellon", "campo", "campos", "piscina", "piscinas", "instalacion", "instalaciones", "municipal", "municipales", "deportivo", "deportiva", "deportivos", "centro", "complejo", "gimnasio", "de", "del", "la", "las", "el", "los", "y", "en"]);

  const state = {
    step: 1,
    file: null,
    rows: [],
    sourceName: "",
    personal: [],
    instalaciones: [],
    instMap: {}, // nombre en el archivo -> instalacion_id | "skip" | ""
    assign: {}, // `${instId}|${fecha}` -> [personalId|""]
    skipDays: new Set(),
    dates: new Set(),
    busy: false,
  };

  let dialog = null;

  const esc = (value) => escapeHtml(String(value ?? ""));
  const norm = (value) => normalizeProgrammingText(value);

  function buildDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "programming-carga-dialog";
    dialog.className = "facturacion-dialog programming-carga-dialog";
    dialog.innerHTML = `
      <div class="facturacion-dialog-header">
        <h3>Cargar datos de programación</h3>
        <button type="button" data-pc-close aria-label="Cerrar">×</button>
      </div>
      <ol class="programming-carga-steps" id="pc-steps"></ol>
      <div id="pc-body" class="programming-carga-body"></div>
      <p id="pc-status" class="panel-status-message" role="status" aria-live="polite"></p>
      <div id="pc-combo-list" class="filter-suggestions pc-combo-list hidden" role="listbox"></div>
      <div class="detail-actions programming-carga-footer">
        <button type="button" class="secondary-button" data-pc-close data-icon="close" data-icon-mode="icon-text">Cancelar</button>
        <span class="programming-carga-spacer"></span>
        <button type="button" class="secondary-button" id="pc-back" data-icon="previous" data-icon-mode="icon-text">Atrás</button>
        <button type="button" id="pc-forward" data-icon="next" data-icon-mode="icon-text">Continuar</button>
        <button type="button" id="pc-generate" class="hidden" data-icon="calendar" data-icon-mode="icon-text">Generar registros</button>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelectorAll("[data-pc-close]").forEach((b) => b.addEventListener("click", close));
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    dialog.querySelector("#pc-back").addEventListener("click", () => goTo(state.step - 1));
    dialog.querySelector("#pc-forward").addEventListener("click", onNext);
    dialog.querySelector("#pc-generate").addEventListener("click", onNext);
    dialog.querySelector("#pc-body").addEventListener("input", onBodyInput);
    dialog.querySelector("#pc-body").addEventListener("click", onBodyClick);
    setupCombos(dialog.querySelector("#pc-body"));
    return dialog;
  }

  const $ = (selector) => dialog.querySelector(selector);

  function setMsg(message = "", tone = "default") {
    const el = $("#pc-status");
    el.textContent = message;
    el.dataset.tone = tone;
  }

  async function open() {
    buildDialog();
    Object.assign(state, {
      step: 1,
      file: null,
      rows: [],
      sourceName: "",
      instMap: {},
      assign: {},
      busy: false,
    });
    state.skipDays = new Set();
    state.dates = new Set();
    setMsg("");
    render();
    if (!dialog.open) dialog.showModal();
  }

  function close() {
    if (state.busy) return;
    if (state.rows.length && !window.confirm("Hay una carga en curso. ¿Descartarla?")) return;
    dialog?.close();
  }

  function goTo(step) {
    state.step = Math.max(1, Math.min(4, step));
    setMsg("");
    render();
  }

  /* ---------- datos de catálogo (acotados por contrato vía RLS) ---------- */

  async function loadCatalogs() {
    const supabase = await getSupabaseClient();
    const [pers, inst] = await Promise.all([
      supabase.from("personal").select("id, personal, dni, vinculacion_id").in("vinculacion_id", [1, 2]).order("personal", { ascending: true }).limit(5000),
      supabase.from("instalaciones").select("id, instalacion, activo").eq("activo", true).order("instalacion", { ascending: true }).limit(5000),
    ]);
    if (pers.error) throw new Error(`No se pudo cargar el personal: ${pers.error.message}`);
    if (inst.error) throw new Error(`No se pudieron cargar las instalaciones: ${inst.error.message}`);
    state.personal = (pers.data || []).filter((p) => p.personal);
    state.instalaciones = (inst.data || []).filter((i) => i.instalacion);
  }

  const tokens = (text) => norm(text).split(/[^a-z0-9]+/).filter((t) => t.length > 1);
  const distinctive = (text) => {
    const all = tokens(text);
    const rest = all.filter((t) => !GENERIC_WORDS.has(t));
    return rest.length ? rest : all;
  };

  function tokenScore(a, b) {
    if (a === b) return 1;
    const [short, long] = a.length <= b.length ? [a, b] : [b, a];
    if (short.length >= 4 && long.startsWith(short)) return 0.85;
    if (short.length >= 4 && long.includes(short)) return 0.7;
    if (short.length >= 5 && getProgrammingTextDistance(a, b) <= Math.floor(short.length / 4)) return 0.75;
    return 0;
  }

  // Puntua por las palabras distintivas (Colloto, Carisa, Manuel Novo...), no por las genericas.
  function installationScore(name, installation) {
    const source = distinctive(name);
    const target = distinctive(installation.instalacion);
    if (!source.length || !target.length) return 0;
    const best = (list, other) => list.reduce((sum, t) => sum + Math.max(0, ...other.map((o) => tokenScore(t, o))), 0) / list.length;
    const score = (best(source, target) + best(target, source)) / 2;
    const generic = tokens(name).filter((t) => GENERIC_WORDS.has(t) && t.length > 4);
    const sameKind = generic.some((g) => tokens(installation.instalacion).includes(g));
    return score + (sameKind ? 0.05 : 0);
  }

  function installationSuggestions(name) {
    return state.instalaciones
      .map((i) => ({ id: i.id, nombre: i.instalacion, score: installationScore(name, i) }))
      .filter((x) => x.score >= 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  function bestInstallationMatch(name) {
    const exact = state.instalaciones.find((i) => norm(i.instalacion) === norm(name));
    if (exact) return exact.id;
    const [first, second] = installationSuggestions(name);
    return first && first.score >= 0.8 && (!second || first.score - second.score >= 0.15) ? first.id : "";
  }

  function personalMatch(name) {
    const target = norm(name);
    return target ? state.personal.find((p) => norm(p.personal) === target)?.id ?? "" : "";
  }

  /* ---------- paso 1: archivo ---------- */

  async function parseFile() {
    const file = state.file;
    if (!file) throw new Error("Arrastra o selecciona un archivo Word o CSV.");
    const month = Number($("#pc-month")?.value);
    const year = Number($("#pc-year")?.value);
    let rows;
    if (isProgrammingCsvFile(file)) {
      rows = normalizeProgrammingRows(await file.text());
    } else {
      if (!Number.isInteger(year) || year < 2020 || year > 2100) throw new Error("Indica un año válido.");
      const mammoth = await getMammothClient();
      const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      rows = extractProgrammingRowsFromWordHtml(result.value, { month, year });
    }
    if (!rows.length) throw new Error("No se encontraron filas válidas en el archivo.");
    state.rows = rows.map((row) => ({ ...row, fechaIso: normalizeImportedDate(row.fecha) || "" }));
    state.sourceName = file.name;
  }

  function setFile(file) {
    if (!file) return;
    state.file = file;
    const zone = $(".programming-carga-dropzone");
    zone?.classList.add("has-file");
    const label = zone?.querySelector(".facturacion-dropzone-file");
    if (label) label.textContent = file.name;
  }

  function renderStep1() {
    const now = new Date();
    const body = $("#pc-body");
    body.innerHTML = `
      <div class="facturacion-dropzone programming-carga-dropzone ${state.file ? "has-file" : ""}" tabindex="0" role="button" aria-label="Adjuntar el archivo de programación">
        <strong>Word o CSV de programación</strong>
        <span class="facturacion-dropzone-file">${state.file ? esc(state.file.name) : "Arrastra aquí el archivo o haz clic"}</span>
        <input type="file" id="pc-file" class="hidden" accept=".docx,.csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv" />
      </div>
      <div class="form-grid compact-form-grid programming-carga-period">
        <label>Mes
          <select id="pc-month">${MONTHS.map((m, i) => `<option value="${i + 1}" ${i === now.getMonth() ? "selected" : ""}>${m}</option>`).join("")}</select>
        </label>
        <label>Año
          <input id="pc-year" type="number" min="2020" max="2100" value="${now.getFullYear()}" />
        </label>
      </div>
      <p class="inline-note">En Word se toma el nombre de la instalación del texto situado encima de cada tabla (mes y año se aplican a los días). En CSV se esperan las columnas PERSONAL, INSTALACIÓN, FECHA, INICI., FIN, HORA, DEPORTE y ACTIVIDAD.</p>`;
    const zone = body.querySelector(".programming-carga-dropzone");
    const input = body.querySelector("#pc-file");
    zone.addEventListener("click", () => input.click());
    zone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        input.click();
      }
    });
    input.addEventListener("change", () => {
      setFile(input.files?.[0]);
      input.value = "";
    });
    ["dragenter", "dragover"].forEach((name) =>
      zone.addEventListener(name, (event) => {
        event.preventDefault();
        zone.classList.add("is-dragover");
      })
    );
    ["dragleave", "drop"].forEach((name) =>
      zone.addEventListener(name, (event) => {
        event.preventDefault();
        zone.classList.remove("is-dragover");
      })
    );
    zone.addEventListener("drop", (event) => setFile(event.dataTransfer?.files?.[0]));
  }

  /* ---------- paso 2: instalaciones ---------- */

  function installationNames() {
    const counts = new Map();
    state.rows.forEach((row) => {
      const name = row.instalacion || "Sin instalación";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }

  function suggestionChips(name, value) {
    if (value !== "") return "";
    const list = installationSuggestions(name);
    if (!list.length) return "";
    return `<div class="programming-carga-suggest">¿Quizá?
      ${list.map((x) => `<button type="button" class="secondary-button" data-pc-suggest="${esc(name)}" data-id="${x.id}">${esc(x.nombre)}</button>`).join("")}</div>`;
  }

  function renderStep2() {
    const options = (selected) =>
      `<option value="">— Elige instalación —</option><option value="skip" ${selected === "skip" ? "selected" : ""}>Omitir (no cargar)</option>` +
      state.instalaciones.map((i) => `<option value="${i.id}" ${String(selected) === String(i.id) ? "selected" : ""}>${esc(i.instalacion)}</option>`).join("");
    const rows = installationNames()
      .map(([name, count]) => {
        const value = state.instMap[name] ?? "";
        return `<tr class="${value === "" ? "is-pending" : ""}">
          <td>${esc(name)}</td><td class="num">${count}</td>
          <td><select data-pc-inst="${esc(name)}">${options(value)}</select>${suggestionChips(name, value)}</td></tr>`;
      })
      .join("");
    $("#pc-body").innerHTML = `
      <p class="inline-note">Enlaza cada instalación del archivo con una instalación de tu catálogo. Se guardará el identificador, no el texto. Solo aparecen las instalaciones de tus contratos.</p>
      <div class="table-wrapper programming-carga-table">
        <table><thead><tr><th>En el archivo</th><th>Registros</th><th>Instalación</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
  }

  /* ---------- paso 3: fechas a importar ---------- */

  const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  function availableDates() {
    const map = new Map();
    state.rows.forEach((row) => {
      const inst = state.instMap[row.instalacion || "Sin instalación"];
      if (!row.fechaIso || !inst || inst === "skip") return;
      if (!map.has(row.fechaIso)) map.set(row.fechaIso, { count: 0, installations: new Set() });
      const entry = map.get(row.fechaIso);
      entry.count += 1;
      entry.installations.add(inst);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  const weekdayOf = (iso) => new Date(`${iso}T12:00:00`).getDay();
  const addDays = (iso, n) => new Date(new Date(`${iso}T12:00:00`).getTime() + n * 86400000).toISOString().slice(0, 10);

  function setDatesPreset(preset) {
    const dates = availableDates().map(([d]) => d);
    if (preset === "all") state.dates = new Set(dates);
    else if (preset === "none") state.dates = new Set();
    else if (preset === "weekend") {
      // Fin de semana siguiente: primer sabado/domingo desde hoy con datos y el dia contiguo.
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const first = dates.find((d) => d >= today && [0, 6].includes(weekdayOf(d)));
      const wanted = first ? (weekdayOf(first) === 6 ? [first, addDays(first, 1)] : [first]) : [];
      state.dates = new Set(dates.filter((d) => wanted.includes(d)));
    }
    renderStep3Dates();
  }

  function renderStep3Dates() {
    const list = availableDates();
    const rows = list
      .map(([fecha, info]) => {
        const day = weekdayOf(fecha);
        return `<tr class="${[0, 6].includes(day) ? "is-weekend" : ""}">
          <td><label><input type="checkbox" data-pc-date="${fecha}" ${state.dates.has(fecha) ? "checked" : ""} /> ${esc(formatDisplayDate(fecha))}</label></td>
          <td>${WEEKDAYS[day]}</td><td class="num">${info.installations.size}</td><td class="num">${info.count}</td></tr>`;
      })
      .join("");
    $("#pc-body").innerHTML = `
      <p class="inline-note">Elige qué fechas se importan; el archivo suele traer todo el mes y normalmente solo hace falta el próximo fin de semana.</p>
      <div class="programming-carga-presets">
        <button type="button" class="secondary-button" data-pc-dates="weekend">Próximo fin de semana</button>
        <button type="button" class="secondary-button" data-pc-dates="all">Todas</button>
        <button type="button" class="secondary-button" data-pc-dates="none">Ninguna</button>
        <strong id="pc-dates-count"></strong>
      </div>
      <div class="table-wrapper programming-carga-table programming-carga-dates-wrap">
        <table class="programming-carga-dates"><thead><tr><th>Fecha</th><th>Día</th><th>Instalaciones</th><th>Registros</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
    updateNextState();
  }

  /* ---------- paso 4: personal por instalación y día ---------- */

  function instName(id) {
    return state.instalaciones.find((i) => String(i.id) === String(id))?.instalacion || "";
  }

  function activeRows() {
    return state.rows
      .map((row) => ({ row, instId: state.instMap[row.instalacion || "Sin instalación"] }))
      .filter((x) => x.instId && x.instId !== "skip" && x.row.fechaIso && state.dates.has(x.row.fechaIso));
  }

  function dayGroups() {
    const groups = new Map(); // instId -> Map(fecha -> rows[])
    activeRows().forEach(({ row, instId }) => {
      if (!groups.has(instId)) groups.set(instId, new Map());
      const days = groups.get(instId);
      if (!days.has(row.fechaIso)) days.set(row.fechaIso, []);
      days.get(row.fechaIso).push(row);
    });
    return [...groups.entries()].sort((a, b) => instName(a[0]).localeCompare(instName(b[0]), "es"));
  }

  const dayKey = (instId, fecha) => `${instId}|${fecha}`;

  function prefillAssignments() {
    dayGroups().forEach(([instId, days]) => {
      days.forEach((rows, fecha) => {
        const key = dayKey(instId, fecha);
        if (state.assign[key]) return;
        const ids = [...new Set(rows.map((r) => personalMatch(r.personal)).filter(Boolean))];
        state.assign[key] = ids.length ? ids : [""];
      });
    });
  }

  const personName = (id) => state.personal.find((p) => String(p.id) === String(id))?.personal || "";

  // Campo de texto con lista filtrable (mismo comportamiento que el filtro de personal).
  const personCombo = (attrs, selectedId, disabled = false) => `<span class="filter-field-stack personal-picker-stack pc-combo">
    <input type="text" autocomplete="off" placeholder="Buscar o desplegar" ${attrs} value="${esc(personName(selectedId))}" ${disabled ? "disabled" : ""} />
    <button type="button" class="personal-picker-clear ${selectedId ? "" : "hidden"}" data-pc-combo-clear tabindex="-1" aria-label="Quitar persona" title="Limpiar">&times;</button>
    <button type="button" class="personal-picker-toggle" data-pc-combo-toggle tabindex="-1" aria-label="Desplegar lista de personal" title="Desplegar">&#9662;</button>
  </span>`;

  const toMinutes = (value) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(value ?? "").trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const fmtMinutes = (n) => `${String(Math.floor((n % 1440) / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

  // Horario del dia: los tramos que enlazan (hueco menor de 30 min) se unen en uno solo.
  // 09:00-11:45 · 11:45-13:45 · ... · 19:45-23:00 => 09:00-23:00.
  function timeSummary(rows) {
    const spans = [];
    const loose = [];
    rows.forEach((r) => {
      const start = toMinutes(r.inicio);
      if (start === null) return;
      let end = toMinutes(r.fin);
      if (end === null) loose.push(fmtMinutes(start));
      else {
        if (end < start) end += 1440;
        spans.push([start, end]);
      }
    });
    spans.sort((x, y) => x[0] - y[0]);
    const merged = [];
    spans.forEach(([start, end]) => {
      const last = merged[merged.length - 1];
      if (last && start - last[1] < 30) last[1] = Math.max(last[1], end);
      else merged.push([start, end]);
    });
    return merged.map(([start, end]) => `${fmtMinutes(start)}–${fmtMinutes(end)}`).concat(loose).join(" · ");
  }

  function renderStep4() {
    prefillAssignments();
    const groups = dayGroups();
    if (!groups.length) {
      $("#pc-body").innerHTML = `<p class="empty-state">No quedan registros por cargar: todas las instalaciones están omitidas o sin fecha válida.</p>`;
      return;
    }
    const html = groups
      .map(([instId, days]) => {
        const dayRows = [...days.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([fecha, rows]) => {
            const key = dayKey(instId, fecha);
            const skipped = state.skipDays.has(key);
            const slots = (state.assign[key] || [""])
              .map(
                (pid, index) => `<span class="programming-carga-slot">
                  ${personCombo(`data-pc-combo="slot" data-key="${esc(key)}" data-slot="${index}"`, pid, skipped)}
                  ${index > 0 ? `<button type="button" class="secondary-button" data-pc-remove-slot="${esc(key)}" data-slot="${index}" aria-label="Quitar persona">✕</button>` : ""}
                </span>`
              )
              .join("");
            const missing = !skipped && !(state.assign[key] || []).some(Boolean);
            return `<tr class="${missing ? "is-pending" : ""}">
              <td class="programming-carga-day">${esc(formatDisplayDate(fecha))}</td>
              <td class="programming-carga-times" title="${rows.length} registro(s)">${esc(timeSummary(rows))}</td>
              <td>${slots}<button type="button" class="secondary-button" data-pc-add-slot="${esc(key)}" ${skipped ? "disabled" : ""}>+ Persona</button></td>
              <td><label class="programming-carga-skip"><input type="checkbox" data-pc-skip="${esc(key)}" ${skipped ? "checked" : ""} /> Sin personal</label></td>
            </tr>`;
          })
          .join("");
        return `<section class="programming-carga-group">
          <header>
            <h4>${esc(instName(instId))}</h4>
            <label>Misma persona todos los días
              ${personCombo(`data-pc-combo="group" data-inst="${instId}"`, "")}
            </label>
          </header>
          <div class="table-wrapper programming-carga-table">
            <table><thead><tr><th>Día</th><th>Horario</th><th>Personal</th><th></th></tr></thead><tbody>${dayRows}</tbody></table>
          </div>
        </section>`;
      })
      .join("");
    $("#pc-body").innerHTML = `<p class="inline-note" id="pc-summary"></p>${html}`;
    updateSummary();
  }

  function pendingDays() {
    let pending = 0;
    let total = 0;
    dayGroups().forEach(([instId, days]) =>
      days.forEach((_rows, fecha) => {
        const key = dayKey(instId, fecha);
        total += 1;
        if (!state.skipDays.has(key) && !(state.assign[key] || []).some(Boolean)) pending += 1;
      })
    );
    return { pending, total };
  }

  function updateSummary() {
    const { pending, total } = pendingDays();
    const el = $("#pc-summary");
    if (el) el.textContent = pending ? `${pending} de ${total} días sin personal asignado.` : `Todos los días (${total}) tienen personal o están marcados sin personal.`;
    if (state.step === 4) $("#pc-generate").disabled = state.busy || pending > 0;
  }

  /* ---------- eventos del cuerpo ---------- */

  function onBodyInput(event) {
    const target = event.target;
    if (target.dataset.pcInst !== undefined) {
      state.instMap[target.dataset.pcInst] = target.value;
      target.closest("tr").classList.toggle("is-pending", target.value === "");
      updateNextState();
    } else if (target.dataset.pcDate !== undefined) {
      if (target.checked) state.dates.add(target.dataset.pcDate);
      else state.dates.delete(target.dataset.pcDate);
      updateNextState();
    } else if (target.dataset.pcSkip !== undefined) {
      const key = target.dataset.pcSkip;
      if (target.checked) state.skipDays.add(key);
      else state.skipDays.delete(key);
      renderStep4();
    }
  }

  /* ---------- combo de personal ---------- */

  let combo = null; // { input, options, index }

  function hideCombo() {
    $("#pc-combo-list").classList.add("hidden");
    combo = null;
  }

  function showCombo(input, filtered) {
    const q = filtered ? norm(input.value) : "";
    const options = state.personal.filter((p) => !q || norm(p.personal).includes(q)).slice(0, 80);
    const list = $("#pc-combo-list");
    if (!options.length) {
      list.innerHTML = '<p class="pc-combo-empty muted-text">Sin coincidencias</p>';
      combo = { input, options, index: -1 };
    } else {
      combo = { input, options, index: q ? 0 : -1 };
      list.innerHTML = options
        .map((p, i) => `<button type="button" class="filter-suggestion-option ${i === combo.index ? "is-active" : ""}" data-pc-option="${p.id}">${esc(p.personal)}</button>`)
        .join("");
    }
    const rect = input.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    list.style.left = `${rect.left}px`;
    list.style.width = `${Math.max(rect.width, 260)}px`;
    list.style.maxHeight = `${Math.max(140, Math.min(260, below > 160 ? below - 12 : rect.top - 12))}px`;
    if (below > 160) {
      list.style.top = `${rect.bottom + 2}px`;
      list.style.bottom = "auto";
    } else {
      list.style.bottom = `${window.innerHeight - rect.top + 2}px`;
      list.style.top = "auto";
    }
    list.classList.remove("hidden");
  }

  function highlightCombo(index) {
    if (!combo || !combo.options.length) return;
    combo.index = (index + combo.options.length) % combo.options.length;
    const buttons = [...$("#pc-combo-list").querySelectorAll(".filter-suggestion-option")];
    buttons.forEach((b, i) => b.classList.toggle("is-active", i === combo.index));
    buttons[combo.index]?.scrollIntoView({ block: "nearest" });
  }

  const comboCurrentId = (input) =>
    input.dataset.pcCombo === "slot" ? state.assign[input.dataset.key]?.[Number(input.dataset.slot)] ?? "" : "";

  function applyPerson(input, id) {
    if (input.dataset.pcCombo === "slot") {
      const key = input.dataset.key;
      state.assign[key][Number(input.dataset.slot)] = id ? String(id) : "";
      input.value = personName(id);
      input.nextElementSibling?.classList.toggle("hidden", !id);
      input.closest("tr").classList.toggle("is-pending", !state.assign[key].some(Boolean));
      updateSummary();
    } else if (id) {
      const instId = input.dataset.inst;
      dayGroups().forEach(([gid, days]) => {
        if (String(gid) !== String(instId)) return;
        days.forEach((_rows, fecha) => {
          const key = dayKey(gid, fecha);
          state.skipDays.delete(key);
          state.assign[key] = [String(id), ...(state.assign[key] || []).slice(1).filter(Boolean)];
        });
      });
      hideCombo();
      renderStep4();
    }
  }

  function setupCombos(body) {
    const isCombo = (el) => el instanceof HTMLInputElement && el.dataset.pcCombo;
    body.addEventListener("focusin", (event) => {
      if (!isCombo(event.target)) return;
      event.target.select();
      showCombo(event.target, false);
    });
    body.addEventListener("input", (event) => {
      if (!isCombo(event.target)) return;
      showCombo(event.target, true);
    });
    body.addEventListener("focusout", (event) => {
      const input = event.target;
      if (!isCombo(input)) return;
      hideCombo();
      // Sin elegir de la lista, el texto vuelve a la persona asignada (o queda vacío).
      input.value = personName(comboCurrentId(input));
    });
    body.addEventListener("keydown", (event) => {
      const input = event.target;
      if (!isCombo(input)) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!combo) showCombo(input, false);
        highlightCombo((combo?.index ?? -1) + (event.key === "ArrowDown" ? 1 : -1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const option = combo?.options[combo.index >= 0 ? combo.index : 0];
        if (option) applyPerson(input, option.id);
        if (input.isConnected) input.blur();
      } else if (event.key === "Escape" && combo) {
        event.preventDefault();
        event.stopPropagation();
        hideCombo();
      }
    });
    body.addEventListener("mousedown", (event) => {
      const clear = event.target.closest("[data-pc-combo-clear]");
      const toggle = event.target.closest("[data-pc-combo-toggle]");
      if (!clear && !toggle) return;
      event.preventDefault();
      const input = (clear || toggle).parentElement.querySelector("input");
      if (clear) {
        applyPerson(input, "");
        return;
      }
      if (combo && combo.input === input) hideCombo();
      else {
        input.focus();
        showCombo(input, false);
      }
    });
    // La lista es compartida y flota fuera del cuerpo: mousedown evita que el input pierda el foco.
    dialog.querySelector("#pc-combo-list").addEventListener("mousedown", (event) => {
      event.preventDefault();
      const option = event.target.closest("[data-pc-option]");
      if (!option || !combo) return;
      const input = combo.input;
      applyPerson(input, option.dataset.pcOption);
      hideCombo();
    });
    body.addEventListener("scroll", hideCombo, true);
  }

  function onBodyClick(event) {
    const suggest = event.target.closest("[data-pc-suggest]");
    if (suggest) {
      state.instMap[suggest.dataset.pcSuggest] = suggest.dataset.id;
      renderStep2();
      updateNextState();
      return;
    }
    const dateBtn = event.target.closest("[data-pc-dates]");
    if (dateBtn) {
      setDatesPreset(dateBtn.dataset.pcDates);
      return;
    }
    const add = event.target.closest("[data-pc-add-slot]");
    const remove = event.target.closest("[data-pc-remove-slot]");
    if (add) {
      state.assign[add.dataset.pcAddSlot].push("");
      renderStep4();
    } else if (remove) {
      state.assign[remove.dataset.pcRemoveSlot].splice(Number(remove.dataset.slot), 1);
      renderStep4();
    }
  }

  function updateNextState() {
    const next = $("#pc-forward");
    if (state.step === 2) {
      next.disabled = installationNames().some(([name]) => !(state.instMap[name] ?? ""));
    } else if (state.step === 3) {
      next.disabled = state.dates.size === 0;
      const counter = $("#pc-dates-count");
      if (counter) counter.textContent = `${state.dates.size} de ${availableDates().length} fechas`;
    }
  }

  /* ---------- navegación y generación ---------- */

  function render() {
    $("#pc-steps").innerHTML = STEP_LABELS.map(
      (label, i) => `<li class="${i + 1 === state.step ? "is-current" : i + 1 < state.step ? "is-done" : ""}"><span>${i + 1}</span> ${label}</li>`
    ).join("");
    $("#pc-back").classList.toggle("hidden", state.step === 1);
    $("#pc-forward").disabled = false;
    $("#pc-forward").classList.toggle("hidden", state.step === 4);
    $("#pc-generate").classList.toggle("hidden", state.step !== 4);
    if (state.step === 1) renderStep1();
    else if (state.step === 2) {
      renderStep2();
      updateNextState();
    } else if (state.step === 3) {
      renderStep3Dates();
    } else renderStep4();
    if (state.step === 4) updateSummary();
  }

  async function onNext() {
    if (state.busy) return;
    try {
      if (state.step === 1) {
        setBusy(true, "Leyendo el archivo...");
        const session = await ensurePrivateSession({ silent: true });
        if (!session) throw new Error("Necesitas iniciar sesión para cargar la programación.");
        await parseFile();
        await loadCatalogs();
        installationNames().forEach(([name]) => {
          if (state.instMap[name] === undefined) state.instMap[name] = bestInstallationMatch(name);
        });
        setBusy(false);
        goTo(2);
      } else if (state.step === 2) {
        goTo(3);
      } else if (state.step === 3) {
        goTo(4);
      } else {
        await generate();
      }
    } catch (error) {
      setBusy(false);
      setMsg(error.message, "error");
    }
  }

  function setBusy(busy, message = "") {
    state.busy = busy;
    $("#pc-forward").disabled = busy;
    $("#pc-generate").disabled = busy;
    $("#pc-back").disabled = busy;
    setMsg(message);
  }

  function buildRecords() {
    const records = [];
    activeRows().forEach(({ row, instId }) => {
      const key = dayKey(instId, row.fechaIso);
      if (state.skipDays.has(key)) return;
      const people = [...new Set((state.assign[key] || []).filter(Boolean))];
      people.forEach((pid) => {
        const person = state.personal.find((p) => String(p.id) === String(pid));
        records.push({
          personal_id: Number(pid),
          instalacion_id: Number(instId),
          personal: person?.personal || "",
          instalacion: instName(instId),
          fecha: row.fechaIso,
          hora_inicio: normalizeImportedTime(row.inicio),
          hora_fin: normalizeImportedTime(row.fin),
          hora_evento: normalizeImportedTime(row.hora),
          deporte: row.deporte || null,
          actividad: row.actividad || null,
          source_file: state.sourceName || "programacion.csv",
        });
      });
    });
    return records.map((record, index) => ({ ...record, sort_order: index + 1 }));
  }

  async function generate() {
    const records = buildRecords();
    if (!records.length) throw new Error("No hay registros que generar.");
    const invalid = records.find((r) => !r.fecha || !r.hora_inicio);
    if (invalid) throw new Error(`Hay un registro sin fecha u hora de inicio válidas (${invalid.instalacion}).`);
    if (!window.confirm(`Se generarán ${records.length} actividades programadas. ¿Continuar?`)) return;
    setBusy(true, "Generando registros...");
    const supabase = await getSupabaseClient();
    await insertProgrammingRowsWithDiagnostics(supabase, records);
    state.rows = [];
    setBusy(false);
    dialog.close();
    await reloadProgramming();
    setStatus(`Programación generada: ${records.length} registros con personal e instalación enlazados.`, "success");
  }

  window.CoordinacionProgramacionCarga = { open };
})();
