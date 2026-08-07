(function () {
  "use strict";

  const state = {
    initialized: false,
    loaded: false,
    view: "resumen",
    contracts: [],
    budgets: [],
    invoices: [],
    statuses: [],
    rates: [],
    periods: [],
    functions: [],
    services: [],
    functionServices: [],
    preparations: [],
    preparationsLoaded: false,
    preparationSelectedIds: new Set(),
    contractId: "",
    year: "",
    generation: null,
    // Ticks "a nivel de servicio": cada grupo calculado (contrato+función,
    // que es como llega ya resuelto el servicio de la tarifa) se puede
    // excluir del guardado sin tener que recalcular. Guarda las group.key
    // desmarcadas; vacío = se guarda todo lo calculado (el estado por
    // defecto). Se reinicia en cada Calcular nuevo.
    generationExcludedGroupKeys: new Set(),
    isAdmin: false,
  };

  const el = {};
  const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
  const percent = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const dateFmt = new Intl.DateTimeFormat("es-ES");

  function q(selector) {
    return document.querySelector(selector);
  }

  function qa(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function numeric(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
  }

  function formatMoney(value) {
    return money.format(numeric(value));
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? "—" : dateFmt.format(date);
  }

  function setStatus(message = "", tone = "") {
    el.status.textContent = message;
    el.status.className = `panel-status-message${tone ? ` ${tone}` : ""}`;
  }

  async function getClient() {
    if (!window.SupabaseApp?.getClient) {
      throw new Error("El cliente de Supabase no está disponible.");
    }
    return window.SupabaseApp.getClient();
  }

  async function fetchAll(supabase, table, select, orderColumn, ascending = true) {
    const pageSize = 1000;
    const rows = [];
    for (let from = 0; ; from += pageSize) {
      const result = await supabase
        .from(table)
        .select(select)
        .order(orderColumn, { ascending })
        .range(from, from + pageSize - 1);
      if (result.error) return result;
      rows.push(...(result.data || []));
      if ((result.data || []).length < pageSize) return { data: rows, error: null };
    }
  }

  function selectedContract() {
    return state.contracts.find((row) => String(row.id) === String(state.contractId));
  }

  function invoicesForSelection() {
    return state.invoices.filter((row) => {
      if (String(row.contrato_id) !== String(state.contractId)) return false;
      return !state.year || String(row.fecha || "").startsWith(`${state.year}-`);
    });
  }

  function budgetsForSelection() {
    return state.budgets.filter((row) => {
      if (String(row.contrato_id) !== String(state.contractId)) return false;
      if (!state.year) return true;
      return String(row.fecha_inicio || "").slice(0, 4) <= state.year
        && String(row.fecha_fin || "").slice(0, 4) >= state.year;
    });
  }

  function invoiceBudgetTotals(invoices = invoicesForSelection()) {
    return invoices.reduce((map, row) => {
      const key = String(row.presupuesto_id ?? "");
      map.set(key, (map.get(key) || 0) + numeric(row.total));
      return map;
    }, new Map());
  }

  function renderContractOptions() {
    const byName = (a, b) => String(a.contrato || "").localeCompare(String(b.contrato || ""), "es", { sensitivity: "base" });
    const active = state.contracts.filter((row) => row.activo).sort(byName);
    const inactive = state.contracts.filter((row) => !row.activo).sort(byName);
    const current = state.contractId;
    const options = [
      '<option value="">Selecciona un contrato</option>',
      ...active.map((row) => `<option value="${row.id}">${escapeHtml(row.contrato)}</option>`),
      ...(inactive.length
        ? [`<optgroup label="No activos">${inactive.map((row) => `<option value="${row.id}">${escapeHtml(row.contrato)}</option>`).join("")}</optgroup>`]
        : []),
    ];
    el.contractSelect.innerHTML = options.join("");
    el.contractSelect.value = current;
  }

  function renderYears() {
    const years = new Set();
    state.invoices.forEach((row) => {
      if (String(row.contrato_id) === String(state.contractId) && row.fecha) {
        years.add(String(row.fecha).slice(0, 4));
      }
    });
    state.budgets.forEach((row) => {
      if (String(row.contrato_id) === String(state.contractId)) {
        if (row.fecha_inicio) years.add(String(row.fecha_inicio).slice(0, 4));
        if (row.fecha_fin) years.add(String(row.fecha_fin).slice(0, 4));
      }
    });
    el.yearSelect.innerHTML = [
      '<option value="">Todos</option>',
      ...Array.from(years).sort().reverse().map((year) => `<option value="${year}">${year}</option>`),
    ].join("");
    if (!years.has(state.year)) state.year = "";
    el.yearSelect.value = state.year;
  }

  function renderContractCard() {
    const contract = selectedContract();
    el.contractCard.classList.toggle("hidden", !contract);
    if (!contract) return;
    el.contractName.textContent = contract.contrato || `Contrato ${contract.id}`;
    el.contractDescription.textContent = contract.descripcion || "Sin descripción";
    el.contractClient.textContent = contract.cliente || "—";
    el.contractFile.textContent = contract.expediente || "—";
    el.contractDates.textContent = `${formatDate(contract.fecha_inicio)} – ${formatDate(contract.fecha_fin)}`;
    el.contractState.textContent = contract.activo ? "Activo" : "No activo";
  }

  function renderKpis() {
    const budgets = budgetsForSelection();
    const invoices = invoicesForSelection();
    const budget = budgets.reduce((sum, row) => sum + numeric(row.presupuesto), 0);
    const invoiced = invoices.reduce((sum, row) => sum + numeric(row.total), 0);
    const balance = budget - invoiced;
    const execution = budget ? (invoiced / budget) * 100 : 0;
    const pending = invoices
      .filter((row) => !row.cobrada)
      .reduce((sum, row) => sum + numeric(row.total), 0);

    el.kpiBudget.textContent = formatMoney(budget);
    el.kpiInvoiced.textContent = formatMoney(invoiced);
    el.kpiBalance.textContent = formatMoney(balance);
    el.kpiBalance.className = balance < 0 ? "negative" : "";
    el.kpiExecution.textContent = `${percent.format(execution)} %`;
    el.kpiExecution.className = execution > 100 ? "negative" : execution >= 85 ? "warning" : "";
    el.kpiPending.textContent = formatMoney(pending);
  }

  function budgetRow(row, totals, withAction = false) {
    const invoiced = totals.get(String(row.id)) || 0;
    const balance = numeric(row.presupuesto) - invoiced;
    const execution = numeric(row.presupuesto) ? (invoiced / numeric(row.presupuesto)) * 100 : 0;
    return `
      <tr>
        <td>${escapeHtml(row.periodo)}</td>
        <td>${formatDate(row.fecha_inicio)}</td>
        <td>${formatDate(row.fecha_fin)}</td>
        <td class="numeric">${formatMoney(row.presupuesto)}</td>
        ${withAction ? `<td class="numeric">${percent.format(numeric(row.porcentaje_iva) * 100)} %</td>` : ""}
        <td class="numeric">${formatMoney(invoiced)}</td>
        <td class="numeric ${balance < 0 ? "negative" : ""}">${formatMoney(balance)}</td>
        <td class="numeric">${percent.format(execution)} %</td>
        ${withAction ? `<td><button type="button" class="secondary-button row-action" data-edit-budget="${row.id}">Editar</button></td>` : ""}
      </tr>`;
  }

  function renderBudgets() {
    const budgets = budgetsForSelection().sort((a, b) => String(a.fecha_inicio).localeCompare(String(b.fecha_inicio)));
    const totals = invoiceBudgetTotals();
    el.summaryPeriods.innerHTML = budgets.length
      ? budgets.map((row) => budgetRow(row, totals)).join("")
      : '<tr><td colspan="7" class="empty-state">No hay presupuestos para esta selección.</td></tr>';
    el.budgetsBody.innerHTML = budgets.length
      ? budgets.map((row) => budgetRow(row, totals, true)).join("")
      : '<tr><td colspan="9" class="empty-state">No hay presupuestos para esta selección.</td></tr>';
  }

  function renderAlerts() {
    const invoices = invoicesForSelection();
    const budgets = budgetsForSelection();
    const alerts = [];
    const unassigned = invoices.filter((row) => !row.presupuesto_id).length;
    const noStatus = invoices.filter((row) => !row.contrato_estado_factura_id).length;
    const paidStatusIds = new Set(state.statuses.filter((row) => row.es_pagada).map((row) => String(row.id)));
    const paidWithoutCollection = invoices.filter((row) => paidStatusIds.has(String(row.contrato_estado_factura_id)) && !row.cobrada).length;
    const badTotal = invoices.filter((row) => Math.abs(numeric(row.base_imponible) + numeric(row.iva) - numeric(row.total)) > 0.03).length;
    const totals = invoiceBudgetTotals(invoices);
    const exceeded = budgets.filter((row) => (totals.get(String(row.id)) || 0) > numeric(row.presupuesto)).length;

    if (exceeded) alerts.push({ tone: "error", text: `${exceeded} periodo${exceeded === 1 ? "" : "s"} con presupuesto superado.` });
    if (unassigned) alerts.push({ tone: "warning", text: `${unassigned} factura${unassigned === 1 ? "" : "s"} sin presupuesto asociado.` });
    if (noStatus) alerts.push({ tone: "warning", text: `${noStatus} factura${noStatus === 1 ? "" : "s"} sin estado.` });
    if (paidWithoutCollection) alerts.push({ tone: "warning", text: `${paidWithoutCollection} factura${paidWithoutCollection === 1 ? "" : "s"} pagada${paidWithoutCollection === 1 ? "" : "s"} sin cobro registrado.` });
    if (badTotal) alerts.push({ tone: "error", text: `${badTotal} factura${badTotal === 1 ? "" : "s"} con descuadre entre base, IVA y total.` });
    if (!alerts.length) alerts.push({ tone: "", text: "No hay incidencias en la selección actual." });
    el.alerts.innerHTML = alerts.map((item) => `<li class="${item.tone}">${escapeHtml(item.text)}</li>`).join("");
  }

  function renderYearChart() {
    const grouped = new Map();
    state.invoices
      .filter((row) => String(row.contrato_id) === String(state.contractId))
      .forEach((row) => {
        const year = String(row.fecha || "").slice(0, 4) || "Sin fecha";
        grouped.set(year, (grouped.get(year) || 0) + numeric(row.total));
      });
    const rows = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const max = Math.max(1, ...rows.map(([, value]) => Math.abs(value)));
    el.yearChart.innerHTML = rows.length
      ? rows.map(([year, value]) => `
          <div class="facturacion-year-row">
            <strong>${escapeHtml(year)}</strong>
            <div class="facturacion-year-track"><div class="facturacion-year-bar" style="width:${Math.max(1, Math.abs(value) / max * 100)}%"></div></div>
            <span class="facturacion-year-value">${formatMoney(value)}</span>
          </div>`).join("")
      : '<p class="empty-state">No hay facturación registrada.</p>';
  }

  function invoiceMatchesSearch(row) {
    const term = String(el.invoiceSearch.value || "").trim().toLocaleLowerCase("es");
    if (!term) return true;
    return [row.serie, row.n_documento, row.referencia, row.cliente]
      .some((value) => String(value || "").toLocaleLowerCase("es").includes(term));
  }

  function renderInvoices() {
    const budgetNames = new Map(state.budgets.map((row) => [String(row.id), row.periodo]));
    const statusNames = new Map(state.statuses.map((row) => [String(row.id), row.estado]));
    const invoices = invoicesForSelection()
      .filter(invoiceMatchesSearch)
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    el.invoicesBody.innerHTML = invoices.length
      ? invoices.map((row) => `
          <tr>
            <td>${formatDate(row.fecha)}</td>
            <td>${escapeHtml([row.serie, row.n_documento].filter(Boolean).join(" / ") || "—")}</td>
            <td title="${escapeHtml(row.referencia)}">${escapeHtml(row.referencia || "—")}</td>
            <td class="numeric">${formatMoney(row.base_imponible)}</td>
            <td class="numeric">${formatMoney(row.iva)}</td>
            <td class="numeric">${formatMoney(row.total)}</td>
            <td>${escapeHtml(budgetNames.get(String(row.presupuesto_id)) || "Sin asignar")}</td>
            <td>${escapeHtml(statusNames.get(String(row.contrato_estado_factura_id)) || "Sin estado")}</td>
            <td>${row.cobrada ? `Cobrada · ${formatDate(row.fecha_cobro)}` : "Pendiente"}</td>
            <td><button type="button" class="secondary-button row-action" data-edit-invoice="${row.id}">Editar</button></td>
          </tr>`).join("")
      : '<tr><td colspan="10" class="empty-state">No hay facturas para esta selección.</td></tr>';
  }

  function renderConfiguration() {
    el.newStatus.disabled = !state.isAdmin;
    el.newStatus.title = state.isAdmin ? "" : "Solo los administradores pueden modificar el catálogo global.";
    const functionNames = new Map(state.functions.map((row) => [String(row.id), row.funcion]));
    const rates = state.rates
      .filter((row) => String(row.contrato_id) === String(state.contractId))
      .sort((a, b) => String(functionNames.get(String(a.funcion_id)) || a.observacion || "").localeCompare(
        String(functionNames.get(String(b.funcion_id)) || b.observacion || ""), "es"
      ));
    el.ratesBody.innerHTML = rates.length
      ? rates.map((row) => `
          <tr>
            <td>${escapeHtml(functionNames.get(String(row.funcion_id)) || "Sin función")}</td>
            <td>${serviceIdsForRate(row.id).length ? escapeHtml(serviceNames(serviceIdsForRate(row.id))) : '<span class="muted-text">Sin servicio</span>'}</td>
            <td>${escapeHtml(row.observacion || "—")}</td>
            <td>${escapeHtml(row.tipo_precio || "—")}</td>
            <td class="numeric">${row.precio_01 == null ? "—" : formatMoney(row.precio_01)}</td>
            <td class="numeric">${row.precio_02 == null ? "—" : formatMoney(row.precio_02)}</td>
            <td>${row.activo ? "Activa" : "No activa"}</td>
            <td><button type="button" class="secondary-button row-action" data-edit-rate="${row.id}">Editar</button></td>
          </tr>`).join("")
      : '<tr><td colspan="8" class="empty-state">El contrato no tiene funciones y tarifas configuradas.</td></tr>';

    const periods = state.periods
      .filter((row) => String(row.contrato_id) === String(state.contractId))
      .sort((a, b) => String(a.fecha_inicio).localeCompare(String(b.fecha_inicio)));
    el.periodsBody.innerHTML = periods.length
      ? periods.map((row) => `
          <tr>
            <td>${escapeHtml(row.concepto)}</td>
            <td>${formatDate(row.fecha_inicio)}</td>
            <td>${formatDate(row.fecha_fin)}</td>
            <td><button type="button" class="secondary-button row-action" data-edit-period="${row.id}">Editar</button></td>
          </tr>`).join("")
      : '<tr><td colspan="4" class="empty-state">El contrato no tiene periodos configurados.</td></tr>';

    el.statusesBody.innerHTML = state.statuses.length
      ? state.statuses.map((row) => `
          <tr>
            <td>${row.registro ?? "—"}</td>
            <td>${escapeHtml(row.estado)}</td>
            <td>${row.es_pagada ? "Sí" : "—"}</td>
            <td>${escapeHtml(row.descripcion || "—")}</td>
            <td>${state.isAdmin ? `<button type="button" class="secondary-button row-action" data-edit-status="${row.id}">Editar</button>` : ""}</td>
          </tr>`).join("")
      : '<tr><td colspan="5" class="empty-state">No hay estados configurados.</td></tr>';
  }

  function render() {
    const hasContract = Boolean(selectedContract());
    const preparationWithoutContract = state.view === "preparacion";
    el.empty.classList.toggle("hidden", hasContract || preparationWithoutContract);
    qa("[data-facturacion-panel]").forEach((panel) => {
      const isActive = panel.dataset.facturacionPanel === state.view;
      panel.classList.toggle("hidden", !isActive || (!hasContract && !preparationWithoutContract));
    });
    renderContractCard();
    renderYears();
    renderPreparations();
    renderBillingGeneration();
    if (!hasContract) return;
    renderKpis();
    renderBudgets();
    renderAlerts();
    renderYearChart();
    renderInvoices();
    renderConfiguration();
  }

  function switchView(view) {
    state.view = ["resumen", "presupuestos", "facturas", "preparacion", "control", "configuracion"].includes(view) ? view : "resumen";
    qa("[data-facturacion-view]").forEach((button) => {
      const active = button.dataset.facturacionView === state.view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
    if (state.view === "control") void loadControl();
    if (state.view === "preparacion") void ensurePreparationsLoaded();
  }

  async function load({ force = false } = {}) {
    if (state.loaded && !force) {
      render();
      return;
    }
    setStatus("Cargando facturación…");
    const supabase = await getClient();
    // contratos_facturacion_preparaciones no se carga aquí: es de las tablas
    // más pesadas y solo hace falta al abrir "Preparación de facturas" -se
    // carga sola, perezosa, igual que Control- (ver ensurePreparationsLoaded).
    const [contracts, budgets, invoices, statuses, rates, periods, functions, services, contratoServicios, functionServices, admin] = await Promise.all([
      fetchAll(supabase, "contratos", "id, contrato, descripcion, fecha_inicio, fecha_fin, expediente, cliente, activo, iva", "contrato"),
      fetchAll(supabase, "contratos_presupuestos", "*", "fecha_inicio"),
      fetchAll(supabase, "contratos_facturacion", "*", "fecha", false),
      fetchAll(supabase, "contratos_estado_facturas", "*", "registro"),
      fetchAll(supabase, "contratos_funciones", "*", "id"),
      fetchAll(supabase, "contratos_fechas", "*", "fecha_inicio"),
      fetchAll(supabase, "funciones", "id,funcion,activo", "funcion"),
      fetchAll(supabase, "servicios", "id,servicio,activo", "servicio"),
      fetchAll(supabase, "contrato_servicios", "contrato_id,servicio_id,activo", "contrato_id"),
      fetchAll(supabase, "contratos_funciones_servicios", "*", "id"),
      supabase.rpc("is_coordinacion_admin"),
    ]);
    const failed = [contracts, budgets, invoices, statuses, rates, periods, functions, services, contratoServicios, functionServices].find((result) => result.error);
    if (failed) {
      setStatus(`No se pudo cargar Facturación: ${failed.error.message}`, "error");
      throw failed.error;
    }
    state.contracts = contracts.data || [];
    state.budgets = budgets.data || [];
    state.invoices = invoices.data || [];
    state.statuses = statuses.data || [];
    state.rates = rates.data || [];
    state.periods = periods.data || [];
    state.functions = functions.data || [];
    state.services = services.data || [];
    state.contratoServicios = contratoServicios.data || [];
    state.functionServices = functionServices.data || [];
    state.isAdmin = !admin.error && Boolean(admin.data);
    state.loaded = true;
    if (state.contractId && !selectedContract()) state.contractId = "";
    renderContractOptions();
    render();
    setStatus("");
    if (state.view === "preparacion") void ensurePreparationsLoaded();
  }

  // Fase 6 (rendimiento): guardar/borrar una fila no necesita releer las 11
  // tablas de load() -presupuestos, facturas, tarifas... de TODOS los
  // contratos-, solo la que cambió. "Preparación de facturas" agrupa por
  // contrato_facturable_id (puede mezclar contratos vía redirección) y usa
  // rates/budgets/functionServices de cualquier contrato, no solo el
  // seleccionado, así que esas tablas siguen cargándose completas en load();
  // lo que se optimiza aquí es NO repetir esa carga completa en cada
  // guardado, sino refrescar solo la tabla afectada.
  async function reloadBudgets() {
    const supabase = await getClient();
    const result = await fetchAll(supabase, "contratos_presupuestos", "*", "fecha_inicio");
    if (result.error) {
      setStatus(`No se pudieron actualizar los presupuestos: ${result.error.message}`, "error");
      return;
    }
    state.budgets = result.data || [];
    render();
  }

  async function reloadInvoices() {
    const supabase = await getClient();
    const result = await fetchAll(supabase, "contratos_facturacion", "*", "fecha", false);
    if (result.error) {
      setStatus(`No se pudieron actualizar las facturas: ${result.error.message}`, "error");
      return;
    }
    state.invoices = result.data || [];
    render();
  }

  async function reloadStatuses() {
    const supabase = await getClient();
    const result = await fetchAll(supabase, "contratos_estado_facturas", "*", "registro");
    if (result.error) {
      setStatus(`No se pudieron actualizar los estados: ${result.error.message}`, "error");
      return;
    }
    state.statuses = result.data || [];
    render();
  }

  async function reloadPeriods() {
    const supabase = await getClient();
    const result = await fetchAll(supabase, "contratos_fechas", "*", "fecha_inicio");
    if (result.error) {
      setStatus(`No se pudieron actualizar los periodos: ${result.error.message}`, "error");
      return;
    }
    state.periods = result.data || [];
    render();
  }

  async function reloadRates() {
    const supabase = await getClient();
    const [rates, functionServices] = await Promise.all([
      fetchAll(supabase, "contratos_funciones", "*", "id"),
      fetchAll(supabase, "contratos_funciones_servicios", "*", "id"),
    ]);
    const failed = rates.error || functionServices.error;
    if (failed) {
      setStatus(`No se pudieron actualizar las tarifas: ${failed.message}`, "error");
      return;
    }
    state.rates = rates.data || [];
    state.functionServices = functionServices.data || [];
    render();
  }

  async function reloadPreparations() {
    const supabase = await getClient();
    const result = await fetchAll(supabase, "contratos_facturacion_preparaciones", "*", "created_at", false);
    if (result.error) {
      setStatus(`No se pudieron actualizar las preparaciones: ${result.error.message}`, "error");
      return;
    }
    state.preparations = result.data || [];
    state.preparationsLoaded = true;
    render();
  }

  // Carga perezosa (como loadControl para la pestaña Control): solo la
  // primera vez que se visita "Preparación de facturas", no en cada load().
  async function ensurePreparationsLoaded() {
    if (state.preparationsLoaded) return;
    await reloadPreparations();
  }

  const CONFIGURATION_TABLE_RELOADERS = {
    contratos_presupuestos: reloadBudgets,
    contratos_facturacion: reloadInvoices,
    contratos_estado_facturas: reloadStatuses,
    contratos_fechas: reloadPeriods,
    contratos_funciones: reloadRates,
  };

  function getIsoWeek(value) {
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00Z`);
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  }

  function recordHours(row) {
    const total = numeric(row.horas);
    const nocturnal = row.horas_nocturnas == null ? 0 : numeric(row.horas_nocturnas);
    const diurnal = row.horas_diurnas == null
      ? Math.max(0, total - nocturnal)
      : numeric(row.horas_diurnas);
    return { total, diurnal, nocturnal };
  }

  function serviceName(serviceId) {
    if (!serviceId) return "Sin servicio";
    const service = state.services.find((row) => String(row.id) === String(serviceId));
    return service?.servicio || `Servicio ${serviceId}`;
  }

  function serviceNames(serviceIds) {
    if (!serviceIds?.length) return "Sin servicio";
    return serviceIds.map((id) => serviceName(id)).join(" + ");
  }

  // Etiquetas de servicio de una tarifa (contratos_funciones.id). Puede haber
  // varias: esa funcion se comparte entre esos servicios y, al agrupar por
  // servicio, se fusionan siempre juntos (ver contratos_funciones_servicio.sql).
  function serviceIdsForRate(rateId) {
    if (!rateId) return [];
    return state.functionServices
      .filter((row) => String(row.contrato_funcion_id) === String(rateId))
      .map((row) => row.servicio_id);
  }

  // servicios es un catálogo global (ver servicios_globalizar.sql): qué
  // servicios están habilitados en un contrato vive en contrato_servicios.
  function servicesForContract(contractId) {
    const enabledIds = new Set(
      state.contratoServicios
        .filter((row) => row.activo && String(row.contrato_id) === String(contractId))
        .map((row) => String(row.servicio_id))
    );
    return state.services.filter((service) => enabledIds.has(String(service.id)));
  }

  function selectRate(contractId, functionId) {
    const candidates = state.rates.filter((row) =>
      String(row.contrato_id) === String(contractId)
      && String(row.funcion_id ?? "") === String(functionId ?? "")
    );
    const active = candidates.filter((row) => row.activo);
    const selected = active[0] || candidates[0] || null;
    return { selected, ambiguous: (active.length || candidates.length) > 1 };
  }

  async function fetchBillingRecords(from, to, scope) {
    const supabase = await getClient();
    const pageSize = 1000;
    const rows = [];
    for (let offset = 0; ; offset += pageSize) {
      let query = supabase
        .from("registros_detalle")
        .select(
          "id,fecha,contrato_id,contrato,instalacion_id,instalacion,funcion_id,funcion,horas,horas_diurnas,horas_nocturnas,"
          + "contrato_facturable_id,servicio_facturable_id,funcion_facturable_id,instalacion_facturable_id,"
          + "facturacion_destino_contrato,facturacion_destino_servicio_id,facturacion_destino_servicio,"
          + "facturacion_destino_funcion,facturacion_destino_instalacion"
        )
        .gte("fecha", from)
        .lte("fecha", to)
        .eq("facturar", true)
        .order("fecha", { ascending: true })
        .range(offset, offset + pageSize - 1);
      // Se agrupa por donde se factura, no por donde se trabajo: un registro
      // redirigido a este contrato (registros_facturacion_destino) entra aqui
      // aunque su contrato_id operativo sea otro.
      if (scope === "selected") query = query.eq("contrato_facturable_id", Number(state.contractId));
      const result = await query;
      if (result.error) throw result.error;
      rows.push(...(result.data || []));
      if ((result.data || []).length < pageSize) break;
    }
    return rows;
  }

  function buildBillingGeneration(records, from, to) {
    const contracts = new Map(state.contracts.map((row) => [String(row.id), row]));
    const functionNames = new Map(state.functions.map((row) => [String(row.id), row.funcion]));
    const groups = new Map();
    const alerts = [];
    // Cache por contrato+funcion: la tarifa y sus servicios etiquetados no
    // cambian entre registros de la misma funcion, y con miles de registros
    // no compensa recalcularlo (selectRate/serviceIdsForRate) fila a fila.
    const rateCache = new Map();

    // Se agrupa por contrato/funcion/servicio FACTURABLE (el destino si el
    // registro esta redirigido via registros_facturacion_destino, si no el
    // propio): asi una funcion "Monitorado" trabajada en el contrato A pero
    // redirigida al B cae en el grupo del B, con la tarifa/servicio del B.
    // Se separa por servicio aunque la funcion sea la misma (una tarifa puede
    // etiquetar varios servicios a la vez, ver serviceIdsForRate): cada
    // servicio facturable es su fila y su tick propios en pantalla. Ese
    // "atado" de la tarifa se respeta igualmente al guardar -no se reparten
    // horas entre servicios-, pero eso lo hace clusterGenerationGroups con
    // buildServiceClusters, no este calculo.
    records.forEach((row) => {
      const rateKey = `${row.contrato_facturable_id ?? ""}|${row.funcion_facturable_id ?? ""}`;
      if (!rateCache.has(rateKey)) {
        const rateInfo = selectRate(row.contrato_facturable_id, row.funcion_facturable_id);
        rateCache.set(rateKey, { rateInfo, fallbackServiceIds: serviceIdsForRate(rateInfo.selected?.id) });
      }
      const { rateInfo, fallbackServiceIds } = rateCache.get(rateKey);
      // Si el registro no trae servicio propio (ni el suyo ni uno de
      // redireccion, ver registros_detalle_apuntes.sql) y la tarifa de su
      // funcion tiene un unico servicio etiquetado, no hay ambiguedad: se
      // agrupa directamente con ese servicio -mucho registro historico no
      // tiene servicio_id propio, y sin este fallback aparecia como una fila
      // "duplicada" del mismo servicio en vez de sumarse-. Con 0 o 2+
      // servicios en la tarifa no hay forma de decidir solo, y se deja en su
      // propio grupo "sin servicio" (mismo criterio que antes).
      const resolvedServicioId = row.servicio_facturable_id
        ?? (fallbackServiceIds.length === 1 ? fallbackServiceIds[0] : null);
      const key = `${row.contrato_facturable_id ?? ""}|${row.funcion_facturable_id ?? ""}|${resolvedServicioId ?? ""}`;
      if (!groups.has(key)) {
        const resolvedServiceIds = resolvedServicioId != null ? [resolvedServicioId] : fallbackServiceIds;
        groups.set(key, {
          key,
          contratoId: row.contrato_facturable_id,
          contrato: contracts.get(String(row.contrato_facturable_id))?.contrato
            || row.facturacion_destino_contrato || row.contrato || `Contrato ${row.contrato_facturable_id}`,
          funcionId: row.funcion_facturable_id,
          funcion: functionNames.get(String(row.funcion_facturable_id))
            || row.facturacion_destino_funcion || row.funcion || "Sin función",
          servicioIdSet: new Set(resolvedServiceIds),
          contract: contracts.get(String(row.contrato_facturable_id)),
          rate: rateInfo.selected,
          ambiguousRate: rateInfo.ambiguous,
          total: 0,
          diurnal: 0,
          nocturnal: 0,
          installations: new Map(),
          weeks: new Map(),
          records: [],
          redirectedFrom: new Set(),
        });
      }
      const group = groups.get(key);
      if (String(row.contrato_id) !== String(row.contrato_facturable_id)) {
        group.redirectedFrom.add(row.contrato || `Contrato ${row.contrato_id}`);
      }
      const hours = recordHours(row);
      group.total += hours.total;
      group.diurnal += hours.diurnal;
      group.nocturnal += hours.nocturnal;
      group.records.push({
        registroId: row.id,
        instalacionId: row.instalacion_facturable_id ?? null,
        diurnal: hours.diurnal,
        nocturnal: hours.nocturnal,
      });
      const installationKey = String(row.instalacion_facturable_id ?? row.facturacion_destino_instalacion ?? row.instalacion ?? "sin-instalacion");
      if (!group.installations.has(installationKey)) {
        group.installations.set(installationKey, {
          instalacion: row.facturacion_destino_instalacion || row.instalacion || "Sin instalación",
          total: 0,
          diurnal: 0,
          nocturnal: 0,
        });
      }
      const installation = group.installations.get(installationKey);
      installation.total += hours.total;
      installation.diurnal += hours.diurnal;
      installation.nocturnal += hours.nocturnal;

      const weekKey = `${installationKey}|${getIsoWeek(row.fecha)}`;
      if (!group.weeks.has(weekKey)) {
        group.weeks.set(weekKey, {
          instalacion: installation.instalacion,
          week: getIsoWeek(row.fecha),
          total: 0,
          diurnal: 0,
          nocturnal: 0,
        });
      }
      const week = group.weeks.get(weekKey);
      week.total += hours.total;
      week.diurnal += hours.diurnal;
      week.nocturnal += hours.nocturnal;
    });

    const normalized = Array.from(groups.values())
      .sort((a, b) => `${a.contrato} ${a.funcion}`.localeCompare(`${b.contrato} ${b.funcion}`, "es"))
      .map((group) => {
        group.servicioIds = Array.from(group.servicioIdSet);
        const type = String(group.rate?.tipo_precio || "").toLocaleLowerCase("es");
        const priceDay = numeric(group.rate?.precio_01);
        const priceNight = group.rate?.precio_02 == null ? priceDay : numeric(group.rate.precio_02);
        const fixed = type === "mes" || type === "global";
        const subtotal = group.rate
          ? fixed
            ? priceDay
            : group.diurnal * priceDay + group.nocturnal * priceNight
          : 0;
        const ivaFallback = group.contract?.iva == null;
        const ivaRate = ivaFallback ? 0.21 : numeric(group.contract.iva);
        const iva = subtotal * ivaRate;
        // Estas tres condiciones ya no son solo un aviso: bloquean "Guardar
        // preparación" (ver saveBillingGeneration) porque guardar con un
        // precio a ciegas crearia un importe real erroneo.
        let pricingIssue = null;
        if (!group.rate) {
          pricingIssue = `${group.contrato} · ${group.funcion}: no tiene tarifa configurada.`;
        } else if (group.ambiguousRate) {
          pricingIssue = `${group.contrato} · ${group.funcion}: hay varias tarifas y ninguna está activa; actívala en Configuración.`;
        } else if (!group.rate.tipo_precio || group.rate.precio_01 == null) {
          pricingIssue = `${group.contrato} · ${group.funcion}: la tarifa está incompleta.`;
        }
        if (pricingIssue) alerts.push(pricingIssue);
        if (ivaFallback) {
          alerts.push(`${group.contrato}: el contrato no tiene IVA configurado; se ha aplicado el 21% por defecto.`);
        }
        if (group.redirectedFrom.size) {
          alerts.push(`${group.contrato} · ${group.funcion}: incluye horas trabajadas en ${Array.from(group.redirectedFrom).join(", ")} y redirigidas aquí para facturar.`);
        }
        // Con tarifa por hora el importe de cada linea se puede prorratear
        // (diurnas*precio + nocturnas*precio); con tarifa fija (mes/global) el
        // precio es del grupo entero y no tiene sentido repartirlo por registro,
        // asi que la linea se guarda sin importe propio (el total fiable es el
        // de la preparacion).
        const lines = group.records.map((record) => ({
          registro_id: record.registroId,
          instalacion_id: record.instalacionId,
          funcion_id: group.funcionId,
          horas_diurnas: record.diurnal,
          horas_nocturnas: record.nocturnal,
          precio_01: group.rate?.precio_01 ?? null,
          precio_02: group.rate?.precio_02 ?? null,
          tipo_precio: group.rate?.tipo_precio ?? null,
          importe: fixed ? null : record.diurnal * priceDay + record.nocturnal * priceNight,
        }));

        return {
          ...group,
          type: type || "sin tipo",
          priceDay,
          priceNight,
          subtotal,
          ivaRate,
          iva,
          totalWithIva: subtotal + iva,
          installations: Array.from(group.installations.values()).sort((a, b) => a.instalacion.localeCompare(b.instalacion, "es")),
          weeks: Array.from(group.weeks.values()).sort((a, b) => a.instalacion.localeCompare(b.instalacion, "es") || a.week - b.week),
          lines,
          pricingIssue,
          ivaFallback,
        };
      });

    // Un mismo aviso (tarifa sin servicio, IVA por defecto...) puede repetirse
    // una vez por cada servicio separado de la misma función; no aporta nada
    // verlo duplicado.
    return { from, to, records: records.length, groups: normalized, alerts: Array.from(new Set(alerts)) };
  }

  // "A nivel de servicio": cada grupo calculado ya es un contrato+función con
  // su servicio de tarifa resuelto, así que un tick por grupo es un tick por
  // servicio facturable. Desmarcarlo lo deja fuera de Guardar/PDF sin tener
  // que volver a Calcular.
  function getSelectedGenerationGroups() {
    const generation = state.generation;
    if (!generation) return [];
    return generation.groups.filter((group) => !state.generationExcludedGroupKeys.has(group.key));
  }

  function renderGenerationSelectionSummary() {
    if (!el.generationSelectionSummary) return;
    const generation = state.generation;
    if (!generation?.groups.length) {
      el.generationSelectionSummary.textContent = "";
      return;
    }
    const selected = getSelectedGenerationGroups();
    if (selected.length === generation.groups.length) {
      el.generationSelectionSummary.textContent = "Se guardarán todos los servicios calculados.";
      return;
    }
    const hours = selected.reduce((sum, group) => sum + group.total, 0);
    el.generationSelectionSummary.textContent = selected.length
      ? `Se guardarán ${selected.length} de ${generation.groups.length} servicios (${percent.format(hours)} h). Los desmarcados se quedan fuera de esta preparación.`
      : "No has dejado ningún servicio marcado: no hay nada que guardar.";
  }

  function toggleGenerationGroupSelection(key, included) {
    if (included) state.generationExcludedGroupKeys.delete(key);
    else state.generationExcludedGroupKeys.add(key);
    renderGenerationSelectionSummary();
    const disabled = !getSelectedGenerationGroups().length;
    el.generationSave.disabled = disabled;
    el.generationPdf.disabled = disabled;
    el.generationPreview.disabled = disabled;
    el.generationWeekly.disabled = disabled;
  }

  function renderBillingGeneration() {
    const generation = state.generation;
    el.generationPdf.disabled = !generation?.groups.length;
    el.generationSave.disabled = !generation?.groups.length;
    el.generationPreview.disabled = !generation?.groups.length;
    el.generationWeekly.disabled = !generation?.groups.length;
    if (!generation) {
      // Sin esto, cambiar una tarifa/servicio en Configuración deja en pantalla
      // el cálculo anterior (ya obsoleto) sin ningún aviso: parece que el
      // cambio no sirvió de nada hasta que se pulsa Calcular de nuevo.
      el.generationSummary.classList.add("hidden");
      el.generationSummary.innerHTML = "";
      el.generationAlerts.innerHTML = "";
      el.generationBody.innerHTML =
        '<tr><td colspan="12" class="empty-state">La configuración ha cambiado desde el último cálculo. Pulsa Calcular de nuevo.</td></tr>';
      if (el.generationSelectionSummary) el.generationSelectionSummary.textContent = "";
      return;
    }
    const totalHours = generation.groups.reduce((sum, group) => sum + group.total, 0);
    const subtotal = generation.groups.reduce((sum, group) => sum + group.subtotal, 0);
    const total = generation.groups.reduce((sum, group) => sum + group.totalWithIva, 0);
    el.generationSummary.classList.remove("hidden");
    el.generationSummary.innerHTML = `
      <article><span>Registros incluidos</span><strong>${generation.records}</strong></article>
      <article><span>Horas facturables</span><strong>${percent.format(totalHours)} h</strong></article>
      <article><span>Base calculada</span><strong>${formatMoney(subtotal)}</strong></article>
      <article><span>Total con IVA</span><strong>${formatMoney(total)}</strong></article>`;
    el.generationAlerts.innerHTML = generation.alerts.map((alert) => `<li>${escapeHtml(alert)}</li>`).join("");
    const rows = generation.groups.flatMap((group) => {
      const checked = !state.generationExcludedGroupKeys.has(group.key);
      return [
        ...group.installations.map((installation, index) => `
          <tr class="${checked ? "" : "facturacion-generation-row-excluded"}">
            <td>${index ? "" : `<input type="checkbox" class="facturacion-generation-group-check" data-group-key="${escapeHtml(group.key)}" ${checked ? "checked" : ""} aria-label="Incluir ${escapeHtml(serviceNames(group.servicioIds))} al guardar" />`}</td>
            <td>${index ? "" : escapeHtml(group.contrato)}</td>
            <td>${index ? "" : escapeHtml(serviceNames(group.servicioIds))}</td>
            <td>${index ? "" : escapeHtml(group.funcion)}${index || !group.redirectedFrom.size ? "" : `<br><span class="muted-text" title="Horas trabajadas en otro contrato, redirigidas aquí para facturar">↪ ${escapeHtml(Array.from(group.redirectedFrom).join(", "))}</span>`}</td>
            <td>${escapeHtml(installation.instalacion)}</td>
            <td class="numeric">${percent.format(installation.total)}</td>
            <td class="numeric">${percent.format(installation.diurnal)}</td>
            <td class="numeric">${percent.format(installation.nocturnal)}</td>
            <td></td><td></td><td></td><td></td>
          </tr>`),
        `<tr class="facturacion-function-total${checked ? "" : " facturacion-generation-row-excluded"}">
        <td></td>
        <td></td>
        <td></td>
        <td colspan="2">Total ${escapeHtml(group.funcion)}</td>
        <td class="numeric">${percent.format(group.total)}</td>
        <td class="numeric">${percent.format(group.diurnal)}</td>
        <td class="numeric">${percent.format(group.nocturnal)}</td>
        <td>${escapeHtml(group.type)}</td>
        <td class="numeric">${formatMoney(group.priceDay)}</td>
        <td class="numeric">${formatMoney(group.priceNight)}</td>
        <td class="numeric">${formatMoney(group.subtotal)}</td>
      </tr>`,
      ];
    });
    el.generationBody.innerHTML = rows.length
      ? rows.join("")
      : '<tr><td colspan="12" class="empty-state">No hay registros marcados para facturar en el periodo.</td></tr>';
    el.generationSave.disabled = !getSelectedGenerationGroups().length;
    el.generationPdf.disabled = !getSelectedGenerationGroups().length;
    el.generationPreview.disabled = !getSelectedGenerationGroups().length;
    el.generationWeekly.disabled = !getSelectedGenerationGroups().length;
    renderGenerationSelectionSummary();
  }

  async function calculateBillingGeneration() {
    const from = el.generationFrom.value;
    const to = el.generationTo.value;
    const scope = el.generationScope.value;
    if (!from || !to || to < from) {
      setStatus("Indica un periodo de facturación válido.", "error");
      return;
    }
    if (scope === "selected" && !state.contractId) {
      setStatus("Selecciona un contrato o utiliza todos los contratos visibles.", "error");
      return;
    }
    setStatus("Calculando horas facturables…");
    el.generationCalculate.disabled = true;
    el.generationSave.disabled = true;
    try {
      const records = await fetchBillingRecords(from, to, scope);
      state.generation = buildBillingGeneration(records, from, to);
      state.generationExcludedGroupKeys = new Set();
      renderBillingGeneration();
      setStatus(`Cálculo completado: ${records.length} registros incluidos.`, "success");
    } catch (error) {
      setStatus(`No se pudo calcular la facturación: ${error.message}`, "error");
    } finally {
      el.generationCalculate.disabled = false;
    }
  }

  // "Servicio" y "función separada" exigen que la tarifa tenga al menos un
  // servicio asignado (contratos_funciones_servicios): son variantes de la
  // misma agrupacion por servicio, y sin el dato no hay forma de decidir que
  // funciones van juntas en la misma factura. "Contrato completo" y
  // "Contrato y función" no lo necesitan: junta lo que haya en los datos
  // (servicio_facturable_id de cada registro) sin depender de la etiqueta de
  // la tarifa.
  function resolveGroupServiceIssue(group, agrupacion) {
    if (agrupacion === "contrato" || agrupacion === "contrato_funcion") return null;
    if (!group.servicioIds.length) {
      return `${group.contrato} · ${group.funcion}: la tarifa no tiene ningún servicio asignado (Configuración → Funciones y tarifas). No se puede guardar agrupando por servicio.`;
    }
    return null;
  }

  // Una funcion puede etiquetarse con varios servicios (se comparte entre
  // ellos). Cuando eso pasa, esos servicios quedan "atados" y se agrupan
  // siempre juntos en las agrupaciones "servicio" y "función separada" -no
  // se reparten horas entre ellos-, y el atado se contagia: si otra funcion
  // enlaza a su vez uno de esos servicios con un tercero, los tres acaban en
  // la misma preparacion. Es el algoritmo de componentes conexos (union-find)
  // sobre los ids de servicio que etiquetan una misma tarifa
  // (contratos_funciones_servicios), no sobre los grupos calculados: desde
  // que buildBillingGeneration separa el calculo por servicio, una misma
  // tarifa nunca junta sus servicios en un solo grupo, así que el atado hay
  // que leerlo de la tarifa directamente para que el guardado los siga
  // juntando.
  function buildServiceClusters() {
    const parent = new Map();
    const find = (x) => {
      if (!parent.has(x)) parent.set(x, x);
      let root = x;
      while (parent.get(root) !== root) root = parent.get(root);
      let cur = x;
      while (parent.get(cur) !== root) {
        const next = parent.get(cur);
        parent.set(cur, root);
        cur = next;
      }
      return root;
    };
    const union = (a, b) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };
    const idsByRate = new Map();
    state.functionServices.forEach((row) => {
      if (!idsByRate.has(row.contrato_funcion_id)) idsByRate.set(row.contrato_funcion_id, []);
      idsByRate.get(row.contrato_funcion_id).push(row.servicio_id);
    });
    idsByRate.forEach((ids) => {
      ids.forEach((id) => find(id));
      for (let i = 1; i < ids.length; i += 1) {
        union(ids[0], ids[i]);
      }
    });
    const members = new Map();
    state.functionServices.forEach((row) => {
      const root = find(row.servicio_id);
      if (!members.has(root)) members.set(root, new Set());
      members.get(root).add(row.servicio_id);
    });
    return {
      membersOf: (id) => Array.from(members.get(find(id)) || [id]).sort((a, b) => a - b),
    };
  }

  // "Contrato y función": a diferencia de "servicio"/"función separada" (que
  // solo juntan servicios atados por una misma tarifa), esta junta sin mirar
  // la tarifa -todo lo que haya en los datos (servicio_facturable_id de cada
  // registro) para ese contrato+función va a la misma preparación-. Util
  // cuando la función se reparte entre servicios que no comparten tarifa.
  function clusterGenerationGroups(groups, agrupacion) {
    const serviceClusters = agrupacion === "servicio" || agrupacion === "funcion" ? buildServiceClusters() : null;
    const clusters = new Map();
    groups.forEach((group) => {
      const groupServiceIds = agrupacion === "servicio" || agrupacion === "funcion"
        ? serviceClusters.membersOf(group.servicioIds[0])
        : [];
      const key = agrupacion === "contrato"
        ? `${group.contratoId}|contrato`
        : agrupacion === "servicio"
          ? `${group.contratoId}|servicio:${groupServiceIds.join(",")}`
          : agrupacion === "contrato_funcion"
            ? `${group.contratoId}|contrato_funcion:${group.funcionId}`
            : `${group.contratoId}|funcion:${group.funcionId}|servicio:${groupServiceIds.join(",")}`;
      if (!clusters.has(key)) {
        clusters.set(key, {
          contratoId: group.contratoId,
          contrato: group.contrato,
          funcion: group.funcion,
          servicioIdSet: new Set(),
          funcionId: agrupacion === "funcion" || agrupacion === "contrato_funcion" ? group.funcionId : null,
          baseImponible: 0,
          iva: 0,
          total: 0,
          diurnal: 0,
          nocturnal: 0,
          lines: [],
          // Solo para la vista previa (previewGenerationClustering): que
          // filas calculadas (servicio+función) caen en este mismo grupo al
          // guardar, para poder explicar el porqué de cada agrupación.
          contributingGroups: [],
        });
      }
      const cluster = clusters.get(key);
      (agrupacion === "contrato_funcion" ? group.servicioIds : groupServiceIds).forEach((id) => cluster.servicioIdSet.add(id));
      cluster.baseImponible += group.subtotal;
      cluster.iva += group.iva;
      cluster.total += group.totalWithIva;
      cluster.diurnal += group.diurnal;
      cluster.nocturnal += group.nocturnal;
      cluster.lines.push(...group.lines);
      cluster.contributingGroups.push({
        servicio: serviceNames(group.servicioIds),
        funcion: group.funcion,
        total: group.total,
        diurnal: group.diurnal,
        nocturnal: group.nocturnal,
        subtotal: group.subtotal,
      });
    });
    return Array.from(clusters.values()).map((cluster) => {
      const servicioIds = Array.from(cluster.servicioIdSet).sort((a, b) => a - b);
      const label = agrupacion === "contrato"
        ? `${cluster.contrato} · contrato completo`
        : agrupacion === "servicio"
          ? `${cluster.contrato} · ${serviceNames(servicioIds)}`
          : agrupacion === "contrato_funcion"
            ? `${cluster.contrato} · ${cluster.funcion}`
            : `${cluster.contrato} · ${serviceNames(servicioIds)} · ${cluster.funcion}`;
      return { ...cluster, servicioIds, label };
    });
  }

  // Muestra qué preparaciones se crearían con la agrupación elegida sin
  // guardar nada -para poder comparar "Servicio", "función separada",
  // "Contrato y función" y "Contrato completo" antes de decidir cuál usar-.
  // Reutiliza el mismo diálogo que la vista previa de una preparación ya
  // guardada (previewPreparation), con contenido distinto: aquí sale de
  // clusterGenerationGroups sobre el cálculo en pantalla, no de líneas
  // congeladas en base de datos.
  function previewGenerationClustering() {
    const generation = state.generation;
    const selectedGroups = getSelectedGenerationGroups();
    if (!generation || !selectedGroups.length || !el.preparationPreviewDialog) return;
    const agrupacion = el.generationGroupBy.value;
    const agrupacionLabel = el.generationGroupBy.selectedOptions[0]?.textContent || agrupacion;
    const clusters = clusterGenerationGroups(selectedGroups, agrupacion);
    const issues = selectedGroups.map((group) => resolveGroupServiceIssue(group, agrupacion)).filter(Boolean);
    el.preparationPreviewBody.innerHTML = `
      <p class="muted-text">
        Así quedarían las preparaciones si guardas ahora con «${escapeHtml(agrupacionLabel)}»:
        ${clusters.length} ${clusters.length === 1 ? "preparación" : "preparaciones"}. Esto no guarda nada,
        solo lo enseña.
      </p>
      ${issues.length ? `<ul class="facturacion-generation-alerts">${Array.from(new Set(issues)).map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>` : ""}
      ${clusters.map((cluster) => `
        <h4>${escapeHtml(cluster.label)}</h4>
        <div class="facturacion-generation-summary">
          <article><span>Registros</span><strong>${cluster.lines.length}</strong></article>
          <article><span>Horas</span><strong>${percent.format(cluster.diurnal + cluster.nocturnal)} h</strong></article>
          <article><span>Base imponible</span><strong>${formatMoney(cluster.baseImponible)}</strong></article>
          <article><span>Total con IVA</span><strong>${formatMoney(cluster.total)}</strong></article>
        </div>
        <div class="table-scroll">
          <table class="facturacion-table">
            <thead><tr><th>Servicio</th><th>Función</th><th>Horas</th><th>Base</th></tr></thead>
            <tbody>
              ${cluster.contributingGroups.map((item) => `
                <tr>
                  <td>${escapeHtml(item.servicio)}</td>
                  <td>${escapeHtml(item.funcion)}</td>
                  <td class="numeric">${percent.format(item.total)}</td>
                  <td class="numeric">${formatMoney(item.subtotal)}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      `).join("")}
    `;
    el.preparationPreviewDialog.showModal();
  }

  // Desglose por instalación y semana de los servicios marcados en el
  // cálculo, sin generar PDF. Vivía dentro de "Descargar PDF"; se saca a un
  // botón aparte porque alargaba el PDF con un detalle que no siempre hace
  // falta imprimir.
  function previewGenerationWeekly() {
    const selectedGroups = getSelectedGenerationGroups();
    if (!selectedGroups.length || !el.preparationPreviewDialog) return;
    el.preparationPreviewBody.innerHTML = `
      <p class="muted-text">Desglose por instalación y semana de los servicios marcados. Esto no guarda nada.</p>
      ${selectedGroups.map((group) => `
        <h4>${escapeHtml(group.contrato)} · ${escapeHtml(serviceNames(group.servicioIds))} · ${escapeHtml(group.funcion)}</h4>
        <div class="table-scroll">
          <table class="facturacion-table">
            <thead><tr><th>Instalación</th><th>Semana</th><th>Total</th><th>Diurnas</th><th>Nocturnas</th></tr></thead>
            <tbody>
              ${group.weeks.map((item) => `<tr><td>${escapeHtml(item.instalacion)}</td><td>${item.week}</td><td class="numeric">${percent.format(item.total)}</td><td class="numeric">${percent.format(item.diurnal)}</td><td class="numeric">${percent.format(item.nocturnal)}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      `).join("")}
    `;
    el.preparationPreviewDialog.showModal();
  }

  async function saveBillingGeneration() {
    const generation = state.generation;
    if (!generation?.groups.length) return;
    const selectedGroups = getSelectedGenerationGroups();
    if (!selectedGroups.length) {
      setStatus("No has dejado ningún servicio marcado para guardar.", "error");
      return;
    }
    const agrupacion = el.generationGroupBy.value;
    const issue = selectedGroups.map((group) => resolveGroupServiceIssue(group, agrupacion)).find(Boolean);
    if (issue) {
      setStatus(issue, "error");
      return;
    }
    // Guardar con un precio a ciegas (sin tarifa, con varias sin activar, o
    // incompleta) o con el IVA supuesto al 21% crearía un importe real que no
    // se corresponde con la configuración: se bloquea hasta corregirlo, no
    // solo se avisa.
    const pricingIssue = selectedGroups.find((group) => group.pricingIssue)?.pricingIssue;
    if (pricingIssue) {
      setStatus(`${pricingIssue} No se puede guardar la preparación hasta corregirlo.`, "error");
      return;
    }
    const ivaIssueGroup = selectedGroups.find((group) => group.ivaFallback);
    if (ivaIssueGroup) {
      setStatus(`${ivaIssueGroup.contrato}: configura el IVA del contrato antes de guardar la preparación (pestaña Contratos).`, "error");
      return;
    }
    const observacion = el.generationObservacion?.value.trim() || null;
    const clusters = clusterGenerationGroups(selectedGroups, agrupacion);
    el.generationSave.disabled = true;
    setStatus("Guardando preparación…");
    const supabase = await getClient();
    let saved = 0;
    let skipped = 0;
    try {
      for (const cluster of clusters) {
        const payload = {
          p_contrato_id: cluster.contratoId,
          p_fecha_desde: generation.from,
          p_fecha_hasta: generation.to,
          p_servicio_ids: cluster.servicioIds,
          p_funcion_id: cluster.funcionId,
          p_lineas: cluster.lines,
          p_base_imponible: cluster.baseImponible,
          p_iva: cluster.iva,
          p_total: cluster.total,
          p_horas_diurnas: cluster.diurnal,
          p_horas_nocturnas: cluster.nocturnal,
          p_observacion: observacion,
        };
        let result = await supabase.rpc("guardar_preparacion_facturacion", payload);
        if (result.error && /Ya hay una preparación vigente/.test(result.error.message)) {
          const wantsRegenerate = window.confirm(
            `${cluster.label}\n\n${result.error.message}\n\n¿Regenerar? Se anulará la anterior (queda como histórico) y se guarda esta como nueva versión.`
          );
          if (!wantsRegenerate) {
            skipped += 1;
            continue;
          }
          const motivo = window.prompt("Motivo de la regeneración (opcional):", "") || null;
          result = await supabase.rpc("guardar_preparacion_facturacion", { ...payload, p_reemplazar: true, p_observacion: motivo || observacion });
        }
        if (result.error) throw new Error(`${cluster.label}: ${result.error.message}`);
        saved += 1;
      }
      await reloadPreparations();
      if (saved && el.generationObservacion) el.generationObservacion.value = "";
      const savedText = `${saved} ${saved === 1 ? "preparación guardada" : "preparaciones guardadas"}`;
      const skippedText = skipped ? ` (${skipped} sin guardar, ya existían y no se regeneraron)` : "";
      setStatus(`${savedText}${skippedText}.`, saved ? "success" : "");
    } catch (error) {
      setStatus(`No se pudo guardar la preparación: ${error.message}`, "error");
    } finally {
      el.generationSave.disabled = !getSelectedGenerationGroups().length;
    }
  }

  function preparationGroupingLabel(row) {
    if (row.funcion_id) {
      const funcion = state.functions.find((item) => String(item.id) === String(row.funcion_id));
      return `${serviceNames(row.servicio_ids)} · ${funcion?.funcion || `Función ${row.funcion_id}`}`;
    }
    if (row.servicio_ids?.length) return serviceNames(row.servicio_ids);
    return "Contrato completo";
  }

  function preparationsForSelection() {
    return state.preparations
      .filter((row) => !state.contractId || String(row.contrato_id) === String(state.contractId))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  }

  function renderPreparations() {
    if (!el.preparationsBody) return;
    const contractNames = new Map(state.contracts.map((row) => [String(row.id), row.contrato]));
    const invoiceNames = new Map(state.invoices.map((row) => [String(row.id), [row.serie, row.n_documento].filter(Boolean).join("/") || `#${row.id}`]));
    const rows = preparationsForSelection();
    // La seleccion no sobrevive a filas que ya no estan visibles (cambio de
    // contrato, recarga...): evita marcar "de fondo" preparaciones que el
    // usuario ya no ve.
    const visibleIds = new Set(rows.map((row) => String(row.id)));
    Array.from(state.preparationSelectedIds).forEach((id) => {
      if (!visibleIds.has(id)) state.preparationSelectedIds.delete(id);
    });
    el.preparationsBody.innerHTML = rows.length
      ? rows.map((row) => `
          <tr>
            <td><input type="checkbox" class="facturacion-preparation-check" data-prep-id="${row.id}" ${state.preparationSelectedIds.has(String(row.id)) ? "checked" : ""} aria-label="Marcar preparación del ${formatDate(row.fecha_desde)} al ${formatDate(row.fecha_hasta)}" /></td>
            <td>${formatDate(row.fecha_desde)} – ${formatDate(row.fecha_hasta)}</td>
            <td>${escapeHtml(contractNames.get(String(row.contrato_id)) || `Contrato ${row.contrato_id}`)}</td>
            <td>${escapeHtml(preparationGroupingLabel(row))}</td>
            <td><span class="${row.estado === "vigente" ? "" : "muted-text"}">${escapeHtml(row.estado)}</span>${row.estado !== "vigente" && row.anulada_motivo ? ` · ${escapeHtml(row.anulada_motivo)}` : ""}</td>
            <td class="numeric">${formatMoney(row.total)}</td>
            <td>${row.contrato_facturacion_id ? escapeHtml(invoiceNames.get(String(row.contrato_facturacion_id)) || `#${row.contrato_facturacion_id}`) : "—"}</td>
            <td>${formatDate(row.created_at)}</td>
            <td class="facturacion-preparation-actions">
              <button type="button" class="row-action" data-preview-preparacion="${row.id}">Vista previa</button>
              ${row.estado === "vigente" && !row.contrato_facturacion_id ? `<button type="button" class="row-action" data-crear-factura="${row.id}">Crear factura</button>` : ""}
              ${row.estado === "vigente" ? `<button type="button" class="danger-button row-action" data-anular-preparacion="${row.id}">Anular</button>` : ""}
              ${row.contrato_facturacion_id ? "" : `<button type="button" class="danger-button row-action" data-eliminar-preparacion="${row.id}">Eliminar</button>`}
            </td>
          </tr>`).join("")
      : '<tr><td colspan="9" class="empty-state">No hay preparaciones guardadas todavía.</td></tr>';
    if (el.preparationsCheckAll) {
      el.preparationsCheckAll.checked = rows.length > 0 && rows.every((row) => state.preparationSelectedIds.has(String(row.id)));
      el.preparationsCheckAll.disabled = !rows.length;
    }
    if (el.preparationsPdf) el.preparationsPdf.disabled = !state.preparationSelectedIds.size;
  }

  async function anulatePreparation(id) {
    const motivo = window.prompt("Motivo de la anulación:", "");
    if (motivo === null) return;
    const supabase = await getClient();
    const result = await supabase.rpc("anular_preparacion_facturacion", { p_id: Number(id), p_motivo: motivo || null });
    if (result.error) {
      setStatus(`No se pudo anular la preparación: ${result.error.message}`, "error");
      return;
    }
    await reloadPreparations();
    setStatus("Preparación anulada.", "success");
  }

  // Borrado real (no deja rastro), a diferencia de anular: pensado para
  // limpiar preparaciones de prueba o duplicadas. El propio RPC bloquea el
  // borrado si la preparación ya está vinculada a una factura real.
  async function deletePreparation(id) {
    if (!window.confirm("¿Eliminar esta preparación? Esta acción no se puede deshacer y no deja rastro (a diferencia de anular).")) return;
    const supabase = await getClient();
    const result = await supabase.rpc("eliminar_preparacion_facturacion", { p_id: Number(id) });
    if (result.error) {
      setStatus(`No se pudo eliminar la preparación: ${result.error.message}`, "error");
      return;
    }
    await reloadPreparations();
    setStatus("Preparación eliminada.", "success");
  }

  // Busca un presupuesto del mismo contrato cuyo periodo solape con el de la
  // preparación, como sugerencia inicial; el usuario puede cambiarlo en el
  // dialogo de la factura igualmente.
  function suggestBudgetForPreparation(prep) {
    return state.budgets.find((budget) =>
      String(budget.contrato_id) === String(prep.contrato_id)
      && budget.fecha_inicio && budget.fecha_fin
      && String(budget.fecha_inicio) <= prep.fecha_hasta
      && String(budget.fecha_fin) >= prep.fecha_desde
    ) || null;
  }

  async function createInvoiceFromPreparation(id) {
    const prep = state.preparations.find((row) => String(row.id) === String(id));
    if (!prep) return;
    if (!window.confirm(
      `Se creará una factura real para ${preparationGroupingLabel(prep)} `
      + `(${formatDate(prep.fecha_desde)} – ${formatDate(prep.fecha_hasta)}) por ${formatMoney(prep.total)}. `
      + `Después podrás completar serie, número y cliente. ¿Continuar?`
    )) {
      return;
    }
    setStatus("Creando factura…");
    const supabase = await getClient();
    const budget = suggestBudgetForPreparation(prep);
    const result = await supabase.rpc("crear_factura_desde_preparacion", {
      p_preparacion_id: Number(id),
      p_presupuesto_id: budget ? budget.id : null,
    });
    if (result.error) {
      setStatus(`No se pudo crear la factura: ${result.error.message}`, "error");
      return;
    }
    const invoiceId = result.data;
    state.contractId = String(prep.contrato_id);
    await Promise.all([reloadInvoices(), reloadPreparations()]);
    const invoiceRow = state.invoices.find((row) => String(row.id) === String(invoiceId));
    switchView("facturas");
    if (invoiceRow) fillInvoiceForm(invoiceRow);
    setStatus("Factura creada. Completa serie, número y cliente.", "success");
  }

  const CONTROL_MONTH_STATES = ["Pendiente", "Redirigido", "En preparación", "Facturado", "Excluido"];
  const CONTROL_STATE_CLASS = {
    "Pendiente": "record-billing-badge-pendiente",
    "Redirigido": "record-billing-badge-redirigido",
    "En preparación": "record-billing-badge-en-preparacion",
    "Facturado": "record-billing-badge-facturado",
    "Excluido": "record-billing-badge-excluido",
  };

  function formatControlMonth(value) {
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  }

  async function loadControl() {
    if (!el.controlMonthsBody) return;
    if (!state.contractId) {
      el.controlKpis.innerHTML = "";
      el.controlMonthsBody.innerHTML = '<tr><td colspan="6" class="empty-state">Selecciona un contrato para ver su seguimiento.</td></tr>';
      el.controlInvoicesBody.innerHTML = '<tr><td colspan="4" class="empty-state">Selecciona un contrato para ver su seguimiento.</td></tr>';
      return;
    }
    el.controlMonthsBody.innerHTML = '<tr><td colspan="6" class="empty-state">Cargando…</td></tr>';
    const supabase = await getClient();
    const contratoId = Number(state.contractId);
    const desde = el.controlFrom.value || null;
    const hasta = el.controlTo.value || null;
    const [monthly, byInvoice] = await Promise.all([
      supabase.rpc("get_facturacion_seguimiento_mensual", { p_contrato_id: contratoId, p_desde: desde, p_hasta: hasta }),
      supabase.rpc("get_facturacion_horas_por_factura", { p_contrato_id: contratoId, p_desde: desde, p_hasta: hasta }),
    ]);
    if (monthly.error || byInvoice.error) {
      const message = (monthly.error || byInvoice.error).message;
      setStatus(`No se pudo cargar el control de facturación: ${message}`, "error");
      el.controlMonthsBody.innerHTML = `<tr><td colspan="5" class="empty-state">${escapeHtml(message)}</td></tr>`;
      return;
    }
    renderControl(monthly.data || [], byInvoice.data || []);
  }

  function renderControl(monthly, byInvoice) {
    const totals = { "Pendiente": 0, "Redirigido": 0, "En preparación": 0, "Facturado": 0, "Excluido": 0 };
    const byMonth = new Map();
    monthly.forEach((row) => {
      totals[row.estado_facturacion] = (totals[row.estado_facturacion] || 0) + numeric(row.horas);
      if (!byMonth.has(row.mes)) byMonth.set(row.mes, {});
      byMonth.get(row.mes)[row.estado_facturacion] = numeric(row.horas);
    });

    el.controlKpis.innerHTML = CONTROL_MONTH_STATES.map((estado) => `
      <article><span class="record-billing-badge ${CONTROL_STATE_CLASS[estado]}">${escapeHtml(estado)}</span><strong>${percent.format(totals[estado] || 0)} h</strong></article>
    `).join("");

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const months = Array.from(byMonth.keys()).sort();
    el.controlMonthsBody.innerHTML = months.length
      ? months.map((mes) => {
          const hours = byMonth.get(mes);
          const isPastMonth = new Date(`${mes}T00:00:00`) < currentMonthStart;
          const pendingGap = isPastMonth && numeric(hours["Pendiente"]) > 0;
          return `
            <tr class="${pendingGap ? "facturacion-control-gap" : ""}">
              <td>${escapeHtml(formatControlMonth(mes))}</td>
              <td class="numeric">${pendingGap ? "⚠ " : ""}${percent.format(numeric(hours["Pendiente"]))} h</td>
              <td class="numeric">${percent.format(numeric(hours["Redirigido"]))} h</td>
              <td class="numeric">${percent.format(numeric(hours["En preparación"]))} h</td>
              <td class="numeric">${percent.format(numeric(hours["Facturado"]))} h</td>
              <td class="numeric">${percent.format(numeric(hours["Excluido"]))} h</td>
            </tr>`;
        }).join("")
      : '<tr><td colspan="6" class="empty-state">No hay registros en el periodo.</td></tr>';

    const invoiceNames = new Map(state.invoices.map((row) => [String(row.id), row]));
    el.controlInvoicesBody.innerHTML = byInvoice.length
      ? byInvoice.map((row) => {
          const invoice = invoiceNames.get(String(row.contrato_facturacion_id));
          const label = invoice ? ([invoice.serie, invoice.n_documento].filter(Boolean).join("/") || `#${row.contrato_facturacion_id}`) : `#${row.contrato_facturacion_id}`;
          return `
            <tr>
              <td>${escapeHtml(label)}</td>
              <td>${invoice ? formatDate(invoice.fecha) : "—"}</td>
              <td class="numeric">${row.registros}</td>
              <td class="numeric">${percent.format(numeric(row.horas))} h</td>
            </tr>`;
        }).join("")
      : '<tr><td colspan="4" class="empty-state">No hay horas facturadas en el periodo.</td></tr>';
  }

  function viewPendingInRecords() {
    if (!state.contractId) return;
    const contratoSelect = document.querySelector("#records-filter-contrato");
    const estadoSelect = document.querySelector("#records-filter-estado-facturacion");
    if (!contratoSelect || !estadoSelect || typeof window.switchPrivateTab !== "function" || typeof window.loadRecords !== "function") {
      setStatus("No se pudo abrir Registros filtrado; ábrelo manualmente y filtra por este contrato.", "error");
      return;
    }
    window.switchPrivateTab("registros");
    Array.from(contratoSelect.options).forEach((option) => {
      option.selected = option.value === String(state.contractId);
    });
    estadoSelect.value = "Pendiente";
    // No se dispara "change" en el select: el propio formulario ya escucha ese
    // evento y lanzaría una segunda carga en paralelo con la de aquí abajo.
    // La UI del desplegable de checkboxes se sincroniza aparte porque es un
    // overlay sobre el <select> real (ver getMultiCheckDropdown en app.js).
    if (typeof window.syncMultiCheckDropdown === "function") {
      window.syncMultiCheckDropdown(contratoSelect, contratoSelect.dataset.emptyLabel || "Todos los contratos");
    }
    void window.loadRecords({ force: true });
  }

  function pdfNumber(value) {
    return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(numeric(value));
  }

  async function exportBillingGenerationPdf() {
    const generation = state.generation;
    const selectedGroups = getSelectedGenerationGroups();
    if (!selectedGroups.length) return;
    el.generationPdf.disabled = true;
    setStatus("Generando PDF…");
    try {
      const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageHeight = 297;
      const margin = 14;
      let y = margin;
      let firstPage = true;

      const pageBreak = (needed = 12) => {
        if (y + needed <= pageHeight - 16) return;
        doc.addPage();
        y = margin;
      };
      const row = (values, widths, bold = false) => {
        pageBreak(7);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(8);
        let x = margin;
        values.forEach((value, index) => {
          doc.rect(x, y, widths[index], 6);
          doc.text(String(value ?? ""), x + 1.5, y + 4.1, { maxWidth: widths[index] - 3 });
          x += widths[index];
        });
        y += 6;
      };

      for (const group of selectedGroups) {
        if (!firstPage) {
          doc.addPage();
          y = margin;
        }
        firstPage = false;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`Fecha inicial   ${formatDate(generation.from)}     Fecha fin   ${formatDate(generation.to)}`, margin, y);
        y += 7;
        doc.text(`Contrato        ${group.contrato}`, margin, y);
        y += 7;
        doc.text(`Expediente      ${group.contract?.expediente || "—"}`, margin, y);
        y += 7;
        doc.text(`Vigencia        ${formatDate(group.contract?.fecha_inicio)} – ${formatDate(group.contract?.fecha_fin)}`, margin, y);
        y += 8;
        doc.setFontSize(15);
        doc.text(new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date(`${generation.from}T12:00:00`)), margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.text(group.funcion, margin, y);
        y += 3;
        row(["Instalación", "Total", "Diurnas", "Nocturnas"], [100, 28, 28, 28], true);
        group.installations.forEach((item) =>
          row([item.instalacion, pdfNumber(item.total), pdfNumber(item.diurnal), pdfNumber(item.nocturnal)], [100, 28, 28, 28]));
        row(["TOTAL", pdfNumber(group.total), pdfNumber(group.diurnal), pdfNumber(group.nocturnal)], [100, 28, 28, 28], true);
        y += 3;
        row(["PRECIO", group.type, formatMoney(group.priceDay), formatMoney(group.priceNight)], [100, 28, 28, 28], true);
        row(["Base imponible", formatMoney(group.subtotal), `IVA ${percent.format(group.ivaRate * 100)} %`, formatMoney(group.iva)], [100, 28, 28, 28], true);
        row(["Total IVA incluido", formatMoney(group.totalWithIva), "", ""], [100, 28, 28, 28], true);
      }
      doc.save(`preparacion-facturas-${generation.from}-${generation.to}.pdf`);
      setStatus("PDF de preparación generado.", "success");
    } catch (error) {
      setStatus(`No se pudo generar el PDF: ${error.message}`, "error");
    } finally {
      el.generationPdf.disabled = false;
    }
  }

  // PDF detallado de preparaciones ya guardadas (las marcadas con el tick):
  // un archivo por preparación, reconstruido desde sus líneas congeladas
  // (contratos_facturacion_lineas), no desde el cálculo en pantalla -que
  // puede haber cambiado desde que se guardó-. La cabecera (base/IVA/total)
  // es siempre la que se guardó entonces, autoritativa; el desglose por
  // instalación/semana se reconstruye agrupando esas líneas por función.
  // Trae las líneas congeladas de una o varias preparaciones, con fecha
  // (para la semana ISO), instalación y función embebidas via PostgREST, y
  // las devuelve indexadas por preparacion_id -fuente única para el PDF y
  // para la vista previa, que deben mostrar exactamente lo mismo-.
  async function fetchPreparationLines(ids) {
    const supabase = await getClient();
    const pageSize = 1000;
    const data = [];
    // Sin paginar, una preparación de un contrato grande (miles de líneas)
    // ya podía chocar sola contra el límite de 1.000 filas de PostgREST;
    // marcando varias a la vez para el PDF combinado el corte llegaba mucho
    // antes -las últimas preparaciones del lote se quedaban sin líneas, y su
    // función/instalación/semana desaparecía del PDF sin ningún error-.
    for (let offset = 0; ; offset += pageSize) {
      const { data: page, error } = await supabase
        .from("contratos_facturacion_lineas")
        .select("preparacion_id,instalacion_id,funcion_id,horas_diurnas,horas_nocturnas,precio_01,precio_02,tipo_precio,importe,registros(fecha),instalaciones(instalacion),funciones(funcion)")
        .in("preparacion_id", ids)
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw new Error(error.message);
      data.push(...(page || []));
      if ((page || []).length < pageSize) break;
    }
    const byPrep = new Map();
    data.forEach((line) => {
      const key = String(line.preparacion_id);
      if (!byPrep.has(key)) byPrep.set(key, []);
      byPrep.get(key).push(line);
    });
    return byPrep;
  }

  // Agrupa las líneas de una preparación por función y, dentro de cada una,
  // por instalación y por instalación+semana. Misma forma para el PDF y la
  // vista previa. El precio/tipo de cada función sale de sus propias líneas
  // (congelado al guardar, igual para todas dentro de la misma función); el
  // subtotal se sale de sumar los importes de línea con tarifa por hora, o
  // del precio fijo tal cual con tarifa por mes/global (esas líneas no
  // llevan importe propio, ver guardar_preparacion_facturacion).
  function groupPreparationLines(lines) {
    const byFuncion = new Map();
    (lines || []).forEach((line) => {
      const key = String(line.funcion_id ?? "");
      if (!byFuncion.has(key)) {
        byFuncion.set(key, {
          funcion: line.funciones?.funcion || "Sin función",
          installations: new Map(),
          weeks: new Map(),
          total: 0,
          diurnal: 0,
          nocturnal: 0,
          tipoPrecio: line.tipo_precio || null,
          precioDia: line.precio_01 != null ? numeric(line.precio_01) : null,
          precioNoche: line.precio_02 != null ? numeric(line.precio_02) : null,
          importeSum: 0,
        });
      }
      const bucket = byFuncion.get(key);
      const diurnal = numeric(line.horas_diurnas);
      const nocturnal = numeric(line.horas_nocturnas);
      bucket.total += diurnal + nocturnal;
      bucket.diurnal += diurnal;
      bucket.nocturnal += nocturnal;
      bucket.importeSum += numeric(line.importe);
      const instKey = String(line.instalacion_id ?? "sin-instalacion");
      const instName = line.instalaciones?.instalacion || "Sin instalación";
      if (!bucket.installations.has(instKey)) bucket.installations.set(instKey, { instalacion: instName, total: 0, diurnal: 0, nocturnal: 0 });
      const inst = bucket.installations.get(instKey);
      inst.total += diurnal + nocturnal;
      inst.diurnal += diurnal;
      inst.nocturnal += nocturnal;
      const week = line.registros?.fecha ? getIsoWeek(line.registros.fecha) : "?";
      const weekKey = `${instKey}|${week}`;
      if (!bucket.weeks.has(weekKey)) bucket.weeks.set(weekKey, { instalacion: instName, week, total: 0, diurnal: 0, nocturnal: 0 });
      const weekBucket = bucket.weeks.get(weekKey);
      weekBucket.total += diurnal + nocturnal;
      weekBucket.diurnal += diurnal;
      weekBucket.nocturnal += nocturnal;
    });
    return Array.from(byFuncion.values())
      .sort((a, b) => a.funcion.localeCompare(b.funcion, "es"))
      .map((bucket) => {
        const fixed = bucket.tipoPrecio === "mes" || bucket.tipoPrecio === "global";
        return {
          ...bucket,
          subtotal: fixed ? (bucket.precioDia ?? 0) : bucket.importeSum,
          installations: Array.from(bucket.installations.values()).sort((a, b) => a.instalacion.localeCompare(b.instalacion, "es")),
          weeks: Array.from(bucket.weeks.values()).sort((a, b) => a.instalacion.localeCompare(b.instalacion, "es") || a.week - b.week),
        };
      });
  }

  async function exportSelectedPreparationsPdf() {
    const ids = Array.from(state.preparationSelectedIds);
    if (!ids.length) return;
    el.preparationsPdf.disabled = true;
    setStatus("Generando PDF de las preparaciones marcadas…");
    try {
      const linesByPrep = await fetchPreparationLines(ids);
      const contracts = new Map(state.contracts.map((item) => [String(item.id), item]));
      const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
      const preparations = state.preparations
        .filter((item) => state.preparationSelectedIds.has(String(item.id)))
        .sort((a, b) => String(a.fecha_desde).localeCompare(String(b.fecha_desde)) || a.id - b.id);
      const pageHeight = 297;
      const margin = 14;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let firstPrep = true;

      for (const prep of preparations) {
        if (!firstPrep) doc.addPage();
        firstPrep = false;
        let y = margin;
        const pageBreak = (needed = 12) => {
          if (y + needed <= pageHeight - 16) return;
          doc.addPage();
          y = margin;
        };
        const row = (values, widths, bold = false) => {
          pageBreak(7);
          doc.setFont("helvetica", bold ? "bold" : "normal");
          doc.setFontSize(8);
          let x = margin;
          values.forEach((value, index) => {
            doc.rect(x, y, widths[index], 6);
            doc.text(String(value ?? ""), x + 1.5, y + 4.1, { maxWidth: widths[index] - 3 });
            x += widths[index];
          });
          y += 6;
        };

        const contract = contracts.get(String(prep.contrato_id));
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`Fecha inicial   ${formatDate(prep.fecha_desde)}     Fecha fin   ${formatDate(prep.fecha_hasta)}`, margin, y);
        y += 7;
        doc.text(`Contrato        ${contract?.contrato || `Contrato ${prep.contrato_id}`}`, margin, y);
        y += 7;
        doc.text(`Expediente      ${contract?.expediente || "—"}`, margin, y);
        y += 7;
        doc.text(`Vigencia        ${formatDate(contract?.fecha_inicio)} – ${formatDate(contract?.fecha_fin)}`, margin, y);
        y += 7;
        doc.text(`Agrupación      ${preparationGroupingLabel(prep)}`, margin, y);
        y += 7;
        doc.text(`Estado          ${prep.estado}${prep.estado !== "vigente" && prep.anulada_motivo ? ` · ${prep.anulada_motivo}` : ""}`, margin, y);
        y += 7;
        if (prep.observacion) {
          doc.text(`Observación     ${prep.observacion}`, margin, y, { maxWidth: 180 });
          y += 7;
        }
        y += 2;
        row(["Base imponible", formatMoney(prep.base_imponible), "IVA", formatMoney(prep.iva)], [50, 45, 25, 62], true);
        row(["Total con IVA", formatMoney(prep.total), "", ""], [50, 45, 25, 62], true);
        y += 5;

        groupPreparationLines(linesByPrep.get(String(prep.id))).forEach((bucket) => {
          pageBreak(20);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(bucket.funcion, margin, y);
          y += 3;
          row(["Instalación", "Total", "Diurnas", "Nocturnas"], [100, 28, 28, 28], true);
          bucket.installations.forEach((item) => row([item.instalacion, pdfNumber(item.total), pdfNumber(item.diurnal), pdfNumber(item.nocturnal)], [100, 28, 28, 28]));
          row(["TOTAL", pdfNumber(bucket.total), pdfNumber(bucket.diurnal), pdfNumber(bucket.nocturnal)], [100, 28, 28, 28], true);
          y += 3;
          row(["PRECIO", bucket.tipoPrecio || "—", formatMoney(bucket.precioDia), formatMoney(bucket.precioNoche ?? bucket.precioDia)], [100, 28, 28, 28], true);
          row([`Subtotal ${bucket.funcion}`, pdfNumber(bucket.total), "", formatMoney(bucket.subtotal)], [100, 28, 28, 28], true);
          y += 5;
        });
      }
      const todayIso = new Date().toISOString().slice(0, 10);
      doc.save(preparations.length === 1
        ? `preparacion-${preparations[0].id}-${preparations[0].fecha_desde}-${preparations[0].fecha_hasta}.pdf`
        : `preparaciones-facturas-${todayIso}.pdf`);
      setStatus(`PDF generado con ${preparations.length} ${preparations.length === 1 ? "preparación" : "preparaciones"}.`, "success");
    } catch (error) {
      setStatus(`No se pudo generar el PDF: ${error.message}`, "error");
    } finally {
      el.preparationsPdf.disabled = !state.preparationSelectedIds.size;
    }
  }

  function fillBudgetForm(row = {}) {
    const form = el.budgetForm;
    form.reset();
    form.elements.id.value = row.id || "";
    form.elements.periodo.value = row.periodo || "";
    form.elements.fecha_inicio.value = String(row.fecha_inicio || "").slice(0, 10);
    form.elements.fecha_fin.value = String(row.fecha_fin || "").slice(0, 10);
    form.elements.presupuesto.value = row.presupuesto ?? "";
    form.elements.porcentaje_iva.value = row.porcentaje_iva == null ? (numeric(selectedContract()?.iva) * 100 || 21) : numeric(row.porcentaje_iva) * 100;
    form.elements.observacion.value = row.observacion || "";
    el.deleteBudget.classList.toggle("hidden", !row.id);
    el.budgetDialog.showModal();
  }

  // Vista previa en pantalla de una preparación ya guardada: mismo contenido
  // que el PDF (cabecera con los importes congelados + desglose por función,
  // instalación y semana), pero sin generar el archivo -para mirarlo rápido
  // antes de descargar o antes de decidir si anular/eliminar-.
  async function previewPreparation(id) {
    const prep = state.preparations.find((item) => String(item.id) === String(id));
    if (!prep || !el.preparationPreviewDialog) return;
    el.preparationPreviewBody.innerHTML = '<p class="muted-text">Cargando…</p>';
    el.preparationPreviewDialog.showModal();
    try {
      const linesByPrep = await fetchPreparationLines([id]);
      const buckets = groupPreparationLines(linesByPrep.get(String(id)));
      const contract = state.contracts.find((item) => String(item.id) === String(prep.contrato_id));
      el.preparationPreviewBody.innerHTML = `
        <div class="facturacion-generation-summary">
          <article><span>Periodo</span><strong>${formatDate(prep.fecha_desde)} – ${formatDate(prep.fecha_hasta)}</strong></article>
          <article><span>Contrato</span><strong>${escapeHtml(contract?.contrato || `Contrato ${prep.contrato_id}`)}</strong></article>
          <article><span>Expediente</span><strong>${escapeHtml(contract?.expediente || "—")}</strong></article>
          <article><span>Vigencia</span><strong>${formatDate(contract?.fecha_inicio)} – ${formatDate(contract?.fecha_fin)}</strong></article>
          <article><span>Agrupación</span><strong>${escapeHtml(preparationGroupingLabel(prep))}</strong></article>
          <article><span>Estado</span><strong>${escapeHtml(prep.estado)}${prep.estado !== "vigente" && prep.anulada_motivo ? ` · ${escapeHtml(prep.anulada_motivo)}` : ""}</strong></article>
          <article><span>Base imponible</span><strong>${formatMoney(prep.base_imponible)}</strong></article>
          <article><span>IVA</span><strong>${formatMoney(prep.iva)}</strong></article>
          <article><span>Total con IVA</span><strong>${formatMoney(prep.total)}</strong></article>
        </div>
        ${prep.observacion ? `<p class="muted-text"><strong>Observación:</strong> ${escapeHtml(prep.observacion)}</p>` : ""}
        ${buckets.length ? buckets.map((bucket) => `
          <h4>${escapeHtml(bucket.funcion)}</h4>
          <div class="table-scroll">
            <table class="facturacion-table">
              <thead><tr><th>Instalación</th><th>Total</th><th>Diurnas</th><th>Nocturnas</th></tr></thead>
              <tbody>
                ${bucket.installations.map((item) => `<tr><td>${escapeHtml(item.instalacion)}</td><td class="numeric">${percent.format(item.total)}</td><td class="numeric">${percent.format(item.diurnal)}</td><td class="numeric">${percent.format(item.nocturnal)}</td></tr>`).join("")}
                <tr class="facturacion-function-total"><td>TOTAL</td><td class="numeric">${percent.format(bucket.total)}</td><td class="numeric">${percent.format(bucket.diurnal)}</td><td class="numeric">${percent.format(bucket.nocturnal)}</td></tr>
                <tr><td>PRECIO (${escapeHtml(bucket.tipoPrecio || "—")})</td><td class="numeric" colspan="2">${formatMoney(bucket.precioDia)}${bucket.precioNoche != null && bucket.precioNoche !== bucket.precioDia ? ` / ${formatMoney(bucket.precioNoche)}` : ""}</td><td></td></tr>
                <tr class="facturacion-function-total"><td>Subtotal ${escapeHtml(bucket.funcion)}</td><td class="numeric" colspan="2"></td><td class="numeric">${formatMoney(bucket.subtotal)}</td></tr>
              </tbody>
            </table>
          </div>
          <p class="eyebrow">Desglose por semanas</p>
          <div class="table-scroll">
            <table class="facturacion-table">
              <thead><tr><th>Instalación</th><th>Semana</th><th>Total</th><th>Diurnas</th><th>Nocturnas</th></tr></thead>
              <tbody>
                ${bucket.weeks.map((item) => `<tr><td>${escapeHtml(item.instalacion)}</td><td>${item.week}</td><td class="numeric">${percent.format(item.total)}</td><td class="numeric">${percent.format(item.diurnal)}</td><td class="numeric">${percent.format(item.nocturnal)}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        `).join("") : '<p class="muted-text">Esta preparación no tiene líneas.</p>'}
      `;
    } catch (error) {
      el.preparationPreviewBody.innerHTML = `<p class="muted-text">No se pudo cargar la vista previa: ${escapeHtml(error.message)}</p>`;
    }
  }

  function fillInvoiceForm(row = {}) {
    const form = el.invoiceForm;
    form.reset();
    form.elements.id.value = row.id || "";
    form.elements.fecha.value = String(row.fecha || new Date().toISOString().slice(0, 10)).slice(0, 10);
    form.elements.serie.value = row.serie || "";
    form.elements.n_documento.value = row.n_documento || "";
    form.elements.referencia.value = row.referencia || "";
    form.elements.base_imponible.value = row.base_imponible ?? "";
    form.elements.iva.value = row.iva ?? "";
    form.elements.total.value = row.total ?? "";
    form.elements.cobrada.checked = Boolean(row.cobrada);
    form.elements.fecha_cobro.value = String(row.fecha_cobro || "").slice(0, 10);
    form.elements.observacion.value = row.observacion || "";
    form.elements.presupuesto_id.innerHTML = [
      '<option value="">Sin asignar</option>',
      ...state.budgets.filter((budget) => String(budget.contrato_id) === String(state.contractId))
        .map((budget) => `<option value="${budget.id}">${escapeHtml(budget.periodo)}</option>`),
    ].join("");
    form.elements.contrato_estado_factura_id.innerHTML = [
      '<option value="">Sin estado</option>',
      ...state.statuses.map((status) => `<option value="${status.id}">${escapeHtml(status.estado)}</option>`),
    ].join("");
    form.elements.presupuesto_id.value = row.presupuesto_id || "";
    form.elements.contrato_estado_factura_id.value = row.contrato_estado_factura_id || "";
    el.deleteInvoice.classList.toggle("hidden", !row.id);
    el.invoiceDialog.showModal();
  }

  function fillRateForm(row = {}) {
    const form = el.rateForm;
    form.reset();
    form.elements.id.value = row.id || "";
    form.elements.funcion_id.innerHTML = [
      '<option value="">Selecciona una función</option>',
      ...state.functions.map((item) => `<option value="${item.id}">${escapeHtml(item.funcion)}${item.activo ? "" : " · no activa"}</option>`),
    ].join("");
    form.elements.funcion_id.value = row.funcion_id || "";
    const taggedServiceIds = new Set(serviceIdsForRate(row.id).map(String));
    form.elements.servicio_ids.innerHTML = servicesForContract(state.contractId)
      .map((service) => `<option value="${service.id}"${taggedServiceIds.has(String(service.id)) ? " selected" : ""}>${escapeHtml(service.servicio)}</option>`)
      .join("");
    form.elements.tipo_precio.value = row.tipo_precio || "hora";
    form.elements.precio_01.value = row.precio_01 ?? "";
    form.elements.precio_02.value = row.precio_02 ?? "";
    form.elements.observacion.value = row.observacion || "";
    form.elements.activo.checked = row.id ? Boolean(row.activo) : true;
    el.deleteRate.classList.toggle("hidden", !row.id);
    el.rateDialog.showModal();
  }

  function fillPeriodForm(row = {}) {
    const form = el.periodForm;
    form.reset();
    form.elements.id.value = row.id || "";
    form.elements.concepto.value = row.concepto || "";
    form.elements.fecha_inicio.value = String(row.fecha_inicio || "").slice(0, 10);
    form.elements.fecha_fin.value = String(row.fecha_fin || "").slice(0, 10);
    el.deletePeriod.classList.toggle("hidden", !row.id);
    el.periodDialog.showModal();
  }

  function fillStatusForm(row = {}) {
    const form = el.statusForm;
    form.reset();
    form.elements.id.value = row.id || "";
    form.elements.registro.value = row.registro ?? "";
    form.elements.estado.value = row.estado || "";
    form.elements.es_pagada.checked = Boolean(row.es_pagada);
    form.elements.descripcion.value = row.descripcion || "";
    el.deleteStatus.classList.toggle("hidden", !row.id);
    el.statusDialog.showModal();
  }

  async function saveBudget(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      contrato_id: Number(state.contractId),
      periodo: form.elements.periodo.value.trim(),
      fecha_inicio: form.elements.fecha_inicio.value,
      fecha_fin: form.elements.fecha_fin.value,
      presupuesto: numeric(form.elements.presupuesto.value),
      porcentaje_iva: form.elements.porcentaje_iva.value === "" ? null : numeric(form.elements.porcentaje_iva.value) / 100,
      observacion: form.elements.observacion.value.trim() || null,
    };
    if (payload.fecha_fin < payload.fecha_inicio) {
      setStatus("La fecha final del presupuesto no puede ser anterior a la inicial.", "error");
      return;
    }
    const supabase = await getClient();
    const id = form.elements.id.value;
    const result = id
      ? await supabase.from("contratos_presupuestos").update(payload).eq("id", id)
      : await supabase.from("contratos_presupuestos").insert(payload);
    if (result.error) {
      setStatus(`No se pudo guardar el presupuesto: ${result.error.message}`, "error");
      return;
    }
    el.budgetDialog.close();
    await reloadBudgets();
    setStatus("Presupuesto guardado.", "success");
  }

  async function saveInvoice(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      contrato_id: Number(state.contractId),
      fecha: form.elements.fecha.value,
      serie: form.elements.serie.value.trim() || null,
      n_documento: form.elements.n_documento.value.trim() || null,
      referencia: form.elements.referencia.value.trim() || null,
      base_imponible: numeric(form.elements.base_imponible.value),
      iva: numeric(form.elements.iva.value),
      total: numeric(form.elements.total.value),
      presupuesto_id: form.elements.presupuesto_id.value ? Number(form.elements.presupuesto_id.value) : null,
      contrato_estado_factura_id: form.elements.contrato_estado_factura_id.value ? Number(form.elements.contrato_estado_factura_id.value) : null,
      cobrada: form.elements.cobrada.checked,
      fecha_cobro: form.elements.fecha_cobro.value || null,
      observacion: form.elements.observacion.value.trim() || null,
    };
    if (payload.cobrada && !payload.fecha_cobro) {
      setStatus("Indica la fecha de cobro de la factura.", "error");
      return;
    }
    const supabase = await getClient();
    const id = form.elements.id.value;
    const result = id
      ? await supabase.from("contratos_facturacion").update(payload).eq("id", id)
      : await supabase.from("contratos_facturacion").insert(payload);
    if (result.error) {
      setStatus(`No se pudo guardar la factura: ${result.error.message}`, "error");
      return;
    }
    el.invoiceDialog.close();
    await reloadInvoices();
    setStatus("Factura guardada.", "success");
  }

  // Reemplaza al antiguo "recargar las 11 tablas de load()" tras guardar una
  // fila de configuración: solo relee la tabla que cambió (reloader) y, como
  // tarifas/servicios pueden afectar al precio, invalida la previsualización
  // de "Preparación de facturas" que hubiera a medio hacer.
  async function refreshAfterConfigurationChange(reloader, message, view = "configuracion") {
    await reloader();
    state.generation = null;
    switchView(view);
    setStatus(message, "success");
  }

  async function saveRate(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      contrato_id: Number(state.contractId),
      funcion_id: Number(form.elements.funcion_id.value),
      tipo_precio: form.elements.tipo_precio.value,
      precio_01: form.elements.precio_01.value === "" ? null : numeric(form.elements.precio_01.value),
      precio_02: form.elements.precio_02.value === "" ? null : numeric(form.elements.precio_02.value),
      observacion: form.elements.observacion.value.trim() || null,
      activo: form.elements.activo.checked,
    };
    const serviceIds = Array.from(form.elements.servicio_ids.selectedOptions).map((option) => Number(option.value));
    const supabase = await getClient();
    const id = form.elements.id.value;
    const result = id
      ? await supabase.from("contratos_funciones").update(payload).eq("id", id).select("id").single()
      : await supabase.from("contratos_funciones").insert(payload).select("id").single();
    if (result.error) {
      const message = result.error.code === "23505"
        ? "Ya hay una tarifa activa para esta función en este contrato. Desactívala o edítala en vez de crear otra."
        : result.error.message;
      setStatus(`No se pudo guardar la tarifa: ${message}`, "error");
      return;
    }
    const rateId = result.data.id;
    // Reemplazo simple (borrar y volver a insertar las etiquetas elegidas):
    // el volumen por tarifa es minimo y así no hay que calcular el diff.
    const deleteResult = await supabase.from("contratos_funciones_servicios").delete().eq("contrato_funcion_id", rateId);
    if (deleteResult.error) {
      setStatus(`Tarifa guardada, pero no se pudieron actualizar sus servicios: ${deleteResult.error.message}`, "error");
      return;
    }
    if (serviceIds.length) {
      const insertResult = await supabase.from("contratos_funciones_servicios").insert(
        serviceIds.map((servicioId) => ({ contrato_funcion_id: rateId, contrato_id: Number(state.contractId), servicio_id: servicioId }))
      );
      if (insertResult.error) {
        setStatus(`Tarifa guardada, pero no se pudieron asignar los servicios: ${insertResult.error.message}`, "error");
        return;
      }
    }
    el.rateDialog.close();
    await refreshAfterConfigurationChange(reloadRates, "Función y tarifa guardadas.");
  }

  async function savePeriod(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.elements.fecha_fin.value < form.elements.fecha_inicio.value) {
      setStatus("La fecha final no puede ser anterior a la inicial.", "error");
      return;
    }
    const payload = {
      contrato_id: Number(state.contractId),
      concepto: form.elements.concepto.value.trim(),
      fecha_inicio: form.elements.fecha_inicio.value,
      fecha_fin: form.elements.fecha_fin.value,
    };
    const supabase = await getClient();
    const id = form.elements.id.value;
    const result = id
      ? await supabase.from("contratos_fechas").update(payload).eq("id", id)
      : await supabase.from("contratos_fechas").insert(payload);
    if (result.error) {
      setStatus(`No se pudo guardar el periodo: ${result.error.message}`, "error");
      return;
    }
    el.periodDialog.close();
    await refreshAfterConfigurationChange(reloadPeriods, "Periodo contractual guardado.");
  }

  async function saveStatus(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      registro: form.elements.registro.value === "" ? null : Number(form.elements.registro.value),
      estado: form.elements.estado.value.trim(),
      es_pagada: form.elements.es_pagada.checked,
      descripcion: form.elements.descripcion.value.trim() || null,
    };
    const supabase = await getClient();
    const id = form.elements.id.value;
    const result = id
      ? await supabase.from("contratos_estado_facturas").update(payload).eq("id", id)
      : await supabase.from("contratos_estado_facturas").insert(payload);
    if (result.error) {
      setStatus(`No se pudo guardar el estado: ${result.error.message}`, "error");
      return;
    }
    el.statusDialog.close();
    await refreshAfterConfigurationChange(reloadStatuses, "Estado de factura guardado.");
  }

  async function deleteConfigurationRow(table, id, label, dialog, view = "configuracion") {
    if (!id || !window.confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`)) return;
    const supabase = await getClient();
    const result = await supabase.from(table).delete().eq("id", id);
    if (result.error) {
      setStatus(`No se pudo eliminar ${label}: ${result.error.message}`, "error");
      return;
    }
    dialog.close();
    const reloader = CONFIGURATION_TABLE_RELOADERS[table];
    if (reloader) {
      await refreshAfterConfigurationChange(reloader, `${label} eliminado.`, view);
    } else {
      switchView(view);
      setStatus(`${label} eliminado.`, "success");
    }
  }

  function bind() {
    el.contractSelect.addEventListener("change", () => {
      state.contractId = el.contractSelect.value;
      state.year = "";
      state.generation = null;
      el.generationPdf.disabled = true;
      render();
      if (state.view === "control") void loadControl();
    });
    el.yearSelect.addEventListener("change", () => {
      state.year = el.yearSelect.value;
      render();
    });
    el.refresh.addEventListener("click", () => void load({ force: true }));
    el.invoiceSearch.addEventListener("input", renderInvoices);
    qa("[data-facturacion-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.facturacionView)));
    el.newBudget.addEventListener("click", () => fillBudgetForm());
    el.newInvoice.addEventListener("click", () => fillInvoiceForm());
    el.newRate.addEventListener("click", () => fillRateForm());
    el.newPeriod.addEventListener("click", () => fillPeriodForm());
    el.newStatus.addEventListener("click", () => fillStatusForm());
    el.generationCalculate.addEventListener("click", () => void calculateBillingGeneration());
    el.generationPreview.addEventListener("click", previewGenerationClustering);
    el.generationWeekly.addEventListener("click", previewGenerationWeekly);
    el.generationSave.addEventListener("click", () => void saveBillingGeneration());
    el.generationPdf.addEventListener("click", () => void exportBillingGenerationPdf());
    el.generationBody.addEventListener("change", (event) => {
      const checkbox = event.target.closest(".facturacion-generation-group-check");
      if (!checkbox) return;
      toggleGenerationGroupSelection(checkbox.dataset.groupKey, checkbox.checked);
      // Solo cambia la clase de las filas de ese grupo (tachado/atenuado) en
      // vez de reconstruir toda la tabla por un tick: desde la fila del
      // checkbox (primera instalación del grupo) hasta la fila "Total X"
      // incluida, que es donde acaba el bloque de ese grupo.
      let node = checkbox.closest("tr");
      while (node) {
        node.classList.toggle("facturacion-generation-row-excluded", !checkbox.checked);
        if (node.classList.contains("facturacion-function-total")) break;
        node = node.nextElementSibling;
      }
    });
    el.preparationsBody.addEventListener("click", (event) => {
      const anularId = event.target.closest("[data-anular-preparacion]")?.dataset.anularPreparacion;
      if (anularId) void anulatePreparation(anularId);
      const facturaId = event.target.closest("[data-crear-factura]")?.dataset.crearFactura;
      if (facturaId) void createInvoiceFromPreparation(facturaId);
      const eliminarId = event.target.closest("[data-eliminar-preparacion]")?.dataset.eliminarPreparacion;
      if (eliminarId) void deletePreparation(eliminarId);
      const previewId = event.target.closest("[data-preview-preparacion]")?.dataset.previewPreparacion;
      if (previewId) void previewPreparation(previewId);
    });
    el.preparationsBody.addEventListener("change", (event) => {
      const checkbox = event.target.closest(".facturacion-preparation-check");
      if (!checkbox) return;
      const id = checkbox.dataset.prepId;
      if (checkbox.checked) state.preparationSelectedIds.add(id);
      else state.preparationSelectedIds.delete(id);
      const rows = preparationsForSelection();
      if (el.preparationsCheckAll) {
        el.preparationsCheckAll.checked = rows.length > 0 && rows.every((row) => state.preparationSelectedIds.has(String(row.id)));
      }
      if (el.preparationsPdf) el.preparationsPdf.disabled = !state.preparationSelectedIds.size;
    });
    el.preparationsCheckAll?.addEventListener("change", () => {
      const rows = preparationsForSelection();
      if (el.preparationsCheckAll.checked) rows.forEach((row) => state.preparationSelectedIds.add(String(row.id)));
      else rows.forEach((row) => state.preparationSelectedIds.delete(String(row.id)));
      renderPreparations();
    });
    el.preparationsPdf?.addEventListener("click", () => void exportSelectedPreparationsPdf());
    el.controlRefresh.addEventListener("click", () => void loadControl());
    el.controlViewPending.addEventListener("click", viewPendingInRecords);
    el.budgetForm.addEventListener("submit", saveBudget);
    el.invoiceForm.addEventListener("submit", saveInvoice);
    el.rateForm.addEventListener("submit", saveRate);
    el.periodForm.addEventListener("submit", savePeriod);
    el.statusForm.addEventListener("submit", saveStatus);
    qa("#private-tab-panel-facturacion [data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => button.closest("dialog")?.close());
    });
    el.budgetsBody.addEventListener("click", (event) => {
      const id = event.target.closest("[data-edit-budget]")?.dataset.editBudget;
      if (id) fillBudgetForm(state.budgets.find((row) => String(row.id) === String(id)));
    });
    el.invoicesBody.addEventListener("click", (event) => {
      const id = event.target.closest("[data-edit-invoice]")?.dataset.editInvoice;
      if (id) fillInvoiceForm(state.invoices.find((row) => String(row.id) === String(id)));
    });
    el.ratesBody.addEventListener("click", (event) => {
      const id = event.target.closest("[data-edit-rate]")?.dataset.editRate;
      if (id) fillRateForm(state.rates.find((row) => String(row.id) === String(id)));
    });
    el.periodsBody.addEventListener("click", (event) => {
      const id = event.target.closest("[data-edit-period]")?.dataset.editPeriod;
      if (id) fillPeriodForm(state.periods.find((row) => String(row.id) === String(id)));
    });
    el.statusesBody.addEventListener("click", (event) => {
      const id = event.target.closest("[data-edit-status]")?.dataset.editStatus;
      if (id) fillStatusForm(state.statuses.find((row) => String(row.id) === String(id)));
    });
    el.deleteRate.addEventListener("click", () =>
      void deleteConfigurationRow("contratos_funciones", el.rateForm.elements.id.value, "la tarifa", el.rateDialog));
    el.deletePeriod.addEventListener("click", () =>
      void deleteConfigurationRow("contratos_fechas", el.periodForm.elements.id.value, "el periodo contractual", el.periodDialog));
    el.deleteStatus.addEventListener("click", () =>
      void deleteConfigurationRow("contratos_estado_facturas", el.statusForm.elements.id.value, "el estado de factura", el.statusDialog));
    el.deleteBudget.addEventListener("click", () =>
      void deleteConfigurationRow("contratos_presupuestos", el.budgetForm.elements.id.value, "el presupuesto", el.budgetDialog, "presupuestos"));
    el.deleteInvoice.addEventListener("click", () =>
      void deleteConfigurationRow("contratos_facturacion", el.invoiceForm.elements.id.value, "la factura", el.invoiceDialog, "facturas"));
    ["base_imponible", "iva"].forEach((name) => {
      el.invoiceForm.elements[name].addEventListener("input", () => {
        el.invoiceForm.elements.total.value = (
          numeric(el.invoiceForm.elements.base_imponible.value) + numeric(el.invoiceForm.elements.iva.value)
        ).toFixed(2);
      });
    });
    el.invoiceForm.elements.cobrada.addEventListener("change", () => {
      if (el.invoiceForm.elements.cobrada.checked && !el.invoiceForm.elements.fecha_cobro.value) {
        el.invoiceForm.elements.fecha_cobro.value = new Date().toISOString().slice(0, 10);
      }
    });
  }

  function init() {
    if (state.initialized || !q("#private-tab-panel-facturacion")) return;
    Object.assign(el, {
      status: q("#facturacion-status"),
      contractSelect: q("#facturacion-contrato"),
      yearSelect: q("#facturacion-anio"),
      refresh: q("#facturacion-refresh"),
      contractCard: q("#facturacion-contract-card"),
      contractName: q("#facturacion-contract-name"),
      contractDescription: q("#facturacion-contract-description"),
      contractClient: q("#facturacion-contract-client"),
      contractFile: q("#facturacion-contract-file"),
      contractDates: q("#facturacion-contract-dates"),
      contractState: q("#facturacion-contract-state"),
      empty: q("#facturacion-empty"),
      kpiBudget: q("#facturacion-kpi-budget"),
      kpiInvoiced: q("#facturacion-kpi-invoiced"),
      kpiBalance: q("#facturacion-kpi-balance"),
      kpiExecution: q("#facturacion-kpi-execution"),
      kpiPending: q("#facturacion-kpi-pending"),
      summaryPeriods: q("#facturacion-summary-periods"),
      alerts: q("#facturacion-alerts"),
      yearChart: q("#facturacion-year-chart"),
      budgetsBody: q("#facturacion-budgets-body"),
      invoicesBody: q("#facturacion-invoices-body"),
      invoiceSearch: q("#facturacion-invoice-search"),
      newBudget: q("#facturacion-new-budget"),
      newInvoice: q("#facturacion-new-invoice"),
      budgetDialog: q("#facturacion-budget-dialog"),
      invoiceDialog: q("#facturacion-invoice-dialog"),
      budgetForm: q("#facturacion-budget-form"),
      invoiceForm: q("#facturacion-invoice-form"),
      generationFrom: q("#facturacion-generation-from"),
      generationTo: q("#facturacion-generation-to"),
      generationScope: q("#facturacion-generation-scope"),
      generationGroupBy: q("#facturacion-generation-groupby"),
      generationCalculate: q("#facturacion-generation-calculate"),
      generationSave: q("#facturacion-generation-save"),
      generationPdf: q("#facturacion-generation-pdf"),
      generationPreview: q("#facturacion-generation-preview"),
      generationWeekly: q("#facturacion-generation-weekly"),
      generationSummary: q("#facturacion-generation-summary"),
      generationAlerts: q("#facturacion-generation-alerts"),
      generationBody: q("#facturacion-generation-body"),
      generationObservacion: q("#facturacion-generation-observacion"),
      generationSelectionSummary: q("#facturacion-generation-selection-summary"),
      preparationsBody: q("#facturacion-preparations-body"),
      preparationsCheckAll: q("#facturacion-preparations-check-all"),
      preparationsPdf: q("#facturacion-preparations-pdf"),
      preparationPreviewDialog: q("#facturacion-preparation-preview-dialog"),
      preparationPreviewBody: q("#facturacion-preparation-preview-body"),
      ratesBody: q("#facturacion-rates-body"),
      periodsBody: q("#facturacion-periods-body"),
      statusesBody: q("#facturacion-statuses-body"),
      newRate: q("#facturacion-new-rate"),
      newPeriod: q("#facturacion-new-period"),
      newStatus: q("#facturacion-new-status"),
      rateDialog: q("#facturacion-rate-dialog"),
      periodDialog: q("#facturacion-period-dialog"),
      statusDialog: q("#facturacion-status-dialog"),
      rateForm: q("#facturacion-rate-form"),
      periodForm: q("#facturacion-period-form"),
      statusForm: q("#facturacion-status-form"),
      deleteRate: q("#facturacion-delete-rate"),
      deletePeriod: q("#facturacion-delete-period"),
      deleteStatus: q("#facturacion-delete-status"),
      deleteBudget: q("#facturacion-delete-budget"),
      deleteInvoice: q("#facturacion-delete-invoice"),
      controlFrom: q("#facturacion-control-from"),
      controlTo: q("#facturacion-control-to"),
      controlRefresh: q("#facturacion-control-refresh"),
      controlKpis: q("#facturacion-control-kpis"),
      controlMonthsBody: q("#facturacion-control-months-body"),
      controlInvoicesBody: q("#facturacion-control-invoices-body"),
      controlViewPending: q("#facturacion-control-view-pending"),
    });
    const now = new Date();
    // Mes anterior al actual por defecto: las facturas se preparan cuando el
    // mes ya ha cerrado, no a mitad del mes en curso.
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    el.generationFrom.value = [
      firstDay.getFullYear(),
      String(firstDay.getMonth() + 1).padStart(2, "0"),
      "01",
    ].join("-");
    el.generationTo.value = [
      lastDay.getFullYear(),
      String(lastDay.getMonth() + 1).padStart(2, "0"),
      String(lastDay.getDate()).padStart(2, "0"),
    ].join("-");
    const controlStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    el.controlFrom.value = [
      controlStart.getFullYear(),
      String(controlStart.getMonth() + 1).padStart(2, "0"),
      "01",
    ].join("-");
    state.initialized = true;
    bind();
  }

  window.CoordinacionFacturacion = { init, load };
  init();
})();
