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
    contractId: "",
    year: "",
    generation: null,
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
    const current = state.contractId;
    const active = state.contracts.filter((row) => row.activo);
    const inactive = state.contracts.filter((row) => !row.activo);
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
    const paidWithoutCollection = invoices.filter((row) => Number(row.contrato_estado_factura_id) === 5 && !row.cobrada).length;
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
            <td>${escapeHtml(row.observacion || "—")}</td>
            <td>${escapeHtml(row.tipo_precio || "—")}</td>
            <td class="numeric">${row.precio_01 == null ? "—" : formatMoney(row.precio_01)}</td>
            <td class="numeric">${row.precio_02 == null ? "—" : formatMoney(row.precio_02)}</td>
            <td>${row.activo ? "Activa" : "No activa"}</td>
            <td><button type="button" class="secondary-button row-action" data-edit-rate="${row.id}">Editar</button></td>
          </tr>`).join("")
      : '<tr><td colspan="7" class="empty-state">El contrato no tiene funciones y tarifas configuradas.</td></tr>';

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
            <td>${escapeHtml(row.descripcion || "—")}</td>
            <td>${state.isAdmin ? `<button type="button" class="secondary-button row-action" data-edit-status="${row.id}">Editar</button>` : ""}</td>
          </tr>`).join("")
      : '<tr><td colspan="4" class="empty-state">No hay estados configurados.</td></tr>';
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
    if (!hasContract) return;
    renderKpis();
    renderBudgets();
    renderAlerts();
    renderYearChart();
    renderInvoices();
    renderConfiguration();
  }

  function switchView(view) {
    state.view = ["resumen", "presupuestos", "facturas", "preparacion", "configuracion"].includes(view) ? view : "resumen";
    qa("[data-facturacion-view]").forEach((button) => {
      const active = button.dataset.facturacionView === state.view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  async function load({ force = false } = {}) {
    if (state.loaded && !force) {
      render();
      return;
    }
    setStatus("Cargando facturación…");
    const supabase = await getClient();
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
  }

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
        .select("id,fecha,contrato_id,contrato,instalacion_id,instalacion,funcion_id,funcion,horas,horas_diurnas,horas_nocturnas")
        .gte("fecha", from)
        .lte("fecha", to)
        .eq("facturar", true)
        .order("fecha", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (scope === "selected") query = query.eq("contrato_id", Number(state.contractId));
      const result = await query;
      if (result.error) throw result.error;
      rows.push(...(result.data || []));
      if ((result.data || []).length < pageSize) break;
    }
    return rows;
  }

  function buildBillingGeneration(records, from, to) {
    const contracts = new Map(state.contracts.map((row) => [String(row.id), row]));
    const groups = new Map();
    const alerts = [];

    records.forEach((row) => {
      const key = `${row.contrato_id ?? ""}|${row.funcion_id ?? ""}`;
      if (!groups.has(key)) {
        const rateInfo = selectRate(row.contrato_id, row.funcion_id);
        groups.set(key, {
          key,
          contratoId: row.contrato_id,
          contrato: row.contrato || contracts.get(String(row.contrato_id))?.contrato || `Contrato ${row.contrato_id}`,
          funcionId: row.funcion_id,
          funcion: row.funcion || "Sin función",
          contract: contracts.get(String(row.contrato_id)),
          rate: rateInfo.selected,
          ambiguousRate: rateInfo.ambiguous,
          total: 0,
          diurnal: 0,
          nocturnal: 0,
          installations: new Map(),
          weeks: new Map(),
        });
      }
      const group = groups.get(key);
      const hours = recordHours(row);
      group.total += hours.total;
      group.diurnal += hours.diurnal;
      group.nocturnal += hours.nocturnal;
      const installationKey = String(row.instalacion_id ?? row.instalacion ?? "sin-instalacion");
      if (!group.installations.has(installationKey)) {
        group.installations.set(installationKey, {
          instalacion: row.instalacion || "Sin instalación",
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
        const type = String(group.rate?.tipo_precio || "").toLocaleLowerCase("es");
        const priceDay = numeric(group.rate?.precio_01);
        const priceNight = group.rate?.precio_02 == null ? priceDay : numeric(group.rate.precio_02);
        const fixed = type === "mes" || type === "global";
        const subtotal = group.rate
          ? fixed
            ? priceDay
            : group.diurnal * priceDay + group.nocturnal * priceNight
          : 0;
        const ivaRate = group.contract?.iva == null ? 0.21 : numeric(group.contract.iva);
        const iva = subtotal * ivaRate;
        if (!group.rate) {
          alerts.push(`${group.contrato} · ${group.funcion}: no tiene tarifa configurada.`);
        } else if (group.ambiguousRate) {
          alerts.push(`${group.contrato} · ${group.funcion}: hay varias tarifas; se ha usado ${formatMoney(priceDay)}.`);
        } else if (!group.rate.tipo_precio || group.rate.precio_01 == null) {
          alerts.push(`${group.contrato} · ${group.funcion}: la tarifa está incompleta.`);
        }
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
        };
      });

    return { from, to, records: records.length, groups: normalized, alerts };
  }

  function renderBillingGeneration() {
    const generation = state.generation;
    el.generationPdf.disabled = !generation?.groups.length;
    if (!generation) return;
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
    const rows = generation.groups.flatMap((group) => [
      ...group.installations.map((installation, index) => `
          <tr>
            <td>${index ? "" : escapeHtml(group.contrato)}</td>
            <td>${index ? "" : escapeHtml(group.funcion)}</td>
            <td>${escapeHtml(installation.instalacion)}</td>
            <td class="numeric">${percent.format(installation.total)}</td>
            <td class="numeric">${percent.format(installation.diurnal)}</td>
            <td class="numeric">${percent.format(installation.nocturnal)}</td>
            <td></td><td></td><td></td><td></td>
          </tr>`),
      `<tr class="facturacion-function-total">
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
    ]);
    el.generationBody.innerHTML = rows.length
      ? rows.join("")
      : '<tr><td colspan="10" class="empty-state">No hay registros marcados para facturar en el periodo.</td></tr>';
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
    try {
      const records = await fetchBillingRecords(from, to, scope);
      state.generation = buildBillingGeneration(records, from, to);
      renderBillingGeneration();
      setStatus(`Cálculo completado: ${records.length} registros incluidos.`, "success");
    } catch (error) {
      setStatus(`No se pudo calcular la facturación: ${error.message}`, "error");
    } finally {
      el.generationCalculate.disabled = false;
    }
  }

  function pdfNumber(value) {
    return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(numeric(value));
  }

  async function exportBillingGenerationPdf() {
    const generation = state.generation;
    if (!generation?.groups.length) return;
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

      for (const group of generation.groups) {
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
        y += 8;
        pageBreak(18);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Desglose por semanas", margin, y);
        y += 3;
        row(["Instalación", "Semana", "Total", "Diurnas", "Nocturnas"], [88, 20, 25, 25, 26], true);
        group.weeks.forEach((item) =>
          row([item.instalacion, item.week, pdfNumber(item.total), pdfNumber(item.diurnal), pdfNumber(item.nocturnal)], [88, 20, 25, 25, 26]));
      }
      doc.save(`preparacion-facturas-${generation.from}-${generation.to}.pdf`);
      setStatus("PDF de preparación generado.", "success");
    } catch (error) {
      setStatus(`No se pudo generar el PDF: ${error.message}`, "error");
    } finally {
      el.generationPdf.disabled = false;
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
    state.loaded = false;
    await load({ force: true });
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
    state.loaded = false;
    await load({ force: true });
    setStatus("Factura guardada.", "success");
  }

  async function refreshAfterConfigurationChange(message, view = "configuracion") {
    state.loaded = false;
    state.generation = null;
    await load({ force: true });
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
    const supabase = await getClient();
    const id = form.elements.id.value;
    const result = id
      ? await supabase.from("contratos_funciones").update(payload).eq("id", id)
      : await supabase.from("contratos_funciones").insert(payload);
    if (result.error) {
      setStatus(`No se pudo guardar la tarifa: ${result.error.message}`, "error");
      return;
    }
    el.rateDialog.close();
    await refreshAfterConfigurationChange("Función y tarifa guardadas.");
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
    await refreshAfterConfigurationChange("Periodo contractual guardado.");
  }

  async function saveStatus(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      registro: form.elements.registro.value === "" ? null : Number(form.elements.registro.value),
      estado: form.elements.estado.value.trim(),
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
    await refreshAfterConfigurationChange("Estado de factura guardado.");
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
    await refreshAfterConfigurationChange(`${label} eliminado.`, view);
  }

  function bind() {
    el.contractSelect.addEventListener("change", () => {
      state.contractId = el.contractSelect.value;
      state.year = "";
      state.generation = null;
      el.generationPdf.disabled = true;
      render();
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
    el.generationPdf.addEventListener("click", () => void exportBillingGenerationPdf());
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
      generationCalculate: q("#facturacion-generation-calculate"),
      generationPdf: q("#facturacion-generation-pdf"),
      generationSummary: q("#facturacion-generation-summary"),
      generationAlerts: q("#facturacion-generation-alerts"),
      generationBody: q("#facturacion-generation-body"),
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
    });
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
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
    state.initialized = true;
    bind();
  }

  window.CoordinacionFacturacion = { init, load };
  init();
})();
