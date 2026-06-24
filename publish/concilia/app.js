(function () {
  const INITIAL_AUTH_URL_TYPE = (() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return searchParams.get("type") || hashParams.get("type") || "";
  })();

  const config = window.APP_CONFIG ?? {};
  const supabaseConfig = config.supabase ?? {};
  const hasSupabaseConfig = Boolean(supabaseConfig.url) && Boolean(supabaseConfig.anonKey);
  const MODULE_TAB_TARGETS = new Set([
    "asistencia",
    "alumnado",
    "nee",
  ]);
  const ATTENDANCE_ONLY_EMAILS = new Set(["colegio@conciliaoviedo.es"]);
  let allowedModuleTabTargets = MODULE_TAB_TARGETS;
  const EMBED_MODE = new URLSearchParams(window.location.search).get("embed") === "1";
  const INITIAL_MODULE_TAB = (() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    return MODULE_TAB_TARGETS.has(tab) ? tab : "asistencia";
  })();

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
  const filterEdad = document.querySelector("#filter-edad");
  const clearStudentsFiltersButton = document.querySelector("#clear-students-filters-button");
  const studentsRefreshButton = document.querySelector("#students-refresh-button");
  const downloadStudentsAgeReportPdfButton = document.querySelector(
    "#download-students-age-report-pdf-button"
  );
  const studentsSummary = document.querySelector("#students-summary");
  const studentsTableHead = document.querySelector("#students-table-head");
  const studentsTableBody = document.querySelector("#students-table-body");
  const studentsPaginationSummary = document.querySelector("#students-pagination-summary");
  const studentsPageSize = document.querySelector("#students-page-size");
  const studentsPreviousPage = document.querySelector("#students-previous-page");
  const studentsNextPage = document.querySelector("#students-next-page");
  const studentsBulkFieldSelect = document.querySelector("#students-bulk-field");
  const studentsBulkCurrentSelect = document.querySelector("#students-bulk-current-select");
  const studentsBulkNewSelect = document.querySelector("#students-bulk-new-select");
  const studentsBulkApplyButton = document.querySelector("#students-bulk-apply-button");
  const studentsBulkMatchCount = document.querySelector("#students-bulk-match-count");
  const openStudentPanelButton = document.querySelector("#open-student-panel-button");
  const studentPanelBackdrop = document.querySelector("#student-panel-backdrop");
  const studentPanel = document.querySelector("#student-panel");
  const closeStudentPanelButton = document.querySelector("#close-student-panel-button");
  const studentPanelTitle = document.querySelector("#student-panel-title");
  const studentPanelSummary = document.querySelector("#student-panel-summary");
  const studentForm = document.querySelector("#student-form");
  const clearStudentFormButton = document.querySelector("#clear-student-form-button");
  const studentId = document.querySelector("#student-id");
  const studentCodigoClase = document.querySelector("#student-codigo-clase");
  const studentClase = document.querySelector("#student-clase");
  const studentFechaInicial = document.querySelector("#student-fecha-inicial");
  const studentEstado = document.querySelector("#student-estado");
  const studentCodigoPersona = document.querySelector("#student-codigo-persona");
  const studentNombre = document.querySelector("#student-nombre");
  const studentApellidos = document.querySelector("#student-apellidos");
  const studentAlumnado = document.querySelector("#student-alumnado");
  const studentDocumento = document.querySelector("#student-documento");
  const studentFechaNacimiento = document.querySelector("#student-fecha-nacimiento");
  const studentEdad = document.querySelector("#student-edad");
  const studentMovil = document.querySelector("#student-movil");
  const studentMail = document.querySelector("#student-mail");
  const studentCentro = document.querySelector("#student-centro");
  const studentSemana = document.querySelector("#student-semana");
  const studentNee = document.querySelector("#student-nee");
  const studentComedor = document.querySelector("#student-comedor");
  const studentGrupo = document.querySelector("#student-grupo");
  const openSummaryPanelButton = document.querySelector("#open-summary-panel-button");
  const closeSummaryPanelButton = document.querySelector("#close-summary-panel-button");
  const summaryPanelBackdrop = document.querySelector("#summary-panel-backdrop");
  const summaryPanel = document.querySelector("#summary-panel");
  const weeklySummary = document.querySelector("#weekly-summary");
  const weeklySummaryTableBody = document.querySelector("#weekly-summary-table-body");
  const attendanceFiltersForm = document.querySelector("#attendance-filters-form");
  const attendanceSummary = document.querySelector("#attendance-summary");
  const attendanceCenterFilter = document.querySelector("#attendance-center-filter");
  const attendanceWeekFilter = document.querySelector("#attendance-week-filter");
  const attendanceNameFilter = document.querySelector("#attendance-name-filter");
  const attendanceMobileStart = document.querySelector("#attendance-mobile-start");
  const attendanceMobileList = document.querySelector("#attendance-mobile-list");
  const attendanceMobileCenterFilter = document.querySelector("#attendance-mobile-center-filter");
  const attendanceMobileWeekFilter = document.querySelector("#attendance-mobile-week-filter");
  const attendanceMobileGroupFilter = document.querySelector("#attendance-mobile-group-filter");
  const attendanceMobileStartButton = document.querySelector("#attendance-mobile-start-button");
  const attendanceMobileBackButton = document.querySelector("#attendance-mobile-back-button");
  const attendanceMobileContext = document.querySelector("#attendance-mobile-context");
  const attendanceMobileComedorButton = document.querySelector("#attendance-mobile-comedor-button");
  const attendanceMobileComedorBackdrop = document.querySelector(
    "#attendance-mobile-comedor-backdrop"
  );
  const attendanceMobileComedorView = document.querySelector("#attendance-mobile-comedor-view");
  const attendanceMobileComedorCloseButton = document.querySelector(
    "#attendance-mobile-comedor-close-button"
  );
  const attendanceMobileComedorSummary = document.querySelector(
    "#attendance-mobile-comedor-summary"
  );
  const attendanceMobileRows = document.querySelector("#attendance-mobile-rows");
  const attendanceMobileComedorRows = document.querySelector("#attendance-mobile-comedor-rows");
  const attendanceDayTabButtons = Array.from(document.querySelectorAll("[data-attendance-day]"));
  const attendancePresenceFilterButtons = Array.from(
    document.querySelectorAll("[data-attendance-presence-filter]")
  );
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
  const comedorFiltersForm = document.querySelector("#comedor-filters-form");
  const filterComedorCentro = document.querySelector("#filter-comedor-centro");
  const filterComedorAlumnado = document.querySelector("#filter-comedor-alumnado");
  const comedorSummary = document.querySelector("#comedor-summary");
  const comedorTableBody = document.querySelector("#comedor-table-body");
  const comedorPaginationSummary = document.querySelector("#comedor-pagination-summary");
  const comedorPageSize = document.querySelector("#comedor-page-size");
  const comedorPreviousPage = document.querySelector("#comedor-previous-page");
  const comedorNextPage = document.querySelector("#comedor-next-page");
  const availabilityFiltersForm = document.querySelector("#availability-filters-form");
  const availabilityNameFilter = document.querySelector("#availability-name-filter");
  const availabilitySummary = document.querySelector("#availability-summary");
  const availabilityTableBody = document.querySelector("#availability-table-body");
  const availabilityRefreshButton = document.querySelector("#availability-refresh-button");
  const availabilityPaginationSummary = document.querySelector("#availability-pagination-summary");
  const availabilityPageSize = document.querySelector("#availability-page-size");
  const availabilityPreviousPage = document.querySelector("#availability-previous-page");
  const availabilityNextPage = document.querySelector("#availability-next-page");
  const activitiesSummary = document.querySelector("#activities-summary");
  const activityForm = document.querySelector("#activity-form");
  const activityPersonal = document.querySelector("#activity-personal");
  const activityContrato = document.querySelector("#activity-contrato");
  const activityEmpresa = document.querySelector("#activity-empresa");
  const activityInstalacion = document.querySelector("#activity-instalacion");
  const activityPuesto = document.querySelector("#activity-puesto");
  const activityFuncion = document.querySelector("#activity-funcion");
  const activityModalidad = document.querySelector("#activity-modalidad");
  const activitySituacion = document.querySelector("#activity-situacion");
  const activityTipoHora = document.querySelector("#activity-tipo-hora");
  const clearActivityFormButton = document.querySelector("#clear-activity-form-button");
  const openActivityPanelButton = document.querySelector("#open-activity-panel-button");
  const closeActivityPanelButton = document.querySelector("#close-activity-panel-button");
  const activityCreatePanel = document.querySelector("#activity-create-panel");
  const activityPanelBackdrop = document.querySelector("#activity-panel-backdrop");
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
  const editActivityFuncion = document.querySelector("#edit-activity-funcion");
  const editActivityModalidad = document.querySelector("#edit-activity-modalidad");
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
  const mobileModuleMenuToggle = document.querySelector("#mobile-module-menu-toggle");
  const mobileModuleMenu = document.querySelector("#mobile-module-menu");
  const mobileModuleTitle = document.querySelector("#mobile-module-title");
  const mobileLogoutButton = document.querySelector("#mobile-logout-button");

  function renderIcon(name) {
    return `<svg class="button-icon" aria-hidden="true"><use href="./icons.svg?v=20260608-1#icon-${name}"></use></svg>`;
  }

  function escapeButtonLabel(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function decorateActionButton(button, icon, mode = "icon-only") {
    if (!button || button.dataset.iconDecorated === `${icon}:${mode}`) {
      return;
    }

    const label = (button.getAttribute("aria-label") || button.textContent || "").trim();
    if (!label) {
      return;
    }

    button.setAttribute("aria-label", label);
    button.dataset.iconDecorated = `${icon}:${mode}`;
    if (mode === "icon-only") {
      button.classList.add("tooltip-button", "icon-only-button");
      button.classList.remove("icon-text-button");
      button.innerHTML = renderIcon(icon);
      return;
    }

    button.classList.add("icon-text-button");
    button.classList.remove("icon-only-button");
    button.innerHTML = `${renderIcon(icon)}<span>${escapeButtonLabel(label)}</span>`;
  }

  function decorateStaticActionButtons() {
    document.querySelectorAll("button").forEach((button) => {
      const label = (button.textContent || "").trim().replace(/\s+/g, " ");
      if (!label) {
        return;
      }

      if (label === "Cerrar") {
        decorateActionButton(button, "close", "icon-only");
        return;
      }

      if (button.type === "button" && /^(Nuevo|Nueva)\b/.test(label)) {
        decorateActionButton(button, "new", "icon-only");
        return;
      }

      if (/^(Borrar|Eliminar)\b/.test(label)) {
        decorateActionButton(button, "delete", "icon-only");
        return;
      }

      if (/^Guardar\b/.test(label)) {
        decorateActionButton(button, "save", "icon-text");
        return;
      }

      if (/^(Exportar|Descargar)\b/.test(label)) {
        decorateActionButton(button, "download", "icon-text");
        return;
      }

      if (/^(Resumen|Informe)\b/.test(label)) {
        decorateActionButton(button, "file", "icon-text");
      }
    });
  }

  // supabaseClient y currentSession gestionados por shared/supabase-client.js
  // Acceso: window.SupabaseApp.getClient() / getSession() / setSession()
  let studentRows = [];
  let filteredStudentRows = [];
  let studentsTotalCount = 0;
  let studentSort = [{ field: "centro", direction: "asc" }];
  let studentsCurrentPage = 1;
  let studentsRowsPerPage = Number(studentsPageSize?.value || 50);
  let studentBulkOptions = { centros: [], semanas: [], grupos: [] };
  let studentBulkMatchRequestId = 0;
  let attendanceTotalCount = 0;
  let attendanceCurrentPage = 1;
  let attendanceRowsPerPage = Number(attendancePageSize?.value || 50);
  let attendanceSort = { field: "alumnado", direction: "asc" };
  let attendanceRows = [];
  let mobileAttendanceListOpen = false;
  let mobileComedorPanelOpen = false;
  let mobileAttendanceDay = "asistencia_lunes";
  let mobileAttendancePresenceFilter = "all";
  let neeRows = [];
  let neeTotalCount = 0;
  let neeCurrentPage = 1;
  let neeRowsPerPage = Number(neePageSize?.value || 50);
  let comedorRows = [];
  let comedorTotalCount = 0;
  let comedorCurrentPage = 1;
  let comedorRowsPerPage = Number(comedorPageSize?.value || 50);
  let availabilityRows = [];
  let availabilityTotalCount = 0;
  let availabilityCurrentPage = 1;
  let availabilityRowsPerPage = Number(availabilityPageSize?.value || 50);
  let activityCatalogsLoaded = false;
  let activityAllPersonalRows = [];
  let activityPersonalRows = [];
  let activityAllInstallationRows = [];
  let activityInstallationRows = [];
  let activityContractPersonalRows = [];
  let activityContractInstallationRows = [];
  let activityUsesContractAssignments = false;
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
  const STUDENT_SELECT_COLUMNS =
    "id,codigo_clase,clase,fecha_inicial,estado,codigo_persona,apellidos,nombre,nee,documento,fecha_nacimiento,edad,movil,mail,centro,semana,alumnado,comedor,grupo";
  const STUDENT_GROUP_OPTIONS = [
    "EI01",
    "EI02",
    "EI03",
    "EI04",
    "EI05",
    "EI06",
    "EI07",
    "EI08",
    "PR01",
    "PR02",
    "PR03",
    "PR04",
    "PR05",
    "PR06",
    "PR07",
    "PR08",
    "PR09",
    "PR10",
    "PR11",
    "PR12",
    "PR13",
    "PR14",
    "PR15",
  ];
  const ATTENDANCE_DAYS = [
    { field: "asistencia_lunes", label: "lunes", shortLabel: "L" },
    { field: "asistencia_martes", label: "martes", shortLabel: "M" },
    { field: "asistencia_miercoles", label: "miércoles", shortLabel: "X" },
    { field: "asistencia_jueves", label: "jueves", shortLabel: "J" },
    { field: "asistencia_viernes", label: "viernes", shortLabel: "V" },
  ];
  const MODULE_TAB_LABELS = {
    asistencia: "Asistencia",
    alumnado: "Alumnado",
    nee: "NEE",
  };
  const AVAILABILITY_WEEKS = SUMMARY_WEEKS.map((week) => `semana_${week}`);
  const ASSIGNMENT_WEEK_FIELDS = SUMMARY_WEEKS.map((week) => `semana_${week}`);
  const MOBILE_ATTENDANCE_FILTERS_STORAGE_KEY = "concilia.mobileAttendanceFilters";
  const STUDENTS_BULK_ANY_VALUE = "__students_bulk_any__";
  const STUDENTS_BULK_UNSET_VALUE = "__students_bulk_unset__";
  const STUDENTS_BULK_FIELDS = {
    centro: { column: "centro", optionKey: "centros", emptyLabel: "Sin centro" },
    semana: { column: "semana", optionKey: "semanas", emptyLabel: "Sin semana" },
    grupo: { column: "grupo", optionKey: "grupos", emptyLabel: "Sin grupo" },
  };
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

    if (control instanceof HTMLSelectElement && control.multiple) {
      Array.from(control.options).forEach((option) => {
        option.selected = false;
      });
      return true;
    }

    control.value = "";
    return true;
  }

  function getStoredMobileAttendanceFilters() {
    try {
      return JSON.parse(localStorage.getItem(MOBILE_ATTENDANCE_FILTERS_STORAGE_KEY) || "{}");
    } catch (_error) {
      return {};
    }
  }

  function storeMobileAttendanceFilters() {
    try {
      localStorage.setItem(
        MOBILE_ATTENDANCE_FILTERS_STORAGE_KEY,
        JSON.stringify({
          centro: attendanceMobileCenterFilter?.value || "",
          semana: attendanceMobileWeekFilter?.value || "",
          grupo: attendanceMobileGroupFilter?.value || "",
        })
      );
    } catch (_error) {
      // localStorage can be unavailable in private or restricted browser modes.
    }
  }

  function selectOptionIfAvailable(select, value) {
    if (!select || !value) {
      return false;
    }

    if (!Array.from(select.options || []).some((option) => option.value === value)) {
      return false;
    }

    select.value = value;
    return true;
  }

  function applyStoredMobileAttendanceFilters() {
    if (!window.matchMedia("(max-width: 780px)").matches) {
      return;
    }

    const storedFilters = getStoredMobileAttendanceFilters();
    const centerApplied = selectOptionIfAvailable(
      attendanceMobileCenterFilter,
      storedFilters.centro
    );
    const weekApplied = selectOptionIfAvailable(attendanceMobileWeekFilter, storedFilters.semana);
    selectOptionIfAvailable(attendanceMobileGroupFilter, storedFilters.grupo);

    if (centerApplied) {
      selectOptionIfAvailable(attendanceCenterFilter, storedFilters.centro);
    }

    if (weekApplied) {
      selectOptionIfAvailable(attendanceWeekFilter, storedFilters.semana);
    }
  }

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function matchesNormalizedStudentSearch(row, search) {
    const normalizedSearch = normalizeText(search);
    return !normalizedSearch || normalizeText(row?.alumnado).includes(normalizedSearch);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getInitialModuleTab() {
    return allowedModuleTabTargets.has(INITIAL_MODULE_TAB) ? INITIAL_MODULE_TAB : "asistencia";
  }

  function isAttendanceOnlyUser(email) {
    return ATTENDANCE_ONLY_EMAILS.has(normalizeText(email));
  }

  function applyModuleAccess(email) {
    allowedModuleTabTargets = isAttendanceOnlyUser(email)
      ? new Set(["asistencia"])
      : MODULE_TAB_TARGETS;

    moduleTabButtons.forEach((button) => {
      const isAllowed = allowedModuleTabTargets.has(button.dataset.moduleTab);
      button.classList.toggle("hidden", !isAllowed);
      button.disabled = !isAllowed;
    });

    document.querySelectorAll(".topbar-actions .secondary-link").forEach((link) => {
      link.classList.toggle("hidden", allowedModuleTabTargets.size === 1);
    });
  }

  async function loadModuleTabData(target) {
    if (!allowedModuleTabTargets.has(target)) {
      return;
    }

    const supabase = await getSupabaseClient();

    if (target === "alumnado") {
      await loadStudents();
      return;
    }

    if (target === "asistencia") {
      await loadAttendanceMatrix(supabase);
      return;
    }

    if (target === "nee") {
      await loadNeeRows(supabase);
      return;
    }

    if (target === "comedor") {
      await loadComedorPanel(supabase);
      return;
    }

    if (target === "disponibilidad") {
      await loadAvailabilityRows();
      return;
    }

    if (target === "actividades") {
      await loadActivityCatalogs();
      await loadActivities();
      return;
    }

    if (target === "asignaciones") {
      await loadAssignments();
    }
  }

  function switchModuleTab(target) {
    const normalizedTarget =
      MODULE_TAB_TARGETS.has(target) && allowedModuleTabTargets.has(target)
        ? target
        : "asistencia";
    moduleTabButtons.forEach((button) => {
      const isActive = button.dataset.moduleTab === normalizedTarget;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    modulePanels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.modulePanel !== normalizedTarget);
    });

    if (mobileModuleTitle) {
      mobileModuleTitle.textContent = MODULE_TAB_LABELS[normalizedTarget] || "Concilia";
    }

    mobileModuleMenu?.classList.add("hidden");
    mobileModuleMenuToggle?.setAttribute("aria-expanded", "false");
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

  function updateComedorPagination() {
    const totalPages = Math.max(1, Math.ceil(comedorTotalCount / comedorRowsPerPage));
    comedorCurrentPage = Math.min(Math.max(1, comedorCurrentPage), totalPages);
    comedorPreviousPage.disabled = comedorCurrentPage <= 1;
    comedorNextPage.disabled = comedorCurrentPage >= totalPages;
    comedorPaginationSummary.textContent = `Pagina ${comedorCurrentPage} de ${totalPages}`;
  }

  function updateAvailabilityPagination() {
    const totalPages = Math.max(1, Math.ceil(availabilityTotalCount / availabilityRowsPerPage));
    availabilityCurrentPage = Math.min(Math.max(1, availabilityCurrentPage), totalPages);
    availabilityPreviousPage.disabled = availabilityCurrentPage <= 1;
    availabilityNextPage.disabled = availabilityCurrentPage >= totalPages;
    availabilityPaginationSummary.textContent = `Pagina ${availabilityCurrentPage} de ${totalPages}`;
  }

  function renderStudentGroupOptions(selectedValue = "") {
    return [`<option value="">Sin grupo</option>`]
      .concat(
        STUDENT_GROUP_OPTIONS.map(
          (option) =>
            `<option value="${escapeHtml(option)}"${option === selectedValue ? " selected" : ""}>${escapeHtml(option)}</option>`
        )
      )
      .join("");
  }

  function getStudentAgeValue(row) {
    const birthYear = Number(String(row.fecha_nacimiento ?? "").slice(0, 4));
    if (Number.isInteger(birthYear) && birthYear > 1900) {
      return CURRENT_YEAR - birthYear;
    }

    const storedAge = Number(String(row.edad ?? "").replace(/[^0-9]/g, ""));
    return Number.isInteger(storedAge) && storedAge >= 0 ? storedAge : null;
  }

  function formatStudentAge(row) {
    const age = getStudentAgeValue(row);
    return age === null ? "" : String(age);
  }

  function getStudentSortValues(row, field) {
    if (field === "edad") {
      const age = getStudentAgeValue(row);
      return [age === null ? "" : String(age).padStart(3, "0")];
    }

    if (field === "comedor") {
      return [row.comedor ? "1" : "0"];
    }

    return [row[field]];
  }

  function compareStudentRows(leftRow, rightRow) {
    for (const sort of studentSort) {
      const leftValues = getStudentSortValues(leftRow, sort.field);
      const rightValues = getStudentSortValues(rightRow, sort.field);

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

  function updateStudentSortButtons() {
    document.querySelectorAll("[data-student-sort-field]").forEach((button) => {
      const sortIndex = studentSort.findIndex(
        (sort) => sort.field === button.dataset.studentSortField
      );
      const sort = studentSort[sortIndex];

      button.classList.toggle("active", Boolean(sort));
      button.dataset.direction = sort?.direction || "";
      button.dataset.priority = sort ? String(sortIndex + 1) : "";
    });
  }

  function renderStudentsTable() {
    studentsSummary.textContent = `${studentsTotalCount} registros filtrados`;
    updateStudentsPagination();

    const rows = filteredStudentRows;
    const filters = getStudentFilters();
    const columns = [
      !filters.centro
        ? {
            field: "centro",
            label: "Centro",
            render: (row) => escapeHtml(row.centro),
          }
        : null,
      !filters.semana
        ? {
            field: "semana",
            label: "Semana",
            render: (row) => escapeHtml(row.semana),
          }
        : null,
      {
        field: "edad",
        label: "Edad",
        render: (row) => escapeHtml(formatStudentAge(row)),
      },
      {
        field: "grupo",
        label: "Grupo",
        render: (row) => `
          <select
            class="student-inline-select"
            data-student-inline-id="${escapeHtml(row.id)}"
            data-student-inline-field="grupo"
            aria-label="Grupo para ${escapeHtml(row.alumnado)}"
          >
            ${renderStudentGroupOptions(row.grupo || "")}
          </select>
        `,
      },
      {
        field: "alumnado",
        label: "Alumnado",
        render: (row) => {
          const age = formatStudentAge(row);
          const hasNee = Boolean(String(row.nee ?? "").trim());
          const phone = String(row.movil ?? "").trim();
          const details = [
            age ? `Edad: ${escapeHtml(age)}` : "",
            phone ? `Tel: ${escapeHtml(phone)}` : "",
            hasNee ? '<span class="student-nee-badge">NEE</span>' : "",
          ].filter(Boolean);

          return `
            <div class="student-name-cell">
              <span class="student-name-main">${escapeHtml(row.alumnado)}</span>
              ${
                details.length
                  ? `<span class="student-name-details">${details.join(" ")}</span>`
                  : ""
              }
            </div>
          `;
        },
      },
      {
        field: "comedor",
        label: "Comedor",
        render: (row) => `
          <input
            class="student-inline-checkbox"
            type="checkbox"
            data-student-inline-id="${escapeHtml(row.id)}"
            data-student-inline-field="comedor"
            ${row.comedor ? "checked" : ""}
            aria-label="Comedor para ${escapeHtml(row.alumnado)}"
          />
        `,
      },
      {
        field: null,
        label: "Acciones",
        render: (row) => `
          <button class="compact-button tooltip-button" type="button" aria-label="Editar alumno" data-edit-student="${escapeHtml(row.id)}">
            ${renderIcon("edit")}
          </button>
        `,
      },
    ].filter(Boolean);

    studentsTableHead.innerHTML = `
      <tr>
        ${columns
          .map((column) => {
            if (!column.field) {
              return `<th>${escapeHtml(column.label)}</th>`;
            }

            return `
              <th>
                <button class="sort-button" type="button" data-student-sort-field="${escapeHtml(column.field)}">
                  ${escapeHtml(column.label)}
                </button>
              </th>
            `;
          })
          .join("")}
      </tr>
    `;
    updateStudentSortButtons();

    if (!rows.length) {
      studentsTableBody.innerHTML =
        `<tr><td colspan="${columns.length}" class="empty-state">No hay alumnado con esos filtros.</td></tr>`;
      return;
    }

    studentsTableBody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            ${columns.map((column) => `<td>${column.render(row)}</td>`).join("")}
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
    if (!select) {
      return;
    }

    const currentValue = select.value;
    const options = [`<option value="">${escapeHtml(emptyLabel)}</option>`].concat(
      values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    );
    select.innerHTML = options.join("");
    select.value = values.includes(currentValue) ? currentValue : "";
  }

  function renderMultiSelectOptions(select, values, emptyLabel) {
    if (!select) {
      return;
    }

    const currentValues = new Set(getSelectValues(select));
    select.innerHTML = values
      .map((value) => {
        const isSelected = currentValues.has(value);
        return `<option value="${escapeHtml(value)}" ${isSelected ? "selected" : ""}>${escapeHtml(value)}</option>`;
      })
      .join("");
    syncMultiCheckDropdown(select, emptyLabel);
  }

  function sortAgeValues(first, second) {
    const firstNumber = Number(String(first).replace(",", "."));
    const secondNumber = Number(String(second).replace(",", "."));

    if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
      return firstNumber - secondNumber;
    }

    return String(first).localeCompare(String(second), "es", {
      numeric: true,
      sensitivity: "base",
    });
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
  }

  function renderStudentFilterOptionRows(optionRows, ageValues = []) {
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
    renderMultiSelectOptions(filterEdad, ageValues, "Todas las edades");
  }

  function renderComedorFilterOptionRows(optionRows) {
    const centros = optionRows
      .filter((row) => row.option_type === "centro")
      .map((row) => String(row.option_value ?? "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

    renderSelectOptions(filterComedorCentro, centros, "Todos los centros");
  }

  function renderStudentBulkOptionRows(optionRows) {
    studentBulkOptions = {
      centros: optionRows
        .filter((row) => row.option_type === "centro")
        .map((row) => String(row.option_value ?? "").trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })),
      semanas: optionRows
        .filter((row) => row.option_type === "semana")
        .map((row) => String(row.option_value ?? "").trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" })),
      grupos: STUDENT_GROUP_OPTIONS,
    };
    syncStudentsBulkAssignmentUi();
  }

  function getStudentsBulkFieldDefinition() {
    return STUDENTS_BULK_FIELDS[studentsBulkFieldSelect?.value] || STUDENTS_BULK_FIELDS.centro;
  }

  function renderStudentsBulkSelectOptions(select, values, { includeAny = false, emptyLabel }) {
    if (!select) {
      return;
    }

    const currentValue = select.value;
    const options = [];

    if (includeAny) {
      options.push(`<option value="${STUDENTS_BULK_ANY_VALUE}">Cualquier valor</option>`);
    }

    options.push(`<option value="${STUDENTS_BULK_UNSET_VALUE}">${escapeHtml(emptyLabel)}</option>`);
    values.forEach((value) => {
      options.push(`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`);
    });

    select.innerHTML = options.join("");
    select.value = Array.from(select.options).some((option) => option.value === currentValue)
      ? currentValue
      : includeAny
        ? STUDENTS_BULK_ANY_VALUE
        : values[0] || STUDENTS_BULK_UNSET_VALUE;
  }

  function getStudentsBulkPayloadValue(rawValue) {
    return rawValue === STUDENTS_BULK_UNSET_VALUE ? null : rawValue;
  }

  function applyStudentsBulkCurrentValueToQuery(query) {
    const definition = getStudentsBulkFieldDefinition();
    const currentValue = studentsBulkCurrentSelect?.value || STUDENTS_BULK_ANY_VALUE;

    if (currentValue === STUDENTS_BULK_ANY_VALUE) {
      return query;
    }

    if (currentValue === STUDENTS_BULK_UNSET_VALUE) {
      return query.is(definition.column, null);
    }

    return query.eq(definition.column, currentValue);
  }

  function syncStudentsBulkAssignmentUi() {
    const definition = getStudentsBulkFieldDefinition();
    const values = studentBulkOptions[definition.optionKey] || [];

    renderStudentsBulkSelectOptions(studentsBulkCurrentSelect, values, {
      includeAny: true,
      emptyLabel: definition.emptyLabel,
    });
    renderStudentsBulkSelectOptions(studentsBulkNewSelect, values, {
      includeAny: false,
      emptyLabel: definition.emptyLabel,
    });

    void updateStudentsBulkMatchCount();
  }

  async function updateStudentsBulkMatchCount() {
    if (!studentsBulkMatchCount) {
      return;
    }

    const requestId = ++studentBulkMatchRequestId;
    studentsBulkMatchCount.textContent = "Calculando...";

    try {
      const supabase = await getSupabaseClient();
      let query = supabase
        .from("concilia_usuarios")
        .select("id", { count: "exact", head: true });
      query = applyStudentFiltersToQuery(query, getStudentFilters());
      query = applyStudentsBulkCurrentValueToQuery(query);
      const { count, error } = await query;

      if (requestId !== studentBulkMatchRequestId) {
        return;
      }

      if (error) {
        throw error;
      }

      const total = count ?? 0;
      studentsBulkMatchCount.textContent = `${total} coincidencia${total === 1 ? "" : "s"}`;
      if (studentsBulkApplyButton) {
        studentsBulkApplyButton.disabled = total === 0;
      }
    } catch (_error) {
      if (requestId === studentBulkMatchRequestId) {
        studentsBulkMatchCount.textContent = "No se pudo calcular";
        if (studentsBulkApplyButton) {
          studentsBulkApplyButton.disabled = true;
        }
      }
    }
  }

  async function applyStudentsBulkAssignment() {
    const definition = getStudentsBulkFieldDefinition();
    const newValue = studentsBulkNewSelect?.value || STUDENTS_BULK_UNSET_VALUE;
    const payload = {
      [definition.column]: getStudentsBulkPayloadValue(newValue),
    };

    try {
      const supabase = await getSupabaseClient();
      let countQuery = supabase
        .from("concilia_usuarios")
        .select("id", { count: "exact", head: true });
      countQuery = applyStudentFiltersToQuery(countQuery, getStudentFilters());
      countQuery = applyStudentsBulkCurrentValueToQuery(countQuery);
      const { count, error: countError } = await countQuery;

      if (countError) {
        throw countError;
      }

      const total = count ?? 0;
      if (!total) {
        setStatus("No hay alumnos que coincidan con la asignacion masiva.", "error");
        return;
      }

      const confirmed = window.confirm(
        `Vas a actualizar ${total} alumno${total === 1 ? "" : "s"}.`
      );
      if (!confirmed) {
        return;
      }

      let updateQuery = supabase.from("concilia_usuarios").update(payload);
      updateQuery = applyStudentFiltersToQuery(updateQuery, getStudentFilters());
      updateQuery = applyStudentsBulkCurrentValueToQuery(updateQuery);
      const { error } = await updateQuery;

      if (error) {
        throw error;
      }

      setStatus(`Asignacion masiva aplicada a ${total} alumno${total === 1 ? "" : "s"}.`, "success");
      await loadStudents();
    } catch (error) {
      setStatus(`No se pudo aplicar la asignacion masiva: ${error.message}`, "error");
    }
  }

  function renderAttendanceFilterOptionRows(optionRows) {
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

    renderSelectOptions(attendanceCenterFilter, centros, "Todos los centros");
    renderSelectOptions(attendanceWeekFilter, semanas, "Todas las semanas");
    renderSelectOptions(attendanceMobileCenterFilter, centros, "Selecciona centro");
    renderSelectOptions(attendanceMobileWeekFilter, semanas, "Selecciona semana");
    renderSelectOptions(attendanceMobileGroupFilter, STUDENT_GROUP_OPTIONS, "Todos los grupos");
    applyStoredMobileAttendanceFilters();
  }

  function getSelectValues(select) {
    return Array.from(select?.selectedOptions || [])
      .map((option) => String(option.value || ""))
      .filter(Boolean);
  }

  function getMultiCheckDropdown(select, emptyLabel) {
    if (!select?.multiple) {
      return null;
    }

    select.classList.add("multi-check-select-hidden");
    let dropdown = select.nextElementSibling;
    if (!dropdown?.classList?.contains("multi-check-dropdown")) {
      dropdown = document.createElement("div");
      dropdown.className = "multi-check-dropdown";
      dropdown.innerHTML = `
        <button type="button" class="multi-check-toggle" aria-haspopup="listbox" aria-expanded="false">
          <span></span>
        </button>
        <div class="multi-check-menu hidden" role="listbox" aria-multiselectable="true"></div>
      `;
      select.insertAdjacentElement("afterend", dropdown);

      dropdown.querySelector(".multi-check-toggle")?.addEventListener("click", () => {
        const menu = dropdown.querySelector(".multi-check-menu");
        const isOpen = !menu.classList.contains("hidden");
        menu.classList.toggle("hidden", isOpen);
        dropdown.querySelector(".multi-check-toggle").setAttribute("aria-expanded", String(!isOpen));
      });

      dropdown.addEventListener("change", (event) => {
        const allCheckbox = event.target.closest("[data-multi-check-all]");
        if (allCheckbox) {
          Array.from(select.options).forEach((option) => {
            option.selected = false;
          });
          select.dispatchEvent(new Event("change", { bubbles: true }));
          return;
        }

        const checkbox = event.target.closest("[data-multi-check-value]");
        if (!checkbox) {
          return;
        }

        const option = Array.from(select.options).find(
          (item) => String(item.value) === checkbox.dataset.multiCheckValue
        );
        if (!option) {
          return;
        }

        option.selected = checkbox.checked;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });

      document.addEventListener("click", (event) => {
        if (dropdown.contains(event.target)) {
          return;
        }

        dropdown.querySelector(".multi-check-menu")?.classList.add("hidden");
        dropdown.querySelector(".multi-check-toggle")?.setAttribute("aria-expanded", "false");
      });
    }

    dropdown.dataset.emptyLabel = emptyLabel;
    return dropdown;
  }

  function syncMultiCheckDropdown(select, emptyLabel) {
    const dropdown = getMultiCheckDropdown(select, emptyLabel);
    if (!dropdown) {
      return;
    }

    const selectedOptions = Array.from(select.selectedOptions);
    const selectedCount = selectedOptions.length;
    const label =
      selectedCount === 0
        ? emptyLabel
        : selectedCount === 1
          ? selectedOptions[0].textContent
          : `${selectedCount} ${select.dataset.multiCheckSelectedLabel || "opciones seleccionadas"}`;

    dropdown.querySelector(".multi-check-toggle span").textContent = label;
    dropdown.querySelector(".multi-check-menu").innerHTML = `
      <label class="multi-check-option" role="option" aria-selected="${selectedCount === 0}">
        <input
          type="checkbox"
          data-multi-check-all="true"
          ${selectedCount === 0 ? "checked" : ""}
        />
        <span>${escapeHtml(emptyLabel)}</span>
      </label>
      ${Array.from(select.options)
        .map(
          (option) => `
          <label class="multi-check-option" role="option" aria-selected="${option.selected}">
            <input
              type="checkbox"
              data-multi-check-value="${escapeHtml(option.value)}"
              ${option.selected ? "checked" : ""}
            />
            <span>${escapeHtml(option.textContent)}</span>
          </label>
        `
        )
        .join("")}
    `;
  }

  function renderCatalogOptions(select, rows, valueField, labelField, emptyLabel) {
    if (!select) {
      return false;
    }

    const isMultiple = Boolean(select.multiple);
    const currentValues = isMultiple ? getSelectValues(select) : [String(select.value || "")];
    const currentValueSet = new Set(currentValues);
    const optionRows = rows.map((row) => {
      const value = row[valueField];
      const label = row[labelField] || `ID ${value}`;
      return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
    });
    const options = isMultiple
      ? optionRows
      : [`<option value="">${escapeHtml(emptyLabel)}</option>`].concat(optionRows);
    select.innerHTML = options.join("");

    if (isMultiple) {
      Array.from(select.options).forEach((option) => {
        option.selected = currentValueSet.has(String(option.value));
      });
      const nextValues = getSelectValues(select);
      syncMultiCheckDropdown(select, emptyLabel);
      return (
        nextValues.length !== currentValues.length ||
        nextValues.some((value, index) => value !== currentValues[index])
      );
    }

    const currentValue = currentValues[0] || "";
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

  function isCurrentContractAssignment(row) {
    return Boolean(row?.activo) && !row?.removed_at;
  }

  function getActivityPersonalRowsForContract(contratoId, selectedPersonalId = "") {
    const normalizedContratoId = Number(contratoId);
    if (!activityUsesContractAssignments) {
      return activityPersonalRows;
    }
    if (!normalizedContratoId) {
      const selectedId = Number(selectedPersonalId);
      return activityAllPersonalRows.filter((row) => Number(row.id) === selectedId);
    }

    const assignedIds = new Set(
      activityContractPersonalRows
        .filter((row) => Number(row.contrato_id) === normalizedContratoId && isCurrentContractAssignment(row))
        .map((row) => Number(row.personal_id))
    );
    const rows = activityAllPersonalRows.filter((row) => assignedIds.has(Number(row.id)));
    const selectedId = Number(selectedPersonalId);
    const selectedRow = activityAllPersonalRows.find((row) => Number(row.id) === selectedId);

    if (selectedRow && !rows.some((row) => Number(row.id) === selectedId)) {
      rows.push(selectedRow);
    }

    return rows;
  }

  function getActivityInstallationRowsForContract(contratoId, selectedInstallationId = "") {
    const normalizedContratoId = Number(contratoId);
    if (!activityUsesContractAssignments) {
      return activityInstallationRows;
    }
    if (!normalizedContratoId) {
      const selectedId = Number(selectedInstallationId);
      return activityAllInstallationRows.filter((row) => Number(row.id) === selectedId);
    }

    const assignedIds = new Set(
      activityContractInstallationRows
        .filter((row) => Number(row.contrato_id) === normalizedContratoId && isCurrentContractAssignment(row))
        .map((row) => Number(row.instalacion_id))
    );
    const rows = activityAllInstallationRows.filter((row) => assignedIds.has(Number(row.id)));
    const selectedId = Number(selectedInstallationId);
    const selectedRow = activityAllInstallationRows.find((row) => Number(row.id) === selectedId);

    if (selectedRow && !rows.some((row) => Number(row.id) === selectedId)) {
      rows.push(selectedRow);
    }

    return rows;
  }

  function renderActivityContractScopedOptions(form, selectedPersonalId = "", selectedInstallationId = "") {
    const contractSelect = form === activityEditForm ? editActivityContrato : activityContrato;
    const personalSelect = form === activityEditForm ? editActivityPersonal : activityPersonal;
    const installationSelect = form === activityEditForm ? editActivityInstalacion : activityInstalacion;
    const contratoId = contractSelect?.value || "";

    renderCatalogOptions(
      personalSelect,
      getActivityPersonalRowsForContract(contratoId, selectedPersonalId || personalSelect?.value),
      "id",
      "personal",
      "Seleccionar personal"
    );
    renderCatalogOptions(
      installationSelect,
      getActivityInstallationRowsForContract(contratoId, selectedInstallationId || installationSelect?.value),
      "id",
      "instalacion",
      "Seleccionar instalacion"
    );
  }

  function getActivityFilterValues() {
    return {
      contrato: getSelectValues(filterActivityContrato),
      personal: String(filterActivityPersonal.value || ""),
      instalacion: String(filterActivityInstalacion.value || ""),
    };
  }

  function activityMatchesFilterValues(activity, filters, excludedFilter = "") {
    const matchesContrato =
      excludedFilter === "contrato" ||
      !filters.contrato.length ||
      filters.contrato.includes(String(activity.contrato_id));
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

  function getAttendanceAgeSortValue(row) {
    const match = String(row?.edad ?? "").match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  function compareTextValues(first, second) {
    return String(first ?? "").localeCompare(String(second ?? ""), "es", {
      numeric: true,
      sensitivity: "base",
    });
  }

  function sortAttendanceRows(rows) {
    const direction = attendanceSort.direction === "desc" ? -1 : 1;

    return [...rows].sort((first, second) => {
      if (attendanceSort.field === "edad") {
        const firstAge = getAttendanceAgeSortValue(first);
        const secondAge = getAttendanceAgeSortValue(second);

        if (firstAge === null && secondAge !== null) {
          return 1;
        }

        if (firstAge !== null && secondAge === null) {
          return -1;
        }

        if (firstAge !== null && secondAge !== null && firstAge !== secondAge) {
          return (firstAge - secondAge) * direction;
        }
      }

      const nameComparison = compareTextValues(first?.alumnado, second?.alumnado);
      if (nameComparison !== 0) {
        return nameComparison * direction;
      }

      return Number(first?.id ?? 0) - Number(second?.id ?? 0);
    });
  }

  function getAttendanceDay(field) {
    return ATTENDANCE_DAYS.find((day) => day.field === field) || ATTENDANCE_DAYS[0];
  }

  function updateMobileAttendanceControls() {
    attendanceDayTabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.attendanceDay === mobileAttendanceDay);
    });

    attendancePresenceFilterButtons.forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.attendancePresenceFilter === mobileAttendancePresenceFilter
      );
    });
  }

  function setMobileAttendanceScreen(isListOpen) {
    mobileAttendanceListOpen = isListOpen;
    if (!isListOpen) {
      mobileComedorPanelOpen = false;
    }
    attendanceMobileStart?.classList.toggle("hidden", isListOpen);
    attendanceMobileList?.classList.toggle("hidden", !isListOpen);
    syncMobileComedorPanel();
  }

  function syncMobileComedorPanel() {
    attendanceMobileComedorButton?.classList.toggle("active", mobileComedorPanelOpen);
    attendanceMobileComedorBackdrop?.classList.toggle("hidden", !mobileComedorPanelOpen);
    attendanceMobileComedorView?.classList.toggle("hidden", !mobileComedorPanelOpen);
  }

  function closeMobileComedorPanel() {
    mobileComedorPanelOpen = false;
    syncMobileComedorPanel();
  }

  async function openMobileComedorPanel() {
    mobileComedorPanelOpen = true;
    syncMobileComedorPanel();
    await loadMobileComedorRows();
  }

  function renderMobileComedorRows(rows) {
    if (!attendanceMobileComedorRows || !attendanceMobileComedorSummary) {
      return;
    }

    const center = attendanceCenterFilter.value || "Todos los centros";
    const week = attendanceWeekFilter.value || "Todas las semanas";
    const group = attendanceMobileGroupFilter?.value || "Todos los grupos";
    attendanceMobileComedorSummary.textContent = `${rows.length} con comedor · ${center} · ${week} · ${group}`;

    if (!rows.length) {
      attendanceMobileComedorRows.innerHTML =
        '<p class="empty-state">No hay alumnado apuntado al comedor para este filtro.</p>';
      return;
    }

    attendanceMobileComedorRows.innerHTML = rows
      .map(
        (row) => `
          <div class="mobile-attendance-row mobile-comedor-row">
            <span class="mobile-attendance-name">${escapeHtml(row.alumnado)}</span>
            <span class="mobile-attendance-age">Edad: ${escapeHtml(row.edad || "-")}</span>
          </div>
        `
      )
      .join("");
  }

  async function loadMobileComedorRows() {
    if (!attendanceMobileComedorRows || !attendanceMobileComedorSummary) {
      return;
    }

    const centro = String(attendanceCenterFilter.value || "").trim();
    const semana = String(attendanceWeekFilter.value || "").trim();
    const grupo = String(attendanceMobileGroupFilter?.value || "").trim();

    if (!centro || !semana) {
      renderMobileComedorRows([]);
      return;
    }

    attendanceMobileComedorSummary.textContent = "Cargando comedor...";
    attendanceMobileComedorRows.innerHTML = '<p class="empty-state">Cargando comedor...</p>';

    try {
      const supabase = await getSupabaseClient();
      let query = supabase
        .from("concilia_usuarios")
        .select("id,alumnado,edad,grupo")
        .eq("centro", centro)
        .eq("semana", semana)
        .eq("comedor", true)
        .order("alumnado", { ascending: true });

      if (grupo) {
        query = query.eq("grupo", grupo);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      renderMobileComedorRows(data ?? []);
    } catch (error) {
      attendanceMobileComedorSummary.textContent = "No se pudo cargar comedor.";
      attendanceMobileComedorRows.innerHTML =
        '<p class="empty-state">Error cargando alumnado de comedor.</p>';
      setStatus(`No se pudo cargar comedor: ${error.message}`, "error");
    }
  }

  function renderMobileAttendanceRows() {
    if (!attendanceMobileRows) {
      return;
    }

    updateMobileAttendanceControls();

    if (!mobileAttendanceListOpen) {
      attendanceMobileRows.innerHTML = '<p class="empty-state">Selecciona centro y semana.</p>';
      return;
    }

    const day = getAttendanceDay(mobileAttendanceDay);
    const rows = attendanceRows.filter((row) => {
      const isPresent = Boolean(row[day.field]);

      if (mobileAttendancePresenceFilter === "present") {
        return isPresent;
      }

      if (mobileAttendancePresenceFilter === "missing") {
        return !isPresent;
      }

      return true;
    });

    if (attendanceMobileContext) {
      const center = attendanceCenterFilter.value || "Todos los centros";
      const week = attendanceWeekFilter.value || "Todas las semanas";
      const group = attendanceMobileGroupFilter?.value || "Todos los grupos";
      attendanceMobileContext.textContent = `${center} · ${week} · ${group} · ${day.label}`;
    }

    if (!rows.length) {
      attendanceMobileRows.innerHTML =
        '<p class="empty-state">No hay alumnado para este filtro.</p>';
      return;
    }

    attendanceMobileRows.innerHTML = rows
      .map((row) => {
        const isPresent = Boolean(row[day.field]);
        return `
          <button
            class="mobile-attendance-row ${isPresent ? "present" : ""}"
            type="button"
            data-attendance-mobile-id="${escapeHtml(row.id)}"
            aria-pressed="${String(isPresent)}"
          >
            <span class="mobile-attendance-name">${escapeHtml(row.alumnado)}</span>
            <span class="mobile-attendance-age">Edad: ${escapeHtml(row.edad)}</span>
          </button>
        `;
      })
      .join("");
  }

  function renderAttendanceRows(rows) {
    attendanceRows = rows;

    if (!rows.length) {
      attendanceTotalCount = 0;
      attendanceSummary.textContent = "No hay alumnado para esos filtros.";
      attendanceTableBody.innerHTML =
        '<tr><td colspan="7" class="empty-state">No hay alumnado para mostrar.</td></tr>';
      renderMobileAttendanceRows();
      updateAttendancePagination();
      return;
    }

    attendanceTotalCount = Number(rows[0]?.total_count) || rows.length;
    const checkedCount = rows.reduce(
      (total, row) => total + ATTENDANCE_DAYS.filter((day) => row[day.field]).length,
      0
    );
    attendanceSummary.textContent = `${rows.length} alumnos mostrados de ${attendanceTotalCount}. ${checkedCount} asistencias marcadas en esta pagina.`;
    attendanceTableBody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            ${ATTENDANCE_DAYS.map(
              (day) => `
                <td class="attendance-check-cell">
                  <span class="attendance-day-label">${escapeHtml(day.shortLabel)}</span>
                  <input
                    class="attendance-checkbox"
                    type="checkbox"
                    data-attendance-id="${escapeHtml(row.id)}"
                    data-attendance-field="${escapeHtml(day.field)}"
                    ${row[day.field] ? "checked" : ""}
                    aria-label="Marcar ${escapeHtml(day.label)} para ${escapeHtml(row.alumnado)}"
                  />
                </td>
              `
            ).join("")}
            <th scope="row">
              <span class="attendance-student-name">${escapeHtml(row.alumnado)}</span>
              <span class="attendance-student-age">Edad: ${escapeHtml(row.edad)}</span>
            </th>
            <td class="attendance-age-cell">${escapeHtml(row.edad)}</td>
          </tr>
        `
      )
      .join("");
    renderMobileAttendanceRows();
    updateAttendancePagination();
  }

  async function updateStudentAttendance(id, field, isPresent, options = {}) {
    if (!id) {
      setStatus("No se pudo actualizar asistencia: falta el registro.", "error");
      return false;
    }

    if (!ATTENDANCE_DAYS.some((day) => day.field === field)) {
      setStatus("No se pudo actualizar asistencia: dia no valido.", "error");
      return false;
    }

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from("concilia_usuarios")
        .update({ [field]: isPresent })
        .eq("id", id)
        .select("id");

      if (error) {
        throw error;
      }

      if (!data?.length) {
        throw new Error("Supabase no devolvio ningun registro actualizado.");
      }

      if (options.reload !== false) {
        await loadAttendanceMatrix(supabase);
      }

      if (!options.silent) {
        setStatus(isPresent ? "Asistencia marcada." : "Asistencia retirada.", "success");
      }

      return true;
    } catch (error) {
      setStatus(`No se pudo actualizar asistencia: ${error.message}`, "error");
      return false;
    }
  }

  async function toggleMobileAttendance(rowId) {
    const day = getAttendanceDay(mobileAttendanceDay);
    const row = attendanceRows.find((item) => String(item.id) === String(rowId));

    if (!row) {
      setStatus("No se encontro el alumno seleccionado.", "error");
      return;
    }

    const nextValue = !Boolean(row[day.field]);
    row[day.field] = nextValue;
    renderMobileAttendanceRows();

    const saved = await updateStudentAttendance(row.id, day.field, nextValue, {
      reload: false,
      silent: true,
    });

    if (!saved) {
      row[day.field] = !nextValue;
      renderMobileAttendanceRows();
      return;
    }

    setStatus("Asistencia guardada automaticamente.", "success");
  }

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }

  function renderAvailabilityRows(rows) {
    availabilityRows = rows;

    if (!rows.length) {
      availabilityTotalCount = 0;
      availabilitySummary.textContent = availabilityNameFilter.value
        ? "No hay personas con esa busqueda."
        : "No hay disponibilidades registradas.";
      availabilityTableBody.innerHTML =
        '<tr><td colspan="15" class="empty-state">No hay disponibilidad para mostrar.</td></tr>';
      updateAvailabilityPagination();
      return;
    }

    availabilityTotalCount = Number(rows[0]?.total_count) || rows.length;
    const availabilityMarks = rows.reduce(
      (total, row) => total + AVAILABILITY_WEEKS.filter((week) => row[week]).length,
      0
    );
    availabilitySummary.textContent = `${rows.length} personas mostradas de ${availabilityTotalCount}. ${availabilityMarks} semanas marcadas en esta pagina.`;
    availabilityTableBody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <th scope="row">${escapeHtml(row.nombre)}</th>
            ${AVAILABILITY_WEEKS.map((week, index) => {
              const selected = Boolean(row[week]);
              return `<td class="${selected ? "availability-week-cell active" : "availability-week-cell"}" data-week-label="${String(index + 1).padStart(2, "0")}">${selected ? "Si" : ""}</td>`;
            }).join("")}
            <td>${escapeHtml(row.observaciones || "-")}</td>
            <td>${escapeHtml(formatDateTime(row.updated_at))}</td>
            <td>
              <button
                class="compact-button danger-button"
                type="button"
                data-delete-availability="${escapeHtml(row.id)}"
              >
                Borrar
              </button>
            </td>
          </tr>
        `
      )
      .join("");
    updateAvailabilityPagination();
  }

  async function loadAvailabilityRows() {
    availabilitySummary.textContent = "Cargando disponibilidad...";
    availabilityTableBody.innerHTML =
      '<tr><td colspan="15" class="empty-state">Cargando disponibilidad...</td></tr>';

    try {
      const supabase = await getSupabaseClient();
      const from = (availabilityCurrentPage - 1) * availabilityRowsPerPage;
      const to = from + availabilityRowsPerPage - 1;
      let query = supabase
        .from("concilia_disponibilidad")
        .select(
          "id,nombre,observaciones,semana_01,semana_02,semana_03,semana_04,semana_05,semana_06,semana_07,semana_08,semana_09,semana_10,semana_11,updated_at",
          { count: "exact" }
        )
        .order("updated_at", { ascending: false })
        .order("nombre", { ascending: true })
        .range(from, to);

      const search = String(availabilityNameFilter.value || "").trim();
      if (search) {
        query = query.ilike("nombre", `%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) {
        throw error;
      }

      const rows = (data ?? []).map((row) => ({
        ...row,
        total_count: count ?? data?.length ?? 0,
      }));
      renderAvailabilityRows(rows);
    } catch (error) {
      availabilitySummary.textContent = "No se pudo cargar la disponibilidad.";
      availabilityTableBody.innerHTML =
        '<tr><td colspan="15" class="empty-state">Error cargando disponibilidad.</td></tr>';
      setStatus(`No se pudo cargar disponibilidad: ${error.message}`, "error");
    }
  }

  async function deleteAvailabilityRow(id) {
    const row = availabilityRows.find((item) => String(item.id) === String(id));
    const name = row?.nombre || "esta persona";
    const confirmed = window.confirm(`Vas a borrar la disponibilidad de ${name}.`);
    if (!confirmed) {
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("concilia_disponibilidad").delete().eq("id", id);
      if (error) {
        throw error;
      }

      setStatus("Disponibilidad borrada correctamente.", "success");
      await loadAvailabilityRows();
    } catch (error) {
      setStatus(`No se pudo borrar disponibilidad: ${error.message}`, "error");
    }
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

  function renderComedorRows(rows) {
    comedorRows = rows.map((row) => ({
      codigoPersona: String(row.codigo_persona ?? "").trim(),
      centro: String(row.centro ?? "").trim() || "Sin centro",
      alumnado: String(row.alumnado ?? "").trim() || "Sin nombre",
      comedor: Boolean(row.comedor),
    }));

    comedorTotalCount = Number(rows[0]?.total_count) || comedorRows.length;
    const comedorTotal = comedorRows.filter((row) => row.comedor).length;
    comedorSummary.textContent = `${comedorRows.length} alumnos mostrados de ${comedorTotalCount}. ${comedorTotal} con comedor en esta pagina.`;

    if (!comedorRows.length) {
      comedorTotalCount = 0;
      comedorTableBody.innerHTML =
        '<tr><td colspan="3" class="empty-state">No hay alumnado con esos filtros.</td></tr>';
      updateComedorPagination();
      return;
    }

    comedorTableBody.innerHTML = comedorRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.centro)}</td>
            <td>${escapeHtml(row.alumnado)}</td>
            <td class="nee-check-cell">
              <input
                class="comedor-checkbox"
                type="checkbox"
                data-comedor-codigo-persona="${escapeHtml(row.codigoPersona)}"
                data-comedor-centro="${escapeHtml(row.centro)}"
                ${row.comedor ? "checked" : ""}
                aria-label="Marcar comedor para ${escapeHtml(row.alumnado)}"
              />
            </td>
          </tr>
        `
      )
      .join("");
    updateComedorPagination();
  }

  async function updateStudentComedor(codigoPersona, centro, comedor) {
    if (!codigoPersona) {
      setStatus("No se pudo actualizar comedor: falta el codigo de persona.", "error");
      return false;
    }

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase.rpc("set_concilia_comedor", {
        p_codigo_persona: codigoPersona,
        p_centro: centro || null,
        p_comedor: comedor,
      });

      if (error) {
        throw error;
      }

      if (!Number(data)) {
        throw new Error("no se encontraron registros visibles para ese alumno.");
      }

      studentRows.forEach((row) => {
        const samePerson = String(row.codigo_persona ?? "").trim() === String(codigoPersona).trim();
        const rowCentro = String(row.centro ?? "").trim() || "Sin centro";
        const sameCentro = !centro || rowCentro === centro;
        if (samePerson && sameCentro) {
          row.comedor = Boolean(comedor);
        }
      });

      await Promise.all([
        applyStudentFilters(),
        loadComedorRows(supabase),
      ]);
      setStatus(
        comedor
          ? "Alumno marcado con comedor en todas sus semanas."
          : "Comedor retirado en todas sus semanas.",
        "success"
      );
      return true;
    } catch (error) {
      setStatus(`No se pudo actualizar comedor: ${error.message}`, "error");
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
        funcionRows,
        modalidadRows,
        situacionRows,
        tipoHoraRows,
        contractPersonalRows,
        contractInstallationRows,
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
        fetchCatalog(supabase, "funciones", "id,funcion", "funcion"),
        fetchCatalog(supabase, "modalidades", "id,modalidad", "modalidad"),
        fetchCatalog(supabase, "situaciones", "id,situacion", "situacion"),
        fetchCatalog(supabase, "tipo_horas", "id,tipo_hora", "tipo_hora"),
        supabase
          .from("contrato_personal")
          .select("contrato_id,personal_id,activo,fecha_inicio,fecha_fin,removed_at"),
        supabase
          .from("contrato_instalaciones")
          .select("contrato_id,instalacion_id,activo,fecha_inicio,fecha_fin,removed_at"),
      ]);

      if (contractPersonalRows.error && !isMissingTableError(contractPersonalRows.error, "contrato_personal")) {
        throw contractPersonalRows.error;
      }
      if (
        contractInstallationRows.error &&
        !isMissingTableError(contractInstallationRows.error, "contrato_instalaciones")
      ) {
        throw contractInstallationRows.error;
      }

      activityAllPersonalRows = personalRows;
      activityAllInstallationRows = instalacionRows;
      activityContractPersonalRows = contractPersonalRows.error ? [] : contractPersonalRows.data ?? [];
      activityContractInstallationRows = contractInstallationRows.error
        ? []
        : contractInstallationRows.data ?? [];
      activityUsesContractAssignments = !contractPersonalRows.error && !contractInstallationRows.error;
      activityPersonalRows = personalRows;
      activityInstallationRows = instalacionRows;
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
      renderActivityContractScopedOptions(activityForm);
      renderActivityContractScopedOptions(activityEditForm);
      renderCatalogOptions(activityEmpresa, empresaRows, "id", "empresa", "Seleccionar empresa");
      renderCatalogOptions(editActivityEmpresa, empresaRows, "id", "empresa", "Seleccionar empresa");
      renderCatalogOptions(
        filterActivityInstalacion,
        activityInstallationRows,
        "id",
        "instalacion",
        "Todas las instalaciones"
      );
      renderCatalogOptions(activityPuesto, puestoRows, "id", "puesto", "Seleccionar puesto");
      renderCatalogOptions(editActivityPuesto, puestoRows, "id", "puesto", "Seleccionar puesto");
      renderCatalogOptions(activityFuncion, funcionRows, "id", "funcion", "Seleccionar funcion");
      renderCatalogOptions(editActivityFuncion, funcionRows, "id", "funcion", "Seleccionar funcion");
      renderCatalogOptions(activityModalidad, modalidadRows, "id", "modalidad", "Seleccionar modalidad");
      renderCatalogOptions(
        editActivityModalidad,
        modalidadRows,
        "id",
        "modalidad",
        "Seleccionar modalidad"
      );
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
      activityCatalogsLoaded = true;
      applyActivityFormDefaults();
      activitiesSummary.textContent = "Completa los campos para crear una actividad.";
    } catch (error) {
      activitiesSummary.textContent = "No se pudieron cargar las listas maestras.";
      setStatus(`No se pudieron cargar las listas de actividades: ${error.message}`, "error");
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
      funcion_id: formData.get("funcion_id") ? Number(formData.get("funcion_id")) : null,
      modalidad_id: formData.get("modalidad_id") ? Number(formData.get("modalidad_id")) : null,
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
          "id,personal_id,personal,contrato_id,contrato,empresa_id,empresa,instalacion_id,instalacion,puesto_id,puesto,funcion_id,funcion,modalidad_id,modalidad,situacion_id,situacion,tipo_hora_id,tipo_hora,dias_semana,fecha_inicio,fecha_fin,hora_inicio,hora_fin,llamamiento_enviado,respuesta_llamamiento,observaciones,updated_at"
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
            <td>
              ${escapeHtml(activity.puesto)}
              <br />
              <span class="muted-text">${escapeHtml(activity.funcion || "")}</span>
            </td>
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
    editActivityContrato.value = String(activity.contrato_id);
    renderActivityContractScopedOptions(
      activityEditForm,
      String(activity.personal_id),
      String(activity.instalacion_id)
    );
    editActivityPersonal.value = String(activity.personal_id);
    editActivityEmpresa.value = String(activity.empresa_id);
    editActivityInstalacion.value = String(activity.instalacion_id);
    editActivityPuesto.value = String(activity.puesto_id);
    editActivityFuncion.value = activity.funcion_id ? String(activity.funcion_id) : "";
    editActivityModalidad.value = activity.modalidad_id ? String(activity.modalidad_id) : "";
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
    activityContrato.value = editActivityContrato.value;
    renderActivityContractScopedOptions(activityForm, "", editActivityInstalacion.value);
    activityPersonal.value = "";
    activityEmpresa.value = editActivityEmpresa.value;
    activityInstalacion.value = editActivityInstalacion.value;
    activityPuesto.value = editActivityPuesto.value;
    activityFuncion.value = editActivityFuncion.value;
    activityModalidad.value = editActivityModalidad.value;
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
      const [installationRows, personalRows] = await Promise.all([
        fetchCatalog(supabase, "instalaciones", "id,instalacion", "instalacion", [
          { column: "activo", value: true },
        ]),
        fetchCatalog(supabase, "personal", "id,personal", "personal", [
          { column: "vinculacion_id", operator: "in", value: [1, 2] },
        ]),
      ]);

      assignmentInstallationRows = installationRows;
      assignmentPersonalRows = personalRows;
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

  function updateAttendanceSortButtons() {
    document.querySelectorAll("[data-attendance-sort-field]").forEach((button) => {
      const isActive = button.dataset.attendanceSortField === attendanceSort.field;
      button.classList.toggle("active", isActive);
      button.dataset.direction = isActive ? attendanceSort.direction : "";
    });
  }

  async function applyStudentFilters() {
    try {
      const supabase = await getSupabaseClient();
      await Promise.all([
        fetchStudentsPage(supabase),
        loadStudentFilterOptions(supabase),
      ]);
      updateStudentSortButtons();
      syncStudentsBulkAssignmentUi();
      renderStudentsTable();
    } catch (error) {
      studentsSummary.textContent = "No se pudieron cargar los datos.";
      studentsTableBody.innerHTML =
        '<tr><td colspan="8" class="empty-state">Error cargando alumnado.</td></tr>';
      setStatus(`No se pudo cargar alumnado: ${error.message}`, "error");
    }
  }

  function getStudentFilters() {
    return {
      centro: String(filterCentro.value || "").trim(),
      semana: String(filterSemana.value || "").trim(),
      alumnado: String(filterAlumnado.value || "").trim(),
      edades: getSelectValues(filterEdad),
    };
  }

  function trimInputValue(input) {
    return String(input?.value || "").trim();
  }

  function nullableInputValue(input) {
    return trimInputValue(input) || null;
  }

  function setStudentFormDefaults() {
    const filters = getStudentFilters();
    studentForm.reset();
    studentId.value = "";
    studentCentro.value = filters.centro;
    studentSemana.value = filters.semana;
    studentComedor.checked = false;
    studentGrupo.value = "";
    studentPanelTitle.textContent = "Nuevo alumno";
    studentPanelSummary.textContent = "Completa los datos del alumno.";
  }

  function fillStudentForm(row) {
    studentForm.reset();
    studentId.value = row.id ?? "";
    studentCodigoClase.value = row.codigo_clase ?? "";
    studentClase.value = row.clase ?? "";
    studentFechaInicial.value = row.fecha_inicial ?? "";
    studentEstado.value = row.estado ?? "";
    studentCodigoPersona.value = row.codigo_persona ?? "";
    studentNombre.value = row.nombre ?? "";
    studentApellidos.value = row.apellidos ?? "";
    studentAlumnado.value = row.alumnado ?? "";
    studentDocumento.value = row.documento ?? "";
    studentFechaNacimiento.value = row.fecha_nacimiento ?? "";
    studentEdad.value = row.edad ?? "";
    studentMovil.value = row.movil ?? "";
    studentMail.value = row.mail ?? "";
    studentCentro.value = row.centro ?? "";
    studentSemana.value = row.semana ?? "";
    studentNee.checked = Boolean(String(row.nee ?? "").trim());
    studentComedor.checked = Boolean(row.comedor);
    studentGrupo.value = STUDENT_GROUP_OPTIONS.includes(row.grupo) ? row.grupo : "";
    studentPanelTitle.textContent = `Editar ${row.alumnado || "alumno"}`;
    studentPanelSummary.textContent = "Actualiza los datos y guarda los cambios.";
  }

  function openStudentPanel() {
    studentPanelBackdrop.classList.remove("hidden");
    studentPanel.classList.remove("hidden");
    studentAlumnado.focus();
  }

  function closeStudentPanel() {
    studentPanelBackdrop.classList.add("hidden");
    studentPanel.classList.add("hidden");
  }

  function openSummaryPanel() {
    summaryPanelBackdrop.classList.remove("hidden");
    summaryPanel.classList.remove("hidden");
  }

  function closeSummaryPanel() {
    summaryPanelBackdrop.classList.add("hidden");
    summaryPanel.classList.add("hidden");
  }

  function openStudentCreatePanel() {
    setStudentFormDefaults();
    openStudentPanel();
  }

  function openStudentEditPanel(id) {
    const row = studentRows.find((student) => String(student.id) === String(id));
    if (!row) {
      setStatus("No se encontro el alumno en la pagina actual.", "error");
      return;
    }

    fillStudentForm(row);
    openStudentPanel();
  }

  function buildStudentPayload() {
    const nombre = trimInputValue(studentNombre);
    const apellidos = trimInputValue(studentApellidos);
    const alumnado = trimInputValue(studentAlumnado) || [nombre, apellidos].filter(Boolean).join(" ");

    return {
      codigo_clase: trimInputValue(studentCodigoClase),
      clase: nullableInputValue(studentClase),
      fecha_inicial: nullableInputValue(studentFechaInicial),
      estado: nullableInputValue(studentEstado),
      codigo_persona: Number(trimInputValue(studentCodigoPersona)),
      apellidos: apellidos || null,
      nombre: nombre || null,
      nee: studentNee.checked ? "SI" : null,
      documento: nullableInputValue(studentDocumento),
      fecha_nacimiento: nullableInputValue(studentFechaNacimiento),
      edad: nullableInputValue(studentEdad),
      movil: nullableInputValue(studentMovil),
      mail: nullableInputValue(studentMail),
      centro: nullableInputValue(studentCentro),
      semana: nullableInputValue(studentSemana),
      alumnado,
      comedor: Boolean(studentComedor.checked),
      grupo: nullableInputValue(studentGrupo),
    };
  }

  async function handleStudentSubmit(event) {
    event.preventDefault();
    const payload = buildStudentPayload();

    if (!Number.isInteger(payload.codigo_persona) || payload.codigo_persona <= 0) {
      setStatus("Codigo persona debe ser un numero valido.", "error");
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const id = trimInputValue(studentId);
      const request = id
        ? supabase.from("concilia_usuarios").update(payload).eq("id", id)
        : supabase.from("concilia_usuarios").insert(payload);
      const { error } = await request;

      if (error) {
        throw error;
      }

      closeStudentPanel();
      setStatus(id ? "Alumno actualizado." : "Alumno creado.", "success");
      await loadStudents();
    } catch (error) {
      setStatus(`No se pudo guardar el alumno: ${error.message}`, "error");
    }
  }

  async function updateStudentInlineField(studentIdValue, field, value) {
    if (!studentIdValue || !["comedor", "grupo"].includes(field)) {
      setStatus("No se pudo actualizar el alumno: campo no valido.", "error");
      return false;
    }

    try {
      const supabase = await getSupabaseClient();

      const { error } = await supabase
        .from("concilia_usuarios")
        .update({ [field]: value })
        .eq("id", studentIdValue);

      if (error) {
        throw error;
      }

      const row = studentRows.find((student) => String(student.id) === String(studentIdValue));
      if (row) {
        row[field] = value;
      }

      setStatus(
        field === "comedor" ? "Comedor actualizado para esta semana." : "Alumno actualizado.",
        "success"
      );
      return true;
    } catch (error) {
      setStatus(`No se pudo actualizar el alumno: ${error.message}`, "error");
      return false;
    }
  }

  function applyStudentFiltersToQuery(query, filters, options = {}) {
    const includeTextFilter = options.includeTextFilter !== false;

    if (filters.centro) {
      query = query.eq("centro", filters.centro);
    }

    if (filters.semana) {
      query = query.eq("semana", filters.semana);
    }

    if (filters.alumnado && includeTextFilter) {
      query = query.ilike("alumnado", `%${filters.alumnado}%`);
    }

    if (filters.edades?.length) {
      query = query.in("edad", filters.edades);
    }

    return query;
  }

  async function fetchStudentsPage(supabase) {
    const filters = getStudentFilters();
    const from = (studentsCurrentPage - 1) * studentsRowsPerPage;
    const to = from + studentsRowsPerPage - 1;
    const pageSize = 1000;
    const rows = [];

    for (let pageFrom = 0; ; pageFrom += pageSize) {
      const pageTo = pageFrom + pageSize - 1;
      let query = supabase
        .from("concilia_usuarios")
        .select(STUDENT_SELECT_COLUMNS, { count: "exact" })
        .order("centro", { ascending: true })
        .order("semana", { ascending: true })
        .order("alumnado", { ascending: true })
        .range(pageFrom, pageTo);
      query = applyStudentFiltersToQuery(query, filters, { includeTextFilter: false });

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      rows.push(...(data ?? []));

      if (!data || data.length < pageSize) {
        break;
      }
    }

    studentRows = rows.filter((row) => matchesNormalizedStudentSearch(row, filters.alumnado));
    studentRows.sort(compareStudentRows);
    studentsTotalCount = studentRows.length;
    filteredStudentRows = studentRows.slice(from, to + 1);
  }

  async function fetchStudentAgeFilterValues(supabase, filters) {
    const pageSize = 1000;
    const ages = new Set();

    for (let pageFrom = 0; ; pageFrom += pageSize) {
      const pageTo = pageFrom + pageSize - 1;
      let query = supabase
        .from("concilia_usuarios")
        .select("edad")
        .range(pageFrom, pageTo);
      query = applyStudentFiltersToQuery(query, { ...filters, edades: [] }, { includeTextFilter: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      (data ?? [])
        .filter((row) => matchesNormalizedStudentSearch(row, filters.alumnado))
        .forEach((row) => {
          const age = String(row.edad ?? "").trim();
          if (age) {
            ages.add(age);
          }
        });

      if (!data || data.length < pageSize) {
        break;
      }
    }

    return Array.from(ages).sort(sortAgeValues);
  }

  async function fetchAllFilteredStudentsForReport(supabase) {
    const filters = getStudentFilters();
    const pageSize = 1000;
    const rows = [];

    for (let pageFrom = 0; ; pageFrom += pageSize) {
      const pageTo = pageFrom + pageSize - 1;
      let query = supabase
        .from("concilia_usuarios")
        .select("centro,semana,alumnado,edad")
        .order("centro", { ascending: true })
        .order("semana", { ascending: true })
        .range(pageFrom, pageTo);
      query = applyStudentFiltersToQuery(query, filters, { includeTextFilter: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      rows.push(...(data ?? []).filter((row) => matchesNormalizedStudentSearch(row, filters.alumnado)));

      if (!data || data.length < pageSize) {
        break;
      }
    }

    return rows;
  }

  const STUDENT_AGE_REPORT_COLUMNS = [
    { key: "lt4", label: "< 4 años" },
    { key: "4", label: "4 años" },
    { key: "5", label: "5 años" },
    { key: "6", label: "6 años" },
    { key: "7", label: "7 años" },
    { key: "8", label: "8 años" },
    { key: "9", label: "9 años" },
    { key: "10", label: "10 años" },
    { key: "11", label: "11 años" },
    { key: "12", label: "12 años" },
    { key: "13", label: "13 años" },
    { key: "14", label: "14 años" },
    { key: "gt14", label: "> 14 años" },
  ];

  function parseStudentAgeNumber(value) {
    const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function getStudentAgeReportKey(value) {
    const age = parseStudentAgeNumber(value);

    if (!Number.isFinite(age)) {
      return null;
    }

    if (age < 4) {
      return "lt4";
    }

    if (age > 14) {
      return "gt14";
    }

    const roundedAge = Math.floor(age);
    return roundedAge >= 4 && roundedAge <= 14 ? String(roundedAge) : null;
  }

  function buildStudentsAgeReportRows(rows) {
    const groupedRows = new Map();

    rows.forEach((row) => {
      const centro = String(row.centro ?? "").trim() || "Sin centro";
      const semana = String(row.semana ?? "").trim() || "Sin semana";
      const groupKey = `${centro}\u0000${semana}`;

      if (!groupedRows.has(groupKey)) {
        groupedRows.set(groupKey, {
          centro,
          semana,
          counts: Object.fromEntries(STUDENT_AGE_REPORT_COLUMNS.map((column) => [column.key, 0])),
        });
      }

      const ageKey = getStudentAgeReportKey(row.edad);
      if (ageKey) {
        groupedRows.get(groupKey).counts[ageKey] += 1;
      }
    });

    return Array.from(groupedRows.values()).sort((left, right) => {
      const centerCompare = left.centro.localeCompare(right.centro, "es", { sensitivity: "base" });
      if (centerCompare !== 0) {
        return centerCompare;
      }

      return left.semana.localeCompare(right.semana, "es", {
        numeric: true,
        sensitivity: "base",
      });
    });
  }

  async function downloadStudentsAgeReportPdf() {
    try {
      const supabase = await getSupabaseClient();
      const rows = buildStudentsAgeReportRows(await fetchAllFilteredStudentsForReport(supabase));

      if (!rows.length) {
        setStatus("No hay alumnado filtrado para generar el informe.", "error");
        return;
      }

      const { jsPDF } = await getJsPdfClient();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      const rowHeight = 7;
      const centerWidth = 58;
      const weekWidth = 18;
      const ageWidth = (pageWidth - margin * 2 - centerWidth - weekWidth) / STUDENT_AGE_REPORT_COLUMNS.length;
      let y = margin;

      const drawTitle = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Informe de alumnado por edad", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`${rows.length} centro/semana según filtros del listado de alumnado.`, margin, y);
        y += 8;
      };

      const drawHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.2);
        doc.setFillColor(235, 239, 245);
        doc.rect(margin, y - 4.5, pageWidth - margin * 2, rowHeight, "F");
        doc.text("Centro", margin + 1, y);
        doc.text("Semana", margin + centerWidth + 1, y);
        STUDENT_AGE_REPORT_COLUMNS.forEach((column, index) => {
          doc.text(column.label, margin + centerWidth + weekWidth + ageWidth * index + 1, y, {
            maxWidth: ageWidth - 1,
          });
        });
        y += rowHeight;
      };

      const ensureSpace = () => {
        if (y + rowHeight <= pageHeight - margin) {
          return;
        }

        doc.addPage();
        y = margin;
        drawHeader();
      };

      drawTitle();
      drawHeader();

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      rows.forEach((row) => {
        ensureSpace();
        doc.text(row.centro, margin + 1, y, { maxWidth: centerWidth - 2 });
        doc.text(row.semana, margin + centerWidth + 1, y, { maxWidth: weekWidth - 2 });
        STUDENT_AGE_REPORT_COLUMNS.forEach((column, index) => {
          const value = row.counts[column.key] || 0;
          doc.text(String(value), margin + centerWidth + weekWidth + ageWidth * index + 1, y, {
            maxWidth: ageWidth - 1,
          });
        });
        y += rowHeight;
      });

      const today = new Date().toISOString().slice(0, 10);
      doc.save(`informe-alumnado-edades-${today}.pdf`);
      setStatus("PDF de alumnado por edad generado correctamente.", "success");
    } catch (error) {
      setStatus(`No se pudo generar el informe de edades: ${error.message}`, "error");
    }
  }

  async function loadStudentFilterOptions(supabase) {
    const filters = getStudentFilters();
    const [optionResult, ageResult] = await Promise.all([
      supabase.rpc("get_concilia_filter_options", {
        p_centro: filters.centro || null,
        p_semana: filters.semana || null,
        p_alumnado: filters.alumnado || null,
      }),
      fetchStudentAgeFilterValues(supabase, filters),
    ]);

    if (optionResult.error) {
      throw optionResult.error;
    }

    renderStudentFilterOptionRows(optionResult.data ?? [], ageResult);
  }

  async function loadStudentBulkOptions(supabase) {
    const { data, error } = await supabase.rpc("get_concilia_filter_options", {
      p_centro: null,
      p_semana: null,
      p_alumnado: null,
    });

    if (error) {
      throw error;
    }

    renderStudentBulkOptionRows(data ?? []);
  }

  async function loadWeeklySummary(supabase) {
    const { data, error } = await supabase.rpc("get_concilia_weekly_summary");
    if (error) {
      throw error;
    }
    renderWeeklySummaryRows(data ?? []);
  }

  async function loadAttendanceMatrix(supabase) {
    const filters = {
      centro: String(attendanceCenterFilter.value || "").trim(),
      semana: String(attendanceWeekFilter.value || "").trim(),
      alumnado: String(attendanceNameFilter.value || "").trim(),
    };
    const { data: optionRows, error: optionsError } = await supabase.rpc(
      "get_concilia_filter_options",
      {
        p_centro: filters.centro || null,
        p_semana: filters.semana || null,
        p_alumnado: filters.alumnado || null,
      }
    );

    if (optionsError) {
      throw optionsError;
    }

    renderAttendanceFilterOptionRows(optionRows ?? []);

    const attendanceParams = {
      p_centro: String(attendanceCenterFilter.value || "").trim() || null,
      p_semana: String(attendanceWeekFilter.value || "").trim() || null,
      p_grupo: mobileAttendanceListOpen
        ? String(attendanceMobileGroupFilter?.value || "").trim() || null
        : null,
      p_alumnado: String(attendanceNameFilter.value || "").trim() || null,
      p_limit: mobileAttendanceListOpen ? 5000 : attendanceRowsPerPage,
      p_offset: mobileAttendanceListOpen ? 0 : (attendanceCurrentPage - 1) * attendanceRowsPerPage,
      p_sort_field: attendanceSort.field,
      p_sort_direction: attendanceSort.direction,
    };

    let { data, error } = await supabase.rpc("get_concilia_attendance_rows", attendanceParams);
    if (error && String(error.message || "").includes("p_grupo")) {
      data = await fetchAttendanceRowsDirect(supabase, attendanceParams);
      error = null;
    }

    if (error) {
      throw error;
    }
    renderAttendanceRows(sortAttendanceRows(data ?? []));
    updateAttendanceSortButtons();
  }

  async function fetchAttendanceRowsDirect(supabase, params) {
    let query = supabase
      .from("concilia_usuarios")
      .select(
        "id,centro,semana,alumnado,edad,asistencia_lunes,asistencia_martes,asistencia_miercoles,asistencia_jueves,asistencia_viernes",
        { count: "exact" }
      );

    if (params.p_centro) {
      query = query.eq("centro", params.p_centro);
    }

    if (params.p_semana) {
      query = query.eq("semana", params.p_semana);
    }

    if (params.p_grupo) {
      query = query.eq("grupo", params.p_grupo);
    }

    query = query
      .order(params.p_sort_field === "edad" ? "edad" : "alumnado", {
        ascending: params.p_sort_direction !== "desc",
      })
      .range(params.p_offset, params.p_offset + params.p_limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return (data ?? []).filter((row) => matchesNormalizedStudentSearch(row, params.p_alumnado)).map((row) => ({
      ...row,
      centro: String(row.centro ?? "").trim() || "Sin centro",
      semana: String(row.semana ?? "").trim() || "Sin semana",
      alumnado: String(row.alumnado ?? "").trim() || "Sin nombre",
      edad: String(row.edad ?? "").trim() || "-",
      total_count: count ?? data?.length ?? 0,
    }));
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

  async function loadComedorFilterOptions(supabase) {
    const { data, error } = await supabase.rpc("get_concilia_filter_options", {
      p_centro: null,
      p_semana: null,
      p_alumnado: null,
    });
    if (error) {
      throw error;
    }
    renderComedorFilterOptionRows(data ?? []);
  }

  async function loadComedorRows(supabase) {
    const { data, error } = await supabase.rpc("get_concilia_comedor_rows", {
      p_centro: String(filterComedorCentro?.value || "").trim() || null,
      p_alumnado: String(filterComedorAlumnado?.value || "").trim() || null,
      p_limit: comedorRowsPerPage,
      p_offset: (comedorCurrentPage - 1) * comedorRowsPerPage,
    });
    if (error) {
      throw error;
    }
    renderComedorRows(data ?? []);
  }

  async function loadComedorPanel(supabase) {
    await Promise.all([
      loadComedorFilterOptions(supabase),
      loadComedorRows(supabase),
    ]);
  }

  async function fetchAllStudents(supabase) {
    const pageSize = 1000;
    const rows = [];

    for (let from = 0; ; from += pageSize) {
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("concilia_usuarios")
        .select(STUDENT_SELECT_COLUMNS)
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
    applyModuleAccess(email);
  }

  async function loadStudents() {
    studentsSummary.textContent = "Cargando datos...";
    studentsTableHead.innerHTML = "";
    studentsTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">Cargando alumnado...</td></tr>';

    try {
      const supabase = await getSupabaseClient();
      await Promise.all([
        fetchStudentsPage(supabase),
        loadStudentFilterOptions(supabase),
        loadStudentBulkOptions(supabase),
        loadWeeklySummary(supabase),
        loadAttendanceMatrix(supabase),
        loadNeeRows(supabase),
      ]);
    } catch (error) {
      studentsSummary.textContent = "No se pudieron cargar los datos.";
      studentsTableHead.innerHTML = "";
      studentsTableBody.innerHTML =
        '<tr><td colspan="6" class="empty-state">Error cargando alumnado.</td></tr>';
      setStatus(`No se pudo cargar alumnado: ${error.message}`, "error");
      return;
    }

    syncStudentsBulkAssignmentUi();
    renderStudentsTable();
  }

  async function enterApp(session) {
    showApp(session.user.email ?? "");
    const initialModuleTab = getInitialModuleTab();
    switchModuleTab(initialModuleTab);
    await loadModuleTabData(initialModuleTab);
  }

  function clearAppDataState() {
    studentRows = [];
    filteredStudentRows = [];
    studentsTotalCount = 0;
    attendanceRows = [];
    attendanceTotalCount = 0;
    neeRows = [];
    neeTotalCount = 0;
    comedorRows = [];
    comedorTotalCount = 0;
    availabilityRows = [];
    availabilityTotalCount = 0;
    activitiesRows = [];
    filteredActivitiesRows = [];
    assignmentRows = [];
    studentsCurrentPage = 1;
    attendanceCurrentPage = 1;
    neeCurrentPage = 1;
    comedorCurrentPage = 1;
    availabilityCurrentPage = 1;
  }

  function showLoggedOutView() {
    clearAppDataState();
    loginForm.reset();
    passwordSetupForm.reset();
    mobileModuleMenu?.classList.add("hidden");
    mobileModuleMenuToggle?.setAttribute("aria-expanded", "false");
    studentsTableHead.innerHTML = "";
    studentsTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">Cargando alumnado...</td></tr>';
    studentsSummary.textContent = "Cargando datos...";
    attendanceRows = [];
    attendanceTableBody.innerHTML =
      '<tr><td colspan="7" class="empty-state">Cargando asistencia...</td></tr>';
    attendanceMobileRows.innerHTML = '<p class="empty-state">Selecciona centro y semana.</p>';
    attendanceSummary.textContent = "Cargando asistencia...";
    weeklySummary.textContent = "Cargando resumen...";
    weeklySummaryTableBody.innerHTML =
      '<tr><td colspan="13" class="empty-state">Cargando resumen...</td></tr>';
    neeTableBody.innerHTML =
      '<tr><td colspan="2" class="empty-state">Cargando alumnado...</td></tr>';
    neeSummary.textContent = "Cargando alumnado...";
    showLogin();
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
      showLoggedOutView();
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
      await _authHandlers.handleLogout();
      showLoggedOutView();
      return;
    }

    // Fallback local
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) { setStatus(`No se pudo cerrar sesion: ${error.message}`, "error"); return; }
      showLoggedOutView();
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
    decorateStaticActionButtons();

    if (EMBED_MODE) {
      document.body?.classList.add("embedded-concilia");
    }

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
    mobileLogoutButton?.addEventListener("click", () => {
      void handleLogout();
    });
    mobileModuleMenuToggle?.addEventListener("click", () => {
      const isOpen = !mobileModuleMenu?.classList.contains("hidden");
      mobileModuleMenu?.classList.toggle("hidden", isOpen);
      mobileModuleMenuToggle.setAttribute("aria-expanded", String(!isOpen));
    });
    moduleTabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.moduleTab;
        switchModuleTab(target);
        void loadModuleTabData(target);
      });
    });
    studentsFiltersForm.addEventListener("input", () => {
      studentsCurrentPage = 1;
      void applyStudentFilters();
    });
    studentsFiltersForm.addEventListener("submit", (event) => {
      event.preventDefault();
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
    downloadStudentsAgeReportPdfButton?.addEventListener("click", () => {
      void downloadStudentsAgeReportPdf();
    });
    studentsTableBody.addEventListener("change", (event) => {
      const control = event.target.closest("[data-student-inline-id][data-student-inline-field]");
      if (!control) {
        return;
      }

      const field = control.dataset.studentInlineField;
      const value = field === "comedor" ? Boolean(control.checked) : control.value || null;
      void updateStudentInlineField(control.dataset.studentInlineId, field, value);
    });
    studentsBulkFieldSelect?.addEventListener("change", syncStudentsBulkAssignmentUi);
    studentsBulkCurrentSelect?.addEventListener("change", () => {
      void updateStudentsBulkMatchCount();
    });
    studentsBulkNewSelect?.addEventListener("change", () => {
      void updateStudentsBulkMatchCount();
    });
    studentsBulkApplyButton?.addEventListener("click", () => {
      void applyStudentsBulkAssignment();
    });
    openSummaryPanelButton.addEventListener("click", openSummaryPanel);
    closeSummaryPanelButton.addEventListener("click", closeSummaryPanel);
    summaryPanelBackdrop.addEventListener("click", closeSummaryPanel);
    openStudentPanelButton.addEventListener("click", openStudentCreatePanel);
    closeStudentPanelButton.addEventListener("click", closeStudentPanel);
    studentPanelBackdrop.addEventListener("click", closeStudentPanel);
    clearStudentFormButton.addEventListener("click", () => {
      if (studentId.value) {
        const row = studentRows.find((student) => String(student.id) === String(studentId.value));
        if (row) {
          fillStudentForm(row);
          return;
        }
      }

      setStudentFormDefaults();
    });
    studentForm.addEventListener("submit", (event) => {
      void handleStudentSubmit(event);
    });
    studentsTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-edit-student]");
      if (!button) {
        return;
      }

      openStudentEditPanel(button.dataset.editStudent);
    });
    studentsTableHead.addEventListener("click", (event) => {
      const button = event.target.closest("[data-student-sort-field]");
      if (!button) {
        return;
      }

      const field = button.dataset.studentSortField;
      const currentSort = studentSort.find((sort) => sort.field === field);
      const direction =
        currentSort?.field === studentSort[0]?.field && currentSort.direction === "asc"
          ? "desc"
          : "asc";

      studentSort = [
        { field, direction },
        ...studentSort.filter((sort) => sort.field !== field),
      ];
      studentsCurrentPage = 1;
      void applyStudentFilters();
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
    attendanceFiltersForm.addEventListener("input", () => {
      attendanceCurrentPage = 1;
      setMobileAttendanceScreen(false);
      void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
    });
    attendanceFiltersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      attendanceCurrentPage = 1;
      setMobileAttendanceScreen(false);
      void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
    });
    attendanceFiltersForm.addEventListener("change", () => {
      attendanceCurrentPage = 1;
      setMobileAttendanceScreen(false);
      void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
    });
    attendanceMobileStartButton?.addEventListener("click", () => {
      if (!attendanceMobileCenterFilter?.value || !attendanceMobileWeekFilter?.value) {
        setStatus("Selecciona centro y semana para pasar asistencia.", "error");
        return;
      }

      storeMobileAttendanceFilters();
      attendanceCenterFilter.value = attendanceMobileCenterFilter?.value || "";
      attendanceWeekFilter.value = attendanceMobileWeekFilter?.value || "";
      attendanceNameFilter.value = "";
      attendanceCurrentPage = 1;
      setMobileAttendanceScreen(true);
      void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
    });
    attendanceMobileBackButton?.addEventListener("click", () => {
      setMobileAttendanceScreen(false);
    });
    attendanceMobileComedorButton?.addEventListener("click", () => {
      void openMobileComedorPanel();
    });
    attendanceMobileComedorCloseButton?.addEventListener("click", closeMobileComedorPanel);
    attendanceMobileComedorBackdrop?.addEventListener("click", closeMobileComedorPanel);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mobileComedorPanelOpen) {
        closeMobileComedorPanel();
      }
    });
    attendanceMobileCenterFilter?.addEventListener("change", () => {
      storeMobileAttendanceFilters();
    });
    attendanceMobileWeekFilter?.addEventListener("change", () => {
      storeMobileAttendanceFilters();
    });
    attendanceMobileGroupFilter?.addEventListener("change", () => {
      storeMobileAttendanceFilters();
      if (mobileAttendanceListOpen && mobileComedorPanelOpen) {
        void loadMobileComedorRows();
      }
      if (mobileAttendanceListOpen && !mobileComedorPanelOpen) {
        attendanceCurrentPage = 1;
        void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
      }
    });
    attendanceDayTabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        mobileAttendanceDay = button.dataset.attendanceDay || mobileAttendanceDay;
        renderMobileAttendanceRows();
      });
    });
    attendancePresenceFilterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        mobileAttendancePresenceFilter =
          button.dataset.attendancePresenceFilter || mobileAttendancePresenceFilter;
        renderMobileAttendanceRows();
      });
    });
    attendanceMobileRows?.addEventListener("click", (event) => {
      const rowButton = event.target.closest("[data-attendance-mobile-id]");
      if (!rowButton) {
        return;
      }

      void toggleMobileAttendance(rowButton.dataset.attendanceMobileId);
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
    attendanceTableBody.addEventListener("change", (event) => {
      const checkbox = event.target.closest(".attendance-checkbox");
      if (!checkbox) {
        return;
      }

      checkbox.disabled = true;
      void updateStudentAttendance(
        checkbox.dataset.attendanceId,
        checkbox.dataset.attendanceField,
        checkbox.checked
      ).then((success) => {
          if (!success) {
            checkbox.checked = !checkbox.checked;
          }
          checkbox.disabled = false;
        });
    });
    neeFiltersForm.addEventListener("input", () => {
      neeCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadNeeRows(supabase));
    });
    neeFiltersForm.addEventListener("submit", (event) => {
      event.preventDefault();
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
    comedorFiltersForm?.addEventListener("input", () => {
      comedorCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadComedorRows(supabase));
    });
    comedorFiltersForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      comedorCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadComedorRows(supabase));
    });
    comedorFiltersForm?.addEventListener("change", () => {
      comedorCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadComedorRows(supabase));
    });
    comedorFiltersForm?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reset-filter]");
      if (
        !button ||
        !resetNamedFormControl(comedorFiltersForm, button.dataset.resetFilter)
      ) {
        return;
      }

      comedorCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadComedorRows(supabase));
    });
    comedorPageSize?.addEventListener("change", () => {
      comedorRowsPerPage = Number(comedorPageSize.value);
      comedorCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadComedorRows(supabase));
    });
    comedorPreviousPage?.addEventListener("click", () => {
      comedorCurrentPage -= 1;
      void getSupabaseClient().then((supabase) => loadComedorRows(supabase));
    });
    comedorNextPage?.addEventListener("click", () => {
      comedorCurrentPage += 1;
      void getSupabaseClient().then((supabase) => loadComedorRows(supabase));
    });
    comedorTableBody?.addEventListener("change", (event) => {
      const checkbox = event.target.closest(".comedor-checkbox");
      if (!checkbox) {
        return;
      }

      checkbox.disabled = true;
      void updateStudentComedor(
        checkbox.dataset.comedorCodigoPersona,
        checkbox.dataset.comedorCentro,
        checkbox.checked
      ).then((success) => {
        if (!success) {
          checkbox.checked = !checkbox.checked;
        }
        checkbox.disabled = false;
      });
    });
    availabilityFiltersForm?.addEventListener("input", () => {
      availabilityCurrentPage = 1;
      void loadAvailabilityRows();
    });
    availabilityFiltersForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      availabilityCurrentPage = 1;
      void loadAvailabilityRows();
    });
    availabilityFiltersForm?.addEventListener("change", () => {
      availabilityCurrentPage = 1;
      void loadAvailabilityRows();
    });
    availabilityFiltersForm?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reset-filter]");
      if (
        !button ||
        !resetNamedFormControl(availabilityFiltersForm, button.dataset.resetFilter)
      ) {
        return;
      }

      availabilityCurrentPage = 1;
      void loadAvailabilityRows();
    });
    availabilityRefreshButton?.addEventListener("click", () => {
      void loadAvailabilityRows();
    });
    availabilityPageSize?.addEventListener("change", () => {
      availabilityRowsPerPage = Number(availabilityPageSize.value);
      availabilityCurrentPage = 1;
      void loadAvailabilityRows();
    });
    availabilityPreviousPage?.addEventListener("click", () => {
      availabilityCurrentPage -= 1;
      void loadAvailabilityRows();
    });
    availabilityNextPage?.addEventListener("click", () => {
      availabilityCurrentPage += 1;
      void loadAvailabilityRows();
    });
    availabilityTableBody?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-availability]");
      if (!button) {
        return;
      }

      void deleteAvailabilityRow(button.dataset.deleteAvailability);
    });
    activityForm.addEventListener("submit", (event) => {
      void handleActivitySubmit(event);
    });
    activityContrato?.addEventListener("change", () => {
      renderActivityContractScopedOptions(activityForm);
    });
    editActivityContrato?.addEventListener("change", () => {
      renderActivityContractScopedOptions(activityEditForm);
    });
    clearActivityFormButton.addEventListener("click", () => {
      activityForm.reset();
      renderActivityContractScopedOptions(activityForm);
      applyActivityFormDefaults();
      activitiesSummary.textContent = "Completa los campos para crear una actividad.";
    });
    openActivityPanelButton.addEventListener("click", openActivityCreatePanel);
    closeActivityPanelButton.addEventListener("click", closeActivityCreatePanel);
    activityPanelBackdrop.addEventListener("click", closeActivityCreatePanel);
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
    document.querySelectorAll("[data-attendance-sort-field]").forEach((button) => {
      button.addEventListener("click", () => {
        const field = button.dataset.attendanceSortField;
        if (attendanceSort.field === field) {
          attendanceSort.direction = attendanceSort.direction === "asc" ? "desc" : "asc";
        } else {
          attendanceSort = { field, direction: "asc" };
        }
        attendanceCurrentPage = 1;
        void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
      });
    });

    await restoreSession();
  }

  void init();
})();
