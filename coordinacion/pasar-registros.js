/* Pasar a Registros · modal compartido por Programación y Eventos deportivos.
 *
 * Origen «programacion»: la programación filtrada convertida en jornadas, una fila por persona, día e
 * instalación con la hora de entrada y de salida del día, siguiendo el mismo criterio que el
 * Informe individual (los tramos que enlazan, con un hueco menor de 30 min, se unen en uno;
 * si queda más de un tramo, cada uno es una fila). Ej.: Alba Queipo, 07/11, Florida Arena,
 * 08:30–21:00.
 *
 * De cada fila se elige el contrato entre los posibles para esa persona e instalación
 * (contrato_personal ∩ contrato_instalaciones, vigentes ese día) y el puesto entre los de los
 * historiales laborales vigentes de la persona ese día (en las dos pestañas): con uno solo se
 * propone; con varios, el de la actividad de esa persona en el contrato si coincide.
 *
 * Origen «eventos»: una fila por persona asignada a cada paso del cronograma de los eventos
 * marcados (o de todos los filtrados si no hay ninguno marcado, como el Informe resumen), con
 * su horario propio si difiere del paso. El contrato del evento sale propuesto; el tipo de
 * hora se elige por fila (MONT por defecto) y la función propuesta es Oficial de 1ª, como en la
 * zona «Generación de registros». Enlaza `registros.evento_asignacion_id`.
 *
 * Cada jornada marcada crea un registro con situación NORM (tipo de hora REG en Programación). La empresa sale
 * del historial laboral vigente ese día (sin ella el registro no entraría en la nómina: esas
 * jornadas se omiten avisando). La función va en su propia columna, editable por fila. Se
 * propone (con su modalidad) desde la actividad de esa persona en esa instalación/contrato/
 * puesto; si no la hay, la más usada con ese puesto en el contrato, o la única función activa
 * del contrato. En Eventos se propone Oficial de 1ª. Las opciones son las funciones con tarifa
 * en el contrato; «Sin función» se permite, avisando en la confirmación.
 *
 * No duplica: una jornada que se solapa con un registro que la persona ya tiene ese día (o, en
 * Eventos, cuya asignación ya generó registro) se muestra como «Ya en Registros» y sale
 * desmarcada; se puede marcar a mano y la confirmación avisa.
 *
 * Reutiliza de app.js (scripts clásicos, mismo ámbito global): filteredProgrammingRows,
 * getEventsForSummaryReport, currentEventScheduleRows, currentEventSchedulePersonnelRows,
 * getEventPersonnelName, getEventInstallationName, getSupabaseClient, normalizeImportedDate,
 * formatDisplayDate, formatHourValue, escapeHtml, getControlWeekdayInfo, setStatus.
 */
(function () {
  const MERGE_GAP_MINUTES = 30;
  const TIPO_HORA_REG = 1;
  const TIPO_HORA_MONT = 3;
  const SITUACION_NORM = 1;
  const FUNCION_OFICIAL_1A = 20;
  // Tipos de hora que tienen sentido para horas trabajadas (sin PNR ni bolsa de horas).
  const TIPOS_HORA = [
    { id: 1, label: "REG" },
    { id: 2, label: "HCOMP" },
    { id: 3, label: "MONT" },
    { id: 4, label: "FTRAB" },
  ];
  const tipoHoraLabel = (id) => TIPOS_HORA.find((t) => t.id === Number(id))?.label || "REG";

  const state = {
    source: null, // SOURCES[...]
    rows: [], // jornadas
    unlinked: 0, // filas de programación sin personal_id / instalacion_id
    contratos: new Map(), // id -> { id, contrato }
    personalContratos: [], // { personal_id, contrato_id, fecha_inicio, fecha_fin }
    instalacionContratos: [], // { instalacion_id, contrato_id, fecha_inicio, fecha_fin }
    puestos: new Map(), // id -> nombre
    actividades: [], // { id, contrato_id, personal_id, instalacion_id, puesto_id, funcion_id, modalidad_id, ... }
    contratoFunciones: [], // { contrato_id, funcion_id, modalidad_id }
    funciones: new Map(), // id -> nombre
    existentes: [], // registros ya creados de esas personas en el intervalo
    loading: false,
    busy: false,
  };

  let dialog = null;
  const esc = (value) => escapeHtml(String(value ?? ""));
  const $ = (selector) => dialog.querySelector(selector);

  /* ---------- horario del día (mismo criterio que el Informe individual) ---------- */

  const toMinutes = (value) => {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(value ?? "").trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const fmtMinutes = (n) => {
    const v = ((n % 1440) + 1440) % 1440;
    return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
  };

  function mergedSpans(rows) {
    const spans = [];
    rows.forEach((row) => {
      const start = toMinutes(row.inicio);
      if (start === null) return;
      let end = toMinutes(row.fin);
      if (end === null) end = start;
      else if (end < start) end += 1440;
      spans.push([start, end]);
    });
    spans.sort((a, b) => a[0] - b[0]);
    const merged = [];
    spans.forEach(([start, end]) => {
      const last = merged[merged.length - 1];
      if (last && start - last[1] < MERGE_GAP_MINUTES) last[1] = Math.max(last[1], end);
      else merged.push([start, end]);
    });
    return merged;
  }

  function hoursBetween(entrada, salida) {
    const start = toMinutes(entrada);
    let end = toMinutes(salida);
    if (start === null || end === null) return null;
    if (end < start) end += 1440;
    return Math.round(((end - start) / 60) * 100) / 100;
  }

  const fmtHours = (h) => (h == null ? "–" : `${String(h).replace(".", ",")} h`);

  /* ---------- jornadas a partir de la programación filtrada ---------- */

  function buildJornadas() {
    const source = typeof filteredProgrammingRows !== "undefined" ? filteredProgrammingRows : [];
    const groups = new Map();
    let unlinked = 0;
    source.forEach((row) => {
      if (!row.personalId || !row.instalacionId) {
        unlinked += 1;
        return;
      }
      const fecha = normalizeImportedDate(row.fecha) || "";
      if (!fecha) return;
      const key = `${row.personalId}|${fecha}|${row.instalacionId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          personalId: Number(row.personalId),
          persona: row.personal || "",
          instalacionId: Number(row.instalacionId),
          instalacion: row.instalacion || "",
          fecha,
          rows: [],
        });
      }
      groups.get(key).rows.push(row);
    });

    const jornadas = [];
    groups.forEach((group) => {
      mergedSpans(group.rows).forEach(([start, end], index) => {
        jornadas.push({
          key: `${group.personalId}|${group.fecha}|${group.instalacionId}|${index}`,
          personalId: group.personalId,
          persona: group.persona,
          instalacionId: group.instalacionId,
          instalacion: group.instalacion,
          fecha: group.fecha,
          entrada: fmtMinutes(start),
          salida: fmtMinutes(end),
          turnos: group.rows.length,
          tipoHoraId: String(TIPO_HORA_REG),
          selected: true,
          contratoId: "",
          puestoId: "",
        });
      });
    });
    jornadas.sort(
      (a, b) =>
        a.fecha.localeCompare(b.fecha) ||
        a.persona.localeCompare(b.persona, "es") ||
        a.instalacion.localeCompare(b.instalacion, "es") ||
        a.entrada.localeCompare(b.entrada)
    );
    return { jornadas, unlinked };
  }

  /* ---------- jornadas a partir de los eventos deportivos ---------- */

  function buildEventJornadas() {
    const events = typeof getEventsForSummaryReport === "function" ? getEventsForSummaryReport() : [];
    const pasos = typeof currentEventScheduleRows !== "undefined" ? currentEventScheduleRows : [];
    const asignaciones = typeof currentEventSchedulePersonnelRows !== "undefined" ? currentEventSchedulePersonnelRows : [];
    const jornadas = [];
    let unlinked = 0;
    events.forEach((evento) => {
      pasos
        .filter((paso) => Number(paso.evento_id) === Number(evento.id))
        .forEach((paso) => {
          asignaciones
            .filter((a) => Number(a.cronograma_id) === Number(paso.id))
            .forEach((a) => {
              const fecha = normalizeImportedDate(paso.fecha) || paso.fecha || "";
              if (!a.personal_id || !evento.instalacion_id || !fecha) {
                unlinked += 1;
                return;
              }
              // Si la persona tiene horario propio en el paso manda el suyo.
              const entrada = formatHourValue(a.hora_inicio || paso.hora_inicio).slice(0, 5);
              const salida = formatHourValue(a.hora_fin || paso.hora_fin).slice(0, 5);
              jornadas.push({
                key: `ev-${a.id}`,
                asignacionId: a.id,
                personalId: Number(a.personal_id),
                persona: getEventPersonnelName(a.personal_id) || `Persona ${a.personal_id}`,
                instalacionId: Number(evento.instalacion_id),
                instalacion: getEventInstallationName(evento.instalacion_id) || "",
                fecha,
                entrada,
                salida,
                evento: evento.nombre || "",
                paso: paso.actividad || "",
                contratoEvento: evento.contrato_id ? Number(evento.contrato_id) : null,
                observacion: a.observaciones || paso.actividad || null,
                tipoHoraId: String(TIPO_HORA_MONT),
                selected: true,
                contratoId: "",
                puestoId: "",
              });
            });
        });
    });
    jornadas.sort(
      (a, b) =>
        a.fecha.localeCompare(b.fecha) ||
        a.evento.localeCompare(b.evento, "es") ||
        a.entrada.localeCompare(b.entrada) ||
        a.persona.localeCompare(b.persona, "es")
    );
    return { jornadas, unlinked };
  }

  /* ---------- orígenes ---------- */

  const SOURCES = {
    programacion: {
      title: "Pasar programación a Registros",
      empty: "No hay programación con personal e instalación enlazados en los filtros actuales.",
      build: buildJornadas,
      showEvento: false,
      tipoHoraEditable: false,
      funcionFija: null,
      observacion: () => "Desde Programación",
      intro(rows, unlinked) {
        const personas = new Set(rows.map((r) => r.personalId)).size;
        const aviso = unlinked
          ? ` · ${unlinked} ${unlinked === 1 ? "turno queda fuera" : "turnos quedan fuera"} por no tener personal o instalación enlazados.`
          : "";
        return (
          `Programación filtrada: ${rows.length} ${rows.length === 1 ? "jornada" : "jornadas"} de ` +
          `${personas} ${personas === 1 ? "persona" : "personas"}. Entrada y salida diarias según el Informe individual ` +
          `(los tramos con menos de 30 min de hueco se unen).${aviso}`
        );
      },
    },
    eventos: {
      title: "Pasar eventos a Registros",
      empty: "Los eventos marcados (o filtrados) no tienen personal asignado en su cronograma.",
      build: buildEventJornadas,
      showEvento: true,
      tipoHoraEditable: true,
      funcionFija: FUNCION_OFICIAL_1A,
      observacion: (row) => row.observacion,
      intro(rows, unlinked) {
        const eventos = new Set(rows.map((r) => r.evento)).size;
        const personas = new Set(rows.map((r) => r.personalId)).size;
        const aviso = unlinked
          ? ` · ${unlinked} ${unlinked === 1 ? "asignación queda fuera" : "asignaciones quedan fuera"} por no tener persona, instalación o fecha.`
          : "";
        return (
          `${eventos} ${eventos === 1 ? "evento" : "eventos"} (los marcados o, si no hay ninguno, los filtrados): ` +
          `${rows.length} ${rows.length === 1 ? "asignación" : "asignaciones"} de ${personas} ${personas === 1 ? "persona" : "personas"}. ` +
          `Horario de cada persona en su paso; función Oficial de 1ª.${aviso}`
        );
      },
    },
  };

  /* ---------- catálogos: contratos posibles y puestos del contrato ---------- */

  const vigente = (link, fecha) =>
    (!link.fecha_inicio || link.fecha_inicio <= fecha) && (!link.fecha_fin || link.fecha_fin >= fecha);

  async function loadCatalogs() {
    const personalIds = [...new Set(state.rows.map((r) => r.personalId))];
    const instalacionIds = [...new Set(state.rows.map((r) => r.instalacionId))];
    if (!personalIds.length) return;
    const supabase = await getSupabaseClient();
    const [cp, ci] = await Promise.all([
      supabase
        .from("contrato_personal")
        .select("personal_id, contrato_id, fecha_inicio, fecha_fin")
        .in("personal_id", personalIds)
        .is("removed_at", null),
      supabase
        .from("contrato_instalaciones")
        .select("instalacion_id, contrato_id, fecha_inicio, fecha_fin")
        .in("instalacion_id", instalacionIds)
        .is("removed_at", null),
    ]);
    if (cp.error) throw new Error(`No se pudo cargar el personal de los contratos: ${cp.error.message}`);
    if (ci.error) throw new Error(`No se pudieron cargar las instalaciones de los contratos: ${ci.error.message}`);
    state.personalContratos = cp.data || [];
    state.instalacionContratos = ci.data || [];

    // Los comunes a persona e instalación, más el contrato propio de cada evento.
    const contratoIds = [
      ...new Set([
        ...state.personalContratos
          .map((x) => x.contrato_id)
          .filter((id) => state.instalacionContratos.some((x) => x.contrato_id === id)),
        ...state.rows.map((r) => r.contratoEvento).filter(Boolean),
      ]),
    ];

    state.existentes = await loadExistentes(supabase, personalIds);

    const puestos = await supabase.from("puestos").select("id, puesto").order("puesto", { ascending: true }).limit(500);
    if (puestos.error) throw new Error(`No se pudieron cargar los puestos: ${puestos.error.message}`);
    state.puestos = new Map((puestos.data || []).map((p) => [p.id, p.puesto || `Puesto ${p.id}`]));

    const funcionesCatalogo = await supabase.from("funciones").select("id, funcion").order("funcion", { ascending: true }).limit(500);
    if (funcionesCatalogo.error) throw new Error(`No se pudieron cargar las funciones: ${funcionesCatalogo.error.message}`);
    state.funciones = new Map((funcionesCatalogo.data || []).map((f) => [f.id, f.funcion || `Función ${f.id}`]));

    // Los puestos salen del historial laboral vigente de la persona ese día.
    const fechas = state.rows.map((r) => r.fecha).sort();
    const historiales = await supabase
      .from("historiales_laborales")
      .select("personal_id, puesto_id, fecha_alta, fecha_baja")
      .in("personal_id", personalIds)
      .lte("fecha_alta", fechas[fechas.length - 1])
      .or(`fecha_baja.is.null,fecha_baja.gte.${fechas[0]}`);
    if (historiales.error) throw new Error(`No se pudo cargar el historial laboral: ${historiales.error.message}`);
    state.historiales = historiales.data || [];

    state.contratos = new Map();
    state.actividades = [];
    state.contratoFunciones = [];
    if (!contratoIds.length) return;

    const [contratos, actividades, funciones] = await Promise.all([
      supabase.from("contratos").select("id, contrato, activo").in("id", contratoIds),
      supabase
        .from("actividades")
        .select("id, contrato_id, personal_id, instalacion_id, puesto_id, funcion_id, modalidad_id, fecha_inicio, fecha_fin, activo")
        .in("contrato_id", contratoIds)
        .not("puesto_id", "is", null)
        .limit(10000),
      supabase
        .from("contratos_funciones")
        .select("contrato_id, funcion_id, modalidad_id, activo")
        .in("contrato_id", contratoIds),
    ]);
    if (contratos.error) throw new Error(`No se pudieron cargar los contratos: ${contratos.error.message}`);
    if (actividades.error) throw new Error(`No se pudieron cargar las actividades: ${actividades.error.message}`);
    if (funciones.error) throw new Error(`No se pudieron cargar las funciones del contrato: ${funciones.error.message}`);
    state.contratoFunciones = (funciones.data || []).filter((f) => f.activo !== false && f.funcion_id);

    (contratos.data || [])
      .filter((c) => c.activo !== false)
      .forEach((c) => state.contratos.set(c.id, { id: c.id, contrato: c.contrato || `Contrato ${c.id}` }));
    state.actividades = actividades.data || [];
  }

  function contratosPosibles(row) {
    const dePersona = new Set(
      state.personalContratos
        .filter((x) => x.personal_id === row.personalId && vigente(x, row.fecha))
        .map((x) => x.contrato_id)
    );
    const comunes = state.instalacionContratos
      .filter((x) => x.instalacion_id === row.instalacionId && vigente(x, row.fecha) && dePersona.has(x.contrato_id))
      .map((x) => state.contratos.get(x.contrato_id))
      .filter(Boolean)
      .sort((a, b) => a.contrato.localeCompare(b.contrato, "es"));
    // El contrato del evento va primero aunque la persona no esté asignada a él.
    const delEvento = row.contratoEvento ? state.contratos.get(row.contratoEvento) : null;
    return [delEvento, ...comunes].filter(Boolean).filter((c, i, list) => list.findIndex((o) => o.id === c.id) === i);
  }

  // Eventos: los puestos de los historiales laborales vigentes de la persona ese día.
  // Programación: los de las actividades del contrato; sin actividades, todos.
  // Puestos posibles: los de los historiales laborales vigentes de la persona ese día.
  function puestosPosibles(row) {
    const ids = new Set(
      state.historiales
        .filter(
          (h) =>
            Number(h.personal_id) === row.personalId &&
            h.puesto_id &&
            h.fecha_alta <= row.fecha &&
            (!h.fecha_baja || h.fecha_baja >= row.fecha)
        )
        .map((h) => Number(h.puesto_id))
    );
    return [...ids]
      .map((id) => ({ id, puesto: state.puestos.get(id) || `Puesto ${id}` }))
      .sort((a, b) => a.puesto.localeCompare(b.puesto, "es"));
  }

  // Puesto propuesto: si solo hay un historial vigente, su puesto. Si hay varios, el de la
  // actividad de esa persona en esa instalación y contrato (o en el contrato) cuando
  // coincide con uno de ellos.
  function puestoPropuesto(row) {
    const posibles = puestosPosibles(row);
    if (posibles.length === 1) return String(posibles[0].id);
    const validos = new Set(posibles.map((p) => p.id));
    const contratoId = Number(row.contratoId);
    const candidatas = state.actividades.filter(
      (a) => a.contrato_id === contratoId && a.personal_id === row.personalId && validos.has(a.puesto_id)
    );
    const actividad = candidatas.find((a) => a.instalacion_id === row.instalacionId) || candidatas[0];
    return actividad ? String(actividad.puesto_id) : "";
  }

  /* ---------- registros ya existentes (para no duplicar) ---------- */

  async function loadExistentes(supabase, personalIds) {
    const fechas = state.rows.map((r) => r.fecha).sort();
    const rows = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("registros")
        .select("id, personal_id, fecha, hora_inicio, hora_fin, instalacion_id, evento_asignacion_id")
        .in("personal_id", personalIds)
        .gte("fecha", fechas[0])
        .lte("fecha", fechas[fechas.length - 1])
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(`No se pudieron comprobar los registros existentes: ${error.message}`);
      rows.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    return rows;
  }

  function spanOf(inicio, fin) {
    const start = toMinutes(inicio);
    if (start === null) return null;
    let end = toMinutes(fin);
    if (end === null) end = start;
    else if (end < start) end += 1440;
    return [start, end];
  }

  // Registro de la persona ese día cuyo horario se pisa con la jornada (los bordes que se
  // tocan no cuentan). Sin horario en el registro existente se toma como coincidente.
  function existenteDe(row) {
    if (row.asignacionId) {
      const generado = state.existentes.find((r) => String(r.evento_asignacion_id) === String(row.asignacionId));
      if (generado) return generado;
    }
    const span = spanOf(row.entrada, row.salida);
    return state.existentes.find((r) => {
      if (Number(r.personal_id) !== row.personalId || r.fecha !== row.fecha) return false;
      const other = spanOf(r.hora_inicio, r.hora_fin);
      if (!span || !other) return true;
      return span[0] < other[1] && other[0] < span[1];
    });
  }

  /* ---------- función y modalidad ---------- */

  const actividadVigente = (a, fecha) =>
    a.activo !== false && (!a.fecha_inicio || a.fecha_inicio <= fecha) && (!a.fecha_fin || a.fecha_fin >= fecha);

  function resolverFuncion(row) {
    if (state.source.funcionFija) {
      return { funcionId: state.source.funcionFija, modalidadId: null, actividadId: null };
    }
    const contratoId = Number(row.contratoId);
    const puestoId = Number(row.puestoId);
    const delContrato = state.actividades.filter((a) => a.contrato_id === contratoId && a.funcion_id);
    const exacta =
      delContrato.find(
        (a) =>
          a.personal_id === row.personalId &&
          a.instalacion_id === row.instalacionId &&
          a.puesto_id === puestoId &&
          actividadVigente(a, row.fecha)
      ) ||
      delContrato.find(
        (a) => a.personal_id === row.personalId && a.instalacion_id === row.instalacionId && a.puesto_id === puestoId
      );
    if (exacta) {
      return { funcionId: exacta.funcion_id, modalidadId: exacta.modalidad_id ?? null, actividadId: actividadVigente(exacta, row.fecha) ? exacta.id : null };
    }
    const conteo = new Map();
    delContrato
      .filter((a) => a.puesto_id === puestoId)
      .forEach((a) => {
        const key = `${a.funcion_id}|${a.modalidad_id ?? ""}`;
        conteo.set(key, (conteo.get(key) || 0) + 1);
      });
    const masUsada = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0];
    if (masUsada) {
      const [funcionId, modalidadId] = masUsada[0].split("|");
      return { funcionId: Number(funcionId), modalidadId: modalidadId ? Number(modalidadId) : null, actividadId: null };
    }
    const funciones = state.contratoFunciones.filter((f) => f.contrato_id === contratoId);
    if (funciones.length === 1) {
      return { funcionId: funciones[0].funcion_id, modalidadId: funciones[0].modalidad_id ?? null, actividadId: null };
    }
    return { funcionId: null, modalidadId: null, actividadId: null };
  }

  function prefill() {
    state.rows.forEach((row) => {
      row.existente = existenteDe(row) || null;
      if (row.existente) row.selected = false;
      const contratos = contratosPosibles(row);
      if (!row.contratoId && row.contratoEvento && state.contratos.has(row.contratoEvento)) {
        row.contratoId = String(row.contratoEvento);
      }
      if (!row.contratoId && contratos.length === 1) row.contratoId = String(contratos[0].id);
      if (!row.puestoId) row.puestoId = puestoPropuesto(row);
      syncFuncion(row);
    });
  }

  // Función propuesta según contrato y puesto (ver resolverFuncion). Si se eligió a mano
  // no se toca al cambiar contrato o puesto.
  function syncFuncion(row) {
    if (row.funcionManual) return;
    const r = row.contratoId || state.source.funcionFija ? resolverFuncion(row) : { funcionId: null, modalidadId: null, actividadId: null };
    row.funcionId = r.funcionId ? String(r.funcionId) : "";
    row.modalidadId = r.modalidadId ?? null;
    row.actividadId = r.actividadId ?? null;
  }

  // Elegida a mano: modalidad y actividad solo se conservan si coinciden con la propuesta;
  // si no, la modalidad sale de la tarifa del contrato para esa función.
  function setFuncionManual(row, value) {
    row.funcionManual = true;
    row.funcionId = value;
    const r = row.contratoId ? resolverFuncion(row) : { funcionId: null };
    if (value && String(r.funcionId) === value) {
      row.modalidadId = r.modalidadId ?? null;
      row.actividadId = r.actividadId ?? null;
      return;
    }
    const tarifa = state.contratoFunciones.find(
      (f) => f.contrato_id === Number(row.contratoId) && String(f.funcion_id) === value
    );
    row.modalidadId = tarifa?.modalidad_id ?? null;
    row.actividadId = null;
  }

  // Funciones del contrato (tarifas activas) más la propuesta, por si no está entre ellas.
  function funcionesPosibles(row) {
    const ids = new Set(
      state.contratoFunciones.filter((f) => f.contrato_id === Number(row.contratoId)).map((f) => Number(f.funcion_id))
    );
    if (row.funcionId) ids.add(Number(row.funcionId));
    if (state.source.funcionFija) ids.add(state.source.funcionFija);
    return [...ids]
      .map((id) => ({ id, funcion: state.funciones.get(id) || `Función ${id}` }))
      .sort((a, b) => a.funcion.localeCompare(b.funcion, "es"));
  }

  const funcionOptions = (row) =>
    `<option value="">— Sin función —</option>` +
    funcionesPosibles(row)
      .map((f) => `<option value="${f.id}" ${String(f.id) === row.funcionId ? "selected" : ""}>${esc(f.funcion)}</option>`)
      .join("");

  /* ---------- interfaz ---------- */

  function buildDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.id = "programming-registros-dialog";
    dialog.className = "facturacion-dialog programming-carga-dialog programming-registros-dialog";
    dialog.innerHTML = `
      <div class="facturacion-dialog-header">
        <h3 id="pr-title">Pasar a Registros</h3>
        <button type="button" data-pr-close aria-label="Cerrar">×</button>
      </div>
      <p class="inline-note" id="pr-intro"></p>
      <div class="programming-registros-bulk" id="pr-bulk"></div>
      <div id="pr-body" class="programming-carga-body"></div>
      <p id="pr-status" class="panel-status-message" role="status" aria-live="polite"></p>
      <div class="detail-actions programming-carga-footer">
        <button type="button" class="secondary-button" data-pr-close data-icon="close" data-icon-mode="icon-text">Cerrar</button>
        <span class="programming-carga-spacer"></span>
        <strong id="pr-count" class="programming-registros-count"></strong>
        <button type="button" id="pr-generate" data-icon="calendar" data-icon-mode="icon-text" disabled
          title="Crea un registro (situación NORM) por cada jornada marcada">Pasar a Registros</button>
      </div>`;
    document.body.appendChild(dialog);
    dialog.querySelectorAll("[data-pr-close]").forEach((b) => b.addEventListener("click", close));
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    $("#pr-body").addEventListener("change", onBodyChange);
    $("#pr-body").addEventListener("click", onSuggestClick);
    $("#pr-generate").addEventListener("click", () => void generate());
    $("#pr-bulk").addEventListener("change", onBulkChange);
    return dialog;
  }

  function setMsg(message = "", tone = "default") {
    const el = $("#pr-status");
    el.textContent = message;
    el.dataset.tone = tone;
  }

  async function open(sourceKey = "programacion") {
    buildDialog();
    state.source = SOURCES[sourceKey] || SOURCES.programacion;
    const { jornadas, unlinked } = state.source.build();
    state.rows = jornadas;
    state.unlinked = unlinked;
    setMsg("");
    $("#pr-title").textContent = state.source.title;
    $("#pr-bulk").innerHTML = "";
    $("#pr-body").innerHTML = '<p class="empty-state">Cargando contratos y puestos...</p>';
    renderIntro();
    if (!dialog.open) dialog.showModal();
    if (!jornadas.length) {
      $("#pr-body").innerHTML = `<p class="empty-state">${esc(state.source.empty)}</p>`;
      updateCount();
      return;
    }
    try {
      state.loading = true;
      await loadCatalogs();
      prefill();
      render();
    } catch (error) {
      $("#pr-body").innerHTML = "";
      setMsg(error.message, "error");
    } finally {
      state.loading = false;
      updateCount();
    }
  }

  function close() {
    dialog?.close();
  }

  function renderIntro() {
    $("#pr-intro").textContent = state.source.intro(state.rows, state.unlinked);
  }

  const tipoHoraOptions = (row) =>
    TIPOS_HORA.map((t) => `<option value="${t.id}" ${String(t.id) === row.tipoHoraId ? "selected" : ""}>${esc(t.label)}</option>`).join("");

  const contratoOptions = (row) => {
    const list = contratosPosibles(row);
    if (!list.length) return '<option value="">Sin contrato común</option>';
    return (
      `<option value="">— Elige contrato —</option>` +
      list.map((c) => `<option value="${c.id}" ${String(c.id) === row.contratoId ? "selected" : ""}>${esc(c.contrato)}</option>`).join("")
    );
  };

  const puestoOptions = (row) => {
    const posibles = puestosPosibles(row);
    if (!posibles.length) {
      return '<option value="">Sin historial laboral vigente</option>';
    }
    return (
      `<option value="">— Elige puesto —</option>` +
      posibles
        .map((p) => `<option value="${p.id}" ${String(p.id) === row.puestoId ? "selected" : ""}>${esc(p.puesto)}</option>`)
        .join("")
    );
  };

  // Opciones en pequeño bajo el desplegable sin elegir (mismo patrón que la carga de datos).
  const MAX_CHIPS = 6;
  function suggestionChips(field, options) {
    if (!options.length) return "";
    return `<div class="programming-carga-suggest">¿Quizá?
      ${options
        .slice(0, MAX_CHIPS)
        .map((o) => `<button type="button" class="secondary-button" data-pr-suggest="${field}" data-id="${o.id}">${esc(o.label)}</button>`)
        .join("")}</div>`;
  }

  const contratoChips = (row) =>
    row.contratoId ? "" : suggestionChips("contratoId", contratosPosibles(row).map((c) => ({ id: c.id, label: c.contrato })));

  // Primero los puestos que la persona ya tiene en sus actividades (de cualquier contrato).
  function puestoChips(row) {
    if (row.puestoId) return "";
    const suyos = new Set(state.actividades.filter((a) => a.personal_id === row.personalId).map((a) => a.puesto_id));
    const list = puestosPosibles(row).sort((a, b) => Number(suyos.has(b.id)) - Number(suyos.has(a.id)));
    return suggestionChips("puestoId", list.map((p) => ({ id: p.id, label: p.puesto })));
  }

  function isPending(row) {
    return row.selected && (!row.contratoId || !row.puestoId);
  }

  function rowHtml(row) {
    const weekday = getControlWeekdayInfo(row.fecha);
    const sinContrato = !contratosPosibles(row).length;
    return `<tr data-key="${esc(row.key)}" class="${isPending(row) ? "is-pending" : ""} ${row.selected ? "" : "is-off"}">
      <td><input type="checkbox" data-pr-select ${row.selected ? "checked" : ""} aria-label="Incluir jornada" /></td>
      <td class="programming-carga-day">
        <span class="weekday-marker records-date-weekday" style="color: ${esc(weekday.color)};" title="${esc(weekday.label)}">${esc(weekday.letter)}</span>
        ${esc(formatDisplayDate(row.fecha))}
      </td>
      <td>${esc(row.persona)}${
        row.existente
          ? `<span class="programming-registros-badge" title="${
              row.asignacionId && String(row.existente.evento_asignacion_id) === String(row.asignacionId)
                ? "Esta asignación ya generó su registro"
                : "La persona ya tiene un registro ese día que se solapa con esta jornada"
            }">Ya en Registros${
              row.existente.hora_inicio ? ` · ${esc(String(row.existente.hora_inicio).slice(0, 5))}–${esc(String(row.existente.hora_fin || "").slice(0, 5))}` : ""
            }</span>`
          : ""
      }</td>
      ${
        state.source.showEvento
          ? `<td${row.paso ? ` title="${esc(row.paso)}"` : ""}>${esc(row.evento)}</td>`
          : ""
      }
      <td>${esc(row.instalacion)}</td>
      <td><input type="time" data-pr-field="entrada" value="${esc(row.entrada)}" /></td>
      <td><input type="time" data-pr-field="salida" value="${esc(row.salida)}" /></td>
      <td class="num" data-pr-hours ${row.turnos ? `title="${row.turnos} turno(s) de programación"` : ""}>${esc(fmtHours(hoursBetween(row.entrada, row.salida)))}</td>
      ${state.source.tipoHoraEditable ? `<td><select data-pr-field="tipoHoraId" class="programming-registros-tipo">${tipoHoraOptions(row)}</select></td>` : ""}
      <td><select data-pr-field="contratoId" ${sinContrato ? "disabled" : ""}
        title="${sinContrato ? "La persona y la instalación no comparten ningún contrato vigente ese día" : ""}">${contratoOptions(row)}</select>${contratoChips(row)}</td>
      <td><select data-pr-field="puestoId">${puestoOptions(row)}</select>${puestoChips(row)}</td>
      <td><select data-pr-field="funcionId" class="${row.funcionId ? "" : "is-empty"}"
        title="${row.funcionId ? "" : "Sin función: el registro no tendrá tarifa en Facturación"}">${funcionOptions(row)}</select></td>
    </tr>`;
  }

  function renderBulk() {
    // Contrato para todas: solo los que son posibles en alguna fila marcada.
    const ids = new Map();
    state.rows.forEach((row) => contratosPosibles(row).forEach((c) => ids.set(c.id, c)));
    const contratos = [...ids.values()].sort((a, b) => a.contrato.localeCompare(b.contrato, "es"));
    if (contratos.length < 2) {
      $("#pr-bulk").innerHTML = "";
      return;
    }
    $("#pr-bulk").innerHTML = `
      <label>Contrato para todas las que lo admitan
        <select data-pr-bulk="contratoId">
          <option value="">—</option>
          ${contratos.map((c) => `<option value="${c.id}">${esc(c.contrato)}</option>`).join("")}
        </select>
      </label>`;
  }

  function render() {
    renderBulk();
    const allSelected = state.rows.every((r) => r.selected);
    $("#pr-body").innerHTML = `
      <div class="table-wrapper programming-carga-table programming-registros-table">
        <table>
          <thead><tr>
            <th><input type="checkbox" data-pr-select-all ${allSelected ? "checked" : ""} aria-label="Marcar todas" /></th>
            <th>Día</th><th>Persona</th>${state.source.showEvento ? "<th>Evento</th>" : ""}<th>Instalación</th>
            <th>Entrada</th><th>Salida</th><th>Horas</th>${state.source.tipoHoraEditable ? "<th>Tipo hora</th>" : ""}<th>Contrato</th><th>Puesto</th><th>Función</th>
          </tr></thead>
          <tbody>${state.rows.map(rowHtml).join("")}</tbody>
        </table>
      </div>`;
    updateCount();
  }

  function updateCount() {
    const selected = state.rows.filter((r) => r.selected);
    const pending = selected.filter(isPending).length;
    const horas = selected.reduce((sum, r) => sum + (hoursBetween(r.entrada, r.salida) || 0), 0);
    $("#pr-count").textContent = selected.length
      ? `${selected.length} ${selected.length === 1 ? "jornada" : "jornadas"} · ${fmtHours(Math.round(horas * 100) / 100)}` +
        (pending ? ` · ${pending} sin contrato o puesto` : "")
      : "Ninguna jornada marcada";
    const yaHechas = selected.filter((r) => r.existente).length;
    if (yaHechas) $("#pr-count").textContent += ` · ${yaHechas} ya en Registros`;
    $("#pr-generate").disabled = state.busy || state.loading || !selected.length || pending > 0;
  }

  /* ---------- creación de los registros ---------- */

  async function generate() {
    if (state.busy) return;
    const selected = state.rows.filter((r) => r.selected);
    if (!selected.length || selected.some(isPending)) return;
    const invalid = selected.find((r) => !hoursBetween(r.entrada, r.salida));
    if (invalid) {
      setMsg(`La jornada de ${invalid.persona} del ${formatDisplayDate(invalid.fecha)} no tiene un horario válido.`, "error");
      return;
    }

    state.busy = true;
    updateCount();
    setMsg("Comprobando historial laboral...");
    try {
      const supabase = await getSupabaseClient();
      const personalIds = [...new Set(selected.map((r) => r.personalId))];
      const fechas = selected.map((r) => r.fecha).sort();
      const { data: historiales, error: historialesError } = await supabase
        .from("historiales_laborales")
        .select("personal_id, empresa_id, fecha_alta, fecha_baja")
        .in("personal_id", personalIds)
        .lte("fecha_alta", fechas[fechas.length - 1])
        .or(`fecha_baja.is.null,fecha_baja.gte.${fechas[0]}`);
      if (historialesError) throw historialesError;
      const empresaDe = (personalId, fecha) =>
        (historiales || []).find(
          (h) => Number(h.personal_id) === personalId && h.fecha_alta <= fecha && (!h.fecha_baja || h.fecha_baja >= fecha)
        )?.empresa_id ?? null;

      const filas = [];
      const sinHistorial = new Set();
      const sinFuncion = new Set();
      selected.forEach((row) => {
        const empresaId = empresaDe(row.personalId, row.fecha);
        if (empresaId == null) {
          sinHistorial.add(`${row.persona} (${formatDisplayDate(row.fecha)})`);
          return;
        }
        const funcionId = row.funcionId ? Number(row.funcionId) : null;
        const modalidadId = funcionId ? row.modalidadId ?? null : null;
        const actividadId = funcionId ? row.actividadId ?? null : null;
        if (!funcionId) sinFuncion.add(`${row.persona} (${formatDisplayDate(row.fecha)})`);
        filas.push({
          fecha: row.fecha,
          personal_id: row.personalId,
          contrato_id: Number(row.contratoId),
          empresa_id: empresaId,
          instalacion_id: row.instalacionId,
          puesto_id: Number(row.puestoId),
          funcion_id: funcionId,
          modalidad_id: modalidadId,
          actividad_id: actividadId,
          situacion_id: SITUACION_NORM,
          tipo_hora_id: Number(row.tipoHoraId) || TIPO_HORA_REG,
          evento_asignacion_id: row.asignacionId ?? null,
          hora_inicio: `${row.entrada}:00`,
          hora_fin: `${row.salida}:00`,
          horas: hoursBetween(row.entrada, row.salida),
          activo: true,
          facturar: true,
          abonar: true,
          descanso: false,
          sustitucion: false,
          anio: Number(row.fecha.slice(0, 4)),
          observacion: state.source.observacion(row),
        });
      });

      if (!filas.length) {
        throw new Error(
          `Ninguna jornada tiene historial laboral vigente ese día: ${[...sinHistorial].join(", ")}. Sin empresa, las horas no entrarían en la nómina.`
        );
      }
      const yaHechas = selected.filter((r) => r.existente).length;
      const avisos = [
        sinHistorial.size ? `Se quedan fuera ${sinHistorial.size} jornada(s) sin historial laboral: ${[...sinHistorial].join(", ")}.` : "",
        sinFuncion.size ? `Irán sin función (revísalas en Registros): ${[...sinFuncion].join(", ")}.` : "",
        yaHechas ? `${yaHechas} jornada(s) marcadas se solapan con registros que ya existen.` : "",
      ].filter(Boolean);
      const horas = filas.reduce((sum, f) => sum + f.horas, 0);
      const porTipo = new Map();
      filas.forEach((f) => porTipo.set(tipoHoraLabel(f.tipo_hora_id), (porTipo.get(tipoHoraLabel(f.tipo_hora_id)) || 0) + 1));
      const tipos = [...porTipo.entries()].map(([tipo, n]) => (porTipo.size > 1 ? `${n} ${tipo}` : tipo)).join(", ");
      if (
        !window.confirm(
          `Se van a crear ${filas.length} registro${filas.length === 1 ? "" : "s"} (${tipos}; NORM) con ${fmtHours(Math.round(horas * 100) / 100)}.` +
            (avisos.length ? `\n\n${avisos.join("\n\n")}` : "") +
            "\n\n¿Continuar?"
        )
      ) {
        setMsg("");
        return;
      }

      setMsg("Creando registros...");
      const { error: insertError } = await supabase.from("registros").insert(filas);
      if (insertError) throw insertError;

      window.CoordinacionRegistros?.refresh?.();
      // Lo recién creado pasa a «Ya en Registros» y se desmarca.
      state.existentes = await loadExistentes(supabase, [...new Set(state.rows.map((r) => r.personalId))]);
      state.rows.forEach((row) => {
        row.existente = existenteDe(row) || null;
        if (row.existente) row.selected = false;
      });
      render();
      const mensaje = `Pasadas a Registros ${filas.length} jornada${filas.length === 1 ? "" : "s"}.${
        sinHistorial.size ? ` ${sinHistorial.size} sin historial quedaron fuera.` : ""
      }`;
      setMsg(mensaje, "success");
      setStatus(mensaje, "success");
    } catch (error) {
      setMsg(`No se pudieron crear los registros: ${error.message}`, "error");
    } finally {
      state.busy = false;
      updateCount();
    }
  }

  const findRow = (el) => state.rows.find((r) => r.key === el.closest("tr")?.dataset.key);

  function refreshRow(row) {
    const tr = $("#pr-body").querySelector(`tr[data-key="${CSS.escape(row.key)}"]`);
    if (tr) tr.outerHTML = rowHtml(row);
  }

  function onBodyChange(event) {
    const target = event.target;
    if (target.matches("[data-pr-select-all]")) {
      state.rows.forEach((r) => (r.selected = target.checked));
      render();
      return;
    }
    const row = findRow(target);
    if (!row) return;
    if (target.matches("[data-pr-select]")) {
      row.selected = target.checked;
    } else if (target.dataset.prField === "contratoId") {
      row.contratoId = target.value;
      if (!row.puestoId) row.puestoId = puestoPropuesto(row);
      syncFuncion(row);
    } else if (target.dataset.prField === "funcionId") {
      setFuncionManual(row, target.value);
    } else if (target.dataset.prField) {
      row[target.dataset.prField] = target.value;
      if (target.dataset.prField === "puestoId") syncFuncion(row);
      if (target.dataset.prField === "entrada" || target.dataset.prField === "salida") {
        row.existente = existenteDe(row) || null;
      }
    }
    refreshRow(row);
    updateCount();
  }

  function onSuggestClick(event) {
    const chip = event.target.closest("[data-pr-suggest]");
    if (!chip) return;
    const row = findRow(chip);
    if (!row) return;
    if (chip.dataset.prSuggest === "contratoId") {
      row.contratoId = chip.dataset.id;
      if (!row.puestoId) row.puestoId = puestoPropuesto(row);
    } else {
      row.puestoId = chip.dataset.id;
    }
    syncFuncion(row);
    refreshRow(row);
    updateCount();
  }

  function onBulkChange(event) {
    const target = event.target;
    if (target.dataset.prBulk !== "contratoId" || !target.value) return;
    let applied = 0;
    state.rows.forEach((row) => {
      if (!row.selected) return;
      if (!contratosPosibles(row).some((c) => String(c.id) === target.value)) return;
      if (row.contratoId !== target.value) {
        row.contratoId = target.value;
        if (!row.puestoId) row.puestoId = puestoPropuesto(row);
        syncFuncion(row);
      }
      applied += 1;
    });
    target.value = "";
    render();
    setMsg(`Contrato aplicado a ${applied} ${applied === 1 ? "jornada" : "jornadas"}.`);
  }

  window.CoordinacionPasarRegistros = { open };
})();
