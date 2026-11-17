(function () {
  "use strict";

  // Anexo informativo sobre condiciones laborales (RD 723/2026), por periodo de Historial laboral.
  //
  // Documento PDF aparte del informe de siempre (que no se toca). Una sola plantilla con las
  // 18 secciones del art. 3.2 del RD; los datos salen de: el periodo (historial), la persona, la
  // empresa (Mutua, algoritmos, documentos de igualdad), la ficha legal del convenio y la tarifa
  // vigente de la categoría del puesto. Lo que no consta sale como «PENDIENTE» y se lista en el
  // panel antes de generar.
  //
  // El constructor del documento (buildAnexo / renderAnexoPdf) no toca la base de datos ni el
  // DOM, para poder probarlo con datos de ejemplo (ver scripts/probar-anexo-rd723.mjs).

  const VERSION_TEXTO = "2026-11-17.7";

  const TIPOS = [
    ["alta", "Alta o nueva contratación"],
    ["subrogacion", "Subrogación"],
    ["variacion", "Variación"],
    ["llamamiento", "Llamamiento"],
    ["peticion", "A petición de la persona"],
  ];

  const DOCUMENTOS_EMPRESA = {
    plan_igualdad: "Plan de Igualdad",
    protocolo_acoso: "Protocolo de prevención y actuación frente al acoso sexual y por razón de sexo",
    protocolo_lgtbi: "Protocolo / medidas LGTBI",
    plan_desconexion_digital: "Plan de desconexión digital",
  };

  const CAMPOS_MANUALES = [
    ["periodo_actividad_estimado", "Periodo(s) estimado(s) de actividad", "textarea"],
    ["periodo_inactividad_estimado", "Periodo(s) estimado(s) de inactividad", "textarea"],
    ["duracion_estimada_periodo_actividad", "Duración estimada del periodo de actividad", "text"],
    ["jornada_anual_estimada_horas", "Jornada anual estimada (horas)", "number"],
    ["horas_complementarias_pct", "Horas complementarias: % máximo de la jornada semanal", "number"],
    ["horas_complementarias_preaviso", "Horas complementarias: preaviso", "text"],
    ["llamamiento_medio", "Medio habitual de llamamiento", "text"],
    ["llamamiento_contacto", "Datos de contacto de la persona (ficha de personal)", "text"],
    ["formacion_obligatoria_texto", "Formación obligatoria o prevista para el puesto", "textarea"],
    ["notas", "Notas internas (no salen en el PDF)", "textarea"],
  ];

  // ---------------------------------------------------------------------------
  // Utilidades de formato
  // ---------------------------------------------------------------------------

  const PENDIENTE = "[PENDIENTE]";

  function esVacio(valor) {
    return valor === null || valor === undefined || String(valor).trim() === "";
  }

  function fechaCorta(iso) {
    const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
  }

  function fechaLarga(iso) {
    const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return "";
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Separador de miles siempre (es-ES no lo pone en 4 cifras: 1073,09 -> 1.073,09).
  function conMiles(texto) {
    return texto.replace(/^(-?\d+)/, (entero) => entero.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  }

  function numero(valor, decimales = 2) {
    const n = Number(valor);
    if (!Number.isFinite(n)) return "";
    return conMiles(
      n.toLocaleString("es-ES", { minimumFractionDigits: decimales, maximumFractionDigits: decimales, useGrouping: false })
    );
  }

  function horas(valor) {
    const n = Number(valor);
    if (!Number.isFinite(n)) return "";
    // El separador de miles va siempre (el locale es-ES no lo pone en 4 cifras: 1742 -> 1.742).
    return n
      .toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: false })
      .replace(/^(-?\d+?)(?=(\d{3})+(?!\d))/, "$1.");
  }

  function euros(valor) {
    const t = numero(valor, 2);
    return t ? `${t} €` : "";
  }

  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }

  // Claves de contrato laboral (historiales_laborales_contratos) de tipo fijo discontinuo.
  const CLAVES_FIJO_DISCONTINUO = ["300", "309", "330", "350", "389"];

  function esFijoDiscontinuo(historial) {
    if (CLAVES_FIJO_DISCONTINUO.includes(String(historial.contrato_laboral_clave || "").trim())) return true;
    const texto = normalizar(
      [
        historial.contrato_laboral_jornada,
        historial.tipo_contratacion,
        historial.contrato_laboral_descripcion,
        historial.movimiento,
      ].join(" ")
    );
    return /discontinu|\bfd\b/.test(texto);
  }

  // Horas complementarias cuando la persona está a tiempo parcial. El máximo y el preaviso salen
  // de la ficha del convenio (V Instalaciones: 50 %, 3 días por escrito; Ocio no las regula y
  // aplica el Estatuto). Sin dato en el convenio: 30 % y 3 días, salvo situaciones de necesidad.
  // Se pueden cambiar por periodo.
  const HORAS_COMPLEMENTARIAS_ESTATUTO = { pct: 30, preaviso: "3 días, salvo situaciones de necesidad" };

  const BASES_COMPLEMENTO = { salario_base: "salario base", pluses: "pluses", complementos: "otros complementos" };

  // ---- Periodos de actividad (tramos de fechas ISO, extremos incluidos)
  function aMs(iso) {
    const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : NaN;
  }

  function aIso(ms) {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }

  const DIA_MS = 86400000;

  // Ordena y une los tramos que se tocan o solapan (varios contratos pueden repetir fechas).
  function unirPeriodos(periodos) {
    const validos = (periodos || [])
      .map((p) => ({ ini: aMs(p.fecha_inicio), fin: aMs(p.fecha_fin) }))
      .filter((p) => Number.isFinite(p.ini) && Number.isFinite(p.fin) && p.fin >= p.ini)
      .sort((a, b) => a.ini - b.ini);
    const unidos = [];
    validos.forEach((p) => {
      const ultimo = unidos[unidos.length - 1];
      if (ultimo && p.ini <= ultimo.fin + DIA_MS) ultimo.fin = Math.max(ultimo.fin, p.fin);
      else unidos.push({ ...p });
    });
    return unidos;
  }

  function textoPeriodos(periodos) {
    return unirPeriodos(periodos)
      .map((p) => `del ${fechaCorta(aIso(p.ini))} al ${fechaCorta(aIso(p.fin))}`)
      .join("; ");
  }

  // La inactividad es lo que queda entre dos tramos de actividad.
  function textoInactividad(periodos) {
    const unidos = unirPeriodos(periodos);
    if (!unidos.length) return "";
    if (unidos.length === 1) return "el tiempo no comprendido en el periodo de actividad";
    const huecos = [];
    for (let i = 1; i < unidos.length; i += 1) {
      huecos.push(`del ${fechaCorta(aIso(unidos[i - 1].fin + DIA_MS))} al ${fechaCorta(aIso(unidos[i].ini - DIA_MS))}`);
    }
    return huecos.join("; ");
  }

  // Semanas de actividad dentro de los 12 meses que empiezan en la fecha de alta.
  function semanasDeActividad(periodos, desdeIso) {
    const inicio = aMs(desdeIso);
    if (!Number.isFinite(inicio)) return 0;
    const fin = inicio + 364 * DIA_MS;
    let dias = 0;
    unirPeriodos(periodos).forEach((p) => {
      const a = Math.max(p.ini, inicio);
      const b = Math.min(p.fin, fin);
      if (b >= a) dias += Math.round((b - a) / DIA_MS) + 1;
    });
    return dias / 7;
  }

  // Jornada anual estimada: jornada semanal por 52 semanas o, si es fijo discontinuo, por las
  // semanas del periodo de actividad. Devuelve null si falta algún dato.
  function jornadaAnualEstimada(historial, fd, periodos) {
    const semanal = Number(historial.jornada);
    if (!Number.isFinite(semanal) || semanal <= 0) return null;
    if (!fd) return { horas: Math.round(semanal * 52), semanas: 52 };
    const semanas = semanasDeActividad(periodos, historial.fecha_alta);
    if (!semanas) return null;
    return { horas: Math.round(semanal * semanas), semanas: Math.round(semanas * 10) / 10 };
  }

  // Valores que el anexo propone si no se escribe otra cosa: salen del convenio, de la ficha de
  // personal y de los periodos del contrato. Aparecen ya en los campos del panel, y si se dejan
  // tal cual no se guardan (siguen al convenio); si se cambian, el cambio vale para este periodo.
  function calcularPredefinidos(datos) {
    const h = datos.historial || {};
    const convenio = datos.convenio || null;
    const persona = datos.persona || {};
    const fd = esFijoDiscontinuo(h);
    const maxSemanal = Number(h.jornada_maxima) || Number(convenio?.jornada_maxima_semanal_horas) || 0;
    const jornada = Number(h.jornada) || 0;
    const esParcial = (jornada > 0 && maxSemanal > 0 && jornada < maxSemanal) || /parcial/.test(normalizar(h.contrato_laboral_jornada));
    const pre = {};
    if (fd) {
      const actividad = textoPeriodos(datos.periodos);
      const inactividad = textoInactividad(datos.periodos);
      if (actividad) pre.periodo_actividad_estimado = actividad;
      if (inactividad) pre.periodo_inactividad_estimado = inactividad;
      pre.llamamiento_medio = "por escrito, mediante correo electrónico";
      const contacto = [
        persona.email ? `correo electrónico ${persona.email}` : "",
        persona.movil || persona.telefono ? `teléfono ${persona.movil || persona.telefono}` : "",
      ]
        .filter(Boolean)
        .join("; ");
      if (contacto) pre.llamamiento_contacto = contacto;
    }
    const anual = jornadaAnualEstimada(h, fd, datos.periodos);
    if (anual) pre.jornada_anual_estimada_horas = anual.horas;
    if (esParcial) {
      pre.horas_complementarias_pct = esVacio(convenio?.horas_complementarias_pct)
        ? HORAS_COMPLEMENTARIAS_ESTATUTO.pct
        : Number(convenio.horas_complementarias_pct);
      pre.horas_complementarias_preaviso = convenio?.horas_complementarias_preaviso || HORAS_COMPLEMENTARIAS_ESTATUTO.preaviso;
    }
    return pre;
  }

  // Une, borra y actualiza los tramos de actividad de un contrato para dejarlos como `filas`.
  async function sincronizarPeriodos(supabase, contratoId, filas, idsOriginales) {
    const actuales = filas.filter((p) => p.fecha_inicio && p.fecha_fin);
    const invalido = actuales.find((p) => p.fecha_fin < p.fecha_inicio);
    if (invalido) throw new Error("Un periodo termina antes de empezar.");
    const idsActuales = new Set(actuales.filter((p) => p.id).map((p) => p.id));
    const borrar = (idsOriginales || []).filter((id) => !idsActuales.has(id));
    if (borrar.length) {
      const { error } = await supabase.from("contratos_periodos_actividad").delete().in("id", borrar);
      if (error) throw error;
    }
    for (const p of actuales.filter((x) => x.id)) {
      const { error } = await supabase
        .from("contratos_periodos_actividad")
        .update({ fecha_inicio: p.fecha_inicio, fecha_fin: p.fecha_fin })
        .eq("id", p.id);
      if (error) throw error;
    }
    const nuevos = actuales
      .filter((x) => !x.id)
      .map((x) => ({ contrato_id: contratoId, fecha_inicio: x.fecha_inicio, fecha_fin: x.fecha_fin }));
    if (nuevos.length) {
      const { error } = await supabase.from("contratos_periodos_actividad").insert(nuevos);
      if (error) throw error;
    }
  }

  const UNIDAD_COMPLEMENTO = { mensual: "mensuales", diario: "por día trabajado", por_hora: "por hora" };

  function textoComplementoPersona(c) {
    const nombre = c.nombre || "Complemento";
    if (c.tipo === "porcentaje") {
      const bases = (c.bases_aplicables || []).map((b) => BASES_COMPLEMENTO[b] || b).join(", ");
      return `${nombre}: ${horas(c.porcentaje)} %${bases ? " sobre " + bases : ""}`;
    }
    if (c.tipo === "variable") return `${nombre}: importe variable pactado con la persona`;
    return `${nombre}: ${euros(c.importe)}${c.unidad ? " " + (UNIDAD_COMPLEMENTO[c.unidad] || c.unidad) : ""}`;
  }

  // ---------------------------------------------------------------------------
  // Contenido del anexo: lista de bloques + lista de pendientes
  // ---------------------------------------------------------------------------

  function buildAnexo(datos) {
    const pendientes = [];
    const avisos = [];
    const bloques = [];
    const h = datos.historial || {};
    const persona = datos.persona || {};
    const empresa = datos.empresa || {};
    const convenio = datos.convenio || null;
    const categoria = datos.categoria || null;
    const tarifa = datos.tarifa || null;
    const manual = datos.manual || {};
    const fd = esFijoDiscontinuo(h);
    const maxSemanalContrato = Number(h.jornada_maxima) || Number(convenio?.jornada_maxima_semanal_horas) || 0;
    const jornadaSemanal = Number(h.jornada) || 0;
    const esParcial =
      (jornadaSemanal > 0 && maxSemanalContrato > 0 && jornadaSemanal < maxSemanalContrato) ||
      /parcial/.test(normalizar(h.contrato_laboral_jornada));

    // Devuelve el valor o el marcador de pendiente (y lo anota).
    const dato = (valor, etiqueta) => {
      if (!esVacio(valor)) return String(valor);
      pendientes.push(etiqueta);
      return PENDIENTE;
    };
    const titulo = (texto, minimo) => bloques.push({ t: "h", texto, minimo });
    const parrafo = (texto) => bloques.push({ t: "p", texto });
    const punto = (texto) => bloques.push({ t: "li", texto });

    const nombreConvenio = convenio?.nombre || dato("", "Convenio aplicable (la categoría del puesto no tiene convenio asignado)");

    // ----- Cabecera
    bloques.push({
      t: "meta",
      filas: [
        ["EMPRESA", empresa.razon_social || empresa.empresa || dato("", "Empresa")],
        ["PERSONA TRABAJADORA", `${dato(persona.nombre, "Nombre de la persona")}${persona.dni ? " · " + persona.dni : ""}`],
        ["PUESTO", dato(h.puesto || h.puesto_texto, "Puesto")],
        ["GRUPO PROFESIONAL", dato(categoria?.grupo_nivel, "Grupo profesional (categoría de convenio del puesto)")],
        ["MODALIDAD", dato(h.contrato_laboral_descripcion || h.tipo_contratacion, "Modalidad de contratación")],
        ["FECHA DE INICIO", dato(fechaCorta(h.fecha_alta), "Fecha de inicio")],
      ],
    });

    parrafo(
      "El presente anexo complementa el contrato de trabajo e informa de los elementos esenciales de la relación laboral y de las principales condiciones de ejecución de la prestación, conforme al artículo 3 del Real Decreto 723/2026. Se entrega antes del inicio de la relación laboral o, si recoge una modificación, como tarde el día en que el cambio surta efecto."
    );

    // ----- 1. Puesto, funciones y centros
    titulo("1. Puesto, funciones y centros de trabajo");
    parrafo(
      `La persona trabajadora prestará servicios como ${dato(h.puesto || h.puesto_texto, "Puesto")}, encuadrada en ${
        categoria?.grupo_nivel ? "el grupo y nivel «" + categoria.grupo_nivel + "»" : dato("", "Grupo profesional")
      } de ${nombreConvenio}.`
    );
    if (categoria?.nivel) parrafo(`Categorías y funciones que recoge el convenio para este grupo: ${categoria.nivel}`);
    const centros = datos.centros || [];
    if (centros.length === 1) {
      parrafo(`Centro de trabajo habitual: ${centros[0]}.`);
    } else if (centros.length > 1) {
      parrafo(`La persona trabajadora presta servicios de forma habitual en diferentes centros de trabajo: ${centros.join("; ")}.`);
    } else {
      parrafo(`Centro o centros de trabajo: ${dato("", "Centro(s) de trabajo (no hay actividades asignadas en el periodo)")}.`);
    }
    if (empresa.direccion_pie) parrafo(`Domicilio de la empresa: ${empresa.direccion_pie}.`);
    parrafo("Cualquier movilidad se sujetará a la legislación y al convenio colectivo aplicables.");

    // ----- 2. Convenio
    titulo("2. Convenio colectivo aplicable");
    if (convenio) {
      let texto = `${convenio.nombre}, código ${dato(convenio.codigo, "Código del convenio")}`;
      if (convenio.boe_numero || convenio.boe_fecha) {
        texto += `, publicado en el BOE núm. ${convenio.boe_numero || PENDIENTE}, de ${fechaCorta(convenio.boe_fecha) || PENDIENTE}`;
      }
      if (convenio.vigente_hasta) {
        texto += `, con vigencia hasta el ${fechaCorta(convenio.vigente_hasta)}`;
        if (convenio.articulo_prorroga) texto += ` y el régimen de prórroga previsto en su ${convenio.articulo_prorroga}`;
        const hoy = datos.fecha_documento || "";
        if (hoy && convenio.vigente_hasta < hoy) {
          texto += ". Superada esa fecha, el convenio se mantiene en ultraactividad hasta que se firme el siguiente";
        }
      }
      parrafo(texto + ".");
    } else {
      parrafo(nombreConvenio);
    }

    // ----- 3. Carácter y periodos de actividad
    titulo(fd ? "3. Carácter fijo-discontinuo y periodos de actividad" : "3. Duración del contrato");
    if (fd) {
      parrafo(
        "La relación tiene carácter indefinido fijo-discontinuo por responder a una actividad intermitente o cíclica vinculada a los servicios contratados. La finalización de un periodo de actividad no implica por sí misma la extinción del contrato."
      );
      const textoActividad = manual.periodo_actividad_estimado || textoPeriodos(datos.periodos);
      const textoInactividadFd = manual.periodo_inactividad_estimado || textoInactividad(datos.periodos);
      punto(`Periodo(s) estimado(s) de actividad: ${dato(textoActividad, "Periodos de actividad (añádelos en el panel o en el contrato)")}`);
      punto(`Periodo(s) estimado(s) de inactividad: ${dato(textoInactividadFd, "Periodos de inactividad (se deducen de los de actividad)")}`);
      if (manual.duracion_estimada_periodo_actividad) {
        punto(`Duración estimada del periodo de actividad: ${manual.duracion_estimada_periodo_actividad}`);
      }
      parrafo("Las fechas concretas se determinarán mediante el llamamiento correspondiente.");
    } else {
      parrafo(
        `Fecha de comienzo de la relación laboral: ${dato(fechaLarga(h.fecha_alta), "Fecha de inicio")}. ${
          h.fecha_baja
            ? "Fecha de finalización prevista: " + fechaLarga(h.fecha_baja) + "."
            : "No consta fecha de finalización: la relación es de duración indefinida."
        }`
      );
      if (h.fecha_baja) {
        parrafo(`Causa habilitante y circunstancias que la justifican: ${dato("", "Causa habilitante de la contratación temporal y su conexión con la duración")}`);
      }
    }

    // ----- 4. Llamamiento (solo fijos discontinuos)
    if (fd) {
      titulo("4. Llamamiento");
      let texto = "El llamamiento se efectuará conforme a lo previsto en el convenio colectivo";
      if (convenio?.preaviso_llamamiento_articulo) texto += ` (${convenio.preaviso_llamamiento_articulo})`;
      texto += " y a la normativa vigente, por un medio que permita dejar constancia de la comunicación.";
      parrafo(texto);
      punto(
        `Preaviso ordinario aplicable: ${
          convenio?.preaviso_llamamiento_dias ? "al menos " + convenio.preaviso_llamamiento_dias + " días" : dato("", "Preaviso de llamamiento del convenio")
        }`
      );
      punto(`Medio habitual de llamamiento: ${manual.llamamiento_medio || "por escrito, mediante correo electrónico"}`);
      const contactoPersona = [
        persona.email ? `correo electrónico ${persona.email}` : "",
        persona.movil || persona.telefono ? `teléfono ${persona.movil || persona.telefono}` : "",
      ]
        .filter(Boolean)
        .join("; ");
      punto(
        `Datos de contacto de la persona trabajadora (constan en su ficha de personal): ${dato(
          manual.llamamiento_contacto || contactoPersona,
          "Datos de contacto de la persona (correo o teléfono en la tabla de personal)"
        )}`
      );
    }

    // ----- 5. Jornada, horario y descansos
    titulo("5. Jornada, horario y descansos");
    punto(`Jornada ordinaria contratada: ${h.jornada ? horas(h.jornada) + " horas semanales" : dato("", "Jornada semanal")}`);
    punto(`Horario inicialmente previsto: ${dato(datos.horario_texto || h.horarios, "Horario")}`);
    const anualCalculada = jornadaAnualEstimada(h, fd, datos.periodos);
    if (manual.jornada_anual_estimada_horas) {
      punto(`Jornada anual contractual o estimada: ${horas(manual.jornada_anual_estimada_horas)} horas`);
    } else if (anualCalculada) {
      punto(
        `Jornada anual estimada: ${horas(anualCalculada.horas)} horas (jornada semanal por ${horas(anualCalculada.semanas)} semanas${
          fd ? " de actividad" : ""
        })`
      );
    } else {
      punto(`Jornada anual contractual o estimada: ${dato("", "Jornada anual estimada (falta la jornada semanal o los periodos de actividad)")}`);
    }
    if (convenio?.jornada_maxima_anual_horas || convenio?.jornada_maxima_semanal_horas) {
      punto(
        `Jornada máxima de referencia a tiempo completo conforme al convenio: ${
          convenio.jornada_maxima_anual_horas ? horas(convenio.jornada_maxima_anual_horas) + " horas anuales" : ""
        }${convenio.jornada_maxima_anual_horas && convenio.jornada_maxima_semanal_horas ? " y " : ""}${
          convenio.jornada_maxima_semanal_horas ? horas(convenio.jornada_maxima_semanal_horas) + " horas semanales" : ""
        }`
      );
    }
    parrafo(
      "Si parte de la jornada se desarrolla en horario nocturno o a turnos, se identificará en el horario indicado. Los descansos diarios y semanales serán los previstos en el Estatuto de los Trabajadores y en el convenio colectivo aplicable."
    );

    // ----- 6. Distribución irregular y cambios de jornada
    titulo("6. Distribución irregular y cambios de jornada");
    parrafo(
      "La empresa no podrá aumentar o reducir libremente la jornada contratada en virtud de una autorización genérica incluida en este anexo. Las modificaciones de la duración o de la distribución de la jornada, y los cambios de turno, se efectuarán conforme al Estatuto de los Trabajadores y al convenio colectivo aplicable y, cuando sea jurídicamente necesario, mediante acuerdo con la persona trabajadora."
    );
    parrafo(
      "Si se aplicase distribución irregular de la jornada a lo largo del año, se informará por escrito del sistema de fijación, de los días y horas de referencia y de los preavisos de inicio y de cancelación, dentro de los límites legales y convencionales."
    );

    // ----- 7. Horas complementarias y extraordinarias
    titulo("7. Horas complementarias y extraordinarias");
    parrafo(
      "En los contratos a tiempo parcial, cualquier pacto de horas complementarias se formalizará por escrito en documento específico, conforme al artículo 12 del Estatuto de los Trabajadores y al convenio colectivo aplicable. El régimen de horas extraordinarias será el previsto legal y convencionalmente."
    );
    if (esParcial) {
      const pctConvenio = esVacio(convenio?.horas_complementarias_pct) ? HORAS_COMPLEMENTARIAS_ESTATUTO.pct : Number(convenio.horas_complementarias_pct);
      const pct = esVacio(manual.horas_complementarias_pct) ? pctConvenio : Number(manual.horas_complementarias_pct);
      const preaviso =
        manual.horas_complementarias_preaviso || convenio?.horas_complementarias_preaviso || HORAS_COMPLEMENTARIAS_ESTATUTO.preaviso;
      punto(`Las horas complementarias no podrán exceder del ${horas(pct)} % de la jornada semanal contratada.`);
      punto(`Preaviso para su realización: ${preaviso}.`);
      if (datos.convenio_es_ocio && pct > 30) {
        avisos.push(
          "Horas complementarias: el IV Convenio de Ocio no las regula y el Estatuto (art. 12.5) limita el máximo al 30 % de las horas ordinarias; solo un convenio puede subirlo (hasta el 60 %). Revisa el porcentaje de este periodo."
        );
      }
    } else {
      punto("Jornada a tiempo completo: no procede el pacto de horas complementarias.");
    }

    // ----- 8. Retribución
    titulo("8. Retribución");
    if (tarifa && (tarifa.salario_anual || tarifa.salario_mensual)) {
      const maxSemanal = Number(h.jornada_maxima) || Number(convenio?.jornada_maxima_semanal_horas) || 0;
      const jornada = Number(h.jornada) || 0;
      const proporcion = maxSemanal > 0 && jornada > 0 && jornada < maxSemanal ? jornada / maxSemanal : 1;
      const anual = Number(tarifa.salario_anual) || Number(tarifa.salario_mensual) * (Number(tarifa.pagas_anuales) || 14);
      const nombreCategoria = categoria?.grupo_nivel || h.puesto || "la categoría";
      parrafo(
        `La retribución se determina conforme a ${nombreCategoria} de ${nombreConvenio}, en proporción a la jornada contratada.${
          datos.convenio_es_ocio ? " Se aplica la Tabla A del anexo 3 del convenio." : ""
        } Tarifa vigente desde el ${fechaCorta(tarifa.vigente_desde)}.`
      );
      punto(`Salario base anual de referencia a jornada completa: ${euros(anual)}`);
      if (proporcion < 1) {
        punto(
          `Referencia proporcional para ${horas(jornada)} horas semanales sobre ${horas(maxSemanal)}: ${euros(anual * proporcion)} anuales (referencia para un año completo de actividad)`
        );
      }
      if (tarifa.pagas_anuales) {
        const extras = Math.max(0, Number(tarifa.pagas_anuales) - 12);
        punto(
          `El convenio fija ${horas(tarifa.pagas_anuales)} pagas anuales. ${
            extras ? "Las " + horas(extras) + " pagas extraordinarias se prorratean y se abonan" : "Se abonan"
          } en las doce mensualidades: referencia mensual con la prorrata incluida, ${euros((anual * proporcion) / 12)}`
        );
      }
      if (Number(tarifa.complemento_dedicacion) > 0) punto(`Complemento de dedicación: ${euros(tarifa.complemento_dedicacion)} mensuales`);
      if (Number(tarifa.plus_transporte) > 0) punto(`Plus de transporte: ${euros(tarifa.plus_transporte)} (importe fijado en la tarifa del convenio)`);
      if (Number(tarifa.plus_hora_nocturna) > 0) punto(`Plus de nocturnidad: ${euros(tarifa.plus_hora_nocturna)} por hora nocturna`);
      if (Number(tarifa.hora_complementaria) > 0) punto(`Hora complementaria: ${euros(tarifa.hora_complementaria)}`);
    } else {
      parrafo(`Salario base y complementos: ${dato("", "Tarifa de convenio vigente para la categoría del puesto")}`);
    }
    punto("Pagas extraordinarias: todas se prorratean, es decir, se abonan repartidas en las doce mensualidades.");
    const complementosPersona = (datos.complementos_persona || []).map(textoComplementoPersona);
    const marcasPeriodo = [
      h.tiene_complemento_movilidad && "movilidad",
      h.tiene_complemento_dedicacion && "dedicación",
      h.tiene_plus_transporte && "plus de transporte",
      h.tiene_nocturnidad && "nocturnidad",
      h.tiene_antiguedad && "antigüedad",
    ].filter(Boolean);
    if (complementosPersona.length || marcasPeriodo.length || h.complemento) {
      punto("Complementos salariales adicionales de la persona:");
      complementosPersona.forEach((c) => bloques.push({ t: "li", texto: c, nivel: 2 }));
      if (marcasPeriodo.length) {
        bloques.push({ t: "li", texto: `Indicados en el periodo: ${marcasPeriodo.join(", ")} (cuantía conforme a la tarifa del convenio)`, nivel: 2 });
      }
      if (h.complemento) bloques.push({ t: "li", texto: String(h.complemento), nivel: 2 });
    } else {
      punto("Complementos salariales adicionales: los que establece el convenio, indicados arriba; la persona no tiene otros.");
    }
    const hayVariables =
      Number(tarifa?.plus_hora_nocturna) > 0 ||
      Number(tarifa?.hora_complementaria) > 0 ||
      (datos.complementos_persona || []).some((c) => c.tipo === "variable" || c.unidad === "por_hora");
    punto(
      hayVariables
        ? "Conceptos salariales variables: nocturnidad, horas complementarias y complementos por hora. Se abonan en función de las horas efectivamente realizadas en cada periodo de nómina, a las tarifas indicadas."
        : "Conceptos salariales variables: no hay."
    );
    punto("Periodicidad y método de pago: mensual, mediante transferencia bancaria.");
    parrafo("La referencia salarial no se expresa únicamente como «según convenio»: las cuantías indicadas son las de la tarifa vigente.");

    // ----- 9. Periodo de prueba
    titulo("9. Periodo de prueba");
    parrafo(`Periodo de prueba: ${dato(convenio?.periodo_prueba_texto, "Periodo de prueba (ficha del convenio)")}`);
    parrafo(
      "Durante el periodo de prueba se aplican las condiciones, derechos y obligaciones previstos en el Estatuto de los Trabajadores y en el convenio colectivo. Antes de pactarlo debe comprobarse que no existe una relación anterior que impida un nuevo periodo de prueba para las mismas funciones."
    );

    // ----- 10. Vacaciones
    titulo("10. Vacaciones");
    parrafo(
      `Duración: ${
        convenio?.vacaciones_dias
          ? convenio.vacaciones_notas || convenio.vacaciones_dias + " días por año completo de servicios, o la parte proporcional que corresponda."
          : dato("", "Vacaciones (ficha del convenio)")
      }`
    );
    parrafo("El periodo o periodos de disfrute se fijan conforme al convenio colectivo, al calendario de vacaciones de la empresa y a la normativa laboral aplicable.");

    // ----- 11. Formación
    titulo("11. Formación");
    parrafo(
      "La persona trabajadora tiene los derechos de formación previstos en la legislación laboral y en el convenio colectivo. La formación que la empresa deba proporcionar por exigencia legal, convencional o vinculada al puesto se realizará en las condiciones que correspondan."
    );
    if (manual.formacion_obligatoria_texto) punto(`Formación obligatoria o prevista para el puesto: ${manual.formacion_obligatoria_texto}`);

    // ----- 12. Sistemas algorítmicos
    titulo("12. Sistemas algorítmicos o automatizados");
    if (empresa.usa_sistemas_algoritmicos) {
      parrafo("La empresa utiliza los siguientes sistemas algorítmicos o automatizados de toma de decisiones:");
      parrafo(dato(empresa.sistemas_algoritmicos_detalle, "Descripción, finalidad y reglas de los sistemas algorítmicos"));
    } else {
      parrafo(
        "La empresa no utiliza sistemas algorítmicos o automatizados de toma de decisiones para determinar, fijar, variar o modificar las condiciones de trabajo de esta persona (duración y distribución de la jornada, asignación de tareas, salarios, progresión profesional, lugar de trabajo o extinción del contrato)."
      );
      parrafo(
        "Las herramientas informáticas de control horario y de planificación de turnos solo registran y proponen: las decisiones las adopta siempre una persona."
      );
    }

    // ----- 13. Igualdad, conciliación, acoso y LGTBI
    titulo("13. Igualdad, conciliación, acoso y medidas LGTBI");
    const docs = datos.documentos || [];
    Object.keys(DOCUMENTOS_EMPRESA).forEach((tipo) => {
      const doc = docs.find((d) => d.tipo === tipo && d.ruta_storage);
      if (doc) {
        punto(
          `${DOCUMENTOS_EMPRESA[tipo]}: existe${
            doc.se_adjunta
              ? " y se adjunta a este anexo"
              : " y se ha facilitado a la persona trabajadora en la documentación inicial"
          }.`
        );
      } else {
        punto(`${DOCUMENTOS_EMPRESA[tipo]}: no consta.`);
        pendientes.push(`${DOCUMENTOS_EMPRESA[tipo]} (no hay documento adjunto en la empresa)`);
      }
    });
    parrafo("La política de conciliación de la empresa, cuando adapta o desarrolla el mínimo legal, se recoge en el Plan de Igualdad.");
    parrafo(`Lugar o medio en que la persona trabajadora puede consultar estos documentos: ${dato(empresa.lugar_consulta_documentos, "Lugar o medio de consulta de los documentos (ficha de la empresa)")}`);

    // ----- 14. Seguridad Social y Mutua
    titulo("14. Seguridad Social, Mutua y previsión social");
    if (empresa.mutua_nombre) {
      parrafo(
        `Mutua colaboradora con la Seguridad Social: ${empresa.mutua_nombre}${empresa.mutua_numero ? ", n.º " + empresa.mutua_numero : ""}.${
          empresa.mutua_direccion ? " Dirección: " + empresa.mutua_direccion + "." : ""
        }${empresa.mutua_telefono ? " Teléfono: " + empresa.mutua_telefono + "." : ""}`
      );
      if (empresa.mutua_instrucciones) parrafo(`En caso de accidente o incidente: ${empresa.mutua_instrucciones}`);
    } else {
      parrafo(`Mutua colaboradora con la Seguridad Social: ${dato("", "Mutua de la empresa (ficha de la empresa)")}`);
    }
    parrafo("La empresa no tiene establecidas mejoras voluntarias de la acción protectora de la Seguridad Social ni promueve planes o fondos de pensiones.");

    // ----- 15. Extinción
    titulo("15. Extinción, cese voluntario y preavisos");
    parrafo(
      "La extinción del contrato se regirá por las causas, requisitos formales, procedimientos y efectos establecidos en el Estatuto de los Trabajadores, en el convenio colectivo y en la demás normativa aplicable."
    );
    if (convenio?.preaviso_cese_dias || convenio?.preaviso_cese_notas) {
      parrafo(
        `Cese voluntario de la persona trabajadora: ${
          convenio.preaviso_cese_notas || "preaviso de " + convenio.preaviso_cese_dias + " días"
        }`
      );
    } else {
      parrafo(`Cese voluntario: ${dato("", "Preaviso de cese voluntario (ficha del convenio)")}`);
    }

    // ----- 16. Modificación de condiciones
    titulo("16. Modificación de condiciones");
    parrafo(
      "Las condiciones esenciales no pueden entenderse modificables por una autorización genérica previa. Las modificaciones se sujetarán al procedimiento legal y convencional correspondiente, incluidos, cuando procedan, los artículos 12, 40 y 41 del Estatuto de los Trabajadores. Toda modificación de la información de este anexo se comunicará por escrito como tarde el día en que el cambio surta efecto."
    );

    // ----- 17. Suspensión e inactividad
    titulo("17. Suspensión e inactividad");
    parrafo(
      "No se establece una suspensión automática del contrato por la mera suspensión del servicio al que esté adscrita la persona trabajadora: las suspensiones deben responder a una causa legal o convencional."
    );
    if (fd) {
      parrafo(
        "Los periodos de inactividad del contrato fijo-discontinuo se regirán por el artículo 16 del Estatuto de los Trabajadores y por el convenio colectivo aplicable."
      );
    }

    // ----- 18. Entrega y recepción
    // La firma no se queda sola en otra página: se reserva sitio para apartado, texto y firmas.
    titulo("18. Entrega y constancia de recepción", 95);
    parrafo(
      "La persona trabajadora declara haber recibido este documento y disponer de acceso a la información y documentos identificados en él. La firma acredita la recepción del anexo, sin que suponga renuncia a derechos legales o convencionales."
    );
    bloques.push({ t: "entrega" });

    return { bloques, pendientes: Array.from(new Set(pendientes)), avisos, nombreConvenio };
  }

  // ---------------------------------------------------------------------------
  // PDF (jsPDF)
  // ---------------------------------------------------------------------------

  function renderAnexoPdf(jsPDFClass, datos, anexo) {
    const doc = new jsPDFClass({ orientation: "portrait", unit: "mm", format: "a4" });
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const margen = 18;
    const margenInferior = 20;
    const anchoUtil = ancho - margen * 2;
    let y = 20;

    const hueco = (altoNecesario) => {
      if (y + altoNecesario <= alto - margenInferior) return;
      doc.addPage();
      y = margen;
    };
    const texto = (cadena, { negrita = false, tamano = 9.5, sangria = 0, alto: lh = 4.6, despues = 1.6 } = {}) => {
      doc.setFont("helvetica", negrita ? "bold" : "normal");
      doc.setFontSize(tamano);
      const lineas = doc.splitTextToSize(String(cadena), anchoUtil - sangria);
      hueco(lineas.length * lh + despues);
      doc.text(lineas, margen + sangria, y);
      y += lineas.length * lh + despues;
    };

    // Cabecera: logo centrado, título y convenio
    const logo = datos.empresa?.logo_data_url || null;
    if (logo) {
      try {
        doc.addImage(logo, "PNG", (ancho - 34) / 2, y, 34, 18, undefined, "FAST");
        y += 22;
      } catch (_e) {
        // Un logo ilegible no impide emitir el anexo.
      }
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("ANEXO INFORMATIVO SOBRE CONDICIONES LABORALES", ancho / 2, y, { align: "center" });
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const sub = doc.splitTextToSize(`Real Decreto 723/2026 · ${anexo.nombreConvenio}`, anchoUtil);
    doc.text(sub, ancho / 2, y, { align: "center" });
    y += sub.length * 4.4 + 4;

    anexo.bloques.forEach((b) => {
      if (b.t === "meta") {
        const col = 52;
        b.filas.forEach(([k, v]) => {
          const lineas = doc.splitTextToSize(String(v), anchoUtil - col - 4);
          const altoFila = Math.max(7, lineas.length * 4.4 + 3);
          hueco(altoFila);
          doc.setDrawColor(150, 150, 150);
          doc.setFillColor(232, 236, 241);
          doc.rect(margen, y, col, altoFila, "FD");
          doc.rect(margen + col, y, anchoUtil - col, altoFila);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.text(k, margen + 2, y + 4.6);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text(lineas, margen + col + 2, y + 4.6);
          y += altoFila;
        });
        y += 4;
      } else if (b.t === "h") {
        y += 2;
        hueco(b.minimo || 14);
        texto(b.texto, { negrita: true, tamano: 10.5, despues: 1.2 });
      } else if (b.t === "p") {
        texto(b.texto);
      } else if (b.t === "li") {
        texto(`${b.nivel === 2 ? "–" : "•"}  ${b.texto}`, { sangria: b.nivel === 2 ? 10 : 4 });
      } else if (b.t === "entrega") {
        y += 2;
        hueco(60);
        texto("Medio de entrega:  [   ] Papel    [   ] Electrónico            Fecha de entrega: ____ / ____ / ________", { despues: 8 });
        const centroIzq = margen + anchoUtil * 0.25;
        const centroDer = margen + anchoUtil * 0.75;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.text("Por la empresa", centroIzq, y, { align: "center" });
        doc.text("La persona trabajadora", centroDer, y, { align: "center" });
        y += 3;
        const firma = datos.empresa?.firma_data_url;
        if (firma) {
          try {
            doc.addImage(firma, "PNG", centroIzq - 21, y, 42, 16, undefined, "FAST");
          } catch (_e) {
            // Si la firma guardada no es una imagen válida, se deja el hueco.
          }
        }
        y += 22;
        doc.setFont("helvetica", "bold");
        doc.text(datos.empresa?.firmante_nombre || datos.empresa?.razon_social || "", centroIzq, y, { align: "center", maxWidth: anchoUtil / 2 - 6 });
        doc.text(datos.persona?.nombre || "", centroDer, y, { align: "center", maxWidth: anchoUtil / 2 - 6 });
        y += 4.6;
        doc.setFont("helvetica", "normal");
        doc.text(datos.empresa?.firmante_cargo || "", centroIzq, y, { align: "center", maxWidth: anchoUtil / 2 - 6 });
        doc.text(datos.persona?.dni || "", centroDer, y, { align: "center" });
        y += 6;
      }
    });

    // Pie con fecha y numeración
    const total = doc.getNumberOfPages();
    const ciudad = datos.ciudad || datos.empresa?.ciudad_firma || "Oviedo";
    for (let i = 1; i <= total; i += 1) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      doc.text(`${ciudad}, ${fechaLarga(datos.fecha_documento)} · texto ${VERSION_TEXTO}`, margen, alto - 9);
      doc.text(`Página ${i} de ${total}`, ancho - margen, alto - 9, { align: "right" });
      doc.setTextColor(0, 0, 0);
    }
    return doc;
  }

  // ---------------------------------------------------------------------------
  // Acceso a datos y panel (solo en el navegador)
  // ---------------------------------------------------------------------------

  const state = { initialized: false, datos: null, historial: null, anexo: null, periodos: {}, periodosOriginales: {}, opciones: {} };
  const el = {};

  function q(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function hoyIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function setStatus(mensaje, tono = "") {
    if (!el.status) return;
    el.status.textContent = mensaje || "";
    el.status.dataset.tone = tono;
  }

  async function getClient() {
    if (!window.SupabaseApp?.getClient) throw new Error("El cliente de Supabase no está disponible.");
    return window.SupabaseApp.getClient();
  }

  async function porId(supabase, tabla, id) {
    if (!id) return null;
    const { data, error } = await supabase.from(tabla).select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  }

  function resumenHorarioActividad(fila) {
    const grupos = window.CoordinacionActividades?.scheduleRangeGroups?.(fila);
    if (grupos?.length) {
      return grupos
        .map((g) => `${g.days || ""} ${String(g.hora_inicio || "").slice(0, 5)}-${String(g.hora_fin || "").slice(0, 5)}`.trim())
        .join("; ");
    }
    const rango = [String(fila.hora_inicio || "").slice(0, 5), String(fila.hora_fin || "").slice(0, 5)].filter(Boolean).join("-");
    return [fila.dias_semana, rango].filter(Boolean).join(" ");
  }

  async function cargarDatos(historial) {
    const supabase = await getClient();
    const inicio = historial.fecha_alta || hoyIso();

    const [persona, empresa, puesto, documentos, manualRes, actividadesRes] = await Promise.all([
      porId(supabase, "personal", historial.personal_id),
      porId(supabase, "empresas", historial.empresa_id),
      porId(supabase, "puestos", historial.puesto_id),
      historial.empresa_id
        ? supabase
            .from("empresas_documentos")
            .select("tipo, se_adjunta, nombre_archivo, ruta_storage")
            .eq("empresa_id", historial.empresa_id)
            .then((r) => (r.error ? [] : r.data || []))
        : [],
      supabase.from("historiales_laborales_rd723").select("*").eq("historial_id", historial.id).maybeSingle(),
      (() => {
        let consulta = supabase
          .from("actividades_detalle")
          .select("*")
          .eq("personal_id", historial.personal_id)
          .or(`fecha_fin.is.null,fecha_fin.gte.${inicio}`)
          .order("fecha_inicio", { ascending: true })
          .limit(200);
        if (historial.fecha_baja) consulta = consulta.lte("fecha_inicio", historial.fecha_baja);
        if (historial.empresa_id != null) consulta = consulta.eq("empresa_id", historial.empresa_id);
        return consulta;
      })(),
    ]);
    if (manualRes.error) throw manualRes.error;
    const actividades = actividadesRes.error ? [] : actividadesRes.data || [];

    const categoria = await porId(supabase, "convenios_categorias", puesto?.convenio_id);
    const convenio = categoria?.convenio_id ? await porId(supabase, "convenios", categoria.convenio_id) : null;
    let tarifa = null;
    if (categoria?.id) {
      const { data } = await supabase
        .from("convenios_categorias_salarios")
        .select("*")
        .eq("convenio_categoria_id", categoria.id)
        .lte("vigente_desde", inicio)
        .order("vigente_desde", { ascending: false })
        .limit(1);
      tarifa = data?.[0] || null;
    }

    const centros = Array.from(new Set(actividades.map((a) => String(a.instalacion || "").trim()).filter(Boolean)));
    const horarios = Array.from(new Set(actividades.map(resumenHorarioActividad).filter(Boolean))).join("; ");

    // Contratos de servicio en los que trabaja la persona (los de sus actividades) y sus tramos
    // de actividad, que es donde se guardan los periodos de los fijos discontinuos.
    const contratos = [];
    actividades.forEach((a) => {
      if (a.contrato_id != null && !contratos.some((c) => c.id === a.contrato_id)) {
        contratos.push({ id: a.contrato_id, nombre: a.contrato || `Contrato ${a.contrato_id}` });
      }
    });
    let periodosContrato = [];
    if (contratos.length) {
      const { data, error } = await supabase
        .from("contratos_periodos_actividad")
        .select("id, contrato_id, fecha_inicio, fecha_fin")
        .in("contrato_id", contratos.map((c) => c.id))
        .order("fecha_inicio", { ascending: true });
      if (!error) periodosContrato = data || [];
    }

    // Complementos propios de la persona vigentes en la fecha de inicio.
    let complementosPersona = [];
    {
      const { data, error } = await supabase
        .from("personal_complementos")
        .select("*")
        .eq("personal_id", historial.personal_id)
        .lte("fecha_desde", inicio)
        .or(`fecha_hasta.is.null,fecha_hasta.gte.${inicio}`);
      if (!error && data?.length) {
        const ids = Array.from(new Set(data.map((c) => c.complemento_id).filter((v) => v != null)));
        const nombres = {};
        if (ids.length) {
          const cat = await supabase.from("nomina_conceptos_catalogo").select("id, nombre").in("id", ids);
          (cat.data || []).forEach((c) => {
            nombres[c.id] = c.nombre;
          });
        }
        complementosPersona = data.map((c) => ({ ...c, nombre: nombres[c.complemento_id] || "Complemento" }));
      }
    }

    return {
      persona: {
        nombre: persona?.personal || historial.personal || "",
        dni: persona?.dni || historial.dni || "",
        genero: persona?.genero || "",
        email: persona?.email || "",
        movil: persona?.movil || "",
        telefono: persona?.telefono || "",
      },
      empresa: empresa || {},
      historial,
      categoria,
      convenio,
      convenio_es_ocio: String(convenio?.codigo || "") === "99100055012011",
      tarifa,
      centros,
      horario_texto: historial.horarios || horarios,
      documentos,
      manual: manualRes.data || {},
      contratos,
      periodosContrato,
      periodos: periodosContrato,
      complementos_persona: complementosPersona,
    };
  }

  function pintarPanel() {
    const { datos, anexo } = state;
    el.title.textContent = `${datos.persona.nombre || "Periodo"} · ${fechaCorta(datos.historial.fecha_alta)}`;
    el.resumen.innerHTML = [
      ["Convenio", anexo.nombreConvenio],
      ["Grupo", datos.categoria?.grupo_nivel || "—"],
      ["Tarifa vigente", datos.tarifa ? `${euros(datos.tarifa.salario_anual)} anuales desde ${fechaCorta(datos.tarifa.vigente_desde)}` : "—"],
      ["Centros", datos.centros.length ? datos.centros.join("; ") : "—"],
      ["Modalidad", datos.historial.contrato_laboral_descripcion || datos.historial.tipo_contratacion || "—"],
    ]
      .map(([k, v]) => `<span><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</span>`)
      .join("");
    el.pendientes.innerHTML = anexo.pendientes.length
      ? `<strong>Pendiente de completar (${anexo.pendientes.length}):</strong><ul>${anexo.pendientes.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`
      : "<strong>No falta ningún dato.</strong>";
    el.pendientes.dataset.estado = anexo.pendientes.length ? "pendiente" : "completo";
    el.avisos.innerHTML = anexo.avisos?.length
      ? `<strong>A revisar:</strong><ul>${anexo.avisos.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>`
      : "";
    el.avisos.classList.toggle("hidden", !anexo.avisos?.length);
  }

  // ---- Periodos de actividad del contrato (solo fijos discontinuos)
  function aplanarPeriodos() {
    const filas = [];
    Object.entries(state.periodos).forEach(([contratoId, lista]) => {
      lista.forEach((p) => {
        if (p.fecha_inicio && p.fecha_fin) filas.push({ contrato_id: Number(contratoId), fecha_inicio: p.fecha_inicio, fecha_fin: p.fecha_fin });
      });
    });
    return filas;
  }

  function pintarPeriodos() {
    const { datos } = state;
    const mostrar = esFijoDiscontinuo(datos.historial) && datos.contratos.length > 0;
    el.periodosBloque.classList.toggle("hidden", !mostrar);
    if (!mostrar) return;
    el.periodosLista.innerHTML = datos.contratos
      .map((c) => {
        const filas = state.periodos[c.id] || [];
        return `<div class="historial-anexo-contrato" data-contrato="${c.id}">
          <p><strong>${escapeHtml(c.nombre)}</strong></p>
          ${filas
            .map(
              (p, i) => `<div class="historial-anexo-periodo" data-indice="${i}">
                <input type="date" data-campo="fecha_inicio" value="${escapeHtml(p.fecha_inicio || "")}" aria-label="Inicio del periodo de actividad" />
                <input type="date" data-campo="fecha_fin" value="${escapeHtml(p.fecha_fin || "")}" aria-label="Fin del periodo de actividad" />
                <button type="button" class="secondary-button" data-quitar aria-label="Quitar periodo">✕</button>
              </div>`
            )
            .join("")}
          <button type="button" class="secondary-button" data-anadir>+ Añadir periodo</button>
        </div>`;
      })
      .join("");
  }

  async function guardarPeriodos() {
    const supabase = await getClient();
    for (const contrato of state.datos.contratos) {
      // eslint-disable-next-line no-await-in-loop
      await sincronizarPeriodos(supabase, contrato.id, state.periodos[contrato.id] || [], state.periodosOriginales[contrato.id]);
    }
    // Recarga los ids reales de lo guardado.
    const ids = state.datos.contratos.map((c) => c.id);
    const { data, error } = await supabase
      .from("contratos_periodos_actividad")
      .select("id, contrato_id, fecha_inicio, fecha_fin")
      .in("contrato_id", ids)
      .order("fecha_inicio", { ascending: true });
    if (error) throw error;
    cargarPeriodosEnEstado(data || []);
  }

  function cargarPeriodosEnEstado(filas) {
    state.periodos = {};
    state.periodosOriginales = {};
    state.datos.contratos.forEach((c) => {
      const propios = filas.filter((f) => f.contrato_id === c.id);
      state.periodos[c.id] = propios.map((f) => ({ id: f.id, fecha_inicio: f.fecha_inicio, fecha_fin: f.fecha_fin }));
      state.periodosOriginales[c.id] = propios.map((f) => f.id);
    });
  }

  // Rellena con lo predefinido los campos vacíos o que aún tenían el valor predefinido anterior
  // (al cambiar los periodos se actualizan solos; lo escrito a mano no se pisa).
  function sincronizarPredefinidos() {
    const nuevo = calcularPredefinidos(state.datos);
    const anterior = state.predef || {};
    CAMPOS_MANUALES.forEach(([clave]) => {
      const campo = el.form.elements[clave];
      if (!campo) return;
      const actual = String(campo.value).trim();
      const ant = anterior[clave] === undefined || anterior[clave] === null ? "" : String(anterior[clave]);
      const nue = nuevo[clave] === undefined || nuevo[clave] === null ? "" : String(nuevo[clave]);
      if (actual === "" || actual === ant) campo.value = nue;
    });
    state.predef = nuevo;
  }

  function alCambiarPeriodos() {
    state.datos.periodos = aplanarPeriodos();
    sincronizarPredefinidos();
    recalcular();
  }

  function leerFormulario() {
    const manual = {};
    CAMPOS_MANUALES.forEach(([clave, , tipo]) => {
      const campo = el.form.elements[clave];
      const valor = campo ? String(campo.value).trim() : "";
      const pre = state.predef?.[clave];
      const igualAlPredefinido =
        pre !== undefined && pre !== null && (tipo === "number" ? Number(valor.replace(",", ".")) === Number(pre) : valor === String(pre));
      manual[clave] = valor === "" || igualAlPredefinido ? null : tipo === "number" ? Number(valor.replace(",", ".")) : valor;
    });
    return manual;
  }

  function recalcular() {
    state.datos.manual = leerFormulario();
    if (typeof state.opciones?.documentos === "function") state.datos.documentos = state.opciones.documentos();
    state.datos.periodos = aplanarPeriodos();
    state.datos.tipo = el.tipo.value;
    state.datos.fecha_documento = el.fecha.value || hoyIso();
    state.datos.ciudad = el.ciudad.value.trim() || state.datos.empresa.ciudad_firma || "Oviedo";
    state.anexo = buildAnexo(state.datos);
    pintarPanel();
  }

  async function guardarManual() {
    const supabase = await getClient();
    const manual = leerFormulario();
    const fila = { historial_id: state.historial.id, ...manual };
    const { error } = await supabase.from("historiales_laborales_rd723").upsert(fila, { onConflict: "historial_id" });
    if (error) throw error;
    return manual;
  }

  async function generarPdf() {
    recalcular();
    const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
    const doc = renderAnexoPdf(jsPDF, state.datos, state.anexo);
    const nombre = [state.datos.persona.nombre, "Anexo RD 723-2026", state.datos.fecha_documento]
      .filter(Boolean)
      .join(" - ")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const bytes = doc.output("arraybuffer");
    const unido = typeof state.opciones?.ensamblar === "function" ? await state.opciones.ensamblar(bytes) : null;
    if (!unido) {
      doc.save(`${nombre}.pdf`);
      return nombre;
    }
    const url = URL.createObjectURL(unido);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${nombre}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return nombre;
  }

  // PDF del anexo con los datos guardados (sin abrir el panel): para la vista previa del panel de
  // informe. Devuelve un Blob con el anexo y los anexos marcados, en su orden.
  async function generarBlob(historial, opciones = {}) {
    const datos = await cargarDatos(historial);
    datos.tipo = "alta";
    datos.fecha_documento = opciones.fechaDocumento || hoyIso();
    datos.ciudad = opciones.ciudad || datos.empresa.ciudad_firma || "Oviedo";
    if (typeof opciones.documentos === "function") datos.documentos = opciones.documentos();
    const anexo = buildAnexo(datos);
    const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");
    const bytes = renderAnexoPdf(jsPDF, datos, anexo).output("arraybuffer");
    const unido = typeof opciones.ensamblar === "function" ? await opciones.ensamblar(bytes) : null;
    return unido || new Blob([bytes], { type: "application/pdf" });
  }

  function cerrar() {
    el.panel.classList.add("hidden");
  }

  async function open(historial, opciones = {}) {
    init();
    state.opciones = opciones || {};
    if (!historial?.id) {
      window.alert("Abre un periodo de historial laboral antes de generar el anexo.");
      return;
    }
    el.panel.classList.remove("hidden");
    el.content.classList.add("hidden");
    setStatus("Cargando datos del anexo…");
    try {
      state.historial = historial;
      state.datos = await cargarDatos(historial);
      el.fecha.value = state.opciones.fechaDocumento || hoyIso();
      el.ciudad.value = state.opciones.ciudad || state.datos.empresa.ciudad_firma || "Oviedo";
      el.tipo.value = "alta";
      cargarPeriodosEnEstado(state.datos.periodosContrato);
      pintarPeriodos();
      state.datos.periodos = aplanarPeriodos();
      state.predef = {};
      const manual = state.datos.manual || {};
      CAMPOS_MANUALES.forEach(([clave]) => {
        const campo = el.form.elements[clave];
        if (campo) campo.value = manual[clave] ?? "";
      });
      sincronizarPredefinidos();
      recalcular();
      el.content.classList.remove("hidden");
      setStatus("");
    } catch (error) {
      setStatus(`No se pudo preparar el anexo: ${error?.message || error}`, "error");
    }
  }

  function init() {
    if (state.initialized) return;
    const panel = document.createElement("section");
    panel.id = "historial-anexo-panel";
    panel.className = "detail-panel hidden";
    panel.innerHTML = `
      <div id="historial-anexo-overlay" class="detail-overlay"></div>
      <aside class="detail-drawer records-detail-drawer">
        <div class="detail-header">
          <div>
            <p class="eyebrow">Anexo RD 723/2026</p>
            <h3 id="historial-anexo-title">Anexo informativo</h3>
          </div>
          <div class="detail-header-actions">
            <button id="historial-anexo-close-button" type="button" class="secondary-button">Cerrar</button>
          </div>
        </div>
        <p id="historial-anexo-status" class="panel-status-message"></p>
        <div id="historial-anexo-content" class="hidden">
          <div id="historial-anexo-resumen" class="results-summary"></div>
          <div id="historial-anexo-pendientes" class="historial-anexo-pendientes"></div>
          <div id="historial-anexo-avisos" class="historial-anexo-avisos hidden"></div>
          <div id="historial-anexo-periodos" class="hidden">
            <h4>Periodos de actividad del contrato</h4>
            <p class="muted-text">Se guardan en el contrato de servicio y valen para todo su personal fijo-discontinuo. La inactividad se deduce de ellos.</p>
            <div id="historial-anexo-periodos-lista"></div>
            <div class="toolbar-actions">
              <button id="historial-anexo-periodos-save-button" type="button" class="secondary-button">Guardar periodos</button>
            </div>
          </div>
          <form id="historial-anexo-form" class="form-grid">
            <label>
              Tipo de entrega
              <select id="historial-anexo-tipo" name="tipo">
                ${TIPOS.map(([v, t]) => `<option value="${v}">${escapeHtml(t)}</option>`).join("")}
              </select>
            </label>
            <label>
              Fecha del documento
              <input id="historial-anexo-fecha" type="date" />
            </label>
            <label>
              Ciudad
              <input id="historial-anexo-ciudad" type="text" />
            </label>
            <h4 class="full-width">Datos de este periodo</h4>
            <p class="muted-text full-width">Los datos predefinidos (convenio, ficha de personal y periodos del contrato) ya aparecen rellenos. Puedes cambiarlos para este periodo; si los dejas igual, siguen al convenio.</p>
            ${CAMPOS_MANUALES.map(([clave, etiqueta, tipo]) =>
              tipo === "textarea"
                ? `<label class="full-width">${escapeHtml(etiqueta)}<textarea name="${clave}" rows="2"></textarea></label>`
                : `<label>${escapeHtml(etiqueta)}<input name="${clave}" type="${tipo === "number" ? "number" : "text"}"${tipo === "number" ? ' step="any"' : ""} /></label>`
            ).join("")}
            <div class="toolbar-actions full-width">
              <button id="historial-anexo-save-button" type="button" class="secondary-button">Guardar datos</button>
              <button id="historial-anexo-pdf-button" type="button">Generar PDF</button>
            </div>
          </form>
        </div>
      </aside>`;
    document.body.appendChild(panel);
    const style = document.createElement("style");
    style.textContent =
      "#historial-anexo-pendientes{margin:.5rem 0 1rem;padding:.6rem .8rem;border-radius:6px;font-size:.9rem}" +
      "#historial-anexo-pendientes[data-estado=pendiente]{background:#fff4d6;border:1px solid #e3b341}" +
      "#historial-anexo-pendientes[data-estado=completo]{background:#e6f4ea;border:1px solid #6bb27c}" +
      "#historial-anexo-pendientes ul,#historial-anexo-avisos ul{margin:.3rem 0 0 1.1rem;padding:0}" +
      "#historial-anexo-avisos{margin:.5rem 0 1rem;padding:.6rem .8rem;border-radius:6px;font-size:.9rem;background:#e8f1fb;border:1px solid #79a6d9}" +
      ".historial-anexo-periodo{display:flex;gap:.5rem;align-items:center;margin:.3rem 0}" +
      ".historial-anexo-contrato{margin:.6rem 0}";
    document.head.appendChild(style);

    Object.assign(el, {
      panel,
      content: q("#historial-anexo-content"),
      status: q("#historial-anexo-status"),
      title: q("#historial-anexo-title"),
      resumen: q("#historial-anexo-resumen"),
      pendientes: q("#historial-anexo-pendientes"),
      avisos: q("#historial-anexo-avisos"),
      periodosBloque: q("#historial-anexo-periodos"),
      periodosLista: q("#historial-anexo-periodos-lista"),
      form: q("#historial-anexo-form"),
      tipo: q("#historial-anexo-tipo"),
      fecha: q("#historial-anexo-fecha"),
      ciudad: q("#historial-anexo-ciudad"),
    });
    q("#historial-anexo-close-button").addEventListener("click", cerrar);
    q("#historial-anexo-overlay").addEventListener("click", cerrar);
    el.form.addEventListener("input", () => state.datos && recalcular());
    el.form.addEventListener("submit", (e) => e.preventDefault());
    el.periodosLista.addEventListener("input", (e) => {
      const campo = e.target.closest("input[data-campo]");
      if (!campo) return;
      const contrato = campo.closest("[data-contrato]").dataset.contrato;
      const indice = Number(campo.closest("[data-indice]").dataset.indice);
      state.periodos[contrato][indice][campo.dataset.campo] = campo.value;
      alCambiarPeriodos();
    });
    el.periodosLista.addEventListener("click", (e) => {
      const contenedor = e.target.closest("[data-contrato]");
      if (!contenedor) return;
      const contrato = contenedor.dataset.contrato;
      if (e.target.closest("[data-anadir]")) {
        state.periodos[contrato].push({ fecha_inicio: "", fecha_fin: "" });
        pintarPeriodos();
      } else if (e.target.closest("[data-quitar]")) {
        const indice = Number(e.target.closest("[data-indice]").dataset.indice);
        state.periodos[contrato].splice(indice, 1);
        pintarPeriodos();
        alCambiarPeriodos();
      }
    });
    q("#historial-anexo-periodos-save-button").addEventListener("click", async () => {
      try {
        setStatus("Guardando periodos…");
        await guardarPeriodos();
        pintarPeriodos();
        alCambiarPeriodos();
        setStatus("Periodos de actividad guardados.", "ok");
      } catch (error) {
        setStatus(`No se pudieron guardar los periodos: ${error?.message || error}`, "error");
      }
    });
    q("#historial-anexo-save-button").addEventListener("click", async () => {
      try {
        setStatus("Guardando…");
        await guardarManual();
        setStatus("Datos guardados.", "ok");
      } catch (error) {
        setStatus(`No se pudo guardar: ${error?.message || error}`, "error");
      }
    });
    q("#historial-anexo-pdf-button").addEventListener("click", async () => {
      try {
        setStatus("Generando PDF…");
        const nombre = await generarPdf();
        setStatus(`PDF generado: ${nombre}.pdf`, "ok");
      } catch (error) {
        setStatus(`No se pudo generar el PDF: ${error?.message || error}`, "error");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !el.panel.classList.contains("hidden")) cerrar();
    });
    state.initialized = true;
  }

  // ---- Periodos de actividad en el panel de Contratos (sección #contract-activity-periods-section)
  const pc = { id: null, filas: [], originales: [], iniciado: false };

  function estadoContrato(mensaje, tono = "") {
    const nodo = q("#contract-activity-periods-status");
    if (!nodo) return;
    nodo.textContent = mensaje || "";
    nodo.dataset.tone = tono;
  }

  function pintarContrato() {
    const lista = q("#contract-activity-periods-list");
    if (!lista) return;
    lista.innerHTML = pc.filas.length
      ? pc.filas
          .map(
            (p, i) => `<div class="historial-anexo-periodo" data-indice="${i}">
              <input type="date" data-campo="fecha_inicio" value="${escapeHtml(p.fecha_inicio || "")}" aria-label="Inicio del periodo de actividad" />
              <input type="date" data-campo="fecha_fin" value="${escapeHtml(p.fecha_fin || "")}" aria-label="Fin del periodo de actividad" />
              <button type="button" class="secondary-button" data-quitar aria-label="Quitar periodo">✕</button>
            </div>`
          )
          .join("")
      : '<p class="muted-text">Este contrato no tiene periodos de actividad.</p>';
  }

  function iniciarContrato() {
    if (pc.iniciado) return;
    const seccion = q("#contract-activity-periods-section");
    if (!seccion) return;
    pc.iniciado = true;
    seccion.addEventListener("input", (e) => {
      const campo = e.target.closest("input[data-campo]");
      if (!campo) return;
      pc.filas[Number(campo.closest("[data-indice]").dataset.indice)][campo.dataset.campo] = campo.value;
    });
    seccion.addEventListener("click", (e) => {
      if (e.target.closest("#contract-activity-periods-add-button")) {
        pc.filas.push({ fecha_inicio: "", fecha_fin: "" });
        pintarContrato();
      } else if (e.target.closest("[data-quitar]")) {
        pc.filas.splice(Number(e.target.closest("[data-indice]").dataset.indice), 1);
        pintarContrato();
      }
    });
    q("#contract-activity-periods-save-button")?.addEventListener("click", async () => {
      try {
        estadoContrato("Guardando periodos…");
        const supabase = await getClient();
        await sincronizarPeriodos(supabase, Number(pc.id), pc.filas, pc.originales);
        await mostrarPeriodosContrato(pc.id, { forzar: true });
        estadoContrato("Periodos de actividad guardados.", "ok");
      } catch (error) {
        estadoContrato(`No se pudieron guardar los periodos: ${error?.message || error}`, "error");
      }
    });
  }

  async function mostrarPeriodosContrato(contratoId, { forzar = false } = {}) {
    iniciarContrato();
    if (!contratoId || !pc.iniciado) return;
    if (!forzar && String(pc.id) === String(contratoId)) return;
    pc.id = contratoId;
    pc.filas = [];
    pc.originales = [];
    pintarContrato();
    try {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from("contratos_periodos_actividad")
        .select("id, fecha_inicio, fecha_fin")
        .eq("contrato_id", Number(contratoId))
        .order("fecha_inicio", { ascending: true });
      if (error) throw error;
      if (String(pc.id) !== String(contratoId)) return;
      pc.filas = (data || []).map((f) => ({ id: f.id, fecha_inicio: f.fecha_inicio, fecha_fin: f.fecha_fin }));
      pc.originales = pc.filas.map((f) => f.id);
      pintarContrato();
      estadoContrato("");
    } catch (error) {
      estadoContrato(`No se pudieron cargar los periodos: ${error?.message || error}`, "error");
    }
  }

  if (typeof window !== "undefined") {
    window.CoordinacionPeriodosContrato = { mostrar: mostrarPeriodosContrato };
    window.CoordinacionRd723Anexo = { open, generarBlob, buildAnexo, renderAnexoPdf, VERSION_TEXTO };
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { buildAnexo, renderAnexoPdf, VERSION_TEXTO, jornadaAnualEstimada, textoPeriodos, textoInactividad, calcularPredefinidos };
  }
})();
