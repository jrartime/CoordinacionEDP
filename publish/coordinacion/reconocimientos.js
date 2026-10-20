(function () {
  "use strict";

  // Reconocimientos médicos del personal (botón de la pestaña Personal).
  // Tabla del esquema `coordinacion`: personal_reconocimiento_medico, una fila por
  // persona y campaña (año): si autoriza el reconocimiento, la fecha y el resultado.
  // La periodicidad sale del puesto (puestos.rec_medico: 1 = anual, 2 = bienal) y el
  // puesto de la persona, de su historial laboral.

  const RESULTADOS = ["Apta", "Con limitaciones", "No apta"];

  const state = {
    initialized: false,
    personalId: null,
    persona: null,
    puesto: null,
    periodicidad: null,
    registros: [],
    editingId: null,
    autoriza: null,
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

  function thisYearText() {
    const row = state.registros.find((r) => r.anio === currentYear());
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
            <td>
              <button type="button" class="secondary-button" data-rec-edit="${r.id}">Editar</button>
              <button type="button" class="secondary-button" data-rec-delete="${r.id}">Eliminar</button>
            </td>
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
    if (!window.confirm("¿Eliminar este reconocimiento del historial?")) return;
    const supabase = await getClient();
    const { error } = await supabase.from("personal_reconocimiento_medico").delete().eq("id", id);
    if (error) {
      setStatus(`No se pudo eliminar: ${error.message}`, "error");
      return;
    }
    if (state.editingId === id) resetForm();
    await loadPerson(state.personalId);
    setStatus("Reconocimiento eliminado.", "success");
    render();
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
      if (deleteButton) void remove(Number(deleteButton.dataset.recDelete));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !el.panel.classList.contains("hidden")) close();
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
    });
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
