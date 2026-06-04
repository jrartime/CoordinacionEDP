(function () {
  const PERSONAL_ACCESS_CODE = "5417";
  const WEEKLY_ACCESS_CODE = "semana5417";
  const FINDESEMANA_LIMIT = 5000;
  const PROGRAMMING_TABLE_NAME = "programacion_conserjes";
  const PROGRAMMING_TYPE_FS = "fin_semana";
  const PROGRAMMING_TYPE_WEEKLY = "semanal";
  const config = window.APP_CONFIG ?? {};
  const supabaseConfig = config.supabase ?? {};
  const hasSupabaseConfig =
    Boolean(supabaseConfig.url) &&
    Boolean(supabaseConfig.anonKey);

  const sortState = { field: "fecha", direction: "asc" };
  let sourceRows = [];
  let filteredRows = [];
  let personalUnlocked = false;
  let personalAccessName = "";
  let currentProgrammingType = PROGRAMMING_TYPE_FS;
  let supabaseClient = null;

  const filtersForm = document.querySelector("#filters-form");
  const filterDate = document.querySelector("#filter-date");
  const filterInstallation = document.querySelector("#filter-installation");
  const filterPersonalField = document.querySelector("#filter-personal-field");
  const filterPersonal = document.querySelector("#filter-personal");
  const filterSport = document.querySelector("#filter-sport");
  const filterActivity = document.querySelector("#filter-activity");
  const refreshButton = document.querySelector("#refresh-button");
  const accessCodeInput = document.querySelector("#access-code-input");
  const accessCodeButton = document.querySelector("#access-code-button");
  const accessCodeStatus = document.querySelector("#access-code-status");
  const personalHeader = document.querySelector("#schedule-personal-header");
  const tableBody = document.querySelector("#schedule-table-body");
  const statusMessage = document.querySelector("#status-message");
  const summaryTotal = document.querySelector("#summary-total");
  const summaryInstallations = document.querySelector("#summary-installations");
  const summaryPeople = document.querySelector("#summary-people");
  const summaryRange = document.querySelector("#summary-range");

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(value) {
    const normalized = String(value ?? "").trim();
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
      return normalized;
    }
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  function normalizeDate(value) {
    const normalized = String(value ?? "").trim();
    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    const localMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (localMatch) {
      return `${localMatch[3]}-${String(localMatch[2]).padStart(2, "0")}-${String(localMatch[1]).padStart(2, "0")}`;
    }

    return "";
  }

  function formatTime(value) {
    const normalized = String(value ?? "").trim();
    return normalized ? normalized.slice(0, 5) : "";
  }

  function sortTextValues(values) {
    return [...values].sort((left, right) =>
      String(left).localeCompare(String(right), "es", { sensitivity: "base", numeric: true })
    );
  }

  function syncSortButtons() {
    document.querySelectorAll("[data-sort-field]").forEach((button) => {
      const active = button.dataset.sortField === sortState.field;
      button.classList.toggle("active", active);
      button.classList.toggle("sort-asc", active && sortState.direction === "asc");
      button.classList.toggle("sort-desc", active && sortState.direction === "desc");
    });
  }

  function getVisibleColumnCount() {
    return personalUnlocked ? 8 : 7;
  }

  function getProgrammingTypeLabel() {
    return currentProgrammingType === PROGRAMMING_TYPE_WEEKLY
      ? "programación semanal"
      : "programación de fin de semana";
  }

  function syncPersonalVisibility() {
    filterPersonalField.classList.toggle("hidden", !personalUnlocked);
    personalHeader.classList.toggle("hidden", !personalUnlocked);

    if (!personalUnlocked) {
      filterPersonal.value = "";
      if (sortState.field === "personal") {
        sortState.field = "fecha";
        sortState.direction = "asc";
      }
      accessCodeButton.textContent = "Mostrar personal";
      accessCodeStatus.textContent = "El campo personal está oculto hasta introducir el código.";
      return;
    }

    accessCodeButton.textContent = "Ocultar personal";
    accessCodeStatus.textContent = personalAccessName
      ? `Mostrando solo la programación de ${personalAccessName}.`
      : `Campo personal visible en ${getProgrammingTypeLabel()}. Ya puedes filtrar y ordenar por personal.`;
  }

  function renderFilters(rows) {
    const accessibleRows = personalAccessName
      ? rows.filter((row) => row.personal === personalAccessName)
      : rows;
    const dates = Array.from(new Set(accessibleRows.map((row) => normalizeDate(row.fecha)).filter(Boolean))).sort();
    const selectedDate = dates.includes(filterDate.value) ? filterDate.value : "";
    const dateScopedRows = selectedDate
      ? accessibleRows.filter((row) => normalizeDate(row.fecha) === selectedDate)
      : accessibleRows;
    const installations = sortTextValues(
      Array.from(new Set(dateScopedRows.map((row) => row.instalacion).filter(Boolean)))
    );
    const people = personalAccessName
      ? [personalAccessName]
      : sortTextValues(Array.from(new Set(accessibleRows.map((row) => row.personal).filter(Boolean))));
    const sports = sortTextValues(Array.from(new Set(dateScopedRows.map((row) => row.deporte).filter(Boolean))));

    const currentValues = {
      date: filterDate.value,
      installation: filterInstallation.value,
      personal: filterPersonal.value,
      sport: filterSport.value,
    };

    filterDate.innerHTML = ['<option value="">Todas las fechas</option>']
      .concat(
        dates.map(
          (value) => `<option value="${escapeHtml(value)}">${escapeHtml(formatDate(value))}</option>`
        )
      )
      .join("");
    filterInstallation.innerHTML = ['<option value="">Todas las instalaciones</option>']
      .concat(
        installations.map(
          (value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
        )
      )
      .join("");
    if (personalUnlocked) {
      filterPersonal.innerHTML = (personalAccessName ? [] : ['<option value="">Todo el personal</option>'])
        .concat(people.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
        .join("");
    }
    filterSport.innerHTML = ['<option value="">Todos los deportes</option>']
      .concat(sports.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
      .join("");

    filterDate.value = selectedDate;
    filterInstallation.value = installations.includes(currentValues.installation)
      ? currentValues.installation
      : "";
    if (personalUnlocked) {
      filterPersonal.value = personalAccessName
        ? personalAccessName
        : people.includes(currentValues.personal)
          ? currentValues.personal
          : "";
    }
    filterSport.value = sports.includes(currentValues.sport) ? currentValues.sport : "";
  }

  function syncDateScopedFilters() {
    renderFilters(sourceRows);
  }

  function applyFilters() {
    const activityQuery = normalizeText(filterActivity.value);
    filteredRows = sourceRows.filter((row) => {
      if (filterDate.value && normalizeDate(row.fecha) !== filterDate.value) {
        return false;
      }
      if (filterInstallation.value && row.instalacion !== filterInstallation.value) {
        return false;
      }
      if (personalAccessName && row.personal !== personalAccessName) {
        return false;
      }
      if (personalUnlocked && filterPersonal.value && row.personal !== filterPersonal.value) {
        return false;
      }
      if (filterSport.value && row.deporte !== filterSport.value) {
        return false;
      }
      if (activityQuery && !normalizeText(row.actividad).includes(activityQuery)) {
        return false;
      }
      return true;
    });

    filteredRows.sort((left, right) => {
      const direction = sortState.direction === "asc" ? 1 : -1;
      return (
        String(left[sortState.field] ?? "").localeCompare(String(right[sortState.field] ?? ""), "es", {
          sensitivity: "base",
          numeric: true,
        }) * direction
      );
    });

    renderSummary(filteredRows);
    renderRows(filteredRows);
    syncSortButtons();
  }

  function renderSummary(rows) {
    const installations = new Set(rows.map((row) => row.instalacion).filter(Boolean));
    const people = new Set(rows.map((row) => row.personal).filter(Boolean));
    const rawDates = rows.map((row) => row.fecha).filter(Boolean).sort();

    summaryTotal.textContent = String(rows.length);
    summaryInstallations.textContent = String(installations.size);
    summaryPeople.textContent = String(people.size);
    summaryRange.textContent =
      rawDates.length > 0
        ? `${formatDate(rawDates[0])} - ${formatDate(rawDates[rawDates.length - 1])}`
        : "-";
  }

  function renderRows(rows) {
    if (!rows.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="${getVisibleColumnCount()}" class="empty-state">No hay resultados para los filtros actuales.</td>
        </tr>
      `;
      return;
    }

    const personalCells = personalUnlocked
      ? (row) => `<td>${escapeHtml(row.personal)}</td>`
      : () => "";

    tableBody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(formatDate(row.fecha))}</td>
            <td>${escapeHtml(row.instalacion)}</td>
            ${personalCells(row)}
            <td>${escapeHtml(formatTime(row.inicio))}</td>
            <td>${escapeHtml(formatTime(row.fin))}</td>
            <td>${escapeHtml(formatTime(row.hora))}</td>
            <td>${escapeHtml(row.deporte)}</td>
            <td class="activity-cell">${escapeHtml(row.actividad)}</td>
          </tr>
        `
      )
      .join("");
  }

  async function getSupabaseClient() {
    if (!hasSupabaseConfig) {
      throw new Error("Falta la configuracion de Supabase en config.js.");
    }

    if (supabaseClient) {
      return supabaseClient;
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    return supabaseClient;
  }

  function mapSupabaseRows(rows) {
    return (rows ?? []).map((row) => ({
      personal: String(row.personal ?? "").trim(),
      instalacion: String(row.instalacion ?? "").trim(),
      fecha: String(row.fecha ?? "").trim(),
      inicio: String(row.hora_inicio ?? "").trim(),
      fin: String(row.hora_fin ?? "").trim(),
      hora: String(row.hora_evento ?? "").trim(),
      deporte: String(row.deporte ?? "").trim(),
      actividad: String(row.actividad ?? "").trim(),
    }));
  }

  async function loadActiveInstallationNames(supabase) {
    const { data, error } = await supabase
      .from("instalaciones")
      .select("instalacion")
      .eq("activo", true)
      .limit(10000);

    if (error) {
      return new Set();
    }

    return new Set((data ?? []).map((row) => normalizeText(row.instalacion)).filter(Boolean));
  }

  function filterActiveInstallationRows(rows, activeInstallationNames) {
    if (!activeInstallationNames.size) {
      return rows;
    }

    return rows.filter((row) => activeInstallationNames.has(normalizeText(row.instalacion)));
  }

  function isMissingArchivedAtColumnError(error) {
    const message = String(error?.message ?? "");
    const details = String(error?.details ?? "");
    const hint = String(error?.hint ?? "");
    return [message, details, hint].some((value) => value.includes("archived_at"));
  }

  function isMissingProgrammingTypeColumnError(error) {
    const message = String(error?.message ?? "");
    const details = String(error?.details ?? "");
    const hint = String(error?.hint ?? "");
    return [message, details, hint].some((value) => value.includes("tipo_programacion"));
  }

  async function loadRowsFromSupabase() {
    if (!hasSupabaseConfig) {
      throw new Error("No hay configuracion de Supabase disponible para el panel.");
    }

    const supabase = await getSupabaseClient();
    const activeInstallationNames = await loadActiveInstallationNames(supabase);
    let { data, error } = await supabase
      .from(PROGRAMMING_TABLE_NAME)
      .select(
        "personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, sort_order"
      )
      .eq("tipo_programacion", currentProgrammingType)
      .is("archived_at", null)
      .order("fecha", { ascending: true })
      .order("sort_order", { ascending: true })
      .limit(FINDESEMANA_LIMIT);

    if (error && isMissingArchivedAtColumnError(error)) {
      ({ data, error } = await supabase
        .from(PROGRAMMING_TABLE_NAME)
        .select("personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, sort_order")
        .eq("tipo_programacion", currentProgrammingType)
        .order("fecha", { ascending: true })
        .order("sort_order", { ascending: true })
        .limit(FINDESEMANA_LIMIT));
    }

    if (error && isMissingProgrammingTypeColumnError(error)) {
      ({ data, error } = await supabase
        .from(PROGRAMMING_TABLE_NAME)
        .select("personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, sort_order")
        .is("archived_at", null)
        .order("fecha", { ascending: true })
        .order("sort_order", { ascending: true })
        .limit(FINDESEMANA_LIMIT));
    }

    if (error) {
      throw error;
    }

    return filterActiveInstallationRows(mapSupabaseRows(data), activeInstallationNames);
  }

  async function loadRows() {
    statusMessage.textContent = "Cargando programación desde Supabase...";
    try {
      sourceRows = await loadRowsFromSupabase();
      renderFilters(sourceRows);
      applyFilters();
      statusMessage.textContent = `Datos de ${getProgrammingTypeLabel()} cargados correctamente desde programacion_conserjes: ${sourceRows.length} registros.`;
    } catch (error) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="${getVisibleColumnCount()}" class="empty-state">No se pudieron cargar los datos de Supabase.</td>
        </tr>
      `;
      statusMessage.textContent = `No se pudo cargar programacion_conserjes: ${error.message}`;
    }
  }

  async function findPersonalNameByAccessCode(accessCode) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc("get_programming_personnel_for_pin", {
      access_pin: accessCode,
    });

    if (error) {
      throw error;
    }

    return String(data?.[0]?.name ?? "").trim();
  }

  filterDate.addEventListener("change", () => {
    syncDateScopedFilters();
    applyFilters();
  });
  filterDate.addEventListener("input", () => {
    syncDateScopedFilters();
    applyFilters();
  });
  filtersForm.addEventListener("input", (event) => {
    if (event.target === filterDate) {
      return;
    }
    applyFilters();
  });
  filtersForm.addEventListener("change", (event) => {
    if (event.target === filterDate) {
      return;
    }
    applyFilters();
  });
  accessCodeButton.addEventListener("click", async () => {
    if (personalUnlocked) {
      personalUnlocked = false;
      personalAccessName = "";
      currentProgrammingType = PROGRAMMING_TYPE_FS;
      accessCodeInput.value = "";
      await loadRows();
      syncPersonalVisibility();
      renderFilters(sourceRows);
      applyFilters();
      return;
    }

    const accessCode = accessCodeInput.value.trim();
    const normalizedAccessCode = accessCode.toLowerCase();
    if (accessCode === PERSONAL_ACCESS_CODE) {
      personalAccessName = "";
      currentProgrammingType = PROGRAMMING_TYPE_FS;
    } else if (normalizedAccessCode === WEEKLY_ACCESS_CODE) {
      personalAccessName = "";
      currentProgrammingType = PROGRAMMING_TYPE_WEEKLY;
    } else {
      try {
        personalAccessName = await findPersonalNameByAccessCode(accessCode);
        currentProgrammingType = PROGRAMMING_TYPE_FS;
      } catch (error) {
        accessCodeStatus.textContent = `No se pudo validar el código: ${error.message}`;
        return;
      }

      if (!personalAccessName) {
        accessCodeStatus.textContent = "Código incorrecto. El campo personal sigue oculto.";
        return;
      }
    }

    personalUnlocked = true;
    await loadRows();
    syncPersonalVisibility();
    renderFilters(sourceRows);
    applyFilters();
  });
  accessCodeInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    accessCodeButton.click();
  });
  document.querySelector("#schedule-table").addEventListener("click", (event) => {
    const sortField = event.target.closest("[data-sort-field]")?.dataset.sortField;
    if (!sortField) {
      return;
    }

    if (sortField === "personal" && !personalUnlocked) {
      return;
    }

    if (sortState.field === sortField) {
      sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
    } else {
      sortState.field = sortField;
      sortState.direction = "asc";
    }

    applyFilters();
  });
  refreshButton.addEventListener("click", loadRows);

  syncPersonalVisibility();
  void loadRows();
})();
