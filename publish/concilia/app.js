(function () {
  const INITIAL_AUTH_URL_TYPE = (() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return searchParams.get("type") || hashParams.get("type") || "";
  })();

  const config = window.APP_CONFIG ?? {};
  const supabaseConfig = config.supabase ?? {};
  const hasSupabaseConfig = Boolean(supabaseConfig.url) && Boolean(supabaseConfig.anonKey);

  const authView = document.querySelector("#auth-view");
  const appView = document.querySelector("#app-view");
  const loginForm = document.querySelector("#login-form");
  const passwordSetupForm = document.querySelector("#password-setup-form");
  const logoutButton = document.querySelector("#logout-button");
  const statusMessage = document.querySelector("#status-message");
  const sessionSummary = document.querySelector("#session-summary");
  const studentsFiltersForm = document.querySelector("#students-filters-form");
  const filterCentro = document.querySelector("#filter-centro");
  const filterSemana = document.querySelector("#filter-semana");
  const filterAlumnado = document.querySelector("#filter-alumnado");
  const clearStudentsFiltersButton = document.querySelector("#clear-students-filters-button");
  const studentsRefreshButton = document.querySelector("#students-refresh-button");
  const studentsSummary = document.querySelector("#students-summary");
  const studentsTableBody = document.querySelector("#students-table-body");
  const studentsPaginationSummary = document.querySelector("#students-pagination-summary");
  const studentsPageSize = document.querySelector("#students-page-size");
  const studentsPreviousPage = document.querySelector("#students-previous-page");
  const studentsNextPage = document.querySelector("#students-next-page");
  const weeklySummary = document.querySelector("#weekly-summary");
  const weeklySummaryTableBody = document.querySelector("#weekly-summary-table-body");
  const attendanceSummary = document.querySelector("#attendance-summary");
  const attendanceCenterFilter = document.querySelector("#attendance-center-filter");
  const attendanceTableBody = document.querySelector("#attendance-table-body");
  const attendancePaginationSummary = document.querySelector("#attendance-pagination-summary");
  const attendancePageSize = document.querySelector("#attendance-page-size");
  const attendancePreviousPage = document.querySelector("#attendance-previous-page");
  const attendanceNextPage = document.querySelector("#attendance-next-page");
  const neeFiltersForm = document.querySelector("#nee-filters-form");
  const filterNeeAlumnado = document.querySelector("#filter-nee-alumnado");
  const clearNeeFilterButton = document.querySelector("#clear-nee-filter-button");
  const neeSummary = document.querySelector("#nee-summary");
  const neeTableBody = document.querySelector("#nee-table-body");
  const neePaginationSummary = document.querySelector("#nee-pagination-summary");
  const neePageSize = document.querySelector("#nee-page-size");
  const neePreviousPage = document.querySelector("#nee-previous-page");
  const neeNextPage = document.querySelector("#nee-next-page");
  const activitiesSummary = document.querySelector("#activities-summary");
  const activityForm = document.querySelector("#activity-form");
  const activityPersonal = document.querySelector("#activity-personal");
  const activityContrato = document.querySelector("#activity-contrato");
  const activityEmpresa = document.querySelector("#activity-empresa");
  const activityInstalacion = document.querySelector("#activity-instalacion");
  const activityPuesto = document.querySelector("#activity-puesto");
  const activitySituacion = document.querySelector("#activity-situacion");
  const activityTipoHora = document.querySelector("#activity-tipo-hora");
  const clearActivityFormButton = document.querySelector("#clear-activity-form-button");
  const openActivityPanelButton = document.querySelector("#open-activity-panel-button");
  const closeActivityPanelButton = document.querySelector("#close-activity-panel-button");
  const activityCreatePanel = document.querySelector("#activity-create-panel");
  const activityPanelBackdrop = document.querySelector("#activity-panel-backdrop");
  const openActivitiesSettingsButton = document.querySelector("#open-activities-settings-button");
  const closeActivitiesSettingsButton = document.querySelector("#close-activities-settings-button");
  const activitiesSettingsPanel = document.querySelector("#activities-settings-panel");
  const activitiesSettingsBackdrop = document.querySelector("#activities-settings-backdrop");
  const activitySettingsPersonalFilter = document.querySelector("#activity-settings-personal-filter");
  const activityPersonalAvailableSelect = document.querySelector("#activity-personal-available-select");
  const activityPersonalSelectedSelect = document.querySelector("#activity-personal-selected-select");
  const activityPersonalAddButton = document.querySelector("#activity-personal-add-button");
  const activityPersonalRemoveButton = document.querySelector("#activity-personal-remove-button");
  const activitySettingsInstallationFilter = document.querySelector(
    "#activity-settings-installation-filter"
  );
  const activityInstallationAvailableSelect = document.querySelector(
    "#activity-installation-available-select"
  );
  const activityInstallationSelectedSelect = document.querySelector(
    "#activity-installation-selected-select"
  );
  const activityInstallationAddButton = document.querySelector("#activity-installation-add-button");
  const activityInstallationRemoveButton = document.querySelector(
    "#activity-installation-remove-button"
  );
  const activitiesListSummary = document.querySelector("#activities-list-summary");
  const activitiesTableBody = document.querySelector("#activities-table-body");
  const refreshActivitiesButton = document.querySelector("#refresh-activities-button");
  const openActivitiesReportButton = document.querySelector("#open-activities-report-button");
  const openActivitiesPersonalReportButton = document.querySelector(
    "#open-activities-personal-report-button"
  );
  const closeActivitiesReportButton = document.querySelector("#close-activities-report-button");
  const downloadActivitiesReportPdfButton = document.querySelector(
    "#download-activities-report-pdf-button"
  );
  const downloadActivitiesReportExcelButton = document.querySelector(
    "#download-activities-report-excel-button"
  );
  const activitiesReportBackdrop = document.querySelector("#activities-report-backdrop");
  const activitiesReportPanel = document.querySelector("#activities-report-panel");
  const activitiesReportTitle = document.querySelector("#activities-report-title");
  const activitiesReportSummary = document.querySelector("#activities-report-summary");
  const activitiesReportContent = document.querySelector("#activities-report-content");
  const activitiesFiltersForm = document.querySelector("#activities-filters-form");
  const filterActivityContrato = document.querySelector("#filter-activity-contrato");
  const filterActivityPersonal = document.querySelector("#filter-activity-personal");
  const filterActivityInstalacion = document.querySelector("#filter-activity-instalacion");
  const clearActivitiesFiltersButton = document.querySelector("#clear-activities-filters-button");
  const activityEditPanel = document.querySelector("#activity-edit-panel");
  const activityEditPanelBackdrop = document.querySelector("#activity-edit-panel-backdrop");
  const activityEditTitle = document.querySelector("#activity-edit-title");
  const activityEditForm = document.querySelector("#activity-edit-form");
  const editActivityId = document.querySelector("#edit-activity-id");
  const editActivityPersonal = document.querySelector("#edit-activity-personal");
  const editActivityContrato = document.querySelector("#edit-activity-contrato");
  const editActivityEmpresa = document.querySelector("#edit-activity-empresa");
  const editActivityInstalacion = document.querySelector("#edit-activity-instalacion");
  const editActivityPuesto = document.querySelector("#edit-activity-puesto");
  const editActivitySituacion = document.querySelector("#edit-activity-situacion");
  const editActivityTipoHora = document.querySelector("#edit-activity-tipo-hora");
  const cancelActivityEditButton = document.querySelector("#cancel-activity-edit-button");
  const duplicateActivityButton = document.querySelector("#duplicate-activity-button");
  const deleteActivityButton = document.querySelector("#delete-activity-button");
  const assignmentsSummary = document.querySelector("#assignments-summary");
  const assignmentsTableBody = document.querySelector("#assignments-table-body");
  const refreshAssignmentsButton = document.querySelector("#refresh-assignments-button");
  const openAssignmentRecordPanelButton = document.querySelector("#open-assignment-record-panel-button");
  const openAssignmentDeletePanelButton = document.querySelector("#open-assignment-delete-panel-button");
  const assignmentRecordPanelBackdrop = document.querySelector("#assignment-record-panel-backdrop");
  const assignmentRecordPanel = document.querySelector("#assignment-record-panel");
  const closeAssignmentRecordPanelButton = document.querySelector("#close-assignment-record-panel-button");
  const assignmentRecordForm = document.querySelector("#assignment-record-form");
  const assignmentRecordInstalacion = document.querySelector("#assignment-record-instalacion");
  const assignmentDeletePanelBackdrop = document.querySelector("#assignment-delete-panel-backdrop");
  const assignmentDeletePanel = document.querySelector("#assignment-delete-panel");
  const closeAssignmentDeletePanelButton = document.querySelector("#close-assignment-delete-panel-button");
  const assignmentDeleteForm = document.querySelector("#assignment-delete-form");
  const assignmentDeleteList = document.querySelector("#assignment-delete-list");
  const assignmentPanelBackdrop = document.querySelector("#assignment-panel-backdrop");
  const assignmentEditPanel = document.querySelector("#assignment-edit-panel");
  const assignmentEditTitle = document.querySelector("#assignment-edit-title");
  const assignmentEditSummary = document.querySelector("#assignment-edit-summary");
  const closeAssignmentPanelButton = document.querySelector("#close-assignment-panel-button");
  const assignmentEditForm = document.querySelector("#assignment-edit-form");
  const assignmentEditInstalacionId = document.querySelector("#assignment-edit-instalacion-id");
  const assignmentEditWeek = document.querySelector("#assignment-edit-week");
  const assignmentPreviousInstallationButton = document.querySelector("#assignment-previous-installation-button");
  const assignmentNextInstallationButton = document.querySelector("#assignment-next-installation-button");
  const assignmentPreviousWeekButton = document.querySelector("#assignment-previous-week-button");
  const assignmentNextWeekButton = document.querySelector("#assignment-next-week-button");
  const assignmentCopyNextWeekButton = document.querySelector("#assignment-copy-next-week-button");
  const assignmentPersonalFilter = document.querySelector("#assignment-personal-filter");
  const assignmentAvailableSelect = document.querySelector("#assignment-available-select");
  const assignmentSelectedSelect = document.querySelector("#assignment-selected-select");
  const assignSelectedButton = document.querySelector("#assign-selected-button");
  const unassignSelectedButton = document.querySelector("#unassign-selected-button");
  const clearAssignmentButton = document.querySelector("#clear-assignment-button");
  const moduleTabButtons = Array.from(document.querySelectorAll("[data-module-tab]"));
  const modulePanels = Array.from(document.querySelectorAll("[data-module-panel]"));

  function renderIcon(name) {
    return `<svg class="button-icon" aria-hidden="true"><use href="./icons.svg#icon-${name}"></use></svg>`;
  }

  // supabaseClient y currentSession gestionados por shared/supabase-client.js
  // Acceso: window.SupabaseApp.getClient() / getSession() / setSession()
  let studentRows = [];
  let filteredStudentRows = [];
  let studentsTotalCount = 0;
  let studentsSort = { field: "centro", direction: "asc" };
  let studentsCurrentPage = 1;
  let studentsRowsPerPage = Number(studentsPageSize?.value || 50);
  let attendanceTotalCount = 0;
  let attendanceCurrentPage = 1;
  let attendanceRowsPerPage = Number(attendancePageSize?.value || 50);
  let neeRows = [];
  let neeTotalCount = 0;
  let neeCurrentPage = 1;
  let neeRowsPerPage = Number(neePageSize?.value || 50);
  let activityCatalogsLoaded = false;
  let activityAllPersonalRows = [];
  let activityPersonalRows = [];
  let activityAllInstallationRows = [];
  let activityInstallationRows = [];
  let activityAssignedPersonalIds = new Set();
  let activityAssignedInstallationIds = new Set();
  let activitiesRows = [];
  let filteredActivitiesRows = [];
  let lastActivitiesReportGroups = [];
  let currentActivitiesReportMode = "installation";
  let activitiesSort = [
    { field: "fechas", direction: "desc" },
    { field: "horario", direction: "asc" },
  ];
  let assignmentCatalogsLoaded = false;
  let assignmentInstallationRows = [];
  let assignmentPersonalRows = [];
  let assignmentRows = [];
  let currentAssignmentSelectedIds = new Set();
  const SUMMARY_WEEKS = Array.from({ length: 11 }, (_item, index) =>
    String(index + 1).padStart(2, "0")
  );
  const CURRENT_YEAR = new Date().getFullYear();
  const ASSIGNMENT_WEEK_FIELDS = SUMMARY_WEEKS.map((week) => `semana_${week}`);
  const ACTIVITY_REPORT_WEEKS = [
    { label: "22/06-28/06", start: "2026-06-22", end: "2026-06-28" },
    { label: "29/06-05/07", start: "2026-06-29", end: "2026-07-05" },
    { label: "06/07-12/07", start: "2026-07-06", end: "2026-07-12" },
    { label: "13/07-19/07", start: "2026-07-13", end: "2026-07-19" },
    { label: "20/07-26/07", start: "2026-07-20", end: "2026-07-26" },
    { label: "27/07-02/08", start: "2026-07-27", end: "2026-08-02" },
    { label: "03/08-09/08", start: "2026-08-03", end: "2026-08-09" },
    { label: "10/08-16/08", start: "2026-08-10", end: "2026-08-16" },
    { label: "17/08-23/08", start: "2026-08-17", end: "2026-08-23" },
    { label: "24/08-30/08", start: "2026-08-24", end: "2026-08-30" },
    { label: "31/08-06/09", start: "2026-08-31", end: "2026-09-06" },
  ];

  function setStatus(message, tone = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message";
    if (tone) {
      statusMessage.classList.add(tone);
    }
  }

  let jsPdfModulePromise = null;

  // clearAuthUrl viene de shared/auth.js como window.SupabaseApp.clearAuthUrl
  // Alias local para compatibilidad con el código existente
  function clearAuthUrl() {
    if (window.SupabaseApp?.clearAuthUrl) {
      return window.SupabaseApp.clearAuthUrl();
    }
    if (!window.location.search && !window.location.hash) {
      return;
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function resetNamedFormControl(form, controlName) {
    const control = form?.elements?.[controlName];

    if (!control) {
      return false;
    }

    control.value = "";
    return true;
  }

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

  function switchModuleTab(target) {
    moduleTabButtons.forEach((button) => {
      const isActive = button.dataset.moduleTab === target;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    modulePanels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.modulePanel !== target);
    });
  }

  function getSortValue(row, field) {
    if (field === "semana") {
      return String(row.semana ?? "").padStart(3, "0");
    }

    return normalizeText(row[field]);
  }

  function updateStudentsPagination() {
    const totalPages = Math.max(1, Math.ceil(studentsTotalCount / studentsRowsPerPage));
    studentsCurrentPage = Math.min(Math.max(1, studentsCurrentPage), totalPages);
    studentsPreviousPage.disabled = studentsCurrentPage <= 1;
    studentsNextPage.disabled = studentsCurrentPage >= totalPages;
    studentsPaginationSummary.textContent = `Pagina ${studentsCurrentPage} de ${totalPages}`;
  }

  function updateAttendancePagination() {
    const totalPages = Math.max(1, Math.ceil(attendanceTotalCount / attendanceRowsPerPage));
    attendanceCurrentPage = Math.min(Math.max(1, attendanceCurrentPage), totalPages);
    attendancePreviousPage.disabled = attendanceCurrentPage <= 1;
    attendanceNextPage.disabled = attendanceCurrentPage >= totalPages;
    attendancePaginationSummary.textContent = `Pagina ${attendanceCurrentPage} de ${totalPages}`;
  }

  function updateNeePagination() {
    const totalPages = Math.max(1, Math.ceil(neeTotalCount / neeRowsPerPage));
    neeCurrentPage = Math.min(Math.max(1, neeCurrentPage), totalPages);
    neePreviousPage.disabled = neeCurrentPage <= 1;
    neeNextPage.disabled = neeCurrentPage >= totalPages;
    neePaginationSummary.textContent = `Pagina ${neeCurrentPage} de ${totalPages}`;
  }

  function renderStudentsTable() {
    studentsSummary.textContent = `${studentsTotalCount} registros filtrados`;
    updateStudentsPagination();

    const rows = filteredStudentRows;

    if (!rows.length) {
      studentsTableBody.innerHTML =
        '<tr><td colspan="4" class="empty-state">No hay alumnado con esos filtros.</td></tr>';
      return;
    }

    studentsTableBody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.centro)}</td>
            <td>${escapeHtml(row.semana)}</td>
            <td>${escapeHtml(row.alumnado)}</td>
            <td>${escapeHtml(row.movil)}</td>
          </tr>
        `
      )
      .join("");
  }

  function createEmptyWeeklySummary() {
    return { total: 0, nee: 0, infantil: 0, primaria: 0 };
  }

  function isInfantilStudent(fechaNacimiento) {
    const birthYear = Number(String(fechaNacimiento ?? "").slice(0, 4));
    return Number.isInteger(birthYear) && birthYear >= CURRENT_YEAR - 6;
  }

  function formatWeeklySummaryValue(value) {
    if (!value.total) {
      return "";
    }

    return `
      <span class="summary-main-value">${value.total} (${value.nee})</span>
      <span class="summary-stage-value">INF ${value.infantil} / PR ${value.primaria}</span>
    `;
  }

  function renderWeeklySummary() {
    if (!studentRows.length) {
      weeklySummary.textContent = "Sin datos cargados.";
      weeklySummaryTableBody.innerHTML =
        '<tr><td colspan="13" class="empty-state">No hay datos para resumir.</td></tr>';
      return;
    }

    const byCenter = new Map();
    const columnTotals = Object.fromEntries(
      SUMMARY_WEEKS.map((week) => [week, createEmptyWeeklySummary()])
    );

    studentRows.forEach((row) => {
      const center = String(row.centro ?? "").trim() || "Sin centro";
      const week = String(row.semana ?? "").trim().padStart(2, "0");
      const hasNee = Boolean(String(row.nee ?? "").trim());
      const isInfantil = isInfantilStudent(row.fecha_nacimiento);

      if (!SUMMARY_WEEKS.includes(week)) {
        return;
      }

      if (!byCenter.has(center)) {
        byCenter.set(
          center,
          Object.fromEntries(SUMMARY_WEEKS.map((item) => [item, createEmptyWeeklySummary()]))
        );
      }

      byCenter.get(center)[week].total += 1;
      columnTotals[week].total += 1;

      if (hasNee) {
        byCenter.get(center)[week].nee += 1;
        columnTotals[week].nee += 1;
      }

      if (isInfantil) {
        byCenter.get(center)[week].infantil += 1;
        columnTotals[week].infantil += 1;
      } else {
        byCenter.get(center)[week].primaria += 1;
        columnTotals[week].primaria += 1;
      }
    });

    const rows = Array.from(byCenter.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "es", { sensitivity: "base" })
    );

    const bodyRows = rows.map(([center, weeks]) => {
      const rowTotal = SUMMARY_WEEKS.reduce((total, week) => total + weeks[week].total, 0);
      const rowNeeTotal = SUMMARY_WEEKS.reduce((total, week) => total + weeks[week].nee, 0);
      const rowInfantilTotal = SUMMARY_WEEKS.reduce(
        (total, week) => total + weeks[week].infantil,
        0
      );
      const rowPrimariaTotal = SUMMARY_WEEKS.reduce(
        (total, week) => total + weeks[week].primaria,
        0
      );
      return `
        <tr>
          <th scope="row">${escapeHtml(center)}</th>
          ${SUMMARY_WEEKS.map((week) => {
            const value = weeks[week];
            return `<td>${formatWeeklySummaryValue(value)}</td>`;
          }).join("")}
          <td class="total-cell">${formatWeeklySummaryValue({
            total: rowTotal,
            nee: rowNeeTotal,
            infantil: rowInfantilTotal,
            primaria: rowPrimariaTotal,
          })}</td>
        </tr>
      `;
    });

    const grandTotal = SUMMARY_WEEKS.reduce((total, week) => total + columnTotals[week].total, 0);
    const grandNeeTotal = SUMMARY_WEEKS.reduce((total, week) => total + columnTotals[week].nee, 0);
    const grandInfantilTotal = SUMMARY_WEEKS.reduce(
      (total, week) => total + columnTotals[week].infantil,
      0
    );
    const grandPrimariaTotal = SUMMARY_WEEKS.reduce(
      (total, week) => total + columnTotals[week].primaria,
      0
    );
    bodyRows.push(`
      <tr class="totals-row">
        <th scope="row">Total</th>
        ${SUMMARY_WEEKS.map((week) => `<td>${formatWeeklySummaryValue(columnTotals[week])}</td>`).join("")}
        <td class="total-cell">${formatWeeklySummaryValue({
          total: grandTotal,
          nee: grandNeeTotal,
          infantil: grandInfantilTotal,
          primaria: grandPrimariaTotal,
        })}</td>
      </tr>
    `);

    weeklySummary.textContent = `${rows.length} centros y ${grandTotal} registros de alumnado (${grandNeeTotal} NEE). INF ${grandInfantilTotal} / PR ${grandPrimariaTotal}`;
    weeklySummaryTableBody.innerHTML = bodyRows.join("");
  }

  function renderWeeklySummaryRows(summaryRows) {
    if (!summaryRows.length) {
      weeklySummary.textContent = "Sin datos cargados.";
      weeklySummaryTableBody.innerHTML =
        '<tr><td colspan="13" class="empty-state">No hay datos para resumir.</td></tr>';
      return;
    }

    const byCenter = new Map();
    const columnTotals = Object.fromEntries(
      SUMMARY_WEEKS.map((week) => [week, createEmptyWeeklySummary()])
    );

    summaryRows.forEach((row) => {
      const center = String(row.centro ?? "").trim() || "Sin centro";
      const week = String(row.semana ?? "").trim().padStart(2, "0");
      const total = Number(row.total) || 0;
      const nee = Number(row.nee_total) || 0;
      const infantil = Number(row.infantil_total) || 0;
      const primaria = Number(row.primaria_total) || Math.max(total - infantil, 0);

      if (!SUMMARY_WEEKS.includes(week)) {
        return;
      }

      if (!byCenter.has(center)) {
        byCenter.set(
          center,
          Object.fromEntries(SUMMARY_WEEKS.map((item) => [item, createEmptyWeeklySummary()]))
        );
      }

      byCenter.get(center)[week].total += total;
      byCenter.get(center)[week].nee += nee;
      byCenter.get(center)[week].infantil += infantil;
      byCenter.get(center)[week].primaria += primaria;
      columnTotals[week].total += total;
      columnTotals[week].nee += nee;
      columnTotals[week].infantil += infantil;
      columnTotals[week].primaria += primaria;
    });

    const rows = Array.from(byCenter.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "es", { sensitivity: "base" })
    );
    const bodyRows = rows.map(([center, weeks]) => {
      const rowTotal = SUMMARY_WEEKS.reduce((total, week) => total + weeks[week].total, 0);
      const rowNeeTotal = SUMMARY_WEEKS.reduce((total, week) => total + weeks[week].nee, 0);
      const rowInfantilTotal = SUMMARY_WEEKS.reduce(
        (total, week) => total + weeks[week].infantil,
        0
      );
      const rowPrimariaTotal = SUMMARY_WEEKS.reduce(
        (total, week) => total + weeks[week].primaria,
        0
      );
      return `
        <tr>
          <th scope="row">${escapeHtml(center)}</th>
          ${SUMMARY_WEEKS.map((week) => {
            const value = weeks[week];
            return `<td>${formatWeeklySummaryValue(value)}</td>`;
          }).join("")}
          <td class="total-cell">${formatWeeklySummaryValue({
            total: rowTotal,
            nee: rowNeeTotal,
            infantil: rowInfantilTotal,
            primaria: rowPrimariaTotal,
          })}</td>
        </tr>
      `;
    });

    const grandTotal = SUMMARY_WEEKS.reduce((total, week) => total + columnTotals[week].total, 0);
    const grandNeeTotal = SUMMARY_WEEKS.reduce((total, week) => total + columnTotals[week].nee, 0);
    const grandInfantilTotal = SUMMARY_WEEKS.reduce(
      (total, week) => total + columnTotals[week].infantil,
      0
    );
    const grandPrimariaTotal = SUMMARY_WEEKS.reduce(
      (total, week) => total + columnTotals[week].primaria,
      0
    );
    bodyRows.push(`
      <tr class="totals-row">
        <th scope="row">Total</th>
        ${SUMMARY_WEEKS.map((week) => `<td>${formatWeeklySummaryValue(columnTotals[week])}</td>`).join("")}
        <td class="total-cell">${formatWeeklySummaryValue({
          total: grandTotal,
          nee: grandNeeTotal,
          infantil: grandInfantilTotal,
          primaria: grandPrimariaTotal,
        })}</td>
      </tr>
    `);

    weeklySummary.textContent = `${rows.length} centros y ${grandTotal} registros de alumnado (${grandNeeTotal} NEE). INF ${grandInfantilTotal} / PR ${grandPrimariaTotal}`;
    weeklySummaryTableBody.innerHTML = bodyRows.join("");
  }

  function renderSelectOptions(select, values, emptyLabel) {
    const currentValue = select.value;
    const options = [`<option value="">${escapeHtml(emptyLabel)}</option>`].concat(
      values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    );
    select.innerHTML = options.join("");
    select.value = values.includes(currentValue) ? currentValue : "";
  }

  function renderStudentFilterOptions() {
    const centros = Array.from(
      new Set(studentRows.map((row) => String(row.centro ?? "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    const semanas = Array.from(
      new Set(studentRows.map((row) => String(row.semana ?? "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }));

    renderSelectOptions(filterCentro, centros, "Todos los centros");
    renderSelectOptions(filterSemana, semanas, "Todas las semanas");
    renderSelectOptions(attendanceCenterFilter, centros, "Todos los centros");
  }

  function renderStudentFilterOptionRows(optionRows) {
    const centros = optionRows
      .filter((row) => row.option_type === "centro")
      .map((row) => String(row.option_value ?? "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
    const semanas = optionRows
      .filter((row) => row.option_type === "semana")
      .map((row) => String(row.option_value ?? "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }));

    renderSelectOptions(filterCentro, centros, "Todos los centros");
    renderSelectOptions(filterSemana, semanas, "Todas las semanas");
    renderSelectOptions(attendanceCenterFilter, centros, "Todos los centros");
  }

  function renderCatalogOptions(select, rows, valueField, labelField, emptyLabel) {
    const currentValue = select.value;
    const options = [`<option value="">${escapeHtml(emptyLabel)}</option>`].concat(
      rows.map((row) => {
        const value = row[valueField];
        const label = row[labelField] || `ID ${value}`;
        return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
      })
    );
    select.innerHTML = options.join("");
    select.value = rows.some((row) => String(row[valueField]) === currentValue) ? currentValue : "";
    return select.value !== currentValue;
  }

  function isMissingTableError(error, tableName) {
    const details = [error?.message, error?.details, error?.hint, error?.code]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");
    return details.includes(tableName.toLowerCase()) && (
      details.includes("does not exist") ||
      details.includes("could not find") ||
      details.includes("schema cache")
    );
  }

  function renderActivitySettings() {
    if (
      !activityPersonalAvailableSelect ||
      !activityPersonalSelectedSelect ||
      !activityInstallationAvailableSelect ||
      !activityInstallationSelectedSelect
    ) {
      return;
    }

    const personalFilter = normalizeText(activitySettingsPersonalFilter?.value || "");
    const filteredPersonalRows = activityAllPersonalRows.filter(
      (row) => !personalFilter || normalizeText(row.personal).includes(personalFilter)
    );
    const availablePersonalRows = filteredPersonalRows.filter(
      (row) => !activityAssignedPersonalIds.has(Number(row.id))
    );
    const selectedPersonalRows = filteredPersonalRows.filter((row) =>
      activityAssignedPersonalIds.has(Number(row.id))
    );

    activityPersonalAvailableSelect.innerHTML = availablePersonalRows
      .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.personal)}</option>`)
      .join("");
    activityPersonalSelectedSelect.innerHTML = selectedPersonalRows
      .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.personal)}</option>`)
      .join("");

    const installationFilter = normalizeText(activitySettingsInstallationFilter?.value || "");
    const filteredInstallationRows = activityAllInstallationRows.filter(
      (row) => !installationFilter || normalizeText(row.instalacion).includes(installationFilter)
    );
    const availableInstallationRows = filteredInstallationRows.filter(
      (row) => !activityAssignedInstallationIds.has(Number(row.id))
    );
    const selectedInstallationRows = filteredInstallationRows.filter((row) =>
      activityAssignedInstallationIds.has(Number(row.id))
    );

    activityInstallationAvailableSelect.innerHTML = availableInstallationRows
      .map(
        (row) =>
          `<option value="${escapeHtml(row.id)}">${escapeHtml(row.instalacion)}</option>`
      )
      .join("");
    activityInstallationSelectedSelect.innerHTML = selectedInstallationRows
      .map(
        (row) =>
          `<option value="${escapeHtml(row.id)}">${escapeHtml(row.instalacion)}</option>`
      )
      .join("");
  }

  function getActivityFilterValues() {
    return {
      contrato: String(filterActivityContrato.value || ""),
      personal: String(filterActivityPersonal.value || ""),
      instalacion: String(filterActivityInstalacion.value || ""),
    };
  }

  function activityMatchesFilterValues(activity, filters, excludedFilter = "") {
    const matchesContrato =
      excludedFilter === "contrato" ||
      !filters.contrato ||
      String(activity.contrato_id) === filters.contrato;
    const matchesPersonal =
      excludedFilter === "personal" ||
      !filters.personal ||
      String(activity.personal_id) === filters.personal;
    const matchesInstalacion =
      excludedFilter === "instalacion" ||
      !filters.instalacion ||
      String(activity.instalacion_id) === filters.instalacion;

    return matchesContrato && matchesPersonal && matchesInstalacion;
  }

  function getActivityRowsForFilterOptions(excludedFilter) {
    const filters = getActivityFilterValues();
    return activitiesRows.filter((activity) =>
      activityMatchesFilterValues(activity, filters, excludedFilter)
    );
  }

  function getUniqueActivityFilterRows(rows, idField, labelField) {
    const byId = new Map();

    rows.forEach((activity) => {
      const id = activity[idField];
      const label = String(activity[labelField] ?? "").trim();

      if (id === null || id === undefined || byId.has(String(id))) {
        return;
      }

      byId.set(String(id), { id, label: label || `ID ${id}` });
    });

    return Array.from(byId.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "es", { sensitivity: "base" })
    );
  }

  function renderActivityFilterOptions() {
    const contratoChanged = renderCatalogOptions(
      filterActivityContrato,
      getUniqueActivityFilterRows(
        getActivityRowsForFilterOptions("contrato"),
        "contrato_id",
        "contrato"
      ),
      "id",
      "label",
      "Todos los contratos"
    );
    const personalChanged = renderCatalogOptions(
      filterActivityPersonal,
      getUniqueActivityFilterRows(
        getActivityRowsForFilterOptions("personal"),
        "personal_id",
        "personal"
      ),
      "id",
      "label",
      "Todo el personal"
    );
    const instalacionChanged = renderCatalogOptions(
      filterActivityInstalacion,
      getUniqueActivityFilterRows(
        getActivityRowsForFilterOptions("instalacion"),
        "instalacion_id",
        "instalacion"
      ),
      "id",
      "label",
      "Todas las instalaciones"
    );

    return contratoChanged || personalChanged || instalacionChanged;
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    const [year, month, day] = String(value).split("-");
    return day && month && year ? `${day}/${month}/${year}` : String(value);
  }

  function formatTime(value) {
    return String(value ?? "").slice(0, 5) || "-";
  }

  function parseTimeMinutes(value) {
    const [hours, minutes] = String(value ?? "").slice(0, 5).split(":").map(Number);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }

    return hours * 60 + minutes;
  }

  function getActivityDailyHours(activity) {
    const start = parseTimeMinutes(activity.hora_inicio);
    const end = parseTimeMinutes(activity.hora_fin);

    if (start === null || end === null || end <= start) {
      return 0;
    }

    return (end - start) / 60;
  }

  function formatHours(value) {
    const rounded = Math.round((Number(value) || 0) * 100) / 100;
    return Number.isInteger(rounded)
      ? String(rounded)
      : String(rounded).replace(".", ",");
  }

  function parseDateValue(value) {
    if (!value) {
      return null;
    }

    const [year, month, day] = String(value).split("-").map(Number);
    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  function formatDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(date, days) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  function getSpanishWeekday(date) {
    const day = date.getDay();
    return day === 0 ? 7 : day;
  }

  function formatWeekdays(days) {
    const labels = {
      1: "L",
      2: "M",
      3: "X",
      4: "J",
      5: "V",
      6: "S",
      7: "D",
    };

    return Array.isArray(days) && days.length
      ? days.map((day) => labels[day] || day).join(", ")
      : "-";
  }

  function formatBooleanStatus(value) {
    return value ? "Si" : "No";
  }

  function formatCallResponse(value) {
    if (value === "aceptado") {
      return "Aceptado";
    }

    if (value === "rechazado") {
      return "Rechazado";
    }

    return "Pendiente";
  }

  function getPersonalName(personalId) {
    const person = assignmentPersonalRows.find((row) => Number(row.id) === Number(personalId));
    return person?.personal || `ID ${personalId}`;
  }

  function renderAttendanceMatrix() {
    if (!studentRows.length) {
      attendanceSummary.textContent = "Sin datos cargados.";
      attendanceTableBody.innerHTML =
        '<tr><td colspan="12" class="empty-state">No hay datos para mostrar.</td></tr>';
      return;
    }

    const centerFilter = normalizeText(attendanceCenterFilter.value);
    const rowsForCenter = studentRows.filter(
      (row) => !centerFilter || normalizeText(row.centro) === centerFilter
    );
    const byStudent = new Map();

    rowsForCenter.forEach((row) => {
      const center = String(row.centro ?? "").trim();
      const studentName = String(row.alumnado ?? "").trim() || "Sin nombre";
      const personCode = String(row.codigo_persona ?? "").trim();
      const key = `${center}::${personCode || studentName}`;
      const week = String(row.semana ?? "").trim().padStart(2, "0");

      if (!SUMMARY_WEEKS.includes(week)) {
        return;
      }

      if (!byStudent.has(key)) {
        byStudent.set(key, {
          center,
          name: studentName,
          weeks: new Set(),
        });
      }

      byStudent.get(key).weeks.add(week);
    });

    const rows = Array.from(byStudent.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );

    if (!rows.length) {
      attendanceSummary.textContent = "No hay alumnado para ese centro.";
      attendanceTableBody.innerHTML =
        '<tr><td colspan="12" class="empty-state">No hay alumnado para ese centro.</td></tr>';
      return;
    }

    attendanceSummary.textContent = `${rows.length} alumnos mostrados`;
    attendanceTableBody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <th scope="row">${escapeHtml(row.name)}</th>
            ${SUMMARY_WEEKS.map((week) => {
              const attends = row.weeks.has(week);
              return `<td class="${attends ? "attendance-cell active" : "attendance-cell"}">${attends ? "Si" : ""}</td>`;
            }).join("")}
          </tr>
        `
      )
      .join("");
  }

  function renderAttendanceRows(rows) {
    if (!rows.length) {
      attendanceTotalCount = 0;
      attendanceSummary.textContent = attendanceCenterFilter.value
        ? "No hay alumnado para ese centro."
        : "Sin datos cargados.";
      attendanceTableBody.innerHTML =
        '<tr><td colspan="12" class="empty-state">No hay alumnado para mostrar.</td></tr>';
      updateAttendancePagination();
      return;
    }

    attendanceTotalCount = Number(rows[0]?.total_count) || rows.length;
    attendanceSummary.textContent = `${rows.length} alumnos mostrados de ${attendanceTotalCount}`;
    attendanceTableBody.innerHTML = rows
      .map((row) => {
        const weeks = new Set(Array.isArray(row.semanas) ? row.semanas.map(String) : []);
        return `
          <tr>
            <th scope="row">${escapeHtml(row.alumnado)}</th>
            ${SUMMARY_WEEKS.map((week) => {
              const attends = weeks.has(week);
              return `<td class="${attends ? "attendance-cell active" : "attendance-cell"}">${attends ? "Si" : ""}</td>`;
            }).join("")}
          </tr>
        `;
      })
      .join("");
    updateAttendancePagination();
  }

  function buildNeeRows() {
    const byStudent = new Map();

    studentRows.forEach((row) => {
      const personCode = String(row.codigo_persona ?? "").trim();
      const studentName = String(row.alumnado ?? "").trim() || "Sin nombre";
      const key = personCode || studentName;
      const hasNee = Boolean(String(row.nee ?? "").trim());

      if (!byStudent.has(key)) {
        byStudent.set(key, {
          codigoPersona: personCode,
          alumnado: studentName,
          nee: hasNee,
        });
        return;
      }

      const existing = byStudent.get(key);
      existing.nee = existing.nee || hasNee;
    });

    neeRows = Array.from(byStudent.values()).sort((a, b) => {
      if (a.nee !== b.nee) {
        return a.nee ? -1 : 1;
      }

      return a.alumnado.localeCompare(b.alumnado, "es", { sensitivity: "base" });
    });
  }

  function renderNeeTable() {
    if (!studentRows.length) {
      neeSummary.textContent = "Sin datos cargados.";
      neeTableBody.innerHTML =
        '<tr><td colspan="2" class="empty-state">No hay alumnado para mostrar.</td></tr>';
      return;
    }

    const search = normalizeText(filterNeeAlumnado.value);
    const rows = neeRows.filter((row) => !search || normalizeText(row.alumnado).includes(search));
    const neeTotal = neeRows.filter((row) => row.nee).length;

    neeSummary.textContent = `${rows.length} alumnos mostrados de ${neeRows.length}. ${neeTotal} marcados como NEE.`;

    if (!rows.length) {
      neeTableBody.innerHTML =
        '<tr><td colspan="2" class="empty-state">No hay alumnado con esa busqueda.</td></tr>';
      return;
    }

    neeTableBody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.alumnado)}</td>
            <td class="nee-check-cell">
              <input
                class="nee-checkbox"
                type="checkbox"
                data-codigo-persona="${escapeHtml(row.codigoPersona)}"
                ${row.nee ? "checked" : ""}
                aria-label="Marcar NEE para ${escapeHtml(row.alumnado)}"
              />
            </td>
          </tr>
        `
      )
      .join("");
  }

  function renderNeeRows(rows) {
    neeRows = rows.map((row) => ({
      codigoPersona: String(row.codigo_persona ?? "").trim(),
      alumnado: String(row.alumnado ?? "").trim() || "Sin nombre",
      nee: Boolean(row.nee),
    }));

    neeTotalCount = Number(rows[0]?.total_count) || neeRows.length;
    const neeTotal = neeRows.filter((row) => row.nee).length;
    neeSummary.textContent = `${neeRows.length} alumnos mostrados de ${neeTotalCount}. ${neeTotal} marcados como NEE en esta pagina.`;

    if (!neeRows.length) {
      neeTotalCount = 0;
      neeTableBody.innerHTML =
        '<tr><td colspan="2" class="empty-state">No hay alumnado con esa busqueda.</td></tr>';
      updateNeePagination();
      return;
    }

    neeTableBody.innerHTML = neeRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.alumnado)}</td>
            <td class="nee-check-cell">
              <input
                class="nee-checkbox"
                type="checkbox"
                data-codigo-persona="${escapeHtml(row.codigoPersona)}"
                ${row.nee ? "checked" : ""}
                aria-label="Marcar NEE para ${escapeHtml(row.alumnado)}"
              />
            </td>
          </tr>
        `
      )
      .join("");
    updateNeePagination();
  }

  async function updateStudentNee(codigoPersona, isNee) {
    if (!codigoPersona) {
      setStatus("No se pudo actualizar NEE: falta el codigo de persona.", "error");
      return false;
    }

    try {
      const personCode = Number(codigoPersona);
      if (!Number.isInteger(personCode)) {
        throw new Error("codigo de persona no valido.");
      }

      const supabase = await getSupabaseClient();
      const { data: visibleRows, error: readError } = await supabase
        .from("concilia_usuarios")
        .select("id")
        .eq("codigo_persona", personCode);

      if (readError) {
        throw readError;
      }

      if (!visibleRows?.length) {
        throw new Error("no se encontraron registros visibles para ese alumno.");
      }

      const { data, error } = await supabase
        .from("concilia_usuarios")
        .update({ nee: isNee ? "Si" : null })
        .eq("codigo_persona", personCode)
        .select("id");

      if (error) {
        throw error;
      }

      if (!data?.length) {
        throw new Error(
          "Supabase permite leer el alumno, pero no actualizarlo. Revisa la politica UPDATE de concilia_usuarios."
        );
      }

      await Promise.all([
        applyStudentFilters(),
        loadNeeRows(supabase),
        loadWeeklySummary(supabase),
      ]);
      setStatus(isNee ? "Alumno marcado como NEE." : "Marca NEE retirada.", "success");
      return true;
    } catch (error) {
      setStatus(`No se pudo actualizar NEE: ${error.message}`, "error");
      return false;
    }
  }

  async function fetchCatalog(supabase, table, columns, orderColumn, filters = []) {
    let query = supabase.from(table).select(columns).order(orderColumn, { ascending: true });

    filters.forEach((filter) => {
      if (filter.operator === "in") {
        query = query.in(filter.column, filter.value);
        return;
      }

      query = query.eq(filter.column, filter.value);
    });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async function loadActivityCatalogs() {
    if (activityCatalogsLoaded) {
      return;
    }

    activitiesSummary.textContent = "Cargando listas maestras...";

    try {
      const supabase = await getSupabaseClient();
      const [
        personalRows,
        contratoRows,
        empresaRows,
        instalacionRows,
        puestoRows,
        situacionRows,
        tipoHoraRows,
        activityPersonalSettingsRows,
        activityInstallationSettingsRows,
      ] = await Promise.all([
        fetchCatalog(supabase, "personal", "id,personal", "personal", [
          { column: "vinculacion_id", operator: "in", value: [1, 2] },
        ]),
        fetchCatalog(supabase, "contratos", "id,contrato", "contrato", [
          { column: "activo", value: true },
        ]),
        fetchCatalog(supabase, "empresas", "id,empresa", "empresa"),
        fetchCatalog(supabase, "instalaciones", "id,instalacion", "instalacion", [
          { column: "activo", value: true },
        ]),
        fetchCatalog(supabase, "puestos", "id,puesto", "puesto"),
        fetchCatalog(supabase, "situaciones", "id,situacion", "situacion"),
        fetchCatalog(supabase, "tipo_horas", "id,tipo_hora", "tipo_hora"),
        supabase.from("actividades_personal").select("personal_id"),
        supabase.from("actividades_instalaciones").select("instalacion_id"),
      ]);

      if (activityPersonalSettingsRows.error && !isMissingTableError(activityPersonalSettingsRows.error, "actividades_personal")) {
        throw activityPersonalSettingsRows.error;
      }
      if (
        activityInstallationSettingsRows.error &&
        !isMissingTableError(activityInstallationSettingsRows.error, "actividades_instalaciones")
      ) {
        throw activityInstallationSettingsRows.error;
      }

      activityAllPersonalRows = personalRows;
      activityAllInstallationRows = instalacionRows;
      activityAssignedPersonalIds = new Set(
        activityPersonalSettingsRows.error
          ? personalRows.map((row) => Number(row.id))
          : (activityPersonalSettingsRows.data ?? []).map((row) => Number(row.personal_id))
      );
      activityAssignedInstallationIds = new Set(
        activityInstallationSettingsRows.error
          ? instalacionRows.map((row) => Number(row.id))
          : (activityInstallationSettingsRows.data ?? []).map((row) => Number(row.instalacion_id))
      );
      activityPersonalRows = personalRows.filter((row) =>
        activityAssignedPersonalIds.has(Number(row.id))
      );
      activityInstallationRows = instalacionRows.filter((row) =>
        activityAssignedInstallationIds.has(Number(row.id))
      );

      renderCatalogOptions(activityPersonal, activityPersonalRows, "id", "personal", "Seleccionar personal");
      renderCatalogOptions(
        editActivityPersonal,
        activityPersonalRows,
        "id",
        "personal",
        "Seleccionar personal"
      );
      renderCatalogOptions(
        filterActivityPersonal,
        activityPersonalRows,
        "id",
        "personal",
        "Todo el personal"
      );
      renderCatalogOptions(activityContrato, contratoRows, "id", "contrato", "Seleccionar contrato");
      renderCatalogOptions(
        editActivityContrato,
        contratoRows,
        "id",
        "contrato",
        "Seleccionar contrato"
      );
      renderCatalogOptions(
        filterActivityContrato,
        contratoRows,
        "id",
        "contrato",
        "Todos los contratos"
      );
      renderCatalogOptions(activityEmpresa, empresaRows, "id", "empresa", "Seleccionar empresa");
      renderCatalogOptions(editActivityEmpresa, empresaRows, "id", "empresa", "Seleccionar empresa");
      renderCatalogOptions(
        activityInstalacion,
        activityInstallationRows,
        "id",
        "instalacion",
        "Seleccionar instalacion"
      );
      renderCatalogOptions(
        filterActivityInstalacion,
        activityInstallationRows,
        "id",
        "instalacion",
        "Todas las instalaciones"
      );
      renderCatalogOptions(
        editActivityInstalacion,
        activityInstallationRows,
        "id",
        "instalacion",
        "Seleccionar instalacion"
      );
      renderCatalogOptions(activityPuesto, puestoRows, "id", "puesto", "Seleccionar puesto");
      renderCatalogOptions(editActivityPuesto, puestoRows, "id", "puesto", "Seleccionar puesto");
      renderCatalogOptions(
        activitySituacion,
        situacionRows,
        "id",
        "situacion",
        "Seleccionar situacion"
      );
      renderCatalogOptions(
        editActivitySituacion,
        situacionRows,
        "id",
        "situacion",
        "Seleccionar situacion"
      );
      renderCatalogOptions(
        activityTipoHora,
        tipoHoraRows,
        "id",
        "tipo_hora",
        "Seleccionar tipo de hora"
      );
      renderCatalogOptions(
        editActivityTipoHora,
        tipoHoraRows,
        "id",
        "tipo_hora",
        "Seleccionar tipo de hora"
      );
      renderActivitySettings();

      activityCatalogsLoaded = true;
      applyActivityFormDefaults();
      activitiesSummary.textContent = "Completa los campos para crear una actividad.";
    } catch (error) {
      activitiesSummary.textContent = "No se pudieron cargar las listas maestras.";
      setStatus(`No se pudieron cargar las listas de actividades: ${error.message}`, "error");
    }
  }

  function openActivitiesSettingsPanel() {
    renderActivitySettings();
    activitiesSettingsPanel.classList.remove("hidden");
    activitiesSettingsBackdrop.classList.remove("hidden");
    activitySettingsPersonalFilter?.focus();
  }

  function closeActivitiesSettingsPanel() {
    activitiesSettingsPanel.classList.add("hidden");
    activitiesSettingsBackdrop.classList.add("hidden");
  }

  async function setActivityPersonalBatch(personalIds, isEnabled) {
    const ids = personalIds.map(Number).filter(Boolean);
    if (!ids.length) {
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { error } = isEnabled
        ? await supabase
            .from("actividades_personal")
            .upsert(ids.map((personalId) => ({ personal_id: personalId })))
        : await supabase.from("actividades_personal").delete().in("personal_id", ids);

      if (error) {
        throw error;
      }

      activityCatalogsLoaded = false;
      await loadActivityCatalogs();
      setStatus("Configuración de personal de actividades actualizada.", "success");
    } catch (error) {
      setStatus(`No se pudo actualizar el personal de actividades: ${error.message}`, "error");
      renderActivitySettings();
    }
  }

  async function setActivityInstallationBatch(installationIds, isEnabled) {
    const ids = installationIds.map(Number).filter(Boolean);
    if (!ids.length) {
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { error } = isEnabled
        ? await supabase
            .from("actividades_instalaciones")
            .upsert(ids.map((instalacionId) => ({ instalacion_id: instalacionId })))
        : await supabase.from("actividades_instalaciones").delete().in("instalacion_id", ids);

      if (error) {
        throw error;
      }

      activityCatalogsLoaded = false;
      await loadActivityCatalogs();
      setStatus("Configuración de instalaciones de actividades actualizada.", "success");
    } catch (error) {
      setStatus(`No se pudo actualizar las instalaciones de actividades: ${error.message}`, "error");
      renderActivitySettings();
    }
  }

  function getSelectedWeekdays(form) {
    return Array.from(form.querySelectorAll('input[name="dias_semana"]:checked')).map(
      (input) => Number(input.value)
    );
  }

  function setSelectedWeekdays(form, days) {
    const selected = new Set((days ?? []).map((day) => String(day)));
    form.querySelectorAll('input[name="dias_semana"]').forEach((input) => {
      input.checked = selected.has(input.value);
    });
  }

  function setSelectByOptionText(select, matcher) {
    const option = Array.from(select.options).find((item) => matcher(normalizeText(item.textContent)));
    if (option) {
      select.value = option.value;
    }
  }

  function applyActivityFormDefaults() {
    if (!activityEmpresa.value) {
      setSelectByOptionText(activityEmpresa, (text) => text.includes("edp"));
    }

    if (!activitySituacion.value) {
      setSelectByOptionText(activitySituacion, (text) => text.startsWith("norm"));
    }

    if (!activityTipoHora.value) {
      setSelectByOptionText(activityTipoHora, (text) => text.startsWith("reg"));
    }
  }

  function isEndAfterStart(fechaInicio, fechaFin, horaInicio, horaFin) {
    if (fechaFin > fechaInicio) {
      return true;
    }

    return fechaFin === fechaInicio && horaFin > horaInicio;
  }

  function getActivityPayload(form) {
    const formData = new FormData(form);
    const fechaInicio = String(formData.get("fecha_inicio") || "");
    const fechaFin = String(formData.get("fecha_fin") || "");
    const horaInicio = String(formData.get("hora_inicio") || "");
    const horaFin = String(formData.get("hora_fin") || "");
    const diasSemana = getSelectedWeekdays(form);
    const respuestaLlamamiento = String(formData.get("respuesta_llamamiento") || "");

    if (!diasSemana.length) {
      setStatus("Selecciona al menos un dia de la semana.", "error");
      return null;
    }

    if (!isEndAfterStart(fechaInicio, fechaFin, horaInicio, horaFin)) {
      setStatus("La fecha y hora de fin deben ser posteriores al inicio.", "error");
      return null;
    }

    return {
      personal_id: Number(formData.get("personal_id")),
      contrato_id: Number(formData.get("contrato_id")),
      empresa_id: Number(formData.get("empresa_id")),
      instalacion_id: Number(formData.get("instalacion_id")),
      puesto_id: Number(formData.get("puesto_id")),
      situacion_id: Number(formData.get("situacion_id")),
      tipo_hora_id: Number(formData.get("tipo_hora_id")),
      dias_semana: diasSemana,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      llamamiento_enviado: formData.get("llamamiento_enviado") === "true",
      respuesta_llamamiento: respuestaLlamamiento || null,
      observaciones: String(formData.get("observaciones") || "").trim() || null,
    };
  }

  async function loadActivities() {
    activitiesListSummary.textContent = "Cargando actividades...";
    activitiesTableBody.innerHTML =
      '<tr><td colspan="7" class="empty-state">Cargando actividades...</td></tr>';

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from("actividades_detalle")
        .select(
          "id,personal_id,personal,contrato_id,contrato,empresa_id,empresa,instalacion_id,instalacion,puesto_id,puesto,situacion_id,situacion,tipo_hora_id,tipo_hora,dias_semana,fecha_inicio,fecha_fin,hora_inicio,hora_fin,llamamiento_enviado,respuesta_llamamiento,observaciones,updated_at"
        )
        .order("fecha_inicio", { ascending: false })
        .order("hora_inicio", { ascending: true });

      if (error) {
        throw error;
      }

      const activityRows = data ?? [];
      const personalIds = Array.from(
        new Set(activityRows.map((activity) => activity.personal_id).filter(Boolean))
      );
      let personalDetailsById = new Map();

      if (personalIds.length) {
        const { data: personalDetails, error: personalDetailsError } = await supabase
          .from("personal")
          .select("id,dni,fecha_nacimiento,ss,cuenta_corriente")
          .in("id", personalIds);

        if (personalDetailsError) {
          throw personalDetailsError;
        }

        personalDetailsById = new Map(
          (personalDetails ?? []).map((person) => [Number(person.id), person])
        );
      }

      activitiesRows = activityRows.map((activity) => ({
        ...activity,
        dni: personalDetailsById.get(Number(activity.personal_id))?.dni || "",
        fecha_nacimiento:
          personalDetailsById.get(Number(activity.personal_id))?.fecha_nacimiento || "",
        ss: personalDetailsById.get(Number(activity.personal_id))?.ss || "",
        cuenta_corriente:
          personalDetailsById.get(Number(activity.personal_id))?.cuenta_corriente || "",
      }));
      renderActivityFilterOptions();
      applyActivitiesFilters();
    } catch (error) {
      activitiesListSummary.textContent = "No se pudieron cargar las actividades.";
      activitiesTableBody.innerHTML =
        '<tr><td colspan="7" class="empty-state">Error cargando actividades.</td></tr>';
      setStatus(`No se pudieron cargar las actividades: ${error.message}`, "error");
    }
  }

  function renderActivitiesTable() {
    activitiesListSummary.textContent = `${filteredActivitiesRows.length} actividades mostradas de ${activitiesRows.length}`;

    if (!filteredActivitiesRows.length) {
      activitiesTableBody.innerHTML =
        '<tr><td colspan="7" class="empty-state">No hay actividades con esos filtros.</td></tr>';
      return;
    }

    activitiesTableBody.innerHTML = filteredActivitiesRows
      .map(
        (activity) => `
          <tr>
            <td>${escapeHtml(activity.personal)}</td>
            <td>${escapeHtml(activity.instalacion)}</td>
            <td>${escapeHtml(activity.puesto)}</td>
            <td>
              ${escapeHtml(formatDate(activity.fecha_inicio))}<br />
              <span class="muted-text">${escapeHtml(formatDate(activity.fecha_fin))}</span>
            </td>
            <td>
              ${escapeHtml(formatTime(activity.hora_inicio))} - ${escapeHtml(formatTime(activity.hora_fin))}<br />
              <span class="muted-text">${escapeHtml(formatWeekdays(activity.dias_semana))}</span>
            </td>
            <td>
              ${escapeHtml(formatBooleanStatus(activity.llamamiento_enviado))}<br />
              <span class="muted-text">${escapeHtml(formatCallResponse(activity.respuesta_llamamiento))}</span>
            </td>
            <td>
              <button class="compact-button tooltip-button" type="button" aria-label="Editar actividad" data-edit-activity="${escapeHtml(activity.id)}">
                ${renderIcon("edit")}
              </button>
            </td>
          </tr>
        `
      )
      .join("");
  }

  function getActivitySortValues(activity, field) {
    if (field === "fechas") {
      return [activity.fecha_inicio, activity.fecha_fin];
    }

    if (field === "horario") {
      return [activity.hora_inicio, activity.hora_fin];
    }

    if (field === "llamamiento") {
      return [
        activity.llamamiento_enviado ? "1" : "0",
        formatCallResponse(activity.respuesta_llamamiento),
      ];
    }

    return [activity[field]];
  }

  function compareActivityRows(leftRow, rightRow) {
    for (const sort of activitiesSort) {
      const leftValues = getActivitySortValues(leftRow, sort.field);
      const rightValues = getActivitySortValues(rightRow, sort.field);

      for (let index = 0; index < leftValues.length; index += 1) {
        const left = String(leftValues[index] ?? "");
        const right = String(rightValues[index] ?? "");
        const result = left.localeCompare(right, "es", { numeric: true, sensitivity: "base" });

        if (result !== 0) {
          return sort.direction === "asc" ? result : -result;
        }
      }
    }

    return String(leftRow.id ?? "").localeCompare(String(rightRow.id ?? ""), "es", {
      numeric: true,
      sensitivity: "base",
    });
  }

  function updateActivitiesSortButtons() {
    document.querySelectorAll("[data-activity-sort-field]").forEach((button) => {
      const sortIndex = activitiesSort.findIndex(
        (sort) => sort.field === button.dataset.activitySortField
      );
      const sort = activitiesSort[sortIndex];

      button.classList.toggle("active", Boolean(sort));
      button.dataset.direction = sort?.direction || "";
      button.dataset.priority = sort ? String(sortIndex + 1) : "";
    });
  }

  function applyActivitiesFilters() {
    let filtersChanged = true;
    for (let attempts = 0; filtersChanged && attempts < 3; attempts += 1) {
      filtersChanged = renderActivityFilterOptions();
    }

    const filters = getActivityFilterValues();
    filteredActivitiesRows = activitiesRows.filter((activity) => {
      return activityMatchesFilterValues(activity, filters);
    });

    filteredActivitiesRows.sort(compareActivityRows);
    updateActivitiesSortButtons();
    renderActivitiesTable();

    if (!activitiesReportPanel.classList.contains("hidden")) {
      renderActivitiesReport();
    }
  }

  function getWorkedDaysInWeek(activity, week) {
    const activityStart = parseDateValue(activity.fecha_inicio);
    const activityEnd = parseDateValue(activity.fecha_fin);
    const weekStart = parseDateValue(week.start);
    const weekEnd = parseDateValue(week.end);

    if (!activityStart || !activityEnd || activityEnd < weekStart || activityStart > weekEnd) {
      return [];
    }

    const activityWeekdays = new Set((activity.dias_semana || []).map(Number));
    const workedDays = [];
    const from = activityStart > weekStart ? activityStart : weekStart;
    const to = activityEnd < weekEnd ? activityEnd : weekEnd;

    for (let current = new Date(from); current <= to; current = addDays(current, 1)) {
      if (activityWeekdays.has(getSpanishWeekday(current))) {
        workedDays.push(formatDateValue(current));
      }
    }

    return workedDays;
  }

  function getWeekBusinessDays(week) {
    const weekStart = parseDateValue(week.start);
    const weekEnd = parseDateValue(week.end);
    const days = [];

    for (let current = new Date(weekStart); current <= weekEnd; current = addDays(current, 1)) {
      if (getSpanishWeekday(current) <= 5) {
        days.push(formatDateValue(current));
      }
    }

    return days;
  }

  function buildActivitiesReportGroupsByInstallation() {
    const byInstallation = new Map();

    filteredActivitiesRows.forEach((activity) => {
      const installation = String(activity.instalacion || "Sin instalacion");
      const person = String(activity.personal || "Sin personal");

      if (!byInstallation.has(installation)) {
        byInstallation.set(installation, new Map());
      }

      const people = byInstallation.get(installation);
      if (!people.has(person)) {
        people.set(
          person,
          ACTIVITY_REPORT_WEEKS.map(() => ({ workedDays: new Set(), hours: 0 }))
        );
      }

      const personWeeks = people.get(person);
      const dailyHours = getActivityDailyHours(activity);
      ACTIVITY_REPORT_WEEKS.forEach((week, weekIndex) => {
        const workedDays = getWorkedDaysInWeek(activity, week);
        workedDays.forEach((day) => personWeeks[weekIndex].workedDays.add(day));
        personWeeks[weekIndex].hours += workedDays.length * dailyHours;
      });
    });

    return Array.from(byInstallation.entries()).sort(([left], [right]) =>
      left.localeCompare(right, "es", { sensitivity: "base" })
    );
  }

  function buildActivitiesReportGroupsByPersonal() {
    const byPerson = new Map();

    filteredActivitiesRows.forEach((activity) => {
      const personId = String(activity.personal_id ?? activity.personal ?? "sin-personal");

      if (!byPerson.has(personId)) {
        byPerson.set(personId, {
          person: String(activity.personal || "Sin personal"),
          dni: activity.dni || "",
          fechaNacimiento: activity.fecha_nacimiento || "",
          ss: activity.ss || "",
          cuentaCorriente: activity.cuenta_corriente || "",
          latestUpdatedAt: activity.updated_at || "",
          weeks: ACTIVITY_REPORT_WEEKS.map(() => ({ workedDays: new Set(), hours: 0 })),
        });
      }

      const personData = byPerson.get(personId);
      if (
        String(activity.updated_at || "").localeCompare(String(personData.latestUpdatedAt || "")) > 0
      ) {
        personData.latestUpdatedAt = activity.updated_at || "";
      }
      const dailyHours = getActivityDailyHours(activity);
      ACTIVITY_REPORT_WEEKS.forEach((week, weekIndex) => {
        const workedDays = getWorkedDaysInWeek(activity, week);
        workedDays.forEach((day) => personData.weeks[weekIndex].workedDays.add(day));
        personData.weeks[weekIndex].hours += workedDays.length * dailyHours;
      });
    });

    return Array.from(byPerson.values()).sort((left, right) => {
      const updatedCompare = String(right.latestUpdatedAt || "").localeCompare(
        String(left.latestUpdatedAt || "")
      );

      if (updatedCompare !== 0) {
        return updatedCompare;
      }

      return left.person.localeCompare(right.person, "es", { sensitivity: "base" });
    });
  }

  function getReportWeekStatus(workedDays, requiredDays) {
    const isComplete =
      requiredDays.length > 0 && requiredDays.every((day) => workedDays.has(day));

    if (isComplete) {
      return "complete";
    }

    if (workedDays.size > 0) {
      return "partial";
    }

    return "";
  }

  function buildPersonDetails(row) {
    return [
      row.ss ? `SS: ${row.ss}` : "",
      row.dni ? `DNI: ${row.dni}` : "",
      row.fechaNacimiento ? `Fecha nac.: ${formatDate(row.fechaNacimiento)}` : "",
      row.cuentaCorriente ? `Cuenta: ${row.cuentaCorriente}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function buildWeekSummary(weeks, totals, weekBusinessDays) {
    return weeks.map((weekData, weekIndex) => {
      const status = getReportWeekStatus(weekData.workedDays, weekBusinessDays[weekIndex]);

      if (status === "complete") {
        totals[weekIndex].complete += 1;
      } else if (status === "partial") {
        totals[weekIndex].partial += 1;
      }
      totals[weekIndex].hours += weekData.hours;

      return { status, hours: weekData.hours };
    });
  }

  function buildActivitiesReportViewModel(mode = currentActivitiesReportMode) {
    const weekBusinessDays = ACTIVITY_REPORT_WEEKS.map(getWeekBusinessDays);

    if (mode === "personal") {
      const totals = ACTIVITY_REPORT_WEEKS.map(() => ({ complete: 0, partial: 0, hours: 0 }));
      const rows = buildActivitiesReportGroupsByPersonal().map((personData) => ({
        person: personData.person,
        dni: personData.dni,
        fechaNacimiento: personData.fechaNacimiento,
        ss: personData.ss,
        cuentaCorriente: personData.cuentaCorriente,
        latestUpdatedAt: personData.latestUpdatedAt,
        details: buildPersonDetails(personData),
        weeks: buildWeekSummary(personData.weeks, totals, weekBusinessDays),
      }));

      return rows.length ? [{ installation: "", rows, totals }] : [];
    }

    return buildActivitiesReportGroupsByInstallation().map(([installation, people]) => {
      const totals = ACTIVITY_REPORT_WEEKS.map(() => ({ complete: 0, partial: 0, hours: 0 }));
      const rows = Array.from(people.entries())
        .sort(([left], [right]) => left.localeCompare(right, "es", { sensitivity: "base" }))
        .map(([person, weeks]) => ({
          person,
          dni: "",
          fechaNacimiento: "",
          ss: "",
          cuentaCorriente: "",
          details: "",
          weeks: buildWeekSummary(weeks, totals, weekBusinessDays),
        }));

      return { installation, rows, totals };
    });
  }

  function renderActivitiesReport() {
    const isPersonalReport = currentActivitiesReportMode === "personal";
    const groups = buildActivitiesReportViewModel();
    lastActivitiesReportGroups = groups;

    activitiesReportTitle.textContent = isPersonalReport
      ? "Actividades por personal y semana"
      : "Actividades por instalacion y semana";
    activitiesReportSummary.textContent = `${filteredActivitiesRows.length} actividades filtradas. Verde: semana completa. Azul: semana parcial.`;

    if (!groups.length) {
      activitiesReportContent.innerHTML =
        '<p class="empty-state">No hay actividades con los filtros actuales.</p>';
      return;
    }

    activitiesReportContent.innerHTML = groups
      .map((group) => {
        const rows = group.rows
          .map((row) => {
            const cells = row.weeks
              .map((week) => {
                if (week.status === "complete") {
                  return `<td class="report-week-cell complete">Completa<br /><span>${formatHours(
                    week.hours
                  )} h</span></td>`;
                }

                if (week.status === "partial") {
                  return `<td class="report-week-cell partial">Parcial<br /><span>${formatHours(
                    week.hours
                  )} h</span></td>`;
                }

                return '<td class="report-week-cell"></td>';
              })
              .join("");

            return `
              <tr>
                <th scope="row">
                  ${escapeHtml(row.person)}
                  ${
                    row.details
                      ? `<small>${escapeHtml(row.details).replaceAll("\n", "<br />")}</small>`
                      : ""
                  }
                </th>
                ${cells}
              </tr>
            `;
          })
          .join("");

        const totalsRow = `
          <tr class="report-totals-row">
            <th scope="row">Totales</th>
            ${group.totals
              .map(
                (total) =>
                  `<td>${total.complete} (${total.partial})<br /><span>${formatHours(
                    total.hours
                  )} h</span></td>`
              )
              .join("")}
          </tr>
        `;

        return `
          <section class="report-installation-section">
            ${group.installation ? `<h3>${escapeHtml(group.installation)}</h3>` : ""}
            <div class="table-wrap report-table-wrap">
              <table class="activities-report-table">
                <thead>
                  <tr>
                    <th>Personal</th>
                    ${ACTIVITY_REPORT_WEEKS.map(
                      (week) => `<th>${escapeHtml(week.label)}</th>`
                    ).join("")}
                  </tr>
                </thead>
                <tbody>${rows}${totalsRow}</tbody>
              </table>
            </div>
          </section>
        `;
      })
      .join("");
  }

  function openActivitiesReport(mode = "installation") {
    currentActivitiesReportMode = mode;
    renderActivitiesReport();
    activitiesReportPanel.classList.remove("hidden");
    activitiesReportBackdrop.classList.remove("hidden");
  }

  function closeActivitiesReport() {
    activitiesReportPanel.classList.add("hidden");
    activitiesReportBackdrop.classList.add("hidden");
  }

  async function downloadActivitiesReportPdf() {
    try {
      if (!lastActivitiesReportGroups.length) {
        renderActivitiesReport();
      }

      if (!lastActivitiesReportGroups.length) {
        setStatus("No hay datos filtrados para generar el PDF.", "error");
        return;
      }

      const { jsPDF } = await getJsPdfClient();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const rowHeight = 7;
      const personReportRowHeight = currentActivitiesReportMode === "personal" ? 19 : rowHeight;
      const personWidth = 58;
      const weekWidth = (pageWidth - margin * 2 - personWidth) / ACTIVITY_REPORT_WEEKS.length;
      let y = margin;

      const ensureSpace = (neededHeight) => {
        if (y + neededHeight <= pageHeight - margin) {
          return;
        }

        doc.addPage();
        y = margin;
      };

      const drawHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(
          currentActivitiesReportMode === "personal"
            ? "Actividades por personal y semana"
            : "Actividades por instalacion y semana",
          margin,
          y
        );
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(
          `${filteredActivitiesRows.length} actividades filtradas. Totales: completas (parciales) y horas.`,
          margin,
          y
        );
        y += 8;
      };

      const drawTableHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("Personal", margin, y);
        ACTIVITY_REPORT_WEEKS.forEach((week, index) => {
          doc.text(week.label, margin + personWidth + weekWidth * index, y, {
            maxWidth: weekWidth - 1,
          });
        });
        y += rowHeight;
      };

      drawHeader();

      lastActivitiesReportGroups.forEach((group) => {
        ensureSpace(18);
        if (group.installation) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(group.installation, margin, y, { maxWidth: pageWidth - margin * 2 });
          y += rowHeight;
        }
        drawTableHeader();

        group.rows.forEach((row) => {
          ensureSpace(personReportRowHeight + 2);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.text(row.person, margin, y, { maxWidth: personWidth - 2 });
          if (row.details) {
            doc.setFontSize(6);
            row.details.split("\n").forEach((detail, index) => {
              doc.text(detail, margin, y + 3 + index * 3, { maxWidth: personWidth - 2 });
            });
            doc.setFontSize(7);
          }

          row.weeks.forEach((week, index) => {
            const x = margin + personWidth + weekWidth * index;
            if (week.status === "complete") {
              doc.setFillColor(204, 238, 221);
              doc.rect(x - 1, y - 5, weekWidth - 1, 6, "F");
              doc.text(`Completa ${formatHours(week.hours)} h`, x, y, { maxWidth: weekWidth - 1 });
            } else if (week.status === "partial") {
              doc.setFillColor(216, 235, 255);
              doc.rect(x - 1, y - 5, weekWidth - 1, 6, "F");
              doc.text(`Parcial ${formatHours(week.hours)} h`, x, y, { maxWidth: weekWidth - 1 });
            }
          });
          y += personReportRowHeight;
        });

        ensureSpace(rowHeight + 4);
        doc.setFont("helvetica", "bold");
        doc.text("Totales", margin, y);
        group.totals.forEach((total, index) => {
          doc.text(
            `${total.complete} (${total.partial}) ${formatHours(total.hours)} h`,
            margin + personWidth + weekWidth * index,
            y,
            { maxWidth: weekWidth - 1 }
          );
        });
        y += rowHeight + 4;
      });

      const today = new Date().toISOString().slice(0, 10);
      doc.save(
        `informe-actividades-${
          currentActivitiesReportMode === "personal" ? "personal-" : ""
        }${today}.pdf`
      );
      setStatus("PDF de informe de actividades generado correctamente.", "success");
    } catch (error) {
      setStatus(`No se pudo generar el PDF: ${error?.message ?? "error desconocido"}`, "error");
    }
  }

  function downloadActivitiesReportExcel() {
    if (!lastActivitiesReportGroups.length) {
      renderActivitiesReport();
    }

    if (!lastActivitiesReportGroups.length) {
      setStatus("No hay datos filtrados para generar el Excel.", "error");
      return;
    }

    const tableRows = [];
    const isPersonalReport = currentActivitiesReportMode === "personal";
    tableRows.push(
      isPersonalReport
        ? ["Personal", ...ACTIVITY_REPORT_WEEKS.map((week) => week.label)]
        : ["Instalacion", "Personal", ...ACTIVITY_REPORT_WEEKS.map((week) => week.label)]
    );

    lastActivitiesReportGroups.forEach((group) => {
      group.rows.forEach((row) => {
        const weekCells = row.weeks.map((week) => {
          if (week.status === "complete") {
            return `Completa - ${formatHours(week.hours)} h`;
          }

          if (week.status === "partial") {
            return `Parcial - ${formatHours(week.hours)} h`;
          }

          return "";
        });
        tableRows.push(
          isPersonalReport
            ? [row.details ? `${row.person}\n${row.details}` : row.person, ...weekCells]
            : [group.installation, row.person, ...weekCells]
        );
      });

      tableRows.push(
        isPersonalReport
          ? [
              "Totales",
              ...group.totals.map(
                (total) => `${total.complete} (${total.partial}) - ${formatHours(total.hours)} h`
              ),
            ]
          : [
              group.installation,
              "Totales",
              ...group.totals.map(
                (total) => `${total.complete} (${total.partial}) - ${formatHours(total.hours)} h`
              ),
            ]
      );
      tableRows.push([]);
    });

    const renderExcelCell = (cell) => escapeHtml(cell).replaceAll("\n", "<br />");
    const htmlRows = tableRows
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => `<td>${renderExcelCell(cell)}</td>`)
            .join("")}</tr>`
      )
      .join("");
    const workbook = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>td { vertical-align: top; white-space: pre-line; }</style>
        </head>
        <body>
          <table>${htmlRows}</table>
        </body>
      </html>
    `;
    const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `informe-actividades-${isPersonalReport ? "personal-" : ""}${today}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Excel de informe de actividades generado correctamente.", "success");
  }

  function openActivityEdit(activityId) {
    const activity = activitiesRows.find((row) => String(row.id) === String(activityId));

    if (!activity) {
      setStatus("No se encontro la actividad seleccionada.", "error");
      return;
    }

    editActivityId.value = activity.id;
    editActivityPersonal.value = String(activity.personal_id);
    editActivityContrato.value = String(activity.contrato_id);
    editActivityEmpresa.value = String(activity.empresa_id);
    editActivityInstalacion.value = String(activity.instalacion_id);
    editActivityPuesto.value = String(activity.puesto_id);
    editActivitySituacion.value = String(activity.situacion_id);
    editActivityTipoHora.value = String(activity.tipo_hora_id);
    activityEditForm.elements.fecha_inicio.value = activity.fecha_inicio || "";
    activityEditForm.elements.fecha_fin.value = activity.fecha_fin || "";
    activityEditForm.elements.hora_inicio.value = formatTime(activity.hora_inicio);
    activityEditForm.elements.hora_fin.value = formatTime(activity.hora_fin);
    activityEditForm.elements.llamamiento_enviado.checked = Boolean(activity.llamamiento_enviado);
    activityEditForm.elements.respuesta_llamamiento.value = activity.respuesta_llamamiento || "";
    activityEditForm.elements.observaciones.value = activity.observaciones || "";
    setSelectedWeekdays(activityEditForm, activity.dias_semana);
    activityEditTitle.textContent = activity.personal || "Actividad seleccionada";
    activityEditPanel.classList.remove("hidden");
    activityEditPanelBackdrop.classList.remove("hidden");
  }

  function closeActivityEdit() {
    activityEditForm.reset();
    editActivityId.value = "";
    activityEditPanel.classList.add("hidden");
    activityEditPanelBackdrop.classList.add("hidden");
  }

  function openActivityCreatePanel() {
    void loadActivityCatalogs().then(() => {
      applyActivityFormDefaults();
      activityCreatePanel.classList.remove("hidden");
      activityPanelBackdrop.classList.remove("hidden");
    });
  }

  function closeActivityCreatePanel() {
    activityCreatePanel.classList.add("hidden");
    activityPanelBackdrop.classList.add("hidden");
  }

  function duplicateActivityToCreateForm() {
    if (!editActivityId.value) {
      return;
    }

    activityForm.reset();
    activityPersonal.value = "";
    activityContrato.value = editActivityContrato.value;
    activityEmpresa.value = editActivityEmpresa.value;
    activityInstalacion.value = editActivityInstalacion.value;
    activityPuesto.value = editActivityPuesto.value;
    activitySituacion.value = editActivitySituacion.value;
    activityTipoHora.value = editActivityTipoHora.value;
    activityForm.elements.fecha_inicio.value = activityEditForm.elements.fecha_inicio.value;
    activityForm.elements.fecha_fin.value = activityEditForm.elements.fecha_fin.value;
    activityForm.elements.hora_inicio.value = activityEditForm.elements.hora_inicio.value;
    activityForm.elements.hora_fin.value = activityEditForm.elements.hora_fin.value;
    activityForm.elements.llamamiento_enviado.checked =
      activityEditForm.elements.llamamiento_enviado.checked;
    activityForm.elements.respuesta_llamamiento.value =
      activityEditForm.elements.respuesta_llamamiento.value;
    activityForm.elements.observaciones.value = activityEditForm.elements.observaciones.value;
    setSelectedWeekdays(activityForm, getSelectedWeekdays(activityEditForm));
    activityCreatePanel.classList.remove("hidden");
    activityPanelBackdrop.classList.remove("hidden");
    activityPersonal.focus();
    closeActivityEdit();
    setStatus("Actividad duplicada. Selecciona el personal y guarda el nuevo registro.", "success");
  }

  async function handleActivitySubmit(event) {
    event.preventDefault();

    const payload = getActivityPayload(activityForm);

    if (!payload) {
      return;
    }

    try {
      const submitButton = activityForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      activitiesSummary.textContent = "Guardando actividad...";

      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("actividades").insert(payload);

      if (error) {
        throw error;
      }

      activityForm.reset();
      activitiesSummary.textContent = "Actividad guardada. Puedes crear otra actividad.";
      closeActivityCreatePanel();
      await loadActivities();
      setStatus("Actividad guardada.", "success");
    } catch (error) {
      activitiesSummary.textContent = "No se pudo guardar la actividad.";
      setStatus(`No se pudo guardar la actividad: ${error.message}`, "error");
    } finally {
      const submitButton = activityForm.querySelector('button[type="submit"]');
      submitButton.disabled = false;
    }
  }

  async function handleActivityEditSubmit(event) {
    event.preventDefault();

    const activityId = editActivityId.value;
    const payload = getActivityPayload(activityEditForm);

    if (!activityId || !payload) {
      return;
    }

    try {
      const submitButton = activityEditForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;

      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("actividades").update(payload).eq("id", activityId);

      if (error) {
        throw error;
      }

      closeActivityEdit();
      await loadActivities();
      setStatus("Actividad actualizada.", "success");
    } catch (error) {
      setStatus(`No se pudo actualizar la actividad: ${error.message}`, "error");
    } finally {
      const submitButton = activityEditForm.querySelector('button[type="submit"]');
      submitButton.disabled = false;
    }
  }

  async function handleActivityDelete() {
    const activityId = editActivityId.value;

    if (!activityId) {
      return;
    }

    const confirmed = window.confirm("¿Quieres borrar esta actividad?");
    if (!confirmed) {
      return;
    }

    try {
      deleteActivityButton.disabled = true;

      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("actividades").delete().eq("id", activityId);

      if (error) {
        throw error;
      }

      closeActivityEdit();
      await loadActivities();
      setStatus("Actividad borrada.", "success");
    } catch (error) {
      setStatus(`No se pudo borrar la actividad: ${error.message}`, "error");
    } finally {
      deleteActivityButton.disabled = false;
    }
  }

  async function loadAssignmentCatalogs() {
    if (assignmentCatalogsLoaded) {
      return;
    }

    assignmentsSummary.textContent = "Cargando listas maestras...";

    try {
      const supabase = await getSupabaseClient();
      const [installationRows, personalRows, assignmentPersonalSettingsRows] = await Promise.all([
        fetchCatalog(supabase, "instalaciones", "id,instalacion", "instalacion", [
          { column: "activo", value: true },
        ]),
        fetchCatalog(supabase, "personal", "id,personal", "personal", [
          { column: "vinculacion_id", operator: "in", value: [1, 2] },
        ]),
        supabase.from("actividades_personal").select("personal_id"),
      ]);

      assignmentInstallationRows = installationRows;
      if (assignmentPersonalSettingsRows.error) {
        throw assignmentPersonalSettingsRows.error;
      }

      const assignedPersonalIds = new Set(
        (assignmentPersonalSettingsRows.data ?? []).map((row) => Number(row.personal_id))
      );
      assignmentPersonalRows = personalRows.filter((row) =>
        assignedPersonalIds.has(Number(row.id))
      );
      renderAssignmentRecordOptions();
      renderAssignmentDualLists();
      assignmentCatalogsLoaded = true;
    } catch (error) {
      assignmentsSummary.textContent = "No se pudieron cargar las listas maestras.";
      setStatus(`No se pudieron cargar las listas de asignaciones: ${error.message}`, "error");
    }
  }

  async function loadAssignments() {
    await loadAssignmentCatalogs();

    assignmentsSummary.textContent = "Cargando asignaciones...";
    assignmentsTableBody.innerHTML =
      '<tr><td colspan="12" class="empty-state">Cargando asignaciones...</td></tr>';

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from("asignaciones_detalle")
        .select(
          "id,instalacion_id,instalacion,semana_01,semana_02,semana_03,semana_04,semana_05,semana_06,semana_07,semana_08,semana_09,semana_10,semana_11"
        )
        .order("instalacion", { ascending: true });

      if (error) {
        throw error;
      }

      assignmentRows = data ?? [];
      renderAssignmentsTable();
    } catch (error) {
      assignmentsSummary.textContent = "No se pudieron cargar las asignaciones.";
      assignmentsTableBody.innerHTML =
        '<tr><td colspan="12" class="empty-state">Error cargando asignaciones.</td></tr>';
      setStatus(`No se pudieron cargar las asignaciones: ${error.message}`, "error");
    }
  }

  function getAssignmentForInstallation(instalacionId) {
    return assignmentRows.find((row) => Number(row.instalacion_id) === Number(instalacionId));
  }

  function renderAssignmentRecordOptions() {
    const assignedInstallationIds = new Set(
      assignmentRows.map((row) => String(row.instalacion_id))
    );
    const availableInstallations = assignmentInstallationRows.filter(
      (installation) => !assignedInstallationIds.has(String(installation.id))
    );

    renderCatalogOptions(
      assignmentRecordInstalacion,
      availableInstallations,
      "id",
      "instalacion",
      "Seleccionar instalacion"
    );
  }

  function renderAssignmentCell(instalacionId, weekField, personalIds) {
    const ids = Array.isArray(personalIds) ? personalIds : [];
    const summary = ids.length
      ? ids
          .slice(0, 3)
          .map((id) => getPersonalName(id))
          .join(", ")
      : "Sin asignar";
    const extra = ids.length > 3 ? ` +${ids.length - 3}` : "";

    return `
      <td>
        <button
          class="assignment-cell-button"
          type="button"
          data-assignment-instalacion="${escapeHtml(instalacionId)}"
          data-assignment-week="${escapeHtml(weekField)}"
        >
          <span>${escapeHtml(ids.length ? `${ids.length} pers.` : "0")}</span>
          <small>${escapeHtml(summary)}${escapeHtml(extra)}</small>
        </button>
      </td>
    `;
  }

  function renderAssignmentsTable() {
    renderAssignmentRecordOptions();

    if (!assignmentRows.length) {
      assignmentsSummary.textContent = "No hay registros de asignaciones.";
      assignmentsTableBody.innerHTML =
        '<tr><td colspan="12" class="empty-state">Crea un registro para empezar a asignar personal.</td></tr>';
      return;
    }

    assignmentsSummary.textContent = `${assignmentRows.length} registros de asignaciones`;
    assignmentsTableBody.innerHTML = assignmentRows
      .map((assignment) => {
        return `
          <tr>
            <th scope="row">
              ${escapeHtml(assignment.instalacion)}
            </th>
            ${ASSIGNMENT_WEEK_FIELDS.map((weekField) =>
              renderAssignmentCell(
                assignment.instalacion_id,
                weekField,
                assignment[weekField]
              )
            ).join("")}
          </tr>
        `;
      })
      .join("");
  }

  function renderAssignmentDeleteList() {
    if (!assignmentRows.length) {
      assignmentDeleteList.innerHTML =
        '<p class="empty-state">No hay registros para borrar.</p>';
      return;
    }

    assignmentDeleteList.innerHTML = assignmentRows
      .map((assignment) => {
        const totalAssigned = ASSIGNMENT_WEEK_FIELDS.reduce((total, weekField) => {
          const weekValue = assignment[weekField];
          return total + (Array.isArray(weekValue) ? weekValue.length : 0);
        }, 0);

        return `
          <label class="assignment-delete-option">
            <input type="checkbox" name="assignment_ids" value="${escapeHtml(assignment.id)}" />
            <span>
              <strong>${escapeHtml(assignment.instalacion)}</strong>
              <small>${escapeHtml(`${totalAssigned} asignaciones semanales`)}</small>
            </span>
          </label>
        `;
      })
      .join("");
  }

  function openAssignmentRecordPanel() {
    void loadAssignmentCatalogs().then(() => {
      renderAssignmentRecordOptions();
      assignmentRecordPanel.classList.remove("hidden");
      assignmentRecordPanelBackdrop.classList.remove("hidden");
    });
  }

  function closeAssignmentRecordPanel() {
    assignmentRecordForm.reset();
    assignmentRecordPanel.classList.add("hidden");
    assignmentRecordPanelBackdrop.classList.add("hidden");
  }

  function openAssignmentDeletePanel() {
    void loadAssignments().then(() => {
      renderAssignmentDeleteList();
      assignmentDeletePanel.classList.remove("hidden");
      assignmentDeletePanelBackdrop.classList.remove("hidden");
    });
  }

  function closeAssignmentDeletePanel() {
    assignmentDeleteForm.reset();
    assignmentDeletePanel.classList.add("hidden");
    assignmentDeletePanelBackdrop.classList.add("hidden");
  }

  async function handleAssignmentRecordSubmit(event) {
    event.preventDefault();

    const instalacionId = Number(assignmentRecordInstalacion.value);
    if (!instalacionId) {
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from("asignaciones")
        .insert({ instalacion_id: instalacionId });

      if (error) {
        throw error;
      }

      closeAssignmentRecordPanel();
      await loadAssignments();
      setStatus("Registro de asignacion creado.", "success");
    } catch (error) {
      setStatus(`No se pudo crear el registro: ${error.message}`, "error");
    }
  }

  async function handleAssignmentDeleteSubmit(event) {
    event.preventDefault();

    const selectedIds = Array.from(
      assignmentDeleteForm.querySelectorAll('input[name="assignment_ids"]:checked')
    ).map((input) => Number(input.value));

    if (!selectedIds.length) {
      setStatus("Selecciona al menos un registro para borrar.", "error");
      return;
    }

    const confirmed = window.confirm("¿Quieres borrar este registro de asignaciones?");
    if (!confirmed) {
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("asignaciones").delete().in("id", selectedIds);

      if (error) {
        throw error;
      }

      closeAssignmentDeletePanel();
      await loadAssignments();
      setStatus("Registros de asignacion borrados.", "success");
    } catch (error) {
      setStatus(`No se pudieron borrar los registros: ${error.message}`, "error");
    }
  }

  function openAssignmentEdit(instalacionId, weekField) {
    const installation = assignmentInstallationRows.find(
      (row) => Number(row.id) === Number(instalacionId)
    );
    const assignment = getAssignmentForInstallation(instalacionId) || {};
    const weekNumber = weekField.replace("semana_", "");

    assignmentEditInstalacionId.value = instalacionId;
    assignmentEditWeek.value = weekField;
    assignmentEditTitle.textContent = `Semana ${weekNumber}`;
    assignmentEditSummary.textContent = installation?.instalacion || "";
    assignmentPersonalFilter.value = "";
    currentAssignmentSelectedIds = new Set((assignment[weekField] || []).map((id) => String(id)));
    renderAssignmentDualLists();
    syncAssignmentNavigation();
    assignmentEditPanel.classList.remove("hidden");
    assignmentPanelBackdrop.classList.remove("hidden");
  }

  function closeAssignmentEdit() {
    assignmentEditForm.reset();
    assignmentEditInstalacionId.value = "";
    assignmentEditWeek.value = "";
    currentAssignmentSelectedIds = new Set();
    renderAssignmentDualLists();
    syncAssignmentNavigation();
    assignmentEditPanel.classList.add("hidden");
    assignmentPanelBackdrop.classList.add("hidden");
  }

  function getAssignmentWeekIndex(weekField = assignmentEditWeek.value) {
    return ASSIGNMENT_WEEK_FIELDS.indexOf(weekField);
  }

  function getAssignmentInstallationIndex(instalacionId = assignmentEditInstalacionId.value) {
    return assignmentRows.findIndex(
      (row) => Number(row.instalacion_id) === Number(instalacionId)
    );
  }

  function syncAssignmentNavigation() {
    const weekIndex = getAssignmentWeekIndex();
    const installationIndex = getAssignmentInstallationIndex();
    const hasAssignment = weekIndex >= 0 && installationIndex >= 0;

    if (assignmentPreviousWeekButton) {
      assignmentPreviousWeekButton.disabled = !hasAssignment || weekIndex <= 0;
    }
    if (assignmentNextWeekButton) {
      assignmentNextWeekButton.disabled = !hasAssignment || weekIndex >= ASSIGNMENT_WEEK_FIELDS.length - 1;
    }
    if (assignmentCopyNextWeekButton) {
      assignmentCopyNextWeekButton.disabled = !hasAssignment || weekIndex >= ASSIGNMENT_WEEK_FIELDS.length - 1;
    }
    if (assignmentPreviousInstallationButton) {
      assignmentPreviousInstallationButton.disabled = !hasAssignment || installationIndex <= 0;
    }
    if (assignmentNextInstallationButton) {
      assignmentNextInstallationButton.disabled = !hasAssignment || installationIndex >= assignmentRows.length - 1;
    }
  }

  function navigateAssignmentWeek(delta) {
    const weekIndex = getAssignmentWeekIndex();
    const nextWeekField = ASSIGNMENT_WEEK_FIELDS[weekIndex + delta];

    if (!nextWeekField) {
      return;
    }

    openAssignmentEdit(assignmentEditInstalacionId.value, nextWeekField);
  }

  function navigateAssignmentInstallation(delta) {
    const installationIndex = getAssignmentInstallationIndex();
    const nextAssignment = assignmentRows[installationIndex + delta];

    if (!nextAssignment) {
      return;
    }

    openAssignmentEdit(nextAssignment.instalacion_id, assignmentEditWeek.value);
  }

  async function copyAssignmentToNextWeek() {
    const instalacionId = Number(assignmentEditInstalacionId.value);
    const weekIndex = getAssignmentWeekIndex();
    const nextWeekField = ASSIGNMENT_WEEK_FIELDS[weekIndex + 1];
    const personalIds = getSelectedAssignmentPersonalIds();

    if (!instalacionId || !nextWeekField) {
      setStatus("No hay semana siguiente para copiar.", "error");
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from("asignaciones")
        .upsert({ instalacion_id: instalacionId, [nextWeekField]: personalIds }, { onConflict: "instalacion_id" });

      if (error) {
        throw error;
      }

      await loadAssignments();
      openAssignmentEdit(instalacionId, nextWeekField);
      setStatus("Personal copiado a la semana siguiente.", "success");
    } catch (error) {
      setStatus(`No se pudo copiar la asignacion: ${error.message}`, "error");
    }
  }

  function getSelectedAssignmentPersonalIds() {
    return Array.from(currentAssignmentSelectedIds).map((id) => Number(id));
  }

  function renderAssignmentDualLists() {
    const filter = normalizeText(assignmentPersonalFilter?.value || "");
    const availableRows = assignmentPersonalRows.filter((person) => {
      const id = String(person.id);
      return !currentAssignmentSelectedIds.has(id) && (!filter || normalizeText(person.personal).includes(filter));
    });
    const selectedRows = assignmentPersonalRows.filter((person) =>
      currentAssignmentSelectedIds.has(String(person.id))
    );

    assignmentAvailableSelect.innerHTML = availableRows
      .map(
        (person) =>
          `<option value="${escapeHtml(person.id)}">${escapeHtml(person.personal)}</option>`
      )
      .join("");
    assignmentSelectedSelect.innerHTML = selectedRows
      .map(
        (person) =>
          `<option value="${escapeHtml(person.id)}">${escapeHtml(person.personal)}</option>`
      )
      .join("");
  }

  function addAssignmentSelection(ids) {
    const nextSize = currentAssignmentSelectedIds.size + ids.filter((id) => !currentAssignmentSelectedIds.has(id)).length;

    if (nextSize > 20) {
      setStatus("Solo puedes seleccionar hasta 20 personas por semana.", "error");
      return;
    }

    ids.forEach((id) => currentAssignmentSelectedIds.add(id));
    renderAssignmentDualLists();
    syncAssignmentNavigation();
  }

  function removeAssignmentSelection(ids) {
    ids.forEach((id) => currentAssignmentSelectedIds.delete(id));
    renderAssignmentDualLists();
    syncAssignmentNavigation();
  }

  function getSelectedOptionValues(select) {
    return Array.from(select.selectedOptions).map((option) => option.value);
  }

  async function saveAssignmentWeek(personalIds) {
    const instalacionId = Number(assignmentEditInstalacionId.value);
    const weekField = assignmentEditWeek.value;

    if (!instalacionId || !weekField) {
      return;
    }

    if (personalIds.length > 20) {
      setStatus("Solo puedes seleccionar hasta 20 personas por semana.", "error");
      return;
    }

    try {
      const payload = {
        instalacion_id: instalacionId,
        [weekField]: personalIds,
      };
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from("asignaciones")
        .upsert(payload, { onConflict: "instalacion_id" });

      if (error) {
        throw error;
      }

      closeAssignmentEdit();
      await loadAssignments();
      setStatus("Asignacion guardada.", "success");
    } catch (error) {
      setStatus(`No se pudo guardar la asignacion: ${error.message}`, "error");
    }
  }

  function updateSortButtons() {
    document.querySelectorAll("[data-sort-field]").forEach((button) => {
      const isActive = button.dataset.sortField === studentsSort.field;
      button.classList.toggle("active", isActive);
      button.dataset.direction = isActive ? studentsSort.direction : "";
    });
  }

  async function applyStudentFilters() {
    try {
      const supabase = await getSupabaseClient();
      await Promise.all([
        fetchStudentsPage(supabase),
        loadStudentFilterOptions(supabase),
      ]);
      updateSortButtons();
      renderStudentsTable();
    } catch (error) {
      studentsSummary.textContent = "No se pudieron cargar los datos.";
      studentsTableBody.innerHTML =
        '<tr><td colspan="4" class="empty-state">Error cargando alumnado.</td></tr>';
      setStatus(`No se pudo cargar alumnado: ${error.message}`, "error");
    }
  }

  function getStudentFilters() {
    return {
      centro: String(filterCentro.value || "").trim(),
      semana: String(filterSemana.value || "").trim(),
      alumnado: String(filterAlumnado.value || "").trim(),
    };
  }

  function applyStudentFiltersToQuery(query, filters) {
    if (filters.centro) {
      query = query.eq("centro", filters.centro);
    }

    if (filters.semana) {
      query = query.eq("semana", filters.semana);
    }

    if (filters.alumnado) {
      query = query.ilike("alumnado", `%${filters.alumnado}%`);
    }

    return query;
  }

  function applyStudentSortToQuery(query) {
    const columnMap = {
      centro: "centro",
      semana: "semana",
      alumnado: "alumnado",
      movil: "movil",
    };
    const primaryColumn = columnMap[studentsSort.field] || "centro";
    const ascending = studentsSort.direction !== "desc";
    const fallback = ["centro", "semana", "alumnado"];
    query = query.order(primaryColumn, { ascending });
    fallback.forEach((column) => {
      if (column !== primaryColumn) {
        query = query.order(column, { ascending: true });
      }
    });
    return query;
  }

  async function fetchStudentsPage(supabase) {
    const filters = getStudentFilters();
    const from = (studentsCurrentPage - 1) * studentsRowsPerPage;
    const to = from + studentsRowsPerPage - 1;
    let query = supabase
      .from("concilia_usuarios")
      .select("codigo_persona,centro,semana,alumnado,movil,nee,fecha_nacimiento", { count: "exact" })
      .range(from, to);
    query = applyStudentFiltersToQuery(query, filters);
    query = applyStudentSortToQuery(query);

    const { data, error, count } = await query;
    if (error) {
      throw error;
    }

    studentRows = data ?? [];
    filteredStudentRows = studentRows;
    studentsTotalCount = count ?? studentRows.length;
  }

  async function loadStudentFilterOptions(supabase) {
    const filters = getStudentFilters();
    const { data, error } = await supabase.rpc("get_concilia_filter_options", {
      p_centro: filters.centro || null,
      p_semana: filters.semana || null,
      p_alumnado: filters.alumnado || null,
    });

    if (error) {
      throw error;
    }

    renderStudentFilterOptionRows(data ?? []);
  }

  async function loadWeeklySummary(supabase) {
    const { data, error } = await supabase.rpc("get_concilia_weekly_summary");
    if (error) {
      throw error;
    }
    renderWeeklySummaryRows(data ?? []);
  }

  async function loadAttendanceMatrix(supabase) {
    const { data, error } = await supabase.rpc("get_concilia_attendance_matrix", {
      p_centro: String(attendanceCenterFilter.value || "").trim() || null,
      p_limit: attendanceRowsPerPage,
      p_offset: (attendanceCurrentPage - 1) * attendanceRowsPerPage,
    });
    if (error) {
      throw error;
    }
    renderAttendanceRows(data ?? []);
  }

  async function loadNeeRows(supabase) {
    const { data, error } = await supabase.rpc("get_concilia_nee_rows", {
      p_alumnado: String(filterNeeAlumnado.value || "").trim() || null,
      p_limit: neeRowsPerPage,
      p_offset: (neeCurrentPage - 1) * neeRowsPerPage,
    });
    if (error) {
      throw error;
    }
    renderNeeRows(data ?? []);
  }

  async function fetchAllStudents(supabase) {
    const pageSize = 1000;
    const rows = [];

    for (let from = 0; ; from += pageSize) {
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("concilia_usuarios")
        .select("codigo_persona,centro,semana,alumnado,movil,nee,fecha_nacimiento")
        .order("centro", { ascending: true })
        .order("semana", { ascending: true })
        .order("alumnado", { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      rows.push(...(data ?? []));

      if (!data || data.length < pageSize) {
        return rows;
      }
    }
  }

  /**
   * Delegamos al cliente compartido (shared/supabase-client.js).
   * Fallback local si el shared no está disponible.
   */
  async function getSupabaseClient() {
    if (window.SupabaseApp) {
      return window.SupabaseApp.getClient();
    }

    if (!hasSupabaseConfig) {
      throw new Error("Falta la configuracion de Supabase en config.js.");
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const client = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    client.auth.onAuthStateChange((_event, session) => {
      window.SupabaseApp?.setSession(session);
    });
    return client;
  }

  async function getJsPdfClient() {
    if (jsPdfModulePromise) {
      return jsPdfModulePromise;
    }

    jsPdfModulePromise = import("https://esm.sh/jspdf@2.5.1");
    return jsPdfModulePromise;
  }

  async function getCurrentSession() {
    // Delegamos a shared/supabase-client.js
    if (window.SupabaseApp) {
      return window.SupabaseApp.ensureSession({ silent: true });
    }

    // Fallback local
    const supabase = await getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  function showLogin() {
    authView.classList.remove("hidden");
    appView.classList.add("hidden");
    loginForm.classList.remove("hidden");
    passwordSetupForm.classList.add("hidden");
  }

  function showPasswordSetup() {
    authView.classList.remove("hidden");
    appView.classList.add("hidden");
    loginForm.classList.add("hidden");
    passwordSetupForm.classList.remove("hidden");
  }

  function showApp(email) {
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    sessionSummary.textContent = `Sesion iniciada${email ? `: ${email}` : ""}`;
  }

  async function loadStudents() {
    studentsSummary.textContent = "Cargando datos...";
    studentsTableBody.innerHTML =
      '<tr><td colspan="4" class="empty-state">Cargando alumnado...</td></tr>';

    try {
      const supabase = await getSupabaseClient();
      await Promise.all([
        fetchStudentsPage(supabase),
        loadStudentFilterOptions(supabase),
        loadWeeklySummary(supabase),
        loadAttendanceMatrix(supabase),
        loadNeeRows(supabase),
      ]);
    } catch (error) {
      studentsSummary.textContent = "No se pudieron cargar los datos.";
      studentsTableBody.innerHTML =
        '<tr><td colspan="4" class="empty-state">Error cargando alumnado.</td></tr>';
      setStatus(`No se pudo cargar alumnado: ${error.message}`, "error");
      return;
    }

    updateSortButtons();
    renderStudentsTable();
  }

  async function enterApp(session) {
    showApp(session.user.email ?? "");
    await loadStudents();
  }

  // -----------------------------------------------
  // Auth handlers — usando shared/auth.js cuando está disponible
  // -----------------------------------------------

  const _authHandlers = window.SupabaseApp?.createAuthHandlers({
    setStatus,
    onLoginSuccess: async (data) => {
      window.SupabaseApp?.setSession(data.session);
      loginForm.reset();
      clearAuthUrl();
      await enterApp(data.session);
    },
    onLogoutSuccess: async () => {
      window.SupabaseApp?.setSession(null);
      studentRows = [];
      filteredStudentRows = [];
      studentsTotalCount = 0;
      attendanceTotalCount = 0;
      neeTotalCount = 0;
      studentsCurrentPage = 1;
      attendanceCurrentPage = 1;
      neeCurrentPage = 1;
      renderStudentsTable();
      renderWeeklySummary();
      renderAttendanceMatrix();
      buildNeeRows();
      renderNeeTable();
      showLogin();
    },
    onInviteSuccess: async (email) => {
      const session = await getCurrentSession();
      passwordSetupForm.reset();
      clearAuthUrl();
      await enterApp(session);
    },
  });

  async function handleLogin(event) {
    if (_authHandlers) {
      return _authHandlers.handleLogin(event);
    }

    // Fallback local (si shared no está disponible)
    event.preventDefault();
    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;
    try {
      setStatus("Validando acceso...");
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setStatus(`No se pudo iniciar sesion: ${error.message}`, "error"); return; }
      loginForm.reset();
      clearAuthUrl();
      await enterApp(data.session);
    } catch (error) {
      setStatus(`No se pudo iniciar sesion: ${error.message}`, "error");
    }
  }

  async function handlePasswordSetup(event) {
    // El formulario de concilia usa #setup-password (distinto del shared #invite-password)
    // por eso mantenemos el handler local con los IDs correctos
    event.preventDefault();

    const password = document.querySelector("#setup-password").value;
    const passwordConfirm = document.querySelector("#setup-password-confirm").value;

    if (password.length < 8) {
      setStatus("La contrasena debe tener al menos 8 caracteres.", "error");
      return;
    }

    if (password !== passwordConfirm) {
      setStatus("Las contrasenas no coinciden.", "error");
      return;
    }

    try {
      setStatus("Guardando contrasena...");
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus(`No se pudo guardar la contrasena: ${error.message}`, "error");
        return;
      }

      const session = await getCurrentSession();
      passwordSetupForm.reset();
      clearAuthUrl();
      await enterApp(session);
    } catch (error) {
      setStatus(`No se pudo completar el acceso: ${error.message}`, "error");
    }
  }

  async function handleLogout() {
    if (_authHandlers) {
      return _authHandlers.handleLogout();
    }

    // Fallback local
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) { setStatus(`No se pudo cerrar sesion: ${error.message}`, "error"); return; }
      studentRows = [];
      filteredStudentRows = [];
      studentsTotalCount = 0;
      attendanceTotalCount = 0;
      neeTotalCount = 0;
      studentsCurrentPage = 1;
      attendanceCurrentPage = 1;
      neeCurrentPage = 1;
      renderStudentsTable();
      renderWeeklySummary();
      renderAttendanceMatrix();
      buildNeeRows();
      renderNeeTable();
      showLogin();
      setStatus("Sesion cerrada.");
    } catch (error) {
      setStatus(`Error al cerrar sesion: ${error.message}`, "error");
    }
  }

  async function restoreSession() {
    try {
      const session = await getCurrentSession();

      if (!session) {
        showLogin();
        return;
      }

      const authUrlType = window.SupabaseApp?.getAuthUrlType() ?? INITIAL_AUTH_URL_TYPE;
      if (authUrlType === "invite" || authUrlType === "recovery") {
        showPasswordSetup();
        setStatus("Define una contrasena para completar el acceso.", "success");
        return;
      }

      clearAuthUrl();
      await enterApp(session);
    } catch (error) {
      showLogin();
      setStatus(`No se pudo restaurar la sesion: ${error.message}`, "error");
    }
  }

  async function init() {
    if (!hasSupabaseConfig) {
      setStatus("Falta la configuracion de Supabase en config.js.", "error");
      return;
    }

    loginForm.addEventListener("submit", (event) => {
      void handleLogin(event);
    });
    passwordSetupForm.addEventListener("submit", (event) => {
      void handlePasswordSetup(event);
    });
    logoutButton.addEventListener("click", () => {
      void handleLogout();
    });
    moduleTabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        switchModuleTab(button.dataset.moduleTab);
        if (button.dataset.moduleTab === "actividades") {
          void loadActivityCatalogs().then(() => loadActivities());
        }
        if (button.dataset.moduleTab === "asignaciones") {
          void loadAssignments();
        }
      });
    });
    studentsFiltersForm.addEventListener("input", () => {
      studentsCurrentPage = 1;
      void applyStudentFilters();
    });
    studentsFiltersForm.addEventListener("change", () => {
      studentsCurrentPage = 1;
      void applyStudentFilters();
    });
    clearStudentsFiltersButton?.addEventListener("click", () => {
      studentsFiltersForm.reset();
      studentsCurrentPage = 1;
      void applyStudentFilters();
    });
    studentsFiltersForm.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reset-filter]");
      if (!button || !resetNamedFormControl(studentsFiltersForm, button.dataset.resetFilter)) {
        return;
      }

      studentsCurrentPage = 1;
      void applyStudentFilters();
    });
    studentsRefreshButton.addEventListener("click", () => {
      void loadStudents();
    });
    studentsPageSize.addEventListener("change", () => {
      studentsRowsPerPage = Number(studentsPageSize.value);
      studentsCurrentPage = 1;
      void applyStudentFilters();
    });
    studentsPreviousPage.addEventListener("click", () => {
      studentsCurrentPage -= 1;
      void applyStudentFilters();
    });
    studentsNextPage.addEventListener("click", () => {
      studentsCurrentPage += 1;
      void applyStudentFilters();
    });
    attendanceCenterFilter.addEventListener("change", () => {
      attendanceCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
    });
    attendancePageSize?.addEventListener("change", () => {
      attendanceRowsPerPage = Number(attendancePageSize.value);
      attendanceCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
    });
    attendancePreviousPage?.addEventListener("click", () => {
      attendanceCurrentPage -= 1;
      void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
    });
    attendanceNextPage?.addEventListener("click", () => {
      attendanceCurrentPage += 1;
      void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
    });
    document.querySelectorAll("[data-reset-control]").forEach((button) => {
      button.addEventListener("click", () => {
        const control = document.querySelector(`#${button.dataset.resetControl}`);
        if (!control) {
          return;
        }

        control.value = "";
        control.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    neeFiltersForm.addEventListener("input", () => {
      neeCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadNeeRows(supabase));
    });
    neeFiltersForm.addEventListener("change", () => {
      neeCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadNeeRows(supabase));
    });
    clearNeeFilterButton?.addEventListener("click", () => {
      neeFiltersForm.reset();
      neeCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadNeeRows(supabase));
    });
    neeFiltersForm.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reset-filter]");
      if (!button || !resetNamedFormControl(neeFiltersForm, button.dataset.resetFilter)) {
        return;
      }

      neeCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadNeeRows(supabase));
    });
    neePageSize?.addEventListener("change", () => {
      neeRowsPerPage = Number(neePageSize.value);
      neeCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadNeeRows(supabase));
    });
    neePreviousPage?.addEventListener("click", () => {
      neeCurrentPage -= 1;
      void getSupabaseClient().then((supabase) => loadNeeRows(supabase));
    });
    neeNextPage?.addEventListener("click", () => {
      neeCurrentPage += 1;
      void getSupabaseClient().then((supabase) => loadNeeRows(supabase));
    });
    activityForm.addEventListener("submit", (event) => {
      void handleActivitySubmit(event);
    });
    clearActivityFormButton.addEventListener("click", () => {
      activityForm.reset();
      applyActivityFormDefaults();
      activitiesSummary.textContent = "Completa los campos para crear una actividad.";
    });
    openActivityPanelButton.addEventListener("click", openActivityCreatePanel);
    closeActivityPanelButton.addEventListener("click", closeActivityCreatePanel);
    activityPanelBackdrop.addEventListener("click", closeActivityCreatePanel);
    openActivitiesSettingsButton.addEventListener("click", () => {
      void loadActivityCatalogs().then(openActivitiesSettingsPanel);
    });
    closeActivitiesSettingsButton.addEventListener("click", closeActivitiesSettingsPanel);
    activitiesSettingsBackdrop.addEventListener("click", closeActivitiesSettingsPanel);
    activitySettingsPersonalFilter.addEventListener("input", renderActivitySettings);
    activityPersonalAddButton.addEventListener("click", () => {
      void setActivityPersonalBatch(getSelectedOptionValues(activityPersonalAvailableSelect), true);
    });
    activityPersonalRemoveButton.addEventListener("click", () => {
      void setActivityPersonalBatch(getSelectedOptionValues(activityPersonalSelectedSelect), false);
    });
    activitySettingsInstallationFilter.addEventListener("input", renderActivitySettings);
    activityInstallationAddButton.addEventListener("click", () => {
      void setActivityInstallationBatch(getSelectedOptionValues(activityInstallationAvailableSelect), true);
    });
    activityInstallationRemoveButton.addEventListener("click", () => {
      void setActivityInstallationBatch(getSelectedOptionValues(activityInstallationSelectedSelect), false);
    });
    refreshActivitiesButton.addEventListener("click", () => {
      void loadActivities();
    });
    openActivitiesReportButton.addEventListener("click", () => openActivitiesReport("installation"));
    openActivitiesPersonalReportButton.addEventListener("click", () => openActivitiesReport("personal"));
    closeActivitiesReportButton.addEventListener("click", closeActivitiesReport);
    downloadActivitiesReportPdfButton.addEventListener("click", () => {
      void downloadActivitiesReportPdf();
    });
    downloadActivitiesReportExcelButton.addEventListener("click", downloadActivitiesReportExcel);
    activitiesReportBackdrop.addEventListener("click", closeActivitiesReport);
    activitiesFiltersForm.addEventListener("change", applyActivitiesFilters);
    clearActivitiesFiltersButton?.addEventListener("click", () => {
      activitiesFiltersForm.reset();
      applyActivitiesFilters();
    });
    activitiesFiltersForm.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reset-filter]");
      if (!button || !resetNamedFormControl(activitiesFiltersForm, button.dataset.resetFilter)) {
        return;
      }

      applyActivitiesFilters();
    });
    document.querySelectorAll("[data-activity-sort-field]").forEach((button) => {
      button.addEventListener("click", () => {
        const field = button.dataset.activitySortField;
        const currentSort = activitiesSort.find((sort) => sort.field === field);
        const direction =
          currentSort?.field === activitiesSort[0]?.field && currentSort.direction === "asc"
            ? "desc"
            : "asc";

        activitiesSort = [
          { field, direction },
          ...activitiesSort.filter((sort) => sort.field !== field),
        ];
        applyActivitiesFilters();
      });
    });
    activitiesTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-edit-activity]");
      if (!button) {
        return;
      }

      openActivityEdit(button.dataset.editActivity);
    });
    activityEditForm.addEventListener("submit", (event) => {
      void handleActivityEditSubmit(event);
    });
    cancelActivityEditButton.addEventListener("click", closeActivityEdit);
    activityEditPanelBackdrop.addEventListener("click", closeActivityEdit);
    duplicateActivityButton.addEventListener("click", duplicateActivityToCreateForm);
    deleteActivityButton.addEventListener("click", () => {
      void handleActivityDelete();
    });
    refreshAssignmentsButton.addEventListener("click", () => {
      void loadAssignments();
    });
    openAssignmentRecordPanelButton.addEventListener("click", openAssignmentRecordPanel);
    openAssignmentDeletePanelButton.addEventListener("click", openAssignmentDeletePanel);
    closeAssignmentRecordPanelButton.addEventListener("click", closeAssignmentRecordPanel);
    assignmentRecordPanelBackdrop.addEventListener("click", closeAssignmentRecordPanel);
    assignmentRecordForm.addEventListener("submit", (event) => {
      void handleAssignmentRecordSubmit(event);
    });
    closeAssignmentDeletePanelButton.addEventListener("click", closeAssignmentDeletePanel);
    assignmentDeletePanelBackdrop.addEventListener("click", closeAssignmentDeletePanel);
    assignmentDeleteForm.addEventListener("submit", (event) => {
      void handleAssignmentDeleteSubmit(event);
    });
    assignmentsTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-assignment-instalacion]");
      if (!button) {
        return;
      }

      openAssignmentEdit(button.dataset.assignmentInstalacion, button.dataset.assignmentWeek);
    });
    closeAssignmentPanelButton.addEventListener("click", closeAssignmentEdit);
    assignmentPanelBackdrop.addEventListener("click", closeAssignmentEdit);
    clearAssignmentButton.addEventListener("click", () => {
      currentAssignmentSelectedIds = new Set();
      renderAssignmentDualLists();
      syncAssignmentNavigation();
    });
    assignmentPreviousWeekButton?.addEventListener("click", () => navigateAssignmentWeek(-1));
    assignmentNextWeekButton?.addEventListener("click", () => navigateAssignmentWeek(1));
    assignmentPreviousInstallationButton?.addEventListener("click", () =>
      navigateAssignmentInstallation(-1)
    );
    assignmentNextInstallationButton?.addEventListener("click", () =>
      navigateAssignmentInstallation(1)
    );
    assignmentCopyNextWeekButton?.addEventListener("click", () => {
      void copyAssignmentToNextWeek();
    });
    assignmentPersonalFilter.addEventListener("input", renderAssignmentDualLists);
    assignSelectedButton.addEventListener("click", () => {
      addAssignmentSelection(getSelectedOptionValues(assignmentAvailableSelect));
    });
    unassignSelectedButton.addEventListener("click", () => {
      removeAssignmentSelection(getSelectedOptionValues(assignmentSelectedSelect));
    });
    assignmentAvailableSelect.addEventListener("dblclick", () => {
      addAssignmentSelection(getSelectedOptionValues(assignmentAvailableSelect));
    });
    assignmentSelectedSelect.addEventListener("dblclick", () => {
      removeAssignmentSelection(getSelectedOptionValues(assignmentSelectedSelect));
    });
    assignmentEditForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void saveAssignmentWeek(getSelectedAssignmentPersonalIds());
    });
    neeTableBody.addEventListener("change", (event) => {
      const checkbox = event.target.closest(".nee-checkbox");
      if (!checkbox) {
        return;
      }

      checkbox.disabled = true;
      void updateStudentNee(checkbox.dataset.codigoPersona, checkbox.checked).then((success) => {
        if (!success) {
          checkbox.checked = !checkbox.checked;
          checkbox.disabled = false;
        }
      });
    });
    document.querySelectorAll("[data-sort-field]").forEach((button) => {
      button.addEventListener("click", () => {
        const field = button.dataset.sortField;
        if (studentsSort.field === field) {
          studentsSort.direction = studentsSort.direction === "asc" ? "desc" : "asc";
        } else {
          studentsSort = { field, direction: "asc" };
        }
        studentsCurrentPage = 1;
        void applyStudentFilters();
      });
    });

    await restoreSession();
  }

  void init();
})();
