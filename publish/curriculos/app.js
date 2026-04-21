const JOB_OPTIONS = [
  "Conserjeria",
  "Monitorado de tiempo libre",
  "Monitorado deportivo",
  "Monitorado acuatico",
  "Socorrismo",
  "Control biosanitario",
  "Montaje de eventos",
];

const CANDIDATE_STATUS_OPTIONS = [
  "Pendiente",
  "Preseleccionado",
  "Descartado",
  "Contratado",
];

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

const config = window.APP_CONFIG ?? {};
const supabaseConfig = config.supabase ?? {};
const hasSupabaseConfig =
  Boolean(supabaseConfig.url) &&
  Boolean(supabaseConfig.anonKey) &&
  Boolean(supabaseConfig.bucket);

const publicPanel = document.querySelector("#public-panel");
const privatePanel = document.querySelector("#private-panel");
const showPublicPanelButton = document.querySelector("#show-public-panel");
const showPrivatePanelButton = document.querySelector("#show-private-panel");
const loginView = document.querySelector("#login-view");
const privateView = document.querySelector("#private-view");
const privateTabNewButton = document.querySelector("#private-tab-new");
const privateTabSearchButton = document.querySelector("#private-tab-search");
const privateTabPanelNew = document.querySelector("#private-tab-panel-new");
const privateTabPanelSearch = document.querySelector("#private-tab-panel-search");
const loginForm = document.querySelector("#login-form");
const publicCandidateForm = document.querySelector("#public-candidate-form");
const candidateForm = document.querySelector("#candidate-form");
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
const detailVacancyConsentInput = document.querySelector("#detail-vacancy-consent");
const detailEditButton = document.querySelector("#detail-edit-button");
const detailSaveButton = document.querySelector("#detail-save-button");
const detailDeleteButton = document.querySelector("#detail-delete-button");
const publicToast = document.querySelector("#public-toast");

let selectedCandidateTags = [];
let currentCandidates = [];
let filteredCandidates = [];
let selectedCandidateIds = new Set();
let currentSession = null;
let supabaseClient = null;
let supabaseAuthListenerBound = false;
let jsPdfModulePromise = null;
let detailEditMode = false;
let currentSort = {
  field: "registration_date",
  direction: "desc",
};
let currentPage = 1;
let pageSize = Number(pageSizeSelect?.value || 25);
let publicToastTimeout = null;

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

function sortTextValues(values) {
  return [...values].sort((a, b) => a.localeCompare(b, "es"));
}

function normalizeSportSpecialties(values) {
  const specialties = Array.isArray(values) ? [...values] : [];
  const hasTennis = specialties.includes("Tenis");
  const hasPadel = specialties.includes("Padel");
  const filtered = specialties.filter((item) => item !== "Tenis" && item !== "Padel");

  if (hasTennis || hasPadel) {
    filtered.push("Tenis y padel");
  }

  return Array.from(new Set(filtered));
}

function formatRoles(row) {
  const roles = Array.isArray(row.job_roles) ? [...row.job_roles] : [];
  const specialties = normalizeSportSpecialties(row.sport_specialties);

  return roles.map((role) => {
    if (role === "Monitorado deportivo" && specialties.length) {
      return `${role} (${specialties.join(", ")})`;
    }

    return role;
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

function setStatus(message, tone = "default") {
  statusMessage.textContent = message;
  statusMessage.className = "status-message";

  if (tone !== "default") {
    statusMessage.classList.add(tone);
  }
}

function switchPanel(target) {
  const showPublic = target === "public";
  publicPanel.classList.toggle("hidden", !showPublic);
  privatePanel.classList.toggle("hidden", showPublic);
  document.querySelector(".public-hero")?.classList.toggle("hidden", !showPublic);
}

function togglePrivateView(isLoggedIn, email = "") {
  loginView.classList.toggle("hidden", isLoggedIn);
  privateView.classList.toggle("hidden", !isLoggedIn);
  sessionEmail.textContent = isLoggedIn ? `Sesion iniciada como ${email}` : "";
}

function switchPrivateTab(target) {
  const showNew = target === "new";
  privateTabPanelNew.classList.toggle("hidden", !showNew);
  privateTabPanelSearch.classList.toggle("hidden", showNew);
  privateTabNewButton.classList.toggle("active", showNew);
  privateTabSearchButton.classList.toggle("active", !showNew);
  privateTabNewButton.setAttribute("aria-pressed", String(showNew));
  privateTabSearchButton.setAttribute("aria-pressed", String(!showNew));
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

async function getSupabaseClient() {
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

async function getJsPdfClient() {
  if (jsPdfModulePromise) {
    return jsPdfModulePromise;
  }

  jsPdfModulePromise = import("https://esm.sh/jspdf@2.5.1");
  return jsPdfModulePromise;
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
    setStatus("No se encontro la candidatura asociada al archivo.", "error");
    return;
  }

  if (!currentSession) {
    setStatus("Necesitas iniciar sesion para descargar archivos.", "error");
    return;
  }

  if (!row.attachment_path) {
    setStatus("No se encontro el curriculum adjunto.", "error");
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
  return getPaginatedCandidates(filteredCandidates);
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
        ? `<button type="button" class="tag-chip" data-download-id="${escapeHtml(row.id)}">${escapeHtml(
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
              <button type="button" class="table-action" data-edit-id="${escapeHtml(row.id)}">Editar</button>
              <button type="button" class="danger-button table-action" data-delete-id="${escapeHtml(row.id)}">Borrar</button>
            </div>
          </td>
          <td>${escapeHtml(row.registration_date || "")}</td>
          <td><span class="status-badge ${getCandidateStatusClass(status)}">${escapeHtml(status)}</span></td>
          <td>${escapeHtml(row.full_name)}</td>
          <td>${escapeHtml(row.phone)}</td>
          <td>${escapeHtml(row.email)}</td>
          <td>${escapeHtml(roles)}</td>
          <td>${escapeHtml(tags)}</td>
          <td>${attachmentCell}</td>
          <td>${escapeHtml(row.notes || "")}</td>
          <td>${escapeHtml(row.observations || "")}</td>
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
  paginationPageIndicator.textContent = `Pagina ${currentPage} de ${totalPages}`;
  previousPageButton.disabled = currentPage <= 1;
  nextPageButton.disabled = currentPage >= totalPages;
}

function renderFilterOptions() {
  const roles = sortTextValues(
    Array.from(
      new Set(
        currentCandidates.flatMap((candidate) => {
          return Array.isArray(candidate.job_roles) ? candidate.job_roles : [];
        })
      )
    )
  );
  const tags = sortTextValues(
    Array.from(
      new Set(
        currentCandidates.flatMap((candidate) => {
          return Array.isArray(candidate.tags) ? candidate.tags.map(normalizeTag) : [];
        })
      )
    ).filter(Boolean)
  );
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
  const tags = sortTextValues(
    Array.from(
      new Set(
        currentCandidates.flatMap((candidate) => {
          return Array.isArray(candidate.tags) ? candidate.tags.map(normalizeTag) : [];
        })
      )
    ).filter(Boolean)
  );
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
  const tags = sortTextValues(
    Array.from(
      new Set(
        currentCandidates.flatMap((candidate) => {
          return Array.isArray(candidate.tags) ? candidate.tags.map(normalizeTag) : [];
        })
      )
    ).filter(Boolean)
  );

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
  totalCandidatesCount.textContent = String(currentCandidates.length);
  filteredCandidatesCount.textContent = String(filteredCandidates.length);
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

function applyCandidateFilters() {
  const filters = {
    search: filterSearchInput.value.trim().toLowerCase(),
    role: filterRoleSelect.value,
    tag: filterTagSelect.value,
    status: filterStatusSelect.value,
    dateFrom: filterDateFromInput.value,
    dateTo: filterDateToInput.value,
    hasCv: filterHasCvInput.checked,
  };

  filteredCandidates = sortCandidates(
    currentCandidates.filter((candidate) => candidateMatchesFilters(candidate, filters))
  );
  currentPage = Math.min(currentPage, getTotalPages(filteredCandidates.length));
  renderCandidates(getPaginatedCandidates(filteredCandidates));
  updateResultsSummary();
  updatePaginationUi(filteredCandidates.length);
  syncSortButtons();
}

function clearFilters() {
  filtersForm.reset();
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
    setStatus("No se encontro la candidatura seleccionada.", "error");
    return;
  }

  switchPrivateTab("search");
  populateDetailForm(candidate);
  setDetailEditMode(editMode);
  candidateDetailPanel.classList.remove("hidden");
}

function closeCandidateDetail() {
  candidateDetailPanel.classList.add("hidden");
  detailForm.reset();
  setDetailEditMode(false);
}

async function saveCandidateDetail(event) {
  event.preventDefault();

  if (!detailEditMode) {
    return;
  }

  const candidateId = detailIdInput.value;
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

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("candidates").update(updatePayload).eq("id", candidateId);

  if (error) {
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

  await fetchCandidates();
  openCandidateDetail(candidateId, false);
  setStatus("Candidatura actualizada correctamente.", "success");
}

async function deleteCandidate(candidateId) {
  const candidate = getCandidateById(candidateId);
  if (!candidate) {
    setStatus("No se encontro la candidatura seleccionada.", "error");
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
    closeCandidateDetail();
  }

  await fetchCandidates();
  setStatus("Candidatura borrada correctamente.", "success");
}

function exportFilteredCandidatesToCsv() {
  if (!filteredCandidates.length) {
    setStatus("No hay resultados filtrados para exportar.", "error");
    return;
  }

  const headers = [
    "Fecha",
    "Nombre",
    "Telefono",
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
  const rows = filteredCandidates.map((candidate) => {
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
}

function exportSelectedCandidatesToPdf() {
  const selectedCandidates = sortCandidates(getSelectedCandidates());

  if (!selectedCandidates.length) {
    setStatus("Selecciona al menos una candidatura para exportar el PDF.", "error");
    return;
  }

  void (async () => {
    try {
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
        writeWrappedText("Telefono", candidate.phone);
        writeWrappedText("Correo electronico", candidate.email);
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
  if (!currentSession) {
    currentCandidates = [];
    renderCandidates([]);
    syncTagsUi();
    return [];
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("candidates")
    .select(CANDIDATE_SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    setStatus(`No se pudieron cargar las candidaturas: ${error.message}`, "error");
    return [];
  }

  currentCandidates = data ?? [];
  selectedCandidateIds = new Set(
    [...selectedCandidateIds].filter((candidateId) =>
      currentCandidates.some((candidate) => candidate.id === candidateId)
    )
  );
  renderFilterOptions();
  applyCandidateFilters();
  syncTagsUi();
  return currentCandidates;
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

async function savePrivateCandidate(payload) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("candidates").insert(payload);

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

  const email = document.querySelector("#login-email").value.trim();
  const password = document.querySelector("#login-password").value;

  setStatus("Validando acceso...");

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    setStatus(`No se pudo iniciar sesion: ${error.message}`, "error");
    return;
  }

  currentSession = data.session;
  togglePrivateView(true, data.user?.email ?? email);
  await fetchCandidates();
  loginForm.reset();
  setStatus("Acceso concedido. Panel privado conectado con Supabase.", "success");
}

async function handleLogout() {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    setStatus(`No se pudo cerrar sesion: ${error.message}`, "error");
    return;
  }

  currentSession = null;
  togglePrivateView(false);
  currentCandidates = [];
  renderFilterOptions();
  clearFilters();
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
    await savePrivateCandidate(payload);
  } catch (error) {
    setStatus(`No se pudo guardar la candidatura: ${error.message}`, "error");
    return;
  }

  candidateForm.reset();
  selectedCandidateTags = [];
  syncSportSpecialtiesVisibilityFor(
    candidateForm,
    sportRoleCheckbox,
    sportSpecialtiesGroup,
    "sport_specialties"
  );
  document.querySelector("#registration-date").value = new Date()
    .toISOString()
    .slice(0, 10);
  await fetchCandidates();
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
  const supabase = await getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  currentSession = session;

  if (!session) {
    togglePrivateView(false);
    return;
  }

  togglePrivateView(true, session.user.email ?? "");
  await fetchCandidates();
}

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

  const editId = event.target.closest("[data-edit-id]")?.dataset.editId;
  if (editId) {
    openCandidateDetail(editId, true);
    return;
  }

  const deleteId = event.target.closest("[data-delete-id]")?.dataset.deleteId;
  if (deleteId) {
    await deleteCandidate(deleteId);
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
  if (currentPage >= getTotalPages(filteredCandidates.length)) {
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

function initDates() {
  document.querySelector("#registration-date").value = new Date()
    .toISOString()
    .slice(0, 10);
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

  showPublicPanelButton.addEventListener("click", () => switchPanel("public"));
  showPrivatePanelButton.addEventListener("click", () => switchPanel("private"));
  privateTabNewButton.addEventListener("click", () => switchPrivateTab("new"));
  privateTabSearchButton.addEventListener("click", () => switchPrivateTab("search"));
  loginForm.addEventListener("submit", (event) => {
    void handleLogin(event);
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
  filtersForm.addEventListener("input", () => {
    currentPage = 1;
    applyCandidateFilters();
  });
  filtersForm.addEventListener("change", () => {
    currentPage = 1;
    applyCandidateFilters();
  });
  clearFiltersButton.addEventListener("click", clearFilters);
  exportCsvButton.addEventListener("click", exportFilteredCandidatesToCsv);
  exportSelectedPdfButton.addEventListener("click", exportSelectedCandidatesToPdf);
  previousPageButton.addEventListener("click", goToPreviousPage);
  nextPageButton.addEventListener("click", goToNextPage);
  pageSizeSelect.addEventListener("change", handlePageSizeChange);
  closeDetailButton.addEventListener("click", closeCandidateDetail);
  detailOverlay.addEventListener("click", closeCandidateDetail);
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
  applyCandidateFilters();
  await restoreSession();
  switchPrivateTab("new");
  switchPanel("public");

  setStatus("");
}

void init();
