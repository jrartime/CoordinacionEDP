(function () {
  "use strict";

  // Conversión de un documento de Word (.docx) a PDF, en el navegador y sin servidor.
  //
  // Se lee el .docx con mammoth (a HTML) y se redibuja con jsPDF: párrafos, títulos, listas,
  // negrita y cursiva, saltos de línea y tablas sencillas. Es una conversión SIMPLIFICADA: no
  // conserva imágenes, columnas, cabeceras y pies, ni la maquetación exacta. Para un documento
  // que deba quedar idéntico, conviene guardarlo como PDF desde Word.
  //
  // El constructor del PDF (htmlAPdf) no toca el DOM de la página, para poder probarlo.

  const MAMMOTH_URL = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";

  let mammothPromise = null;

  function cargarMammoth() {
    if (typeof window !== "undefined" && window.mammoth) return Promise.resolve(window.mammoth);
    if (!mammothPromise) {
      mammothPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = MAMMOTH_URL;
        script.onload = () => (window.mammoth ? resolve(window.mammoth) : reject(new Error("El conversor de Word no se inicializó.")));
        script.onerror = () => {
          mammothPromise = null;
          reject(new Error("No se pudo cargar el conversor de Word (¿hay conexión?)."));
        };
        document.head.appendChild(script);
      });
    }
    return mammothPromise;
  }

  function esWord(archivo) {
    return /\.docx$/i.test(archivo?.name || "") || archivo?.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  function esWordAntiguo(archivo) {
    return /\.doc$/i.test(archivo?.name || "") || archivo?.type === "application/msword";
  }

  // ---- HTML de mammoth -> bloques sencillos
  function runsDe(nodo, estilo = { bold: false, italic: false }) {
    const runs = [];
    nodo.childNodes.forEach((hijo) => {
      if (hijo.nodeType === 3) {
        const texto = hijo.nodeValue.replace(/\s+/g, " ");
        if (texto) runs.push({ text: texto, bold: estilo.bold, italic: estilo.italic });
      } else if (hijo.nodeType === 1) {
        const etiqueta = hijo.tagName.toLowerCase();
        if (etiqueta === "br") {
          runs.push({ br: true });
        } else if (etiqueta === "img") {
          // Las imágenes no se conservan.
        } else {
          const nuevo = {
            bold: estilo.bold || etiqueta === "strong" || etiqueta === "b",
            italic: estilo.italic || etiqueta === "em" || etiqueta === "i",
          };
          runs.push(...runsDe(hijo, nuevo));
        }
      }
    });
    return runs;
  }

  function textoPlano(nodo) {
    return String(nodo.textContent || "").replace(/\s+/g, " ").trim();
  }

  function bloquesDe(nodo, bloques, nivel = 0, contador = null) {
    nodo.childNodes.forEach((hijo) => {
      if (hijo.nodeType !== 1) return;
      const etiqueta = hijo.tagName.toLowerCase();
      if (/^h[1-6]$/.test(etiqueta)) {
        bloques.push({ t: "titulo", nivel: Number(etiqueta[1]), runs: runsDe(hijo, { bold: true, italic: false }) });
      } else if (etiqueta === "p") {
        bloques.push({ t: "parrafo", runs: runsDe(hijo) });
      } else if (etiqueta === "ul" || etiqueta === "ol") {
        let n = 0;
        hijo.childNodes.forEach((li) => {
          if (li.nodeType !== 1 || li.tagName.toLowerCase() !== "li") return;
          n += 1;
          const anidados = Array.from(li.children).filter((c) => /^(ul|ol)$/i.test(c.tagName));
          const copia = li.cloneNode(true);
          Array.from(copia.children)
            .filter((c) => /^(ul|ol)$/i.test(c.tagName))
            .forEach((c) => c.remove());
          bloques.push({ t: "item", nivel, marca: etiqueta === "ol" ? `${n}.` : "•", runs: runsDe(copia) });
          anidados.forEach((a) => bloquesDe({ childNodes: [a] }, bloques, nivel + 1));
        });
      } else if (etiqueta === "table") {
        const filas = Array.from(hijo.querySelectorAll("tr")).map((tr) =>
          Array.from(tr.children).map((celda) => textoPlano(celda))
        );
        if (filas.length) bloques.push({ t: "tabla", filas });
      } else if (etiqueta === "div" || etiqueta === "section" || etiqueta === "body") {
        bloquesDe(hijo, bloques, nivel);
      }
    });
    return bloques;
  }

  // ---- Bloques -> PDF
  function dibujar(doc, bloques) {
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const margen = 20;
    const margenInferior = 20;
    const anchoUtil = ancho - margen * 2;
    let y = margen;

    const hueco = (altura) => {
      if (y + altura <= alto - margenInferior) return;
      doc.addPage();
      y = margen;
    };
    const estilo = (r) => (r.bold && r.italic ? "bolditalic" : r.bold ? "bold" : r.italic ? "italic" : "normal");

    function escribirRuns(runs, { x, anchoLinea, tam, interlineado, despues }) {
      const palabras = [];
      runs.forEach((r) => {
        if (r.br) {
          palabras.push({ br: true });
          return;
        }
        String(r.text)
          .split(/(\s+)/)
          .filter((t) => t !== "")
          .forEach((t) => palabras.push({ t, bold: r.bold, italic: r.italic }));
      });
      let linea = [];
      let ocupado = 0;
      const vaciar = () => {
        while (linea.length && /^\s+$/.test(linea[linea.length - 1].t)) linea.pop();
        hueco(interlineado);
        let cx = x;
        linea.forEach((p) => {
          doc.setFont("helvetica", estilo(p));
          doc.setFontSize(tam);
          doc.text(p.t, cx, y);
          cx += p.w;
        });
        y += interlineado;
        linea = [];
        ocupado = 0;
      };
      palabras.forEach((p) => {
        if (p.br) {
          vaciar();
          return;
        }
        doc.setFont("helvetica", estilo(p));
        doc.setFontSize(tam);
        p.w = doc.getTextWidth(p.t);
        if (/^\s+$/.test(p.t)) {
          if (linea.length) {
            linea.push(p);
            ocupado += p.w;
          }
          return;
        }
        if (ocupado + p.w > anchoLinea && linea.length) vaciar();
        linea.push(p);
        ocupado += p.w;
      });
      if (linea.length) vaciar();
      y += despues;
    }

    bloques.forEach((b) => {
      if (b.t === "titulo") {
        const tam = Math.max(11, 17 - b.nivel * 1.5);
        y += 2;
        escribirRuns(b.runs, { x: margen, anchoLinea: anchoUtil, tam, interlineado: tam * 0.5, despues: 2 });
      } else if (b.t === "parrafo") {
        if (!b.runs.some((r) => r.br || String(r.text || "").trim())) {
          y += 3;
          return;
        }
        escribirRuns(b.runs, { x: margen, anchoLinea: anchoUtil, tam: 10.5, interlineado: 5, despues: 2 });
      } else if (b.t === "item") {
        const sangria = 6 + b.nivel * 6;
        hueco(5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.text(b.marca, margen + sangria - 5, y);
        escribirRuns(b.runs, { x: margen + sangria, anchoLinea: anchoUtil - sangria, tam: 10.5, interlineado: 5, despues: 1 });
      } else if (b.t === "tabla") {
        const columnas = Math.max(...b.filas.map((f) => f.length));
        const anchoColumna = anchoUtil / columnas;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        b.filas.forEach((fila) => {
          const lineas = Array.from({ length: columnas }, (_v, i) => doc.splitTextToSize(fila[i] || "", anchoColumna - 3));
          const altura = Math.max(7, Math.max(...lineas.map((l) => l.length)) * 4.2 + 3);
          hueco(altura);
          lineas.forEach((l, i) => {
            doc.setDrawColor(160, 160, 160);
            doc.rect(margen + i * anchoColumna, y, anchoColumna, altura);
            doc.text(l, margen + i * anchoColumna + 1.5, y + 4.5);
          });
          y += altura;
        });
        y += 3;
      }
    });
    return doc;
  }

  function htmlABloques(html) {
    const documento = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    return bloquesDe(documento.body, []);
  }

  async function htmlAPdf(html, jsPDFClass) {
    const doc = new jsPDFClass({ orientation: "portrait", unit: "mm", format: "a4" });
    dibujar(doc, htmlABloques(html));
    return doc;
  }

  // Convierte un .docx en un File PDF. jsPDFClass es opcional (en el navegador se carga solo).
  async function convertir(archivo, jsPDFClass) {
    if (esWordAntiguo(archivo)) {
      throw new Error(`«${archivo.name}» es un Word antiguo (.doc): guárdalo como .docx o como PDF y vuelve a anexarlo.`);
    }
    if (!esWord(archivo)) throw new Error(`«${archivo.name}» no es un documento de Word.`);
    const mammoth = await cargarMammoth();
    const resultado = await mammoth.convertToHtml({ arrayBuffer: await archivo.arrayBuffer() });
    const Clase = jsPDFClass || (await import("https://esm.sh/jspdf@2.5.1")).jsPDF;
    const doc = await htmlAPdf(resultado.value, Clase);
    const bytes = doc.output("arraybuffer");
    return new File([bytes], archivo.name.replace(/\.docx$/i, "") + ".pdf", { type: "application/pdf" });
  }

  if (typeof window !== "undefined") {
    window.CoordinacionWordPdf = { convertir, esWord, esWordAntiguo };
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { htmlABloques, htmlAPdf, esWord, esWordAntiguo };
  }
})();
