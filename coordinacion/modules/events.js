// ============================================================
// Módulo de Eventos Deportivos
// ============================================================

// El contrato del evento acota las instalaciones y el personal disponibles.
function getEventContractName(id) {
  const normalizedId = Number(id);
  return eventContractRows.find((row) => Number(row.id) === normalizedId)?.contrato || "";
}

function getEventCreatorName(userId) {
  if (!userId) {
    return "";
  }
  const creator = eventCreatorRows.find((row) => String(row.user_id) === String(userId));
  return creator?.nombre || creator?.user_id || "";
}

function isEventContractAssignmentActive(row) {
  return Boolean(row?.activo) && !row?.removed_at;
}

function getEventContractInstallationRows(contractId) {
  const normalizedContractId = Number(contractId);
  if (!normalizedContractId) {
    return [];
  }

  const installationIds = new Set(
    eventContractInstallationRows
      .filter((row) => Number(row.contrato_id) === normalizedContractId && isEventContractAssignmentActive(row))
      .map((row) => Number(row.instalacion_id))
  );

  return eventAllInstallationRows.filter((row) => installationIds.has(Number(row.id)));
}

function getEventContractPersonnelRows(contractId) {
  const normalizedContractId = Number(contractId);
  if (!normalizedContractId) {
    return [];
  }

  const personnelIds = new Set(
    eventContractPersonalRows
      .filter((row) => Number(row.contrato_id) === normalizedContractId && isEventContractAssignmentActive(row))
      .map((row) => Number(row.personal_id))
  );

  return eventPersonnelRows.filter((row) => personnelIds.has(Number(row.id)));
}

function getCurrentEventContractId() {
  return Number(getSelectedEvent()?.contrato_id || eventContractSelect?.value || 0);
}

function renderEventContractOptions(selectedValue = eventContractSelect?.value || "") {
  if (!eventContractSelect) {
    return;
  }

  eventContractSelect.innerHTML = [
    '<option value="">Selecciona contrato</option>',
    ...eventContractRows.map((row) => `<option value="${row.id}">${escapeHtml(row.contrato)}</option>`),
  ].join("");
  eventContractSelect.value = eventContractRows.some((row) => String(row.id) === String(selectedValue))
    ? String(selectedValue)
    : "";
}

function syncEventInstallationOptionsForContract(selectedValue = eventInstallationSelect?.value || "") {
  const contractId = Number(eventContractSelect?.value || 0);
  eventInstallationRows = getEventContractInstallationRows(contractId);
  renderEventCatalogOptions(selectedValue);
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

function renderEventCatalogOptions(selectedInstallationId = eventInstallationSelect?.value || "") {
  const installationOptions = [
    '<option value="">Selecciona instalación</option>',
    ...eventInstallationRows.map(
      (row) => `<option value="${row.id}">${escapeHtml(row.instalacion)}</option>`
    ),
  ].join("");

  if (eventInstallationSelect) {
    eventInstallationSelect.innerHTML = installationOptions;
    eventInstallationSelect.value = eventInstallationRows.some(
      (row) => String(row.id) === String(selectedInstallationId)
    )
      ? String(selectedInstallationId)
      : "";
  }

  renderEventSchedulePersonnelLists();
}

function renderEventSchedulePersonnelLists() {
  if (!eventScheduleAvailablePersonnelSelect || !eventScheduleSelectedPersonnelSelect) {
    return;
  }

  const contractPersonnelRows = getEventContractPersonnelRows(getCurrentEventContractId());
  const availableRows = contractPersonnelRows.filter((row) => {
    const id = Number(row.id);
    return !currentEventScheduleSelectedPersonnelIds.has(id);
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
  const contractId = eventFilterContractSelect?.value || "";
  const installationId = eventFilterInstallationSelect?.value || "";
  const startDate = eventFilterStartDateInput?.value || "";
  const includeArchived = Boolean(eventFilterIncludeArchivedInput?.checked);

  return currentEvents.filter((event) => {
    if (!includeArchived && isEventArchived(event)) {
      return false;
    }
    const matchesName = !nameQuery || normalizeSearchText(event.nombre).includes(nameQuery);
    const matchesContract = !contractId || String(event.contrato_id) === String(contractId);
    const matchesInstallation =
      !installationId || String(event.instalacion_id) === String(installationId);
    const matchesStartDate = !startDate || event.fecha_inicio === startDate;
    return matchesName && matchesContract && matchesInstallation && matchesStartDate;
  });
}

function resetSingleEventFilter(filterName) {
  const fieldMap = {
    name: eventFilterNameInput,
    contract: eventFilterContractSelect,
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
  const contractId = eventFilterContractSelect?.value || "";
  const startDate = eventFilterStartDateInput?.value || "";
  const includeArchived = Boolean(eventFilterIncludeArchivedInput?.checked);

  return currentEvents.filter((event) => {
    if (!includeArchived && isEventArchived(event)) {
      return false;
    }
    const matchesName = !nameQuery || normalizeSearchText(event.nombre).includes(nameQuery);
    const matchesContract = !contractId || String(event.contrato_id) === String(contractId);
    const matchesStartDate = !startDate || event.fecha_inicio === startDate;
    return matchesName && matchesContract && matchesStartDate;
  });
}

function getEventsForContractFilter() {
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

function renderEventInstallationFilterOptions() {
  if (!eventFilterInstallationSelect) {
    return;
  }

  const selectedValue = eventFilterInstallationSelect.value;
  const installationIds = new Set(
    getEventsForInstallationFilter().map((event) => String(event.instalacion_id))
  );
  const options = eventAllInstallationRows.filter((row) =>
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

function renderEventContractFilterOptions() {
  if (!eventFilterContractSelect) {
    return;
  }

  const selectedValue = eventFilterContractSelect.value;
  const contractIds = new Set(
    getEventsForContractFilter()
      .map((event) => String(event.contrato_id || ""))
      .filter(Boolean)
  );
  const options = eventContractRows.filter((row) => contractIds.has(String(row.id)));

  eventFilterContractSelect.innerHTML = [
    '<option value="">Todos</option>',
    ...options.map((row) => `<option value="${row.id}">${escapeHtml(row.contrato)}</option>`),
  ].join("");

  eventFilterContractSelect.value = contractIds.has(String(selectedValue)) ? selectedValue : "";
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

  renderEventContractFilterOptions();
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
            ${event.contrato_id ? `<br><span class="muted-text">Contrato: ${escapeHtml(getEventContractName(event.contrato_id))}</span>` : ""}
            ${
              currentUserIsAccessAdmin && event.created_by
                ? `<br><span class="muted-text">Creado por: ${escapeHtml(getEventCreatorName(event.created_by))}</span>`
                : ""
            }
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
      `;
    })
    .join("");
}

function resetEventForm() {
  eventForm?.reset();
  if (eventIdInput) {
    eventIdInput.value = "";
  }
  renderEventContractOptions();
  syncEventInstallationOptionsForContract();
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
  renderEventContractOptions(event.contrato_id || "");
  syncEventInstallationOptionsForContract(event.instalacion_id || "");
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
  const [
    contractsResult,
    installationsResult,
    assignedInstallationsResult,
    personnelResult,
    assemblyPersonnelResult,
    contractPersonalResult,
    contractInstallationResult,
    creatorsResult,
  ] = await Promise.all([
    supabase
      .from("contratos")
      .select("id, contrato, activo")
      .order("contrato", { ascending: true }),
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
    supabase
      .from("contrato_personal")
      .select("contrato_id, personal_id, activo, fecha_inicio, fecha_fin, removed_at"),
    supabase
      .from("contrato_instalaciones")
      .select("contrato_id, instalacion_id, activo, fecha_inicio, fecha_fin, removed_at"),
    currentUserIsAccessAdmin
      ? supabase.from("coordinacion_usuarios").select("user_id, nombre")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (contractsResult.error) {
    throw contractsResult.error;
  }
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
  if (contractPersonalResult.error) {
    throw contractPersonalResult.error;
  }
  if (contractInstallationResult.error) {
    throw contractInstallationResult.error;
  }
  if (creatorsResult.error) {
    throw creatorsResult.error;
  }

  eventContractRows = (contractsResult.data ?? []).filter((row) => row.activo !== false);
  eventAllInstallationRows = installationsResult.data ?? [];
  eventAssignedInstallationIds = new Set(
    assignedInstallationsTableMissing
      ? eventAllInstallationRows.map((row) => Number(row.id))
      : (assignedInstallationsResult.data ?? []).map((row) => Number(row.instalacion_id))
  );
  eventInstallationRows = [];
  eventPersonnelRows = personnelResult.data ?? [];
  eventAssemblyPersonnelIds = new Set((assemblyPersonnelResult.data ?? []).map((row) => Number(row.personal_id)));
  eventContractPersonalRows = contractPersonalResult.data ?? [];
  eventContractInstallationRows = contractInstallationResult.data ?? [];
  eventCreatorRows = creatorsResult.data ?? [];
  eventsCatalogsLoaded = true;
  renderEventContractOptions();
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
  syncEventInstallationOptionsForContract(eventInstallationSelect?.value || "");
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
    .select("id, nombre, contrato_id, instalacion_id, fecha_inicio, fecha_fin, observaciones, archived_at, created_by")
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
    contrato_id: Number(eventContractSelect?.value || 0),
    instalacion_id: Number(eventInstallationSelect.value),
    fecha_inicio: eventStartDateInput.value,
    fecha_fin: eventEndDateInput.value,
    observaciones: eventObservationsInput.value.trim() || null,
  };

  if (!payload.nombre || !payload.contrato_id || !payload.instalacion_id || !payload.fecha_inicio || !payload.fecha_fin) {
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
  } else if (currentSession?.user?.id) {
    payload.created_by = currentSession.user.id;
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
