// Prueba sin conexión del anexo RD 723/2026: construye el PDF con datos de ejemplo y lista lo que
// quedaría «pendiente». No toca la base de datos.
//
//   node scripts/probar-anexo-rd723.mjs <carpeta-con-node_modules-de-jspdf> <salida.pdf>
//
// jsPDF no está en el repositorio (la app lo carga de esm.sh); para probar, instalarlo aparte:
//   npm install jspdf@2.5.1   (en una carpeta temporal)

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [carpetaJspdf, salida = "anexo-rd723-prueba.pdf"] = process.argv.slice(2);
if (!carpetaJspdf) {
  console.error("Uso: node scripts/probar-anexo-rd723.mjs <carpeta-con-jspdf> [salida.pdf]");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { jsPDF } = require(require.resolve("jspdf", { paths: [resolve(carpetaJspdf)] }));
const modulo = require("../coordinacion/rd723-anexo.js");

// Datos de ejemplo (persona ficticia). Convenio y tarifa tal como están en la ficha y en la
// tabla de tarifas (IV Convenio de Ocio, Tabla A, monitor/a, desde el 01/10/2026).
const datos = {
  tipo: "alta",
  fecha_documento: "2026-11-17",
  ciudad: "Oviedo",
  persona: { nombre: "Persona de Prueba", dni: "00000000T", genero: "M", email: "persona@example.com", movil: "600000000" },
  empresa: {
    razon_social: "EDUCACIÓN DEPORTIVA DEL PRINCIPADO, S.L.",
    cif: "B00000000",
    ciudad_firma: "Oviedo",
    firmante_nombre: "Nombre del firmante",
    firmante_cargo: "Administrador",
    direccion_pie: "Calle Ejemplo 1, 33000 Oviedo",
    lugar_consulta_documentos: "En la sede de la empresa",
    mutua_nombre: "UMIVALE",
    mutua_numero: "3",
    usa_sistemas_algoritmicos: false,
  },
  historial: {
    id: 1,
    fecha_alta: "2026-12-01",
    fecha_baja: null,
    jornada: 27.5,
    jornada_maxima: 38.5,
    puesto: "Monitor/a de ocio educativo y tiempo libre",
    tipo_contratacion: "Fijo discontinuo",
    contrato_laboral_clave: "300",
    contrato_laboral_jornada: "Fijo discontinuo",
    contrato_laboral_descripcion: "Contrato indefinido fijo-discontinuo a tiempo parcial",
  },
  categoria: {
    grupo_nivel: "OEASC 3.12 Monitor de ocio educativo y tiempo libre",
    nivel: "Monitor/a de ocio educativo y tiempo libre",
  },
  convenio: {
    nombre: "IV Convenio Colectivo Marco Estatal de Ocio Educativo y Animación Sociocultural",
    codigo: "99100055012011",
    boe_numero: "62",
    boe_fecha: "2026-03-11",
    vigente_hasta: "2027-12-31",
    articulo_prorroga: "artículo 3",
    jornada_maxima_anual_horas: 1742,
    jornada_maxima_semanal_horas: 38.5,
    periodo_prueba_texto: "1 mes, salvo que por las circunstancias concretas de la contratación no proceda establecerlo o exista una regla válida más favorable/aplicable.",
    vacaciones_dias: 30,
    vacaciones_notas: "30 días naturales por año completo de servicios, o la parte proporcional que corresponda.",
    preaviso_llamamiento_dias: 15,
    preaviso_llamamiento_articulo: "artículo 25",
    preaviso_cese_dias: 15,
    horas_complementarias_pct: 30,
    horas_complementarias_preaviso: "3 días (mínimo del artículo 12.5 del Estatuto de los Trabajadores)",
    preaviso_cese_notas: "Para los grupos III a VI, 15 días conforme al IV Convenio, salvo norma más favorable o supuesto específico aplicable.",
  },
  convenio_es_ocio: true,
  tarifa: { vigente_desde: "2026-10-01", salario_anual: 18027.98, salario_mensual: 1287.71, pagas_anuales: 14, hora_complementaria: 10.35 },
  centros: ["CEIP Ejemplo (Oviedo)", "CEIP Otro (Oviedo)"],
  horario_texto: "Lunes a viernes 08:45-14:15",
  documentos: [
    { tipo: "plan_igualdad", se_adjunta: true, nombre_archivo: "plan.pdf", ruta_storage: "x" },
    { tipo: "protocolo_acoso", se_adjunta: false, nombre_archivo: "acoso.pdf", ruta_storage: "x" },
  ],
  manual: {},
  // Tramos de actividad del contrato de servicio (ejemplo: curso escolar) y un complemento propio.
  periodos: [
    { contrato_id: 1, fecha_inicio: "2026-09-15", fecha_fin: "2026-12-22" },
    { contrato_id: 1, fecha_inicio: "2027-01-08", fecha_fin: "2027-06-22" },
  ],
  complementos_persona: [
    { nombre: "Plus de responsabilidad", tipo: "fijo", unidad: "mensual", importe: 50 },
    { nombre: "Plus nocturno", tipo: "fijo", unidad: "por_hora", importe: 1.5 },
  ],
};

const anexo = modulo.buildAnexo(datos);
const doc = modulo.renderAnexoPdf(jsPDF, datos, anexo);
writeFileSync(salida, Buffer.from(doc.output("arraybuffer")));

console.log(`PDF: ${salida} · páginas: ${doc.getNumberOfPages()} · bloques: ${anexo.bloques.length}`);
console.log(`Pendientes (${anexo.pendientes.length}):`);
anexo.pendientes.forEach((p) => console.log(` - ${p}`));
