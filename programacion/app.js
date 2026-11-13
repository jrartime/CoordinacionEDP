(function () {
  const PERSONAL_ACCESS_CODE = "5417";
  const PROGRAMMING_FETCH_PAGE_SIZE = 1000;
  const PROGRAMMING_TABLE_NAME = "programacion_conserjes";
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
  let datePreset = "month";
  let supabaseClient = null;

  const filtersForm = document.querySelector("#filters-form");
  const datePresetButtons = document.querySelectorAll("[data-date-preset]");
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

  // Fecha: mes en curso, semana en curso (lunes a domingo), hoy, mañana o pasado mañana.
  function toIsoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function getPresetRange(preset, today = new Date()) {
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    if (preset === "month") {
      return [toIsoDate(new Date(year, month, 1)), toIsoDate(new Date(year, month + 1, 0))];
    }
    if (preset === "week") {
      const sinceMonday = (today.getDay() + 6) % 7;
      return [toIsoDate(new Date(year, month, day - sinceMonday)), toIsoDate(new Date(year, month, day - sinceMonday + 6))];
    }
    const offset = preset === "tomorrow" ? 1 : preset === "dayafter" ? 2 : 0;
    const target = toIsoDate(new Date(year, month, day + offset));
    return [target, target];
  }

  function rowInDateRange(row) {
    const [from, to] = getPresetRange(datePreset);
    const date = normalizeDate(row.fecha);
    return Boolean(date) && date >= from && date <= to;
  }

  function syncDatePresetButtons() {
    datePresetButtons.forEach((button) => {
      const active = button.dataset.datePreset === datePreset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
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
      : "Campo personal visible. Ya puedes filtrar y ordenar por personal.";
  }

  function renderFilters(rows) {
    const accessibleRows = personalAccessName
      ? rows.filter((row) => row.personal === personalAccessName)
      : rows;
    const dateScopedRows = accessibleRows.filter(rowInDateRange);
    const installations = sortTextValues(
      Array.from(new Set(dateScopedRows.map((row) => row.instalacion).filter(Boolean)))
    );
    const people = personalAccessName
      ? [personalAccessName]
      : sortTextValues(Array.from(new Set(accessibleRows.map((row) => row.personal).filter(Boolean))));
    const sports = sortTextValues(Array.from(new Set(dateScopedRows.map((row) => row.deporte).filter(Boolean))));

    const currentValues = {
      installation: filterInstallation.value,
      personal: filterPersonal.value,
      sport: filterSport.value,
    };

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
      if (!rowInDateRange(row)) {
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
    // Esta app no usa shared/supabase-client.js: crea su propio cliente, así que el
    // esquema de config.js hay que pasarlo aquí también (ver fase-1 de la migración).
    supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      db: { schema: supabaseConfig.schema ?? "public" },
    });
    return supabaseClient;
  }

  // El nombre que se muestra es el de la tabla de instalaciones (por id), no el texto guardado
  // en cada registro, que puede ser un nombre antiguo o escrito de otra forma.
  function mapSupabaseRows(rows, catalog) {
    return (rows ?? []).map((row) => ({
      personal: String(row.personal ?? "").trim(),
      instalacionId: row.instalacion_id ?? null,
      instalacion: String(catalog?.names.get(row.instalacion_id) ?? row.instalacion ?? "").trim(),
      fecha: String(row.fecha ?? "").trim(),
      inicio: String(row.hora_inicio ?? "").trim(),
      fin: String(row.hora_fin ?? "").trim(),
      hora: String(row.hora_evento ?? "").trim(),
      deporte: String(row.deporte ?? "").trim(),
      actividad: String(row.actividad ?? "").trim(),
    }));
  }

  async function loadInstallationCatalog(supabase) {
    const { data, error } = await supabase
      .from("instalaciones")
      .select("id, instalacion, activo")
      .limit(10000);

    const names = new Map();
    const inactiveIds = new Set();
    if (!error) {
      (data ?? []).forEach((row) => {
        if (row.activo) {
          names.set(row.id, String(row.instalacion ?? "").trim());
        } else {
          inactiveIds.add(row.id);
        }
      });
    }
    return { names, inactiveIds, available: !error && names.size > 0 };
  }

  // Solo se muestran registros de instalaciones activas de la base de datos.
  function filterActiveInstallationRows(rows, catalog) {
    if (!catalog.available) {
      return rows;
    }
    return rows.filter((row) => (row.instalacionId ? catalog.names.has(row.instalacionId) : true));
  }

  async function fetchAllProgrammingRows(buildQuery, pageSize = PROGRAMMING_FETCH_PAGE_SIZE) {
    const rows = [];

    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await buildQuery().range(offset, offset + pageSize - 1);

      if (error) {
        return { data: rows, error };
      }

      const pageRows = data ?? [];
      rows.push(...pageRows);

      if (pageRows.length < pageSize) {
        return { data: rows, error: null };
      }
    }
  }

  async function loadRowsFromSupabase() {
    if (!hasSupabaseConfig) {
      throw new Error("No hay configuracion de Supabase disponible para el panel.");
    }

    const supabase = await getSupabaseClient();
    const catalog = await loadInstallationCatalog(supabase);
    const { data, error } = await fetchAllProgrammingRows(() =>
      supabase
        .from(PROGRAMMING_TABLE_NAME)
        .select(
          "personal, instalacion, instalacion_id, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, sort_order"
        )
        .order("fecha", { ascending: true })
        .order("sort_order", { ascending: true })
    );

    if (error) {
      throw error;
    }

    return filterActiveInstallationRows(mapSupabaseRows(data, catalog), catalog);
  }

  async function loadRows() {
    statusMessage.textContent = "Cargando programación desde Supabase...";
    try {
      sourceRows = await loadRowsFromSupabase();
      renderFilters(sourceRows);
      applyFilters();
      statusMessage.textContent = `Programación cargada correctamente: ${sourceRows.length} registros.`;
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

  datePresetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      datePreset = button.dataset.datePreset;
      syncDatePresetButtons();
      syncDateScopedFilters();
      applyFilters();
    });
  });
  filtersForm.addEventListener("input", () => {
    applyFilters();
  });
  filtersForm.addEventListener("change", () => {
    applyFilters();
  });
  accessCodeButton.addEventListener("click", async () => {
    if (personalUnlocked) {
      personalUnlocked = false;
      personalAccessName = "";
      accessCodeInput.value = "";
      await loadRows();
      syncPersonalVisibility();
      renderFilters(sourceRows);
      applyFilters();
      return;
    }

    const accessCode = accessCodeInput.value.trim();
    if (accessCode === PERSONAL_ACCESS_CODE) {
      personalAccessName = "";
    } else {
      try {
        personalAccessName = await findPersonalNameByAccessCode(accessCode);
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
