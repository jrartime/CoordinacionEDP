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
    preparations: [],
    preparationsLoaded: false,
    preparationSelectedIds: new Set(),
    preparationsSort: { field: "created_at", direction: "desc" },
    preparationsFacturaFilter: "",
    invoicesSort: { field: "fecha", direction: "desc" },
    budgetsSort: { field: "fecha_inicio", direction: "asc" },
    controlMonthsSort: { field: "mes", direction: "asc" },
    controlMonthly: [],
    controlByInvoice: [],
    contractId: "",
    year: "",
    generation: null,
    // Último "Desglose por centros" mostrado en la vista previa: fuente para
    // el botón "Descargar PDF" del propio diálogo, sin recalcular.
    centerBreakdown: null,
    // Ticks por grupo calculado (contrato+función): se puede excluir del
    // guardado sin tener que recalcular. Guarda las group.key desmarcadas;
    // vacío = se guarda todo lo calculado (el estado por defecto). Se
    // reinicia en cada Calcular nuevo.
    generationExcludedGroupKeys: new Set(),
    isAdmin: false,
  };

  const el = {};
  const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
  const percent = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const hoursFmt = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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

  function getSortableBudgetValue(row, field, totals) {
    const invoiced = totals.get(String(row.id)) || 0;
    switch (field) {
      case "periodo": return String(row.periodo ?? "");
      case "fecha_inicio": return String(row.fecha_inicio ?? "");
      case "fecha_fin": return String(row.fecha_fin ?? "");
      case "presupuesto": return numeric(row.presupuesto);
      case "iva": return numeric(row.porcentaje_iva);
      case "facturado": return invoiced;
      case "saldo": return numeric(row.presupuesto) - invoiced;
      case "ejecucion": return numeric(row.presupuesto) ? (invoiced / numeric(row.presupuesto)) * 100 : 0;
      default: return "";
    }
  }

  function compareBudgetValues(left, right, field, totals) {
    const leftValue = getSortableBudgetValue(left, field, totals);
    const rightValue = getSortableBudgetValue(right, field, totals);
    if (["periodo", "fecha_inicio", "fecha_fin"].includes(field)) {
      return String(leftValue).localeCompare(String(rightValue), "es", { numeric: true, sensitivity: "base" });
    }
    return Number(leftValue) - Number(rightValue);
  }

  function sortBudgets(rows, totals) {
    const sort = state.budgetsSort;
    const directionMultiplier = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => {
      const result = compareBudgetValues(left, right, sort.field, totals);
      if (result !== 0) return result * directionMultiplier;
      return String(left.fecha_inicio ?? "").localeCompare(String(right.fecha_inicio ?? ""), "es", { numeric: true });
    });
  }

  function syncBudgetsSortButtons() {
    document.querySelectorAll("[data-budgets-sort-field]").forEach((button) => {
      const isActive = button.dataset.budgetsSortField === state.budgetsSort.field;
      button.classList.toggle("active", isActive);
      button.classList.toggle("sort-asc", isActive && state.budgetsSort.direction === "asc");
      button.classList.toggle("sort-desc", isActive && state.budgetsSort.direction === "desc");
    });
  }

  function renderBudgets() {
    const totals = invoiceBudgetTotals();
    const budgets = sortBudgets(budgetsForSelection(), totals);
    syncBudgetsSortButtons();
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

  function getSortableInvoiceValue(row, field, budgetNames, statusNames) {
    switch (field) {
      case "fecha": return String(row.fecha ?? "");
      case "serie": return [row.serie, row.n_documento].filter(Boolean).join("/");
      case "referencia": return String(row.referencia ?? "");
      case "base": return numeric(row.base_imponible);
      case "iva": return numeric(row.iva);
      case "total": return numeric(row.total);
      case "presupuesto": return String(budgetNames.get(String(row.presupuesto_id)) || "");
      case "estado": return String(statusNames.get(String(row.contrato_estado_factura_id)) || "");
      case "cobro": return `${row.cobrada ? "1" : "0"}_${row.fecha_cobro || ""}`;
      default: return "";
    }
  }

  function compareInvoiceValues(left, right, field, budgetNames, statusNames) {
    const leftValue = getSortableInvoiceValue(left, field, budgetNames, statusNames);
    const rightValue = getSortableInvoiceValue(right, field, budgetNames, statusNames);
    if (["base", "iva", "total"].includes(field)) {
      return Number(leftValue) - Number(rightValue);
    }
    return String(leftValue).localeCompare(String(rightValue), "es", { numeric: true, sensitivity: "base" });
  }

  function sortInvoices(rows, budgetNames, statusNames) {
    const sort = state.invoicesSort;
    const directionMultiplier = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => {
      const result = compareInvoiceValues(left, right, sort.field, budgetNames, statusNames);
      if (result !== 0) return result * directionMultiplier;
      return String(right.fecha ?? "").localeCompare(String(left.fecha ?? ""), "es", { numeric: true });
    });
  }

  function syncInvoicesSortButtons() {
    document.querySelectorAll("[data-invoices-sort-field]").forEach((button) => {
      const isActive = button.dataset.invoicesSortField === state.invoicesSort.field;
      button.classList.toggle("active", isActive);
      button.classList.toggle("sort-asc", isActive && state.invoicesSort.direction === "asc");
      button.classList.toggle("sort-desc", isActive && state.invoicesSort.direction === "desc");
    });
  }

  function getSortedFilteredInvoices() {
    const budgetNames = new Map(state.budgets.map((row) => [String(row.id), row.periodo]));
    const statusNames = new Map(state.statuses.map((row) => [String(row.id), row.estado]));
    const invoices = invoicesForSelection().filter(invoiceMatchesSearch);
    return { invoices: sortInvoices(invoices, budgetNames, statusNames), budgetNames, statusNames };
  }

  function renderInvoices() {
    const { invoices, budgetNames, statusNames } = getSortedFilteredInvoices();
    syncInvoicesSortButtons();
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

  // Exporta exactamente lo que se ve en el listado: mismo contrato/año/
  // búsqueda/orden activos.
  async function exportInvoicesToExcel() {
    const { invoices, budgetNames, statusNames } = getSortedFilteredInvoices();
    if (!invoices.length) {
      setStatus("No hay facturas para esta selección.", "error");
      return;
    }
    setStatus("Preparando Excel de facturas...");
    try {
      const xlsxModule = await import("https://esm.sh/xlsx@0.18.5");
      const XLSX = xlsxModule.default || xlsxModule;
      const rows = invoices.map((row) => ({
        Fecha: formatDate(row.fecha),
        "Serie/Número": [row.serie, row.n_documento].filter(Boolean).join("/"),
        Referencia: row.referencia || "",
        Base: numeric(row.base_imponible),
        IVA: numeric(row.iva),
        Total: numeric(row.total),
        Presupuesto: budgetNames.get(String(row.presupuesto_id)) || "Sin asignar",
        Estado: statusNames.get(String(row.contrato_estado_factura_id)) || "Sin estado",
        Cobro: row.cobrada ? `Cobrada · ${formatDate(row.fecha_cobro)}` : "Pendiente",
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 12 }, { wch: 14 }, { wch: 24 }, { wch: 12 }, { wch: 10 },
        { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 20 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Facturas");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const contractName = selectedContract()?.contrato || "facturas";
      const dateSuffix = new Date().toISOString().slice(0, 10);
      downloadBlob(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `${contractName}-facturas-${dateSuffix}.xlsx`.replaceAll(/[^\w.-]+/g, "-")
      );
      setStatus("Excel de facturas exportado correctamente.", "success");
    } catch (error) {
      setStatus(`No se pudo exportar el Excel: ${error.message}`, "error");
    }
  }

  function renderConfiguration() {
    el.newStatus.disabled = !state.isAdmin;
    el.newStatus.title = state.isAdmin ? "" : "Solo los administradores pueden modificar el catálogo global.";
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
    const [contracts, budgets, invoices, statuses, rates, periods, functions, admin] = await Promise.all([
      fetchAll(supabase, "contratos", "id, contrato, descripcion, fecha_inicio, fecha_fin, expediente, cliente, activo, iva", "contrato"),
      fetchAll(supabase, "contratos_presupuestos", "*", "fecha_inicio"),
      fetchAll(supabase, "contratos_facturacion", "*", "fecha", false),
      fetchAll(supabase, "contratos_estado_facturas", "*", "registro"),
      fetchAll(supabase, "contratos_funciones", "*", "id"),
      fetchAll(supabase, "contratos_fechas", "*", "fecha_inicio"),
      fetchAll(supabase, "funciones", "id,funcion,activo", "funcion"),
      supabase.rpc("is_coordinacion_admin"),
    ]);
    const failed = [contracts, budgets, invoices, statuses, rates, periods, functions].find((result) => result.error);
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
    const rates = await fetchAll(supabase, "contratos_funciones", "*", "id");
    if (rates.error) {
      setStatus(`No se pudieron actualizar las tarifas: ${rates.error.message}`, "error");
      return;
    }
    state.rates = rates.data || [];
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

  // Las diurnas se derivan siempre de horas-nocturnas: a diferencia de
  // horas_nocturnas, la columna registros.horas_diurnas no tiene ningun
  // trigger ni via de escritura que la mantenga sincronizada (p.ej. al pasar
  // una fila a CAMB/LG se vacian horas y horas_nocturnas pero no esta), asi
  // que fiarse de su valor guardado infla horas facturables con datos
  // obsoletos. Ver memoria facturacion-horas-diurnas-desincronizadas.
  function recordHours(row) {
    const total = numeric(row.horas);
    const nocturnal = row.horas_nocturnas == null ? 0 : numeric(row.horas_nocturnas);
    const diurnal = Math.max(0, total - nocturnal);
    return { total, diurnal, nocturnal };
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
          "id,fecha,contrato_id,contrato,instalacion_id,instalacion,funcion_id,funcion,horas,horas_nocturnas,"
          + "personal_id,personal,"
          + "contrato_facturable_id,funcion_facturable_id,instalacion_facturable_id,"
          + "facturacion_destino_contrato,"
          + "facturacion_destino_funcion,facturacion_destino_instalacion"
        )
        .gte("fecha", from)
        .lte("fecha", to)
        .eq("facturar", true)
        // Orden solo por fecha (sin desempate) no es determinista entre
        // páginas cuando hay muchos registros con la misma fecha (aquí,
        // frecuente): el mismo registro podía salir en dos páginas distintas
        // y duplicarse en el cálculo, lo que luego hacía fallar el guardado
        // con "ya está incluido en la preparación vigente" contra sí mismo.
        .order("fecha", { ascending: true })
        .order("id", { ascending: true })
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
    // Cache por contrato+funcion: la tarifa no cambia entre registros de la
    // misma funcion, y con miles de registros no compensa recalcularla
    // (selectRate) fila a fila.
    const rateCache = new Map();

    // Se agrupa por contrato/funcion FACTURABLE (el destino si el registro
    // esta redirigido via registros_facturacion_destino, si no el propio):
    // asi una funcion "Monitorado" trabajada en el contrato A pero
    // redirigida al B cae en el grupo del B, con la tarifa del B.
    records.forEach((row) => {
      const rateKey = `${row.contrato_facturable_id ?? ""}|${row.funcion_facturable_id ?? ""}`;
      if (!rateCache.has(rateKey)) {
        rateCache.set(rateKey, selectRate(row.contrato_facturable_id, row.funcion_facturable_id));
      }
      const rateInfo = rateCache.get(rateKey);
      const key = rateKey;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          contratoId: row.contrato_facturable_id,
          contrato: contracts.get(String(row.contrato_facturable_id))?.contrato
            || row.facturacion_destino_contrato || row.contrato || `Contrato ${row.contrato_facturable_id}`,
          funcionId: row.funcion_facturable_id,
          funcion: functionNames.get(String(row.funcion_facturable_id))
            || row.facturacion_destino_funcion || row.funcion || "Sin función",
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
      group.records.push({
        registroId: row.id,
        instalacionId: row.instalacion_facturable_id ?? null,
        instalacionKey: installationKey,
        instalacion: installation.instalacion,
        diurnal: hours.diurnal,
        nocturnal: hours.nocturnal,
        total: hours.total,
        personalId: row.personal_id ?? null,
        personal: row.personal || "Sin personal",
        fecha: row.fecha,
      });

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

    // Un mismo aviso (tarifa sin precio, IVA por defecto...) puede repetirse
    // una vez por cada grupo; no aporta nada verlo duplicado.
    return { from, to, records: records.length, groups: normalized, alerts: Array.from(new Set(alerts)) };
  }

  // Cada grupo calculado es un contrato+función: un tick por grupo. Desmarcarlo
  // lo deja fuera de Guardar/PDF sin tener que volver a Calcular.
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
      el.generationSelectionSummary.textContent = "Se guardarán todos los grupos calculados.";
      return;
    }
    const hours = selected.reduce((sum, group) => sum + group.total, 0);
    el.generationSelectionSummary.textContent = selected.length
      ? `Se guardarán ${selected.length} de ${generation.groups.length} grupos (${hoursFmt.format(hours)} h). Los desmarcados se quedan fuera de esta preparación.`
      : "No has dejado ningún grupo marcado: no hay nada que guardar.";
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
    el.generationCenter.disabled = disabled;
  }

  function renderBillingGeneration() {
    const generation = state.generation;
    el.generationPdf.disabled = !generation?.groups.length;
    el.generationSave.disabled = !generation?.groups.length;
    el.generationPreview.disabled = !generation?.groups.length;
    el.generationWeekly.disabled = !generation?.groups.length;
    el.generationCenter.disabled = !generation?.groups.length;
    if (!generation) {
      // Sin esto, cambiar una tarifa en Configuración deja en pantalla
      // el cálculo anterior (ya obsoleto) sin ningún aviso: parece que el
      // cambio no sirvió de nada hasta que se pulsa Calcular de nuevo.
      el.generationSummary.classList.add("hidden");
      el.generationSummary.innerHTML = "";
      el.generationAlerts.innerHTML = "";
      el.generationBody.innerHTML =
        '<tr><td colspan="11" class="empty-state">La configuración ha cambiado desde el último cálculo. Pulsa Calcular de nuevo.</td></tr>';
      if (el.generationSelectionSummary) el.generationSelectionSummary.textContent = "";
      return;
    }
    const totalHours = generation.groups.reduce((sum, group) => sum + group.total, 0);
    const subtotal = generation.groups.reduce((sum, group) => sum + group.subtotal, 0);
    const total = generation.groups.reduce((sum, group) => sum + group.totalWithIva, 0);
    el.generationSummary.classList.remove("hidden");
    el.generationSummary.innerHTML = `
      <article><span>Registros incluidos</span><strong>${generation.records}</strong></article>
      <article><span>Horas facturables</span><strong>${hoursFmt.format(totalHours)} h</strong></article>
      <article><span>Base calculada</span><strong>${formatMoney(subtotal)}</strong></article>
      <article><span>Total con IVA</span><strong>${formatMoney(total)}</strong></article>`;
    el.generationAlerts.innerHTML = generation.alerts.map((alert) => `<li>${escapeHtml(alert)}</li>`).join("");
    const rows = generation.groups.flatMap((group) => {
      const checked = !state.generationExcludedGroupKeys.has(group.key);
      return [
        ...group.installations.map((installation, index) => `
          <tr class="${checked ? "" : "facturacion-generation-row-excluded"}">
            <td>${index ? "" : `<input type="checkbox" class="facturacion-generation-group-check" data-group-key="${escapeHtml(group.key)}" ${checked ? "checked" : ""} aria-label="Incluir ${escapeHtml(group.contrato)} · ${escapeHtml(group.funcion)} al guardar" />`}</td>
            <td>${index ? "" : escapeHtml(group.contrato)}</td>
            <td>${index ? "" : escapeHtml(group.funcion)}${index || !group.redirectedFrom.size ? "" : `<br><span class="muted-text" title="Horas trabajadas en otro contrato, redirigidas aquí para facturar">↪ ${escapeHtml(Array.from(group.redirectedFrom).join(", "))}</span>`}</td>
            <td>${escapeHtml(installation.instalacion)}</td>
            <td class="numeric">${hoursFmt.format(installation.total)}</td>
            <td class="numeric">${hoursFmt.format(installation.diurnal)}</td>
            <td class="numeric">${hoursFmt.format(installation.nocturnal)}</td>
            <td></td><td></td><td></td><td></td>
          </tr>`),
        `<tr class="facturacion-function-total${checked ? "" : " facturacion-generation-row-excluded"}">
        <td></td>
        <td></td>
        <td colspan="2">Total ${escapeHtml(group.funcion)}</td>
        <td class="numeric">${hoursFmt.format(group.total)}</td>
        <td class="numeric">${hoursFmt.format(group.diurnal)}</td>
        <td class="numeric">${hoursFmt.format(group.nocturnal)}</td>
        <td>${escapeHtml(group.type)}</td>
        <td class="numeric">${formatMoney(group.priceDay)}</td>
        <td class="numeric">${formatMoney(group.priceNight)}</td>
        <td class="numeric">${formatMoney(group.subtotal)}</td>
      </tr>`,
      ];
    });
    el.generationBody.innerHTML = rows.length
      ? rows.join("")
      : '<tr><td colspan="11" class="empty-state">No hay registros marcados para facturar en el periodo.</td></tr>';
    el.generationSave.disabled = !getSelectedGenerationGroups().length;
    el.generationPdf.disabled = !getSelectedGenerationGroups().length;
    el.generationPreview.disabled = !getSelectedGenerationGroups().length;
    el.generationWeekly.disabled = !getSelectedGenerationGroups().length;
    el.generationCenter.disabled = !getSelectedGenerationGroups().length;
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

  // "Contrato completo" junta todo el contrato en una preparación; "Contrato
  // y función" separa una preparación por función dentro del mismo contrato.
  function clusterGenerationGroups(groups, agrupacion) {
    const clusters = new Map();
    groups.forEach((group) => {
      const key = agrupacion === "contrato"
        ? `${group.contratoId}|contrato`
        : `${group.contratoId}|contrato_funcion:${group.funcionId}`;
      if (!clusters.has(key)) {
        clusters.set(key, {
          contratoId: group.contratoId,
          contrato: group.contrato,
          funcion: group.funcion,
          funcionId: agrupacion === "contrato_funcion" ? group.funcionId : null,
          baseImponible: 0,
          iva: 0,
          total: 0,
          diurnal: 0,
          nocturnal: 0,
          lines: [],
          // Solo para la vista previa (previewGenerationClustering): qué
          // filas calculadas (por función) caen en este mismo grupo al
          // guardar, para poder explicar el porqué de cada agrupación.
          contributingGroups: [],
        });
      }
      const cluster = clusters.get(key);
      cluster.baseImponible += group.subtotal;
      cluster.iva += group.iva;
      cluster.total += group.totalWithIva;
      cluster.diurnal += group.diurnal;
      cluster.nocturnal += group.nocturnal;
      cluster.lines.push(...group.lines);
      cluster.contributingGroups.push({
        funcion: group.funcion,
        total: group.total,
        diurnal: group.diurnal,
        nocturnal: group.nocturnal,
        subtotal: group.subtotal,
      });
    });
    return Array.from(clusters.values()).map((cluster) => {
      const label = agrupacion === "contrato"
        ? `${cluster.contrato} · contrato completo`
        : `${cluster.contrato} · ${cluster.funcion}`;
      return { ...cluster, label };
    });
  }

  // Muestra qué preparaciones se crearían con la agrupación elegida sin
  // guardar nada -para poder comparar "Contrato y función" y "Contrato
  // completo" antes de decidir cuál usar-.
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
    el.preparationPreviewBody.innerHTML = `
      <p class="muted-text">
        Así quedarían las preparaciones si guardas ahora con «${escapeHtml(agrupacionLabel)}»:
        ${clusters.length} ${clusters.length === 1 ? "preparación" : "preparaciones"}. Esto no guarda nada,
        solo lo enseña.
      </p>
      ${clusters.map((cluster) => `
        <h4>${escapeHtml(cluster.label)}</h4>
        <div class="facturacion-generation-summary">
          <article><span>Registros</span><strong>${cluster.lines.length}</strong></article>
          <article><span>Horas</span><strong>${hoursFmt.format(cluster.diurnal + cluster.nocturnal)} h</strong></article>
          <article><span>Base imponible</span><strong>${formatMoney(cluster.baseImponible)}</strong></article>
          <article><span>Total con IVA</span><strong>${formatMoney(cluster.total)}</strong></article>
        </div>
        <div class="table-scroll">
          <table class="facturacion-table">
            <thead><tr><th>Función</th><th>Horas</th><th>Base</th></tr></thead>
            <tbody>
              ${cluster.contributingGroups.map((item) => `
                <tr>
                  <td>${escapeHtml(item.funcion)}</td>
                  <td class="numeric">${hoursFmt.format(item.total)}</td>
                  <td class="numeric">${formatMoney(item.subtotal)}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      `).join("")}
    `;
    el.preparationPreviewDialog.showModal();
  }

  // Desglose por instalación y semana de los grupos marcados en el
  // cálculo, sin generar PDF. Vivía dentro de "Descargar PDF"; se saca a un
  // botón aparte porque alargaba el PDF con un detalle que no siempre hace
  // falta imprimir.
  function previewGenerationWeekly() {
    const selectedGroups = getSelectedGenerationGroups();
    if (!selectedGroups.length || !el.preparationPreviewDialog) return;
    el.preparationPreviewBody.innerHTML = `
      <p class="muted-text">Desglose por instalación y semana de los grupos marcados. Esto no guarda nada.</p>
      ${selectedGroups.map((group) => `
        <h4>${escapeHtml(group.contrato)} · ${escapeHtml(group.funcion)}</h4>
        <div class="table-scroll">
          <table class="facturacion-table">
            <thead><tr><th>Instalación</th><th>Semana</th><th>Total</th><th>Diurnas</th><th>Nocturnas</th></tr></thead>
            <tbody>
              ${group.weeks.map((item) => `<tr><td>${escapeHtml(item.instalacion)}</td><td>${item.week}</td><td class="numeric">${hoursFmt.format(item.total)}</td><td class="numeric">${hoursFmt.format(item.diurnal)}</td><td class="numeric">${hoursFmt.format(item.nocturnal)}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      `).join("")}
    `;
    el.preparationPreviewDialog.showModal();
  }

  // Agrupa group.records (mismo origen que "Desglose por semanas") por
  // instalación y, dentro de cada una, por persona y semana. Fuente
  // compartida entre la vista previa en pantalla y el PDF, igual que
  // groupPreparationLines para las preparaciones ya guardadas.
  function buildCenterBreakdown(selectedGroups) {
    const centers = new Map();
    const weekSet = new Set();
    selectedGroups.forEach((group) => {
      group.records.forEach((record) => {
        const week = getIsoWeek(record.fecha);
        weekSet.add(week);
        if (!centers.has(record.instalacionKey)) {
          centers.set(record.instalacionKey, { instalacion: record.instalacion, personnel: new Map() });
        }
        const center = centers.get(record.instalacionKey);
        const personalKey = String(record.personalId ?? `sin-personal-${record.personal}`);
        if (!center.personnel.has(personalKey)) {
          center.personnel.set(personalKey, { personal: record.personal, weeks: new Map(), total: 0 });
        }
        const person = center.personnel.get(personalKey);
        person.weeks.set(week, (person.weeks.get(week) || 0) + record.total);
        person.total += record.total;
      });
    });
    const weeks = Array.from(weekSet).sort((a, b) => a - b);
    const centerList = Array.from(centers.values())
      .map((center) => {
        const people = Array.from(center.personnel.values()).sort((a, b) => a.personal.localeCompare(b.personal, "es"));
        const total = people.reduce((sum, person) => sum + person.total, 0);
        return { instalacion: center.instalacion, people, total };
      })
      .sort((a, b) => a.instalacion.localeCompare(b.instalacion, "es"));
    const grandTotal = centerList.reduce((sum, center) => sum + center.total, 0);
    return { weeks, centers: centerList, grandTotal };
  }

  // Desglose por función, instalación, personal y semana de los grupos
  // marcados en el cálculo: como "Desglose por semanas", agrupa primero por
  // función (cada grupo calculado ya es un contrato+función) y, dentro de
  // cada una, una tabla por centro con una fila por persona y una columna
  // por semana, más el total de la persona y el del centro. Mismo dato
  // origen que "Desglose por semanas" (group.records, ya con facturar=true
  // por venir de fetchBillingRecords). Se guarda en state.centerBreakdown
  // para que los botones "Descargar PDF"/"Descargar Excel" del propio
  // diálogo exporten exactamente lo que se está viendo.
  function previewGenerationByCenter() {
    const generation = state.generation;
    const selectedGroups = getSelectedGenerationGroups();
    if (!generation || !selectedGroups.length || !el.preparationPreviewDialog) return;
    const funciones = selectedGroups
      .map((group) => ({ contrato: group.contrato, funcion: group.funcion, ...buildCenterBreakdown([group]) }))
      .filter((item) => item.centers.length);
    const grandTotal = funciones.reduce((sum, item) => sum + item.grandTotal, 0);
    state.centerBreakdown = { from: generation.from, to: generation.to, funciones, grandTotal };
    el.preparationPreviewBody.innerHTML = `
      <p class="muted-text">Desglose por función, instalación, personal y semana de los grupos marcados. Esto no guarda nada.</p>
      <div class="facturacion-preview-toolbar">
        <button type="button" class="secondary-button" data-download-center-pdf>Descargar PDF</button>
        <button type="button" class="secondary-button" data-download-center-excel>Descargar Excel</button>
      </div>
      ${funciones.length ? funciones.map((item) => `
        <h4>${escapeHtml(item.contrato)} · ${escapeHtml(item.funcion)}</h4>
        ${renderCenterBreakdownTables(item)}
        <div class="facturacion-generation-summary">
          <article><span>Total ${escapeHtml(item.funcion)}</span><strong>${hoursFmt.format(item.grandTotal)} h</strong></article>
        </div>
      `).join("") : '<p class="muted-text">No hay horas que desglosar.</p>'}
      <div class="facturacion-generation-summary">
        <article><span>Total del periodo</span><strong>${hoursFmt.format(grandTotal)} h</strong></article>
      </div>
    `;
    el.preparationPreviewDialog.showModal();
  }

  // PDF del desglose por centros mostrado en la vista previa (state.centerBreakdown).
  // En horizontal porque el número de columnas (una por semana) es variable;
  // si no caben todas a la vez con un ancho legible, se reparten en varios
  // bloques de columnas para el mismo centro en vez de encogerlas hasta ser
  // ilegibles.
  async function exportCenterBreakdownPdf() {
    const data = state.centerBreakdown;
    if (!data || !data.funciones.length) return;
    const button = el.preparationPreviewBody?.querySelector("[data-download-center-pdf]");
    if (button) button.disabled = true;
    setStatus("Generando PDF…");
    try {
      const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 14;
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

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Desglose por centros", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Periodo ${formatDate(data.from)} – ${formatDate(data.to)}`, margin, y);
      y += 8;

      const personalWidth = 60;
      const totalWidth = 20;
      const minWeekWidth = 14;
      const available = pageWidth - margin * 2 - personalWidth - totalWidth;

      data.funciones.forEach((item) => {
        pageBreak(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${item.contrato} · ${item.funcion}`, margin, y);
        y += 7;

        const weeksPerBlock = item.weeks.length
          ? Math.max(1, Math.floor(available / minWeekWidth))
          : 0;
        const weekBlocks = [];
        for (let i = 0; i < item.weeks.length; i += weeksPerBlock) {
          weekBlocks.push(item.weeks.slice(i, i + weeksPerBlock));
        }
        if (!weekBlocks.length) weekBlocks.push([]);

        item.centers.forEach((center) => {
          weekBlocks.forEach((block, blockIndex) => {
            pageBreak(16);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text(
              blockIndex === 0 ? center.instalacion : `${center.instalacion} (cont.)`,
              margin,
              y
            );
            y += 6;
            const weekWidth = block.length ? available / block.length : available;
            const widths = [personalWidth, ...block.map(() => weekWidth), totalWidth];
            row(["Personal", ...block.map((week) => `Sem ${week}`), "Total"], widths, true);
            center.people.forEach((person) =>
              row(
                [
                  person.personal,
                  ...block.map((week) => (person.weeks.has(week) ? hoursFmt.format(person.weeks.get(week)) : "")),
                  hoursFmt.format(person.total),
                ],
                widths
              ));
            row(
              [
                `Total ${center.instalacion}`,
                ...block.map((week) => {
                  const weekTotal = center.people.reduce((sum, person) => sum + (person.weeks.get(week) || 0), 0);
                  return weekTotal ? hoursFmt.format(weekTotal) : "";
                }),
                hoursFmt.format(center.total),
              ],
              widths,
              true
            );
            y += 4;
          });
        });

        pageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Total ${item.funcion}: ${hoursFmt.format(item.grandTotal)} h`, margin, y);
        y += 8;
      });

      pageBreak(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Total del periodo: ${hoursFmt.format(data.grandTotal)} h`, margin, y);

      doc.save(`desglose-centros-${data.from}-${data.to}.pdf`);
      setStatus("PDF de desglose por centros generado.", "success");
    } catch (error) {
      setStatus(`No se pudo generar el PDF: ${error.message}`, "error");
    } finally {
      if (button) button.disabled = false;
    }
  }

  // Excel del desglose por centros mostrado en la vista previa
  // (state.centerBreakdown, igual que el PDF de al lado): una sola hoja,
  // filas de personal por instalación con las semanas como columnas -así
  // se puede filtrar/ordenar en Excel, a diferencia de bloques con huecos
  // en blanco entre instalaciones-, más la fila TOTAL de cada instalación y
  // el total del periodo al final.
  async function exportCenterBreakdownExcel() {
    const data = state.centerBreakdown;
    if (!data || !data.funciones.length) return;
    const button = el.preparationPreviewBody?.querySelector("[data-download-center-excel]");
    if (button) button.disabled = true;
    setStatus("Preparando Excel…");
    try {
      const xlsxModule = await import("https://esm.sh/xlsx@0.18.5");
      const XLSX = xlsxModule.default || xlsxModule;
      // Semanas unidas de todas las funciones marcadas, para una sola hoja
      // con columnas fijas (una función puede no tener horas en una semana
      // que otra sí tiene).
      const allWeeksSet = new Set();
      data.funciones.forEach((item) => item.weeks.forEach((week) => allWeeksSet.add(week)));
      const allWeeks = Array.from(allWeeksSet).sort((a, b) => a - b);
      const weekHeaders = allWeeks.map((week) => `Sem ${week}`);
      const rows = [];
      data.funciones.forEach((item) => {
        item.centers.forEach((center) => {
          center.people.forEach((person) => {
            const row = { Función: item.funcion, Instalación: center.instalacion, Personal: person.personal };
            allWeeks.forEach((week, index) => {
              row[weekHeaders[index]] = person.weeks.has(week) ? numeric(person.weeks.get(week)) : "";
            });
            row.Total = numeric(person.total);
            rows.push(row);
          });
          const centerTotalRow = { Función: item.funcion, Instalación: center.instalacion, Personal: `Total ${center.instalacion}` };
          allWeeks.forEach((week, index) => {
            const weekTotal = center.people.reduce((sum, person) => sum + (person.weeks.get(week) || 0), 0);
            centerTotalRow[weekHeaders[index]] = weekTotal || "";
          });
          centerTotalRow.Total = numeric(center.total);
          rows.push(centerTotalRow);
        });
        const funcionTotalRow = { Función: item.funcion, Instalación: "", Personal: `Total ${item.funcion}` };
        allWeeks.forEach((week, index) => {
          const weekTotal = item.centers.reduce(
            (sum, center) => sum + center.people.reduce((s, person) => s + (person.weeks.get(week) || 0), 0),
            0
          );
          funcionTotalRow[weekHeaders[index]] = weekTotal || "";
        });
        funcionTotalRow.Total = numeric(item.grandTotal);
        rows.push(funcionTotalRow);
      });
      const grandTotalRow = { Función: "", Instalación: "", Personal: "Total del periodo" };
      weekHeaders.forEach((header) => { grandTotalRow[header] = ""; });
      grandTotalRow.Total = numeric(data.grandTotal);
      rows.push(grandTotalRow);

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: ["Función", "Instalación", "Personal", ...weekHeaders, "Total"] });
      worksheet["!cols"] = [
        { wch: 22 }, { wch: 26 }, { wch: 28 }, ...weekHeaders.map(() => ({ wch: 9 })), { wch: 10 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Desglose por centros");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      downloadBlob(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `desglose-centros-${data.from}-${data.to}.xlsx`
      );
      setStatus("Excel de desglose por centros exportado.", "success");
    } catch (error) {
      setStatus(`No se pudo exportar el Excel: ${error.message}`, "error");
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function saveBillingGeneration() {
    const generation = state.generation;
    if (!generation?.groups.length) return;
    const selectedGroups = getSelectedGenerationGroups();
    if (!selectedGroups.length) {
      setStatus("No has dejado ningún grupo marcado para guardar.", "error");
      return;
    }
    const agrupacion = el.generationGroupBy.value;
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
      return funcion?.funcion || `Función ${row.funcion_id}`;
    }
    return "Contrato completo";
  }

  function getSortablePreparationValue(row, field, contractNames, invoiceNames) {
    switch (field) {
      case "fecha_desde":
        return String(row.fecha_desde ?? "");
      case "contrato":
        return String(contractNames.get(String(row.contrato_id)) || "").trim();
      case "agrupacion":
        return preparationGroupingLabel(row);
      case "estado":
        return String(row.estado ?? "");
      case "total":
        return Number(row.total ?? 0);
      case "factura":
        return row.contrato_facturacion_id ? String(invoiceNames.get(String(row.contrato_facturacion_id)) || "") : "";
      default:
        return String(row.created_at ?? "");
    }
  }

  function comparePreparationValues(left, right, field, contractNames, invoiceNames) {
    const leftValue = getSortablePreparationValue(left, field, contractNames, invoiceNames);
    const rightValue = getSortablePreparationValue(right, field, contractNames, invoiceNames);
    if (field === "total") {
      return Number(leftValue) - Number(rightValue);
    }
    return String(leftValue).localeCompare(String(rightValue), "es", { numeric: true, sensitivity: "base" });
  }

  function sortPreparations(rows, contractNames, invoiceNames) {
    const sort = state.preparationsSort;
    const directionMultiplier = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => {
      const result = comparePreparationValues(left, right, sort.field, contractNames, invoiceNames);
      if (result !== 0) return result * directionMultiplier;
      return String(right.created_at ?? "").localeCompare(String(left.created_at ?? ""), "es", { numeric: true });
    });
  }

  function syncPreparationsSortButtons() {
    if (!el.preparationsTable) return;
    el.preparationsTable.querySelectorAll("[data-preparations-sort-field]").forEach((button) => {
      const isActive = button.dataset.preparationsSortField === state.preparationsSort.field;
      button.classList.toggle("active", isActive);
      button.classList.toggle("sort-asc", isActive && state.preparationsSort.direction === "asc");
      button.classList.toggle("sort-desc", isActive && state.preparationsSort.direction === "desc");
    });
  }

  function preparationsForSelection() {
    const contractNames = new Map(state.contracts.map((row) => [String(row.id), row.contrato]));
    const invoiceNames = new Map(state.invoices.map((row) => [String(row.id), [row.serie, row.n_documento].filter(Boolean).join("/") || `#${row.id}`]));
    const rows = state.preparations.filter((row) => {
      if (state.contractId && String(row.contrato_id) !== String(state.contractId)) return false;
      if (state.preparationsFacturaFilter === "sin_factura" && row.contrato_facturacion_id) return false;
      if (state.preparationsFacturaFilter === "con_factura" && !row.contrato_facturacion_id) return false;
      return true;
    });
    return sortPreparations(rows, contractNames, invoiceNames);
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
    syncPreparationsSortButtons();
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

  function sortControlMonths(months, byMonth) {
    const sort = state.controlMonthsSort;
    const directionMultiplier = sort.direction === "asc" ? 1 : -1;
    return [...months].sort((left, right) => {
      const result = sort.field === "mes"
        ? left.localeCompare(right)
        : numeric(byMonth.get(left)[sort.field]) - numeric(byMonth.get(right)[sort.field]);
      if (result !== 0) return result * directionMultiplier;
      return left.localeCompare(right);
    });
  }

  function syncControlMonthsSortButtons() {
    document.querySelectorAll("[data-control-months-sort-field]").forEach((button) => {
      const isActive = button.dataset.controlMonthsSortField === state.controlMonthsSort.field;
      button.classList.toggle("active", isActive);
      button.classList.toggle("sort-asc", isActive && state.controlMonthsSort.direction === "asc");
      button.classList.toggle("sort-desc", isActive && state.controlMonthsSort.direction === "desc");
    });
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
    state.controlMonthly = monthly.data || [];
    state.controlByInvoice = byInvoice.data || [];
    renderControl(state.controlMonthly, state.controlByInvoice);
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
      <article><span class="record-billing-badge ${CONTROL_STATE_CLASS[estado]}">${escapeHtml(estado)}</span><strong>${hoursFmt.format(totals[estado] || 0)} h</strong></article>
    `).join("");

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const months = sortControlMonths(Array.from(byMonth.keys()), byMonth);
    syncControlMonthsSortButtons();
    el.controlMonthsBody.innerHTML = months.length
      ? months.map((mes) => {
          const hours = byMonth.get(mes);
          const isPastMonth = new Date(`${mes}T00:00:00`) < currentMonthStart;
          const pendingGap = isPastMonth && numeric(hours["Pendiente"]) > 0;
          return `
            <tr class="${pendingGap ? "facturacion-control-gap" : ""}">
              <td>${escapeHtml(formatControlMonth(mes))}</td>
              <td class="numeric">${pendingGap ? "⚠ " : ""}${hoursFmt.format(numeric(hours["Pendiente"]))} h</td>
              <td class="numeric">${hoursFmt.format(numeric(hours["Redirigido"]))} h</td>
              <td class="numeric">${hoursFmt.format(numeric(hours["En preparación"]))} h</td>
              <td class="numeric">${hoursFmt.format(numeric(hours["Facturado"]))} h</td>
              <td class="numeric">${hoursFmt.format(numeric(hours["Excluido"]))} h</td>
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
              <td class="numeric">${hoursFmt.format(numeric(row.horas))} h</td>
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

  // Tablas del desglose por centros de UNA función (instalación → personal →
  // semana): sin toolbar ni total general, porque "Desglose por centros"
  // ahora agrupa primero por función (como "Desglose por semanas") y esto se
  // repite una vez por función, con su propio subtotal fuera de esta función.
  function renderCenterBreakdownTables({ weeks, centers }) {
    if (!centers.length) return "";
    return centers.map((center) => `
          <p class="eyebrow">${escapeHtml(center.instalacion)}</p>
          <div class="table-scroll">
            <table class="facturacion-table">
              <thead>
                <tr>
                  <th>Personal</th>
                  ${weeks.map((week) => `<th class="numeric">Sem ${week}</th>`).join("")}
                  <th class="numeric">Total</th>
                </tr>
              </thead>
              <tbody>
                ${center.people.map((person) => `
                  <tr>
                    <td>${escapeHtml(person.personal)}</td>
                    ${weeks.map((week) => `<td class="numeric">${person.weeks.has(week) ? hoursFmt.format(person.weeks.get(week)) : ""}</td>`).join("")}
                    <td class="numeric">${hoursFmt.format(person.total)}</td>
                  </tr>`).join("")}
                <tr class="facturacion-function-total">
                  <td>Total ${escapeHtml(center.instalacion)}</td>
                  ${weeks.map((week) => {
                    const weekTotal = center.people.reduce((sum, person) => sum + (person.weeks.get(week) || 0), 0);
                    return `<td class="numeric">${weekTotal ? hoursFmt.format(weekTotal) : ""}</td>`;
                  }).join("")}
                  <td class="numeric">${hoursFmt.format(center.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `).join("");
  }

  // Construye y descarga el PDF de una o varias preparaciones ya guardadas
  // (instalación/total/diurnas/nocturnas por función + desglose por
  // semanas), reconstruido desde sus líneas congeladas. Fuente compartida
  // entre "Descargar PDF de marcadas" (varias, con tick) y el botón
  // "Descargar PDF" de la propia "Vista previa" de una preparación (una
  // sola, sin tener que marcarla ni salir del diálogo).
  async function generatePreparationsPdf(ids) {
    const linesByPrep = await fetchPreparationLines(ids);
    const contracts = new Map(state.contracts.map((item) => [String(item.id), item]));
    const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
    const idSet = new Set(ids.map(String));
    const preparations = state.preparations
      .filter((item) => idSet.has(String(item.id)))
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
    return preparations.length;
  }

  async function exportSelectedPreparationsPdf() {
    const ids = Array.from(state.preparationSelectedIds);
    if (!ids.length) return;
    el.preparationsPdf.disabled = true;
    setStatus("Generando PDF de las preparaciones marcadas…");
    try {
      const count = await generatePreparationsPdf(ids);
      setStatus(`PDF generado con ${count} ${count === 1 ? "preparación" : "preparaciones"}.`, "success");
    } catch (error) {
      setStatus(`No se pudo generar el PDF: ${error.message}`, "error");
    } finally {
      el.preparationsPdf.disabled = !state.preparationSelectedIds.size;
    }
  }

  // PDF de una sola preparación con el mismo contenido exacto que su "Vista
  // previa" en pantalla: cabecera con los importes congelados, tabla por
  // función/instalación y, a diferencia de generatePreparationsPdf (el de
  // "Descargar PDF de marcadas", que deliberadamente no lleva semanas), el
  // desglose por semanas de cada función también. Informe distinto a
  // propósito, no una llamada a generatePreparationsPdf.
  async function exportPreparationPreviewPdf(id) {
    const button = el.preparationPreviewBody?.querySelector("[data-download-preparation-pdf]");
    if (button) button.disabled = true;
    setStatus("Generando PDF…");
    try {
      const prep = state.preparations.find((item) => String(item.id) === String(id));
      if (!prep) throw new Error("Preparación no encontrada.");
      const linesByPrep = await fetchPreparationLines([id]);
      const buckets = groupPreparationLines(linesByPrep.get(String(id)));
      const contract = state.contracts.find((item) => String(item.id) === String(prep.contrato_id));
      const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageHeight = 297;
      const margin = 14;
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

      buckets.forEach((bucket) => {
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

        pageBreak(14);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Desglose por semanas", margin, y);
        y += 3;
        row(["Instalación", "Semana", "Total", "Diurnas", "Nocturnas"], [76, 20, 28, 29, 29], true);
        bucket.weeks.forEach((item) => row([item.instalacion, item.week, pdfNumber(item.total), pdfNumber(item.diurnal), pdfNumber(item.nocturnal)], [76, 20, 28, 29, 29]));
        y += 5;
      });

      doc.save(`preparacion-${prep.id}-${prep.fecha_desde}-${prep.fecha_hasta}.pdf`);
      setStatus("PDF de la preparación generado.", "success");
    } catch (error) {
      setStatus(`No se pudo generar el PDF: ${error.message}`, "error");
    } finally {
      if (button) button.disabled = false;
    }
  }

  // Excel de una sola preparación con el mismo contenido que su "Vista
  // previa" y el PDF de al lado (resumen + instalaciones por función +
  // semanas), pero en formato tabular de verdad -las "tarjetas" del resumen
  // no tienen sentido en una hoja, así que van como pares Campo/Valor-. Tres
  // hojas porque instalaciones y semanas tienen columnas distintas; mezclarlas
  // en una obligaría a repetir o vaciar celdas.
  async function exportPreparationPreviewExcel(id) {
    const button = el.preparationPreviewBody?.querySelector("[data-download-preparation-excel]");
    if (button) button.disabled = true;
    setStatus("Preparando Excel…");
    try {
      const prep = state.preparations.find((item) => String(item.id) === String(id));
      if (!prep) throw new Error("Preparación no encontrada.");
      const linesByPrep = await fetchPreparationLines([id]);
      const buckets = groupPreparationLines(linesByPrep.get(String(id)));
      const contract = state.contracts.find((item) => String(item.id) === String(prep.contrato_id));
      const xlsxModule = await import("https://esm.sh/xlsx@0.18.5");
      const XLSX = xlsxModule.default || xlsxModule;

      const summaryRows = [
        ["Periodo", `${formatDate(prep.fecha_desde)} – ${formatDate(prep.fecha_hasta)}`],
        ["Contrato", contract?.contrato || `Contrato ${prep.contrato_id}`],
        ["Expediente", contract?.expediente || "—"],
        ["Vigencia", `${formatDate(contract?.fecha_inicio)} – ${formatDate(contract?.fecha_fin)}`],
        ["Agrupación", preparationGroupingLabel(prep)],
        ["Estado", `${prep.estado}${prep.estado !== "vigente" && prep.anulada_motivo ? ` · ${prep.anulada_motivo}` : ""}`],
        ["Base imponible", numeric(prep.base_imponible)],
        ["IVA", numeric(prep.iva)],
        ["Total con IVA", numeric(prep.total)],
        ...(prep.observacion ? [["Observación", prep.observacion]] : []),
      ];

      const installationRows = [];
      const weekRows = [];
      buckets.forEach((bucket) => {
        bucket.installations.forEach((item) => {
          installationRows.push({
            Función: bucket.funcion,
            Instalación: item.instalacion,
            Total: numeric(item.total),
            Diurnas: numeric(item.diurnal),
            Nocturnas: numeric(item.nocturnal),
          });
        });
        installationRows.push({
          Función: bucket.funcion,
          Instalación: "TOTAL",
          Total: numeric(bucket.total),
          Diurnas: numeric(bucket.diurnal),
          Nocturnas: numeric(bucket.nocturnal),
        });
        bucket.weeks.forEach((item) => {
          weekRows.push({
            Función: bucket.funcion,
            Instalación: item.instalacion,
            Semana: item.week,
            Total: numeric(item.total),
            Diurnas: numeric(item.diurnal),
            Nocturnas: numeric(item.nocturnal),
          });
        });
      });

      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      summarySheet["!cols"] = [{ wch: 16 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

      const installationSheet = XLSX.utils.json_to_sheet(installationRows);
      installationSheet["!cols"] = [{ wch: 24 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(workbook, installationSheet, "Instalaciones");

      const weekSheet = XLSX.utils.json_to_sheet(weekRows);
      weekSheet["!cols"] = [{ wch: 24 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(workbook, weekSheet, "Semanas");

      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      downloadBlob(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `preparacion-${prep.id}-${prep.fecha_desde}-${prep.fecha_hasta}.xlsx`
      );
      setStatus("Excel de la preparación exportado.", "success");
    } catch (error) {
      setStatus(`No se pudo exportar el Excel: ${error.message}`, "error");
    } finally {
      if (button) button.disabled = false;
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
      const lines = linesByPrep.get(String(id));
      const buckets = groupPreparationLines(lines);
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
        <div class="facturacion-preview-toolbar">
          <button type="button" class="secondary-button" data-download-preparation-pdf="${prep.id}">Descargar PDF</button>
          <button type="button" class="secondary-button" data-download-preparation-excel="${prep.id}">Descargar Excel</button>
        </div>
        ${buckets.length ? buckets.map((bucket) => `
          <h4>${escapeHtml(bucket.funcion)}</h4>
          <div class="table-scroll">
            <table class="facturacion-table">
              <thead><tr><th>Instalación</th><th>Total</th><th>Diurnas</th><th>Nocturnas</th></tr></thead>
              <tbody>
                ${bucket.installations.map((item) => `<tr><td>${escapeHtml(item.instalacion)}</td><td class="numeric">${hoursFmt.format(item.total)}</td><td class="numeric">${hoursFmt.format(item.diurnal)}</td><td class="numeric">${hoursFmt.format(item.nocturnal)}</td></tr>`).join("")}
                <tr class="facturacion-function-total"><td>TOTAL</td><td class="numeric">${hoursFmt.format(bucket.total)}</td><td class="numeric">${hoursFmt.format(bucket.diurnal)}</td><td class="numeric">${hoursFmt.format(bucket.nocturnal)}</td></tr>
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
                ${bucket.weeks.map((item) => `<tr><td>${escapeHtml(item.instalacion)}</td><td>${item.week}</td><td class="numeric">${hoursFmt.format(item.total)}</td><td class="numeric">${hoursFmt.format(item.diurnal)}</td><td class="numeric">${hoursFmt.format(item.nocturnal)}</td></tr>`).join("")}
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
  // las tarifas pueden afectar al precio, invalida la previsualización de
  // "Preparación de facturas" que hubiera a medio hacer.
  async function refreshAfterConfigurationChange(reloader, message, view = "configuracion") {
    await reloader();
    state.generation = null;
    switchView(view);
    setStatus(message, "success");
  }

  // Funciones y tarifas ya no se editan desde aquí (vive en el panel de cada
  // contrato, en app.js): esta función es la API pública que usa ese panel
  // para guardar/borrar, reutilizando el mismo estado (state.rates) que
  // alimenta la generación de facturación.
  async function saveContractRate(payload) {
    const supabase = await getClient();
    const dbPayload = {
      contrato_id: payload.contrato_id,
      funcion_id: payload.funcion_id,
      tipo_precio: payload.tipo_precio,
      precio_01: payload.precio_01,
      precio_02: payload.precio_02,
      observacion: payload.observacion,
      activo: payload.activo,
    };
    const id = payload.id;
    const result = id
      ? await supabase.from("contratos_funciones").update(dbPayload).eq("id", id).select("id").single()
      : await supabase.from("contratos_funciones").insert(dbPayload).select("id").single();
    if (result.error) {
      const message = result.error.code === "23505"
        ? "Ya hay una tarifa activa para esta función en este contrato. Desactívala o edítala en vez de crear otra."
        : result.error.message;
      return { error: `No se pudo guardar la tarifa: ${message}` };
    }
    await reloadRates();
    return { error: null };
  }

  async function deleteContractRate(id) {
    if (!id) return { error: null };
    const supabase = await getClient();
    const result = await supabase.from("contratos_funciones").delete().eq("id", id);
    if (result.error) {
      return { error: `No se pudo eliminar la tarifa: ${result.error.message}` };
    }
    await reloadRates();
    return { error: null };
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
    el.invoicesExcel?.addEventListener("click", () => void exportInvoicesToExcel());
    el.newPeriod.addEventListener("click", () => fillPeriodForm());
    el.newStatus.addEventListener("click", () => fillStatusForm());
    el.generationCalculate.addEventListener("click", () => void calculateBillingGeneration());
    el.generationPreview.addEventListener("click", previewGenerationClustering);
    el.generationWeekly.addEventListener("click", previewGenerationWeekly);
    el.generationCenter.addEventListener("click", previewGenerationByCenter);
    el.preparationPreviewBody.addEventListener("click", (event) => {
      if (event.target.closest("[data-download-center-pdf]")) {
        void exportCenterBreakdownPdf();
        return;
      }
      if (event.target.closest("[data-download-center-excel]")) {
        void exportCenterBreakdownExcel();
        return;
      }
      const prepPdfId = event.target.closest("[data-download-preparation-pdf]")?.dataset.downloadPreparationPdf;
      if (prepPdfId) {
        void exportPreparationPreviewPdf(prepPdfId);
        return;
      }
      const prepExcelId = event.target.closest("[data-download-preparation-excel]")?.dataset.downloadPreparationExcel;
      if (prepExcelId) void exportPreparationPreviewExcel(prepExcelId);
    });
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
    el.preparationsFacturaFilter?.addEventListener("change", () => {
      state.preparationsFacturaFilter = el.preparationsFacturaFilter.value;
      renderPreparations();
    });
    el.preparationsPdf?.addEventListener("click", () => void exportSelectedPreparationsPdf());
    el.preparationsTable?.querySelector("thead")?.addEventListener("click", (event) => {
      const field = event.target.closest("[data-preparations-sort-field]")?.dataset.preparationsSortField;
      if (!field) return;
      state.preparationsSort = {
        field,
        direction: state.preparationsSort.field === field && state.preparationsSort.direction === "asc" ? "desc" : "asc",
      };
      renderPreparations();
    });
    el.invoicesTable?.querySelector("thead")?.addEventListener("click", (event) => {
      const field = event.target.closest("[data-invoices-sort-field]")?.dataset.invoicesSortField;
      if (!field) return;
      state.invoicesSort = {
        field,
        direction: state.invoicesSort.field === field && state.invoicesSort.direction === "asc" ? "desc" : "asc",
      };
      renderInvoices();
    });
    const handleBudgetsSortClick = (event) => {
      const field = event.target.closest("[data-budgets-sort-field]")?.dataset.budgetsSortField;
      if (!field) return;
      state.budgetsSort = {
        field,
        direction: state.budgetsSort.field === field && state.budgetsSort.direction === "asc" ? "desc" : "asc",
      };
      renderBudgets();
    };
    el.budgetsTable?.querySelector("thead")?.addEventListener("click", handleBudgetsSortClick);
    el.summaryPeriodsTable?.querySelector("thead")?.addEventListener("click", handleBudgetsSortClick);
    el.controlMonthsTable?.querySelector("thead")?.addEventListener("click", (event) => {
      const field = event.target.closest("[data-control-months-sort-field]")?.dataset.controlMonthsSortField;
      if (!field) return;
      state.controlMonthsSort = {
        field,
        direction: state.controlMonthsSort.field === field && state.controlMonthsSort.direction === "asc" ? "desc" : "asc",
      };
      renderControl(state.controlMonthly, state.controlByInvoice);
    });
    el.controlRefresh.addEventListener("click", () => void loadControl());
    el.controlViewPending.addEventListener("click", viewPendingInRecords);
    el.budgetForm.addEventListener("submit", saveBudget);
    el.invoiceForm.addEventListener("submit", saveInvoice);
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
    el.periodsBody.addEventListener("click", (event) => {
      const id = event.target.closest("[data-edit-period]")?.dataset.editPeriod;
      if (id) fillPeriodForm(state.periods.find((row) => String(row.id) === String(id)));
    });
    el.statusesBody.addEventListener("click", (event) => {
      const id = event.target.closest("[data-edit-status]")?.dataset.editStatus;
      if (id) fillStatusForm(state.statuses.find((row) => String(row.id) === String(id)));
    });
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
      summaryPeriodsTable: q("#facturacion-summary-periods-table"),
      alerts: q("#facturacion-alerts"),
      yearChart: q("#facturacion-year-chart"),
      budgetsTable: q("#facturacion-budgets-table"),
      budgetsBody: q("#facturacion-budgets-body"),
      invoicesTable: q("#facturacion-invoices-table"),
      invoicesBody: q("#facturacion-invoices-body"),
      invoiceSearch: q("#facturacion-invoice-search"),
      newBudget: q("#facturacion-new-budget"),
      newInvoice: q("#facturacion-new-invoice"),
      invoicesExcel: q("#facturacion-invoices-excel"),
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
      generationCenter: q("#facturacion-generation-center"),
      generationSummary: q("#facturacion-generation-summary"),
      generationAlerts: q("#facturacion-generation-alerts"),
      generationBody: q("#facturacion-generation-body"),
      generationObservacion: q("#facturacion-generation-observacion"),
      generationSelectionSummary: q("#facturacion-generation-selection-summary"),
      preparationsTable: q("#facturacion-preparations-table"),
      preparationsBody: q("#facturacion-preparations-body"),
      preparationsCheckAll: q("#facturacion-preparations-check-all"),
      preparationsFacturaFilter: q("#facturacion-preparations-factura-filter"),
      preparationsPdf: q("#facturacion-preparations-pdf"),
      preparationPreviewDialog: q("#facturacion-preparation-preview-dialog"),
      preparationPreviewBody: q("#facturacion-preparation-preview-body"),
      periodsBody: q("#facturacion-periods-body"),
      statusesBody: q("#facturacion-statuses-body"),
      newPeriod: q("#facturacion-new-period"),
      newStatus: q("#facturacion-new-status"),
      periodDialog: q("#facturacion-period-dialog"),
      statusDialog: q("#facturacion-status-dialog"),
      periodForm: q("#facturacion-period-form"),
      statusForm: q("#facturacion-status-form"),
      deletePeriod: q("#facturacion-delete-period"),
      deleteStatus: q("#facturacion-delete-status"),
      deleteBudget: q("#facturacion-delete-budget"),
      deleteInvoice: q("#facturacion-delete-invoice"),
      controlFrom: q("#facturacion-control-from"),
      controlTo: q("#facturacion-control-to"),
      controlRefresh: q("#facturacion-control-refresh"),
      controlKpis: q("#facturacion-control-kpis"),
      controlMonthsTable: q("#facturacion-control-months-table"),
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

  // Punto de entrada para el panel de "Funciones y tarifas" de cada contrato
  // (Contratos, en app.js): reutiliza la misma carga que la pestaña
  // Facturación, idempotente gracias a state.initialized/state.loaded.
  async function ensureLoaded() {
    init();
    await load();
  }

  window.CoordinacionFacturacion = {
    init,
    load,
    ensureLoaded,
    getFunctionsCatalog: () => state.functions,
    getRatesForContract: (contractId) => state.rates.filter((row) => String(row.contrato_id) === String(contractId)),
    saveContractRate,
    deleteContractRate,
  };
  init();
})();
