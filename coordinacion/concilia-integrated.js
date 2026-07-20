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
    "alumnado",
    "asistencia",
    "nee",
    "comedor",
    "disponibilidad",
    "actividades",
    "asignaciones",
  ]);
  const EMBED_MODE = new URLSearchParams(window.location.search).get("embed") === "1";
  const INITIAL_MODULE_TAB = (() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    return MODULE_TAB_TARGETS.has(tab) ? tab : "alumnado";
  })();

  const authView = document.querySelector("#concilia-auth-view");
  const appView = document.querySelector("#concilia-app-view");
  const loginForm = document.querySelector("#login-form");
  const passwordSetupForm = document.querySelector("#password-setup-form");
  const logoutButton = document.querySelector("#logout-button");
  const statusMessage = document.querySelector("#concilia-status-message");
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
  const duplicateStudentFormButton = document.querySelector("#duplicate-student-form-button");
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
  const attendanceTableBody = document.querySelector("#attendance-table-body");
  const attendancePaginationSummary = document.querySelector("#attendance-pagination-summary");
  const attendancePageSize = document.querySelector("#attendance-page-size");
  const attendancePreviousPage = document.querySelector("#attendance-previous-page");
  const attendanceNextPage = document.querySelector("#attendance-next-page");
  const openAttendanceReportButton = document.querySelector("#open-attendance-report-button");
  const closeAttendanceReportButton = document.querySelector("#close-attendance-report-button");
  const attendanceReportBackdrop = document.querySelector("#attendance-report-backdrop");
  const attendanceReportPanel = document.querySelector("#attendance-report-panel");
  const attendanceReportSummary = document.querySelector("#attendance-report-summary");
  const attendanceReportTableBody = document.querySelector("#attendance-report-table-body");
  const attendanceReportPdfButton = document.querySelector("#attendance-report-pdf-button");
  const attendanceReportExcelButton = document.querySelector("#attendance-report-excel-button");
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
  const activityServicio = document.querySelector("#activity-servicio");
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
  const openActivitiesScheduleReportButton = document.querySelector(
    "#open-activities-schedule-report-button"
  );
  const downloadActivitiesScheduleReportPdfButton = document.querySelector(
    "#download-activities-schedule-report-pdf-button"
  );
  const closeActivitiesScheduleReportButton = document.querySelector(
    "#close-activities-schedule-report-button"
  );
  const activitiesScheduleReportBackdrop = document.querySelector(
    "#activities-schedule-report-backdrop"
  );
  const activitiesScheduleReportPanel = document.querySelector(
    "#activities-schedule-report-panel"
  );
  const activitiesScheduleReportSummary = document.querySelector(
    "#activities-schedule-report-summary"
  );
  const activitiesScheduleReportContent = document.querySelector(
    "#activities-schedule-report-content"
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
  const filterActivityServicio = document.querySelector("#filter-activity-servicio");
  const filterActivityPuesto = document.querySelector("#filter-activity-puesto");
  const filterActivityPersonal = document.querySelector("#filter-activity-personal");
  const filterActivityPersonalSuggestions = document.querySelector(
    "#filter-activity-personal-suggestions"
  );
  const filterActivityPersonalClear = document.querySelector("[data-activity-personal-clear]");
  const filterActivityPersonalToggle = document.querySelector("[data-activity-personal-toggle]");
  const filterActivityInstalacion = document.querySelector("#filter-activity-instalacion");
  const clearActivitiesFiltersButton = document.querySelector("#clear-activities-filters-button");
  const activitiesHistorialZone = document.querySelector("#activities-historial-zone");
  const activitiesHistorialPerson = document.querySelector("#activities-historial-person");
  const activitiesHistorialSummary = document.querySelector("#activities-historial-summary");
  const activitiesHistorialTableBody = document.querySelector("#activities-historial-table-body");
  const activitiesHistorialNewButton = document.querySelector("#activities-historial-new-button");
  const activitiesHistorialRefreshButton = document.querySelector(
    "#activities-historial-refresh-button"
  );
  const activitiesBulkFieldSelect = document.querySelector("#activities-bulk-field");
  const activitiesBulkCurrentValueInput = document.querySelector("#activities-bulk-current-value");
  const activitiesBulkNewValueInput = document.querySelector("#activities-bulk-new-value");
  const activitiesBulkCurrentSelect = document.querySelector("#activities-bulk-current-select");
  const activitiesBulkNewSelect = document.querySelector("#activities-bulk-new-select");
  const activitiesBulkApplyButton = document.querySelector("#activities-bulk-apply-button");
  const activitiesBulkSelectButton = document.querySelector("#activities-bulk-select-button");
  const activitiesBulkMatchCount = document.querySelector("#activities-bulk-match-count");
  const activitiesSelectRecordsButton = document.querySelector("#activities-select-records-button");
  const activitiesRecordsSelectHeader = document.querySelector(
    "#activities-records-select-header"
  );
  const activitiesRecordsSelectAllCheckbox = document.querySelector(
    "#activities-records-select-all-checkbox"
  );
  const activitiesCancelRecordsSelectionButton = document.querySelector(
    "#activities-cancel-records-selection-button"
  );
  const activitiesGenerateRecordsDialogButton = document.querySelector(
    "#activities-generate-records-dialog-button"
  );
  const activitiesRecordsSelectionCount = document.querySelector("#activities-records-selection-count");
  const activitiesRecordsGenerationPanel = document.querySelector("#activities-records-generation-panel");
  const activitiesRecordsGenerationBackdrop = document.querySelector(
    "#activities-records-generation-backdrop"
  );
  const activitiesRecordsGenerationForm = document.querySelector("#activities-records-generation-form");
  const activitiesRecordsGenerationSummary = document.querySelector(
    "#activities-records-generation-summary"
  );
  const activitiesRecordsDateFrom = document.querySelector("#activities-records-date-from");
  const activitiesRecordsDateTo = document.querySelector("#activities-records-date-to");
  const closeActivitiesRecordsGenerationButton = document.querySelector(
    "#close-activities-records-generation-button"
  );
  const cancelActivitiesRecordsGenerationButton = document.querySelector(
    "#cancel-activities-records-generation-button"
  );
  const activityEditPanel = document.querySelector("#activity-edit-panel");
  const activityEditPanelBackdrop = document.querySelector("#activity-edit-panel-backdrop");
  const activityEditTitle = document.querySelector("#activity-edit-title");
  const activityEditForm = document.querySelector("#activity-edit-form");
  const editActivityId = document.querySelector("#edit-activity-id");
  const editActivityPersonal = document.querySelector("#edit-activity-personal");
  const editActivityContrato = document.querySelector("#edit-activity-contrato");
  const editActivityServicio = document.querySelector("#edit-activity-servicio");
  const editActivityEmpresa = document.querySelector("#edit-activity-empresa");
  const editActivityInstalacion = document.querySelector("#edit-activity-instalacion");
  const editActivityPuesto = document.querySelector("#edit-activity-puesto");
  const editActivityFuncion = document.querySelector("#edit-activity-funcion");
  const editActivityModalidad = document.querySelector("#edit-activity-modalidad");
  const editActivitySituacion = document.querySelector("#edit-activity-situacion");
  const editActivityTipoHora = document.querySelector("#edit-activity-tipo-hora");
  const cancelActivityEditButton = document.querySelector("#cancel-activity-edit-button");
  const generateActivityRecordsButton = document.querySelector("#generate-activity-records-button");
  const viewActivityRecordsButton = document.querySelector("#view-activity-records-button");
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
  const conciliaSubtabs = Array.from(document.querySelectorAll(".concilia-subtabs"));

  function renderIcon(name) {
    return `<svg class="button-icon" aria-hidden="true"><use href="./icons.svg#icon-${name}"></use></svg>`;
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
  let activityServiceRows = [];
  let activityContractNocturnidad = new Map();
  let activityContractPersonalRows = [];
  let activityContractInstallationRows = [];
  let activityUsesContractAssignments = false;
  let activitiesRows = [];
  let filteredActivitiesRows = [];
  let activityPersonalFilterOptions = [];
  let activityPersonalFilterDebounceTimer = null;
  // Panel de historial laboral: persona actualmente resuelta por los filtros y
  // sus periodos ya cargados. Token para descartar respuestas fuera de orden.
  let activitiesHistorialPersonalId = null;
  let activitiesHistorialRows = [];
  let activitiesHistorialRequestToken = 0;
  let activitiesHistorialChangeBound = false;
  let activitiesBulkCurrentFilterActive = false;
  let activitiesRecordsSelectionMode = false;
  let selectedActivityRecordGeneratorIds = new Set();
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
    { field: "asistencia_miercoles", label: "miercoles", shortLabel: "X" },
    { field: "asistencia_jueves", label: "jueves", shortLabel: "J" },
    { field: "asistencia_viernes", label: "viernes", shortLabel: "V" },
  ];
  const AVAILABILITY_WEEKS = SUMMARY_WEEKS.map((week) => `semana_${week}`);
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
  const ACTIVITY_BULK_UNSET_VALUE = "__activity_bulk_unset__";
  const ACTIVITY_BULK_EMPTY_VALUE = "__activity_bulk_empty__";
  const ACTIVITY_FILTER_EMPTY_VALUE = "__activity_filter_empty__";
  const STUDENTS_BULK_ANY_VALUE = "__students_bulk_any__";
  const STUDENTS_BULK_UNSET_VALUE = "__students_bulk_unset__";
  const STUDENTS_BULK_FIELDS = {
    centro: { column: "centro", optionKey: "centros", emptyLabel: "Sin centro" },
    semana: { column: "semana", optionKey: "semanas", emptyLabel: "Sin semana" },
    grupo: { column: "grupo", optionKey: "grupos", emptyLabel: "Sin grupo" },
  };
  const ACTIVITY_BULK_FIELDS = {
    fecha_inicio: { label: "Fecha inicio", type: "date" },
    fecha_fin: { label: "Fecha fin", type: "date" },
    hora_inicio: { label: "Hora inicio", type: "time" },
    hora_fin: { label: "Hora fin", type: "time" },
    contrato_id: { label: "Contrato", type: "select", source: "contrato" },
    servicio_id: { label: "Servicio", type: "select", source: "servicio", nullable: true },
    personal_id: { label: "Personal", type: "select", source: "personal" },
    empresa_id: { label: "Empresa", type: "select", source: "empresa" },
    instalacion_id: { label: "Instalación", type: "select", source: "instalacion" },
    puesto_id: { label: "Puesto", type: "select", source: "puesto" },
    funcion_id: { label: "Funcion", type: "select", source: "funcion", nullable: true },
    modalidad_id: { label: "Modalidad", type: "select", source: "modalidad", nullable: true },
    situacion_id: { label: "Situación", type: "select", source: "situacion" },
    tipo_hora_id: { label: "Tipo de hora", type: "select", source: "tipo_hora" },
    llamamiento_enviado: { label: "Llamamiento enviado", type: "boolean" },
    respuesta_llamamiento: { label: "Respuesta llamamiento", type: "select", source: "respuesta", nullable: true },
    observaciones: { label: "Observaciones", type: "text" },
  };

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
    return INITIAL_MODULE_TAB;
  }

  async function loadModuleTabData(target) {
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
    const normalizedTarget = MODULE_TAB_TARGETS.has(target) ? target : "alumnado";
    conciliaSubtabs.forEach((tabs) => {
      tabs.classList.toggle("hidden", normalizedTarget === "actividades");
    });

    moduleTabButtons.forEach((button) => {
      const isActive = button.dataset.moduleTab === normalizedTarget;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    modulePanels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.modulePanel !== normalizedTarget);
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

    if (studentsTableHead) {
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
      updateSortButtons();
    }

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
    const currentValue = select.value;
    const options = [`<option value="">${escapeHtml(emptyLabel)}</option>`].concat(
      values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    );
    select.innerHTML = options.join("");
    select.value = values.includes(currentValue) ? currentValue : "";
  }

  function sortAgeValues(first, second) {
    const firstNumber = Number.parseInt(first, 10);
    const secondNumber = Number.parseInt(second, 10);

    if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
      return firstNumber - secondNumber;
    }

    return String(first).localeCompare(String(second), "es", {
      numeric: true,
      sensitivity: "base",
    });
  }

  function renderMultiSelectOptions(select, values, emptyLabel) {
    if (!select) {
      return;
    }

    const currentValues = new Set(getSelectValues(select));
    select.innerHTML = values
      .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
      .join("");
    Array.from(select.options).forEach((option) => {
      option.selected = currentValues.has(option.value);
    });
    syncMultiCheckDropdown(select, emptyLabel);
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
    const selectedLabel = select.dataset.multiCheckSelectedLabel || "opciones seleccionadas";
    const label =
      selectedCount === 0
        ? emptyLabel
        : selectedCount === 1
          ? selectedOptions[0].textContent
          : `${selectedCount} ${selectedLabel}`;

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
    const hasEmptyRows = rows.some(
      (row) => row[valueField] === null || row[valueField] === undefined || row[valueField] === ""
    );
    const optionRows = rows
      .filter((row) => row[valueField] !== null && row[valueField] !== undefined && row[valueField] !== "")
      .map((row) => {
      const value = row[valueField];
      const label = row[labelField] || `ID ${value}`;
      return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
    });
    if (hasEmptyRows) {
      optionRows.unshift(`<option value="${ACTIVITY_FILTER_EMPTY_VALUE}">Vacío</option>`);
    }
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
    select.value =
      (currentValue === ACTIVITY_FILTER_EMPTY_VALUE && hasEmptyRows) ||
      rows.some((row) => String(row[valueField]) === currentValue)
        ? currentValue
        : "";
    return select.value !== currentValue;
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

    // Si el contrato no tiene personal asignado en contrato_personal (roster
    // vacio), no se bloquea la creacion: se ofrece toda la plantilla.
    if (!rows.length) {
      return activityPersonalRows;
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

    // Si el contrato no tiene instalaciones asignadas (roster vacio), no se
    // bloquea: se ofrecen todas las instalaciones.
    if (!rows.length) {
      return activityInstallationRows;
    }

    return rows;
  }

  function renderActivityPersonalSelect(select, contratoId, selectedValue = "") {
    if (!select) {
      return;
    }
    const desired = String(selectedValue || select.value || "");
    const rosterRows = getActivityPersonalRowsForContract(contratoId, desired);
    const rosterIds = new Set(rosterRows.map((row) => Number(row.id)));
    const otherRows = activityPersonalRows.filter((row) => !rosterIds.has(Number(row.id)));

    const buildOptions = (rows) =>
      rows
        .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.personal || `ID ${row.id}`)}</option>`)
        .join("");

    const parts = ['<option value="">Seleccionar personal</option>'];
    if (Number(contratoId) && rosterRows.length && otherRows.length) {
      // Personal del contrato primero; el resto de la plantilla queda disponible
      // para poder asignar a personas nuevas todavia no incluidas en el contrato.
      parts.push(`<optgroup label="Asignados al contrato">${buildOptions(rosterRows)}</optgroup>`);
      parts.push(`<optgroup label="Resto del personal">${buildOptions(otherRows)}</optgroup>`);
    } else {
      parts.push(buildOptions(activityPersonalRows));
    }

    select.innerHTML = parts.join("");
    select.value = Array.from(select.options).some((option) => option.value === desired) ? desired : "";
  }

  function renderActivityInstallationSelect(select, contratoId, selectedValue = "") {
    if (!select) {
      return;
    }
    const desired = String(selectedValue || select.value || "");
    const rosterRows = getActivityInstallationRowsForContract(contratoId, desired);
    const rosterIds = new Set(rosterRows.map((row) => Number(row.id)));
    const otherRows = activityInstallationRows.filter((row) => !rosterIds.has(Number(row.id)));

    const buildOptions = (rows) =>
      rows
        .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.instalacion || `ID ${row.id}`)}</option>`)
        .join("");

    const parts = ['<option value="">Seleccionar instalacion</option>'];
    if (Number(contratoId) && rosterRows.length && otherRows.length) {
      // Instalaciones del contrato primero; el resto queda disponible para poder
      // asignar instalaciones todavia no incluidas en el contrato.
      parts.push(`<optgroup label="Asignadas al contrato">${buildOptions(rosterRows)}</optgroup>`);
      parts.push(`<optgroup label="Resto de instalaciones">${buildOptions(otherRows)}</optgroup>`);
    } else {
      parts.push(buildOptions(activityInstallationRows));
    }

    select.innerHTML = parts.join("");
    select.value = Array.from(select.options).some((option) => option.value === desired) ? desired : "";
  }

  function renderActivityContractScopedOptions(form, selectedPersonalId = "", selectedInstallationId = "") {
    const contractSelect = form === activityEditForm ? editActivityContrato : activityContrato;
    const personalSelect = form === activityEditForm ? editActivityPersonal : activityPersonal;
    const installationSelect = form === activityEditForm ? editActivityInstalacion : activityInstalacion;
    const contratoId = contractSelect?.value || "";

    renderActivityPersonalSelect(personalSelect, contratoId, selectedPersonalId || personalSelect?.value);
    renderActivityInstallationSelect(installationSelect, contratoId, selectedInstallationId || installationSelect?.value);
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

  function getActivityFilterValues() {
    return {
      contrato: getSelectValues(filterActivityContrato),
      servicio: String(filterActivityServicio.value || ""),
      puesto: String(filterActivityPuesto.value || ""),
      personal: filterActivityPersonal.value.trim(),
      instalacion: String(filterActivityInstalacion.value || ""),
    };
  }

  function updateActivityPersonalFilterOptions() {
    const filters = getActivityFilterValues();
    activityPersonalFilterOptions = Array.from(
      new Set(
        activitiesRows
          .filter((activity) => activityMatchesFilterValues(activity, filters, "personal"))
          .map((activity) => String(activity.personal ?? "").trim())
          .filter(Boolean)
      )
    ).sort((left, right) =>
      left.localeCompare(right, "es", { sensitivity: "base", numeric: true })
    );
  }

  // La ✕ de cada filtro de Actividades aparece solo cuando su control tiene valor.
  function syncActivitiesResetButtons() {
    if (!activitiesFiltersForm) {
      return;
    }
    activitiesFiltersForm.querySelectorAll(".filter-reset-button").forEach((button) => {
      const row = button.closest(".filter-control-row");
      const control = row?.querySelector("input, select, textarea");
      const hasValue =
        control?.type === "checkbox"
          ? control.checked
          : Boolean(String(control?.value ?? "").trim());
      button.classList.toggle("is-empty", !hasValue);
    });
  }

  // La ✕ del buscador de personal aparece solo cuando hay texto.
  function updateActivityPersonalClear() {
    if (!filterActivityPersonalClear || !filterActivityPersonal) {
      return;
    }
    filterActivityPersonalClear.classList.toggle("hidden", !filterActivityPersonal.value.trim());
  }

  function renderActivityPersonalSuggestions() {
    if (!filterActivityPersonalSuggestions) {
      return;
    }

    const query = normalizeText(filterActivityPersonal.value);
    const suggestions = activityPersonalFilterOptions
      .filter((value) => !query || normalizeText(value).includes(query))
      .sort((left, right) =>
        left.localeCompare(right, "es", { sensitivity: "base", numeric: true })
      );

    if (!suggestions.length || (!query && filterActivityPersonal !== document.activeElement)) {
      filterActivityPersonalSuggestions.classList.add("hidden");
      filterActivityPersonalSuggestions.innerHTML = "";
      return;
    }

    filterActivityPersonalSuggestions.innerHTML = suggestions
      .map(
        (value) => `
          <button
            type="button"
            class="filter-suggestion-option"
            data-activity-personal-option="${escapeHtml(value)}"
          >
            ${escapeHtml(value)}
          </button>
        `
      )
      .join("");
    filterActivityPersonalSuggestions.classList.remove("hidden");
  }

  function debouncedApplyActivityPersonalFilter() {
    window.clearTimeout(activityPersonalFilterDebounceTimer);
    activityPersonalFilterDebounceTimer = window.setTimeout(() => {
      applyActivitiesFilters();
    }, 300);
  }

  function activityMatchesFilterValues(activity, filters, excludedFilter = "") {
    const matchesNullable = (value, filterValue) =>
      filterValue === ACTIVITY_FILTER_EMPTY_VALUE
        ? value === null || value === undefined || value === ""
        : String(value) === filterValue;
    const matchesContrato =
      excludedFilter === "contrato" ||
      !filters.contrato.length ||
      filters.contrato.some((value) => matchesNullable(activity.contrato_id, value));
    const matchesServicio =
      excludedFilter === "servicio" ||
      !filters.servicio ||
      matchesNullable(activity.servicio_id, filters.servicio);
    const matchesPuesto =
      excludedFilter === "puesto" ||
      !filters.puesto ||
      matchesNullable(activity.puesto_id, filters.puesto);
    const matchesPersonal =
      excludedFilter === "personal" ||
      !filters.personal ||
      normalizeText(activity.personal).includes(normalizeText(filters.personal));
    const matchesInstalacion =
      excludedFilter === "instalacion" ||
      !filters.instalacion ||
      matchesNullable(activity.instalacion_id, filters.instalacion);

    return matchesContrato && matchesServicio && matchesPuesto && matchesPersonal && matchesInstalacion;
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
    const servicioChanged = renderCatalogOptions(
      filterActivityServicio,
      getUniqueActivityFilterRows(
        getActivityRowsForFilterOptions("servicio"),
        "servicio_id",
        "servicio"
      ),
      "id",
      "label",
      "Todos los servicios"
    );
    const puestoChanged = renderCatalogOptions(
      filterActivityPuesto,
      getUniqueActivityFilterRows(
        getActivityRowsForFilterOptions("puesto"),
        "puesto_id",
        "puesto"
      ),
      "id",
      "label",
      "Todos los puestos"
    );
    const previousPersonalOptions = activityPersonalFilterOptions.join("|");
    updateActivityPersonalFilterOptions();
    const personalChanged = previousPersonalOptions !== activityPersonalFilterOptions.join("|");
    if (personalChanged) {
      renderActivityPersonalSuggestions();
    }
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

    return contratoChanged || servicioChanged || puestoChanged || personalChanged || instalacionChanged;
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

  function renderActivityAssignmentState(isCurrent, state) {
    if (isCurrent || state === "actual") {
      return "";
    }

    const label = state === "finalizada" ? "Asignacion finalizada" : "Sin asignacion actual";
    return `<br /><span class="muted-text">${escapeHtml(label)}</span>`;
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

  function renderAttendanceRows(rows) {
    if (!rows.length) {
      attendanceTotalCount = 0;
      attendanceSummary.textContent = "No hay alumnado para esos filtros.";
      attendanceTableBody.innerHTML =
        '<tr><td colspan="7" class="empty-state">No hay alumnado para mostrar.</td></tr>';
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
    updateAttendancePagination();
  }

  async function updateStudentAttendance(id, field, isPresent) {
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

      await loadAttendanceMatrix(supabase);
      setStatus(isPresent ? "Asistencia marcada." : "Asistencia retirada.", "success");
      return true;
    } catch (error) {
      setStatus(`No se pudo actualizar asistencia: ${error.message}`, "error");
      return false;
    }
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
        servicioRows,
        contractPersonalRows,
        contractInstallationRows,
      ] = await Promise.all([
        fetchCatalog(supabase, "personal", "id,personal", "personal", [
          { column: "vinculacion_id", operator: "in", value: [1, 2] },
        ]),
        fetchCatalog(
          supabase,
          "contratos",
          "id,contrato,tiene_nocturnidad,nocturnidad_inicio,nocturnidad_fin",
          "contrato",
          [{ column: "activo", value: true }]
        ),
        fetchCatalog(supabase, "empresas", "id,empresa", "empresa"),
        fetchCatalog(supabase, "instalaciones", "id,instalacion", "instalacion", [
          { column: "activo", value: true },
        ]),
        fetchCatalog(supabase, "puestos", "id,puesto", "puesto", [
          { column: "activo", value: true },
        ]),
        fetchCatalog(supabase, "funciones", "id,funcion", "funcion", [
          { column: "activo", value: true },
        ]),
        fetchCatalog(supabase, "modalidades", "id,modalidad", "modalidad", [
          { column: "activo", value: true },
        ]),
        fetchCatalog(supabase, "situaciones", "id,situacion", "situacion"),
        fetchCatalog(supabase, "tipo_horas", "id,tipo_hora", "tipo_hora"),
        fetchCatalog(supabase, "servicios", "id,contrato_id,servicio", "servicio", [
          { column: "activo", value: true },
        ]),
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
      activityServiceRows = servicioRows;

      activityContractNocturnidad = new Map(
        (contratoRows ?? []).map((row) => [
          Number(row.id),
          {
            tiene: Boolean(row.tiene_nocturnidad),
            inicio: row.nocturnidad_inicio,
            fin: row.nocturnidad_fin,
          },
        ])
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
      renderActivityServiceOptions(activityServicio, activityContrato.value);
      renderActivityServiceOptions(editActivityServicio, editActivityContrato.value);
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

  function renderActivityServiceOptions(select, contratoId, selectedServicioId = select?.value || "") {
    if (!select) {
      return;
    }

    const normalizedContratoId = Number(contratoId);
    const services = activityServiceRows.filter(
      (service) => Number(service.contrato_id) === normalizedContratoId
    );
    select.innerHTML = [
      '<option value="">Seleccionar servicio</option>',
      ...services.map(
        (service) => `<option value="${escapeHtml(service.id)}">${escapeHtml(service.servicio)}</option>`
      ),
    ].join("");
    const selectedValue = String(selectedServicioId || "");
    select.value = services.some((service) => String(service.id) === selectedValue) ? selectedValue : "";
    select.disabled = !normalizedContratoId || !services.length;
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

    if (!formData.get("servicio_id")) {
      setStatus("Selecciona un servicio para la actividad.", "error");
      return null;
    }

    if (!isEndAfterStart(fechaInicio, fechaFin, horaInicio, horaFin)) {
      setStatus("La fecha y hora de fin deben ser posteriores al inicio.", "error");
      return null;
    }

    return {
      personal_id: Number(formData.get("personal_id")),
      contrato_id: Number(formData.get("contrato_id")),
      servicio_id: formData.get("servicio_id") ? Number(formData.get("servicio_id")) : null,
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
          "id,personal_id,personal,contrato_id,contrato,servicio_id,servicio,empresa_id,empresa,instalacion_id,instalacion,puesto_id,puesto,funcion_id,funcion,modalidad_id,modalidad,situacion_id,situacion,tipo_hora_id,tipo_hora,dias_semana,fecha_inicio,fecha_fin,hora_inicio,hora_fin,llamamiento_enviado,respuesta_llamamiento,observaciones,personal_asignado_actualmente,personal_asignacion_estado,instalacion_asignada_actualmente,instalacion_asignacion_estado,updated_at"
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
          .from("personal_completo")
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
    const visibleColumnCount = activitiesRecordsSelectionMode ? 8 : 7;
    activitiesRecordsSelectHeader?.classList.toggle("hidden", !activitiesRecordsSelectionMode);

    if (!filteredActivitiesRows.length) {
      activitiesTableBody.innerHTML =
        `<tr><td colspan="${visibleColumnCount}" class="empty-state">No hay actividades con esos filtros.</td></tr>`;
      syncActivitiesRecordsSelectionUi();
      return;
    }

    activitiesTableBody.innerHTML = filteredActivitiesRows
      .map(
        (activity) => `
          <tr>
            ${
              activitiesRecordsSelectionMode
                ? `<td class="control-select-cell">
                    <input
                      type="checkbox"
                      data-select-activity-record-generator="${escapeHtml(activity.id)}"
                      ${selectedActivityRecordGeneratorIds.has(String(activity.id)) ? "checked" : ""}
                      aria-label="Seleccionar actividad para generar registros"
                    />
                  </td>`
                : ""
            }
            <td>${escapeHtml(activity.personal)}${renderActivityAssignmentState(
              activity.personal_asignado_actualmente,
              activity.personal_asignacion_estado
            )}</td>
            <td>${escapeHtml(activity.instalacion)}${renderActivityAssignmentState(
              activity.instalacion_asignada_actualmente,
              activity.instalacion_asignacion_estado
            )}</td>
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
    syncActivitiesRecordsSelectionUi();
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

    if (field === "funcion") {
      return [activity.funcion || ""];
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
    let nextFilteredActivitiesRows = activitiesRows.filter((activity) => {
      return activityMatchesFilterValues(activity, filters);
    });

    if (hasActivityBulkCurrentFilter()) {
      const field = activitiesBulkFieldSelect?.value;
      const config = getActivitiesBulkFieldConfig();
      const currentValue = normalizeActivityBulkValue(getActivityBulkControlValue("current"), config);
      nextFilteredActivitiesRows = nextFilteredActivitiesRows.filter((activity) => {
        const activityValue = normalizeActivityBulkValue(activity[field], config);
        return activityValue === currentValue;
      });
    }

    filteredActivitiesRows = nextFilteredActivitiesRows;
    filteredActivitiesRows.sort(compareActivityRows);
    if (activitiesRecordsSelectionMode) {
      const visibleIds = new Set(filteredActivitiesRows.map((activity) => String(activity.id)));
      selectedActivityRecordGeneratorIds = new Set(
        [...selectedActivityRecordGeneratorIds].filter((id) => visibleIds.has(id))
      );
    }
    updateActivitiesSortButtons();
    renderActivitiesTable();
    syncActivitiesBulkAssignmentUi();

    if (!activitiesReportPanel.classList.contains("hidden")) {
      renderActivitiesReport();
    }

    if (!activitiesScheduleReportPanel?.classList.contains("hidden")) {
      renderActivitiesScheduleReportPreview();
    }

    void syncActivitiesHistorialPanel();
  }

  // --- Historial laboral de la persona filtrada ---
  // app.js se carga despues que este fichero, asi que la suscripcion al puente se
  // hace de forma perezosa en el primer sincronizado en vez de al iniciar.
  function ensureActivitiesHistorialChangeBinding() {
    if (activitiesHistorialChangeBound) {
      return;
    }
    const api = window.CoordinacionHistorial;
    if (!api?.onChange) {
      return;
    }
    // Alta, edicion o borrado desde el panel lateral: recargamos nuestra copia.
    api.onChange(() => loadActivitiesHistorial());
    activitiesHistorialChangeBound = true;
  }


  // El filtro de personal es por nombre, asi que la persona se deduce del
  // resultado: solo hay panel si todas las actividades filtradas son de la misma.
  function getActivitiesSinglePersonal() {
    if (!filteredActivitiesRows.length) {
      return null;
    }
    let personalId = null;
    let personal = "";
    for (const activity of filteredActivitiesRows) {
      const id = Number(activity.personal_id);
      if (!id) {
        return null;
      }
      if (personalId === null) {
        personalId = id;
        personal = String(activity.personal ?? "").trim();
      } else if (personalId !== id) {
        return null;
      }
    }
    return personalId ? { personalId, personal } : null;
  }

  function renderActivitiesHistorialTable() {
    if (!activitiesHistorialTableBody) {
      return;
    }

    if (!activitiesHistorialRows.length) {
      activitiesHistorialTableBody.innerHTML =
        '<tr><td colspan="9" class="empty-state">Esta persona no tiene periodos de historial laboral.</td></tr>';
      return;
    }

    activitiesHistorialTableBody.innerHTML = activitiesHistorialRows
      .map((row) => {
        const jornada = [row.jornada, row.jornada_maxima]
          .filter((value) => value !== null && value !== undefined && value !== "")
          .join(" / ");
        const cells = [
          row.tipo_contratacion || "",
          formatDate(row.fecha_alta),
          row.fecha_baja ? formatDate(row.fecha_baja) : "",
          row.dias_periodo ?? "",
          jornada,
          row.puesto || row.puesto_texto || "",
          row.contrato_laboral_clave || "",
          row.activo ? "Si" : "",
        ]
          .map((value) => `<td>${escapeHtml(String(value ?? ""))}</td>`)
          .join("");
        const action = `<td class="records-row-actions"><button type="button" class="compact-button" data-activities-historial-edit="${escapeHtml(
          row.id
        )}" title="Editar periodo" aria-label="Editar periodo">&#9998;</button></td>`;
        return `<tr data-activities-historial-id="${escapeHtml(row.id)}">${cells}${action}</tr>`;
      })
      .join("");
  }

  function setActivitiesHistorialMessage(message) {
    if (activitiesHistorialTableBody) {
      activitiesHistorialTableBody.innerHTML = `<tr><td colspan="9" class="empty-state">${escapeHtml(
        message
      )}</td></tr>`;
    }
  }

  async function syncActivitiesHistorialPanel() {
    if (!activitiesHistorialZone) {
      return;
    }

    const selection = window.CoordinacionHistorial?.canAccess?.()
      ? getActivitiesSinglePersonal()
      : null;
    if (!selection) {
      activitiesHistorialZone.classList.add("hidden");
      activitiesHistorialZone.open = false;
      activitiesHistorialPersonalId = null;
      activitiesHistorialRows = [];
      return;
    }

    ensureActivitiesHistorialChangeBinding();
    const alreadyLoaded = activitiesHistorialPersonalId === selection.personalId;
    activitiesHistorialPersonalId = selection.personalId;
    activitiesHistorialZone.classList.remove("hidden");
    if (activitiesHistorialPerson) {
      activitiesHistorialPerson.textContent = selection.personal
        ? `· ${selection.personal}`
        : `· ID ${selection.personalId}`;
    }
    if (alreadyLoaded) {
      return;
    }
    await loadActivitiesHistorial();
  }

  async function loadActivitiesHistorial() {
    const personalId = activitiesHistorialPersonalId;
    const api = window.CoordinacionHistorial;
    if (!personalId || !api?.listForPersonal) {
      return;
    }

    const token = (activitiesHistorialRequestToken += 1);
    if (activitiesHistorialSummary) {
      activitiesHistorialSummary.textContent = "Cargando...";
    }
    setActivitiesHistorialMessage("Cargando historial laboral...");

    try {
      const rows = await api.listForPersonal(personalId);
      if (token !== activitiesHistorialRequestToken || personalId !== activitiesHistorialPersonalId) {
        return;
      }
      activitiesHistorialRows = rows;
      if (activitiesHistorialSummary) {
        activitiesHistorialSummary.textContent = `${rows.length} periodos`;
      }
      renderActivitiesHistorialTable();
    } catch (error) {
      if (token !== activitiesHistorialRequestToken) {
        return;
      }
      activitiesHistorialRows = [];
      if (activitiesHistorialSummary) {
        activitiesHistorialSummary.textContent = "";
      }
      setActivitiesHistorialMessage("No se pudo cargar el historial laboral.");
      setStatus(`No se pudo cargar el historial laboral: ${error.message}`, "error");
    }
  }

  function openActivitiesHistorialDetail(historialId) {
    const api = window.CoordinacionHistorial;
    if (!api?.openDetail) {
      return;
    }
    // El panel lateral busca la fila en su propio listado; le pasamos las nuestras
    // porque la pestana Historial laboral puede estar sin cargar o filtrada.
    api.registerRows(activitiesHistorialRows);
    void api.openDetail(historialId);
  }

  function openActivitiesHistorialNew() {
    const api = window.CoordinacionHistorial;
    if (!api?.openNew || !activitiesHistorialPersonalId) {
      return;
    }
    api.registerRows(activitiesHistorialRows);
    void api.openNew({ personal_id: activitiesHistorialPersonalId });
  }

  function setupActivitiesHistorialPanel() {
    activitiesHistorialNewButton?.addEventListener("click", openActivitiesHistorialNew);
    activitiesHistorialRefreshButton?.addEventListener("click", () => {
      void loadActivitiesHistorial();
    });
    activitiesHistorialTableBody?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-activities-historial-edit]");
      if (button) {
        openActivitiesHistorialDetail(button.dataset.activitiesHistorialEdit);
        return;
      }
      const row = event.target.closest("[data-activities-historial-id]");
      if (row) {
        openActivitiesHistorialDetail(row.dataset.activitiesHistorialId);
      }
    });
  }

  function getActivitiesBulkFieldConfig() {
    return ACTIVITY_BULK_FIELDS[activitiesBulkFieldSelect?.value] || ACTIVITY_BULK_FIELDS.fecha_inicio;
  }

  function getActivityBulkContractLabel(contractId) {
    const option = Array.from(activityContrato?.options || []).find(
      (item) => String(item.value) === String(contractId)
    );
    return option?.textContent?.trim() || `Contrato ${contractId}`;
  }

  function getActivityBulkSelectOptions(source, options = {}) {
    if (source === "personal") {
      return activityAllPersonalRows.map((row) => ({ value: row.id, label: row.personal }));
    }

    if (source === "contrato") {
      return Array.from(activityContrato?.options || [])
        .filter((option) => option.value)
        .map((option) => ({ value: option.value, label: option.textContent }));
    }

    if (source === "servicio") {
      return activityServiceRows
        .map((service) => ({
          value: service.id,
          label: `${service.servicio} · ${getActivityBulkContractLabel(service.contrato_id)}`,
        }));
    }

    if (source === "instalacion") {
      return activityAllInstallationRows.map((row) => ({ value: row.id, label: row.instalacion }));
    }

    if (source === "empresa") {
      return Array.from(activityEmpresa?.options || [])
        .filter((option) => option.value)
        .map((option) => ({ value: option.value, label: option.textContent }));
    }

    if (source === "puesto") {
      return Array.from(activityPuesto?.options || [])
        .filter((option) => option.value)
        .map((option) => ({ value: option.value, label: option.textContent }));
    }

    if (source === "funcion") {
      return Array.from(activityFuncion?.options || [])
        .filter((option) => option.value)
        .map((option) => ({ value: option.value, label: option.textContent }));
    }

    if (source === "modalidad") {
      return Array.from(activityModalidad?.options || [])
        .filter((option) => option.value)
        .map((option) => ({ value: option.value, label: option.textContent }));
    }

    if (source === "situacion") {
      return Array.from(activitySituacion?.options || [])
        .filter((option) => option.value)
        .map((option) => ({ value: option.value, label: option.textContent }));
    }

    if (source === "tipo_hora") {
      return Array.from(activityTipoHora?.options || [])
        .filter((option) => option.value)
        .map((option) => ({ value: option.value, label: option.textContent }));
    }

    if (source === "respuesta") {
      return [
        { value: "", label: "Pendiente" },
        { value: "aceptado", label: "Aceptado" },
        { value: "rechazado", label: "Rechazado" },
      ];
    }

    return [];
  }

  function renderActivitiesBulkSelectOptions(
    select,
    config,
    selectedValue = select?.value || "",
    includeUnsetOption = false,
    options = {}
  ) {
    if (!select || config.type !== "select") {
      return;
    }

    const selectOptions = getActivityBulkSelectOptions(config.source, options);
    // "Vacío" como nuevo valor solo tiene sentido en campos que admiten NULL;
    // en el filtro de valor actual se conserva para poder buscar filas vacías.
    const includeEmptyOption =
      includeUnsetOption && (options.kind !== "new" || config.nullable === true);
    const renderedOptions = includeUnsetOption
      ? [
          { value: ACTIVITY_BULK_UNSET_VALUE, label: "Selecciona valor" },
          ...(includeEmptyOption ? [{ value: ACTIVITY_BULK_EMPTY_VALUE, label: "Vacío" }] : []),
          ...selectOptions,
        ]
      : selectOptions;
    select.innerHTML = renderedOptions
      .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
      .join("");
    const selected = String(selectedValue ?? "");
    select.value = renderedOptions.some((option) => String(option.value) === selected)
      ? selected
      : renderedOptions[0]?.value || "";
  }

  function getActivityBulkControlValue(kind = "current") {
    const config = getActivitiesBulkFieldConfig();
    if (config.type === "select" || config.type === "boolean") {
      return kind === "new" ? activitiesBulkNewSelect?.value || "" : activitiesBulkCurrentSelect?.value || "";
    }

    return kind === "new" ? activitiesBulkNewValueInput?.value || "" : activitiesBulkCurrentValueInput?.value || "";
  }

  function resetActivitiesBulkCurrentFilter() {
    activitiesBulkCurrentFilterActive = false;

    if (activitiesBulkCurrentValueInput) {
      activitiesBulkCurrentValueInput.value = "";
    }

    if (activitiesBulkCurrentSelect) {
      activitiesBulkCurrentSelect.value = ACTIVITY_BULK_UNSET_VALUE;
    }
  }

  function hasActivityBulkCurrentFilter() {
    const config = getActivitiesBulkFieldConfig();
    if (config.type === "select" || config.type === "boolean") {
      return Boolean(
        activitiesBulkCurrentFilterActive &&
          activitiesBulkFieldSelect?.value &&
          activitiesBulkCurrentSelect?.value !== ACTIVITY_BULK_UNSET_VALUE
      );
    }

    return Boolean(activitiesBulkCurrentFilterActive && activitiesBulkFieldSelect?.value);
  }

  function normalizeActivityBulkValue(value, config = getActivitiesBulkFieldConfig()) {
    if (config.type === "boolean") {
      return String(value) === "true";
    }

    if (config.type === "select") {
      if (value === ACTIVITY_BULK_EMPTY_VALUE) {
        return ACTIVITY_BULK_EMPTY_VALUE;
      }

      if (config.source === "respuesta") {
        return String(value ?? "");
      }

      if (value === null || value === undefined || value === "") {
        return ACTIVITY_BULK_EMPTY_VALUE;
      }

      return Number(value);
    }

    if (config.type === "time") {
      return formatTime(value);
    }

    if (config.type === "date") {
      return String(value ?? "").slice(0, 10);
    }

    return String(value ?? "").trim();
  }

  function formatActivityBulkValue(value, config = getActivitiesBulkFieldConfig()) {
    if (config.type === "boolean") {
      return value ? "Sí" : "No";
    }

    if (config.type === "date") {
      return formatDate(value) || "vacío";
    }

    if (config.type === "time") {
      return formatTime(value) || "vacío";
    }

    if (config.type === "select") {
      if (value === ACTIVITY_BULK_EMPTY_VALUE) {
        return "vacio";
      }

      const option = getActivityBulkSelectOptions(config.source).find(
        (item) => String(item.value) === String(value)
      );
      return option?.label || "vacío";
    }

    return String(value ?? "").trim() || "vacío";
  }

  function getActivityServiceContractId(serviceId) {
    return Number(
      activityServiceRows.find((service) => String(service.id) === String(serviceId))?.contrato_id
    );
  }

  function getActivityBulkUpdatePayload(field, config, newValue) {
    const updateValue =
      newValue === ACTIVITY_BULK_EMPTY_VALUE ||
      ((config.type === "text" || config.source === "respuesta") && newValue === "")
        ? null
        : newValue;

    if (field === "contrato_id") {
      return { contrato_id: updateValue, servicio_id: null };
    }

    if (field === "servicio_id") {
      const serviceContractId = getActivityServiceContractId(updateValue);
      return updateValue === null
        ? { servicio_id: null }
        : { servicio_id: updateValue, contrato_id: serviceContractId };
    }

    return { [field]: updateValue };
  }

  function getActivityBulkMatchingRows() {
    const field = activitiesBulkFieldSelect?.value;
    if (!field || !ACTIVITY_BULK_FIELDS[field] || !hasActivityBulkCurrentFilter()) {
      return [];
    }

    return filteredActivitiesRows;
  }

  function getActivityBulkTargetRows() {
    if (!activitiesRecordsSelectionMode) {
      return getActivityBulkMatchingRows();
    }
    const selectedIds = new Set(getSelectedActivityRecordGeneratorIds());
    return filteredActivitiesRows.filter((activity) => selectedIds.has(String(activity.id)));
  }

  function syncActivitiesBulkAssignmentUi() {
    if (!activitiesBulkFieldSelect || !activitiesBulkCurrentValueInput || !activitiesBulkNewValueInput) {
      return;
    }

    const config = getActivitiesBulkFieldConfig();
    const usesSelect = config.type === "select" || config.type === "boolean";
    activitiesBulkCurrentValueInput.classList.toggle("hidden", usesSelect);
    activitiesBulkNewValueInput.classList.toggle("hidden", usesSelect);
    activitiesBulkCurrentSelect?.classList.toggle("hidden", !usesSelect);
    activitiesBulkNewSelect?.classList.toggle("hidden", !usesSelect);

    if (config.type === "boolean") {
      const booleanOptions = [
        { value: ACTIVITY_BULK_UNSET_VALUE, label: "Selecciona valor" },
        { value: "true", label: "Sí" },
        { value: "false", label: "No" },
      ];
      const currentSelected = activitiesBulkCurrentSelect?.value || ACTIVITY_BULK_UNSET_VALUE;
      const newSelected = activitiesBulkNewSelect?.value || "false";
      if (activitiesBulkCurrentSelect) {
        activitiesBulkCurrentSelect.innerHTML = booleanOptions
          .map((option) => `<option value="${option.value}">${option.label}</option>`)
          .join("");
        activitiesBulkCurrentSelect.value = booleanOptions.some((option) => option.value === currentSelected)
          ? currentSelected
          : ACTIVITY_BULK_UNSET_VALUE;
      }
      if (activitiesBulkNewSelect) {
        activitiesBulkNewSelect.innerHTML = booleanOptions
          .filter((option) => option.value !== ACTIVITY_BULK_UNSET_VALUE)
          .map((option) => `<option value="${option.value}">${option.label}</option>`)
          .join("");
        activitiesBulkNewSelect.value = ["true", "false"].includes(newSelected) ? newSelected : "false";
      }
    } else if (config.type === "select") {
      renderActivitiesBulkSelectOptions(
        activitiesBulkCurrentSelect,
        config,
        activitiesBulkCurrentSelect?.value || ACTIVITY_BULK_UNSET_VALUE,
        true,
        { kind: "current" }
      );
      renderActivitiesBulkSelectOptions(activitiesBulkNewSelect, config, undefined, true, {
        kind: "new",
      });
    } else {
      activitiesBulkCurrentValueInput.type = config.type;
      activitiesBulkNewValueInput.type = config.type;
    }

    const matches = getActivityBulkMatchingRows();
    if (activitiesBulkMatchCount) {
      activitiesBulkMatchCount.textContent = hasActivityBulkCurrentFilter()
        ? `${matches.length} coincidencia${matches.length === 1 ? "" : "s"}`
        : "Indica valor actual";
    }
    if (activitiesBulkApplyButton) {
      activitiesBulkApplyButton.disabled = activitiesRecordsSelectionMode
        ? getSelectedActivityRecordGeneratorIds().length === 0
        : matches.length === 0;
    }
  }

  async function applyActivitiesBulkAssignment() {
    const field = activitiesBulkFieldSelect?.value;
    const config = getActivitiesBulkFieldConfig();
    if (!field || !ACTIVITY_BULK_FIELDS[field]) {
      setStatus("Selecciona un campo valido.", "error");
      return;
    }

    if (!activityCatalogsLoaded) {
      await loadActivityCatalogs();
    }

    const matches = getActivityBulkTargetRows();
    if (!matches.length) {
      setStatus(
        activitiesRecordsSelectionMode
          ? "Selecciona al menos una actividad para aplicar la asignacion masiva."
          : "No hay actividades filtradas con ese valor actual.",
        "error"
      );
      return;
    }

    const currentValue = normalizeActivityBulkValue(getActivityBulkControlValue("current"), config);
    const rawNewValue = getActivityBulkControlValue("new");
    if ((config.type === "select" || config.type === "boolean") && rawNewValue === ACTIVITY_BULK_UNSET_VALUE) {
      setStatus("Selecciona un nuevo valor.", "error");
      return;
    }
    if (rawNewValue === ACTIVITY_BULK_EMPTY_VALUE && !config.nullable) {
      setStatus(`El campo ${config.label} es obligatorio y no admite un valor vacío.`, "error");
      return;
    }
    const newValue = normalizeActivityBulkValue(getActivityBulkControlValue("new"), config);
    const invalidSchedule = matches.some((activity) => {
      const next = { ...activity, [field]: newValue };
      return !isEndAfterStart(
        String(next.fecha_inicio || ""),
        String(next.fecha_fin || ""),
        formatTime(next.hora_inicio),
        formatTime(next.hora_fin)
      );
    });

    if (invalidSchedule) {
      setStatus("El cambio dejaria alguna actividad con fin anterior o igual al inicio.", "error");
      return;
    }

    if (field === "servicio_id") {
      const serviceContractId = getActivityServiceContractId(newValue);
      if (newValue !== ACTIVITY_BULK_EMPTY_VALUE && !Number.isFinite(serviceContractId)) {
        setStatus("Selecciona un servicio valido.", "error");
        return;
      }
    }

    const warning =
      field === "contrato_id"
        ? "\n\nAviso: al cambiar el contrato se dejará el servicio sin asignar en esas actividades. Después tendrás que asignar un servicio del nuevo contrato."
        : field === "servicio_id" && newValue !== ACTIVITY_BULK_EMPTY_VALUE
          ? "\n\nAviso: si el servicio pertenece a otro contrato, se actualizará también el contrato de esas actividades."
        : "";
    const confirmed = window.confirm(
      (activitiesRecordsSelectionMode
        ? `Vas a cambiar ${config.label} a ${formatActivityBulkValue(newValue, config)} en ${matches.length} actividad${matches.length === 1 ? "" : "es"} seleccionada${matches.length === 1 ? "" : "s"}.`
        : `Vas a cambiar ${config.label} de ${formatActivityBulkValue(currentValue, config)} a ${formatActivityBulkValue(newValue, config)} en ${matches.length} actividad${matches.length === 1 ? "" : "es"} filtrada${matches.length === 1 ? "" : "s"}.`) +
        warning
    );
    if (!confirmed) {
      return;
    }

    const updatePayload = getActivityBulkUpdatePayload(field, config, newValue);
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("actividades")
      .update(updatePayload)
      .in(
        "id",
        matches.map((activity) => Number(activity.id))
      );

    if (error) {
      setStatus(`No se pudo aplicar la asignacion masiva: ${error.message}`, "error");
      return;
    }

    resetActivitiesBulkCurrentFilter();
    await loadActivities();
    setStatus(
      field === "contrato_id"
        ? `Asignacion masiva aplicada a ${matches.length} actividad${matches.length === 1 ? "" : "es"}. El servicio se ha dejado sin asignar.`
        : `Asignacion masiva aplicada a ${matches.length} actividad${matches.length === 1 ? "" : "es"}.`,
      "success"
    );
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
          personalId: Number(activity.personal_id) || 0,
          person: String(activity.personal || "Sin personal"),
          dni: activity.dni || "",
          fechaNacimiento: activity.fecha_nacimiento || "",
          ss: activity.ss || "",
          cuentaCorriente: activity.cuenta_corriente || "",
          weeks: ACTIVITY_REPORT_WEEKS.map(() => ({ workedDays: new Set(), hours: 0 })),
        });
      }

      const personData = byPerson.get(personId);
      const dailyHours = getActivityDailyHours(activity);
      ACTIVITY_REPORT_WEEKS.forEach((week, weekIndex) => {
        const workedDays = getWorkedDaysInWeek(activity, week);
        workedDays.forEach((day) => personData.weeks[weekIndex].workedDays.add(day));
        personData.weeks[weekIndex].hours += workedDays.length * dailyHours;
      });
    });

    return Array.from(byPerson.values()).sort(
      (left, right) => Number(right.personalId) - Number(left.personalId)
    );
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

  function buildPersonReportExcelLines(row) {
    return [
      row.person,
      row.ss ? `SS: ${row.ss}` : "",
      row.dni ? `DNI: ${row.dni}` : "",
      row.fechaNacimiento ? `Fecha nac.: ${formatDate(row.fechaNacimiento)}` : "",
      row.cuentaCorriente ? `Cuenta: ${row.cuentaCorriente}` : "",
    ].filter(Boolean);
  }

  function renderExcelMultilineCell(lines) {
    return lines
      .map((line) => escapeHtml(String(line)))
      .join('<br style="mso-data-placement:same-cell;" />');
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
        personalId: personData.personalId,
        person: personData.person,
        dni: personData.dni,
        fechaNacimiento: personData.fechaNacimiento,
        ss: personData.ss,
        cuentaCorriente: personData.cuentaCorriente,
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
                ${
                  isPersonalReport
                    ? `<td class="report-personal-id">${escapeHtml(row.personalId || "")}</td>`
                    : ""
                }
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
            ${isPersonalReport ? '<td class="report-personal-id"></td>' : ""}
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
                    ${isPersonalReport ? "<th>ID</th>" : ""}
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
      const isPersonalReport = currentActivitiesReportMode === "personal";
      const personReportRowHeight = isPersonalReport ? 19 : rowHeight;
      const idWidth = isPersonalReport ? 10 : 0;
      const personWidth = isPersonalReport ? 48 : 58;
      const weekWidth =
        (pageWidth - margin * 2 - personWidth - idWidth) / ACTIVITY_REPORT_WEEKS.length;
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
        if (isPersonalReport) {
          doc.text("ID", margin, y);
        }
        doc.text("Personal", margin + idWidth, y);
        ACTIVITY_REPORT_WEEKS.forEach((week, index) => {
          doc.text(week.label, margin + idWidth + personWidth + weekWidth * index, y, {
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
          if (isPersonalReport) {
            doc.text(String(row.personalId || ""), margin, y, { maxWidth: idWidth - 1 });
          }
          doc.text(row.person, margin + idWidth, y, { maxWidth: personWidth - 2 });
          if (row.details) {
            doc.setFontSize(6);
            row.details.split("\n").forEach((detail, index) => {
              doc.text(detail, margin + idWidth, y + 3 + index * 3, { maxWidth: personWidth - 2 });
            });
            doc.setFontSize(7);
          }

          row.weeks.forEach((week, index) => {
            const x = margin + idWidth + personWidth + weekWidth * index;
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
        doc.text("Totales", margin + idWidth, y);
        group.totals.forEach((total, index) => {
          doc.text(
            `${total.complete} (${total.partial}) ${formatHours(total.hours)} h`,
            margin + idWidth + personWidth + weekWidth * index,
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

  function getActivityScheduleReportGroups() {
    const byPerson = new Map();

    filteredActivitiesRows.forEach((activity) => {
      const personId = String(activity.personal_id ?? activity.personal ?? "sin-personal");
      if (!byPerson.has(personId)) {
        byPerson.set(personId, {
          personalId: Number(activity.personal_id) || 0,
          person: String(activity.personal || "Sin personal"),
          dni: activity.dni || "",
          fechaNacimiento: activity.fecha_nacimiento || "",
          ss: activity.ss || "",
          rows: [],
        });
      }

      byPerson.get(personId).rows.push(activity);
    });

    return Array.from(byPerson.values())
      .map((group) => ({
        ...group,
        rows: group.rows.sort((left, right) =>
          [
            String(left.contrato || "").localeCompare(String(right.contrato || ""), "es", {
              sensitivity: "base",
            }),
            String(left.servicio || "").localeCompare(String(right.servicio || ""), "es", {
              sensitivity: "base",
            }),
            String(left.fecha_inicio || "").localeCompare(String(right.fecha_inicio || "")),
            String(left.hora_inicio || "").localeCompare(String(right.hora_inicio || "")),
            String(left.instalacion || "").localeCompare(String(right.instalacion || ""), "es", {
              sensitivity: "base",
            }),
          ].find((result) => result !== 0) || 0
        ),
      }))
      .sort((left, right) =>
        String(left.person).localeCompare(String(right.person), "es", { sensitivity: "base" })
      );
  }

  function getActivityScheduleWeekdays(activity) {
    const labels = {
      1: "L",
      2: "M",
      3: "X",
      4: "J",
      5: "V",
      6: "S",
      7: "D",
    };
    const days = Array.isArray(activity.dias_semana) ? activity.dias_semana : [];
    return days.length ? days.map((day) => labels[Number(day)] || day).join("") : "-";
  }

  function getActivityScheduleWeeklyHours(activity) {
    const days = Array.isArray(activity.dias_semana)
      ? new Set(activity.dias_semana.map(Number).filter(Number.isFinite)).size
      : 0;
    return getActivityGeneratedHours(activity) * days;
  }

  function formatActivityContractServiceLabel(activity) {
    const contract = String(activity.contrato || "-").trim();
    const service = String(activity.servicio || "").trim();
    return service ? `${contract} · ${service}` : contract;
  }

  function getActivityScheduleReportRow(activity) {
    const dailyHours = getActivityGeneratedHours(activity);
    const weeklyHours = getActivityScheduleWeeklyHours(activity);
    return {
      contrato: formatActivityContractServiceLabel(activity),
      inicio: formatDate(activity.fecha_inicio),
      fin: formatDate(activity.fecha_fin),
      dias: getActivityScheduleWeekdays(activity),
      horario: `${formatTime(activity.hora_inicio)}-${formatTime(activity.hora_fin)}`,
      puesto: activity.puesto || "-",
      instalacion: activity.instalacion || "-",
      horas: formatHours(dailyHours),
      horasSemana: formatHours(weeklyHours),
      weeklyHours,
    };
  }

  function renderActivitiesScheduleReportPreview() {
    const groups = getActivityScheduleReportGroups();
    activitiesScheduleReportSummary.textContent = `${filteredActivitiesRows.length} actividades filtradas. Previsualizacion del informe antes de generar el PDF.`;

    if (!groups.length) {
      activitiesScheduleReportContent.innerHTML =
        '<p class="empty-state">No hay actividades con los filtros actuales.</p>';
      return;
    }

    activitiesScheduleReportContent.innerHTML = groups
      .map((group) => {
        let groupWeeklyTotal = 0;
        const personDetails = [
          group.dni ? `DNI: ${group.dni}` : "",
          group.ss ? `SS: ${group.ss}` : "",
          group.fechaNacimiento ? `Nacimiento: ${formatDate(group.fechaNacimiento)}` : "",
        ].filter(Boolean);
        const rows = group.rows
          .map((activity) => {
            const row = getActivityScheduleReportRow(activity);
            groupWeeklyTotal += row.weeklyHours;
            return `
              <tr>
                <td>${escapeHtml(row.contrato)}</td>
                <td>${escapeHtml(row.inicio)}</td>
                <td>${escapeHtml(row.fin)}</td>
                <td>${escapeHtml(row.dias)}</td>
                <td>${escapeHtml(row.horario)}</td>
                <td>${escapeHtml(row.puesto)}</td>
                <td>${escapeHtml(row.instalacion)}</td>
                <td class="numeric-cell">${escapeHtml(row.horas)}</td>
                <td class="numeric-cell">${escapeHtml(row.horasSemana)}</td>
              </tr>
            `;
          })
          .join("");

        return `
          <section class="activities-schedule-report-section">
            <div class="activities-schedule-report-person">
              <h3>${escapeHtml(group.person)}</h3>
              ${personDetails.length ? `<p>${escapeHtml(personDetails.join("   "))}</p>` : ""}
            </div>
            <div class="table-wrap activities-schedule-report-table-wrap">
              <table class="activities-schedule-report-table">
                <thead>
                  <tr>
                    <th>Contrato / Servicio</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Dias</th>
                    <th>Horario</th>
                    <th>Puesto</th>
                    <th>Instalacion</th>
                    <th>Horas</th>
                    <th>H. Se</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                  <tr class="report-totals-row">
                    <th colspan="8" scope="row">Total semanal</th>
                    <td class="numeric-cell">${escapeHtml(formatHours(groupWeeklyTotal))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        `;
      })
      .join("");
  }

  function openActivitiesScheduleReportPreview() {
    renderActivitiesScheduleReportPreview();
    activitiesScheduleReportPanel?.classList.remove("hidden");
    activitiesScheduleReportBackdrop?.classList.remove("hidden");
  }

  function closeActivitiesScheduleReportPreview() {
    activitiesScheduleReportPanel?.classList.add("hidden");
    activitiesScheduleReportBackdrop?.classList.add("hidden");
  }

  async function downloadActivitiesScheduleReportPdf() {
    try {
      const groups = getActivityScheduleReportGroups();
      if (!groups.length) {
        setStatus("No hay actividades filtradas para generar el informe de horarios.", "error");
        return;
      }

      const { jsPDF } = await getJsPdfClient();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 9;
      const marginTop = 10;
      const marginBottom = 12;
      const lineHeight = 4;
      const headerHeight = 7;
      const columns = [
        { key: "contrato", label: "Contrato / Servicio", width: 45 },
        { key: "inicio", label: "Inicio", width: 18 },
        { key: "fin", label: "Fin", width: 18 },
        { key: "dias", label: "Dias", width: 13 },
        { key: "horario", label: "Horario", width: 23 },
        { key: "puesto", label: "Puesto", width: 35 },
        { key: "instalacion", label: "Instalacion", width: 80 },
        { key: "horas", label: "Horas", width: 14 },
        { key: "horasSemana", label: "H. Se", width: 15 },
      ];
      let y = marginTop;

      const drawPageHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Horarios de actividades filtradas", marginX, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`${filteredActivitiesRows.length} actividades filtradas`, pageWidth - marginX, y, {
          align: "right",
        });
        y += 7;
      };

      const drawTableHeader = () => {
        let x = marginX;
        doc.setFillColor(236, 240, 244);
        doc.rect(marginX, y - 4.5, pageWidth - marginX * 2, headerHeight, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        columns.forEach((column) => {
          doc.text(column.label, x + 1, y, { maxWidth: column.width - 2 });
          x += column.width;
        });
        y += headerHeight;
      };

      const ensureSpace = (neededHeight) => {
        if (y + neededHeight <= pageHeight - marginBottom) {
          return;
        }
        doc.addPage();
        y = marginTop;
        drawPageHeader();
      };

      const drawCell = (text, x, rowTop, width, maxLines = 2, align = "left") => {
        const lines = doc.splitTextToSize(String(text || "-"), width - 2).slice(0, maxLines);
        lines.forEach((line, index) => {
          doc.text(line, align === "right" ? x + width - 1 : x + 1, rowTop + 4 + index * 3.4, {
            maxWidth: width - 2,
            align,
          });
        });
      };

      drawPageHeader();

      groups.forEach((group) => {
        const personDetails = [
          group.dni ? `DNI: ${group.dni}` : "",
          group.ss ? `SS: ${group.ss}` : "",
          group.fechaNacimiento ? `Nacimiento: ${formatDate(group.fechaNacimiento)}` : "",
        ].filter(Boolean);
        ensureSpace(18);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(group.person, marginX, y, { maxWidth: pageWidth - marginX * 2 });
        if (personDetails.length) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.text(personDetails.join("   "), pageWidth - marginX, y, { align: "right" });
        }
        y += 5;
        drawTableHeader();

        let groupWeeklyTotal = 0;
        group.rows.forEach((activity) => {
          const row = getActivityScheduleReportRow(activity);
          groupWeeklyTotal += row.weeklyHours;
          const rowHeight = Math.max(
            6,
            Math.min(
              13,
              Math.max(
                doc.splitTextToSize(String(row.contrato), columns[0].width - 2).length,
                doc.splitTextToSize(String(row.puesto), columns[5].width - 2).length,
                doc.splitTextToSize(String(row.instalacion), columns[6].width - 2).length
              ) * lineHeight
            )
          );

          ensureSpace(rowHeight + 2);
          doc.setDrawColor(224, 228, 234);
          doc.line(marginX, y - 2, pageWidth - marginX, y - 2);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          let x = marginX;
          columns.forEach((column) => {
            const isNumeric = column.key === "horas" || column.key === "horasSemana";
            drawCell(row[column.key], x, y - 1, column.width, 2, isNumeric ? "right" : "left");
            x += column.width;
          });
          y += rowHeight;
        });

        ensureSpace(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(`Total semanal: ${formatHours(groupWeeklyTotal)} h`, pageWidth - marginX, y, {
          align: "right",
        });
        y += 8;
      });

      const pageCount = doc.getNumberOfPages();
      const today = new Date().toISOString().slice(0, 10);
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(formatDate(today), marginX, pageHeight - 5);
        doc.text(`Pagina ${page} de ${pageCount}`, pageWidth - marginX, pageHeight - 5, {
          align: "right",
        });
      }

      doc.save(`informe-horarios-actividades-${today}.pdf`);
      setStatus("PDF de horarios de actividades generado correctamente.", "success");
    } catch (error) {
      setStatus(
        `No se pudo generar el informe de horarios: ${error?.message ?? "error desconocido"}`,
        "error"
      );
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

    const excelRows = [];
    const isPersonalReport = currentActivitiesReportMode === "personal";
    const weekHeaders = ACTIVITY_REPORT_WEEKS.map((week) => week.label);

    excelRows.push({
      kind: "header",
      cells: isPersonalReport ? ["ID", "Personal", ...weekHeaders] : ["Instalacion", "Personal", ...weekHeaders],
    });

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

        if (isPersonalReport) {
          excelRows.push({
            kind: "personal",
            personalId: row.personalId || "",
            personalLines: buildPersonReportExcelLines(row),
            weekCells,
          });
          return;
        }

        excelRows.push({
          kind: "data",
          cells: [group.installation, row.person, ...weekCells],
        });
      });

      excelRows.push({
        kind: "data",
        cells: isPersonalReport
          ? [
              "",
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
            ],
      });
      excelRows.push({ kind: "spacer" });
    });

    const renderExcelCell = (cell) => escapeHtml(String(cell)).replaceAll("\n", "<br />");
    const htmlRows = excelRows
      .map((row) => {
        if (row.kind === "spacer") {
          return "<tr></tr>";
        }

        if (row.kind === "personal") {
          return `<tr>
            <td>${renderExcelCell(row.personalId)}</td>
            <td style="vertical-align: top; white-space: normal;">${renderExcelMultilineCell(
              row.personalLines
            )}</td>
            ${row.weekCells.map((cell) => `<td>${renderExcelCell(cell)}</td>`).join("")}
          </tr>`;
        }

        return `<tr>${row.cells
          .map((cell) => `<td>${renderExcelCell(cell)}</td>`)
          .join("")}</tr>`;
      })
      .join("");
    const workbook = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
          <x:Name>Informe</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            td { vertical-align: top; }
            br { mso-data-placement: same-cell; }
          </style>
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

  function getActivityGeneratedDates(activity, options = {}) {
    const start = parseDateValue(activity.fecha_inicio);
    const end = parseDateValue(activity.fecha_fin);
    const rangeStart = parseDateValue(options.fechaDesde);
    const rangeEnd = parseDateValue(options.fechaHasta);
    const weekdays = new Set((activity.dias_semana || []).map(Number));

    if (!start || !end || end < start || !weekdays.size) {
      return [];
    }

    const dates = [];
    const firstDate = rangeStart && rangeStart > start ? rangeStart : start;
    const lastDate = rangeEnd && rangeEnd < end ? rangeEnd : end;

    if (lastDate < firstDate) {
      return [];
    }

    const current = new Date(firstDate.getTime());
    while (current <= lastDate) {
      if (weekdays.has(getSpanishWeekday(current))) {
        dates.push(formatDateValue(current));
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  function getActivityRecordKey(row) {
    return [
      row.actividad_id,
      row.fecha,
      formatTime(row.hora_inicio),
      formatTime(row.hora_fin),
      row.personal_id,
    ].join("|");
  }

  function getActivityGeneratedHours(activity) {
    const start = parseTimeMinutes(activity.hora_inicio);
    const end = parseTimeMinutes(activity.hora_fin);
    if (start === null || end === null) {
      return 0;
    }
    const minutes = end >= start ? end - start : end + 24 * 60 - start;
    return Math.round((minutes / 60) * 100) / 100;
  }

  // Horas del turno que caen dentro de la franja nocturna del contrato.
  // Franja definida por dos `time` que puede cruzar medianoche (22:00 -> 06:00).
  // El turno tambien puede cruzar medianoche; se resuelve desenrollando ambos
  // y sumando el solape sobre los desplazamientos de dia adyacentes.
  function getActivityNightHours(activity, nightConfig) {
    if (!nightConfig || !nightConfig.tiene) {
      return 0;
    }
    const start = parseTimeMinutes(activity.hora_inicio);
    const end = parseTimeMinutes(activity.hora_fin);
    const nStart = parseTimeMinutes(nightConfig.inicio);
    const nEnd = parseTimeMinutes(nightConfig.fin);
    if (start === null || end === null || nStart === null || nEnd === null) {
      return 0;
    }
    const shiftStart = start;
    const shiftEnd = end >= start ? end : end + 24 * 60;
    const winLen = nEnd > nStart ? nEnd - nStart : nEnd + 24 * 60 - nStart;
    if (winLen <= 0) {
      return 0;
    }
    let overlap = 0;
    for (const dayOffset of [-24 * 60, 0, 24 * 60]) {
      const winStart = nStart + dayOffset;
      const winEnd = winStart + winLen;
      overlap += Math.max(0, Math.min(shiftEnd, winEnd) - Math.max(shiftStart, winStart));
    }
    return Math.round((overlap / 60) * 100) / 100;
  }

  function buildRecordsForActivity(activity, existingKeys, options = {}) {
    const dates = getActivityGeneratedDates(activity, options);
    const hours = getActivityGeneratedHours(activity);
    const nightHours = getActivityNightHours(
      activity,
      activityContractNocturnidad.get(Number(activity.contrato_id))
    );
    return dates
      .map((date) => ({
        actividad_id: activity.id,
        servicio_id: activity.servicio_id || null,
        fecha: date,
        personal_id: activity.personal_id,
        contrato_id: activity.contrato_id,
        empresa_id: activity.empresa_id,
        instalacion_id: activity.instalacion_id,
        puesto_id: activity.puesto_id,
        funcion_id: activity.funcion_id || null,
        modalidad_id: activity.modalidad_id || null,
        situacion_id: activity.situacion_id,
        tipo_hora_id: activity.tipo_hora_id,
        hora_inicio: formatTime(activity.hora_inicio),
        hora_fin: formatTime(activity.hora_fin),
        horas: hours,
        horas_nocturnas: nightHours,
        activo: true,
        facturar: true,
        abonar: true,
        descanso: false,
        sustitucion: false,
        festivo: false,
        anio: Number(date.slice(0, 4)),
        observacion: activity.observaciones || null,
      }))
      .filter((row) => !existingKeys.has(getActivityRecordKey(row)));
  }

  async function generateRecordsForActivity(activityId, options = {}) {
    const activity = activitiesRows.find((row) => String(row.id) === String(activityId));
    if (!activity) {
      setStatus("No se encontro la actividad seleccionada.", "error");
      return;
    }

    const dates = getActivityGeneratedDates(activity, options);
    if (!dates.length) {
      setStatus("La actividad no tiene fechas generables. Revisa fechas y dias de semana.", "error");
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { data: existingRows, error: existingError } = await supabase
        .from("registros")
        .select("actividad_id,fecha,hora_inicio,hora_fin,personal_id")
        .eq("actividad_id", activity.id);

      if (existingError) {
        throw existingError;
      }

      const existingKeys = new Set((existingRows ?? []).map(getActivityRecordKey));
      const rowsToInsert = buildRecordsForActivity(activity, existingKeys, options);

      // Generacion conservadora: no se borran ni actualizan registros existentes,
      // solo se crean las fechas/tramos que faltan para evitar perder ediciones manuales.
      if (!rowsToInsert.length) {
        setStatus("La actividad ya tiene todos los registros generados.", "success");
        return;
      }

      const { error: insertError } = await supabase.from("registros").insert(rowsToInsert);
      if (insertError) {
        throw insertError;
      }

      window.CoordinacionRegistros?.refresh?.();
      setStatus(`Registros generados: ${rowsToInsert.length}.`, "success");
    } catch (error) {
      setStatus(`No se pudieron generar los registros: ${error.message}`, "error");
    }
  }

  async function generateRecordsForActivities(activityIds, options = {}) {
    const ids = Array.from(new Set(activityIds.map(String))).filter(Boolean);
    const activities = ids
      .map((id) => activitiesRows.find((row) => String(row.id) === id))
      .filter(Boolean);

    if (!activities.length) {
      setStatus("Selecciona al menos una actividad para generar registros.", "error");
      return;
    }

    if (!options.fechaDesde || !options.fechaHasta || options.fechaHasta < options.fechaDesde) {
      setStatus("Indica un intervalo de fechas valido.", "error");
      return;
    }

    try {
      const supabase = await getSupabaseClient();
      const { data: existingRows, error: existingError } = await supabase
        .from("registros")
        .select("actividad_id,fecha,hora_inicio,hora_fin,personal_id")
        .in("actividad_id", activities.map((activity) => activity.id));

      if (existingError) {
        throw existingError;
      }

      const existingKeys = new Set((existingRows ?? []).map(getActivityRecordKey));
      const rowsToInsert = activities.flatMap((activity) =>
        buildRecordsForActivity(activity, existingKeys, options)
      );

      // Generacion conservadora: solo se crean registros faltantes dentro del intervalo
      // seleccionado. No se borran ni pisan registros ya generados o editados a mano.
      if (!rowsToInsert.length) {
        setStatus("No hay registros nuevos para generar con esa seleccion e intervalo.", "success");
        return;
      }

      const { error: insertError } = await supabase.from("registros").insert(rowsToInsert);
      if (insertError) {
        throw insertError;
      }

      window.CoordinacionRegistros?.refresh?.();
      setStatus(`Registros generados: ${rowsToInsert.length}.`, "success");
    } catch (error) {
      setStatus(`No se pudieron generar los registros: ${error.message}`, "error");
    }
  }

  function viewActivityRecords(activityId) {
    if (window.CoordinacionRegistros?.showForActivity) {
      window.CoordinacionRegistros.showForActivity(activityId);
      return;
    }

    setStatus("La pestaña Registros no esta disponible todavia. Recarga la pagina.", "error");
  }

  function getSelectedActivityRecordGeneratorIds() {
    return filteredActivitiesRows
      .map((activity) => String(activity.id))
      .filter((id) => selectedActivityRecordGeneratorIds.has(id));
  }

  function syncActivitiesRecordsSelectionUi() {
    const selectedCount = getSelectedActivityRecordGeneratorIds().length;
    if (activitiesRecordsSelectionCount) {
      activitiesRecordsSelectionCount.textContent = activitiesRecordsSelectionMode
        ? `${selectedCount} seleccionados de ${filteredActivitiesRows.length}`
        : "Activa la selección para marcar actividades";
    }
    activitiesSelectRecordsButton?.classList.toggle("hidden", activitiesRecordsSelectionMode);
    activitiesCancelRecordsSelectionButton?.classList.toggle("hidden", !activitiesRecordsSelectionMode);
    if (activitiesRecordsSelectAllCheckbox) {
      activitiesRecordsSelectAllCheckbox.checked =
        Boolean(filteredActivitiesRows.length) && selectedCount === filteredActivitiesRows.length;
      activitiesRecordsSelectAllCheckbox.indeterminate =
        selectedCount > 0 && selectedCount < filteredActivitiesRows.length;
      activitiesRecordsSelectAllCheckbox.disabled =
        !activitiesRecordsSelectionMode || filteredActivitiesRows.length === 0;
    }
    if (activitiesGenerateRecordsDialogButton) {
      activitiesGenerateRecordsDialogButton.disabled = selectedCount === 0;
    }
    syncActivitiesBulkAssignmentUi();
  }

  function setActivitiesRecordsSelectionMode(enabled) {
    activitiesRecordsSelectionMode = Boolean(enabled);
    if (!activitiesRecordsSelectionMode) {
      selectedActivityRecordGeneratorIds = new Set();
    }
    renderActivitiesTable();
  }

  function openActivitiesRecordsGenerationPanel() {
    const selectedIds = getSelectedActivityRecordGeneratorIds();

    if (!selectedIds.length) {
      setStatus("Selecciona actividades antes de generar registros.", "error");
      return;
    }

    const selectedActivities = selectedIds
      .map((id) => activitiesRows.find((activity) => String(activity.id) === id))
      .filter(Boolean);
    const minStart = selectedActivities
      .map((activity) => activity.fecha_inicio)
      .filter(Boolean)
      .sort()[0];
    const sortedEndDates = selectedActivities
      .map((activity) => activity.fecha_fin)
      .filter(Boolean)
      .sort();
    const maxEnd = sortedEndDates[sortedEndDates.length - 1];

    if (activitiesRecordsDateFrom) {
      activitiesRecordsDateFrom.value = minStart || "";
    }
    if (activitiesRecordsDateTo) {
      activitiesRecordsDateTo.value = maxEnd || minStart || "";
    }
    if (activitiesRecordsGenerationSummary) {
      activitiesRecordsGenerationSummary.textContent = `${selectedIds.length} actividades seleccionadas. Se generaran solo los dias del intervalo que coincidan con sus dias de semana.`;
    }

    activitiesRecordsGenerationPanel?.classList.remove("hidden");
    activitiesRecordsGenerationBackdrop?.classList.remove("hidden");
  }

  function closeActivitiesRecordsGenerationPanel() {
    activitiesRecordsGenerationPanel?.classList.add("hidden");
    activitiesRecordsGenerationBackdrop?.classList.add("hidden");
  }

  async function handleActivitiesRecordsGenerationSubmit(event) {
    event.preventDefault();
    const selectedIds = getSelectedActivityRecordGeneratorIds();
    const fechaDesde = activitiesRecordsDateFrom?.value || "";
    const fechaHasta = activitiesRecordsDateTo?.value || "";
    const submitButton = activitiesRecordsGenerationForm?.querySelector('button[type="submit"]');

    try {
      if (submitButton) {
        submitButton.disabled = true;
      }
      await generateRecordsForActivities(selectedIds, { fechaDesde, fechaHasta });
      closeActivitiesRecordsGenerationPanel();
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  }

  function openActivityEdit(activityId) {
    const activity = activitiesRows.find((row) => String(row.id) === String(activityId));

    if (!activity) {
      setStatus("No se encontro la actividad seleccionada.", "error");
      return;
    }

    editActivityId.value = activity.id;
    editActivityContrato.value = String(activity.contrato_id);
    renderActivityServiceOptions(editActivityServicio, activity.contrato_id, activity.servicio_id);
    renderActivityContractScopedOptions(
      activityEditForm,
      activity.personal_id,
      activity.instalacion_id
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
    markConciliaPristine(activityEditForm);
  }

  // Aviso de cambios sin guardar reutilizando el modal compartido de Coordinación.
  async function confirmConciliaClose(form, saveFn) {
    const api = window.CoordinacionUnsaved;
    if (!api) return true;
    return api.confirmCloseWithSave(form, saveFn);
  }

  function markConciliaPristine(form) {
    window.CoordinacionUnsaved?.markFormPristine(form);
  }

  async function closeActivityEdit(options = {}) {
    if (!options.force && !(await confirmConciliaClose(activityEditForm, () => handleActivityEditSubmit()))) {
      return false;
    }
    activityEditForm.reset();
    editActivityId.value = "";
    activityEditPanel.classList.add("hidden");
    activityEditPanelBackdrop.classList.add("hidden");
    markConciliaPristine(activityEditForm);
    return true;
  }

  function openActivityCreatePanel() {
    void loadActivityCatalogs().then(() => {
      applyActivityFormDefaults();
      activityCreatePanel.classList.remove("hidden");
      activityPanelBackdrop.classList.remove("hidden");
      markConciliaPristine(activityForm);
    });
  }

  async function closeActivityCreatePanel(options = {}) {
    if (!options.force && !(await confirmConciliaClose(activityForm, () => handleActivitySubmit()))) {
      return false;
    }
    activityCreatePanel.classList.add("hidden");
    activityPanelBackdrop.classList.add("hidden");
    markConciliaPristine(activityForm);
    return true;
  }

  function duplicateActivityToCreateForm() {
    if (!editActivityId.value) {
      return;
    }

    activityForm.reset();
    activityPersonal.value = "";
    activityContrato.value = editActivityContrato.value;
    renderActivityServiceOptions(activityServicio, activityContrato.value, editActivityServicio.value);
    renderActivityContractScopedOptions(activityForm, "", editActivityInstalacion.value);
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
    closeActivityEdit({ force: true });
    setStatus("Actividad duplicada. Selecciona el personal y guarda el nuevo registro.", "success");
  }

  async function handleActivitySubmit(event) {
    event?.preventDefault();

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
      closeActivityCreatePanel({ force: true });
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
    event?.preventDefault();

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

      closeActivityEdit({ force: true });
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

      closeActivityEdit({ force: true });
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

  function updateSortButtons() {
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

  function handleStudentSortClick(button) {
    const field = button?.dataset?.studentSortField;
    if (!field) {
      return;
    }

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
      updateSortButtons();
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
    duplicateStudentFormButton?.classList.add("hidden");
    studentPanelTitle.textContent = "Nuevo alumno";
    studentPanelSummary.textContent = "Completa los datos del alumno.";
  }

  function getGeneratedStudentName() {
    return [trimInputValue(studentNombre), trimInputValue(studentApellidos)]
      .filter(Boolean)
      .join(" ");
  }

  function calculateStudentAgeFromBirthDate(value) {
    if (!value) {
      return "";
    }

    const birthDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(birthDate.getTime())) {
      return "";
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age >= 0 ? String(age) : "";
  }

  function syncGeneratedStudentFields() {
    const generatedName = getGeneratedStudentName();
    if (generatedName) {
      studentAlumnado.value = generatedName;
    }

    const generatedAge = calculateStudentAgeFromBirthDate(studentFechaNacimiento.value);
    if (generatedAge) {
      studentEdad.value = generatedAge;
    }
  }

  function duplicateCurrentStudentForNewRecord() {
    const sourceName = trimInputValue(studentAlumnado) || "alumno";
    studentId.value = "";
    studentCodigoPersona.value = "";
    studentNombre.value = "";
    studentApellidos.value = "";
    studentAlumnado.value = "";
    studentDocumento.value = "";
    studentFechaNacimiento.value = "";
    studentEdad.value = "";
    studentMovil.value = "";
    studentMail.value = "";
    duplicateStudentFormButton?.classList.add("hidden");
    studentPanelTitle.textContent = `Duplicar ${sourceName}`;
    studentPanelSummary.textContent = "Completa los datos personales para crear un alumno nuevo.";
    studentCodigoPersona.focus();
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
    duplicateStudentFormButton?.classList.remove("hidden");
    studentPanelTitle.textContent = `Editar ${row.alumnado || "alumno"}`;
    studentPanelSummary.textContent = "Actualiza los datos y guarda los cambios.";
  }

  function openStudentPanel() {
    studentPanelBackdrop.classList.remove("hidden");
    studentPanel.classList.remove("hidden");
    studentAlumnado.focus();
    markConciliaPristine(studentForm);
  }

  async function closeStudentPanel(options = {}) {
    if (!options.force && !(await confirmConciliaClose(studentForm, () => handleStudentSubmit()))) {
      return false;
    }
    studentPanelBackdrop.classList.add("hidden");
    studentPanel.classList.add("hidden");
    markConciliaPristine(studentForm);
    return true;
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
    const generatedAge = calculateStudentAgeFromBirthDate(studentFechaNacimiento.value);

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
      edad: nullableInputValue(studentEdad) || generatedAge || null,
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
    event?.preventDefault();
    syncGeneratedStudentFields();
    const payload = buildStudentPayload();

    if (!payload.alumnado) {
      setStatus("Indica nombre y apellidos o alumnado antes de guardar.", "error");
      return;
    }

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

      closeStudentPanel({ force: true });
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

  function applyStudentSortToQuery(query) {
    const columnMap = {
      centro: "centro",
      semana: "semana",
      alumnado: "alumnado",
      edad: "fecha_nacimiento",
      movil: "movil",
      comedor: "comedor",
      grupo: "grupo",
    };
    const primarySort = studentSort[0] || { field: "centro", direction: "asc" };
    const primaryColumn = columnMap[primarySort.field] || "centro";
    const ascending = primarySort.direction !== "desc";
    const fallback = ["centro", "semana", "alumnado"];
    query = query.order(primaryColumn, { ascending });
    fallback.forEach((column) => {
      if (column !== primaryColumn) {
        query = query.order(column, { ascending: true });
      }
    });
    return query;
  }

  function getStudentSortValue(row, field) {
    if (field === "edad") {
      return getStudentAgeValue(row);
    }

    if (field === "comedor") {
      return row.comedor ? 1 : 0;
    }

    return normalizeText(row[field]);
  }

  function compareStudentRows(left, right) {
    for (const sort of studentSort) {
      const direction = sort.direction === "desc" ? -1 : 1;
      const leftValue = getStudentSortValue(left, sort.field);
      const rightValue = getStudentSortValue(right, sort.field);

      if (leftValue === null && rightValue !== null) {
        return 1;
      }

      if (leftValue !== null && rightValue === null) {
        return -1;
      }

      if (leftValue === null && rightValue === null) {
        continue;
      }

      if (typeof leftValue === "number" || typeof rightValue === "number") {
        const result = (Number(leftValue) || 0) - (Number(rightValue) || 0);
        if (result !== 0) {
          return result * direction;
        }
      } else {
        const result = String(leftValue).localeCompare(String(rightValue), "es", {
          numeric: true,
          sensitivity: "base",
        });
        if (result !== 0) {
          return result * direction;
        }
      }
    }

    const fallback = String(left.alumnado ?? "").localeCompare(String(right.alumnado ?? ""), "es", {
      sensitivity: "base",
    });
    if (fallback !== 0) {
      return fallback;
    }

    return Number(left.id ?? 0) - Number(right.id ?? 0);
  }

  function sortStudentRows(rows) {
    return [...rows].sort(compareStudentRows);
  }

  async function fetchStudentsPage(supabase) {
    const filters = getStudentFilters();
    const from = (studentsCurrentPage - 1) * studentsRowsPerPage;
    const to = from + studentsRowsPerPage - 1;
    const pageSize = 1000;
    const allRows = [];

    for (let pageFrom = 0; ; pageFrom += pageSize) {
      const pageTo = pageFrom + pageSize - 1;
      let query = pageFrom === 0
        ? supabase.from("concilia_usuarios").select(STUDENT_SELECT_COLUMNS, { count: "exact" })
        : supabase.from("concilia_usuarios").select(STUDENT_SELECT_COLUMNS);
      query = applyStudentFiltersToQuery(query, filters, { includeTextFilter: false });
      query = applyStudentSortToQuery(query);
      query = query.range(pageFrom, pageTo);

      const { data, error, count } = await query;
      if (error) {
        throw error;
      }

      if (pageFrom === 0) {
        studentsTotalCount = count ?? data?.length ?? 0;
      }

      allRows.push(...(data ?? []));

      if (!data || data.length < pageSize) {
        break;
      }
    }

    const sortedRows = sortStudentRows(
      allRows.filter((row) => matchesNormalizedStudentSearch(row, filters.alumnado))
    );
    studentRows = sortedRows;
    filteredStudentRows = sortedRows.slice(from, to + 1);
    studentsTotalCount = sortedRows.length;
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
        doc.text(`${rows.length} centro/semana segun filtros del listado de alumnado.`, margin, y);
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

    const { data, error } = await supabase.rpc("get_concilia_attendance_rows", {
      p_centro: String(attendanceCenterFilter.value || "").trim() || null,
      p_semana: String(attendanceWeekFilter.value || "").trim() || null,
      p_alumnado: String(attendanceNameFilter.value || "").trim() || null,
      p_limit: attendanceRowsPerPage,
      p_offset: (attendanceCurrentPage - 1) * attendanceRowsPerPage,
      p_sort_field: attendanceSort.field,
      p_sort_direction: attendanceSort.direction,
    });
    if (error) {
      throw error;
    }
    renderAttendanceRows(data ?? []);
    updateAttendanceSortButtons();
  }

  // -----------------------------------------------
  // Informe de asistencia por centro y semana
  // -----------------------------------------------
  let attendanceReportRows = [];

  function describeAttendanceReportFilters() {
    const centro = String(attendanceCenterFilter?.value || "").trim();
    const semana = String(attendanceWeekFilter?.value || "").trim();
    const alumnado = String(attendanceNameFilter?.value || "").trim();
    const parts = [];
    parts.push(`Centro: ${centro || "Todos"}`);
    parts.push(`Semana: ${semana || "Todas"}`);
    if (alumnado) {
      parts.push(`Alumnado: ${alumnado}`);
    }
    return parts.join(" · ");
  }

  async function fetchAllFilteredAttendanceForReport(supabase) {
    const centro = String(attendanceCenterFilter?.value || "").trim();
    const semana = String(attendanceWeekFilter?.value || "").trim();
    const alumnado = normalizeText(attendanceNameFilter?.value || "");
    const selectColumns = ["centro", "semana", "alumnado", ...ATTENDANCE_DAYS.map((day) => day.field)].join(",");
    const pageSize = 1000;
    const rows = [];

    for (let pageFrom = 0; ; pageFrom += pageSize) {
      let query = supabase
        .from("concilia_usuarios")
        .select(selectColumns)
        .order("centro", { ascending: true })
        .order("semana", { ascending: true })
        .range(pageFrom, pageFrom + pageSize - 1);
      if (centro) {
        query = query.eq("centro", centro);
      }
      if (semana) {
        query = query.eq("semana", semana);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      rows.push(
        ...(data ?? []).filter((row) => !alumnado || normalizeText(row.alumnado).includes(alumnado))
      );

      if (!data || data.length < pageSize) {
        break;
      }
    }

    return rows;
  }

  function buildAttendanceReportRows(rows) {
    const grouped = new Map();

    rows.forEach((row) => {
      const centro = String(row.centro ?? "").trim() || "Sin centro";
      const semana = String(row.semana ?? "").trim() || "Sin semana";
      const groupKey = `${centro} ${semana}`;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          centro,
          semana,
          alumnos: 0,
          counts: Object.fromEntries(ATTENDANCE_DAYS.map((day) => [day.field, 0])),
        });
      }

      const group = grouped.get(groupKey);
      group.alumnos += 1;
      ATTENDANCE_DAYS.forEach((day) => {
        if (row[day.field]) {
          group.counts[day.field] += 1;
        }
      });
    });

    return Array.from(grouped.values()).sort((left, right) => {
      const centerCompare = left.centro.localeCompare(right.centro, "es", { sensitivity: "base" });
      if (centerCompare !== 0) {
        return centerCompare;
      }
      return left.semana.localeCompare(right.semana, "es", { numeric: true, sensitivity: "base" });
    });
  }

  function computeAttendanceReportTotals(reportRows) {
    const totals = {
      alumnos: 0,
      counts: Object.fromEntries(ATTENDANCE_DAYS.map((day) => [day.field, 0])),
    };
    reportRows.forEach((row) => {
      totals.alumnos += row.alumnos;
      ATTENDANCE_DAYS.forEach((day) => {
        totals.counts[day.field] += row.counts[day.field];
      });
    });
    return totals;
  }

  function renderAttendanceReportTable(reportRows) {
    if (!attendanceReportTableBody) {
      return;
    }

    if (!reportRows.length) {
      attendanceReportTableBody.innerHTML =
        '<tr><td colspan="8" class="empty-state">No hay asistencia para esos filtros.</td></tr>';
      return;
    }

    const totals = computeAttendanceReportTotals(reportRows);
    const bodyRows = reportRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.centro)}</td>
            <td>${escapeHtml(row.semana)}</td>
            ${ATTENDANCE_DAYS.map((day) => `<td>${row.counts[day.field]}</td>`).join("")}
            <td>${row.alumnos}</td>
          </tr>`
      )
      .join("");
    const totalsRow = `
      <tr class="weekly-summary-total-row">
        <td>Totales</td>
        <td></td>
        ${ATTENDANCE_DAYS.map((day) => `<td>${totals.counts[day.field]}</td>`).join("")}
        <td>${totals.alumnos}</td>
      </tr>`;

    attendanceReportTableBody.innerHTML = bodyRows + totalsRow;
  }

  function openAttendanceReportPanel() {
    attendanceReportBackdrop?.classList.remove("hidden");
    attendanceReportPanel?.classList.remove("hidden");
  }

  function closeAttendanceReportPanel() {
    attendanceReportBackdrop?.classList.add("hidden");
    attendanceReportPanel?.classList.add("hidden");
  }

  async function loadAttendanceReport() {
    openAttendanceReportPanel();
    if (attendanceReportSummary) {
      attendanceReportSummary.textContent = "Cargando informe...";
    }
    if (attendanceReportTableBody) {
      attendanceReportTableBody.innerHTML =
        '<tr><td colspan="8" class="empty-state">Cargando informe...</td></tr>';
    }

    try {
      const supabase = await getSupabaseClient();
      const rawRows = await fetchAllFilteredAttendanceForReport(supabase);
      attendanceReportRows = buildAttendanceReportRows(rawRows);
      renderAttendanceReportTable(attendanceReportRows);
      if (attendanceReportSummary) {
        const totals = computeAttendanceReportTotals(attendanceReportRows);
        attendanceReportSummary.textContent = attendanceReportRows.length
          ? `${attendanceReportRows.length} centro/semana · ${totals.alumnos} alumnos · ${describeAttendanceReportFilters()}`
          : `Sin datos · ${describeAttendanceReportFilters()}`;
      }
    } catch (error) {
      attendanceReportRows = [];
      if (attendanceReportSummary) {
        attendanceReportSummary.textContent = "No se pudo generar el informe.";
      }
      if (attendanceReportTableBody) {
        attendanceReportTableBody.innerHTML =
          '<tr><td colspan="8" class="empty-state">Error generando el informe.</td></tr>';
      }
      setStatus(`No se pudo generar el informe de asistencia: ${error.message}`, "error");
    }
  }

  async function downloadAttendanceReportPdf() {
    if (!attendanceReportRows.length) {
      setStatus("No hay asistencia filtrada para generar el informe.", "error");
      return;
    }

    try {
      const { jsPDF } = await getJsPdfClient();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      const rowHeight = 7;
      const centerWidth = 78;
      const weekWidth = 20;
      const numericWidth = (pageWidth - margin * 2 - centerWidth - weekWidth) / (ATTENDANCE_DAYS.length + 1);
      const totals = computeAttendanceReportTotals(attendanceReportRows);
      const dayLabels = [...ATTENDANCE_DAYS.map((day) => day.shortLabel), "Alumnos"];
      let y = margin;

      const drawTitle = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Informe de asistencia por centro y semana", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(describeAttendanceReportFilters(), margin, y);
        y += 8;
      };

      const drawHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.6);
        doc.setFillColor(235, 239, 245);
        doc.rect(margin, y - 4.5, pageWidth - margin * 2, rowHeight, "F");
        doc.text("Centro", margin + 1, y);
        doc.text("Semana", margin + centerWidth + 1, y);
        dayLabels.forEach((label, index) => {
          doc.text(label, margin + centerWidth + weekWidth + numericWidth * index + 1, y, {
            maxWidth: numericWidth - 1,
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

      const drawNumericCells = (values) => {
        values.forEach((value, index) => {
          doc.text(String(value), margin + centerWidth + weekWidth + numericWidth * index + 1, y, {
            maxWidth: numericWidth - 1,
          });
        });
      };

      drawTitle();
      drawHeader();

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      attendanceReportRows.forEach((row) => {
        ensureSpace();
        doc.text(row.centro, margin + 1, y, { maxWidth: centerWidth - 2 });
        doc.text(row.semana, margin + centerWidth + 1, y, { maxWidth: weekWidth - 2 });
        drawNumericCells([...ATTENDANCE_DAYS.map((day) => row.counts[day.field]), row.alumnos]);
        y += rowHeight;
      });

      ensureSpace();
      doc.setFont("helvetica", "bold");
      doc.text("Totales", margin + 1, y, { maxWidth: centerWidth - 2 });
      drawNumericCells([...ATTENDANCE_DAYS.map((day) => totals.counts[day.field]), totals.alumnos]);

      const today = new Date().toISOString().slice(0, 10);
      doc.save(`informe-asistencia-${today}.pdf`);
      setStatus("PDF de asistencia generado correctamente.", "success");
    } catch (error) {
      setStatus(`No se pudo generar el PDF de asistencia: ${error.message}`, "error");
    }
  }

  function downloadAttendanceReportExcel() {
    if (!attendanceReportRows.length) {
      setStatus("No hay asistencia filtrada para generar el informe.", "error");
      return;
    }

    const totals = computeAttendanceReportTotals(attendanceReportRows);
    const headerCells = ["Centro", "Semana", ...ATTENDANCE_DAYS.map((day) => day.shortLabel), "Alumnos"];
    const renderCell = (value) => `<td>${escapeHtml(String(value))}</td>`;
    const bodyRows = attendanceReportRows
      .map(
        (row) =>
          `<tr>${renderCell(row.centro)}${renderCell(row.semana)}${ATTENDANCE_DAYS.map((day) =>
            renderCell(row.counts[day.field])
          ).join("")}${renderCell(row.alumnos)}</tr>`
      )
      .join("");
    const totalsRow = `<tr>${renderCell("Totales")}${renderCell("")}${ATTENDANCE_DAYS.map((day) =>
      renderCell(totals.counts[day.field])
    ).join("")}${renderCell(totals.alumnos)}</tr>`;
    const headerRow = `<tr>${headerCells.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>`;
    const captionRow = `<tr><td colspan="${headerCells.length}">${escapeHtml(
      describeAttendanceReportFilters()
    )}</td></tr>`;

    const workbook = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
          <x:Name>Asistencia</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body>
          <table>${captionRow}${headerRow}${bodyRows}${totalsRow}</table>
        </body>
      </html>
    `;

    const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `informe-asistencia-${today}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Excel de asistencia generado correctamente.", "success");
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
    authView?.classList.remove("hidden");
    appView?.classList.add("hidden");
    loginForm?.classList.remove("hidden");
    passwordSetupForm?.classList.add("hidden");
  }

  function showPasswordSetup() {
    authView?.classList.remove("hidden");
    appView?.classList.add("hidden");
    loginForm?.classList.add("hidden");
    passwordSetupForm?.classList.remove("hidden");
  }

  function showApp(email) {
    authView?.classList.add("hidden");
    appView?.classList.remove("hidden");
    if (sessionSummary) {
      sessionSummary.textContent = `Sesion iniciada${email ? `: ${email}` : ""}`;
    }
  }

  async function loadStudents() {
    studentsSummary.textContent = "Cargando datos...";
    if (studentsTableHead) {
      studentsTableHead.innerHTML = "";
    }
    studentsTableBody.innerHTML =
      '<tr><td colspan="8" class="empty-state">Cargando alumnado...</td></tr>';

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
      if (studentsTableHead) {
        studentsTableHead.innerHTML = "";
      }
      studentsTableBody.innerHTML =
        '<tr><td colspan="8" class="empty-state">Error cargando alumnado.</td></tr>';
      setStatus(`No se pudo cargar alumnado: ${error.message}`, "error");
      return;
    }

    updateSortButtons();
    syncStudentsBulkAssignmentUi();
    renderStudentsTable();
  }

  async function enterApp(session) {
    showApp(session.user.email ?? "");
    const initialModuleTab = getInitialModuleTab();
    switchModuleTab(initialModuleTab);
    await loadModuleTabData(initialModuleTab);
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
      comedorRows = [];
      comedorTotalCount = 0;
      availabilityRows = [];
      availabilityTotalCount = 0;
      studentsCurrentPage = 1;
      attendanceCurrentPage = 1;
      neeCurrentPage = 1;
      comedorCurrentPage = 1;
      availabilityCurrentPage = 1;
      renderStudentsTable();
      renderWeeklySummary();
      renderAttendanceRows([]);
      renderAvailabilityRows([]);
      buildNeeRows();
      renderNeeTable();
      renderComedorRows([]);
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
      availabilityRows = [];
      availabilityTotalCount = 0;
      studentsCurrentPage = 1;
      attendanceCurrentPage = 1;
      neeCurrentPage = 1;
      availabilityCurrentPage = 1;
      renderStudentsTable();
      renderWeeklySummary();
      renderAttendanceRows([]);
      renderAvailabilityRows([]);
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

  async function enterIntegratedApp(target = "alumnado") {
    const session = await getCurrentSession();
    if (!session) {
      setStatus("No hay una sesion activa para cargar Concilia.", "error");
      return;
    }

    showApp(session.user.email ?? "");
    switchModuleTab(target);
    await loadModuleTabData(target);
  }

  async function init() {
    if (EMBED_MODE) {
      document.body?.classList.add("embedded-concilia");
    }

    if (!hasSupabaseConfig) {
      setStatus("Falta la configuracion de Supabase en config.js.", "error");
      return;
    }

    window.CoordinacionConcilia = {
      showTab: async (target = "alumnado") => {
        await enterIntegratedApp(target);
      },
    };

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
    openAttendanceReportButton?.addEventListener("click", () => {
      void loadAttendanceReport();
    });
    closeAttendanceReportButton?.addEventListener("click", closeAttendanceReportPanel);
    attendanceReportBackdrop?.addEventListener("click", closeAttendanceReportPanel);
    attendanceReportPdfButton?.addEventListener("click", () => {
      void downloadAttendanceReportPdf();
    });
    attendanceReportExcelButton?.addEventListener("click", downloadAttendanceReportExcel);
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
    duplicateStudentFormButton?.addEventListener("click", duplicateCurrentStudentForNewRecord);
    studentNombre?.addEventListener("input", syncGeneratedStudentFields);
    studentApellidos?.addEventListener("input", syncGeneratedStudentFields);
    studentFechaNacimiento?.addEventListener("change", syncGeneratedStudentFields);
    studentsTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-edit-student]");
      if (!button) {
        return;
      }

      openStudentEditPanel(button.dataset.editStudent);
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
      void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
    });
    attendanceFiltersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      attendanceCurrentPage = 1;
      void getSupabaseClient().then((supabase) => loadAttendanceMatrix(supabase));
    });
    attendanceFiltersForm.addEventListener("change", () => {
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
      renderActivityServiceOptions(activityServicio, activityContrato.value);
      renderActivityContractScopedOptions(activityForm);
    });
    editActivityContrato?.addEventListener("change", () => {
      renderActivityServiceOptions(editActivityServicio, editActivityContrato.value);
      renderActivityContractScopedOptions(activityEditForm);
    });
    clearActivityFormButton.addEventListener("click", () => {
      activityForm.reset();
      renderActivityServiceOptions(activityServicio, "");
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
    setupActivitiesHistorialPanel();
    openActivitiesReportButton.addEventListener("click", () => openActivitiesReport("installation"));
    openActivitiesPersonalReportButton.addEventListener("click", () => openActivitiesReport("personal"));
    openActivitiesScheduleReportButton?.addEventListener("click", openActivitiesScheduleReportPreview);
    downloadActivitiesScheduleReportPdfButton?.addEventListener("click", () => {
      void downloadActivitiesScheduleReportPdf();
    });
    closeActivitiesScheduleReportButton?.addEventListener(
      "click",
      closeActivitiesScheduleReportPreview
    );
    activitiesScheduleReportBackdrop?.addEventListener("click", closeActivitiesScheduleReportPreview);
    closeActivitiesReportButton.addEventListener("click", closeActivitiesReport);
    downloadActivitiesReportPdfButton.addEventListener("click", () => {
      void downloadActivitiesReportPdf();
    });
    downloadActivitiesReportExcelButton.addEventListener("click", downloadActivitiesReportExcel);
    activitiesReportBackdrop.addEventListener("click", closeActivitiesReport);
    activitiesFiltersForm.addEventListener("change", (event) => {
      syncActivitiesResetButtons();
      if (event.target === filterActivityPersonal) {
        updateActivityPersonalClear();
        renderActivityPersonalSuggestions();
        applyActivitiesFilters();
        return;
      }

      applyActivitiesFilters();
    });
    activitiesFiltersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      filterActivityPersonalSuggestions?.classList.add("hidden");
      applyActivitiesFilters();
    });
    activitiesFiltersForm.addEventListener("input", (event) => {
      if (event.target !== filterActivityPersonal) {
        return;
      }

      updateActivityPersonalClear();
      renderActivityPersonalSuggestions();
      debouncedApplyActivityPersonalFilter();
    });
    activitiesBulkFieldSelect?.addEventListener("change", () => {
      resetActivitiesBulkCurrentFilter();
      if (activitiesBulkNewValueInput) {
        activitiesBulkNewValueInput.value = "";
      }
      applyActivitiesFilters();
    });
    activitiesBulkCurrentValueInput?.addEventListener("input", () => {
      activitiesBulkCurrentFilterActive = true;
      applyActivitiesFilters();
    });
    activitiesBulkCurrentSelect?.addEventListener("change", () => {
      activitiesBulkCurrentFilterActive = true;
      applyActivitiesFilters();
    });
    activitiesBulkNewValueInput?.addEventListener("input", syncActivitiesBulkAssignmentUi);
    activitiesBulkNewSelect?.addEventListener("change", syncActivitiesBulkAssignmentUi);
    activitiesBulkApplyButton?.addEventListener("click", () => {
      void applyActivitiesBulkAssignment();
    });
    activitiesBulkSelectButton?.addEventListener("click", () => {
      setActivitiesRecordsSelectionMode(true);
    });
    activitiesSelectRecordsButton?.addEventListener("click", () => {
      setActivitiesRecordsSelectionMode(true);
    });
    activitiesRecordsSelectAllCheckbox?.addEventListener("change", () => {
      const filteredIds = filteredActivitiesRows.map((activity) => String(activity.id));
      if (activitiesRecordsSelectAllCheckbox.checked) {
        filteredIds.forEach((id) => selectedActivityRecordGeneratorIds.add(id));
      } else {
        filteredIds.forEach((id) => selectedActivityRecordGeneratorIds.delete(id));
      }
      renderActivitiesTable();
    });
    activitiesCancelRecordsSelectionButton?.addEventListener("click", () => {
      setActivitiesRecordsSelectionMode(false);
    });
    activitiesGenerateRecordsDialogButton?.addEventListener("click", openActivitiesRecordsGenerationPanel);
    closeActivitiesRecordsGenerationButton?.addEventListener("click", closeActivitiesRecordsGenerationPanel);
    cancelActivitiesRecordsGenerationButton?.addEventListener("click", closeActivitiesRecordsGenerationPanel);
    activitiesRecordsGenerationBackdrop?.addEventListener("click", closeActivitiesRecordsGenerationPanel);
    activitiesRecordsGenerationForm?.addEventListener("submit", (event) => {
      void handleActivitiesRecordsGenerationSubmit(event);
    });
    clearActivitiesFiltersButton?.addEventListener("click", () => {
      activitiesFiltersForm.reset();
      filterActivityPersonalSuggestions?.classList.add("hidden");
      updateActivityPersonalClear();
      syncActivitiesResetButtons();
      applyActivitiesFilters();
    });
    activitiesFiltersForm.addEventListener("click", (event) => {
      const personalOption = event.target.closest("[data-activity-personal-option]")?.dataset
        .activityPersonalOption;
      if (personalOption) {
        filterActivityPersonal.value = personalOption;
        filterActivityPersonalSuggestions?.classList.add("hidden");
        updateActivityPersonalClear();
        applyActivitiesFilters();
        return;
      }

      const button = event.target.closest("[data-reset-filter]");
      if (!button || !resetNamedFormControl(activitiesFiltersForm, button.dataset.resetFilter)) {
        return;
      }

      if (button.dataset.resetFilter === "personal") {
        filterActivityPersonalSuggestions?.classList.add("hidden");
      }

      syncActivitiesResetButtons();
      applyActivitiesFilters();
    });
    filterActivityPersonal?.addEventListener("focus", () => {
      renderActivityPersonalSuggestions();
    });
    filterActivityPersonalSuggestions?.addEventListener("pointerdown", (event) => {
      const personalOption = event.target.closest("[data-activity-personal-option]")?.dataset
        .activityPersonalOption;
      if (!personalOption) {
        return;
      }

      event.preventDefault();
      filterActivityPersonal.value = personalOption;
      filterActivityPersonalSuggestions.classList.add("hidden");
      updateActivityPersonalClear();
      applyActivitiesFilters();
    });
    filterActivityPersonal?.addEventListener("blur", () => {
      window.setTimeout(() => {
        filterActivityPersonalSuggestions?.classList.add("hidden");
      }, 200);
    });
    filterActivityPersonalToggle?.addEventListener("mousedown", (event) => {
      event.preventDefault();
      if (filterActivityPersonalSuggestions?.classList.contains("hidden")) {
        filterActivityPersonal?.focus();
        renderActivityPersonalSuggestions();
      } else {
        filterActivityPersonalSuggestions?.classList.add("hidden");
      }
    });
    filterActivityPersonalClear?.addEventListener("mousedown", (event) => {
      event.preventDefault();
      filterActivityPersonal.value = "";
      filterActivityPersonalSuggestions?.classList.add("hidden");
      updateActivityPersonalClear();
      applyActivitiesFilters();
    });
    updateActivityPersonalClear();
    syncActivitiesResetButtons();
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
      const selectionCheckbox = event.target.closest("[data-select-activity-record-generator]");
      if (selectionCheckbox) {
        const activityId = String(selectionCheckbox.dataset.selectActivityRecordGenerator || "");
        if (selectionCheckbox.checked) {
          selectedActivityRecordGeneratorIds.add(activityId);
        } else {
          selectedActivityRecordGeneratorIds.delete(activityId);
        }
        syncActivitiesRecordsSelectionUi();
        return;
      }

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
    generateActivityRecordsButton?.addEventListener("click", () => {
      if (editActivityId.value) {
        void generateRecordsForActivity(editActivityId.value);
      }
    });
    viewActivityRecordsButton?.addEventListener("click", () => {
      if (editActivityId.value) {
        viewActivityRecords(editActivityId.value);
      }
    });
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
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-student-sort-field]");
      if (!button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handleStudentSortClick(button);
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

    await enterIntegratedApp("alumnado");
  }

  void init();
})();
