// ============================================================
// Módulo de Candidaturas
// ============================================================

function invalidateCandidateFilterOptions() {
  candidateFilterOptionsLoaded = false;
  candidateFilterOptionsPromise = null;
}

// --- Normalize / format helpers (candidates-specific) ---

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

// --- Render ---

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

// --- Tags UI ---

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

// --- Filters ---

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
    .trim();

  if (filters.search && !normalizeSearchText(searchHaystack).includes(normalizeSearchText(filters.search))) {
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

function applyCandidateFiltersToQuery(query, filters, options = {}) {
  const includeTextFilter = options.includeTextFilter !== false;

  if (filters.search && includeTextFilter) {
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
    query = applyCandidateFiltersToQuery(query, filters, { includeTextFilter: false });
    query = applyCandidateSortToQuery(query);

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    rows.push(...(data ?? []).filter((candidate) => candidateMatchesFilters(candidate, filters)));

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

// --- Detail panel ---

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

// --- Export ---

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

// --- Tags ---

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

// --- Form helpers ---

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

// --- Main fetch ---

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

  if (filters.search) {
    const [rows, totalResult, filterOptionsResult] = await Promise.all([
      fetchAllFilteredCandidates(),
      supabase.from("candidates").select("id", { count: "exact", head: true }),
      fetchCandidateFilterOptions(supabase).then(
        () => ({ ok: true }),
        (filterError) => ({ ok: false, error: filterError })
      ),
    ]);

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
          Array.from(new Set(rows.flatMap((candidate) => candidate.job_roles ?? [])))
        ),
        tags: sortTextValues(
          Array.from(new Set(rows.flatMap((candidate) => candidate.tags ?? []).map(normalizeTag))).filter(Boolean)
        ),
      };
      candidateFilterOptionsLoaded = true;
      renderFilterOptions();
    }

    currentCandidates = rows.slice(from, to + 1);
    filteredCandidates = currentCandidates;
    candidateTotalCount = totalResult.count ?? rows.length;
    candidateFilteredCount = rows.length;
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

  let query = supabase
    .from("candidates")
    .select(CANDIDATE_SELECT_COLUMNS, { count: "exact" });
  query = applyCandidateFiltersToQuery(query, filters, { includeTextFilter: false });
  query = applyCandidateSortToQuery(query);

  query = query.range(from, to);

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

// --- Supabase persistence ---

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

// --- Handlers ---

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

// --- Create panel ---

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

// --- Pagination + table event handlers ---

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
