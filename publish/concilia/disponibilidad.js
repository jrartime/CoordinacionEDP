(function () {
  const WEEKS = [
    { key: "semana_01", title: "Semana 01", label: "22/06 - 28/06" },
    { key: "semana_02", title: "Semana 02", label: "29/06 - 05/07" },
    { key: "semana_03", title: "Semana 03", label: "06/07 - 12/07" },
    { key: "semana_04", title: "Semana 04", label: "13/07 - 19/07" },
    { key: "semana_05", title: "Semana 05", label: "20/07 - 26/07" },
    { key: "semana_06", title: "Semana 06", label: "27/07 - 02/08" },
    { key: "semana_07", title: "Semana 07", label: "03/08 - 09/08" },
    { key: "semana_08", title: "Semana 08", label: "10/08 - 16/08" },
    { key: "semana_09", title: "Semana 09", label: "17/08 - 23/08" },
    { key: "semana_10", title: "Semana 10", label: "24/08 - 30/08" },
    { key: "semana_11", title: "Semana 11", label: "31/08 - 06/09" },
  ];

  const form = document.querySelector("#availability-form");
  const nameInput = document.querySelector("#availability-name");
  const notesInput = document.querySelector("#availability-notes");
  const weeksContainer = document.querySelector("#availability-weeks");
  const submitButton = document.querySelector("#availability-submit");
  const statusMessage = document.querySelector("#availability-status");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function setStatus(message, tone = "") {
    statusMessage.textContent = message;
    statusMessage.className = "availability-status";
    if (tone) {
      statusMessage.classList.add(tone);
    }
  }

  function renderWeeks() {
    weeksContainer.innerHTML = WEEKS.map(
      (week) => `
        <label class="week-option">
          <input type="checkbox" name="${escapeHtml(week.key)}" />
          <strong>
            ${escapeHtml(week.title)}
            <span>${escapeHtml(week.label)}</span>
          </strong>
        </label>
      `
    ).join("");
  }

  function getWeekValues() {
    return Object.fromEntries(
      WEEKS.map((week) => [week.key, Boolean(form.elements[week.key]?.checked)])
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nombre = nameInput.value.trim().replace(/\s+/g, " ");
    if (nombre.length < 3) {
      setStatus("Escribe tu nombre y apellidos.", "error");
      nameInput.focus();
      return;
    }

    submitButton.disabled = true;
    setStatus("Guardando disponibilidad...");

    try {
      const supabase = await window.SupabaseApp.getClient();
      const { error } = await supabase.rpc("save_concilia_disponibilidad", {
        p_nombre: nombre,
        p_semanas: getWeekValues(),
        p_observaciones: notesInput.value.trim() || null,
      });

      if (error) {
        throw error;
      }

      setStatus("Disponibilidad guardada correctamente.", "success");
    } catch (error) {
      setStatus(`No se pudo guardar: ${error.message}`, "error");
    } finally {
      submitButton.disabled = false;
    }
  }

  renderWeeks();
  form.addEventListener("submit", (event) => {
    void handleSubmit(event);
  });
})();
