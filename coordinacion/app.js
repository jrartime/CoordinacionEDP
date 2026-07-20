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
const PROGRAMMING_FETCH_PAGE_SIZE = 1000;
const PROGRAMMING_TYPE_OPTIONS = [
  { value: PROGRAMMING_TYPE_FS, label: "Programación FS" },
  { value: PROGRAMMING_TYPE_WEEKLY, label: "Programación semanal" },
];
const PRIVATE_TAB_STORAGE_KEY = "curriculos_private_tab";
const CONCILIA_CLONED_TABS = [
  { key: "concilia_alumnado", label: "Concilia Alumnado" },
  { key: "concilia_asistencia", label: "Concilia Asistencia" },
  { key: "concilia_nee", label: "Concilia NEE" },
  { key: "concilia_disponibilidad", label: "Concilia Disponibilidad" },
  { key: "concilia_asignaciones", label: "Concilia Asignaciones" },
];
const CONCILIA_TAB_KEY = "concilia";
const CONCILIA_LEGACY_TAB_KEYS = new Set(CONCILIA_CLONED_TABS.map((tab) => tab.key));
const COORDINATION_LEGACY_TAB_ALIASES = {
  concilia_actividades: "actividades",
};
const CONCILIA_MODULE_BY_TAB_KEY = {
  concilia: "alumnado",
  concilia_alumnado: "alumnado",
  concilia_asistencia: "asistencia",
  concilia_nee: "nee",
  concilia_disponibilidad: "disponibilidad",
  concilia_asignaciones: "asignaciones",
  actividades: "actividades",
};
const PRIVATE_TAB_TARGETS = new Set([
  "programming",
  "control",
  "events",
  "concilia",
  "search",
  "personal",
  "contracts",
  "actividades",
  "registros",
  "historial",
  "gestion",
  "contabilidad",
  "settings",
]);
let ACCESS_ASSIGNABLE_TABS = [
  { key: "programming", label: "Programación" },
  { key: "control", label: "Control personal" },
  { key: "events", label: "Eventos" },
  { key: "concilia", label: "Concilia" },
  { key: "search", label: "Candidaturas" },
  { key: "personal", label: "Personal" },
  { key: "contracts", label: "Contratos" },
  { key: "actividades", label: "Actividades" },
  { key: "registros", label: "Registros" },
  { key: "historial", label: "Historial laboral" },
  { key: "gestion", label: "Gestión" },
  { key: "contabilidad", label: "Contabilidad" },
  { key: "settings", label: "Configuración" },
];
const ACCESS_ASSIGNABLE_TABS_FALLBACK = [...ACCESS_ASSIGNABLE_TABS];
const RECORD_COLUMNS = [
  { key: "id", label: "ID", type: "number", readonly: true, hiddenInList: true },
  { key: "personal_id", label: "Personal", type: "number", relationLabelKey: "personal", sortable: true },
  { key: "fecha", label: "Fecha", type: "date", sortable: true },
  { key: "actividad_id", label: "Actividad", type: "number", hiddenInList: true },
  { key: "empresa_id", label: "Empresa", type: "number", relationLabelKey: "empresa", sortable: true, hiddenInList: true },
  { key: "contrato_id", label: "Contrato", type: "number", relationLabelKey: "contrato", sortable: true },
  { key: "servicio_id", label: "Servicio", type: "number", relationLabelKey: "servicio", sortable: true },
  { key: "titular_personal_id", label: "Titular", type: "number", relationLabelKey: "titular_personal", derived: true, readonly: true, hiddenInList: true },
  { key: "sustituto_personal_id", label: "Sustituto", type: "number", relationLabelKey: "sustituto_personal", derived: true, readonly: true, hiddenInList: true },
  { key: "sustituye_registro_id", label: "Sustituye a registro", type: "number", readonly: true, hiddenInList: true },
  { key: "instalacion_id", label: "Instalacion", type: "number", relationLabelKey: "instalacion", sortable: true, shortLabelKey: "instalacion_siglas" },
  { key: "categoria_id", label: "Categoria", type: "number", hiddenInList: true },
  { key: "puesto_id", label: "Puesto", type: "number", relationLabelKey: "puesto", sortable: true, stackWith: ["funcion_id", "modalidad_id"] },
  { key: "funcion_id", label: "Funcion", type: "number", relationLabelKey: "funcion", hiddenInList: true },
  { key: "modalidad_id", label: "Modalidad", type: "number", relationLabelKey: "modalidad", sortable: true, hiddenInList: true },
  { key: "nota", label: "Nota", type: "text", hiddenInList: true },
  { key: "hora_inicio", label: "Inicio", type: "time", sortable: true },
  { key: "hora_fin", label: "Fin", type: "time", sortable: true },
  { key: "horas", label: "Horas", type: "decimal", sortable: true },
  { key: "hc", label: "HC", type: "decimal", hiddenInList: true },
  { key: "hf", label: "HF", type: "decimal", hiddenInList: true },
  { key: "hm", label: "HM", type: "decimal", hiddenInList: true },
  { key: "hd", label: "HD", type: "decimal", hiddenInList: true },
  { key: "bolsa_horas", label: "Bolsa horas", type: "decimal", hiddenInList: true },
  { key: "horas_diurnas", label: "H. diurnas", type: "decimal", hiddenInList: true },
  { key: "horas_nocturnas", label: "H. nocturnas", type: "decimal", hiddenInList: true },
  { key: "clases", label: "Clases", type: "decimal", hiddenInList: true },
  { key: "horas_2", label: "Horas 2", type: "decimal", hiddenInList: true },
  { key: "sustitucion", label: "Sustitucion", type: "boolean" },
  { key: "facturar", label: "Facturar", type: "boolean" },
  { key: "abonar", label: "Abonar", type: "boolean" },
  { key: "tipo_hora_id", label: "Tipo hora", type: "number", relationLabelKey: "tipo_hora", sortable: true },
  { key: "situacion_id", label: "Situacion", type: "number", relationLabelKey: "situacion", sortable: true },
  { key: "anio", label: "Anio", type: "number", hiddenInList: true },
  { key: "observacion", label: "Observacion", type: "textarea", hiddenInList: true },
  { key: "control", label: "Control", type: "datetime", hiddenInList: true },
  { key: "factura", label: "Factura", type: "text", hiddenInList: true },
];
const RECORD_DETAIL_LABEL_COLUMNS = [
  "empresa",
  "servicio",
  "contrato",
  "personal",
  "dni",
  "titular_personal",
  "sustituto_personal",
  "instalacion",
  "instalacion_siglas",
  "puesto",
  "funcion",
  "modalidad",
  "tipo_hora",
  "situacion",
  "apunte_abonado",
  "apunte_facturado",
  "apunte_neto",
];
const RECORD_SELECT_COLUMNS = Array.from(
  new Set([...RECORD_COLUMNS.map((column) => column.key), ...RECORD_DETAIL_LABEL_COLUMNS])
).join(",");
const RECORDS_LOAD_LIMIT = 5000;
const RECORD_EMPTY_FILTER_VALUE = "__record_filter_empty__";
const RECORD_BULK_UNSET_VALUE = "__unset__";
const RECORD_BULK_EMPTY_VALUE = "__empty__";
const RECORD_NUMERIC_FIELDS = new Set(
  RECORD_COLUMNS.filter((column) => ["number", "decimal"].includes(column.type)).map(
    (column) => column.key
  )
);
const SETTINGS_CATALOGS = {
  puestos: {
    label: "Puestos",
    singularLabel: "puesto",
    table: "puestos",
    order: "puesto",
    columns: "id,puesto,detalle_puesto,siglas,convenio_id,categoria_id,dea,rec_medico,epi,clausula_preferencia,activo",
    fields: [
      { key: "id", label: "ID", type: "number", required: true, readonlyOnEdit: true },
      { key: "puesto", label: "Puesto", type: "text", required: true },
      { key: "activo", label: "Activo", type: "checkbox" },
      { key: "detalle_puesto", label: "Detalle", type: "textarea" },
      { key: "siglas", label: "Siglas", type: "text" },
      { key: "convenio_id", label: "Convenio (categoría) ID", type: "number" },
      { key: "categoria_id", label: "Categoría ID", type: "number" },
      { key: "rec_medico", label: "Reconocimiento médico", type: "number" },
      { key: "dea", label: "DEA", type: "checkbox" },
      { key: "epi", label: "EPI", type: "checkbox" },
      { key: "clausula_preferencia", label: "Cláusula preferencia", type: "checkbox" },
    ],
    listFields: ["puesto", "detalle_puesto", "activo"],
    titleField: "puesto",
    usageReferences: [
      { table: "actividades", label: "Actividades", column: "puesto_id" },
      { table: "registros", label: "Registros", column: "puesto_id" },
      { table: "historiales_laborales", label: "Historiales laborales", column: "puesto_id" },
    ],
  },
  funciones: {
    label: "Funciones",
    singularLabel: "función",
    table: "funciones",
    order: "funcion",
    columns: "id,funcion,siglas,grupo,formacion_horario,activo",
    fields: [
      { key: "id", label: "ID", type: "number", required: true, readonlyOnEdit: true },
      { key: "funcion", label: "Función", type: "text", required: true },
      { key: "activo", label: "Activo", type: "checkbox" },
      { key: "siglas", label: "Siglas", type: "text" },
      { key: "grupo", label: "Grupo", type: "text" },
      { key: "formacion_horario", label: "Formación horario", type: "checkbox" },
    ],
    listFields: ["funcion", "grupo", "activo"],
    titleField: "funcion",
    usageReferences: [
      { table: "actividades", label: "Actividades", column: "funcion_id" },
      { table: "registros", label: "Registros", column: "funcion_id" },
    ],
  },
  modalidades: {
    label: "Modalidades",
    singularLabel: "modalidad",
    table: "modalidades",
    order: "modalidad",
    columns: "id,modalidad,siglas,activo",
    fields: [
      { key: "id", label: "ID", type: "number", required: true, readonlyOnEdit: true },
      { key: "modalidad", label: "Modalidad", type: "text", required: true },
      { key: "activo", label: "Activo", type: "checkbox" },
      { key: "siglas", label: "Siglas", type: "text" },
    ],
    listFields: ["modalidad", "activo"],
    titleField: "modalidad",
    usageReferences: [
      { table: "actividades", label: "Actividades", column: "modalidad_id" },
      { table: "registros", label: "Registros", column: "modalidad_id" },
    ],
  },
  empresas: {
    label: "Empresas",
    singularLabel: "empresa",
    table: "empresas",
    order: "empresa",
    columns:
      "id,empresa,razon_social,cif,logo_url,logo_data_url,logo_alt,firma_data_url,firmante_nombre,firmante_dni,firmante_cargo,ciudad_firma,direccion_pie,telefono_pie,email_pie,web_pie,notas",
    fallbackColumns: "id,empresa,razon_social,cif",
    fallbackFieldKeys: ["id", "empresa", "razon_social", "cif"],
    fields: [
      { key: "id", label: "ID", type: "number", required: true, readonlyOnEdit: true },
      { key: "empresa", label: "Empresa", type: "text", required: true },
      { key: "razon_social", label: "Razón social", type: "text", required: true },
      { key: "cif", label: "CIF", type: "text" },
      { key: "logo_data_url", label: "Logo guardado", type: "file-data-url" },
      { key: "logo_url", label: "Logo URL alternativa", type: "text" },
      { key: "logo_alt", label: "Texto alternativo logo", type: "text" },
      { key: "firma_data_url", label: "Imagen firma", type: "file-data-url" },
      { key: "firmante_nombre", label: "Firmante", type: "text" },
      { key: "firmante_dni", label: "DNI firmante", type: "text" },
      { key: "firmante_cargo", label: "Cargo firmante", type: "text" },
      { key: "ciudad_firma", label: "Ciudad firma", type: "text" },
      { key: "direccion_pie", label: "Dirección pie", type: "textarea" },
      { key: "telefono_pie", label: "Teléfono pie", type: "text" },
      { key: "email_pie", label: "Email pie", type: "email" },
      { key: "web_pie", label: "Web pie", type: "text" },
      { key: "notas", label: "Notas", type: "textarea" },
    ],
    listFields: ["empresa", "razon_social", "cif", "firmante_nombre"],
    titleField: "empresa",
    usageReferences: [
      { table: "actividades", label: "Actividades", column: "empresa_id" },
      { table: "registros", label: "Registros", column: "empresa_id" },
      { table: "historiales_laborales", label: "Historiales laborales", column: "empresa_id" },
    ],
  },
  complementos: {
    label: "Complementos y pluses",
    singularLabel: "complemento",
    table: "nomina_complementos_catalogo",
    order: "nombre",
    columns:
      "id,nombre,tipo,unidad,medida_horas,bases_aplicables,orden_calculo,prorratea_en_extra,codigo_nomina,activo,notas",
    newDefaults: { orden_calculo: 100, prorratea_en_extra: false },
    fields: [
      { key: "nombre", label: "Nombre", type: "text", required: true },
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "fijo", label: "Fijo" },
          { value: "porcentaje", label: "Porcentaje" },
          { value: "variable", label: "Variable (según la persona)" },
        ],
      },
      {
        key: "unidad",
        label: "Unidad",
        type: "select",
        showWhen: [{ field: "tipo", in: ["fijo"] }],
        options: [
          { value: "mensual", label: "Mensual" },
          { value: "diario", label: "Diario (por día trabajado)" },
          { value: "por_hora", label: "Por hora" },
        ],
      },
      {
        key: "medida_horas",
        label: "Medida de horas (p.ej. horas_nocturnas)",
        type: "text",
        showWhen: [{ field: "tipo", in: ["fijo"] }, { field: "unidad", in: ["por_hora"] }],
      },
      {
        key: "bases_aplicables",
        label: "Bases sobre las que se aplica el %",
        type: "checkbox-group",
        showWhen: [{ field: "tipo", in: ["porcentaje"] }],
        options: [
          { value: "salario_base", label: "Salario base" },
          { value: "pluses", label: "Pluses" },
          { value: "complementos", label: "Otros complementos" },
        ],
      },
      { key: "orden_calculo", label: "Orden de cálculo", type: "number" },
      { key: "prorratea_en_extra", label: "Prorratea en pagas extra", type: "checkbox" },
      { key: "codigo_nomina", label: "Código en el programa de nóminas", type: "number" },
      { key: "activo", label: "Activo", type: "checkbox" },
      { key: "notas", label: "Notas", type: "textarea" },
    ],
    listFields: ["nombre", "tipo", "codigo_nomina", "activo"],
    titleField: "nombre",
    usageReferences: [],
  },
  convenios_tarifas: {
    label: "Tarifas de convenio",
    singularLabel: "tarifa",
    table: "convenios_categorias_salarios",
    order: "vigente_desde",
    columns:
      "id,convenio_categoria_id,vigente_desde,salario_mensual,salario_anual,pagas_anuales," +
      "hora_complementaria,hora_montaje,plus_transporte,plus_hora_nocturna," +
      "complemento_movilidad_pct,complemento_dedicacion,notas",
    fields: [
      {
        key: "convenio_categoria_id",
        label: "Convenio / categoría",
        type: "select",
        required: true,
        optionsFrom: {
          table: "convenios_categorias",
          columns: "id,convenio,grupo_nivel",
          valueKey: "id",
          order: "convenio",
          label: (row) => [row.grupo_nivel, row.convenio].filter(Boolean).join(" · "),
        },
      },
      { key: "vigente_desde", label: "Vigente desde", type: "date", required: true },
      { key: "salario_mensual", label: "Salario mensual (€)", type: "number", step: "0.01" },
      { key: "salario_anual", label: "Salario anual (€)", type: "number", step: "0.01" },
      { key: "pagas_anuales", label: "Pagas anuales (14 = 12 + 2 extra)", type: "number", step: "1" },
      { key: "hora_complementaria", label: "Hora complementaria (€)", type: "number", step: "0.0001" },
      { key: "hora_montaje", label: "Hora de montaje (€)", type: "number", step: "0.0001" },
      { key: "plus_transporte", label: "Plus transporte (€/día trabajado)", type: "number", step: "0.01" },
      { key: "plus_hora_nocturna", label: "Plus hora nocturna (€)", type: "number", step: "0.0001" },
      {
        key: "complemento_movilidad_pct",
        label: "Compl. movilidad (fracción: 0,10 = 10%)",
        type: "number",
        step: "0.0001",
      },
      { key: "complemento_dedicacion", label: "Compl. dedicación (€/mes)", type: "number", step: "0.01" },
      { key: "notas", label: "Notas", type: "textarea" },
    ],
    listFields: ["convenio_categoria_id", "vigente_desde", "salario_mensual", "pagas_anuales"],
    titleField: "vigente_desde",
    usageReferences: [],
    // El listado muestra el nombre del convenio, no su id.
    cellValue: (row, field) =>
      field === "convenio_categoria_id"
        ? getSettingsDynamicOptionLabel(field, row[field])
        : row[field],
  },
};
const PERSONAL_VINCULACION_OPTIONS = [
  { value: "1", label: "Activo" },
  { value: "2", label: "No activo" },
  { value: "3", label: "Pendiente de desvincular" },
  { value: "4", label: "No pertenece" },
];
const PERSONAL_DOCUMENTATION_FIELD_KEYS = new Set([
  "cv",
  "da",
  "ds",
  "epi",
  "titulos",
  "ig_ac",
  "uniforme",
  "med_emerg",
  "ens",
]);
const PERSONAL_IMPORT_HEADER_MAP = {
  id: "id",
  id_personal: "id",
  activo: "activo",
  pert_empresa: "pert_empresa",
  vinculacion_id: "vinculacion_id",
  personal: "personal",
  genero: "genero",
  antiguedad: "antiguedad",
  dni: "dni",
  fecha_nacimiento: "fecha_nacimiento",
  ss: "ss",
  email: "email",
  movil: "movil",
  telefono: "telefono",
  direccion: "direccion",
  codigo_postal: "codigo_postal",
  localidad: "localidad",
  municipio: "municipio",
  provincia: "provincia",
  cuenta_corriente: "cuenta_corriente",
  foto: "foto",
  contrato_id: "contrato_id",
  observacion: "observacion",
  desplazamiento: "desplazamiento",
  enviar: "enviar",
  carpeta: "carpeta",
  pago: "pago",
  cv: "cv",
  da: "da",
  ds: "ds",
  prev_riesgos: "prev_riesgos",
  epi: "epi",
  titulos: "titulos",
  ig_ac: "ig_ac",
  uniforme: "uniforme",
  med_emerg: "med_emerg",
  ens: "ens",
  prorrateo_pagas: "prorrateo_pagas",
  num_pagas_extra: "num_pagas_extra",
  tipo_contrato: "tipo_contrato",
  grupo: "grupo",
  nivel: "nivel",
  grupo_cotizacion: "grupo_cotizacion",
  contacto_urgencia: "contacto_urgencia",
  telefono_urgencia: "telefono_urgencia",
  persona: "persona",
  irpf: "irpf",
  nombre: "nombre",
  apellido: "apellido",
};
const PERSONAL_IMPORT_TEXT_FIELDS = new Set([
  "personal",
  "genero",
  "dni",
  "ss",
  "email",
  "movil",
  "telefono",
  "direccion",
  "localidad",
  "municipio",
  "provincia",
  "cuenta_corriente",
  "foto",
  "contrato_id",
  "observacion",
  "carpeta",
  "grupo_cotizacion",
  "contacto_urgencia",
  "telefono_urgencia",
  "nombre",
  "apellido",
]);
const PERSONAL_IMPORT_INTEGER_FIELDS = new Set([
  "id",
  "vinculacion_id",
  "codigo_postal",
  "num_pagas_extra",
  "tipo_contrato",
  "grupo",
  "nivel",
]);
const PERSONAL_IMPORT_NUMERIC_FIELDS = new Set([
  "irpf",
]);
const PERSONAL_IMPORT_BOOLEAN_FIELDS = new Set([
  "activo",
  "pert_empresa",
  "desplazamiento",
  "enviar",
  "pago",
  "cv",
  "da",
  "ds",
  "epi",
  "titulos",
  "ig_ac",
  "uniforme",
  "med_emerg",
  "ens",
  "prorrateo_pagas",
  "persona",
]);
const PERSONAL_IMPORT_DATE_FIELDS = new Set(["antiguedad", "fecha_nacimiento", "prev_riesgos"]);
const PERSONAL_IMPORT_COLUMNS = Array.from(new Set(Object.values(PERSONAL_IMPORT_HEADER_MAP)));
const PERSONAL_IMPORT_SELECT_COLUMNS = PERSONAL_IMPORT_COLUMNS.join(", ");
const PERSONAL_FIELDS = [
  { key: "id", label: "ID", type: "integer" },
  { key: "activo", label: "Activo", type: "boolean" },
  { key: "pert_empresa", label: "Pertenece a empresa", type: "boolean" },
  { key: "vinculacion_id", label: "Vinculacion", type: "select", options: PERSONAL_VINCULACION_OPTIONS },
  { key: "personal", label: "Personal", type: "text", required: true },
  { key: "genero", label: "Genero", type: "text" },
  { key: "antiguedad", label: "Antiguedad", type: "date" },
  { key: "dni", label: "DNI", type: "text" },
  { key: "fecha_nacimiento", label: "Fecha nacimiento", type: "date", confidential: true },
  { key: "ss", label: "SS", type: "text", confidential: true },
  { key: "email", label: "Email", type: "email" },
  { key: "movil", label: "Movil", type: "text" },
  { key: "telefono", label: "Telefono", type: "text" },
  { key: "direccion", label: "Direccion", type: "text", confidential: true },
  { key: "codigo_postal", label: "Codigo postal", type: "integer", confidential: true },
  { key: "localidad", label: "Localidad", type: "text" },
  { key: "municipio", label: "Municipio", type: "text" },
  { key: "provincia", label: "Provincia", type: "text" },
  { key: "cuenta_corriente", label: "Cuenta corriente", type: "text", confidential: true },
  { key: "observacion", label: "Observacion", type: "textarea" },
  { key: "carpeta", label: "Carpeta", type: "text" },
  { key: "cv", label: "CV", type: "boolean" },
  { key: "da", label: "DA", type: "boolean" },
  { key: "ds", label: "DS", type: "boolean" },
  { key: "prev_riesgos", label: "Prevencion riesgos", type: "date" },
  { key: "epi", label: "EPI", type: "boolean" },
  { key: "titulos", label: "Titulos", type: "boolean" },
  { key: "ig_ac", label: "IG AC", type: "boolean" },
  { key: "uniforme", label: "Uniforme", type: "boolean" },
  { key: "med_emerg", label: "Med. emerg", type: "boolean" },
  { key: "ens", label: "ENS", type: "boolean" },
  { key: "prorrateo_pagas", label: "Prorrateo pagas", type: "boolean", confidential: true },
  { key: "num_pagas_extra", label: "Num. pagas extra", type: "integer", confidential: true },
  { key: "persona", label: "Persona", type: "boolean" },
  { key: "irpf", label: "IRPF", type: "numeric", confidential: true },
  { key: "nombre", label: "Nombre", type: "text" },
  { key: "apellido", label: "Apellido", type: "text" },
];
const PERSONAL_SELECT_COLUMNS = PERSONAL_FIELDS.map((field) => field.key).join(", ");
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
  return `<svg class="button-icon" aria-hidden="true"><use href="./icons.svg?v=20260608-1#icon-${name}"></use></svg>`;
}

function escapeButtonLabel(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function decorateActionButton(button, icon, mode = "icon-only") {
  if (!button || button.dataset.iconDecorated === `${icon}:${mode}`) {
    return;
  }

  const label = (button.getAttribute("aria-label") || button.textContent || "").trim();
  if (!label) {
    return;
  }

  button.setAttribute("aria-label", label);
  button.dataset.iconDecorated = `${icon}:${mode}`;
  if (mode === "icon-only") {
    button.classList.add("tooltip-button", "icon-only-button");
    button.classList.remove("icon-text-button");
    button.innerHTML = renderIcon(icon);
    return;
  }

  button.classList.add("icon-text-button");
  button.classList.remove("icon-only-button");
  button.innerHTML = `${renderIcon(icon)}<span>${escapeButtonLabel(label)}</span>`;
}

function decorateStaticActionButtons() {
  document.querySelectorAll("button").forEach((button) => {
    const label = (button.textContent || "").trim().replace(/\s+/g, " ");
    if (!label) {
      return;
    }

    if (label === "Cerrar") {
      decorateActionButton(button, "close", "icon-only");
      return;
    }

    if (button.type === "button" && /^(Nuevo|Nueva)\b/.test(label)) {
      decorateActionButton(button, "new", "icon-only");
      return;
    }

    if (/^(Borrar|Eliminar)\b/.test(label)) {
      decorateActionButton(button, "delete", "icon-only");
      return;
    }

    if (/^Guardar\b/.test(label)) {
      decorateActionButton(button, "save", "icon-text");
      return;
    }

    if (/^(Exportar|Descargar)\b/.test(label)) {
      decorateActionButton(button, "download", "icon-text");
      return;
    }

    if (/^Cargar\b/.test(label)) {
      decorateActionButton(button, "file", "icon-text");
      return;
    }

    if (/^(Resumen|Informe)\b/.test(label)) {
      decorateActionButton(button, "file", "icon-text");
    }
  });
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
const privateTabConciliaButton = document.querySelector("#private-tab-concilia");
const privateTabActividadesButton = document.querySelector("#private-tab-actividades");
const privateTabRegistrosButton = document.querySelector("#private-tab-registros");
const privateTabHistorialButton = document.querySelector("#private-tab-historial");
const privateTabGestionButton = document.querySelector("#private-tab-gestion");
const privateTabContabilidadButton = document.querySelector("#private-tab-contabilidad");
const privateTabContractsButton = document.querySelector("#private-tab-contracts");
const privateTabPersonalButton = document.querySelector("#private-tab-personal");
const privateTabProgrammingButton = document.querySelector("#private-tab-programming");
const privateTabSettingsButton = document.querySelector("#private-tab-settings");
const privateTabPanelNew = document.querySelector("#private-tab-panel-new");
const privateTabPanelSearch = document.querySelector("#private-tab-panel-search");
const privateTabPanelControl = document.querySelector("#private-tab-panel-control");
const privateTabPanelEvents = document.querySelector("#private-tab-panel-events");
const privateTabPanelContracts = document.querySelector("#private-tab-panel-contracts");
const privateTabPanelPersonal = document.querySelector("#private-tab-panel-personal");
const privateTabPanelProgramming = document.querySelector("#private-tab-panel-programming");
const privateTabPanelRegistros = document.querySelector("#private-tab-panel-registros");
const privateTabPanelHistorial = document.querySelector("#private-tab-panel-historial");
const privateTabPanelGestion = document.querySelector("#private-tab-panel-gestion");
const privateTabPanelContabilidad = document.querySelector("#private-tab-panel-contabilidad");
const privateTabPanelSettings = document.querySelector("#private-tab-panel-settings");
const settingsCatalogView = document.querySelector("#settings-catalog-view");
const settingsReportsView = document.querySelector("#settings-reports-view");
const settingsAccessView = document.querySelector("#settings-access-view");
const settingsSubtabAccessButton = document.querySelector("#settings-subtab-access");
const privateTabPanelConciliaIntegrated = document.querySelector("#private-tab-panel-concilia-integrated");
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
const loginStatus = document.querySelector("#login-status");
const passwordRecoveryStatus = document.querySelector("#password-recovery-status");
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
const recordsFiltersForm = document.querySelector("#records-filters-form");
const recordsTableHead = document.querySelector("#records-table-head");
const recordsTableBody = document.querySelector("#records-table-body");
const recordsSummary = document.querySelector("#records-summary");
const recordsEditModeInput = document.querySelector("#records-edit-mode");
const recordsRefreshButton = document.querySelector("#records-refresh-button");
const recordsClearFiltersButton = document.querySelector("#records-clear-filters-button");
const recordDetailPanel = document.querySelector("#record-detail-panel");
const recordDetailOverlay = document.querySelector("#record-detail-overlay");
const recordDetailForm = document.querySelector("#record-detail-form");
const recordDetailFields = document.querySelector("#record-detail-fields");
const recordDetailTitle = document.querySelector("#record-detail-title");
const recordDetailCloseButton = document.querySelector("#record-detail-close-button");
const recordDetailCancelButton = document.querySelector("#record-detail-cancel-button");
const recordDetailDeleteButton = document.querySelector("#record-detail-delete-button");
const recordDetailDuplicateButton = document.querySelector("#record-detail-duplicate-button");
const recordDetailSubstitutionButton = document.querySelector("#record-detail-substitution-button");
const recordDetailRemoveSubstitutionButton = document.querySelector("#record-detail-remove-substitution-button");
const recordSubstitutionPanel = document.querySelector("#record-substitution-panel");
const recordSubstitutionOverlay = document.querySelector("#record-substitution-overlay");
const recordSubstitutionInfo = document.querySelector("#record-substitution-info");
const recordSubstitutionReasonSelect = document.querySelector("#record-substitution-reason");
const recordSubstitutionPersonSelect = document.querySelector("#record-substitution-person");
const recordSubstitutionConfirmButton = document.querySelector("#record-substitution-confirm-button");
const recordSubstitutionCancelButton = document.querySelector("#record-substitution-cancel-button");
const controlFiltersForm = document.querySelector("#control-filters-form");
const controlDateFromInput = document.querySelector("#control-date-from");
const controlDateToInput = document.querySelector("#control-date-to");
const controlPersonalInput = document.querySelector("#control-personal");
const controlPersonalSuggestions = document.querySelector("#control-personal-suggestions");
const controlPersonalClearButton = document.querySelector("[data-control-personal-clear]");
const controlPersonalToggleButton = document.querySelector("[data-control-personal-toggle]");
const controlCentroInput = document.querySelector("#control-centro");
const controlPuestoInput = document.querySelector("#control-puesto");
const controlRecordsTable = document.querySelector("#control-records-table");
const controlClearFiltersButton = document.querySelector("#control-clear-filters-button");
const controlTotalsButton = document.querySelector("#control-totals-button");
const controlReportImagePanel = document.querySelector("#control-report-image-panel");
const controlReportImageBackdrop = document.querySelector("#control-report-image-backdrop");
const closeControlReportImageButton = document.querySelector("#close-control-report-image-button");
const copyControlReportImageButton = document.querySelector("#copy-control-report-image-button");
const downloadControlReportImageButton = document.querySelector("#download-control-report-image-button");
const controlReportImagePreview = document.querySelector("#control-report-image-preview");
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
const eventContractSelect = document.querySelector("#event-contract");
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
const eventFilterContractSelect = document.querySelector("#event-filter-contract");
const eventFilterInstallationSelect = document.querySelector("#event-filter-installation");
const eventFilterStartDateInput = document.querySelector("#event-filter-start-date");
const eventFilterEndDateInput = document.querySelector("#event-filter-end-date");
const eventFilterIncludeArchivedInput = document.querySelector("#event-filter-include-archived");
const eventPersonnelReportSelect = document.querySelector("#event-personnel-report-select");
const eventPersonnelReportPdfButton = document.querySelector("#event-personnel-report-pdf-button");
const eventPersonnelReportImageButton = document.querySelector("#event-personnel-report-image-button");
const eventReportImagePanel = document.querySelector("#event-report-image-panel");
const eventReportImageBackdrop = document.querySelector("#event-report-image-backdrop");
const closeEventReportImageButton = document.querySelector("#close-event-report-image-button");
const copyEventReportImageButton = document.querySelector("#copy-event-report-image-button");
const downloadEventReportImageButton = document.querySelector("#download-event-report-image-button");
const eventReportImagePreview = document.querySelector("#event-report-image-preview");
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
const programmingImportStatus = document.querySelector("#programming-import-status");
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
const contractsNewButton = document.querySelector("#contracts-new-button");
const contractsRefreshButton = document.querySelector("#contracts-refresh-button");
const contractsShowInactiveInput = document.querySelector("#contracts-show-inactive");
const contractsStatus = document.querySelector("#contracts-status");
const contractsTableBody = document.querySelector("#contracts-table-body");
const contractsBulkFieldSelect = document.querySelector("#contracts-bulk-field");
const contractsBulkCurrentValueInput = document.querySelector("#contracts-bulk-current-value");
const contractsBulkNewValueInput = document.querySelector("#contracts-bulk-new-value");
const contractsBulkCurrentBoolSelect = document.querySelector("#contracts-bulk-current-bool");
const contractsBulkNewBoolSelect = document.querySelector("#contracts-bulk-new-bool");
const contractsBulkApplyButton = document.querySelector("#contracts-bulk-apply-button");
const contractsBulkMatchCount = document.querySelector("#contracts-bulk-match-count");
const personalImportExcelButton = document.querySelector("#personal-import-excel-button");
const personalImportExcelInput = document.querySelector("#personal-import-excel-input");
const personalNewButton = document.querySelector("#personal-new-button");
const personalRefreshButton = document.querySelector("#personal-refresh-button");
const personalVinculacionFilter = document.querySelector("#personal-vinculacion-filter");
const personalTextFilter = document.querySelector("#personal-text-filter");
const personalList = document.querySelector("#personal-list");
const personalListSummary = document.querySelector("#personal-list-summary");
const personalStatus = document.querySelector("#personal-status");
const personalFormTitle = document.querySelector("#personal-form-title");
const personalForm = document.querySelector("#personal-form");
const personalFormFields = document.querySelector("#personal-form-fields");
const personalEditButton = document.querySelector("#personal-edit-button");
const personalSaveButton = document.querySelector("#personal-save-button");
const personalCancelButton = document.querySelector("#personal-cancel-button");
const personalComplementosSection = document.querySelector("#personal-complementos-section");
const personalComplementosList = document.querySelector("#personal-complementos-list");
const personalComplementoForm = document.querySelector("#personal-complemento-form");
const personalComplementoIdInput = document.querySelector("#personal-complemento-id");
const personalComplementoSelect = document.querySelector("#personal-complemento-select");
const personalComplementoCatalogoHint = document.querySelector("#personal-complemento-catalogo-hint");
const personalComplementoFechaDesdeInput = document.querySelector("#personal-complemento-fecha-desde");
const personalComplementoFechaHastaInput = document.querySelector("#personal-complemento-fecha-hasta");
const personalComplementoTipoRow = document.querySelector("#personal-complemento-tipo-row");
const personalComplementoTipoSelect = document.querySelector("#personal-complemento-tipo");
const personalComplementoUnidadRow = document.querySelector("#personal-complemento-unidad-row");
const personalComplementoUnidadSelect = document.querySelector("#personal-complemento-unidad");
const personalComplementoMedidaHorasRow = document.querySelector("#personal-complemento-medida-horas-row");
const personalComplementoMedidaHorasInput = document.querySelector("#personal-complemento-medida-horas");
const personalComplementoBasesRow = document.querySelector("#personal-complemento-bases-row");
const personalComplementoImporteRow = document.querySelector("#personal-complemento-importe-row");
const personalComplementoImporteInput = document.querySelector("#personal-complemento-importe");
const personalComplementoPorcentajeRow = document.querySelector("#personal-complemento-porcentaje-row");
const personalComplementoPorcentajeInput = document.querySelector("#personal-complemento-porcentaje");
const personalComplementoProrrateaInput = document.querySelector("#personal-complemento-prorratea");
const personalComplementoNotasInput = document.querySelector("#personal-complemento-notas");
const personalComplementoClearButton = document.querySelector("#personal-complemento-clear-button");
const personalComplementoDeleteButton = document.querySelector("#personal-complemento-delete-button");
const personalImportPanel = document.querySelector("#personal-import-panel");
const personalImportOverlay = document.querySelector("#personal-import-overlay");
const closePersonalImportPanelButton = document.querySelector("#close-personal-import-panel-button");
const personalImportFileName = document.querySelector("#personal-import-file-name");
const personalImportTotalCount = document.querySelector("#personal-import-total-count");
const personalImportSelectedCount = document.querySelector("#personal-import-selected-count");
const personalImportSelectAll = document.querySelector("#personal-import-select-all");
const personalImportApplyButton = document.querySelector("#personal-import-apply-button");
const personalImportPreviewTableBody = document.querySelector("#personal-import-preview-table-body");
const historialImportExcelButton = document.querySelector("#historial-import-excel-button");
const historialImportExcelInput = document.querySelector("#historial-import-excel-input");
const historialImportPanel = document.querySelector("#historial-import-panel");
const historialImportOverlay = document.querySelector("#historial-import-overlay");
const closeHistorialImportPanelButton = document.querySelector("#close-historial-import-panel-button");
const historialImportFileName = document.querySelector("#historial-import-file-name");
const historialImportTotalCount = document.querySelector("#historial-import-total-count");
const historialImportSelectedCount = document.querySelector("#historial-import-selected-count");
const historialImportSelectAll = document.querySelector("#historial-import-select-all");
const historialImportApplyButton = document.querySelector("#historial-import-apply-button");
const historialImportPreviewTableBody = document.querySelector("#historial-import-preview-table-body");
const contractDetailPanel = document.querySelector("#contract-detail-panel");
const contractDetailOverlay = document.querySelector("#contract-detail-overlay");
const closeContractDetailButton = document.querySelector("#close-contract-detail-button");
const contractDetailTitle = document.querySelector("#contract-detail-title");
const contractDetailForm = document.querySelector("#contract-detail-form");
const contractDetailIdInput = document.querySelector("#contract-detail-id");
const contractDetailNameInput = document.querySelector("#contract-detail-name");
const contractDetailClientInput = document.querySelector("#contract-detail-client");
const contractDetailFileInput = document.querySelector("#contract-detail-file");
const contractDetailStartInput = document.querySelector("#contract-detail-start");
const contractDetailEndInput = document.querySelector("#contract-detail-end");
const contractDetailAmountInput = document.querySelector("#contract-detail-amount");
const contractDetailVatInput = document.querySelector("#contract-detail-vat");
const contractDetailActiveInput = document.querySelector("#contract-detail-active");
const contractDetailNightInput = document.querySelector("#contract-detail-nocturnidad");
const contractDetailNightStartInput = document.querySelector("#contract-detail-nocturnidad-inicio");
const contractDetailNightEndInput = document.querySelector("#contract-detail-nocturnidad-fin");
const contractDetailNightFieldsWrap = document.querySelector("#contract-detail-nocturnidad-fields");
const contractDetailDeleteButton = document.querySelector("#contract-detail-delete-button");
const contractServicesSection = document.querySelector("#contract-services-section");
const contractServiceForm = document.querySelector("#contract-service-form");
const contractServiceIdInput = document.querySelector("#contract-service-id");
const contractServiceNameInput = document.querySelector("#contract-service-name");
const contractServiceDescriptionInput = document.querySelector("#contract-service-description");
const contractServiceActiveInput = document.querySelector("#contract-service-active");
const contractServiceClearButton = document.querySelector("#contract-service-clear-button");
const contractServicesList = document.querySelector("#contract-services-list");
const contractPersonalSection = document.querySelector("#contract-personal-section");
const contractPersonalFilter = document.querySelector("#contract-personal-filter");
const contractPersonalAvailableSelect = document.querySelector("#contract-personal-available-select");
const contractPersonalSelectedSelect = document.querySelector("#contract-personal-selected-select");
const contractPersonalAddButton = document.querySelector("#contract-personal-add-button");
const contractPersonalRemoveButton = document.querySelector("#contract-personal-remove-button");
const contractInstallationsSection = document.querySelector("#contract-installations-section");
const contractInstallationFilter = document.querySelector("#contract-installation-filter");
const contractInstallationAvailableSelect = document.querySelector("#contract-installation-available-select");
const contractInstallationSelectedSelect = document.querySelector("#contract-installation-selected-select");
const contractInstallationAddButton = document.querySelector("#contract-installation-add-button");
const contractInstallationRemoveButton = document.querySelector("#contract-installation-remove-button");
const accessNewUserButton = document.querySelector("#access-new-user-button");
const accessRefreshButton = document.querySelector("#access-refresh-button");
const accessUserPanel = document.querySelector("#access-user-panel");
const accessUserOverlay = document.querySelector("#access-user-overlay");
const closeAccessUserPanelButton = document.querySelector("#close-access-user-panel-button");
const accessUserPanelTitle = document.querySelector("#access-user-panel-title");
const accessUserForm = document.querySelector("#access-user-form");
const accessUserIdInput = document.querySelector("#access-user-id");
const accessUserNameInput = document.querySelector("#access-user-name");
const accessUserRoleSelect = document.querySelector("#access-user-role");
const accessUserActiveInput = document.querySelector("#access-user-active");
const accessUserTabsContainer = document.querySelector("#access-user-tabs");
const accessUserServicesSelect = document.querySelector("#access-user-services");
const accessUserSaveButton = document.querySelector("#access-user-save-button");
const accessUserClearButton = document.querySelector("#access-user-clear-button");
const accessUserDeleteButton = document.querySelector("#access-user-delete-button");
const accessStatus = document.querySelector("#access-status");
const accessUsersTableBody = document.querySelector("#access-users-table-body");
const settingsSubtabButtons = Array.from(document.querySelectorAll(".settings-subtab-button[data-settings-view]"));
const settingsNewButton = document.querySelector("#settings-new-button");
const settingsRefreshButton = document.querySelector("#settings-refresh-button");
const settingsStatus = document.querySelector("#settings-status");
const settingsTableHead = document.querySelector("#settings-table-head");
const settingsTableBody = document.querySelector("#settings-table-body");
const settingsDetailPanel = document.querySelector("#settings-detail-panel");
const settingsDetailOverlay = document.querySelector("#settings-detail-overlay");
const closeSettingsDetailButton = document.querySelector("#close-settings-detail-button");
const settingsDetailTitle = document.querySelector("#settings-detail-title");
const settingsDetailForm = document.querySelector("#settings-detail-form");
const settingsDetailFields = document.querySelector("#settings-detail-fields");
const settingsDetailDeleteButton = document.querySelector("#settings-detail-delete-button");
const settingsDetailClearButton = document.querySelector("#settings-detail-clear-button");
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
const controlTotalsExportCsvButton = document.querySelector("#control-totals-export-csv-button");
const controlTotalsExportPdfButton = document.querySelector("#control-totals-export-pdf-button");
const controlTotalsReportImageButton = document.querySelector("#control-totals-report-image-button");
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
let xlsxModulePromise = null;
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
let recordsRows = [];
let filteredRecordsRows = [];
let selectedRecordId = "";
let recordsSelectionMode = false;
let selectedRecordIds = new Set();
let recordDetailSnapshot = null;
let recordsExternalActivityFilter = "";
let recordsReportPreviewRows = null;
let recordsSort = { field: "fecha", direction: "desc" };
// Facetas para los desplegables de filtro: valores distintos (contrato/servicio/
// personal/instalacion) presentes en registros dentro del rango fecha/actividad.
// Se recargan solo cuando cambia ese rango (no al cambiar un desplegable).
let recordsFacetRows = [];
let recordsFacetKey = null;
// Lista estable del filtro de contratos: activos + asignados + con registros en
// TODO el listado accesible (no depende de los demás filtros). Se carga una vez.
let recordsFilterContratos = null;
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
let eventContractRows = [];
let eventContractPersonalRows = [];
let eventContractInstallationRows = [];
let eventCreatorRows = [];
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
let currentEventReportImageCanvas = null;
let currentEventReportImageFileName = "";
let currentControlReportImageCanvas = null;
let currentControlReportImageFileName = "";
let controlTotalsSections = [];
let controlTotalsCurrentSummary = "";
const eventAssignmentSaveTimers = new Map();
let currentContractRows = [];
let currentContractServiceRows = [];
let contractPersonalCatalogRows = [];
let contractInstallationCatalogRows = [];
let currentContractPersonalRows = [];
let currentContractInstallationRows = [];
let currentEditingContractId = "";
const CONTRACT_BULK_FIELDS = {
  fecha_inicio: { label: "Fecha inicio", type: "date" },
  fecha_fin: { label: "Fecha fin", type: "date" },
  cliente: { label: "Cliente", type: "text" },
  expediente: { label: "Expediente", type: "text" },
  importe: { label: "Importe", type: "text" },
  iva: { label: "IVA", type: "number" },
  cpv: { label: "CPV", type: "text" },
  agrupacion_nomina: { label: "Agrupación nómina", type: "text" },
  descripcion: { label: "Descripción", type: "text" },
  activo: { label: "Activo", type: "boolean" },
  seleccionar: { label: "Seleccionar", type: "boolean" },
  desplazamiento: { label: "Desplazamiento", type: "boolean" },
};
let currentPersonalRows = [];
let filteredPersonalRows = [];
let currentSelectedPersonalId = "";
let currentPersonalMode = "view";
let nominaComplementosCatalogRows = [];
let nominaComplementosCatalogLoaded = false;
let currentPersonalComplementoRows = [];
let currentEditingPersonalComplementoId = "";
let pendingPersonalImportRows = [];
let pendingPersonalImportFileName = "";
let currentAccessUsers = [];
let currentAccessServices = [];
let currentAccessAssignments = [];
let currentAccessTabAssignments = [];
let currentSettingsCatalog = "puestos";
let currentSettingsView = "catalog"; // "catalog" | "reports" | "access"
let currentSettingsRows = [];
let currentSettingsMode = "new";
let currentSettingsEditingId = "";
let currentSettingsSortField = "puesto";
let currentSettingsSortDirection = "asc";
let currentSettingsAvailableFieldKeys = null;
// Opciones de los select que se cargan de otra tabla (field.optionsFrom),
// p.ej. la categoría de convenio al editar una tarifa. Clave: field.key.
let currentSettingsDynamicOptions = new Map();
let currentAllowedPrivateTabs = new Set(["programming"]);
let currentUserIsAccessAdmin = false;
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

// Diálogo modal reutilizable con 3 salidas: "save" | "discard" | "cancel".
// Promesa que resuelve con la elección del usuario. Autocontenido (se inyecta
// y se limpia solo), para poder usarlo desde cualquier pestaña, incluida Concilia.
function showUnsavedChangesDialog(options = {}) {
  const {
    title = "Cambios sin guardar",
    message = "Hay cambios sin guardar en este panel. ¿Qué quieres hacer?",
    saveLabel = "Guardar",
    discardLabel = "Descartar",
    cancelLabel = "Cancelar",
  } = options;

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "unsaved-dialog-overlay";
    overlay.innerHTML = `
      <div class="unsaved-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-dialog-title">
        <h3 id="unsaved-dialog-title">${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="unsaved-dialog-actions">
          <button type="button" class="secondary-button" data-choice="cancel">${escapeHtml(cancelLabel)}</button>
          <button type="button" class="danger-button" data-choice="discard">${escapeHtml(discardLabel)}</button>
          <button type="button" class="primary-button" data-choice="save">${escapeHtml(saveLabel)}</button>
        </div>
      </div>`;

    const finish = (choice) => {
      document.removeEventListener("keydown", onKeydown, true);
      overlay.remove();
      resolve(choice);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        finish("cancel");
      }
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        finish("cancel");
        return;
      }
      const choice = event.target.closest("[data-choice]")?.dataset.choice;
      if (choice) {
        finish(choice);
      }
    });
    document.addEventListener("keydown", onKeydown, true);
    document.body.appendChild(overlay);
    overlay.querySelector('[data-choice="save"]')?.focus();
  });
}

// Guarda de cierre para paneles con formulario. Devuelve true si el panel puede
// cerrarse (no había cambios, se descartaron o se guardaron con éxito) y false
// si el usuario canceló o el guardado falló.
//   - saveFn: async, persiste y devuelve true/false. NO debe cerrar el panel.
async function confirmCloseWithSave(form, saveFn) {
  if (!hasUnsavedFormChanges(form)) {
    return true;
  }
  const choice = await showUnsavedChangesDialog();
  if (choice === "cancel") {
    return false;
  }
  if (choice === "discard") {
    return true;
  }
  if (typeof saveFn !== "function") {
    return true;
  }
  let result;
  try {
    result = await saveFn();
  } catch (_error) {
    return false;
  }
  // saveFn puede devolver un booleano explícito de éxito; si no, se infiere del
  // estado del formulario (un guardado con éxito lo deja "pristine").
  if (result === true || result === false) {
    return result;
  }
  return !hasUnsavedFormChanges(form);
}

// Expuesto para Concilia (concilia-integrated.js corre en su propio IIFE).
window.CoordinacionUnsaved = {
  showUnsavedChangesDialog,
  confirmCloseWithSave,
  hasUnsavedFormChanges,
  markFormPristine,
};

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

// La ✕ del buscador de personal de Control aparece solo cuando hay texto.
function updateControlPersonalClear() {
  if (!controlPersonalClearButton || !controlPersonalInput) {
    return;
  }
  controlPersonalClearButton.classList.toggle("hidden", !controlPersonalInput.value.trim());
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

// Supabase devuelve los errores de auth en inglés; los habituales se traducen
// para que el aviso del login sea legible.
const AUTH_ERROR_MESSAGES = {
  "invalid login credentials": "el correo o la contraseña no son correctos.",
  "email not confirmed": "la cuenta todavía no ha confirmado su correo.",
  "user not found": "no existe ninguna cuenta con ese correo.",
  "email rate limit exceeded": "demasiados intentos seguidos. Espera un momento e inténtalo de nuevo.",
};

function translateAuthError(error) {
  const message = String(error?.message || "").trim();
  return AUTH_ERROR_MESSAGES[message.toLowerCase()] || message || "error desconocido.";
}

// El estado general (#status-message) vive al pie de la página, lejos de la
// tarjeta de acceso: en el login los avisos se muestran también junto al botón
// para que un fallo de credenciales no pase desapercibido.
function setLoginStatus(message, tone = "default") {
  setStatus(message, tone);
  setPanelStatus(loginStatus, message, tone);
}

function setPasswordRecoveryStatus(message, tone = "default") {
  setStatus(message, tone);
  setPanelStatus(passwordRecoveryStatus, message, tone);
}

function setPanelStatus(element, message = "", tone = "default") {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = "panel-status-message";
  if (tone !== "default") {
    element.classList.add(tone);
  }
}

function setProgrammingImportStatus(message = "", tone = "default") {
  setPanelStatus(programmingImportStatus, message, tone);
}

function setAccessStatus(message = "", tone = "default") {
  setPanelStatus(accessStatus, message, tone);
}

function setPersonalStatus(message = "", tone = "default") {
  setPanelStatus(personalStatus, message, tone);
}

function setSettingsStatus(message = "", tone = "default") {
  setPanelStatus(settingsStatus, message, tone);
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

function normalizeCoordinationTabKey(tabKey) {
  const normalizedTabKey = String(tabKey ?? "").trim();
  if (COORDINATION_LEGACY_TAB_ALIASES[normalizedTabKey]) {
    return COORDINATION_LEGACY_TAB_ALIASES[normalizedTabKey];
  }
  return CONCILIA_LEGACY_TAB_KEYS.has(normalizedTabKey) ? CONCILIA_TAB_KEY : normalizedTabKey;
}

function normalizePrivateTabTarget(target) {
  const normalizedTarget = normalizeCoordinationTabKey(target);
  if (PRIVATE_TAB_TARGETS.has(normalizedTarget) && currentAllowedPrivateTabs.has(normalizedTarget)) {
    return normalizedTarget;
  }

  return currentAllowedPrivateTabs.values().next().value || "programming";
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

function syncAccessTabVisibility() {
  const tabButtons = {
    search: privateTabSearchButton,
    control: privateTabControlButton,
    events: privateTabEventsButton,
    concilia: privateTabConciliaButton,
    actividades: privateTabActividadesButton,
    registros: privateTabRegistrosButton,
    historial: privateTabHistorialButton,
    gestion: privateTabGestionButton,
    contabilidad: privateTabContabilidadButton,
    programming: privateTabProgrammingButton,
    contracts: privateTabContractsButton,
    personal: privateTabPersonalButton,
    settings: privateTabSettingsButton,
  };

  Object.entries(tabButtons).forEach(([tabKey, button]) => {
    button?.classList.toggle("hidden", !currentAllowedPrivateTabs.has(tabKey));
  });

  // Accesos es ahora una subpestaña de Configuración, visible solo para admin.
  syncSettingsAccessSubtabVisibility();

  if (!currentAllowedPrivateTabs.has(currentPrivateTabTarget)) {
    switchPrivateTab(normalizePrivateTabTarget(currentPrivateTabTarget));
  }
}

function syncSettingsAccessSubtabVisibility() {
  settingsSubtabAccessButton?.classList.toggle("hidden", !currentUserIsAccessAdmin);
  // Si un no-admin tuviera la vista de accesos activa, la devolvemos a catálogos.
  if (!currentUserIsAccessAdmin && currentSettingsView === "access") {
    switchSettingsView("catalog");
  }
}

function switchSettingsView(view) {
  const nextView =
    view === "access" && currentUserIsAccessAdmin
      ? "access"
      : view === "reports"
        ? "reports"
        : "catalog";
  currentSettingsView = nextView;
  settingsCatalogView?.classList.toggle("hidden", nextView !== "catalog");
  settingsReportsView?.classList.toggle("hidden", nextView !== "reports");
  settingsAccessView?.classList.toggle("hidden", nextView !== "access");
  renderSettingsSubtabs();
}

async function loadSettingsTabActiveView() {
  syncSettingsAccessSubtabVisibility();
  if (currentSettingsView === "reports") {
    switchSettingsView("reports");
    await loadHistorialReportConfig({ force: !historialReportConfigLoaded });
    return;
  }
  if (currentSettingsView === "access" && currentUserIsAccessAdmin) {
    switchSettingsView("access");
    await loadAccessManagement();
    return;
  }
  switchSettingsView("catalog");
  await loadSettingsManagement();
}

function showPasswordRecoveryView() {
  loginForm?.classList.add("hidden");
  inviteSetupForm?.classList.add("hidden");
  passwordRecoveryForm?.classList.remove("hidden");
  // Un error de acceso previo no debe seguir visible al pedir el enlace.
  setPanelStatus(loginStatus, "");
  passwordRecoveryEmailInput.value = document.querySelector("#login-email")?.value.trim() || "";
  passwordRecoveryEmailInput.focus();
}

function showLoginFormView() {
  passwordRecoveryForm?.classList.add("hidden");
  inviteSetupForm?.classList.add("hidden");
  loginForm?.classList.remove("hidden");
  setPanelStatus(passwordRecoveryStatus, "");
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

function showIntegratedConciliaPanel(privateTabTarget) {
  const moduleTarget = CONCILIA_MODULE_BY_TAB_KEY[normalizeCoordinationTabKey(privateTabTarget)] || "alumnado";
  const normalizedModuleTarget = moduleTarget || "alumnado";
  const appView = document.querySelector("#concilia-app-view");
  appView?.classList.remove("hidden");
  document
    .querySelectorAll("#private-tab-panel-concilia-integrated .concilia-subtabs")
    .forEach((tabs) => {
      tabs.classList.toggle("hidden", normalizedModuleTarget === "actividades");
    });

  document
    .querySelectorAll("#private-tab-panel-concilia-integrated [data-module-tab]")
    .forEach((button) => {
      const isActive = button.dataset.moduleTab === normalizedModuleTarget;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

  document
    .querySelectorAll("#private-tab-panel-concilia-integrated [data-module-panel]")
    .forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.modulePanel !== normalizedModuleTarget);
    });
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
  const showContracts = normalizedTarget === "contracts";
  const showPersonal = normalizedTarget === "personal";
  const showRegistros = normalizedTarget === "registros";
  const showHistorial = normalizedTarget === "historial";
  const showGestion = normalizedTarget === "gestion";
  const showContabilidad = normalizedTarget === "contabilidad";
  const showSettings = normalizedTarget === "settings";
  const showConcilia = normalizedTarget === "concilia" || normalizedTarget === "actividades";
  const hasAnyAccess = currentAllowedPrivateTabs.size > 0;

  privateTabPanelSearch.classList.toggle("hidden", !hasAnyAccess || !showSearch);
  privateTabPanelControl.classList.toggle("hidden", !hasAnyAccess || !showControl);
  privateTabPanelEvents?.classList.toggle("hidden", !hasAnyAccess || !showEvents);
  privateTabPanelProgramming.classList.toggle("hidden", !hasAnyAccess || !showProgramming);
  privateTabPanelContracts?.classList.toggle("hidden", !hasAnyAccess || !showContracts);
  privateTabPanelPersonal?.classList.toggle("hidden", !hasAnyAccess || !showPersonal);
  privateTabPanelRegistros?.classList.toggle("hidden", !hasAnyAccess || !showRegistros);
  privateTabPanelHistorial?.classList.toggle("hidden", !hasAnyAccess || !showHistorial);
  privateTabPanelGestion?.classList.toggle("hidden", !hasAnyAccess || !showGestion);
  privateTabPanelContabilidad?.classList.toggle("hidden", !hasAnyAccess || !showContabilidad);
  privateTabPanelSettings?.classList.toggle("hidden", !hasAnyAccess || !showSettings);
  privateTabPanelConciliaIntegrated?.classList.toggle("hidden", !hasAnyAccess || !showConcilia);
  if (showConcilia) {
    showIntegratedConciliaPanel(normalizedTarget);
  }
  privateTabSearchButton.classList.toggle("active", showSearch);
  privateTabControlButton.classList.toggle("active", showControl);
  privateTabEventsButton?.classList.toggle("active", showEvents);
  privateTabConciliaButton?.classList.toggle("active", normalizedTarget === "concilia");
  privateTabActividadesButton?.classList.toggle("active", normalizedTarget === "actividades");
  privateTabProgrammingButton.classList.toggle("active", showProgramming);
  privateTabContractsButton?.classList.toggle("active", showContracts);
  privateTabPersonalButton?.classList.toggle("active", showPersonal);
  privateTabRegistrosButton?.classList.toggle("active", showRegistros);
  privateTabHistorialButton?.classList.toggle("active", showHistorial);
  privateTabGestionButton?.classList.toggle("active", showGestion);
  privateTabContabilidadButton?.classList.toggle("active", showContabilidad);
  privateTabSettingsButton?.classList.toggle("active", showSettings);
  privateTabSearchButton.setAttribute("aria-pressed", String(showSearch));
  privateTabControlButton.setAttribute("aria-pressed", String(showControl));
  privateTabEventsButton?.setAttribute("aria-pressed", String(showEvents));
  privateTabConciliaButton?.setAttribute("aria-pressed", String(normalizedTarget === "concilia"));
  privateTabActividadesButton?.setAttribute("aria-pressed", String(normalizedTarget === "actividades"));
  privateTabProgrammingButton.setAttribute("aria-pressed", String(showProgramming));
  privateTabContractsButton?.setAttribute("aria-pressed", String(showContracts));
  privateTabPersonalButton?.setAttribute("aria-pressed", String(showPersonal));
  privateTabRegistrosButton?.setAttribute("aria-pressed", String(showRegistros));
  privateTabHistorialButton?.setAttribute("aria-pressed", String(showHistorial));
  privateTabGestionButton?.setAttribute("aria-pressed", String(showGestion));
  privateTabContabilidadButton?.setAttribute("aria-pressed", String(showContabilidad));
  privateTabSettingsButton?.setAttribute("aria-pressed", String(showSettings));
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

async function getXlsxClient() {
  if (xlsxModulePromise) {
    return xlsxModulePromise;
  }

  xlsxModulePromise = import("https://esm.sh/xlsx@0.18.5");
  return xlsxModulePromise;
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

function shiftIsoDate(value, deltaDays) {
  const match = String(value ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
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
  controlTotalsCurrentSummary = buildControlTotalsFilterSummary(filters);
  controlTotalsFilterSummary.textContent = controlTotalsCurrentSummary;

  if (!rows.length) {
    controlTotalsSections = [];
    if (reportContent) {
      reportContent.innerHTML = `<p class="empty-state">No hay datos filtrados.</p>`;
    }
    return;
  }

  if (!reportContent) {
    return;
  }

  controlTotalsSections = [];
  reportContent.innerHTML = [...peopleGroups.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "es", { sensitivity: "base" }))
    .map(
      ([person, group], personIndex) => {
        const dailyItems = [...group.daily.values()].sort(
          (left, right) =>
            left.date.localeCompare(right.date) ||
            left.puesto.localeCompare(right.puesto, "es", { sensitivity: "base" })
        );
        const weeklyItems = [...group.weekly.values()].sort(
          (left, right) =>
            left.weekKey.localeCompare(right.weekKey) ||
            left.puesto.localeCompare(right.puesto, "es", { sensitivity: "base" })
        );
        controlTotalsSections.push({ person, daily: dailyItems, weekly: weeklyItems });

        const dailyRows = dailyItems
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

        const weeklyRows = weeklyItems
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

        const copyButton = (listing, label) => `
          <button
            type="button"
            class="secondary-button control-totals-copy-png-button"
            data-totals-index="${personIndex}"
            data-totals-listing="${listing}"
            title="${escapeHtml(label)}"
            aria-label="${escapeHtml(label)}"
          >Copiar PNG</button>
        `;

        return `
          <section class="control-person-report-section">
            <h4>${escapeHtml(person)}</h4>
            <div class="control-totals-grid">
              <section>
                <div class="control-totals-listing-header">
                  <h5>Total diario por puesto</h5>
                  ${copyButton("daily", `Copiar PNG del total diario de ${person}`)}
                </div>
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
                <div class="control-totals-listing-header">
                  <h5>Total por semana y puesto</h5>
                  ${copyButton("weekly", `Copiar PNG del total semanal de ${person}`)}
                </div>
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
      .from("registros_horarios")
      .select(
        "id, personal, dni, centro, puesto, fecha, hora_inicio, hora_fin, tipo_jornada, observacion, eliminado, control"
      )
      .range(offset, offset + pageSize - 1);
    query = applyControlFiltersToQuery(query, filters);
    query = applyControlSortToQuery(query);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data?.length) {
      break;
    }

    rows.push(...data.map(enrichControlRecord).filter((row) => controlRecordMatchesFilters(row, filters)));
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

async function closeCandidateDetail(options = {}) {
  if (!options.force && !(await confirmCloseWithSave(detailForm, () => saveCandidateDetail()))) {
    return false;
  }

  candidateDetailPanel.classList.add("hidden");
  detailForm.reset();
  setDetailEditMode(false);
  markFormPristine(detailForm);
  return true;
}

async function saveCandidateDetail(event) {
  event?.preventDefault();

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

function getControlReportImageFileName(personName, dateFrom, dateTo) {
  return `control-personal-${sanitizeFileName(personName)}-${dateFrom || "sin-inicio"}-${dateTo || "sin-fin"}.png`;
}

async function getSelectedControlPersonalReportData() {
  const rows = await fetchAllFilteredControlRecordsForBulk();
  if (!rows.length) {
    throw new Error("No hay registros filtrados de control personal para generar el PNG.");
  }

  const personNames = [
    ...new Set(
      rows
        .map((row) => String(row.personal_resolved || getResolvedControlPersonal(row) || "").trim())
        .filter(Boolean)
    ),
  ];

  if (personNames.length !== 1) {
    throw new Error("Filtra una unica persona en Control personal antes de generar el PNG.");
  }

  const normalizedDates = rows
    .map((row) => normalizeImportedDate(row.fecha) || String(row.fecha ?? "").trim())
    .filter(Boolean)
    .sort();
  const filters = buildControlFilters();
  const dateFrom = filters.dateFrom || normalizedDates[0] || "";
  const dateTo = filters.dateTo || normalizedDates[normalizedDates.length - 1] || "";
  const sortedRows = [...rows].sort((left, right) => {
    const leftDate = normalizeImportedDate(left.fecha) || String(left.fecha ?? "");
    const rightDate = normalizeImportedDate(right.fecha) || String(right.fecha ?? "");
    return (
      leftDate.localeCompare(rightDate) ||
      String(left.hora_inicio ?? "").localeCompare(String(right.hora_inicio ?? "")) ||
      String(left.centro ?? "").localeCompare(String(right.centro ?? ""), "es", { sensitivity: "base" })
    );
  });

  return {
    personName: personNames[0],
    dateFrom,
    dateTo,
    rows: sortedRows,
    totalMinutes: sortedRows.reduce(
      (total, row) => total + calculateWorkedMinutes(row.hora_inicio, row.hora_fin),
      0
    ),
  };
}

function drawControlPersonalReportImage(reportData) {
  const { personName, dateFrom, dateTo, rows, totalMinutes } = reportData;
  const scale = 2;
  const margin = 40;
  const tableWidth = 1460;
  const canvasWidth = tableWidth + margin * 2;
  const columns = [
    { label: "Dia", key: "dia", width: 70 },
    { label: "Fecha", key: "fecha", width: 140 },
    { label: "Centro", key: "centro", width: 320 },
    { label: "Puesto", key: "puesto", width: 250 },
    { label: "Inicio", key: "inicio", width: 100 },
    { label: "Fin", key: "fin", width: 100 },
    { label: "Horas", key: "horas", width: 110 },
    { label: "Jornada", key: "jornada", width: 170 },
    { label: "Observacion", key: "observacion", width: 200 },
  ];
  const lineHeight = 26;
  const cellPadding = 10;
  const headerHeight = 42;
  const titleHeight = 136;
  const footerHeight = 72;
  const scratchCanvas = document.createElement("canvas");
  const scratchContext = scratchCanvas.getContext("2d");

  scratchContext.font = "24px Arial";
  const rowLayouts = rows.map((row) => {
    const normalizedDate = normalizeImportedDate(row.fecha) || row.fecha;
    const values = {
      dia: getControlWeekdayInfo(normalizedDate).letter,
      fecha: formatDisplayDate(normalizedDate),
      centro: row.centro || "-",
      puesto: row.puesto || "-",
      inicio: formatHourValue(row.hora_inicio).slice(0, 5) || "-",
      fin: formatHourValue(row.hora_fin).slice(0, 5) || "-",
      horas: formatMinutesAsHours(calculateWorkedMinutes(row.hora_inicio, row.hora_fin)),
      jornada: row.tipo_jornada || "-",
      observacion: row.observacion || "-",
    };
    const cellLines = columns.map((column) =>
      wrapCanvasText(scratchContext, values[column.key] || "-", column.width - cellPadding * 2)
    );
    const rowHeight = Math.max(46, Math.max(...cellLines.map((lines) => lines.length)) * lineHeight + cellPadding * 2);
    return { cellLines, rowHeight };
  });

  const canvasHeight =
    titleHeight +
    headerHeight +
    rowLayouts.reduce((total, layout) => total + layout.rowHeight, 0) +
    footerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const context = canvas.getContext("2d");
  context.scale(scale, scale);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "#001f54";
  context.font = "bold 34px Arial";
  context.fillText("Informe de control personal", margin, 46);
  context.font = "bold 26px Arial";
  context.fillText(personName, margin, 82);
  context.font = "22px Arial";
  context.fillText(`Periodo: ${formatDisplayDate(dateFrom) || "Sin fecha inicial"} - ${formatDisplayDate(dateTo) || "Sin fecha final"}`, margin, 114);

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

  rowLayouts.forEach(({ cellLines, rowHeight }) => {
    x = margin;
    context.font = "20px Arial";
    columns.forEach((column, columnIndex) => {
      context.strokeStyle = "#d6dbe7";
      context.strokeRect(x, y, column.width, rowHeight);
      context.fillStyle = "#001f54";
      cellLines[columnIndex].forEach((line, lineIndex) => {
        context.fillText(line, x + cellPadding, y + cellPadding + 20 + lineIndex * lineHeight);
      });
      x += column.width;
    });
    y += rowHeight;
  });

  const hoursColumn = columns.find((column) => column.key === "horas");
  const hoursLeft = margin + columns.slice(0, columns.indexOf(hoursColumn)).reduce((total, column) => total + column.width, 0);
  context.fillStyle = "#f1f5f9";
  context.fillRect(margin, y, tableWidth, 46);
  context.strokeStyle = "#94a3b8";
  context.strokeRect(margin, y, tableWidth, 46);
  context.fillStyle = "#001f54";
  context.font = "bold 22px Arial";
  context.fillText("Total", margin + cellPadding, y + 30);
  context.fillText(formatMinutesAsHours(totalMinutes), hoursLeft + cellPadding, y + 30);

  context.fillStyle = "#64748b";
  context.font = "18px Arial";
  context.fillText(`Generado: ${new Date().toLocaleString("es-ES")}`, margin, canvasHeight - 12);

  return canvas;
}

function closeControlReportImagePanel() {
  controlReportImagePanel?.classList.add("hidden");
}

function showControlPersonalReportImage() {
  void (async () => {
    try {
      const reportData = await getSelectedControlPersonalReportData();
      currentControlReportImageCanvas = drawControlPersonalReportImage(reportData);
      currentControlReportImageFileName = getControlReportImageFileName(
        reportData.personName,
        reportData.dateFrom,
        reportData.dateTo
      );

      if (controlReportImagePreview) {
        controlReportImagePreview.src = currentControlReportImageCanvas.toDataURL("image/png");
      }
      controlReportImagePanel?.classList.remove("hidden");
      setStatus("Imagen del informe de control generada correctamente.", "success");
    } catch (error) {
      setStatus(error?.message || "No se pudo generar la imagen del informe de control.", "error");
    }
  })();
}

async function copyControlReportImageToClipboard() {
  try {
    if (!currentControlReportImageCanvas) {
      throw new Error("Genera primero la imagen del informe.");
    }
    if (!navigator.clipboard || typeof window.ClipboardItem === "undefined") {
      throw new Error("El navegador no permite copiar imagenes al portapapeles.");
    }
    const blob = await canvasToBlob(currentControlReportImageCanvas);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus("Imagen copiada al portapapeles.", "success");
  } catch (error) {
    setStatus(error?.message || "No se pudo copiar la imagen.", "error");
  }
}

async function downloadControlReportImage() {
  try {
    if (!currentControlReportImageCanvas) {
      throw new Error("Genera primero la imagen del informe.");
    }
    const blob = await canvasToBlob(currentControlReportImageCanvas);
    triggerDownload(blob, currentControlReportImageFileName || "informe-control-personal.png");
  } catch (error) {
    setStatus(error?.message || "No se pudo descargar la imagen.", "error");
  }
}

function drawControlTotalsListingImage({ title, subtitle, columns, rows }) {
  const scale = 2;
  const margin = 40;
  const cellPadding = 10;
  const lineHeight = 26;
  const headerHeight = 42;
  const titleHeight = subtitle ? 108 : 72;
  const footerHeight = 52;
  const tableWidth = columns.reduce((total, column) => total + column.width, 0);
  const canvasWidth = tableWidth + margin * 2;
  const scratchContext = document.createElement("canvas").getContext("2d");

  scratchContext.font = "20px Arial";
  const rowLayouts = rows.map((cells) => {
    const cellLines = columns.map((column, index) =>
      wrapCanvasText(scratchContext, String(cells[index] ?? "-") || "-", column.width - cellPadding * 2)
    );
    const rowHeight = Math.max(
      40,
      Math.max(...cellLines.map((lines) => lines.length)) * lineHeight + cellPadding * 2
    );
    return { cellLines, rowHeight };
  });

  const canvasHeight =
    titleHeight +
    headerHeight +
    rowLayouts.reduce((total, layout) => total + layout.rowHeight, 0) +
    footerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const context = canvas.getContext("2d");
  context.scale(scale, scale);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "#001f54";
  context.font = "bold 26px Arial";
  context.fillText(title, margin, 42);
  if (subtitle) {
    context.fillStyle = "#475569";
    context.font = "18px Arial";
    context.fillText(subtitle, margin, 74);
  }

  let y = titleHeight;
  let x = margin;
  context.font = "bold 18px Arial";
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

  rowLayouts.forEach(({ cellLines, rowHeight }) => {
    x = margin;
    context.font = "18px Arial";
    columns.forEach((column, columnIndex) => {
      context.strokeStyle = "#d6dbe7";
      context.strokeRect(x, y, column.width, rowHeight);
      context.fillStyle = "#001f54";
      cellLines[columnIndex].forEach((line, lineIndex) => {
        context.fillText(line, x + cellPadding, y + cellPadding + 18 + lineIndex * lineHeight);
      });
      x += column.width;
    });
    y += rowHeight;
  });

  context.fillStyle = "#64748b";
  context.font = "16px Arial";
  context.fillText(`Generado: ${new Date().toLocaleString("es-ES")}`, margin, canvasHeight - 14);

  return canvas;
}

async function copyControlTotalsListingImage(index, listing) {
  try {
    const section = controlTotalsSections[index];
    if (!section) {
      throw new Error("No hay datos del listado para copiar.");
    }

    let title;
    let columns;
    let rows;
    if (listing === "weekly") {
      title = `${section.person} · Total por semana y puesto`;
      columns = [
        { label: "Semana", width: 340 },
        { label: "Puesto", width: 260 },
        { label: "Total horas", width: 150 },
      ];
      rows = section.weekly.map((item) => [
        item.weekLabel,
        item.puesto,
        formatMinutesAsHours(item.minutes),
      ]);
    } else {
      title = `${section.person} · Total diario por puesto`;
      columns = [
        { label: "Día", width: 70 },
        { label: "Fecha", width: 150 },
        { label: "Puesto", width: 260 },
        { label: "Total horas", width: 150 },
      ];
      rows = section.daily.map((item) => [
        getControlWeekdayInfo(item.date).letter,
        formatDisplayDate(item.date),
        item.puesto,
        formatMinutesAsHours(item.minutes),
      ]);
    }

    if (!rows.length) {
      throw new Error("El listado no tiene filas para copiar.");
    }

    const canvas = drawControlTotalsListingImage({
      title,
      subtitle: controlTotalsCurrentSummary,
      columns,
      rows,
    });
    const blob = await canvasToBlob(canvas);
    const fileName = `control-${sanitizeFileName(section.person)}-${listing === "weekly" ? "semanal" : "diario"}.png`;

    if (navigator.clipboard && typeof window.ClipboardItem !== "undefined") {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setStatus("Imagen del listado copiada al portapapeles.", "success");
        return;
      } catch (clipboardError) {
        // El portapapeles puede fallar (permisos o foco): caemos a descarga.
      }
    }

    triggerDownload(blob, fileName);
    setStatus("No se pudo copiar al portapapeles; se ha descargado el PNG.", "success");
  } catch (error) {
    setStatus(error?.message || "No se pudo copiar la imagen del listado.", "error");
  }
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
      .from("registros_horarios")
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
    const { error } = await supabase.from("registros_horarios").upsert(chunk, {
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
  setProgrammingImportStatus("");
  programmingImportPanel?.classList.remove("hidden");
}

function closeProgrammingImportPanel() {
  programmingImportPanel?.classList.add("hidden");
  programmingImportForm?.reset();
  resetProgrammingImportPreview();
  setProgrammingImportStatus("");
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
  setProgrammingImportStatus("");
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
    currentProgrammingAssignedInstallations
      .map((row) => normalizeProgrammingCell(row.name))
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
    currentProgrammingPersonnel.map((row) => normalizeProgrammingPersonnelName(row.name)).filter(Boolean)
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

function getProgrammingAssignedPersonnelRows() {
  return [...currentProgrammingPersonnel].sort((left, right) =>
    normalizeProgrammingPersonnelName(left.name).localeCompare(
      normalizeProgrammingPersonnelName(right.name),
      "es",
      { sensitivity: "base", numeric: true }
    )
  );
}

function getProgrammingAssignedInstallationRows() {
  return [...currentProgrammingAssignedInstallations].sort((left, right) =>
    normalizeProgrammingCell(left.name).localeCompare(normalizeProgrammingCell(right.name), "es", {
      sensitivity: "base",
      numeric: true,
    })
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
    const assignableNames = getProgrammingPersonnelNames().filter(
      (name) => name !== PROGRAMMING_UNASSIGNED_PERSONAL
    );
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
  setPersonalPickerOptions(
    "programming-filter",
    people.map((value) => ({ value, label: value }))
  );
  programmingFilterSport.innerHTML = ['<option value="">Todos los deportes</option>']
    .concat(sports.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`))
    .join("");

  programmingFilterDate.value = selectedDate;
  programmingFilterInstallation.value = installations.includes(currentValues.installation)
    ? currentValues.installation
    : "";
  const keepPersonal = people.includes(currentValues.personal) ? currentValues.personal : "";
  setPersonalPickerSelection("programming-filter", keepPersonal, keepPersonal);
  programmingFilterSport.value = sports.includes(currentValues.sport) ? currentValues.sport : "";
  syncFilterResetButtons(programmingFiltersForm);
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

// Muestra la ✕ (filter-reset-button) de un formulario de filtros solo cuando su
// control asociado tiene valor. Se usa en Programación y Control personal.
function syncFilterResetButtons(form) {
  if (!form) {
    return;
  }
  form.querySelectorAll(".filter-reset-button").forEach((button) => {
    const row = button.closest(".filter-control-row");
    const control = row?.querySelector("input, select, textarea");
    const hasValue =
      control?.type === "checkbox"
        ? control.checked
        : Boolean(String(control?.value ?? "").trim());
    button.classList.toggle("is-empty", !hasValue);
  });
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

  if (control === programmingFilterPersonal) {
    clearPersonalPicker("programming-filter");
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

async function fetchAllProgrammingRows(buildQuery, pageSize = PROGRAMMING_FETCH_PAGE_SIZE) {
  const rows = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await buildQuery().range(offset, offset + pageSize - 1);

    if (error) {
      return { data: rows, error };
    }

    const pageRows = data ?? [];
    rows.push(...pageRows);

    if (pageRows.length < pageSize) {
      return { data: rows, error: null };
    }
  }
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
  let { data, error } = await fetchAllProgrammingRows(() => {
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
    return reportQuery;
  });

  if (error && isMissingArchivedAtColumnError(error)) {
    ({ data, error } = await fetchAllProgrammingRows(() => {
      let fallbackReportQuery = supabase
        .from(PROGRAMMING_TABLE_NAME)
        .select("id, personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, sort_order");
      fallbackReportQuery = applyProgrammingTypeFilter(fallbackReportQuery)
        .gte("fecha", dateFrom)
        .lte("fecha", dateTo)
        .order("personal", { ascending: true })
        .order("fecha", { ascending: true })
        .order("hora_inicio", { ascending: true });
      return fallbackReportQuery;
    }));
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
    let { data, error } = await fetchAllProgrammingRows(() => {
      let query = supabase
        .from(PROGRAMMING_TABLE_NAME)
        .select(
          "id, personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, archived_at, sort_order, tipo_programacion"
        );
      query = applyProgrammingTypeFilter(query)
        .order("fecha", { ascending: true })
        .order("sort_order", { ascending: true });
      return query;
    });

    if (error && isMissingArchivedAtColumnError(error)) {
      ({ data, error } = await fetchAllProgrammingRows(() => {
        let fallbackQuery = supabase
          .from(PROGRAMMING_TABLE_NAME)
          .select("id, personal, instalacion, fecha, hora_inicio, hora_fin, hora_evento, deporte, actividad, sort_order, tipo_programacion");
        fallbackQuery = applyProgrammingTypeFilter(fallbackQuery)
          .order("fecha", { ascending: true })
          .order("sort_order", { ascending: true });
        return fallbackQuery;
      }));
    }

    if (error) {
      throw error;
    }

    const rows = filterActiveProgrammingInstallationRows(
      mapFindeSemanaRowsToProgramming(data),
      installationCatalog
    );
    renderProgrammingPreview(rows, getProgrammingSourceLabel(), { canUpload: false });
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

async function closeProgrammingDetail(options = {}) {
  if (!options.force && !(await confirmCloseWithSave(programmingDetailForm, () => saveProgrammingDetail()))) {
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
  event?.preventDefault();

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
    currentProgrammingPersonnel.map((person) => normalizeProgrammingText(person.name)).filter(Boolean)
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
  const assignedPersonnelRows = getProgrammingAssignedPersonnelRows();
  const personnelOptions = [
    '<option value="">Sin asignar</option>',
    ...assignedPersonnelRows.map(
      (person) =>
        `<option value="${escapeHtml(person.name)}">${escapeHtml(formatProgrammingPersonnelLabel(person))}</option>`
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
    currentProgrammingAssignedInstallations
      .map((installation) => normalizeProgrammingText(installation.name))
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
  const assignedInstallationRows = getProgrammingAssignedInstallationRows();
  const installationOptions = [
    '<option value="">Sin asignar</option>',
    ...assignedInstallationRows.map(
      (installation) =>
        `<option value="${escapeHtml(installation.name)}">${escapeHtml(installation.name)}</option>`
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

async function countInsertedProgrammingRowsBySource(supabase, sourceName, programmingType) {
  const { count, error } = await supabase
    .from(PROGRAMMING_TABLE_NAME)
    .select("id", { count: "exact", head: true })
    .eq("source_file", sourceName || "programacion.csv")
    .eq("tipo_programacion", normalizeProgrammingType(programmingType));

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function switchProgrammingTypeAndReload(programmingType) {
  currentProgrammingType = normalizeProgrammingType(programmingType);
  syncProgrammingTypeUi();
  await loadProgrammingPersonnel();
  await loadProgrammingFromSupabase();
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
    setProgrammingImportStatus("Necesitas iniciar sesión para cargar la programación en Supabase.", "error");
    return;
  }

  if (!filteredProgrammingImportRows.length) {
    setProgrammingImportStatus("No hay registros filtrados para insertar.", "error");
    return;
  }

  const importType = getProgrammingImportType();
  const insertButtonPreviousDisabled = programmingImportInsertButton?.disabled ?? false;
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
    setProgrammingImportStatus(
      `No se puede importar el archivo. ${validationErrors.slice(0, 3).join(" ")}${
        validationErrors.length > 3 ? ` Hay ${validationErrors.length} errores en total.` : ""
      }`,
      "error"
    );
    return;
  }

  try {
    setProgrammingImportStatus("Insertando registros filtrados...");
    await insertProgrammingRowsWithDiagnostics(supabase, rows);
    const insertedCount = await countInsertedProgrammingRowsBySource(
      supabase,
      pendingProgrammingImportSourceName,
      importType
    );
    await switchProgrammingTypeAndReload(importType);
    applyProgrammingImportPreviewFilters();
    setProgrammingImportStatus(
      `Registros filtrados insertados correctamente: ${rows.length}. La vista se ha cambiado a ${getProgrammingTypeLabel(
        importType
      )}. Supabase tiene ${insertedCount} registro${
        insertedCount === 1 ? "" : "s"
      } de este archivo en ese tipo.${
        unassignedCount
          ? ` ${unassignedCount} filas se importaron con Personal = "${PROGRAMMING_UNASSIGNED_PERSONAL}".`
          : ""
      }`,
      "success"
    );
  } catch (error) {
    setProgrammingImportStatus(`No se pudieron insertar los registros filtrados: ${error.message}`, "error");
    return;
  } finally {
    if (programmingImportInsertButton) {
      programmingImportInsertButton.disabled = insertButtonPreviousDisabled;
    }
  }
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
  const { error } = await supabase.from("registros_horarios").delete().in("id", ids);
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
      supabase.from("registros_horarios").select("id", { count: "exact", head: true }),
      filters,
      { requireDateRange: true }
    );
    deleteQuery = applyControlFiltersToQuery(
      supabase.from("registros_horarios").delete(),
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

async function closeControlDetail(options = {}) {
  if (!options.force && !(await confirmCloseWithSave(controlDetailForm, () => saveControlDetail()))) {
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
  event?.preventDefault();

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
    .from("registros_horarios")
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
  const { error } = await supabase.from("registros_horarios").delete().eq("id", row.id);

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

  if (filters.personal) {
    const [records, summaryResult] = await Promise.all([
      fetchAllFilteredControlRecordsForBulk(),
      fetchControlSummary(filters).then(
        () => ({ ok: true }),
        (summaryError) => ({ ok: false, error: summaryError })
      ),
    ]);

    if (requestId !== controlRecordsFetchRequestId) {
      return currentControlRecords;
    }

    currentControlRecords = records.slice(from, to + 1);
    filteredControlRecords = currentControlRecords;
    if (controlSelectiveDeleteMode) {
      const filteredIds = new Set(currentControlRecords.map((row) => String(row.id)));
      selectedControlDeleteIds = new Set(
        [...selectedControlDeleteIds].filter((id) => filteredIds.has(id))
      );
    }
    controlRecordsTotalCount = records.length;
    controlResultsTruncated = !summaryResult.ok;
    controlCurrentPage = Math.min(
      Math.max(controlCurrentPage, 1),
      Math.max(1, Math.ceil(controlRecordsTotalCount / controlPageSize))
    );
    if (!summaryResult.ok) {
      controlRecordsTotalMinutes = records.reduce((total, row) => {
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

  let query = supabase
    .from("registros_horarios")
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
        .from("registros_horarios")
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

    setLoginStatus("Validando acceso...");

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoginStatus(`No se pudo iniciar sesión: ${translateAuthError(error)}`, "error");
      return;
    }

    currentSession = data.session;
    switchPanel("private");
    togglePrivateView(true, data.user?.email ?? email);
    await loadPrivateDataAfterAuth();
    loginForm.reset();
    setLoginStatus("");
    setStatus("Acceso concedido. Panel privado conectado con Supabase.", "success");
  } catch (error) {
    setLoginStatus(`No se pudo iniciar sesión: ${translateAuthError(error)}`, "error");
  }
}

async function handlePasswordRecovery(event) {
  event.preventDefault();

  const email = passwordRecoveryEmailInput.value.trim();
  if (!email) {
    setPasswordRecoveryStatus("Escribe el correo para recuperar la contraseña.", "error");
    return;
  }

  try {
    setPasswordRecoveryStatus("Enviando enlace de recuperación...");
    const supabase = await getSupabaseClient();
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setPasswordRecoveryStatus(`No se pudo enviar el enlace: ${translateAuthError(error)}`, "error");
      return;
    }

    passwordRecoveryForm.reset();
    setPasswordRecoveryStatus("");
    showLoginFormView();
    // El aviso de éxito se muestra en la tarjeta de acceso, que es la vista a la
    // que se vuelve tras enviar el enlace.
    setLoginStatus("Enlace de recuperación enviado. Revisa el correo.", "success");
  } catch (error) {
    setPasswordRecoveryStatus(`No se pudo enviar el enlace: ${translateAuthError(error)}`, "error");
  }
}

async function loadPrivateDataAfterAuth() {
  await loadCurrentAccessRole();
  // El formulario de personal se renderiza al inicio (antes de conocer el rol),
  // asi que se vuelve a pintar ahora para mostrar/ocultar los campos
  // confidenciales segun el usuario sea admin o no.
  renderPersonalFormFields();
  setPersonalFormEditing(false);
  syncAccessTabVisibility();
  await refreshPrivateTabData(currentPrivateTabTarget);
}

function setContractsStatus(message = "", tone = "default") {
  setPanelStatus(contractsStatus, message, tone);
}

function getPersonalFieldInput(fieldKey) {
  return personalForm?.querySelector(`[name="${fieldKey}"]`) || null;
}

function renderPersonalFormFields() {
  if (!personalFormFields) {
    return;
  }

  let documentationGroupRendered = false;
  personalFormFields.innerHTML = PERSONAL_FIELDS
    .map((field) => {
      // Los campos confidenciales solo se muestran al rol admin. El resto de
      // usuarios ni los ve ni los envia (la vista los devuelve NULL y la
      // funcion de guardado ignora la escritura confidencial para no-admin).
      if (field.confidential && !currentUserIsAccessAdmin) {
        return "";
      }
      if (PERSONAL_DOCUMENTATION_FIELD_KEYS.has(field.key)) {
        if (documentationGroupRendered) {
          return "";
        }
        documentationGroupRendered = true;
        const checkboxes = PERSONAL_FIELDS
          .filter((item) => PERSONAL_DOCUMENTATION_FIELD_KEYS.has(item.key))
          .map(
            (item) => `
              <label class="checkbox-item with-label">
                <input name="${escapeHtml(item.key)}" type="checkbox" disabled />
                <span>${escapeHtml(item.label)}</span>
              </label>
            `
          )
          .join("");
        return `
          <fieldset class="full-width personal-checks-fieldset">
            <legend>Documentación y equipamiento</legend>
            <div class="checkbox-grid personal-checks-grid">
              ${checkboxes}
            </div>
          </fieldset>
        `;
      }

      const required = field.required ? " required" : "";
      if (field.type === "boolean") {
        return `
          <label class="checkbox-item with-label">
            <input name="${escapeHtml(field.key)}" type="checkbox" disabled />
            <span>${escapeHtml(field.label)}</span>
          </label>
        `;
      }

      if (field.type === "textarea") {
        return `
          <label class="full-width">
            ${escapeHtml(field.label)}
            <textarea name="${escapeHtml(field.key)}" rows="3" disabled${required}></textarea>
          </label>
        `;
      }

      if (field.type === "select") {
        const options = (field.options || [])
          .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
          .join("");
        return `
          <label>
            ${escapeHtml(field.label)}
            <select name="${escapeHtml(field.key)}" disabled${required}>
              <option value="">Sin vinculacion</option>
              ${options}
            </select>
          </label>
        `;
      }

      const inputType =
        field.type === "integer" || field.type === "numeric"
          ? "number"
          : field.type === "date"
            ? "date"
            : field.type === "email"
              ? "email"
              : "text";
      const step = field.type === "integer" ? ' step="1"' : field.type === "numeric" ? ' step="0.0001"' : "";
      return `
        <label>
          ${escapeHtml(field.label)}
          <input name="${escapeHtml(field.key)}" type="${inputType}"${step} disabled${required} />
        </label>
      `;
    })
    .join("");
}

function setPersonalFormEditing(isEditing) {
  currentPersonalMode = isEditing ? currentPersonalMode : "view";
  PERSONAL_FIELDS.forEach((field) => {
    const input = getPersonalFieldInput(field.key);
    if (!input) {
      return;
    }
    input.disabled = !isEditing;
    if (field.key === "id" && currentPersonalMode === "edit") {
      input.readOnly = true;
    } else {
      input.readOnly = false;
    }
  });
  personalEditButton?.classList.toggle("hidden", isEditing || currentPersonalMode === "new" || !currentSelectedPersonalId);
  personalSaveButton?.classList.toggle("hidden", !isEditing);
  personalCancelButton?.classList.toggle("hidden", !isEditing);
}

function clearPersonalForm() {
  personalForm?.reset();
  PERSONAL_FIELDS.forEach((field) => {
    const input = getPersonalFieldInput(field.key);
    if (!input) {
      return;
    }
    if (field.type === "boolean") {
      input.checked = false;
    } else {
      input.value = "";
    }
  });
}

function normalizeAccountNumber(value) {
  return String(value ?? "").replace(/\s+/g, "").toUpperCase();
}

function formatAccountNumber(value) {
  return normalizeAccountNumber(value).replace(/(.{4})/g, "$1 ").trim();
}

function reformatAccountNumberInput(input) {
  if (!input) {
    return;
  }
  const charsBeforeCaret = String(input.value).slice(0, input.selectionStart ?? input.value.length).replace(/\s+/g, "").length;
  const formatted = formatAccountNumber(input.value);
  input.value = formatted;
  let count = 0;
  let caret = formatted.length;
  for (let i = 0; i < formatted.length; i += 1) {
    if (count >= charsBeforeCaret) {
      caret = i;
      break;
    }
    if (formatted[i] !== " ") {
      count += 1;
    }
  }
  input.setSelectionRange(caret, caret);
}

function fillPersonalForm(row) {
  clearPersonalForm();
  if (!row) {
    return;
  }

  PERSONAL_FIELDS.forEach((field) => {
    const input = getPersonalFieldInput(field.key);
    if (!input) {
      return;
    }
    const value = row[field.key];
    if (field.type === "boolean") {
      input.checked = Boolean(value);
    } else if (field.type === "date") {
      input.value = formatNullableDate(value);
    } else if (field.key === "cuenta_corriente") {
      input.value = formatAccountNumber(value);
    } else {
      input.value = value ?? "";
    }
  });
}

function getPersonalDisplayName(row) {
  return row?.personal || [row?.nombre, row?.apellido].filter(Boolean).join(" ") || `Personal ${row?.id ?? ""}`.trim();
}

function renderPersonalVinculacionOptions() {
  if (!personalVinculacionFilter) {
    return;
  }

  const currentValue = personalVinculacionFilter.value;
  const configuredValues = new Set(PERSONAL_VINCULACION_OPTIONS.map((option) => option.value));
  const extraValues = Array.from(
    new Set(
      currentPersonalRows
        .map((row) => row.vinculacion_id)
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map(String)
    )
  )
    .filter((value) => !configuredValues.has(value))
    .sort((a, b) => Number(a) - Number(b));

  personalVinculacionFilter.innerHTML = [
    '<option value="">Todas las vinculaciones</option>',
    ...PERSONAL_VINCULACION_OPTIONS.map(
      (option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
    ),
    ...extraValues.map((value) => `<option value="${escapeHtml(value)}">Vinculacion ${escapeHtml(value)}</option>`),
  ].join("");
  personalVinculacionFilter.value =
    configuredValues.has(currentValue) || extraValues.includes(currentValue) ? currentValue : "";
}

function applyPersonalFilters() {
  const vinculacion = personalVinculacionFilter?.value || "";
  const search = normalizeSearchText(personalTextFilter?.value || "");

  filteredPersonalRows = currentPersonalRows.filter((row) => {
    if (vinculacion && String(row.vinculacion_id ?? "") !== vinculacion) {
      return false;
    }
    if (!search) {
      return true;
    }
    return normalizeSearchText(
      [
        row.personal,
        row.nombre,
        row.apellido,
        row.dni,
        row.email,
        row.movil,
        row.telefono,
        row.localidad,
        row.municipio,
        row.provincia,
      ].join(" ")
    ).includes(search);
  });

  renderPersonalList();
}

function renderPersonalList() {
  if (!personalList) {
    return;
  }

  if (!filteredPersonalRows.length) {
    personalList.innerHTML = '<option value="">No hay personal para mostrar</option>';
    personalList.disabled = true;
  } else {
    personalList.disabled = false;
    personalList.innerHTML = filteredPersonalRows
      .map((row) => {
        const selected = String(row.id) === currentSelectedPersonalId ? " selected" : "";
        const dni = row.dni ? ` - ${row.dni}` : "";
        const statusLabel =
          Number(row.vinculacion_id) === 4 ? " (no pert.)" : row.activo ? "" : " (inactivo)";
        return `<option value="${escapeHtml(row.id)}"${selected}>${escapeHtml(getPersonalDisplayName(row))}${escapeHtml(dni)}${escapeHtml(statusLabel)}</option>`;
      })
      .join("");
  }

  if (personalListSummary) {
    personalListSummary.textContent = `${filteredPersonalRows.length} de ${currentPersonalRows.length} personas`;
  }
}

function selectPersonal(personalId) {
  const row = currentPersonalRows.find((item) => String(item.id) === String(personalId));
  currentSelectedPersonalId = row ? String(row.id) : "";
  currentPersonalMode = "view";
  if (personalFormTitle) {
    personalFormTitle.textContent = row ? getPersonalDisplayName(row) : "Ficha de personal";
  }
  fillPersonalForm(row);
  setPersonalFormEditing(false);
  renderPersonalList();
  void refreshPersonalComplementosPanel();
}

function startNewPersonal() {
  currentSelectedPersonalId = "";
  currentPersonalMode = "new";
  if (personalFormTitle) {
    personalFormTitle.textContent = "Nueva persona";
  }
  clearPersonalForm();
  setPersonalFormEditing(true);
  getPersonalFieldInput("personal")?.focus();
  void refreshPersonalComplementosPanel();
}

function startEditPersonal() {
  if (!currentSelectedPersonalId) {
    setPersonalStatus("Selecciona una persona antes de editar.", "error");
    return;
  }
  currentPersonalMode = "edit";
  setPersonalFormEditing(true);
  getPersonalFieldInput("personal")?.focus();
}

async function loadNominaComplementosCatalog() {
  if (nominaComplementosCatalogLoaded) {
    return;
  }
  nominaComplementosCatalogLoaded = true;
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("nomina_complementos_catalogo")
    .select("id, nombre, tipo, unidad, medida_horas, bases_aplicables, activo")
    .order("nombre", { ascending: true });
  if (error) {
    // No es admin, o la tabla aun no existe: la seccion se queda oculta.
    nominaComplementosCatalogRows = [];
    return;
  }
  nominaComplementosCatalogRows = (data || []).filter((row) => row.activo !== false);
  if (personalComplementoSelect) {
    personalComplementoSelect.innerHTML =
      '<option value="">-- Selecciona --</option>' +
      nominaComplementosCatalogRows
        .map(
          (row) =>
            `<option value="${escapeHtml(row.id)}">${escapeHtml(row.nombre)} (${escapeHtml(row.tipo)})</option>`
        )
        .join("");
  }
}

function getNominaComplementoCatalog(complementoId) {
  return nominaComplementosCatalogRows.find((row) => String(row.id) === String(complementoId));
}

function updatePersonalComplementoFormVisibility() {
  const catalogo = getNominaComplementoCatalog(personalComplementoSelect?.value);
  const esVariable = catalogo?.tipo === "variable";
  const tipoEfectivo = esVariable ? personalComplementoTipoSelect?.value : catalogo?.tipo;

  personalComplementoTipoRow?.classList.toggle("hidden", !esVariable);

  // La unidad/medida_horas/bases solo se piden aqui cuando el catalogo no las
  // fija ya (tipo='variable'); en los demas casos vienen fijadas por el
  // trigger de personal_complementos desde el catalogo.
  const unidadVisible = esVariable && tipoEfectivo === "fijo";
  personalComplementoUnidadRow?.classList.toggle("hidden", !unidadVisible);

  const medidaHorasVisible = unidadVisible && personalComplementoUnidadSelect?.value === "por_hora";
  personalComplementoMedidaHorasRow?.classList.toggle("hidden", !medidaHorasVisible);

  const basesVisible = esVariable && tipoEfectivo === "porcentaje";
  personalComplementoBasesRow?.classList.toggle("hidden", !basesVisible);

  personalComplementoImporteRow?.classList.toggle("hidden", tipoEfectivo !== "fijo");
  personalComplementoPorcentajeRow?.classList.toggle("hidden", tipoEfectivo !== "porcentaje");

  if (personalComplementoCatalogoHint) {
    if (!catalogo || esVariable) {
      personalComplementoCatalogoHint.textContent = "";
    } else if (catalogo.tipo === "fijo") {
      const medida = catalogo.unidad === "por_hora" ? ` (${catalogo.medida_horas || "horas"})` : "";
      personalComplementoCatalogoHint.textContent = `Fijo · ${catalogo.unidad}${medida}`;
    } else {
      personalComplementoCatalogoHint.textContent = `Porcentaje · sobre ${(catalogo.bases_aplicables || []).join(", ")}`;
    }
  }
}

function resetPersonalComplementoForm() {
  currentEditingPersonalComplementoId = "";
  personalComplementoForm?.reset();
  if (personalComplementoIdInput) {
    personalComplementoIdInput.value = "";
  }
  personalComplementoForm
    ?.querySelectorAll("[data-personal-complemento-base]")
    .forEach((input) => {
      input.checked = false;
    });
  personalComplementoDeleteButton?.classList.add("hidden");
  updatePersonalComplementoFormVisibility();
}

function renderPersonalComplementosList() {
  if (!personalComplementosList) {
    return;
  }
  if (!currentPersonalComplementoRows.length) {
    personalComplementosList.innerHTML = '<p class="empty-state">Sin complementos asignados.</p>';
    return;
  }
  personalComplementosList.innerHTML = currentPersonalComplementoRows
    .map((row) => {
      const catalogo = getNominaComplementoCatalog(row.complemento_id);
      const valor =
        row.tipo === "porcentaje"
          ? `${(Number(row.porcentaje || 0) * 100).toLocaleString("es-ES", { maximumFractionDigits: 2 })} %`
          : `${Number(row.importe || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € (${row.unidad || ""})`;
      const vigencia = `${formatNullableDate(row.fecha_desde) || row.fecha_desde} – ${
        row.fecha_hasta ? formatNullableDate(row.fecha_hasta) || row.fecha_hasta : "indefinido"
      }`;
      const prorrateaTag = row.prorratea_en_extra ? " · prorratea en extra" : "";
      return `
        <div class="contract-service-row">
          <div>
            <strong>${escapeHtml(catalogo?.nombre || `Complemento ${row.complemento_id}`)}</strong>
            <span>${escapeHtml(valor)} · ${escapeHtml(vigencia)}${escapeHtml(prorrateaTag)}</span>
          </div>
          <div class="action-buttons">
            <button type="button" class="secondary-button" data-personal-complemento-edit="${escapeHtml(row.id)}">
              Editar
            </button>
            <button
              type="button"
              class="danger-button tooltip-button"
              aria-label="Eliminar complemento"
              data-personal-complemento-delete="${escapeHtml(row.id)}"
            >
              ${renderIcon("delete")}
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadPersonalComplementos(personalId) {
  if (!personalId) {
    currentPersonalComplementoRows = [];
    renderPersonalComplementosList();
    return;
  }
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_complementos")
    .select(
      "id, personal_id, complemento_id, fecha_desde, fecha_hasta, tipo, unidad, medida_horas, bases_aplicables, importe, porcentaje, prorratea_en_extra, notas"
    )
    .eq("personal_id", personalId)
    .order("fecha_desde", { ascending: false });
  if (error) {
    currentPersonalComplementoRows = [];
    renderPersonalComplementosList();
    return;
  }
  currentPersonalComplementoRows = data || [];
  renderPersonalComplementosList();
}

async function refreshPersonalComplementosPanel() {
  if (!personalComplementosSection) {
    return;
  }
  const canManage = currentUserIsAccessAdmin && Boolean(currentSelectedPersonalId);
  personalComplementosSection.classList.toggle("hidden", !canManage);
  resetPersonalComplementoForm();
  if (!canManage) {
    currentPersonalComplementoRows = [];
    renderPersonalComplementosList();
    return;
  }
  await loadNominaComplementosCatalog();
  await loadPersonalComplementos(currentSelectedPersonalId);
}

function openPersonalComplementoForEdit(complementoRowId) {
  const row = currentPersonalComplementoRows.find((item) => String(item.id) === String(complementoRowId));
  if (!row) {
    return;
  }
  currentEditingPersonalComplementoId = String(row.id);
  if (personalComplementoIdInput) personalComplementoIdInput.value = row.id;
  if (personalComplementoSelect) personalComplementoSelect.value = String(row.complemento_id);
  if (personalComplementoFechaDesdeInput) personalComplementoFechaDesdeInput.value = formatNullableDate(row.fecha_desde) || "";
  if (personalComplementoFechaHastaInput) personalComplementoFechaHastaInput.value = formatNullableDate(row.fecha_hasta) || "";
  if (personalComplementoTipoSelect) personalComplementoTipoSelect.value = row.tipo || "";
  if (personalComplementoUnidadSelect) personalComplementoUnidadSelect.value = row.unidad || "";
  if (personalComplementoMedidaHorasInput) personalComplementoMedidaHorasInput.value = row.medida_horas || "";
  if (personalComplementoImporteInput) {
    personalComplementoImporteInput.value = row.importe != null ? row.importe : "";
  }
  if (personalComplementoPorcentajeInput) {
    personalComplementoPorcentajeInput.value =
      row.porcentaje != null ? Number(row.porcentaje) * 100 : "";
  }
  if (personalComplementoProrrateaInput) personalComplementoProrrateaInput.checked = Boolean(row.prorratea_en_extra);
  if (personalComplementoNotasInput) personalComplementoNotasInput.value = row.notas || "";
  const bases = Array.isArray(row.bases_aplicables) ? row.bases_aplicables : [];
  personalComplementoForm
    ?.querySelectorAll("[data-personal-complemento-base]")
    .forEach((input) => {
      input.checked = bases.includes(input.value);
    });
  personalComplementoDeleteButton?.classList.remove("hidden");
  updatePersonalComplementoFormVisibility();
}

async function savePersonalComplemento(event) {
  event?.preventDefault();
  if (!currentSelectedPersonalId) {
    setPersonalStatus("Selecciona una persona antes de asignar complementos.", "error");
    return;
  }
  const complementoId = personalComplementoSelect?.value;
  const catalogo = getNominaComplementoCatalog(complementoId);
  if (!complementoId || !catalogo) {
    setPersonalStatus("Selecciona un complemento.", "error");
    return;
  }
  const fechaDesde = personalComplementoFechaDesdeInput?.value || "";
  if (!fechaDesde) {
    setPersonalStatus("Indica la fecha de vigencia desde.", "error");
    return;
  }

  const esVariable = catalogo.tipo === "variable";
  const tipoEfectivo = esVariable ? personalComplementoTipoSelect?.value : catalogo.tipo;
  if (esVariable && !tipoEfectivo) {
    setPersonalStatus(`"${catalogo.nombre}" es un complemento variable: indica si es fijo o porcentual.`, "error");
    return;
  }

  const payload = {
    personal_id: Number(currentSelectedPersonalId),
    complemento_id: Number(complementoId),
    fecha_desde: fechaDesde,
    fecha_hasta: personalComplementoFechaHastaInput?.value || null,
    prorratea_en_extra: Boolean(personalComplementoProrrateaInput?.checked),
    notas: personalComplementoNotasInput?.value.trim() || null,
  };

  if (esVariable) {
    payload.tipo = tipoEfectivo;
    if (tipoEfectivo === "fijo") {
      payload.unidad = personalComplementoUnidadSelect?.value || null;
      payload.medida_horas =
        payload.unidad === "por_hora" ? personalComplementoMedidaHorasInput?.value.trim() || null : null;
      payload.bases_aplicables = null;
    } else if (tipoEfectivo === "porcentaje") {
      payload.unidad = null;
      payload.medida_horas = null;
      const bases = Array.from(
        personalComplementoForm?.querySelectorAll("[data-personal-complemento-base]:checked") || []
      ).map((input) => input.value);
      payload.bases_aplicables = bases.length ? bases : null;
    }
  }

  if (tipoEfectivo === "fijo") {
    const importeValue = personalComplementoImporteInput?.value;
    if (!importeValue) {
      setPersonalStatus("Indica el importe del complemento.", "error");
      return;
    }
    payload.importe = Number(importeValue);
    payload.porcentaje = null;
  } else if (tipoEfectivo === "porcentaje") {
    const porcentajeValue = personalComplementoPorcentajeInput?.value;
    if (!porcentajeValue) {
      setPersonalStatus("Indica el porcentaje del complemento.", "error");
      return;
    }
    payload.porcentaje = Number(porcentajeValue) / 100;
    payload.importe = null;
  }

  const supabase = await getSupabaseClient();
  const query = currentEditingPersonalComplementoId
    ? supabase
        .from("personal_complementos")
        .update(payload)
        .eq("id", currentEditingPersonalComplementoId)
    : supabase.from("personal_complementos").insert(payload);
  const { error } = await query;
  if (error) {
    setPersonalStatus(`No se pudo guardar el complemento: ${error.message}`, "error");
    return;
  }

  resetPersonalComplementoForm();
  await loadPersonalComplementos(currentSelectedPersonalId);
  setPersonalStatus("Complemento guardado correctamente.", "success");
}

async function deletePersonalComplemento(complementoRowId) {
  if (!window.confirm("¿Borrar este complemento asignado?")) {
    return;
  }
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("personal_complementos").delete().eq("id", complementoRowId);
  if (error) {
    setPersonalStatus(`No se pudo borrar el complemento: ${error.message}`, "error");
    return;
  }
  if (String(currentEditingPersonalComplementoId) === String(complementoRowId)) {
    resetPersonalComplementoForm();
  }
  await loadPersonalComplementos(currentSelectedPersonalId);
  setPersonalStatus("Complemento borrado correctamente.", "success");
}

async function getNextPersonalId() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from("personal").select("id").order("id", { ascending: false }).limit(1);
  if (error) {
    throw error;
  }
  return Number(data?.[0]?.id || 0) + 1;
}

function collectPersonalPayload() {
  const payload = {};
  PERSONAL_FIELDS.forEach((field) => {
    const input = getPersonalFieldInput(field.key);
    if (!input) {
      return;
    }

    if (field.type === "boolean") {
      payload[field.key] = Boolean(input.checked);
      return;
    }

    const rawValue = String(input.value ?? "").trim();
    if (!rawValue) {
      payload[field.key] = null;
      return;
    }

    if (field.key === "cuenta_corriente") {
      payload[field.key] = normalizeAccountNumber(rawValue);
      return;
    }

    if (field.type === "integer") {
      payload[field.key] = Number.parseInt(rawValue, 10);
      return;
    }
    if (field.type === "select") {
      payload[field.key] = Number.parseInt(rawValue, 10);
      return;
    }
    if (field.type === "numeric") {
      payload[field.key] = Number(rawValue.replace(",", "."));
      return;
    }
    payload[field.key] = rawValue;
  });

  if (!payload.personal) {
    throw new Error("El campo Personal es obligatorio.");
  }
  if (payload.id !== null && (!Number.isInteger(payload.id) || payload.id <= 0)) {
    throw new Error("El ID debe ser un numero entero positivo.");
  }
  return payload;
}

function normalizePersonalImportHeader(value) {
  return normalizeCsvHeader(value);
}

function parsePersonalImportBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === null || value === undefined || value === "") {
    return false;
  }

  const normalized = normalizeSearchText(value);
  if (["true", "t", "1", "si", "s", "yes", "y", "verdadero"].includes(normalized)) {
    return true;
  }
  if (["false", "f", "0", "no", "n", "falso"].includes(normalized)) {
    return false;
  }

  throw new Error(`Valor booleano no reconocido: ${value}`);
}

function excelSerialDateToIso(value) {
  const serial = Number(value);
  if (!Number.isFinite(serial) || serial <= 0) {
    return null;
  }

  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  return new Date(utcValue).toISOString().slice(0, 10);
}

function parsePersonalImportDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    return excelSerialDateToIso(value);
  }

  const normalized = normalizeImportedDate(value);
  if (!normalized) {
    throw new Error(`Fecha no reconocida: ${value}`);
  }
  return normalized;
}

function splitPersonalImportName(value) {
  const parts = String(value ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { nombre: null, apellido: null };
  }
  if (parts.length === 1) {
    return { nombre: parts[0], apellido: null };
  }
  if (parts.length === 2) {
    return { nombre: parts[0], apellido: parts[1] };
  }
  if (parts.length === 3 && normalizeSearchText(parts[1]) === "jesus") {
    return { nombre: parts.slice(0, 2).join(" "), apellido: parts[2] };
  }
  return {
    nombre: parts.slice(0, -2).join(" "),
    apellido: parts.slice(-2).join(" "),
  };
}

function normalizePersonalImportValue(column, value) {
  if (PERSONAL_IMPORT_BOOLEAN_FIELDS.has(column)) {
    return parsePersonalImportBoolean(value);
  }
  if (PERSONAL_IMPORT_DATE_FIELDS.has(column)) {
    return parsePersonalImportDate(value);
  }
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }
  if (PERSONAL_IMPORT_INTEGER_FIELDS.has(column)) {
    const parsed = Number.parseInt(text.replace(",", "."), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (PERSONAL_IMPORT_NUMERIC_FIELDS.has(column)) {
    const parsed = Number(text.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (PERSONAL_IMPORT_TEXT_FIELDS.has(column)) {
    return text;
  }
  return value;
}

function validatePersonalImportRows(rows) {
  const duplicateIds = new Set();
  const seenIds = new Set();
  const duplicateDnis = new Set();
  const seenDnis = new Set();

  rows.forEach((row) => {
    const id = String(row.id ?? "").trim();
    if (id) {
      if (seenIds.has(id)) duplicateIds.add(id);
      seenIds.add(id);
    }

    const dni = normalizeControlDni(row.dni);
    if (dni) {
      if (seenDnis.has(dni)) duplicateDnis.add(dni);
      seenDnis.add(dni);
    }
  });

  if (duplicateIds.size) {
    throw new Error(`El Excel contiene IDs repetidos: ${Array.from(duplicateIds).join(", ")}.`);
  }
  if (duplicateDnis.size) {
    throw new Error(`El Excel contiene DNIs repetidos: ${Array.from(duplicateDnis).join(", ")}.`);
  }
}

function normalizePersonalImportRow(sourceRow, targetHeaders, rowNumber) {
  const row = {};
  targetHeaders.forEach((column, index) => {
    row[column] = normalizePersonalImportValue(column, sourceRow[index]);
  });

  if (!row.id || !row.personal) {
    throw new Error(`La fila ${rowNumber} no tiene ID o Personal.`);
  }

  if (!row.nombre || !row.apellido) {
    const nameParts = splitPersonalImportName(row.personal);
    row.nombre = row.nombre || nameParts.nombre;
    row.apellido = row.apellido || nameParts.apellido;
  }

  return row;
}

async function parsePersonalExcelFile(file) {
  const xlsxModule = await getXlsxClient();
  const XLSX = xlsxModule.default || xlsxModule;
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error("El Excel no contiene hojas.");
  }

  const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    defval: null,
  });
  const headerIndex = sheetRows.findIndex((row) => row.some((cell) => String(cell ?? "").trim()));
  if (headerIndex < 0) {
    throw new Error("El Excel no contiene cabeceras.");
  }

  const sourceHeaders = sheetRows[headerIndex].map(normalizePersonalImportHeader);
  const unmappedHeaders = sourceHeaders.filter((header) => header && !PERSONAL_IMPORT_HEADER_MAP[header]);
  if (unmappedHeaders.length) {
    throw new Error(`Columnas no reconocidas: ${Array.from(new Set(unmappedHeaders)).join(", ")}.`);
  }

  const targetHeaders = sourceHeaders.map((header) => PERSONAL_IMPORT_HEADER_MAP[header] || "");
  const rows = sheetRows
    .slice(headerIndex + 1)
    .map((sourceRow, index) => ({ sourceRow, rowNumber: headerIndex + index + 2 }))
    .filter(({ sourceRow }) => sourceRow.some((cell) => cell !== null && String(cell).trim() !== ""))
    .map(({ sourceRow, rowNumber }) => normalizePersonalImportRow(sourceRow, targetHeaders, rowNumber));

  validatePersonalImportRows(rows);
  return rows;
}

function buildPersonalImportStatus(summary) {
  const inserted = Number(summary?.filas_insertadas ?? 0);
  const updatedById = Number(summary?.existentes_por_id ?? 0);
  const updatedByDni = Number(summary?.existentes_por_dni ?? 0);
  const ambiguous = Number(summary?.dni_ambiguos_no_insertados ?? 0);
  const reviewed = Number(summary?.filas_revisadas_para_rellenar ?? 0);
  return [
    `Importacion completada: ${inserted} insertadas`,
    `${reviewed} revisadas para rellenar faltantes`,
    `${updatedById} existentes por ID`,
    `${updatedByDni} existentes por DNI`,
    `${ambiguous} DNIs ambiguos`,
  ].join(". ");
}

function getPersonalImportFieldLabel(fieldKey) {
  const field = PERSONAL_FIELDS.find((item) => item.key === fieldKey);
  if (field) {
    return field.label;
  }
  return fieldKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("es"));
}

function isPersonalImportEmptyValue(value) {
  return value === null || value === undefined || (typeof value === "string" && !value.trim());
}

function normalizePersonalComparableValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value).trim();
}

function getPersonalImportFillableColumns() {
  return PERSONAL_IMPORT_COLUMNS.filter(
    (column) => column !== "id" && !PERSONAL_IMPORT_BOOLEAN_FIELDS.has(column)
  );
}

function getPersonalImportPredictedChanges(existingRow, importRow) {
  return getPersonalImportFillableColumns()
    .filter((column) => {
      const incomingValue = importRow[column];
      if (isPersonalImportEmptyValue(incomingValue)) {
        return false;
      }
      return isPersonalImportEmptyValue(existingRow?.[column]);
    })
    .map((column) => ({
      column,
      label: getPersonalImportFieldLabel(column),
      value: normalizePersonalComparableValue(importRow[column]),
    }));
}

function getPersonalImportChangedColumnsForInsert(importRow) {
  return PERSONAL_IMPORT_COLUMNS
    .filter((column) => column !== "id" && !isPersonalImportEmptyValue(importRow[column]))
    .slice(0, 10)
    .map((column) => ({
      column,
      label: getPersonalImportFieldLabel(column),
      value: normalizePersonalComparableValue(importRow[column]),
    }));
}

async function fetchPersonalImportExistingRows() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_completo")
    .select(PERSONAL_IMPORT_SELECT_COLUMNS)
    .limit(10000);

  if (error) {
    throw error;
  }

  return data || [];
}

function buildPersonalImportPreviewRows(importRows, existingRows) {
  const byId = new Map(existingRows.map((row) => [String(row.id), row]));
  const dniGroups = new Map();
  existingRows.forEach((row) => {
    const dni = normalizeControlDni(row.dni);
    if (!dni) {
      return;
    }
    if (!dniGroups.has(dni)) {
      dniGroups.set(dni, []);
    }
    dniGroups.get(dni).push(row);
  });

  return importRows.map((row, index) => {
    const idKey = String(row.id);
    const dniKey = normalizeControlDni(row.dni);
    const idMatch = byId.get(idKey);
    const dniMatches = dniKey ? dniGroups.get(dniKey) || [] : [];
    const dniMatch = !idMatch && dniMatches.length === 1 ? dniMatches[0] : null;
    const existingRow = idMatch || dniMatch || null;
    const ambiguousDni = !idMatch && dniMatches.length > 1;
    const changes = existingRow
      ? getPersonalImportPredictedChanges(existingRow, row)
      : getPersonalImportChangedColumnsForInsert(row);
    const hasChanges = !existingRow || changes.length > 0;

    return {
      previewId: `personal-import-${index}`,
      row,
      existingRow,
      action: ambiguousDni
        ? "ambiguous"
        : existingRow
          ? idMatch
            ? "update_id"
            : "update_dni"
          : "insert",
      selected: !ambiguousDni && hasChanges,
      disabled: ambiguousDni || !hasChanges,
      changes,
    };
  });
}

function getPersonalImportActionLabel(item) {
  if (item.action === "insert") return "Alta nueva";
  if (item.action === "update_id") return "Completar por ID";
  if (item.action === "update_dni") return "Completar por DNI";
  if (item.action === "ambiguous") return "DNI ambiguo";
  return "Sin cambios";
}

function renderPersonalImportChanges(item) {
  if (item.action === "ambiguous") {
    return "Hay más de una persona existente con ese DNI.";
  }
  if (!item.changes.length) {
    return "No hay campos vacíos que completar.";
  }

  const visibleChanges = item.changes.slice(0, 6);
  const suffix = item.changes.length > visibleChanges.length
    ? ` +${item.changes.length - visibleChanges.length} más`
    : "";
  return visibleChanges
    .map((change) => `${change.label}: ${change.value}`)
    .join(" · ") + suffix;
}

function updatePersonalImportSelectionUi() {
  const selectableRows = pendingPersonalImportRows.filter((item) => !item.disabled);
  const selectedRows = selectableRows.filter((item) => item.selected);

  if (personalImportSelectedCount) {
    personalImportSelectedCount.textContent = `${selectedRows.length} seleccionada${
      selectedRows.length === 1 ? "" : "s"
    }`;
  }
  if (personalImportSelectAll) {
    personalImportSelectAll.checked = selectableRows.length > 0 && selectedRows.length === selectableRows.length;
    personalImportSelectAll.indeterminate =
      selectedRows.length > 0 && selectedRows.length < selectableRows.length;
    personalImportSelectAll.disabled = selectableRows.length === 0;
  }
  if (personalImportApplyButton) {
    personalImportApplyButton.disabled = selectedRows.length === 0;
  }
}

function renderPersonalImportPreview() {
  if (personalImportFileName) {
    personalImportFileName.textContent = pendingPersonalImportFileName || "-";
  }
  if (personalImportTotalCount) {
    personalImportTotalCount.textContent = `${pendingPersonalImportRows.length} fila${
      pendingPersonalImportRows.length === 1 ? "" : "s"
    }`;
  }

  if (!personalImportPreviewTableBody) {
    return;
  }

  personalImportPreviewTableBody.innerHTML = pendingPersonalImportRows.length
    ? pendingPersonalImportRows
        .map((item) => {
          const row = item.row;
          return `
            <tr>
              <td>
                <input
                  type="checkbox"
                  data-personal-import-select="${escapeHtml(item.previewId)}"
                  ${item.selected ? "checked" : ""}
                  ${item.disabled ? "disabled" : ""}
                  aria-label="Aplicar importación de ${escapeHtml(row.personal || "")}"
                />
              </td>
              <td>${escapeHtml(getPersonalImportActionLabel(item))}</td>
              <td>${escapeHtml(row.personal || "")}</td>
              <td>${escapeHtml(row.dni || "")}</td>
              <td>${escapeHtml(renderPersonalImportChanges(item))}</td>
            </tr>
          `;
        })
        .join("")
    : '<tr><td colspan="5" class="empty-state">Selecciona un Excel para revisar la carga.</td></tr>';

  updatePersonalImportSelectionUi();
}

function openPersonalImportPanel() {
  personalImportPanel?.classList.remove("hidden");
  updatePersonalImportSelectionUi();
}

function closePersonalImportPanel() {
  personalImportPanel?.classList.add("hidden");
}

function toggleAllPersonalImportRows(checked) {
  pendingPersonalImportRows.forEach((item) => {
    if (!item.disabled) {
      item.selected = checked;
    }
  });
  renderPersonalImportPreview();
}

function togglePersonalImportRow(previewId, checked) {
  const item = pendingPersonalImportRows.find((row) => row.previewId === previewId);
  if (!item || item.disabled) {
    return;
  }
  item.selected = checked;
  updatePersonalImportSelectionUi();
}

async function applySelectedPersonalImportRows() {
  const selectedItems = pendingPersonalImportRows.filter((item) => item.selected && !item.disabled);
  const rows = selectedItems.map((item) => ({ ...item.row }));

  if (!rows.length) {
    setPersonalStatus("No hay filas seleccionadas para importar.", "error");
    return;
  }
  if (rows.some((row) => !row.id || !row.personal)) {
    setPersonalStatus("Hay filas seleccionadas sin ID o Personal. Revisa la importación antes de aplicar.", "error");
    return;
  }

  try {
    personalImportApplyButton?.setAttribute("disabled", "true");
    setPersonalStatus(`Importando ${rows.length} fila${rows.length === 1 ? "" : "s"} seleccionada${rows.length === 1 ? "" : "s"}...`);
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc("import_coordinacion_personal", {
      p_rows: rows,
    });

    if (error) {
      throw error;
    }

    const summary = Array.isArray(data) ? data[0] : data;
    const processedRows = Number(summary?.filas_origen ?? 0);
    if (!summary || !Number.isFinite(processedRows) || processedRows <= 0) {
      throw new Error(
        `Supabase no confirmó filas procesadas para las ${rows.length} filas enviadas. Comprueba que el SQL actualizado de import_coordinacion_personal está aplicado.`
      );
    }
    if (processedRows !== rows.length) {
      throw new Error(
        `Supabase procesó ${processedRows} de ${rows.length} filas enviadas. No se confirma la importación; recarga la página y vuelve a intentarlo.`
      );
    }
    const actionRows =
      Number(summary?.filas_insertadas ?? 0) +
      Number(summary?.filas_revisadas_para_rellenar ?? 0) +
      Number(summary?.dni_ambiguos_no_insertados ?? 0);
    if (actionRows === 0) {
      throw new Error(
        `Supabase recibió ${processedRows} filas pero no insertó, revisó ni marcó ninguna como ambigua. La función import_coordinacion_personal activa en Supabase parece desactualizada; vuelve a ejecutar el SQL actualizado.`
      );
    }

    closePersonalImportPanel();
    pendingPersonalImportRows = [];
    pendingPersonalImportFileName = "";
    await loadPersonalManagement(String(rows[0]?.id || currentSelectedPersonalId || ""));
    setPersonalStatus(`${buildPersonalImportStatus(summary)} Filas enviadas: ${rows.length}.`, "success");
  } catch (error) {
    setPersonalStatus(formatSupabaseErrorDetails(error) || "No se pudo aplicar la importación seleccionada.", "error");
  } finally {
    personalImportApplyButton?.removeAttribute("disabled");
    updatePersonalImportSelectionUi();
  }
}

async function importPersonalExcelFile(file) {
  if (!file) {
    return;
  }

  try {
    await ensurePrivateSession();
    personalImportExcelButton?.setAttribute("disabled", "true");
    setPersonalStatus(`Leyendo ${file.name}...`);

    const rows = await parsePersonalExcelFile(file);
    if (!rows.length) {
      throw new Error("El Excel no contiene filas de personal.");
    }

    setPersonalStatus(`Preparando revisión de ${rows.length} fila${rows.length === 1 ? "" : "s"}...`);
    const existingRows = await fetchPersonalImportExistingRows();
    pendingPersonalImportRows = buildPersonalImportPreviewRows(rows, existingRows);
    pendingPersonalImportFileName = file.name;
    renderPersonalImportPreview();
    openPersonalImportPanel();
    const selectedRows = pendingPersonalImportRows.filter((item) => item.selected).length;
    setPersonalStatus(
      `Revisión preparada: ${selectedRows} fila${selectedRows === 1 ? "" : "s"} marcada${selectedRows === 1 ? "" : "s"} para aplicar.`,
      "success"
    );
  } catch (error) {
    setPersonalStatus(error?.message || "No se pudo importar el Excel de personal.", "error");
  } finally {
    personalImportExcelButton?.removeAttribute("disabled");
    if (personalImportExcelInput) {
      personalImportExcelInput.value = "";
    }
  }
}

async function savePersonal(event) {
  event.preventDefault();

  try {
    const payload = collectPersonalPayload();
    const supabase = await getSupabaseClient();
    const isNew = currentPersonalMode === "new";
    if (isNew && !payload.id) {
      payload.id = await getNextPersonalId();
    }
    if (!isNew && !currentSelectedPersonalId) {
      throw new Error("Selecciona una persona antes de guardar.");
    }

    personalSaveButton?.setAttribute("disabled", "true");
    setPersonalStatus("Guardando ficha...");

    const result = await supabase.rpc("save_coordinacion_personal", {
      p_personal: payload,
    });

    if (result.error) {
      throw result.error;
    }
    if (!result.data?.length) {
      throw new Error("No se actualizo ningun registro. Revisa permisos de la pestaña Personal en Supabase.");
    }

    await loadPersonalManagement(String(payload.id));
    setPersonalStatus("Ficha guardada correctamente.", "success");
  } catch (error) {
    setPersonalStatus(error?.message || "No se pudo guardar la ficha de personal.", "error");
  } finally {
    personalSaveButton?.removeAttribute("disabled");
  }
}

async function loadPersonalManagement(preferredPersonalId = currentSelectedPersonalId) {
  if (!personalList) {
    return;
  }

  setPersonalStatus("Cargando personal...");
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("personal_completo")
    .select(PERSONAL_SELECT_COLUMNS)
    .order("personal", { ascending: true });

  if (error) {
    setPersonalStatus(error.message || "No se pudo cargar el personal.", "error");
    return;
  }

  currentPersonalRows = data || [];
  renderPersonalVinculacionOptions();
  applyPersonalFilters();

  const selectedId =
    preferredPersonalId && currentPersonalRows.some((row) => String(row.id) === String(preferredPersonalId))
      ? String(preferredPersonalId)
      : filteredPersonalRows[0]?.id
        ? String(filteredPersonalRows[0].id)
        : "";

  if (selectedId) {
    selectPersonal(selectedId);
  } else {
    currentSelectedPersonalId = "";
    currentPersonalMode = "view";
    if (personalFormTitle) {
      personalFormTitle.textContent = "Ficha de personal";
    }
    clearPersonalForm();
    setPersonalFormEditing(false);
  }

  setPersonalStatus(currentPersonalRows.length ? "" : "No hay personal cargado.");
}

function formatNullableDate(value) {
  return String(value || "").slice(0, 10);
}

function formatNullableTime(value) {
  return String(value || "").slice(0, 5);
}

function getServicesForContract(contractId) {
  return currentContractServiceRows.filter((service) => Number(service.contrato_id) === Number(contractId));
}

function isCurrentContractAssignment(row) {
  return Boolean(row?.activo) && !row?.removed_at;
}

function getCurrentContractPersonalAssignments(contractId = currentEditingContractId) {
  return currentContractPersonalRows.filter(
    (row) => Number(row.contrato_id) === Number(contractId) && isCurrentContractAssignment(row)
  );
}

function getCurrentContractInstallationAssignments(contractId = currentEditingContractId) {
  return currentContractInstallationRows.filter(
    (row) => Number(row.contrato_id) === Number(contractId) && isCurrentContractAssignment(row)
  );
}

function formatContractPersonalLabel(row) {
  const dni = String(row?.dni || "").trim();
  return dni ? `${row.personal} (${dni})` : row.personal;
}

function renderContractAssignmentOptions() {
  const hasContract = Boolean(currentEditingContractId);
  contractPersonalSection?.classList.toggle("hidden", !hasContract);
  contractInstallationsSection?.classList.toggle("hidden", !hasContract);

  if (!hasContract) {
    return;
  }

  if (contractPersonalAvailableSelect && contractPersonalSelectedSelect) {
    const filterText = normalizeSearchText(contractPersonalFilter?.value || "");
    const assignedIds = new Set(
      getCurrentContractPersonalAssignments().map((row) => Number(row.personal_id))
    );
    const filteredRows = contractPersonalCatalogRows.filter((row) => {
      const haystack = normalizeSearchText(`${row.personal} ${row.dni}`);
      return !filterText || haystack.includes(filterText);
    });
    const availableRows = filteredRows.filter((row) => !assignedIds.has(Number(row.id)));
    const selectedRows = filteredRows.filter((row) => assignedIds.has(Number(row.id)));

    contractPersonalAvailableSelect.innerHTML = availableRows
      .map((row) => `<option value="${row.id}">${escapeHtml(formatContractPersonalLabel(row))}</option>`)
      .join("");
    contractPersonalSelectedSelect.innerHTML = selectedRows
      .map((row) => `<option value="${row.id}">${escapeHtml(formatContractPersonalLabel(row))}</option>`)
      .join("");
  }

  if (contractInstallationAvailableSelect && contractInstallationSelectedSelect) {
    const filterText = normalizeSearchText(contractInstallationFilter?.value || "");
    const assignedIds = new Set(
      getCurrentContractInstallationAssignments().map((row) => Number(row.instalacion_id))
    );
    const filteredRows = contractInstallationCatalogRows.filter((row) => {
      const haystack = normalizeSearchText(row.instalacion);
      return !filterText || haystack.includes(filterText);
    });
    const availableRows = filteredRows.filter((row) => !assignedIds.has(Number(row.id)));
    const selectedRows = filteredRows.filter((row) => assignedIds.has(Number(row.id)));

    contractInstallationAvailableSelect.innerHTML = availableRows
      .map((row) => `<option value="${row.id}">${escapeHtml(row.instalacion)}</option>`)
      .join("");
    contractInstallationSelectedSelect.innerHTML = selectedRows
      .map((row) => `<option value="${row.id}">${escapeHtml(row.instalacion)}</option>`)
      .join("");
  }
}

function getVisibleContractRows() {
  const showInactive = Boolean(contractsShowInactiveInput?.checked);
  return showInactive ? currentContractRows : currentContractRows.filter((contract) => contract.activo);
}

function getContractBulkFieldConfig() {
  return CONTRACT_BULK_FIELDS[contractsBulkFieldSelect?.value] || CONTRACT_BULK_FIELDS.fecha_inicio;
}

function getContractBulkControlValue(kind = "current") {
  const config = getContractBulkFieldConfig();
  if (config.type === "boolean") {
    return kind === "new" ? contractsBulkNewBoolSelect?.value || "false" : contractsBulkCurrentBoolSelect?.value || "false";
  }

  return kind === "new" ? contractsBulkNewValueInput?.value || "" : contractsBulkCurrentValueInput?.value || "";
}

function normalizeContractBulkValue(value, config = getContractBulkFieldConfig()) {
  if (config.type === "boolean") {
    return String(value) === "true";
  }

  if (config.type === "date") {
    return formatNullableDate(value);
  }

  if (config.type === "number") {
    const text = String(value ?? "").trim().replace(",", ".");
    return text ? Number(text) : null;
  }

  return String(value ?? "").trim();
}

function formatContractBulkValue(value, config = getContractBulkFieldConfig()) {
  if (config.type === "boolean") {
    return value ? "Sí" : "No";
  }

  if (config.type === "date") {
    return formatDisplayDate(value) || "vacío";
  }

  return String(value ?? "").trim() || "vacío";
}

function getContractBulkMatchingRows() {
  const field = contractsBulkFieldSelect?.value;
  const config = getContractBulkFieldConfig();
  if (!field || !CONTRACT_BULK_FIELDS[field]) {
    return [];
  }

  const currentValue = normalizeContractBulkValue(getContractBulkControlValue("current"), config);
  return getVisibleContractRows().filter((contract) => {
    const contractValue = normalizeContractBulkValue(contract[field], config);
    return contractValue === currentValue;
  });
}

function syncContractsBulkAssignmentUi() {
  if (!contractsBulkFieldSelect || !contractsBulkCurrentValueInput || !contractsBulkNewValueInput) {
    return;
  }

  const config = getContractBulkFieldConfig();
  const isBoolean = config.type === "boolean";
  contractsBulkCurrentValueInput.classList.toggle("hidden", isBoolean);
  contractsBulkNewValueInput.classList.toggle("hidden", isBoolean);
  contractsBulkCurrentBoolSelect?.classList.toggle("hidden", !isBoolean);
  contractsBulkNewBoolSelect?.classList.toggle("hidden", !isBoolean);
  if (!isBoolean) {
    contractsBulkCurrentValueInput.type = config.type === "number" ? "number" : config.type;
    contractsBulkNewValueInput.type = config.type === "number" ? "number" : config.type;
    contractsBulkCurrentValueInput.step = config.type === "number" ? "0.01" : "";
    contractsBulkNewValueInput.step = config.type === "number" ? "0.01" : "";
  }

  const matches = getContractBulkMatchingRows();
  if (contractsBulkMatchCount) {
    contractsBulkMatchCount.textContent = `${matches.length} coincidencia${matches.length === 1 ? "" : "s"}`;
  }
  if (contractsBulkApplyButton) {
    contractsBulkApplyButton.disabled = matches.length === 0;
  }
}

async function applyContractsBulkAssignment() {
  const field = contractsBulkFieldSelect?.value;
  const config = getContractBulkFieldConfig();
  if (!field || !CONTRACT_BULK_FIELDS[field]) {
    setContractsStatus("Selecciona un campo válido.", "error");
    return;
  }

  const matches = getContractBulkMatchingRows();
  if (!matches.length) {
    setContractsStatus("No hay contratos visibles con ese valor actual.", "error");
    return;
  }

  const currentValue = normalizeContractBulkValue(getContractBulkControlValue("current"), config);
  const newValue = normalizeContractBulkValue(getContractBulkControlValue("new"), config);
  if (config.type === "number" && getContractBulkControlValue("new").trim() && !Number.isFinite(newValue)) {
    setContractsStatus("Indica un valor numérico válido.", "error");
    return;
  }
  if (field === "contrato" && !String(newValue || "").trim()) {
    setContractsStatus("El nombre del contrato no puede quedar vacío.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Vas a cambiar ${config.label} de ${formatContractBulkValue(currentValue, config)} a ${formatContractBulkValue(newValue, config)} en ${matches.length} contrato${
      matches.length === 1 ? "" : "s"
    } visible${matches.length === 1 ? "" : "s"}.`
  );
  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("contratos")
    .update({ [field]: newValue === "" ? null : newValue })
    .in(
      "id",
      matches.map((contract) => Number(contract.id))
    );

  if (error) {
    setContractsStatus(`No se pudo aplicar la asignación masiva: ${error.message}`, "error");
    return;
  }

  await loadContractsManagement();
  setContractsStatus(`Asignación masiva aplicada a ${matches.length} contrato${matches.length === 1 ? "" : "s"}.`, "success");
}

function renderContractsTable() {
  if (!contractsTableBody) {
    return;
  }

  const visibleContracts = getVisibleContractRows();
  syncContractsBulkAssignmentUi();
  if (!visibleContracts.length) {
    contractsTableBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No hay contratos para mostrar.</td></tr>';
    return;
  }

  contractsTableBody.innerHTML = visibleContracts
    .map((contract) => {
      const services = getServicesForContract(contract.id);
      const activeServices = services.filter((service) => service.activo).length;
      return `
        <tr>
          <td>${escapeHtml(contract.id)}</td>
          <td>
            <button
              type="button"
              class="contract-name-button"
              data-contract-edit="${escapeHtml(contract.id)}"
              aria-label="Editar contrato ${escapeHtml(contract.contrato || "Sin nombre")}"
            >
              ${escapeHtml(contract.contrato || "Sin nombre")}
            </button>
          </td>
          <td>${escapeHtml(contract.cliente || "-")}</td>
          <td>${escapeHtml(contract.expediente || "-")}</td>
          <td>${services.length} servicio${services.length === 1 ? "" : "s"} (${activeServices} activo${activeServices === 1 ? "" : "s"})</td>
          <td>${escapeHtml(contract.activo ? "Activo" : "Inactivo")}</td>
        </tr>
      `;
    })
    .join("");
}

function renderContractServicesList() {
  if (!contractServicesList) {
    return;
  }

  if (!currentEditingContractId) {
    contractServicesList.innerHTML =
      '<p class="empty-state">Guarda el contrato antes de añadir servicios.</p>';
    return;
  }

  const services = getServicesForContract(currentEditingContractId);
  if (!services.length) {
    contractServicesList.innerHTML = '<p class="empty-state">Este contrato no tiene servicios.</p>';
    return;
  }

  contractServicesList.innerHTML = services
    .map(
      (service) => `
        <div class="contract-service-row">
          <div>
            <strong>${escapeHtml(service.servicio)}</strong>
            <span>${escapeHtml(service.descripcion || "")}</span>
          </div>
          <span>${service.activo ? "Activo" : "Inactivo"}</span>
          <div class="action-buttons">
            <button type="button" class="secondary-button" data-contract-service-edit="${escapeHtml(service.id)}">
              Editar
            </button>
            <button
              type="button"
              class="danger-button tooltip-button"
              aria-label="Eliminar servicio"
              data-contract-service-delete="${escapeHtml(service.id)}"
            >
              ${renderIcon("delete")}
            </button>
          </div>
        </div>
      `
    )
    .join("");
}

async function loadContractsManagement() {
  setContractsStatus("Cargando contratos...");
  contractsNewButton?.classList.toggle("hidden", !currentUserIsAccessAdmin);
  const supabase = await getSupabaseClient();
  const [
    contractsResult,
    servicesResult,
    personalCatalogResult,
    installationCatalogResult,
    contractPersonalResult,
    contractInstallationResult,
  ] = await Promise.all([
    supabase
      .from("contratos")
      .select("id, contrato, descripcion, presupuesto_anual, fecha_inicio, fecha_fin, expediente, cpv, importe, cliente, activo, seleccionar, desplazamiento, agrupacion_nomina, iva, tiene_nocturnidad, nocturnidad_inicio, nocturnidad_fin")
      .order("contrato", { ascending: true }),
    supabase
      .from("servicios")
      .select("id, contrato_id, servicio, descripcion, activo, created_at, updated_at")
      .order("servicio", { ascending: true }),
    supabase
      .from("personal")
      .select("id, personal, dni, activo, vinculacion_id")
      .order("personal", { ascending: true }),
    supabase
      .from("instalaciones")
      .select("id, instalacion, activo")
      .order("instalacion", { ascending: true }),
    supabase
      .from("contrato_personal")
      .select("contrato_id, personal_id, activo, fecha_inicio, fecha_fin, removed_at"),
    supabase
      .from("contrato_instalaciones")
      .select("contrato_id, instalacion_id, activo, fecha_inicio, fecha_fin, removed_at"),
  ]);

  const error =
    contractsResult.error ||
    servicesResult.error ||
    personalCatalogResult.error ||
    installationCatalogResult.error;
  if (error) {
    setContractsStatus(`No se pudieron cargar contratos: ${error.message}`, "error");
    return;
  }

  currentContractRows = contractsResult.data || [];
  currentContractServiceRows = servicesResult.data || [];
  contractPersonalCatalogRows = (personalCatalogResult.data || [])
    .filter((row) => row.id && row.personal)
    .filter((row) => [1, 2].includes(Number(row.vinculacion_id)))
    .map((row) => ({
      id: Number(row.id),
      personal: row.personal,
      dni: row.dni || "",
    }));
  contractInstallationCatalogRows = (installationCatalogResult.data || [])
    .filter((row) => row.id && row.instalacion)
    .filter((row) => row.activo !== false)
    .map((row) => ({
      id: Number(row.id),
      instalacion: row.instalacion,
    }));
  currentContractPersonalRows = contractPersonalResult.error ? [] : contractPersonalResult.data || [];
  currentContractInstallationRows = contractInstallationResult.error
    ? []
    : contractInstallationResult.data || [];
  renderContractsTable();
  renderContractServicesList();
  renderContractAssignmentOptions();

  const assignmentError = contractPersonalResult.error || contractInstallationResult.error;
  if (assignmentError) {
    setContractsStatus(
      `Contratos cargados. Falta ejecutar la migración de asignaciones por contrato: ${assignmentError.message}`,
      "error"
    );
    return;
  }

  setContractsStatus(
    `Contratos visibles: ${getVisibleContractRows().length} de ${currentContractRows.length}.`,
    "success"
  );
}

function resetContractServiceForm() {
  contractServiceForm?.reset();
  if (contractServiceIdInput) {
    contractServiceIdInput.value = "";
  }
  if (contractServiceActiveInput) {
    contractServiceActiveInput.checked = true;
  }
}

function syncContractNightFieldsState() {
  const enabled = Boolean(contractDetailNightInput?.checked);
  contractDetailNightFieldsWrap?.classList.toggle("hidden", !enabled);
  if (contractDetailNightStartInput) {
    contractDetailNightStartInput.disabled = !enabled;
  }
  if (contractDetailNightEndInput) {
    contractDetailNightEndInput.disabled = !enabled;
  }
}

function openContractDetailPanel(contractId = "") {
  const contract = currentContractRows.find((item) => String(item.id) === String(contractId));
  currentEditingContractId = contract ? String(contract.id) : "";
  if (contractDetailTitle) {
    contractDetailTitle.textContent = contract ? "Editar contrato" : "Nuevo contrato";
  }
  if (contractDetailIdInput) {
    contractDetailIdInput.value = contract?.id ?? "";
    contractDetailIdInput.readOnly = Boolean(contract);
  }
  if (contractDetailNameInput) {
    contractDetailNameInput.value = contract?.contrato || "";
  }
  if (contractDetailClientInput) {
    contractDetailClientInput.value = contract?.cliente || "";
  }
  if (contractDetailFileInput) {
    contractDetailFileInput.value = contract?.expediente || "";
  }
  if (contractDetailStartInput) {
    contractDetailStartInput.value = formatNullableDate(contract?.fecha_inicio);
  }
  if (contractDetailEndInput) {
    contractDetailEndInput.value = formatNullableDate(contract?.fecha_fin);
  }
  if (contractDetailAmountInput) {
    contractDetailAmountInput.value = contract?.importe || "";
  }
  if (contractDetailVatInput) {
    contractDetailVatInput.value = contract?.iva ?? "";
  }
  if (contractDetailActiveInput) {
    contractDetailActiveInput.checked = Boolean(contract?.activo);
  }
  if (contractDetailNightInput) {
    contractDetailNightInput.checked = Boolean(contract?.tiene_nocturnidad);
  }
  if (contractDetailNightStartInput) {
    contractDetailNightStartInput.value = formatNullableTime(contract?.nocturnidad_inicio) || "22:00";
  }
  if (contractDetailNightEndInput) {
    contractDetailNightEndInput.value = formatNullableTime(contract?.nocturnidad_fin) || "06:00";
  }
  syncContractNightFieldsState();
  contractDetailDeleteButton?.classList.toggle("hidden", !contract);
  contractServicesSection?.classList.toggle("hidden", !contract);
  contractPersonalSection?.classList.toggle("hidden", !contract);
  contractInstallationsSection?.classList.toggle("hidden", !contract);
  resetContractServiceForm();
  renderContractServicesList();
  renderContractAssignmentOptions();
  markFormPristine(contractDetailForm);
  contractDetailPanel?.classList.remove("hidden");
  contractDetailNameInput?.focus();
}

async function closeContractDetailPanel(options = {}) {
  if (!options.force && !(await confirmCloseWithSave(contractDetailForm, () => saveContract()))) {
    return false;
  }
  contractDetailPanel?.classList.add("hidden");
  contractDetailForm?.reset();
  resetContractServiceForm();
  if (contractPersonalFilter) {
    contractPersonalFilter.value = "";
  }
  if (contractInstallationFilter) {
    contractInstallationFilter.value = "";
  }
  currentEditingContractId = "";
  renderContractAssignmentOptions();
  return true;
}

function getContractPayload() {
  return {
    id: Number(contractDetailIdInput?.value),
    contrato: contractDetailNameInput?.value.trim() || null,
    cliente: contractDetailClientInput?.value.trim() || null,
    expediente: contractDetailFileInput?.value.trim() || null,
    fecha_inicio: contractDetailStartInput?.value || null,
    fecha_fin: contractDetailEndInput?.value || null,
    importe: contractDetailAmountInput?.value.trim() || null,
    iva: contractDetailVatInput?.value ? Number(contractDetailVatInput.value) : null,
    activo: Boolean(contractDetailActiveInput?.checked),
    tiene_nocturnidad: Boolean(contractDetailNightInput?.checked),
    nocturnidad_inicio: contractDetailNightStartInput?.value || "22:00",
    nocturnidad_fin: contractDetailNightEndInput?.value || "06:00",
  };
}

async function saveContract(event) {
  event?.preventDefault();
  const payload = getContractPayload();
  if (!Number.isInteger(payload.id) || payload.id <= 0 || !payload.contrato) {
    setContractsStatus("Indica ID y nombre de contrato.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("contratos").upsert(payload, { onConflict: "id" });
  if (error) {
    setContractsStatus(`No se pudo guardar el contrato: ${error.message}`, "error");
    return;
  }

  currentEditingContractId = String(payload.id);
  await loadContractsManagement();
  openContractDetailPanel(payload.id);
  setContractsStatus("Contrato guardado correctamente.", "success");
}

async function deleteCurrentContract() {
  if (!currentEditingContractId) {
    return;
  }

  const confirmed = window.confirm("Vas a eliminar el contrato. Si tiene servicios o actividades asociadas, Supabase puede impedirlo.");
  if (!confirmed) {
    return;
  }

  if (programmingImportInsertButton) {
    programmingImportInsertButton.disabled = true;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("contratos").delete().eq("id", Number(currentEditingContractId));
  if (error) {
    setContractsStatus(`No se pudo eliminar el contrato: ${error.message}`, "error");
    return;
  }

  closeContractDetailPanel({ force: true });
  await loadContractsManagement();
  setContractsStatus("Contrato eliminado correctamente.", "success");
}

async function saveContractService(event) {
  event.preventDefault();
  if (!currentEditingContractId) {
    setContractsStatus("Guarda primero el contrato.", "error");
    return;
  }

  const payload = {
    contrato_id: Number(currentEditingContractId),
    servicio: contractServiceNameInput?.value.trim() || null,
    descripcion: contractServiceDescriptionInput?.value.trim() || null,
    activo: Boolean(contractServiceActiveInput?.checked),
  };
  const serviceId = contractServiceIdInput?.value;
  if (!payload.servicio) {
    setContractsStatus("Indica el nombre del servicio.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const request = serviceId
    ? supabase.from("servicios").update(payload).eq("id", Number(serviceId))
    : supabase.from("servicios").insert(payload);
  const { error } = await request;
  if (error) {
    setContractsStatus(`No se pudo guardar el servicio: ${error.message}`, "error");
    return;
  }

  resetContractServiceForm();
  await loadContractsManagement();
  renderContractServicesList();
  setContractsStatus("Servicio guardado correctamente.", "success");
}

function editContractService(serviceId) {
  const service = currentContractServiceRows.find((item) => String(item.id) === String(serviceId));
  if (!service) {
    return;
  }

  if (contractServiceIdInput) {
    contractServiceIdInput.value = service.id;
  }
  if (contractServiceNameInput) {
    contractServiceNameInput.value = service.servicio || "";
  }
  if (contractServiceDescriptionInput) {
    contractServiceDescriptionInput.value = service.descripcion || "";
  }
  if (contractServiceActiveInput) {
    contractServiceActiveInput.checked = Boolean(service.activo);
  }
  contractServiceNameInput?.focus();
}

async function deleteContractService(serviceId) {
  const confirmed = window.confirm("Vas a eliminar este servicio.");
  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("servicios").delete().eq("id", Number(serviceId));
  if (error) {
    setContractsStatus(`No se pudo eliminar el servicio: ${error.message}`, "error");
    return;
  }

  await loadContractsManagement();
  renderContractServicesList();
  setContractsStatus("Servicio eliminado correctamente.", "success");
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function setContractPersonalBatch(personalIds, isEnabled) {
  const ids = personalIds.map(Number).filter(Boolean);
  if (!currentEditingContractId || !ids.length) {
    return;
  }

  if (!isEnabled) {
    const confirmed = window.confirm(
      "Vas a finalizar la asignación de este personal al contrato. Las actividades ya creadas no se modificarán."
    );
    if (!confirmed) {
      return;
    }
  }

  const supabase = await getSupabaseClient();
  const today = getTodayIsoDate();
  const contractId = Number(currentEditingContractId);
  const request = isEnabled
    ? supabase.from("contrato_personal").upsert(
        ids.map((personalId) => ({
          contrato_id: contractId,
          personal_id: personalId,
          activo: true,
          fecha_inicio: today,
          fecha_fin: null,
          removed_at: null,
        })),
        { onConflict: "contrato_id,personal_id" }
      )
    : supabase
        .from("contrato_personal")
        .update({
          activo: false,
          fecha_fin: today,
          removed_at: new Date().toISOString(),
        })
        .eq("contrato_id", contractId)
        .in("personal_id", ids);

  const { error } = await request;
  if (error) {
    setContractsStatus(`No se pudo actualizar el personal del contrato: ${error.message}`, "error");
    return;
  }

  await loadContractsManagement();
  renderContractAssignmentOptions();
  setContractsStatus("Personal del contrato actualizado.", "success");
}

async function setContractInstallationBatch(installationIds, isEnabled) {
  const ids = installationIds.map(Number).filter(Boolean);
  if (!currentEditingContractId || !ids.length) {
    return;
  }

  if (!isEnabled) {
    const confirmed = window.confirm(
      "Vas a finalizar la asignación de estas instalaciones al contrato. Las actividades ya creadas no se modificarán."
    );
    if (!confirmed) {
      return;
    }
  }

  const supabase = await getSupabaseClient();
  const today = getTodayIsoDate();
  const contractId = Number(currentEditingContractId);
  const request = isEnabled
    ? supabase.from("contrato_instalaciones").upsert(
        ids.map((instalacionId) => ({
          contrato_id: contractId,
          instalacion_id: instalacionId,
          activo: true,
          fecha_inicio: today,
          fecha_fin: null,
          removed_at: null,
        })),
        { onConflict: "contrato_id,instalacion_id" }
      )
    : supabase
        .from("contrato_instalaciones")
        .update({
          activo: false,
          fecha_fin: today,
          removed_at: new Date().toISOString(),
        })
        .eq("contrato_id", contractId)
        .in("instalacion_id", ids);

  const { error } = await request;
  if (error) {
    setContractsStatus(`No se pudieron actualizar las instalaciones del contrato: ${error.message}`, "error");
    return;
  }

  await loadContractsManagement();
  renderContractAssignmentOptions();
  setContractsStatus("Instalaciones del contrato actualizadas.", "success");
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value ?? "").trim()
  );
}

function normalizeAccessRole(value) {
  return ["admin", "coordinator", "area_coordinator", "viewer"].includes(value) ? value : "viewer";
}

function getAccessServiceLabel(service) {
  const contractName = service.contractName || `Contrato ${service.contrato_id}`;
  return `${contractName} / ${service.servicio}`;
}

function getSettingsCatalogConfig(catalog = currentSettingsCatalog) {
  return SETTINGS_CATALOGS[catalog] || SETTINGS_CATALOGS.puestos;
}

function getAvailableSettingsFields(config = getSettingsCatalogConfig()) {
  if (!(currentSettingsAvailableFieldKeys instanceof Set)) {
    return config.fields;
  }
  return config.fields.filter((field) => currentSettingsAvailableFieldKeys.has(field.key));
}

function getAvailableSettingsListFields(config = getSettingsCatalogConfig()) {
  if (!(currentSettingsAvailableFieldKeys instanceof Set)) {
    return config.listFields;
  }
  return config.listFields.filter((field) => currentSettingsAvailableFieldKeys.has(field));
}

function resetSettingsSort() {
  const config = getSettingsCatalogConfig();
  currentSettingsSortField = config.order;
  currentSettingsSortDirection = "asc";
}

function renderSettingsSubtabs() {
  settingsSubtabButtons.forEach((button) => {
    const view = button.dataset.settingsView;
    const isActive =
      view === "access"
        ? currentSettingsView === "access"
        : view === "reports"
          ? currentSettingsView === "reports"
        : currentSettingsView === "catalog" && button.dataset.settingsCatalog === currentSettingsCatalog;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderSettingsTable() {
  if (!settingsTableHead || !settingsTableBody) {
    return;
  }

  const config = getSettingsCatalogConfig();
  const fields = getAvailableSettingsFields(config);
  const listFields = getAvailableSettingsListFields(config);
  settingsTableHead.innerHTML = `
    <tr>
      ${listFields.map((field) => {
        const label = fields.find((item) => item.key === field)?.label || field;
        const isActive = currentSettingsSortField === field;
        return `
          <th>
            <button
              type="button"
              class="sort-button settings-sort-button${isActive ? ` active sort-${currentSettingsSortDirection}` : ""}"
              data-settings-sort="${escapeHtml(field)}"
            >
              ${escapeHtml(label)}
            </button>
          </th>
        `;
      }).join("")}
    </tr>
  `;

  if (!currentSettingsRows.length) {
    settingsTableBody.innerHTML = `
      <tr>
        <td colspan="${listFields.length}" class="empty-state">No hay registros en ${escapeHtml(config.label)}.</td>
      </tr>
    `;
    return;
  }

  settingsTableBody.innerHTML = getSortedSettingsRows()
    .map(
      (row) => `
        <tr>
          ${listFields
            .map((field, index) => {
              const raw = config.cellValue ? config.cellValue(row, field) : row[field];
              const value = escapeHtml(formatSettingsCell(raw));
              if (index === 0) {
                return `<td><button type="button" class="row-name-button" data-settings-edit="${escapeHtml(row.id)}" aria-label="Editar registro">${value}</button></td>`;
              }
              return `<td>${value}</td>`;
            })
            .join("")}
        </tr>
      `
    )
    .join("");
}

function formatSettingsCell(value) {
  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }
  return value ?? "";
}

function compareSettingsValues(leftValue, rightValue) {
  if (leftValue == null && rightValue == null) {
    return 0;
  }
  if (leftValue == null) {
    return 1;
  }
  if (rightValue == null) {
    return -1;
  }
  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return leftValue - rightValue;
  }
  return String(leftValue).localeCompare(String(rightValue), "es", {
    numeric: true,
    sensitivity: "base",
  });
}

function getSortedSettingsRows() {
  const direction = currentSettingsSortDirection === "desc" ? -1 : 1;
  return [...currentSettingsRows].sort((left, right) => {
    const result = compareSettingsValues(left[currentSettingsSortField], right[currentSettingsSortField]);
    return result * direction || compareSettingsValues(left.id, right.id);
  });
}

function getNextSettingsId() {
  return currentSettingsRows.reduce((maxId, row) => {
    const rowId = Number(row.id);
    return Number.isFinite(rowId) && rowId > maxId ? rowId : maxId;
  }, 0) + 1;
}

async function loadSettingsManagement() {
  const config = getSettingsCatalogConfig();
  renderSettingsSubtabs();
  setSettingsStatus(`Cargando ${config.label.toLowerCase()}...`);
  if (settingsTableBody) {
    settingsTableBody.innerHTML = `<tr><td class="empty-state">Cargando ${escapeHtml(config.label.toLowerCase())}...</td></tr>`;
  }

  const supabase = await getSupabaseClient();
  currentSettingsAvailableFieldKeys = null;
  await loadSettingsDynamicOptions(config, supabase);
  let { data, error } = await supabase
    .from(config.table)
    .select(config.columns)
    .order(config.order, { ascending: true });

  if (error && config.fallbackColumns && config.fallbackFieldKeys) {
    const fallbackResult = await supabase
      .from(config.table)
      .select(config.fallbackColumns)
      .order(config.order, { ascending: true });
    data = fallbackResult.data;
    error = fallbackResult.error;
    if (!error) {
      currentSettingsAvailableFieldKeys = new Set(config.fallbackFieldKeys);
    }
  }

  if (error) {
    currentSettingsRows = [];
    renderSettingsTable();
    setSettingsStatus(`No se pudo cargar ${config.label.toLowerCase()}: ${error.message}`, "error");
    return;
  }

  currentSettingsRows = data || [];
  renderSettingsTable();
  const fallbackText = currentSettingsAvailableFieldKeys
    ? " Aplica empresas.sql para activar logo, firma y datos documentales."
    : "";
  setSettingsStatus(
    `${currentSettingsRows.length} registro${currentSettingsRows.length === 1 ? "" : "s"} en ${config.label.toLowerCase()}.${fallbackText}`,
    currentSettingsAvailableFieldKeys ? "warning" : "success"
  );
}

function getSettingsFieldOptions(field) {
  return field.options || currentSettingsDynamicOptions.get(field.key) || [];
}

function getSettingsDynamicOptionLabel(fieldKey, value) {
  if (value == null) {
    return "";
  }
  const match = (currentSettingsDynamicOptions.get(fieldKey) || []).find(
    (option) => option.value === String(value)
  );
  return match ? match.label : value;
}

// Carga las opciones de los select que vienen de otra tabla. Se hace al cargar
// el catálogo, no al abrir el formulario, para que el listado también pueda
// mostrar la etiqueta en vez del id.
async function loadSettingsDynamicOptions(config, supabase) {
  currentSettingsDynamicOptions = new Map();
  const dynamicFields = (config.fields || []).filter((field) => field.optionsFrom);
  for (const field of dynamicFields) {
    const source = field.optionsFrom;
    const { data, error } = await supabase
      .from(source.table)
      .select(source.columns)
      .order(source.order, { ascending: true });
    if (error) {
      continue;
    }
    currentSettingsDynamicOptions.set(
      field.key,
      (data || []).map((row) => ({
        value: String(row[source.valueKey]),
        label: source.label(row),
      }))
    );
  }
}

function renderSettingsDetailFields(row = {}) {
  const config = getSettingsCatalogConfig();
  if (!settingsDetailFields) {
    return;
  }

  settingsDetailFields.innerHTML = getAvailableSettingsFields(config)
    .map((field) => {
      const value = row[field.key];
      const required = field.required ? " required" : "";
      const readonly = field.readonlyOnEdit && currentSettingsMode === "edit" ? " readonly" : "";
      const inner = renderSettingsFieldInner(field, value, required, readonly);
      const showWhenAttr = field.showWhen
        ? ` data-settings-show-when="${escapeHtml(JSON.stringify(field.showWhen))}"`
        : "";
      return `<div class="settings-field-row" data-settings-field="${escapeHtml(field.key)}"${showWhenAttr}>${inner}</div>`;
    })
    .join("");
  applySettingsFieldVisibility();
}

function renderSettingsFieldInner(field, value, required, readonly) {
      if (field.type === "checkbox") {
        return `
          <label class="checkbox-item">
            <input name="${escapeHtml(field.key)}" type="checkbox" ${value ? "checked" : ""} />
            <span>${escapeHtml(field.label)}</span>
          </label>
        `;
      }
      if (field.type === "select") {
        const options = getSettingsFieldOptions(field);
        return `
          <label>
            ${escapeHtml(field.label)}
            <select name="${escapeHtml(field.key)}"${required}>
              <option value="">-- Selecciona --</option>
              ${options
                .map(
                  (option) => `
                    <option value="${escapeHtml(option.value)}" ${String(value ?? "") === option.value ? "selected" : ""}>
                      ${escapeHtml(option.label)}
                    </option>
                  `
                )
                .join("")}
            </select>
          </label>
        `;
      }
      if (field.type === "checkbox-group") {
        const options = field.options || [];
        const selected = Array.isArray(value) ? value : [];
        return `
          <span class="checkbox-group-label">${escapeHtml(field.label)}</span>
          <div class="checkbox-group-options">
            ${options
              .map(
                (option) => `
                  <label class="checkbox-item">
                    <input name="${escapeHtml(field.key)}" type="checkbox" value="${escapeHtml(option.value)}" ${
                      selected.includes(option.value) ? "checked" : ""
                    } />
                    <span>${escapeHtml(option.label)}</span>
                  </label>
                `
              )
              .join("")}
          </div>
        `;
      }
      if (field.type === "textarea") {
        return `
          <label>
            ${escapeHtml(field.label)}
            <textarea name="${escapeHtml(field.key)}" rows="3"${required}${readonly}>${escapeHtml(value ?? "")}</textarea>
          </label>
        `;
      }
      if (field.type === "file-data-url") {
        // El data URL vive en un input oculto: mostrarlo en un textarea solo
        // llenaba el formulario de base64 ilegible en vez de la imagen.
        const current = String(value ?? "");
        const hasImage = current.startsWith("data:image/");
        return `
          <label>
            ${escapeHtml(field.label)}
            <input type="file" accept="image/*" data-settings-file-target="${escapeHtml(field.key)}" />
            <input type="hidden" name="${escapeHtml(field.key)}" value="${escapeHtml(current)}" />
            <span class="settings-image-field" data-settings-image-field="${escapeHtml(field.key)}">
              <img
                class="settings-image-preview${hasImage ? "" : " hidden"}"
                ${hasImage ? `src="${escapeHtml(current)}"` : ""}
                alt="${escapeHtml(field.label)}"
              />
              <span class="muted-text settings-image-hint">${hasImage ? "Imagen guardada" : "Sin imagen guardada"}</span>
              <button
                type="button"
                class="secondary-button settings-image-clear${hasImage ? "" : " hidden"}"
                data-settings-image-clear="${escapeHtml(field.key)}"
              >Quitar imagen</button>
            </span>
          </label>
        `;
      }
      // step es necesario en los numericos con decimales: sin el, el navegador
      // rechaza valores como 3,10 al validar el formulario.
      const step = field.step ? ` step="${escapeHtml(field.step)}"` : "";
      return `
        <label>
          ${escapeHtml(field.label)}
          <input name="${escapeHtml(field.key)}" type="${field.type || "text"}" value="${escapeHtml(value ?? "")}"${step}${required}${readonly} />
        </label>
      `;
}

function settingsShowWhenMatches(showWhen, formData) {
  const conditions = Array.isArray(showWhen) ? showWhen : [showWhen];
  return conditions.every((condition) => (condition.in || []).includes(formData.get(condition.field)));
}

function applySettingsFieldVisibility() {
  if (!settingsDetailFields || !settingsDetailForm) {
    return;
  }
  const formData = new FormData(settingsDetailForm);
  settingsDetailFields.querySelectorAll("[data-settings-show-when]").forEach((wrapper) => {
    let showWhen = [];
    try {
      showWhen = JSON.parse(wrapper.dataset.settingsShowWhen);
    } catch {
      showWhen = [];
    }
    wrapper.classList.toggle("hidden", !settingsShowWhenMatches(showWhen, formData));
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

// Refleja en la vista previa el data URL que hay en el campo oculto.
function updateSettingsImagePreview(fieldName, value) {
  const wrapper = settingsDetailFields?.querySelector(`[data-settings-image-field="${fieldName}"]`);
  if (!wrapper) return;
  const hasImage = String(value || "").startsWith("data:image/");
  const image = wrapper.querySelector(".settings-image-preview");
  if (image) {
    if (hasImage) {
      image.src = value;
    } else {
      image.removeAttribute("src");
    }
    image.classList.toggle("hidden", !hasImage);
  }
  const hint = wrapper.querySelector(".settings-image-hint");
  if (hint) {
    hint.textContent = hasImage ? "Imagen guardada" : "Sin imagen guardada";
  }
  wrapper.querySelector(".settings-image-clear")?.classList.toggle("hidden", !hasImage);
}

function clearSettingsImageField(fieldName) {
  const target = fieldName ? settingsDetailForm?.elements[fieldName] : null;
  if (!target) return;
  target.value = "";
  const fileInput = settingsDetailFields?.querySelector(`[data-settings-file-target="${fieldName}"]`);
  if (fileInput) fileInput.value = "";
  updateSettingsImagePreview(fieldName, "");
  setSettingsStatus("Imagen quitada. Guarda para confirmar el cambio.", "success");
}

async function handleSettingsFileDataUrlChange(input) {
  const fieldName = input?.dataset?.settingsFileTarget || "";
  const file = input?.files?.[0];
  const target = fieldName ? settingsDetailForm?.elements[fieldName] : null;
  if (!file || !target) return;
  if (!file.type.startsWith("image/")) {
    setSettingsStatus("Selecciona un archivo de imagen.", "error");
    input.value = "";
    return;
  }
  try {
    target.value = await readFileAsDataUrl(file);
    updateSettingsImagePreview(fieldName, target.value);
    setSettingsStatus("Imagen preparada para guardar.", "success");
  } catch (error) {
    setSettingsStatus(`No se pudo leer la imagen: ${error.message}`, "error");
  }
}

function openSettingsDetail(mode = "new", rowId = "") {
  const config = getSettingsCatalogConfig();
  currentSettingsMode = mode;
  currentSettingsEditingId = rowId ? String(rowId) : "";
  const row = mode === "edit"
    ? currentSettingsRows.find((item) => String(item.id) === currentSettingsEditingId) || {}
    : { id: getNextSettingsId(), activo: true, ...(config.newDefaults || {}) };

  settingsDetailTitle.textContent =
    mode === "edit"
      ? `Editar ${config.singularLabel}`
      : `Nuevo registro en ${config.label}`;
  settingsDetailDeleteButton?.classList.toggle("hidden", mode !== "edit");
  if (settingsDetailDeleteButton) {
    settingsDetailDeleteButton.innerHTML = renderIcon("delete");
  }
  renderSettingsDetailFields(row);
  markFormPristine(settingsDetailForm);
  settingsDetailPanel?.classList.remove("hidden");
}

async function closeSettingsDetail(options = {}) {
  if (!options.force && !(await confirmCloseWithSave(settingsDetailForm, () => saveSettingsDetail()))) {
    return false;
  }
  settingsDetailForm?.reset();
  settingsDetailPanel?.classList.add("hidden");
  currentSettingsMode = "new";
  currentSettingsEditingId = "";
  settingsDetailDeleteButton?.classList.add("hidden");
  markFormPristine(settingsDetailForm);
  return true;
}

function getSettingsPayloadFromForm() {
  const config = getSettingsCatalogConfig();
  const formData = new FormData(settingsDetailForm);
  const payload = {};

  getAvailableSettingsFields(config).forEach((field) => {
    // Los campos ocultos por showWhen (p.ej. "unidad" cuando tipo != fijo) se
    // envian a null/false: sus valores en el DOM no son fiables (pueden venir
    // de una edicion anterior) y las constraints de coherencia en BD exigen
    // que esten vacios para la combinacion actual.
    const isVisible = !field.showWhen || settingsShowWhenMatches(field.showWhen, formData);

    if (field.type === "checkbox") {
      payload[field.key] = isVisible && formData.get(field.key) === "on";
      return;
    }

    if (field.type === "checkbox-group") {
      const values = isVisible ? formData.getAll(field.key) : [];
      payload[field.key] = values.length ? values : null;
      return;
    }

    if (!isVisible) {
      payload[field.key] = null;
      return;
    }

    const rawValue = String(formData.get(field.key) ?? "").trim();
    if (field.required && !rawValue) {
      throw new Error(`Completa el campo ${field.label}.`);
    }

    if (field.type === "number") {
      payload[field.key] = rawValue ? Number(rawValue) : null;
      if (rawValue && !Number.isFinite(payload[field.key])) {
        throw new Error(`El campo ${field.label} debe ser numérico.`);
      }
      return;
    }

    payload[field.key] = rawValue || null;
  });

  return payload;
}

async function saveSettingsDetail(event) {
  event?.preventDefault();
  const config = getSettingsCatalogConfig();
  let payload;
  try {
    payload = getSettingsPayloadFromForm();
  } catch (error) {
    setSettingsStatus(error.message, "error");
    return;
  }

  const supabase = await getSupabaseClient();

  // Aviso al desactivar un registro que esta en uso: se permite, pero el valor
  // dejara de aparecer en los desplegables (seguira vigente en los registros
  // existentes que ya lo referencian).
  if (currentSettingsMode === "edit" && payload.activo === false) {
    const previousRow = currentSettingsRows.find(
      (item) => String(item.id) === currentSettingsEditingId
    );
    const wasActive = previousRow ? previousRow.activo !== false : true;
    if (wasActive) {
      let usage = [];
      try {
        usage = await getSettingsReferenceUsage(supabase, config, currentSettingsEditingId);
      } catch (error) {
        setSettingsStatus(`No se pudo comprobar si el registro está en uso: ${error.message}`, "error");
        return;
      }
      if (usage.length) {
        const label = previousRow?.[config.titleField] || `ID ${currentSettingsEditingId}`;
        const usageText = usage.map((item) => `${item.label}: ${item.count}`).join("; ");
        const confirmed = window.confirm(
          `Estás desactivando "${label}", que está en uso en ${usageText}.\n\n` +
            "Seguirá vigente en esos registros, pero dejará de aparecer en los desplegables. ¿Continuar?"
        );
        if (!confirmed) {
          return;
        }
      }
    }
  }

  const updatePayload = { ...payload };
  if (currentSettingsMode === "edit") {
    delete updatePayload.id;
  }
  const query = currentSettingsMode === "edit"
    ? supabase.from(config.table).update(updatePayload).eq("id", currentSettingsEditingId)
    : supabase.from(config.table).insert(payload);
  const { error } = await query;

  if (error) {
    setSettingsStatus(`No se pudo guardar el registro: ${error.message}`, "error");
    return;
  }

  closeSettingsDetail({ force: true });
  await loadSettingsManagement();
  setSettingsStatus("Registro guardado correctamente.", "success");
}

async function getSettingsReferenceUsage(supabase, config, recordId) {
  const { data, error } = await supabase.rpc("get_master_catalog_usage", {
    p_catalog: config.table,
    p_record_id: Number(recordId),
  });

  if (!error) {
    return (data || [])
      .map((row) => ({
        label: row.source_label || row.source_table,
        count: Number(row.usage_count || 0),
      }))
      .filter((item) => item.count > 0);
  }

  const results = await Promise.all(
    (config.usageReferences || []).map(async (reference) => {
      const result = await supabase
        .from(reference.table)
        .select("id", { count: "exact", head: true })
        .eq(reference.column, recordId);
      return {
        label: reference.label,
        count: Number(result.count || 0),
        error: result.error,
      };
    })
  );

  const countError = results.find((result) => result.error)?.error;
  if (countError) {
    throw countError;
  }

  return results.filter((item) => item.count > 0);
}

async function deleteSettingsDetail() {
  const config = getSettingsCatalogConfig();
  if (currentSettingsMode !== "edit" || !currentSettingsEditingId) {
    return;
  }

  const row = currentSettingsRows.find((item) => String(item.id) === currentSettingsEditingId);
  const label = row?.[config.titleField] || `ID ${currentSettingsEditingId}`;
  const supabase = await getSupabaseClient();
  let usage = [];
  try {
    usage = await getSettingsReferenceUsage(supabase, config, currentSettingsEditingId);
  } catch (error) {
    setSettingsStatus(`No se pudo comprobar si el registro está en uso: ${error.message}`, "error");
    return;
  }

  if (usage.length) {
    const usageText = usage.map((item) => `${item.label}: ${item.count}`).join("; ");
    const message = `No se puede borrar "${label}" porque está en uso en ${usageText}.`;
    setSettingsStatus(message, "error");
    window.alert(message);
    return;
  }

  if (!window.confirm(`¿Borrar ${config.label.toLowerCase()} "${label}"?`)) {
    return;
  }

  const { error } = await supabase.from(config.table).delete().eq("id", currentSettingsEditingId);
  if (error) {
    setSettingsStatus(`No se pudo borrar el registro: ${error.message}`, "error");
    return;
  }

  closeSettingsDetail({ force: true });
  await loadSettingsManagement();
  setSettingsStatus("Registro borrado correctamente.", "success");
}

function getAccessAssignmentsForUser(userId) {
  return new Set(
    currentAccessAssignments
      .filter((assignment) => assignment.user_id === userId)
      .map((assignment) => String(assignment.servicio_id))
  );
}

function getAccessTabAssignmentsForUser(userId) {
  return new Set(
    currentAccessTabAssignments
      .filter((assignment) => assignment.user_id === userId)
      .map((assignment) => normalizeCoordinationTabKey(assignment.pestana))
      .filter((tabKey) => ACCESS_ASSIGNABLE_TABS.some((tab) => tab.key === tabKey))
  );
}

function getAccessTabLabel(tabKey) {
  return ACCESS_ASSIGNABLE_TABS.find((tab) => tab.key === tabKey)?.label || tabKey;
}

function normalizeAccessTabCatalog(rows = []) {
  const supportedKeys = new Set(ACCESS_ASSIGNABLE_TABS_FALLBACK.map((tab) => tab.key));
  const normalizedRows = rows
    .map((row) => ({
      key: normalizeCoordinationTabKey(row.pestana ?? row.key),
      label: String(row.etiqueta ?? row.label ?? "").trim(),
      order: Number(row.orden ?? row.order ?? 999),
    }))
    .filter((row) => supportedKeys.has(row.key))
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label, "es"));

  return normalizedRows.length
    ? normalizedRows.map((row) => ({
        key: row.key,
        label: row.label || getAccessTabLabel(row.key),
      }))
    : [...ACCESS_ASSIGNABLE_TABS_FALLBACK];
}

function renderAccessTabOptions(selectedTabKeys = new Set()) {
  if (!accessUserTabsContainer) {
    return;
  }

  accessUserTabsContainer.innerHTML = ACCESS_ASSIGNABLE_TABS
    .map(
      (tab) => `
        <label class="checkbox-item">
          <input type="checkbox" name="access_tabs" value="${escapeHtml(tab.key)}" ${
            selectedTabKeys.has(tab.key) ? "checked" : ""
          } />
          <span>${escapeHtml(tab.label)}</span>
        </label>
      `
    )
    .join("");
}

async function loadAccessTabCatalog(supabase) {
  const { data, error } = await supabase
    .from("coordinacion_pestanas")
    .select("pestana, etiqueta, orden, activo")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    ACCESS_ASSIGNABLE_TABS = [...ACCESS_ASSIGNABLE_TABS_FALLBACK];
    renderAccessTabOptions();
    return;
  }

  ACCESS_ASSIGNABLE_TABS = normalizeAccessTabCatalog(data || []);
  renderAccessTabOptions();
}

function formatAccessListSummary(values, emptyLabel) {
  if (!values.length) {
    return emptyLabel;
  }

  const visibleValues = values.slice(0, 3);
  const extraCount = values.length - visibleValues.length;
  return `${visibleValues.join(", ")}${extraCount > 0 ? ` y ${extraCount} más` : ""}`;
}

function collectAccessFormTabs() {
  return Array.from(accessUserTabsContainer?.querySelectorAll('input[name="access_tabs"]:checked') || [])
    .map((input) => input.value)
    .filter((tabKey) => ACCESS_ASSIGNABLE_TABS.some((tab) => tab.key === tabKey));
}

function setAccessFormTabs(tabKeys = new Set()) {
  renderAccessTabOptions(tabKeys);
}

function renderAccessFormServiceOptions(selectedServiceIds = new Set()) {
  if (!accessUserServicesSelect) {
    return;
  }

  accessUserServicesSelect.innerHTML = currentAccessServices
    .map(
      (service) => `
        <option value="${escapeHtml(service.id)}" ${selectedServiceIds.has(String(service.id)) ? "selected" : ""}>
          ${escapeHtml(getAccessServiceLabel(service))}
        </option>
      `
    )
    .join("");
}

async function loadCurrentAccessRole() {
  currentUserIsAccessAdmin = false;
  currentAllowedPrivateTabs = new Set();
  try {
    const session = await ensurePrivateSession({ silent: true });
    if (!session) {
      return;
    }

    const supabase = await getSupabaseClient();
    const [adminResult, tabsResult] = await Promise.all([
      supabase.rpc("is_coordinacion_admin", {
        p_user_id: session.user.id,
      }),
      supabase
        .from("coordinacion_usuario_pestanas")
        .select("pestana")
        .eq("user_id", session.user.id),
    ]);
    if (adminResult.error) {
      return;
    }
    currentUserIsAccessAdmin = Boolean(adminResult.data);
    currentAllowedPrivateTabs = currentUserIsAccessAdmin
      ? new Set(PRIVATE_TAB_TARGETS)
      : new Set(
          (tabsResult.data || [])
            .map((row) => normalizeCoordinationTabKey(row.pestana))
            .filter((tab) => PRIVATE_TAB_TARGETS.has(tab))
        );
    if (currentAllowedPrivateTabs.has("actividades")) {
      currentAllowedPrivateTabs.add("registros");
    }
    openEventSettingsButton?.classList.toggle("hidden", !currentUserIsAccessAdmin);
  } catch (_error) {
    currentUserIsAccessAdmin = false;
    currentAllowedPrivateTabs = new Set();
    openEventSettingsButton?.classList.add("hidden");
  }
}

function renderAccessUsers() {
  if (!accessUsersTableBody) {
    return;
  }

  if (!currentUserIsAccessAdmin) {
    accessUsersTableBody.innerHTML =
      '<tr><td colspan="5" class="empty-state">Solo admin puede gestionar accesos.</td></tr>';
    return;
  }

  if (!currentAccessUsers.length) {
    accessUsersTableBody.innerHTML =
      '<tr><td colspan="5" class="empty-state">No hay usuarios configurados.</td></tr>';
    return;
  }

  accessUsersTableBody.innerHTML = currentAccessUsers
    .map((user) => {
      const selectedServices = getAccessAssignmentsForUser(user.user_id);
      const serviceSummary = formatAccessListSummary(
        currentAccessServices
          .filter((service) => selectedServices.has(String(service.id)))
          .map(getAccessServiceLabel),
        "Sin servicios"
      );
      const selectedTabs = getAccessTabAssignmentsForUser(user.user_id);
      const tabSummary = user.rol === "admin"
        ? "Todas"
        : formatAccessListSummary(Array.from(selectedTabs).map(getAccessTabLabel), "Sin pestañas");

      return `
        <tr data-access-user-row="${escapeHtml(user.user_id)}">
          <td>
            <button type="button" class="row-name-button" data-access-edit="${escapeHtml(user.user_id)}" aria-label="Editar usuario ${escapeHtml(user.nombre || "Sin nombre")}">
              ${escapeHtml(user.nombre || "Sin nombre")}
            </button>
            <span class="muted-block">${escapeHtml(user.user_id)}</span>
          </td>
          <td>${escapeHtml(user.rol)}</td>
          <td>${escapeHtml(user.activo ? "Activo" : "Inactivo")}</td>
          <td>${escapeHtml(tabSummary)}</td>
          <td>${escapeHtml(serviceSummary)}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadAccessManagement() {
  if (!currentUserIsAccessAdmin) {
    renderAccessUsers();
    setAccessStatus("Solo admin puede gestionar accesos.", "error");
    return;
  }

  setAccessStatus("Cargando accesos...");
  const supabase = await getSupabaseClient();
  await loadAccessTabCatalog(supabase);
  const [usersResult, servicesResult, contractsResult, assignmentsResult, tabAssignmentsResult] = await Promise.all([
    supabase
      .from("coordinacion_usuarios")
      .select("user_id, rol, nombre, activo, created_at, updated_at")
      .order("nombre", { ascending: true }),
    supabase
      .from("servicios")
      .select("id, contrato_id, servicio, activo")
      .order("servicio", { ascending: true }),
    supabase
      .from("contratos")
      .select("id, contrato, activo")
      .order("contrato", { ascending: true }),
    supabase
      .from("coordinacion_usuario_servicios")
      .select("user_id, servicio_id"),
    supabase
      .from("coordinacion_usuario_pestanas")
      .select("user_id, pestana"),
  ]);

  const error = [usersResult, servicesResult, contractsResult, assignmentsResult, tabAssignmentsResult].find(
    (result) => result.error
  )?.error;
  if (error) {
    setAccessStatus(`No se pudieron cargar los accesos: ${error.message}`, "error");
    return;
  }

  const contractNames = new Map(
    (contractsResult.data || []).map((contract) => [Number(contract.id), contract.contrato])
  );
  const activeContractIds = new Set(
    (contractsResult.data || [])
      .filter((contract) => contract.activo)
      .map((contract) => Number(contract.id))
  );
  currentAccessUsers = (usersResult.data || []).map((user) => ({
    ...user,
    rol: normalizeAccessRole(user.rol),
  }));
  currentAccessServices = (servicesResult.data || [])
    .filter((service) => activeContractIds.has(Number(service.contrato_id)))
    .map((service) => ({
      ...service,
      id: String(service.id),
      contrato_id: Number(service.contrato_id),
      contractName: contractNames.get(Number(service.contrato_id)) || "",
    }))
    .sort((left, right) =>
      getAccessServiceLabel(left).localeCompare(getAccessServiceLabel(right), "es", {
        sensitivity: "base",
        numeric: true,
      })
    );
  currentAccessAssignments = assignmentsResult.data || [];
  currentAccessTabAssignments = tabAssignmentsResult.data || [];

  renderAccessFormServiceOptions();
  renderAccessUsers();
  setAccessStatus(`Accesos cargados: ${currentAccessUsers.length}.`, "success");
}

function resetAccessUserForm() {
  accessUserForm?.reset();
  if (accessUserActiveInput) {
    accessUserActiveInput.checked = true;
  }
  if (accessUserIdInput) {
    accessUserIdInput.readOnly = false;
  }
  if (accessUserSaveButton) {
    accessUserSaveButton.textContent = "Guardar usuario";
  }
  renderAccessFormServiceOptions();
  setAccessFormTabs();
  accessUserIdInput?.focus();
}

function openAccessUserPanel(mode = "new") {
  if (accessUserPanelTitle) {
    accessUserPanelTitle.textContent = mode === "edit" ? "Editar usuario" : "Nuevo usuario";
  }
  accessUserDeleteButton?.classList.toggle("hidden", mode !== "edit");
  accessUserPanel?.classList.remove("hidden");
  if (mode === "new") {
    resetAccessUserForm();
  }
  markFormPristine(accessUserForm);
}

async function closeAccessUserPanel(options = {}) {
  if (!options.force && !(await confirmCloseWithSave(accessUserForm, () => saveAccessUserFromForm()))) {
    return false;
  }
  accessUserPanel?.classList.add("hidden");
  resetAccessUserForm();
  markFormPristine(accessUserForm);
  return true;
}

function editAccessUser(userId) {
  const user = currentAccessUsers.find((item) => item.user_id === userId);
  if (!user) {
    setAccessStatus("No se encontró el usuario seleccionado.", "error");
    return;
  }

  if (accessUserIdInput) {
    accessUserIdInput.value = user.user_id;
    accessUserIdInput.readOnly = true;
  }
  if (accessUserNameInput) {
    accessUserNameInput.value = user.nombre || "";
  }
  if (accessUserRoleSelect) {
    accessUserRoleSelect.value = normalizeAccessRole(user.rol);
  }
  if (accessUserActiveInput) {
    accessUserActiveInput.checked = Boolean(user.activo);
  }
  setAccessFormTabs(user.rol === "admin" ? new Set(ACCESS_ASSIGNABLE_TABS.map((tab) => tab.key)) : getAccessTabAssignmentsForUser(userId));
  if (accessUserSaveButton) {
    accessUserSaveButton.textContent = "Guardar cambios";
  }
  renderAccessFormServiceOptions(getAccessAssignmentsForUser(userId));
  openAccessUserPanel("edit");
  accessUserNameInput?.focus();
  setAccessStatus("Usuario cargado para edición.");
}

async function saveAccessUserFromForm(event) {
  event?.preventDefault();
  const userId = accessUserIdInput?.value.trim() || "";
  if (!isValidUuid(userId)) {
    setAccessStatus("Indica un User ID válido de Supabase Auth.", "error");
    return;
  }

  const payload = {
    user_id: userId,
    nombre: accessUserNameInput?.value.trim() || null,
    rol: normalizeAccessRole(accessUserRoleSelect?.value),
    activo: Boolean(accessUserActiveInput?.checked),
  };
  const serviceIds = Array.from(accessUserServicesSelect?.selectedOptions || []).map((option) =>
    Number(option.value)
  );
  const tabKeys = payload.rol === "admin" ? [] : collectAccessFormTabs();

  if (currentSession?.user?.id === userId && (payload.rol !== "admin" || !payload.activo)) {
    setAccessStatus("No puedes quitarte tu propio acceso admin desde esta pantalla.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("coordinacion_usuarios").upsert(payload, {
    onConflict: "user_id",
  });
  if (error) {
    setAccessStatus(`No se pudo guardar el usuario: ${error.message}`, "error");
    return;
  }

  const { error: deleteError } = await supabase
    .from("coordinacion_usuario_servicios")
    .delete()
    .eq("user_id", userId);
  if (deleteError) {
    setAccessStatus(`No se pudieron actualizar los servicios: ${deleteError.message}`, "error");
    return;
  }

  if (serviceIds.length) {
    const { error: insertError } = await supabase.from("coordinacion_usuario_servicios").insert(
      serviceIds.map((serviceId) => ({
        user_id: userId,
        servicio_id: serviceId,
      }))
    );
    if (insertError) {
      setAccessStatus(`No se pudieron asignar los servicios: ${insertError.message}`, "error");
      return;
    }
  }

  const { error: deleteTabsError } = await supabase
    .from("coordinacion_usuario_pestanas")
    .delete()
    .eq("user_id", userId);
  if (deleteTabsError) {
    setAccessStatus(`No se pudieron actualizar las pestañas: ${deleteTabsError.message}`, "error");
    return;
  }

  if (tabKeys.length) {
    const { error: insertTabsError } = await supabase.from("coordinacion_usuario_pestanas").insert(
      tabKeys.map((tabKey) => ({
        user_id: userId,
        pestana: tabKey,
      }))
    );
    if (insertTabsError) {
      setAccessStatus(
        `No se pudieron asignar las pestañas (${tabKeys.join(", ")}): ${insertTabsError.message}`,
        "error"
      );
      return;
    }
  }

  resetAccessUserForm();
  closeAccessUserPanel({ force: true });
  await loadAccessManagement();
  setAccessStatus("Usuario guardado correctamente.", "success");
}

async function saveAccessUserRow(userId) {
  const row = accessUsersTableBody?.querySelector(`[data-access-user-row="${CSS.escape(userId)}"]`);
  if (!row) {
    return;
  }

  const role = normalizeAccessRole(row.querySelector("[data-access-role]")?.value);
  const active = Boolean(row.querySelector("[data-access-active]")?.checked);
  const serviceIds = Array.from(row.querySelector("[data-access-services]")?.selectedOptions || []).map(
    (option) => Number(option.value)
  );
  const currentUser = currentAccessUsers.find((user) => user.user_id === userId);

  if (currentSession?.user?.id === userId && (role !== "admin" || !active)) {
    setAccessStatus("No puedes quitarte tu propio acceso admin desde esta pantalla.", "error");
    return;
  }

  const supabase = await getSupabaseClient();
  const { error: userError } = await supabase
    .from("coordinacion_usuarios")
    .update({
      rol: role,
      activo: active,
      nombre: currentUser?.nombre || null,
    })
    .eq("user_id", userId);
  if (userError) {
    setAccessStatus(`No se pudo actualizar el usuario: ${userError.message}`, "error");
    return;
  }

  const { error: deleteError } = await supabase
    .from("coordinacion_usuario_servicios")
    .delete()
    .eq("user_id", userId);
  if (deleteError) {
    setAccessStatus(`No se pudieron actualizar los servicios: ${deleteError.message}`, "error");
    return;
  }

  if (serviceIds.length) {
    const { error: insertError } = await supabase.from("coordinacion_usuario_servicios").insert(
      serviceIds.map((serviceId) => ({
        user_id: userId,
        servicio_id: serviceId,
      }))
    );
    if (insertError) {
      setAccessStatus(`No se pudieron asignar los servicios: ${insertError.message}`, "error");
      return;
    }
  }

  await loadAccessManagement();
  setAccessStatus("Acceso actualizado correctamente.", "success");
}

async function deleteAccessUser(userId) {
  if (currentSession?.user?.id === userId) {
    setAccessStatus("No puedes eliminar tu propio perfil admin desde esta pantalla.", "error");
    return;
  }

  const confirmed = window.confirm("Vas a eliminar este perfil de acceso y sus asignaciones.");
  if (!confirmed) {
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("coordinacion_usuarios").delete().eq("user_id", userId);
  if (error) {
    setAccessStatus(`No se pudo eliminar el usuario: ${error.message}`, "error");
    return;
  }

  closeAccessUserPanel({ force: true });
  await loadAccessManagement();
  setAccessStatus("Usuario eliminado correctamente.", "success");
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
  eventContractRows = [];
  eventContractPersonalRows = [];
  eventContractInstallationRows = [];
  eventCreatorRows = [];
  eventAllInstallationRows = [];
  eventInstallationRows = [];
  eventPersonnelRows = [];
  eventAssignedInstallationIds = new Set();
  eventAssemblyPersonnelIds = new Set();
  eventsCatalogsLoaded = false;
  currentContractRows = [];
  currentContractServiceRows = [];
  contractPersonalCatalogRows = [];
  contractInstallationCatalogRows = [];
  currentContractPersonalRows = [];
  currentContractInstallationRows = [];
  currentEditingContractId = "";
  closeContractDetailPanel({ force: true });
  renderContractsTable();
  renderContractAssignmentOptions();
  currentAccessUsers = [];
  currentAccessServices = [];
  currentAccessAssignments = [];
  currentAccessTabAssignments = [];
  currentAllowedPrivateTabs = new Set(["programming"]);
  currentUserIsAccessAdmin = false;
  syncAccessTabVisibility();
  closeAccessUserPanel({ force: true });
  renderAccessUsers();
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
  event?.preventDefault();

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

function normalizeRecordText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getRecordColumn(key) {
  return RECORD_COLUMNS.find((column) => column.key === key);
}

function formatRecordCellValue(value, column) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (column.type === "boolean") {
    return value ? "Si" : "No";
  }

  if (column.type === "time") {
    return String(value).slice(0, 5);
  }

  if (column.type === "date") {
    const parts = String(value).split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return String(value);
  }

  if (column.type === "datetime") {
    const dt = String(value).replace("T", " ").slice(0, 19);
    const [datePart, timePart] = dt.split(" ");
    const parts = (datePart || "").split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}${timePart ? " " + timePart : ""}`;
    }
    return dt;
  }

  return String(value);
}

function formatRecordDisplayValue(row, column) {
  const baseValue = formatRecordCellValue(row[column.key], column);
  const relationLabel = column.relationLabelKey
    ? String(row[column.relationLabelKey] ?? "").trim()
    : "";

  return relationLabel || baseValue;
}

function parseRecordFieldValue(rawValue, column) {
  if (column.type === "boolean") {
    return rawValue === true || rawValue === "true" || rawValue === "1";
  }

  if (rawValue === "" || rawValue === undefined) {
    return null;
  }

  if (RECORD_NUMERIC_FIELDS.has(column.key)) {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : null;
  }

  return String(rawValue);
}

function normalizeRecordComparableValue(value, column) {
  const parsed = parseRecordFieldValue(value, column);
  if (parsed === null || parsed === undefined) {
    return "";
  }
  return String(parsed);
}

function getRecordsFilterValues() {
  return {
    fechaDesde: document.querySelector("#records-filter-date-from")?.value || "",
    fechaHasta: document.querySelector("#records-filter-date-to")?.value || "",
    contratoIds: getSelectValues(document.querySelector("#records-filter-contrato")),
    servicioId: document.querySelector("#records-filter-servicio")?.value || "",
    personalId: document.querySelector("#records-filter-personal")?.value || "",
    instalacionId: document.querySelector("#records-filter-instalacion")?.value || "",
    actividadId:
      document.querySelector("#records-filter-actividad")?.value ||
      recordsExternalActivityFilter ||
      "",
    search: normalizeRecordText(document.querySelector("#records-filter-search")?.value || ""),
  };
}

function applyRecordsQueryFilters(query, filters) {
  let nextQuery = query;

  if (filters.fechaDesde) {
    nextQuery = nextQuery.gte("fecha", filters.fechaDesde);
  }
  if (filters.fechaHasta) {
    nextQuery = nextQuery.lte("fecha", filters.fechaHasta);
  }

  if (filters.contratoIds.length) {
    const emptySelected = filters.contratoIds.includes(RECORD_EMPTY_FILTER_VALUE);
    const numericContractIds = filters.contratoIds
      .filter((value) => value !== RECORD_EMPTY_FILTER_VALUE)
      .map(Number);
    if (emptySelected && numericContractIds.length) {
      nextQuery = nextQuery.or(`contrato_id.is.null,contrato_id.in.(${numericContractIds.join(",")})`);
    } else if (emptySelected) {
      nextQuery = nextQuery.is("contrato_id", null);
    } else {
      nextQuery = nextQuery.in("contrato_id", numericContractIds);
    }
  } else if (recordsFilterContratos) {
    const activeContractIds = recordsFilterContratos.map((item) => Number(item.value));
    nextQuery = activeContractIds.length
      ? nextQuery.in("contrato_id", activeContractIds)
      : nextQuery.eq("contrato_id", -1);
  }

  [
    ["servicio_id", filters.servicioId],
    ["personal_id", filters.personalId],
    ["instalacion_id", filters.instalacionId],
    ["actividad_id", filters.actividadId],
  ].forEach(([column, value]) => {
    if (value !== "") {
      nextQuery =
        value === RECORD_EMPTY_FILTER_VALUE
          ? nextQuery.is(column, null)
          : nextQuery.eq(column, Number(value));
    }
  });

  return nextQuery;
}

function applyRecordsClientFilters() {
  invalidateRecordsReportPreview();
  const filters = getRecordsFilterValues();
  filteredRecordsRows = recordsRows.filter((row) => {
    if (!filters.search) {
      return true;
    }
    return RECORD_COLUMNS.some((column) =>
      normalizeRecordText(formatRecordDisplayValue(row, column)).includes(filters.search)
    );
  });
}

function sortRecordsRows() {
  const col = RECORD_COLUMNS.find((c) => c.key === recordsSort.field);
  if (!col) return;
  const labelKey = col.relationLabelKey;
  const asc = recordsSort.direction === "asc" ? 1 : -1;
  filteredRecordsRows.sort((a, b) => {
    const va = labelKey ? (a[labelKey] ?? "") : (a[col.key] ?? "");
    const vb = labelKey ? (b[labelKey] ?? "") : (b[col.key] ?? "");
    if (va === vb) return 0;
    if (va === "" || va === null) return 1;
    if (vb === "" || vb === null) return -1;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * asc;
    return String(va).localeCompare(String(vb), "es", { sensitivity: "base" }) * asc;
  });
}

function toggleRecordsSort(field) {
  if (recordsSort.field === field) {
    recordsSort.direction = recordsSort.direction === "asc" ? "desc" : "asc";
  } else {
    recordsSort.field = field;
    recordsSort.direction = "asc";
  }
  sortRecordsRows();
  renderRecordsTable();
}

function getRecordsListColumns() {
  const editable = Boolean(recordsEditModeInput?.checked);
  return RECORD_COLUMNS.filter((c) => !c.hiddenInList || (editable && c.showInEdit));
}

function renderRecordsTableHead() {
  if (!recordsTableHead) {
    return;
  }

  const listColumns = getRecordsListColumns();
  const editable = Boolean(recordsEditModeInput?.checked);
  const selectionEnabled = recordsSelectionMode;
  const stackedLabel = (col) => {
    const stackKeys = col.stackWith ? (Array.isArray(col.stackWith) ? col.stackWith : [col.stackWith]) : [];
    const stackedLabels = stackKeys.map((k) => RECORD_COLUMNS.find((c) => c.key === k)?.label).filter(Boolean);
    return stackedLabels.length ? `${col.label} / ${stackedLabels.join(" / ")}` : col.label;
  };
  const columnHeaders = [];
  if (selectionEnabled) {
    columnHeaders.push(`
      <th class="records-row-select" data-record-col="select">
        <input
          type="checkbox"
          data-record-select-all="true"
          aria-label="Seleccionar todos los registros filtrados"
        />
      </th>
    `);
  }
  columnHeaders.push(...listColumns.map((column) => {
    const label = escapeHtml(stackedLabel(column));
    const colAttr = `data-record-col="${escapeHtml(column.key)}"`;
    if (!column.sortable) return `<th ${colAttr}>${label}</th>`;
    const arrow = recordsSort.field === column.key
      ? (recordsSort.direction === "asc" ? " ↑" : " ↓")
      : " ↕";
    return `<th ${colAttr}><button class="sort-button" type="button" data-records-sort-field="${escapeHtml(column.key)}">${label}${arrow}</button></th>`;
  }));
  if (editable) {
    columnHeaders.push('<th class="records-row-actions" data-record-col="actions">Acciones</th>');
  }
  recordsTableHead.innerHTML = `<tr>${columnHeaders.join("")}</tr>`;
  syncRecordsSelectAllCheckbox();
}

function renderRecordEditableControl(row, column) {
  const value = row[column.key];
  const commonAttrs = `data-record-cell="${escapeHtml(row.id)}" data-record-field="${escapeHtml(
    column.key
  )}" aria-label="${escapeHtml(column.label)}"`;

  if (column.type === "boolean") {
    return `<input ${commonAttrs} type="checkbox" ${value ? "checked" : ""} ${
      column.readonly ? "disabled" : ""
    } />`;
  }

  if (RECORD_RELATION_TABLES[column.key]) {
    const current = value ?? "";
    const currentLabel = formatRecordDisplayValue(row, column);
    const currentOption = current === ""
      ? ""
      : `<option value="${escapeHtml(current)}" selected>${escapeHtml(currentLabel || current)}</option>`;
    return `<select ${commonAttrs} data-record-lazy-options="true" ${
      column.readonly ? "disabled" : ""
    }><option value="">-</option>${currentOption}</select>`;
  }

  if (column.type === "textarea") {
    return `<textarea ${commonAttrs} rows="2" ${
      column.readonly ? "readonly" : ""
    }>${escapeHtml(value ?? "")}</textarea>`;
  }

  const inputType =
    column.type === "date"
      ? "date"
      : column.type === "time"
        ? "time"
        : column.type === "datetime"
          ? "datetime-local"
          : RECORD_NUMERIC_FIELDS.has(column.key)
            ? "number"
            : "text";
  const step = column.type === "decimal" ? ' step="0.01"' : "";
  const inputValue =
    column.type === "time"
      ? String(value ?? "").slice(0, 5)
      : column.type === "datetime" && value
        ? String(value).slice(0, 16)
        : value ?? "";

  return `<input ${commonAttrs} type="${inputType}"${step} value="${escapeHtml(inputValue)}" ${
    column.readonly ? "readonly" : ""
  } />`;
}

function populateRecordRelationSelect(control) {
  if (!control || control.tagName !== "SELECT" || !control.dataset.recordLazyOptions) {
    return;
  }
  const field = control.dataset.recordField;
  const row = recordsRows.find((item) => String(item.id) === String(control.dataset.recordCell));
  const options = getRecordRelationOptionsForCell(field, row);
  const current = control.value ?? "";
  const currentLabel = control.selectedOptions?.[0]?.textContent || current;
  const hasCurrent = !current || options.some((option) => String(option.value) === String(current));

  control.innerHTML =
    `<option value="">-</option>` +
    (!hasCurrent ? `<option value="${escapeHtml(current)}" selected>${escapeHtml(currentLabel)}</option>` : "") +
    options
      .map(
        (option) =>
          `<option value="${escapeHtml(option.value)}" ${
            String(option.value) === String(current) ? "selected" : ""
          }>${escapeHtml(option.label)}</option>`
      )
      .join("");
  control.value = current;
  delete control.dataset.recordLazyOptions;
}

async function ensureRecordRelationSelectOptions(control) {
  if (!control?.dataset?.recordLazyOptions) {
    return;
  }
  const field = control.dataset.recordField;
  if (!recordRelationOptionsCache[field]?.length) {
    await loadRecordRelationOptions();
  }
  populateRecordRelationSelect(control);
}

function getRecordRelationOptionsForCell(field, row) {
  const options = recordRelationOptionsCache[field] || [];
  if (field !== "servicio_id" || !row?.contrato_id) {
    return options;
  }
  return options.filter((option) => String(option.contrato_id || "") === String(row.contrato_id));
}

function getRecordServiceOption(serviceId) {
  if (serviceId == null || serviceId === "") {
    return null;
  }
  return (recordRelationOptionsCache.servicio_id || []).find(
    (option) => String(option.value) === String(serviceId)
  ) || null;
}

function recordServiceMatchesContract(serviceId, contractId) {
  if (serviceId == null || serviceId === "") {
    return true;
  }
  const service = getRecordServiceOption(serviceId);
  return Boolean(service && String(service.contrato_id || "") === String(contractId || ""));
}

function formatRecordHours(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function buildRecordsSummaryText(rows) {
  const n = rows.length;
  let horas = 0;
  let abonado = 0;
  let facturado = 0;
  let hasApunte = false;
  for (const row of rows) {
    horas += Number(row.horas) || 0;
    if (row.apunte_abonado != null || row.apunte_facturado != null) {
      hasApunte = true;
    }
    abonado += Number(row.apunte_abonado) || 0;
    facturado += Number(row.apunte_facturado) || 0;
  }
  const base = `${n} ${n === 1 ? "registro" : "registros"} · ${formatRecordHours(horas)} h`;
  if (!hasApunte) {
    return base;
  }
  return `${base} · abona ${formatRecordHours(abonado)} h · factura ${formatRecordHours(facturado)} h`;
}

function renderRecordsTable() {
  renderRecordsTableHead();

  if (!recordsTableBody) {
    return;
  }

  if (recordsSummary) {
    recordsSummary.textContent = buildRecordsSummaryText(filteredRecordsRows);
  }

  const listColumns = getRecordsListColumns();
  const editable = Boolean(recordsEditModeInput?.checked);
  const selectionEnabled = recordsSelectionMode;
  const columnCount = listColumns.length + (editable ? 1 : 0) + (selectionEnabled ? 1 : 0);

  if (!filteredRecordsRows.length) {
    recordsTableBody.innerHTML = `<tr><td colspan="${columnCount}" class="empty-state">No hay registros con esos filtros.</td></tr>`;
    return;
  }

  recordsTableBody.innerHTML = filteredRecordsRows
    .map((row) => {
      const cells = [];
      if (selectionEnabled) {
        const checked = selectedRecordIds.has(String(row.id)) ? "checked" : "";
        cells.push(`
          <td class="records-row-select">
            <input
              type="checkbox"
              data-record-select="${escapeHtml(row.id)}"
              aria-label="Seleccionar registro ${escapeHtml(row.id)}"
              ${checked}
            />
          </td>
        `);
      }
      cells.push(...listColumns.map((column) => {
        let content;
        if (editable && !column.readonly) {
          content = renderRecordEditableControl(row, column);
        } else {
          if (column.shortLabelKey) {
            const shortVal = String(row[column.shortLabelKey] ?? "").trim();
            const fullVal = column.relationLabelKey ? String(row[column.relationLabelKey] ?? "").trim() : "";
            if (shortVal) {
              content = `<span title="${escapeHtml(fullVal)}">${escapeHtml(shortVal)}</span>`;
            } else {
              content = escapeHtml(formatRecordDisplayValue(row, column));
            }
          } else {
            content = escapeHtml(formatRecordDisplayValue(row, column));
          }
          if (column.stackWith) {
            const stackKeys = Array.isArray(column.stackWith) ? column.stackWith : [column.stackWith];
            for (const sk of stackKeys) {
              const stackedCol = RECORD_COLUMNS.find((c) => c.key === sk);
              if (stackedCol) {
                const stackedLabel = stackedCol.relationLabelKey
                  ? String(row[stackedCol.relationLabelKey] ?? "").trim()
                  : String(row[stackedCol.key] ?? "").trim();
                if (stackedLabel) {
                  content += `<br><span class="muted-text">${escapeHtml(stackedLabel)}</span>`;
                }
              }
            }
          }
          if (column.key === "personal_id") {
            const subInfo = getRecordSubstitutionInfo(row);
            if (subInfo) {
              content = `<span title="${escapeHtml(subInfo.title)}">${content}</span>`;
            }
            content += renderRecordSubstitutionBadge(row);
          }
        }
        return `<td data-record-row="${escapeHtml(row.id)}" data-record-field-read="${escapeHtml(
          column.key
        )}">${content}</td>`;
      }));
      if (editable) {
        cells.push(`
          <td class="records-row-actions">
            <button
              type="button"
              class="compact-button danger-button"
              data-record-delete="${escapeHtml(row.id)}"
              aria-label="Eliminar registro ${escapeHtml(row.id)}"
              title="Eliminar"
            >&times;</button>
          </td>
        `);
      }
      const rowClasses = [
        String(row.id) === String(selectedRecordId) ? "selected-row" : "",
        selectedRecordIds.has(String(row.id)) ? "record-row-bulk-selected" : "",
        isRecordSubstituteRow(row) ? "record-row-sustituto" : "",
        row.sustituto_personal_id ? "record-row-sustituido" : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<tr data-record-id="${escapeHtml(row.id)}" class="${rowClasses}">${cells.join("")}</tr>`;
    })
    .join("");
  scheduleFitPanels();
}

// --- Ajuste de altura: cada pestaña activa cabe en la pantalla ---
// Redimensiona la zona con scroll (la tabla) de la pestaña visible para que el
// panel completo quepa en vertical y sea la tabla la que scrollee, no la página.
// Usa la posición real del elemento (getBoundingClientRect), así es robusto ante
// la estructura del DOM y no depende de offsets fijos.
function fitPrivatePanelScrollAreas() {
  const wrappers = document.querySelectorAll(
    ".private-tab-panel:not(.hidden) .records-table-wrapper, .private-tab-panel:not(.hidden) .table-wrapper"
  );
  wrappers.forEach((wrapper) => {
    if (!wrapper.offsetParent) return; // no visible
    const top = wrapper.getBoundingClientRect().top;
    const available = window.innerHeight - top - 24; // 24px de respiro inferior
    wrapper.style.maxHeight = `${Math.max(220, available)}px`;
  });
}
let fitPanelsScheduled = false;
function scheduleFitPanels() {
  if (fitPanelsScheduled) return;
  fitPanelsScheduled = true;
  requestAnimationFrame(() => {
    fitPanelsScheduled = false;
    fitPrivatePanelScrollAreas();
  });
}
window.addEventListener("resize", scheduleFitPanels);
document.addEventListener("click", (event) => {
  // Cambios de pestaña, expandir "Asignación masiva", etc. reposicionan la tabla.
  if (event.target.closest(".private-tab-panel, .private-tabs")) {
    scheduleFitPanels();
  }
});
try {
  const fitPanelsObserver = new MutationObserver(scheduleFitPanels);
  document
    .querySelectorAll(".private-tab-panel")
    .forEach((panel) =>
      fitPanelsObserver.observe(panel, { attributes: true, attributeFilter: ["class"] })
    );
} catch (_) {}
scheduleFitPanels();

const RECORDS_FILTER_SELECTS = [
  { id: "records-filter-contrato", idKey: "contrato_id", labelKey: "contrato", multiple: true, emptyLabel: "Todos los contratos" },
  { id: "records-filter-servicio", idKey: "servicio_id", labelKey: "servicio" },
  { id: "records-filter-personal", idKey: "personal_id", labelKey: "personal" },
  { id: "records-filter-instalacion", idKey: "instalacion_id", labelKey: "instalacion" },
];

function getSelectValues(select) {
  return Array.from(select?.selectedOptions || [])
    .map((option) => String(option.value || ""))
    .filter(Boolean);
}

function recordFilterValueMatches(rowValue, filterValue) {
  return filterValue === RECORD_EMPTY_FILTER_VALUE
    ? rowValue === null || rowValue === undefined || rowValue === ""
    : String(rowValue) === filterValue;
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

function recordsFilterMatchesValue(row, idKey, filterValue, isMultiple) {
  if (isMultiple) {
    return !filterValue.length || filterValue.some((value) => recordFilterValueMatches(row[idKey], value));
  }
  return !filterValue || recordFilterValueMatches(row[idKey], filterValue);
}

function resetRecordsNamedFilterControl(form, controlName) {
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

function getRecordsFacetSourceRows() {
  return recordsFacetRows.length ? recordsFacetRows : recordsRows;
}

function recordsHasActivePeerFilters(currentValues, excludedKey) {
  return RECORDS_FILTER_SELECTS.some(({ idKey, multiple }) => {
    if (idKey === excludedKey) return false;
    const value = currentValues[idKey];
    return multiple ? Boolean(value?.length) : Boolean(value);
  });
}

function getRecordsCompatibleFacetRows(idKey, currentValues) {
  const sourceRows = getRecordsFacetSourceRows();
  return sourceRows.filter((row) =>
    RECORDS_FILTER_SELECTS.every(({ idKey: otherKey, multiple: otherMultiple }) => {
      if (otherKey === idKey) return true;
      return recordsFilterMatchesValue(row, otherKey, currentValues[otherKey], otherMultiple);
    })
  );
}

function updateRecordsFilterOptions() {
  let changed = false;
  const currentValues = {};
  for (const { id, idKey, multiple } of RECORDS_FILTER_SELECTS) {
    const select = document.querySelector(`#${id}`);
    currentValues[idKey] = multiple ? getSelectValues(select) : select?.value || "";
  }

  // Etiqueta de un id a partir del catálogo de relaciones ya cargado.
  const labelFor = (idKey, val) => {
    const opt = (recordRelationOptionsCache[idKey] || []).find(
      (o) => String(o.value) === String(val)
    );
    return opt?.label || String(val);
  };

  for (const { id, idKey, multiple, emptyLabel } of RECORDS_FILTER_SELECTS) {
    const select = document.querySelector(`#${id}`);
    if (!select) continue;

    // Opciones de cada desplegable: filas compatibles con los demás filtros,
    // excluyendo el propio campo. Contrato parte de los activos/asignados y solo
    // se reduce cuando hay otros filtros activos.
    let ids = null;
    let sorted;
    if (idKey === "contrato_id") {
      const allowedContracts = new Map(
        (recordsFilterContratos || recordRelationOptionsCache.contrato_id || []).map((c) => [
          String(c.value),
          c.label || String(c.value),
        ])
      );
      const hasPeerFilters = recordsHasActivePeerFilters(currentValues, idKey);
      ids = new Set();
      if (hasPeerFilters || !allowedContracts.size) {
        for (const row of getRecordsCompatibleFacetRows(idKey, currentValues)) {
          const val = row[idKey];
          if (val == null || val === "") {
            ids.add(RECORD_EMPTY_FILTER_VALUE);
            continue;
          }
          const key = String(val);
          if (!allowedContracts.size || allowedContracts.has(key)) {
            ids.add(key);
          }
        }
      } else {
        for (const key of allowedContracts.keys()) {
          ids.add(key);
        }
      }
      sorted = Array.from(ids)
        .map((val) => [
          val,
          val === RECORD_EMPTY_FILTER_VALUE ? "Vacío" : allowedContracts.get(val) || labelFor(idKey, val),
        ])
        .sort((a, b) => a[1].localeCompare(b[1], "es", { sensitivity: "base" }));
    } else {
      ids = new Set();
      const compatibleRows = getRecordsCompatibleFacetRows(idKey, currentValues);
      for (const row of compatibleRows) {
        const val = row[idKey];
        ids.add(val == null || val === "" ? RECORD_EMPTY_FILTER_VALUE : String(val));
      }
      if (!ids.size && !recordsFacetRows.length && !recordsRows.length) {
        for (const o of recordRelationOptionsCache[idKey] || []) {
          ids.add(String(o.value));
        }
      }
      sorted = Array.from(ids)
        .map((val) => [val, val === RECORD_EMPTY_FILTER_VALUE ? "Vacío" : labelFor(idKey, val)])
        .sort((a, b) => a[1].localeCompare(b[1], "es", { sensitivity: "base" }));
    }

    if (id === "records-filter-personal") {
      // Filtro de personal con autocompletado (input oculto guarda el id).
      const options = sorted.map(([val, label]) => ({ value: val, label: label || String(val) }));
      setPersonalPickerOptions("records-filter", options);
      const currentId = select.value;
      const inputEl = document.querySelector("#records-filter-personal-input");
      if (currentId) {
        const match = options.find((option) => String(option.value) === String(currentId));
        if (match && inputEl && document.activeElement !== inputEl) {
          inputEl.value = match.label;
        } else if (!match) {
          select.value = "";
          if (inputEl && document.activeElement !== inputEl) inputEl.value = "";
          changed = true;
        }
      }
      personalPickers.get("records-filter")?.updateClearVisibility?.();
      continue;
    }

    if (multiple) {
      const currentIds = new Set(currentValues[idKey]);
      // Conservar los ya seleccionados aunque no estén en las facetas actuales.
      for (const selId of currentIds) {
        if (!sorted.some(([v]) => v === selId)) {
          sorted.push([selId, selId === RECORD_EMPTY_FILTER_VALUE ? "Vacío" : labelFor(idKey, selId)]);
        }
      }
      sorted.sort((a, b) => a[1].localeCompare(b[1], "es", { sensitivity: "base" }));
      select.innerHTML = sorted
        .map(([val, label]) => `<option value="${escapeHtml(val)}">${escapeHtml(label)}</option>`)
        .join("");
      Array.from(select.options).forEach((option) => {
        option.selected = currentIds.has(option.value);
      });
      const nextIds = getSelectValues(select);
      if (nextIds.length !== currentValues[idKey].length ||
          nextIds.some((value) => !currentValues[idKey].includes(value))) {
        changed = true;
      }
      syncMultiCheckDropdown(select, emptyLabel || "Todos");
      continue;
    }

    const prev = select.value;
    select.innerHTML =
      `<option value="">Todos</option>` +
      sorted
        .map(([val, label]) => `<option value="${escapeHtml(val)}">${escapeHtml(label)}</option>`)
        .join("");
    if (prev && ids && ids.has(String(prev))) {
      select.value = prev;
    } else if (prev) {
      select.value = "";
      changed = true;
    }
  }
  syncFilterResetButtons(recordsFiltersForm);
  return changed;
}

function getRecordsReportDateRange(rows = filteredRecordsRows) {
  const filters = getRecordsFilterValues();
  const dates = rows
    .map((row) => String(row.fecha || ""))
    .filter(Boolean)
    .sort();
  return {
    from: filters.fechaDesde || dates[0] || "",
    to: filters.fechaHasta || dates[dates.length - 1] || "",
  };
}

function addRecordReportHours(target, row) {
  const tipo = normalizeSearchText(row.tipo_hora || "");
  const horas = Number(row.horas) || 0;
  const noct = Number(row.horas_nocturnas) || 0;

  if (tipo.includes("pnr")) {
    target.pnr += horas;
  } else if (tipo.includes("fest") || tipo.includes("ftrab")) {
    target.hfest += horas;
  } else if (tipo.includes("mont") || tipo.includes("hmon")) {
    target.hmon += horas;
  } else if (tipo.includes("hcomp") || tipo === "hc") {
    target.hc += horas;
  } else {
    target.horas += horas;
  }
  target.noct += noct;
}

function formatRecordReportContractService(row) {
  const contract = String(row.contrato || row.contrato_id || "-").trim();
  const service = String(row.servicio || row.servicio_id || "").trim();
  return service ? `${contract} · ${service}` : contract;
}

function buildRecordsReportGroups(rows = filteredRecordsRows) {
  const people = new Map();
  for (const row of rows) {
    const personKey = String(row.personal_id ?? row.personal ?? "sin-persona");
    if (!people.has(personKey)) {
      people.set(personKey, {
        name: String(row.personal || `ID ${row.personal_id ?? ""}`).trim() || "Sin personal",
        dates: new Set(),
        rows: new Map(),
      });
    }
    const person = people.get(personKey);
    if (row.fecha) person.dates.add(String(row.fecha));
    const key = [
      row.contrato || row.contrato_id || "",
      row.servicio || row.servicio_id || "",
      row.puesto || row.puesto_id || "",
      row.situacion || row.situacion_id || "",
    ].join("||");
    if (!person.rows.has(key)) {
      person.rows.set(key, {
        contrato: formatRecordReportContractService(row),
        puesto: String(row.puesto || row.puesto_id || ""),
        situacion: String(row.situacion || row.situacion_id || ""),
        horas: 0,
        hc: 0,
        hfest: 0,
        hmon: 0,
        pnr: 0,
        noct: 0,
      });
    }
    addRecordReportHours(person.rows.get(key), row);
  }

  return Array.from(people.values())
    .map((person) => ({
      ...person,
      rows: Array.from(person.rows.values()).sort((a, b) =>
        `${a.contrato} ${a.puesto} ${a.situacion}`.localeCompare(
          `${b.contrato} ${b.puesto} ${b.situacion}`,
          "es",
          { sensitivity: "base" }
        )
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
}

function filterRecordRowsBySearch(rows, search) {
  if (!search) {
    return rows;
  }
  return rows.filter((row) =>
    RECORD_COLUMNS.some((column) =>
      normalizeRecordText(formatRecordDisplayValue(row, column)).includes(search)
    )
  );
}

async function fetchRecordsForReport() {
  const supabase = await getSupabaseClient();
  const filters = getRecordsFilterValues();
  const buildBaseQuery = (columns, options = {}) => {
    let query = supabase
      .from("registros_detalle")
      .select(columns, options)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: true });
    return applyRecordsQueryFilters(query, filters);
  };

  const { count, error: countError } = await buildBaseQuery("id", {
    count: "exact",
    head: true,
  });
  if (countError) {
    throw countError;
  }
  if (!count) {
    return [];
  }
  if (count > RECORDS_LOAD_LIMIT) {
    const confirmed = confirm(
      `El filtro devuelve ${count.toLocaleString("es-ES")} registros. Generar el informe puede tardar. ¿Quieres continuar de todas maneras?`
    );
    if (!confirmed) {
      return null;
    }
  }

  const rows = [];
  const pageSize = 1000;
  for (let from = 0; from < count; from += pageSize) {
    const to = Math.min(from + pageSize - 1, count - 1);
    const { data, error } = await buildBaseQuery(RECORD_SELECT_COLUMNS).range(from, to);
    if (error) {
      throw error;
    }
    rows.push(...(data || []));
  }
  return filterRecordRowsBySearch(rows, filters.search);
}

function formatReportNumber(value) {
  const n = Number(value) || 0;
  if (!n) return "";
  return n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getReportRowTotal(row) {
  return row.horas + row.hc + row.hfest + row.hmon + row.pnr + row.noct;
}

function setRecordsReportPreviewDownloadsEnabled(enabled) {
  if (recordsReportPdfButton) {
    recordsReportPdfButton.disabled = !enabled;
  }
  if (recordsReportCompactPdfButton) {
    recordsReportCompactPdfButton.disabled = !enabled;
  }
}

function invalidateRecordsReportPreview(message = "La previsualizacion se actualizara al volver a abrirla.") {
  recordsReportPreviewRows = null;
  setRecordsReportPreviewDownloadsEnabled(false);
  if (!recordsReportPreviewPanel?.classList.contains("hidden")) {
    if (recordsReportPreviewSummary) {
      recordsReportPreviewSummary.textContent = message;
    }
    if (recordsReportPreviewContent) {
      recordsReportPreviewContent.innerHTML =
        '<p class="empty-state">Los filtros han cambiado. Pulsa Previsualizar informe para regenerar la vista.</p>';
    }
  }
}

function renderRecordsReportPreview(rows) {
  const range = getRecordsReportDateRange(rows);
  const groups = buildRecordsReportGroups(rows);
  recordsReportPreviewRows = rows;
  setRecordsReportPreviewDownloadsEnabled(Boolean(rows.length));

  if (recordsReportPreviewSummary) {
    recordsReportPreviewSummary.textContent = `${rows.length.toLocaleString(
      "es-ES"
    )} registros filtrados. Periodo: ${formatDisplayDate(range.from) || "-"} - ${
      formatDisplayDate(range.to) || "-"
    }.`;
  }

  if (!recordsReportPreviewContent) {
    return;
  }

  if (!groups.length) {
    recordsReportPreviewContent.innerHTML =
      '<p class="empty-state">No hay registros con los filtros actuales.</p>';
    return;
  }

  recordsReportPreviewContent.innerHTML = groups
    .map((group) => {
      const totals = { horas: 0, hc: 0, hfest: 0, hmon: 0, pnr: 0, noct: 0, total: 0 };
      const rowsHtml = group.rows
        .map((row) => {
          const total = getReportRowTotal(row);
          totals.horas += row.horas;
          totals.hc += row.hc;
          totals.hfest += row.hfest;
          totals.hmon += row.hmon;
          totals.pnr += row.pnr;
          totals.noct += row.noct;
          totals.total += total;
          return `
            <tr>
              <td>${escapeHtml(row.contrato || "-")}</td>
              <td>${escapeHtml(row.puesto || "-")}</td>
              <td>${escapeHtml(row.situacion || "-")}</td>
              <td class="numeric-cell">${escapeHtml(formatReportNumber(row.horas))}</td>
              <td class="numeric-cell">${escapeHtml(formatReportNumber(row.hc))}</td>
              <td class="numeric-cell">${escapeHtml(formatReportNumber(row.hfest))}</td>
              <td class="numeric-cell">${escapeHtml(formatReportNumber(row.hmon))}</td>
              <td class="numeric-cell">${escapeHtml(formatReportNumber(row.pnr))}</td>
              <td class="numeric-cell">${escapeHtml(formatReportNumber(row.noct))}</td>
              <td class="numeric-cell">${escapeHtml(formatReportNumber(total))}</td>
            </tr>
          `;
        })
        .join("");

      return `
        <section class="records-report-preview-section">
          <div class="records-report-preview-person">
            <h3>${escapeHtml(group.name)}</h3>
            <p>${escapeHtml(String(group.dates.size))} desplazamiento${
              group.dates.size === 1 ? "" : "s"
            }</p>
          </div>
          <div class="table-wrap records-report-preview-table-wrap">
            <table class="records-report-preview-table">
              <thead>
                <tr>
                  <th>Contrato / Servicio</th>
                  <th>Puesto</th>
                  <th>Situacion</th>
                  <th>Horas</th>
                  <th>HC</th>
                  <th>HFest</th>
                  <th>HMon</th>
                  <th>PNR</th>
                  <th>Noct</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr class="report-totals-row">
                  <th colspan="3" scope="row">Subtotal</th>
                  <td class="numeric-cell">${escapeHtml(formatReportNumber(totals.horas))}</td>
                  <td class="numeric-cell">${escapeHtml(formatReportNumber(totals.hc))}</td>
                  <td class="numeric-cell">${escapeHtml(formatReportNumber(totals.hfest))}</td>
                  <td class="numeric-cell">${escapeHtml(formatReportNumber(totals.hmon))}</td>
                  <td class="numeric-cell">${escapeHtml(formatReportNumber(totals.pnr))}</td>
                  <td class="numeric-cell">${escapeHtml(formatReportNumber(totals.noct))}</td>
                  <td class="numeric-cell">${escapeHtml(formatReportNumber(totals.total))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      `;
    })
    .join("");
}

async function openRecordsReportPreview() {
  recordsReportPreviewPanel?.classList.remove("hidden");
  recordsReportPreviewBackdrop?.classList.remove("hidden");
  setRecordsReportPreviewDownloadsEnabled(false);
  if (recordsReportPreviewSummary) {
    recordsReportPreviewSummary.textContent = "Preparando previsualizacion con los filtros actuales...";
  }
  if (recordsReportPreviewContent) {
    recordsReportPreviewContent.innerHTML =
      '<p class="empty-state">Cargando registros filtrados para el informe...</p>';
  }

  try {
    const rows = await fetchRecordsForReport();
    if (rows === null) {
      invalidateRecordsReportPreview("Generacion de previsualizacion cancelada.");
      return;
    }
    renderRecordsReportPreview(rows);
  } catch (error) {
    recordsReportPreviewRows = null;
    setRecordsReportPreviewDownloadsEnabled(false);
    if (recordsReportPreviewSummary) {
      recordsReportPreviewSummary.textContent = "No se pudo preparar la previsualizacion.";
    }
    if (recordsReportPreviewContent) {
      recordsReportPreviewContent.innerHTML =
        '<p class="empty-state">Error cargando los registros filtrados del informe.</p>';
    }
    setStatus(`No se pudo preparar la previsualizacion: ${error?.message ?? "error desconocido"}`, "error");
  }
}

function closeRecordsReportPreview() {
  recordsReportPreviewPanel?.classList.add("hidden");
  recordsReportPreviewBackdrop?.classList.add("hidden");
}

function drawRecordsReportFooter(doc, pageNumber) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  doc.setDrawColor(180);
  doc.line(12, pageHeight - 13, pageWidth - 12, pageHeight - 13);
  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.text(now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), 12, pageHeight - 7);
  doc.text(now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }), pageWidth / 2, pageHeight - 7, { align: "center" });
  doc.text(`Pagina ${pageNumber}`, pageWidth - 12, pageHeight - 7, { align: "right" });
}

function drawRecordsReportHeader(doc, range) {
  doc.setFont("times", "bolditalic");
  doc.setFontSize(10);
  doc.rect(12, 10, 96, 8);
  doc.text("Fecha Inicio", 14, 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(formatDisplayDate(range.from), 48, 15.5);
  doc.setFont("times", "bolditalic");
  doc.setFontSize(10);
  doc.text("Fecha Fin", 64, 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(formatDisplayDate(range.to), 92, 15.5);
}

async function exportRecordsReportPdf(previewRows = null) {
  try {
    setStatus("Preparando informe PDF de registros...");
    const reportRows = previewRows || (await fetchRecordsForReport());
    if (reportRows === null) {
      setStatus("Generación de informe cancelada.", "error");
      return;
    }
    if (!reportRows.length) {
      alert("No hay datos filtrados para generar el informe.");
      return;
    }

    const { jsPDF } = await getJsPdfClient();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const range = getRecordsReportDateRange(reportRows);
    const groups = buildRecordsReportGroups(reportRows);
    const columns = [
      { key: "contrato", label: "Contrato / Servicio", x: 12, w: 40, align: "left" },
      { key: "puesto", label: "Puesto", x: 52, w: 38, align: "left" },
      { key: "horas", label: "Horas", x: 90, w: 13, align: "right" },
      { key: "hc", label: "HC", x: 103, w: 12, align: "right" },
      { key: "hfest", label: "HFest", x: 115, w: 13, align: "right" },
      { key: "hmon", label: "HMon", x: 128, w: 13, align: "right" },
      { key: "pnr", label: "PNR", x: 141, w: 12, align: "right" },
      { key: "noct", label: "Noct", x: 153, w: 12, align: "right" },
      { key: "total", label: "Total", x: 165, w: 14, align: "right" },
      { key: "situacion", label: "Situacio", x: 179, w: 19, align: "left" },
    ];

    let page = 1;
    let y = 22;
    const ensureSpace = (needed = 24) => {
      if (y + needed <= pageHeight - 18) return false;
      drawRecordsReportFooter(doc, page);
      doc.addPage();
      page += 1;
      drawRecordsReportHeader(doc, range);
      y = 22;
      return true;
    };
    const drawTableHeader = () => {
      doc.setFont("times", "bolditalic");
      doc.setFontSize(9);
      columns.forEach((col) => {
        doc.rect(col.x, y, col.w, 7);
        doc.text(col.label, col.align === "right" ? col.x + col.w - 1.5 : col.x + 1.2, y + 4.8, { align: col.align });
      });
      y += 7;
    };

    drawRecordsReportHeader(doc, range);
    for (const group of groups) {
      ensureSpace(18 + group.rows.length * 6);
      doc.setFillColor(214, 217, 226);
      doc.rect(12, y, 96, 7, "F");
      doc.rect(148, y, 50, 7, "F");
      doc.setFont("times", "bolditalic");
      doc.setFontSize(12);
      doc.text("Personal", 13, y + 5);
      doc.setFont("helvetica", "bold");
      doc.text(group.name.slice(0, 42), 34, y + 5);
      doc.setFont("times", "bolditalic");
      doc.text("Desplazamientos:", 151, y + 5);
      doc.setFont("helvetica", "bold");
      doc.text(String(group.dates.size), 195, y + 5, { align: "right" });
      y += 8;
      drawTableHeader();

      const totals = { horas: 0, hc: 0, hfest: 0, hmon: 0, pnr: 0, noct: 0, total: 0 };
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      for (const row of group.rows) {
        if (ensureSpace(13)) {
          drawTableHeader();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
        }
        const total = getReportRowTotal(row);
        totals.horas += row.horas;
        totals.hc += row.hc;
        totals.hfest += row.hfest;
        totals.hmon += row.hmon;
        totals.pnr += row.pnr;
        totals.noct += row.noct;
        totals.total += total;
        const values = { ...row, total };
        columns.forEach((col) => {
          doc.rect(col.x, y, col.w, 6);
          const raw = col.key === "contrato" || col.key === "puesto" || col.key === "situacion"
            ? String(values[col.key] || "").slice(0, col.key === "situacion" ? 10 : 28)
            : formatReportNumber(values[col.key]);
          doc.text(raw, col.align === "right" ? col.x + col.w - 1.2 : col.x + 1, y + 4.2, { align: col.align });
        });
        y += 6;
      }
      doc.line(90, y + 2, 179, y + 2);
      y += 6;
      columns.forEach((col) => {
        if (!["horas", "hc", "hfest", "hmon", "pnr", "noct", "total"].includes(col.key)) return;
        doc.text(formatReportNumber(totals[col.key]), col.x + col.w - 1.2, y, { align: "right" });
      });
      y += 8;
    }
    drawRecordsReportFooter(doc, page);

    const suffix = `${range.from || "inicio"}-${range.to || "fin"}`.replaceAll("/", "-");
    doc.save(`informe-registros-${suffix}.pdf`);
    setStatus("Informe PDF de registros generado correctamente.", "success");
  } catch (error) {
    setStatus(`No se pudo generar el informe de registros: ${error?.message ?? "error desconocido"}`, "error");
  }
}

function drawRecordsCompactReportFooter(doc, pageNumber) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  doc.setDrawColor(180);
  doc.line(10, pageHeight - 11, pageWidth - 10, pageHeight - 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(now.toLocaleString("es-ES"), 10, pageHeight - 6);
  doc.text(`Pagina ${pageNumber}`, pageWidth - 10, pageHeight - 6, { align: "right" });
}

function drawRecordsCompactReportHeader(doc, range, rowCount) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Resumen de horas por persona", 10, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Periodo: ${formatDisplayDate(range.from) || "-"} - ${formatDisplayDate(range.to) || "-"}`, 10, 18);
  doc.text(`Registros incluidos: ${rowCount.toLocaleString("es-ES")}`, pageWidth - 10, 18, { align: "right" });
}

async function exportRecordsCompactReportPdf(previewRows = null) {
  try {
    setStatus("Preparando informe compacto de registros...");
    const reportRows = previewRows || (await fetchRecordsForReport());
    if (reportRows === null) {
      setStatus("Generación de informe cancelada.", "error");
      return;
    }
    if (!reportRows.length) {
      alert("No hay datos filtrados para generar el informe.");
      return;
    }

    const { jsPDF } = await getJsPdfClient();
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageHeight = doc.internal.pageSize.getHeight();
    const range = getRecordsReportDateRange(reportRows);
    const groups = buildRecordsReportGroups(reportRows);
    const columns = [
      { key: "personal", label: "Personal", x: 10, w: 52, align: "left" },
      { key: "contrato", label: "Contrato / Servicio", x: 62, w: 33, align: "left" },
      { key: "puesto", label: "Puesto", x: 95, w: 38, align: "left" },
      { key: "situacion", label: "Sit.", x: 133, w: 18, align: "left" },
      { key: "horas", label: "Horas", x: 151, w: 18, align: "right" },
      { key: "hc", label: "HC", x: 169, w: 16, align: "right" },
      { key: "hfest", label: "HFest", x: 185, w: 16, align: "right" },
      { key: "hmon", label: "HMon", x: 201, w: 16, align: "right" },
      { key: "pnr", label: "PNR", x: 217, w: 16, align: "right" },
      { key: "noct", label: "Noct", x: 233, w: 16, align: "right" },
      { key: "total", label: "Total", x: 249, w: 18, align: "right" },
      { key: "despl", label: "Despl.", x: 267, w: 20, align: "right" },
    ];

    let page = 1;
    let y = 24;
    const drawHeader = () => {
      drawRecordsCompactReportHeader(doc, range, reportRows.length);
      doc.setFillColor(232, 235, 242);
      doc.rect(10, y, 277, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      columns.forEach((col) => {
        doc.text(col.label, col.align === "right" ? col.x + col.w - 1 : col.x + 1, y + 4.8, { align: col.align });
      });
      y += 8;
    };
    const ensureSpace = (needed = 7) => {
      if (y + needed <= pageHeight - 14) return;
      drawRecordsCompactReportFooter(doc, page);
      doc.addPage();
      page += 1;
      y = 24;
      drawHeader();
    };
    const drawCell = (col, value, rowY, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const text = String(value || "");
      doc.text(text.slice(0, col.key === "personal" ? 34 : 24), col.align === "right" ? col.x + col.w - 1 : col.x + 1, rowY + 4.2, { align: col.align });
    };

    drawHeader();
    const grandTotals = { horas: 0, hc: 0, hfest: 0, hmon: 0, pnr: 0, noct: 0, total: 0, desplazamientos: 0 };
    doc.setFontSize(7.2);
    for (const group of groups) {
      const personTotals = { horas: 0, hc: 0, hfest: 0, hmon: 0, pnr: 0, noct: 0, total: 0 };
      group.rows.forEach((row) => {
        personTotals.horas += row.horas;
        personTotals.hc += row.hc;
        personTotals.hfest += row.hfest;
        personTotals.hmon += row.hmon;
        personTotals.pnr += row.pnr;
        personTotals.noct += row.noct;
        personTotals.total += getReportRowTotal(row);
      });
      grandTotals.horas += personTotals.horas;
      grandTotals.hc += personTotals.hc;
      grandTotals.hfest += personTotals.hfest;
      grandTotals.hmon += personTotals.hmon;
      grandTotals.pnr += personTotals.pnr;
      grandTotals.noct += personTotals.noct;
      grandTotals.total += personTotals.total;
      grandTotals.desplazamientos += group.dates.size;

      let first = true;
      for (const row of group.rows) {
        ensureSpace(6);
        const total = getReportRowTotal(row);
        if (first) {
          drawCell(columns[0], group.name, y);
        }
        drawCell(columns[1], row.contrato, y);
        drawCell(columns[2], row.puesto, y);
        drawCell(columns[3], row.situacion, y);
        ["horas", "hc", "hfest", "hmon", "pnr", "noct"].forEach((key, idx) => {
          drawCell(columns[4 + idx], formatReportNumber(row[key]), y);
        });
        drawCell(columns[10], formatReportNumber(total), y);
        if (first) {
          drawCell(columns[11], String(group.dates.size), y);
        }
        y += 5.5;
        first = false;
      }

      ensureSpace(6);
      doc.setFillColor(245, 246, 248);
      doc.rect(10, y - 1, 277, 6, "F");
      drawCell(columns[0], `Subtotal ${group.name}`.slice(0, 42), y, true);
      ["horas", "hc", "hfest", "hmon", "pnr", "noct"].forEach((key, idx) => {
        drawCell(columns[4 + idx], formatReportNumber(personTotals[key]), y, true);
      });
      drawCell(columns[10], formatReportNumber(personTotals.total), y, true);
      drawCell(columns[11], String(group.dates.size), y, true);
      y += 7;
    }

    ensureSpace(8);
    doc.setFillColor(218, 224, 235);
    doc.rect(10, y - 1, 277, 7, "F");
    drawCell(columns[0], "TOTAL GENERAL", y, true);
    ["horas", "hc", "hfest", "hmon", "pnr", "noct"].forEach((key, idx) => {
      drawCell(columns[4 + idx], formatReportNumber(grandTotals[key]), y, true);
    });
    drawCell(columns[10], formatReportNumber(grandTotals.total), y, true);
    drawCell(columns[11], String(grandTotals.desplazamientos), y, true);

    drawRecordsCompactReportFooter(doc, page);
    const suffix = `${range.from || "inicio"}-${range.to || "fin"}`.replaceAll("/", "-");
    doc.save(`informe-registros-compacto-${suffix}.pdf`);
    setStatus("Informe compacto de registros generado correctamente.", "success");
  } catch (error) {
    setStatus(`No se pudo generar el informe compacto: ${error?.message ?? "error desconocido"}`, "error");
  }
}

const RECORD_BULK_FIELDS = {
  fecha: { label: "Fecha", type: "date" },
  empresa_id: { label: "Empresa", type: "select", source: "empresa_id" },
  contrato_id: { label: "Contrato", type: "select", source: "contrato_id" },
  servicio_id: { label: "Servicio", type: "select", source: "servicio_id" },
  personal_id: { label: "Personal", type: "select", source: "personal_id" },
  instalacion_id: { label: "Instalacion", type: "select", source: "instalacion_id" },
  puesto_id: { label: "Puesto", type: "select", source: "puesto_id" },
  funcion_id: { label: "Funcion", type: "select", source: "funcion_id" },
  modalidad_id: { label: "Modalidad", type: "select", source: "modalidad_id" },
  tipo_hora_id: { label: "Tipo hora", type: "select", source: "tipo_hora_id" },
  situacion_id: { label: "Situacion", type: "select", source: "situacion_id" },
  hora_inicio: { label: "Hora inicio", type: "time" },
  hora_fin: { label: "Hora fin", type: "time" },
  horas: { label: "Horas", type: "number" },
  facturar: { label: "Facturar", type: "boolean" },
  abonar: { label: "Abonar", type: "boolean" },
  sustitucion: { label: "Sustitucion", type: "boolean" },
  nota: { label: "Nota", type: "text" },
  observacion: { label: "Observacion", type: "text" },
};

const recordsBulkFieldSelect = document.querySelector("#records-bulk-field");
const recordsBulkCurrentValueInput = document.querySelector("#records-bulk-current-value");
const recordsBulkCurrentSelect = document.querySelector("#records-bulk-current-select");
const recordsBulkNewValueInput = document.querySelector("#records-bulk-new-value");
const recordsBulkNewSelect = document.querySelector("#records-bulk-new-select");
const recordsBulkApplyButton = document.querySelector("#records-bulk-apply-button");
const recordsBulkClearFieldsButton = document.querySelector("#records-bulk-clear-fields-button");
const recordsBulkSelectButton = document.querySelector("#records-bulk-select-button");
const recordsBulkClearSelectionButton = document.querySelector("#records-bulk-clear-selection-button");
const recordsBulkDeleteButton = document.querySelector("#records-bulk-delete-button");
const recordsBulkMatchCount = document.querySelector("#records-bulk-match-count");
const recordsBulkSelectionCount = document.querySelector("#records-bulk-selection-count");
const recordsReportPreviewButton = document.querySelector("#records-report-preview-button");
const recordsReportPreviewBackdrop = document.querySelector("#records-report-preview-backdrop");
const recordsReportPreviewPanel = document.querySelector("#records-report-preview-panel");
const recordsReportPreviewSummary = document.querySelector("#records-report-preview-summary");
const recordsReportPreviewContent = document.querySelector("#records-report-preview-content");
const recordsReportPreviewCloseButton = document.querySelector("#records-report-preview-close-button");
const recordsReportPdfButton = document.querySelector("#records-report-pdf-button");
const recordsReportCompactPdfButton = document.querySelector("#records-report-compact-pdf-button");

function getRecordsBulkFieldConfig() {
  return RECORD_BULK_FIELDS[recordsBulkFieldSelect?.value] || RECORD_BULK_FIELDS.fecha;
}

function getRecordBulkContractLabel(contractId) {
  const option = (recordsFilterContratos || recordRelationOptionsCache.contrato_id || []).find(
    (item) => String(item.value) === String(contractId)
  );
  return option?.label || `Contrato ${contractId}`;
}

function getRecordBulkSelectOptions(source, options = {}) {
  if (source === "contrato_id") {
    const optionRows = recordsFilterContratos?.length
      ? recordsFilterContratos
      : recordRelationOptionsCache.contrato_id || [];
    return optionRows
      .map((row) => ({ value: row.value, label: row.label || String(row.value) }))
      .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
  }

  if (source === "servicio_id") {
    return (recordRelationOptionsCache.servicio_id || [])
      .map((service) => ({
        value: service.value,
        label: `${service.label || String(service.value)} · ${getRecordBulkContractLabel(service.contrato_id)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
  }

  const col = RECORD_COLUMNS.find((c) => c.key === source);
  const labelKey = col?.relationLabelKey;
  const seen = new Map();
  for (const row of recordsRows) {
    const val = row[source];
    if (val == null || seen.has(val)) continue;
    seen.set(val, labelKey ? (row[labelKey] ?? "") : String(val));
  }
  return Array.from(seen.entries())
    .map(([value, label]) => ({ value, label: label ? `${value} · ${label}` : String(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
}

function renderRecordsBulkSelectOptions(
  select,
  config,
  selectedValue = select?.value || "",
  includeUnset = false,
  options = {}
) {
  if (!select || config.type !== "select") return;
  const selectOptions = getRecordBulkSelectOptions(config.source, options);
  const rendered = includeUnset
    ? [
        { value: RECORD_BULK_UNSET_VALUE, label: "Selecciona valor" },
        { value: RECORD_BULK_EMPTY_VALUE, label: "Vacío" },
        ...selectOptions,
      ]
    : selectOptions;
  select.innerHTML = rendered
    .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
    .join("");
  const sel = String(selectedValue ?? "");
  select.value = rendered.some((o) => String(o.value) === sel) ? sel : rendered[0]?.value || "";
}

function normalizeRecordBulkValue(value, config) {
  if (value === null || value === undefined || value === "" || value === RECORD_BULK_EMPTY_VALUE) return "";
  if (config.type === "boolean") return value === true || value === "true" ? "true" : "false";
  if (config.type === "number") { const n = Number(value); return Number.isFinite(n) ? String(n) : ""; }
  return String(value).trim();
}

function getRecordBulkControlValue(kind = "current") {
  const config = getRecordsBulkFieldConfig();
  if (config.type === "select") {
    return kind === "new" ? recordsBulkNewSelect?.value || "" : recordsBulkCurrentSelect?.value || "";
  }
  if (config.type === "boolean") {
    return kind === "new" ? recordsBulkNewSelect?.value || "" : recordsBulkCurrentSelect?.value || "";
  }
  return kind === "new" ? recordsBulkNewValueInput?.value || "" : recordsBulkCurrentValueInput?.value || "";
}

function getRecordBulkMatchingRows() {
  const field = recordsBulkFieldSelect?.value;
  const config = getRecordsBulkFieldConfig();
  if (!field) return [];
  if (config.type === "select" && getRecordBulkControlValue("current") === RECORD_BULK_UNSET_VALUE) {
    return [];
  }
  const currentValue = normalizeRecordBulkValue(getRecordBulkControlValue("current"), config);
  return filteredRecordsRows.filter((row) => normalizeRecordBulkValue(row[field], config) === currentValue);
}

function syncRecordsBulkUi() {
  const config = getRecordsBulkFieldConfig();
  const isSelect = config.type === "select" || config.type === "boolean";

  if (recordsBulkCurrentValueInput) recordsBulkCurrentValueInput.classList.toggle("hidden", isSelect);
  if (recordsBulkCurrentSelect) recordsBulkCurrentSelect.classList.toggle("hidden", !isSelect);
  if (recordsBulkNewValueInput) recordsBulkNewValueInput.classList.toggle("hidden", isSelect);
  if (recordsBulkNewSelect) recordsBulkNewSelect.classList.toggle("hidden", !isSelect);

  if (isSelect) {
    if (config.type === "boolean") {
      const boolOpts = [{ value: "true", label: "Si" }, { value: "false", label: "No" }];
      [recordsBulkCurrentSelect, recordsBulkNewSelect].forEach((sel) => {
        if (sel) sel.innerHTML = boolOpts.map((o) => `<option value="${o.value}">${o.label}</option>`).join("");
      });
    } else {
      renderRecordsBulkSelectOptions(
        recordsBulkCurrentSelect,
        config,
        recordsBulkCurrentSelect?.value || RECORD_BULK_UNSET_VALUE,
        true,
        { kind: "current" }
      );
      renderRecordsBulkSelectOptions(
        recordsBulkNewSelect,
        config,
        recordsBulkNewSelect?.value || "",
        true,
        { kind: "new" }
      );
    }
  } else {
    const inputType = config.type === "date" ? "date" : config.type === "time" ? "time" : config.type === "number" ? "number" : "text";
    if (recordsBulkCurrentValueInput) { recordsBulkCurrentValueInput.type = inputType; recordsBulkCurrentValueInput.value = ""; }
    if (recordsBulkNewValueInput) { recordsBulkNewValueInput.type = inputType; recordsBulkNewValueInput.value = ""; }
  }

  updateRecordsBulkMatchCount();
}

function updateRecordsBulkMatchCount() {
  const matches = getRecordBulkMatchingRows();
  if (recordsBulkMatchCount) {
    recordsBulkMatchCount.textContent = `${matches.length} coincidencia${matches.length !== 1 ? "s" : ""}`;
  }
  updateRecordsBulkSelectionUi();
}

function getSelectedRecordRowsForBulkAction() {
  const ids = new Set(Array.from(selectedRecordIds).map(String));
  return filteredRecordsRows.filter((row) => ids.has(String(row.id)));
}

function getRecordsBulkTargetRows() {
  if (recordsSelectionMode) {
    return getSelectedRecordRowsForBulkAction();
  }
  return getRecordBulkMatchingRows();
}

function updateRecordsBulkSelectionUi() {
  const count = getSelectedRecordRowsForBulkAction().length;
  recordsBulkSelectionCount?.classList.toggle("hidden", !recordsSelectionMode);
  recordsBulkClearSelectionButton?.classList.toggle("hidden", !recordsSelectionMode);
  recordsBulkDeleteButton?.classList.toggle("hidden", !recordsSelectionMode || !count);
  if (recordsBulkSelectionCount) {
    recordsBulkSelectionCount.textContent = recordsSelectionMode
      ? `${count} seleccionado${count !== 1 ? "s" : ""} de ${filteredRecordsRows.length}`
      : `${count} seleccionado${count !== 1 ? "s" : ""}`;
  }
  syncRecordsSelectAllCheckbox();
}

function syncRecordsSelectAllCheckbox() {
  const checkbox = recordsTableHead?.querySelector("[data-record-select-all]");
  if (!checkbox) return;
  const visibleIds = filteredRecordsRows.map((row) => String(row.id));
  const selectedVisibleCount = visibleIds.filter((id) => selectedRecordIds.has(id)).length;
  checkbox.checked = Boolean(visibleIds.length) && selectedVisibleCount === visibleIds.length;
  checkbox.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
  checkbox.disabled = !recordsSelectionMode || !visibleIds.length;
}

function pruneSelectedRecordIdsToLoadedRows() {
  const loadedIds = new Set(recordsRows.map((row) => String(row.id)));
  selectedRecordIds = new Set(Array.from(selectedRecordIds).filter((id) => loadedIds.has(id)));
  if (!selectedRecordIds.size) {
    recordsSelectionMode = false;
  }
  updateRecordsBulkSelectionUi();
}

function enableRecordsBulkSelection() {
  recordsSelectionMode = true;
  selectedRecordIds.clear();
  updateRecordsBulkSelectionUi();
  renderRecordsTable();
  setStatus("Marca con el tick los registros sobre los que quieres actuar.", "success");
}

function clearRecordsBulkSelection() {
  recordsSelectionMode = false;
  selectedRecordIds.clear();
  updateRecordsBulkSelectionUi();
  renderRecordsTable();
}

function clearRecordsBulkFields() {
  if (recordsBulkFieldSelect) {
    recordsBulkFieldSelect.value = "fecha";
  }
  syncRecordsBulkUi();
  updateRecordsBulkMatchCount();
}

async function deleteSelectedBulkRecords() {
  const ids = getSelectedRecordRowsForBulkAction().map((row) => String(row.id));
  const count = ids.length;
  if (!count) {
    setStatus("No hay registros seleccionados para borrar.", "error");
    return;
  }
  if (!confirm(`¿Se van a borrar ${count} registros, está conforme?`)) {
    return;
  }

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("registros").delete().in("id", ids.map(Number));
    if (error) throw error;
    if (recordDetailSnapshot && selectedRecordIds.has(String(recordDetailSnapshot.id))) {
      closeRecordDetail(true);
    }
    selectedRecordIds.clear();
    recordsSelectionMode = false;
    await loadRecords();
    setStatus(`${count} registro${count !== 1 ? "s" : ""} borrado${count !== 1 ? "s" : ""}.`, "success");
  } catch (error) {
    setStatus(`No se pudieron borrar los registros seleccionados: ${error.message}`, "error");
  }
}

async function applyRecordsBulkAssignment() {
  const field = recordsBulkFieldSelect?.value;
  const config = getRecordsBulkFieldConfig();
  if (!field || !RECORD_BULK_FIELDS[field]) return;

  const matches = getRecordsBulkTargetRows();
  if (!matches.length) {
    setStatus(
      recordsSelectionMode
        ? "Selecciona al menos un registro para aplicar la asignación masiva."
        : "No hay registros que coincidan con el valor actual.",
      "error"
    );
    return;
  }

  const rawNewValue = getRecordBulkControlValue("new");
  if (rawNewValue === RECORD_BULK_UNSET_VALUE) {
    setStatus("Selecciona un nuevo valor.", "error");
    return;
  }

  const newValue = rawNewValue === RECORD_BULK_EMPTY_VALUE ? null
    : config.type === "boolean" ? (rawNewValue === "true")
    : config.type === "number" ? (Number(rawNewValue) || null)
    : ["select"].includes(config.type) ? (Number(rawNewValue) || rawNewValue || null)
    : rawNewValue || null;

  const currentLabel = normalizeRecordBulkValue(getRecordBulkControlValue("current"), config);
  const newLabel = rawNewValue === RECORD_BULK_EMPTY_VALUE ? "Vacío" : normalizeRecordBulkValue(rawNewValue, config);
  const newServiceContractId =
    field === "servicio_id" && newValue !== null
      ? Number(getRecordServiceOption(newValue)?.contrato_id)
      : null;
  if (field === "servicio_id" && newValue !== null && !Number.isFinite(newServiceContractId)) {
    setStatus("Selecciona un servicio valido.", "error");
    return;
  }

  const warning =
    field === "contrato_id"
      ? "\n\nAviso: al cambiar el contrato se dejará el servicio sin asignar en esos registros. Después tendrás que asignar un servicio del nuevo contrato."
      : field === "servicio_id" && newValue !== null
        ? "\n\nAviso: si el servicio pertenece a otro contrato, se actualizará también el contrato de esos registros."
      : "";
  const confirmText =
    (recordsSelectionMode
      ? `Cambiar ${config.label} a "${newLabel}" en ${matches.length} registro${matches.length !== 1 ? "s" : ""} seleccionado${matches.length !== 1 ? "s" : ""}?`
      : `Cambiar ${config.label} de "${currentLabel}" a "${newLabel}" en ${matches.length} registro${matches.length !== 1 ? "s" : ""}?`) +
    warning;
  if (!confirm(confirmText)) return;

  try {
    const supabase = await getSupabaseClient();
    const ids = matches.map((row) => row.id);
    const updatePayload =
      field === "contrato_id"
        ? { contrato_id: newValue, servicio_id: null }
        : field === "servicio_id" && newValue !== null
          ? { servicio_id: newValue, contrato_id: newServiceContractId }
          : { [field]: newValue };
    const { error } = await supabase.from("registros").update(updatePayload).in("id", ids);
    if (error) throw error;
    await loadRecords();
    setStatus(
      field === "contrato_id"
        ? `${config.label} actualizado en ${matches.length} registro${matches.length !== 1 ? "s" : ""}. El servicio se ha dejado sin asignar.`
        : `${config.label} actualizado en ${matches.length} registro${matches.length !== 1 ? "s" : ""}.`,
      "success"
    );
  } catch (error) {
    setStatus(`Error en asignación masiva: ${error.message}`, "error");
  }
}

async function loadRecords() {
  invalidateRecordsReportPreview();
  if (recordsSummary) {
    recordsSummary.textContent = "Cargando registros...";
  }
  if (recordsTableBody) {
    recordsTableBody.innerHTML = `<tr><td colspan="99" class="empty-state">Cargando registros...</td></tr>`;
  }

  try {
    const supabase = await getSupabaseClient();
    const filters = getRecordsFilterValues();
    await loadRecordRelationOptions();
    const buildQuery = (tableName, columns) => {
      let nextQuery = supabase
        .from(tableName)
        .select(columns)
        .order("fecha", { ascending: false })
        .order("hora_inicio", { ascending: true })
        .limit(RECORDS_LOAD_LIMIT);

      return applyRecordsQueryFilters(nextQuery, filters);
    };

    let { data, error } = await buildQuery("registros_detalle", RECORD_SELECT_COLUMNS);
    if (error && String(error.message || "").toLowerCase().includes("registros_detalle")) {
      ({ data, error } = await buildQuery(
        "registros",
        RECORD_COLUMNS.filter((column) => !column.derived).map((column) => column.key).join(",")
      ));
    }

    if (error) {
      throw error;
    }

    recordsRows = data ?? [];
    pruneSelectedRecordIdsToLoadedRows();
    applyRecordsClientFilters();
    sortRecordsRows();
    renderRecordsTable();
    // La tabla ya está pintada; las facetas (para los desplegables) pueden tardar
    // en el peor caso, así que se cargan después sin bloquear el render.
    await loadRecordsFacets(filters);
    if (updateRecordsFilterOptions()) {
      await loadRecords();
    }
  } catch (error) {
    if (recordsSummary) {
      recordsSummary.textContent = "No se pudieron cargar los registros.";
    }
    if (recordsTableBody) {
      recordsTableBody.innerHTML = `<tr><td colspan="99" class="empty-state">Error cargando registros.</td></tr>`;
    }
    setStatus(`No se pudieron cargar los registros: ${error.message}`, "error");
  }
}

function updateRecordRowsLocally(recordId, patch) {
  const updateRow = (row) => (String(row.id) === String(recordId) ? { ...row, ...patch } : row);
  recordsRows = recordsRows.map(updateRow);
  filteredRecordsRows = filteredRecordsRows.map(updateRow);
  if (recordDetailSnapshot && String(recordDetailSnapshot.id) === String(recordId)) {
    recordDetailSnapshot = { ...recordDetailSnapshot, ...patch };
  }
}

function patchTouchesRecordRelation(patch) {
  return Object.keys(patch).some((key) => getRecordColumn(key)?.relationLabelKey || key === "actividad_id");
}

async function saveRecordPatch(recordId, patch) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from("registros").update(patch).eq("id", recordId);

  if (error) {
    throw error;
  }

  updateRecordRowsLocally(recordId, patch);
  if (patchTouchesRecordRelation(patch)) {
    await loadRecords();
  }
}

async function handleRecordCellCommit(control) {
  const recordId = control?.dataset?.recordCell;
  const field = control?.dataset?.recordField;
  const column = getRecordColumn(field);

  if (!recordId || !column || column.readonly) {
    return;
  }

  const row = recordsRows.find((item) => String(item.id) === String(recordId));
  if (!row) {
    return;
  }

  const rawValue = column.type === "boolean" ? control.checked : control.value;
  const nextValue = parseRecordFieldValue(rawValue, column);
  const previousComparable = normalizeRecordComparableValue(row[field], column);
  const nextComparable = normalizeRecordComparableValue(nextValue, column);

  if (previousComparable === nextComparable) {
    return;
  }

  control.disabled = true;
  try {
    const patch = { [field]: nextValue };
    if (field === "servicio_id" && !recordServiceMatchesContract(nextValue, row.contrato_id)) {
      throw new Error("El servicio seleccionado no pertenece al contrato de este registro.");
    }
    if (
      field === "contrato_id" &&
      row.servicio_id != null &&
      row.servicio_id !== "" &&
      !recordServiceMatchesContract(row.servicio_id, nextValue)
    ) {
      patch.servicio_id = null;
    }
    await saveRecordPatch(recordId, patch);
    control.classList.add("cell-save-ok");
    setStatus(
      field === "contrato_id" && Object.prototype.hasOwnProperty.call(patch, "servicio_id")
        ? "Registro actualizado. Servicio limpiado porque no pertenecía al contrato."
        : "Registro actualizado.",
      "success"
    );
  } catch (error) {
    control.classList.add("cell-save-error");
    if (column.type === "boolean") {
      control.checked = Boolean(row[field]);
    } else {
      control.value = formatRecordCellValue(row[field], column);
    }
    setStatus(`No se pudo actualizar el registro: ${error.message}`, "error");
  } finally {
    control.disabled = false;
    window.setTimeout(() => {
      control.classList.remove("cell-save-ok", "cell-save-error");
    }, 1200);
  }
}

const RECORD_RELATION_TABLES = {
  empresa_id: { table: "empresas", labelCol: "empresa" },
  contrato_id: { table: "contratos", labelCol: "contrato" },
  servicio_id: { table: "servicios", labelCol: "servicio" },
  personal_id: { table: "personal", labelCol: "personal" },
  titular_personal_id: { table: "personal", labelCol: "personal" },
  sustituto_personal_id: { table: "personal", labelCol: "personal" },
  instalacion_id: { table: "instalaciones", labelCol: "instalacion" },
  puesto_id: { table: "puestos", labelCol: "puesto" },
  funcion_id: { table: "funciones", labelCol: "funcion" },
  modalidad_id: { table: "modalidades", labelCol: "modalidad" },
  tipo_hora_id: { table: "tipo_horas", labelCol: "tipo_hora" },
  situacion_id: { table: "situaciones", labelCol: "situacion" },
};
let recordRelationOptionsCache = {};

async function loadRecordRelationOptions() {
  if (Object.keys(recordRelationOptionsCache).length) return;
  try {
    const supabase = await getSupabaseClient();
    const uniqueTables = {};
    for (const [key, { table, labelCol }] of Object.entries(RECORD_RELATION_TABLES)) {
      const tableKey = `${table}:${labelCol}`;
      if (!uniqueTables[tableKey]) {
        uniqueTables[tableKey] = { table, labelCol, keys: [] };
      }
      uniqueTables[tableKey].keys.push(key);
    }
    await Promise.all(
      Object.values(uniqueTables).map(async ({ table, labelCol, keys }) => {
        const { data } = await supabase
          .from(table)
          .select(table === "servicios" ? `id,${labelCol},contrato_id` : `id,${labelCol}`)
          .order(labelCol, { ascending: true })
          .limit(5000);
        if (!data) return;
        const options = data.map((r) => ({
          value: r.id,
          label: r[labelCol] ?? "",
          contrato_id: r.contrato_id,
        }));
        for (const key of keys) {
          recordRelationOptionsCache[key] = options;
        }
      })
    );
    // Contratos del filtro: activos + asignados + con registros en todo el listado.
    const { data: filterContratos } = await supabase.rpc("get_records_filter_contratos");
    recordsFilterContratos = (filterContratos ?? []).map((c) => ({
      value: c.id,
      label: c.contrato ?? String(c.id),
    }));
  } catch (_) {}
}

// Recarga las facetas (valores presentes por dimensión) solo si cambió el rango
// de fecha/actividad; los desplegables no forman parte de la clave.
async function loadRecordsFacets(filters) {
  const key = `${filters.fechaDesde}|${filters.fechaHasta}|${filters.actividadId}`;
  if (key === recordsFacetKey && recordsFacetRows.length) {
    return;
  }
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc("get_records_facets", {
      p_fecha_desde: filters.fechaDesde || null,
      p_fecha_hasta: filters.fechaHasta || null,
      p_actividad_id: filters.actividadId ? Number(filters.actividadId) : null,
    });
    recordsFacetRows = error ? [] : data ?? [];
    recordsFacetKey = key;
  } catch (_) {
    recordsFacetRows = [];
  }
}

function renderRecordRelationSelect(name, value, options, readonly) {
  const current = value ?? "";
  let html = `<option value="">— Ninguno —</option>`;
  html += (options || [])
    .map((o) => `<option value="${escapeHtml(o.value)}" ${String(o.value) === String(current) ? "selected" : ""}>${escapeHtml(o.label)}</option>`)
    .join("");
  return `<select name="${name}" ${readonly ? "disabled" : ""}>${html}</select>`;
}

function renderRecordDetailForm(row) {
  if (!recordDetailFields || !recordDetailTitle) {
    return;
  }

  recordDetailTitle.textContent = `Registro ${row.id}`;
  recordDetailFields.innerHTML = RECORD_COLUMNS.map((column) => {
    const value = row[column.key];
    const name = escapeHtml(column.key);
    const label = escapeHtml(column.label);

    if (column.type === "boolean") {
      return `<label class="checkbox-item"><input name="${name}" type="checkbox" ${
        value ? "checked" : ""
      } ${column.readonly ? "disabled" : ""} /><span>${label}</span></label>`;
    }

    if (column.type === "textarea") {
      return `<label class="full-width">${label}<textarea name="${name}" rows="3" ${
        column.readonly ? "readonly" : ""
      }>${escapeHtml(value ?? "")}</textarea></label>`;
    }

    if (RECORD_RELATION_TABLES[column.key]) {
      const options = recordRelationOptionsCache[column.key] || [];
      return `<label>${label}${renderRecordRelationSelect(name, value, options, column.readonly)}</label>`;
    }

    const inputType =
      column.type === "date"
        ? "date"
        : column.type === "time"
          ? "time"
          : column.type === "datetime"
            ? "datetime-local"
            : RECORD_NUMERIC_FIELDS.has(column.key)
              ? "number"
              : "text";
    const step = column.type === "decimal" ? ' step="0.01"' : "";
    const inputValue =
      column.type === "time"
        ? String(value ?? "").slice(0, 5)
        : column.type === "datetime" && value
          ? String(value).slice(0, 16)
          : value ?? "";

    return `<label>${label}<input name="${name}" type="${inputType}"${step} value="${escapeHtml(
      inputValue
    )}" ${column.readonly ? "readonly" : ""} /></label>`;
  }).join("");
}

async function openRecordDetail(recordId) {
  const row = recordsRows.find((item) => String(item.id) === String(recordId));
  if (!row || !recordDetailPanel) {
    return;
  }

  await loadRecordRelationOptions();
  selectedRecordId = String(recordId);
  recordDetailSnapshot = { ...row };
  renderRecordDetailForm(row);
  updateRecordSubstitutionButtons();
  recordDetailPanel.classList.remove("hidden");
  renderRecordsTable();
}

function hasRecordDetailUnsavedChanges() {
  const payload = collectRecordDetailPayload();
  return payload && Object.keys(payload).length > 0;
}

async function closeRecordDetail(skipSave = false) {
  if (!skipSave && hasRecordDetailUnsavedChanges() && recordDetailSnapshot?.id) {
    const payload = collectRecordDetailPayload();
    if (payload && Object.keys(payload).length) {
      try {
        await saveRecordPatch(recordDetailSnapshot.id, payload);
        setStatus("Registro guardado.", "success");
      } catch (error) {
        setStatus(`No se pudo guardar el registro: ${error.message}`, "error");
      }
    }
  }
  selectedRecordId = "";
  recordDetailSnapshot = null;
  recordDetailPanel?.classList.add("hidden");
  renderRecordsTable();
}

function cancelRecordDetailEdit() {
  if (recordDetailSnapshot) {
    renderRecordDetailForm(recordDetailSnapshot);
  }
}

async function deleteRecordById(recordId) {
  if (!recordId) return;
  if (!confirm(`¿Eliminar el registro ${recordId}?`)) return;

  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("registros").delete().eq("id", recordId);
    if (error) throw error;
    if (recordDetailSnapshot && String(recordDetailSnapshot.id) === String(recordId)) {
      closeRecordDetail(true);
    }
    await loadRecords();
    setStatus("Registro eliminado.", "success");
  } catch (error) {
    setStatus(`No se pudo eliminar el registro: ${error.message}`, "error");
  }
}

async function deleteRecordDetail() {
  if (!recordDetailSnapshot?.id) return;
  await deleteRecordById(recordDetailSnapshot.id);
}

async function duplicateRecordDetail() {
  if (!recordDetailSnapshot?.id) return;

  const excludeKeys = new Set(["id", "control"]);
  const derivedKeys = new Set(RECORD_DETAIL_LABEL_COLUMNS);
  const insertData = {};
  for (const column of RECORD_COLUMNS) {
    if (excludeKeys.has(column.key) || derivedKeys.has(column.key) || column.derived) continue;
    const field = recordDetailForm?.elements[column.key];
    if (field) {
      insertData[column.key] = column.type === "boolean"
        ? Boolean(field.checked)
        : parseRecordFieldValue(field.value ?? recordDetailSnapshot[column.key], column);
    } else if (recordDetailSnapshot[column.key] !== undefined) {
      insertData[column.key] = recordDetailSnapshot[column.key];
    }
  }

  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("registros").insert(insertData).select("id").single();
    if (error) throw error;
    await loadRecords();
    openRecordDetail(data.id);
    setStatus(`Registro duplicado. Nuevo ID: ${data.id}`, "success");
  } catch (error) {
    setStatus(`No se pudo duplicar el registro: ${error.message}`, "error");
  }
}

// --- Sustituciones ---
// Motivos de ausencia del titular y como se marcan en su fila.
// Regla de nomina acordada: VAC/IT/AP/PR/LG se pagan y facturan (sin tocar horas);
// PNR (permiso no retribuido) se marca como tipo de hora PNR y pone hd en negativo.
const RECORD_SUBSTITUTION_REASONS = [
  { value: "VAC", label: "Vacaciones (VAC)", situacionCode: "VAC" },
  { value: "IT", label: "Baja IT (IT)", situacionCode: "IT" },
  { value: "AP", label: "Asuntos propios (AP)", situacionCode: "AP" },
  { value: "PR", label: "Permiso retribuido (PR)", situacionCode: "PR" },
  { value: "LG", label: "Licencia (LG)", situacionCode: "LG" },
  { value: "PNR", label: "Permiso no retribuido (PNR)", tipoHoraCode: "PNR", hdNegative: true },
];

function findRecordRelationIdByLabel(field, label) {
  const options = recordRelationOptionsCache[field] || [];
  const target = String(label).trim().toLocaleUpperCase("es");
  const found = options.find(
    (option) => String(option.label).trim().toLocaleUpperCase("es") === target
  );
  return found ? found.value : null;
}

// Devuelve { titularId, subIds } si el registro forma parte de una sustitucion.
function resolveRecordSubstitutionGroup(row) {
  if (!row) return null;
  if (row.sustituye_registro_id) {
    const titularId = row.sustituye_registro_id;
    const subIds = recordsRows
      .filter((r) => String(r.sustituye_registro_id) === String(titularId))
      .map((r) => r.id);
    if (!subIds.includes(row.id)) subIds.push(row.id);
    return { titularId, subIds };
  }
  const subIds = recordsRows
    .filter((r) => String(r.sustituye_registro_id) === String(row.id))
    .map((r) => r.id);
  return subIds.length ? { titularId: row.id, subIds } : null;
}

function isRecordSubstituteRow(row) {
  return Boolean(row?.sustitucion) || row?.sustituye_registro_id != null;
}

function getRecordSubstitutionInfo(row) {
  if (isRecordSubstituteRow(row)) {
    const titularName = String(row?.titular_personal ?? "").trim();
    return {
      title: titularName ? `Sustituye a ${titularName}` : "Fila de sustitución",
      badgeText: "↻ Sustituto",
      badgeClass: "record-sub-badge-sustituto",
    };
  }
  if (row?.sustituto_personal_id) {
    const sustitutoName = String(row?.sustituto_personal ?? "").trim();
    return {
      title: sustitutoName ? `Sustituido por ${sustitutoName}` : "Titular sustituido",
      badgeText: "✦ Sustituido",
      badgeClass: "record-sub-badge-titular",
    };
  }
  return null;
}

function renderRecordSubstitutionBadge(row) {
  const info = getRecordSubstitutionInfo(row);
  if (!info) return "";
  return ` <span class="record-sub-badge ${info.badgeClass}" title="${escapeHtml(info.title)}">${escapeHtml(info.badgeText)}</span>`;
}

function openRecordSubstitutionPanel() {
  if (!recordDetailSnapshot?.id || !recordSubstitutionPanel) return;

  if (isRecordSubstituteRow(recordDetailSnapshot)) {
    setStatus("Este registro ya es una fila de sustituto. Usa 'Quitar sustitución' si quieres revertir.", "error");
    return;
  }
  if (recordDetailSnapshot.sustituto_personal_id) {
    setStatus("Este registro ya tiene una sustitución asignada.", "error");
    return;
  }

  if (recordSubstitutionReasonSelect) {
    recordSubstitutionReasonSelect.innerHTML = RECORD_SUBSTITUTION_REASONS.map(
      (reason) => `<option value="${reason.value}">${escapeHtml(reason.label)}</option>`
    ).join("");
  }
  setPersonalPickerOptions("substitution", recordRelationOptionsCache.personal_id || []);
  clearPersonalPicker("substitution");
  if (recordSubstitutionInfo) {
    const titularName = recordDetailSnapshot.personal || `ID ${recordDetailSnapshot.personal_id ?? "?"}`;
    const fecha = formatRecordDisplayValue(recordDetailSnapshot, getRecordColumn("fecha"));
    recordSubstitutionInfo.textContent = `Titular: ${titularName} · ${fecha} · ${String(recordDetailSnapshot.hora_inicio ?? "").slice(0, 5)}-${String(recordDetailSnapshot.hora_fin ?? "").slice(0, 5)}`;
  }
  recordSubstitutionPanel.classList.remove("hidden");
}

function closeRecordSubstitutionPanel() {
  recordSubstitutionPanel?.classList.add("hidden");
  clearPersonalPicker("substitution");
}

async function confirmRecordSubstitution() {
  const titular = recordDetailSnapshot;
  if (!titular?.id) return;

  const reasonValue = recordSubstitutionReasonSelect?.value || "";
  const reason = RECORD_SUBSTITUTION_REASONS.find((r) => r.value === reasonValue);
  const sustitutoId = Number(recordSubstitutionPersonSelect?.value || "");

  if (!reason) {
    setStatus("Selecciona un motivo de ausencia.", "error");
    return;
  }
  if (!sustitutoId) {
    setStatus("Selecciona la persona que sustituye.", "error");
    return;
  }
  if (sustitutoId === Number(titular.personal_id)) {
    setStatus("El sustituto no puede ser el propio titular.", "error");
    return;
  }

  // Fila del titular ausente. El sustituto se deduce del enlace de la fila nueva,
  // por eso no se guarda titular/sustituto: solo el motivo de ausencia.
  const titularPatch = {};
  if (reason.situacionCode) {
    const situacionId = findRecordRelationIdByLabel("situacion_id", reason.situacionCode);
    if (situacionId != null) titularPatch.situacion_id = situacionId;
  }
  if (reason.tipoHoraCode) {
    const tipoHoraId = findRecordRelationIdByLabel("tipo_hora_id", reason.tipoHoraCode);
    if (tipoHoraId != null) titularPatch.tipo_hora_id = tipoHoraId;
  }
  if (reason.hdNegative) {
    const horas = Number(titular.horas) || 0;
    titularPatch.hd = -Math.abs(horas);
  }

  // Fila del sustituto (copia del turno). titular/sustituto son derivados, no se copian.
  const excludeKeys = new Set(["id", "control"]);
  const derivedKeys = new Set(RECORD_DETAIL_LABEL_COLUMNS);
  const insertData = {};
  for (const column of RECORD_COLUMNS) {
    if (excludeKeys.has(column.key) || derivedKeys.has(column.key) || column.derived) continue;
    if (titular[column.key] !== undefined) insertData[column.key] = titular[column.key];
  }
  insertData.personal_id = sustitutoId;
  insertData.sustitucion = true;
  insertData.facturar = true;
  insertData.abonar = true;
  insertData.hd = 0;
  insertData.sustituye_registro_id = titular.id;
  const sustSituacionId = findRecordRelationIdByLabel("situacion_id", "SUST");
  if (sustSituacionId != null) insertData.situacion_id = sustSituacionId;
  // El sustituto trabaja horas normales: conserva el tipo de hora original del turno.
  insertData.tipo_hora_id = titular.tipo_hora_id ?? findRecordRelationIdByLabel("tipo_hora_id", "REG");

  try {
    const supabase = await getSupabaseClient();
    const { error: updateError } = await supabase
      .from("registros")
      .update(titularPatch)
      .eq("id", titular.id);
    if (updateError) throw updateError;

    const { data, error: insertError } = await supabase
      .from("registros")
      .insert(insertData)
      .select("id")
      .single();
    if (insertError) throw insertError;

    closeRecordSubstitutionPanel();
    await loadRecords();
    openRecordDetail(titular.id);
    setStatus(`Sustitución registrada (${reason.value}). Nueva fila del sustituto: ID ${data.id}.`, "success");
  } catch (error) {
    setStatus(`No se pudo registrar la sustitución: ${error.message}`, "error");
  }
}

async function removeRecordSubstitution() {
  const group = resolveRecordSubstitutionGroup(recordDetailSnapshot);
  if (!group) {
    setStatus("Este registro no forma parte de una sustitución.", "error");
    return;
  }
  if (!confirm("¿Quitar la sustitución? Se borrará la fila del sustituto y el titular volverá a estado normal.")) {
    return;
  }

  const normSituacionId = findRecordRelationIdByLabel("situacion_id", "NORM");
  const regTipoHoraId = findRecordRelationIdByLabel("tipo_hora_id", "REG");
  const titularRevert = { hd: 0 };
  if (normSituacionId != null) titularRevert.situacion_id = normSituacionId;
  if (regTipoHoraId != null) titularRevert.tipo_hora_id = regTipoHoraId;

  try {
    const supabase = await getSupabaseClient();
    if (group.subIds.length) {
      const { error: deleteError } = await supabase
        .from("registros")
        .delete()
        .in("id", group.subIds);
      if (deleteError) throw deleteError;
    }
    const { error: revertError } = await supabase
      .from("registros")
      .update(titularRevert)
      .eq("id", group.titularId);
    if (revertError) throw revertError;

    await loadRecords();
    if (recordsRows.some((r) => String(r.id) === String(group.titularId))) {
      openRecordDetail(group.titularId);
    } else {
      closeRecordDetail(true);
    }
    setStatus("Sustitución eliminada.", "success");
  } catch (error) {
    setStatus(`No se pudo quitar la sustitución: ${error.message}`, "error");
  }
}

function updateRecordSubstitutionButtons() {
  const row = recordDetailSnapshot;
  const group = resolveRecordSubstitutionGroup(row);
  const isPartOfSub = Boolean(group) || isRecordSubstituteRow(row) || Boolean(row?.sustituto_personal_id);

  if (recordDetailSubstitutionButton) {
    recordDetailSubstitutionButton.classList.toggle("hidden", isPartOfSub);
  }
  if (recordDetailRemoveSubstitutionButton) {
    recordDetailRemoveSubstitutionButton.classList.toggle("hidden", !isPartOfSub);
  }
}

// --- Combo de personal con autocompletado (resuelve a id) ---
// Reutilizable: un input de texto para buscar + un input oculto con el id seleccionado
// + una lista de sugerencias. Mismo look que el buscador de Control personal.
const personalPickers = new Map();

function setupPersonalPicker(key, { inputId, hiddenId, suggestionsId, onChange } = {}) {
  const inputEl = document.querySelector(`#${inputId}`);
  const suggestionsEl = document.querySelector(`#${suggestionsId}`);
  const hiddenEl = hiddenId ? document.querySelector(`#${hiddenId}`) : null;
  if (!inputEl || !suggestionsEl) return null;

  const state = { inputEl, suggestionsEl, hiddenEl, options: [], onChange };
  personalPickers.set(key, state);

  inputEl.addEventListener("input", () => {
    if (!inputEl.value.trim() && hiddenEl && hiddenEl.value) {
      hiddenEl.value = "";
      if (typeof onChange === "function") onChange("", "");
    }
    renderPersonalPickerSuggestions(state);
  });
  inputEl.addEventListener("focus", () => renderPersonalPickerSuggestions(state));
  inputEl.addEventListener("blur", () => {
    window.setTimeout(() => suggestionsEl.classList.add("hidden"), 200);
  });
  suggestionsEl.addEventListener("pointerdown", (event) => {
    const option = event.target.closest("[data-personal-option-value]");
    if (!option) return;
    event.preventDefault();
    const value = option.dataset.personalOptionValue;
    const label = option.dataset.personalOptionLabel;
    inputEl.value = label;
    if (hiddenEl) hiddenEl.value = value;
    suggestionsEl.classList.add("hidden");
    updateClearVisibility();
    if (typeof onChange === "function") onChange(value, label);
  });

  // Botones opcionales dentro del mismo .filter-field-stack: X para limpiar solo
  // este campo y una flecha para desplegar la lista sin escribir.
  const stackEl = inputEl.closest(".filter-field-stack");
  const clearButton = stackEl?.querySelector("[data-personal-clear]");
  const toggleButton = stackEl?.querySelector("[data-personal-toggle]");

  const updateClearVisibility = () => {
    if (!clearButton) return;
    const hasValue = Boolean(inputEl.value.trim() || (hiddenEl && hiddenEl.value));
    clearButton.classList.toggle("hidden", !hasValue);
  };
  state.updateClearVisibility = updateClearVisibility;

  inputEl.addEventListener("input", updateClearVisibility);

  if (clearButton) {
    clearButton.addEventListener("mousedown", (event) => {
      // mousedown + preventDefault evita que el blur del input oculte la lista
      // antes de procesar el click.
      event.preventDefault();
      inputEl.value = "";
      if (hiddenEl) hiddenEl.value = "";
      suggestionsEl.classList.add("hidden");
      updateClearVisibility();
      if (typeof onChange === "function") onChange("", "");
    });
  }

  if (toggleButton) {
    toggleButton.addEventListener("mousedown", (event) => {
      event.preventDefault();
      if (suggestionsEl.classList.contains("hidden")) {
        inputEl.focus();
        renderPersonalPickerSuggestions(state);
      } else {
        suggestionsEl.classList.add("hidden");
      }
    });
  }

  updateClearVisibility();
  return state;
}

function setPersonalPickerOptions(key, options) {
  const state = personalPickers.get(key);
  if (state) state.options = Array.isArray(options) ? options : [];
}

function setPersonalPickerSelection(key, value, label) {
  const state = personalPickers.get(key);
  if (!state) return;
  state.inputEl.value = label || "";
  if (state.hiddenEl) state.hiddenEl.value = value != null ? String(value) : "";
  state.updateClearVisibility?.();
}

function clearPersonalPicker(key) {
  setPersonalPickerSelection(key, "", "");
  personalPickers.get(key)?.suggestionsEl.classList.add("hidden");
}

function renderPersonalPickerSuggestions(state) {
  const query = normalizeSearchText(state.inputEl.value);
  let options = state.options;
  if (query) {
    options = options.filter((option) => normalizeSearchText(option.label).includes(query));
  }
  options = options.slice(0, 60);

  if (!options.length || (!query && state.inputEl !== document.activeElement)) {
    state.suggestionsEl.classList.add("hidden");
    state.suggestionsEl.innerHTML = "";
    return;
  }

  state.suggestionsEl.innerHTML = options
    .map(
      (option) => `
        <button
          type="button"
          class="filter-suggestion-option"
          data-personal-option-value="${escapeHtml(option.value)}"
          data-personal-option-label="${escapeHtml(option.label)}"
        >${escapeHtml(option.label)}</button>
      `
    )
    .join("");
  state.suggestionsEl.classList.remove("hidden");
}

function collectRecordDetailPayload() {
  if (!recordDetailForm || !recordDetailSnapshot) {
    return null;
  }

  const formData = new FormData(recordDetailForm);
  const payload = {};

  RECORD_COLUMNS.forEach((column) => {
    if (column.readonly) {
      return;
    }

    const field = recordDetailForm.elements[column.key];
    const rawValue = column.type === "boolean" ? Boolean(field?.checked) : formData.get(column.key);
    const nextValue = parseRecordFieldValue(rawValue, column);
    const previousComparable = normalizeRecordComparableValue(recordDetailSnapshot[column.key], column);
    const nextComparable = normalizeRecordComparableValue(nextValue, column);

    if (previousComparable !== nextComparable) {
      payload[column.key] = nextValue;
    }
  });

  return payload;
}

async function handleRecordDetailSubmit(event) {
  event.preventDefault();

  if (!recordDetailSnapshot?.id) {
    return;
  }

  const payload = collectRecordDetailPayload();
  if (!payload || !Object.keys(payload).length) {
    closeRecordDetail();
    return;
  }

  const submitButton = recordDetailForm?.querySelector('button[type="submit"]');
  try {
    if (submitButton) {
      submitButton.disabled = true;
    }
    await saveRecordPatch(recordDetailSnapshot.id, payload);
    const updatedRow = recordsRows.find((row) => String(row.id) === String(recordDetailSnapshot.id));
    recordDetailSnapshot = updatedRow ? { ...updatedRow } : null;
    if (updatedRow) {
      renderRecordDetailForm(updatedRow);
    }
    renderRecordsTable();
    setStatus("Registro guardado.", "success");
  } catch (error) {
    setStatus(`No se pudo guardar el registro: ${error.message}`, "error");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

async function showRecordsForActivity(activityId) {
  recordsExternalActivityFilter = String(activityId || "");
  const activityFilter = document.querySelector("#records-filter-actividad");
  if (activityFilter) {
    activityFilter.value = recordsExternalActivityFilter;
  }
  switchPrivateTab("registros");
  await loadRecords();
}

window.CoordinacionRegistros = {
  showForActivity(activityId) {
    void showRecordsForActivity(activityId);
  },
  refresh() {
    void loadRecords();
  },
};

// --- Gestión ---
// Pestaña transversal: cruza historiales laborales y registros dentro de un
// intervalo de fechas. Diseño compacto pensado para ir añadiendo más bloques.
const gestionFiltersForm = document.querySelector("#gestion-filters-form");
const gestionFilterDesde = document.querySelector("#gestion-filter-desde");
const gestionFilterHasta = document.querySelector("#gestion-filter-hasta");
const gestionFilterPersonalHidden = document.querySelector("#gestion-filter-personal");
const gestionRefreshButton = document.querySelector("#gestion-refresh-button");
const gestionClearFiltersButton = document.querySelector("#gestion-clear-filters-button");
const gestionSummary = document.querySelector("#gestion-summary");
const gestionHistorialCount = document.querySelector("#gestion-historial-count");
const gestionHistorialTableBody = document.querySelector("#gestion-historial-table-body");
const gestionTotalHoras = document.querySelector("#gestion-total-horas");
const gestionPivotHead = document.querySelector("#gestion-pivot-head");
const gestionPivotBody = document.querySelector("#gestion-pivot-body");
const gestionNominaBlock = document.querySelector("#gestion-nomina-block");
const gestionNominaHint = document.querySelector("#gestion-nomina-hint");
const gestionNominaList = document.querySelector("#gestion-nomina-list");

// Cache de desgloses de nomina ya calculados (historialId -> filas), para no
// recalcular al plegar/desplegar. Se vacia al cambiar de filtro.
const gestionNominaCache = new Map();

// Token para descartar respuestas obsoletas si el usuario cambia el filtro
// mientras hay una carga en vuelo.
let gestionRequestToken = 0;

function getGestionFilters() {
  return {
    desde: gestionFilterDesde?.value || "",
    hasta: gestionFilterHasta?.value || "",
    personalId: gestionFilterPersonalHidden?.value || "",
  };
}

function formatGestionHoras(value, blankZero = false) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "";
  }
  if (blankZero && number === 0) {
    return "";
  }
  return number.toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

function formatGestionDate(value) {
  if (!value) {
    return "";
  }
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value);
}

function renderGestionPersonalOptions(rows) {
  const map = new Map();
  for (const row of rows) {
    if (row.personal_id == null) {
      continue;
    }
    const key = String(row.personal_id);
    if (!map.has(key)) {
      map.set(key, row.personal || `ID ${row.personal_id}`);
    }
  }
  const options = Array.from(map, ([value, label]) => ({ value, label })).sort((left, right) =>
    left.label.localeCompare(right.label, "es", { sensitivity: "base" })
  );
  setPersonalPickerOptions("gestion-filter", options);

  const selected = gestionFilterPersonalHidden?.value || "";
  if (selected && !map.has(String(selected))) {
    clearPersonalPicker("gestion-filter");
  }
  return map.size;
}

function renderGestionHistorial(rows) {
  if (gestionHistorialCount) {
    gestionHistorialCount.textContent = `${rows.length} ${rows.length === 1 ? "periodo" : "periodos"}`;
  }
  if (!gestionHistorialTableBody) {
    return;
  }
  if (!rows.length) {
    gestionHistorialTableBody.innerHTML =
      '<tr><td colspan="5" class="empty-state">Sin historiales en el intervalo.</td></tr>';
    return;
  }

  gestionHistorialTableBody.innerHTML = rows
    .map((row) => {
      const jornada = row.jornada != null ? Number(row.jornada) : NaN;
      const maxima = row.jornada_maxima != null ? Number(row.jornada_maxima) : NaN;
      let jornadaLabel = "";
      if (Number.isFinite(jornada)) {
        jornadaLabel = formatGestionHoras(jornada);
        if (Number.isFinite(maxima) && maxima > 0) {
          jornadaLabel += ` / ${formatGestionHoras(maxima)}`;
        }
      }
      let coef = "";
      if (row.coeficiente_temporalidad_miles != null) {
        coef = String(row.coeficiente_temporalidad_miles);
      } else if (Number.isFinite(jornada) && Number.isFinite(maxima) && maxima > 0) {
        coef = String(Math.round((jornada / maxima) * 1000));
      }
      const personalLabel = row.personal || (row.personal_id != null ? `ID ${row.personal_id}` : "");
      return `<tr>
        <td>${escapeHtml(personalLabel)}</td>
        <td>${escapeHtml(formatGestionDate(row.fecha_alta))}</td>
        <td>${escapeHtml(formatGestionDate(row.fecha_baja) || "—")}</td>
        <td class="num">${escapeHtml(jornadaLabel)}</td>
        <td class="num">${escapeHtml(coef)}</td>
      </tr>`;
    })
    .join("");
}

function renderGestionRegistros(rows) {
  // Filas = puesto × situación; columnas = tipo de hora; celdas = suma de horas.
  const tipoCols = new Map();
  const rowMap = new Map();
  const colTotals = new Map();
  let grandTotal = 0;

  for (const record of rows) {
    const horas = Number(record.total_horas ?? record.horas);
    if (!Number.isFinite(horas)) {
      continue;
    }
    const tipoKey = record.tipo_hora_id != null ? String(record.tipo_hora_id) : "∅";
    if (!tipoCols.has(tipoKey)) {
      tipoCols.set(
        tipoKey,
        record.tipo_hora || (record.tipo_hora_id != null ? `ID ${record.tipo_hora_id}` : "Sin tipo")
      );
    }
    const puestoLabel =
      record.puesto || (record.puesto_id != null ? `ID ${record.puesto_id}` : "Sin puesto");
    const situacionLabel =
      record.situacion || (record.situacion_id != null ? `ID ${record.situacion_id}` : "Sin situación");
    const rowKey = `${record.puesto_id ?? "∅"}||${record.situacion_id ?? "∅"}`;
    let rowObj = rowMap.get(rowKey);
    if (!rowObj) {
      rowObj = { puesto: puestoLabel, situacion: situacionLabel, cells: new Map(), total: 0 };
      rowMap.set(rowKey, rowObj);
    }
    rowObj.cells.set(tipoKey, (rowObj.cells.get(tipoKey) || 0) + horas);
    rowObj.total += horas;
    colTotals.set(tipoKey, (colTotals.get(tipoKey) || 0) + horas);
    grandTotal += horas;
  }

  const columns = Array.from(tipoCols, ([key, label]) => ({ key, label })).sort((left, right) =>
    left.label.localeCompare(right.label, "es", { sensitivity: "base" })
  );
  const bodyRows = Array.from(rowMap.values()).sort(
    (left, right) =>
      left.puesto.localeCompare(right.puesto, "es", { sensitivity: "base" }) ||
      left.situacion.localeCompare(right.situacion, "es", { sensitivity: "base" })
  );

  if (gestionTotalHoras) {
    gestionTotalHoras.textContent = `Total: ${formatGestionHoras(grandTotal) || "0"} h`;
  }

  if (gestionPivotHead) {
    gestionPivotHead.innerHTML = `<tr><th>Puesto</th><th>Situación</th>${columns
      .map((column) => `<th class="num">${escapeHtml(column.label)}</th>`)
      .join("")}<th class="num">Total</th></tr>`;
  }

  if (!gestionPivotBody) {
    return;
  }
  if (!bodyRows.length) {
    gestionPivotBody.innerHTML = `<tr><td colspan="${
      columns.length + 3
    }" class="empty-state">Sin registros en el intervalo.</td></tr>`;
    return;
  }

  const body = bodyRows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.puesto)}</td>
        <td>${escapeHtml(row.situacion)}</td>
        ${columns
          .map((column) => `<td class="num">${escapeHtml(formatGestionHoras(row.cells.get(column.key) || 0, true))}</td>`)
          .join("")}
        <td class="num gestion-row-total">${escapeHtml(formatGestionHoras(row.total))}</td>
      </tr>`
    )
    .join("");
  const footer = `<tr class="gestion-total-row">
      <td>Total</td>
      <td></td>
      ${columns
        .map((column) => `<td class="num">${escapeHtml(formatGestionHoras(colTotals.get(column.key) || 0))}</td>`)
        .join("")}
      <td class="num">${escapeHtml(formatGestionHoras(grandTotal))}</td>
    </tr>`;
  gestionPivotBody.innerHTML = body + footer;
}

function renderGestionEmpty(message) {
  renderGestionPersonalOptions([]);
  renderGestionHistorial([]);
  renderGestionRegistros([]);
  renderGestionNomina([], "");
  if (gestionSummary) {
    gestionSummary.textContent = message;
  }
  if (gestionTotalHoras) {
    gestionTotalHoras.textContent = "Total: —";
  }
}

// El cálculo de nómina es por periodo de historial. Solo se muestra cuando hay
// una persona seleccionada (si no, serían decenas de periodos sin foco). Cada
// periodo se despliega bajo demanda y se calcula en el servidor con
// calcular_nomina(historial_id, desde, hasta), acotado al rango del filtro.
function renderGestionNomina(rows, personalId, desde, hasta) {
  gestionNominaCache.clear();
  if (!gestionNominaBlock) {
    return;
  }
  const applicable = personalId ? rows : [];
  gestionNominaBlock.classList.toggle("hidden", applicable.length === 0);
  if (!applicable.length) {
    if (gestionNominaList) {
      gestionNominaList.innerHTML = "";
    }
    return;
  }
  if (gestionNominaHint) {
    gestionNominaHint.textContent = `Rango ${formatGestionDate(desde)} – ${formatGestionDate(hasta)}`;
  }
  if (!gestionNominaList) {
    return;
  }
  gestionNominaList.innerHTML = applicable
    .map((row) => {
      const puesto = row.puesto || (row.puesto_id != null ? `Puesto ${row.puesto_id}` : "Sin puesto");
      const periodo = `${formatGestionDate(row.fecha_alta)} – ${formatGestionDate(row.fecha_baja) || "indefinido"}`;
      return `<div class="gestion-nomina-card" data-gestion-nomina-card="${escapeHtml(row.id)}">
        <button type="button" class="gestion-nomina-toggle" data-gestion-nomina-historial="${escapeHtml(row.id)}" aria-expanded="false">
          <span class="gestion-nomina-caret">▾</span>
          <span class="gestion-nomina-card-title">${escapeHtml(puesto)}</span>
          <span class="gestion-nomina-card-periodo">${escapeHtml(periodo)}</span>
        </button>
        <div class="gestion-nomina-detail hidden" data-gestion-nomina-detail="${escapeHtml(row.id)}"></div>
      </div>`;
    })
    .join("");

  // Tarjeta final: la nomina real de la persona. Suma los puestos y anade una
  // sola vez lo que es de la persona (desplazamiento por dia trabajado,
  // complementos, prorrateo) mas bases, deducciones y liquido.
  gestionNominaList.innerHTML += `
    <div class="gestion-nomina-card gestion-nomina-card-total" data-gestion-nomina-card="total">
      <button type="button" class="gestion-nomina-toggle" data-gestion-nomina-total="${escapeHtml(personalId)}" aria-expanded="false">
        <span class="gestion-nomina-caret">▾</span>
        <span class="gestion-nomina-card-title">Total de la persona (todos los puestos)</span>
        <span class="gestion-nomina-card-periodo">nómina completa</span>
      </button>
      <div class="gestion-nomina-detail hidden" data-gestion-nomina-detail="total"></div>
    </div>`;
}

function renderGestionNominaTable(rows) {
  if (!rows.length) {
    return '<p class="empty-state">Este periodo no genera devengos en el rango seleccionado.</p>';
  }
  const money = (value) =>
    value == null
      ? ""
      : `${Number(value).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

  // El servidor emite las líneas en varios bloques, así que se ordenan por
  // `orden` antes de agrupar: así cada hijo (21+) cae justo tras su padre (20).
  const ordered = [...rows].sort((left, right) => Number(left.orden) - Number(right.orden));

  // Las filas con detalle_de son el desglose de la línea anterior sin detalle_de
  // (p.ej. los componentes del prorrateo de pagas extra). Se anidan bajo ella.
  const groups = [];
  for (const row of ordered) {
    if (row.detalle_de) {
      groups[groups.length - 1]?.children.push(row);
    } else {
      groups.push({ row, children: [] });
    }
  }

  const body = groups
    .map((group, index) => {
      const seccion = String(group.row.seccion || "");
      const hasChildren = group.children.length > 0;
      const concepto = escapeHtml(group.row.concepto || "");
      const conceptoCell = hasChildren
        ? `<button type="button" class="gestion-nomina-group-toggle" data-nomina-group="${index}" aria-expanded="false">
             <span class="gestion-nomina-caret">▾</span>${concepto}
           </button>`
        : concepto;
      const parent = `<tr class="gestion-nomina-row gestion-nomina-${escapeHtml(seccion)}">
        <td>${conceptoCell}</td>
        <td class="gestion-nomina-detalle">${escapeHtml(group.row.detalle || "")}</td>
        <td class="num">${escapeHtml(money(group.row.importe))}</td>
      </tr>`;
      const children = group.children
        .map(
          (child) => `<tr class="gestion-nomina-row gestion-nomina-child hidden" data-nomina-child="${index}">
            <td>${escapeHtml(child.concepto || "")}</td>
            <td class="gestion-nomina-detalle">${escapeHtml(child.detalle || "")}</td>
            <td class="num">${escapeHtml(money(child.importe))}</td>
          </tr>`
        )
        .join("");
      return parent + children;
    })
    .join("");
  return `<table class="records-table gestion-compact-table gestion-nomina-table"><tbody>${body}</tbody></table>`;
}

async function toggleGestionNominaTotal(personalId) {
  const detail = gestionNominaList?.querySelector('[data-gestion-nomina-detail="total"]');
  const toggle = gestionNominaList?.querySelector("[data-gestion-nomina-total]");
  const card = gestionNominaList?.querySelector('[data-gestion-nomina-card="total"]');
  if (!detail) {
    return;
  }
  if (!detail.classList.contains("hidden")) {
    detail.classList.add("hidden");
    card?.classList.remove("expanded");
    toggle?.setAttribute("aria-expanded", "false");
    return;
  }
  detail.classList.remove("hidden");
  card?.classList.add("expanded");
  toggle?.setAttribute("aria-expanded", "true");

  if (gestionNominaCache.has("total")) {
    detail.innerHTML = renderGestionNominaTable(gestionNominaCache.get("total"));
    return;
  }
  detail.innerHTML = '<p class="muted-text">Calculando…</p>';
  const { desde, hasta } = getGestionFilters();
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc("calcular_nomina_persona", {
      p_personal_id: Number(personalId),
      p_desde: desde || null,
      p_hasta: hasta || null,
    });
    if (error) {
      throw error;
    }
    gestionNominaCache.set("total", data || []);
    detail.innerHTML = renderGestionNominaTable(data || []);
  } catch (error) {
    detail.innerHTML = `<p class="panel-status-message error">No se pudo calcular el total: ${escapeHtml(error.message)}</p>`;
  }
}

function toggleGestionNominaGroup(button) {
  const index = button.dataset.nominaGroup;
  const table = button.closest("table");
  if (!table) {
    return;
  }
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  button.classList.toggle("expanded", !expanded);
  table.querySelectorAll(`[data-nomina-child="${index}"]`).forEach((row) => {
    row.classList.toggle("hidden", expanded);
  });
}

async function toggleGestionNomina(historialId) {
  const key = String(historialId);
  const detail = gestionNominaList?.querySelector(`[data-gestion-nomina-detail="${key}"]`);
  const toggle = gestionNominaList?.querySelector(`[data-gestion-nomina-historial="${key}"]`);
  const card = gestionNominaList?.querySelector(`[data-gestion-nomina-card="${key}"]`);
  if (!detail) {
    return;
  }
  if (!detail.classList.contains("hidden")) {
    detail.classList.add("hidden");
    card?.classList.remove("expanded");
    toggle?.setAttribute("aria-expanded", "false");
    return;
  }
  detail.classList.remove("hidden");
  card?.classList.add("expanded");
  toggle?.setAttribute("aria-expanded", "true");

  if (gestionNominaCache.has(key)) {
    detail.innerHTML = renderGestionNominaTable(gestionNominaCache.get(key));
    return;
  }
  detail.innerHTML = '<p class="muted-text">Calculando…</p>';
  const { desde, hasta } = getGestionFilters();
  try {
    const supabase = await getSupabaseClient();
    // Por puesto solo se muestran los devengos propios de ese puesto; las
    // deducciones y lo que es de la persona van en la tarjeta del total.
    const { data, error } = await supabase.rpc("calcular_nomina_devengos", {
      p_historial_id: Number(historialId),
      p_desde: desde || null,
      p_hasta: hasta || null,
    });
    if (error) {
      throw error;
    }
    gestionNominaCache.set(key, data || []);
    detail.innerHTML = renderGestionNominaTable(data || []);
  } catch (error) {
    detail.innerHTML = `<p class="panel-status-message error">No se pudo calcular la nómina: ${escapeHtml(error.message)}</p>`;
  }
}

async function loadGestion() {
  const { desde, hasta, personalId } = getGestionFilters();
  if (!desde || !hasta) {
    renderGestionEmpty("Selecciona un intervalo de fechas (Desde y Hasta).");
    return;
  }
  if (desde > hasta) {
    renderGestionEmpty("La fecha «Desde» no puede ser posterior a «Hasta».");
    return;
  }

  const token = ++gestionRequestToken;
  if (gestionSummary) {
    gestionSummary.textContent = "Cargando…";
  }

  try {
    const supabase = await getSupabaseClient();
    // Los agregados se calculan en el servidor (funciones SET, sin limite de
    // filas) para dar totales exactos aunque el intervalo tenga decenas de miles
    // de registros. Respetan el RLS por contrato igual que la pestaña Registros.
    const personalPromise = supabase.rpc("get_gestion_personal", {
      p_desde: desde,
      p_hasta: hasta,
    });
    const resumenPromise = supabase.rpc("get_gestion_registros_resumen", {
      p_desde: desde,
      p_hasta: hasta,
      p_personal_id: personalId ? Number(personalId) : null,
    });

    let historialQuery = supabase
      .from(HISTORIAL_DETAIL_VIEW)
      .select(
        "id, personal_id, personal, puesto_id, puesto, fecha_alta, fecha_baja, jornada, jornada_maxima, coeficiente_temporalidad_miles"
      )
      .lte("fecha_alta", hasta)
      .or(`fecha_baja.is.null,fecha_baja.gte.${desde}`)
      .order("personal", { ascending: true })
      .order("fecha_alta", { ascending: true })
      .limit(HISTORIAL_FETCH_LIMIT);
    if (personalId) {
      historialQuery = historialQuery.eq("personal_id", personalId);
    }

    const [personalRes, resumenRes, historialRes] = await Promise.all([
      personalPromise,
      resumenPromise,
      historialQuery,
    ]);
    if (token !== gestionRequestToken) {
      return;
    }
    if (personalRes.error) {
      throw personalRes.error;
    }
    if (resumenRes.error) {
      throw resumenRes.error;
    }
    if (historialRes.error) {
      throw historialRes.error;
    }

    const personalCount = renderGestionPersonalOptions(personalRes.data ?? []);
    renderGestionHistorial(historialRes.data ?? []);
    renderGestionRegistros(resumenRes.data ?? []);
    renderGestionNomina(historialRes.data ?? [], personalId, desde, hasta);

    if (gestionSummary) {
      const scope = personalId ? "1 persona" : `${personalCount} personas`;
      gestionSummary.textContent = `${formatGestionDate(desde)} – ${formatGestionDate(hasta)} · ${scope}`;
    }
  } catch (error) {
    if (token !== gestionRequestToken) {
      return;
    }
    renderGestionEmpty("No se pudo cargar la gestión.");
    setStatus(`No se pudo cargar la gestión: ${error.message}`, "error");
  }
}

// --- Contabilidad (tabla cronos) ---
// 87k+ apuntes -> paginacion y agregados en servidor. Los desplegables de
// filtro y los totales se calculan con RPCs (get_cronos_filtros/resumen).
const contabilidadFiltersForm = document.querySelector("#contabilidad-filters-form");
const contabilidadFilterDesde = document.querySelector("#contabilidad-filter-desde");
const contabilidadFilterHasta = document.querySelector("#contabilidad-filter-hasta");
const contabilidadFilterCentro = document.querySelector("#contabilidad-filter-centro");
const contabilidadFilterTipoServicio = document.querySelector("#contabilidad-filter-tipo-servicio");
const contabilidadFilterFormaPago = document.querySelector("#contabilidad-filter-forma-pago");
const contabilidadFilterAnulado = document.querySelector("#contabilidad-filter-anulado");
const contabilidadFilterVinculacion = document.querySelector("#contabilidad-filter-vinculacion");
const contabilidadFilterServicio = document.querySelector("#contabilidad-filter-servicio");
const contabilidadFilterSearch = document.querySelector("#contabilidad-filter-search");
const contabilidadClearFiltersButton = document.querySelector("#contabilidad-clear-filters-button");
const contabilidadRefreshButton = document.querySelector("#contabilidad-refresh-button");
const contabilidadSummary = document.querySelector("#contabilidad-summary");
const contabilidadTableBody = document.querySelector("#contabilidad-table-body");
const contabilidadPageSizeSelect = document.querySelector("#contabilidad-page-size");
const contabilidadPrevButton = document.querySelector("#contabilidad-prev-page");
const contabilidadNextButton = document.querySelector("#contabilidad-next-page");
const contabilidadPageInfo = document.querySelector("#contabilidad-page-info");

const CONTABILIDAD_SELECT =
  "id, fecha, hora, centro, servicio, tipo_servicio, tarifa, cantidad, importe, " +
  "forma_pago, anulado, apellidos, nombre, documento";
const CONTABILIDAD_COLSPAN = 13;
let contabilidadPage = 1;
let contabilidadPageSize = 100;
let contabilidadTotalCount = 0;
let contabilidadCatalogFiltersLoaded = false;
let contabilidadRequestToken = 0;
let contabilidadSort = { field: "fecha", direction: "desc" };

function getContabilidadFilters() {
  const anuladoVal = contabilidadFilterAnulado?.value || "";
  return {
    desde: contabilidadFilterDesde?.value || "",
    hasta: contabilidadFilterHasta?.value || "",
    centro: contabilidadFilterCentro?.value || "",
    tipoServicio: contabilidadFilterTipoServicio?.value || "",
    formaPago: contabilidadFilterFormaPago?.value || "",
    anulado: anuladoVal === "" ? null : anuladoVal === "true",
    vinculacion: (() => {
      const value = contabilidadFilterVinculacion?.value || "";
      return value === "" ? null : value === "true";
    })(),
    servicio: contabilidadFilterServicio?.value.trim() || "",
    search: contabilidadFilterSearch?.value.trim() || "",
  };
}

function applyContabilidadQueryFilters(query, filters) {
  if (filters.desde) query = query.gte("fecha", filters.desde);
  if (filters.hasta) query = query.lte("fecha", filters.hasta);
  if (filters.centro) query = query.eq("centro", filters.centro);
  if (filters.tipoServicio) query = query.eq("tipo_servicio", filters.tipoServicio);
  if (filters.formaPago) query = query.eq("forma_pago", filters.formaPago);
  if (filters.anulado !== null) query = query.eq("anulado", filters.anulado);
  if (filters.vinculacion !== null) query = query.eq("vinculado", filters.vinculacion);
  if (filters.servicio) query = query.ilike("servicio", `%${filters.servicio}%`);
  if (filters.search) {
    // En un filtro .or() de PostgREST el comodin es '*'; saneamos separadores.
    const term = filters.search.replace(/[,()*]/g, " ").trim();
    if (term) {
      query = query.or(
        `apellidos.ilike.*${term}*,nombre.ilike.*${term}*,documento.ilike.*${term}*,numero_factura.ilike.*${term}*`
      );
    }
  }
  return query;
}

async function loadContabilidadFiltros(supabase, filters = getContabilidadFilters()) {
  const { data, error } = await supabase.rpc("get_cronos_filtros", {
    p_desde: filters.desde || null,
    p_hasta: filters.hasta || null,
    p_centro: filters.centro || null,
    p_tipo_servicio: filters.tipoServicio || null,
    p_forma_pago: filters.formaPago || null,
    p_anulado: filters.anulado,
    p_servicio: filters.servicio || null,
    p_search: filters.search || null,
    p_vinculado: filters.vinculacion,
  });
  if (error || !data) {
    return;
  }
  const fillSelect = (select, values, allLabel, formatValue = (value) => value, formatLabel = (value) => value) => {
    if (!select) return;
    const previous = select.value;
    select.innerHTML =
      `<option value="">${allLabel}</option>` +
      (values || [])
        .map((value) => {
          const optionValue = formatValue(value);
          return `<option value="${escapeHtml(optionValue)}">${escapeHtml(formatLabel(value))}</option>`;
        })
        .join("");
    select.value = Array.from(select.options).some((option) => option.value === previous) ? previous : "";
  };
  if (!contabilidadCatalogFiltersLoaded) {
    fillSelect(contabilidadFilterCentro, data.centros, "Todos");
    fillSelect(contabilidadFilterTipoServicio, data.tipos_servicio, "Todos");
    contabilidadCatalogFiltersLoaded = true;
  }
  fillSelect(contabilidadFilterFormaPago, data.formas_pago, "Todas");
  fillSelect(
    contabilidadFilterAnulado,
    data.anulados,
    "Todos",
    (value) => String(value),
    (value) => (value ? "Sí" : "No")
  );
}

function formatContabilidadImporte(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "";
  }
  return number.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderContabilidadRows(rows) {
  if (!contabilidadTableBody) {
    return;
  }
  if (!rows.length) {
    contabilidadTableBody.innerHTML = `<tr><td colspan="${CONTABILIDAD_COLSPAN}" class="empty-state">No hay apuntes con esos filtros.</td></tr>`;
    return;
  }
  contabilidadTableBody.innerHTML = rows
    .map(
      (row) => `<tr${row.anulado ? ' class="contabilidad-anulado"' : ""}>
        <td>${escapeHtml(formatGestionDate(row.fecha))}</td>
        <td>${escapeHtml((row.hora || "").slice(0, 5))}</td>
        <td>${escapeHtml(row.centro || "")}</td>
        <td>${escapeHtml(row.servicio || "")}</td>
        <td>${escapeHtml(row.tipo_servicio || "")}</td>
        <td>${escapeHtml(row.tarifa || "")}</td>
        <td class="num">${escapeHtml(row.cantidad != null ? String(row.cantidad) : "")}</td>
        <td class="num">${escapeHtml(formatContabilidadImporte(row.importe))}</td>
        <td>${escapeHtml(row.forma_pago || "")}</td>
        <td>${row.anulado ? "Sí" : "No"}</td>
        <td>${escapeHtml(row.apellidos || "")}</td>
        <td>${escapeHtml(row.nombre || "")}</td>
        <td>${escapeHtml(row.documento || "")}</td>
      </tr>`
    )
    .join("");
}

function syncContabilidadSortButtons() {
  syncSortButtonsBySelector("[data-contabilidad-sort-field]", "contabilidadSortField", contabilidadSort);
}

function updateContabilidadPagination() {
  const totalPages = Math.max(1, Math.ceil(contabilidadTotalCount / contabilidadPageSize));
  if (contabilidadPage > totalPages) {
    contabilidadPage = totalPages;
  }
  if (contabilidadPageInfo) {
    contabilidadPageInfo.textContent = `Página ${contabilidadPage} de ${totalPages} · ${contabilidadTotalCount.toLocaleString(
      "es-ES"
    )} apuntes`;
  }
  if (contabilidadPrevButton) contabilidadPrevButton.disabled = contabilidadPage <= 1;
  if (contabilidadNextButton) contabilidadNextButton.disabled = contabilidadPage >= totalPages;
}

async function loadContabilidad() {
  const token = ++contabilidadRequestToken;
  if (contabilidadSummary) {
    contabilidadSummary.textContent = "Cargando apuntes...";
  }
  if (contabilidadTableBody) {
    contabilidadTableBody.innerHTML = `<tr><td colspan="${CONTABILIDAD_COLSPAN}" class="empty-state">Cargando apuntes...</td></tr>`;
  }

  try {
    const supabase = await getSupabaseClient();
    const filters = getContabilidadFilters();
    await loadContabilidadFiltros(supabase, filters);
    const refreshedFilters = getContabilidadFilters();
    const from = (contabilidadPage - 1) * contabilidadPageSize;
    const to = from + contabilidadPageSize - 1;

    // Listado y resumen van por RPC SECURITY DEFINER para evitar timeouts de RLS
    // fila a fila sobre tablas grandes.
    const pagePromise = supabase.rpc("get_cronos_page", {
      p_desde: refreshedFilters.desde || null,
      p_hasta: refreshedFilters.hasta || null,
      p_centro: refreshedFilters.centro || null,
      p_tipo_servicio: refreshedFilters.tipoServicio || null,
      p_forma_pago: refreshedFilters.formaPago || null,
      p_anulado: refreshedFilters.anulado,
      p_servicio: refreshedFilters.servicio || null,
      p_search: refreshedFilters.search || null,
      p_vinculado: refreshedFilters.vinculacion,
      p_offset: from,
      p_limit: contabilidadPageSize,
      p_sort_field: contabilidadSort.field,
      p_sort_dir: contabilidadSort.direction,
    });

    const resumenPromise = supabase.rpc("get_cronos_resumen", {
      p_desde: refreshedFilters.desde || null,
      p_hasta: refreshedFilters.hasta || null,
      p_centro: refreshedFilters.centro || null,
      p_tipo_servicio: refreshedFilters.tipoServicio || null,
      p_forma_pago: refreshedFilters.formaPago || null,
      p_anulado: refreshedFilters.anulado,
      p_servicio: refreshedFilters.servicio || null,
      p_search: refreshedFilters.search || null,
      p_vinculado: refreshedFilters.vinculacion,
    });

    const [pageRes, resumenRes] = await Promise.all([pagePromise, resumenPromise]);
    if (token !== contabilidadRequestToken) {
      return;
    }
    if (pageRes.error) {
      throw pageRes.error;
    }

    const resumen = resumenRes.data?.[0];
    contabilidadTotalCount =
      resumen && !resumenRes.error ? Number(resumen.total_apuntes) : (pageRes.data?.length ?? 0);
    renderContabilidadRows(pageRes.data ?? []);
    syncContabilidadSortButtons();
    updateContabilidadPagination();

    if (contabilidadSummary) {
      if (resumen && !resumenRes.error) {
        contabilidadSummary.textContent =
          `${Number(resumen.total_apuntes).toLocaleString("es-ES")} apuntes · ` +
          `Importe ${formatContabilidadImporte(resumen.total_importe)} € ` +
          `(sin anular ${formatContabilidadImporte(resumen.total_importe_activo)} €)`;
      } else {
        contabilidadSummary.textContent = `${contabilidadTotalCount.toLocaleString("es-ES")} apuntes`;
      }
    }
  } catch (error) {
    if (token !== contabilidadRequestToken) {
      return;
    }
    if (contabilidadSummary) {
      contabilidadSummary.textContent = "No se pudieron cargar los apuntes.";
    }
    if (contabilidadTableBody) {
      contabilidadTableBody.innerHTML = `<tr><td colspan="${CONTABILIDAD_COLSPAN}" class="empty-state">Error cargando la contabilidad.</td></tr>`;
    }
    syncContabilidadSortButtons();
    setStatus(`No se pudo cargar la contabilidad: ${error.message}`, "error");
  }
}

function reloadContabilidadFromFilters() {
  contabilidadPage = 1;
  void loadContabilidad();
}

// --- Contabilidad: subpestañas (Apuntes / Banco) ---
const contabilidadViewApuntes = document.querySelector("#contabilidad-view-apuntes");
const contabilidadViewBanco = document.querySelector("#contabilidad-view-banco");
const contabilidadViewResultados = document.querySelector("#contabilidad-view-resultados");
const contabilidadViewConciliacion = document.querySelector("#contabilidad-view-conciliacion");
let currentContabilidadSubtab = "apuntes";
let bancoLoadedOnce = false;

function switchContabilidadSubtab(view) {
  currentContabilidadSubtab =
    view === "banco"
      ? "banco"
      : view === "resultados"
        ? "resultados"
        : view === "conciliacion"
          ? "conciliacion"
          : "apuntes";
  contabilidadViewApuntes?.classList.toggle("hidden", currentContabilidadSubtab !== "apuntes");
  contabilidadViewBanco?.classList.toggle("hidden", currentContabilidadSubtab !== "banco");
  contabilidadViewResultados?.classList.toggle("hidden", currentContabilidadSubtab !== "resultados");
  contabilidadViewConciliacion?.classList.toggle(
    "hidden",
    currentContabilidadSubtab !== "conciliacion"
  );
  document.querySelectorAll("[data-contabilidad-subtab]").forEach((button) => {
    const active = button.dataset.contabilidadSubtab === currentContabilidadSubtab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

async function loadContabilidadActive() {
  if (currentContabilidadSubtab === "banco") {
    await loadContabilidadBanco();
    return;
  }
  if (currentContabilidadSubtab === "resultados") {
    await loadResultados();
    return;
  }
  if (currentContabilidadSubtab === "conciliacion") {
    await loadConciliacion();
    return;
  }
  await loadContabilidad();
}

// --- Contabilidad: subpestaña Banco (tabla cronos_banco) ---
const bancoFiltersForm = document.querySelector("#banco-filters-form");
const bancoFilterDesde = document.querySelector("#banco-filter-desde");
const bancoFilterHasta = document.querySelector("#banco-filter-hasta");
const bancoFilterResultado = document.querySelector("#banco-filter-resultado");
const bancoFilterTipoPago = document.querySelector("#banco-filter-tipo-pago");
const bancoFilterSearch = document.querySelector("#banco-filter-search");
const bancoClearFiltersButton = document.querySelector("#banco-clear-filters-button");
const bancoRefreshButton = document.querySelector("#banco-refresh-button");
const bancoSummary = document.querySelector("#banco-summary");
const bancoTableBody = document.querySelector("#banco-table-body");
const bancoPageSizeSelect = document.querySelector("#banco-page-size");
const bancoPrevButton = document.querySelector("#banco-prev-page");
const bancoNextButton = document.querySelector("#banco-next-page");
const bancoPageInfo = document.querySelector("#banco-page-info");

const BANCO_SELECT =
  "id, fecha, hora, cod_pedido, resultado, importe_euros, moneda, tipo_pago, tarjeta";
const BANCO_COLSPAN = 8;
let bancoPage = 1;
let bancoPageSize = 100;
let bancoTotalCount = 0;
let bancoFiltrosLoaded = false;
let bancoRequestToken = 0;
let bancoSort = { field: "fecha", direction: "desc" };

function getBancoFilters() {
  return {
    desde: bancoFilterDesde?.value || "",
    hasta: bancoFilterHasta?.value || "",
    estado: bancoFilterResultado?.value || "",
    tipoPago: bancoFilterTipoPago?.value || "",
    terminal: null,
    search: bancoFilterSearch?.value.trim() || "",
  };
}

function applyBancoQueryFilters(query, filters) {
  if (filters.desde) query = query.gte("fecha", filters.desde);
  if (filters.hasta) query = query.lte("fecha", filters.hasta);
  if (filters.estado) query = query.ilike("resultado", `${filters.estado}%`);
  if (filters.tipoPago) query = query.eq("tipo_pago", filters.tipoPago);
  if (filters.terminal !== null) query = query.eq("terminal", filters.terminal);
  if (filters.search) {
    const term = filters.search.replace(/[,()*]/g, " ").trim();
    if (term) {
      const clauses = [`tarjeta.ilike.*${term}*`, `resultado.ilike.*${term}*`];
      if (/^[0-9]+$/.test(term)) {
        clauses.push(`cod_pedido.eq.${term}`);
      }
      query = query.or(clauses.join(","));
    }
  }
  return query;
}

async function loadBancoFiltros(supabase) {
  if (bancoFiltrosLoaded) {
    return;
  }
  const { data, error } = await supabase.rpc("get_cronos_banco_filtros");
  if (error || !data) {
    return;
  }
  const fillSelect = (select, values, allLabel) => {
    if (!select) return;
    const previous = select.value;
    select.innerHTML =
      `<option value="">${allLabel}</option>` +
      (values || [])
        .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
        .join("");
    select.value = previous;
  };
  // El filtro "Resultado" es estático (Autorizada/Denegada/Cancelada/Sin finalizar).
  fillSelect(bancoFilterTipoPago, data.tipos_pago, "Todos");
  bancoFiltrosLoaded = true;
}

function renderBancoRows(rows) {
  if (!bancoTableBody) {
    return;
  }
  if (!rows.length) {
    bancoTableBody.innerHTML = `<tr><td colspan="${BANCO_COLSPAN}" class="empty-state">No hay movimientos con esos filtros.</td></tr>`;
    return;
  }
  bancoTableBody.innerHTML = rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(formatGestionDate(row.fecha))}</td>
        <td>${escapeHtml((row.hora || "").slice(0, 5))}</td>
        <td>${escapeHtml(row.cod_pedido != null ? String(row.cod_pedido) : "")}</td>
        <td>${escapeHtml(row.resultado || "")}</td>
        <td class="num">${escapeHtml(formatContabilidadImporte(row.importe_euros))}</td>
        <td>${escapeHtml(row.moneda || "")}</td>
        <td>${escapeHtml(row.tipo_pago || "")}</td>
        <td>${escapeHtml(row.tarjeta || "")}</td>
      </tr>`
    )
    .join("");
}

function syncBancoSortButtons() {
  syncSortButtonsBySelector("[data-banco-sort-field]", "bancoSortField", bancoSort);
}

function updateBancoPagination() {
  const totalPages = Math.max(1, Math.ceil(bancoTotalCount / bancoPageSize));
  if (bancoPage > totalPages) {
    bancoPage = totalPages;
  }
  if (bancoPageInfo) {
    bancoPageInfo.textContent = `Página ${bancoPage} de ${totalPages} · ${bancoTotalCount.toLocaleString(
      "es-ES"
    )} movimientos`;
  }
  if (bancoPrevButton) bancoPrevButton.disabled = bancoPage <= 1;
  if (bancoNextButton) bancoNextButton.disabled = bancoPage >= totalPages;
}

async function loadContabilidadBanco() {
  bancoLoadedOnce = true;
  const token = ++bancoRequestToken;
  if (bancoSummary) {
    bancoSummary.textContent = "Cargando movimientos...";
  }
  if (bancoTableBody) {
    bancoTableBody.innerHTML = `<tr><td colspan="${BANCO_COLSPAN}" class="empty-state">Cargando movimientos...</td></tr>`;
  }

  try {
    const supabase = await getSupabaseClient();
    await loadBancoFiltros(supabase);
    const filters = getBancoFilters();
    const from = (bancoPage - 1) * bancoPageSize;
    const to = from + bancoPageSize - 1;

    // Listado y resumen van por RPC SECURITY DEFINER para evitar timeouts de RLS
    // fila a fila sobre tablas grandes.
    const pagePromise = supabase.rpc("get_cronos_banco_page", {
      p_desde: filters.desde || null,
      p_hasta: filters.hasta || null,
      p_estado: filters.estado || null,
      p_tipo_pago: filters.tipoPago || null,
      p_terminal: filters.terminal,
      p_search: filters.search || null,
      p_offset: from,
      p_limit: bancoPageSize,
      p_sort_field: bancoSort.field,
      p_sort_dir: bancoSort.direction,
    });

    const resumenPromise = supabase.rpc("get_cronos_banco_resumen", {
      p_desde: filters.desde || null,
      p_hasta: filters.hasta || null,
      p_estado: filters.estado || null,
      p_tipo_pago: filters.tipoPago || null,
      p_terminal: filters.terminal,
      p_search: filters.search || null,
    });

    const [pageRes, resumenRes] = await Promise.all([pagePromise, resumenPromise]);
    if (token !== bancoRequestToken) {
      return;
    }
    if (pageRes.error) {
      throw pageRes.error;
    }

    const resumen = resumenRes.data?.[0];
    bancoTotalCount =
      resumen && !resumenRes.error ? Number(resumen.total_operaciones) : (pageRes.data?.length ?? 0);
    renderBancoRows(pageRes.data ?? []);
    syncBancoSortButtons();
    updateBancoPagination();

    if (bancoSummary) {
      if (resumen && !resumenRes.error) {
        bancoSummary.textContent =
          `${Number(resumen.total_operaciones).toLocaleString("es-ES")} movimientos · ` +
          `Importe ${formatContabilidadImporte(resumen.total_importe)} €`;
      } else {
        bancoSummary.textContent = `${bancoTotalCount.toLocaleString("es-ES")} movimientos`;
      }
    }
  } catch (error) {
    if (token !== bancoRequestToken) {
      return;
    }
    if (bancoSummary) {
      bancoSummary.textContent = "No se pudieron cargar los movimientos.";
    }
    if (bancoTableBody) {
      bancoTableBody.innerHTML = `<tr><td colspan="${BANCO_COLSPAN}" class="empty-state">Error cargando el banco.</td></tr>`;
    }
    syncBancoSortButtons();
    setStatus(`No se pudo cargar el banco: ${error.message}`, "error");
  }
}

function reloadBancoFromFilters() {
  bancoPage = 1;
  void loadContabilidadBanco();
}

// --- Contabilidad: Resultados (cronos_banco.cod_pedido vs cronos.identificador) ---
const resultadosFiltersForm = document.querySelector("#resultados-filters-form");
const resultadosFilterDesde = document.querySelector("#resultados-filter-desde");
const resultadosFilterHasta = document.querySelector("#resultados-filter-hasta");
const resultadosFilterResultado = document.querySelector("#resultados-filter-resultado");
const resultadosFilterAnulado = document.querySelector("#resultados-filter-anulado");
const resultadosFilterSearch = document.querySelector("#resultados-filter-search");
const resultadosClearFiltersButton = document.querySelector("#resultados-clear-filters-button");
const resultadosRefreshButton = document.querySelector("#resultados-refresh-button");
const resultadosExportExcelButton = document.querySelector("#resultados-export-excel-button");
const resultadosExportPdfButton = document.querySelector("#resultados-export-pdf-button");
const resultadosSummary = document.querySelector("#resultados-summary");
const resultadosTable = document.querySelector("#resultados-table");
const resultadosTableHead = document.querySelector("#resultados-table-head");
const resultadosTableBody = document.querySelector("#resultados-table-body");
const resultadosPageSizeSelect = document.querySelector("#resultados-page-size");
const resultadosPrevButton = document.querySelector("#resultados-prev-page");
const resultadosNextButton = document.querySelector("#resultados-next-page");
const resultadosPageInfo = document.querySelector("#resultados-page-info");
const RESULTADOS_DETAIL_COLSPAN = 10;
const RESULTADOS_RESUMEN_COLSPAN = 5;
let resultadosPage = 1;
let resultadosPageSize = 100;
let resultadosTotalCount = 0;
let resultadosRequestToken = 0;
let currentResultadosView = "detalle";
let resultadosCurrentRows = [];
let resultadosSortByView = {
  detalle: { field: "fecha", direction: "desc" },
  resumen: { field: "mes", direction: "asc" },
};

function getResultadosSort() {
  return resultadosSortByView[currentResultadosView] || resultadosSortByView.detalle;
}

function syncResultadosSortButtons() {
  syncSortButtonsBySelector("[data-resultados-sort-field]", "resultadosSortField", getResultadosSort());
}

function getResultadosFilters() {
  const anuladoVal = resultadosFilterAnulado?.value || "";
  return {
    desde: resultadosFilterDesde?.value || "",
    hasta: resultadosFilterHasta?.value || "",
    resultado: resultadosFilterResultado?.value || "",
    anulado: anuladoVal === "" ? null : anuladoVal === "true",
    search: resultadosFilterSearch?.value.trim() || "",
  };
}

function getResultadosColspan() {
  return currentResultadosView === "detalle" ? RESULTADOS_DETAIL_COLSPAN : RESULTADOS_RESUMEN_COLSPAN;
}

function syncResultadosExportButtons() {
  const show = currentResultadosView === "resumen";
  resultadosExportExcelButton?.classList.toggle("hidden", !show);
  resultadosExportPdfButton?.classList.toggle("hidden", !show);
}

function renderResultadosHead() {
  syncResultadosExportButtons();
  resultadosTable?.classList.toggle("resultados-resumen-table", currentResultadosView === "resumen");
  if (!resultadosTableHead) {
    return;
  }
  if (currentResultadosView === "detalle") {
    resultadosTableHead.innerHTML = `<tr>
      <th><button type="button" class="sort-button" data-resultados-sort-field="banco_id">Banco Id</button></th>
      <th><button type="button" class="sort-button" data-resultados-sort-field="fecha">Fecha</button></th>
      <th><button type="button" class="sort-button" data-resultados-sort-field="hora">Hora</button></th>
      <th><button type="button" class="sort-button" data-resultados-sort-field="tipo_operacion">Tipo operación</button></th>
      <th><button type="button" class="sort-button" data-resultados-sort-field="cod_pedido">Cód pedido</button></th>
      <th><button type="button" class="sort-button" data-resultados-sort-field="banco_importe">Banco importe</button></th>
      <th><button type="button" class="sort-button" data-resultados-sort-field="importe_euros">Importe euros</button></th>
      <th><button type="button" class="sort-button" data-resultados-sort-field="tarifa">Tarifa</button></th>
      <th><button type="button" class="sort-button" data-resultados-sort-field="cantidad">Cantidad</button></th>
      <th><button type="button" class="sort-button" data-resultados-sort-field="cronos_importe">Cronos importe</button></th>
    </tr>`;
    syncResultadosSortButtons();
    return;
  }
  resultadosTableHead.innerHTML = `<tr>
    <th><button type="button" class="sort-button" data-resultados-sort-field="fecha_por_mes">Fecha por mes</button></th>
    <th><button type="button" class="sort-button" data-resultados-sort-field="tarifa">Tarifa</button></th>
    <th><button type="button" class="sort-button" data-resultados-sort-field="unidades">Unidades</button></th>
    <th><button type="button" class="sort-button" data-resultados-sort-field="importe">Importe</button></th>
    <th><button type="button" class="sort-button" data-resultados-sort-field="mes">Mes</button></th>
  </tr>`;
  syncResultadosSortButtons();
}

function renderResultadosRows(rows) {
  if (!resultadosTableBody) {
    return;
  }
  renderResultadosHead();
  if (!rows.length) {
    resultadosTableBody.innerHTML = `<tr><td colspan="${getResultadosColspan()}" class="empty-state">No hay resultados con esos filtros.</td></tr>`;
    return;
  }
  if (currentResultadosView === "detalle") {
    resultadosTableBody.innerHTML = rows
      .map(
        (row) => `<tr>
          <td>${escapeHtml(row.banco_id != null ? String(row.banco_id) : "")}</td>
          <td>${escapeHtml(formatGestionDate(row.fecha))}</td>
          <td>${escapeHtml((row.hora || "").slice(0, 5))}</td>
          <td>${escapeHtml(row.tipo_operacion || "")}</td>
          <td>${escapeHtml(row.cod_pedido != null ? String(row.cod_pedido) : "")}</td>
          <td class="num">${escapeHtml(formatContabilidadImporte(row.banco_importe))}</td>
          <td class="num">${escapeHtml(formatContabilidadImporte(row.importe_euros))}</td>
          <td>${escapeHtml(row.tarifa || "")}</td>
          <td class="num">${escapeHtml(row.cantidad != null ? String(row.cantidad) : "")}</td>
          <td class="num">${escapeHtml(formatContabilidadImporte(row.cronos_importe))}</td>
        </tr>`
      )
      .join("");
    return;
  }
  resultadosTableBody.innerHTML = rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.fecha_por_mes || "")}</td>
        <td>${escapeHtml(row.tarifa || "")}</td>
        <td class="num">${escapeHtml(row.unidades != null ? String(row.unidades) : "")}</td>
        <td class="num">${escapeHtml(formatContabilidadImporte(row.importe))}</td>
        <td class="num">${escapeHtml(row.mes != null ? String(row.mes) : "")}</td>
      </tr>`
    )
    .join("");
}

async function fetchResultadosResumenRows(limit = 5000) {
  const filters = getResultadosFilters();
  if (!filters.desde || !filters.hasta) {
    throw new Error("Selecciona un intervalo de fechas (Desde y Hasta).");
  }
  if (filters.desde > filters.hasta) {
    throw new Error("La fecha «Desde» no puede ser posterior a «Hasta».");
  }
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.rpc("get_cronos_resultados", {
    p_desde: filters.desde || null,
    p_hasta: filters.hasta || null,
    p_resultado: filters.resultado || null,
    p_anulado: filters.anulado,
    p_search: filters.search || null,
    p_vista: "resumen",
    p_offset: 0,
    p_limit: limit,
    p_sort_field: resultadosSortByView.resumen.field,
    p_sort_dir: resultadosSortByView.resumen.direction,
  });
  if (error) {
    throw error;
  }
  return data?.rows ?? [];
}

function getResultadosResumenExportRows(rows) {
  return rows.map((row) => ({
    "Fecha por mes": row.fecha_por_mes || "",
    Tarifa: row.tarifa || "",
    Unidades: Number(row.unidades || 0),
    Importe: Number(row.importe || 0),
    Mes: Number(row.mes || 0),
  }));
}

function buildResultadosResumenStats(rows) {
  const byMonth = new Map();
  const byTarifa = new Map();
  let totalImporte = 0;
  let totalUnidades = 0;

  for (const row of rows) {
    const importe = Number(row.importe || 0);
    const unidades = Number(row.unidades || 0);
    const monthKey = `${String(row.mes || "").padStart(2, "0")} ${row.fecha_por_mes || ""}`.trim();
    const tarifaKey = row.tarifa || "Sin tarifa";
    totalImporte += importe;
    totalUnidades += unidades;

    const month = byMonth.get(monthKey) || {
      label: row.fecha_por_mes || "",
      mes: Number(row.mes || 0),
      importe: 0,
      unidades: 0,
    };
    month.importe += importe;
    month.unidades += unidades;
    byMonth.set(monthKey, month);

    const tarifa = byTarifa.get(tarifaKey) || { tarifa: tarifaKey, importe: 0, unidades: 0 };
    tarifa.importe += importe;
    tarifa.unidades += unidades;
    byTarifa.set(tarifaKey, tarifa);
  }

  return {
    totalImporte,
    totalUnidades,
    byMonth: Array.from(byMonth.values()).sort((left, right) => left.mes - right.mes),
    byTarifa: Array.from(byTarifa.values()).sort((left, right) => right.importe - left.importe),
  };
}

function ensurePdfSpace(doc, y, needed, margin) {
  if (y + needed <= 790) {
    return y;
  }
  doc.addPage();
  return margin;
}

function drawResultadosMonthlyChart(doc, months, x, y, width, height) {
  const maxImporte = Math.max(...months.map((month) => month.importe), 1);
  const barGap = 6;
  const barWidth = Math.max(12, (width - barGap * Math.max(0, months.length - 1)) / Math.max(months.length, 1));
  doc.setDrawColor(180);
  doc.line(x, y + height, x + width, y + height);
  doc.setFillColor(44, 123, 229);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  months.forEach((month, index) => {
    const barHeight = (month.importe / maxImporte) * (height - 18);
    const bx = x + index * (barWidth + barGap);
    const by = y + height - barHeight;
    doc.rect(bx, by, barWidth, barHeight, "F");
    doc.text(String(month.mes || ""), bx + barWidth / 2, y + height + 10, { align: "center" });
  });

  doc.setFontSize(8);
  doc.text(`Máximo: ${formatContabilidadImporte(maxImporte)} €`, x, y - 4);
}

async function exportResultadosResumenExcel() {
  try {
    const rows = await fetchResultadosResumenRows();
    if (!rows.length) {
      setStatus("No hay resumen para exportar.", "error");
      return;
    }
    const xlsxModule = await getXlsxClient();
    const XLSX = xlsxModule.default || xlsxModule;
    const worksheet = XLSX.utils.json_to_sheet(getResultadosResumenExportRows(rows));
    worksheet["!cols"] = [{ wch: 16 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 6 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resumen");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const suffix = `${getResultadosFilters().desde}_${getResultadosFilters().hasta}`;
    triggerDownload(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `resultados-resumen-${suffix}.xlsx`
    );
    setStatus("Resumen exportado a Excel.", "success");
  } catch (error) {
    setStatus(`No se pudo exportar el resumen a Excel: ${error.message}`, "error");
  }
}

async function exportResultadosResumenPdf() {
  try {
    const rows = await fetchResultadosResumenRows();
    if (!rows.length) {
      setStatus("No hay resumen para exportar.", "error");
      return;
    }
    const { jsPDF } = await getJsPdfClient();
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const margin = 36;
    const lineHeight = 16;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = margin;
    const filters = getResultadosFilters();
    const stats = buildResultadosResumenStats(rows);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resultados - Resumen", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${formatGestionDate(filters.desde)} - ${formatGestionDate(filters.hasta)}`, margin, y);
    y += lineHeight + 8;

    doc.setFont("helvetica", "bold");
    doc.text("Resumen final", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    doc.text(`Ingresos totales del periodo: ${formatContabilidadImporte(stats.totalImporte)} €`, margin, y);
    y += lineHeight;
    doc.text(`Unidades totales: ${stats.totalUnidades.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`, margin, y);
    y += lineHeight + 8;

    y = ensurePdfSpace(doc, y, 130, margin);
    doc.setFont("helvetica", "bold");
    doc.text("Evolución mensual de ingresos", margin, y);
    y += lineHeight;
    drawResultadosMonthlyChart(doc, stats.byMonth, margin, y + 6, pageWidth - margin * 2, 105);
    y += 132;

    const colX = [margin, margin + 105, margin + 310, margin + 390, margin + 475];
    y = ensurePdfSpace(doc, y, 80, margin);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle por mes y tarifa", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "bold");
    ["Fecha por mes", "Tarifa", "Unidades", "Importe", "Mes"].forEach((label, index) => {
      doc.text(label, colX[index], y);
    });
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    for (const row of rows) {
      if (y > 760) {
        doc.addPage();
        y = margin;
      }
      doc.text(String(row.fecha_por_mes || ""), colX[0], y);
      doc.text(String(row.tarifa || "").slice(0, 34), colX[1], y);
      doc.text(String(row.unidades || 0), colX[2], y, { align: "right" });
      doc.text(formatContabilidadImporte(row.importe), colX[3], y, { align: "right" });
      doc.text(String(row.mes || ""), colX[4], y, { align: "right" });
      y += lineHeight;
    }

    y = ensurePdfSpace(doc, y, 90, margin);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Ingresos por mes", margin, y);
    y += lineHeight;
    doc.text("Mes", margin, y);
    doc.text("Unidades", margin + 250, y, { align: "right" });
    doc.text("Importe", margin + 390, y, { align: "right" });
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    for (const month of stats.byMonth) {
      y = ensurePdfSpace(doc, y, lineHeight, margin);
      doc.text(month.label || "", margin, y);
      doc.text(month.unidades.toLocaleString("es-ES", { maximumFractionDigits: 2 }), margin + 250, y, {
        align: "right",
      });
      doc.text(formatContabilidadImporte(month.importe), margin + 390, y, { align: "right" });
      y += lineHeight;
    }

    y = ensurePdfSpace(doc, y, 90, margin);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Ingresos por tarifa", margin, y);
    y += lineHeight;
    doc.text("Tarifa", margin, y);
    doc.text("Unidades", margin + 330, y, { align: "right" });
    doc.text("Importe", margin + 475, y, { align: "right" });
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    for (const tarifa of stats.byTarifa) {
      y = ensurePdfSpace(doc, y, lineHeight, margin);
      doc.text(String(tarifa.tarifa || "").slice(0, 48), margin, y);
      doc.text(tarifa.unidades.toLocaleString("es-ES", { maximumFractionDigits: 2 }), margin + 330, y, {
        align: "right",
      });
      doc.text(formatContabilidadImporte(tarifa.importe), margin + 475, y, { align: "right" });
      y += lineHeight;
    }

    doc.save(`resultados-resumen-${filters.desde}_${filters.hasta}.pdf`);
    setStatus("Resumen exportado a PDF.", "success");
  } catch (error) {
    setStatus(`No se pudo exportar el resumen a PDF: ${error.message}`, "error");
  }
}

function updateResultadosPagination() {
  const totalPages = Math.max(1, Math.ceil(resultadosTotalCount / resultadosPageSize));
  if (resultadosPage > totalPages) {
    resultadosPage = totalPages;
  }
  if (resultadosPageInfo) {
    resultadosPageInfo.textContent = `Página ${resultadosPage} de ${totalPages} · ${resultadosTotalCount.toLocaleString(
      "es-ES"
    )} resultados`;
  }
  if (resultadosPrevButton) resultadosPrevButton.disabled = resultadosPage <= 1;
  if (resultadosNextButton) resultadosNextButton.disabled = resultadosPage >= totalPages;
}

function renderResultadosEmpty(message) {
  resultadosTotalCount = 0;
  resultadosCurrentRows = [];
  if (resultadosSummary) {
    resultadosSummary.textContent = message;
  }
  renderResultadosRows([]);
  updateResultadosPagination();
}

async function loadResultados() {
  const filters = getResultadosFilters();
  if (!filters.desde || !filters.hasta) {
    renderResultadosEmpty("Selecciona un intervalo de fechas (Desde y Hasta).");
    return;
  }
  if (filters.desde && filters.hasta && filters.desde > filters.hasta) {
    renderResultadosEmpty("La fecha «Desde» no puede ser posterior a «Hasta».");
    return;
  }

  const token = ++resultadosRequestToken;
  if (resultadosSummary) {
    resultadosSummary.textContent = "Cargando resultados...";
  }
  if (resultadosTableBody) {
    renderResultadosHead();
    resultadosTableBody.innerHTML = `<tr><td colspan="${getResultadosColspan()}" class="empty-state">Cargando resultados...</td></tr>`;
  }

  try {
    const supabase = await getSupabaseClient();
    const from = (resultadosPage - 1) * resultadosPageSize;
    const sort = getResultadosSort();
    const { data, error } = await supabase.rpc("get_cronos_resultados", {
      p_desde: filters.desde || null,
      p_hasta: filters.hasta || null,
      p_resultado: filters.resultado || null,
      p_anulado: filters.anulado,
      p_search: filters.search || null,
      p_vista: currentResultadosView,
      p_offset: from,
      p_limit: resultadosPageSize,
      p_sort_field: sort.field,
      p_sort_dir: sort.direction,
    });
    if (token !== resultadosRequestToken) {
      return;
    }
    if (error) {
      throw error;
    }

    const rows = data?.rows ?? [];
    resultadosCurrentRows = rows;
    resultadosTotalCount = Number(data?.total || 0);
    renderResultadosRows(rows);
    updateResultadosPagination();
    if (resultadosSummary) {
      resultadosSummary.textContent =
        `${resultadosTotalCount.toLocaleString("es-ES")} resultados · ` +
        `Banco ${formatContabilidadImporte(data?.total_banco_importe)} € · ` +
        `Cronos ${formatContabilidadImporte(data?.total_cronos_importe)} €`;
    }
  } catch (error) {
    if (token !== resultadosRequestToken) {
      return;
    }
    renderResultadosEmpty("No se pudieron cargar los resultados.");
    setStatus(`No se pudieron cargar los resultados: ${error.message}`, "error");
  }
}

function reloadResultadosFromFilters() {
  resultadosPage = 1;
  void loadResultados();
}

// --- Contabilidad: Conciliacion (cronos.identificador vs cronos_banco.cod_pedido) ---
const conciliacionFiltersForm = document.querySelector("#conciliacion-filters-form");
const conciliacionFilterDesde = document.querySelector("#conciliacion-filter-desde");
const conciliacionFilterHasta = document.querySelector("#conciliacion-filter-hasta");
const conciliacionClearFiltersButton = document.querySelector("#conciliacion-clear-filters-button");
const conciliacionRefreshButton = document.querySelector("#conciliacion-refresh-button");
const conciliacionSummary = document.querySelector("#conciliacion-summary");
const conciliacionCronosCount = document.querySelector("#conciliacion-cronos-count");
const conciliacionBancoCount = document.querySelector("#conciliacion-banco-count");
const conciliacionCronosTableBody = document.querySelector("#conciliacion-cronos-table-body");
const conciliacionBancoTableBody = document.querySelector("#conciliacion-banco-table-body");
const CONCILIACION_CRONOS_COLSPAN = 12;
const CONCILIACION_BANCO_COLSPAN = 10;
const CONCILIACION_LIMIT = 500;
let conciliacionRequestToken = 0;
let conciliacionCronosSort = { field: "fecha", direction: "desc" };
let conciliacionBancoSort = { field: "fecha", direction: "desc" };

function syncConciliacionSortButtons() {
  syncSortButtonsBySelector(
    "[data-conciliacion-cronos-sort-field]",
    "conciliacionCronosSortField",
    conciliacionCronosSort
  );
  syncSortButtonsBySelector(
    "[data-conciliacion-banco-sort-field]",
    "conciliacionBancoSortField",
    conciliacionBancoSort
  );
}

function getConciliacionFilters() {
  return {
    desde: conciliacionFilterDesde?.value || "",
    hasta: conciliacionFilterHasta?.value || "",
  };
}

function renderConciliacionCronosRows(rows) {
  if (!conciliacionCronosTableBody) {
    return;
  }
  if (!rows.length) {
    conciliacionCronosTableBody.innerHTML = `<tr><td colspan="${CONCILIACION_CRONOS_COLSPAN}" class="empty-state">No hay apuntes viudos en el intervalo.</td></tr>`;
    return;
  }
  conciliacionCronosTableBody.innerHTML = rows
    .map(
      (row) => `<tr${row.anulado ? ' class="contabilidad-anulado"' : ""}>
        <td>${escapeHtml(formatGestionDate(row.fecha))}</td>
        <td>${escapeHtml((row.hora || "").slice(0, 5))}</td>
        <td>${escapeHtml(row.identificador || "")}</td>
        <td class="num">${escapeHtml(formatContabilidadImporte(row.importe))}</td>
        <td>${escapeHtml(row.forma_pago || "")}</td>
        <td>${escapeHtml(row.numero_factura || "")}</td>
        <td>${row.anulado ? "Sí" : "No"}</td>
        <td>${escapeHtml(row.apellidos || "")}</td>
        <td>${escapeHtml(row.nombre || "")}</td>
        <td>${escapeHtml(row.documento || "")}</td>
        <td>${escapeHtml(row.servicio || "")}</td>
        <td>${escapeHtml(row.centro || "")}</td>
      </tr>`
    )
    .join("");
}

function renderConciliacionBancoRows(rows) {
  if (!conciliacionBancoTableBody) {
    return;
  }
  if (!rows.length) {
    conciliacionBancoTableBody.innerHTML = `<tr><td colspan="${CONCILIACION_BANCO_COLSPAN}" class="empty-state">No hay movimientos viudos en el intervalo.</td></tr>`;
    return;
  }
  conciliacionBancoTableBody.innerHTML = rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(formatGestionDate(row.fecha))}</td>
        <td>${escapeHtml((row.hora || "").slice(0, 5))}</td>
        <td>${escapeHtml(row.cod_pedido != null ? String(row.cod_pedido) : "")}</td>
        <td>${escapeHtml(row.terminal != null ? String(row.terminal) : "")}</td>
        <td>${escapeHtml(row.tipo_operacion || "")}</td>
        <td>${escapeHtml(row.resultado || "")}</td>
        <td class="num">${escapeHtml(formatContabilidadImporte(row.importe_euros))}</td>
        <td>${escapeHtml(row.moneda || "")}</td>
        <td>${escapeHtml(row.tipo_pago || "")}</td>
        <td>${escapeHtml(row.tarjeta || "")}</td>
      </tr>`
    )
    .join("");
}

function renderConciliacionEmpty(message) {
  if (conciliacionSummary) {
    conciliacionSummary.textContent = message;
  }
  if (conciliacionCronosCount) {
    conciliacionCronosCount.textContent = "—";
  }
  if (conciliacionBancoCount) {
    conciliacionBancoCount.textContent = "—";
  }
  renderConciliacionCronosRows([]);
  renderConciliacionBancoRows([]);
  syncConciliacionSortButtons();
}

async function loadConciliacion() {
  const { desde, hasta } = getConciliacionFilters();
  if (!desde || !hasta) {
    renderConciliacionEmpty("Selecciona un intervalo de fechas (Desde y Hasta).");
    return;
  }
  if (desde > hasta) {
    renderConciliacionEmpty("La fecha «Desde» no puede ser posterior a «Hasta».");
    return;
  }

  const token = ++conciliacionRequestToken;
  if (conciliacionSummary) {
    conciliacionSummary.textContent = "Cargando conciliación...";
  }
  if (conciliacionCronosTableBody) {
    conciliacionCronosTableBody.innerHTML = `<tr><td colspan="${CONCILIACION_CRONOS_COLSPAN}" class="empty-state">Cargando apuntes...</td></tr>`;
  }
  if (conciliacionBancoTableBody) {
    conciliacionBancoTableBody.innerHTML = `<tr><td colspan="${CONCILIACION_BANCO_COLSPAN}" class="empty-state">Cargando movimientos...</td></tr>`;
  }

  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc("get_cronos_conciliacion", {
      p_desde: desde,
      p_hasta: hasta,
      p_limit: CONCILIACION_LIMIT,
      p_cronos_sort_field: conciliacionCronosSort.field,
      p_cronos_sort_dir: conciliacionCronosSort.direction,
      p_banco_sort_field: conciliacionBancoSort.field,
      p_banco_sort_dir: conciliacionBancoSort.direction,
    });
    if (token !== conciliacionRequestToken) {
      return;
    }
    if (error) {
      throw error;
    }

    const cronosRows = data?.cronos ?? [];
    const bancoRows = data?.banco ?? [];
    const cronosTotal = Number(data?.cronos_total || 0);
    const bancoTotal = Number(data?.banco_total || 0);
    const limit = Number(data?.limit || CONCILIACION_LIMIT);

    renderConciliacionCronosRows(cronosRows);
    renderConciliacionBancoRows(bancoRows);
    syncConciliacionSortButtons();
    if (conciliacionCronosCount) {
      conciliacionCronosCount.textContent = `${cronosTotal.toLocaleString("es-ES")} apuntes`;
    }
    if (conciliacionBancoCount) {
      conciliacionBancoCount.textContent = `${bancoTotal.toLocaleString("es-ES")} movimientos`;
    }
    if (conciliacionSummary) {
      const capped = cronosTotal > limit || bancoTotal > limit;
      conciliacionSummary.textContent =
        `${formatGestionDate(desde)} – ${formatGestionDate(hasta)} · ` +
        `${cronosTotal.toLocaleString("es-ES")} apuntes sin banco · ` +
        `${bancoTotal.toLocaleString("es-ES")} movimientos sin apunte` +
        (capped ? ` · mostrando hasta ${limit.toLocaleString("es-ES")} por bloque` : "");
    }
  } catch (error) {
    if (token !== conciliacionRequestToken) {
      return;
    }
    renderConciliacionEmpty("No se pudo cargar la conciliación.");
    syncConciliacionSortButtons();
    setStatus(`No se pudo cargar la conciliación: ${error.message}`, "error");
  }
}

// --- Contabilidad: carga de CSV desde la app (reemplazo por rango de fechas) ---
// Los ficheros de Cronos vienen en dos formatos: apuntes (34 cols, UTF-8) y banco
// (15 cols, Windows-1252). Se mapean por POSICION (orden fijo de columnas) para no
// depender de las cabeceras. Como no hay clave unica fiable, cargar = borrar las
// filas del rango de fechas del fichero y reinsertar todo (idempotente por periodo).
const contabilidadLoadButton = document.querySelector("#contabilidad-load-button");
const contabilidadLoadInput = document.querySelector("#contabilidad-load-input");
const bancoLoadButton = document.querySelector("#banco-load-button");
const bancoLoadInput = document.querySelector("#banco-load-input");

const CRONOS_LOAD_COLUMNS = [
  ["apunte", "int"], ["fecha", "date"], ["hora", "time"], ["codigo_tarifa", "text"], ["tarifa", "text"],
  ["temporada", "text"], ["cantidad", "num"], ["importe", "num"], ["periodo_pago", "text"], ["forma_pago", "text"],
  ["tipo_apunte", "text"], ["anulado", "bool"], ["prefijo_factura", "text"], ["numero_factura", "text"], ["operador", "text"],
  ["maquina", "text"], ["centro", "text"], ["caja", "text"], ["codigo_persona", "text"], ["apellidos", "text"],
  ["nombre", "text"], ["documento", "text"], ["sexo", "text"], ["fecha_nac", "date"], ["edad", "int"],
  ["telefono", "text"], ["movil", "text"], ["email", "text"], ["servicio", "text"], ["tipo_servicio", "text"],
  ["periodo_clase", "text"], ["concepto", "text"], ["identificador", "text"], ["autorizacion", "text"],
];
const BANCO_LOAD_COLUMNS = [
  ["fecha", "date"], ["hora", "time"], ["terminal", "int"], ["tipo_operacion", "text"], ["cod_pedido", "int"],
  ["resultado", "text"], ["cod_error", "text"], ["importe", "num"], ["moneda", "text"], ["importe_euros", "num"],
  ["cierre_sesion", "text"], ["tipo_pago", "text"], ["tipo_pago_original", "text"], ["tarjeta", "text"], ["titular", "text"],
];

const CONTABILIDAD_LOAD_CONFIGS = {
  cronos: {
    table: "cronos",
    columns: CRONOS_LOAD_COLUMNS,
    dateCol: "fecha",
    label: "apuntes",
    summaryEl: () => contabilidadSummary,
    afterLoad: async () => {
      contabilidadCatalogFiltersLoaded = false;
      contabilidadPage = 1;
      await loadContabilidad();
    },
  },
  banco: {
    table: "cronos_banco",
    columns: BANCO_LOAD_COLUMNS,
    dateCol: "fecha",
    label: "movimientos",
    summaryEl: () => bancoSummary,
    afterLoad: async () => {
      bancoFiltrosLoaded = false;
      bancoPage = 1;
      await loadContabilidadBanco();
    },
  },
};

function csvCleanText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" || text === "----" ? null : text;
}

function csvToDate(value) {
  const text = csvCleanText(value);
  if (!text) return null;
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null; // "--", "-", u otros marcadores -> sin fecha
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function csvToTime(value) {
  const text = csvCleanText(value);
  if (!text) return null;
  const parts = text.split(":");
  if (parts.length !== 3) return null; // "--" u otros -> sin hora
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`;
}

function csvToNum(value) {
  const text = csvCleanText(value);
  if (text == null) return null;
  let normalized = text;
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function csvToInt(value) {
  const text = csvCleanText(value);
  if (text == null) return null;
  const number = parseInt(text.replace(",", "."), 10);
  return Number.isFinite(number) ? number : null;
}

function csvToBoolSi(value) {
  const text = csvCleanText(value);
  if (text == null) return null;
  return ["si", "sí", "s", "true", "1"].includes(text.toLowerCase());
}

function transformCsvRow(cells, columns) {
  const record = {};
  for (let i = 0; i < columns.length; i += 1) {
    const [column, type] = columns[i];
    const raw = cells[i];
    record[column] =
      type === "date" ? csvToDate(raw)
        : type === "time" ? csvToTime(raw)
        : type === "num" ? csvToNum(raw)
        : type === "int" ? csvToInt(raw)
        : type === "bool" ? csvToBoolSi(raw)
        : csvCleanText(raw);
  }
  return record;
}

// Decodifica detectando BOM UTF-8; si no es UTF-8 valido, cae a Windows-1252.
function decodeCsvBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(buffer);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (_error) {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function parseSemicolonCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ";") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // ignorar
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function handleContabilidadCsvLoad(file, configKey) {
  const config = CONTABILIDAD_LOAD_CONFIGS[configKey];
  if (!file || !config) {
    return;
  }
  const summaryEl = config.summaryEl();
  try {
    setStatus(`Leyendo ${file.name}...`);
    const buffer = await file.arrayBuffer();
    const text = decodeCsvBuffer(buffer);
    const rows = parseSemicolonCsv(text);
    if (!rows.length) {
      throw new Error("El fichero está vacío.");
    }
    const headers = rows[0];
    if (headers.length !== config.columns.length) {
      throw new Error(
        `El CSV tiene ${headers.length} columnas; se esperaban ${config.columns.length}. ` +
          `¿Es el fichero correcto para «${config.label}»?`
      );
    }

    const records = [];
    for (let r = 1; r < rows.length; r += 1) {
      const cells = rows[r];
      if (!cells || cells.length < config.columns.length || !String(cells[0] ?? "").trim()) {
        continue;
      }
      records.push(transformCsvRow(cells, config.columns));
    }
    if (!records.length) {
      throw new Error("No se encontraron filas de datos en el fichero.");
    }

    const fechas = records.map((record) => record[config.dateCol]).filter(Boolean).sort();
    const desde = fechas[0];
    const hasta = fechas[fechas.length - 1];
    if (!desde || !hasta) {
      throw new Error("No se pudieron determinar las fechas del fichero.");
    }

    const proceed = window.confirm(
      `Vas a REEMPLAZAR los ${config.label} del periodo ${formatGestionDate(desde)} – ${formatGestionDate(
        hasta
      )} con ${records.length.toLocaleString("es-ES")} filas de «${file.name}».\n\n` +
        `Se borrarán las filas existentes en ese rango de fechas y se insertarán las del fichero. ¿Continuar?`
    );
    if (!proceed) {
      setStatus("Carga cancelada.");
      return;
    }

    const supabase = await getSupabaseClient();
    if (summaryEl) summaryEl.textContent = "Borrando periodo…";
    const { error: deleteError } = await supabase
      .from(config.table)
      .delete()
      .gte(config.dateCol, desde)
      .lte(config.dateCol, hasta);
    if (deleteError) {
      throw deleteError;
    }

    const batchSize = 1000;
    let done = 0;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from(config.table).insert(batch);
      if (insertError) {
        throw insertError;
      }
      done += batch.length;
      if (summaryEl) {
        summaryEl.textContent = `Cargando ${done.toLocaleString("es-ES")}/${records.length.toLocaleString(
          "es-ES"
        )}…`;
      }
    }

    setStatus(
      `Carga completada: ${records.length.toLocaleString("es-ES")} ${config.label} (${formatGestionDate(
        desde
      )} – ${formatGestionDate(hasta)}).`,
      "success"
    );
    await config.afterLoad();
  } catch (error) {
    setStatus(`No se pudo cargar el fichero: ${error.message}`, "error");
    if (summaryEl) summaryEl.textContent = "Error en la carga.";
  }
}

// --- Historial laboral ---
const historialFiltersForm = document.querySelector("#historial-filters-form");
const historialSummary = document.querySelector("#historial-summary");
const historialTableBody = document.querySelector("#historial-table-body");
const historialTable = document.querySelector("#historial-table");
const historialFilterTipoContratacion = document.querySelector("#historial-filter-tipo-contratacion");
const historialRefreshButton = document.querySelector("#historial-refresh-button");
const historialClearFiltersButton = document.querySelector("#historial-clear-filters-button");
const historialNewButton = document.querySelector("#historial-new-button");
const historialOpenCompaniesSettingsButton = document.querySelector("#historial-open-companies-settings-button");
const historialOpenReportsSettingsButton = document.querySelector("#historial-open-reports-settings-button");
const historialDetailPanel = document.querySelector("#historial-detail-panel");
const historialDetailOverlay = document.querySelector("#historial-detail-overlay");
const historialDetailTitle = document.querySelector("#historial-detail-title");
const historialDetailForm = document.querySelector("#historial-detail-form");
const historialDetailFields = document.querySelector("#historial-detail-fields");
const historialDetailCloseButton = document.querySelector("#historial-detail-close-button");
const historialDetailCancelButton = document.querySelector("#historial-detail-cancel-button");
const historialDetailDeleteButton = document.querySelector("#historial-detail-delete-button");
const historialDetailDuplicateButton = document.querySelector("#historial-detail-duplicate-button");
let historialDetailReportButton = document.querySelector("#historial-detail-report-button");
const historialBulkFieldSelect = document.querySelector("#historial-bulk-field");
const historialBulkCurrentValueInput = document.querySelector("#historial-bulk-current-value");
const historialBulkCurrentSelect = document.querySelector("#historial-bulk-current-select");
const historialBulkNewValueInput = document.querySelector("#historial-bulk-new-value");
const historialBulkNewSelect = document.querySelector("#historial-bulk-new-select");
const historialBulkApplyButton = document.querySelector("#historial-bulk-apply-button");
const historialBulkSelectButton = document.querySelector("#historial-bulk-select-button");
const historialBulkClearSelectionButton = document.querySelector("#historial-bulk-clear-selection-button");
const historialBulkMatchCount = document.querySelector("#historial-bulk-match-count");
const historialBulkSelectionCount = document.querySelector("#historial-bulk-selection-count");
const historialBulkSelectHeader = document.querySelector("#historial-bulk-select-header");
const historialBulkSelectAllCheckbox = document.querySelector("#historial-bulk-select-all-checkbox");
const historialReportConfigDetails = document.querySelector("#historial-reports-config-details");
const historialReportOpenCompaniesButton = document.querySelector("#historial-report-open-companies-button");
const historialReportConfigRefreshButton = document.querySelector("#historial-report-config-refresh-button");
const historialReportConfigStatus = document.querySelector("#historial-report-config-status");
const historialReportTemplateSelect = document.querySelector("#historial-report-template-select");
const historialReportTemplateForm = document.querySelector("#historial-report-template-form");
const historialReportTemplateSaveButton = document.querySelector("#historial-report-template-save-button");
const historialReportTemplateNewButton = document.querySelector("#historial-report-template-new-button");
const historialReportPanel = document.querySelector("#historial-report-panel");
const historialReportOverlay = document.querySelector("#historial-report-overlay");
const historialReportTitle = document.querySelector("#historial-report-title");
const historialReportCloseButton = document.querySelector("#historial-report-close-button");
const historialReportGenerateTemplateSelect = document.querySelector("#historial-report-generate-template-select");
const historialReportDocumentDate = document.querySelector("#historial-report-document-date");
const historialReportStartDate = document.querySelector("#historial-report-start-date");
const historialReportSignCity = document.querySelector("#historial-report-sign-city");
const historialReportPersonSummary = document.querySelector("#historial-report-person-summary");
const historialReportCompanySummary = document.querySelector("#historial-report-company-summary");
const historialReportActivitiesSummary = document.querySelector("#historial-report-activities-summary");
const historialReportSelectAllActivitiesButton = document.querySelector("#historial-report-select-all-activities-button");
const historialReportClearActivitiesButton = document.querySelector("#historial-report-clear-activities-button");
const historialReportTemplateWarning = document.querySelector("#historial-report-template-warning");
const historialReportActivitiesTableBody = document.querySelector("#historial-report-activities-table-body");
const historialReportDownloadButton = document.querySelector("#historial-report-download-button");
const historialReportEmailText = document.querySelector("#historial-report-email-text");

const HISTORIAL_FETCH_LIMIT = 1000;
const HISTORIAL_TABLE = "historiales_laborales";
const HISTORIAL_DETAIL_VIEW = "historiales_laborales_detalle";
const HISTORIAL_DETAIL_SELECT =
  "id, activo, enviado, gestionado, tramitado, personal_id, personal, empresa_id, empresa, jornada, jornada_maxima, " +
  "contrato_laboral_id, contrato_laboral_clave, modalidad_pago_id, fecha_alta, fecha_baja, " +
  "dias_periodo, coeficiente_temporalidad_miles, puesto_id, puesto, puesto_texto, " +
  "tipo_contratacion_id, tipo_contratacion, motivo_baja_id, motivo_baja, grupo_cotizacion, " +
  "movimiento, salario_jornada_completa, importe_horas_complementarias, complemento, horarios, " +
  "observaciones, notas, tiene_complemento, tiene_complemento_movilidad, tiene_complemento_dedicacion, " +
  "tiene_plus_transporte, tiene_nocturnidad, tiene_antiguedad, lenguaje_inclusivo";

// Tablas de catálogo para los selectores de relación del formulario y la asignación masiva.
const HISTORIAL_RELATION_TABLES = {
  personal_id: { table: "personal", labelCol: "personal" },
  empresa_id: { table: "empresas", labelCol: "empresa" },
  puesto_id: { table: "puestos", labelCol: "puesto" },
  contrato_laboral_id: { table: "historiales_laborales_contratos", labelCol: "clave" },
  modalidad_pago_id: { table: "historiales_laborales_modalidades_pago", labelCol: "modalidad_pago" },
  tipo_contratacion_id: { table: "historiales_laborales_tipos_contratacion", labelCol: "tipo_contratacion" },
  motivo_baja_id: { table: "historiales_laborales_motivos_baja", labelCol: "motivo_baja" },
};

// Campos editables del periodo. dias_periodo y coeficiente se calculan por trigger (solo lectura).
const HISTORIAL_FORM_FIELDS = [
  { key: "personal_id", label: "Personal", type: "relation" },
  { key: "empresa_id", label: "Empresa", type: "relation" },
  { key: "fecha_alta", label: "Fecha alta", type: "date" },
  { key: "fecha_baja", label: "Fecha baja", type: "date" },
  { key: "jornada", label: "Jornada", type: "decimal" },
  { key: "jornada_maxima", label: "Jornada máxima", type: "decimal" },
  { key: "dias_periodo", label: "Días periodo", type: "number", readonly: true },
  { key: "coeficiente_temporalidad_miles", label: "Coef. temporalidad (‰)", type: "number", readonly: true },
  { key: "puesto_id", label: "Puesto", type: "relation" },
  { key: "puesto_texto", label: "Puesto (texto libre)", type: "text" },
  { key: "contrato_laboral_id", label: "Contrato", type: "relation" },
  { key: "modalidad_pago_id", label: "Modalidad de pago", type: "relation" },
  { key: "tipo_contratacion_id", label: "Tipo contratación", type: "relation" },
  { key: "motivo_baja_id", label: "Motivo baja", type: "relation" },
  { key: "grupo_cotizacion", label: "Grupo cotización", type: "number" },
  { key: "movimiento", label: "Movimiento", type: "text" },
  { key: "salario_jornada_completa", label: "Salario jornada completa", type: "decimal" },
  { key: "importe_horas_complementarias", label: "Importe horas complementarias", type: "decimal" },
  { key: "complemento", label: "Complemento", type: "decimal" },
  { key: "horarios", label: "Horarios", type: "text" },
  { key: "activo", label: "Activo", type: "boolean" },
  { key: "enviado", label: "Enviado", type: "boolean" },
  { key: "gestionado", label: "Gestionado", type: "boolean" },
  { key: "tramitado", label: "Tramitado", type: "boolean" },
  { key: "tiene_complemento", label: "Tiene complemento", type: "boolean" },
  { key: "tiene_complemento_movilidad", label: "Complemento movilidad", type: "boolean" },
  { key: "tiene_complemento_dedicacion", label: "Complemento dedicación", type: "boolean" },
  { key: "tiene_plus_transporte", label: "Plus transporte", type: "boolean" },
  { key: "tiene_nocturnidad", label: "Nocturnidad", type: "boolean" },
  { key: "tiene_antiguedad", label: "Antigüedad", type: "boolean" },
  { key: "lenguaje_inclusivo", label: "Lenguaje inclusivo", type: "boolean" },
  { key: "observaciones", label: "Observaciones", type: "textarea" },
  { key: "notas", label: "Notas", type: "textarea" },
];
const HISTORIAL_FIELD_BY_KEY = new Map(HISTORIAL_FORM_FIELDS.map((field) => [field.key, field]));
const HISTORIAL_NUMERIC_TYPES = new Set(["number", "decimal", "relation"]);

const HISTORIAL_BULK_FIELDS = {
  empresa_id: { label: "Empresa", type: "relation", labelKey: "empresa" },
  fecha_alta: { label: "Fecha alta", type: "date" },
  fecha_baja: { label: "Fecha baja", type: "date" },
  puesto_id: { label: "Puesto", type: "relation", labelKey: "puesto" },
  contrato_laboral_id: { label: "Contrato", type: "relation", labelKey: "contrato_laboral_clave" },
  modalidad_pago_id: { label: "Modalidad de pago", type: "relation" },
  tipo_contratacion_id: { label: "Tipo contratación", type: "relation", labelKey: "tipo_contratacion" },
  motivo_baja_id: { label: "Motivo baja", type: "relation", labelKey: "motivo_baja" },
  jornada: { label: "Jornada", type: "number" },
  jornada_maxima: { label: "Jornada máxima", type: "number" },
  grupo_cotizacion: { label: "Grupo cotización", type: "number" },
  activo: { label: "Activo", type: "boolean" },
  enviado: { label: "Enviado", type: "boolean" },
  gestionado: { label: "Gestionado", type: "boolean" },
  tramitado: { label: "Tramitado", type: "boolean" },
};

const HISTORIAL_REPORT_TEMPLATE_FIELDS = [
  "codigo",
  "nombre",
  "tipo_documento",
  "tipo_contratacion_id",
  "activo",
  "orden",
  "titulo",
  "saludo",
  "texto_intro",
  "texto_movimiento",
  "texto_condiciones",
  "texto_legal",
  "texto_recibido",
  "tabla_actividades_titulo",
  "incluir_tabla_actividades",
  "incluir_opciones_respuesta",
  "opciones_respuesta_texto",
  "pie_observaciones",
];
const HISTORIAL_REPORT_TEMPLATE_BOOLEAN_FIELDS = new Set([
  "activo",
  "incluir_tabla_actividades",
  "incluir_opciones_respuesta",
]);
const HISTORIAL_REPORT_TEMPLATE_INTEGER_FIELDS = new Set(["tipo_contratacion_id", "orden"]);
const HISTORIAL_REPORT_TEMPLATE_TEXT_BLOCKS = [
  "saludo",
  "texto_intro",
  "texto_movimiento",
  "texto_condiciones",
  "texto_legal",
  "texto_recibido",
  "opciones_respuesta_texto",
  "pie_observaciones",
];
const HISTORIAL_REPORT_ACTIVITY_SELECT =
  "id, personal_id, personal, dni, empresa_id, empresa, servicio, instalacion, puesto, dias_semana, " +
  "fecha_inicio, fecha_fin, hora_inicio, hora_fin, observaciones";
const HISTORIAL_REPORT_WEEKDAY_LABELS = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
  L: "Lunes",
  M: "Martes",
  X: "Miércoles",
  J: "Jueves",
  V: "Viernes",
  S: "Sábado",
  D: "Domingo",
};

const HISTORIAL_IMPORT_HEADER_MAP = {
  id: "id",
  activa: "activo",
  activo: "activo",
  enviado: "enviado",
  gestionado: "gestionado",
  tramitado: "tramitado",
  personal_id: "personal_id",
  empresa_id: "empresa_id",
  jornada: "jornada",
  jornada_max: "jornada_maxima",
  jornada_maxima: "jornada_maxima",
  tipo_contrato: "contrato_laboral_id",
  contrato_laboral_id: "contrato_laboral_id",
  vida_laboral_pagos_id: "modalidad_pago_id",
  modalidad_pago_id: "modalidad_pago_id",
  fecha_alta: "fecha_alta",
  fecha_baja: "fecha_baja",
  dias_cot: "dias_periodo",
  dias_periodo: "dias_periodo",
  puesto_id: "puesto_id",
  coeficiente_temporalidad: "coeficiente_temporalidad_miles",
  coeficiente_temporalidad_miles: "coeficiente_temporalidad_miles",
  vida_laboral_contratacion_id: "tipo_contratacion_id",
  tipo_contratacion_id: "tipo_contratacion_id",
  vida_laboral_baja_id: "motivo_baja_id",
  motivo_baja_id: "motivo_baja_id",
  horarios: "horarios",
  observaciones: "observaciones",
  "01_salario_jc": "salario_jornada_completa",
  salario_jornada_completa: "salario_jornada_completa",
  "67_hc": "importe_horas_complementarias",
  importe_horas_complementarias: "importe_horas_complementarias",
  "11_have_complemento_movilidad": "tiene_complemento_movilidad",
  tiene_complemento_movilidad: "tiene_complemento_movilidad",
  "65_have_complemento_dedicacion": "tiene_complemento_dedicacion",
  tiene_complemento_dedicacion: "tiene_complemento_dedicacion",
  "398_have_plus_transporte": "tiene_plus_transporte",
  tiene_plus_transporte: "tiene_plus_transporte",
  "53_have_nocturnidad": "tiene_nocturnidad",
  tiene_nocturnidad: "tiene_nocturnidad",
  "04_have_antiguedad": "tiene_antiguedad",
  tiene_antiguedad: "tiene_antiguedad",
  "18_have_complemento": "tiene_complemento",
  tiene_complemento: "tiene_complemento",
  "18_complemento": "complemento",
  complemento: "complemento",
  notas: "notas",
  grupo_cotizacion: "grupo_cotizacion",
  movimiento: "movimiento",
  puestos: "puesto_texto",
  puesto_texto: "puesto_texto",
  dto_cot_comunes: "cotizacion_comunes_pct",
  cotizacion_comunes_pct: "cotizacion_comunes_pct",
  dto_mei: "cotizacion_mei_pct",
  cotizacion_mei_pct: "cotizacion_mei_pct",
  dto_cot_formacion: "cotizacion_formacion_pct",
  cotizacion_formacion_pct: "cotizacion_formacion_pct",
  dto_cot_desempleo: "cotizacion_desempleo_pct",
  cotizacion_desempleo_pct: "cotizacion_desempleo_pct",
  lenguaje_inclusivo: "lenguaje_inclusivo",
};
const HISTORIAL_IMPORT_TEXT_FIELDS = new Set(["horarios", "observaciones", "notas", "movimiento", "puesto_texto"]);
const HISTORIAL_IMPORT_INTEGER_FIELDS = new Set([
  "id",
  "personal_id",
  "empresa_id",
  "contrato_laboral_id",
  "modalidad_pago_id",
  "dias_periodo",
  "puesto_id",
  "coeficiente_temporalidad_miles",
  "tipo_contratacion_id",
  "motivo_baja_id",
  "grupo_cotizacion",
]);
const HISTORIAL_IMPORT_NUMERIC_FIELDS = new Set([
  "jornada",
  "jornada_maxima",
  "salario_jornada_completa",
  "importe_horas_complementarias",
  "complemento",
  "cotizacion_comunes_pct",
  "cotizacion_mei_pct",
  "cotizacion_formacion_pct",
  "cotizacion_desempleo_pct",
]);
const HISTORIAL_IMPORT_BOOLEAN_FIELDS = new Set([
  "activo",
  "enviado",
  "gestionado",
  "tramitado",
  "tiene_complemento_movilidad",
  "tiene_complemento_dedicacion",
  "tiene_plus_transporte",
  "tiene_nocturnidad",
  "tiene_antiguedad",
  "tiene_complemento",
  "lenguaje_inclusivo",
]);
const HISTORIAL_IMPORT_DATE_FIELDS = new Set(["fecha_alta", "fecha_baja"]);
const HISTORIAL_IMPORT_COLUMNS = Array.from(new Set(Object.values(HISTORIAL_IMPORT_HEADER_MAP)));
const HISTORIAL_IMPORT_SELECT_COLUMNS = HISTORIAL_IMPORT_COLUMNS.join(", ");

let historialPersonalOptionsLoaded = false;
let historialRows = [];
let historialBulkSelectionMode = false;
let selectedHistorialBulkIds = new Set();
// Filas del listado con el panel de actividades solapadas desplegado + caché
// de esas actividades por id de periodo (carga perezosa al desplegar).
const expandedHistorialIds = new Set();
const historialActivitiesCache = new Map();
let currentHistorialSort = { field: "fecha_alta", direction: "desc" };
let historialRelationOptionsCache = {};
let historialDetailSnapshot = null;
let historialDetailMode = "edit"; // "edit" | "new"
let pendingHistorialImportRows = [];
let pendingHistorialImportFileName = "";
let historialReportCompanyRows = [];
let historialReportTemplateRows = [];
let historialReportConfigLoaded = false;
let historialReportDraft = null;
// Se pone a true cuando el usuario edita a mano el texto del correo del informe,
// para no sobrescribir su edición al cambiar de plantilla.
let historialReportEmailTextDirty = false;

async function loadHistorialRelationOptions() {
  if (Object.keys(historialRelationOptionsCache).length) {
    return;
  }
  try {
    const supabase = await getSupabaseClient();
    await Promise.all(
      Object.entries(HISTORIAL_RELATION_TABLES).map(async ([key, { table, labelCol }]) => {
        const { data } = await supabase
          .from(table)
          .select(`id,${labelCol}`)
          .order(labelCol, { ascending: true })
          .limit(5000);
        if (!data) return;
        historialRelationOptionsCache[key] = data.map((row) => ({
          value: row.id,
          label: row[labelCol] ?? "",
        }));
      })
    );
  } catch (_error) {
    // Si falla la carga de catálogos, los selects quedan con "Ninguno" y se puede reintentar.
  }
}

function parseHistorialFieldValue(rawValue, field) {
  if (field.type === "boolean") {
    return rawValue === true || rawValue === "true" || rawValue === "1";
  }
  if (rawValue === "" || rawValue === undefined || rawValue === null) {
    return null;
  }
  if (HISTORIAL_NUMERIC_TYPES.has(field.type)) {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : null;
  }
  return String(rawValue);
}

function normalizeHistorialComparable(value, field) {
  const parsed = parseHistorialFieldValue(value, field);
  return parsed === null || parsed === undefined ? "" : String(parsed);
}

function getHistorialFilterValues() {
  const formData = new FormData(historialFiltersForm ?? undefined);
  return {
    fechaAltaDesde: String(formData.get("fecha_alta_desde") || "").trim(),
    fechaAltaHasta: String(formData.get("fecha_alta_hasta") || "").trim(),
    fechaBajaHasta: String(formData.get("fecha_baja_hasta") || "").trim(),
    fechaBajaDesde: String(formData.get("fecha_baja_desde") || "").trim(),
    tipoContratacionId: String(formData.get("tipo_contratacion_id") || "").trim(),
    enviado: String(formData.get("enviado") || "").trim(),
    gestionado: String(formData.get("gestionado") || "").trim(),
    tramitado: String(formData.get("tramitado") || "").trim(),
    personalId: String(formData.get("personal_id") || "").trim(),
  };
}

async function loadHistorialPersonalOptions(supabase) {
  if (historialPersonalOptionsLoaded) {
    return;
  }

  const { data, error } = await supabase
    .from("personal")
    .select("id, personal")
    .order("personal", { ascending: true })
    .limit(3000);

  if (error) {
    return;
  }

  setPersonalPickerOptions(
    "historial-filter",
    (data || []).map((row) => ({ value: String(row.id), label: row.personal || String(row.id) }))
  );
  historialPersonalOptionsLoaded = true;
}

function setHistorialReportConfigStatus(message, tone = "default") {
  if (!historialReportConfigStatus) return;
  historialReportConfigStatus.textContent = message || "";
  historialReportConfigStatus.classList.toggle("error", tone === "error");
  historialReportConfigStatus.classList.toggle("success", tone === "success");
}

function renderHistorialReportTemplateTipoContratacionOptions(selectedValue = "") {
  const select = historialReportTemplateForm?.elements.tipo_contratacion_id;
  if (!select) return;
  const options = historialRelationOptionsCache.tipo_contratacion_id || [];
  select.innerHTML =
    '<option value="">Sin asignar</option>' +
    options
      .map(
        (option) =>
          `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label || `Tipo ${option.value}`)}</option>`
      )
      .join("");
  select.value = selectedValue == null ? "" : String(selectedValue);
}

function renderHistorialReportTemplateSelect() {
  if (!historialReportTemplateSelect) return;
  const previous = historialReportTemplateSelect.value;
  historialReportTemplateSelect.innerHTML =
    '<option value="">Seleccionar plantilla</option>' +
    historialReportTemplateRows
      .map((row) => {
        const label = `${row.nombre || row.codigo}${row.activo ? "" : " (inactiva)"}`;
        return `<option value="${escapeHtml(row.id)}">${escapeHtml(label)}</option>`;
      })
      .join("");
  historialReportTemplateSelect.value =
    previous && historialReportTemplateRows.some((row) => String(row.id) === previous)
      ? previous
      : String(historialReportTemplateRows[0]?.id || "");
}

function getDefaultHistorialReportTemplate() {
  return {
    codigo: "",
    nombre: "",
    tipo_documento: "llamamiento",
    tipo_contratacion_id: "",
    activo: true,
    orden: 100,
    titulo: "",
    saludo: "",
    texto_intro: "",
    texto_movimiento: "",
    texto_condiciones: "",
    texto_legal: "",
    texto_recibido: "",
    tabla_actividades_titulo: "Horario",
    incluir_tabla_actividades: true,
    incluir_opciones_respuesta: false,
    opciones_respuesta_texto: "",
    pie_observaciones: "",
  };
}

function fillHistorialReportTemplateForm(row = getDefaultHistorialReportTemplate()) {
  if (!historialReportTemplateForm) return;
  HISTORIAL_REPORT_TEMPLATE_FIELDS.forEach((field) => {
    const control = historialReportTemplateForm.elements[field];
    if (!control) return;
    if (HISTORIAL_REPORT_TEMPLATE_BOOLEAN_FIELDS.has(field)) {
      control.checked = Boolean(row?.[field]);
      return;
    }
    control.value = row?.[field] ?? "";
  });
  renderHistorialReportTemplateTipoContratacionOptions(row?.tipo_contratacion_id ?? "");
}

function syncHistorialReportConfigForms() {
  const template = historialReportTemplateRows.find(
    (row) => String(row.id) === String(historialReportTemplateSelect?.value || "")
  );
  fillHistorialReportTemplateForm(template || getDefaultHistorialReportTemplate());
}

async function loadHistorialReportConfig({ force = false } = {}) {
  if (!historialReportTemplateForm || (historialReportConfigLoaded && !force)) return;
  try {
    setHistorialReportConfigStatus("Cargando configuración...");
    const supabase = await getSupabaseClient();
    await loadHistorialRelationOptions();
    let companyWarning = "";
    let companyRes = await supabase
      .from("empresas")
      .select(
        "id, empresa, razon_social, cif, logo_url, logo_data_url, logo_alt, firma_data_url, firmante_nombre, firmante_dni, firmante_cargo, ciudad_firma, direccion_pie, telefono_pie, email_pie, web_pie, notas"
      )
      .order("empresa", { ascending: true });
    if (companyRes.error) {
      companyWarning = " Aplica empresas.sql para activar logo/firma.";
      companyRes = await supabase
        .from("empresas")
        .select("id, empresa, razon_social, cif")
        .order("empresa", { ascending: true });
    }
    const templateRes = await supabase
      .from("historial_laboral_informe_plantillas")
      .select("*")
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });
    if (companyRes.error) throw companyRes.error;
    if (templateRes.error) throw templateRes.error;

    historialReportCompanyRows = (companyRes.data || []).map((row) => ({
      ...row,
      empresa_id: row.id,
    }));
    historialReportTemplateRows = templateRes.data || [];
    historialReportConfigLoaded = true;
    renderHistorialReportTemplateSelect();
    syncHistorialReportConfigForms();
    setHistorialReportConfigStatus(
      `${historialReportCompanyRows.length} empresas · ${historialReportTemplateRows.length} plantillas`,
      companyWarning ? "warning" : "success"
    );
    if (companyWarning && historialReportConfigStatus) {
      historialReportConfigStatus.textContent += companyWarning;
    }
  } catch (error) {
    historialReportConfigLoaded = false;
    setHistorialReportConfigStatus(
      "No se pudo cargar. Aplica el SQL historial_laboral_informes_config.sql.",
      "error"
    );
    setStatus(`No se pudo cargar la configuración de informes: ${formatSupabaseErrorDetails(error)}`, "error");
  }
}

function collectHistorialReportTemplatePayload() {
  const payload = {};
  HISTORIAL_REPORT_TEMPLATE_FIELDS.forEach((field) => {
    const control = historialReportTemplateForm?.elements[field];
    if (!control) return;
    if (HISTORIAL_REPORT_TEMPLATE_BOOLEAN_FIELDS.has(field)) {
      payload[field] = Boolean(control.checked);
      return;
    }
    const rawValue = String(control.value ?? "").trim();
    if (HISTORIAL_REPORT_TEMPLATE_INTEGER_FIELDS.has(field)) {
      payload[field] = rawValue ? Number.parseInt(rawValue, 10) : null;
      return;
    }
    payload[field] = rawValue || null;
  });
  if (!payload.codigo) throw new Error("El código de plantilla es obligatorio.");
  if (!payload.nombre) throw new Error("El nombre de plantilla es obligatorio.");
  payload.tipo_documento = payload.tipo_documento || "otro";
  payload.orden = Number.isFinite(payload.orden) && payload.orden != null ? payload.orden : 100;
  payload.tabla_actividades_titulo = payload.tabla_actividades_titulo || "Horario";
  return payload;
}

async function saveHistorialReportCompanyConfig() {
  try {
    historialReportCompanySaveButton?.setAttribute("disabled", "true");
    const payload = collectHistorialReportCompanyPayload();
    const empresaId = payload.id;
    const updatePayload = { ...payload };
    delete updatePayload.id;
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("empresas")
      .update(updatePayload)
      .eq("id", empresaId);
    if (error) throw error;
    historialReportConfigLoaded = false;
    await loadHistorialReportConfig({ force: true });
    setStatus("Configuración documental de empresa guardada.", "success");
  } catch (error) {
    setStatus(`No se pudo guardar la configuración de empresa: ${formatSupabaseErrorDetails(error)}`, "error");
  } finally {
    historialReportCompanySaveButton?.removeAttribute("disabled");
  }
}

async function saveHistorialReportTemplateConfig() {
  try {
    historialReportTemplateSaveButton?.setAttribute("disabled", "true");
    const payload = collectHistorialReportTemplatePayload();
    const selectedId = historialReportTemplateSelect?.value || "";
    const existing = historialReportTemplateRows.find((row) => String(row.id) === String(selectedId));
    const supabase = await getSupabaseClient();
    const result = existing
      ? await supabase.from("historial_laboral_informe_plantillas").update(payload).eq("id", existing.id)
      : await supabase.from("historial_laboral_informe_plantillas").insert(payload);
    if (result.error) throw result.error;
    historialReportConfigLoaded = false;
    await loadHistorialReportConfig({ force: true });
    setStatus("Plantilla de informe guardada.", "success");
  } catch (error) {
    setStatus(`No se pudo guardar la plantilla: ${formatSupabaseErrorDetails(error)}`, "error");
  } finally {
    historialReportTemplateSaveButton?.removeAttribute("disabled");
  }
}

function startNewHistorialReportTemplate() {
  if (historialReportTemplateSelect) historialReportTemplateSelect.value = "";
  fillHistorialReportTemplateForm(getDefaultHistorialReportTemplate());
  historialReportTemplateForm?.elements.codigo?.focus();
}

function openHistorialReportCompaniesSettings() {
  currentSettingsView = "catalog";
  currentSettingsCatalog = "empresas";
  resetSettingsSort();
  historialReportConfigDetails?.removeAttribute("open");
  switchPrivateTab("settings");
  void loadSettingsManagement();
}

function openReportTemplateSettings() {
  currentSettingsView = "reports";
  historialReportConfigDetails?.removeAttribute("open");
  switchPrivateTab("settings");
  switchSettingsView("reports");
  void loadHistorialReportConfig({ force: !historialReportConfigLoaded });
}

function ensureHistorialDetailReportButton() {
  if (historialDetailReportButton) return historialDetailReportButton;
  const parent = historialDetailDuplicateButton?.parentElement;
  if (!parent) return null;
  const button = document.createElement("button");
  button.id = "historial-detail-report-button";
  button.type = "button";
  button.className = "secondary-button";
  button.textContent = "Generar informe";
  button.addEventListener("click", () => {
    void openHistorialReportPanel();
  });
  parent.insertBefore(button, historialDetailDuplicateButton);
  historialDetailReportButton = button;
  return button;
}

function formatHistorialReportLongDate(value) {
  const normalized = String(value ?? "").trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return normalized;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function sanitizeHistorialReportFilename(value) {
  return String(value || "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHistorialReportDays(value) {
  if (Array.isArray(value)) {
    return value.map((item) => HISTORIAL_REPORT_WEEKDAY_LABELS[String(item).trim()] || item).join(", ");
  }
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => HISTORIAL_REPORT_WEEKDAY_LABELS[String(item).trim()] || item).join(", ");
    }
  } catch (_error) {
    // dias_semana tambien puede llegar como texto simple.
  }
  return raw
    .split(/[,\s;|]+/)
    .filter(Boolean)
    .map((item) => HISTORIAL_REPORT_WEEKDAY_LABELS[String(item).trim()] || item)
    .join(", ");
}

function countHistorialReportDays(value) {
  const normalized = normalizeHistorialReportDays(value);
  if (!normalized) return 1;
  return normalized.split(",").filter((item) => item.trim()).length || 1;
}

function getHistorialReportActivityWeeklyHours(row) {
  const minutes = calculateWorkedMinutes(row.hora_inicio, row.hora_fin) * countHistorialReportDays(row.dias_semana);
  return minutes ? formatMinutesAsHours(minutes) : "";
}

function getHistorialReportActivityKey(row) {
  return String(row?.id ?? "");
}

function ensureHistorialReportSelectedActivities(rows = []) {
  if (!historialReportDraft) return new Set();
  if (!(historialReportDraft.selectedActivityIds instanceof Set)) {
    historialReportDraft.selectedActivityIds = new Set(rows.map(getHistorialReportActivityKey).filter(Boolean));
  }
  const validIds = new Set(rows.map(getHistorialReportActivityKey).filter(Boolean));
  historialReportDraft.selectedActivityIds = new Set(
    Array.from(historialReportDraft.selectedActivityIds).filter((id) => validIds.has(id))
  );
  return historialReportDraft.selectedActivityIds;
}

function getSelectedHistorialReportActivities() {
  const rows = historialReportDraft?.activities || [];
  const selectedIds = ensureHistorialReportSelectedActivities(rows);
  return rows.filter((row) => selectedIds.has(getHistorialReportActivityKey(row)));
}

function renderHistorialReportActivities(rows = []) {
  const selectedIds = ensureHistorialReportSelectedActivities(rows);
  const selectedCount = rows.filter((row) => selectedIds.has(getHistorialReportActivityKey(row))).length;
  if (historialReportActivitiesSummary) {
    historialReportActivitiesSummary.textContent = `${selectedCount}/${rows.length} actividades incluidas`;
  }
  if (!historialReportActivitiesTableBody) return;
  if (!rows.length) {
    historialReportActivitiesTableBody.innerHTML =
      '<tr><td colspan="8" class="empty-state">No hay actividades solapadas con el historial laboral.</td></tr>';
    return;
  }
  historialReportActivitiesTableBody.innerHTML = rows
    .map(
      (row) => {
        const activityId = getHistorialReportActivityKey(row);
        const checked = selectedIds.has(activityId) ? "checked" : "";
        return `<tr>
        <td>
          <input type="checkbox" data-historial-report-activity-id="${escapeHtml(activityId)}" ${checked} aria-label="Incluir actividad" />
        </td>
        <td>${escapeHtml(row.puesto || "")}</td>
        <td>${escapeHtml(row.instalacion || "")}</td>
        <td>${escapeHtml(formatHourValue(row.hora_inicio).slice(0, 5))}</td>
        <td>${escapeHtml(formatHourValue(row.hora_fin).slice(0, 5))}</td>
        <td>${escapeHtml(normalizeHistorialReportDays(row.dias_semana))}</td>
        <td>${escapeHtml(getHistorialReportActivityWeeklyHours(row))}</td>
        <td>${escapeHtml(row.servicio || "")}</td>
      </tr>`;
      }
    )
    .join("");
}

function setHistorialReportActivitiesSelection(selectedIds) {
  if (!historialReportDraft) return;
  historialReportDraft.selectedActivityIds = new Set(selectedIds);
  renderHistorialReportActivities(historialReportDraft.activities || []);
}

function normalizeHistorialReportTypeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getHistorialReportExpectedDocumentType(historialRow) {
  const source = normalizeHistorialReportTypeText(
    [historialRow?.movimiento, historialRow?.tipo_contratacion, historialRow?.contrato_laboral_clave]
      .filter(Boolean)
      .join(" ")
  );
  if (!source) return "";
  if (source.includes("subrog")) return "subrogacion";
  if (source.includes("variacion") || source.includes("varia") || source.includes("jornada") || source.includes("hora")) {
    return "variacion";
  }
  if (source.includes("llamamiento") || source.includes("llama") || source.includes("incorpor") || source.includes("reanud")) {
    return "llamamiento";
  }
  return "";
}

function getHistorialReportTypeLabel(type) {
  return {
    llamamiento: "llamamiento",
    variacion: "variación",
    subrogacion: "subrogación",
    otro: "otro",
  }[type] || type || "";
}

function validateHistorialReportTemplateType({ notify = false } = {}) {
  const template = getHistorialReportTemplateById(historialReportGenerateTemplateSelect?.value || "");
  const expectedType = getHistorialReportExpectedDocumentType(historialReportDraft?.historialRow);
  const selectedType = template?.tipo_documento || "";
  const hasMismatch = Boolean(expectedType && selectedType && expectedType !== selectedType);
  const message = hasMismatch
    ? `Aviso: el movimiento parece ${getHistorialReportTypeLabel(expectedType)} y la plantilla es ${getHistorialReportTypeLabel(selectedType)}.`
    : "";
  if (historialReportTemplateWarning) {
    historialReportTemplateWarning.textContent = message;
    historialReportTemplateWarning.classList.toggle("error", hasMismatch);
  }
  if (hasMismatch && notify) {
    setStatus(message, "warning");
  }
  return !hasMismatch;
}

function getPreferredHistorialReportTemplate(historialRow) {
  const activeTemplates = historialReportTemplateRows.filter((row) => row.activo !== false);
  const expectedType = getHistorialReportExpectedDocumentType(historialRow);
  return (
    activeTemplates.find(
      (row) =>
        expectedType &&
        row.tipo_documento === expectedType &&
        row.tipo_contratacion_id != null &&
        historialRow?.tipo_contratacion_id != null &&
        Number(row.tipo_contratacion_id) === Number(historialRow.tipo_contratacion_id)
    ) ||
    activeTemplates.find((row) => expectedType && row.tipo_documento === expectedType) ||
    activeTemplates.find(
      (row) =>
        row.tipo_contratacion_id != null &&
        historialRow?.tipo_contratacion_id != null &&
        Number(row.tipo_contratacion_id) === Number(historialRow.tipo_contratacion_id)
    ) ||
    activeTemplates.find((row) => row.tipo_documento === "llamamiento") ||
    activeTemplates[0] ||
    historialReportTemplateRows[0] ||
    null
  );
}

function renderHistorialReportGenerateTemplateSelect(selectedId = "") {
  if (!historialReportGenerateTemplateSelect) return;
  historialReportGenerateTemplateSelect.innerHTML =
    '<option value="">Seleccionar plantilla</option>' +
    historialReportTemplateRows
      .filter((row) => row.activo !== false)
      .map((row) => {
        const label = `${row.nombre || row.codigo} · ${row.tipo_documento || "otro"}`;
        return `<option value="${escapeHtml(row.id)}">${escapeHtml(label)}</option>`;
      })
      .join("");
  historialReportGenerateTemplateSelect.value = selectedId ? String(selectedId) : "";
}

async function fetchHistorialReportActivities(supabase, historialRow, startDate) {
  const overlapStart = startDate || historialRow?.fecha_alta || getTodayIsoDate();
  const overlapEnd = historialRow?.fecha_baja || null;
  if (!historialRow?.personal_id || !overlapStart) return [];
  let query = supabase
    .from("actividades_detalle")
    .select(HISTORIAL_REPORT_ACTIVITY_SELECT)
    .eq("personal_id", historialRow.personal_id)
    .or(`fecha_fin.is.null,fecha_fin.gte.${overlapStart}`)
    .order("fecha_inicio", { ascending: true })
    .order("hora_inicio", { ascending: true });
  if (overlapEnd) {
    query = query.lte("fecha_inicio", overlapEnd);
  }
  if (historialRow.empresa_id != null) {
    query = query.eq("empresa_id", historialRow.empresa_id);
  }
  const { data, error } = await query.limit(500);
  if (error) throw error;
  return data || [];
}

async function fetchHistorialReportPersonal(supabase, personalId) {
  if (!personalId) return null;
  const { data, error } = await supabase
    .from("personal")
    .select("id, personal, dni, email, genero")
    .eq("id", personalId)
    .maybeSingle();
  if (error) return null;
  return data;
}

function getHistorialReportTemplateById(templateId) {
  return historialReportTemplateRows.find((row) => String(row.id) === String(templateId)) || null;
}

function buildHistorialReportPlaceholders({ historialRow, company, personal, activities, documentDate, startDate, signCity }) {
  const firstActivity = activities[0] || {};
  const activityPuestos = Array.from(new Set(
    activities
      .map((row) => String(row.puesto || "").trim())
      .filter(Boolean)
  ));
  const puesto = activityPuestos.join(", ");
  const horarios = historialRow.horarios || activities
    .map((row) => {
      const range = [formatHourValue(row.hora_inicio).slice(0, 5), formatHourValue(row.hora_fin).slice(0, 5)]
        .filter(Boolean)
        .join("-");
      return [normalizeHistorialReportDays(row.dias_semana), range, row.instalacion].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join("; ");
  return {
    personal_nombre: personal?.personal || historialRow.personal || "",
    personal_dni: personal?.dni || firstActivity.dni || "",
    empresa_nombre: company?.empresa || historialRow.empresa || "",
    empresa_razon_social: company?.razon_social || company?.empresa || historialRow.empresa || "",
    empresa_cif: company?.cif || "",
    firmante_nombre: company?.firmante_nombre || "",
    firmante_dni: company?.firmante_dni || "",
    firmante_cargo: company?.firmante_cargo || "",
    ciudad_firma: signCity || company?.ciudad_firma || "Oviedo",
    fecha_documento_corta: formatDisplayDate(documentDate),
    fecha_documento_larga: formatHistorialReportLongDate(documentDate),
    fecha_comienzo_corta: formatDisplayDate(startDate),
    fecha_comienzo_larga: formatHistorialReportLongDate(startDate),
    jornada_horas: formatReportNumber(historialRow.jornada),
    jornada_maxima_horas: formatReportNumber(historialRow.jornada_maxima),
    puesto,
    horarios,
    tipo_contratacion: historialRow.tipo_contratacion || "",
    contrato_laboral: historialRow.contrato_laboral_clave || "",
    movimiento: historialRow.movimiento || "",
  };
}

function applyHistorialReportTemplateText(text, placeholders) {
  return String(text || "")
    .replace(/\\n/g, "\n")
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => String(placeholders[key] ?? ""));
}

// Texto por defecto del correo según el tipo de documento de la plantilla.
// {{nombre}} se reemplaza por el nombre completo de la persona. Es editable en
// el panel antes de descargar.
const HISTORIAL_REPORT_EMAIL_TEXTS = {
  variacion:
    "{{saludo}} {{nombre}}\n\n" +
    "Se remite acuerdo de variación de su jornada laboral con la empresa Educación " +
    "Deportiva del Principado S.L según los términos que se detallan en el documento " +
    "adjunto para su firma.\n\n" +
    "Un saludo",
  llamamiento:
    "{{saludo}} {{nombre}}\n\n" +
    "Adjunto se remite llamamiento para incorporación en la empresa Educación Deportiva " +
    "del Principado S.L. según los términos que se detallan en el documento adjunto para " +
    "su aceptación y firma.\n\n" +
    "Un saludo",
  subrogacion:
    "{{saludo}} {{nombre}}\n\n" +
    "Se remite documentación relativa a la subrogación de su contrato con la empresa " +
    "Educación Deportiva del Principado S.L. según los términos que se detallan en el " +
    "documento adjunto para su firma.\n\n" +
    "Un saludo",
};
const HISTORIAL_REPORT_EMAIL_TEXT_DEFAULT =
  "{{saludo}} {{nombre}}\n\n" +
  "Adjunto se remite documentación de la empresa Educación Deportiva del Principado S.L. " +
  "según los términos que se detallan en el documento adjunto para su firma.\n\n" +
  "Un saludo";

// Saludo según el género de la persona (personal.genero: 'H' hombre, 'M' mujer).
// Si no se conoce, se usa una forma neutra editable.
function getHistorialReportGreeting(genero) {
  const value = String(genero || "").trim().toUpperCase();
  if (value === "H") return "Estimado";
  if (value === "M") return "Estimada";
  return "Estimado/a";
}

function buildHistorialReportEmailText() {
  const template = getHistorialReportTemplateById(historialReportGenerateTemplateSelect?.value || "");
  const type =
    template?.tipo_documento ||
    getHistorialReportExpectedDocumentType(historialReportDraft?.historialRow) ||
    "";
  const nombre =
    historialReportDraft?.personal?.personal || historialReportDraft?.historialRow?.personal || "";
  const saludo = getHistorialReportGreeting(historialReportDraft?.personal?.genero);
  const base = HISTORIAL_REPORT_EMAIL_TEXTS[type] || HISTORIAL_REPORT_EMAIL_TEXT_DEFAULT;
  return base
    .replace(/\{\{\s*saludo\s*\}\}/g, saludo)
    .replace(/\{\{\s*nombre\s*\}\}/g, nombre);
}

// Rellena el textarea del correo con el texto por defecto del tipo actual,
// salvo que el usuario ya lo haya editado a mano.
function syncHistorialReportEmailText({ force = false } = {}) {
  if (!historialReportEmailText) return;
  if (!force && historialReportEmailTextDirty) return;
  historialReportEmailText.value = buildHistorialReportEmailText();
  historialReportEmailTextDirty = false;
}

async function writeClipboardText(text) {
  const value = String(text ?? "");
  // Ambas vías exigen que el documento tenga el foco: si lo ha perdido (burbuja
  // de descargas, otra ventana...) se intenta recuperar antes de escribir.
  if (!document.hasFocus()) {
    try {
      window.focus();
    } catch (_error) {
      // Si el navegador no permite recuperarlo, se intenta copiar igualmente.
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_error) {
      // Cae al método clásico (execCommand) si la API asíncrona falla.
    }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    // execCommand devuelve true aunque no copie nada si el documento no tiene el
    // foco; sin él no se da la copia por buena para no informar en falso.
    const ok = document.execCommand("copy") && document.hasFocus();
    document.body.removeChild(textarea);
    return ok;
  } catch (_error) {
    return false;
  }
}

// Copia los valores al portapapeles uno tras otro, con una pausa entre cada uno
// para que el historial del portapapeles de Windows (Win+V) registre entradas
// separadas. El último valor queda como portapapeles actual.
async function copyHistorialReportClipboardSequence(parts) {
  const values = parts.map((value) => String(value ?? "").trim()).filter(Boolean);
  let copied = 0;
  for (let index = 0; index < values.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await writeClipboardText(values[index])) {
      copied += 1;
    }
    if (index < values.length - 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 450));
    }
  }
  return copied;
}

function closeHistorialReportPanel() {
  historialReportDraft = null;
  historialReportEmailTextDirty = false;
  if (historialReportTemplateWarning) {
    historialReportTemplateWarning.textContent = "";
    historialReportTemplateWarning.classList.remove("error");
  }
  historialReportPanel?.classList.add("hidden");
}

async function openHistorialReportPanel() {
  if (!historialDetailSnapshot?.id) {
    setStatus("Abre un periodo de historial laboral antes de generar el informe.", "error");
    return;
  }
  try {
    const supabase = await getSupabaseClient();
    await loadHistorialReportConfig({ force: !historialReportConfigLoaded });
    if (!historialReportTemplateRows.length) {
      throw new Error("No hay plantillas de informe activas.");
    }
    const startDate = historialDetailSnapshot.fecha_alta || getTodayIsoDate();
    const [activities, personal] = await Promise.all([
      fetchHistorialReportActivities(supabase, historialDetailSnapshot, startDate),
      fetchHistorialReportPersonal(supabase, historialDetailSnapshot.personal_id),
    ]);
    const company =
      historialReportCompanyRows.find((row) => String(row.empresa_id) === String(historialDetailSnapshot.empresa_id)) ||
      {};
    const template = getPreferredHistorialReportTemplate(historialDetailSnapshot);
    historialReportDraft = {
      historialRow: { ...historialDetailSnapshot },
      company,
      personal,
      activities,
      selectedActivityIds: new Set(activities.map(getHistorialReportActivityKey).filter(Boolean)),
    };
    renderHistorialReportGenerateTemplateSelect(template?.id || "");
    if (historialReportTitle) {
      historialReportTitle.textContent = `${historialDetailSnapshot.personal || "Periodo"} · ${formatDisplayDate(startDate)}`;
    }
    if (historialReportDocumentDate) historialReportDocumentDate.value = shiftIsoDate(startDate, -15) || getTodayIsoDate();
    if (historialReportStartDate) historialReportStartDate.value = startDate;
    if (historialReportSignCity) historialReportSignCity.value = company.ciudad_firma || "Oviedo";
    if (historialReportPersonSummary) historialReportPersonSummary.textContent = personal?.personal || historialDetailSnapshot.personal || "-";
    if (historialReportCompanySummary) historialReportCompanySummary.textContent = company.razon_social || company.empresa || historialDetailSnapshot.empresa || "-";
    renderHistorialReportActivities(activities);
    historialReportEmailTextDirty = false;
    syncHistorialReportEmailText({ force: true });
    validateHistorialReportTemplateType();
    historialReportPanel?.classList.remove("hidden");
  } catch (error) {
    setStatus(`No se pudo preparar el informe: ${formatSupabaseErrorDetails(error)}`, "error");
  }
}

async function refreshHistorialReportDraftActivities() {
  if (!historialReportDraft?.historialRow) return;
  try {
    const supabase = await getSupabaseClient();
    const startDate = historialReportStartDate?.value || historialReportDraft.historialRow.fecha_alta || getTodayIsoDate();
    historialReportDraft.activities = await fetchHistorialReportActivities(
      supabase,
      historialReportDraft.historialRow,
      startDate
    );
    historialReportDraft.selectedActivityIds = new Set(
      historialReportDraft.activities.map(getHistorialReportActivityKey).filter(Boolean)
    );
    if (historialReportDocumentDate) historialReportDocumentDate.value = shiftIsoDate(startDate, -15) || getTodayIsoDate();
    renderHistorialReportActivities(historialReportDraft.activities);
    validateHistorialReportTemplateType();
  } catch (error) {
    setStatus(`No se pudieron actualizar las actividades del informe: ${formatSupabaseErrorDetails(error)}`, "error");
  }
}

async function loadImageAsDataUrl(url) {
  const normalized = String(url || "").trim();
  if (!normalized) return null;
  const resolvedUrl = normalized.startsWith("http") || normalized.startsWith("data:image/")
    ? normalized
    : new URL(normalized, window.location.href).href;
  if (normalized.startsWith("data:image/")) return normalized;
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (_error) {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = resolvedUrl;
  });
}

async function exportHistorialLaboralReportPdf() {
  if (!historialReportDraft?.historialRow) {
    setStatus("Prepara primero el informe desde un periodo de historial laboral.", "error");
    return;
  }
  const template = getHistorialReportTemplateById(historialReportGenerateTemplateSelect?.value || "");
  if (!template) {
    setStatus("Selecciona una plantilla para generar el informe.", "error");
    return;
  }
  validateHistorialReportTemplateType({ notify: true });
  try {
    historialReportDownloadButton?.setAttribute("disabled", "true");
    const { jsPDF } = await getJsPdfClient();
    const documentDate = historialReportDocumentDate?.value || getTodayIsoDate();
    const startDate = historialReportStartDate?.value || historialReportDraft.historialRow.fecha_alta || documentDate;
    const signCity = String(historialReportSignCity?.value || "").trim() || "Oviedo";
    const activities = getSelectedHistorialReportActivities();
    const placeholders = buildHistorialReportPlaceholders({
      ...historialReportDraft,
      activities,
      documentDate,
      startDate,
      signCity,
    });
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const bottomMargin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 22;

    const ensureSpace = (height = 8) => {
      if (y + height <= pageHeight - bottomMargin) return;
      doc.addPage();
      y = margin;
    };
    const addWrappedText = (text, options = {}) => {
      const resolved = applyHistorialReportTemplateText(text, placeholders).trim();
      if (!resolved) return;
      const fontSize = options.fontSize || 10;
      const lineHeight = options.lineHeight || 5;
      const indent = options.indent || 0;
      const textX = margin + indent;
      const wrapWidth = contentWidth - indent;
      doc.setFont("helvetica", options.bold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      resolved.split(/\n/).forEach((paragraph) => {
        const lines = doc.splitTextToSize(paragraph || " ", wrapWidth);
        ensureSpace(lines.length * lineHeight + 2);
        doc.text(lines, textX, y);
        y += lines.length * lineHeight + (paragraph ? 2 : 1);
      });
      y += options.after ?? 2;
    };

    const logoDataUrl =
      historialReportDraft.company?.logo_data_url ||
      (await loadImageAsDataUrl(historialReportDraft.company?.logo_url));
    const signatureDataUrl = historialReportDraft.company?.firma_data_url || null;
    // --- Cabecera: logo centrado y, debajo, la fecha alineada a la derecha ---
    const headerLogoWidth = 34;
    const headerLogoHeight = 18;
    if (logoDataUrl) {
      doc.addImage(
        logoDataUrl,
        "PNG",
        (pageWidth - headerLogoWidth) / 2,
        y,
        headerLogoWidth,
        headerLogoHeight,
        undefined,
        "FAST"
      );
      y += headerLogoHeight + 6;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`En ${signCity} a ${formatHistorialReportLongDate(documentDate)}`, pageWidth - margin, y, {
      align: "right",
    });
    y += 12;

    addWrappedText(template.titulo || template.nombre || "", { bold: true, fontSize: 13, lineHeight: 6, after: 4 });
    ["saludo", "texto_intro", "texto_movimiento", "texto_condiciones", "texto_legal"].forEach((field) => {
      addWrappedText(template[field], { after: 1.5 });
      if (field === "texto_movimiento" && template.incluir_tabla_actividades) {
        drawHistorialReportActivitiesTable(doc, {
          rows: activities,
          title: applyHistorialReportTemplateText(template.tabla_actividades_titulo || "Horario", placeholders),
          margin,
          pageWidth,
          pageHeight,
          bottomMargin,
          getY: () => y,
          setY: (nextY) => {
            y = nextY;
          },
        });
      }
    });

    // --- Firma de la empresa (centrada en la parte central de la hoja) ---
    ensureSpace(44);
    const centerX = pageWidth / 2;
    const companySignatureWidth = 42;
    const companySignatureHeight = 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Firma de la empresa", centerX, y, { align: "center" });
    y += 4;
    if (signatureDataUrl) {
      try {
        doc.addImage(
          signatureDataUrl,
          "PNG",
          centerX - companySignatureWidth / 2,
          y,
          companySignatureWidth,
          companySignatureHeight,
          undefined,
          "FAST"
        );
      } catch (_error) {
        // Si la firma guardada no es una imagen válida, se deja el hueco.
      }
    }
    y += companySignatureHeight + 4;
    doc.setFont("helvetica", "bold");
    doc.text(placeholders.firmante_nombre || placeholders.empresa_razon_social || "", centerX, y, {
      align: "center",
      maxWidth: contentWidth,
    });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(placeholders.firmante_cargo || "", centerX, y, { align: "center", maxWidth: contentWidth });
    y += 6;

    // --- Opciones de respuesta (indentadas ~3 cm, debajo de la firma de empresa) ---
    if (template.incluir_opciones_respuesta && template.opciones_respuesta_texto) {
      y += 6;
      addWrappedText(template.opciones_respuesta_texto, { fontSize: 10, lineHeight: 5, indent: 30, after: 2 });
    }

    // --- Firma del personal (a la izquierda, debajo de las opciones) ---
    y += 8;
    ensureSpace(24);
    const workerReceipt = applyHistorialReportTemplateText(
      template.texto_recibido || "RECIBIDO\n\nFdo.: {{personal_nombre}}\n{{personal_dni}}",
      placeholders
    );
    const workerReceiptLines = doc.splitTextToSize(workerReceipt, contentWidth / 2 - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(workerReceiptLines, margin, y);
    y += workerReceiptLines.length * 5;

    // --- Pie de observaciones de la plantilla (justo debajo del DNI, a la izquierda) ---
    if (template.pie_observaciones) {
      y += 2;
      addWrappedText(template.pie_observaciones, { fontSize: 8, lineHeight: 4, after: 2 });
    }

    // Se descartan los repetidos: email_pie y web_pie pueden traer el mismo valor.
    const footerParts = [
      ...new Set(
        [
          historialReportDraft.company?.direccion_pie,
          historialReportDraft.company?.cif,
          historialReportDraft.company?.telefono_pie ? `Tel. ${historialReportDraft.company.telefono_pie}` : "",
          historialReportDraft.company?.email_pie,
          historialReportDraft.company?.web_pie,
        ]
          .map((part) => String(part || "").trim())
          .filter(Boolean)
      ),
    ];
    if (footerParts.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(doc.splitTextToSize(footerParts.join(" · "), contentWidth), pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
    }

    const movementName =
      historialReportDraft.historialRow?.movimiento ||
      getHistorialReportTypeLabel(template.tipo_documento) ||
      template.codigo ||
      "informe laboral";
    const filename = [
      sanitizeHistorialReportFilename(placeholders.personal_nombre),
      sanitizeHistorialReportFilename(movementName),
      getTodayIsoDate(),
    ]
      .filter(Boolean)
      .join(" - ");
    // Copia secuencial al portapapeles en orden inverso (texto, nombre, correo)
    // para que el correo quede como portapapeles actual (pegado directo) y el
    // resto quede en el historial (Win+V) al enviar el PDF desde Adobe Acrobat.
    //
    // Va ANTES de doc.save(): la descarga abre la burbuja de descargas del
    // navegador, que quita el foco al documento, y la API de portapapeles
    // rechaza cualquier escritura mientras el documento no lo tenga.
    const email = historialReportDraft.personal?.email || "";
    const nombreCompleto = placeholders.personal_nombre || "";
    const emailText = historialReportEmailText?.value || buildHistorialReportEmailText();
    const clipboardParts = [emailText, nombreCompleto, email];
    const expectedCount = clipboardParts.filter((part) => String(part ?? "").trim()).length;
    const copiedCount = await copyHistorialReportClipboardSequence(clipboardParts);

    doc.save(`${filename || "informe laboral"}.pdf`);

    const missingConfig = !placeholders.firmante_nombre || !(historialReportDraft.company?.logo_data_url || historialReportDraft.company?.logo_url);
    let clipboardNote = " (no se pudo copiar al portapapeles)";
    if (copiedCount && copiedCount < expectedCount) {
      clipboardNote = ` (solo se copiaron ${copiedCount} de ${expectedCount} datos al portapapeles)`;
    } else if (copiedCount) {
      clipboardNote = email
        ? " (correo, nombre y texto copiados al portapapeles)"
        : " (copiados nombre y texto al portapapeles; esta persona no tiene correo)";
    }
    setStatus(
      (missingConfig
        ? "Informe generado. Revisa la configuracion documental de empresa: falta firmante o logo."
        : "Informe laboral generado.") + clipboardNote,
      missingConfig ? "warning" : "success"
    );
  } catch (error) {
    setStatus(`No se pudo generar el PDF: ${error?.message ?? "error desconocido"}`, "error");
  } finally {
    historialReportDownloadButton?.removeAttribute("disabled");
  }
}

function drawHistorialReportActivitiesTable(doc, options) {
  const { rows, title, margin, pageWidth, pageHeight, bottomMargin, getY, setY } = options;
  if (!rows.length) return;
  let y = getY() + 1;
  const columns = [
    { label: "Horario", key: "range", width: 23 },
    { label: "Puesto", key: "puesto", width: 32 },
    { label: "Instalacion", key: "instalacion", width: 38 },
    { label: "Dias", key: "dias", width: 22 },
    { label: "H. Sem.", key: "horas", width: 18 },
    { label: "Inicio", key: "fecha_inicio", width: 20 },
    { label: "Fin", key: "fecha_fin", width: 21 },
  ];
  const tableWidth = columns.reduce((total, column) => total + column.width, 0);
  const left = Math.max(margin, (pageWidth - tableWidth) / 2);
  const rowLineHeight = 3.8;
  const headerHeight = 7;
  const ensureSpace = (height) => {
    if (y + height <= pageHeight - bottomMargin) return;
    doc.addPage();
    y = margin;
  };
  const drawHeader = () => {
    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title || "Horario", left, y);
    y += 5;
    doc.setFontSize(7);
    let x = left;
    columns.forEach((column) => {
      doc.setFillColor(232, 236, 241);
      doc.setDrawColor(150, 150, 150);
      doc.rect(x, y, column.width, headerHeight, "FD");
      doc.text(column.label, x + 1.5, y + 4.5);
      x += column.width;
    });
    y += headerHeight;
  };
  drawHeader();
  rows.forEach((row) => {
    const values = {
      range: [formatHourValue(row.hora_inicio).slice(0, 5), formatHourValue(row.hora_fin).slice(0, 5)]
        .filter(Boolean)
        .join("-"),
      puesto: row.puesto || "",
      instalacion: row.instalacion || "",
      dias: normalizeHistorialReportDays(row.dias_semana),
      horas: getHistorialReportActivityWeeklyHours(row),
      fecha_inicio: formatDisplayDate(row.fecha_inicio),
      fecha_fin: row.fecha_fin ? formatDisplayDate(row.fecha_fin) : "",
    };
    const cellLines = columns.map((column) => doc.splitTextToSize(String(values[column.key] || ""), column.width - 3));
    const rowHeight = Math.max(7, ...cellLines.map((lines) => lines.length * rowLineHeight + 3));
    if (y + rowHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
    let x = left;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setDrawColor(190, 190, 190);
    columns.forEach((column, index) => {
      doc.rect(x, y, column.width, rowHeight);
      doc.text(cellLines[index], x + 1.5, y + 4.5, { maxWidth: column.width - 3 });
      x += column.width;
    });
    y += rowHeight;
  });
  setY(y + 5);
}

function normalizeHistorialImportHeader(value) {
  return normalizeCsvHeader(value);
}

function parseHistorialImportBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined || value === "") return false;
  const normalized = normalizeSearchText(value);
  if (["true", "t", "1", "-1", "si", "s", "yes", "y", "verdadero"].includes(normalized)) {
    return true;
  }
  if (["false", "f", "0", "no", "n", "falso"].includes(normalized)) {
    return false;
  }
  throw new Error(`Valor booleano no reconocido: ${value}`);
}

function parseHistorialImportDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return excelSerialDateToIso(value);
  const normalized = normalizeImportedDate(value);
  if (!normalized) throw new Error(`Fecha no reconocida: ${value}`);
  return normalized;
}

function normalizeHistorialImportValue(column, value) {
  if (HISTORIAL_IMPORT_BOOLEAN_FIELDS.has(column)) return parseHistorialImportBoolean(value);
  if (HISTORIAL_IMPORT_DATE_FIELDS.has(column)) return parseHistorialImportDate(value);
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (HISTORIAL_IMPORT_INTEGER_FIELDS.has(column)) {
    const parsed = Number.parseInt(text.replace(",", "."), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (HISTORIAL_IMPORT_NUMERIC_FIELDS.has(column)) {
    const parsed = Number(text.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (HISTORIAL_IMPORT_TEXT_FIELDS.has(column)) return text;
  return value;
}

function normalizeHistorialImportRow(sourceRow, targetHeaders, rowNumber) {
  const row = {};
  targetHeaders.forEach((column, index) => {
    if (column) row[column] = normalizeHistorialImportValue(column, sourceRow[index]);
  });
  if (!row.id) throw new Error(`La fila ${rowNumber} no tiene ID.`);
  if (!row.personal_id) throw new Error(`La fila ${rowNumber} no tiene personal_id.`);
  return row;
}

function validateHistorialImportRows(rows) {
  const seenIds = new Set();
  const duplicateIds = new Set();
  rows.forEach((row) => {
    const id = String(row.id ?? "").trim();
    if (!id) return;
    if (seenIds.has(id)) duplicateIds.add(id);
    seenIds.add(id);
  });
  if (duplicateIds.size) {
    throw new Error(`El Excel contiene IDs repetidos: ${Array.from(duplicateIds).join(", ")}.`);
  }
}

async function parseHistorialExcelFile(file) {
  const xlsxModule = await getXlsxClient();
  const XLSX = xlsxModule.default || xlsxModule;
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames.includes("tbl_vida_laboral")
    ? "tbl_vida_laboral"
    : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) throw new Error("El Excel no contiene hojas.");

  const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    defval: null,
  });
  const headerIndex = sheetRows.findIndex((row) => row.some((cell) => String(cell ?? "").trim()));
  if (headerIndex < 0) throw new Error("El Excel no contiene cabeceras.");

  const sourceHeaders = sheetRows[headerIndex].map(normalizeHistorialImportHeader);
  const unmappedHeaders = sourceHeaders.filter((header) => header && !HISTORIAL_IMPORT_HEADER_MAP[header]);
  if (unmappedHeaders.length) {
    throw new Error(`Columnas no reconocidas: ${Array.from(new Set(unmappedHeaders)).join(", ")}.`);
  }
  const targetHeaders = sourceHeaders.map((header) => HISTORIAL_IMPORT_HEADER_MAP[header] || "");
  const rows = sheetRows
    .slice(headerIndex + 1)
    .map((sourceRow, index) => ({ sourceRow, rowNumber: headerIndex + index + 2 }))
    .filter(({ sourceRow }) => sourceRow.some((cell) => cell !== null && String(cell).trim() !== ""))
    .map(({ sourceRow, rowNumber }) => normalizeHistorialImportRow(sourceRow, targetHeaders, rowNumber));

  validateHistorialImportRows(rows);
  return rows;
}

function isHistorialImportEmptyValue(value) {
  return value === null || value === undefined || (typeof value === "string" && !value.trim());
}

function normalizeHistorialImportComparable(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(Number(value));
  const text = String(value).trim();
  if (/^-?\d+(?:[.,]\d+)?$/.test(text)) {
    return String(Number(text.replace(",", ".")));
  }
  return text;
}

function getHistorialImportFieldLabel(fieldKey) {
  const field = HISTORIAL_FORM_FIELDS.find((item) => item.key === fieldKey);
  if (field) return field.label;
  return fieldKey.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("es"));
}

function getHistorialImportChangedColumns(existingRow, importRow) {
  return HISTORIAL_IMPORT_COLUMNS
    .filter((column) => column !== "id")
    .filter((column) => {
      if (!(column in importRow)) return false;
      return normalizeHistorialImportComparable(existingRow?.[column]) !== normalizeHistorialImportComparable(importRow[column]);
    })
    .map((column) => ({
      column,
      label: getHistorialImportFieldLabel(column),
      value: normalizeHistorialImportComparable(importRow[column]),
      kind: isHistorialImportEmptyValue(existingRow?.[column]) ? "complete" : "update",
    }));
}

async function fetchHistorialImportContext(importRows) {
  const supabase = await getSupabaseClient();
  const historialIds = Array.from(new Set(importRows.map((row) => row.id).filter(Boolean)));
  const personalIds = Array.from(new Set(importRows.map((row) => row.personal_id).filter(Boolean)));
  const existingRows = [];
  const personalRows = [];

  for (let index = 0; index < historialIds.length; index += 500) {
    const chunk = historialIds.slice(index, index + 500);
    const { data, error } = await supabase
      .from(HISTORIAL_TABLE)
      .select(HISTORIAL_IMPORT_SELECT_COLUMNS)
      .in("id", chunk);
    if (error) throw error;
    existingRows.push(...(data || []));
  }

  for (let index = 0; index < personalIds.length; index += 500) {
    const chunk = personalIds.slice(index, index + 500);
    const { data, error } = await supabase
      .from("personal")
      .select("id,personal")
      .in("id", chunk);
    if (error) throw error;
    personalRows.push(...(data || []));
  }

  return {
    existingRows,
    personalRows,
  };
}

function buildHistorialImportPreviewRows(importRows, existingRows, personalRows) {
  const byId = new Map(existingRows.map((row) => [String(row.id), row]));
  const personalById = new Map(personalRows.map((row) => [String(row.id), row.personal || `ID ${row.id}`]));
  return importRows.map((row, index) => {
    const existingRow = byId.get(String(row.id)) || null;
    const changes = existingRow
      ? getHistorialImportChangedColumns(existingRow, row)
      : HISTORIAL_IMPORT_COLUMNS
          .filter((column) => column !== "id" && !isHistorialImportEmptyValue(row[column]))
          .slice(0, 10)
          .map((column) => ({
            column,
            label: getHistorialImportFieldLabel(column),
            value: normalizeHistorialImportComparable(row[column]),
          }));
    const hasChanges = !existingRow || changes.length > 0;
    return {
      previewId: `historial-import-${index}`,
      row,
      personalLabel: personalById.get(String(row.personal_id)) || `ID ${row.personal_id}`,
      action: existingRow ? "update_id" : "insert",
      selected: hasChanges,
      disabled: !hasChanges,
      changes,
    };
  });
}

function getHistorialImportActionLabel(item) {
  if (item.action === "insert") return "Alta nueva";
  if (item.action === "update_id") return "Completar/actualizar";
  return "Sin cambios";
}

function renderHistorialImportChanges(item) {
  if (!item.changes.length) return "No hay diferencias con la tabla.";
  const visibleChanges = item.changes.slice(0, 6);
  const suffix = item.changes.length > visibleChanges.length
    ? ` +${item.changes.length - visibleChanges.length} mas`
    : "";
  return visibleChanges.map((change) => `${change.label}: ${change.value}`).join(" · ") + suffix;
}

function updateHistorialImportSelectionUi() {
  const selectableRows = pendingHistorialImportRows.filter((item) => !item.disabled);
  const selectedRows = selectableRows.filter((item) => item.selected);
  if (historialImportSelectedCount) {
    historialImportSelectedCount.textContent = `${selectedRows.length} seleccionada${
      selectedRows.length === 1 ? "" : "s"
    }`;
  }
  if (historialImportSelectAll) {
    historialImportSelectAll.checked = selectableRows.length > 0 && selectedRows.length === selectableRows.length;
    historialImportSelectAll.indeterminate = selectedRows.length > 0 && selectedRows.length < selectableRows.length;
    historialImportSelectAll.disabled = selectableRows.length === 0;
  }
  if (historialImportApplyButton) historialImportApplyButton.disabled = selectedRows.length === 0;
}

function renderHistorialImportPreview() {
  if (historialImportFileName) historialImportFileName.textContent = pendingHistorialImportFileName || "-";
  if (historialImportTotalCount) {
    historialImportTotalCount.textContent = `${pendingHistorialImportRows.length} fila${
      pendingHistorialImportRows.length === 1 ? "" : "s"
    }`;
  }
  if (!historialImportPreviewTableBody) return;
  historialImportPreviewTableBody.innerHTML = pendingHistorialImportRows.length
    ? pendingHistorialImportRows
        .map((item) => {
          const row = item.row;
          return `
            <tr>
              <td>
                <input
                  type="checkbox"
                  data-historial-import-select="${escapeHtml(item.previewId)}"
                  ${item.selected ? "checked" : ""}
                  ${item.disabled ? "disabled" : ""}
                  aria-label="Aplicar importacion de periodo ${escapeHtml(row.id)}"
                />
              </td>
              <td>${escapeHtml(getHistorialImportActionLabel(item))}</td>
              <td>${escapeHtml(row.id || "")}</td>
              <td>${escapeHtml(item.personalLabel || "")}</td>
              <td>${escapeHtml(formatDisplayDate(row.fecha_alta))}</td>
              <td>${escapeHtml(formatDisplayDate(row.fecha_baja))}</td>
              <td>${escapeHtml(renderHistorialImportChanges(item))}</td>
            </tr>
          `;
        })
        .join("")
    : '<tr><td colspan="7" class="empty-state">Selecciona un Excel para revisar la carga.</td></tr>';
  updateHistorialImportSelectionUi();
}

function openHistorialImportPanel() {
  historialImportPanel?.classList.remove("hidden");
  updateHistorialImportSelectionUi();
}

function closeHistorialImportPanel() {
  historialImportPanel?.classList.add("hidden");
}

function toggleAllHistorialImportRows(checked) {
  pendingHistorialImportRows.forEach((item) => {
    if (!item.disabled) item.selected = checked;
  });
  renderHistorialImportPreview();
}

function toggleHistorialImportRow(previewId, checked) {
  const item = pendingHistorialImportRows.find((row) => row.previewId === previewId);
  if (!item || item.disabled) return;
  item.selected = checked;
  updateHistorialImportSelectionUi();
}

function buildHistorialImportStatus(summary) {
  const inserted = Number(summary?.filas_insertadas ?? 0);
  const updated = Number(summary?.filas_actualizadas ?? 0);
  const existing = Number(summary?.existentes_por_id ?? 0);
  return `Importacion completada: ${inserted} altas nuevas. ${updated} actualizadas. ${existing} existentes por ID.`;
}

async function applySelectedHistorialImportRows() {
  const selectedItems = pendingHistorialImportRows.filter((item) => item.selected && !item.disabled);
  const rows = selectedItems.map((item) => ({ ...item.row }));
  if (!rows.length) {
    setStatus("No hay filas seleccionadas para importar.", "error");
    return;
  }
  if (rows.some((row) => !row.id || !row.personal_id)) {
    setStatus("Hay filas seleccionadas sin ID o personal_id. Revisa la importacion antes de aplicar.", "error");
    return;
  }

  try {
    historialImportApplyButton?.setAttribute("disabled", "true");
    setStatus(`Importando ${rows.length} periodo${rows.length === 1 ? "" : "s"} seleccionado${rows.length === 1 ? "" : "s"}...`);
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc("import_coordinacion_historial_laboral", { p_rows: rows });
    if (error) throw error;
    const summary = Array.isArray(data) ? data[0] : data;
    const processedRows = Number(summary?.filas_origen ?? 0);
    if (!summary || !Number.isFinite(processedRows) || processedRows <= 0) {
      throw new Error("Supabase no confirmo filas procesadas. Comprueba que la RPC import_coordinacion_historial_laboral esta aplicada.");
    }
    if (processedRows !== rows.length) {
      throw new Error(`Supabase proceso ${processedRows} de ${rows.length} filas enviadas. Recarga la pagina y vuelve a intentarlo.`);
    }

    closeHistorialImportPanel();
    pendingHistorialImportRows = [];
    pendingHistorialImportFileName = "";
    await loadHistorial();
    setStatus(`${buildHistorialImportStatus(summary)} Filas enviadas: ${rows.length}.`, "success");
  } catch (error) {
    setStatus(formatSupabaseErrorDetails(error) || "No se pudo aplicar la importacion seleccionada.", "error");
  } finally {
    historialImportApplyButton?.removeAttribute("disabled");
    updateHistorialImportSelectionUi();
  }
}

async function importHistorialExcelFile(file) {
  if (!file) return;
  try {
    await ensurePrivateSession();
    historialImportExcelButton?.setAttribute("disabled", "true");
    setStatus(`Leyendo ${file.name}...`);
    const rows = await parseHistorialExcelFile(file);
    if (!rows.length) throw new Error("El Excel no contiene filas de historial laboral.");
    setStatus(`Preparando revision de ${rows.length} fila${rows.length === 1 ? "" : "s"}...`);
    const context = await fetchHistorialImportContext(rows);
    pendingHistorialImportRows = buildHistorialImportPreviewRows(rows, context.existingRows, context.personalRows);
    pendingHistorialImportFileName = file.name;
    renderHistorialImportPreview();
    openHistorialImportPanel();
    const selectedRows = pendingHistorialImportRows.filter((item) => item.selected).length;
    setStatus(
      `Revision preparada: ${selectedRows} fila${selectedRows === 1 ? "" : "s"} marcada${selectedRows === 1 ? "" : "s"} para aplicar.`,
      "success"
    );
  } catch (error) {
    setStatus(error?.message || "No se pudo importar el Excel de historial laboral.", "error");
  } finally {
    historialImportExcelButton?.removeAttribute("disabled");
    if (historialImportExcelInput) historialImportExcelInput.value = "";
  }
}

function formatHistorialJornada(row) {
  if (row.jornada == null) {
    return "";
  }
  const jornada = Number(row.jornada);
  if (!Number.isFinite(jornada)) {
    return String(row.jornada);
  }
  const jornadaLabel = jornada.toLocaleString("es-ES", { maximumFractionDigits: 2 });
  const maxima = Number(row.jornada_maxima);
  if (Number.isFinite(maxima) && maxima > 0) {
    return `${jornadaLabel} / ${maxima.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`;
  }
  return jornadaLabel;
}

function populateHistorialTipoContratacionFilter() {
  if (!historialFilterTipoContratacion) {
    return;
  }
  const options = historialRelationOptionsCache.tipo_contratacion_id || [];
  if (!options.length) {
    return;
  }
  const previous = historialFilterTipoContratacion.value;
  historialFilterTipoContratacion.innerHTML =
    '<option value="">Todos</option>' +
    options
      .map(
        (option) =>
          `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
      )
      .join("");
  historialFilterTipoContratacion.value = previous;
}

function getSortableHistorialValue(row, field) {
  switch (field) {
    case "personal":
      return String(row.personal ?? (row.personal_id != null ? `ID ${row.personal_id}` : "")).trim();
    case "empresa":
      return String(row.empresa ?? "").trim();
    case "fecha_alta":
      return String(row.fecha_alta ?? "");
    case "fecha_baja":
      return String(row.fecha_baja ?? "");
    case "dias":
      return Number(row.dias_periodo ?? NaN);
    case "jornada":
      return Number(row.jornada ?? NaN);
    case "puesto":
      return String(row.puesto || row.puesto_texto || "").trim();
    case "contrato":
      return String(row.contrato_laboral_clave ?? "").trim();
    case "tipo_contratacion":
      return String(row.tipo_contratacion ?? "").trim();
    case "motivo_baja":
      return String(row.motivo_baja ?? "").trim();
    case "activo":
      return row.activo ? "1" : "0";
    case "enviado":
      return row.enviado ? "1" : "0";
    case "gestionado":
      return row.gestionado ? "1" : "0";
    case "tramitado":
      return row.tramitado ? "1" : "0";
    default:
      return String(row[field] ?? "").trim();
  }
}

function compareHistorialValues(left, right, field) {
  const leftValue = getSortableHistorialValue(left, field);
  const rightValue = getSortableHistorialValue(right, field);

  if (typeof leftValue === "number" || typeof rightValue === "number") {
    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);
    const leftEmpty = !Number.isFinite(leftNumber);
    const rightEmpty = !Number.isFinite(rightNumber);
    if (leftEmpty && rightEmpty) return 0;
    // Vacío = menor (orden natural): primero en ascendente, último en descendente.
    if (leftEmpty) return -1;
    if (rightEmpty) return 1;
    return leftNumber - rightNumber;
  }

  return String(leftValue).localeCompare(String(rightValue), "es", {
    numeric: true,
    sensitivity: "base",
  });
}

function sortHistorialRows(rows) {
  const directionMultiplier = currentHistorialSort.direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const result = compareHistorialValues(left, right, currentHistorialSort.field);
    if (result !== 0) {
      return result * directionMultiplier;
    }
    // Desempate estable: fecha de alta descendente y luego id descendente.
    const byDate = compareHistorialValues(left, right, "fecha_alta");
    if (byDate !== 0) {
      return -byDate;
    }
    return String(right.id ?? "").localeCompare(String(left.id ?? ""), "es", { numeric: true });
  });
}

function syncHistorialSortButtons() {
  syncSortButtonsBySelector("[data-historial-sort-field]", "historialSortField", currentHistorialSort);
}

// Trae las actividades de la persona del periodo cuyo intervalo de fechas se
// solapa con el alta/baja del historial (la baja o el fin abierto se tratan
// como intervalos abiertos). Reutiliza la vista y columnas del informe.
async function fetchHistorialRowActivities(supabase, historialRow) {
  if (!historialRow?.personal_id) return [];
  const overlapStart = historialRow.fecha_alta || null;
  const overlapEnd = historialRow.fecha_baja || null;
  let query = supabase
    .from("actividades_detalle")
    .select(HISTORIAL_REPORT_ACTIVITY_SELECT)
    .eq("personal_id", historialRow.personal_id)
    .order("fecha_inicio", { ascending: true })
    .order("hora_inicio", { ascending: true });
  if (overlapStart) {
    query = query.or(`fecha_fin.is.null,fecha_fin.gte.${overlapStart}`);
  }
  if (overlapEnd) {
    query = query.lte("fecha_inicio", overlapEnd);
  }
  const { data, error } = await query.limit(500);
  if (error) throw error;
  return data || [];
}

// Carga perezosa (con caché) de las actividades solapadas de un periodo al
// desplegar su fila; re-renderiza cuando termina si sigue desplegado.
async function ensureHistorialActivitiesLoaded(historialId) {
  const key = String(historialId);
  const existing = historialActivitiesCache.get(key);
  if (existing && (existing.status === "loading" || existing.status === "loaded")) {
    return;
  }
  const row = historialRows.find((item) => String(item.id) === key);
  if (!row) return;
  historialActivitiesCache.set(key, { status: "loading", rows: [] });
  renderHistorialTable(historialRows);
  try {
    const supabase = await getSupabaseClient();
    const activities = await fetchHistorialRowActivities(supabase, row);
    historialActivitiesCache.set(key, { status: "loaded", rows: activities });
  } catch (error) {
    historialActivitiesCache.set(key, { status: "error", rows: [] });
  }
  if (expandedHistorialIds.has(key)) {
    renderHistorialTable(historialRows);
  }
}

function renderHistorialActivitiesPanel(historialId) {
  const entry = historialActivitiesCache.get(String(historialId));
  if (!entry || entry.status === "loading") {
    return '<div class="historial-activities-panel"><p class="muted-text">Cargando actividades…</p></div>';
  }
  if (entry.status === "error") {
    return '<div class="historial-activities-panel"><p class="empty-state">No se pudieron cargar las actividades.</p></div>';
  }
  const rows = entry.rows || [];
  if (!rows.length) {
    return '<div class="historial-activities-panel"><p class="empty-state">No hay actividades solapadas con este periodo.</p></div>';
  }
  const body = rows
    .map((act) => {
      const fechas = `${formatDisplayDate(act.fecha_inicio)} – ${
        act.fecha_fin ? formatDisplayDate(act.fecha_fin) : "…"
      }`;
      const horario = `${formatHourValue(act.hora_inicio).slice(0, 5)} - ${formatHourValue(
        act.hora_fin
      ).slice(0, 5)}`;
      const dias = normalizeHistorialReportDays(act.dias_semana);
      return `<tr>
          <td>${escapeHtml(act.instalacion || "")}</td>
          <td>${escapeHtml(act.puesto || "")}</td>
          <td>${escapeHtml(fechas)}</td>
          <td>${escapeHtml(horario)}${dias ? ` <span class="muted-text">(${escapeHtml(dias)})</span>` : ""}</td>
        </tr>`;
    })
    .join("");
  return `<div class="historial-activities-panel">
      <table class="historial-activities-table">
        <thead>
          <tr><th>Instalación</th><th>Puesto</th><th>Fechas</th><th>Horario</th></tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

function renderHistorialTable(rows) {
  if (!historialTableBody) {
    return;
  }

  const sortedRows = sortHistorialRows(rows);
  historialBulkSelectHeader?.classList.toggle("hidden", !historialBulkSelectionMode);
  const extraColumnCount = historialBulkSelectionMode ? 1 : 0;

  if (!sortedRows.length) {
    historialTableBody.innerHTML =
      `<tr><td colspan="${14 + extraColumnCount}" class="empty-state">No hay periodos que coincidan con los filtros.</td></tr>`;
    syncHistorialSortButtons();
    syncHistorialBulkSelectionUi();
    return;
  }

  const totalColumnCount = 14 + extraColumnCount;
  historialTableBody.innerHTML = sortedRows
    .map((row) => {
      const cells = [
        row.personal || (row.personal_id != null ? `ID ${row.personal_id}` : ""),
        row.tipo_contratacion || "",
        formatDisplayDate(row.fecha_alta),
        formatDisplayDate(row.fecha_baja),
        row.dias_periodo ?? "",
        formatHistorialJornada(row),
        row.enviado ? "Sí" : "",
        row.gestionado ? "Sí" : "",
        row.contrato_laboral_clave || "",
        row.tramitado ? "Sí" : "",
        row.motivo_baja || "",
        row.activo ? "Sí" : "",
      ];
      const dataCells = cells
        .map((value) => `<td>${escapeHtml(String(value ?? ""))}</td>`)
        .join("");
      const selectionCell = historialBulkSelectionMode
        ? `<td class="records-row-select"><input type="checkbox" data-historial-bulk-select="${escapeHtml(row.id)}" aria-label="Seleccionar periodo ${escapeHtml(row.id)}" ${selectedHistorialBulkIds.has(String(row.id)) ? "checked" : ""} /></td>`
        : "";
      const actionCell = `<td class="records-row-actions"><button type="button" class="compact-button" data-historial-edit="${escapeHtml(
        row.id
      )}" title="Editar periodo" aria-label="Editar periodo">&#9998;</button></td>`;
      const isExpanded = expandedHistorialIds.has(String(row.id));
      const toggleCell = `<td class="records-row-actions historial-toggle-cell"><button type="button" class="secondary-button historial-toggle-button" data-historial-toggle="${escapeHtml(
        row.id
      )}" aria-expanded="${isExpanded}" title="${
        isExpanded ? "Plegar actividades" : "Desplegar actividades"
      }">${isExpanded ? "&#9652;" : "&#9662;"}</button></td>`;
      const selectedClass = selectedHistorialBulkIds.has(String(row.id)) ? "record-row-bulk-selected" : "";
      const detailRow = isExpanded
        ? `<tr class="historial-activities-row"><td colspan="${totalColumnCount}">${renderHistorialActivitiesPanel(
            row.id
          )}</td></tr>`
        : "";
      return `<tr data-historial-id="${escapeHtml(row.id)}" class="${selectedClass}">${toggleCell}${selectionCell}${dataCells}${actionCell}</tr>${detailRow}`;
    })
    .join("");
  syncHistorialSortButtons();
  syncHistorialBulkSelectionUi();
}

async function loadHistorial() {
  if (historialSummary) {
    historialSummary.textContent = "Cargando historial laboral...";
  }
  // Cada recarga cambia el conjunto de periodos: descartamos despliegues y
  // caché de actividades para no arrastrar filas que ya no existen.
  expandedHistorialIds.clear();
  historialActivitiesCache.clear();
  if (historialTableBody) {
    historialTableBody.innerHTML =
      '<tr><td colspan="14" class="empty-state">Cargando historial laboral...</td></tr>';
  }

  try {
    const supabase = await getSupabaseClient();
    const personalOptionsPromise = loadHistorialPersonalOptions(supabase);
    const relationOptionsPromise = loadHistorialRelationOptions();
    const reportConfigPromise = loadHistorialReportConfig();
    const filters = getHistorialFilterValues();

    let query = supabase
      .from(HISTORIAL_DETAIL_VIEW)
      .select(HISTORIAL_DETAIL_SELECT)
      .order("fecha_alta", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .limit(HISTORIAL_FETCH_LIMIT);

    if (filters.fechaAltaDesde) {
      query = query.gte("fecha_alta", filters.fechaAltaDesde);
    }
    if (filters.fechaAltaHasta) {
      query = query.lte("fecha_alta", filters.fechaAltaHasta);
    }
    if (filters.fechaBajaHasta) {
      query = query.lte("fecha_baja", filters.fechaBajaHasta);
    }
    if (filters.fechaBajaDesde) {
      query = query.gte("fecha_baja", filters.fechaBajaDesde);
    }
    if (filters.tipoContratacionId) {
      query = query.eq("tipo_contratacion_id", filters.tipoContratacionId);
    }
    if (filters.enviado) {
      query = query.eq("enviado", filters.enviado === "true");
    }
    if (filters.gestionado) {
      query = query.eq("gestionado", filters.gestionado === "true");
    }
    if (filters.tramitado) {
      query = query.eq("tramitado", filters.tramitado === "true");
    }
    if (filters.personalId) {
      query = query.eq("personal_id", filters.personalId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    await personalOptionsPromise;
    await relationOptionsPromise;
    await reportConfigPromise;
    populateHistorialTipoContratacionFilter();
    historialRows = data ?? [];
    selectedHistorialBulkIds = new Set(
      Array.from(selectedHistorialBulkIds).filter((id) =>
        historialRows.some((row) => String(row.id) === String(id))
      )
    );
    if (!selectedHistorialBulkIds.size) {
      historialBulkSelectionMode = false;
    }
    renderHistorialTable(historialRows);
    updateHistorialBulkMatchCount();
    if (historialSummary) {
      historialSummary.textContent =
        historialRows.length >= HISTORIAL_FETCH_LIMIT
          ? `Mostrando los primeros ${HISTORIAL_FETCH_LIMIT} periodos. Ajusta los filtros para acotar.`
          : `${historialRows.length} ${historialRows.length === 1 ? "periodo" : "periodos"}`;
    }
  } catch (error) {
    historialRows = [];
    if (historialSummary) {
      historialSummary.textContent = "No se pudo cargar el historial laboral.";
    }
    if (historialTableBody) {
      historialTableBody.innerHTML =
        '<tr><td colspan="14" class="empty-state">Error cargando el historial laboral.</td></tr>';
    }
    setStatus(`No se pudo cargar el historial laboral: ${error.message}`, "error");
  }
}

// --- Detalle / edición / alta de periodo ---
function renderHistorialRelationSelect(field, value, readonly) {
  const options = historialRelationOptionsCache[field.key] || [];
  const current = value ?? "";
  let html = '<option value="">— Ninguno —</option>';
  html += options
    .map(
      (option) =>
        `<option value="${escapeHtml(option.value)}" ${
          String(option.value) === String(current) ? "selected" : ""
        }>${escapeHtml(option.label)}</option>`
    )
    .join("");
  return `<select name="${field.key}" ${readonly ? "disabled" : ""}>${html}</select>`;
}

function renderHistorialDetailForm(row) {
  if (!historialDetailFields) {
    return;
  }

  historialDetailFields.innerHTML = HISTORIAL_FORM_FIELDS.map((field) => {
    const value = row[field.key];
    const name = escapeHtml(field.key);
    const label = escapeHtml(field.label);

    if (field.type === "boolean") {
      return `<label class="checkbox-item"><input name="${name}" type="checkbox" ${
        value ? "checked" : ""
      } ${field.readonly ? "disabled" : ""} /><span>${label}</span></label>`;
    }

    if (field.type === "textarea") {
      return `<label class="full-width">${label}<textarea name="${name}" rows="3" ${
        field.readonly ? "readonly" : ""
      }>${escapeHtml(value ?? "")}</textarea></label>`;
    }

    if (field.type === "relation") {
      return `<label>${label}${renderHistorialRelationSelect(field, value, field.readonly)}</label>`;
    }

    const inputType =
      field.type === "date" ? "date" : HISTORIAL_NUMERIC_TYPES.has(field.type) ? "number" : "text";
    const step = field.type === "decimal" ? ' step="0.0001"' : "";
    return `<label>${label}<input name="${name}" type="${inputType}"${step} value="${escapeHtml(
      value ?? ""
    )}" ${field.readonly ? "readonly" : ""} /></label>`;
  }).join("");
}

async function openHistorialDetail(historialId) {
  const row = historialRows.find((item) => String(item.id) === String(historialId));
  if (!row || !historialDetailPanel) {
    return;
  }
  await loadHistorialRelationOptions();
  historialDetailMode = "edit";
  historialDetailSnapshot = { ...row };
  if (historialDetailTitle) {
    historialDetailTitle.textContent = `Periodo ${row.id}${row.personal ? ` · ${row.personal}` : ""}`;
  }
  ensureHistorialDetailReportButton();
  if (historialDetailDuplicateButton) historialDetailDuplicateButton.classList.remove("hidden");
  if (historialDetailDeleteButton) historialDetailDeleteButton.classList.remove("hidden");
  if (historialDetailReportButton) historialDetailReportButton.classList.remove("hidden");
  renderHistorialDetailForm(row);
  markFormPristine(historialDetailForm);
  historialDetailPanel.classList.remove("hidden");
}

async function openHistorialNew(seedRow = null) {
  if (!historialDetailPanel) {
    return;
  }
  await loadHistorialRelationOptions();
  historialDetailMode = "new";
  historialDetailSnapshot = seedRow ? { ...seedRow, id: null } : {};
  if (historialDetailTitle) {
    historialDetailTitle.textContent = seedRow ? "Nuevo periodo (copia)" : "Nuevo periodo";
  }
  // En alta no aplican duplicar ni eliminar.
  ensureHistorialDetailReportButton();
  if (historialDetailDuplicateButton) historialDetailDuplicateButton.classList.add("hidden");
  if (historialDetailDeleteButton) historialDetailDeleteButton.classList.add("hidden");
  if (historialDetailReportButton) historialDetailReportButton.classList.add("hidden");
  renderHistorialDetailForm(historialDetailSnapshot);
  markFormPristine(historialDetailForm);
  historialDetailPanel.classList.remove("hidden");
}

async function closeHistorialDetail(options = {}) {
  if (!options.force && !(await confirmCloseWithSave(historialDetailForm, () => saveHistorialDetail()))) {
    return false;
  }
  historialDetailSnapshot = null;
  historialDetailMode = "edit";
  historialDetailPanel?.classList.add("hidden");
  return true;
}

function collectHistorialDetailPayload({ full = false } = {}) {
  if (!historialDetailForm) {
    return {};
  }
  const formData = new FormData(historialDetailForm);
  const payload = {};
  HISTORIAL_FORM_FIELDS.forEach((field) => {
    if (field.readonly) {
      return;
    }
    const control = historialDetailForm.elements[field.key];
    const rawValue = field.type === "boolean" ? Boolean(control?.checked) : formData.get(field.key);
    const nextValue = parseHistorialFieldValue(rawValue, field);
    if (full) {
      payload[field.key] = nextValue;
      return;
    }
    const previous = normalizeHistorialComparable(historialDetailSnapshot?.[field.key], field);
    if (previous !== normalizeHistorialComparable(nextValue, field)) {
      payload[field.key] = nextValue;
    }
  });
  return payload;
}

// --- Validación de solapes ---
// Dos periodos de la misma persona pueden solaparse por dos motivos legítimos:
//   1. Envoltura y tramo: en el modelo heredado de Access la fila BAJA es el contrato
//      completo y las VARIACION lo subdividen, así que conviven a propósito.
//   2. Puestos distintos: la persona ocupa dos puestos a la vez (p. ej. Monitorado
//      Deportivo y Conc. Monitorado), que es un caso real y frecuente.
// Lo que no tiene lectura definida es un solape del mismo puesto que no sea envoltura y
// tramo: casi siempre es un duplicado. Se avisa sin bloquear.
const HISTORIAL_MOV_BAJA = "BAJA";
const HISTORIAL_MOV_VARIACION = "VARIACION";
const HISTORIAL_OVERLAP_PREVIEW = 6;

function normalizeHistorialMovimiento(value) {
  return String(value ?? "").trim().toUpperCase();
}

function isLegitHistorialOverlap(row, other) {
  const a = normalizeHistorialMovimiento(row?.movimiento);
  const b = normalizeHistorialMovimiento(other?.movimiento);
  const esEnvolturaYTramo =
    (a === HISTORIAL_MOV_BAJA && b === HISTORIAL_MOV_VARIACION) ||
    (a === HISTORIAL_MOV_VARIACION && b === HISTORIAL_MOV_BAJA);
  if (esEnvolturaYTramo) {
    return true;
  }
  // El puesto vacío cuenta como distinto: no está informado en dos tercios del histórico,
  // así que tratarlo como desconocido dispararía el aviso en casi cualquier edición antigua.
  // Dos periodos ambos sin puesto sí se consideran el mismo, y por tanto sospechosos.
  return String(row?.puesto_id ?? null) !== String(other?.puesto_id ?? null);
}

function formatHistorialShortDate(value) {
  const match = String(value ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "sin fecha";
}

// Periodos de la misma persona que pisan al que se va a guardar y no siguen el patrón
// BAJA/VARIACION. Un fallo de consulta devuelve [] a propósito: la validación es una ayuda
// y no debe impedir guardar si Supabase no responde.
async function findSuspiciousHistorialOverlaps(row, excludeId) {
  if (row?.personal_id == null || !row?.fecha_alta) {
    return [];
  }
  try {
    const supabase = await getSupabaseClient();
    // Solapan si cada periodo empieza antes de que acabe el otro. Una fecha_baja vacía
    // significa periodo abierto, así que no acota por ese lado.
    let query = supabase
      .from(HISTORIAL_DETAIL_VIEW)
      .select("id, fecha_alta, fecha_baja, movimiento, puesto_id, puesto")
      .eq("personal_id", row.personal_id)
      .or(`fecha_baja.is.null,fecha_baja.gte.${row.fecha_alta}`);
    if (row.fecha_baja) {
      query = query.lte("fecha_alta", row.fecha_baja);
    }
    if (excludeId != null) {
      query = query.neq("id", excludeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).filter((other) => !isLegitHistorialOverlap(row, other));
  } catch (_error) {
    return [];
  }
}

async function confirmHistorialOverlap(row, excludeId) {
  const overlaps = await findSuspiciousHistorialOverlaps(row, excludeId);
  if (!overlaps.length) {
    return true;
  }
  const lines = overlaps.slice(0, HISTORIAL_OVERLAP_PREVIEW).map((item) => {
    const hasta = item.fecha_baja ? formatHistorialShortDate(item.fecha_baja) : "sin baja";
    const movimiento = normalizeHistorialMovimiento(item.movimiento) || "sin movimiento";
    const puesto = item.puesto || "sin puesto";
    return `  · Periodo ${item.id}: ${formatHistorialShortDate(item.fecha_alta)} – ${hasta} · ${puesto} (${movimiento})`;
  });
  const rest = overlaps.length - lines.length;
  const listado = lines.join("\n") + (rest > 0 ? `\n  · y ${rest} más` : "");
  return window.confirm(
    `Este periodo se solapa en fechas con ${overlaps.length} periodo(s) del mismo puesto de esta persona:\n\n` +
      `${listado}\n\n` +
      "Un solape solo es normal entre el contrato completo (BAJA) y sus tramos (VARIACION), " +
      "o entre dos puestos distintos a la vez. Si esto es una variación, indícalo en el campo " +
      "Movimiento.\n\n" +
      "¿Guardar igualmente?"
  );
}

async function saveHistorialDetail(event) {
  event?.preventDefault();

  const submitButton = historialDetailForm?.querySelector('button[type="submit"]');
  try {
    if (submitButton) submitButton.disabled = true;
    const supabase = await getSupabaseClient();

    if (historialDetailMode === "new") {
      const payload = collectHistorialDetailPayload({ full: true });
      if (payload.personal_id == null) {
        setStatus("Selecciona la persona del periodo antes de guardar.", "error");
        return;
      }
      if (!(await confirmHistorialOverlap(payload, null))) {
        return;
      }
      const { data, error } = await supabase
        .from(HISTORIAL_TABLE)
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      closeHistorialDetail({ force: true });
      await loadHistorial();
      if (data?.id != null) {
        await openHistorialDetail(data.id);
      }
      setStatus("Periodo creado.", "success");
      return;
    }

    if (!historialDetailSnapshot?.id) {
      return;
    }
    const payload = collectHistorialDetailPayload();
    if (!Object.keys(payload).length) {
      closeHistorialDetail({ force: true });
      return;
    }
    // El payload solo trae los campos tocados; el solape se evalúa sobre cómo queda el
    // periodo entero, así que se fusiona con el estado previo.
    if (!(await confirmHistorialOverlap({ ...historialDetailSnapshot, ...payload }, historialDetailSnapshot.id))) {
      return;
    }
    const { error } = await supabase
      .from(HISTORIAL_TABLE)
      .update(payload)
      .eq("id", historialDetailSnapshot.id);
    if (error) throw error;
    const savedId = historialDetailSnapshot.id;
    closeHistorialDetail({ force: true });
    await loadHistorial();
    await openHistorialDetail(savedId);
    setStatus("Periodo guardado.", "success");
  } catch (error) {
    setStatus(`No se pudo guardar el periodo: ${error.message}`, "error");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

async function deleteHistorialDetail() {
  if (!historialDetailSnapshot?.id) {
    return;
  }
  if (!confirm(`¿Eliminar el periodo ${historialDetailSnapshot.id}?`)) {
    return;
  }
  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from(HISTORIAL_TABLE).delete().eq("id", historialDetailSnapshot.id);
    if (error) throw error;
    closeHistorialDetail({ force: true });
    await loadHistorial();
    setStatus("Periodo eliminado.", "success");
  } catch (error) {
    setStatus(`No se pudo eliminar el periodo: ${error.message}`, "error");
  }
}

function duplicateHistorialDetail() {
  if (!historialDetailSnapshot) {
    return;
  }
  // Tomamos los valores actuales del formulario como semilla del nuevo periodo.
  const seed = {};
  HISTORIAL_FORM_FIELDS.forEach((field) => {
    if (field.readonly) {
      return;
    }
    const control = historialDetailForm?.elements[field.key];
    const rawValue = field.type === "boolean" ? Boolean(control?.checked) : control?.value;
    seed[field.key] = parseHistorialFieldValue(rawValue, field);
  });
  void openHistorialNew(seed);
}

// --- Asignación masiva ---
function getHistorialBulkFieldConfig() {
  return HISTORIAL_BULK_FIELDS[historialBulkFieldSelect?.value] || HISTORIAL_BULK_FIELDS.empresa_id;
}

function getHistorialBulkCurrentOptions(field, config) {
  const seen = new Map();
  for (const row of historialRows) {
    const val = row[field];
    if (val == null || val === "" || seen.has(val)) continue;
    const label = config.labelKey ? (row[config.labelKey] ?? "") : String(val);
    seen.set(val, label);
  }
  return Array.from(seen.entries())
    .map(([value, label]) => ({ value, label: label ? `${value} · ${label}` : String(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
}

function getHistorialBulkNewOptions(field) {
  const catalog = historialRelationOptionsCache[field];
  if (catalog?.length) {
    return catalog.map((option) => ({
      value: option.value,
      label: option.label ? `${option.value} · ${option.label}` : String(option.value),
    }));
  }
  return getHistorialBulkCurrentOptions(field, getHistorialBulkFieldConfig());
}

function renderHistorialBulkSelect(select, options, { includeUnset = false } = {}) {
  if (!select) return;
  const rendered = includeUnset
    ? [
        { value: "__unset__", label: "Selecciona valor" },
        { value: "__empty__", label: "Vacío" },
        ...options,
      ]
    : options;
  select.innerHTML = rendered
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");
  select.value = rendered[0]?.value ?? "";
}

function normalizeHistorialBulkValue(value, config) {
  if (value === null || value === undefined || value === "" || value === "__empty__") return "";
  if (config.type === "boolean") return value === true || value === "true" ? "true" : "false";
  if (config.type === "number") {
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : "";
  }
  if (config.type === "relation") {
    const number = Number(value);
    return Number.isFinite(number) ? String(number) : String(value).trim();
  }
  return String(value).trim();
}

function getHistorialBulkControlValue(kind = "current") {
  const config = getHistorialBulkFieldConfig();
  const isSelect = config.type === "relation" || config.type === "boolean";
  if (isSelect) {
    return kind === "new" ? historialBulkNewSelect?.value || "" : historialBulkCurrentSelect?.value || "";
  }
  return kind === "new"
    ? historialBulkNewValueInput?.value || ""
    : historialBulkCurrentValueInput?.value || "";
}

function getHistorialBulkMatchingRows() {
  const field = historialBulkFieldSelect?.value;
  const config = getHistorialBulkFieldConfig();
  if (!field) return [];
  const currentValue = normalizeHistorialBulkValue(getHistorialBulkControlValue("current"), config);
  return historialRows.filter((row) => normalizeHistorialBulkValue(row[field], config) === currentValue);
}

function getSelectedHistorialBulkRows() {
  const ids = new Set(Array.from(selectedHistorialBulkIds).map(String));
  return historialRows.filter((row) => ids.has(String(row.id)));
}

function getHistorialBulkTargetRows() {
  return historialBulkSelectionMode ? getSelectedHistorialBulkRows() : getHistorialBulkMatchingRows();
}

function syncHistorialBulkSelectionUi() {
  const selectedCount = getSelectedHistorialBulkRows().length;
  historialBulkSelectionCount?.classList.toggle("hidden", !historialBulkSelectionMode);
  historialBulkClearSelectionButton?.classList.toggle("hidden", !historialBulkSelectionMode);
  if (historialBulkSelectionCount) {
    historialBulkSelectionCount.textContent = historialBulkSelectionMode
      ? `${selectedCount} seleccionados de ${historialRows.length}`
      : `${selectedCount} seleccionados`;
  }
  if (historialBulkSelectAllCheckbox) {
    historialBulkSelectAllCheckbox.checked = Boolean(historialRows.length) && selectedCount === historialRows.length;
    historialBulkSelectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < historialRows.length;
    historialBulkSelectAllCheckbox.disabled = !historialBulkSelectionMode || !historialRows.length;
  }
}

function setHistorialBulkSelectionMode(enabled) {
  historialBulkSelectionMode = Boolean(enabled);
  if (!historialBulkSelectionMode) {
    selectedHistorialBulkIds.clear();
  }
  renderHistorialTable(historialRows);
}

function syncHistorialBulkUi() {
  const field = historialBulkFieldSelect?.value;
  const config = getHistorialBulkFieldConfig();
  const isSelect = config.type === "relation" || config.type === "boolean";

  historialBulkCurrentValueInput?.classList.toggle("hidden", isSelect);
  historialBulkCurrentSelect?.classList.toggle("hidden", !isSelect);
  historialBulkNewValueInput?.classList.toggle("hidden", isSelect);
  historialBulkNewSelect?.classList.toggle("hidden", !isSelect);

  if (isSelect) {
    if (config.type === "boolean") {
      const boolOpts = [
        { value: "true", label: "Sí" },
        { value: "false", label: "No" },
      ];
      renderHistorialBulkSelect(historialBulkCurrentSelect, boolOpts);
      renderHistorialBulkSelect(historialBulkNewSelect, boolOpts);
    } else {
      renderHistorialBulkSelect(historialBulkCurrentSelect, getHistorialBulkCurrentOptions(field, config));
      renderHistorialBulkSelect(historialBulkNewSelect, getHistorialBulkNewOptions(field), {
        includeUnset: true,
      });
    }
  } else {
    const inputType = config.type === "date" ? "date" : config.type === "number" ? "number" : "text";
    if (historialBulkCurrentValueInput) {
      historialBulkCurrentValueInput.type = inputType;
      historialBulkCurrentValueInput.value = "";
    }
    if (historialBulkNewValueInput) {
      historialBulkNewValueInput.type = inputType;
      historialBulkNewValueInput.value = "";
    }
  }

  updateHistorialBulkMatchCount();
}

function updateHistorialBulkMatchCount() {
  if (!historialBulkMatchCount) return;
  const matches = getHistorialBulkMatchingRows();
  historialBulkMatchCount.textContent = `${matches.length} coincidencia${matches.length !== 1 ? "s" : ""}`;
  syncHistorialBulkSelectionUi();
}

// Filas que quedarian con fecha_baja anterior a fecha_alta al aplicar la masiva.
// Importa porque el UPDATE es una sola sentencia y el CHECK historiales_laborales_fechas_validas
// tumba el lote entero por una sola fila invalida, con un error de Postgres que no dice cual es.
// Vaciar la fecha (null) nunca incumple el CHECK.
function findHistorialBulkDateConflicts(field, newValue, rows) {
  if (newValue == null || (field !== "fecha_alta" && field !== "fecha_baja")) {
    return [];
  }
  return rows.filter((row) => {
    const alta = field === "fecha_alta" ? newValue : row.fecha_alta;
    const baja = field === "fecha_baja" ? newValue : row.fecha_baja;
    // Fechas ISO (YYYY-MM-DD): el orden lexicografico coincide con el cronologico.
    return alta && baja && String(baja) < String(alta);
  });
}

function historialPeriodsOverlap(a, b) {
  if (!a?.fecha_alta || !b?.fecha_alta) {
    return false;
  }
  // Sin fecha_baja el periodo esta abierto; el centinela lo deja siempre por delante.
  const finA = a.fecha_baja || "9999-12-31";
  const finB = b.fecha_baja || "9999-12-31";
  return String(a.fecha_alta) <= String(finB) && String(b.fecha_alta) <= String(finA);
}

// Clave estable de una pareja, para poder restar el antes del despues.
function historialPairKey(a, b) {
  return [a.id, b.id].map(Number).sort((x, y) => x - y).join("-");
}

// Recorre los periodos de una persona y devuelve las parejas solapadas sospechosas.
function collectSuspiciousPairs(rows) {
  const pairs = new Map();
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const a = rows[i];
      const b = rows[j];
      if (historialPeriodsOverlap(a, b) && !isLegitHistorialOverlap(a, b)) {
        pairs.set(historialPairKey(a, b), { a, b });
      }
    }
  }
  return pairs;
}

// Solapes que la masiva CREARIA, restando los que ya existen: avisar de los previos seria
// ruido y bloquearia ediciones legitimas sobre datos ya sucios.
// Solo fecha_alta y fecha_baja pueden mover un periodo, asi que el resto de campos ni consulta.
async function findHistorialBulkNewOverlaps(field, newValue, targetRows) {
  if (field !== "fecha_alta" && field !== "fecha_baja") {
    return [];
  }
  const personalIds = [...new Set(targetRows.map((row) => row.personal_id).filter((id) => id != null))];
  if (!personalIds.length) {
    return [];
  }
  const supabase = await getSupabaseClient();
  // historialRows solo tiene la pagina cargada; hacen falta TODOS los periodos de esa gente.
  const { data, error } = await supabase
    .from(HISTORIAL_DETAIL_VIEW)
    .select("id, personal_id, personal, fecha_alta, fecha_baja, movimiento, puesto_id, puesto")
    .in("personal_id", personalIds);
  if (error) throw error;

  const targetIds = new Set(targetRows.map((row) => String(row.id)));
  const byPerson = new Map();
  (data || []).forEach((row) => {
    if (!byPerson.has(row.personal_id)) {
      byPerson.set(row.personal_id, []);
    }
    byPerson.get(row.personal_id).push(row);
  });

  const nuevos = [];
  byPerson.forEach((rows) => {
    const antes = collectSuspiciousPairs(rows);
    const despues = collectSuspiciousPairs(
      rows.map((row) => (targetIds.has(String(row.id)) ? { ...row, [field]: newValue } : row))
    );
    despues.forEach((pair, key) => {
      if (!antes.has(key)) {
        nuevos.push(pair);
      }
    });
  });
  return nuevos;
}

function describeHistorialBulkNewOverlaps(pairs) {
  const lines = pairs.slice(0, HISTORIAL_OVERLAP_PREVIEW).map(({ a, b }) => {
    const quien = a.personal || b.personal || `personal ${a.personal_id}`;
    const puesto = a.puesto || b.puesto || "sin puesto";
    const rango = (row) =>
      `${formatHistorialShortDate(row.fecha_alta)}–${row.fecha_baja ? formatHistorialShortDate(row.fecha_baja) : "sin baja"}`;
    return `  · ${quien} · ${puesto}: periodo ${a.id} (${rango(a)}) se pisaría con el ${b.id} (${rango(b)})`;
  });
  const rest = pairs.length - lines.length;
  return lines.join("\n") + (rest > 0 ? `\n  · y ${rest} más` : "");
}

function describeHistorialBulkDateConflicts(field, newValue, conflicts) {
  const lines = conflicts.slice(0, HISTORIAL_OVERLAP_PREVIEW).map((row) => {
    const alta = field === "fecha_alta" ? newValue : row.fecha_alta;
    const baja = field === "fecha_baja" ? newValue : row.fecha_baja;
    const quien = row.personal ? ` · ${row.personal}` : "";
    return `  · Periodo ${row.id}${quien}: alta ${formatHistorialShortDate(alta)} → baja ${formatHistorialShortDate(baja)}`;
  });
  const rest = conflicts.length - lines.length;
  return lines.join("\n") + (rest > 0 ? `\n  · y ${rest} más` : "");
}

async function applyHistorialBulkAssignment() {
  const field = historialBulkFieldSelect?.value;
  const config = getHistorialBulkFieldConfig();
  if (!field || !HISTORIAL_BULK_FIELDS[field]) return;

  const matches = getHistorialBulkTargetRows();
  if (!matches.length) {
    setStatus(
      historialBulkSelectionMode
        ? "Selecciona al menos un periodo para aplicar la asignación masiva."
        : "No hay periodos que coincidan con el valor actual.",
      "error"
    );
    return;
  }

  const rawNewValue = getHistorialBulkControlValue("new");
  if (rawNewValue === "__unset__") {
    setStatus("Selecciona un nuevo valor.", "error");
    return;
  }

  let newValue;
  if (rawNewValue === "__empty__" || rawNewValue === "") {
    newValue = null;
  } else if (config.type === "boolean") {
    newValue = rawNewValue === "true";
  } else if (config.type === "number" || config.type === "relation") {
    const number = Number(rawNewValue);
    newValue = Number.isFinite(number) ? number : null;
  } else {
    newValue = rawNewValue;
  }

  const currentLabel = normalizeHistorialBulkValue(getHistorialBulkControlValue("current"), config);
  const newLabel = rawNewValue === "__empty__" ? "Vacío" : normalizeHistorialBulkValue(rawNewValue, config);

  // Se corta antes de confirmar: la base rechazaria el lote entero igualmente, y aqui al menos
  // se puede decir que filas lo impiden.
  const dateConflicts = findHistorialBulkDateConflicts(field, newValue, matches);
  if (dateConflicts.length) {
    window.alert(
      `No se puede aplicar: ${dateConflicts.length} de ${matches.length} periodo(s) quedarían con la ` +
        `fecha de baja anterior a la de alta.\n\n` +
        `${describeHistorialBulkDateConflicts(field, newValue, dateConflicts)}\n\n` +
        "La base de datos rechaza esos periodos, y como la asignación masiva se aplica de una sola vez, " +
        "no se guardaría ninguno de los " + matches.length + ".\n\n" +
        "Quita esos periodos de la selección o corrige antes su otra fecha."
    );
    setStatus(
      `Asignación masiva cancelada: ${dateConflicts.length} periodo${dateConflicts.length !== 1 ? "s" : ""} quedaría${dateConflicts.length !== 1 ? "n" : ""} con la baja antes del alta.`,
      "error"
    );
    return;
  }

  // Se avisa dentro de la confirmación que ya existía, para no encadenar dos diálogos.
  // Un fallo aquí no impide la masiva: el aviso es una ayuda, no un guardián.
  let overlapWarning = "";
  if (field === "fecha_alta" || field === "fecha_baja") {
    setStatus("Comprobando solapes…");
    try {
      const nuevos = await findHistorialBulkNewOverlaps(field, newValue, matches);
      if (nuevos.length) {
        overlapWarning =
          `\n\n⚠ Además, crearía ${nuevos.length} solape${nuevos.length !== 1 ? "s" : ""} nuevo${nuevos.length !== 1 ? "s" : ""} del mismo puesto:\n\n` +
          `${describeHistorialBulkNewOverlaps(nuevos)}\n\n` +
          "Un solape solo es normal entre el contrato completo (BAJA) y sus tramos (VARIACION), " +
          "o entre dos puestos distintos a la vez.";
      }
    } catch (_error) {
      overlapWarning = "\n\n(No se pudo comprobar si crearía solapes.)";
    }
  }

  const resumen = historialBulkSelectionMode
    ? `¿Cambiar ${config.label} a "${newLabel}" en ${matches.length} periodo${matches.length !== 1 ? "s" : ""} seleccionado${matches.length !== 1 ? "s" : ""}?`
    : `¿Cambiar ${config.label} de "${currentLabel}" a "${newLabel}" en ${matches.length} periodo${matches.length !== 1 ? "s" : ""}?`;

  if (!confirm(resumen + overlapWarning)) {
    return;
  }

  try {
    const supabase = await getSupabaseClient();
    const ids = matches.map((row) => row.id);
    const { error } = await supabase
      .from(HISTORIAL_TABLE)
      .update({ [field]: newValue })
      .in("id", ids);
    if (error) throw error;
    await loadHistorial();
    setStatus(
      `${config.label} actualizado en ${matches.length} periodo${matches.length !== 1 ? "s" : ""}.`,
      "success"
    );
  } catch (error) {
    setStatus(`Error en asignación masiva: ${error.message}`, "error");
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
  if (!currentAllowedPrivateTabs.size) {
    setStatus("Tu usuario no tiene pestañas asignadas. Contacta con un administrador.", "error");
    return;
  }

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

  if (normalizedTarget === "contracts") {
    await loadContractsManagement();
    return;
  }

  if (normalizedTarget === "personal") {
    await loadPersonalManagement();
    return;
  }

  if (normalizedTarget === "registros") {
    await loadRecords();
    return;
  }

  if (normalizedTarget === "historial") {
    await loadHistorial();
    return;
  }

  if (normalizedTarget === "gestion") {
    await loadGestion();
    return;
  }

  if (normalizedTarget === "contabilidad") {
    await loadContabilidadActive();
    return;
  }

  if (normalizedTarget === "settings") {
    await loadSettingsTabActiveView();
    return;
  }

  if (normalizedTarget === "concilia" || normalizedTarget === "actividades") {
    const conciliaTarget = CONCILIA_MODULE_BY_TAB_KEY[normalizedTarget] || "alumnado";
    showIntegratedConciliaPanel(normalizedTarget);
    if (!window.CoordinacionConcilia?.showTab) {
      const conciliaStatus = document.querySelector("#concilia-status-message");
      if (conciliaStatus) {
        conciliaStatus.textContent =
          "El panel de Concilia no ha terminado de cargar. Recarga la pagina si los datos no aparecen.";
        conciliaStatus.className = "panel-status-message error";
      }
      return;
    }
    await window.CoordinacionConcilia.showTab(conciliaTarget);
    return;
  }

  if (normalizedTarget === "programming") {
    await loadProgrammingPersonnel();
    await loadProgrammingFromSupabase();
    return;
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
  updateControlPersonalClear();
  syncFilterResetButtons(controlFiltersForm);
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
    updateControlPersonalClear();
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

async function closeCandidateCreatePanel(options = {}) {
  if (!options.force && !(await confirmCloseWithSave(candidateForm, () => handlePrivateCandidateSubmit()))) {
    return false;
  }

  privateTabPanelNew?.classList.add("hidden");
  resetCandidateCreateForm();
  markFormPristine(candidateForm);
  return true;
}

function getEventContractName(id) {
  const normalizedId = Number(id);
  return eventContractRows.find((row) => Number(row.id) === normalizedId)?.contrato || "";
}

// El contrato del evento acota las instalaciones y el personal disponibles.
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
  const endDate = eventFilterEndDateInput?.value || "";
  const includeArchived = Boolean(eventFilterIncludeArchivedInput?.checked);

  return currentEvents.filter((event) => {
    if (!includeArchived && isEventArchived(event)) {
      return false;
    }
    const matchesName = !nameQuery || normalizeSearchText(event.nombre).includes(nameQuery);
    const matchesContract = !contractId || String(event.contrato_id) === String(contractId);
    const matchesInstallation =
      !installationId || String(event.instalacion_id) === String(installationId);
    const matchesDateRange =
      (!startDate || event.fecha_fin >= startDate) &&
      (!endDate || event.fecha_inicio <= endDate);
    return matchesName && matchesContract && matchesInstallation && matchesDateRange;
  });
}

function resetSingleEventFilter(filterName) {
  const fieldMap = {
    name: eventFilterNameInput,
    contract: eventFilterContractSelect,
    installation: eventFilterInstallationSelect,
    start_date: eventFilterStartDateInput,
    end_date: eventFilterEndDateInput,
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
  const endDate = eventFilterEndDateInput?.value || "";
  const includeArchived = Boolean(eventFilterIncludeArchivedInput?.checked);

  return currentEvents.filter((event) => {
    if (!includeArchived && isEventArchived(event)) {
      return false;
    }
    const matchesName = !nameQuery || normalizeSearchText(event.nombre).includes(nameQuery);
    const matchesContract = !contractId || String(event.contrato_id) === String(contractId);
    const matchesDateRange =
      (!startDate || event.fecha_fin >= startDate) &&
      (!endDate || event.fecha_inicio <= endDate);
    return matchesName && matchesContract && matchesDateRange;
  });
}

function getEventsForContractFilter() {
  const nameQuery = normalizeSearchText(eventFilterNameInput?.value || "");
  const installationId = eventFilterInstallationSelect?.value || "";
  const startDate = eventFilterStartDateInput?.value || "";
  const endDate = eventFilterEndDateInput?.value || "";
  const includeArchived = Boolean(eventFilterIncludeArchivedInput?.checked);

  return currentEvents.filter((event) => {
    if (!includeArchived && isEventArchived(event)) {
      return false;
    }
    const matchesName = !nameQuery || normalizeSearchText(event.nombre).includes(nameQuery);
    const matchesInstallation =
      !installationId || String(event.instalacion_id) === String(installationId);
    const matchesDateRange =
      (!startDate || event.fecha_fin >= startDate) &&
      (!endDate || event.fecha_inicio <= endDate);
    return matchesName && matchesInstallation && matchesDateRange;
  });
}

function getEventReportDateRange() {
  const dateFrom = eventFilterStartDateInput?.value || "";
  const dateTo = eventFilterEndDateInput?.value || "";

  if (!dateFrom || !dateTo) {
    throw new Error("Indica fecha de inicio y fecha de fin para generar el informe.");
  }

  if (dateFrom > dateTo) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin.");
  }

  return { dateFrom, dateTo };
}

function getEventPersonnelReportRows(personalId, dateFrom, dateTo) {
  const selectedPersonalId = Number(personalId);
  const filteredEventIds = new Set(getFilteredEvents().map((event) => Number(event.id)));

  return currentEventSchedulePersonnelRows
    .filter((assignment) => Number(assignment.personal_id) === selectedPersonalId)
    .map((assignment) => {
      const schedule = currentEventScheduleRows.find(
        (row) => Number(row.id) === Number(assignment.cronograma_id)
      );
      if (!schedule || !filteredEventIds.has(Number(schedule.evento_id))) {
        return null;
      }

      const eventRow = currentEvents.find((event) => Number(event.id) === Number(schedule.evento_id));
      if (!eventRow || schedule.fecha < dateFrom || schedule.fecha > dateTo) {
        return null;
      }

      return {
        fecha: schedule.fecha,
        hora_inicio: assignment.hora_inicio,
        hora_fin: assignment.hora_fin,
        evento: eventRow.nombre,
        minutes: calculateWorkedMinutes(assignment.hora_inicio, assignment.hora_fin),
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        String(left.fecha).localeCompare(String(right.fecha), "es", { numeric: true }) ||
        formatHourValue(left.hora_inicio).localeCompare(formatHourValue(right.hora_inicio), "es", {
          numeric: true,
        }) ||
        String(left.evento).localeCompare(String(right.evento), "es", {
          sensitivity: "base",
          numeric: true,
        })
    );
}

function renderEventPersonnelReportOptions() {
  if (!eventPersonnelReportSelect) {
    return;
  }

  const previousValue = eventPersonnelReportSelect.value;
  const dateFrom = eventFilterStartDateInput?.value || "";
  const dateTo = eventFilterEndDateInput?.value || "";
  const filteredEventIds = new Set(getFilteredEvents().map((event) => Number(event.id)));
  const workedPersonalIds = new Set();

  currentEventSchedulePersonnelRows.forEach((assignment) => {
    const schedule = currentEventScheduleRows.find(
      (row) => Number(row.id) === Number(assignment.cronograma_id)
    );
    if (!schedule || !filteredEventIds.has(Number(schedule.evento_id))) {
      return;
    }
    if (dateFrom && schedule.fecha < dateFrom) {
      return;
    }
    if (dateTo && schedule.fecha > dateTo) {
      return;
    }
    workedPersonalIds.add(Number(assignment.personal_id));
  });

  const rows = eventPersonnelRows
    .filter((row) => workedPersonalIds.has(Number(row.id)))
    .sort((left, right) =>
      String(left.personal || "").localeCompare(String(right.personal || ""), "es", {
        sensitivity: "base",
        numeric: true,
      })
    );

  eventPersonnelReportSelect.innerHTML = [
    '<option value="">Persona informe</option>',
    ...rows.map((row) => `<option value="${row.id}">${escapeHtml(row.personal)}</option>`),
  ].join("");
  eventPersonnelReportSelect.value = rows.some((row) => String(row.id) === previousValue)
    ? previousValue
    : "";
}

function getSelectedEventPersonnelReportData() {
  const personalId = eventPersonnelReportSelect?.value || "";
  if (!personalId) {
    throw new Error("Selecciona una persona para generar el informe de eventos.");
  }

  const { dateFrom, dateTo } = getEventReportDateRange();
  const rows = getEventPersonnelReportRows(personalId, dateFrom, dateTo);
  const personName = getEventPersonnelName(personalId) || "Persona";

  if (!rows.length) {
    throw new Error("No hay horas de eventos para esa persona en el intervalo indicado.");
  }

  return {
    dateFrom,
    dateTo,
    rows,
    personName,
    totalMinutes: rows.reduce((total, row) => total + row.minutes, 0),
  };
}

function getEventReportImageFileName(personName, dateFrom, dateTo) {
  return `eventos-${sanitizeFileName(personName)}-${dateFrom}-${dateTo}.png`;
}

function drawEventPersonnelReportImage(reportData) {
  const { personName, dateFrom, dateTo, rows, totalMinutes } = reportData;
  const scale = 2;
  const margin = 40;
  const tableWidth = 1180;
  const canvasWidth = tableWidth + margin * 2;
  const columns = [
    { label: "Fecha", key: "fecha", width: 150 },
    { label: "Inicio", key: "inicio", width: 110 },
    { label: "Fin", key: "fin", width: 110 },
    { label: "Evento", key: "evento", width: 690 },
    { label: "Horas", key: "horas", width: 120 },
  ];
  const lineHeight = 26;
  const cellPadding = 10;
  const headerHeight = 42;
  const titleHeight = 136;
  const footerHeight = 72;
  const scratchCanvas = document.createElement("canvas");
  const scratchContext = scratchCanvas.getContext("2d");

  scratchContext.font = "24px Arial";
  const rowLayouts = rows.map((row) => {
    const values = {
      fecha: formatDisplayDate(row.fecha),
      inicio: formatHourValue(row.hora_inicio).slice(0, 5),
      fin: formatHourValue(row.hora_fin).slice(0, 5),
      evento: row.evento,
      horas: formatMinutesAsHours(row.minutes),
    };
    const cellLines = columns.map((column) =>
      wrapCanvasText(scratchContext, values[column.key] || "-", column.width - cellPadding * 2)
    );
    const rowHeight = Math.max(46, Math.max(...cellLines.map((lines) => lines.length)) * lineHeight + cellPadding * 2);
    return { cellLines, rowHeight };
  });

  const canvasHeight =
    titleHeight +
    headerHeight +
    rowLayouts.reduce((total, layout) => total + layout.rowHeight, 0) +
    footerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const context = canvas.getContext("2d");
  context.scale(scale, scale);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "#001f54";
  context.font = "bold 34px Arial";
  context.fillText("Informe de eventos por persona", margin, 46);
  context.font = "bold 26px Arial";
  context.fillText(personName, margin, 82);
  context.font = "22px Arial";
  context.fillText(`Periodo: ${formatDisplayDate(dateFrom)} - ${formatDisplayDate(dateTo)}`, margin, 114);

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

  rowLayouts.forEach(({ cellLines, rowHeight }) => {
    x = margin;
    context.font = "20px Arial";
    columns.forEach((column, columnIndex) => {
      context.strokeStyle = "#d6dbe7";
      context.strokeRect(x, y, column.width, rowHeight);
      context.fillStyle = "#001f54";
      cellLines[columnIndex].forEach((line, lineIndex) => {
        context.fillText(line, x + cellPadding, y + cellPadding + 20 + lineIndex * lineHeight);
      });
      x += column.width;
    });
    y += rowHeight;
  });

  const hoursColumn = columns[columns.length - 1];
  context.fillStyle = "#f1f5f9";
  context.fillRect(margin, y, tableWidth - hoursColumn.width, 46);
  context.fillRect(margin + tableWidth - hoursColumn.width, y, hoursColumn.width, 46);
  context.strokeStyle = "#94a3b8";
  context.strokeRect(margin, y, tableWidth - hoursColumn.width, 46);
  context.strokeRect(margin + tableWidth - hoursColumn.width, y, hoursColumn.width, 46);
  context.fillStyle = "#001f54";
  context.font = "bold 22px Arial";
  context.fillText("Total", margin + cellPadding, y + 30);
  context.fillText(formatMinutesAsHours(totalMinutes), margin + tableWidth - hoursColumn.width + cellPadding, y + 30);

  context.fillStyle = "#64748b";
  context.font = "18px Arial";
  context.fillText(`Generado: ${new Date().toLocaleString("es-ES")}`, margin, canvasHeight - 12);

  return canvas;
}

function closeEventReportImagePanel() {
  eventReportImagePanel?.classList.add("hidden");
}

function showEventPersonnelReportImage() {
  try {
    const reportData = getSelectedEventPersonnelReportData();
    currentEventReportImageCanvas = drawEventPersonnelReportImage(reportData);
    currentEventReportImageFileName = getEventReportImageFileName(
      reportData.personName,
      reportData.dateFrom,
      reportData.dateTo
    );

    if (eventReportImagePreview) {
      eventReportImagePreview.src = currentEventReportImageCanvas.toDataURL("image/png");
    }
    eventReportImagePanel?.classList.remove("hidden");
    setStatus("Imagen del informe generada correctamente.", "success");
  } catch (error) {
    setStatus(error?.message || "No se pudo generar la imagen del informe.", "error");
  }
}

async function copyEventReportImageToClipboard() {
  try {
    if (!currentEventReportImageCanvas) {
      throw new Error("Genera primero la imagen del informe.");
    }
    if (!navigator.clipboard || typeof window.ClipboardItem === "undefined") {
      throw new Error("El navegador no permite copiar imágenes al portapapeles.");
    }
    const blob = await canvasToBlob(currentEventReportImageCanvas);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus("Imagen copiada al portapapeles.", "success");
  } catch (error) {
    setStatus(error?.message || "No se pudo copiar la imagen.", "error");
  }
}

async function downloadEventReportImage() {
  try {
    if (!currentEventReportImageCanvas) {
      throw new Error("Genera primero la imagen del informe.");
    }
    const blob = await canvasToBlob(currentEventReportImageCanvas);
    triggerDownload(blob, currentEventReportImageFileName || "informe-eventos.png");
  } catch (error) {
    setStatus(error?.message || "No se pudo descargar la imagen.", "error");
  }
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

async function exportEventPersonnelReportToPdf() {
  try {
    const personalId = eventPersonnelReportSelect?.value || "";
    if (!personalId) {
      setStatus("Selecciona una persona para generar el informe de eventos.", "error");
      return;
    }

    const { dateFrom, dateTo } = getEventReportDateRange();
    const rows = getEventPersonnelReportRows(personalId, dateFrom, dateTo);
    const personName = getEventPersonnelName(personalId) || "Persona";

    if (!rows.length) {
      setStatus("No hay horas de eventos para esa persona en el intervalo indicado.", "error");
      return;
    }

    const totalMinutes = rows.reduce((total, row) => total + row.minutes, 0);
    const { jsPDF } = await getJsPdfClient();
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const bottomMargin = 12;
    const columns = [
      { label: "Fecha", key: "fecha", width: 24 },
      { label: "Inicio", key: "inicio", width: 20 },
      { label: "Fin", key: "fin", width: 20 },
      { label: "Evento", key: "evento", width: 96 },
      { label: "Horas", key: "horas", width: 20 },
    ];
    const tableWidth = columns.reduce((total, column) => total + column.width, 0);
    const tableLeft = Math.max(margin, (pageWidth - tableWidth) / 2);
    const headerHeight = 8;
    const minRowHeight = 8;
    const rowLineHeight = 3.8;
    let y = margin;

    const drawHeader = (title = personName) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Informe de eventos por persona", margin, y);
      y += 7;
      doc.setFontSize(11);
      doc.text(title, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Periodo: ${formatDisplayDate(dateFrom)} - ${formatDisplayDate(dateTo)}`, margin, y);
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      let x = tableLeft;
      columns.forEach((column) => {
        doc.setFillColor(225, 225, 225);
        doc.setDrawColor(120, 120, 120);
        doc.rect(x, y, column.width, headerHeight, "F");
        doc.rect(x, y, column.width, headerHeight, "S");
        doc.text(column.label, x + 2, y + 5.2);
        x += column.width;
      });
      y += headerHeight;
    };

    drawHeader();

    rows.forEach((row) => {
      const values = {
        fecha: formatDisplayDate(row.fecha),
        inicio: formatHourValue(row.hora_inicio).slice(0, 5),
        fin: formatHourValue(row.hora_fin).slice(0, 5),
        evento: row.evento,
        horas: formatMinutesAsHours(row.minutes),
      };
      const cellLines = columns.map((column) =>
        doc.splitTextToSize(String(values[column.key] || "-"), column.width - 4)
      );
      const rowHeight = Math.max(
        minRowHeight,
        ...cellLines.map((lines) => lines.length * rowLineHeight + 4)
      );

      if (y + rowHeight > pageHeight - bottomMargin) {
        doc.addPage();
        y = margin;
        drawHeader(`${personName} (continuacion)`);
      }

      let x = tableLeft;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setDrawColor(210, 219, 231);
      columns.forEach((column, columnIndex) => {
        doc.rect(x, y, column.width, rowHeight);
        doc.text(cellLines[columnIndex], x + 2, y + 5, {
          maxWidth: column.width - 4,
        });
        x += column.width;
      });
      y += rowHeight;
    });

    if (y + minRowHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = margin;
      drawHeader(`${personName} (continuacion)`);
    }

    const hoursColumn = columns[columns.length - 1];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.rect(tableLeft, y, tableWidth - hoursColumn.width, minRowHeight);
    doc.rect(tableLeft + tableWidth - hoursColumn.width, y, hoursColumn.width, minRowHeight);
    doc.text("Total", tableLeft + 2, y + 5.2);
    doc.text(formatMinutesAsHours(totalMinutes), tableLeft + tableWidth - hoursColumn.width + 2, y + 5.2);

    doc.save(`eventos-${personName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${dateFrom}-${dateTo}.pdf`);
    setStatus(`Informe de eventos generado correctamente. Total: ${formatMinutesAsHours(totalMinutes)}.`, "success");
  } catch (error) {
    setStatus(`No se pudo generar el informe de eventos: ${error?.message ?? "error desconocido"}`, "error");
  }
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
    renderEventPersonnelReportOptions();
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
      `
    })
    .join("");
  renderEventPersonnelReportOptions();
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

async function closeEventPanel(options = {}) {
  if (!options.force && !(await confirmCloseWithSave(eventForm, () => saveEvent()))) {
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

async function closeEventSchedulePanel(options = {}) {
  if (!options.force && !(await confirmCloseWithSave(eventScheduleForm, () => saveEventSchedule()))) {
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
  event?.preventDefault();

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
  const { data: scheduleRows, error: scheduleLoadError } = await supabase
    .from("eventos_cronograma")
    .select("id")
    .eq("evento_id", eventId);

  if (scheduleLoadError) {
    setStatus(scheduleLoadError.message || "No se pudo preparar el borrado del evento.", "error");
    return;
  }

  const scheduleIds = (scheduleRows ?? []).map((row) => row.id);

  if (scheduleIds.length) {
    const { error: personnelError } = await supabase
      .from("eventos_cronograma_personal")
      .delete()
      .in("cronograma_id", scheduleIds);

    if (personnelError) {
      setStatus(personnelError.message || "No se pudo eliminar el personal del cronograma.", "error");
      return;
    }
  }

  const { error: scheduleError } = await supabase.from("eventos_cronograma").delete().eq("evento_id", eventId);
  if (scheduleError) {
    setStatus(scheduleError.message || "No se pudo eliminar el cronograma del evento.", "error");
    return;
  }

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
  event?.preventDefault();

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

  if (payload.hora_fin === payload.hora_inicio) {
    setStatus("La hora de fin debe ser distinta a la hora de inicio.", "error");
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

  if (!horaInicio || !horaFin || horaFin === horaInicio) {
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

  const assignmentRow = currentEventSchedulePersonnelRows.find(
    (row) => String(row.id) === String(assignmentId)
  );
  if (assignmentRow) {
    assignmentRow.hora_inicio = horaInicio;
    assignmentRow.hora_fin = horaFin;
  }
  renderEventPersonnelReportOptions();
  setStatus("Horario de personal actualizado.", "success");
}

function queueEventAssignmentSave(assignmentId) {
  if (!assignmentId) {
    return;
  }

  window.clearTimeout(eventAssignmentSaveTimers.get(String(assignmentId)));
  eventAssignmentSaveTimers.set(
    String(assignmentId),
    window.setTimeout(() => {
      eventAssignmentSaveTimers.delete(String(assignmentId));
      void saveEventAssignment(assignmentId);
    }, 700)
  );
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
  decorateStaticActionButtons();

  if (!hasSupabaseConfig) {
    setStatus(
      "Falta la configuracion de Supabase en config.js. Esta version ya no funciona en modo local.",
      "error"
    );
    return;
  }

  validateRoleOptions();
  renderPersonalFormFields();
  setPersonalFormEditing(false);
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
  privateTabConciliaButton?.addEventListener("click", () => {
    switchPrivateTab("concilia");
    void refreshPrivateTabData("concilia").catch((error) => {
      setStatus(error?.message || "No se pudo cargar Concilia.", "error");
    });
  });
  privateTabActividadesButton?.addEventListener("click", () => {
    switchPrivateTab("actividades");
    void refreshPrivateTabData("actividades").catch((error) => {
      setStatus(error?.message || "No se pudieron cargar las actividades.", "error");
    });
  });
  privateTabRegistrosButton?.addEventListener("click", () => {
    switchPrivateTab("registros");
    void refreshPrivateTabData("registros").catch((error) => {
      setStatus(error?.message || "No se pudieron cargar los registros.", "error");
    });
  });
  privateTabHistorialButton?.addEventListener("click", () => {
    switchPrivateTab("historial");
    void refreshPrivateTabData("historial").catch((error) => {
      setStatus(error?.message || "No se pudo cargar el historial laboral.", "error");
    });
  });
  privateTabGestionButton?.addEventListener("click", () => {
    switchPrivateTab("gestion");
    void refreshPrivateTabData("gestion").catch((error) => {
      setStatus(error?.message || "No se pudo cargar la gestión.", "error");
    });
  });
  privateTabContabilidadButton?.addEventListener("click", () => {
    switchPrivateTab("contabilidad");
    void refreshPrivateTabData("contabilidad").catch((error) => {
      setStatus(error?.message || "No se pudo cargar la contabilidad.", "error");
    });
  });
  privateTabContractsButton?.addEventListener("click", () => {
    switchPrivateTab("contracts");
    void refreshPrivateTabData("contracts").catch((error) => {
      setContractsStatus(error?.message || "No se pudieron cargar los contratos.", "error");
    });
  });
  privateTabPersonalButton?.addEventListener("click", () => {
    switchPrivateTab("personal");
    void refreshPrivateTabData("personal").catch((error) => {
      setPersonalStatus(error?.message || "No se pudo cargar el personal.", "error");
    });
  });
  privateTabSettingsButton?.addEventListener("click", () => {
    switchPrivateTab("settings");
    void refreshPrivateTabData("settings").catch((error) => {
      setSettingsStatus(error?.message || "No se pudo cargar la configuración.", "error");
    });
  });
  privateTabProgrammingButton.addEventListener("click", () => {
    switchPrivateTab("programming");
    void refreshPrivateTabData("programming").catch((error) => {
      setStatus(error?.message || "No se pudo cargar la programacion.", "error");
    });
  });
  settingsSubtabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.settingsView === "reports") {
        closeSettingsDetail({ force: true });
        switchSettingsView("reports");
        void loadHistorialReportConfig({ force: !historialReportConfigLoaded });
        return;
      }
      if (button.dataset.settingsView === "access") {
        if (!currentUserIsAccessAdmin) {
          return;
        }
        closeSettingsDetail({ force: true });
        switchSettingsView("access");
        void loadAccessManagement().catch((error) => {
          setAccessStatus(error?.message || "No se pudieron cargar los accesos.", "error");
        });
        return;
      }

      const catalog = button.dataset.settingsCatalog;
      if (!SETTINGS_CATALOGS[catalog]) {
        return;
      }
      switchSettingsView("catalog");
      currentSettingsCatalog = catalog;
      resetSettingsSort();
      closeSettingsDetail({ force: true });
      void loadSettingsManagement();
    });
  });
  settingsRefreshButton?.addEventListener("click", () => {
    void loadSettingsManagement();
  });
  settingsNewButton?.addEventListener("click", () => {
    openSettingsDetail("new");
  });
  closeSettingsDetailButton?.addEventListener("click", closeSettingsDetail);
  settingsDetailOverlay?.addEventListener("click", closeSettingsDetail);
  settingsDetailClearButton?.addEventListener("click", () => {
    const config = getSettingsCatalogConfig();
    renderSettingsDetailFields(currentSettingsMode === "edit"
      ? currentSettingsRows.find((row) => String(row.id) === currentSettingsEditingId) || {}
      : { id: getNextSettingsId(), activo: true, ...(config.newDefaults || {}) });
  });
  settingsDetailDeleteButton?.addEventListener("click", () => {
    void deleteSettingsDetail();
  });
  settingsDetailForm?.addEventListener("submit", (event) => {
    void saveSettingsDetail(event);
  });
  settingsDetailFields?.addEventListener("change", (event) => {
    const input = event.target.closest("[data-settings-file-target]");
    if (input) {
      void handleSettingsFileDataUrlChange(input);
    }
    applySettingsFieldVisibility();
  });
  settingsDetailFields?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-settings-image-clear]");
    if (button) {
      clearSettingsImageField(button.dataset.settingsImageClear);
    }
  });
  settingsTableHead?.addEventListener("click", (event) => {
    const sortField = event.target.closest("[data-settings-sort]")?.dataset.settingsSort;
    if (!sortField) {
      return;
    }
    currentSettingsSortDirection =
      currentSettingsSortField === sortField && currentSettingsSortDirection === "asc" ? "desc" : "asc";
    currentSettingsSortField = sortField;
    renderSettingsTable();
  });
  settingsTableBody?.addEventListener("click", (event) => {
    const editId = event.target.closest("[data-settings-edit]")?.dataset.settingsEdit;
    if (editId) {
      openSettingsDetail("edit", editId);
    }
  });
  accessRefreshButton?.addEventListener("click", () => {
    void loadAccessManagement();
  });
  accessNewUserButton?.addEventListener("click", () => {
    openAccessUserPanel("new");
  });
  closeAccessUserPanelButton?.addEventListener("click", closeAccessUserPanel);
  accessUserOverlay?.addEventListener("click", closeAccessUserPanel);
  accessUserForm?.addEventListener("submit", (event) => {
    void saveAccessUserFromForm(event);
  });
  accessUserClearButton?.addEventListener("click", closeAccessUserPanel);
  accessUserDeleteButton?.addEventListener("click", () => {
    const userId = accessUserIdInput?.value.trim() || "";
    if (userId) {
      void deleteAccessUser(userId);
    }
  });
  accessUsersTableBody?.addEventListener("click", (event) => {
    const editUserId = event.target.closest("[data-access-edit]")?.dataset.accessEdit;
    if (editUserId) {
      editAccessUser(editUserId);
      return;
    }

    const saveUserId = event.target.closest("[data-access-save]")?.dataset.accessSave;
    if (saveUserId) {
      void saveAccessUserRow(saveUserId);
    }
  });
  contractsNewButton?.addEventListener("click", () => openContractDetailPanel());
  contractsRefreshButton?.addEventListener("click", () => {
    void loadContractsManagement();
  });
  contractsShowInactiveInput?.addEventListener("change", () => {
    renderContractsTable();
    setContractsStatus(
      `Contratos visibles: ${getVisibleContractRows().length} de ${currentContractRows.length}.`,
      "success"
    );
  });
  contractsBulkFieldSelect?.addEventListener("change", () => {
    if (contractsBulkCurrentValueInput) {
      contractsBulkCurrentValueInput.value = "";
    }
    if (contractsBulkNewValueInput) {
      contractsBulkNewValueInput.value = "";
    }
    syncContractsBulkAssignmentUi();
  });
  contractsBulkCurrentValueInput?.addEventListener("input", syncContractsBulkAssignmentUi);
  contractsBulkCurrentBoolSelect?.addEventListener("change", syncContractsBulkAssignmentUi);
  contractsBulkNewValueInput?.addEventListener("input", syncContractsBulkAssignmentUi);
  contractsBulkNewBoolSelect?.addEventListener("change", syncContractsBulkAssignmentUi);
  contractsBulkApplyButton?.addEventListener("click", () => {
    void applyContractsBulkAssignment();
  });
  personalImportExcelButton?.addEventListener("click", () => {
    personalImportExcelInput?.click();
  });
  personalImportExcelInput?.addEventListener("change", () => {
    void importPersonalExcelFile(personalImportExcelInput.files?.[0]);
  });
  closePersonalImportPanelButton?.addEventListener("click", closePersonalImportPanel);
  personalImportOverlay?.addEventListener("click", closePersonalImportPanel);
  personalImportSelectAll?.addEventListener("change", () => {
    toggleAllPersonalImportRows(Boolean(personalImportSelectAll.checked));
  });
  personalImportApplyButton?.addEventListener("click", () => {
    void applySelectedPersonalImportRows();
  });
  personalImportPreviewTableBody?.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-personal-import-select]");
    if (!checkbox) {
      return;
    }
    togglePersonalImportRow(checkbox.dataset.personalImportSelect, Boolean(checkbox.checked));
  });
  historialImportExcelButton?.addEventListener("click", () => {
    historialImportExcelInput?.click();
  });
  historialImportExcelInput?.addEventListener("change", () => {
    void importHistorialExcelFile(historialImportExcelInput.files?.[0]);
  });
  closeHistorialImportPanelButton?.addEventListener("click", closeHistorialImportPanel);
  historialImportOverlay?.addEventListener("click", closeHistorialImportPanel);
  historialImportSelectAll?.addEventListener("change", () => {
    toggleAllHistorialImportRows(Boolean(historialImportSelectAll.checked));
  });
  historialImportApplyButton?.addEventListener("click", () => {
    void applySelectedHistorialImportRows();
  });
  historialImportPreviewTableBody?.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-historial-import-select]");
    if (!checkbox) {
      return;
    }
    toggleHistorialImportRow(checkbox.dataset.historialImportSelect, Boolean(checkbox.checked));
  });
  personalNewButton?.addEventListener("click", startNewPersonal);
  personalRefreshButton?.addEventListener("click", () => {
    void loadPersonalManagement();
  });
  personalVinculacionFilter?.addEventListener("change", applyPersonalFilters);
  personalTextFilter?.addEventListener("input", debounce(applyPersonalFilters, 160));
  personalList?.addEventListener("change", () => {
    selectPersonal(personalList.value);
  });
  personalEditButton?.addEventListener("click", startEditPersonal);
  personalCancelButton?.addEventListener("click", () => {
    if (currentPersonalMode === "new") {
      selectPersonal(filteredPersonalRows[0]?.id || "");
      return;
    }
    selectPersonal(currentSelectedPersonalId);
  });
  personalForm?.addEventListener("submit", (event) => {
    void savePersonal(event);
  });
  personalForm?.addEventListener("input", (event) => {
    if (event.target?.name === "cuenta_corriente") {
      reformatAccountNumberInput(event.target);
    }
  });
  personalComplementoForm?.addEventListener("submit", (event) => {
    void savePersonalComplemento(event);
  });
  personalComplementoForm?.addEventListener("change", (event) => {
    if (
      event.target === personalComplementoSelect ||
      event.target === personalComplementoTipoSelect ||
      event.target === personalComplementoUnidadSelect
    ) {
      updatePersonalComplementoFormVisibility();
    }
  });
  personalComplementoClearButton?.addEventListener("click", resetPersonalComplementoForm);
  personalComplementoDeleteButton?.addEventListener("click", () => {
    if (currentEditingPersonalComplementoId) {
      void deletePersonalComplemento(currentEditingPersonalComplementoId);
    }
  });
  personalComplementosList?.addEventListener("click", (event) => {
    const editId = event.target.closest("[data-personal-complemento-edit]")?.dataset.personalComplementoEdit;
    if (editId) {
      openPersonalComplementoForEdit(editId);
      return;
    }
    const deleteId = event.target.closest("[data-personal-complemento-delete]")?.dataset.personalComplementoDelete;
    if (deleteId) {
      void deletePersonalComplemento(deleteId);
    }
  });
  contractsTableBody?.addEventListener("click", (event) => {
    const contractId = event.target.closest("[data-contract-edit]")?.dataset.contractEdit;
    if (contractId) {
      openContractDetailPanel(contractId);
    }
  });
  closeContractDetailButton?.addEventListener("click", closeContractDetailPanel);
  contractDetailOverlay?.addEventListener("click", closeContractDetailPanel);
  contractDetailForm?.addEventListener("submit", (event) => {
    void saveContract(event);
  });
  contractDetailNightInput?.addEventListener("change", syncContractNightFieldsState);
  contractDetailDeleteButton?.addEventListener("click", () => {
    void deleteCurrentContract();
  });
  contractServiceForm?.addEventListener("submit", (event) => {
    void saveContractService(event);
  });
  contractServiceClearButton?.addEventListener("click", resetContractServiceForm);
  contractServicesList?.addEventListener("click", (event) => {
    const editServiceId = event.target.closest("[data-contract-service-edit]")?.dataset.contractServiceEdit;
    if (editServiceId) {
      editContractService(editServiceId);
      return;
    }

    const deleteServiceId = event.target.closest("[data-contract-service-delete]")?.dataset.contractServiceDelete;
    if (deleteServiceId) {
      void deleteContractService(deleteServiceId);
    }
  });
  contractPersonalAddButton?.addEventListener("click", () => {
    void setContractPersonalBatch(getSelectedOptionValues(contractPersonalAvailableSelect), true);
  });
  contractPersonalRemoveButton?.addEventListener("click", () => {
    void setContractPersonalBatch(getSelectedOptionValues(contractPersonalSelectedSelect), false);
  });
  contractPersonalAvailableSelect?.addEventListener("dblclick", (event) => {
    const value = event.target.closest("option")?.value || contractPersonalAvailableSelect.value;
    if (value) {
      void setContractPersonalBatch([value], true);
    }
  });
  contractPersonalSelectedSelect?.addEventListener("dblclick", (event) => {
    const value = event.target.closest("option")?.value || contractPersonalSelectedSelect.value;
    if (value) {
      void setContractPersonalBatch([value], false);
    }
  });
  contractPersonalFilter?.addEventListener("input", debounce(renderContractAssignmentOptions, 160));
  contractInstallationAddButton?.addEventListener("click", () => {
    void setContractInstallationBatch(getSelectedOptionValues(contractInstallationAvailableSelect), true);
  });
  contractInstallationRemoveButton?.addEventListener("click", () => {
    void setContractInstallationBatch(getSelectedOptionValues(contractInstallationSelectedSelect), false);
  });
  contractInstallationAvailableSelect?.addEventListener("dblclick", (event) => {
    const value =
      event.target.closest("option")?.value || contractInstallationAvailableSelect.value;
    if (value) {
      void setContractInstallationBatch([value], true);
    }
  });
  contractInstallationSelectedSelect?.addEventListener("dblclick", (event) => {
    const value =
      event.target.closest("option")?.value || contractInstallationSelectedSelect.value;
    if (value) {
      void setContractInstallationBatch([value], false);
    }
  });
  contractInstallationFilter?.addEventListener("input", debounce(renderContractAssignmentOptions, 160));
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
  filtersForm.addEventListener("submit", (event) => {
    event.preventDefault();
    currentPage = 1;
    applyCandidateFilters();
  });
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
  eventContractSelect?.addEventListener("change", () => {
    syncEventInstallationOptionsForContract("");
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
  eventPersonnelReportPdfButton?.addEventListener("click", () => {
    void exportEventPersonnelReportToPdf();
  });
  eventPersonnelReportImageButton?.addEventListener("click", showEventPersonnelReportImage);
  closeEventReportImageButton?.addEventListener("click", closeEventReportImagePanel);
  eventReportImageBackdrop?.addEventListener("click", closeEventReportImagePanel);
  copyEventReportImageButton?.addEventListener("click", () => {
    void copyEventReportImageToClipboard();
  });
  downloadEventReportImageButton?.addEventListener("click", () => {
    void downloadEventReportImage();
  });
  eventsFiltersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    renderEventsTable();
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
  eventsTableBody?.addEventListener("input", (event) => {
    const assignmentTimeInput = event.target.closest("[data-event-assignment-time]");
    if (!assignmentTimeInput) {
      return;
    }

    queueEventAssignmentSave(assignmentTimeInput.dataset.eventAssignmentTime);
  });
  eventsTableBody?.addEventListener("change", (event) => {
    const assignmentTimeInput = event.target.closest("[data-event-assignment-time]");
    if (!assignmentTimeInput) {
      return;
    }

    queueEventAssignmentSave(assignmentTimeInput.dataset.eventAssignmentTime);
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
  recordsFiltersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    void loadRecords();
  });
  recordsFiltersForm?.addEventListener("change", (event) => {
    syncFilterResetButtons(recordsFiltersForm);
    // El combo de personal gestiona su propia recarga al elegir/limpiar.
    if (event.target?.id === "records-filter-personal-input") return;
    recordsExternalActivityFilter = document.querySelector("#records-filter-actividad")?.value || "";
    void loadRecords();
  });
  recordsFiltersForm?.addEventListener("input", (event) => {
    syncFilterResetButtons(recordsFiltersForm);
    if (event.target?.id === "records-filter-search") {
      applyRecordsClientFilters();
      renderRecordsTable();
      return;
    }
    if (event.target?.id === "records-filter-personal-input") return;
    recordsExternalActivityFilter = document.querySelector("#records-filter-actividad")?.value || "";
  });
  setupPersonalPicker("records-filter", {
    inputId: "records-filter-personal-input",
    hiddenId: "records-filter-personal",
    suggestionsId: "records-filter-personal-suggestions",
    onChange: () => {
      void loadRecords();
    },
  });
  // Estado inicial de las ✕ (ocultas hasta que su filtro tenga valor).
  syncFilterResetButtons(recordsFiltersForm);
  syncFilterResetButtons(programmingFiltersForm);
  setupPersonalPicker("substitution", {
    inputId: "record-substitution-person-input",
    hiddenId: "record-substitution-person",
    suggestionsId: "record-substitution-person-suggestions",
  });
  historialFiltersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    void loadHistorial();
  });
  historialFiltersForm?.addEventListener("change", (event) => {
    syncFilterResetButtons(historialFiltersForm);
    // El combo de personal gestiona su propia recarga al elegir/limpiar.
    if (event.target?.id === "historial-filter-personal-input") return;
    void loadHistorial();
  });
  historialFiltersForm?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-reset-filter]");
    if (!button || !resetRecordsNamedFilterControl(historialFiltersForm, button.dataset.resetFilter)) {
      return;
    }
    syncFilterResetButtons(historialFiltersForm);
    void loadHistorial();
  });
  setupPersonalPicker("historial-filter", {
    inputId: "historial-filter-personal-input",
    hiddenId: "historial-filter-personal",
    suggestionsId: "historial-filter-personal-suggestions",
    onChange: () => {
      void loadHistorial();
    },
  });
  historialClearFiltersButton?.addEventListener("click", () => {
    historialFiltersForm?.reset();
    clearPersonalPicker("historial-filter");
    syncFilterResetButtons(historialFiltersForm);
    void loadHistorial();
  });
  syncFilterResetButtons(historialFiltersForm);
  historialRefreshButton?.addEventListener("click", () => {
    void loadHistorial();
  });
  historialNewButton?.addEventListener("click", () => {
    void openHistorialNew();
  });
  historialOpenCompaniesSettingsButton?.addEventListener("click", openHistorialReportCompaniesSettings);
  historialOpenReportsSettingsButton?.addEventListener("click", openReportTemplateSettings);
  historialReportConfigDetails?.addEventListener("toggle", () => {
    if (historialReportConfigDetails.open) {
      void loadHistorialReportConfig();
    }
  });
  historialReportConfigRefreshButton?.addEventListener("click", () => {
    void loadHistorialReportConfig({ force: true });
  });
  historialReportTemplateSelect?.addEventListener("change", syncHistorialReportConfigForms);
  historialReportOpenCompaniesButton?.addEventListener("click", openHistorialReportCompaniesSettings);
  historialReportTemplateSaveButton?.addEventListener("click", () => {
    void saveHistorialReportTemplateConfig();
  });
  historialReportTemplateNewButton?.addEventListener("click", startNewHistorialReportTemplate);
  historialDetailReportButton?.addEventListener("click", () => {
    void openHistorialReportPanel();
  });
  historialReportCloseButton?.addEventListener("click", closeHistorialReportPanel);
  historialReportOverlay?.addEventListener("click", closeHistorialReportPanel);
  historialReportStartDate?.addEventListener("change", () => {
    void refreshHistorialReportDraftActivities();
  });
  historialReportGenerateTemplateSelect?.addEventListener("change", () => {
    syncHistorialReportEmailText();
    validateHistorialReportTemplateType({ notify: true });
  });
  historialReportEmailText?.addEventListener("input", () => {
    historialReportEmailTextDirty = true;
  });
  historialReportActivitiesTableBody?.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.historialReportActivityId) return;
    const selectedIds = new Set(historialReportDraft?.selectedActivityIds || []);
    if (input.checked) {
      selectedIds.add(input.dataset.historialReportActivityId);
    } else {
      selectedIds.delete(input.dataset.historialReportActivityId);
    }
    setHistorialReportActivitiesSelection(selectedIds);
  });
  historialReportSelectAllActivitiesButton?.addEventListener("click", () => {
    const ids = (historialReportDraft?.activities || []).map(getHistorialReportActivityKey).filter(Boolean);
    setHistorialReportActivitiesSelection(ids);
  });
  historialReportClearActivitiesButton?.addEventListener("click", () => {
    setHistorialReportActivitiesSelection([]);
  });
  historialReportDownloadButton?.addEventListener("click", () => {
    void exportHistorialLaboralReportPdf();
  });

  setupPersonalPicker("gestion-filter", {
    inputId: "gestion-filter-personal-input",
    hiddenId: "gestion-filter-personal",
    suggestionsId: "gestion-filter-personal-suggestions",
    onChange: () => {
      void loadGestion();
    },
  });
  setupPersonalPicker("programming-filter", {
    inputId: "programming-filter-personal-input",
    hiddenId: "programming-filter-personal",
    suggestionsId: "programming-filter-personal-suggestions",
    onChange: () => {
      applyProgrammingFilters();
      suggestBulkPersonalFromCurrentFilter();
    },
  });
  gestionFiltersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    void loadGestion();
  });
  gestionFilterDesde?.addEventListener("change", () => {
    void loadGestion();
  });
  gestionFilterHasta?.addEventListener("change", () => {
    void loadGestion();
  });
  gestionClearFiltersButton?.addEventListener("click", () => {
    gestionFiltersForm?.reset();
    clearPersonalPicker("gestion-filter");
    void loadGestion();
  });
  gestionRefreshButton?.addEventListener("click", () => {
    void loadGestion();
  });
  gestionNominaList?.addEventListener("click", (event) => {
    const groupToggle = event.target.closest("[data-nomina-group]");
    if (groupToggle) {
      toggleGestionNominaGroup(groupToggle);
      return;
    }
    const totalPersonalId = event.target.closest("[data-gestion-nomina-total]")?.dataset.gestionNominaTotal;
    if (totalPersonalId) {
      void toggleGestionNominaTotal(totalPersonalId);
      return;
    }
    const historialId = event.target.closest("[data-gestion-nomina-historial]")?.dataset.gestionNominaHistorial;
    if (historialId) {
      void toggleGestionNomina(historialId);
    }
  });

  const debouncedContabilidadFilters = debounce(reloadContabilidadFromFilters, 300);
  contabilidadFiltersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    reloadContabilidadFromFilters();
  });
  contabilidadFiltersForm?.addEventListener("change", (event) => {
    // Los buscadores de texto se gestionan con debounce en 'input'.
    if (event.target === contabilidadFilterServicio || event.target === contabilidadFilterSearch) {
      return;
    }
    reloadContabilidadFromFilters();
  });
  contabilidadFilterServicio?.addEventListener("input", debouncedContabilidadFilters);
  contabilidadFilterSearch?.addEventListener("input", debouncedContabilidadFilters);
  contabilidadClearFiltersButton?.addEventListener("click", () => {
    contabilidadFiltersForm?.reset();
    reloadContabilidadFromFilters();
  });
  contabilidadRefreshButton?.addEventListener("click", () => {
    void loadContabilidad();
  });
  contabilidadPageSizeSelect?.addEventListener("change", () => {
    contabilidadPageSize = Number(contabilidadPageSizeSelect.value) || 100;
    contabilidadPage = 1;
    void loadContabilidad();
  });
  contabilidadPrevButton?.addEventListener("click", () => {
    if (contabilidadPage > 1) {
      contabilidadPage -= 1;
      void loadContabilidad();
    }
  });
  contabilidadNextButton?.addEventListener("click", () => {
    contabilidadPage += 1;
    void loadContabilidad();
  });
  document.querySelectorAll("[data-contabilidad-sort-field]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.contabilidadSortField;
      if (!field) {
        return;
      }
      contabilidadSort = {
        field,
        direction:
          contabilidadSort.field === field && contabilidadSort.direction === "asc" ? "desc" : "asc",
      };
      contabilidadPage = 1;
      void loadContabilidad();
    });
  });

  document.querySelectorAll("[data-contabilidad-subtab]").forEach((button) => {
    button.addEventListener("click", () => {
      switchContabilidadSubtab(button.dataset.contabilidadSubtab);
      // Cargamos la subpestaña Banco solo la primera vez que se abre.
      if (currentContabilidadSubtab === "banco" && !bancoLoadedOnce) {
        void loadContabilidadBanco().catch((error) => {
          setStatus(error?.message || "No se pudo cargar el banco.", "error");
        });
      } else if (currentContabilidadSubtab === "resultados") {
        void loadResultados().catch((error) => {
          setStatus(error?.message || "No se pudieron cargar los resultados.", "error");
        });
      } else if (currentContabilidadSubtab === "conciliacion") {
        void loadConciliacion().catch((error) => {
          setStatus(error?.message || "No se pudo cargar la conciliación.", "error");
        });
      }
    });
  });

  const debouncedBancoFilters = debounce(reloadBancoFromFilters, 300);
  bancoFiltersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    reloadBancoFromFilters();
  });
  bancoFiltersForm?.addEventListener("change", (event) => {
    if (event.target === bancoFilterSearch) {
      return;
    }
    reloadBancoFromFilters();
  });
  bancoFilterSearch?.addEventListener("input", debouncedBancoFilters);
  bancoClearFiltersButton?.addEventListener("click", () => {
    bancoFiltersForm?.reset();
    reloadBancoFromFilters();
  });
  bancoRefreshButton?.addEventListener("click", () => {
    void loadContabilidadBanco();
  });
  bancoPageSizeSelect?.addEventListener("change", () => {
    bancoPageSize = Number(bancoPageSizeSelect.value) || 100;
    bancoPage = 1;
    void loadContabilidadBanco();
  });
  bancoPrevButton?.addEventListener("click", () => {
    if (bancoPage > 1) {
      bancoPage -= 1;
      void loadContabilidadBanco();
    }
  });
  bancoNextButton?.addEventListener("click", () => {
    bancoPage += 1;
    void loadContabilidadBanco();
  });
  document.querySelectorAll("[data-banco-sort-field]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.bancoSortField;
      if (!field) {
        return;
      }
      bancoSort = {
        field,
        direction: bancoSort.field === field && bancoSort.direction === "asc" ? "desc" : "asc",
      };
      bancoPage = 1;
      void loadContabilidadBanco();
    });
  });

  const debouncedResultadosFilters = debounce(reloadResultadosFromFilters, 300);
  resultadosFiltersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    reloadResultadosFromFilters();
  });
  resultadosFiltersForm?.addEventListener("change", (event) => {
    if (event.target === resultadosFilterSearch) {
      return;
    }
    reloadResultadosFromFilters();
  });
  resultadosFilterSearch?.addEventListener("input", debouncedResultadosFilters);
  resultadosClearFiltersButton?.addEventListener("click", () => {
    resultadosFiltersForm?.reset();
    reloadResultadosFromFilters();
  });
  resultadosRefreshButton?.addEventListener("click", () => {
    void loadResultados();
  });
  resultadosPageSizeSelect?.addEventListener("change", () => {
    resultadosPageSize = Number(resultadosPageSizeSelect.value) || 100;
    resultadosPage = 1;
    void loadResultados();
  });
  resultadosPrevButton?.addEventListener("click", () => {
    if (resultadosPage > 1) {
      resultadosPage -= 1;
      void loadResultados();
    }
  });
  resultadosNextButton?.addEventListener("click", () => {
    resultadosPage += 1;
    void loadResultados();
  });
  resultadosTableHead?.addEventListener("click", (event) => {
    const field = event.target.closest("[data-resultados-sort-field]")?.dataset.resultadosSortField;
    if (!field) {
      return;
    }
    const currentSort = getResultadosSort();
    resultadosSortByView[currentResultadosView] = {
      field,
      direction: currentSort.field === field && currentSort.direction === "asc" ? "desc" : "asc",
    };
    resultadosPage = 1;
    void loadResultados();
  });
  document.querySelectorAll("[data-resultados-view]").forEach((button) => {
    button.addEventListener("click", () => {
      currentResultadosView = button.dataset.resultadosView === "resumen" ? "resumen" : "detalle";
      document.querySelectorAll("[data-resultados-view]").forEach((viewButton) => {
        const active = viewButton.dataset.resultadosView === currentResultadosView;
        viewButton.classList.toggle("active", active);
        viewButton.setAttribute("aria-pressed", String(active));
      });
      resultadosPage = 1;
      void loadResultados();
    });
  });
  syncResultadosExportButtons();
  resultadosExportExcelButton?.addEventListener("click", () => {
    void exportResultadosResumenExcel();
  });
  resultadosExportPdfButton?.addEventListener("click", () => {
    void exportResultadosResumenPdf();
  });

  conciliacionFiltersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    void loadConciliacion();
  });
  conciliacionFilterDesde?.addEventListener("change", () => {
    void loadConciliacion();
  });
  conciliacionFilterHasta?.addEventListener("change", () => {
    void loadConciliacion();
  });
  conciliacionClearFiltersButton?.addEventListener("click", () => {
    conciliacionFiltersForm?.reset();
    renderConciliacionEmpty("Selecciona un intervalo de fechas (Desde y Hasta).");
  });
  conciliacionRefreshButton?.addEventListener("click", () => {
    void loadConciliacion();
  });
  document.querySelectorAll("[data-conciliacion-cronos-sort-field]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.conciliacionCronosSortField;
      if (!field) {
        return;
      }
      conciliacionCronosSort = {
        field,
        direction:
          conciliacionCronosSort.field === field && conciliacionCronosSort.direction === "asc"
            ? "desc"
            : "asc",
      };
      void loadConciliacion();
    });
  });
  document.querySelectorAll("[data-conciliacion-banco-sort-field]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.conciliacionBancoSortField;
      if (!field) {
        return;
      }
      conciliacionBancoSort = {
        field,
        direction:
          conciliacionBancoSort.field === field && conciliacionBancoSort.direction === "asc"
            ? "desc"
            : "asc",
      };
      void loadConciliacion();
    });
  });

  contabilidadLoadButton?.addEventListener("click", () => contabilidadLoadInput?.click());
  contabilidadLoadInput?.addEventListener("change", () => {
    const file = contabilidadLoadInput.files?.[0];
    contabilidadLoadInput.value = ""; // permitir re-seleccionar el mismo fichero
    if (file) void handleContabilidadCsvLoad(file, "cronos");
  });
  bancoLoadButton?.addEventListener("click", () => bancoLoadInput?.click());
  bancoLoadInput?.addEventListener("change", () => {
    const file = bancoLoadInput.files?.[0];
    bancoLoadInput.value = "";
    if (file) void handleContabilidadCsvLoad(file, "banco");
  });
  historialTable?.addEventListener("click", (event) => {
    const sortField = event.target.closest("[data-historial-sort-field]")?.dataset
      .historialSortField;
    if (!sortField) {
      return;
    }
    if (currentHistorialSort.field === sortField) {
      currentHistorialSort.direction = currentHistorialSort.direction === "asc" ? "desc" : "asc";
    } else {
      currentHistorialSort = {
        field: sortField,
        direction: sortField === "fecha_alta" || sortField === "fecha_baja" ? "desc" : "asc",
      };
    }
    renderHistorialTable(historialRows);
  });
  historialTableBody?.addEventListener("click", (event) => {
    const toggleButton = event.target.closest("[data-historial-toggle]");
    if (toggleButton) {
      const id = String(toggleButton.dataset.historialToggle || "");
      if (expandedHistorialIds.has(id)) {
        expandedHistorialIds.delete(id);
      } else {
        expandedHistorialIds.add(id);
        void ensureHistorialActivitiesLoaded(id);
      }
      renderHistorialTable(historialRows);
      return;
    }
    const selectionCheckbox = event.target.closest("[data-historial-bulk-select]");
    if (selectionCheckbox) {
      const id = String(selectionCheckbox.dataset.historialBulkSelect || "");
      if (selectionCheckbox.checked) {
        selectedHistorialBulkIds.add(id);
      } else {
        selectedHistorialBulkIds.delete(id);
      }
      syncHistorialBulkSelectionUi();
      renderHistorialTable(historialRows);
      return;
    }
    const editButton = event.target.closest("[data-historial-edit]");
    if (editButton) {
      void openHistorialDetail(editButton.dataset.historialEdit);
      return;
    }
    const rowEl = event.target.closest("[data-historial-id]");
    if (rowEl) {
      void openHistorialDetail(rowEl.dataset.historialId);
    }
  });
  historialDetailForm?.addEventListener("submit", (event) => {
    void saveHistorialDetail(event);
  });
  historialDetailCloseButton?.addEventListener("click", closeHistorialDetail);
  historialDetailCancelButton?.addEventListener("click", closeHistorialDetail);
  historialDetailOverlay?.addEventListener("click", closeHistorialDetail);
  historialDetailDeleteButton?.addEventListener("click", () => {
    void deleteHistorialDetail();
  });
  historialDetailDuplicateButton?.addEventListener("click", duplicateHistorialDetail);
  historialBulkFieldSelect?.addEventListener("change", syncHistorialBulkUi);
  historialBulkCurrentValueInput?.addEventListener("input", updateHistorialBulkMatchCount);
  historialBulkCurrentSelect?.addEventListener("change", updateHistorialBulkMatchCount);
  historialBulkApplyButton?.addEventListener("click", () => void applyHistorialBulkAssignment());
  historialBulkSelectButton?.addEventListener("click", () => setHistorialBulkSelectionMode(true));
  historialBulkClearSelectionButton?.addEventListener("click", () => setHistorialBulkSelectionMode(false));
  historialBulkSelectAllCheckbox?.addEventListener("change", () => {
    const visibleIds = historialRows.map((row) => String(row.id));
    if (historialBulkSelectAllCheckbox.checked) {
      visibleIds.forEach((id) => selectedHistorialBulkIds.add(id));
    } else {
      visibleIds.forEach((id) => selectedHistorialBulkIds.delete(id));
    }
    renderHistorialTable(historialRows);
  });
  syncHistorialBulkUi();
  recordsClearFiltersButton?.addEventListener("click", () => {
    recordsExternalActivityFilter = "";
    recordsFiltersForm?.reset();
    syncFilterResetButtons(recordsFiltersForm);
    void loadRecords();
  });
  recordsFiltersForm?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-reset-filter]");
    if (!button || !resetRecordsNamedFilterControl(recordsFiltersForm, button.dataset.resetFilter)) {
      return;
    }
    syncFilterResetButtons(recordsFiltersForm);
    void loadRecords();
  });
  recordsBulkFieldSelect?.addEventListener("change", syncRecordsBulkUi);
  recordsBulkCurrentValueInput?.addEventListener("input", updateRecordsBulkMatchCount);
  recordsBulkCurrentSelect?.addEventListener("change", () => {
    if (recordsBulkFieldSelect?.value === "servicio_id") {
      syncRecordsBulkUi();
      return;
    }
    updateRecordsBulkMatchCount();
  });
  recordsBulkApplyButton?.addEventListener("click", () => void applyRecordsBulkAssignment());
  recordsBulkClearFieldsButton?.addEventListener("click", clearRecordsBulkFields);
  recordsBulkSelectButton?.addEventListener("click", enableRecordsBulkSelection);
  recordsBulkClearSelectionButton?.addEventListener("click", clearRecordsBulkSelection);
  recordsBulkDeleteButton?.addEventListener("click", () => void deleteSelectedBulkRecords());
  recordsReportPreviewButton?.addEventListener("click", () => void openRecordsReportPreview());
  recordsReportPreviewCloseButton?.addEventListener("click", closeRecordsReportPreview);
  recordsReportPreviewBackdrop?.addEventListener("click", closeRecordsReportPreview);
  recordsReportPdfButton?.addEventListener("click", () =>
    void exportRecordsReportPdf(recordsReportPreviewRows)
  );
  recordsReportCompactPdfButton?.addEventListener("click", () =>
    void exportRecordsCompactReportPdf(recordsReportPreviewRows)
  );
  recordsRefreshButton?.addEventListener("click", () => {
    void loadRecords();
  });
  recordsEditModeInput?.addEventListener("change", () => {
    renderRecordsTable();
  });
  recordsTableHead?.addEventListener("click", (event) => {
    const sortButton = event.target.closest("[data-records-sort-field]");
    if (sortButton) {
      toggleRecordsSort(sortButton.dataset.recordsSortField);
    }
  });
  recordsTableHead?.addEventListener("change", (event) => {
    const selectAll = event.target.closest("[data-record-select-all]");
    if (!selectAll) {
      return;
    }
    const visibleIds = filteredRecordsRows.map((row) => String(row.id));
    if (selectAll.checked) {
      visibleIds.forEach((id) => selectedRecordIds.add(id));
    } else {
      visibleIds.forEach((id) => selectedRecordIds.delete(id));
    }
    updateRecordsBulkSelectionUi();
    if (recordsBulkFieldSelect?.value === "servicio_id") {
      syncRecordsBulkUi();
    }
    renderRecordsTable();
  });
  recordsTableBody?.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-record-delete]");
    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      void deleteRecordById(deleteButton.dataset.recordDelete);
      return;
    }
    if (event.target.closest("[data-record-cell]")) {
      return;
    }
    if (event.target.closest("[data-record-select]")) {
      return;
    }
    const row = event.target.closest("[data-record-id]");
    if (row) {
      openRecordDetail(row.dataset.recordId);
    }
  });
  recordsTableBody?.addEventListener("pointerdown", (event) => {
    const control = event.target.closest("select[data-record-cell][data-record-lazy-options]");
    if (control) {
      void ensureRecordRelationSelectOptions(control);
    }
  });
  recordsTableBody?.addEventListener("focusin", (event) => {
    const control = event.target.closest("select[data-record-cell][data-record-lazy-options]");
    if (control) {
      void ensureRecordRelationSelectOptions(control);
    }
  });
  recordsTableBody?.addEventListener("focusout", (event) => {
    const control = event.target.closest("[data-record-cell]");
    if (control && control.type !== "checkbox") {
      void handleRecordCellCommit(control);
    }
  });
  recordsTableBody?.addEventListener("change", (event) => {
    const selectCheckbox = event.target.closest("[data-record-select]");
    if (selectCheckbox) {
      const id = String(selectCheckbox.dataset.recordSelect);
      recordsSelectionMode = true;
      if (selectCheckbox.checked) {
        selectedRecordIds.add(id);
      } else {
        selectedRecordIds.delete(id);
      }
      updateRecordsBulkSelectionUi();
      if (recordsBulkFieldSelect?.value === "servicio_id") {
        syncRecordsBulkUi();
      }
      renderRecordsTable();
      return;
    }
    const control = event.target.closest("[data-record-cell]");
    if (control && (control.type === "checkbox" || control.tagName === "SELECT")) {
      void handleRecordCellCommit(control);
    }
  });
  recordDetailForm?.addEventListener("submit", (event) => {
    void handleRecordDetailSubmit(event);
  });
  recordDetailCloseButton?.addEventListener("click", () => closeRecordDetail());
  recordDetailOverlay?.addEventListener("click", () => closeRecordDetail());
  recordDetailCancelButton?.addEventListener("click", cancelRecordDetailEdit);
  recordDetailDeleteButton?.addEventListener("click", deleteRecordDetail);
  recordDetailDuplicateButton?.addEventListener("click", duplicateRecordDetail);
  recordDetailSubstitutionButton?.addEventListener("click", openRecordSubstitutionPanel);
  recordDetailRemoveSubstitutionButton?.addEventListener("click", () => {
    void removeRecordSubstitution();
  });
  recordSubstitutionConfirmButton?.addEventListener("click", () => {
    void confirmRecordSubstitution();
  });
  recordSubstitutionCancelButton?.addEventListener("click", closeRecordSubstitutionPanel);
  recordSubstitutionOverlay?.addEventListener("click", closeRecordSubstitutionPanel);
  recordDetailOverlay?.addEventListener("click", closeRecordDetail);
  controlClearFiltersButton?.addEventListener("click", clearControlFilters);
  controlTotalsButton?.addEventListener("click", openControlTotalsPanel);
  controlTotalsExportCsvButton?.addEventListener("click", exportControlRecordsToCsv);
  controlTotalsExportPdfButton?.addEventListener("click", exportControlRecordsToPdf);
  controlTotalsReportImageButton?.addEventListener("click", showControlPersonalReportImage);
  controlTotalsReportContent?.addEventListener("click", (event) => {
    const button = event.target.closest(".control-totals-copy-png-button");
    if (!button) {
      return;
    }
    void copyControlTotalsListingImage(
      Number(button.dataset.totalsIndex),
      button.dataset.totalsListing
    );
  });
  closeControlReportImageButton?.addEventListener("click", closeControlReportImagePanel);
  controlReportImageBackdrop?.addEventListener("click", closeControlReportImagePanel);
  copyControlReportImageButton?.addEventListener("click", () => {
    void copyControlReportImageToClipboard();
  });
  downloadControlReportImageButton?.addEventListener("click", () => {
    void downloadControlReportImage();
  });
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
  controlImportPreviewFilters?.addEventListener("submit", (event) => {
    event.preventDefault();
    applyControlImportPreviewFilters();
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
  controlFiltersForm.addEventListener("submit", (event) => {
    event.preventDefault();
    controlCurrentPage = 1;
    controlPersonalSuggestions?.classList.add("hidden");
    void fetchControlFilterOptions().then(() => fetchControlRecords());
  });
  controlFiltersForm.addEventListener("input", (event) => {
    syncFilterResetButtons(controlFiltersForm);
    if (event.target === controlPersonalInput) {
      updateControlPersonalClear();
      renderControlPersonalSuggestions();
      debouncedControlTextFilters();
      return;
    }

    debouncedControlOptionFilters();
  });
  controlFiltersForm.addEventListener("change", (event) => {
    controlCurrentPage = 1;
    syncFilterResetButtons(controlFiltersForm);
    if (event.target === controlPersonalInput) {
      updateControlPersonalClear();
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
      updateControlPersonalClear();
      controlCurrentPage = 1;
      void fetchControlRecords();
      return;
    }

    resetSingleControlFilter(resetButton.dataset.resetFilter);
    syncFilterResetButtons(controlFiltersForm);
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
    updateControlPersonalClear();
    controlCurrentPage = 1;
    void fetchControlRecords();
  });
  controlPersonalInput?.addEventListener("blur", () => {
    window.setTimeout(() => {
      controlPersonalSuggestions?.classList.add("hidden");
    }, 200);
  });
  controlPersonalToggleButton?.addEventListener("mousedown", (event) => {
    event.preventDefault();
    if (controlPersonalSuggestions?.classList.contains("hidden")) {
      controlPersonalInput?.focus();
      renderControlPersonalSuggestions();
    } else {
      controlPersonalSuggestions?.classList.add("hidden");
    }
  });
  controlPersonalClearButton?.addEventListener("mousedown", (event) => {
    event.preventDefault();
    controlPersonalInput.value = "";
    controlPersonalSuggestions?.classList.add("hidden");
    updateControlPersonalClear();
    controlCurrentPage = 1;
    void fetchControlRecords();
  });
  updateControlPersonalClear();
  syncFilterResetButtons(controlFiltersForm);
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
  programmingImportPreviewFilters?.addEventListener("submit", (event) => {
    event.preventDefault();
    applyProgrammingImportPreviewFilters();
  });
  programmingImportPreviewFilters?.addEventListener("input", debouncedProgrammingImportFilters);
  programmingImportForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const file = programmingImportFileInput?.files?.[0];
    if (!file) {
      setProgrammingImportStatus("Selecciona un archivo Word o CSV para cargar datos.", "error");
      return;
    }

    const isCsv = isProgrammingCsvFile(file);
    const prepareFile = isCsv ? prepareProgrammingImportCsv : prepareProgrammingWordFile;
    const fileLabel = isCsv ? "CSV" : "Word";

    setProgrammingImportStatus(`Procesando ${fileLabel}...`);
    void prepareFile(file)
      .then(() => {
        setProgrammingImportStatus(
          `${fileLabel} procesado correctamente. Registros detectados: ${pendingProgrammingImportRows.length}.`,
          "success"
        );
      })
      .catch((error) => {
        setProgrammingImportStatus(`No se pudo procesar el ${fileLabel}: ${error.message}`, "error");
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
  programmingFiltersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
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
    syncFilterResetButtons(programmingFiltersForm);
  });
  programmingFiltersForm?.addEventListener("input", () => syncFilterResetButtons(programmingFiltersForm));
  programmingFiltersForm?.addEventListener("change", () => syncFilterResetButtons(programmingFiltersForm));
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

