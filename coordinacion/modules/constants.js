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
  "access",
]);
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
