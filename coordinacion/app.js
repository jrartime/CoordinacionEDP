const JOB_OPTIONS = [
  "Conserjeria",
  "Monitorado de tiempo libre",
  "Monitorado deportivo",
  "Monitorado acuatico",
  "Socorrismo",
  "Control biosanitario",
  "Montaje de eventos",
  "Tecnico Informatico/imagen y sonido",
];

const CANDIDATE_STATUS_OPTIONS = [
  "Pendiente",
  "Preseleccionado",
  "Descartado",
  "Contratado",
];

const PROGRAMMING_UNASSIGNED_PERSONAL = "Sin asignar";
const PROGRAMMING_TABLE_NAME = "programacion_conserjes";
const PROGRAMMING_TYPE_ALL = "all";
const PROGRAMMING_TYPE_FS = "fin_semana";
const PROGRAMMING_TYPE_WEEKLY = "semanal";
const PROGRAMMING_TYPE_OPTIONS = [
  { value: PROGRAMMING_TYPE_FS, label: "Programación FS" },
  { value: PROGRAMMING_TYPE_WEEKLY, label: "Programación semanal" },
];
const PRIVATE_TAB_STORAGE_KEY = "curriculos_private_tab";
const PRIVATE_TAB_TARGETS = new Set(["search", "control", "events", "programming"]);
const COORDINATION_HOST = "coordinacion.edpsl.es";
const INITIAL_AUTH_URL_TYPE = (() => {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return searchParams.get("type") || hashParams.get("type") || "";
})();

const CANDIDATE_SELECT_COLUMNS = [
  "id",
  "full_name",
  "phone",
  "email",
  "registration_date",
  "candidate_status",
  "job_roles",
  "sport_specialties",
  "tags",
  "notes",
  "observations",
  "attachment_name",
  "attachment_path",
  "attachment_mime_type",
  "privacy_accepted",
  "vacancy_consent",
  "source",
  "created_at",
].join(", ");

const CONTROL_SAFE_RESULT_LIMIT = 1000;
const CONTROL_HORARIO_HEADERS = [
  "personal",
  "dni",
  "centro",
  "puesto",
  "fecha",
  "hora_inicio",
  "hora_fin",
  "tipo_jornada",
  "observacion",
];

const config = window.APP_CONFIG ?? {};
const supabaseConfig = config.supabase ?? {};
const hasSupabaseConfig =
  Boolean(supabaseConfig.url) &&
  Boolean(supabaseConfig.anonKey) &&
  Boolean(supabaseConfig.bucket);
const isCoordinationPanel =
  window.location.hostname === COORDINATION_HOST ||
  window.location.hostname.includes("coordinacion") ||
  window.location.pathname.split("/").filter(Boolean)[0] === "coordinacion";

function renderIcon(name) {
  return `<svg class="button-icon" aria-hidden="true"><use href="./icons.svg#icon-${name}"></use></svg>`;
}

const publicPanel = document.querySelector("#public-panel");
const privatePanel = document.querySelector("#private-panel");
const showPublicPanelButton = document.querySelector("#show-public-panel");
const showPrivatePanelButton = document.querySelector("#show-private-panel");
const loginView = document.querySelector("#login-view");
const privateView = document.querySelector("#private-view");
const privateTabSearchButton = document.querySelector("#private-tab-search");
const privateTabControlButton = document.querySelector("#private-tab-control");
const privateTabEventsButton = document.querySelector("#private-tab-events");
const privateTabProgrammingButton = document.querySelector("#private-tab-programming");
const privateTabPanelNew = document.querySelector("#private-tab-panel-new");
const privateTabPanelSearch = document.querySelector("#private-tab-panel-search");
const privateTabPanelControl = document.querySelector("#private-tab-panel-control");
const privateTabPanelEvents = document.querySelector("#private-tab-panel-events");
const privateTabPanelProgramming = document.querySelector("#private-tab-panel-programming");
const openCandidateCreateButton = document.querySelector("#open-candidate-create-button");
const closeCandidateCreateButton = document.querySelector("#close-candidate-create-button");
const candidateCreateOverlay = document.querySelector("#candidate-create-overlay");
const loginForm = document.querySelector("#login-form");
const passwordRecoveryForm = document.querySelector("#password-recovery-form");
const passwordRecoveryEmailInput = document.querySelector("#password-recovery-email");
const showPasswordRecoveryButton = document.querySelector("#show-password-recovery-button");
const cancelPasswordRecoveryButton = document.querySelector("#cancel-password-recovery-button");
const inviteSetupForm = document.querySelector("#invite-setup-form");
const publicCandidateForm = document.querySelector("#public-candidate-form");
const candidateForm = document.querySelector("#candidate-form");
const candidateCvFileInput = document.querySelector("#candidate-cv-file");
const logoutButton = document.querySelector("#logout-button");
const candidatesTable = document.querySelector("#candidates-table");
const tableBody = document.querySelector("#candidates-table-body");
const sessionEmail = document.querySelector("#session-email");
const statusMessage = document.querySelector("#status-message");
const sportRoleCheckbox = document.querySelector("#sport-role");
const sportSpecialtiesGroup = document.querySelector("#sport-specialties-group");
const publicSportRoleCheckbox = document.querySelector("#public-sport-role");
const publicSportSpecialtiesGroup = document.querySelector(
  "#public-sport-specialties-group"
);
const tagSelect = document.querySelector("#tag-select");
const addSelectedTagButton = document.querySelector("#add-selected-tag");
const newTagInput = document.querySelector("#new-tag-input");
const createTagButton = document.querySelector("#create-tag-button");
const selectedTagsContainer = document.querySelector("#selected-tags");
const availableTagsContainer = document.querySelector("#available-tags");
const filtersForm = document.querySelector("#filters-form");
const filterSearchInput = document.querySelector("#filter-search");
const filterRoleSelect = document.querySelector("#filter-role");
const filterTagSelect = document.querySelector("#filter-tag");
const filterStatusSelect = document.querySelector("#filter-status");
const filterDateFromInput = document.querySelector("#filter-date-from");
const filterDateToInput = document.querySelector("#filter-date-to");
const filterHasCvInput = document.querySelector("#filter-has-cv");
const totalCandidatesCount = document.querySelector("#total-candidates-count");
const filteredCandidatesCount = document.querySelector("#filtered-candidates-count");
const clearFiltersButton = document.querySelector("#clear-filters-button");
const exportSelectedPdfButton = document.querySelector("#export-selected-pdf-button");
const exportCsvButton = document.querySelector("#export-csv-button");
const selectAllCandidatesCheckbox = document.querySelector("#select-all-candidates");
const paginationSummary = document.querySelector("#pagination-summary");
const paginationPageIndicator = document.querySelector("#pagination-page-indicator");
const previousPageButton = document.querySelector("#previous-page-button");
const nextPageButton = document.querySelector("#next-page-button");
const pageSizeSelect = document.querySelector("#page-size-select");
const controlFiltersForm = document.querySelector("#control-filters-form");
const controlDateFromInput = document.querySelector("#control-date-from");
const controlDateToInput = document.querySelector("#control-date-to");
const controlPersonalInput = document.querySelector("#control-personal");
const controlPersonalSuggestions = document.querySelector("#control-personal-suggestions");
const controlCentroInput = document.querySelector("#control-centro");
const controlPuestoInput = document.querySelector("#control-puesto");
const controlRecordsTable = document.querySelector("#control-records-table");
const controlClearFiltersButton = document.querySelector("#control-clear-filters-button");
const controlExportCsvButton = document.querySelector("#control-export-csv-button");
const controlExportPdfButton = document.querySelector("#control-export-pdf-button");
const controlTotalsButton = document.querySelector("#control-totals-button");
const controlImportCsvButton = document.querySelector("#control-import-csv-button");
const controlImportPanel = document.querySelector("#control-import-panel");
const controlImportOverlay = document.querySelector("#control-import-overlay");
const closeControlImportButton = document.querySelector("#close-control-import-button");
const controlImportCancelButton = document.querySelector("#control-import-cancel-button");
const controlImportForm = document.querySelector("#control-import-form");
const controlImportCsvInput = document.querySelector("#control-import-csv-input");
const controlDeleteRangeButton = document.querySelector("#control-delete-range-button");
const controlEnableSelectiveDeleteButton = document.querySelector(
  "#control-enable-selective-delete-button"
);
const controlDeleteSelectedButton = document.querySelector("#control-delete-selected-button");
const controlCancelSelectiveDeleteButton = document.querySelector(
  "#control-cancel-selective-delete-button"
);
const controlSelectedDeleteCount = document.querySelector("#control-selected-delete-count");
const controlSelectHeader = document.querySelector("#control-select-header");
const controlSelectPageCheckbox = document.querySelector("#control-select-page-checkbox");
const controlImportPreviewCard = document.querySelector("#control-import-preview-card");
const controlImportPreviewTitle = document.querySelector("#control-import-preview-title");
const controlImportPreviewFile = document.querySelector("#control-import-preview-file");
const controlImportPreviewCount = document.querySelector("#control-import-preview-count");
const controlImportPreviewDateFrom = document.querySelector("#control-import-preview-date-from");
const controlImportPreviewDateTo = document.querySelector("#control-import-preview-date-to");
const controlImportPreviewTableBody = document.querySelector("#control-import-preview-table-body");
const controlImportPreviewFilters = document.querySelector("#control-import-preview-filters");
const controlImportPreviewDate = document.querySelector("#control-import-preview-date");
const controlImportPreviewCentro = document.querySelector("#control-import-preview-centro");
const controlImportPreviewConfirmButton = document.querySelector(
  "#control-import-preview-confirm-button"
);
const controlImportPreviewCancelButton = document.querySelector(
  "#control-import-preview-cancel-button"
);
const controlRefreshButton = document.querySelector("#control-refresh-button");
const controlTotalCount = document.querySelector("#control-total-count");
const controlPageCount = document.querySelector("#control-page-count");
const controlTotalHours = document.querySelector("#control-total-hours");
const controlSummaryTableBody = document.querySelector("#control-summary-table-body");
const controlRecordsTableBody = document.querySelector("#control-records-table-body");
const controlPaginationSummary = document.querySelector("#control-pagination-summary");
const controlPaginationPageIndicator = document.querySelector("#control-pagination-page-indicator");
const controlPreviousPageButton = document.querySelector("#control-previous-page-button");
const controlNextPageButton = document.querySelector("#control-next-page-button");
const controlPageSizeSelect = document.querySelector("#control-page-size-select");
const eventForm = document.querySelector("#event-form");
const eventIdInput = document.querySelector("#event-id");
const eventNameInput = document.querySelector("#event-name");
const eventInstallationSelect = document.querySelector("#event-installation");
const eventStartDateInput = document.querySelector("#event-start-date");
const eventEndDateInput = document.querySelector("#event-end-date");
const eventObservationsInput = document.querySelector("#event-observations");
const eventArchivedField = document.querySelector("#event-archived-field");
const eventArchivedInput = document.querySelector("#event-archived");
const eventDeleteButton = document.querySelector("#event-delete-button");
const openEventPanelButton = document.querySelector("#open-event-panel-button");
const eventPanel = document.querySelector("#event-panel");
const eventPanelBackdrop = document.querySelector("#event-panel-backdrop");
const closeEventPanelButton = document.querySelector("#close-event-panel-button");
const eventPanelTitle = document.querySelector("#event-panel-title");
const openEventSettingsButton = document.querySelector("#open-event-settings-button");
const eventSettingsPanel = document.querySelector("#event-settings-panel");
const eventSettingsPanelBackdrop = document.querySelector("#event-settings-panel-backdrop");
const closeEventSettingsPanelButton = document.querySelector("#close-event-settings-panel-button");
const eventAssemblyPersonnelFilter = document.querySelector("#event-assembly-personnel-filter");
const eventAssemblyAvailableSelect = document.querySelector("#event-assembly-available-select");
const eventAssemblySelectedSelect = document.querySelector("#event-assembly-selected-select");
const eventAssemblyAddButton = document.querySelector("#event-assembly-add-button");
const eventAssemblyRemoveButton = document.querySelector("#event-assembly-remove-button");
const eventInstallationFilter = document.querySelector("#event-installation-settings-filter");
const eventInstallationAvailableSelect = document.querySelector("#event-installation-available-select");
const eventInstallationSelectedSelect = document.querySelector("#event-installation-selected-select");
const eventInstallationAddButton = document.querySelector("#event-installation-add-button");
const eventInstallationRemoveButton = document.querySelector("#event-installation-remove-button");
const eventClearButton = document.querySelector("#event-clear-button");
const eventsRefreshButton = document.querySelector("#events-refresh-button");
const eventsFiltersForm = document.querySelector("#events-filters-form");
const eventFilterNameInput = document.querySelector("#event-filter-name");
const eventFilterInstallationSelect = document.querySelector("#event-filter-installation");
const eventFilterStartDateInput = document.querySelector("#event-filter-start-date");
const eventFilterIncludeArchivedInput = document.querySelector("#event-filter-include-archived");
const eventsTableBody = document.querySelector("#events-table-body");
const eventSchedulePanel = document.querySelector("#event-schedule-panel");
const eventSchedulePanelBackdrop = document.querySelector("#event-schedule-panel-backdrop");
const closeEventSchedulePanelButton = document.querySelector("#close-event-schedule-panel-button");
const eventScheduleTitle = document.querySelector("#event-schedule-title");
const eventScheduleForm = document.querySelector("#event-schedule-form");
const eventScheduleIdInput = document.querySelector("#event-schedule-id");
const eventScheduleEventSelect = document.querySelector("#event-schedule-event");
const eventScheduleDateInput = document.querySelector("#event-schedule-date");
const eventScheduleStartInput = document.querySelector("#event-schedule-start");
const eventScheduleEndInput = document.querySelector("#event-schedule-end");
const eventScheduleActivityInput = document.querySelector("#event-schedule-activity");
const eventScheduleNeedsTransportInput = document.querySelector("#event-schedule-needs-transport");
const eventScheduleTransportDetailField = document.querySelector("#event-schedule-transport-detail-field");
const eventScheduleTransportDetailInput = document.querySelector("#event-schedule-transport-detail");
const eventScheduleAvailablePersonnelSelect = document.querySelector("#event-schedule-available-personnel");
const eventScheduleSelectedPersonnelSelect = document.querySelector("#event-schedule-selected-personnel");
const eventScheduleAddPersonnelButton = document.querySelector("#event-schedule-add-personnel-button");
const eventScheduleRemovePersonnelButton = document.querySelector("#event-schedule-remove-personnel-button");
const eventScheduleDeleteButton = document.querySelector("#event-schedule-delete-button");
const programmingLoadBundledButton = document.querySelector("#programming-load-bundled-button");
const programmingImportButton = document.querySelector("#programming-import-button");
const programmingTypeSwitch = document.querySelector("#programming-type-switch");
const programmingImportPanel = document.querySelector("#programming-import-panel");
const programmingImportOverlay = document.querySelector("#programming-import-overlay");
const closeProgrammingImportButton = document.querySelector("#close-programming-import-button");
const programmingImportCancelButton = document.querySelector("#programming-import-cancel-button");
const programmingImportForm = document.querySelector("#programming-import-form");
const programmingImportFileInput = document.querySelector("#programming-import-file");
const programmingImportMonthInput = document.querySelector("#programming-import-month");
const programmingImportYearInput = document.querySelector("#programming-import-year");
const programmingImportTypeInput = document.querySelector("#programming-import-type");
const programmingImportPreview = document.querySelector("#programming-import-preview");
const programmingImportPreviewFilters = document.querySelector("#programming-import-preview-filters");
const programmingImportPreviewDate = document.querySelector("#programming-import-preview-date");
const programmingImportPreviewInstallation = document.querySelector(
  "#programming-import-preview-installation"
);
const programmingImportPreviewCount = document.querySelector("#programming-import-preview-count");
const programmingImportPreviewTableBody = document.querySelector(
  "#programming-import-preview-table-body"
);
const programmingImportClearPreviewButton = document.querySelector(
  "#programming-import-clear-preview-button"
);
const programmingImportInsertButton = document.querySelector("#programming-import-insert-button");
const programmingFiltersForm = document.querySelector("#programming-filters-form");
const programmingFilterDate = document.querySelector("#programming-filter-date");
const programmingFilterInstallation = document.querySelector("#programming-filter-installation");
const programmingFilterPersonal = document.querySelector("#programming-filter-personal");
const programmingFilterSport = document.querySelector("#programming-filter-sport");
const programmingFilterActivity = document.querySelector("#programming-filter-activity");
const programmingFilterIncludeArchived = document.querySelector(
  "#programming-filter-include-archived"
);
const programmingPanelEyebrow = document.querySelector("#programming-panel-eyebrow");
const programmingPanelTitle = document.querySelector("#programming-panel-title");
const programmingSourceName = document.querySelector("#programming-source-name");
const programmingTotalCount = document.querySelector("#programming-total-count");
const programmingInstallationCount = document.querySelector("#programming-installation-count");
const programmingPersonCount = document.querySelector("#programming-person-count");
const programmingDateFrom = document.querySelector("#programming-date-from");
const programmingDateTo = document.querySelector("#programming-date-to");
const programmingArchivedCount = document.querySelector("#programming-archived-count");
const programmingDownloadCsvButton = document.querySelector("#programming-download-csv-button");
const programmingCreateButton = document.querySelector("#programming-create-button");
const programmingUploadSupabaseButton = document.querySelector("#programming-upload-supabase-button");
const openProgrammingSettingsButton = document.querySelector("#open-programming-settings-button");
const programmingSettingsPanel = document.querySelector("#programming-settings-panel");
const programmingSettingsOverlay = document.querySelector("#programming-settings-overlay");
const closeProgrammingSettingsButton = document.querySelector("#close-programming-settings-button");
const programmingPersonnelFilter = document.querySelector("#programming-personnel-filter");
const programmingPersonnelAvailableSelect = document.querySelector(
  "#programming-personnel-available-select"
);
const programmingPersonnelSelectedSelect = document.querySelector(
  "#programming-personnel-selected-select"
);
const programmingPersonnelAddSelectedButton = document.querySelector(
  "#programming-personnel-add-selected-button"
);
const programmingPersonnelRemoveSelectedButton = document.querySelector(
  "#programming-personnel-remove-selected-button"
);
const programmingInstallationFilter = document.querySelector("#programming-installation-filter");
const programmingInstallationAvailableSelect = document.querySelector(
  "#programming-installation-available-select"
);
const programmingInstallationSelectedSelect = document.querySelector(
  "#programming-installation-selected-select"
);
const programmingInstallationAddSelectedButton = document.querySelector(
  "#programming-installation-add-selected-button"
);
const programmingInstallationRemoveSelectedButton = document.querySelector(
  "#programming-installation-remove-selected-button"
);
const programmingBulkPersonalSelect = document.querySelector("#programming-bulk-personal");
const programmingBulkAssignButton = document.querySelector("#programming-bulk-assign-button");
const programmingBulkInstallationInput = document.querySelector("#programming-bulk-installation");
const programmingBulkClearPersonalButton = document.querySelector(
  "#programming-bulk-clear-personal-button"
);
const programmingBulkClearInstallationButton = document.querySelector(
  "#programming-bulk-clear-installation-button"
);
const programmingBulkInstallationButton = document.querySelector(
  "#programming-bulk-installation-button"
);
const programmingOpenUnmatchedPersonnelButton = document.querySelector(
  "#programming-open-unmatched-personnel-button"
);
const programmingOpenUnmatchedInstallationButton = document.querySelector(
  "#programming-open-unmatched-installation-button"
);
const programmingUnmatchedPersonnelPanel = document.querySelector(
  "#programming-unmatched-personnel-panel"
);
const programmingUnmatchedPersonnelOverlay = document.querySelector(
  "#programming-unmatched-personnel-overlay"
);
const closeProgrammingUnmatchedPersonnelButton = document.querySelector(
  "#close-programming-unmatched-personnel-button"
);
const programmingUnmatchedPersonnelCount = document.querySelector(
  "#programming-unmatched-personnel-count"
);
const programmingUnmatchedPersonnelList = document.querySelector(
  "#programming-unmatched-personnel-list"
);
const programmingApplyUnmatchedPersonnelButton = document.querySelector(
  "#programming-apply-unmatched-personnel-button"
);
const programmingRefreshUnmatchedPersonnelButton = document.querySelector(
  "#programming-refresh-unmatched-personnel-button"
);
const programmingUnmatchedInstallationPanel = document.querySelector(
  "#programming-unmatched-installation-panel"
);
const programmingUnmatchedInstallationOverlay = document.querySelector(
  "#programming-unmatched-installation-overlay"
);
const closeProgrammingUnmatchedInstallationButton = document.querySelector(
  "#close-programming-unmatched-installation-button"
);
const programmingUnmatchedInstallationCount = document.querySelector(
  "#programming-unmatched-installation-count"
);
const programmingUnmatchedInstallationList = document.querySelector(
  "#programming-unmatched-installation-list"
);
const programmingApplyUnmatchedInstallationButton = document.querySelector(
  "#programming-apply-unmatched-installation-button"
);
const programmingRefreshUnmatchedInstallationButton = document.querySelector(
  "#programming-refresh-unmatched-installation-button"
);
const programmingInstallationOptionsList = document.querySelector("#programming-installation-options");
const programmingBulkAssignCount = document.querySelector("#programming-bulk-assign-count");
const programmingReportDateFromInput = document.querySelector("#programming-report-date-from");
const programmingReportDateToInput = document.querySelector("#programming-report-date-to");
const programmingReportPdfButton = document.querySelector("#programming-report-pdf-button");
const programmingDownloadImagesButton = document.querySelector("#programming-download-images-button");
const programmingEnableSelectiveArchiveButton = document.querySelector(
  "#programming-enable-selective-archive-button"
);
const programmingArchiveSelectedButton = document.querySelector("#programming-archive-selected-button");
const programmingUnarchiveSelectedButton = document.querySelector(
  "#programming-unarchive-selected-button"
);
const programmingCancelSelectiveArchiveButton = document.querySelector(
  "#programming-cancel-selective-archive-button"
);
const programmingSelectedArchiveCount = document.querySelector(
  "#programming-selected-archive-count"
);
const programmingEnableSelectiveDeleteButton = document.querySelector(
  "#programming-enable-selective-delete-button"
);
const programmingDeleteSelectedButton = document.querySelector("#programming-delete-selected-button");
const programmingCancelSelectiveDeleteButton = document.querySelector(
  "#programming-cancel-selective-delete-button"
);
const programmingSelectedDeleteCount = document.querySelector("#programming-selected-delete-count");
const programmingPreviewTableBody = document.querySelector("#programming-preview-table-body");
const programmingSelectHeader = document.querySelector("#programming-select-header");
const programmingSelectPageCheckbox = document.querySelector("#programming-select-page-checkbox");
const programmingPaginationSummary = document.querySelector("#programming-pagination-summary");
const programmingPaginationPageIndicator = document.querySelector(
  "#programming-pagination-page-indicator"
);
const programmingPreviousPageButton = document.querySelector(
  "#programming-previous-page-button"
);
const programmingNextPageButton = document.querySelector("#programming-next-page-button");
const programmingPageSizeSelect = document.querySelector("#programming-page-size-select");
const controlDetailPanel = document.querySelector("#control-detail-panel");
const controlDetailOverlay = document.querySelector("#control-detail-overlay");
const closeControlDetailButton = document.querySelector("#close-control-detail-button");
const controlTotalsPanel = document.querySelector("#control-totals-panel");
const controlTotalsOverlay = document.querySelector("#control-totals-overlay");
const closeControlTotalsButton = document.querySelector("#close-control-totals-button");
const controlTotalsPersonCount = document.querySelector("#control-totals-person-count");
const controlTotalsRecordCount = document.querySelector("#control-totals-record-count");
const controlTotalsHours = document.querySelector("#control-totals-hours");
const controlTotalsFilterSummary = document.querySelector("#control-totals-filter-summary");
const controlTotalsReportContent = document.querySelector("#control-totals-report-content");
const controlDetailForm = document.querySelector("#control-detail-form");
const controlDetailIdInput = document.querySelector("#control-detail-id");
const controlDetailPersonalInput = document.querySelector("#control-detail-personal");
const controlDetailDniInput = document.querySelector("#control-detail-dni");
const controlDetailCentroInput = document.querySelector("#control-detail-centro");
const controlDetailPuestoInput = document.querySelector("#control-detail-puesto");
const controlDetailFechaInput = document.querySelector("#control-detail-fecha");
const controlDetailHoraInicioInput = document.querySelector("#control-detail-hora-inicio");
const controlDetailHoraFinInput = document.querySelector("#control-detail-hora-fin");
const controlDetailTipoJornadaInput = document.querySelector("#control-detail-tipo-jornada");
const controlDetailObservacionInput = document.querySelector("#control-detail-observacion");
const controlDetailDeleteButton = document.querySelector("#control-detail-delete-button");
const programmingDetailPanel = document.querySelector("#programming-detail-panel");
const programmingDetailOverlay = document.querySelector("#programming-detail-overlay");
const closeProgrammingDetailButton = document.querySelector("#close-programming-detail-button");
const programmingDetailForm = document.querySelector("#programming-detail-form");
const programmingDetailTitle = document.querySelector("#programming-detail-title");
const programmingDetailModeInput = document.querySelector("#programming-detail-mode");
const programmingDetailIdInput = document.querySelector("#programming-detail-id");
const programmingDetailPersonalInput = document.querySelector("#programming-detail-personal");
const programmingDetailTypeInput = document.querySelector("#programming-detail-type");
const programmingDetailInstallationInput = document.querySelector("#programming-detail-installation");
const programmingDetailDateInput = document.querySelector("#programming-detail-date");
const programmingDetailStartInput = document.querySelector("#programming-detail-start");
const programmingDetailEndInput = document.querySelector("#programming-detail-end");
const programmingDetailEventTimeInput = document.querySelector("#programming-detail-event-time");
const programmingDetailSportInput = document.querySelector("#programming-detail-sport");
const programmingDetailActivityInput = document.querySelector("#programming-detail-activity");
const programmingDetailArchivedInput = document.querySelector("#programming-detail-archived");
const programmingDetailArchiveButton = document.querySelector("#programming-detail-archive-button");
const programmingDetailDeleteButton = document.querySelector("#programming-detail-delete-button");
const candidateDetailPanel = document.querySelector("#candidate-detail-panel");
const detailOverlay = document.querySelector("#detail-overlay");
const closeDetailButton = document.querySelector("#close-detail-button");
const detailForm = document.querySelector("#detail-form");
const detailTitle = document.querySelector("#detail-title");
const detailIdInput = document.querySelector("#detail-id");
const detailFullNameInput = document.querySelector("#detail-full-name");
const detailPhoneInput = document.querySelector("#detail-phone");
const detailEmailInput = document.querySelector("#detail-email");
const detailRegistrationDateInput = document.querySelector("#detail-registration-date");
const detailStatusInput = document.querySelector("#detail-status");
const detailSportRoleCheckbox = document.querySelector("#detail-sport-role");
const detailSportSpecialtiesGroup = document.querySelector("#detail-sport-specialties-group");
const detailTagsInput = document.querySelector("#detail-tags");
const detailNotesInput = document.querySelector("#detail-notes");
const detailObservationsInput = document.querySelector("#detail-observations");
const detailAttachmentNameInput = document.querySelector("#detail-attachment-name");
const detailAttachmentFileInput = document.querySelector("#detail-attachment-file");
const detailRemoveAttachmentInput = document.querySelector("#detail-remove-attachment");
const detailVacancyConsentInput = document.querySelector("#detail-vacancy-consent");
const detailEditButton = document.querySelector("#detail-edit-button");
const detailSaveButton = document.querySelector("#detail-save-button");
const detailDeleteButton = document.querySelector("#detail-delete-button");
const publicToast = document.querySelector("#public-toast");

let selectedCandidateTags = [];
let currentCandidates = [];
let filteredCandidates = [];
let candidateTotalCount = 0;
let candidateFilteredCount = 0;
let candidateFilterOptions = { roles: [], tags: [] };
let candidateFilterOptionsLoaded = false;
let candidateFilterOptionsPromise = null;
let selectedCandidateIds = new Set();
let currentSession = null;
let supabaseClient = null;
let supabaseAuthListenerBound = false;
let candidateFetchRequestId = 0;
let controlRecordsFetchRequestId = 0;
let controlFilterOptionsRequestId = 0;
let controlPersonalLookupPromise = null;
let controlPersonalLookupLoaded = false;
let jsPdfModulePromise = null;
let jsZipModulePromise = null;
let mammothModulePromise = null;
let detailEditMode = false;
let currentSort = {
  field: "registration_date",
  direction: "desc",
};
let currentPage = 1;
let pageSize = Number(pageSizeSelect?.value || 25);
let currentControlRecords = [];
let filteredControlRecords = [];
let controlFilterSourceRecords = [];
let currentPersonalByDni = new Map();
let currentControlPersonnelRows = [];
let currentAllControlPersonnel = [];
let controlRecordsTotalCount = 0;
let controlRecordsTotalMinutes = 0;
let controlResultsTruncated = false;
let controlCurrentPage = 1;
let controlPageSize = Number(controlPageSizeSelect?.value || 25);
let controlSummaryRows = [];
let controlSelectiveDeleteMode = false;
let selectedControlDeleteIds = new Set();
let currentControlSort = {
  field: "fecha",
  direction: "desc",
};
let currentControlPersonalOptions = [];
let pendingControlImport = null;
let filteredControlImportRecords = [];
let currentProgrammingRows = [];
let filteredProgrammingRows = [];
let currentProgrammingSourceName = "";
let currentProgrammingCanUpload = false;
let pendingProgrammingImportRows = [];
let filteredProgrammingImportRows = [];
let pendingProgrammingImportSourceName = "";
let programmingCurrentPage = 1;
let programmingPageSize = Number(programmingPageSizeSelect?.value || 25);
let programmingSortCriteria = [{ field: "fecha", direction: "asc" }];
let programmingSelectiveDeleteMode = false;
let programmingSelectionMode = "";
let currentProgrammingType = PROGRAMMING_TYPE_FS;
let selectedProgrammingDeleteIds = new Set();
let currentProgrammingPersonnel = [];
let programmingPersonnelCatalogRows = [];
let programmingInstallationCatalogRows = [];
let currentProgrammingAssignedInstallations = [];
let currentProgrammingActiveInstallations = [];
let programmingUnmatchedPersonnelProposals = [];
let programmingUnmatchedInstallationProposals = [];
let ignoredProgrammingUnmatchedPersonnelKeys = new Set();
let ignoredProgrammingUnmatchedInstallationKeys = new Set();
let eventsCatalogsLoaded = false;
let eventAllInstallationRows = [];
let eventInstallationRows = [];
let eventPersonnelRows = [];
let eventAssemblyPersonnelIds = new Set();
let eventAssignedInstallationIds = new Set();
let currentEvents = [];
let currentEventScheduleRows = [];
let currentEventSchedulePersonnelRows = [];
let currentEventScheduleSelectedPersonnelIds = new Set();
let currentSelectedEventId = "";
let expandedEventIds = new Set();
let eventSortCriteria = [{ field: "fecha_inicio", direction: "desc" }];
let currentPanelTarget = getInitialPanelTarget();
let currentPrivateTabTarget = getInitialPrivateTabTarget();
let lastSuggestedBulkPersonal = "";
let lastSuggestedBulkInstallation = "";
let publicToastTimeout = null;

function debounce(callback, wait = 250) {
  let timeoutId = 0;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}

function invalidateCandidateFilterOptions() {
  candidateFilterOptionsLoaded = false;
  candidateFilterOptionsPromise = null;
}

function invalidateControlLookupCaches() {
  controlPersonalLookupLoaded = false;
  controlPersonalLookupPromise = null;
}

const formBaselineSnapshots = new WeakMap();

function getFormSnapshot(form) {
  if (!form) {
    return "";
  }

  const fields = Array.from(form.querySelectorAll("input, select, textarea")).map((field) => {
    const key = field.id || field.name || field.type;
    if (field.type === "checkbox" || field.type === "radio") {
      return [key, field.checked];
    }
    if (field.type === "file") {
      return [key, Array.from(field.files || []).map((file) => `${file.name}:${file.size}`)];
    }
    if (field.multiple) {
      return [key, Array.from(field.selectedOptions || []).map((option) => option.value)];
    }
    return [key, field.value ?? ""];
  });

  return JSON.stringify(fields);
}

function markFormPristine(form) {
  if (form) {
    formBaselineSnapshots.set(form, getFormSnapshot(form));
  }
}

function hasUnsavedFormChanges(form) {
  return Boolean(form) && formBaselineSnapshots.get(form) !== getFormSnapshot(form);
}

function confirmDiscardFormChanges(form) {
  if (!hasUnsavedFormChanges(form)) {
    return true;
  }

  return window.confirm("Hay cambios sin guardar. ¿Cerrar sin guardar los cambios?");
}

function hasVisibleUnsavedFormChanges() {
  return Array.from(document.querySelectorAll(".detail-panel:not(.hidden) form")).some(
    hasUnsavedFormChanges
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeTag(tag) {
  return String(tag ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

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

function sortTextValues(values) {
  return [...values].sort((left, right) =>
    String(left).localeCompare(String(right), "es", { sensitivity: "base", numeric: true })
  );
}

function normalizeSportSpecialties(values) {
  const specialties = Array.isArray(values) ? [...values] : [];
  const hasTennis = specialties.includes("Tenis");
  const hasPadel = specialties.includes("Padel");
  const filtered = specialties
    .filter((item) => item !== "Tenis" && item !== "Padel")
    .map(formatCandidateOptionLabel);

  if (hasTennis || hasPadel) {
    filtered.push("Tenis y pádel");
  }

  return Array.from(new Set(filtered));
}

function formatCandidateOptionLabel(value) {
  if (value === "Tecnico Informatico/imagen y sonido") {
    return "Técnico Informático/imagen y sonido";
  }

  const labelMap = {
    Conserjeria: "Conserjería",
    "Monitorado acuatico": "Monitorado acuático",
    "Sala de musculacion": "Sala de musculación",
    "Tenis y padel": "Tenis y pádel",
  };
  return labelMap[value] || value;
}

function formatRoles(row) {
  const roles = Array.isArray(row.job_roles) ? [...row.job_roles] : [];
  const specialties = normalizeSportSpecialties(row.sport_specialties);

  return roles.map((role) => {
    if (role === "Monitorado deportivo" && specialties.length) {
      return `${role} (${specialties.join(", ")})`;
    }

    return formatCandidateOptionLabel(role);
  });
}

function normalizeCandidateStatus(status) {
  return CANDIDATE_STATUS_OPTIONS.includes(status) ? status : "Pendiente";
}

function getCandidateStatusClass(status) {
  const normalized = normalizeCandidateStatus(status).toLowerCase();
  return `status-${normalized.replaceAll(" ", "-")}`;
}

function getSortableCandidateValue(candidate, field) {
  if (field === "job_roles") {
    return formatRoles(candidate).join(", ");
  }

  if (field === "candidate_status") {
    return normalizeCandidateStatus(candidate.candidate_status);
  }

  return candidate[field] ?? "";
}

function compareCandidateValues(left, right, field) {
  const leftValue = getSortableCandidateValue(left, field);
  const rightValue = getSortableCandidateValue(right, field);

  if (field === "registration_date") {
    return String(leftValue).localeCompare(String(rightValue), "es");
  }

  return String(leftValue).localeCompare(String(rightValue), "es", {
    numeric: true,
    sensitivity: "base",
  });
}

function sortCandidates(rows) {
  const directionMultiplier = currentSort.direction === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const result = compareCandidateValues(left, right, currentSort.field);
    if (result !== 0) {
      return result * directionMultiplier;
    }

    return compareCandidateValues(left, right, "created_at") * -1;
  });
}

function syncSortButtons() {
  document.querySelectorAll("[data-sort-field]").forEach((button) => {
    const isActive = button.dataset.sortField === currentSort.field;
    button.classList.toggle("active", isActive);
    button.classList.toggle("sort-asc", isActive && currentSort.direction === "asc");
    button.classList.toggle("sort-desc", isActive && currentSort.direction === "desc");
  });
}

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

function setStatus(message, tone = "default") {
  statusMessage.textContent = message;
  statusMessage.className = "status-message";

  if (tone !== "default") {
    statusMessage.classList.add(tone);
  }
}

function switchPanel(target) {
  currentPanelTarget = target;
  const showPublic = target === "public";
  publicPanel.classList.toggle("hidden", !showPublic);
  privatePanel.classList.toggle("hidden", showPublic);
  document.querySelector(".public-hero")?.classList.toggle("hidden", !showPublic);
}

function getInitialPanelTarget() {
  return isCoordinationPanel ? "private" : "public";
}

function normalizePrivateTabTarget(target) {
  return PRIVATE_TAB_TARGETS.has(target) ? target : "programming";
}

function getInitialPrivateTabTarget() {
  try {
    return normalizePrivateTabTarget(window.localStorage?.getItem(PRIVATE_TAB_STORAGE_KEY));
  } catch (_error) {
    return "programming";
  }
}

function bindPanelNavigation() {
  if (isCoordinationPanel) {
    showPublicPanelButton?.classList.remove("hidden");
  }
  window.addEventListener("hashchange", () => switchPanel(getInitialPanelTarget()));
}

function togglePrivateView(isLoggedIn, email = "") {
  loginView.classList.toggle("hidden", isLoggedIn);
  loginForm?.classList.remove("hidden");
  passwordRecoveryForm?.classList.add("hidden");
  inviteSetupForm?.classList.add("hidden");
  privateView.classList.toggle("hidden", !isLoggedIn);
  sessionEmail.textContent = isLoggedIn
    ? `Sesion iniciada${email ? `: ${email}` : ""}`
    : "";
}

function showPasswordRecoveryView() {
  loginForm?.classList.add("hidden");
  inviteSetupForm?.classList.add("hidden");
  passwordRecoveryForm?.classList.remove("hidden");
  passwordRecoveryEmailInput.value = document.querySelector("#login-email")?.value.trim() || "";
  passwordRecoveryEmailInput.focus();
}

function showLoginFormView() {
  passwordRecoveryForm?.classList.add("hidden");
  inviteSetupForm?.classList.add("hidden");
  loginForm?.classList.remove("hidden");
}

function showInviteSetupView(email = "") {
  switchPanel("private");
  loginView.classList.remove("hidden");
  privateView.classList.add("hidden");
  loginForm?.classList.add("hidden");
  passwordRecoveryForm?.classList.add("hidden");
  inviteSetupForm?.classList.remove("hidden");
  sessionEmail.textContent = email ? `Invitacion para ${email}` : "";
}

function getAuthUrlType() {
  if (INITIAL_AUTH_URL_TYPE) {
    return INITIAL_AUTH_URL_TYPE;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return searchParams.get("type") || hashParams.get("type") || "";
}

function clearAuthUrl() {
  if (window.SupabaseApp?.clearAuthUrl) {
    return window.SupabaseApp.clearAuthUrl();
  }
  if (!window.location.search && !window.location.hash) {
    return;
  }
  window.history.replaceState({}, document.title, window.location.pathname);
}

function switchPrivateTab(target) {
  const normalizedTarget = normalizePrivateTabTarget(target);
  currentPrivateTabTarget = normalizedTarget;
  try {
    window.localStorage?.setItem(PRIVATE_TAB_STORAGE_KEY, normalizedTarget);
  } catch (_error) {
    // Storage can be unavailable in some embedded/private contexts.
  }

  const showSearch = normalizedTarget === "search";
  const showControl = normalizedTarget === "control";
  const showEvents = normalizedTarget === "events";
  const showProgramming = normalizedTarget === "programming";

  privateTabPanelSearch.classList.toggle("hidden", !showSearch);
  privateTabPanelControl.classList.toggle("hidden", !showControl);
  privateTabPanelEvents?.classList.toggle("hidden", !showEvents);
  privateTabPanelProgramming.classList.toggle("hidden", !showProgramming);
  privateTabSearchButton.classList.toggle("active", showSearch);
  privateTabControlButton.classList.toggle("active", showControl);
  privateTabEventsButton?.classList.toggle("active", showEvents);
  privateTabProgrammingButton.classList.toggle("active", showProgramming);
  privateTabSearchButton.setAttribute("aria-pressed", String(showSearch));
  privateTabControlButton.setAttribute("aria-pressed", String(showControl));
  privateTabEventsButton?.setAttribute("aria-pressed", String(showEvents));
  privateTabProgrammingButton.setAttribute("aria-pressed", String(showProgramming));
  syncProgrammingTypeUi();
}

function showPublicToastMessage(message) {
  if (!publicToast) {
    return;
  }

  publicToast.textContent = message;
  publicToast.classList.remove("hidden");

  if (publicToastTimeout) {
    window.clearTimeout(publicToastTimeout);
  }

  publicToastTimeout = window.setTimeout(() => {
    publicToast.classList.add("hidden");
  }, 3200);
}

/**
 * Delegamos al cliente compartido (shared/supabase-client.js).
 * Mantiene supabaseClient y currentSession sincronizados para compatibilidad
 * con el código existente que los lee directamente.
 */
async function getSupabaseClient() {
  if (window.SupabaseApp) {
    const client = await window.SupabaseApp.getClient();
    supabaseClient = client; // sincronizar variable local
    return client;
  }

  // Fallback: instancia local (sin shared)
  if (!hasSupabaseConfig) {
    throw new Error("Falta la configuracion de Supabase en config.js.");
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey);

  if (!supabaseAuthListenerBound) {
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentSession = session;
    });
    supabaseAuthListenerBound = true;
  }

  return supabaseClient;
}

async function ensurePrivateSession(options = {}) {
  if (window.SupabaseApp) {
    const session = await window.SupabaseApp.ensureSession(options);
    currentSession = session; // sincronizar variable local
    return session;
  }

  // Fallback local
  const { silent = false } = options;
  const supabase = await getSupabaseClient();

  if (currentSession) {
    return currentSession;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    currentSession = session;
    return session;
  }

  if (silent) {
    return null;
  }

  throw new Error("No hay una sesión activa de Supabase.");
}

async function getJsPdfClient() {
  if (jsPdfModulePromise) {
    return jsPdfModulePromise;
  }

  jsPdfModulePromise = import("https://esm.sh/jspdf@2.5.1");
  return jsPdfModulePromise;
}

async function getJsZipClient() {
  if (jsZipModulePromise) {
    return jsZipModulePromise;
  }

  jsZipModulePromise = import("https://esm.sh/jszip@3.10.1");
  return jsZipModulePromise;
}

async function getMammothClient() {
  if (window.mammoth?.convertToHtml) {
    return window.mammoth;
  }

  if (!mammothModulePromise) {
    mammothModulePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/mammoth@1.8.0/mammoth.browser.min.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("No se pudo cargar el lector de Word. Revisa la conexion e intentalo de nuevo."));
      document.head.appendChild(script);
    });
  }

  await mammothModulePromise;

  if (!window.mammoth?.convertToHtml) {
    throw new Error("No se pudo cargar el lector de Word. Revisa la conexion e intentalo de nuevo.");
  }

  return window.mammoth;
}

function sanitizeFileName(name) {
  return String(name ?? "archivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "curriculum";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function downloadAttachment(candidateId) {
  const row = currentCandidates.find((candidate) => candidate.id === candidateId);
  if (!row) {
    setStatus("No se encontró la candidatura asociada al archivo.", "error");
    return;
  }

  if (!currentSession) {
    setStatus("Necesitas iniciar sesión para descargar archivos.", "error");
    return;
  }

  if (!row.attachment_path) {
    setStatus("No se encontró el currículum adjunto.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(supabaseConfig.bucket)
    .download(row.attachment_path);

  if (error || !data) {
    setStatus(`No se pudo descargar el archivo: ${error?.message ?? "error desconocido"}`, "error");
    return;
  }

  triggerDownload(data, row.attachment_name);
}

function getVisibleCandidates() {
  return filteredCandidates;
}

function getSelectedCandidates() {
  return currentCandidates.filter((candidate) => selectedCandidateIds.has(candidate.id));
}

function syncSelectionUi(visibleRows = []) {
  const selectedVisibleCount = visibleRows.filter((candidate) =>
    selectedCandidateIds.has(candidate.id)
  ).length;

  exportSelectedPdfButton.disabled = selectedCandidateIds.size === 0;
  selectAllCandidatesCheckbox.disabled = visibleRows.length === 0;
  selectAllCandidatesCheckbox.checked =
    visibleRows.length > 0 && selectedVisibleCount === visibleRows.length;
  selectAllCandidatesCheckbox.indeterminate =
    selectedVisibleCount > 0 && selectedVisibleCount < visibleRows.length;
}

function renderCandidateClampedCell(value) {
  const text = String(value ?? "");
  return `<span class="candidate-cell-clamp" title="${escapeHtml(text)}">${escapeHtml(text)}</span>`;
}

function renderCandidates(rows) {
  if (!rows.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="12" class="empty-state">No hay datos cargados todavia.</td>
      </tr>
    `;
    syncSelectionUi([]);
    return;
  }

  tableBody.innerHTML = rows
    .map((row) => {
      const roles = formatRoles(row).join(", ");
      const tags = Array.isArray(row.tags) ? row.tags.join(", ") : "";
      const status = normalizeCandidateStatus(row.candidate_status);
      const isSelected = selectedCandidateIds.has(row.id);
      const attachmentCell = row.attachment_name
        ? `<button type="button" class="tag-chip warm-button" data-download-id="${escapeHtml(row.id)}">${escapeHtml(
            row.attachment_name
          )}</button>`
        : "";

      return `
        <tr>
          <td class="select-column">
            <input
              type="checkbox"
              class="row-selector"
              data-select-candidate-id="${escapeHtml(row.id)}"
              ${isSelected ? "checked" : ""}
            />
          </td>
          <td>
            <div class="action-buttons">
              <button type="button" class="secondary-button table-action" data-view-id="${escapeHtml(row.id)}">Ver</button>
            </div>
          </td>
          <td>${renderCandidateClampedCell(row.registration_date || "")}</td>
          <td><span class="status-badge ${getCandidateStatusClass(status)}">${escapeHtml(status)}</span></td>
          <td>${renderCandidateClampedCell(row.full_name)}</td>
          <td>${renderCandidateClampedCell(row.phone)}</td>
          <td>${renderCandidateClampedCell(row.email)}</td>
          <td>${renderCandidateClampedCell(roles)}</td>
          <td>${renderCandidateClampedCell(tags)}</td>
          <td>${attachmentCell}</td>
          <td>${renderCandidateClampedCell(row.notes || "")}</td>
          <td>${renderCandidateClampedCell(row.observations || "")}</td>
        </tr>
      `;
    })
    .join("");

  syncSelectionUi(rows);
}

function getTotalPages(totalItems) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

function getPaginatedCandidates(rows) {
  const totalPages = getTotalPages(rows.length);
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return rows.slice(startIndex, endIndex);
}

function updatePaginationUi(totalItems) {
  const totalPages = getTotalPages(totalItems);
  const hasItems = totalItems > 0;
  const start = hasItems ? (currentPage - 1) * pageSize + 1 : 0;
  const end = hasItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  paginationSummary.textContent = `Mostrando ${start}-${end} de ${totalItems}`;
  paginationPageIndicator.textContent = `Página ${currentPage} de ${totalPages}`;
  previousPageButton.disabled = currentPage <= 1;
  nextPageButton.disabled = currentPage >= totalPages;
}

function formatHourValue(value) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, 8) : "";
}

function formatDisplayDate(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }

  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return normalized;
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function calculateWorkedHours(start, end) {
  const startValue = formatHourValue(start);
  const endValue = formatHourValue(end);

  if (!startValue || !endValue) {
    return "";
  }

  const [startHour = 0, startMinute = 0, startSecond = 0] = startValue
    .split(":")
    .map((part) => Number(part));
  const [endHour = 0, endMinute = 0, endSecond = 0] = endValue
    .split(":")
    .map((part) => Number(part));

  const startSeconds = startHour * 3600 + startMinute * 60 + startSecond;
  let endSeconds = endHour * 3600 + endMinute * 60 + endSecond;

  if (Number.isNaN(startSeconds) || Number.isNaN(endSeconds)) {
    return "";
  }

  if (endSeconds < startSeconds) {
    endSeconds += 24 * 60 * 60;
  }

  const totalMinutes = Math.round((endSeconds - startSeconds) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function calculateWorkedMinutes(start, end) {
  const startValue = formatHourValue(start);
  const endValue = formatHourValue(end);

  if (!startValue || !endValue) {
    return 0;
  }

  const [startHour = 0, startMinute = 0, startSecond = 0] = startValue
    .split(":")
    .map((part) => Number(part));
  const [endHour = 0, endMinute = 0, endSecond = 0] = endValue
    .split(":")
    .map((part) => Number(part));

  const startSeconds = startHour * 3600 + startMinute * 60 + startSecond;
  let endSeconds = endHour * 3600 + endMinute * 60 + endSecond;

  if (Number.isNaN(startSeconds) || Number.isNaN(endSeconds)) {
    return 0;
  }

  if (endSeconds < startSeconds) {
    endSeconds += 24 * 60 * 60;
  }

  return Math.round((endSeconds - startSeconds) / 60);
}

function formatMinutesAsHours(totalMinutes) {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatControlMonthLabel(monthKey) {
  const normalized = String(monthKey ?? "").trim();
  const match = normalized.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return normalized;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  const label = date.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getControlWeekKey(value) {
  const normalized = normalizeImportedDate(value) || String(value ?? "").trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return {
      key: normalized || "sin_fecha",
      label: normalized ? formatDisplayDate(normalized) : "Sin fecha",
    };
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(year, monthIndex, Number(match[3]));
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);
  const day = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);
  const weekStart = monday < monthStart ? monthStart : monday;
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekEnd = sunday > monthEnd ? monthEnd : sunday;
  const formatIso = (nextDate) =>
    `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(
      nextDate.getDate()
    ).padStart(2, "0")}`;
  const start = formatIso(weekStart);
  const end = formatIso(weekEnd);
  const firstDayOffset = monthStart.getDay() || 7;
  const weekNumber = Math.ceil((date.getDate() + firstDayOffset - 1) / 7);

  return {
    key: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(weekNumber).padStart(2, "0")}`,
    label: `${formatControlMonthLabel(`${year}-${String(monthIndex + 1).padStart(2, "0")}`)} - semana ${weekNumber} (${formatDisplayDate(start)} - ${formatDisplayDate(end)})`,
  };
}

function buildControlTotalsFilterSummary(filters) {
  const parts = [];

  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ? formatDisplayDate(filters.dateFrom) : "inicio";
    const to = filters.dateTo ? formatDisplayDate(filters.dateTo) : "hoy";
    parts.push(`Periodo: ${from} - ${to}`);
  } else {
    parts.push("Periodo: todos los registros cargados");
  }

  if (filters.personal) {
    parts.push(`Personal: ${filters.personal}`);
  }

  if (filters.centro) {
    parts.push(`Centro: ${filters.centro}`);
  }

  if (filters.puesto) {
    parts.push(`Puesto: ${filters.puesto}`);
  }

  return parts.join(" · ");
}

function getControlWeekdayClass(value) {
  const rawValue = String(value ?? "").trim();
  const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const localMatch = rawValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!isoMatch && !localMatch) {
    return "";
  }

  const [, year, month, day] = isoMatch
    ? isoMatch
    : [null, localMatch[3], localMatch[2], localMatch[1]];
  const weekday = new Date(Number(year), Number(month) - 1, Number(day)).getDay();
  return `control-weekday-${weekday}`;
}

function getControlWeekdayInfo(value) {
  const weekdayClass = getControlWeekdayClass(value);
  const weekday = Number(weekdayClass.replace("control-weekday-", ""));
  const weekdays = {
    0: { label: "Domingo", letter: "D", color: "#111827" },
    1: { label: "Lunes", letter: "L", color: "#ffffff" },
    2: { label: "Martes", letter: "M", color: "#ffd84d" },
    3: { label: "Miercoles", letter: "X", color: "#f59e0b" },
    4: { label: "Jueves", letter: "J", color: "#22c55e" },
    5: { label: "Viernes", letter: "V", color: "#2563eb" },
    6: { label: "Sabado", letter: "S", color: "#8b5e34" },
  };

  return {
    className: weekdayClass,
    ...(weekdays[weekday] ?? { label: "Día sin identificar", letter: "-", color: "#001f54" }),
  };
}

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
  const pageSize = 1000;
  const maxRows = 60000;
  let offset = 0;
  const rows = [];

  while (offset < maxRows) {
    let query = supabase
      .from("registros")
      .select(
        "id, personal, dni, centro, puesto, fecha, hora_inicio, hora_fin, tipo_jornada, observacion, eliminado, control"
      )
      .range(offset, offset + pageSize - 1);
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

    if (data.length < pageSize) {
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

function renderFilterOptions() {
  const roles = candidateFilterOptions.roles;
  const tags = candidateFilterOptions.tags;
  const selectedRole = filterRoleSelect.value;
  const selectedTag = filterTagSelect.value;
  const selectedStatus = filterStatusSelect.value;

  filterRoleSelect.innerHTML = ['<option value="">Todos los puestos</option>']
    .concat(roles.map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(role)}</option>`))
    .join("");

  filterTagSelect.innerHTML = ['<option value="">Todas las etiquetas</option>']
    .concat(tags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`))
    .join("");

  filterStatusSelect.innerHTML = ['<option value="">Todos los estados</option>']
    .concat(
      CANDIDATE_STATUS_OPTIONS.map(
        (status) => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`
      )
    )
    .join("");

  if (roles.includes(selectedRole)) {
    filterRoleSelect.value = selectedRole;
  }

  if (tags.includes(selectedTag)) {
    filterTagSelect.value = selectedTag;
  }

  if (CANDIDATE_STATUS_OPTIONS.includes(selectedStatus)) {
    filterStatusSelect.value = selectedStatus;
  }
}

function renderTagSelect() {
  const tags = candidateFilterOptions.tags;
  const currentValue = tagSelect.value;
  const options = ['<option value="">Selecciona una etiqueta</option>']
    .concat(
      tags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`)
    )
    .join("");

  tagSelect.innerHTML = options;

  if (tags.includes(currentValue)) {
    tagSelect.value = currentValue;
  }
}

function renderSelectedTags() {
  if (!selectedCandidateTags.length) {
    selectedTagsContainer.className = "tag-cloud empty-cloud";
    selectedTagsContainer.textContent = "Sin etiquetas asignadas.";
    return;
  }

  selectedTagsContainer.className = "tag-cloud";
  selectedTagsContainer.innerHTML = selectedCandidateTags
    .map(
      (tag) => `
        <button type="button" class="tag-chip active-tag" data-remove-tag="${escapeHtml(tag)}">
          ${escapeHtml(tag)}
        </button>
      `
    )
    .join("");
}

function renderAvailableTags() {
  const tags = candidateFilterOptions.tags;

  if (!tags.length) {
    availableTagsContainer.className = "tag-cloud empty-cloud";
    availableTagsContainer.textContent = "Aun no hay etiquetas creadas.";
    return;
  }

  availableTagsContainer.className = "tag-cloud";
  availableTagsContainer.innerHTML = tags
    .map((tag) => {
      const isSelected = selectedCandidateTags.includes(tag);
      const className = isSelected ? "tag-chip active-tag" : "tag-chip";
      return `
        <button type="button" class="${className}" data-tag-cloud="${escapeHtml(tag)}">
          ${escapeHtml(tag)}
        </button>
      `;
    })
    .join("");
}

function syncTagsUi() {
  renderTagSelect();
  renderSelectedTags();
  renderAvailableTags();
}

function updateResultsSummary() {
  totalCandidatesCount.textContent = String(candidateTotalCount);
  filteredCandidatesCount.textContent = String(candidateFilteredCount);
}

function candidateMatchesFilters(candidate, filters) {
  const searchHaystack = [
    candidate.full_name,
    candidate.phone,
    candidate.email,
    candidate.notes,
    candidate.observations,
    ...(Array.isArray(candidate.job_roles) ? candidate.job_roles : []),
    ...(Array.isArray(candidate.tags) ? candidate.tags : []),
    ...(Array.isArray(candidate.sport_specialties) ? candidate.sport_specialties : []),
    candidate.candidate_status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (filters.search && !searchHaystack.includes(filters.search)) {
    return false;
  }

  if (
    filters.role &&
    !(Array.isArray(candidate.job_roles) && candidate.job_roles.includes(filters.role))
  ) {
    return false;
  }

  if (
    filters.tag &&
    !(Array.isArray(candidate.tags) && candidate.tags.includes(filters.tag))
  ) {
    return false;
  }

  if (filters.status && normalizeCandidateStatus(candidate.candidate_status) !== filters.status) {
    return false;
  }

  if (filters.dateFrom && String(candidate.registration_date || "") < filters.dateFrom) {
    return false;
  }

  if (filters.dateTo && String(candidate.registration_date || "") > filters.dateTo) {
    return false;
  }

  if (filters.hasCv && !candidate.attachment_name) {
    return false;
  }

  return true;
}

function buildCandidateFilters() {
  return {
    search: filterSearchInput.value.trim(),
    role: filterRoleSelect.value,
    tag: filterTagSelect.value,
    status: filterStatusSelect.value,
    dateFrom: filterDateFromInput.value,
    dateTo: filterDateToInput.value,
    hasCv: filterHasCvInput.checked,
  };
}

function applyCandidateFiltersToQuery(query, filters) {
  if (filters.search) {
    const search = filters.search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.or(
      [
        `full_name.ilike.%${search}%`,
        `phone.ilike.%${search}%`,
        `email.ilike.%${search}%`,
        `notes.ilike.%${search}%`,
        `observations.ilike.%${search}%`,
      ].join(",")
    );
  }

  if (filters.role) {
    query = query.contains("job_roles", [filters.role]);
  }

  if (filters.tag) {
    query = query.contains("tags", [filters.tag]);
  }

  if (filters.status) {
    query = query.eq("candidate_status", filters.status);
  }

  if (filters.dateFrom) {
    query = query.gte("registration_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("registration_date", filters.dateTo);
  }

  if (filters.hasCv) {
    query = query.not("attachment_name", "is", null);
  }

  return query;
}

function applyCandidateSortToQuery(query) {
  const columnMap = {
    registration_date: "registration_date",
    candidate_status: "candidate_status",
    full_name: "full_name",
    phone: "phone",
    email: "email",
  };
  const primaryColumn = columnMap[currentSort.field] || "registration_date";
  const ascending = currentSort.direction === "asc";
  query = query.order(primaryColumn, { ascending });

  if (primaryColumn !== "created_at") {
    query = query.order("created_at", { ascending: false });
  }

  return query;
}

async function fetchCandidateFilterOptions(supabase, options = {}) {
  const { force = false } = options;
  if (!force && candidateFilterOptionsLoaded) {
    return candidateFilterOptions;
  }

  if (!force && candidateFilterOptionsPromise) {
    return candidateFilterOptionsPromise;
  }

  candidateFilterOptionsPromise = (async () => {
    const { data, error } = await supabase.rpc("get_candidate_filter_options");

    if (error) {
      throw error;
    }

    candidateFilterOptions = {
      roles: sortTextValues(
        (data ?? [])
          .filter((row) => row.option_type === "role")
          .map((row) => String(row.option_value ?? "").trim())
          .filter(Boolean)
      ),
      tags: sortTextValues(
        (data ?? [])
          .filter((row) => row.option_type === "tag")
          .map((row) => normalizeTag(row.option_value))
          .filter(Boolean)
      ),
    };
    candidateFilterOptionsLoaded = true;
    renderFilterOptions();
    return candidateFilterOptions;
  })();

  try {
    return await candidateFilterOptionsPromise;
  } finally {
    candidateFilterOptionsPromise = null;
  }
}

async function fetchAllFilteredCandidates() {
  if (!currentSession) {
    return [];
  }

  const supabase = await getSupabaseClient();
  const filters = buildCandidateFilters();
  const chunkSize = 1000;
  const rows = [];

  for (let from = 0; ; from += chunkSize) {
    let query = supabase
      .from("candidates")
      .select(CANDIDATE_SELECT_COLUMNS)
      .range(from, from + chunkSize - 1);
    query = applyCandidateFiltersToQuery(query, filters);
    query = applyCandidateSortToQuery(query);

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    rows.push(...(data ?? []));

    if (!data || data.length < chunkSize) {
      return currentSort.field === "job_roles" ? sortCandidates(rows) : rows;
    }
  }
}

async function fetchSelectedCandidates() {
  const ids = [...selectedCandidateIds];
  if (!ids.length) {
    return [];
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("candidates")
    .select(CANDIDATE_SELECT_COLUMNS)
    .in("id", ids);

  if (error) {
    throw error;
  }

  return sortCandidates(data ?? []);
}

function applyCandidateFilters() {
  void fetchCandidates();
}

function clearFilters() {
  filtersForm.reset();
  currentPage = 1;
  applyCandidateFilters();
}

function resetSingleCandidateFilter(filterName) {
  const control = filtersForm?.elements?.[filterName];

  if (!control) {
    return;
  }

  if (control.type === "checkbox") {
    control.checked = false;
  } else {
    control.value = "";
  }

  currentPage = 1;
  applyCandidateFilters();
}

function toCsvValue(value) {
  const normalized = String(value ?? "").replaceAll('"', '""');
  return `"${normalized}"`;
}

function getCandidateById(candidateId) {
  return currentCandidates.find((candidate) => candidate.id === candidateId) ?? null;
}

function setDetailEditMode(enabled) {
  detailEditMode = enabled;
  detailTitle.textContent = enabled ? "Editar candidatura" : "Detalle de candidatura";
  const fields = [
    detailFullNameInput,
    detailPhoneInput,
    detailEmailInput,
    detailRegistrationDateInput,
    detailStatusInput,
    detailTagsInput,
    detailNotesInput,
    detailObservationsInput,
    detailAttachmentFileInput,
    detailRemoveAttachmentInput,
    detailVacancyConsentInput,
    ...detailForm.querySelectorAll('input[name="detail_roles"]'),
    ...detailForm.querySelectorAll('input[name="detail_sport_specialties"]'),
  ];

  fields.forEach((field) => {
    field.disabled = !enabled;
  });

  detailSaveButton.disabled = !enabled;
  detailEditButton.disabled = enabled;
}

function populateDetailForm(candidate) {
  detailIdInput.value = candidate.id;
  detailFullNameInput.value = candidate.full_name ?? "";
  detailPhoneInput.value = candidate.phone ?? "";
  detailEmailInput.value = candidate.email ?? "";
  detailRegistrationDateInput.value = candidate.registration_date ?? "";
  detailStatusInput.value = normalizeCandidateStatus(candidate.candidate_status);
  detailTagsInput.value = Array.isArray(candidate.tags) ? candidate.tags.join(", ") : "";
  detailNotesInput.value = candidate.notes ?? "";
  detailObservationsInput.value = candidate.observations ?? "";
  detailAttachmentNameInput.value = candidate.attachment_name ?? "";
  detailAttachmentFileInput.value = "";
  detailRemoveAttachmentInput.checked = false;
  detailVacancyConsentInput.checked = Boolean(candidate.vacancy_consent);

  detailForm.querySelectorAll('input[name="detail_roles"]').forEach((checkbox) => {
    checkbox.checked =
      Array.isArray(candidate.job_roles) && candidate.job_roles.includes(checkbox.value);
  });
  detailForm
    .querySelectorAll('input[name="detail_sport_specialties"]')
    .forEach((checkbox) => {
      checkbox.checked =
        Array.isArray(candidate.sport_specialties) &&
        candidate.sport_specialties.includes(checkbox.value);
    });

  syncSportSpecialtiesVisibilityFor(
    detailForm,
    detailSportRoleCheckbox,
    detailSportSpecialtiesGroup,
    "detail_sport_specialties"
  );
}

function openCandidateDetail(candidateId, editMode = false) {
  const candidate = getCandidateById(candidateId);
  if (!candidate) {
    setStatus("No se encontró la candidatura seleccionada.", "error");
    return;
  }

  switchPrivateTab("search");
  populateDetailForm(candidate);
  setDetailEditMode(editMode);
  markFormPristine(detailForm);
  candidateDetailPanel.classList.remove("hidden");
}

function closeCandidateDetail(options = {}) {
  if (!options.force && !confirmDiscardFormChanges(detailForm)) {
    return false;
  }

  candidateDetailPanel.classList.add("hidden");
  detailForm.reset();
  setDetailEditMode(false);
  markFormPristine(detailForm);
  return true;
}

async function saveCandidateDetail(event) {
  event.preventDefault();

  if (!detailEditMode) {
    return;
  }

  const candidateId = detailIdInput.value;
  const currentCandidate = getCandidateById(candidateId);
  const selectedRoles = Array.from(
    detailForm.querySelectorAll('input[name="detail_roles"]:checked')
  ).map((checkbox) => checkbox.value);
  const selectedSpecialties = Array.from(
    detailForm.querySelectorAll('input[name="detail_sport_specialties"]:checked')
  ).map((checkbox) => checkbox.value);
  const normalizedSpecialties = normalizeSportSpecialties(selectedSpecialties);

  if (!selectedRoles.length) {
    setStatus("Selecciona al menos un puesto en la ficha.", "error");
    return;
  }

  if (selectedRoles.includes("Monitorado deportivo") && !normalizedSpecialties.length) {
    setStatus("Marca al menos una modalidad deportiva en la ficha.", "error");
    return;
  }

  const tags = detailTagsInput.value
    .split(",")
    .map(normalizeTag)
    .filter(Boolean);
  const replacementFile = detailAttachmentFileInput.files?.[0];
  const removeCurrentAttachment = detailRemoveAttachmentInput.checked;

  const updatePayload = {
    full_name: detailFullNameInput.value.trim(),
    phone: detailPhoneInput.value.trim(),
    email: detailEmailInput.value.trim(),
    registration_date: detailRegistrationDateInput.value,
    candidate_status: normalizeCandidateStatus(detailStatusInput.value),
    job_roles: selectedRoles,
    sport_specialties: normalizedSpecialties,
    tags: Array.from(new Set(tags)),
    notes: detailNotesInput.value.trim(),
    observations: detailObservationsInput.value.trim(),
    vacancy_consent: detailVacancyConsentInput.checked,
  };

  let uploadedReplacementPath = "";
  let previousAttachmentPathToRemove = "";

  try {
    if (replacementFile) {
      uploadedReplacementPath = await uploadFileToSupabase(
        candidateId,
        currentCandidate?.source ?? "private",
        replacementFile
      );
      updatePayload.attachment_name = replacementFile.name;
      updatePayload.attachment_path = uploadedReplacementPath;
      updatePayload.attachment_mime_type = replacementFile.type ?? "";
      previousAttachmentPathToRemove = currentCandidate?.attachment_path ?? "";
    } else if (removeCurrentAttachment && currentCandidate?.attachment_path) {
      updatePayload.attachment_name = "";
      updatePayload.attachment_path = "";
      updatePayload.attachment_mime_type = "";
      previousAttachmentPathToRemove = currentCandidate.attachment_path;
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("candidates").update(updatePayload).eq("id", candidateId);

    if (error) {
      if (uploadedReplacementPath) {
        await supabase.storage.from(supabaseConfig.bucket).remove([uploadedReplacementPath]);
      }
      const policyHint =
        error.code === "42501"
          ? " Revisa las policies de update en public.candidates y ejecuta de nuevo supabase/schema.sql."
          : "";
      setStatus(
        `No se pudo actualizar la candidatura: ${error.message}.${policyHint}`,
        "error"
      );
      return;
    }

    if (previousAttachmentPathToRemove) {
      const shouldRemovePrevious =
        removeCurrentAttachment ||
        (replacementFile && previousAttachmentPathToRemove !== uploadedReplacementPath);

      if (shouldRemovePrevious) {
        const { error: storageError } = await supabase.storage
          .from(supabaseConfig.bucket)
          .remove([previousAttachmentPathToRemove]);

        if (storageError) {
          setStatus(
            `La candidatura se actualizó, pero no se pudo borrar el currículum anterior: ${storageError.message}`,
            "error"
          );
          invalidateCandidateFilterOptions();
          await fetchCandidates();
          openCandidateDetail(candidateId, false);
          return;
        }
      }
    }

    invalidateCandidateFilterOptions();
    await fetchCandidates();
    openCandidateDetail(candidateId, false);
    setStatus("Candidatura actualizada correctamente.", "success");
  } catch (error) {
    setStatus(`No se pudo actualizar la candidatura: ${error.message}`, "error");
  }
}

async function deleteCandidate(candidateId) {
  const candidate = getCandidateById(candidateId);
  if (!candidate) {
    setStatus("No se encontró la candidatura seleccionada.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Vas a borrar la candidatura de ${candidate.full_name}. Esta accion no se puede deshacer.`
  );

  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();

  if (candidate.attachment_path) {
    const { error: storageError } = await supabase.storage
      .from(supabaseConfig.bucket)
      .remove([candidate.attachment_path]);

    if (storageError) {
      setStatus(`No se pudo borrar el CV adjunto: ${storageError.message}`, "error");
      return;
    }
  }

  const { error } = await supabase.from("candidates").delete().eq("id", candidateId);

  if (error) {
    const policyHint =
      error.code === "42501"
        ? " Revisa las policies de delete en public.candidates y ejecuta de nuevo supabase/schema.sql."
        : "";
    setStatus(`No se pudo borrar la candidatura: ${error.message}.${policyHint}`, "error");
    return;
  }

  if (detailIdInput.value === candidateId) {
    closeCandidateDetail({ force: true });
  }

  invalidateCandidateFilterOptions();
  await fetchCandidates();
  setStatus("Candidatura borrada correctamente.", "success");
}

function exportFilteredCandidatesToCsv() {
  void (async () => {
    try {
      setStatus("Preparando CSV de candidaturas...");
      const candidates = await fetchAllFilteredCandidates();
      if (!candidates.length) {
        setStatus("No hay resultados filtrados para exportar.", "error");
        return;
      }

  const headers = [
    "Fecha",
    "Nombre",
    "Teléfono",
    "Correo",
    "Estado",
    "Puestos",
    "Etiquetas",
    "CV",
    "Consentimiento privacidad",
    "Consentimiento vacantes",
    "Notas",
    "Observaciones",
    "Origen",
  ];
  const rows = candidates.map((candidate) => {
    return [
      candidate.registration_date || "",
      candidate.full_name,
      candidate.phone,
      candidate.email,
      normalizeCandidateStatus(candidate.candidate_status),
      formatRoles(candidate).join(", "),
      Array.isArray(candidate.tags) ? candidate.tags.join(", ") : "",
      candidate.attachment_name || "",
      candidate.privacy_accepted ? "si" : "no",
      candidate.vacancy_consent ? "si" : "no",
      candidate.notes || "",
      candidate.observations || "",
      candidate.source || "",
    ]
      .map(toCsvValue)
      .join(",");
  });
  const csvContent = [headers.map(toCsvValue).join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const dateSuffix = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `candidaturas-${dateSuffix}.csv`);
  setStatus("CSV exportado correctamente.", "success");
    } catch (error) {
      setStatus(`No se pudo exportar el CSV: ${error.message}`, "error");
    }
  })();
}

function exportSelectedCandidatesToPdf() {
  if (!selectedCandidateIds.size) {
    setStatus("Selecciona al menos una candidatura para exportar el PDF.", "error");
    return;
  }

  void (async () => {
    try {
      const selectedCandidates = await fetchSelectedCandidates();
      if (!selectedCandidates.length) {
        setStatus("Selecciona al menos una candidatura para exportar el PDF.", "error");
        return;
      }

      const { jsPDF } = await getJsPdfClient();
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const left = 15;
      const right = 15;
      const maxWidth = pageWidth - left - right;
      const lineHeight = 6;
      let y = 18;

      const ensureSpace = (requiredHeight) => {
        if (y + requiredHeight <= pageHeight - 15) {
          return;
        }

        doc.addPage();
        y = 18;
      };

      const writeWrappedText = (label, value) => {
        const content = `${label}: ${value || "-"}`;
        const lines = doc.splitTextToSize(content, maxWidth);
        ensureSpace(lines.length * lineHeight + 2);
        doc.text(lines, left, y);
        y += lines.length * lineHeight + 2;
      };

      const issueDate = new Date().toLocaleDateString("es-ES");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Listado de candidaturas seleccionadas", left, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Fecha de emision: ${issueDate}   Total candidaturas: ${selectedCandidates.length}`,
        left,
        y
      );
      y += 10;

      selectedCandidates.forEach((candidate, index) => {
        const roles = formatRoles(candidate).join(", ");
        const blockHeight = 34;
        ensureSpace(blockHeight);

        doc.setDrawColor(219, 225, 234);
        doc.roundedRect(left, y - 5, maxWidth, blockHeight, 3, 3);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${candidate.full_name || "-"}`, left + 4, y + 2);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        writeWrappedText("Teléfono", candidate.phone);
        writeWrappedText("Correo electrónico", candidate.email);
        writeWrappedText("Puestos y subpuestos", roles);
        y += 3;
      });

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`candidaturas-seleccionadas-${fileDate}.pdf`);
      setStatus("PDF generado correctamente.", "success");
    } catch (error) {
      setStatus(
        `No se pudo generar el PDF: ${error?.message ?? "error desconocido"}`,
        "error"
      );
    }
  })();
}

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

function parseCsvText(text, delimiter = ",") {
  const rows = [];
  let currentCell = "";
  let currentRow = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      if (currentRow.some((value) => String(value).trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  if (currentRow.some((value) => String(value).trim() !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

function detectCsvDelimiter(text) {
  const firstLine = String(text ?? "").split(/\r?\n/, 1)[0] || "";
  const candidates = [",", ";", "\t"];
  let bestDelimiter = ",";
  let bestCount = -1;
  let inQuotes = false;

  candidates.forEach((delimiter) => {
    let count = 0;

    for (let index = 0; index < firstLine.length; index += 1) {
      const char = firstLine[index];
      const nextChar = firstLine[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === delimiter && !inQuotes) {
        count += 1;
      }
    }

    if (count > bestCount) {
      bestDelimiter = delimiter;
      bestCount = count;
    }

    inQuotes = false;
  });

  return bestDelimiter;
}

function normalizeCsvHeader(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeImportedDate(value) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

   const isoDateTimeMatch = rawValue.match(/^(\d{4}-\d{2}-\d{2})[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/);
  if (isoDateTimeMatch) {
    return isoDateTimeMatch[1];
  }

  const dateMatch = rawValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const localDateTimeMatch = rawValue.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})[ T]\d{1,2}:\d{2}(?::\d{2})?$/
  );
  if (localDateTimeMatch) {
    const [, day, month, year] = localDateTimeMatch;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return rawValue;
}

function normalizeImportedTime(value) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) {
    return null;
  }

  if (/^0{1,2}[/-]0?1[/-]1900$/.test(rawValue)) {
    return "00:00:00";
  }

  const dateTimeMatch = rawValue.match(
    /^(?:\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );
  if (dateTimeMatch) {
    const [, hour, minute, second = "00"] = dateTimeMatch;
    return `${String(hour).padStart(2, "0")}:${minute}:${second}`;
  }

  const timeMatch = rawValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  const decimalTimeMatch = rawValue.match(/^(\d{1,2})[,.](\d{2})$/);
  if (!timeMatch && !decimalTimeMatch) {
    return rawValue;
  }

  const [, hour, minute, second = "00"] = timeMatch ?? decimalTimeMatch;
  return `${String(hour).padStart(2, "0")}:${minute}:${second}`;
}

function normalizeImportedTimestamp(value) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return `${rawValue}T00:00:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(rawValue)) {
    return rawValue.replace(" ", "T");
  }

  const dateMatch = rawValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00`;
  }

  const dateTimeMatch = rawValue.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+|\s*T)(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!dateTimeMatch) {
    return rawValue;
  }

  const [, day, month, year, hour, minute, second = "00"] = dateTimeMatch;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${minute}:${second}`;
}

function normalizeImportedBoolean(value) {
  const rawValue = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "si", "sí", "yes", "y"].includes(rawValue);
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

function resetProgrammingPreview() {
  currentProgrammingRows = [];
  filteredProgrammingRows = [];
  currentProgrammingSourceName = "";
  currentProgrammingCanUpload = false;
  programmingCurrentPage = 1;
  programmingSelectiveDeleteMode = false;
  programmingSelectionMode = "";
  selectedProgrammingDeleteIds.clear();
  if (programmingSourceName) {
    programmingSourceName.textContent = "-";
  }
  programmingTotalCount.textContent = "0";
  programmingInstallationCount.textContent = "0";
  programmingPersonCount.textContent = "0";
  programmingDateFrom.textContent = "-";
  programmingDateTo.textContent = "-";
  programmingArchivedCount.textContent = "0";
  programmingPreviewTableBody.innerHTML = `
    <tr>
      <td colspan="12" class="empty-state">Carga un Word o CSV para previsualizar la programación.</td>
    </tr>
  `;
  programmingDownloadCsvButton.disabled = true;
  programmingUploadSupabaseButton?.classList.add("hidden");
  updateProgrammingPaginationUi(0);
  syncProgrammingBulkAssignmentUi();
}

function normalizeProgrammingHeader(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeProgrammingCell(value) {
  return String(value ?? "").trim().replace(/\r\n/g, "\n");
}

function mapProgrammingRow(row, headers) {
  const source = {};
  headers.forEach((header, index) => {
    source[header] = row[index] ?? "";
  });

  return {
    id: "",
    personal: normalizeProgrammingCell(source.personal),
    instalacion: normalizeProgrammingCell(source.instalacion),
    fecha: normalizeProgrammingCell(source.fecha),
    inicio: normalizeProgrammingCell(source.inici),
    fin: normalizeProgrammingCell(source.fin),
    hora: normalizeProgrammingCell(source.hora),
    deporte: normalizeProgrammingCell(source.deporte),
    actividad: normalizeProgrammingCell(source.actividad),
    archived: false,
    sortOrder: 0,
  };
}

function normalizeProgrammingRows(text) {
  const rows = parseCsvText(text, ";");
  if (rows.length < 2) {
    return [];
  }

  const normalizedHeaders = rows[0].map((value) => normalizeProgrammingHeader(value));
  const requiredHeaders = [
    "personal",
    "instalacion",
    "fecha",
    "inici.",
    "fin",
    "hora",
    "deporte",
    "actividad",
  ].map((value) => normalizeProgrammingHeader(value));

  const missingHeaders = requiredHeaders.filter((header) => !normalizedHeaders.includes(header));
  if (missingHeaders.length) {
    throw new Error(`Faltan columnas obligatorias: ${missingHeaders.join(", ")}.`);
  }

  return rows
    .slice(1)
    .map((row) => mapProgrammingRow(row, normalizedHeaders))
    .filter((row) => Object.values(row).some(Boolean));
}

function normalizeProgrammingWordText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeProgrammingWordTime(value) {
  const normalized = normalizeImportedTime(normalizeProgrammingWordText(value));
  return normalized ? normalized.slice(0, 5) : "";
}

function buildProgrammingWordDate(dayValue, monthValue, yearValue) {
  const dayMatch = normalizeProgrammingWordText(dayValue).match(/\b(\d{1,2})\b/);
  const month = Number(monthValue);
  const year = Number(yearValue);

  if (!dayMatch || !Number.isInteger(month) || !Number.isInteger(year)) {
    return "";
  }

  const day = Number(dayMatch[1]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getProgrammingImportPeriod() {
  const month = Number(programmingImportMonthInput?.value);
  const year = Number(programmingImportYearInput?.value);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Selecciona un mes valido para el Word.");
  }

  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new Error("Selecciona un año valido para el Word.");
  }

  return { month, year };
}

function getProgrammingImportType() {
  return normalizeProgrammingType(
    programmingImportTypeInput?.value || getDefaultProgrammingTypeForNewRows()
  );
}

function extractProgrammingRowsFromWordHtml(html, { month, year }) {
  const documentHtml = new DOMParser().parseFromString(html, "text/html");
  const rows = [];
  let currentInstallation = "";

  Array.from(documentHtml.body.children).forEach((element) => {
    if (element.matches("table")) {
      const installation = currentInstallation || "Sin instalación";
      const tableRows = Array.from(element.querySelectorAll("tr"));

      tableRows.forEach((tableRow) => {
        const cells = Array.from(tableRow.querySelectorAll("th, td")).map((cell) =>
          normalizeProgrammingWordText(cell.textContent)
        );

        if (cells.length < 6 || cells.every((cell) => !cell)) {
          return;
        }

        const [dayText, startText, endText, eventText, sportText, activityText] = cells;
        if (!/\d{1,2}/.test(dayText)) {
          return;
        }

        const fecha = buildProgrammingWordDate(dayText, month, year);
        const inicio = normalizeProgrammingWordTime(startText);
        if (!fecha || !inicio) {
          return;
        }

        rows.push({
          id: "",
          previewId: `word-${rows.length + 1}`,
          personal: "",
          instalacion: installation,
          fecha,
          inicio,
          fin: normalizeProgrammingWordTime(endText),
          hora: normalizeProgrammingWordTime(eventText),
          deporte: sportText,
          actividad: activityText,
          archived: false,
          sortOrder: rows.length + 1,
        });
      });

      return;
    }

    const text = normalizeProgrammingWordText(element.textContent);
    if (text) {
      currentInstallation = text;
    }
  });

  return rows;
}

function openProgrammingImportPanel() {
  const now = new Date();
  if (programmingImportMonthInput && !programmingImportMonthInput.value) {
    programmingImportMonthInput.value = String(now.getMonth() + 1);
  } else if (programmingImportMonthInput) {
    programmingImportMonthInput.value = String(now.getMonth() + 1);
  }
  if (programmingImportYearInput) {
    programmingImportYearInput.value = String(now.getFullYear());
  }
  if (programmingImportTypeInput) {
    programmingImportTypeInput.value = getDefaultProgrammingTypeForNewRows();
  }
  programmingImportPanel?.classList.remove("hidden");
}

function closeProgrammingImportPanel() {
  programmingImportPanel?.classList.add("hidden");
  programmingImportForm?.reset();
  resetProgrammingImportPreview();
}

function resetProgrammingImportPreview() {
  pendingProgrammingImportRows = [];
  filteredProgrammingImportRows = [];
  pendingProgrammingImportSourceName = "";
  programmingImportPreview?.classList.add("hidden");
  if (programmingImportPreviewDate) {
    programmingImportPreviewDate.innerHTML = '<option value="">Todas las fechas</option>';
  }
  if (programmingImportPreviewInstallation) {
    programmingImportPreviewInstallation.innerHTML =
      '<option value="">Todas las instalaciones</option>';
  }
  if (programmingImportPreviewCount) {
    programmingImportPreviewCount.textContent = "0 filtrados";
  }
  if (programmingImportPreviewTableBody) {
    programmingImportPreviewTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">Procesa un Word o CSV para revisar los registros.</td>
      </tr>
    `;
  }
  if (programmingImportInsertButton) {
    programmingImportInsertButton.disabled = true;
  }
}

function renderProgrammingImportPreviewFilters() {
  const currentDate = programmingImportPreviewDate?.value ?? "";
  const currentInstallation = programmingImportPreviewInstallation?.value ?? "";
  const dates = Array.from(
    new Set(pendingProgrammingImportRows.map((row) => normalizeImportedDate(row.fecha)).filter(Boolean))
  ).sort();
  const dateScopedRows = currentDate
    ? pendingProgrammingImportRows.filter((row) => normalizeImportedDate(row.fecha) === currentDate)
    : pendingProgrammingImportRows;
  const installations = sortTextValues(
    Array.from(new Set(dateScopedRows.map((row) => row.instalacion).filter(Boolean)))
  );

  if (programmingImportPreviewDate) {
    programmingImportPreviewDate.innerHTML = ['<option value="">Todas las fechas</option>']
      .concat(
        dates.map(
          (date) => `<option value="${escapeHtml(date)}">${escapeHtml(formatDisplayDate(date))}</option>`
        )
      )
      .join("");
    programmingImportPreviewDate.value = dates.includes(currentDate) ? currentDate : "";
  }

  if (programmingImportPreviewInstallation) {
    programmingImportPreviewInstallation.innerHTML = [
      '<option value="">Todas las instalaciones</option>',
    ]
      .concat(
        installations.map(
          (installation) =>
            `<option value="${escapeHtml(installation)}">${escapeHtml(installation)}</option>`
        )
      )
      .join("");
    programmingImportPreviewInstallation.value = installations.includes(currentInstallation)
      ? currentInstallation
      : "";
  }
}

function applyProgrammingImportPreviewFilters() {
  const selectedDate = programmingImportPreviewDate?.value ?? "";
  const selectedInstallation = programmingImportPreviewInstallation?.value ?? "";
  filteredProgrammingImportRows = pendingProgrammingImportRows.filter((row) => {
    if (selectedDate && normalizeImportedDate(row.fecha) !== selectedDate) {
      return false;
    }
    if (selectedInstallation && row.instalacion !== selectedInstallation) {
      return false;
    }
    return true;
  });

  if (programmingImportPreviewCount) {
    programmingImportPreviewCount.textContent = `${filteredProgrammingImportRows.length} filtrado${
      filteredProgrammingImportRows.length === 1 ? "" : "s"
    } de ${pendingProgrammingImportRows.length}`;
  }
  if (programmingImportInsertButton) {
    programmingImportInsertButton.disabled = filteredProgrammingImportRows.length === 0;
  }

  if (!programmingImportPreviewTableBody) {
    return;
  }

  programmingImportPreviewTableBody.innerHTML = filteredProgrammingImportRows.length
    ? filteredProgrammingImportRows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.personal)}</td>
              <td>${escapeHtml(row.instalacion)}</td>
              <td>${escapeHtml(formatDisplayDate(normalizeImportedDate(row.fecha) || row.fecha))}</td>
              <td>${escapeHtml(row.inicio)}</td>
              <td>${escapeHtml(row.fin)}</td>
              <td>${escapeHtml(row.hora)}</td>
              <td>${escapeHtml(row.deporte)}</td>
              <td>${escapeHtml(row.actividad)}</td>
            </tr>
          `
        )
        .join("")
    : `
      <tr>
        <td colspan="8" class="empty-state">No hay registros para los filtros actuales.</td>
      </tr>
    `;
}

function renderProgrammingImportPreview(rows, sourceName) {
  pendingProgrammingImportRows = rows;
  pendingProgrammingImportSourceName = sourceName;
  programmingImportPreview?.classList.remove("hidden");
  renderProgrammingImportPreviewFilters();
  applyProgrammingImportPreviewFilters();
}

function isProgrammingCsvFile(file) {
  return String(file?.name ?? "").toLowerCase().endsWith(".csv") || file?.type === "text/csv";
}

async function prepareProgrammingImportCsv(file) {
  if (!file) {
    return;
  }

  const text = await file.text();
  const rows = normalizeProgrammingRows(text);

  if (!rows.length) {
    throw new Error("No se encontraron filas validas en el CSV.");
  }

  renderProgrammingImportPreview(rows, file.name);
}

async function prepareProgrammingWordFile(file) {
  if (!file) {
    return;
  }

  const period = getProgrammingImportPeriod();
  const arrayBuffer = await file.arrayBuffer();
  const mammoth = await getMammothClient();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rows = extractProgrammingRowsFromWordHtml(result.value, period);

  if (!rows.length) {
    throw new Error("No se encontraron filas validas en las tablas del Word.");
  }

  renderProgrammingImportPreview(rows, file.name);
}

function getProgrammingTotalPages(totalItems) {
  return Math.max(1, Math.ceil(totalItems / programmingPageSize));
}

function getPaginatedProgrammingRows(rows) {
  const totalPages = getProgrammingTotalPages(rows.length);
  programmingCurrentPage = Math.min(Math.max(programmingCurrentPage, 1), totalPages);
  const startIndex = (programmingCurrentPage - 1) * programmingPageSize;
  const endIndex = startIndex + programmingPageSize;
  return rows.slice(startIndex, endIndex);
}

function updateProgrammingPaginationUi(totalItems) {
  const totalPages = getProgrammingTotalPages(totalItems);
  const hasItems = totalItems > 0;
  const start = hasItems ? (programmingCurrentPage - 1) * programmingPageSize + 1 : 0;
  const end = hasItems ? Math.min(programmingCurrentPage * programmingPageSize, totalItems) : 0;

  programmingPaginationSummary.textContent = `Mostrando ${start}-${end} de ${totalItems}`;
  programmingPaginationPageIndicator.textContent = `Página ${programmingCurrentPage} de ${totalPages}`;
  programmingPreviousPageButton.disabled = programmingCurrentPage <= 1;
  programmingNextPageButton.disabled = programmingCurrentPage >= totalPages;
}

function formatProgrammingDateInputValue(value) {
  return normalizeImportedDate(value) || "";
}

function formatProgrammingTimeInputValue(value) {
  const normalized = normalizeImportedTime(value);
  return normalized ? normalized.slice(0, 5) : "";
}

function normalizeProgrammingText(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getProgrammingTextDistance(left, right) {
  const source = normalizeProgrammingText(left);
  const target = normalizeProgrammingText(right);
  if (!source) {
    return target.length;
  }
  if (!target) {
    return source.length;
  }

  const previous = Array.from({ length: target.length + 1 }, (_value, index) => index);
  const current = Array(target.length + 1).fill(0);

  for (let sourceIndex = 1; sourceIndex <= source.length; sourceIndex += 1) {
    current[0] = sourceIndex;
    for (let targetIndex = 1; targetIndex <= target.length; targetIndex += 1) {
      const substitutionCost = source[sourceIndex - 1] === target[targetIndex - 1] ? 0 : 1;
      current[targetIndex] = Math.min(
        previous[targetIndex] + 1,
        current[targetIndex - 1] + 1,
        previous[targetIndex - 1] + substitutionCost
      );
    }
    for (let index = 0; index <= target.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[target.length];
}

function findClosestProgrammingInstallationName(sourceName) {
  const normalizedSource = normalizeProgrammingText(sourceName);
  if (!normalizedSource) {
    return "";
  }

  const options = sortTextValues(currentProgrammingActiveInstallations);
  if (!options.length) {
    return "";
  }

  return options
    .map((option) => {
      const normalizedOption = normalizeProgrammingText(option);
      const containsBonus =
        normalizedOption.includes(normalizedSource) || normalizedSource.includes(normalizedOption)
          ? -0.35
          : 0;
      const distance = getProgrammingTextDistance(normalizedSource, normalizedOption);
      const ratio = distance / Math.max(normalizedSource.length, normalizedOption.length, 1);
      return { option, score: ratio + containsBonus };
    })
    .sort((left, right) => left.score - right.score || left.option.localeCompare(right.option, "es"))[0]
    ?.option ?? "";
}

function findClosestProgrammingInstallationCatalogName(sourceName) {
  const normalizedSource = normalizeProgrammingText(sourceName);
  if (!normalizedSource) {
    return "";
  }

  const options = sortTextValues(
    programmingInstallationCatalogRows
      .filter((row) => row.activo)
      .map((row) => normalizeProgrammingCell(row.instalacion))
      .filter(Boolean)
  );
  if (!options.length) {
    return "";
  }

  return options
    .map((option) => {
      const normalizedOption = normalizeProgrammingText(option);
      const containsBonus =
        normalizedOption.includes(normalizedSource) || normalizedSource.includes(normalizedOption)
          ? -0.35
          : 0;
      const distance = getProgrammingTextDistance(normalizedSource, normalizedOption);
      const ratio = distance / Math.max(normalizedSource.length, normalizedOption.length, 1);
      return { option, score: ratio + containsBonus };
    })
    .sort((left, right) => left.score - right.score || left.option.localeCompare(right.option, "es"))[0]
    ?.option ?? "";
}

function findClosestProgrammingPersonnelName(sourceName) {
  const normalizedSource = normalizeProgrammingText(sourceName);
  if (!normalizedSource) {
    return "";
  }

  const options = getProgrammingPersonnelNames().filter(
    (name) => name !== PROGRAMMING_UNASSIGNED_PERSONAL
  );
  if (!options.length) {
    return "";
  }

  return options
    .map((option) => {
      const normalizedOption = normalizeProgrammingText(option);
      const containsBonus =
        normalizedOption.includes(normalizedSource) || normalizedSource.includes(normalizedOption)
          ? -0.35
          : 0;
      const distance = getProgrammingTextDistance(normalizedSource, normalizedOption);
      const ratio = distance / Math.max(normalizedSource.length, normalizedOption.length, 1);
      return { option, score: ratio + containsBonus };
    })
    .sort((left, right) => left.score - right.score || left.option.localeCompare(right.option, "es"))[0]
    ?.option ?? "";
}

function findClosestProgrammingPersonnelCatalogName(sourceName) {
  const normalizedSource = normalizeProgrammingText(sourceName);
  if (!normalizedSource) {
    return "";
  }

  const options = sortTextValues(
    programmingPersonnelCatalogRows.map((row) => normalizeProgrammingPersonnelName(row.personal)).filter(Boolean)
  );
  if (!options.length) {
    return "";
  }

  return options
    .map((option) => {
      const normalizedOption = normalizeProgrammingText(option);
      const containsBonus =
        normalizedOption.includes(normalizedSource) || normalizedSource.includes(normalizedOption)
          ? -0.35
          : 0;
      const distance = getProgrammingTextDistance(normalizedSource, normalizedOption);
      const ratio = distance / Math.max(normalizedSource.length, normalizedOption.length, 1);
      return { option, score: ratio + containsBonus };
    })
    .sort((left, right) => left.score - right.score || left.option.localeCompare(right.option, "es"))[0]
    ?.option ?? "";
}

function getProgrammingSortValue(row, field) {
  if (field === "fecha") {
    return normalizeImportedDate(row.fecha) || "";
  }

  if (["inicio", "fin", "hora"].includes(field)) {
    return normalizeImportedTime(row[field]) || "";
  }

  if (field === "archived") {
    return row.archived ? "1" : "0";
  }

  return String(row[field] ?? "");
}

function sortProgrammingRows(rows) {
  return [...rows].sort((left, right) => {
    for (const criterion of programmingSortCriteria) {
      const leftValue = getProgrammingSortValue(left, criterion.field);
      const rightValue = getProgrammingSortValue(right, criterion.field);
      const comparison = leftValue.localeCompare(rightValue, "es", {
        sensitivity: "base",
        numeric: true,
      });

      if (comparison !== 0) {
        return criterion.direction === "asc" ? comparison : -comparison;
      }
    }

    return 0;
  });
}

function syncProgrammingSortButtons() {
  document.querySelectorAll("[data-programming-sort-field]").forEach((button) => {
    const index = programmingSortCriteria.findIndex(
      (criterion) => criterion.field === button.dataset.programmingSortField
    );
    const active = index >= 0;
    button.classList.toggle("active", active);
    button.classList.toggle(
      "sort-asc",
      active && programmingSortCriteria[index].direction === "asc"
    );
    button.classList.toggle(
      "sort-desc",
      active && programmingSortCriteria[index].direction === "desc"
    );
    button.dataset.sortIndex = active ? String(index + 1) : "";
    button.title = active ? `Prioridad ${index + 1}` : "";
  });
}

function normalizeProgrammingPersonnelName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeProgrammingPersonnelDni(value) {
  return String(value ?? "").trim().toUpperCase();
}

function normalizeProgrammingPersonnelCatalogRow(row) {
  return {
    id: Number(row?.id || 0),
    personal: normalizeProgrammingPersonnelName(row?.personal),
    dni: normalizeProgrammingPersonnelDni(row?.dni),
  };
}

function normalizeProgrammingInstallationCatalogRow(row) {
  return {
    id: Number(row?.id || 0),
    instalacion: normalizeProgrammingCell(row?.instalacion),
    activo: Boolean(row?.activo),
  };
}

function formatProgrammingPersonnelLabel(person) {
  const name = normalizeProgrammingPersonnelName(person?.name ?? person?.personal);
  const dni = normalizeProgrammingPersonnelDni(person?.dni);
  return dni ? `${name} - ${dni}` : name;
}

function getProgrammingPersonnelNames() {
  return sortTextValues(
    currentProgrammingPersonnel
      .map((person) => normalizeProgrammingPersonnelName(person.name))
      .filter(Boolean)
  );
}

function getProgrammingPersonnelOptionLabel(name) {
  const normalizedName = normalizeProgrammingPersonnelName(name);
  const person = currentProgrammingPersonnel.find(
    (item) => normalizeProgrammingPersonnelName(item.name) === normalizedName
  );
  return person ? formatProgrammingPersonnelLabel(person) : normalizedName;
}

function isMissingProgrammingPersonnelTableError(error) {
  const details = formatSupabaseErrorDetails(error).toLowerCase();
  return (
    details.includes("programming_personnel") &&
    (details.includes("does not exist") ||
      details.includes("could not find") ||
      details.includes("schema cache"))
  );
}

function renderProgrammingPersonnelOptions(extraNames = []) {
  const names = sortTextValues(
    Array.from(
      new Set([
        PROGRAMMING_UNASSIGNED_PERSONAL,
        ...getProgrammingPersonnelNames(),
        ...extraNames.map(normalizeProgrammingPersonnelName).filter(Boolean),
      ])
    )
  );

  if (programmingDetailPersonalInput) {
    const currentValue = normalizeProgrammingPersonnelName(programmingDetailPersonalInput.value);
    const optionNames = currentValue && !names.includes(currentValue) ? [...names, currentValue] : names;
    programmingDetailPersonalInput.innerHTML = optionNames
      .map(
        (name) =>
          `<option value="${escapeHtml(name)}">${escapeHtml(getProgrammingPersonnelOptionLabel(name))}</option>`
      )
      .join("");
    programmingDetailPersonalInput.value = optionNames.includes(currentValue)
      ? currentValue
      : PROGRAMMING_UNASSIGNED_PERSONAL;
  }

  if (programmingBulkPersonalSelect) {
    const currentValue = normalizeProgrammingPersonnelName(programmingBulkPersonalSelect.value);
    const assignableNames = names.filter((name) => name !== PROGRAMMING_UNASSIGNED_PERSONAL);
    programmingBulkPersonalSelect.innerHTML = ['<option value="">Selecciona personal</option>']
      .concat(
        assignableNames.map(
          (name) =>
            `<option value="${escapeHtml(name)}">${escapeHtml(getProgrammingPersonnelOptionLabel(name))}</option>`
        )
      )
      .join("");
    programmingBulkPersonalSelect.value = assignableNames.includes(currentValue) ? currentValue : "";
  }
}

function renderProgrammingPersonnelTable() {
  renderProgrammingPersonnelSettings();
}

function renderProgrammingPersonnelSettings() {
  if (!programmingPersonnelAvailableSelect || !programmingPersonnelSelectedSelect) {
    return;
  }

  const filterText = normalizeSearchText(programmingPersonnelFilter?.value || "");
  const selectedPersonalIds = new Set(
    currentProgrammingPersonnel.map((person) => Number(person.personalId)).filter(Boolean)
  );
  const filteredCatalogRows = programmingPersonnelCatalogRows.filter((row) => {
    const haystack = normalizeSearchText(`${row.personal} ${row.dni}`);
    return !filterText || haystack.includes(filterText);
  });
  const availableRows = filteredCatalogRows.filter((row) => !selectedPersonalIds.has(row.id));
  const selectedRows = currentProgrammingPersonnel.filter((person) => {
    const haystack = normalizeSearchText(`${person.name} ${person.dni}`);
    return !filterText || haystack.includes(filterText);
  });

  programmingPersonnelAvailableSelect.innerHTML = availableRows
    .map((row) => `<option value="${row.id}">${escapeHtml(formatProgrammingPersonnelLabel(row))}</option>`)
    .join("");
  programmingPersonnelSelectedSelect.innerHTML = selectedRows
    .map((person) => `<option value="${person.id}">${escapeHtml(formatProgrammingPersonnelLabel(person))}</option>`)
    .join("");
}

function renderProgrammingInstallationSettings() {
  if (!programmingInstallationAvailableSelect || !programmingInstallationSelectedSelect) {
    return;
  }

  const filterText = normalizeSearchText(programmingInstallationFilter?.value || "");
  const selectedInstallationIds = new Set(
    currentProgrammingAssignedInstallations
      .map((installation) => Number(installation.installationId))
      .filter(Boolean)
  );
  const filteredCatalogRows = programmingInstallationCatalogRows.filter((row) => {
    const haystack = normalizeSearchText(row.instalacion);
    return !filterText || haystack.includes(filterText);
  });
  const availableRows = filteredCatalogRows.filter(
    (row) => !selectedInstallationIds.has(row.id)
  );
  const selectedRows = currentProgrammingAssignedInstallations.filter((installation) => {
    const haystack = normalizeSearchText(installation.name);
    return !filterText || haystack.includes(filterText);
  });

  programmingInstallationAvailableSelect.innerHTML = availableRows
    .map((row) => `<option value="${row.id}">${escapeHtml(row.instalacion)}</option>`)
    .join("");
  programmingInstallationSelectedSelect.innerHTML = selectedRows
    .map(
      (installation) =>
        `<option value="${installation.id}">${escapeHtml(installation.name)}</option>`
    )
    .join("");
}

function renderProgrammingPersonnelUi(extraNames = []) {
  renderProgrammingPersonnelOptions(extraNames);
  renderProgrammingPersonnelSettings();
}

function resetProgrammingPersonnelForm() {
  renderProgrammingPersonnelSettings();
}

async function loadProgrammingPersonnel() {
  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    return;
  }

  const supabase = await getSupabaseClient();
  const [catalogResult, personnelResultWithLink] = await Promise.all([
    supabase
      .from("personal")
      .select("id, personal, dni, vinculacion_id")
      .in("vinculacion_id", [1, 2])
      .order("personal", { ascending: true }),
    supabase
      .from("programming_personnel")
      .select("id, name, personal_id, dni, pin")
      .order("name", { ascending: true }),
  ]);
  let personnelResult = personnelResultWithLink;

  if (personnelResultWithLink.error) {
    const details = formatSupabaseErrorDetails(personnelResultWithLink.error).toLowerCase();
    const tableMissing =
      details.includes("programming_personnel") && details.includes("does not exist");
    if (tableMissing) {
      personnelResult = personnelResultWithLink;
    } else {
    const fallbackResult = await supabase
      .from("programming_personnel")
      .select("id, name, pin")
      .order("name", { ascending: true });
    if (!fallbackResult.error) {
      personnelResult = fallbackResult;
    }
    }
  }

  if (catalogResult.error) {
    programmingPersonnelCatalogRows = [];
    renderProgrammingPersonnelUi();
    setStatus(`No se pudo cargar el personal de plantilla: ${catalogResult.error.message}`, "error");
    return;
  }

  programmingPersonnelCatalogRows = (catalogResult.data || [])
    .map(normalizeProgrammingPersonnelCatalogRow)
    .filter((row) => row.id && row.personal);

  if (personnelResult.error) {
    currentProgrammingPersonnel = [];
    renderProgrammingPersonnelUi();
    if (isMissingProgrammingPersonnelTableError(personnelResult.error)) {
      setStatus(
        "Falta la tabla programming_personnel en Supabase. Ejecuta el SQL actualizado de supabase/schema.sql.",
        "error"
      );
      return;
    }

    setStatus(`No se pudo cargar el listado de personal: ${personnelResult.error.message}`, "error");
    return;
  }

  currentProgrammingPersonnel = (personnelResult.data || []).map((person) => {
    const name = normalizeProgrammingPersonnelName(person.name);
    const catalogMatch = programmingPersonnelCatalogRows.find(
      (row) => normalizeProgrammingPersonnelName(row.personal) === name
    );
    return {
      id: person.id,
      personalId: Number(person.personal_id || catalogMatch?.id || 0),
      name,
      dni: normalizeProgrammingPersonnelDni(person.dni || catalogMatch?.dni),
    };
  });
  renderProgrammingPersonnelUi();
}

function openProgrammingSettingsPanel() {
  programmingSettingsPanel?.classList.remove("hidden");
  renderProgrammingPersonnelSettings();
  renderProgrammingInstallationSettings();
  programmingPersonnelFilter?.focus();
}

function closeProgrammingSettingsPanel() {
  programmingSettingsPanel?.classList.add("hidden");
}

async function addProgrammingPersonnelBatch(personalIds) {
  const ids = personalIds.map(Number).filter(Boolean);
  if (!ids.length) {
    return;
  }

  const rows = programmingPersonnelCatalogRows.filter((row) => ids.includes(row.id));
  if (!rows.length) {
    setStatus("No se encontró personal para añadir.", "error");
    return;
  }

  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para editar el personal de programación.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const changes = rows.map((row) => {
    const existing = currentProgrammingPersonnel.find(
      (person) =>
        Number(person.personalId) === row.id ||
        normalizeProgrammingPersonnelName(person.name) === normalizeProgrammingPersonnelName(row.personal)
    );
    const payload = {
      personal_id: row.id,
      name: row.personal,
      dni: row.dni || null,
    };
    return existing
      ? supabase.from("programming_personnel").update(payload).eq("id", existing.id)
      : supabase.from("programming_personnel").insert(payload);
  });
  const results = await Promise.all(changes);
  const error = results.find((result) => result.error)?.error;

  if (error) {
    if (isMissingProgrammingPersonnelTableError(error)) {
      setStatus(
        "Falta la tabla programming_personnel en Supabase. Ejecuta el SQL actualizado de supabase/schema.sql.",
        "error"
      );
      return;
    }

    setStatus(`No se pudo asignar el personal: ${error.message}`, "error");
    return;
  }

  await loadProgrammingPersonnel();
  setStatus("Personal asignado a programación correctamente.", "success");
}

async function removeProgrammingPersonnelBatch(personIds) {
  const ids = personIds.map(Number).filter(Boolean);
  if (!ids.length) {
    return;
  }

  const confirmed = window.confirm(
    "Vas a quitar el personal seleccionado del desplegable de programación. Los registros ya guardados no se modificarán."
  );
  if (!confirmed) {
    return;
  }

  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para editar el personal de programación.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("programming_personnel").delete().in("id", ids);

  if (error) {
    setStatus(`No se pudo quitar el personal: ${error.message}`, "error");
    return;
  }

  await loadProgrammingPersonnel();
  setStatus("Personal quitado de programación correctamente.", "success");
}

async function addProgrammingInstallationBatch(installationIds) {
  const ids = installationIds.map(Number).filter(Boolean);
  if (!ids.length) {
    return;
  }

  const rows = programmingInstallationCatalogRows.filter((row) => ids.includes(row.id));
  if (!rows.length) {
    setStatus("No se encontró ninguna instalación para añadir.", "error");
    return;
  }

  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para editar las instalaciones de programación.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const changes = rows.map((row) => {
    const existing = currentProgrammingAssignedInstallations.find(
      (installation) =>
        Number(installation.installationId) === row.id ||
        normalizeProgrammingText(installation.name) === normalizeProgrammingText(row.instalacion)
    );
    const payload = {
      installation_id: row.id,
      name: row.instalacion,
    };
    return existing
      ? supabase.from("programming_installations").update(payload).eq("id", existing.id)
      : supabase.from("programming_installations").insert(payload);
  });
  const results = await Promise.all(changes);
  const error = results.find((result) => result.error)?.error;

  if (error) {
    setStatus(`No se pudo asignar la instalación: ${error.message}`, "error");
    return;
  }

  await loadProgrammingInstallationOptions();
  setStatus("Instalaciones asignadas a programación correctamente.", "success");
}

async function removeProgrammingInstallationBatch(installationIds) {
  const ids = installationIds.map(Number).filter(Boolean);
  if (!ids.length) {
    return;
  }

  const confirmed = window.confirm(
    "Vas a quitar las instalaciones seleccionadas de los desplegables de programación. Los registros ya guardados no se modificarán."
  );
  if (!confirmed) {
    return;
  }

  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para editar las instalaciones de programación.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("programming_installations").delete().in("id", ids);

  if (error) {
    setStatus(`No se pudo quitar la instalación: ${error.message}`, "error");
    return;
  }

  await loadProgrammingInstallationOptions();
  setStatus("Instalaciones quitadas de programación correctamente.", "success");
}

async function saveProgrammingPersonnel(event) {
  event.preventDefault();
  openProgrammingSettingsPanel();
}

function editProgrammingPersonnelLegacy(personId) {
  const person = currentProgrammingPersonnel.find((item) => String(item.id) === String(personId));
  if (!person) {
    setStatus("No se encontro el personal seleccionado.", "error");
    return;
  }

  openProgrammingSettingsPanel();
}

async function deleteProgrammingPersonnelLegacy(personId) {
  const person = currentProgrammingPersonnel.find((item) => String(item.id) === String(personId));
  if (!person) {
    setStatus("No se encontro el personal seleccionado.", "error");
    return;
  }

  await removeProgrammingPersonnelBatch([person.id]);
}

async function saveProgrammingPersonnelLegacy(event) {
  event.preventDefault();

  const name = normalizeProgrammingPersonnelName(programmingPersonnelNameInput?.value);
  if (!name) {
    setStatus("Introduce un nombre de personal.", "error");
    return;
  }

  const pin = normalizeProgrammingPersonnelPin(programmingPersonnelPinInput?.value);
  if (!isValidProgrammingPersonnelPin(pin)) {
    setStatus("El código debe tener 8 dígitos.", "error");
    return;
  }

  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para editar el listado de personal.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const editingId = String(programmingPersonnelIdInput?.value ?? "").trim();
  const payload = { name, pin: pin || null };
  const { error } = editingId
    ? await supabase.from("programming_personnel").update(payload).eq("id", editingId)
    : await supabase.from("programming_personnel").insert(payload);

  if (error) {
    if (isMissingProgrammingPersonnelTableError(error)) {
      setStatus(
        "Falta la tabla programming_personnel en Supabase. Ejecuta el SQL actualizado de supabase/schema.sql.",
        "error"
      );
      return;
    }

    setStatus(`No se pudo guardar el personal: ${error.message}`, "error");
    return;
  }

  resetProgrammingPersonnelForm();
  await loadProgrammingPersonnel();
  setStatus(
    editingId ? "Personal actualizado correctamente." : "Personal añadido correctamente.",
    "success"
  );
}

function editProgrammingPersonnelManualLegacy(personId) {
  const person = currentProgrammingPersonnel.find((item) => String(item.id) === String(personId));
  if (!person) {
    setStatus("No se encontró el personal seleccionado.", "error");
    return;
  }

  if (programmingPersonnelIdInput) {
    programmingPersonnelIdInput.value = String(person.id);
  }
  if (programmingPersonnelNameInput) {
    programmingPersonnelNameInput.value = person.name;
    programmingPersonnelNameInput.focus();
  }
  if (programmingPersonnelPinInput) {
    programmingPersonnelPinInput.value = person.pin || "";
  }
  if (programmingPersonnelAddButton) {
    programmingPersonnelAddButton.textContent = "Guardar";
  }
  programmingPersonnelCancelButton?.classList.remove("hidden");
  setStatus("Editando personal. Deja el código vacío para borrarlo.", "default");
}

async function deleteProgrammingPersonnelManualLegacy(personId) {
  const person = currentProgrammingPersonnel.find((item) => String(item.id) === String(personId));
  if (!person) {
    setStatus("No se encontró el personal seleccionado.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Vas a borrar "${person.name}" del desplegable. Los registros ya guardados no se modificaran.`
  );
  if (!confirmed) {
    return;
  }

  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para borrar personal.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("programming_personnel").delete().eq("id", person.id);

  if (error) {
    setStatus(`No se pudo borrar el personal: ${error.message}`, "error");
    return;
  }

  await loadProgrammingPersonnel();
  setStatus("Personal borrado del desplegable correctamente.", "success");
}

function renderProgrammingFilters(rows) {
  const includeArchived = Boolean(programmingFilterIncludeArchived?.checked);
  const filterableRows = includeArchived ? rows : rows.filter((row) => !row.archived);
  const dates = Array.from(
    new Map(
      filterableRows
        .map((row) => {
          const normalizedDate = normalizeImportedDate(row.fecha);
          const displayDate = formatDisplayDate(normalizedDate || row.fecha);
          return displayDate ? [normalizedDate || displayDate, displayDate] : null;
        })
        .filter(Boolean)
    ).entries()
  )
    .sort(([leftKey], [rightKey]) =>
      String(leftKey).localeCompare(String(rightKey), "es", { numeric: true })
    )
    .map(([, displayDate]) => displayDate);
  const selectedDate = dates.includes(programmingFilterDate.value) ? programmingFilterDate.value : "";
  const dateScopedRows = selectedDate
    ? filterableRows.filter(
        (row) => formatDisplayDate(normalizeImportedDate(row.fecha) || row.fecha) === selectedDate
      )
    : filterableRows;
  const installations = sortTextValues(
    Array.from(new Set(dateScopedRows.map((row) => row.instalacion).filter(Boolean)))
  );
  const people = sortTextValues(Array.from(new Set(dateScopedRows.map((row) => row.personal).filter(Boolean))));
  const sports = sortTextValues(Array.from(new Set(dateScopedRows.map((row) => row.deporte).filter(Boolean))));

  const currentValues = {
    date: programmingFilterDate.value,
    installation: programmingFilterInstallation.value,
    personal: programmingFilterPersonal.value,
    sport: programmingFilterSport.value,
  };

  programmingFilterDate.innerHTML = ['<option value="">Todas las fechas</option>']
    .concat(dates.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
    .join("");
  programmingFilterInstallation.innerHTML = ['<option value="">Todas las instalaciones</option>']
    .concat(
      installations.map(
        (value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
      )
    )
    .join("");
  programmingFilterPersonal.innerHTML = ['<option value="">Todo el personal</option>']
    .concat(people.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
    .join("");
  programmingFilterSport.innerHTML = ['<option value="">Todos los deportes</option>']
    .concat(sports.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
    .join("");

  programmingFilterDate.value = selectedDate;
  programmingFilterInstallation.value = installations.includes(currentValues.installation)
    ? currentValues.installation
    : "";
  programmingFilterPersonal.value = people.includes(currentValues.personal) ? currentValues.personal : "";
  programmingFilterSport.value = sports.includes(currentValues.sport) ? currentValues.sport : "";
}

function syncProgrammingDateScopedFilters() {
  renderProgrammingFilters(currentProgrammingRows);
}

function syncProgrammingBulkAssignmentUi() {
  if (programmingBulkAssignCount) {
    programmingBulkAssignCount.textContent = `${filteredProgrammingRows.length} filtrado${
      filteredProgrammingRows.length === 1 ? "" : "s"
    }`;
  }

  if (programmingBulkAssignButton) {
    const selectedName = normalizeProgrammingPersonnelName(programmingBulkPersonalSelect?.value);
    programmingBulkAssignButton.disabled = !selectedName || filteredProgrammingRows.length === 0;
  }

  if (programmingBulkClearPersonalButton) {
    programmingBulkClearPersonalButton.disabled = !programmingBulkPersonalSelect?.value;
  }

  if (programmingBulkInstallationButton) {
    const installationName = normalizeProgrammingCell(programmingBulkInstallationInput?.value);
    programmingBulkInstallationButton.disabled = !installationName || filteredProgrammingRows.length === 0;
  }

  if (programmingBulkClearInstallationButton) {
    programmingBulkClearInstallationButton.disabled = !programmingBulkInstallationInput?.value;
  }
}

function clearProgrammingBulkPersonal() {
  if (!programmingBulkPersonalSelect) {
    return;
  }

  programmingBulkPersonalSelect.value = "";
  lastSuggestedBulkPersonal = "";
  syncProgrammingBulkAssignmentUi();
  programmingBulkPersonalSelect.focus();
}

function clearProgrammingBulkInstallation() {
  if (!programmingBulkInstallationInput) {
    return;
  }

  programmingBulkInstallationInput.value = "";
  lastSuggestedBulkInstallation = "";
  syncProgrammingBulkAssignmentUi();
  programmingBulkInstallationInput.focus();
}

function suggestBulkInstallationFromCurrentFilter() {
  if (!programmingBulkInstallationInput || !programmingFilterInstallation) {
    return;
  }

  const bulkPanel = programmingBulkInstallationInput.closest("details");
  if (bulkPanel && !bulkPanel.open) {
    return;
  }

  const selectedInstallation = programmingFilterInstallation.value;
  if (!selectedInstallation) {
    return;
  }

  const currentBulkValue = programmingBulkInstallationInput.value.trim();
  if (currentBulkValue && currentBulkValue !== lastSuggestedBulkInstallation) {
    return;
  }

  const closestInstallation = findClosestProgrammingInstallationName(selectedInstallation);
  if (!closestInstallation) {
    return;
  }

  programmingBulkInstallationInput.value = closestInstallation;
  lastSuggestedBulkInstallation = closestInstallation;
  syncProgrammingBulkAssignmentUi();
}

function resetSingleProgrammingFilter(filterName) {
  const resetMap = {
    date: programmingFilterDate,
    installation: programmingFilterInstallation,
    personal: programmingFilterPersonal,
    sport: programmingFilterSport,
    activity: programmingFilterActivity,
    include_archived: programmingFilterIncludeArchived,
  };
  const control = resetMap[filterName];

  if (!control) {
    return;
  }

  if (control.type === "checkbox") {
    control.checked = false;
  } else {
    control.value = "";
  }

  if (control === programmingFilterDate || control === programmingFilterIncludeArchived) {
    syncProgrammingDateScopedFilters();
  }

  applyProgrammingFilters();

  if (control === programmingFilterPersonal || control === programmingFilterDate) {
    suggestBulkPersonalFromCurrentFilter();
  }

  if (control === programmingFilterInstallation || control === programmingFilterDate) {
    suggestBulkInstallationFromCurrentFilter();
  }
}

function suggestBulkPersonalFromCurrentFilter() {
  if (!programmingBulkPersonalSelect || !programmingFilterPersonal) {
    return;
  }

  const bulkPanel = programmingBulkPersonalSelect.closest("details");
  if (bulkPanel && !bulkPanel.open) {
    return;
  }

  const selectedPersonal = programmingFilterPersonal.value;
  if (!selectedPersonal) {
    return;
  }

  const currentBulkValue = programmingBulkPersonalSelect.value;
  if (currentBulkValue && currentBulkValue !== lastSuggestedBulkPersonal) {
    return;
  }

  const closestPersonal = findClosestProgrammingPersonnelName(selectedPersonal);
  if (!closestPersonal) {
    return;
  }

  programmingBulkPersonalSelect.value = closestPersonal;
  lastSuggestedBulkPersonal = closestPersonal;
  syncProgrammingBulkAssignmentUi();
}

function applyProgrammingFilters() {
  const activityQuery = normalizeProgrammingText(programmingFilterActivity.value);
  const includeArchived = programmingFilterIncludeArchived.checked;

  filteredProgrammingRows = currentProgrammingRows.filter((row) => {
    if (!includeArchived && row.archived) {
      return false;
    }
    if (
      programmingFilterDate.value &&
      formatDisplayDate(normalizeImportedDate(row.fecha) || row.fecha) !== programmingFilterDate.value
    ) {
      return false;
    }
    if (programmingFilterInstallation.value && row.instalacion !== programmingFilterInstallation.value) {
      return false;
    }
    if (programmingFilterPersonal.value && row.personal !== programmingFilterPersonal.value) {
      return false;
    }
    if (programmingFilterSport.value && row.deporte !== programmingFilterSport.value) {
      return false;
    }
    if (activityQuery && !normalizeProgrammingText(row.actividad).includes(activityQuery)) {
      return false;
    }
    return true;
  });

  filteredProgrammingRows = sortProgrammingRows(filteredProgrammingRows);
  if (programmingSelectionMode) {
    const filteredIds = new Set(
      filteredProgrammingRows.map((row) => String(row.id)).filter(Boolean)
    );
    selectedProgrammingDeleteIds = new Set(
      [...selectedProgrammingDeleteIds].filter((id) => filteredIds.has(id))
    );
  }
  programmingCurrentPage = 1;
  refreshProgrammingPreviewPage();
  syncProgrammingSortButtons();
  syncProgrammingBulkAssignmentUi();
}

function renderProgrammingPreview(rows, sourceName, options = {}) {
  currentProgrammingRows = rows;
  currentProgrammingSourceName = sourceName;
  currentProgrammingCanUpload = Boolean(options.canUpload);
  programmingCurrentPage = 1;
  programmingSelectiveDeleteMode = false;
  programmingSelectionMode = "";
  selectedProgrammingDeleteIds.clear();

  const installationCount = new Set(rows.map((row) => row.instalacion).filter(Boolean)).size;
  const personCount = new Set(rows.map((row) => row.personal).filter(Boolean)).size;
  const archivedCount = rows.filter((row) => row.archived).length;
  const sortedDates = rows
    .map((row) => normalizeImportedDate(row.fecha))
    .filter(Boolean)
    .sort((left, right) => String(left).localeCompare(String(right), "es"));
  const lastDate = sortedDates[sortedDates.length - 1] || "";

  if (programmingSourceName) {
    programmingSourceName.textContent = sourceName || "-";
  }
  programmingTotalCount.textContent = String(rows.length);
  programmingInstallationCount.textContent = String(installationCount);
  programmingPersonCount.textContent = String(personCount);
  programmingArchivedCount.textContent = String(archivedCount);
  programmingDateFrom.textContent = sortedDates[0] ? formatDisplayDate(sortedDates[0]) : "-";
  programmingDateTo.textContent = lastDate ? formatDisplayDate(lastDate) : "-";
  programmingDownloadCsvButton.disabled = rows.length === 0;
  programmingUploadSupabaseButton?.classList.toggle(
    "hidden",
    !currentProgrammingCanUpload || rows.length === 0
  );
  renderProgrammingFilters(rows);
  applyProgrammingFilters();
}

function refreshProgrammingPreviewPage() {
  const visibleRows = getPaginatedProgrammingRows(filteredProgrammingRows);
  const selectionModeEnabled = Boolean(programmingSelectionMode);
  const visibleColumnCount = selectionModeEnabled ? 13 : 12;
  updateProgrammingPaginationUi(filteredProgrammingRows.length);

  programmingPreviewTableBody.innerHTML = visibleRows.length
    ? visibleRows
        .map(
          (row) => {
            const rowId = String(row.id || row.previewId || "");
            const persistedRowId = String(row.id || "");
            const weekday = getControlWeekdayInfo(normalizeImportedDate(row.fecha) || row.fecha);
            const selectionCell = selectionModeEnabled
              ? `
                <td class="control-select-cell">
                  <input
                    type="checkbox"
                    data-programming-select-id="${escapeHtml(persistedRowId)}"
                    aria-label="Seleccionar programación de ${escapeHtml(row.instalacion || "")}"
                    ${persistedRowId ? "" : "disabled"}
                    ${persistedRowId && selectedProgrammingDeleteIds.has(persistedRowId) ? "checked" : ""}
                  />
                </td>
              `
              : "";

            return `
            <tr>
              ${selectionCell}
              <td>
                <div class="action-buttons">
                  <button type="button" class="table-action tooltip-button" aria-label="Editar registro" data-programming-edit-id="${escapeHtml(rowId)}" ${
                    rowId ? "" : "disabled"
                  }>${renderIcon("edit")}</button>
                  <button type="button" class="table-action tooltip-button" aria-label="Duplicar registro" data-programming-duplicate-id="${escapeHtml(persistedRowId)}" ${
                    persistedRowId ? "" : "disabled"
                  }>${renderIcon("duplicate")}</button>
                </div>
              </td>
              <td>${escapeHtml(getProgrammingTypeBadgeLabel(row.tipoProgramacion))}</td>
              <td>${escapeHtml(getProgrammingPersonnelOptionLabel(row.personal))}</td>
              <td>${escapeHtml(row.instalacion)}</td>
              <td class="weekday-marker-cell">
                <span
                  class="weekday-marker"
                  style="display: inline-block; min-width: 18px; color: ${escapeHtml(weekday.color)}; font-weight: 900; font-size: 1rem; line-height: 1; text-align: center; text-shadow: 0 0 1px #001f54;"
                  title="${escapeHtml(`${weekday.label} - ${formatDisplayDate(normalizeImportedDate(row.fecha) || row.fecha)}`)}"
                  aria-label="${escapeHtml(weekday.label)}"
                >${escapeHtml(weekday.letter)}</span>
              </td>
              <td>${escapeHtml(formatDisplayDate(normalizeImportedDate(row.fecha) || row.fecha))}</td>
              <td>${escapeHtml(row.inicio)}</td>
              <td>${escapeHtml(row.fin)}</td>
              <td>${escapeHtml(row.hora)}</td>
              <td>${escapeHtml(row.deporte)}</td>
              <td>${escapeHtml(row.actividad)}</td>
              <td>${row.archived ? '<span class="status-badge status-discarded">Archivado</span>' : '<span class="status-badge status-pending">Activo</span>'}</td>
            </tr>
          `;
          }
        )
        .join("")
    : `
        <tr>
          <td colspan="${visibleColumnCount}" class="empty-state">No hay registros para mostrar.</td>
        </tr>
      `;
  syncProgrammingSelectionUi();
}

function mapFindeSemanaRowsToProgramming(rows) {
  return (rows ?? []).map((row) => ({
    id: String(row.id ?? ""),
    personal: String(row.personal ?? "").trim(),
    instalacion: String(row.instalacion ?? "").trim(),
    fecha: formatDisplayDate(String(row.fecha ?? "").trim()),
    inicio: formatHourValue(String(row.hora_inicio ?? "").trim()),
    fin: formatHourValue(String(row.hora_fin ?? "").trim()),
    hora: formatHourValue(String(row.hora_evento ?? "").trim()),
    deporte: String(row.deporte ?? "").trim(),
    actividad: String(row.actividad ?? "").trim(),
    archived: Boolean(row.archived_at),
    sortOrder: Number(row.sort_order ?? 0) || 0,
    tipoProgramacion: String(row.tipo_programacion ?? PROGRAMMING_TYPE_FS).trim() || PROGRAMMING_TYPE_FS,
  }));
}

function normalizeProgrammingType(type) {
  return type === PROGRAMMING_TYPE_WEEKLY ? PROGRAMMING_TYPE_WEEKLY : PROGRAMMING_TYPE_FS;
}

function isAllProgrammingTypes(type = currentProgrammingType) {
  return type === PROGRAMMING_TYPE_ALL;
}

function applyProgrammingTypeFilter(query, type = currentProgrammingType) {
  return isAllProgrammingTypes(type)
    ? query
    : query.eq("tipo_programacion", normalizeProgrammingType(type));
}

function getDefaultProgrammingTypeForNewRows() {
  return isAllProgrammingTypes() ? PROGRAMMING_TYPE_FS : normalizeProgrammingType(currentProgrammingType);
}

function getProgrammingTypeBadgeLabel(type) {
  return normalizeProgrammingType(type) === PROGRAMMING_TYPE_WEEKLY ? "Semanal" : "FS";
}

function getProgrammingTypeLabel(type = currentProgrammingType) {
  if (isAllProgrammingTypes(type)) {
    return "toda la programación";
  }
  return type === PROGRAMMING_TYPE_WEEKLY ? "programación semanal" : "programación FS";
}

function getProgrammingSourceLabel(type = currentProgrammingType) {
  if (isAllProgrammingTypes(type)) {
    return "programacion_conserjes FS + semanal";
  }
  return type === PROGRAMMING_TYPE_WEEKLY ? "programacion_conserjes semanal" : "programacion_conserjes FS";
}

function syncProgrammingTypeUi() {
  programmingTypeSwitch?.querySelectorAll("[data-programming-type-filter]").forEach((button) => {
    const isActive = button.dataset.programmingTypeFilter === currentProgrammingType;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (programmingPanelEyebrow) {
    programmingPanelEyebrow.textContent = "Programación";
  }
  if (programmingPanelTitle) {
    programmingPanelTitle.textContent = "Gestión de la programación";
  }
}

function renderProgrammingInstallationOptions(extraNames = []) {
  if (!programmingInstallationOptionsList) {
    return;
  }

  const options = sortTextValues(
    Array.from(
      new Set(
        currentProgrammingActiveInstallations
          .concat(extraNames)
          .map((value) => String(value ?? "").trim())
          .filter(Boolean)
      )
    )
  );

  programmingInstallationOptionsList.innerHTML = options
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
}

async function loadProgrammingInstallationCatalog(supabase) {
  const [catalogResult, assignedResult] = await Promise.all([
    supabase
      .from("instalaciones")
      .select("id, instalacion, activo")
      .limit(10000),
    supabase
      .from("programming_installations")
      .select("id, installation_id, name")
      .order("name", { ascending: true }),
  ]);

  if (catalogResult.error) {
    throw new Error(`No se pudieron cargar las instalaciones: ${catalogResult.error.message}`);
  }

  programmingInstallationCatalogRows = (catalogResult.data ?? [])
    .map(normalizeProgrammingInstallationCatalogRow)
    .filter((row) => row.id && row.instalacion);

  const activeCatalogRows = programmingInstallationCatalogRows.filter((row) => row.activo);
  const assignedTableMissing =
    assignedResult.error &&
    formatSupabaseErrorDetails(assignedResult.error).toLowerCase().includes("programming_installations");

  if (assignedResult.error && !assignedTableMissing) {
    throw new Error(`No se pudieron cargar las instalaciones asignadas: ${assignedResult.error.message}`);
  }

  currentProgrammingAssignedInstallations = assignedTableMissing
    ? activeCatalogRows.map((row) => ({
        id: row.id,
        installationId: row.id,
        name: row.instalacion,
      }))
    : (assignedResult.data ?? []).map((row) => {
        const name = normalizeProgrammingCell(row.name);
        const catalogMatch = programmingInstallationCatalogRows.find(
          (item) => normalizeProgrammingText(item.instalacion) === normalizeProgrammingText(name)
        );
        return {
          id: row.id,
          installationId: Number(row.installation_id || catalogMatch?.id || 0),
          name,
        };
      }).filter((row) => row.name);

  currentProgrammingActiveInstallations = sortTextValues(
    currentProgrammingAssignedInstallations.map((row) => row.name).filter(Boolean)
  );
  renderProgrammingInstallationOptions();
  renderProgrammingInstallationSettings();

  return {
    inactiveNames: new Set(
      programmingInstallationCatalogRows
        .filter((row) => !row.activo)
        .map((row) => normalizeProgrammingText(row.instalacion))
        .filter(Boolean)
    ),
  };
}

async function loadProgrammingInstallationOptions() {
  const supabase = await getSupabaseClient();
  await loadProgrammingInstallationCatalog(supabase);
}

function filterActiveProgrammingInstallationRows(rows, installationCatalog) {
  return rows.filter(
    (row) => !installationCatalog.inactiveNames.has(normalizeProgrammingText(row.instalacion))
  );
}

function validateProgrammingReportRange() {
  const dateFrom = normalizeImportedDate(programmingReportDateFromInput?.value);
  const dateTo = normalizeImportedDate(programmingReportDateToInput?.value);

  if (!dateFrom || !dateTo) {
    throw new Error("Indica fecha inicial y fecha final para generar el informe.");
  }

  if (dateFrom > dateTo) {
    throw new Error("La fecha inicial no puede ser posterior a la fecha final.");
  }

  return { dateFrom, dateTo };
}

async function fetchProgrammingRowsForReport(dateFrom, dateTo) {
  const supabase = await getSupabaseClient();
  const installationCatalog = await loadProgrammingInstallationCatalog(supabase);
  let reportQuery = supabase
    .from(PROGRAMMING_TABLE_NAME)
    .select("id, personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, archived_at, sort_order");
  reportQuery = applyProgrammingTypeFilter(reportQuery)
    .gte("fecha", dateFrom)
    .lte("fecha", dateTo)
    .is("archived_at", null)
    .order("personal", { ascending: true })
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });
  let { data, error } = await reportQuery;

  if (error && isMissingArchivedAtColumnError(error)) {
    let fallbackReportQuery = supabase
      .from(PROGRAMMING_TABLE_NAME)
      .select("id, personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, sort_order");
    fallbackReportQuery = applyProgrammingTypeFilter(fallbackReportQuery)
      .gte("fecha", dateFrom)
      .lte("fecha", dateTo)
      .order("personal", { ascending: true })
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });
    ({ data, error } = await fallbackReportQuery);
  }

  if (error) {
    throw error;
  }

  return filterActiveProgrammingInstallationRows(
    mapFindeSemanaRowsToProgramming(data),
    installationCatalog
  ).sort((left, right) => {
    const personComparison = String(left.personal || PROGRAMMING_UNASSIGNED_PERSONAL).localeCompare(
      String(right.personal || PROGRAMMING_UNASSIGNED_PERSONAL),
      "es",
      { sensitivity: "base", numeric: true }
    );
    if (personComparison !== 0) return personComparison;

    return (
      getProgrammingSortValue(left, "fecha").localeCompare(getProgrammingSortValue(right, "fecha"), "es", {
        numeric: true,
      }) ||
      getProgrammingSortValue(left, "inicio").localeCompare(getProgrammingSortValue(right, "inicio"), "es", {
        numeric: true,
      })
    );
  });
}

function groupProgrammingRowsByPerson(rows) {
  const groups = new Map();

  rows.forEach((row) => {
    const person = String(row.personal || PROGRAMMING_UNASSIGNED_PERSONAL).trim() || PROGRAMMING_UNASSIGNED_PERSONAL;
    if (!groups.has(person)) {
      groups.set(person, []);
    }
    groups.get(person).push(row);
  });

  return Array.from(groups.entries()).sort(([left], [right]) =>
    left.localeCompare(right, "es", { sensitivity: "base", numeric: true })
  );
}

function exportProgrammingReportToPdf() {
  void (async () => {
    try {
      const { dateFrom, dateTo } = validateProgrammingReportRange();
      const rows = await fetchProgrammingRowsForReport(dateFrom, dateTo);

      if (!rows.length) {
        setStatus("No hay registros de programación en el intervalo indicado.", "error");
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
      const bottomMargin = 10;
      const rowLineHeight = 3.6;
      const cellPadding = 1.4;
      const minRowHeight = 7;
      const headerHeight = 8;
      const columns = [
        { label: "Instalación", key: "instalacion", width: 52 },
        { label: "Día", key: "dia", width: 9 },
        { label: "Fecha", key: "fecha", width: 19 },
        { label: "Inicio", key: "inicio", width: 15 },
        { label: "Fin", key: "fin", width: 15 },
        { label: "Hora", key: "hora", width: 15 },
        { label: "Deporte", key: "deporte", width: 34 },
        { label: "Actividad", key: "actividad", width: 127 },
      ];
      const tableWidth = columns.reduce((total, column) => total + column.width, 0);
      const tableLeft = Math.max(margin, (pageWidth - tableWidth) / 2);
      const groups = groupProgrammingRowsByPerson(rows);
      const periodText = `${formatDisplayDate(dateFrom)} - ${formatDisplayDate(dateTo)}`;
      const exportedAt = new Date().toLocaleString("es-ES");
      let y = margin;

      const getRowValue = (row, key) => {
        if (key === "dia") return getControlWeekdayInfo(row.fecha).letter;
        if (key === "fecha") return formatDisplayDate(normalizeImportedDate(row.fecha) || row.fecha) || "-";
        if (key === "inicio") return formatHourValue(row.inicio) || "-";
        if (key === "fin") return formatHourValue(row.fin) || "-";
        if (key === "hora") return formatHourValue(row.hora) || "-";
        return row[key] || "-";
      };

      const drawTableHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        let x = tableLeft;
        columns.forEach((column) => {
          doc.setFillColor(225, 225, 225);
          doc.setDrawColor(120, 120, 120);
          doc.rect(x, y, column.width, headerHeight, "F");
          doc.rect(x, y, column.width, headerHeight, "S");
          doc.setTextColor(0, 0, 0);
          doc.text(column.label, x + cellPadding, y + 5);
          x += column.width;
        });
        doc.setTextColor(0, 31, 84);
        y += headerHeight;
      };

      const drawPersonHeader = (person, rowCount) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text(person, margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Periodo: ${periodText}`, margin, y);
        y += 4.5;
        doc.text(`Registros: ${rowCount} | Generado: ${exportedAt}`, margin, y);
        y += 6;
        drawTableHeader();
      };

      const addPersonPage = (person, rowCount, isFirstPage) => {
        if (!isFirstPage) {
          doc.addPage();
        }
        y = margin;
        drawPersonHeader(person, rowCount);
      };

      groups.forEach(([person, personRows], groupIndex) => {
        addPersonPage(person, personRows.length, groupIndex === 0);

        personRows.forEach((row) => {
          const cellLines = columns.map((column) =>
            doc.splitTextToSize(String(getRowValue(row, column.key)), column.width - cellPadding * 2)
          );
          const rowHeight = Math.max(
            minRowHeight,
            ...cellLines.map((lines) => lines.length * rowLineHeight + cellPadding * 2)
          );

          if (y + rowHeight > pageHeight - bottomMargin) {
            doc.addPage();
            y = margin;
            drawPersonHeader(`${person} (continuacion)`, personRows.length);
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.8);
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
      });

      doc.save(`programacion-personal-${dateFrom}-${dateTo}.pdf`);
      setStatus(`Informe PDF generado correctamente. Personas incluidas: ${groups.length}.`, "success");
    } catch (error) {
      setStatus(`No se pudo generar el informe PDF: ${error?.message ?? "error desconocido"}`, "error");
    }
  })();
}

function wrapCanvasText(context, text, maxWidth) {
  const words = String(text ?? "-").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : ["-"];
}

function drawProgrammingPersonImage(person, rows, dateFrom, dateTo) {
  const scale = 2;
  const margin = 40;
  const tableWidth = 1720;
  const canvasWidth = tableWidth + margin * 2;
  const columns = [
    { label: "Instalación", key: "instalacion", width: 320 },
    { label: "Día", key: "dia", width: 60 },
    { label: "Fecha", key: "fecha", width: 130 },
    { label: "Inicio", key: "inicio", width: 90 },
    { label: "Fin", key: "fin", width: 90 },
    { label: "Hora", key: "hora", width: 90 },
    { label: "Deporte", key: "deporte", width: 220 },
    { label: "Actividad", key: "actividad", width: 720 },
  ];
  const lineHeight = 26;
  const cellPadding = 10;
  const headerHeight = 42;
  const titleHeight = 128;
  const footerHeight = 34;
  const scratchCanvas = document.createElement("canvas");
  const scratchContext = scratchCanvas.getContext("2d");

  scratchContext.font = "24px Arial";
  const rowLayouts = rows.map((row) => {
    const cellLines = columns.map((column) => {
      if (column.key === "dia") {
        return [getControlWeekdayInfo(row.fecha).letter];
      }
      const value =
        column.key === "fecha"
          ? formatDisplayDate(normalizeImportedDate(row.fecha) || row.fecha) || "-"
          : column.key === "inicio"
            ? formatHourValue(row.inicio) || "-"
            : column.key === "fin"
              ? formatHourValue(row.fin) || "-"
              : column.key === "hora"
                ? formatHourValue(row.hora) || "-"
                : row[column.key] || "-";
      return wrapCanvasText(scratchContext, value, column.width - cellPadding * 2);
    });
    const rowHeight = Math.max(46, Math.max(...cellLines.map((lines) => lines.length)) * lineHeight + cellPadding * 2);
    return { row, cellLines, rowHeight };
  });

  const canvasHeight =
    titleHeight + headerHeight + rowLayouts.reduce((total, layout) => total + layout.rowHeight, 0) + footerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const context = canvas.getContext("2d");
  context.scale(scale, scale);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "#001f54";
  context.font = "bold 34px Arial";
  context.fillText(person, margin, 46);
  context.font = "22px Arial";
  context.fillText(`Periodo: ${formatDisplayDate(dateFrom)} - ${formatDisplayDate(dateTo)}`, margin, 78);
  context.fillText(`Registros: ${rows.length}`, margin, 108);

  let y = titleHeight;
  let x = margin;
  context.font = "bold 20px Arial";
  columns.forEach((column) => {
    context.fillStyle = "#e5e7eb";
    context.fillRect(x, y, column.width, headerHeight);
    context.strokeStyle = "#94a3b8";
    context.strokeRect(x, y, column.width, headerHeight);
    context.fillStyle = "#111827";
    context.fillText(column.label, x + cellPadding, y + 27);
    x += column.width;
  });
  y += headerHeight;

  rowLayouts.forEach(({ row, cellLines, rowHeight }) => {
    x = margin;
    context.font = "20px Arial";
    columns.forEach((column, columnIndex) => {
      context.strokeStyle = "#d6dbe7";
      context.strokeRect(x, y, column.width, rowHeight);

      if (column.key === "dia") {
        const weekday = getControlWeekdayInfo(row.fecha);
        context.fillStyle = weekday.color;
        context.font = "bold 28px Arial";
        context.textAlign = "center";
        context.fillText(weekday.letter, x + column.width / 2, y + 31);
        context.textAlign = "start";
        x += column.width;
        return;
      }

      context.fillStyle = "#001f54";
      context.font = "20px Arial";
      cellLines[columnIndex].forEach((line, lineIndex) => {
        context.fillText(line, x + cellPadding, y + cellPadding + 20 + lineIndex * lineHeight);
      });
      x += column.width;
    });
    y += rowHeight;
  });

  context.fillStyle = "#64748b";
  context.font = "18px Arial";
  context.fillText(`Generado: ${new Date().toLocaleString("es-ES")}`, margin, canvasHeight - 12);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("No se pudo crear la imagen."));
    }, "image/png");
  });
}

function downloadProgrammingImages() {
  void (async () => {
    try {
      const { dateFrom, dateTo } = validateProgrammingReportRange();
      const rows = await fetchProgrammingRowsForReport(dateFrom, dateTo);

      if (!rows.length) {
        setStatus("No hay registros de programación en el intervalo indicado.", "error");
        return;
      }

      const groups = groupProgrammingRowsByPerson(rows);
      const { default: JSZip } = await getJsZipClient();
      const zip = new JSZip();
      let processedCount = 0;

      for (const [person, personRows] of groups) {
        processedCount += 1;
        setStatus(`Generando imágenes: ${processedCount}/${groups.length} (${person}).`);
        const canvas = drawProgrammingPersonImage(person, personRows, dateFrom, dateTo);
        const blob = await canvasToBlob(canvas);
        zip.file(
          `programacion-${sanitizeFileName(person)}-${dateFrom}-${dateTo}.png`,
          await blob.arrayBuffer()
        );
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      setStatus("Comprimiendo imágenes en ZIP...");
      const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
        setStatus(`Comprimiendo imágenes: ${Math.round(metadata.percent)}%.`);
      });
      triggerDownload(zipBlob, `programaciones-${dateFrom}-${dateTo}.zip`);
      setStatus(`Imágenes descargadas correctamente. Personas incluidas: ${groups.length}.`, "success");
    } catch (error) {
      setStatus(`No se pudieron descargar las imágenes: ${error?.message ?? "error desconocido"}`, "error");
    }
  })();
}

async function loadProgrammingFromSupabase() {
  try {
    const supabase = await getSupabaseClient();
    const installationCatalog = await loadProgrammingInstallationCatalog(supabase);
    let query = supabase
      .from(PROGRAMMING_TABLE_NAME)
      .select(
        "id, personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, archived_at, sort_order, tipo_programacion"
      );
    query = applyProgrammingTypeFilter(query)
      .order("fecha", { ascending: true })
      .order("sort_order", { ascending: true });
    let { data, error } = await query;

    if (error && isMissingArchivedAtColumnError(error)) {
      let fallbackQuery = supabase
        .from(PROGRAMMING_TABLE_NAME)
        .select("id, personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, sort_order, tipo_programacion");
      fallbackQuery = applyProgrammingTypeFilter(fallbackQuery)
        .order("fecha", { ascending: true })
        .order("sort_order", { ascending: true });
      ({ data, error } = await fallbackQuery);
    }

    if (error) {
      throw error;
    }

    const rows = filterActiveProgrammingInstallationRows(
      mapFindeSemanaRowsToProgramming(data),
      installationCatalog
    );
    renderProgrammingPreview(rows, getProgrammingSourceLabel(), { canUpload: false });
    setStatus(
      `Datos actuales de ${getProgrammingTypeLabel()} cargados correctamente. Registros detectados: ${rows.length}.`,
      "success"
    );
  } catch (error) {
    resetProgrammingPreview();
    setStatus(`No se pudieron cargar los datos actuales de ${getProgrammingTypeLabel()}: ${error.message}`, "error");
  }
}

function findProgrammingRowById(recordId) {
  const normalizedId = String(recordId ?? "");
  return currentProgrammingRows.find(
    (row) => String(row.id || row.previewId || "") === normalizedId
  );
}

function populateProgrammingDetailForm(row, options = {}) {
  const { mode = "edit", title = "Editar registro de programación" } = options;
  programmingDetailTitle.textContent = title;
  programmingDetailModeInput.value = mode;
  programmingDetailIdInput.value = String(row?.id || row?.previewId || "");
  renderProgrammingPersonnelOptions([row?.personal ?? ""]);
  programmingDetailPersonalInput.value =
    normalizeProgrammingPersonnelName(row?.personal) || PROGRAMMING_UNASSIGNED_PERSONAL;
  if (programmingDetailTypeInput) {
    programmingDetailTypeInput.value = normalizeProgrammingType(
      row?.tipoProgramacion ?? currentProgrammingType
    );
  }
  programmingDetailInstallationInput.value = row?.instalacion ?? "";
  programmingDetailDateInput.value = formatProgrammingDateInputValue(row?.fecha);
  programmingDetailStartInput.value = formatProgrammingTimeInputValue(row?.inicio);
  programmingDetailEndInput.value = formatProgrammingTimeInputValue(row?.fin);
  programmingDetailEventTimeInput.value = formatProgrammingTimeInputValue(row?.hora);
  programmingDetailSportInput.value = row?.deporte ?? "";
  programmingDetailActivityInput.value = row?.actividad ?? "";
  programmingDetailArchivedInput.checked = Boolean(row?.archived);
  if (programmingDetailArchiveButton) {
    programmingDetailArchiveButton.textContent = row?.archived ? "Recuperar" : "Archivar";
    programmingDetailArchiveButton.disabled = !row?.id;
  }
  if (programmingDetailDeleteButton) {
    programmingDetailDeleteButton.disabled = !row?.id;
  }
  markFormPristine(programmingDetailForm);
  programmingDetailPanel.classList.remove("hidden");
}

function openProgrammingDetail(recordId) {
  const row = findProgrammingRowById(recordId);
  if (!row) {
    setStatus("No se encontró el registro de programación.", "error");
    return;
  }

  populateProgrammingDetailForm(row, {
    mode: "edit",
    title: "Editar registro de programación",
  });
}

function openProgrammingCreateDetail() {
  populateProgrammingDetailForm(
    {
      id: "",
      personal: PROGRAMMING_UNASSIGNED_PERSONAL,
      instalacion: "",
      fecha: "",
      inicio: "",
      fin: "",
      hora: "",
      deporte: "",
      actividad: "",
      archived: false,
      tipoProgramacion: getDefaultProgrammingTypeForNewRows(),
    },
    {
      mode: "create",
      title: "Nuevo registro de programación",
    }
  );
}

function openProgrammingDuplicateDetail(recordId) {
  const row = findProgrammingRowById(recordId);
  if (!row) {
    setStatus("No se encontró el registro de programación.", "error");
    return;
  }

  populateProgrammingDetailForm(
    {
      ...row,
      id: "",
      archived: false,
    },
    {
      mode: "duplicate",
      title: "Duplicar registro de programación",
    }
  );
}

function closeProgrammingDetail(options = {}) {
  if (!options.force && !confirmDiscardFormChanges(programmingDetailForm)) {
    return false;
  }

  programmingDetailPanel.classList.add("hidden");
  programmingDetailForm?.reset();
  markFormPristine(programmingDetailForm);
  return true;
}

function getNextProgrammingSortOrder() {
  const numericSortOrders = currentProgrammingRows
    .map((row) => Number(row.sortOrder ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!numericSortOrders.length) {
    return currentProgrammingRows.length + 1;
  }

  return Math.max(...numericSortOrders) + 1;
}

function applyProgrammingPayloadToPreviewRow(row, payload) {
  Object.assign(row, {
    personal: String(programmingDetailPersonalInput.value).trim(),
    instalacion: payload.instalacion,
    fecha: payload.fecha,
    inicio: formatProgrammingTimeInputValue(payload.hora_inicio),
    fin: formatProgrammingTimeInputValue(payload.hora_fin),
    hora: formatProgrammingTimeInputValue(payload.hora_evento),
    deporte: payload.deporte || "",
    actividad: payload.actividad || "",
    archived: Boolean(payload.archived_at),
    tipoProgramacion: normalizeProgrammingType(payload.tipo_programacion || currentProgrammingType),
  });
}

function omitProgrammingPayloadFields(payload, fields) {
  const nextPayload = { ...payload };
  fields.forEach((field) => {
    delete nextPayload[field];
  });
  return nextPayload;
}

async function saveProgrammingDetail(event) {
  event.preventDefault();

  const recordId = programmingDetailIdInput.value;
  const detailMode = programmingDetailModeInput.value || "edit";
  const row = recordId ? findProgrammingRowById(recordId) : null;
  if (detailMode === "edit" && !row) {
    setStatus("No se encontró el registro de programación.", "error");
    return;
  }

  const selectedProgrammingType = normalizeProgrammingType(
    programmingDetailTypeInput?.value || currentProgrammingType
  );

  const payload = {
    personal: String(programmingDetailPersonalInput.value).trim() || PROGRAMMING_UNASSIGNED_PERSONAL,
    instalacion: String(programmingDetailInstallationInput.value).trim(),
    fecha: normalizeImportedDate(programmingDetailDateInput.value),
    hora_inicio: normalizeImportedTime(programmingDetailStartInput.value),
    hora_fin: normalizeImportedTime(programmingDetailEndInput.value),
    hora_evento: normalizeImportedTime(programmingDetailEventTimeInput.value),
    deporte: String(programmingDetailSportInput.value).trim() || null,
    actividad: String(programmingDetailActivityInput.value).trim() || null,
    archived_at: programmingDetailArchivedInput.checked ? new Date().toISOString() : null,
    source_file: currentProgrammingSourceName || "edicion-manual",
    tipo_programacion: selectedProgrammingType,
  };

  const validationErrors = validateProgrammingRowsForSupabase([
    {
      ...payload,
      archived: programmingDetailArchivedInput.checked,
    },
  ]);

  if (validationErrors.length) {
    setStatus(validationErrors[0], "error");
    return;
  }

  if (detailMode === "edit" && row && !row.id) {
    applyProgrammingPayloadToPreviewRow(row, payload);
    renderProgrammingPreview(currentProgrammingRows, currentProgrammingSourceName, {
      canUpload: currentProgrammingCanUpload,
    });
    closeProgrammingDetail({ force: true });
    setStatus("Fila de la vista previa actualizada correctamente.", "success");
    return;
  }

  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para editar registros de programación.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  let error = null;
  let updatedRow = null;

  if (detailMode === "edit") {
    const originalProgrammingType = normalizeProgrammingType(row.tipoProgramacion);
    let result = await supabase
      .from(PROGRAMMING_TABLE_NAME)
      .update(payload)
      .eq("id", row.id)
      .eq("tipo_programacion", originalProgrammingType)
      .select("id, personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, archived_at, sort_order, tipo_programacion")
      .single();
    if (result.error && isMissingArchivedAtColumnError(result.error)) {
      if (Boolean(row.archived) !== Boolean(payload.archived_at)) {
        setStatus(getArchivedAtMissingColumnMessage(), "error");
        return;
      }
      result = await supabase
        .from(PROGRAMMING_TABLE_NAME)
        .update(omitProgrammingPayloadFields(payload, ["archived_at"]))
        .eq("id", row.id)
        .eq("tipo_programacion", originalProgrammingType)
        .select("id, personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, sort_order, tipo_programacion")
        .single();
    }
    error = result.error;
    updatedRow = result.data;
  } else {
    let result = await supabase.from(PROGRAMMING_TABLE_NAME).insert({
      ...payload,
      sort_order: getNextProgrammingSortOrder(),
    });
    if (result.error && isMissingArchivedAtColumnError(result.error)) {
      if (Boolean(payload.archived_at)) {
        setStatus(getArchivedAtMissingColumnMessage(), "error");
        return;
      }
      result = await supabase.from(PROGRAMMING_TABLE_NAME).insert({
        ...omitProgrammingPayloadFields(payload, ["archived_at"]),
        sort_order: getNextProgrammingSortOrder(),
      });
    }
    error = result.error;
  }

  if (error) {
    setStatus(
      `No se pudo ${detailMode === "edit" ? "actualizar" : "crear"} el registro: ${error.message}`,
      "error"
    );
    return;
  }

  if (detailMode === "edit") {
    const mappedRow = mapFindeSemanaRowsToProgramming([updatedRow])[0] || null;
    if (mappedRow) {
      if (!Object.prototype.hasOwnProperty.call(updatedRow, "archived_at")) {
        mappedRow.archived = row.archived;
      }
      const rowIndex = currentProgrammingRows.findIndex(
        (currentRow) => String(currentRow.id) === String(mappedRow.id)
      );
      if (
        rowIndex >= 0 &&
        (isAllProgrammingTypes() || mappedRow.tipoProgramacion === currentProgrammingType)
      ) {
        currentProgrammingRows[rowIndex] = mappedRow;
      } else if (rowIndex >= 0) {
        currentProgrammingRows.splice(rowIndex, 1);
      }
      renderProgrammingPreview(currentProgrammingRows, currentProgrammingSourceName, {
        canUpload: currentProgrammingCanUpload,
      });
    } else {
      applyProgrammingPayloadToPreviewRow(row, payload);
      renderProgrammingPreview(currentProgrammingRows, currentProgrammingSourceName, {
        canUpload: currentProgrammingCanUpload,
      });
    }
  } else {
    await loadProgrammingFromSupabase();
  }
  closeProgrammingDetail({ force: true });
  setStatus(
    detailMode === "edit"
      ? "Registro de programación actualizado correctamente."
      : "Registro de programación creado correctamente.",
    "success"
  );
}

async function archiveProgrammingRecord(recordId, shouldArchive) {
  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para archivar registros de programación.", "error");
    return false;
  }

  const row = findProgrammingRowById(recordId);
  if (!row) {
    setStatus("No se encontró el registro de programación.", "error");
    return false;
  }

  const confirmed = window.confirm(
    shouldArchive
      ? `Vas a archivar el registro de ${row.instalacion}.`
      : `Vas a recuperar el registro archivado de ${row.instalacion}.`
  );
  if (!confirmed) {
    return false;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from(PROGRAMMING_TABLE_NAME)
    .update({ archived_at: shouldArchive ? new Date().toISOString() : null })
    .eq("id", recordId)
    .eq("tipo_programacion", normalizeProgrammingType(row.tipoProgramacion));

  if (error) {
    if (isMissingArchivedAtColumnError(error)) {
      setStatus(getArchivedAtMissingColumnMessage(), "error");
      return false;
    }

    setStatus(`No se pudo actualizar el archivado: ${error.message}`, "error");
    return false;
  }

  await loadProgrammingFromSupabase();
  setStatus(shouldArchive ? "Registro archivado correctamente." : "Registro recuperado correctamente.", "success");
  return true;
}

async function deleteProgrammingRecord(recordId) {
  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para borrar registros de programación.", "error");
    return;
  }

  const row = findProgrammingRowById(recordId);
  if (!row) {
    setStatus("No se encontró el registro de programación.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Vas a borrar definitivamente el registro de ${row.instalacion} del ${row.fecha}.`
  );
  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from(PROGRAMMING_TABLE_NAME)
    .delete()
    .eq("id", recordId)
    .eq("tipo_programacion", normalizeProgrammingType(row.tipoProgramacion));

  if (error) {
    setStatus(`No se pudo borrar el registro: ${error.message}`, "error");
    return;
  }

  await loadProgrammingFromSupabase();
  setStatus("Registro borrado correctamente.", "success");
}

function syncProgrammingSelectionUi() {
  const selectedCount = selectedProgrammingDeleteIds.size;
  const visibleIds = getPaginatedProgrammingRows(filteredProgrammingRows)
    .map((row) => String(row.id || ""))
    .filter(Boolean);
  const selectedVisibleCount = visibleIds.filter((id) =>
    selectedProgrammingDeleteIds.has(id)
  ).length;
  const deleteModeEnabled = programmingSelectionMode === "delete";
  const archiveModeEnabled = programmingSelectionMode === "archive";
  const selectionModeEnabled = Boolean(programmingSelectionMode);

  programmingSelectiveDeleteMode = deleteModeEnabled;
  programmingSelectHeader?.classList.toggle("hidden", !selectionModeEnabled);
  programmingEnableSelectiveArchiveButton?.classList.toggle("hidden", archiveModeEnabled);
  programmingCancelSelectiveArchiveButton?.classList.toggle("hidden", !archiveModeEnabled);
  programmingEnableSelectiveDeleteButton?.classList.toggle(
    "hidden",
    deleteModeEnabled
  );
  programmingCancelSelectiveDeleteButton?.classList.toggle(
    "hidden",
    !deleteModeEnabled
  );

  if (programmingArchiveSelectedButton) {
    programmingArchiveSelectedButton.disabled = !archiveModeEnabled || selectedCount === 0;
  }

  if (programmingUnarchiveSelectedButton) {
    programmingUnarchiveSelectedButton.disabled = !archiveModeEnabled || selectedCount === 0;
  }

  if (programmingDeleteSelectedButton) {
    programmingDeleteSelectedButton.disabled = !deleteModeEnabled || selectedCount === 0;
  }

  if (programmingSelectedArchiveCount) {
    programmingSelectedArchiveCount.textContent = `${selectedCount} seleccionado${
      selectedCount === 1 ? "" : "s"
    }`;
    programmingSelectedArchiveCount.classList.toggle("hidden", !archiveModeEnabled);
  }

  if (programmingSelectedDeleteCount) {
    programmingSelectedDeleteCount.textContent = `${selectedCount} seleccionado${
      selectedCount === 1 ? "" : "s"
    }`;
    programmingSelectedDeleteCount.classList.toggle("hidden", !deleteModeEnabled);
  }

  if (programmingSelectPageCheckbox) {
    programmingSelectPageCheckbox.checked =
      Boolean(visibleIds.length) && selectedVisibleCount === visibleIds.length;
    programmingSelectPageCheckbox.indeterminate =
      selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
    programmingSelectPageCheckbox.disabled = !selectionModeEnabled || !visibleIds.length;
  }
}

function syncProgrammingDeleteSelectionUi() {
  syncProgrammingSelectionUi();
}

function setProgrammingSelectionMode(mode) {
  programmingSelectionMode = mode;
  programmingSelectiveDeleteMode = mode === "delete";
  if (!mode) {
    selectedProgrammingDeleteIds.clear();
  }

  refreshProgrammingPreviewPage();
}

function setProgrammingSelectiveDeleteMode(isEnabled) {
  setProgrammingSelectionMode(isEnabled ? "delete" : "");
}

function toggleCurrentProgrammingPageSelection(isSelected) {
  getPaginatedProgrammingRows(filteredProgrammingRows).forEach((row) => {
    const id = String(row.id || "");
    if (!id) {
      return;
    }

    if (isSelected) {
      selectedProgrammingDeleteIds.add(id);
    } else {
      selectedProgrammingDeleteIds.delete(id);
    }
  });

  refreshProgrammingPreviewPage();
}

function handleProgrammingRecordSelection(recordId, isSelected) {
  const id = String(recordId ?? "").trim();
  if (!id) {
    return;
  }

  if (isSelected) {
    selectedProgrammingDeleteIds.add(id);
  } else {
    selectedProgrammingDeleteIds.delete(id);
  }

  syncProgrammingSelectionUi();
}

async function deleteSelectedProgrammingRecords() {
  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para borrar registros de programación.", "error");
    return;
  }

  const ids = [...selectedProgrammingDeleteIds]
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (!ids.length) {
    setStatus("Selecciona al menos un registro de programación para borrar.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Vas a borrar definitivamente ${ids.length} registro${
      ids.length === 1 ? "" : "s"
    } seleccionado${ids.length === 1 ? "" : "s"} de ${getProgrammingTypeLabel()}.`
  );
  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from(PROGRAMMING_TABLE_NAME)
    .delete()
    .in("id", ids);

  if (error) {
    setStatus(`No se pudieron borrar los registros seleccionados: ${error.message}`, "error");
    return;
  }

  selectedProgrammingDeleteIds.clear();
  programmingSelectiveDeleteMode = false;
  programmingSelectionMode = "";
  await loadProgrammingFromSupabase();
  setStatus(`Registros de programación borrados correctamente: ${ids.length}.`, "success");
}

async function archiveSelectedProgrammingRecords(shouldArchive) {
  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para archivar registros de programación.", "error");
    return false;
  }

  const ids = [...selectedProgrammingDeleteIds]
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  if (!ids.length) {
    setStatus("Selecciona al menos un registro de programación.", "error");
    return false;
  }

  const confirmed = window.confirm(
    shouldArchive
      ? `Vas a archivar ${ids.length} registro${ids.length === 1 ? "" : "s"} seleccionado${ids.length === 1 ? "" : "s"} de ${getProgrammingTypeLabel()}.`
      : `Vas a desarchivar ${ids.length} registro${ids.length === 1 ? "" : "s"} seleccionado${ids.length === 1 ? "" : "s"} de ${getProgrammingTypeLabel()}.`
  );
  if (!confirmed) {
    return false;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from(PROGRAMMING_TABLE_NAME)
    .update({ archived_at: shouldArchive ? new Date().toISOString() : null })
    .in("id", ids);

  if (error) {
    if (isMissingArchivedAtColumnError(error)) {
      setStatus(getArchivedAtMissingColumnMessage(), "error");
      return false;
    }

    setStatus(`No se pudo actualizar el archivado: ${error.message}`, "error");
    return false;
  }

  selectedProgrammingDeleteIds.clear();
  programmingSelectionMode = "";
  programmingSelectiveDeleteMode = false;
  await loadProgrammingFromSupabase();
  setStatus(
    shouldArchive
      ? `Registros archivados correctamente: ${ids.length}.`
      : `Registros desarchivados correctamente: ${ids.length}.`,
    "success"
  );
  return true;
}

async function assignFilteredProgrammingPersonnel() {
  const selectedName = normalizeProgrammingPersonnelName(programmingBulkPersonalSelect?.value);
  if (!selectedName) {
    setStatus("Selecciona personal para asignar.", "error");
    return;
  }

  if (!filteredProgrammingRows.length) {
    setStatus("No hay registros filtrados para asignar.", "error");
    return;
  }

  const assignmentCount = filteredProgrammingRows.length;
  const persistedIds = filteredProgrammingRows
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id));
  const previewRows = filteredProgrammingRows.filter((row) => !row.id);
  const confirmed = window.confirm(
    `Vas a asignar "${selectedName}" a ${assignmentCount} registro${
      assignmentCount === 1 ? "" : "s"
    } filtrado${assignmentCount === 1 ? "" : "s"}.`
  );
  if (!confirmed) {
    return;
  }

  if (persistedIds.length) {
    const session = await ensurePrivateSession({ silent: true });
    if (!session) {
      setStatus("Necesitas iniciar sesión para asignar personal.", "error");
      return;
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from(PROGRAMMING_TABLE_NAME)
      .update({ personal: selectedName })
      .in("id", persistedIds);

    if (error) {
      setStatus(`No se pudo asignar el personal: ${error.message}`, "error");
      return;
    }
  }

  previewRows.forEach((row) => {
    row.personal = selectedName;
  });

  if (persistedIds.length) {
    await loadProgrammingFromSupabase();
  } else {
    renderProgrammingPreview(currentProgrammingRows, currentProgrammingSourceName, {
      canUpload: currentProgrammingCanUpload,
    });
  }
  clearProgrammingBulkPersonal();

  setStatus(
    `Personal asignado correctamente a ${assignmentCount} registro${
      assignmentCount === 1 ? "" : "s"
    }.`,
    "success"
  );
}

function getProgrammingUnmatchedPersonnelProposals() {
  const catalogNames = new Set(
    programmingPersonnelCatalogRows.map((person) => normalizeProgrammingText(person.personal)).filter(Boolean)
  );
  const unassignedKey = normalizeProgrammingText(PROGRAMMING_UNASSIGNED_PERSONAL);
  const proposalMap = new Map();

  currentProgrammingRows.forEach((row) => {
    const currentName = normalizeProgrammingPersonnelName(row.personal);
    const normalizedName = normalizeProgrammingText(currentName);
    if (
      !normalizedName ||
      normalizedName === unassignedKey ||
      catalogNames.has(normalizedName) ||
      ignoredProgrammingUnmatchedPersonnelKeys.has(normalizedName)
    ) {
      return;
    }

    if (!proposalMap.has(normalizedName)) {
      const proposal = findClosestProgrammingPersonnelCatalogName(currentName);
      proposalMap.set(normalizedName, {
        sourceName: currentName,
        proposalName: proposal,
        rows: [],
      });
    }
    proposalMap.get(normalizedName).rows.push(row);
  });

  return Array.from(proposalMap.values()).sort((left, right) =>
    left.sourceName.localeCompare(right.sourceName, "es", { sensitivity: "base", numeric: true })
  );
}

function renderProgrammingUnmatchedPersonnelPanel() {
  programmingUnmatchedPersonnelProposals = getProgrammingUnmatchedPersonnelProposals();
  const personnelOptions = [
    '<option value="">Sin asignar</option>',
    ...programmingPersonnelCatalogRows.map(
      (person) =>
        `<option value="${escapeHtml(person.personal)}">${escapeHtml(formatProgrammingPersonnelLabel(person))}</option>`
    ),
  ].join("");

  if (programmingUnmatchedPersonnelCount) {
    const count = programmingUnmatchedPersonnelProposals.length;
    programmingUnmatchedPersonnelCount.textContent = `${count} nombre${count === 1 ? "" : "s"} pendiente${
      count === 1 ? "" : "s"
    }`;
  }

  if (!programmingUnmatchedPersonnelList) {
    return;
  }

  if (!programmingUnmatchedPersonnelProposals.length) {
    programmingUnmatchedPersonnelList.innerHTML =
      '<p class="empty-state">No hay personal pendiente de asignación.</p>';
    if (programmingApplyUnmatchedPersonnelButton) {
      programmingApplyUnmatchedPersonnelButton.disabled = true;
    }
    return;
  }

  programmingUnmatchedPersonnelList.innerHTML = programmingUnmatchedPersonnelProposals
    .map(
      (item, index) => `
        <div class="programming-unmatched-row ${item.proposalName ? "" : "is-missing-proposal"}">
          <div class="programming-unmatched-source">
            <strong>${escapeHtml(item.sourceName)}</strong>
            <span>${item.rows.length} registro${item.rows.length === 1 ? "" : "s"}</span>
          </div>
          <button
            type="button"
            class="secondary-button programming-unmatched-accept-button"
            data-programming-unmatched-personnel-accept="${escapeHtml(item.sourceName)}"
          >
            Aceptar
          </button>
          <div class="programming-unmatched-proposal">
            <select data-programming-unmatched-proposal-index="${index}" aria-label="Personal para ${escapeHtml(item.sourceName)}">
              ${personnelOptions}
            </select>
            <span>${item.proposalName ? "Propuesta automática editable" : "Selecciona el personal manualmente"}</span>
          </div>
          <button
            type="button"
            class="danger-button tooltip-button programming-unmatched-delete-button"
            aria-label="Quitar sugerencia"
            data-programming-unmatched-personnel-delete="${escapeHtml(item.sourceName)}"
          >
            ${renderIcon("delete")}
          </button>
          <span>${item.proposalName ? "Se aplicará este cambio" : "Revisa el personal asignado al servicio"}</span>
        </div>
      `
    )
    .join("");

  programmingUnmatchedPersonnelProposals.forEach((item, index) => {
    const select = programmingUnmatchedPersonnelList.querySelector(
      `[data-programming-unmatched-proposal-index="${index}"]`
    );
    if (select) {
      select.value = item.proposalName || "";
    }
  });

  if (programmingApplyUnmatchedPersonnelButton) {
    programmingApplyUnmatchedPersonnelButton.disabled = !getSelectedProgrammingUnmatchedPersonnelProposals().length;
  }
}

function getSelectedProgrammingUnmatchedPersonnelProposals() {
  return programmingUnmatchedPersonnelProposals
    .map((item, index) => {
      const select = programmingUnmatchedPersonnelList?.querySelector(
        `[data-programming-unmatched-proposal-index="${index}"]`
      );
      const proposalName = normalizeProgrammingPersonnelName(select ? select.value : item.proposalName);
      return proposalName ? { ...item, proposalName } : null;
    })
    .filter(Boolean);
}

async function openProgrammingUnmatchedPersonnelPanel() {
  await loadProgrammingPersonnel();
  ignoredProgrammingUnmatchedPersonnelKeys = new Set();
  renderProgrammingUnmatchedPersonnelPanel();
  programmingUnmatchedPersonnelPanel?.classList.remove("hidden");
}

function closeProgrammingUnmatchedPersonnelPanel() {
  programmingUnmatchedPersonnelPanel?.classList.add("hidden");
}

async function applyProgrammingUnmatchedPersonnelProposals() {
  const proposals = getSelectedProgrammingUnmatchedPersonnelProposals();
  if (!proposals.length) {
    setStatus("Selecciona al menos una asignación para aplicar.", "error");
    return;
  }

  const affectedCount = proposals.reduce((total, item) => total + item.rows.length, 0);
  const confirmed = window.confirm(
    `Vas a aplicar asignaciones a ${affectedCount} registro${
      affectedCount === 1 ? "" : "s"
    } de programación, sin tener en cuenta los filtros activos.`
  );
  if (!confirmed) {
    return;
  }

  const persistedChanges = proposals
    .map((item) => ({
      proposalName: item.proposalName,
      ids: item.rows.map((row) => Number(row.id)).filter((id) => Number.isFinite(id)),
    }))
    .filter((item) => item.ids.length);
  const previewChanges = proposals
    .map((item) => ({
      proposalName: item.proposalName,
      rows: item.rows.filter((row) => !row.id),
    }))
    .filter((item) => item.rows.length);

  if (persistedChanges.length) {
    const session = await ensurePrivateSession({ silent: true });
    if (!session) {
      setStatus("Necesitas iniciar sesión para aplicar las propuestas.", "error");
      return;
    }

    const supabase = await getSupabaseClient();
    const results = await Promise.all(
      persistedChanges.map((item) =>
        supabase.from(PROGRAMMING_TABLE_NAME).update({ personal: item.proposalName }).in("id", item.ids)
      )
    );
    const error = results.find((result) => result.error)?.error;
    if (error) {
      setStatus(`No se pudieron aplicar las propuestas: ${error.message}`, "error");
      return;
    }
  }

  previewChanges.forEach((item) => {
    item.rows.forEach((row) => {
      row.personal = item.proposalName;
    });
  });

  if (persistedChanges.length) {
    await loadProgrammingFromSupabase();
  } else {
    renderProgrammingPreview(currentProgrammingRows, currentProgrammingSourceName, {
      canUpload: currentProgrammingCanUpload,
    });
  }

  renderProgrammingUnmatchedPersonnelPanel();
  setStatus(`Asignaciones aplicadas correctamente a ${affectedCount} registro${affectedCount === 1 ? "" : "s"}.`, "success");
}

async function acceptProgrammingUnmatchedPersonnelProposal(sourceName) {
  const normalizedSource = normalizeProgrammingText(sourceName);
  const proposal = getSelectedProgrammingUnmatchedPersonnelProposals().find(
    (item) => normalizeProgrammingText(item.sourceName) === normalizedSource
  );
  if (!proposal) {
    setStatus("Selecciona el personal que quieres asignar.", "error");
    return;
  }

  const ids = proposal.rows.map((row) => Number(row.id)).filter((id) => Number.isFinite(id));
  const previewRows = proposal.rows.filter((row) => !row.id);
  if (ids.length) {
    const session = await ensurePrivateSession({ silent: true });
    if (!session) {
      setStatus("Necesitas iniciar sesión para aplicar la asignación.", "error");
      return;
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from(PROGRAMMING_TABLE_NAME)
      .update({ personal: proposal.proposalName })
      .in("id", ids);
    if (error) {
      setStatus(`No se pudo aplicar la asignación: ${error.message}`, "error");
      return;
    }
  }

  previewRows.forEach((row) => {
    row.personal = proposal.proposalName;
  });
  ignoredProgrammingUnmatchedPersonnelKeys.add(normalizedSource);

  if (ids.length) {
    await loadProgrammingFromSupabase();
  } else {
    renderProgrammingPreview(currentProgrammingRows, currentProgrammingSourceName, {
      canUpload: currentProgrammingCanUpload,
    });
  }

  renderProgrammingUnmatchedPersonnelPanel();
  setStatus(`Asignación aplicada a ${proposal.rows.length} registro${proposal.rows.length === 1 ? "" : "s"}.`, "success");
}

function getProgrammingUnmatchedInstallationProposals() {
  const catalogNames = new Set(
    programmingInstallationCatalogRows
      .filter((installation) => installation.activo)
      .map((installation) => normalizeProgrammingText(installation.instalacion))
      .filter(Boolean)
  );
  const proposalMap = new Map();

  currentProgrammingRows.forEach((row) => {
    const currentName = normalizeProgrammingCell(row.instalacion);
    const normalizedName = normalizeProgrammingText(currentName);
    if (!normalizedName || catalogNames.has(normalizedName) || ignoredProgrammingUnmatchedInstallationKeys.has(normalizedName)) {
      return;
    }

    if (!proposalMap.has(normalizedName)) {
      proposalMap.set(normalizedName, {
        sourceName: currentName,
        proposalName: findClosestProgrammingInstallationCatalogName(currentName),
        rows: [],
      });
    }
    proposalMap.get(normalizedName).rows.push(row);
  });

  return Array.from(proposalMap.values()).sort((left, right) =>
    left.sourceName.localeCompare(right.sourceName, "es", { sensitivity: "base", numeric: true })
  );
}

function renderProgrammingUnmatchedInstallationPanel() {
  programmingUnmatchedInstallationProposals = getProgrammingUnmatchedInstallationProposals();
  const installationOptions = [
    '<option value="">Sin asignar</option>',
    ...programmingInstallationCatalogRows
      .filter((installation) => installation.activo)
      .map(
        (installation) =>
          `<option value="${escapeHtml(installation.instalacion)}">${escapeHtml(installation.instalacion)}</option>`
      ),
  ].join("");

  if (programmingUnmatchedInstallationCount) {
    const count = programmingUnmatchedInstallationProposals.length;
    programmingUnmatchedInstallationCount.textContent = `${count} instalación${count === 1 ? "" : "es"} pendiente${
      count === 1 ? "" : "s"
    }`;
  }

  if (!programmingUnmatchedInstallationList) {
    return;
  }

  if (!programmingUnmatchedInstallationProposals.length) {
    programmingUnmatchedInstallationList.innerHTML =
      '<p class="empty-state">No hay instalaciones pendientes de asignación.</p>';
    if (programmingApplyUnmatchedInstallationButton) {
      programmingApplyUnmatchedInstallationButton.disabled = true;
    }
    return;
  }

  programmingUnmatchedInstallationList.innerHTML = programmingUnmatchedInstallationProposals
    .map(
      (item, index) => `
        <div class="programming-unmatched-row ${item.proposalName ? "" : "is-missing-proposal"}">
          <div class="programming-unmatched-source">
            <strong>${escapeHtml(item.sourceName)}</strong>
            <span>${item.rows.length} registro${item.rows.length === 1 ? "" : "s"}</span>
          </div>
          <button
            type="button"
            class="secondary-button programming-unmatched-accept-button"
            data-programming-unmatched-installation-accept="${escapeHtml(item.sourceName)}"
          >
            Aceptar
          </button>
          <div class="programming-unmatched-proposal">
          <select data-programming-unmatched-installation-proposal-index="${index}" aria-label="Instalación para ${escapeHtml(item.sourceName)}">
            ${installationOptions}
          </select>
          </div>
          <button
            type="button"
            class="danger-button tooltip-button programming-unmatched-delete-button"
            aria-label="Quitar sugerencia"
            data-programming-unmatched-installation-delete="${escapeHtml(item.sourceName)}"
          >
            ${renderIcon("delete")}
          </button>
          <span>${item.proposalName ? "Propuesta automática editable" : "Selecciona la instalación manualmente"}</span>
        </div>
      `
    )
    .join("");

  programmingUnmatchedInstallationProposals.forEach((item, index) => {
    const select = programmingUnmatchedInstallationList.querySelector(
      `[data-programming-unmatched-installation-proposal-index="${index}"]`
    );
    if (select) {
      select.value = item.proposalName || "";
    }
  });

  if (programmingApplyUnmatchedInstallationButton) {
    programmingApplyUnmatchedInstallationButton.disabled = !getSelectedProgrammingUnmatchedInstallationProposals().length;
  }
}

function getSelectedProgrammingUnmatchedInstallationProposals() {
  return programmingUnmatchedInstallationProposals
    .map((item, index) => {
      const select = programmingUnmatchedInstallationList?.querySelector(
        `[data-programming-unmatched-installation-proposal-index="${index}"]`
      );
      const proposalName = normalizeProgrammingCell(select ? select.value : item.proposalName);
      return proposalName ? { ...item, proposalName } : null;
    })
    .filter(Boolean);
}

async function openProgrammingUnmatchedInstallationPanel() {
  const supabase = await getSupabaseClient();
  await loadProgrammingInstallationCatalog(supabase);
  ignoredProgrammingUnmatchedInstallationKeys = new Set();
  renderProgrammingUnmatchedInstallationPanel();
  programmingUnmatchedInstallationPanel?.classList.remove("hidden");
}

function closeProgrammingUnmatchedInstallationPanel() {
  programmingUnmatchedInstallationPanel?.classList.add("hidden");
}

async function applyProgrammingUnmatchedInstallationProposals() {
  const proposals = getSelectedProgrammingUnmatchedInstallationProposals();
  if (!proposals.length) {
    setStatus("Selecciona al menos una instalación para aplicar.", "error");
    return;
  }

  const affectedCount = proposals.reduce((total, item) => total + item.rows.length, 0);
  const confirmed = window.confirm(
    `Vas a aplicar instalaciones a ${affectedCount} registro${
      affectedCount === 1 ? "" : "s"
    } de programación, sin tener en cuenta los filtros activos.`
  );
  if (!confirmed) {
    return;
  }

  const persistedChanges = proposals
    .map((item) => ({
      proposalName: item.proposalName,
      ids: item.rows.map((row) => Number(row.id)).filter((id) => Number.isFinite(id)),
    }))
    .filter((item) => item.ids.length);
  const previewChanges = proposals
    .map((item) => ({
      proposalName: item.proposalName,
      rows: item.rows.filter((row) => !row.id),
    }))
    .filter((item) => item.rows.length);

  if (persistedChanges.length) {
    const session = await ensurePrivateSession({ silent: true });
    if (!session) {
      setStatus("Necesitas iniciar sesión para aplicar las instalaciones.", "error");
      return;
    }

    const supabase = await getSupabaseClient();
    const results = await Promise.all(
      persistedChanges.map((item) =>
        supabase.from(PROGRAMMING_TABLE_NAME).update({ instalacion: item.proposalName }).in("id", item.ids)
      )
    );
    const error = results.find((result) => result.error)?.error;
    if (error) {
      setStatus(`No se pudieron aplicar las instalaciones: ${error.message}`, "error");
      return;
    }
  }

  previewChanges.forEach((item) => {
    item.rows.forEach((row) => {
      row.instalacion = item.proposalName;
    });
  });

  if (persistedChanges.length) {
    await loadProgrammingFromSupabase();
  } else {
    renderProgrammingPreview(currentProgrammingRows, currentProgrammingSourceName, {
      canUpload: currentProgrammingCanUpload,
    });
  }

  renderProgrammingUnmatchedInstallationPanel();
  setStatus(`Instalaciones aplicadas correctamente a ${affectedCount} registro${affectedCount === 1 ? "" : "s"}.`, "success");
}

async function acceptProgrammingUnmatchedInstallationProposal(sourceName) {
  const normalizedSource = normalizeProgrammingText(sourceName);
  const proposal = getSelectedProgrammingUnmatchedInstallationProposals().find(
    (item) => normalizeProgrammingText(item.sourceName) === normalizedSource
  );
  if (!proposal) {
    setStatus("Selecciona la instalación que quieres asignar.", "error");
    return;
  }

  const ids = proposal.rows.map((row) => Number(row.id)).filter((id) => Number.isFinite(id));
  const previewRows = proposal.rows.filter((row) => !row.id);
  if (ids.length) {
    const session = await ensurePrivateSession({ silent: true });
    if (!session) {
      setStatus("Necesitas iniciar sesión para aplicar la instalación.", "error");
      return;
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from(PROGRAMMING_TABLE_NAME)
      .update({ instalacion: proposal.proposalName })
      .in("id", ids);
    if (error) {
      setStatus(`No se pudo aplicar la instalación: ${error.message}`, "error");
      return;
    }
  }

  previewRows.forEach((row) => {
    row.instalacion = proposal.proposalName;
  });
  ignoredProgrammingUnmatchedInstallationKeys.add(normalizedSource);

  if (ids.length) {
    await loadProgrammingFromSupabase();
  } else {
    renderProgrammingPreview(currentProgrammingRows, currentProgrammingSourceName, {
      canUpload: currentProgrammingCanUpload,
    });
  }

  renderProgrammingUnmatchedInstallationPanel();
  setStatus(`Instalación aplicada a ${proposal.rows.length} registro${proposal.rows.length === 1 ? "" : "s"}.`, "success");
}

async function changeFilteredProgrammingInstallation() {
  const installationName = normalizeProgrammingCell(programmingBulkInstallationInput?.value);
  if (!installationName) {
    setStatus("Indica el nombre de instalación para aplicar.", "error");
    return;
  }

  if (!filteredProgrammingRows.length) {
    setStatus("No hay registros filtrados para cambiar la instalación.", "error");
    return;
  }

  const assignmentCount = filteredProgrammingRows.length;
  const persistedIds = filteredProgrammingRows
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id));
  const previewRows = filteredProgrammingRows.filter((row) => !row.id);
  const confirmed = window.confirm(
    `Vas a cambiar la instalación a "${installationName}" en ${assignmentCount} registro${
      assignmentCount === 1 ? "" : "s"
    } filtrado${assignmentCount === 1 ? "" : "s"}.`
  );
  if (!confirmed) {
    return;
  }

  if (persistedIds.length) {
    const session = await ensurePrivateSession({ silent: true });
    if (!session) {
      setStatus("Necesitas iniciar sesión para cambiar instalaciones.", "error");
      return;
    }

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from(PROGRAMMING_TABLE_NAME)
      .update({ instalacion: installationName })
      .in("id", persistedIds);

    if (error) {
      setStatus(`No se pudo cambiar la instalación: ${error.message}`, "error");
      return;
    }
  }

  previewRows.forEach((row) => {
    row.instalacion = installationName;
  });

  if (persistedIds.length) {
    await loadProgrammingFromSupabase();
  } else {
    renderProgrammingPreview(currentProgrammingRows, currentProgrammingSourceName, {
      canUpload: currentProgrammingCanUpload,
    });
  }
  clearProgrammingBulkInstallation();

  setStatus(
    `Instalación actualizada correctamente en ${assignmentCount} registro${
      assignmentCount === 1 ? "" : "s"
    }.`,
    "success"
  );
}

async function prepareProgrammingCsv(file) {
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const rows = normalizeProgrammingRows(text);
    renderProgrammingPreview(rows, file.name, { canUpload: true });
    setStatus(`CSV de programación cargado correctamente. Registros detectados: ${rows.length}.`, "success");
  } catch (error) {
    resetProgrammingPreview();
    setStatus(`No se pudo procesar el CSV de programación: ${error.message}`, "error");
  }
}

function rowsToProgrammingCsv(rows) {
  const headers = [
    "PERSONAL",
    "INSTALACIÓN",
    "FECHA",
    "INICI.",
    "FIN",
    "HORA",
    "DEPORTE",
    "ACTIVIDAD",
  ];
  const csvRows = [headers];

  rows.forEach((row) => {
    csvRows.push([
      row.personal,
      row.instalacion,
      row.fecha,
      row.inicio,
      row.fin,
      row.hora,
      row.deporte,
      row.actividad,
    ]);
  });

  return csvRows
    .map((row) =>
      row
        .map((value) => {
          const normalized = String(value ?? "");
          if (/[;"\n\r]/.test(normalized)) {
            return `"${normalized.replaceAll('"', '""')}"`;
          }
          return normalized;
        })
        .join(";")
    )
    .join("\n");
}

function downloadProgrammingCsv() {
  void (async () => {
    try {
      const { dateFrom, dateTo } = validateProgrammingReportRange();
      const rows = await fetchProgrammingRowsForReport(dateFrom, dateTo);

      if (!rows.length) {
        setStatus("No hay registros de programación en el intervalo indicado.", "error");
        return;
      }

      const csvContent = rowsToProgrammingCsv(rows);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      triggerDownload(blob, `programacion-${dateFrom}-${dateTo}.csv`);
      setStatus(`CSV de programación descargado correctamente. Registros incluidos: ${rows.length}.`, "success");
    } catch (error) {
      setStatus(`No se pudo descargar el CSV de programación: ${error?.message ?? "error desconocido"}`, "error");
    }
  })();
}

function downloadProgrammingJson() {
  if (!currentProgrammingRows.length) {
    setStatus("No hay programación cargada para descargar.", "error");
    return;
  }

  const jsonContent = JSON.stringify(currentProgrammingRows, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  triggerDownload(blob, "programacion.json");
  setStatus("JSON de programación descargado correctamente.", "success");
}

function mapProgrammingRowsForSupabase(
  rows,
  sourceName = currentProgrammingSourceName,
  programmingType = null
) {
  return rows.map((row, index) => ({
    personal: String(row.personal ?? "").trim() || PROGRAMMING_UNASSIGNED_PERSONAL,
    instalacion: row.instalacion,
    fecha: normalizeImportedDate(row.fecha),
    hora_inicio: normalizeImportedTime(row.inicio),
    hora_fin: normalizeImportedTime(row.fin),
    hora_evento: normalizeImportedTime(row.hora),
    deporte: row.deporte || null,
    actividad: row.actividad || null,
    source_file: sourceName || "programacion.csv",
    sort_order: index + 1,
    tipo_programacion: normalizeProgrammingType(
      programmingType ?? row.tipoProgramacion ?? getDefaultProgrammingTypeForNewRows()
    ),
  }));
}

function countProgrammingUnassignedRows(rows) {
  return rows.filter((row) => row.personal === PROGRAMMING_UNASSIGNED_PERSONAL).length;
}

function validateProgrammingRowsForSupabase(rows) {
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    if (!String(row.instalacion ?? "").trim()) {
      errors.push(`Fila ${rowNumber}: falta el campo Instalación.`);
    }

    if (!row.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(String(row.fecha))) {
      errors.push(`Fila ${rowNumber}: fecha no valida (${String(row.fecha ?? "")}).`);
    }

    if (!row.hora_inicio || !/^\d{2}:\d{2}:\d{2}$/.test(String(row.hora_inicio))) {
      errors.push(`Fila ${rowNumber}: hora inicio no valida (${String(row.hora_inicio ?? "")}).`);
    }

    if (row.hora_fin && !/^\d{2}:\d{2}:\d{2}$/.test(String(row.hora_fin))) {
      errors.push(`Fila ${rowNumber}: hora fin no valida (${String(row.hora_fin ?? "")}).`);
    }

    if (row.hora_evento && !/^\d{2}:\d{2}:\d{2}$/.test(String(row.hora_evento))) {
      errors.push(`Fila ${rowNumber}: hora evento no valida (${String(row.hora_evento ?? "")}).`);
    }
  });

  return errors;
}

function formatSupabaseErrorDetails(error) {
  const parts = [error?.message, error?.details, error?.hint, error?.code].filter(Boolean);
  return parts.join(" | ");
}

function isMissingArchivedAtColumnError(error) {
  const message = String(error?.message ?? "");
  const details = String(error?.details ?? "");
  const hint = String(error?.hint ?? "");
  return [message, details, hint].some((value) => value.includes("archived_at"));
}

function getArchivedAtMissingColumnMessage() {
  return "No se pudo actualizar el archivado porque falta la columna archived_at en Supabase. Ejecuta el SQL actualizado de supabase/tables/programacion_conserjes.sql y espera unos segundos a que Supabase refresque la caché del esquema.";
}

async function insertProgrammingRowsWithDiagnostics(supabase, rows, batchSize = 500) {
  for (let index = 0; index < rows.length; index += batchSize) {
    const chunk = rows.slice(index, index + batchSize);
    const { error } = await supabase.from(PROGRAMMING_TABLE_NAME).insert(chunk);

    if (!error) {
      continue;
    }

    if (chunk.length === 1) {
      const failingRow = chunk[0];
      const rowNumber = index + 1;
      throw new Error(
        `Error en fila ${rowNumber} (${failingRow.personal || "-"} / ${
          failingRow.instalacion || "-"
        }): ${formatSupabaseErrorDetails(error)}`
      );
    }

    for (let chunkIndex = 0; chunkIndex < chunk.length; chunkIndex += 1) {
      const singleRow = chunk[chunkIndex];
      const { error: singleError } = await supabase.from(PROGRAMMING_TABLE_NAME).insert(singleRow);

      if (singleError) {
        const rowNumber = index + chunkIndex + 1;
        throw new Error(
          `Error en fila ${rowNumber} (${singleRow.personal || "-"} / ${
            singleRow.instalacion || "-"
          }): ${formatSupabaseErrorDetails(singleError)}`
        );
      }
    }

    throw new Error(formatSupabaseErrorDetails(error));
  }
}

async function clearFindeSemanaTable() {
  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus(`Necesitas iniciar sesión para borrar ${getProgrammingTypeLabel()}.`, "error");
    return;
  }

  const confirmed = window.confirm(
    `Vas a borrar todos los registros activos de ${getProgrammingTypeLabel()}. Los archivados se conservaran.`
  );
  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();
  let deleteQuery = supabase
    .from(PROGRAMMING_TABLE_NAME)
    .delete()
    .is("archived_at", null);
  deleteQuery = applyProgrammingTypeFilter(deleteQuery);
  const { error } = await deleteQuery;

  if (error) {
    setStatus(`No se pudo vaciar ${getProgrammingTypeLabel()}: ${error.message}`, "error");
    return;
  }

  await loadProgrammingFromSupabase();
  setStatus(`Registros activos de ${getProgrammingTypeLabel()} borrados correctamente.`, "success");
}

async function uploadProgrammingRowsToSupabase() {
  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para cargar la programación en Supabase.", "error");
    return;
  }

  if (!currentProgrammingRows.length) {
    setStatus("No hay programación cargada para enviar a Supabase.", "error");
    return;
  }

  if (!currentProgrammingCanUpload) {
    setStatus("Carga un Word o CSV antes de añadir registros a Supabase.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Se añadiran ${currentProgrammingRows.length} filas de la vista previa a ${getProgrammingTypeLabel()}. Los registros actuales se conservaran.`
  );
  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();
  const rows = mapProgrammingRowsForSupabase(currentProgrammingRows);
  const unassignedCount = countProgrammingUnassignedRows(rows);
  const validationErrors = validateProgrammingRowsForSupabase(rows);

  if (validationErrors.length) {
    setStatus(
      `No se puede importar la vista previa. ${validationErrors.slice(0, 3).join(" ")}${
        validationErrors.length > 3 ? ` Hay ${validationErrors.length} errores en total.` : ""
      }`,
      "error"
    );
    return;
  }

  try {
    await insertProgrammingRowsWithDiagnostics(supabase, rows);
  } catch (error) {
    setStatus(`No se pudo cargar la vista previa en ${getProgrammingTypeLabel()}: ${error.message}`, "error");
    return;
  }

  await loadProgrammingFromSupabase();
  setStatus(
    `Vista previa añadida correctamente a ${getProgrammingTypeLabel()}: ${rows.length} registros. La fecha y hora de carga queda registrada en created_at.${
      unassignedCount
        ? ` ${unassignedCount} filas se importaron con Personal = "${PROGRAMMING_UNASSIGNED_PERSONAL}".`
        : ""
    }`,
    "success"
  );
}

async function insertFilteredProgrammingImportRows() {
  const session = await ensurePrivateSession({ silent: true });
  if (!session) {
    setStatus("Necesitas iniciar sesión para cargar la programación en Supabase.", "error");
    return;
  }

  if (!filteredProgrammingImportRows.length) {
    setStatus("No hay registros filtrados para insertar.", "error");
    return;
  }

  const importType = getProgrammingImportType();
  const confirmed = window.confirm(
    `Se insertaran ${filteredProgrammingImportRows.length} registro${
      filteredProgrammingImportRows.length === 1 ? "" : "s"
    } filtrado${filteredProgrammingImportRows.length === 1 ? "" : "s"} en ${getProgrammingTypeLabel(importType)}.`
  );
  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();
  const rows = mapProgrammingRowsForSupabase(
    filteredProgrammingImportRows,
    pendingProgrammingImportSourceName,
    importType
  );
  const unassignedCount = countProgrammingUnassignedRows(rows);
  const validationErrors = validateProgrammingRowsForSupabase(rows);

  if (validationErrors.length) {
    setStatus(
      `No se puede importar el archivo. ${validationErrors.slice(0, 3).join(" ")}${
        validationErrors.length > 3 ? ` Hay ${validationErrors.length} errores en total.` : ""
      }`,
      "error"
    );
    return;
  }

  try {
    await insertProgrammingRowsWithDiagnostics(supabase, rows);
  } catch (error) {
    setStatus(`No se pudieron insertar los registros filtrados: ${error.message}`, "error");
    return;
  }

  await loadProgrammingFromSupabase();
  applyProgrammingImportPreviewFilters();
  setStatus(
    `Registros filtrados insertados correctamente: ${rows.length}.${
      unassignedCount
        ? ` ${unassignedCount} filas se importaron con Personal = "${PROGRAMMING_UNASSIGNED_PERSONAL}".`
        : ""
    }`,
    "success"
  );
}

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

function addTagToSelection(tag) {
  const normalizedTag = normalizeTag(tag);

  if (!normalizedTag) {
    return false;
  }

  if (!selectedCandidateTags.includes(normalizedTag)) {
    selectedCandidateTags = sortTextValues([...selectedCandidateTags, normalizedTag]);
    syncTagsUi();
  }

  return true;
}

function removeTagFromSelection(tag) {
  selectedCandidateTags = selectedCandidateTags.filter((item) => item !== tag);
  syncTagsUi();
}

function collectRoles(form, roleName, specialtiesName) {
  const selectedRoles = Array.from(
    form.querySelectorAll(`input[name="${roleName}"]:checked`)
  ).map((checkbox) => checkbox.value);
  const selectedSpecialties = Array.from(
    form.querySelectorAll(`input[name="${specialtiesName}"]:checked`)
  ).map((checkbox) => checkbox.value);

  return {
    selectedRoles,
    normalizedSpecialties: normalizeSportSpecialties(selectedSpecialties),
  };
}

function buildCandidatePayload({
  id,
  fullName,
  phone,
  email,
  registrationDate,
  roles,
  specialties,
  notes,
  observations,
  tags = [],
  attachmentName = "",
  attachmentPath = "",
  attachmentMimeType = "",
  privacyAccepted = false,
  vacancyConsent = false,
  candidateStatus = "Pendiente",
  source = "private",
}) {
  return {
    id,
    full_name: fullName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    registration_date: registrationDate,
    candidate_status: normalizeCandidateStatus(candidateStatus),
    job_roles: roles,
    sport_specialties: specialties,
    tags,
    notes: notes.trim(),
    observations: observations.trim(),
    attachment_name: attachmentName,
    attachment_path: attachmentPath,
    attachment_mime_type: attachmentMimeType,
    privacy_accepted: privacyAccepted,
    vacancy_consent: vacancyConsent,
    source,
    created_at: new Date().toISOString(),
  };
}

function syncSportSpecialtiesVisibilityFor(form, trigger, group, specialtiesName) {
  const isChecked = trigger.checked;
  group.classList.toggle("hidden-submenu", !isChecked);

  if (!isChecked) {
    form.querySelectorAll(`input[name="${specialtiesName}"]`).forEach((checkbox) => {
      checkbox.checked = false;
    });
  }
}

async function fetchCandidates() {
  const requestId = ++candidateFetchRequestId;
  if (!currentSession) {
    currentCandidates = [];
    filteredCandidates = [];
    candidateTotalCount = 0;
    candidateFilteredCount = 0;
    renderCandidates([]);
    updateResultsSummary();
    updatePaginationUi(0);
    syncTagsUi();
    return [];
  }

  const supabase = await getSupabaseClient();
  const filters = buildCandidateFilters();
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("candidates")
    .select(CANDIDATE_SELECT_COLUMNS, { count: "exact" })
    .range(from, to);
  query = applyCandidateFiltersToQuery(query, filters);
  query = applyCandidateSortToQuery(query);

  const [{ data, error, count }, totalResult, filterOptionsResult] = await Promise.all([
    query,
    supabase.from("candidates").select("id", { count: "exact", head: true }),
    fetchCandidateFilterOptions(supabase).then(
      () => ({ ok: true }),
      (filterError) => ({ ok: false, error: filterError })
    ),
  ]);

  if (error) {
    if (requestId !== candidateFetchRequestId) {
      return currentCandidates;
    }
    setStatus(`No se pudieron cargar las candidaturas: ${error.message}`, "error");
    return [];
  }

  if (requestId !== candidateFetchRequestId) {
    return currentCandidates;
  }

  if (totalResult.error) {
    setStatus(`No se pudo calcular el total de candidaturas: ${totalResult.error.message}`, "error");
  }

  if (!filterOptionsResult.ok) {
    invalidateCandidateFilterOptions();
    candidateFilterOptions = {
      roles: sortTextValues(
        Array.from(new Set((data ?? []).flatMap((candidate) => candidate.job_roles ?? [])))
      ),
      tags: sortTextValues(
        Array.from(new Set((data ?? []).flatMap((candidate) => candidate.tags ?? []).map(normalizeTag))).filter(Boolean)
      ),
    };
    candidateFilterOptionsLoaded = true;
    renderFilterOptions();
  }

  currentCandidates = currentSort.field === "job_roles" ? sortCandidates(data ?? []) : data ?? [];
  filteredCandidates = currentCandidates;
  candidateTotalCount = totalResult.count ?? currentCandidates.length;
  candidateFilteredCount = count ?? currentCandidates.length;
  const totalPages = getTotalPages(candidateFilteredCount);
  if (currentPage > totalPages) {
    currentPage = totalPages;
    return fetchCandidates();
  }
  selectedCandidateIds = new Set(
    [...selectedCandidateIds].filter((candidateId) =>
      currentCandidates.some((candidate) => candidate.id === candidateId)
    )
  );
  currentPage = Math.min(currentPage, getTotalPages(candidateFilteredCount));
  renderCandidates(filteredCandidates);
  updateResultsSummary();
  updatePaginationUi(candidateFilteredCount);
  syncSortButtons();
  syncTagsUi();
  return currentCandidates;
}

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

  const pageSize = 1000;
  const maxRows = 60000;
  let offset = 0;
  const rows = [];

  while (offset < maxRows) {
    let query = supabase
        .from("registros")
        .select("id, personal, dni, centro, puesto, fecha")
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);
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

async function uploadFileToSupabase(candidateId, source, file) {
  const supabase = await getSupabaseClient();
  const safeName = sanitizeFileName(file.name);
  const path = `${source}/${candidateId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(supabaseConfig.bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (error) {
    throw error;
  }

  return path;
}

async function savePublicCandidate(payload, file) {
  let attachmentPath = "";

  if (file) {
    attachmentPath = await uploadFileToSupabase(payload.id, payload.source, file);
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("candidates").insert({
    ...payload,
    attachment_name: file?.name ?? "",
    attachment_path: attachmentPath,
    attachment_mime_type: file?.type ?? "",
  });

  if (error) {
    throw error;
  }
}

async function savePrivateCandidate(payload, file) {
  let attachmentPath = "";

  if (file) {
    attachmentPath = await uploadFileToSupabase(payload.id, payload.source, file);
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("candidates").insert({
    ...payload,
    attachment_name: file?.name ?? "",
    attachment_path: attachmentPath,
    attachment_mime_type: file?.type ?? "",
  });

  if (error) {
    throw error;
  }
}

async function handlePublicCandidateSubmit(event) {
  event.preventDefault();

  const { selectedRoles, normalizedSpecialties } = collectRoles(
    publicCandidateForm,
    "public_roles",
    "public_sport_specialties"
  );
  const file = document.querySelector("#public-cv-file").files?.[0];

  if (!selectedRoles.length) {
    setStatus("Selecciona al menos un puesto para la candidatura.", "error");
    return;
  }

  if (selectedRoles.includes("Monitorado deportivo") && !normalizedSpecialties.length) {
    setStatus("Marca al menos una modalidad de monitorado deportivo.", "error");
    return;
  }

  const candidateId = crypto.randomUUID();
  const payload = buildCandidatePayload({
    id: candidateId,
    fullName: document.querySelector("#public-full-name").value,
    phone: document.querySelector("#public-phone").value,
    email: document.querySelector("#public-email").value,
    registrationDate: new Date().toISOString().slice(0, 10),
    roles: selectedRoles,
    specialties: normalizedSpecialties,
    notes: document.querySelector("#public-notes").value,
    observations: document.querySelector("#public-observations").value,
    privacyAccepted: document.querySelector("#public-privacy-acceptance").checked,
    vacancyConsent: document.querySelector("#public-vacancy-consent").checked,
    source: "public",
  });

  try {
    await savePublicCandidate(payload, file);
  } catch (error) {
    setStatus(`No se pudo enviar la candidatura: ${error.message}`, "error");
    return;
  }

  publicCandidateForm.reset();
  syncSportSpecialtiesVisibilityFor(
    publicCandidateForm,
    publicSportRoleCheckbox,
    publicSportSpecialtiesGroup,
    "public_sport_specialties"
  );
  showPublicToastMessage("Candidatura enviada correctamente.");
  setStatus("Candidatura enviada correctamente a Supabase.", "success");
}

async function handleLogin(event) {
  event.preventDefault();

  try {
    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;

    setStatus("Validando acceso...");

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus(`No se pudo iniciar sesión: ${error.message}`, "error");
      return;
    }

    currentSession = data.session;
    switchPanel("private");
    togglePrivateView(true, data.user?.email ?? email);
    await loadPrivateDataAfterAuth();
    loginForm.reset();
    setStatus("Acceso concedido. Panel privado conectado con Supabase.", "success");
  } catch (error) {
    setStatus(`No se pudo iniciar sesión: ${error.message}`, "error");
  }
}

async function handlePasswordRecovery(event) {
  event.preventDefault();

  const email = passwordRecoveryEmailInput.value.trim();
  if (!email) {
    setStatus("Escribe el correo para recuperar la contrasena.", "error");
    return;
  }

  try {
    setStatus("Enviando enlace de recuperacion...");
    const supabase = await getSupabaseClient();
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setStatus(`No se pudo enviar el enlace: ${error.message}`, "error");
      return;
    }

    passwordRecoveryForm.reset();
    showLoginFormView();
    setStatus("Enlace de recuperacion enviado. Revisa el correo.", "success");
  } catch (error) {
    setStatus(`No se pudo enviar el enlace: ${error.message}`, "error");
  }
}

async function loadPrivateDataAfterAuth() {
  await refreshPrivateTabData(currentPrivateTabTarget);
}

async function handleInviteSetup(event) {
  event.preventDefault();

  const password = document.querySelector("#invite-password").value;
  const passwordConfirm = document.querySelector("#invite-password-confirm").value;

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
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus(`No se pudo guardar la contrasena: ${error.message}`, "error");
      return;
    }

    const session = await ensurePrivateSession({ silent: true });
    currentSession = session;
    clearAuthUrl();
    togglePrivateView(true, data.user?.email ?? session?.user?.email ?? "");
    inviteSetupForm.reset();
    await loadPrivateDataAfterAuth();
    setStatus("Contrasena creada. Acceso concedido.", "success");
  } catch (error) {
    setStatus(`No se pudo completar la invitacion: ${error.message}`, "error");
  }
}

async function handleLogout() {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    setStatus(`No se pudo cerrar sesión: ${error.message}`, "error");
    return;
  }

  currentSession = null;
  invalidateCandidateFilterOptions();
  invalidateControlLookupCaches();
  togglePrivateView(false);
  currentCandidates = [];
  currentControlRecords = [];
  filteredControlRecords = [];
  controlSummaryRows = [];
  controlRecordsTotalCount = 0;
  currentProgrammingPersonnel = [];
  programmingPersonnelCatalogRows = [];
  programmingInstallationCatalogRows = [];
  currentProgrammingAssignedInstallations = [];
  currentProgrammingActiveInstallations = [];
  eventAllInstallationRows = [];
  eventInstallationRows = [];
  eventPersonnelRows = [];
  eventAssignedInstallationIds = new Set();
  eventAssemblyPersonnelIds = new Set();
  eventsCatalogsLoaded = false;
  renderFilterOptions();
  clearFilters();
  renderProgrammingPersonnelUi();
  renderControlRecords([]);
  renderControlSummary([]);
  updateControlPaginationUi(0, 0);
  syncTagsUi();
  setStatus("Sesion cerrada.");
}

async function handlePrivateCandidateSubmit(event) {
  event.preventDefault();

  const { selectedRoles, normalizedSpecialties } = collectRoles(
    candidateForm,
    "roles",
    "sport_specialties"
  );
  const file = candidateCvFileInput?.files?.[0];

  if (!selectedRoles.length) {
    setStatus("Selecciona al menos un puesto para la candidatura.", "error");
    return;
  }

  if (selectedRoles.includes("Monitorado deportivo") && !normalizedSpecialties.length) {
    setStatus("Marca al menos una modalidad de monitorado deportivo.", "error");
    return;
  }

  const payload = buildCandidatePayload({
    id: crypto.randomUUID(),
    fullName: document.querySelector("#full-name").value,
    phone: document.querySelector("#phone").value,
    email: document.querySelector("#candidate-email").value,
    registrationDate: document.querySelector("#registration-date").value,
    roles: selectedRoles,
    specialties: normalizedSpecialties,
    notes: document.querySelector("#notes").value,
    observations: document.querySelector("#observations").value,
    tags: selectedCandidateTags,
    privacyAccepted: true,
    vacancyConsent: false,
    source: "private",
  });

  try {
    await savePrivateCandidate(payload, file);
  } catch (error) {
    setStatus(`No se pudo guardar la candidatura: ${error.message}`, "error");
    return;
  }

  closeCandidateCreatePanel({ force: true });
  invalidateCandidateFilterOptions();
  await fetchCandidates();
  switchPrivateTab("search");
  setStatus("Candidatura guardada correctamente en Supabase.", "success");
}

function validateRoleOptions() {
  const definedCheckboxes = Array.from(document.querySelectorAll('input[name="roles"]')).map(
    (input) => input.value
  );

  const matches = JOB_OPTIONS.every((option) => definedCheckboxes.includes(option));

  if (!matches) {
    setStatus("La configuracion de puestos en la interfaz no coincide.", "error");
  }
}

async function restoreSession() {
  initControlFilters();
  const session = await ensurePrivateSession({ silent: true });

  if (!session) {
    togglePrivateView(false);
    return false;
  }

  if (getAuthUrlType() === "invite" || getAuthUrlType() === "recovery") {
    showInviteSetupView(session.user.email ?? "");
    setStatus("Define una contrasena para completar el alta del usuario.", "success");
    return true;
  }

  togglePrivateView(true, session.user.email ?? "");
  clearAuthUrl();
  await loadPrivateDataAfterAuth();
  return true;
}

async function refreshPrivateTabData(target = currentPrivateTabTarget) {
  const normalizedTarget = normalizePrivateTabTarget(target);
  if (normalizedTarget === "search") {
    await fetchCandidates();
    return;
  }

  if (normalizedTarget === "control") {
    await fetchControlFilterOptions();
    await fetchControlRecords();
    return;
  }

  if (normalizedTarget === "events") {
    await loadEvents();
    return;
  }

  if (normalizedTarget === "programming") {
    await loadProgrammingPersonnel();
    await loadProgrammingFromSupabase();
  }
}

window.__curriculosHandleLogin = (event) => {
  void handleLogin(event);
};

function handleAddSelectedTag() {
  if (!tagSelect.value) {
    setStatus("Selecciona una etiqueta del desplegable.", "error");
    return;
  }

  addTagToSelection(tagSelect.value);
  tagSelect.value = "";
  setStatus("Etiqueta anadida a la candidatura.", "success");
}

function handleCreateTag() {
  const newTag = normalizeTag(newTagInput.value);

  if (!newTag) {
    setStatus("Escribe una etiqueta nueva antes de crearla.", "error");
    return;
  }

  addTagToSelection(newTag);
  newTagInput.value = "";
  setStatus("Etiqueta creada y anadida a la nube.", "success");
}

function handleTagsClick(event) {
  const removeTag = event.target.closest("[data-remove-tag]")?.dataset.removeTag;
  if (removeTag) {
    removeTagFromSelection(removeTag);
    return;
  }

  const cloudTag = event.target.closest("[data-tag-cloud]")?.dataset.tagCloud;
  if (!cloudTag) {
    return;
  }

  if (selectedCandidateTags.includes(cloudTag)) {
    removeTagFromSelection(cloudTag);
    return;
  }

  addTagToSelection(cloudTag);
}

async function handleTableClick(event) {
  const selectAll = event.target.closest("#select-all-candidates");
  if (selectAll) {
    const visibleCandidates = getVisibleCandidates();

    if (selectAll.checked) {
      visibleCandidates.forEach((candidate) => selectedCandidateIds.add(candidate.id));
    } else {
      visibleCandidates.forEach((candidate) => selectedCandidateIds.delete(candidate.id));
    }

    renderCandidates(visibleCandidates);
    return;
  }

  const selectCandidateId = event.target.closest("[data-select-candidate-id]")?.dataset
    .selectCandidateId;
  if (selectCandidateId) {
    if (selectedCandidateIds.has(selectCandidateId)) {
      selectedCandidateIds.delete(selectCandidateId);
    } else {
      selectedCandidateIds.add(selectCandidateId);
    }

    syncSelectionUi(getVisibleCandidates());
    return;
  }

  const sortField = event.target.closest("[data-sort-field]")?.dataset.sortField;
  if (sortField) {
    if (currentSort.field === sortField) {
      currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
    } else {
      currentSort = {
        field: sortField,
        direction: sortField === "registration_date" ? "desc" : "asc",
      };
    }

    applyCandidateFilters();
    return;
  }

  const viewId = event.target.closest("[data-view-id]")?.dataset.viewId;
  if (viewId) {
    openCandidateDetail(viewId, false);
    return;
  }

  const candidateId = event.target.closest("[data-download-id]")?.dataset.downloadId;
  if (!candidateId) {
    return;
  }

  await downloadAttachment(candidateId);
}

function goToPreviousPage() {
  if (currentPage <= 1) {
    return;
  }

  currentPage -= 1;
  applyCandidateFilters();
}

function goToNextPage() {
  if (currentPage >= getTotalPages(candidateFilteredCount)) {
    return;
  }

  currentPage += 1;
  applyCandidateFilters();
}

function handlePageSizeChange() {
  const nextPageSize = Number(pageSizeSelect.value);
  if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) {
    return;
  }

  pageSize = nextPageSize;
  currentPage = 1;
  applyCandidateFilters();
}

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

function resetCandidateCreateForm() {
  candidateForm?.reset();
  selectedCandidateTags = [];
  syncTagsUi();
  syncSportSpecialtiesVisibilityFor(
    candidateForm,
    sportRoleCheckbox,
    sportSpecialtiesGroup,
    "sport_specialties"
  );

  const registrationDateInput = document.querySelector("#registration-date");
  if (registrationDateInput) {
    registrationDateInput.value = new Date().toISOString().slice(0, 10);
  }
}

function openCandidateCreatePanel() {
  markFormPristine(candidateForm);
  privateTabPanelNew?.classList.remove("hidden");
}

function closeCandidateCreatePanel(options = {}) {
  if (!options.force && !confirmDiscardFormChanges(candidateForm)) {
    return false;
  }

  privateTabPanelNew?.classList.add("hidden");
  resetCandidateCreateForm();
  markFormPristine(candidateForm);
  return true;
}

function getEventInstallationName(id) {
  const normalizedId = Number(id);
  return (
    eventInstallationRows.find((row) => Number(row.id) === normalizedId)?.instalacion ||
    eventAllInstallationRows.find((row) => Number(row.id) === normalizedId)?.instalacion ||
    ""
  );
}

function getEventPersonnelName(id) {
  const normalizedId = Number(id);
  return eventPersonnelRows.find((row) => Number(row.id) === normalizedId)?.personal || "";
}

function renderEventCatalogOptions() {
  const installationOptions = [
    '<option value="">Selecciona instalación</option>',
    ...eventInstallationRows.map(
      (row) => `<option value="${row.id}">${escapeHtml(row.instalacion)}</option>`
    ),
  ].join("");

  if (eventInstallationSelect) {
    eventInstallationSelect.innerHTML = installationOptions;
  }

  renderEventSchedulePersonnelLists();
}

function renderEventSchedulePersonnelLists() {
  if (!eventScheduleAvailablePersonnelSelect || !eventScheduleSelectedPersonnelSelect) {
    return;
  }

  const availableRows = eventPersonnelRows.filter((row) => {
    const id = Number(row.id);
    return eventAssemblyPersonnelIds.has(id) && !currentEventScheduleSelectedPersonnelIds.has(id);
  });
  const selectedRows = eventPersonnelRows.filter((row) =>
    currentEventScheduleSelectedPersonnelIds.has(Number(row.id))
  );

  eventScheduleAvailablePersonnelSelect.innerHTML = availableRows
    .map((row) => `<option value="${row.id}">${escapeHtml(row.personal)}</option>`)
    .join("");
  eventScheduleSelectedPersonnelSelect.innerHTML = selectedRows
    .map((row) => `<option value="${row.id}">${escapeHtml(row.personal)}</option>`)
    .join("");
}

function moveEventSchedulePersonnel(personalIds, shouldSelect) {
  personalIds.map(Number).filter(Boolean).forEach((personalId) => {
    if (shouldSelect) {
      currentEventScheduleSelectedPersonnelIds.add(personalId);
    } else {
      currentEventScheduleSelectedPersonnelIds.delete(personalId);
    }
  });
  renderEventSchedulePersonnelLists();
}

function syncEventScheduleTransportField() {
  const needsTransport = Boolean(eventScheduleNeedsTransportInput?.checked);
  eventScheduleTransportDetailField?.classList.toggle("hidden", !needsTransport);
  if (!needsTransport && eventScheduleTransportDetailInput) {
    eventScheduleTransportDetailInput.value = "";
  }
}

function renderEventSettings() {
  renderEventInstallationSettings();

  if (!eventAssemblyAvailableSelect || !eventAssemblySelectedSelect) {
    return;
  }

  const filterText = normalizeSearchText(eventAssemblyPersonnelFilter?.value || "");
  const filteredRows = eventPersonnelRows.filter((row) =>
    normalizeSearchText(row.personal).includes(filterText)
  );
  const availableRows = filteredRows.filter((row) => !eventAssemblyPersonnelIds.has(Number(row.id)));
  const selectedRows = filteredRows.filter((row) => eventAssemblyPersonnelIds.has(Number(row.id)));

  if (!eventPersonnelRows.length) {
    eventAssemblyAvailableSelect.innerHTML = "";
    eventAssemblySelectedSelect.innerHTML = "";
    return;
  }

  eventAssemblyAvailableSelect.innerHTML = availableRows
    .map((row) => `<option value="${row.id}">${escapeHtml(row.personal)}</option>`)
    .join("");
  eventAssemblySelectedSelect.innerHTML = selectedRows
    .map((row) => `<option value="${row.id}">${escapeHtml(row.personal)}</option>`)
    .join("");
}

function renderEventInstallationSettings() {
  if (!eventInstallationAvailableSelect || !eventInstallationSelectedSelect) {
    return;
  }

  const filterText = normalizeSearchText(eventInstallationFilter?.value || "");
  const filteredRows = eventAllInstallationRows.filter((row) => {
    const haystack = normalizeSearchText(row.instalacion);
    return !filterText || haystack.includes(filterText);
  });
  const availableRows = filteredRows.filter(
    (row) => !eventAssignedInstallationIds.has(Number(row.id))
  );
  const selectedRows = filteredRows.filter((row) =>
    eventAssignedInstallationIds.has(Number(row.id))
  );

  eventInstallationAvailableSelect.innerHTML = availableRows
    .map((row) => `<option value="${row.id}">${escapeHtml(row.instalacion)}</option>`)
    .join("");
  eventInstallationSelectedSelect.innerHTML = selectedRows
    .map((row) => `<option value="${row.id}">${escapeHtml(row.instalacion)}</option>`)
    .join("");
}

function openEventSettingsPanel() {
  renderEventSettings();
  eventSettingsPanel?.classList.remove("hidden");
}

function closeEventSettingsPanel() {
  eventSettingsPanel?.classList.add("hidden");
}

function isEventArchived(event) {
  return Boolean(event?.archived_at);
}

function getFilteredEvents() {
  const nameQuery = normalizeSearchText(eventFilterNameInput?.value || "");
  const installationId = eventFilterInstallationSelect?.value || "";
  const startDate = eventFilterStartDateInput?.value || "";
  const includeArchived = Boolean(eventFilterIncludeArchivedInput?.checked);

  return currentEvents.filter((event) => {
    if (!includeArchived && isEventArchived(event)) {
      return false;
    }
    const matchesName = !nameQuery || normalizeSearchText(event.nombre).includes(nameQuery);
    const matchesInstallation =
      !installationId || String(event.instalacion_id) === String(installationId);
    const matchesStartDate = !startDate || event.fecha_inicio === startDate;
    return matchesName && matchesInstallation && matchesStartDate;
  });
}

function resetSingleEventFilter(filterName) {
  const fieldMap = {
    name: eventFilterNameInput,
    installation: eventFilterInstallationSelect,
    start_date: eventFilterStartDateInput,
  };
  const field = fieldMap[filterName];

  if (!field) {
    return;
  }

  field.value = "";
  renderEventsTable();
}

function getEventsForInstallationFilter() {
  const nameQuery = normalizeSearchText(eventFilterNameInput?.value || "");
  const startDate = eventFilterStartDateInput?.value || "";
  const includeArchived = Boolean(eventFilterIncludeArchivedInput?.checked);

  return currentEvents.filter((event) => {
    if (!includeArchived && isEventArchived(event)) {
      return false;
    }
    const matchesName = !nameQuery || normalizeSearchText(event.nombre).includes(nameQuery);
    const matchesStartDate = !startDate || event.fecha_inicio === startDate;
    return matchesName && matchesStartDate;
  });
}

function renderEventInstallationFilterOptions() {
  if (!eventFilterInstallationSelect) {
    return;
  }

  const selectedValue = eventFilterInstallationSelect.value;
  const installationIds = new Set(
    getEventsForInstallationFilter().map((event) => String(event.instalacion_id))
  );
  const options = eventInstallationRows.filter((row) =>
    installationIds.has(String(row.id))
  );

  eventFilterInstallationSelect.innerHTML = [
    '<option value="">Todas</option>',
    ...options.map(
      (row) => `<option value="${row.id}">${escapeHtml(row.instalacion)}</option>`
    ),
  ].join("");

  eventFilterInstallationSelect.value = installationIds.has(String(selectedValue)) ? selectedValue : "";
}

function getEventSortValue(event, field) {
  if (field === "instalacion") {
    return normalizeSearchText(getEventInstallationName(event.instalacion_id));
  }

  if (field === "nombre") {
    return normalizeSearchText(event.nombre);
  }

  return String(event[field] ?? "");
}

function getSortedEvents(events) {
  return [...events].sort((a, b) => {
    for (const criterion of eventSortCriteria) {
      const direction = criterion.direction === "asc" ? 1 : -1;
      const valueA = getEventSortValue(a, criterion.field);
      const valueB = getEventSortValue(b, criterion.field);
      if (valueA < valueB) {
        return -1 * direction;
      }
      if (valueA > valueB) {
        return 1 * direction;
      }
    }
    return 0;
  });
}

function syncEventSortButtons() {
  document.querySelectorAll("[data-event-sort-field]").forEach((button) => {
    const criterionIndex = eventSortCriteria.findIndex(
      (criterion) => criterion.field === button.dataset.eventSortField
    );
    const criterion = eventSortCriteria[criterionIndex];
    button.classList.toggle("active", Boolean(criterion));
    button.classList.toggle("sort-asc", criterion?.direction === "asc");
    button.classList.toggle("sort-desc", criterion?.direction === "desc");
    button.title = criterion ? `Orden ${criterionIndex + 1}` : "";
  });
}

function renderEventsTable() {
  if (!eventsTableBody) {
    return;
  }

  renderEventInstallationFilterOptions();
  const visibleEvents = getSortedEvents(getFilteredEvents());
  syncEventSortButtons();

  if (!visibleEvents.length) {
    eventsTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay eventos cargados.</td></tr>';
    return;
  }

  eventsTableBody.innerHTML = visibleEvents
    .map((event) => {
      const isExpanded = expandedEventIds.has(String(event.id));
      const isArchived = isEventArchived(event);
      const eventScheduleRows = currentEventScheduleRows.filter(
        (row) => Number(row.evento_id) === Number(event.id)
      );
      const stepsHtml = eventScheduleRows.length
        ? eventScheduleRows
            .map((row) => {
              const personnelRows = currentEventSchedulePersonnelRows.filter(
                (item) => Number(item.cronograma_id) === Number(row.id)
              );
              const personnelHtml = personnelRows.length
                ? personnelRows
                    .map(
                      (item) => `
                        <div class="event-personnel-row">
                          <strong>${escapeHtml(getEventPersonnelName(item.personal_id))}</strong>
                          <input type="time" value="${escapeHtml(formatHourValue(item.hora_inicio).slice(0, 5))}" data-event-assignment-time="${item.id}" data-event-assignment-start="${item.id}" />
                          <input type="time" value="${escapeHtml(formatHourValue(item.hora_fin).slice(0, 5))}" data-event-assignment-time="${item.id}" data-event-assignment-end="${item.id}" />
                          <button type="button" class="danger-button tooltip-button" aria-label="Quitar personal" data-event-assignment-delete="${item.id}">${renderIcon("delete")}</button>
                        </div>
                      `
                    )
                    .join("")
                : '<span class="muted-text">Sin personal asignado</span>';

              return `
                <article class="event-step">
                  <div class="event-step-actions">
                    <button type="button" class="secondary-button tooltip-button" aria-label="Editar paso" data-event-schedule-edit-id="${row.id}">${renderIcon("edit")}</button>
                  </div>
                  <div>
                    <strong>${escapeHtml(formatDisplayDate(row.fecha))}</strong>
                    <span>${escapeHtml(formatHourValue(row.hora_inicio).slice(0, 5))} - ${escapeHtml(formatHourValue(row.hora_fin).slice(0, 5))}</span>
                    <p class="event-step-activity">${escapeHtml(row.actividad)}</p>
                    ${
                      row.necesita_transporte
                        ? `<p class="muted-text">Transporte: ${escapeHtml(row.transporte_detalle || "Necesario")}</p>`
                        : ""
                    }
                  </div>
                  <div class="event-step-personnel">${personnelHtml}</div>
                </article>
              `;
            })
            .join("")
        : '<p class="empty-state event-empty-state">Este evento no tiene pasos todavía.</p>';

      return `
        <tr class="${isArchived ? "event-row-archived" : ""}">
          <td>
            <div class="action-buttons">
              <button
                type="button"
                class="secondary-button event-toggle-button"
                data-event-toggle-id="${event.id}"
                aria-expanded="${String(isExpanded)}"
                title="${isExpanded ? "Plegar pasos" : "Desplegar pasos"}"
              >
                ${isExpanded ? "&#9652;" : "&#9662;"}
              </button>
              ${
                isExpanded
                  ? `<button type="button" class="tooltip-button" aria-label="Nuevo paso" data-event-schedule-new-id="${event.id}">${renderIcon("new")}</button>`
                  : ""
              }
            </div>
          </td>
          <td>
            <button type="button" class="event-name-button" data-event-edit-id="${event.id}">
              ${escapeHtml(event.nombre)}
            </button>
            ${isArchived ? '<span class="status-pill archived-pill">Archivado</span>' : ""}
            ${event.observaciones ? `<br><span class="muted-text">${escapeHtml(event.observaciones)}</span>` : ""}
          </td>
          <td>${escapeHtml(getEventInstallationName(event.instalacion_id))}</td>
          <td>${escapeHtml(formatDisplayDate(event.fecha_inicio))}</td>
          <td>${escapeHtml(formatDisplayDate(event.fecha_fin))}</td>
        </tr>
        <tr class="event-steps-row ${isExpanded ? "" : "hidden"}">
          <td colspan="5">
            <div class="event-steps-list">
              ${stepsHtml}
            </div>
          </td>
        </tr>
      `
    })
    .join("");
}

function resetEventForm() {
  eventForm?.reset();
  if (eventIdInput) {
    eventIdInput.value = "";
  }
  eventArchivedField?.classList.add("hidden");
  eventDeleteButton?.classList.add("hidden");
  markFormPristine(eventForm);
}

function openEventPanel(event = null) {
  if (event) {
    fillEventForm(event);
    eventPanelTitle.textContent = "Editar evento";
    eventArchivedField?.classList.remove("hidden");
    eventDeleteButton?.classList.remove("hidden");
  } else {
    resetEventForm();
    eventPanelTitle.textContent = "Nuevo evento";
  }

  markFormPristine(eventForm);
  eventPanel?.classList.remove("hidden");
}

function closeEventPanel(options = {}) {
  if (!options.force && !confirmDiscardFormChanges(eventForm)) {
    return false;
  }

  eventPanel?.classList.add("hidden");
  resetEventForm();
  return true;
}

function fillEventForm(event) {
  if (!event) {
    return;
  }

  eventIdInput.value = event.id;
  eventNameInput.value = event.nombre || "";
  eventInstallationSelect.value = String(event.instalacion_id || "");
  eventStartDateInput.value = event.fecha_inicio || "";
  eventEndDateInput.value = event.fecha_fin || "";
  eventObservationsInput.value = event.observaciones || "";
  if (eventArchivedInput) {
    eventArchivedInput.checked = isEventArchived(event);
  }
}

function getSelectedEvent() {
  const selectedId = Number(currentSelectedEventId || eventScheduleEventSelect?.value || 0);
  return currentEvents.find((event) => Number(event.id) === selectedId) || null;
}

function resetEventScheduleForm() {
  eventScheduleForm?.reset();
  if (eventScheduleIdInput) {
    eventScheduleIdInput.value = "";
  }
  eventScheduleDeleteButton?.classList.add("hidden");
  currentEventScheduleSelectedPersonnelIds = new Set();
  renderEventSchedulePersonnelLists();
  markFormPristine(eventScheduleForm);
}

function openEventSchedulePanel(eventId, scheduleId = "") {
  const event = currentEvents.find((row) => String(row.id) === String(eventId));
  if (!event) {
    setStatus("Selecciona un evento válido.", "error");
    return;
  }

  resetEventScheduleForm();
  currentSelectedEventId = String(eventId);
  eventScheduleEventSelect.value = String(eventId);
  eventScheduleTitle.textContent = scheduleId ? `Editar paso de ${event.nombre}` : `Nuevo paso de ${event.nombre}`;

  if (scheduleId) {
    const schedule = currentEventScheduleRows.find((row) => String(row.id) === String(scheduleId));
    if (!schedule) {
      setStatus("No se encontró el paso seleccionado.", "error");
      return;
    }

    eventScheduleIdInput.value = schedule.id;
    eventScheduleDateInput.value = schedule.fecha || "";
    eventScheduleStartInput.value = formatHourValue(schedule.hora_inicio).slice(0, 5);
    eventScheduleEndInput.value = formatHourValue(schedule.hora_fin).slice(0, 5);
    eventScheduleActivityInput.value = schedule.actividad || "";
    eventScheduleNeedsTransportInput.checked = Boolean(schedule.necesita_transporte);
    eventScheduleTransportDetailInput.value = schedule.transporte_detalle || "";
    eventScheduleDeleteButton?.classList.remove("hidden");
    syncEventScheduleTransportField();
    currentEventScheduleSelectedPersonnelIds = new Set(
      currentEventSchedulePersonnelRows
        .filter((item) => Number(item.cronograma_id) === Number(schedule.id))
        .map((item) => Number(item.personal_id))
    );
    renderEventSchedulePersonnelLists();
  } else {
    eventScheduleDateInput.value = event.fecha_inicio || "";
    syncEventScheduleTransportField();
    renderEventSchedulePersonnelLists();
  }

  markFormPristine(eventScheduleForm);
  eventSchedulePanel?.classList.remove("hidden");
}

function closeEventSchedulePanel(options = {}) {
  if (!options.force && !confirmDiscardFormChanges(eventScheduleForm)) {
    return false;
  }

  eventSchedulePanel?.classList.add("hidden");
  resetEventScheduleForm();
  return true;
}

async function loadEventCatalogs() {
  if (eventsCatalogsLoaded) {
    return;
  }

  const supabase = await getSupabaseClient();
  const [installationsResult, assignedInstallationsResult, personnelResult, assemblyPersonnelResult] = await Promise.all([
    supabase
      .from("instalaciones")
      .select("id, instalacion, activo")
      .eq("activo", true)
      .order("instalacion", { ascending: true }),
    supabase
      .from("eventos_instalaciones")
      .select("instalacion_id"),
    supabase
      .from("personal")
      .select("id, personal, vinculacion_id")
      .in("vinculacion_id", [1, 2])
      .order("personal", { ascending: true }),
    supabase
      .from("eventos_montaje_personal")
      .select("personal_id"),
  ]);

  if (installationsResult.error) {
    throw installationsResult.error;
  }
  const assignedInstallationsTableMissing =
    assignedInstallationsResult.error &&
    formatSupabaseErrorDetails(assignedInstallationsResult.error)
      .toLowerCase()
      .includes("eventos_instalaciones");
  if (assignedInstallationsResult.error && !assignedInstallationsTableMissing) {
    throw assignedInstallationsResult.error;
  }
  if (personnelResult.error) {
    throw personnelResult.error;
  }
  if (assemblyPersonnelResult.error) {
    throw assemblyPersonnelResult.error;
  }

  eventAllInstallationRows = installationsResult.data ?? [];
  eventAssignedInstallationIds = new Set(
    assignedInstallationsTableMissing
      ? eventAllInstallationRows.map((row) => Number(row.id))
      : (assignedInstallationsResult.data ?? []).map((row) => Number(row.instalacion_id))
  );
  eventInstallationRows = eventAllInstallationRows.filter((row) =>
    eventAssignedInstallationIds.has(Number(row.id))
  );
  eventPersonnelRows = personnelResult.data ?? [];
  eventAssemblyPersonnelIds = new Set((assemblyPersonnelResult.data ?? []).map((row) => Number(row.personal_id)));
  eventsCatalogsLoaded = true;
  renderEventCatalogOptions();
  renderEventSettings();
}

async function setEventAssemblyPersonnelBatch(personalIds, isEnabled) {
  const ids = personalIds.map(Number).filter(Boolean);
  if (!ids.length) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = isEnabled
    ? await supabase
        .from("eventos_montaje_personal")
        .upsert(ids.map((personalId) => ({ personal_id: personalId })))
    : await supabase.from("eventos_montaje_personal").delete().in("personal_id", ids);

  if (error) {
    setStatus(error.message || "No se pudo actualizar la configuración de montajes.", "error");
    renderEventSettings();
    return;
  }

  ids.forEach((personalId) => {
    if (isEnabled) {
      eventAssemblyPersonnelIds.add(personalId);
    } else {
      eventAssemblyPersonnelIds.delete(personalId);
    }
  });

  renderEventCatalogOptions();
  renderEventSettings();
  setStatus("Configuración de montajes actualizada.", "success");
}

async function setEventInstallationBatch(installationIds, isEnabled) {
  const ids = installationIds.map(Number).filter(Boolean);
  if (!ids.length) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = isEnabled
    ? await supabase
        .from("eventos_instalaciones")
        .upsert(ids.map((installationId) => ({ instalacion_id: installationId })))
    : await supabase.from("eventos_instalaciones").delete().in("instalacion_id", ids);

  if (error) {
    setStatus(error.message || "No se pudo actualizar la configuración de instalaciones.", "error");
    renderEventSettings();
    return;
  }

  ids.forEach((installationId) => {
    if (isEnabled) {
      eventAssignedInstallationIds.add(installationId);
    } else {
      eventAssignedInstallationIds.delete(installationId);
    }
  });
  eventInstallationRows = eventAllInstallationRows.filter((row) =>
    eventAssignedInstallationIds.has(Number(row.id))
  );

  renderEventCatalogOptions();
  renderEventsTable();
  renderEventSettings();
  setStatus("Configuración de instalaciones de eventos actualizada.", "success");
}

function getSelectedOptionValues(selectElement) {
  return Array.from(selectElement?.selectedOptions || []).map((option) => option.value);
}

async function loadEvents() {
  await loadEventCatalogs();
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("eventos_deportivos")
    .select("id, nombre, instalacion_id, fecha_inicio, fecha_fin, observaciones, archived_at")
    .order("fecha_inicio", { ascending: false });

  if (error) {
    throw error;
  }

  currentEvents = data ?? [];
  if (currentSelectedEventId && !currentEvents.some((event) => String(event.id) === currentSelectedEventId)) {
    currentSelectedEventId = "";
  }
  await loadAllEventSchedules();
  renderEventsTable();
}

async function loadAllEventSchedules() {
  const eventIds = currentEvents.map((event) => event.id);
  if (!eventIds.length) {
    currentEventScheduleRows = [];
    currentEventSchedulePersonnelRows = [];
    return;
  }

  const supabase = await getSupabaseClient();
  const { data: scheduleRows, error: scheduleError } = await supabase
    .from("eventos_cronograma")
    .select("id, evento_id, fecha, hora_inicio, hora_fin, actividad, necesita_transporte, transporte_detalle")
    .in("evento_id", eventIds)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (scheduleError) {
    throw scheduleError;
  }

  const scheduleIds = (scheduleRows ?? []).map((row) => row.id);
  let personnelRows = [];
  if (scheduleIds.length) {
    const { data, error } = await supabase
      .from("eventos_cronograma_personal")
      .select("id, cronograma_id, personal_id, hora_inicio, hora_fin, observaciones")
      .in("cronograma_id", scheduleIds)
      .order("hora_inicio", { ascending: true });

    if (error) {
      throw error;
    }
    personnelRows = data ?? [];
  }

  currentEventScheduleRows = scheduleRows ?? [];
  currentEventSchedulePersonnelRows = personnelRows;
}

async function loadSelectedEventSchedule() {
  await loadAllEventSchedules();
  renderEventsTable();
}

async function selectEvent(eventId) {
  currentSelectedEventId = String(eventId || "");
  if (eventScheduleEventSelect) {
    eventScheduleEventSelect.value = currentSelectedEventId;
  }
  await loadEvents();
}

async function saveEvent(event) {
  event.preventDefault();

  const payload = {
    nombre: eventNameInput.value.trim(),
    instalacion_id: Number(eventInstallationSelect.value),
    fecha_inicio: eventStartDateInput.value,
    fecha_fin: eventEndDateInput.value,
    observaciones: eventObservationsInput.value.trim() || null,
  };

  if (!payload.nombre || !payload.instalacion_id || !payload.fecha_inicio || !payload.fecha_fin) {
    setStatus("Completa los datos obligatorios del evento.", "error");
    return;
  }

  if (payload.fecha_fin < payload.fecha_inicio) {
    setStatus("La fecha de fin del evento no puede ser anterior a la de inicio.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const editingId = eventIdInput.value;
  if (editingId) {
    payload.archived_at = eventArchivedInput?.checked ? new Date().toISOString() : null;
  }
  const result = editingId
    ? await supabase.from("eventos_deportivos").update(payload).eq("id", editingId)
    : await supabase.from("eventos_deportivos").insert(payload).select("id").single();

  if (result.error) {
    setStatus(result.error.message || "No se pudo guardar el evento.", "error");
    return;
  }

  if (!editingId && result.data?.id) {
    currentSelectedEventId = String(result.data.id);
  }

  resetEventForm();
  closeEventPanel({ force: true });
  await loadEvents();
  setStatus("Evento guardado correctamente.", "success");
}

async function deleteEvent(eventId) {
  const eventRow = currentEvents.find((event) => String(event.id) === String(eventId));
  if (!eventRow || !window.confirm(`Eliminar el evento "${eventRow.nombre}" y todo su cronograma?`)) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("eventos_deportivos").delete().eq("id", eventId);
  if (error) {
    setStatus(error.message || "No se pudo eliminar el evento.", "error");
    return;
  }

  if (String(eventId) === currentSelectedEventId) {
    currentSelectedEventId = "";
  }
  if (String(eventIdInput?.value || "") === String(eventId)) {
    closeEventPanel({ force: true });
  }
  await loadEvents();
  setStatus("Evento eliminado correctamente.", "success");
}

async function archiveEvent(eventId, shouldArchive) {
  const eventRow = currentEvents.find((event) => String(event.id) === String(eventId));
  if (!eventRow) {
    setStatus("No se encontró el evento seleccionado.", "error");
    renderEventsTable();
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("eventos_deportivos")
    .update({ archived_at: shouldArchive ? new Date().toISOString() : null })
    .eq("id", eventId);

  if (error) {
    setStatus(error.message || "No se pudo actualizar el archivado del evento.", "error");
    renderEventsTable();
    return;
  }

  if (String(eventId) === currentSelectedEventId && shouldArchive && !eventFilterIncludeArchivedInput?.checked) {
    currentSelectedEventId = "";
  }
  await loadEvents();
  setStatus(shouldArchive ? "Evento archivado correctamente." : "Evento recuperado correctamente.", "success");
}

async function saveEventSchedule(event) {
  event.preventDefault();

  const selectedPersonnelIds = [...currentEventScheduleSelectedPersonnelIds];
  const payload = {
    evento_id: Number(eventScheduleEventSelect.value),
    fecha: eventScheduleDateInput.value,
    hora_inicio: eventScheduleStartInput.value,
    hora_fin: eventScheduleEndInput.value,
    actividad: eventScheduleActivityInput.value.trim(),
    necesita_transporte: Boolean(eventScheduleNeedsTransportInput?.checked),
    transporte_detalle: eventScheduleNeedsTransportInput?.checked
      ? eventScheduleTransportDetailInput.value.trim() || null
      : null,
  };

  if (!payload.evento_id || !payload.fecha || !payload.hora_inicio || !payload.hora_fin || !payload.actividad) {
    setStatus("Completa los datos obligatorios del cronograma.", "error");
    return;
  }

  if (payload.hora_fin <= payload.hora_inicio) {
    setStatus("La hora de fin debe ser posterior a la hora de inicio.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const editingId = eventScheduleIdInput.value;
  const { data, error } = editingId
    ? await supabase.from("eventos_cronograma").update(payload).eq("id", editingId).select("id").single()
    : await supabase.from("eventos_cronograma").insert(payload).select("id").single();
  if (error) {
    setStatus(error.message || "No se pudo crear la acción del cronograma.", "error");
    return;
  }

  if (editingId) {
    const { error: deletePersonnelError } = await supabase
      .from("eventos_cronograma_personal")
      .delete()
      .eq("cronograma_id", editingId);

    if (deletePersonnelError) {
      setStatus(deletePersonnelError.message || "No se pudo actualizar el personal del paso.", "error");
      return;
    }
  }

  if (selectedPersonnelIds.length) {
    const personnelPayload = selectedPersonnelIds.map((personalId) => ({
      cronograma_id: data.id,
      personal_id: personalId,
      hora_inicio: payload.hora_inicio,
      hora_fin: payload.hora_fin,
    }));
    const { error: personnelError } = await supabase.from("eventos_cronograma_personal").insert(personnelPayload);
    if (personnelError) {
      setStatus(personnelError.message || "La acción se creó, pero no se pudo asignar el personal.", "error");
      return;
    }
  }

  currentSelectedEventId = String(payload.evento_id);
  closeEventSchedulePanel({ force: true });
  await loadEvents();
  setStatus("Paso guardado correctamente.", "success");
}

async function deleteEventSchedule(scheduleId) {
  if (!window.confirm("Eliminar esta acción del cronograma?")) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("eventos_cronograma").delete().eq("id", scheduleId);
  if (error) {
    setStatus(error.message || "No se pudo eliminar la acción.", "error");
    return;
  }

  if (String(eventScheduleIdInput?.value || "") === String(scheduleId)) {
    closeEventSchedulePanel({ force: true });
  }
  await loadEvents();
  setStatus("Acción eliminada del cronograma.", "success");
}

async function saveEventAssignment(assignmentId) {
  const startInput = document.querySelector(`[data-event-assignment-start="${assignmentId}"]`);
  const endInput = document.querySelector(`[data-event-assignment-end="${assignmentId}"]`);
  const horaInicio = startInput?.value || "";
  const horaFin = endInput?.value || "";

  if (!horaInicio || !horaFin || horaFin <= horaInicio) {
    setStatus("Revisa el horario del personal asignado.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("eventos_cronograma_personal")
    .update({ hora_inicio: horaInicio, hora_fin: horaFin })
    .eq("id", assignmentId);

  if (error) {
    setStatus(error.message || "No se pudo actualizar el horario del personal.", "error");
    return;
  }

  await loadEvents();
  setStatus("Horario de personal actualizado.", "success");
}

async function deleteEventAssignment(assignmentId) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("eventos_cronograma_personal").delete().eq("id", assignmentId);
  if (error) {
    setStatus(error.message || "No se pudo quitar el personal asignado.", "error");
    return;
  }

  await loadEvents();
  setStatus("Personal retirado de la acción.", "success");
}

function initDates() {
  document.querySelector("#registration-date").value = new Date()
    .toISOString()
    .slice(0, 10);
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

async function init() {
  if (!hasSupabaseConfig) {
    setStatus(
      "Falta la configuracion de Supabase en config.js. Esta version ya no funciona en modo local.",
      "error"
    );
    return;
  }

  validateRoleOptions();
  initDates();
  initControlFilters();
  window.addEventListener("beforeunload", (event) => {
    if (!hasVisibleUnsavedFormChanges()) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  });
  const debouncedCandidateFilters = debounce(() => {
    currentPage = 1;
    applyCandidateFilters();
  }, 300);
  const debouncedControlTextFilters = debounce(() => {
    controlCurrentPage = 1;
    void fetchControlRecords();
  }, 300);
  const debouncedControlOptionFilters = debounce(() => {
    controlCurrentPage = 1;
    void fetchControlFilterOptions().then(() => fetchControlRecords());
  }, 300);
  const debouncedProgrammingFilters = debounce(() => {
    applyProgrammingFilters();
  }, 160);
  const debouncedProgrammingImportFilters = debounce(() => {
    applyProgrammingImportPreviewFilters();
  }, 160);
  const debouncedProgrammingPersonnelSettings = debounce(renderProgrammingPersonnelSettings, 160);
  const debouncedProgrammingInstallationSettings = debounce(renderProgrammingInstallationSettings, 160);

  privateTabSearchButton.addEventListener("click", () => {
    switchPrivateTab("search");
    void refreshPrivateTabData("search").catch((error) => {
      setStatus(error?.message || "No se pudieron cargar las candidaturas.", "error");
    });
  });
  privateTabControlButton.addEventListener("click", () => {
    switchPrivateTab("control");
    void refreshPrivateTabData("control").catch((error) => {
      setStatus(error?.message || "No se pudo cargar el control personal.", "error");
    });
  });
  privateTabEventsButton?.addEventListener("click", () => {
    switchPrivateTab("events");
    void refreshPrivateTabData("events").catch((error) => {
      setStatus(error?.message || "No se pudieron cargar los eventos.", "error");
    });
  });
  privateTabProgrammingButton.addEventListener("click", () => {
    switchPrivateTab("programming");
    void refreshPrivateTabData("programming").catch((error) => {
      setStatus(error?.message || "No se pudo cargar la programacion.", "error");
    });
  });
  openCandidateCreateButton?.addEventListener("click", openCandidateCreatePanel);
  closeCandidateCreateButton?.addEventListener("click", closeCandidateCreatePanel);
  candidateCreateOverlay?.addEventListener("click", closeCandidateCreatePanel);
  programmingTypeSwitch?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-programming-type-filter]");
    if (!button) {
      return;
    }

    const nextType = button.dataset.programmingTypeFilter;
    currentProgrammingType = nextType === PROGRAMMING_TYPE_ALL ? PROGRAMMING_TYPE_ALL : normalizeProgrammingType(nextType);
    syncProgrammingTypeUi();
    void loadProgrammingPersonnel();
    void loadProgrammingFromSupabase();
  });
  loginForm.addEventListener("submit", (event) => {
    void handleLogin(event);
  });
  showPasswordRecoveryButton?.addEventListener("click", showPasswordRecoveryView);
  cancelPasswordRecoveryButton?.addEventListener("click", showLoginFormView);
  passwordRecoveryForm?.addEventListener("submit", (event) => {
    void handlePasswordRecovery(event);
  });
  inviteSetupForm?.addEventListener("submit", (event) => {
    void handleInviteSetup(event);
  });
  publicCandidateForm.addEventListener("submit", (event) => {
    void handlePublicCandidateSubmit(event);
  });
  candidateForm.addEventListener("submit", (event) => {
    void handlePrivateCandidateSubmit(event);
  });
  logoutButton.addEventListener("click", () => {
    void handleLogout();
  });
  sportRoleCheckbox.addEventListener("change", () =>
    syncSportSpecialtiesVisibilityFor(
      candidateForm,
      sportRoleCheckbox,
      sportSpecialtiesGroup,
      "sport_specialties"
    )
  );
  publicSportRoleCheckbox.addEventListener("change", () =>
    syncSportSpecialtiesVisibilityFor(
      publicCandidateForm,
      publicSportRoleCheckbox,
      publicSportSpecialtiesGroup,
      "public_sport_specialties"
    )
  );
  addSelectedTagButton.addEventListener("click", handleAddSelectedTag);
  createTagButton.addEventListener("click", handleCreateTag);
  selectedTagsContainer.addEventListener("click", handleTagsClick);
  availableTagsContainer.addEventListener("click", handleTagsClick);
  filtersForm.addEventListener("input", debouncedCandidateFilters);
  filtersForm.addEventListener("change", () => {
    currentPage = 1;
    applyCandidateFilters();
  });
  clearFiltersButton?.addEventListener("click", clearFilters);
  filtersForm.addEventListener("click", (event) => {
    const resetButton = event.target.closest("[data-reset-candidate-filter]");
    if (!resetButton) {
      return;
    }

    resetSingleCandidateFilter(resetButton.dataset.resetCandidateFilter);
  });
  eventForm?.addEventListener("submit", (event) => {
    void saveEvent(event);
  });
  openEventPanelButton?.addEventListener("click", () => openEventPanel());
  closeEventPanelButton?.addEventListener("click", closeEventPanel);
  eventPanelBackdrop?.addEventListener("click", closeEventPanel);
  eventDeleteButton?.addEventListener("click", () => {
    if (!eventIdInput?.value) {
      return;
    }
    void deleteEvent(eventIdInput.value);
  });
  openEventSettingsButton?.addEventListener("click", () => {
    void loadEventCatalogs()
      .then(openEventSettingsPanel)
      .catch((error) => {
        setStatus(error?.message || "No se pudo abrir la configuración de eventos.", "error");
      });
  });
  closeEventSettingsPanelButton?.addEventListener("click", closeEventSettingsPanel);
  eventSettingsPanelBackdrop?.addEventListener("click", closeEventSettingsPanel);
  eventAssemblyPersonnelFilter?.addEventListener("input", renderEventSettings);
  eventAssemblyAddButton?.addEventListener("click", () => {
    void setEventAssemblyPersonnelBatch(getSelectedOptionValues(eventAssemblyAvailableSelect), true);
  });
  eventAssemblyRemoveButton?.addEventListener("click", () => {
    void setEventAssemblyPersonnelBatch(getSelectedOptionValues(eventAssemblySelectedSelect), false);
  });
  eventInstallationFilter?.addEventListener("input", renderEventInstallationSettings);
  eventInstallationAddButton?.addEventListener("click", () => {
    void setEventInstallationBatch(getSelectedOptionValues(eventInstallationAvailableSelect), true);
  });
  eventInstallationRemoveButton?.addEventListener("click", () => {
    void setEventInstallationBatch(getSelectedOptionValues(eventInstallationSelectedSelect), false);
  });
  closeEventSchedulePanelButton?.addEventListener("click", closeEventSchedulePanel);
  eventSchedulePanelBackdrop?.addEventListener("click", closeEventSchedulePanel);
  eventScheduleDeleteButton?.addEventListener("click", () => {
    if (!eventScheduleIdInput?.value) {
      return;
    }
    void deleteEventSchedule(eventScheduleIdInput.value);
  });
  eventClearButton?.addEventListener("click", resetEventForm);
  eventsRefreshButton?.addEventListener("click", () => {
    void loadEvents().catch((error) => {
      setStatus(error?.message || "No se pudieron actualizar los eventos.", "error");
    });
  });
  eventsFiltersForm?.addEventListener("input", renderEventsTable);
  eventsFiltersForm?.addEventListener("change", renderEventsTable);
  eventsFiltersForm?.addEventListener("click", (event) => {
    const resetButton = event.target.closest("[data-reset-event-filter]");
    if (!resetButton) {
      return;
    }

    resetSingleEventFilter(resetButton.dataset.resetEventFilter);
  });
  eventsTableBody?.addEventListener("change", (event) => {
    const assignmentTimeInput = event.target.closest("[data-event-assignment-time]");
    if (!assignmentTimeInput) {
      return;
    }

    void saveEventAssignment(assignmentTimeInput.dataset.eventAssignmentTime);
  });
  eventsTableBody?.addEventListener("click", (event) => {
    const toggleId = event.target.closest("[data-event-toggle-id]")?.dataset.eventToggleId;
    if (toggleId) {
      if (expandedEventIds.has(toggleId)) {
        expandedEventIds.delete(toggleId);
      } else {
        expandedEventIds.add(toggleId);
      }
      renderEventsTable();
      return;
    }

    const newStepEventId = event.target.closest("[data-event-schedule-new-id]")?.dataset
      .eventScheduleNewId;
    if (newStepEventId) {
      openEventSchedulePanel(newStepEventId);
      return;
    }

    const editId = event.target.closest("[data-event-edit-id]")?.dataset.eventEditId;
    if (editId) {
      openEventPanel(currentEvents.find((row) => String(row.id) === String(editId)));
      return;
    }

    const scheduleEditId = event.target.closest("[data-event-schedule-edit-id]")?.dataset
      .eventScheduleEditId;
    if (scheduleEditId) {
      const schedule = currentEventScheduleRows.find((row) => String(row.id) === String(scheduleEditId));
      openEventSchedulePanel(schedule?.evento_id, scheduleEditId);
      return;
    }

    const assignmentDeleteId = event.target.closest("[data-event-assignment-delete]")?.dataset
      .eventAssignmentDelete;
    if (assignmentDeleteId) {
      void deleteEventAssignment(assignmentDeleteId);
    }
  });
  eventScheduleForm?.addEventListener("submit", (event) => {
    void saveEventSchedule(event);
  });
  eventScheduleAddPersonnelButton?.addEventListener("click", () => {
    moveEventSchedulePersonnel(getSelectedOptionValues(eventScheduleAvailablePersonnelSelect), true);
  });
  eventScheduleRemovePersonnelButton?.addEventListener("click", () => {
    moveEventSchedulePersonnel(getSelectedOptionValues(eventScheduleSelectedPersonnelSelect), false);
  });
  document.querySelectorAll("[data-event-sort-field]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.eventSortField;
      if (!field) {
        return;
      }

      const existing = eventSortCriteria.find((criterion) => criterion.field === field);
      if (existing) {
        existing.direction = existing.direction === "asc" ? "desc" : "asc";
        eventSortCriteria = [
          existing,
          ...eventSortCriteria.filter((criterion) => criterion.field !== field),
        ];
      } else {
        eventSortCriteria = [
          { field, direction: "asc" },
          ...eventSortCriteria,
        ].slice(0, 4);
      }

      renderEventsTable();
    });
  });
  eventScheduleNeedsTransportInput?.addEventListener("change", syncEventScheduleTransportField);
  controlClearFiltersButton?.addEventListener("click", clearControlFilters);
  controlExportCsvButton.addEventListener("click", exportControlRecordsToCsv);
  controlExportPdfButton.addEventListener("click", exportControlRecordsToPdf);
  controlTotalsButton?.addEventListener("click", openControlTotalsPanel);
  controlImportCsvButton?.addEventListener("click", openControlImportPanel);
  closeControlImportButton?.addEventListener("click", closeControlImportPanel);
  controlImportCancelButton?.addEventListener("click", closeControlImportPanel);
  controlImportOverlay?.addEventListener("click", closeControlImportPanel);
  controlImportForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const file = controlImportCsvInput?.files?.[0];
    if (!file) {
      setStatus("Selecciona un CSV antes de procesar la importacion.", "error");
      return;
    }

    void prepareControlImportFromCsv(file).finally(() => {
      controlImportCsvInput.value = "";
    });
  });
  controlImportPreviewFilters?.addEventListener("change", applyControlImportPreviewFilters);
  controlImportPreviewConfirmButton?.addEventListener("click", () => {
    void importPreparedControlRecords();
  });
  controlImportPreviewCancelButton?.addEventListener("click", () => {
    clearControlImportPreview();
    setStatus("Importacion cancelada.", "default");
  });
  controlDeleteRangeButton?.addEventListener("click", () => {
    void deleteFilteredControlRecords();
  });
  controlEnableSelectiveDeleteButton?.addEventListener("click", () => {
    setControlSelectiveDeleteMode(true);
  });
  controlCancelSelectiveDeleteButton?.addEventListener("click", () => {
    setControlSelectiveDeleteMode(false);
  });
  controlDeleteSelectedButton?.addEventListener("click", () => {
    void deleteSelectedControlRecords();
  });
  controlSelectPageCheckbox?.addEventListener("change", () => {
    toggleCurrentControlPageSelection(controlSelectPageCheckbox.checked);
  });
  controlFiltersForm.addEventListener("input", (event) => {
    if (event.target === controlPersonalInput) {
      renderControlPersonalSuggestions();
      debouncedControlTextFilters();
      return;
    }

    debouncedControlOptionFilters();
  });
  controlFiltersForm.addEventListener("change", (event) => {
    controlCurrentPage = 1;
    if (event.target === controlPersonalInput) {
      renderControlPersonalSuggestions();
      void fetchControlRecords();
      return;
    }

    void fetchControlFilterOptions().then(() => fetchControlRecords());
  });
  controlFiltersForm.addEventListener("click", (event) => {
    const resetButton = event.target.closest("[data-reset-filter]");
    if (!resetButton) {
      const personalOption = event.target.closest("[data-control-personal-option]")?.dataset
        .controlPersonalOption;
      if (!personalOption) {
        return;
      }

      controlPersonalInput.value = personalOption;
      controlPersonalSuggestions?.classList.add("hidden");
      controlCurrentPage = 1;
      void fetchControlRecords();
      return;
    }

    resetSingleControlFilter(resetButton.dataset.resetFilter);
  });
  controlPersonalInput?.addEventListener("focus", () => {
    renderControlPersonalSuggestions();
  });
  controlPersonalSuggestions?.addEventListener("pointerdown", (event) => {
    const personalOption = event.target.closest("[data-control-personal-option]")?.dataset
      .controlPersonalOption;
    if (!personalOption) {
      return;
    }

    event.preventDefault();
    controlPersonalInput.value = personalOption;
    controlPersonalSuggestions.classList.add("hidden");
    controlCurrentPage = 1;
    void fetchControlRecords();
  });
  controlPersonalInput?.addEventListener("blur", () => {
    window.setTimeout(() => {
      controlPersonalSuggestions?.classList.add("hidden");
    }, 200);
  });
  controlRecordsTable?.addEventListener("click", (event) => {
    const editId = event.target.closest("[data-control-edit-id]")?.dataset.controlEditId;
    if (editId) {
      void openControlDetail(editId);
      return;
    }

    const sortField = event.target.closest("[data-control-sort-field]")?.dataset.controlSortField;
    if (!sortField) {
      return;
    }

    if (currentControlSort.field === sortField) {
      currentControlSort.direction = currentControlSort.direction === "asc" ? "desc" : "asc";
    } else {
      currentControlSort = {
        field: sortField,
        direction:
          sortField === "fecha" || sortField === "worked_hours" ? "desc" : "asc",
      };
    }

    controlCurrentPage = 1;
    void fetchControlRecords();
  });
  controlRecordsTable?.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-control-select-id]");
    if (!checkbox) {
      return;
    }

    handleControlRecordSelection(checkbox.dataset.controlSelectId, checkbox.checked);
  });
  controlRefreshButton?.addEventListener("click", () => {
    controlCurrentPage = 1;
    void fetchControlFilterOptions().then(() => fetchControlRecords());
  });
  programmingLoadBundledButton?.addEventListener("click", () => {
    void loadProgrammingFromSupabase();
  });
  programmingImportButton?.addEventListener("click", () => {
    openProgrammingImportPanel();
  });
  closeProgrammingImportButton?.addEventListener("click", closeProgrammingImportPanel);
  programmingImportCancelButton?.addEventListener("click", closeProgrammingImportPanel);
  programmingImportOverlay?.addEventListener("click", closeProgrammingImportPanel);
  programmingImportClearPreviewButton?.addEventListener("click", resetProgrammingImportPreview);
  programmingImportInsertButton?.addEventListener("click", () => {
    void insertFilteredProgrammingImportRows();
  });
  programmingImportPreviewDate?.addEventListener("change", () => {
    renderProgrammingImportPreviewFilters();
    applyProgrammingImportPreviewFilters();
  });
  programmingImportPreviewInstallation?.addEventListener("change", applyProgrammingImportPreviewFilters);
  programmingImportPreviewFilters?.addEventListener("input", debouncedProgrammingImportFilters);
  programmingImportForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const file = programmingImportFileInput?.files?.[0];
    if (!file) {
      setStatus("Selecciona un archivo Word o CSV para cargar datos.", "error");
      return;
    }

    const isCsv = isProgrammingCsvFile(file);
    const prepareFile = isCsv ? prepareProgrammingImportCsv : prepareProgrammingWordFile;
    const fileLabel = isCsv ? "CSV" : "Word";

    void prepareFile(file)
      .then(() => {
        setStatus(
          `${fileLabel} procesado correctamente. Registros detectados: ${pendingProgrammingImportRows.length}.`,
          "success"
        );
      })
      .catch((error) => {
        setStatus(`No se pudo procesar el ${fileLabel}: ${error.message}`, "error");
      });
  });
  programmingDownloadCsvButton?.addEventListener("click", downloadProgrammingCsv);
  programmingReportPdfButton?.addEventListener("click", exportProgrammingReportToPdf);
  programmingDownloadImagesButton?.addEventListener("click", downloadProgrammingImages);
  programmingCreateButton?.addEventListener("click", openProgrammingCreateDetail);
  programmingUploadSupabaseButton?.addEventListener("click", () => {
    void uploadProgrammingRowsToSupabase();
  });
  openProgrammingSettingsButton?.addEventListener("click", openProgrammingSettingsPanel);
  closeProgrammingSettingsButton?.addEventListener("click", closeProgrammingSettingsPanel);
  programmingSettingsOverlay?.addEventListener("click", closeProgrammingSettingsPanel);
  programmingPersonnelFilter?.addEventListener("input", debouncedProgrammingPersonnelSettings);
  programmingPersonnelAddSelectedButton?.addEventListener("click", () => {
    void addProgrammingPersonnelBatch(getSelectedOptionValues(programmingPersonnelAvailableSelect));
  });
  programmingPersonnelRemoveSelectedButton?.addEventListener("click", () => {
    void removeProgrammingPersonnelBatch(getSelectedOptionValues(programmingPersonnelSelectedSelect));
  });
  programmingInstallationFilter?.addEventListener("input", debouncedProgrammingInstallationSettings);
  programmingInstallationAddSelectedButton?.addEventListener("click", () => {
    void addProgrammingInstallationBatch(getSelectedOptionValues(programmingInstallationAvailableSelect));
  });
  programmingInstallationRemoveSelectedButton?.addEventListener("click", () => {
    void removeProgrammingInstallationBatch(getSelectedOptionValues(programmingInstallationSelectedSelect));
  });
  programmingBulkPersonalSelect?.addEventListener("change", () => {
    if (programmingBulkPersonalSelect.value !== lastSuggestedBulkPersonal) {
      lastSuggestedBulkPersonal = "";
    }
    syncProgrammingBulkAssignmentUi();
  });
  programmingBulkClearPersonalButton?.addEventListener("click", clearProgrammingBulkPersonal);
  programmingBulkAssignButton?.addEventListener("click", () => {
    void assignFilteredProgrammingPersonnel();
  });
  programmingOpenUnmatchedPersonnelButton?.addEventListener("click", () => {
    void openProgrammingUnmatchedPersonnelPanel();
  });
  programmingOpenUnmatchedInstallationButton?.addEventListener("click", () => {
    void openProgrammingUnmatchedInstallationPanel();
  });
  closeProgrammingUnmatchedPersonnelButton?.addEventListener("click", closeProgrammingUnmatchedPersonnelPanel);
  programmingUnmatchedPersonnelOverlay?.addEventListener("click", closeProgrammingUnmatchedPersonnelPanel);
  closeProgrammingUnmatchedInstallationButton?.addEventListener("click", closeProgrammingUnmatchedInstallationPanel);
  programmingUnmatchedInstallationOverlay?.addEventListener("click", closeProgrammingUnmatchedInstallationPanel);
  programmingUnmatchedPersonnelList?.addEventListener("change", () => {
    if (programmingApplyUnmatchedPersonnelButton) {
      programmingApplyUnmatchedPersonnelButton.disabled = !getSelectedProgrammingUnmatchedPersonnelProposals().length;
    }
  });
  programmingUnmatchedPersonnelList?.addEventListener("click", (event) => {
    const acceptName = event.target.closest("[data-programming-unmatched-personnel-accept]")?.dataset
      .programmingUnmatchedPersonnelAccept;
    if (acceptName) {
      void acceptProgrammingUnmatchedPersonnelProposal(acceptName);
      return;
    }
    const deleteName = event.target.closest("[data-programming-unmatched-personnel-delete]")?.dataset
      .programmingUnmatchedPersonnelDelete;
    if (!deleteName) {
      return;
    }
    ignoredProgrammingUnmatchedPersonnelKeys.add(normalizeProgrammingText(deleteName));
    renderProgrammingUnmatchedPersonnelPanel();
  });
  programmingUnmatchedInstallationList?.addEventListener("change", () => {
    if (programmingApplyUnmatchedInstallationButton) {
      programmingApplyUnmatchedInstallationButton.disabled = !getSelectedProgrammingUnmatchedInstallationProposals().length;
    }
  });
  programmingUnmatchedInstallationList?.addEventListener("click", (event) => {
    const acceptName = event.target.closest("[data-programming-unmatched-installation-accept]")?.dataset
      .programmingUnmatchedInstallationAccept;
    if (acceptName) {
      void acceptProgrammingUnmatchedInstallationProposal(acceptName);
      return;
    }
    const deleteName = event.target.closest("[data-programming-unmatched-installation-delete]")?.dataset
      .programmingUnmatchedInstallationDelete;
    if (!deleteName) {
      return;
    }
    ignoredProgrammingUnmatchedInstallationKeys.add(normalizeProgrammingText(deleteName));
    renderProgrammingUnmatchedInstallationPanel();
  });
  programmingRefreshUnmatchedPersonnelButton?.addEventListener("click", () => {
    ignoredProgrammingUnmatchedPersonnelKeys = new Set();
    renderProgrammingUnmatchedPersonnelPanel();
  });
  programmingRefreshUnmatchedInstallationButton?.addEventListener("click", () => {
    ignoredProgrammingUnmatchedInstallationKeys = new Set();
    renderProgrammingUnmatchedInstallationPanel();
  });
  programmingApplyUnmatchedPersonnelButton?.addEventListener("click", () => {
    void applyProgrammingUnmatchedPersonnelProposals();
  });
  programmingApplyUnmatchedInstallationButton?.addEventListener("click", () => {
    void applyProgrammingUnmatchedInstallationProposals();
  });
  programmingBulkInstallationInput?.addEventListener("input", () => {
    if (programmingBulkInstallationInput.value !== lastSuggestedBulkInstallation) {
      lastSuggestedBulkInstallation = "";
    }
    syncProgrammingBulkAssignmentUi();
  });
  programmingBulkClearInstallationButton?.addEventListener(
    "click",
    clearProgrammingBulkInstallation
  );
  programmingBulkInstallationInput
    ?.closest("details")
    ?.addEventListener("toggle", (event) => {
      if (event.currentTarget.open) {
        suggestBulkPersonalFromCurrentFilter();
        suggestBulkInstallationFromCurrentFilter();
      }
    });
  programmingBulkInstallationButton?.addEventListener("click", () => {
    void changeFilteredProgrammingInstallation();
  });
  programmingEnableSelectiveArchiveButton?.addEventListener("click", () => {
    setProgrammingSelectionMode("archive");
  });
  programmingCancelSelectiveArchiveButton?.addEventListener("click", () => {
    setProgrammingSelectionMode("");
  });
  programmingArchiveSelectedButton?.addEventListener("click", () => {
    void archiveSelectedProgrammingRecords(true);
  });
  programmingUnarchiveSelectedButton?.addEventListener("click", () => {
    void archiveSelectedProgrammingRecords(false);
  });
  programmingEnableSelectiveDeleteButton?.addEventListener("click", () => {
    setProgrammingSelectiveDeleteMode(true);
  });
  programmingCancelSelectiveDeleteButton?.addEventListener("click", () => {
    setProgrammingSelectiveDeleteMode(false);
  });
  programmingDeleteSelectedButton?.addEventListener("click", () => {
    void deleteSelectedProgrammingRecords();
  });
  programmingSelectPageCheckbox?.addEventListener("change", () => {
    toggleCurrentProgrammingPageSelection(programmingSelectPageCheckbox.checked);
  });
  programmingFilterDate?.addEventListener("change", () => {
    syncProgrammingDateScopedFilters();
    applyProgrammingFilters();
    suggestBulkPersonalFromCurrentFilter();
    suggestBulkInstallationFromCurrentFilter();
  });
  programmingFiltersForm?.addEventListener("input", debouncedProgrammingFilters);
  programmingFiltersForm?.addEventListener("change", (event) => {
    if (event.target === programmingFilterDate) {
      return;
    }
    if (event.target === programmingFilterIncludeArchived) {
      syncProgrammingDateScopedFilters();
    }
    applyProgrammingFilters();
    if (event.target === programmingFilterPersonal) {
      suggestBulkPersonalFromCurrentFilter();
    }
    if (event.target === programmingFilterInstallation) {
      suggestBulkInstallationFromCurrentFilter();
    }
  });
  programmingFiltersForm?.addEventListener("click", (event) => {
    const resetButton = event.target.closest("[data-reset-programming-filter]");
    if (!resetButton) {
      return;
    }

    resetSingleProgrammingFilter(resetButton.dataset.resetProgrammingFilter);
  });
  document.querySelectorAll("[data-programming-sort-field]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.programmingSortField;
      if (!field) {
        return;
      }

      const existing = programmingSortCriteria.find((criterion) => criterion.field === field);
      if (existing) {
        existing.direction = existing.direction === "asc" ? "desc" : "asc";
        programmingSortCriteria = [
          existing,
          ...programmingSortCriteria.filter((criterion) => criterion.field !== field),
        ];
      } else {
        programmingSortCriteria = [
          { field, direction: "asc" },
          ...programmingSortCriteria,
        ].slice(0, 4);
      }

      applyProgrammingFilters();
    });
  });
  programmingPreviewTableBody?.addEventListener("click", (event) => {
    const editId = event.target.closest("[data-programming-edit-id]")?.dataset.programmingEditId;
    if (editId) {
      openProgrammingDetail(editId);
      return;
    }

    const duplicateId = event.target.closest("[data-programming-duplicate-id]")?.dataset
      .programmingDuplicateId;
    if (duplicateId) {
      openProgrammingDuplicateDetail(duplicateId);
      return;
    }

  });
  programmingPreviewTableBody?.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-programming-select-id]");
    if (!checkbox) {
      return;
    }

    handleProgrammingRecordSelection(checkbox.dataset.programmingSelectId, checkbox.checked);
  });
  programmingPreviousPageButton?.addEventListener("click", () => {
    programmingCurrentPage = Math.max(1, programmingCurrentPage - 1);
    refreshProgrammingPreviewPage();
  });
  programmingNextPageButton?.addEventListener("click", () => {
    programmingCurrentPage += 1;
    refreshProgrammingPreviewPage();
  });
  programmingPageSizeSelect?.addEventListener("change", () => {
    programmingPageSize = Number(programmingPageSizeSelect.value || 25);
    programmingCurrentPage = 1;
    refreshProgrammingPreviewPage();
  });
  exportCsvButton.addEventListener("click", exportFilteredCandidatesToCsv);
  exportSelectedPdfButton.addEventListener("click", exportSelectedCandidatesToPdf);
  previousPageButton.addEventListener("click", goToPreviousPage);
  nextPageButton.addEventListener("click", goToNextPage);
  pageSizeSelect.addEventListener("change", handlePageSizeChange);
  controlPreviousPageButton.addEventListener("click", goToPreviousControlPage);
  controlNextPageButton.addEventListener("click", goToNextControlPage);
  controlPageSizeSelect.addEventListener("change", handleControlPageSizeChange);
  closeControlTotalsButton?.addEventListener("click", closeControlTotalsPanel);
  controlTotalsOverlay?.addEventListener("click", closeControlTotalsPanel);
  closeControlDetailButton?.addEventListener("click", closeControlDetail);
  controlDetailOverlay?.addEventListener("click", closeControlDetail);
  controlDetailForm?.addEventListener("submit", (event) => {
    void saveControlDetail(event);
  });
  controlDetailDeleteButton?.addEventListener("click", () => {
    if (!controlDetailIdInput.value) {
      return;
    }

    void deleteControlRecord(controlDetailIdInput.value);
  });
  closeDetailButton.addEventListener("click", closeCandidateDetail);
  detailOverlay.addEventListener("click", closeCandidateDetail);
  closeProgrammingDetailButton?.addEventListener("click", closeProgrammingDetail);
  programmingDetailOverlay?.addEventListener("click", closeProgrammingDetail);
  programmingDetailForm?.addEventListener("submit", (event) => {
    void saveProgrammingDetail(event);
  });
  programmingDetailArchiveButton?.addEventListener("click", () => {
    const recordId = programmingDetailIdInput.value;
    if (!recordId) {
      return;
    }

    const shouldArchive = !programmingDetailArchivedInput.checked;
    void archiveProgrammingRecord(recordId, shouldArchive).then((isArchived) => {
      if (isArchived) {
        closeProgrammingDetail({ force: true });
      }
    });
  });
  programmingDetailDeleteButton?.addEventListener("click", () => {
    const recordId = programmingDetailIdInput.value;
    if (!recordId) {
      return;
    }

    void deleteProgrammingRecord(recordId).then(() => {
      closeProgrammingDetail({ force: true });
    });
  });
  detailEditButton.addEventListener("click", () => setDetailEditMode(true));
  detailDeleteButton.addEventListener("click", () => {
    void deleteCandidate(detailIdInput.value);
  });
  detailForm.addEventListener("submit", (event) => {
    void saveCandidateDetail(event);
  });
  detailSportRoleCheckbox.addEventListener("change", () =>
    syncSportSpecialtiesVisibilityFor(
      detailForm,
      detailSportRoleCheckbox,
      detailSportSpecialtiesGroup,
      "detail_sport_specialties"
    )
  );
  candidatesTable.addEventListener("click", (event) => {
    void handleTableClick(event);
  });

  syncSportSpecialtiesVisibilityFor(
    candidateForm,
    sportRoleCheckbox,
    sportSpecialtiesGroup,
    "sport_specialties"
  );
  syncSportSpecialtiesVisibilityFor(
    publicCandidateForm,
    publicSportRoleCheckbox,
    publicSportSpecialtiesGroup,
    "public_sport_specialties"
  );
  syncTagsUi();
  renderFilterOptions();
  renderProgrammingPersonnelUi();
  applyCandidateFilters();
  resetProgrammingPreview();
  renderControlRecords([]);
  renderControlSummary([]);
  updateControlPaginationUi(0, 0);
  await restoreSession();
  switchPrivateTab(currentPrivateTabTarget);
  switchPanel(currentPanelTarget);
}

bindPanelNavigation();
void init();

