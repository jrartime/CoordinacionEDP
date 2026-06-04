// ============================================================
// Módulo de Control Horario
// ============================================================

function invalidateControlLookupCaches() {
  controlPersonalLookupLoaded = false;
  controlPersonalLookupPromise = null;
}

// --- Normalize / resolve ---

function normalizeControlDni(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLocaleUpperCase("es");
}

function getResolvedControlPersonal(row) {
  const dni = normalizeControlDni(row?.dni);
  if (dni && currentPersonalByDni.has(dni)) {
    return currentPersonalByDni.get(dni);
  }

  return String(row?.personal ?? "").trim();
}

function enrichControlRecord(row) {
  return {
    ...row,
    personal_resolved: getResolvedControlPersonal(row),
  };
}

// --- Suggestions ---

function renderControlPersonalSuggestions() {
  if (!controlPersonalSuggestions) {
    return;
  }

  const query = normalizeSearchText(controlPersonalInput.value);
  const suggestions = currentControlPersonalOptions
    .filter((value) => {
      if (!query) {
        return true;
      }

      return normalizeSearchText(value).includes(query);
    })
    .sort((left, right) =>
      String(left).localeCompare(String(right), "es", { sensitivity: "base", numeric: true })
    );

  if (!suggestions.length || (!query && controlPersonalInput !== document.activeElement)) {
    controlPersonalSuggestions.classList.add("hidden");
    controlPersonalSuggestions.innerHTML = "";
    return;
  }

  controlPersonalSuggestions.innerHTML = suggestions
    .map(
      (value) => `
        <button
          type="button"
          class="filter-suggestion-option"
          data-control-personal-option="${escapeHtml(value)}"
        >
          ${escapeHtml(value)}
        </button>
      `
    )
    .join("");
  controlPersonalSuggestions.classList.remove("hidden");
}

// --- Sort ---

function getSortableControlValue(row, field) {
  if (field === "personal") {
    return String(row.personal_resolved ?? getResolvedControlPersonal(row)).trim();
  }

  if (field === "worked_hours") {
    return calculateWorkedMinutes(row.hora_inicio, row.hora_fin);
  }

  if (field === "fecha") {
    return String(row.fecha ?? "");
  }

  if (field === "hora_inicio" || field === "hora_fin") {
    return String(row[field] ?? "");
  }

  return String(row[field] ?? "").trim();
}

function compareControlValues(left, right, field) {
  const leftValue = getSortableControlValue(left, field);
  const rightValue = getSortableControlValue(right, field);

  if (field === "worked_hours") {
    return Number(leftValue || 0) - Number(rightValue || 0);
  }

  return String(leftValue).localeCompare(String(rightValue), "es", {
    numeric: true,
    sensitivity: "base",
  });
}

function getControlSortPriority(field) {
  const defaultPriority = ["fecha", "personal", "centro", "puesto", "hora_inicio"];

  const priorities = {
    personal: ["personal", "fecha", "centro", "puesto", "hora_inicio"],
    centro: ["centro", "personal", "fecha", "puesto", "hora_inicio"],
    puesto: ["puesto", "personal", "centro", "fecha", "hora_inicio"],
    fecha: ["fecha", "personal", "centro", "puesto", "hora_inicio"],
    hora_inicio: ["hora_inicio", "fecha", "personal", "centro", "puesto"],
    hora_fin: ["hora_fin", "fecha", "personal", "centro", "puesto", "hora_inicio"],
    worked_hours: ["worked_hours", "fecha", "personal", "centro", "puesto", "hora_inicio"],
    tipo_jornada: ["tipo_jornada", "personal", "fecha", "centro", "puesto", "hora_inicio"],
    observacion: ["observacion", "personal", "fecha", "centro", "puesto", "hora_inicio"],
  };

  return priorities[field] ?? defaultPriority;
}

function sortRecordsByControlState(rows, sortState) {
  const directionMultiplier = sortState.direction === "asc" ? 1 : -1;
  const priorityFields = getControlSortPriority(sortState.field);

  return [...rows].sort((left, right) => {
    for (let index = 0; index < priorityFields.length; index += 1) {
      const field = priorityFields[index];
      const result = compareControlValues(left, right, field);
      if (result === 0) {
        continue;
      }

      return result * (index === 0 ? directionMultiplier : 1);
    }

    return compareControlValues(left, right, "dni");
  });
}

function sortControlRecords(rows) {
  return sortRecordsByControlState(rows, currentControlSort);
}

function syncSortButtonsBySelector(selector, datasetKey, sortState) {
  document.querySelectorAll(selector).forEach((button) => {
    const isActive = button.dataset[datasetKey] === sortState.field;
    button.classList.toggle("active", isActive);
    button.classList.toggle("sort-asc", isActive && sortState.direction === "asc");
    button.classList.toggle("sort-desc", isActive && sortState.direction === "desc");
  });
}

function syncControlSortButtons() {
  syncSortButtonsBySelector("[data-control-sort-field]", "controlSortField", currentControlSort);
}

// --- Render ---

function renderControlRecords(rows) {
  syncControlSortButtons();
  const visibleColumnCount = controlSelectiveDeleteMode ? 12 : 11;

  if (!rows.length) {
    controlRecordsTableBody.innerHTML = `
      <tr>
        <td colspan="${visibleColumnCount}" class="empty-state">No hay registros para los filtros seleccionados.</td>
      </tr>
    `;
    syncControlDeleteSelectionUi();
    return;
  }

  controlRecordsTableBody.innerHTML = rows
    .map((row) => {
      const workedHours = calculateWorkedHours(row.hora_inicio, row.hora_fin);
      const weekday = getControlWeekdayInfo(row.fecha);
      const rowId = String(row.id);
      const selectionCell = controlSelectiveDeleteMode
        ? `
          <td class="control-select-cell">
            <input
              type="checkbox"
              data-control-select-id="${escapeHtml(rowId)}"
              aria-label="Seleccionar registro de ${escapeHtml(row.personal_resolved || getResolvedControlPersonal(row) || "")}"
              ${selectedControlDeleteIds.has(rowId) ? "checked" : ""}
            />
          </td>
        `
        : "";

      return `
        <tr class="${escapeHtml(weekday.className)}">
          ${selectionCell}
          <td>
            <button type="button" class="table-action tooltip-button" aria-label="Editar registro" data-control-edit-id="${escapeHtml(row.id)}">${renderIcon("edit")}</button>
          </td>
          <td class="weekday-marker-cell">
            <span
              class="weekday-marker"
              style="display: inline-block; min-width: 18px; color: ${escapeHtml(weekday.color)}; font-weight: 900; font-size: 1rem; line-height: 1; text-align: center; text-shadow: 0 0 1px #001f54;"
              title="${escapeHtml(`${weekday.label} - ${formatDisplayDate(row.fecha)}`)}"
              aria-label="${escapeHtml(weekday.label)}"
            >${escapeHtml(weekday.letter)}</span>
          </td>
          <td>${escapeHtml(row.personal_resolved || getResolvedControlPersonal(row) || "")}</td>
          <td>${escapeHtml(row.centro || "")}</td>
          <td>${escapeHtml(row.puesto || "")}</td>
          <td>${escapeHtml(formatDisplayDate(row.fecha))}</td>
          <td>${escapeHtml(formatHourValue(row.hora_inicio))}</td>
          <td>${escapeHtml(formatHourValue(row.hora_fin))}</td>
          <td>${escapeHtml(workedHours)}</td>
          <td>${escapeHtml(row.tipo_jornada || "")}</td>
          <td>${escapeHtml(row.observacion || "")}</td>
        </tr>
      `;
    })
    .join("");
  syncControlDeleteSelectionUi();
}

function renderControlSummary(rows, emptyMessage = "No hay resumen disponible para los filtros seleccionados.") {
  if (controlSummaryRows.length) {
    controlSummaryTableBody.innerHTML = controlSummaryRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.personal)}</td>
            <td>${escapeHtml(formatMinutesAsHours(row.total_minutes))}</td>
          </tr>
        `
      )
      .join("");
    return;
  }

  if (!rows.length) {
    controlSummaryTableBody.innerHTML = `
      <tr>
        <td colspan="2" class="empty-state">${escapeHtml(emptyMessage)}</td>
      </tr>
    `;
    return;
  }

  const totalsByPerson = new Map();
  rows.forEach((row) => {
    const person = String(row.personal_resolved ?? getResolvedControlPersonal(row)).trim() || "Sin nombre";
    const minutes = calculateWorkedMinutes(row.hora_inicio, row.hora_fin);
    totalsByPerson.set(person, (totalsByPerson.get(person) ?? 0) + minutes);
  });

  const sortedSummary = [...totalsByPerson.entries()].sort((left, right) => {
    return left[0].localeCompare(right[0], "es");
  });

  controlSummaryTableBody.innerHTML = sortedSummary
    .map(
      ([person, minutes]) => `
        <tr>
          <td>${escapeHtml(person)}</td>
          <td>${escapeHtml(formatMinutesAsHours(minutes))}</td>
        </tr>
      `
    )
    .join("");
}

function renderControlTotalsPanel(rows = filteredControlRecords) {
  const filters = buildControlFilters();
  const reportContent =
    controlTotalsReportContent ||
    (() => {
      const drawer = controlTotalsPanel?.querySelector(".control-totals-drawer");
      if (!drawer) {
        return null;
      }
      const container = document.createElement("div");
      container.id = "control-totals-report-content";
      container.className = "control-person-report";
      drawer.appendChild(container);
      return container;
    })();
  const peopleGroups = new Map();
  const people = new Set();
  let totalMinutes = 0;

  rows.forEach((row) => {
    const date = normalizeImportedDate(row.fecha) || String(row.fecha ?? "").trim();
    if (!date) {
      return;
    }

    const minutes = calculateWorkedMinutes(row.hora_inicio, row.hora_fin);
    const person = String(row.personal_resolved ?? getResolvedControlPersonal(row)).trim();
    const personName = person || "Sin personal";
    const puesto = String(row.puesto ?? "").trim() || "Sin puesto";
    const dayKey = `${date}|${puesto}`;
    const week = getControlWeekKey(date);
    const weekKey = `${week.key}|${puesto}`;

    people.add(personName);

    if (!peopleGroups.has(personName)) {
      peopleGroups.set(personName, {
        daily: new Map(),
        weekly: new Map(),
      });
    }

    const group = peopleGroups.get(personName);
    const daily = group.daily.get(dayKey) ?? { date, puesto, minutes: 0 };
    daily.minutes += minutes;
    group.daily.set(dayKey, daily);

    const weekly = group.weekly.get(weekKey) ?? {
      weekKey: week.key,
      weekLabel: week.label,
      puesto,
      minutes: 0,
    };
    weekly.minutes += minutes;
    group.weekly.set(weekKey, weekly);

    totalMinutes += minutes;
  });

  controlTotalsPersonCount.textContent = String(people.size);
  controlTotalsRecordCount.textContent = String(rows.length);
  controlTotalsHours.textContent = controlResultsTruncated
    ? "Acota filtros"
    : formatMinutesAsHours(totalMinutes);
  controlTotalsFilterSummary.textContent = buildControlTotalsFilterSummary(filters);

  if (!rows.length) {
    if (reportContent) {
      reportContent.innerHTML = `<p class="empty-state">No hay datos filtrados.</p>`;
    }
    return;
  }

  if (!reportContent) {
    return;
  }

  reportContent.innerHTML = [...peopleGroups.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "es", { sensitivity: "base" }))
    .map(
      ([person, group]) => {
        const dailyRows = [...group.daily.values()]
          .sort(
            (left, right) =>
              left.date.localeCompare(right.date) ||
              left.puesto.localeCompare(right.puesto, "es", { sensitivity: "base" })
          )
          .map((item) => {
            const weekday = getControlWeekdayInfo(item.date);
            return `
              <tr class="${escapeHtml(weekday.className)}">
                <td class="weekday-marker-cell">
                  <span
                    class="weekday-marker"
                    title="${escapeHtml(`${weekday.label} - ${formatDisplayDate(item.date)}`)}"
                    aria-label="${escapeHtml(weekday.label)}"
                  >${escapeHtml(weekday.letter)}</span>
                </td>
                <td>${escapeHtml(formatDisplayDate(item.date))}</td>
                <td>${escapeHtml(item.puesto)}</td>
                <td>${escapeHtml(formatMinutesAsHours(item.minutes))}</td>
              </tr>
            `;
          })
          .join("");

        const weeklyRows = [...group.weekly.values()]
          .sort(
            (left, right) =>
              left.weekKey.localeCompare(right.weekKey) ||
              left.puesto.localeCompare(right.puesto, "es", { sensitivity: "base" })
          )
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.weekLabel)}</td>
                <td>${escapeHtml(item.puesto)}</td>
                <td>${escapeHtml(formatMinutesAsHours(item.minutes))}</td>
              </tr>
            `
          )
          .join("");

        return `
          <section class="control-person-report-section">
            <h4>${escapeHtml(person)}</h4>
            <div class="control-totals-grid">
              <section>
                <h5>Total diario por puesto</h5>
                <div class="table-wrapper control-totals-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Día</th>
                        <th>Fecha</th>
                        <th>Puesto</th>
                        <th>Total horas</th>
                      </tr>
                    </thead>
                    <tbody>${dailyRows}</tbody>
                  </table>
                </div>
              </section>
              <section>
                <h5>Total por semana y puesto</h5>
                <div class="table-wrapper control-totals-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Semana</th>
                        <th>Puesto</th>
                        <th>Total horas</th>
                      </tr>
                    </thead>
                    <tbody>${weeklyRows}</tbody>
                  </table>
                </div>
              </section>
            </div>
          </section>
        `;
      }
    )
    .join("");
}

function openControlTotalsPanel() {
  controlTotalsPanel?.classList.remove("hidden");
  void (async () => {
    try {
      setStatus("Preparando informe por personal...");
      renderControlTotalsPanel(await fetchAllFilteredControlRecordsForBulk());
    } catch (error) {
      setStatus(`No se pudo generar el informe por personal: ${error.message}`, "error");
    }
  })();
}

function closeControlTotalsPanel() {
  controlTotalsPanel?.classList.add("hidden");
}

function updateControlPaginationUi(totalItems, visibleItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / controlPageSize));
  const hasItems = totalItems > 0;
  const start = hasItems ? (controlCurrentPage - 1) * controlPageSize + 1 : 0;
  const end = hasItems ? start + visibleItems - 1 : 0;

  controlTotalCount.textContent = String(totalItems);
  if (controlPageCount) {
    controlPageCount.textContent = String(visibleItems);
  }
  controlTotalHours.textContent = controlResultsTruncated
    ? "Acota filtros"
    : formatMinutesAsHours(controlRecordsTotalMinutes);
  controlPaginationSummary.textContent = `Mostrando ${start}-${end} de ${totalItems}`;
  controlPaginationPageIndicator.textContent = `Página ${controlCurrentPage} de ${totalPages}`;
  controlPreviousPageButton.disabled = controlCurrentPage <= 1;
  controlNextPageButton.disabled = controlCurrentPage >= totalPages;
}

// --- Filters ---

function buildControlFilters() {
  return {
    dateFrom: controlDateFromInput.value,
    dateTo: controlDateToInput.value,
    personal: controlPersonalInput.value.trim(),
    centro: controlCentroInput.value.trim(),
    puesto: controlPuestoInput.value.trim(),
  };
}

function applyControlFiltersToQuery(query, filters, options = {}) {
  const { requireDateRange = false } = options;

  if (requireDateRange && !filters.dateFrom && !filters.dateTo) {
    throw new Error("Selecciona al menos una fecha para limitar la operacion.");
  }

  if (filters.dateFrom) {
    query = query.gte("fecha", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("fecha", filters.dateTo);
  }

  if (filters.centro) {
    query = query.eq("centro", filters.centro);
  }

  if (filters.puesto) {
    query = query.eq("puesto", filters.puesto);
  }

  return query;
}

function applyControlPersonalFilterToQuery(query, filters) {
  const personalFilter = String(filters.personal ?? "").trim();
  if (!personalFilter) {
    return query;
  }

  const normalizedFilter = normalizeSearchText(personalFilter);
  const matchingDnis = currentControlPersonnelRows
    .filter((row) => normalizeSearchText(row.personal).includes(normalizedFilter))
    .map((row) => row.dni)
    .filter(Boolean);

  const clauses = [`personal.ilike.%${personalFilter}%`];
  matchingDnis.forEach((dni) => {
    clauses.push(`dni.ilike.%${dni}%`);
  });

  return query.or(clauses.join(","));
}

function getControlServerSortColumns() {
  const direction = currentControlSort.direction === "asc";
  const fallback = [
    { column: "fecha", ascending: false },
    { column: "hora_inicio", ascending: true },
    { column: "id", ascending: true },
  ];
  const columnMap = {
    personal: "personal",
    centro: "centro",
    puesto: "puesto",
    fecha: "fecha",
    hora_inicio: "hora_inicio",
    hora_fin: "hora_fin",
    tipo_jornada: "tipo_jornada",
    observacion: "observacion",
  };
  const primaryColumn = columnMap[currentControlSort.field];

  if (!primaryColumn) {
    return fallback;
  }

  const columns = [{ column: primaryColumn, ascending: direction }];
  fallback.forEach((item) => {
    if (!columns.some((existing) => existing.column === item.column)) {
      columns.push(item);
    }
  });
  return columns;
}

function applyControlSortToQuery(query) {
  return getControlServerSortColumns().reduce(
    (nextQuery, item) => nextQuery.order(item.column, { ascending: item.ascending }),
    query
  );
}

async function fetchControlSummary(filters) {
  controlSummaryRows = [];
  controlRecordsTotalMinutes = 0;

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.rpc("get_control_records_summary", {
    p_date_from: filters.dateFrom || null,
    p_date_to: filters.dateTo || null,
    p_personal: filters.personal || null,
    p_centro: filters.centro || null,
    p_puesto: filters.puesto || null,
  });

  if (error) {
    throw error;
  }

  controlSummaryRows = (data ?? []).map((row) => ({
    personal: String(row.personal ?? "Sin nombre"),
    total_minutes: Number(row.total_minutes) || 0,
    record_count: Number(row.record_count) || 0,
  }));
  controlRecordsTotalMinutes = controlSummaryRows.reduce(
    (total, row) => total + row.total_minutes,
    0
  );
}

async function fetchAllFilteredControlRecordsForBulk() {
  if (!currentSession) {
    return [];
  }

  const filters = buildControlFilters();
  await fetchControlPersonalLookup();
  const supabase = await getSupabaseClient();
  const fetchPageSize = 1000;
  const maxRows = 60000;
  let offset = 0;
  const rows = [];

  while (offset < maxRows) {
    let query = supabase
      .from("registros")
      .select(
        "id, personal, dni, centro, puesto, fecha, hora_inicio, hora_fin, tipo_jornada, observacion, eliminado, control"
      )
      .range(offset, offset + fetchPageSize - 1);
    query = applyControlFiltersToQuery(query, filters);
    query = applyControlPersonalFilterToQuery(query, filters);
    query = applyControlSortToQuery(query);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data?.length) {
      break;
    }

    rows.push(...data.map(enrichControlRecord));
    offset += data.length;

    if (data.length < fetchPageSize) {
      break;
    }
  }

  return currentControlSort.field === "worked_hours" ? sortControlRecords(rows) : rows;
}

function controlRecordMatchesFilters(row, filters, excludedKeys = []) {
  const dateValue = String(row.fecha ?? "");

  if (!excludedKeys.includes("dateFrom") && filters.dateFrom && dateValue < filters.dateFrom) {
    return false;
  }

  if (!excludedKeys.includes("dateTo") && filters.dateTo && dateValue > filters.dateTo) {
    return false;
  }

  if (!excludedKeys.includes("personal") && filters.personal) {
    const value = normalizeSearchText(row.personal_resolved ?? getResolvedControlPersonal(row));
    const filterValue = normalizeSearchText(filters.personal);
    if (!value.includes(filterValue)) {
      return false;
    }
  }

  if (!excludedKeys.includes("centro") && filters.centro) {
    const value = String(row.centro ?? "").trim();
    if (value !== filters.centro) {
      return false;
    }
  }

  if (!excludedKeys.includes("puesto") && filters.puesto) {
    const value = String(row.puesto ?? "").trim();
    if (value !== filters.puesto) {
      return false;
    }
  }

  return true;
}

function renderControlFilterOptions(records = controlFilterSourceRecords) {
  const filters = buildControlFilters();
  const selectedPersonal = controlPersonalInput.value;
  const selectedCentro = controlCentroInput.value;
  const selectedPuesto = controlPuestoInput.value;
  const selectExclusions = ["dateFrom", "dateTo"];

  const fallbackPersonalOptions = records
    .filter((row) => row.is_control_option || controlRecordMatchesFilters(row, filters, ["personal"]))
    .map((row) => String(row.personal_resolved ?? getResolvedControlPersonal(row)).trim())
    .filter(Boolean);
  const personalOptions = sortTextValues(
    Array.from(new Set(fallbackPersonalOptions))
  );
  currentControlPersonalOptions = personalOptions;

  const centroOptions = sortTextValues(
    Array.from(
      new Set(
        records
          .filter((row) =>
            row.is_control_option ||
            controlRecordMatchesFilters(row, filters, [...selectExclusions, "centro"])
          )
          .map((row) => String(row.centro ?? "").trim())
          .filter(Boolean)
      )
    )
  );

  const puestoOptions = sortTextValues(
    Array.from(
      new Set(
        records
          .filter((row) =>
            row.is_control_option ||
            controlRecordMatchesFilters(row, filters, [...selectExclusions, "puesto"])
          )
          .map((row) => String(row.puesto ?? "").trim())
          .filter(Boolean)
      )
    )
  );

  controlCentroInput.innerHTML = ['<option value="">Todos los centros</option>']
    .concat(
      centroOptions.map(
        (value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
      )
    )
    .join("");

  controlPuestoInput.innerHTML = ['<option value="">Todos los puestos</option>']
    .concat(
      puestoOptions.map(
        (value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
      )
    )
    .join("");

  controlPersonalInput.value = selectedPersonal;
  renderControlPersonalSuggestions();

  if (centroOptions.includes(selectedCentro)) {
    controlCentroInput.value = selectedCentro;
  }

  if (puestoOptions.includes(selectedPuesto)) {
    controlPuestoInput.value = selectedPuesto;
  }
}

// --- Export ---

function exportControlRecordsToCsv() {
  void (async () => {
    try {
      setStatus("Preparando CSV de control personal...");
      const rows = await fetchAllFilteredControlRecordsForBulk();
      if (!rows.length) {
        setStatus("No hay registros filtrados de control personal para exportar.", "error");
        return;
      }

      const headers = [
        "Personal",
        "Centro",
        "Puesto",
        "Fecha",
        "Hora inicio",
        "Hora fin",
        "Horas",
        "Tipo jornada",
        "Observación",
      ];

      const lines = [
        headers.map(toCsvValue).join(","),
        ...rows.map((row) =>
          [
            row.personal_resolved || getResolvedControlPersonal(row),
            row.centro,
            row.puesto,
            formatDisplayDate(row.fecha),
            formatHourValue(row.hora_inicio),
            formatHourValue(row.hora_fin),
            calculateWorkedHours(row.hora_inicio, row.hora_fin),
            row.tipo_jornada,
            row.observacion,
          ]
            .map(toCsvValue)
            .join(",")
        ),
      ];

      const blob = new Blob([lines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const dateSuffix = new Date().toISOString().slice(0, 10);
      triggerDownload(blob, `control-personal-${dateSuffix}.csv`);
      setStatus("CSV de control personal exportado correctamente.", "success");
    } catch (error) {
      setStatus(`No se pudo exportar el CSV de control personal: ${error.message}`, "error");
    }
  })();
}

function exportControlRecordsToPdf() {
  void (async () => {
    try {
      setStatus("Preparando PDF de control personal...");
      const rows = await fetchAllFilteredControlRecordsForBulk();
      if (!rows.length) {
        setStatus("No hay registros filtrados de control personal para exportar.", "error");
        return;
      }

      const { jsPDF } = await getJsPdfClient();
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      const bottomMargin = 12;
      const rowLineHeight = 3.8;
      const cellPadding = 1.5;
      const minRowHeight = 7;
      const headerHeight = 9;
      const columns = [
        { label: "Día", key: "dia", width: 10 },
        { label: "Personal", key: "personal", width: 42 },
        { label: "Centro", key: "centro", width: 38 },
        { label: "Puesto", key: "puesto", width: 30 },
        { label: "Fecha", key: "fecha", width: 20 },
        { label: "Inicio", key: "hora_inicio", width: 17 },
        { label: "Fin", key: "hora_fin", width: 17 },
        { label: "Horas", key: "horas", width: 16 },
        { label: "Jornada", key: "tipo_jornada", width: 24 },
        { label: "Observación", key: "observacion", width: 67 },
      ];
      const tableWidth = columns.reduce((total, column) => total + column.width, 0);
      const tableLeft = Math.max(margin, (pageWidth - tableWidth) / 2);
      let y = 14;

      const ensureSpace = (requiredHeight) => {
        if (y + requiredHeight <= pageHeight - bottomMargin) {
          return;
        }

        doc.addPage();
        y = margin;
        drawTableHeader();
      };

      const filters = buildControlFilters();
      const periodFrom = filters.dateFrom ? formatDisplayDate(filters.dateFrom) : "Sin fecha inicial";
      const periodTo = filters.dateTo ? formatDisplayDate(filters.dateTo) : "Sin fecha final";
      const exportedAt = new Date().toLocaleString("es-ES");

      const getRowValue = (row, key) => {
        if (key === "dia") return getControlWeekdayInfo(row.fecha).letter;
        if (key === "personal") return row.personal_resolved || getResolvedControlPersonal(row) || "-";
        if (key === "fecha") return formatDisplayDate(row.fecha) || "-";
        if (key === "hora_inicio") return formatHourValue(row.hora_inicio) || "-";
        if (key === "hora_fin") return formatHourValue(row.hora_fin) || "-";
        if (key === "horas") return calculateWorkedHours(row.hora_inicio, row.hora_fin) || "-";
        return row[key] || "-";
      };

      function drawTableHeader() {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);

        let x = tableLeft;
        columns.forEach((column) => {
          doc.setFillColor(225, 225, 225);
          doc.setDrawColor(120, 120, 120);
          doc.rect(x, y, column.width, headerHeight, "F");
          doc.rect(x, y, column.width, headerHeight, "S");
          doc.setTextColor(0, 0, 0);
          const headerLines = doc.splitTextToSize(column.label, column.width - cellPadding * 2);
          headerLines.slice(0, 2).forEach((line, lineIndex) => {
            doc.text(line, x + cellPadding, y + 4 + lineIndex * 3.2);
          });
          x += column.width;
        });
        doc.setTextColor(0, 31, 84);
        y += headerHeight;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("Control personal", margin, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Periodo evaluado: ${periodFrom} - ${periodTo}`, margin, y);
      y += 5;
      doc.text(`Generado: ${exportedAt}`, margin, y);
      y += 7;

      rows.forEach((row, index) => {
        if (index === 0) {
          drawTableHeader();
        }

        const cellLines = columns.map((column) =>
          doc.splitTextToSize(String(getRowValue(row, column.key)), column.width - cellPadding * 2)
        );
        const rowHeight = Math.max(
          minRowHeight,
          ...cellLines.map((lines) => lines.length * rowLineHeight + cellPadding * 2)
        );

        ensureSpace(rowHeight);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setDrawColor(210, 219, 231);

        let x = tableLeft;
        columns.forEach((column, columnIndex) => {
          doc.rect(x, y, column.width, rowHeight);
          if (column.key === "dia") {
            const weekday = getControlWeekdayInfo(row.fecha);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(weekday.color);
            doc.text(weekday.letter, x + column.width / 2, y + 4.5, {
              align: "center",
            });
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 31, 84);
            x += column.width;
            return;
          }

          doc.text(cellLines[columnIndex], x + cellPadding, y + 4.5, {
            maxWidth: column.width - cellPadding * 2,
          });
          x += column.width;
        });
        y += rowHeight;
      });

      const totalMinutes = rows.reduce((total, row) => {
        return total + calculateWorkedMinutes(row.hora_inicio, row.hora_fin);
      }, 0);
      ensureSpace(18);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Resumen", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`Numero de registros: ${rows.length}`, margin, y);
      y += 5;
      doc.text(`Suma de horas: ${formatMinutesAsHours(totalMinutes)}`, margin, y);

      const dateSuffix = new Date().toISOString().slice(0, 10);
      doc.save(`control-personal-${dateSuffix}.pdf`);
      setStatus("PDF de control personal generado correctamente.", "success");
    } catch (error) {
      setStatus(
        `No se pudo generar el PDF de control personal: ${error?.message ?? "error desconocido"}`,
        "error"
      );
    }
  })();
}

// --- Import ---

function clearControlImportPreview() {
  pendingControlImport = null;
  filteredControlImportRecords = [];
  controlImportPreviewCard?.classList.add("hidden");
  controlImportPreviewFilters?.reset();

  if (controlImportPreviewTitle) {
    controlImportPreviewTitle.textContent = "Registros detectados";
  }
  if (controlImportPreviewFile) {
    controlImportPreviewFile.textContent = "-";
  }
  if (controlImportPreviewCount) {
    controlImportPreviewCount.textContent = "0 filtrados";
  }
  if (controlImportPreviewDateFrom) {
    controlImportPreviewDateFrom.textContent = "-";
  }
  if (controlImportPreviewDateTo) {
    controlImportPreviewDateTo.textContent = "-";
  }
  if (controlImportPreviewTableBody) {
    controlImportPreviewTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Procesa un CSV para revisar los registros.</td>
      </tr>
    `;
  }
}

function openControlImportPanel() {
  controlImportPanel?.classList.remove("hidden");
}

function closeControlImportPanel() {
  controlImportPanel?.classList.add("hidden");
  controlImportForm?.reset();
  clearControlImportPreview();
}

function populateControlImportPreviewFilters(records) {
  if (!controlImportPreviewDate || !controlImportPreviewCentro) {
    return;
  }

  const selectedDate = controlImportPreviewDate.value;
  const selectedCentro = controlImportPreviewCentro.value;
  const dates = Array.from(new Set(records.map((row) => row.fecha).filter(Boolean))).sort();
  const centros = Array.from(new Set(records.map((row) => row.centro).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );

  controlImportPreviewDate.innerHTML = `<option value="">Todas las fechas</option>${dates
    .map((date) => `<option value="${escapeHtml(date)}">${escapeHtml(formatDisplayDate(date))}</option>`)
    .join("")}`;
  controlImportPreviewCentro.innerHTML = `<option value="">Todos los centros</option>${centros
    .map((centro) => `<option value="${escapeHtml(centro)}">${escapeHtml(centro)}</option>`)
    .join("")}`;

  if (dates.includes(selectedDate)) {
    controlImportPreviewDate.value = selectedDate;
  }
  if (centros.includes(selectedCentro)) {
    controlImportPreviewCentro.value = selectedCentro;
  }
}

function getFilteredControlImportRecords() {
  const records = pendingControlImport?.records ?? [];
  const selectedDate = controlImportPreviewDate?.value ?? "";
  const selectedCentro = controlImportPreviewCentro?.value ?? "";

  return records.filter((row) => {
    if (selectedDate && row.fecha !== selectedDate) {
      return false;
    }
    if (selectedCentro && row.centro !== selectedCentro) {
      return false;
    }
    return true;
  });
}

function applyControlImportPreviewFilters() {
  if (!pendingControlImport || !controlImportPreviewTableBody || !controlImportPreviewCount) {
    return;
  }

  filteredControlImportRecords = getFilteredControlImportRecords();
  controlImportPreviewCount.textContent = `${filteredControlImportRecords.length} filtrados`;

  if (!filteredControlImportRecords.length) {
    controlImportPreviewTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No hay registros para los filtros seleccionados.</td>
      </tr>
    `;
    return;
  }

  const sampleRows = filteredControlImportRecords.slice(0, 25);
  controlImportPreviewTableBody.innerHTML = sampleRows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.personal || "")}</td>
          <td>${escapeHtml(row.centro || "")}</td>
          <td>${escapeHtml(row.puesto || "")}</td>
          <td>${escapeHtml(formatDisplayDate(row.fecha))}</td>
          <td>${escapeHtml(formatHourValue(row.hora_inicio))}</td>
          <td>${escapeHtml(formatHourValue(row.hora_fin))}</td>
        </tr>
      `
    )
    .join("");
}

function renderControlImportPreview(preview) {
  if (!preview || !controlImportPreviewCard) {
    clearControlImportPreview();
    return;
  }

  controlImportPreviewCard.classList.remove("hidden");
  controlImportPreviewTitle.textContent = "Registros detectados";
  controlImportPreviewFile.textContent = preview.fileName || "-";
  controlImportPreviewDateFrom.textContent = preview.minDate
    ? formatDisplayDate(preview.minDate)
    : "-";
  controlImportPreviewDateTo.textContent = preview.maxDate
    ? formatDisplayDate(preview.maxDate)
    : "-";

  populateControlImportPreviewFilters(preview.records);
  applyControlImportPreviewFilters();
}

function mapImportedControlRow(row, headers, options = {}) {
  const source = {};
  headers.forEach((header, index) => {
    source[header] = row[index] ?? "";
  });

  const rawIdValue = String(source.id ?? "").trim();
  const idValue = rawIdValue ? Number(rawIdValue) : null;
  if (!Number.isFinite(idValue) && !options.allowMissingId) {
    return null;
  }

  return {
    id: Number.isFinite(idValue) ? idValue : null,
    personal: String(source.personal ?? "").trim(),
    dni: String(source.dni ?? "").trim(),
    centro: String(source.centro ?? "").trim(),
    puesto: String(source.puesto ?? "").trim(),
    fecha: normalizeImportedDate(source.fecha),
    hora_inicio: normalizeImportedTime(source.hora_inicio),
    hora_fin: normalizeImportedTime(source.hora_fin),
    tipo_jornada: String(source.tipo_jornada ?? "").trim() || null,
    observacion: String(source.observacion ?? "").trim() || null,
    eliminado: source.eliminado === undefined ? false : normalizeImportedBoolean(source.eliminado),
    control:
      normalizeImportedTimestamp(source.control) ||
      new Date().toISOString().slice(0, 19),
  };
}

function getControlImportRowsAndHeaders(rows, headerAliases) {
  const normalizedHeaders = rows[0].map((value) => headerAliases[normalizeCsvHeader(value)] || "");
  const recognizedHeaderCount = normalizedHeaders.filter(Boolean).length;

  if (recognizedHeaderCount >= 4 && normalizedHeaders.includes("fecha")) {
    return {
      dataRows: rows.slice(1),
      headers: normalizedHeaders,
      requiresExistingId: normalizedHeaders.includes("id"),
      sourceFormat: "registros",
    };
  }

  return {
    dataRows: rows,
    headers: CONTROL_HORARIO_HEADERS,
    requiresExistingId: false,
    sourceFormat: "control_horario",
  };
}

async function prepareControlImportFromCsv(file) {
  if (!file) {
    return;
  }

  const text = await file.text();
  const rows = parseCsvText(text, detectCsvDelimiter(text));

  if (rows.length < 1) {
    setStatus("El CSV no contiene filas suficientes para importar registros.", "error");
    return;
  }

  const headerAliases = {
    id: "id",
    personal: "personal",
    dni: "dni",
    centro: "centro",
    puesto: "puesto",
    fecha: "fecha",
    dia: "fecha",
    date: "fecha",
    hora_inicio: "hora_inicio",
    hora_de_inicio: "hora_inicio",
    inicio: "hora_inicio",
    hora_entrada: "hora_inicio",
    hora_de_entrada: "hora_inicio",
    entrada: "hora_inicio",
    desde: "hora_inicio",
    hora_fin: "hora_fin",
    hora_de_fin: "hora_fin",
    fin: "hora_fin",
    hora_salida: "hora_fin",
    hora_de_salida: "hora_fin",
    salida: "hora_fin",
    hasta: "hora_fin",
    tipo_jornada: "tipo_jornada",
    tipo_de_jornada: "tipo_jornada",
    jornada: "tipo_jornada",
    tipo: "tipo_jornada",
    observacion: "observacion",
    observaciones: "observacion",
    nota: "observacion",
    notas: "observacion",
    eliminado: "eliminado",
    control: "control",
    contriol: "control",
    nombre: "personal",
    nombres: "personal",
    nombre_apellidos: "personal",
    nombre_y_apellidos: "personal",
    empleado: "personal",
    usuario: "personal",
    trabajador: "personal",
    persona: "personal",
    nif: "dni",
    documento: "dni",
  };

  const importShape = getControlImportRowsAndHeaders(rows, headerAliases);
  const normalizedHeaders = importShape.headers;
  const requiredHeaders = ["id", "personal", "dni", "centro", "puesto", "fecha", "hora_inicio"];
  const effectiveRequiredHeaders = importShape.requiresExistingId
    ? requiredHeaders
    : requiredHeaders.filter((header) => header !== "id");
  const missingHeaders = effectiveRequiredHeaders.filter((header) => !normalizedHeaders.includes(header));

  if (missingHeaders.length) {
    clearControlImportPreview();
    setStatus(
      `El CSV no tiene las columnas obligatorias: ${missingHeaders.join(", ")}.`,
      "error"
    );
    return;
  }

  const records = rows
    .slice(importShape.sourceFormat === "registros" ? 1 : 0)
    .map((row) =>
      mapImportedControlRow(row, normalizedHeaders, {
        allowMissingId: !importShape.requiresExistingId,
      })
    )
    .filter((row) => {
      return (
        row &&
        row.personal &&
        row.dni &&
        row.centro &&
        row.puesto &&
        row.fecha &&
        row.hora_inicio
      );
    });

  if (!records.length) {
    clearControlImportPreview();
    setStatus("No se han encontrado registros validos en el CSV.", "error");
    return;
  }

  const sortedDates = records
    .map((row) => row.fecha)
    .filter(Boolean)
    .sort((left, right) => String(left).localeCompare(String(right), "es"));

  pendingControlImport = {
    fileName: file.name,
    records,
    needsIdAssignment: !importShape.requiresExistingId,
    minDate: sortedDates[0] || "",
    maxDate: sortedDates[sortedDates.length - 1] || "",
  };

  renderControlImportPreview(pendingControlImport);
  setStatus(
    `Vista previa lista. Registros válidos detectados: ${records.length}.`,
    "success"
  );
}

async function importPreparedControlRecords() {
  if (!pendingControlImport?.records?.length) {
    setStatus("No hay ninguna importacion pendiente para procesar.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const batchSize = 500;
  const records = filteredControlImportRecords.length
    ? filteredControlImportRecords
    : getFilteredControlImportRecords();

  if (!records.length) {
    setStatus("No hay registros en la vista previa filtrada para importar.", "error");
    return;
  }

  if (pendingControlImport.needsIdAssignment) {
    const { data, error } = await supabase
      .from("registros")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      setStatus(`No se pudo calcular el siguiente id para importar: ${error.message}`, "error");
      return;
    }

    let nextId = Number(data?.[0]?.id ?? 0) + 1;
    records.forEach((record) => {
      if (!record.id) {
        record.id = nextId;
        nextId += 1;
      }
    });
  }

  for (let index = 0; index < records.length; index += batchSize) {
    const chunk = records.slice(index, index + batchSize);
    const { error } = await supabase.from("registros").upsert(chunk, {
      onConflict: "id",
    });

    if (error) {
      setStatus(`No se pudo importar el CSV: ${error.message}`, "error");
      return;
    }
  }

  await fetchControlFilterOptions();
  await fetchControlRecords();
  clearControlImportPreview();
  setStatus(`CSV importado correctamente. Registros procesados: ${records.length}.`, "success");
}

// --- Selection & delete ---

function syncControlDeleteSelectionUi() {
  const selectedCount = selectedControlDeleteIds.size;
  const visibleIds = currentControlRecords.map((row) => String(row.id));
  const selectedVisibleCount = visibleIds.filter((id) => selectedControlDeleteIds.has(id)).length;

  controlSelectHeader?.classList.toggle("hidden", !controlSelectiveDeleteMode);
  controlEnableSelectiveDeleteButton?.classList.toggle("hidden", controlSelectiveDeleteMode);
  controlCancelSelectiveDeleteButton?.classList.toggle("hidden", !controlSelectiveDeleteMode);

  if (controlDeleteSelectedButton) {
    controlDeleteSelectedButton.disabled = !controlSelectiveDeleteMode || selectedCount === 0;
  }

  if (controlSelectedDeleteCount) {
    controlSelectedDeleteCount.textContent = `${selectedCount} seleccionado${
      selectedCount === 1 ? "" : "s"
    }`;
    controlSelectedDeleteCount.classList.toggle("hidden", !controlSelectiveDeleteMode);
  }

  if (controlSelectPageCheckbox) {
    controlSelectPageCheckbox.checked =
      Boolean(visibleIds.length) && selectedVisibleCount === visibleIds.length;
    controlSelectPageCheckbox.indeterminate =
      selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
    controlSelectPageCheckbox.disabled = !controlSelectiveDeleteMode || !visibleIds.length;
  }
}

function setControlSelectiveDeleteMode(isEnabled) {
  controlSelectiveDeleteMode = isEnabled;
  if (!isEnabled) {
    selectedControlDeleteIds.clear();
  }

  renderControlRecords(currentControlRecords);
}

function toggleCurrentControlPageSelection(isSelected) {
  currentControlRecords.forEach((row) => {
    const id = String(row.id);
    if (isSelected) {
      selectedControlDeleteIds.add(id);
    } else {
      selectedControlDeleteIds.delete(id);
    }
  });

  renderControlRecords(currentControlRecords);
}

function handleControlRecordSelection(recordId, isSelected) {
  const id = String(recordId ?? "").trim();
  if (!id) {
    return;
  }

  if (isSelected) {
    selectedControlDeleteIds.add(id);
  } else {
    selectedControlDeleteIds.delete(id);
  }

  syncControlDeleteSelectionUi();
}

async function deleteSelectedControlRecords() {
  if (!currentSession) {
    setStatus("Necesitas iniciar sesión para borrar registros.", "error");
    return;
  }

  const ids = [...selectedControlDeleteIds]
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (!ids.length) {
    setStatus("Selecciona al menos un registro para borrar.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Vas a borrar ${ids.length} registro${ids.length === 1 ? "" : "s"} seleccionado${
      ids.length === 1 ? "" : "s"
    }. Esta accion no se puede deshacer.`
  );
  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("registros").delete().in("id", ids);
  if (error) {
    setStatus(`No se pudieron borrar los registros seleccionados: ${error.message}`, "error");
    return;
  }

  selectedControlDeleteIds.clear();
  controlSelectiveDeleteMode = false;
  await fetchControlFilterOptions();
  await fetchControlRecords();
  setStatus(`Registros seleccionados borrados correctamente: ${ids.length}.`, "success");
}

async function deleteFilteredControlRecords() {
  if (!currentSession) {
    setStatus("Necesitas iniciar sesión para borrar registros.", "error");
    return;
  }

  const filters = buildControlFilters();
  let countQuery = null;
  let deleteQuery = null;

  try {
    const supabase = await getSupabaseClient();
    countQuery = applyControlFiltersToQuery(
      supabase.from("registros").select("id", { count: "exact", head: true }),
      filters,
      { requireDateRange: true }
    );
    deleteQuery = applyControlFiltersToQuery(
      supabase.from("registros").delete(),
      filters,
      { requireDateRange: true }
    );
  } catch (error) {
    setStatus(error.message, "error");
    return;
  }

  const { count, error: countError } = await countQuery;
  if (countError) {
    setStatus(`No se pudo calcular el intervalo a borrar: ${countError.message}`, "error");
    return;
  }

  if (!count) {
    setStatus("No hay registros dentro del intervalo indicado para borrar.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Vas a borrar ${count} registros de registros con los filtros actuales. Esta accion no se puede deshacer.`
  );
  if (!confirmed) {
    return;
  }

  const { error } = await deleteQuery;
  if (error) {
    setStatus(`No se pudieron borrar los registros: ${error.message}`, "error");
    return;
  }

  await fetchControlFilterOptions();
  await fetchControlRecords();
  setStatus(`Registros borrados correctamente: ${count}.`, "success");
}

// --- Detail panel ---

function findControlRecordById(recordId) {
  const normalizedId = Number(recordId);
  return filteredControlRecords.find((row) => Number(row.id) === normalizedId)
    ?? currentControlRecords.find((row) => Number(row.id) === normalizedId)
    ?? null;
}

function getUniqueControlValues(field, currentValue = "") {
  const values = controlFilterSourceRecords
    .map((row) => {
      if (field === "personal") {
        return String(row.personal_resolved ?? getResolvedControlPersonal(row)).trim();
      }

      return String(row[field] ?? "").trim();
    })
    .filter(Boolean);

  if (currentValue) {
    values.push(String(currentValue).trim());
  }

  return sortTextValues(Array.from(new Set(values)));
}

function populateSelectOptions(selectElement, values, selectedValue) {
  selectElement.innerHTML = values
    .map(
      (value) =>
        `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(value)}</option>`
    )
    .join("");
}

async function openControlDetail(recordId) {
  if (!controlFilterSourceRecords.length) {
    await fetchControlFilterOptions();
  }

  const row = findControlRecordById(recordId);
  if (!row) {
    setStatus("No se encontró el registro de control personal.", "error");
    return;
  }

  const personal = row.personal_resolved || row.personal || "";
  const centro = row.centro || "";
  const puesto = row.puesto || "";

  controlDetailIdInput.value = row.id;
  populateSelectOptions(controlDetailPersonalInput, getUniqueControlValues("personal", personal), personal);
  controlDetailDniInput.value = row.dni || "";
  populateSelectOptions(controlDetailCentroInput, getUniqueControlValues("centro", centro), centro);
  populateSelectOptions(controlDetailPuestoInput, getUniqueControlValues("puesto", puesto), puesto);
  controlDetailFechaInput.value = normalizeImportedDate(row.fecha) || "";
  controlDetailHoraInicioInput.value = formatHourValue(row.hora_inicio).slice(0, 5);
  controlDetailHoraFinInput.value = formatHourValue(row.hora_fin).slice(0, 5);
  controlDetailTipoJornadaInput.value = row.tipo_jornada || "";
  controlDetailObservacionInput.value = row.observacion || "";
  markFormPristine(controlDetailForm);
  controlDetailPanel?.classList.remove("hidden");
}

function closeControlDetail(options = {}) {
  if (!options.force && !confirmDiscardFormChanges(controlDetailForm)) {
    return false;
  }

  controlDetailPanel?.classList.add("hidden");
  controlDetailForm?.reset();
  if (controlDetailIdInput) {
    controlDetailIdInput.value = "";
  }
  markFormPristine(controlDetailForm);
  return true;
}

async function saveControlDetail(event) {
  event.preventDefault();

  if (!currentSession) {
    setStatus("Necesitas iniciar sesión para editar registros.", "error");
    return;
  }

  const recordId = controlDetailIdInput.value;
  const row = findControlRecordById(recordId);
  if (!row) {
    setStatus("No se encontró el registro de control personal.", "error");
    return;
  }

  const personal = controlDetailPersonalInput.value.trim();
  const dni = controlDetailDniInput.value.trim();
  const centro = controlDetailCentroInput.value.trim();
  const puesto = controlDetailPuestoInput.value.trim();
  const fecha = normalizeImportedDate(controlDetailFechaInput.value);
  const horaInicio = normalizeImportedTime(controlDetailHoraInicioInput.value);
  const horaFin = normalizeImportedTime(controlDetailHoraFinInput.value);
  const tipoJornada = controlDetailTipoJornadaInput.value.trim();
  const observacion = controlDetailObservacionInput.value.trim();

  if (!personal || !dni || !centro || !puesto || !fecha || !horaInicio) {
    setStatus("Personal, DNI, centro, puesto, fecha y hora inicio son obligatorios.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("registros")
    .update({
      personal,
      dni,
      centro,
      puesto,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin || null,
      tipo_jornada: tipoJornada || null,
      observacion: observacion || null,
    })
    .eq("id", row.id);

  if (error) {
    setStatus(`No se pudo actualizar el registro: ${error.message}`, "error");
    return;
  }

  await fetchControlFilterOptions();
  await fetchControlRecords();
  closeControlDetail({ force: true });
  setStatus("Registro actualizado correctamente.", "success");
}

async function deleteControlRecord(recordId) {
  if (!currentSession) {
    setStatus("Necesitas iniciar sesión para borrar registros.", "error");
    return;
  }

  const row = findControlRecordById(recordId);
  if (!row) {
    setStatus("No se encontró el registro de control personal.", "error");
    return;
  }

  const person = row.personal_resolved || row.personal || "Sin nombre";
  const confirmed = window.confirm(
    `Vas a borrar el registro de ${person} del ${formatDisplayDate(row.fecha)}. Esta accion no se puede deshacer.`
  );
  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("registros").delete().eq("id", row.id);

  if (error) {
    setStatus(`No se pudo borrar el registro: ${error.message}`, "error");
    return;
  }

  await fetchControlFilterOptions();
  await fetchControlRecords();
  closeControlDetail({ force: true });
  setStatus("Registro borrado correctamente.", "success");
}

// --- Main fetch functions ---

async function fetchControlRecords() {
  const requestId = ++controlRecordsFetchRequestId;
  if (!currentSession) {
    currentControlRecords = [];
    filteredControlRecords = [];
    controlSummaryRows = [];
    controlRecordsTotalCount = 0;
    controlRecordsTotalMinutes = 0;
    controlResultsTruncated = false;
    renderControlRecords([]);
    renderControlSummary([]);
    updateControlPaginationUi(0, 0);
    return [];
  }

  const filters = buildControlFilters();
  await fetchControlPersonalLookup();
  const supabase = await getSupabaseClient();
  const from = (controlCurrentPage - 1) * controlPageSize;
  const to = from + controlPageSize - 1;
  let query = supabase
    .from("registros")
    .select(
      "id, personal, dni, centro, puesto, fecha, hora_inicio, hora_fin, tipo_jornada, observacion, eliminado, control",
      { count: "exact" }
    )
    .range(from, to);
  query = applyControlFiltersToQuery(query, filters);
  query = applyControlPersonalFilterToQuery(query, filters);
  query = applyControlSortToQuery(query);

  const [{ data, error, count }, summaryResult] = await Promise.all([
    query,
    fetchControlSummary(filters).then(
      () => ({ ok: true }),
      (summaryError) => ({ ok: false, error: summaryError })
    ),
  ]);

  if (error) {
    if (requestId !== controlRecordsFetchRequestId) {
      return currentControlRecords;
    }
    setStatus(`No se pudieron cargar los registros de personal: ${error.message}`, "error");
    return [];
  }

  if (requestId !== controlRecordsFetchRequestId) {
    return currentControlRecords;
  }

  const records = (data ?? []).map(enrichControlRecord);
  currentControlRecords =
    currentControlSort.field === "worked_hours" ? sortControlRecords(records) : records;
  filteredControlRecords = currentControlRecords;
  if (controlSelectiveDeleteMode) {
    const filteredIds = new Set(currentControlRecords.map((row) => String(row.id)));
    selectedControlDeleteIds = new Set(
      [...selectedControlDeleteIds].filter((id) => filteredIds.has(id))
    );
  }
  controlRecordsTotalCount = count ?? currentControlRecords.length ?? 0;
  controlResultsTruncated = !summaryResult.ok;
  controlCurrentPage = Math.min(
    Math.max(controlCurrentPage, 1),
    Math.max(1, Math.ceil(controlRecordsTotalCount / controlPageSize))
  );
  if (!summaryResult.ok) {
    controlRecordsTotalMinutes = currentControlRecords.reduce((total, row) => {
      return total + calculateWorkedMinutes(row.hora_inicio, row.hora_fin);
    }, 0);
  }
  renderControlRecords(currentControlRecords);
  renderControlSummary(
    currentControlRecords,
    controlResultsTruncated
      ? `Resumen completo pendiente de instalar en Supabase. Mostrando solo la pagina actual.`
      : undefined
  );
  updateControlPaginationUi(controlRecordsTotalCount, currentControlRecords.length);
  if (controlResultsTruncated) {
    setStatus(
      `Listado paginado cargado. Ejecuta la funcion get_control_records_summary en Supabase para ver totales completos.`,
      "error"
    );
  }
  return currentControlRecords;
}

async function fetchControlFilterOptions() {
  const requestId = ++controlFilterOptionsRequestId;
  if (!currentSession) {
    controlFilterSourceRecords = [];
    renderControlFilterOptions([]);
    return [];
  }

  await fetchControlPersonalLookup();
  const supabase = await getSupabaseClient();
  const filters = buildControlFilters();
  try {
    const { data, error } = await supabase.rpc("get_control_filter_options", {
      p_date_from: filters.dateFrom || null,
      p_date_to: filters.dateTo || null,
      p_personal: filters.personal || null,
      p_centro: filters.centro || null,
      p_puesto: filters.puesto || null,
    });

    if (error) {
      throw error;
    }

    if (requestId !== controlFilterOptionsRequestId) {
      return controlFilterSourceRecords;
    }

    const records = (data ?? []).map((row) => {
      const value = String(row.option_value ?? "").trim();
      if (row.option_type === "personal") {
        return { personal: value, personal_resolved: value, dni: "", centro: "", puesto: "", fecha: "", is_control_option: true };
      }
      if (row.option_type === "centro") {
        return { personal: "", personal_resolved: "", dni: "", centro: value, puesto: "", fecha: "", is_control_option: true };
      }
      if (row.option_type === "puesto") {
        return { personal: "", personal_resolved: "", dni: "", centro: "", puesto: value, fecha: "", is_control_option: true };
      }
      return { personal: "", personal_resolved: "", dni: "", centro: "", puesto: "", fecha: "", is_control_option: true };
    });
    controlFilterSourceRecords = records;
    renderControlFilterOptions(records);
    return records;
  } catch (_error) {
    // Fallback for deployments where the optimized RPC has not been installed yet.
  }

  const fetchPageSize = 1000;
  const maxRows = 60000;
  let offset = 0;
  const rows = [];

  while (offset < maxRows) {
    let query = supabase
        .from("registros")
        .select("id, personal, dni, centro, puesto, fecha")
        .order("id", { ascending: true })
        .range(offset, offset + fetchPageSize - 1);
    query = applyControlFiltersToQuery(query, filters);

    const { data, error } = await query;

    if (error) {
      if (requestId !== controlFilterOptionsRequestId) {
        return controlFilterSourceRecords;
      }
      setStatus(`No se pudieron cargar los filtros de control personal: ${error.message}`, "error");
      controlFilterSourceRecords = [];
      renderControlFilterOptions([]);
      return [];
    }

    if (!data?.length) {
      break;
    }

    rows.push(...data);
    offset += data.length;
  }

  const records = rows.map(enrichControlRecord);
  if (requestId !== controlFilterOptionsRequestId) {
    return controlFilterSourceRecords;
  }
  controlFilterSourceRecords = records;
  renderControlFilterOptions(records);
  return records;
}

async function fetchControlPersonalLookup() {
  if (!currentSession) {
    currentPersonalByDni = new Map();
    currentControlPersonnelRows = [];
    currentAllControlPersonnel = [];
    invalidateControlLookupCaches();
    return currentPersonalByDni;
  }

  if (controlPersonalLookupLoaded) {
    return currentPersonalByDni;
  }

  if (controlPersonalLookupPromise) {
    return controlPersonalLookupPromise;
  }

  controlPersonalLookupPromise = (async () => {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("personal").select("dni, personal").limit(10000);

    if (error) {
      setStatus(`No se pudo cargar la tabla de personal: ${error.message}`, "error");
      currentPersonalByDni = new Map();
      currentControlPersonnelRows = [];
      currentAllControlPersonnel = [];
      return currentPersonalByDni;
    }

    const normalizedRows = (data ?? [])
      .map((row) => ({
        dni: normalizeControlDni(row.dni),
        personal: String(row.personal ?? "").trim(),
      }))
      .filter((row) => row.personal);

    currentControlPersonnelRows = normalizedRows;
    currentPersonalByDni = new Map(
      normalizedRows
        .filter((row) => row.dni)
        .map((row) => [row.dni, row.personal])
    );
    currentAllControlPersonnel = sortTextValues(
      Array.from(new Set(normalizedRows.map((row) => row.personal)))
    );
    controlPersonalLookupLoaded = true;
    return currentPersonalByDni;
  })();

  try {
    return await controlPersonalLookupPromise;
  } finally {
    controlPersonalLookupPromise = null;
  }
}

// --- Pagination + filter handlers ---

function clearControlFilters() {
  controlFiltersForm.reset();
  controlDateFromInput.value = "";
  controlDateToInput.value = "";
  controlPersonalInput.value = "";
  controlCentroInput.value = "";
  controlPuestoInput.value = "";
  controlCurrentPage = 1;
  controlPersonalSuggestions?.classList.add("hidden");
  void fetchControlFilterOptions().then(() => fetchControlRecords());
}

function resetSingleControlFilter(filterName) {
  const fieldMap = {
    date_from: controlDateFromInput,
    date_to: controlDateToInput,
    personal: controlPersonalInput,
    centro: controlCentroInput,
    puesto: controlPuestoInput,
  };

  const field = fieldMap[filterName];
  if (!field) {
    return;
  }

  field.value = "";
  controlCurrentPage = 1;
  if (filterName === "personal") {
    controlPersonalSuggestions?.classList.add("hidden");
    renderControlPersonalSuggestions();
    void fetchControlRecords();
    return;
  }

  void fetchControlFilterOptions().then(() => fetchControlRecords());
}

function goToPreviousControlPage() {
  if (controlCurrentPage <= 1) {
    return;
  }

  controlCurrentPage -= 1;
  void fetchControlRecords();
}

function goToNextControlPage() {
  const totalPages = Math.max(1, Math.ceil(controlRecordsTotalCount / controlPageSize));
  if (controlCurrentPage >= totalPages) {
    return;
  }

  controlCurrentPage += 1;
  void fetchControlRecords();
}

function handleControlPageSizeChange() {
  const nextPageSize = Number(controlPageSizeSelect.value);
  if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) {
    return;
  }

  controlPageSize = nextPageSize;
  controlCurrentPage = 1;
  void fetchControlRecords();
}

function initControlFilters() {
  if (!controlFiltersForm) {
    return;
  }

  clearControlImportPreview();
  controlFiltersForm.reset();
  controlDateFromInput.value = "";
  controlDateToInput.value = "";
  controlPersonalInput.value = "";
  controlCentroInput.value = "";
  controlPuestoInput.value = "";
  controlCurrentPage = 1;
}
