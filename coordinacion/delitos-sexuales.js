(function () {
  "use strict";

  // Certificado de delitos de naturaleza sexual del personal (botón de la pestaña Personal).
  // Clon de la pantalla del portal laboral («Personal EDP»). Los datos viven en
  // coordinacion.personal_delitos_sexuales (una fila por certificado presentado: persona + fecha de
  // entrega; vale un año desde esa fecha). La tabla no se consulta con la sesión del usuario: todo
  // pasa por las funciones public.delitos_sexuales_* (security definer), que sólo admiten a
  // administración (rol «admin» en el JWT). Por eso el botón sólo se muestra a ese rol.
  // Las reglas (60 días de aviso, fecha entre 2000 y hoy, una fila por persona y fecha) son las del portal.

  const DIAS_AVISO_CADUCIDAD = 60;
  // Personal que pertenece a la empresa: Activo (1) y No activo (2), como el filtro «Pertenece».
  // Los pendientes de desvincular (3), los «No pertenece» (4) y lo que no es una persona
  // (persona = false) no cuentan.
  const PERTENECE_IDS = [1, 2];
  const ROLES_ADMIN = ["admin", "administrador"];
  const TEXTO_ESTADO = { "no-tiene": "No tiene", caducado: "Caducado", proximo: "Próximo a caducar", vigente: "Vigente" };
  const URGENCIA = { "no-tiene": 0, caducado: 1, proximo: 2, vigente: 3 };
  const COLUMNAS_TABLA = ["Nombre", "DNI", "Email", "Móvil", "Estado del certificado"];

  const state = {
    initialized: false,
    personal: [],
    registros: [],
    cargado: false,
    cargando: false,
    filtro: "pendientes",
    texto: "",
    personaId: null,
    editando: null, // { id, fecha }
    confirmarBorradoId: null,
    listado: [],
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

  // ------------------------------------------------------------------ reglas (como src/lib/delitos-sexuales.ts)

  function hoyIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function fechaCorta(iso) {
    if (!iso) return "—";
    const [a, m, d] = String(iso).slice(0, 10).split("-");
    return a && m && d ? `${d}/${m}/${a}` : "—";
  }

  function errorFechaEntrega(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return "Indica la fecha de entrega del certificado.";
    if (iso < "2000-01-01" || iso > hoyIso()) return "La fecha de entrega no es válida (entre 2000 y hoy).";
    return null;
  }

  // Suma un año; el 29 de febrero pasa al 28.
  function sumarUnAnio(iso) {
    const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    const dia = m === 2 && d === 29 ? 28 : d;
    return `${a + 1}-${String(m).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }

  function diasEntre(desde, hasta) {
    const utc = (s) => {
      const [a, m, d] = s.split("-").map(Number);
      return Date.UTC(a, m - 1, d);
    };
    return Math.round((utc(hasta) - utc(desde)) / 86400000);
  }

  // Estado según el certificado más reciente con fecha.
  function estadoCertificado(registros) {
    const entrega = registros.reduce((max, r) => (r.fecha_entrega && (!max || r.fecha_entrega > max) ? r.fecha_entrega : max), null);
    if (!entrega) return { estado: "no-tiene", entrega: null, caducidad: null, dias: null };
    const caducidad = sumarUnAnio(entrega);
    const dias = diasEntre(hoyIso(), caducidad);
    const estado = dias < 0 ? "caducado" : dias <= DIAS_AVISO_CADUCIDAD ? "proximo" : "vigente";
    return { estado, entrega, caducidad, dias };
  }

  function textoEstado(c) {
    if (c.estado === "no-tiene") return TEXTO_ESTADO["no-tiene"];
    const base = TEXTO_ESTADO[c.estado];
    return c.estado === "vigente" ? `${base} hasta ${fechaCorta(c.caducidad)}` : `${base} (${fechaCorta(c.caducidad)})`;
  }

  function pill(c) {
    const tono = c.estado === "vigente" ? "" : c.estado === "proximo" ? " data-tone=\"warning\"" : " data-tone=\"error\"";
    return `<span class="status-pill"${tono}>${escapeHtml(TEXTO_ESTADO[c.estado])}</span>`;
  }

  // ------------------------------------------------------------------ acceso

  async function getClient() {
    if (!window.SupabaseApp?.getClient) throw new Error("El cliente de Supabase no está disponible.");
    return window.SupabaseApp.getClient();
  }

  function esAdmin(session) {
    const rol = String(session?.user?.app_metadata?.role || "").toLowerCase();
    return ROLES_ADMIN.includes(rol);
  }

  async function actualizarVisibilidad(session) {
    let s = session;
    if (s === undefined) {
      try {
        s = await window.SupabaseApp.ensureSession({ silent: true });
      } catch (_error) {
        s = null;
      }
    }
    const admin = esAdmin(s);
    el.openButton?.classList.toggle("hidden", !admin);
    if (!admin && el.panel) el.panel.classList.add("hidden");
  }

  // Las funciones están en el esquema public; el cliente de Coordinación apunta a coordinacion.
  async function rpc(nombre, args) {
    const supabase = await getClient();
    const result = args ? await supabase.schema("public").rpc(nombre, args) : await supabase.schema("public").rpc(nombre);
    if (result.error) throw result.error;
    return result.data;
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

  // ------------------------------------------------------------------ carga

  async function cargar(force = false) {
    if (state.cargando || (state.cargado && !force)) {
      render();
      return;
    }
    state.cargando = true;
    setStatus("Cargando…");
    try {
      const supabase = await getClient();
      const [personal, registros] = await Promise.all([
        fetchAll(supabase, "personal", "id, personal, dni, email, movil, vinculacion_id, persona", "id"),
        rpc("delitos_sexuales_listado"),
      ]);
      if (personal.error) throw personal.error;
      state.personal = personal.data || [];
      state.registros = Array.isArray(registros) ? registros : [];
      state.cargado = true;
      setStatus("");
    } catch (error) {
      setStatus(`No se pudo cargar: ${error.message}`, "error");
    } finally {
      state.cargando = false;
    }
    render();
  }

  function setStatus(message, tone = "") {
    if (!el.status) return;
    el.status.textContent = message || "";
    el.status.dataset.tone = tone;
  }

  function setFormStatus(message, tone = "") {
    el.formStatus.textContent = message || "";
    el.formStatus.dataset.tone = tone;
  }

  function registrosDe(personaId) {
    return state.registros.filter((r) => r.personal_id === personaId);
  }

  function calcularListado() {
    const porPersona = new Map();
    state.registros.forEach((r) => {
      if (!porPersona.has(r.personal_id)) porPersona.set(r.personal_id, []);
      porPersona.get(r.personal_id).push(r);
    });
    state.listado = state.personal
      .filter((p) => PERTENECE_IDS.includes(Number(p.vinculacion_id)) && p.persona !== false)
      .map((p) => ({
        id: p.id,
        nombre: p.personal || `Persona ${p.id}`,
        dni: p.dni || "",
        email: p.email || "",
        movil: p.movil || "",
        certificado: estadoCertificado(porPersona.get(p.id) || []),
      }))
      .sort(
        (a, b) =>
          URGENCIA[a.certificado.estado] - URGENCIA[b.certificado.estado] ||
          (a.certificado.caducidad || "").localeCompare(b.certificado.caducidad || "") ||
          a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
      );
  }

  function visibles() {
    const texto = state.texto.trim().toLowerCase();
    return state.listado.filter((f) => {
      const e = f.certificado.estado;
      if (state.filtro === "pendientes" ? e === "vigente" : state.filtro !== "todos" && e !== state.filtro) return false;
      return !texto || [f.nombre, f.dni, f.email, f.movil].join(" ").toLowerCase().includes(texto);
    });
  }

  // ------------------------------------------------------------------ pintado

  function render() {
    calcularListado();
    const cuenta = (e) => state.listado.filter((f) => f.certificado.estado === e).length;
    const chips = [
      ["pendientes", "Pendientes", state.listado.length - cuenta("vigente")],
      ["no-tiene", "No tiene", cuenta("no-tiene")],
      ["caducado", "Caducado", cuenta("caducado")],
      ["proximo", "Próximo a caducar", cuenta("proximo")],
      ["vigente", "Vigente", cuenta("vigente")],
      ["todos", "Todos", state.listado.length],
    ];
    el.filters.innerHTML = chips
      .map(
        ([key, label, n]) =>
          `<button type="button" class="settings-subtab-button${state.filtro === key ? " active" : ""}" data-del-filter="${key}" aria-pressed="${state.filtro === key}">${escapeHtml(label)} · ${n}</button>`,
      )
      .join("");

    const rows = visibles();
    el.summary.textContent = `${rows.length} de ${state.listado.length} personas · «Próximo a caducar» avisa con ${DIAS_AVISO_CADUCIDAD} días de margen.`;
    el.tablaButton.disabled = rows.length === 0;
    if (!el.tablaPanel.classList.contains("hidden")) renderTabla();
    el.body.innerHTML = rows.length
      ? rows
          .map(
            (f) => `<tr${f.id === state.personaId ? ' class="is-selected"' : ""}>
              <td>${escapeHtml(f.nombre)}</td>
              <td>${escapeHtml(f.dni || "—")}</td>
              <td>${pill(f.certificado)}</td>
              <td>${escapeHtml(fechaCorta(f.certificado.caducidad))}</td>
              <td><button type="button" class="secondary-button" data-del-open="${f.id}">Abrir</button></td>
            </tr>`,
          )
          .join("")
      : '<tr><td colspan="5" class="empty-state">Nadie en este grupo.</td></tr>';
    renderPersona();
  }

  function renderPersona() {
    const persona = state.personaId == null ? null : state.personal.find((p) => p.id === state.personaId) || null;
    // La ficha de la persona es una ventana modal por delante de la tabla.
    el.personaModal.classList.toggle("hidden", !persona);
    if (!persona) return;

    const historial = [...registrosDe(persona.id)].sort(
      (a, b) => (b.fecha_entrega || "").localeCompare(a.fecha_entrega || "") || b.id - a.id,
    );
    const cert = estadoCertificado(historial);
    el.personaTitle.textContent = persona.personal || `Persona ${persona.id}`;
    el.personaEstado.innerHTML = `${pill(cert)}${cert.caducidad ? ` <span class="muted-text">caduca el ${escapeHtml(fechaCorta(cert.caducidad))}</span>` : ""}`;
    el.count.textContent = String(historial.length);
    el.historial.innerHTML = historial.length
      ? historial
          .map((r) => {
            const fecha =
              state.editando?.id === r.id
                ? `<input type="date" min="2000-01-01" max="${hoyIso()}" value="${escapeHtml(state.editando.fecha)}" data-del-edit-input="${r.id}" />`
                : escapeHtml(fechaCorta(r.fecha_entrega));
            const caducaba = r.fecha_entrega ? escapeHtml(fechaCorta(sumarUnAnio(r.fecha_entrega))) : '<span class="muted-text">sin fecha</span>';
            const acciones =
              state.editando?.id === r.id
                ? `<button type="button" data-del-edit-save="${r.id}">Guardar</button>
                   <button type="button" class="secondary-button" data-del-edit-cancel>Cancelar</button>`
                : state.confirmarBorradoId === r.id
                  ? `<button type="button" class="danger-button" data-del-delete-confirm="${r.id}">Confirmar</button>
                     <button type="button" class="secondary-button" data-del-delete-cancel>Cancelar</button>`
                  : `<button type="button" class="secondary-button" data-del-edit="${r.id}">Editar fecha</button>
                     <button type="button" class="secondary-button" data-del-delete="${r.id}">Eliminar</button>`;
            return `<tr><td>${fecha}</td><td>${caducaba}</td><td>${acciones}</td></tr>`;
          })
          .join("")
      : '<tr><td colspan="3" class="empty-state">Sin certificados registrados.</td></tr>';
  }

  // ------------------------------------------------------------------ acciones

  function abrirPersona(id) {
    state.personaId = id ? Number(id) : null;
    state.editando = null;
    state.confirmarBorradoId = null;
    setFormStatus("");
    el.fecha.value = hoyIso();
    el.fecha.max = hoyIso();
    renderPersona();
    el.body.querySelectorAll("tr").forEach((tr) => tr.classList.remove("is-selected"));
    if (state.personaId) el.body.querySelector(`[data-del-open="${state.personaId}"]`)?.closest("tr")?.classList.add("is-selected");
  }

  async function abrir() {
    el.panel.classList.remove("hidden");
    const seleccionada = window.CoordinacionPersonalSeleccion?.getId?.();
    if (seleccionada) state.personaId = Number(seleccionada);
    await cargar(true);
    // Si la persona marcada no está en el grupo filtrado, se muestran todos para que se vea su fila.
    if (state.personaId && !visibles().some((f) => f.id === state.personaId)) {
      state.filtro = "todos";
      state.texto = "";
      el.search.value = "";
      render();
    }
    abrirPersona(state.personaId);
    // Con alguien marcado en Personal se abre con su ficha; su fila queda a la vista en la tabla.
    el.body.querySelector("tr.is-selected")?.scrollIntoView({ block: "nearest" });
  }

  function cerrarPersona() {
    state.personaId = null;
    state.editando = null;
    state.confirmarBorradoId = null;
    setFormStatus("");
    render();
  }

  function cerrar() {
    el.panel.classList.add("hidden");
    el.personaModal.classList.add("hidden");
  }

  async function guardarNuevo(event) {
    event.preventDefault();
    if (!state.personaId) return;
    const fecha = el.fecha.value;
    const error = errorFechaEntrega(fecha);
    if (error) return setFormStatus(error, "error");
    el.save.disabled = true;
    try {
      await rpc("delitos_sexuales_guardar", { p_personal_id: state.personaId, p_fecha_entrega: fecha });
      setFormStatus("Certificado registrado.", "success");
      el.fecha.value = hoyIso();
      await cargar(true);
    } catch (e) {
      setFormStatus(e.message, "error");
    } finally {
      el.save.disabled = false;
    }
  }

  async function guardarEdicion() {
    const edicion = state.editando;
    if (!edicion) return;
    const input = el.historial.querySelector("[data-del-edit-input]");
    const fecha = input?.value || "";
    const error = errorFechaEntrega(fecha);
    if (error) return setFormStatus(error, "error");
    try {
      await rpc("delitos_sexuales_actualizar", { p_id: edicion.id, p_fecha_entrega: fecha });
      state.editando = null;
      setFormStatus("Fecha actualizada.", "success");
      await cargar(true);
    } catch (e) {
      setFormStatus(e.message, "error");
    }
  }

  async function borrar(id) {
    try {
      await rpc("delitos_sexuales_borrar", { p_id: id });
      state.confirmarBorradoId = null;
      setFormStatus("Certificado eliminado.", "success");
      await cargar(true);
    } catch (e) {
      state.confirmarBorradoId = null;
      setFormStatus(e.message, "error");
      renderPersona();
    }
  }

  // Tabla para copiar y pegar en Excel o Word (HTML + texto con tabuladores).
  function filasTabla() {
    return visibles().map((f) => [f.nombre, f.dni, f.email, f.movil, textoEstado(f.certificado)]);
  }

  function tablaTexto(filas, conCabecera) {
    const lineas = filas.map((f) => f.join("\t"));
    return (conCabecera ? [COLUMNAS_TABLA.join("\t"), ...lineas] : lineas).join("\n");
  }

  function tablaHtml(filas, conCabecera) {
    const celdas = (vs, tag) => `<tr>${vs.map((v) => `<${tag}>${escapeHtml(v)}</${tag}>`).join("")}</tr>`;
    return `<table>${[...(conCabecera ? [celdas(COLUMNAS_TABLA, "th")] : []), ...filas.map((f) => celdas(f, "td"))].join("")}</table>`;
  }

  function setAviso(message, tone = "") {
    el.tablaAviso.textContent = message || "";
    el.tablaAviso.dataset.tone = tone;
  }

  function etiquetaFiltro() {
    return { pendientes: "Pendientes", "no-tiene": "No tiene", caducado: "Caducado", proximo: "Próximo a caducar", vigente: "Vigente", todos: "Todos" }[state.filtro] || "";
  }

  function renderTabla() {
    const filas = filasTabla();
    el.tablaTitle.textContent = `${etiquetaFiltro()} · ${filas.length}`;
    el.tablaCount.textContent = `${filas.length} personas`;
    el.copyButton.disabled = filas.length === 0;
    el.tablaBody.innerHTML = filas.length
      ? filas.map((f) => `<tr>${f.map((v) => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`).join("")
      : '<tr><td colspan="5" class="empty-state">No hay personas en este listado.</td></tr>';
  }

  function abrirTabla() {
    setAviso("");
    el.tablaPanel.classList.remove("hidden");
    renderTabla();
  }

  function cerrarTabla() {
    el.tablaPanel.classList.add("hidden");
  }

  async function copiarTabla() {
    const filas = filasTabla();
    if (!filas.length) return;
    const conCabecera = el.cabecera.checked;
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([tablaHtml(filas, conCabecera)], { type: "text/html" }),
            "text/plain": new Blob([tablaTexto(filas, conCabecera)], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(tablaTexto(filas, conCabecera));
      }
      setAviso("Tabla copiada. Pégala en Excel o Word.", "success");
    } catch (_error) {
      setAviso("No se pudo copiar automáticamente: selecciona la tabla y cópiala con Ctrl+C.", "error");
    }
  }

  function bind() {
    el.openButton.addEventListener("click", () => void abrir());
    el.closeButton.addEventListener("click", cerrar);
    el.personaClose.addEventListener("click", cerrarPersona);
    el.personaOverlay.addEventListener("click", cerrarPersona);
    el.overlay.addEventListener("click", cerrar);
    el.form.addEventListener("submit", (event) => void guardarNuevo(event));
    el.tablaButton.addEventListener("click", abrirTabla);
    el.tablaClose.addEventListener("click", cerrarTabla);
    el.tablaOverlay.addEventListener("click", cerrarTabla);
    el.copyButton.addEventListener("click", () => void copiarTabla());
    el.search.addEventListener("input", () => {
      state.texto = el.search.value;
      render();
    });
    el.filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-del-filter]");
      if (!button) return;
      state.filtro = button.dataset.delFilter;
      // Al pulsar un contador se cierra la ficha de la persona y se muestra la tabla del grupo.
      state.personaId = null;
      state.editando = null;
      state.confirmarBorradoId = null;
      setFormStatus("");
      render();
      el.body.closest(".table-scroll")?.scrollTo({ top: 0 });
      el.filters.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    el.body.addEventListener("click", (event) => {
      const button = event.target.closest("[data-del-open]");
      if (button) abrirPersona(button.dataset.delOpen);
    });
    el.historial.addEventListener("click", (event) => {
      const t = event.target.closest("button");
      if (!t) return;
      const d = t.dataset;
      if (d.delEdit) {
        const r = state.registros.find((x) => x.id === Number(d.delEdit));
        state.editando = { id: Number(d.delEdit), fecha: r?.fecha_entrega || "" };
        state.confirmarBorradoId = null;
        setFormStatus("");
        renderPersona();
      } else if (d.delEditSave) void guardarEdicion();
      else if (t.hasAttribute("data-del-edit-cancel")) {
        state.editando = null;
        renderPersona();
      } else if (d.delDelete) {
        state.confirmarBorradoId = Number(d.delDelete);
        state.editando = null;
        renderPersona();
      } else if (d.delDeleteConfirm) void borrar(Number(d.delDeleteConfirm));
      else if (t.hasAttribute("data-del-delete-cancel")) {
        state.confirmarBorradoId = null;
        renderPersona();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!el.personaModal.classList.contains("hidden")) cerrarPersona();
      else if (!el.tablaPanel.classList.contains("hidden")) cerrarTabla();
      else if (!el.panel.classList.contains("hidden")) cerrar();
    });
  }

  function init() {
    if (state.initialized) return;
    if (!q("#personal-delitos-panel")) return;
    Object.assign(el, {
      openButton: q("#personal-delitos-button"),
      panel: q("#personal-delitos-panel"),
      overlay: q("#personal-delitos-overlay"),
      closeButton: q("#personal-delitos-close-button"),
      status: q("#personal-delitos-status"),
      filters: q("#personal-delitos-filters"),
      search: q("#personal-delitos-search"),
      summary: q("#personal-delitos-summary"),
      body: q("#personal-delitos-body"),
      tablaButton: q("#personal-delitos-tabla-button"),
      tablaPanel: q("#personal-delitos-tabla-panel"),
      tablaOverlay: q("#personal-delitos-tabla-overlay"),
      tablaClose: q("#personal-delitos-tabla-close"),
      tablaTitle: q("#personal-delitos-tabla-title"),
      tablaCount: q("#personal-delitos-tabla-count"),
      tablaAviso: q("#personal-delitos-tabla-aviso"),
      tablaBody: q("#personal-delitos-tabla-body"),
      copyButton: q("#personal-delitos-copy"),
      cabecera: q("#personal-delitos-cabecera"),
      personaModal: q("#personal-delitos-persona-modal"),
      personaOverlay: q("#personal-delitos-persona-overlay"),
      personaClose: q("#personal-delitos-persona-close"),
      personaTitle: q("#personal-delitos-persona-title"),
      personaEstado: q("#personal-delitos-persona-estado"),
      form: q("#personal-delitos-form"),
      fecha: q("#personal-delitos-fecha"),
      save: q("#personal-delitos-save"),
      formStatus: q("#personal-delitos-form-status"),
      count: q("#personal-delitos-count"),
      historial: q("#personal-delitos-historial"),
    });
    state.initialized = true;
    bind();
    void actualizarVisibilidad();
    getClient()
      .then((supabase) => supabase.auth.onAuthStateChange((_event, session) => void actualizarVisibilidad(session)))
      .catch(() => {});
  }

  window.CoordinacionDelitosSexuales = { init, open: abrir };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
