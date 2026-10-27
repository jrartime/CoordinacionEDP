(function () {
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

  const config = window.APP_CONFIG ?? {};
  const supabaseConfig = config.supabase ?? {};
  const hasSupabaseConfig =
    Boolean(supabaseConfig.url) &&
    Boolean(supabaseConfig.anonKey) &&
    Boolean(supabaseConfig.bucket);

  const form = document.querySelector("#public-candidate-form");
  const submitButton = document.querySelector("#submit-candidate-button");
  const statusMessage = document.querySelector("#status-message");
  const toast = document.querySelector("#public-toast");
  const sportRoleCheckbox = document.querySelector("#public-sport-role");
  const sportSpecialtiesGroup = document.querySelector("#public-sport-specialties-group");

  // El cliente Supabase se gestiona desde shared/supabase-client.js
  // window.SupabaseApp.getClient() reemplaza a getSupabaseClient()

  function setStatus(message, tone = "") {
    if (!statusMessage) {
      return;
    }

    statusMessage.textContent = message;
    statusMessage.className = `status-message ${tone}`.trim();
  }

  function showToast(message) {
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.remove("hidden");
    window.setTimeout(() => {
      toast.classList.add("hidden");
    }, 4500);
  }

  function normalizeText(value) {
    return String(value ?? "").trim();
  }

  function sanitizeFileName(fileName) {
    return normalizeText(fileName)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "archivo";
  }

  // --- Fichero del currículum -------------------------------------------------
  // Solo se adjunta lo que luego se puede abrir sin más: PDF o imagen. Los .docx
  // se convierten a PDF en el navegador antes de subirse; el resto se rechaza.
  const CDN_MAMMOTH = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js";
  const CDN_HTML2PDF = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
  const IMAGE_MIMES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  const MAX_CV_BYTES = 10 * 1024 * 1024;

  const cvInput = form?.elements.cv_file ?? null;
  let preparedCv = null; // File listo para subir; null si no hay o se rechazó
  let cvPreparation = Promise.resolve();

  function getExtension(fileName) {
    const match = /\.([a-z0-9]+)$/i.exec(normalizeText(fileName));
    return match ? match[1].toLowerCase() : "";
  }

  function loadScript(src, globalName) {
    if (window[globalName]) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("No se pudo cargar el conversor de documentos. Adjunta el currículum en PDF."));
      document.head.appendChild(script);
    });
  }

  async function convertDocxToPdf(file) {
    await Promise.all([loadScript(CDN_MAMMOTH, "mammoth"), loadScript(CDN_HTML2PDF, "html2pdf")]);

    const { value: html } = await window.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    if (!normalizeText(html.replace(/<[^>]*>/g, "")) && !/<img/i.test(html)) {
      throw new Error("El documento Word está vacío o no se ha podido leer. Adjúntalo en PDF.");
    }

    const holder = document.createElement("div");
    holder.style.cssText =
      "position:fixed;left:-10000px;top:0;width:700px;padding:0;background:#fff;color:#000;" +
      "font:12pt/1.4 Calibri,Arial,sans-serif;";
    holder.innerHTML =
      "<style>img{max-width:100%}table{border-collapse:collapse}td,th{border:1px solid #999;padding:3px 6px}" +
      "p{margin:0 0 .6em}h1,h2,h3{margin:.8em 0 .4em}</style>" + html;
    document.body.appendChild(holder);

    try {
      const blob = await window
        .html2pdf()
        .set({
          margin: [15, 15, 15, 15],
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(holder)
        .outputPdf("blob");
      const pdfName = `${normalizeText(file.name).replace(/\.[^.]+$/, "") || "curriculum"}.pdf`;
      return new File([blob], pdfName, { type: "application/pdf" });
    } finally {
      holder.remove();
    }
  }

  /** Devuelve el File a subir (PDF o imagen) o lanza un Error con el motivo. */
  async function prepareCvFile(file) {
    const extension = getExtension(file.name);
    let prepared;

    if (extension === "doc") {
      throw new Error(
        "Los archivos .doc antiguos no se pueden convertir. Guárdalo como .docx o PDF y vuelve a adjuntarlo.",
      );
    } else if (extension === "pdf") {
      prepared = file.type === "application/pdf" ? file : new File([file], file.name, { type: "application/pdf" });
    } else if (IMAGE_MIMES[extension]) {
      prepared =
        file.type === IMAGE_MIMES[extension] ? file : new File([file], file.name, { type: IMAGE_MIMES[extension] });
    } else if (extension === "docx") {
      prepared = await convertDocxToPdf(file);
    } else {
      throw new Error("Formato no admitido. Adjunta el currículum en PDF, Word (.docx) o imagen (JPG, PNG o WebP).");
    }

    if (prepared.size > MAX_CV_BYTES) {
      throw new Error("El archivo supera los 10 MB. Adjunta uno más ligero.");
    }

    return prepared;
  }

  function handleCvChange() {
    const file = cvInput.files?.[0] ?? null;
    preparedCv = null;

    if (!file) {
      cvPreparation = Promise.resolve();
      return;
    }

    const isDocx = getExtension(file.name) === "docx";
    if (isDocx) {
      setStatus("Convirtiendo el documento Word a PDF...", "");
    }
    submitButton.disabled = true;

    const current = prepareCvFile(file)
      .then((prepared) => {
        if (cvInput.files?.[0] !== file) {
          return;
        }
        preparedCv = prepared;
        setStatus(isDocx ? `Documento convertido a PDF (${prepared.name}).` : "", isDocx ? "success" : "");
      })
      .catch((error) => {
        if (cvInput.files?.[0] !== file) {
          return;
        }
        cvInput.value = "";
        setStatus(error?.message || "No se pudo preparar el archivo.", "error");
      })
      .finally(() => {
        if (cvPreparation === current) {
          submitButton.disabled = false;
        }
      });
    cvPreparation = current;
  }

  function getSelectedValues(formElement, name) {
    return Array.from(formElement.querySelectorAll(`input[name="${name}"]:checked`))
      .map((input) => input.value)
      .filter(Boolean);
  }

  function createCandidateId() {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return `candidate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function syncSportSpecialtiesVisibility() {
    if (!sportSpecialtiesGroup || !sportRoleCheckbox) {
      return;
    }

    const isVisible = sportRoleCheckbox.checked;
    sportSpecialtiesGroup.classList.toggle("hidden-submenu", !isVisible);

    if (!isVisible) {
      sportSpecialtiesGroup
        .querySelectorAll('input[name="public_sport_specialties"]')
        .forEach((input) => {
          input.checked = false;
        });
    }
  }

  /**
   * Delegamos al cliente compartido.
   * Si window.SupabaseApp no está disponible (carga directa sin shared/supabase-client.js),
   * creamos el cliente localmente como fallback.
   */
  async function getSupabaseClient() {
    if (window.SupabaseApp) {
      return window.SupabaseApp.getClient();
    }

    // Fallback: instancia local (sin compartir)
    if (!hasSupabaseConfig) {
      throw new Error("Falta la configuracion de Supabase en config.js.");
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    return createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      db: { schema: supabaseConfig.schema ?? "public" },
    });
  }

  async function uploadFileToSupabase(candidateId, file) {
    if (!file) {
      return "";
    }

    const supabase = await getSupabaseClient();
    const safeName = sanitizeFileName(file.name);
    const path = `public/${candidateId}/${Date.now()}-${safeName}`;
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

  async function saveCandidate(payload) {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("candidates").insert(payload);

    if (error) {
      throw error;
    }
  }

  function buildCandidatePayload(formElement, candidateId, file, attachmentPath) {
    const selectedRoles = getSelectedValues(formElement, "public_roles");
    const sportSpecialties = selectedRoles.includes("Monitorado deportivo")
      ? getSelectedValues(formElement, "public_sport_specialties")
      : [];

    return {
      id: candidateId,
      full_name: normalizeText(formElement.elements.full_name?.value),
      phone: normalizeText(formElement.elements.phone?.value),
      email: normalizeText(formElement.elements.email?.value),
      registration_date: new Date().toISOString().slice(0, 10),
      candidate_status: "Pendiente",
      job_roles: selectedRoles,
      sport_specialties: sportSpecialties,
      tags: [],
      notes: normalizeText(formElement.elements.notes?.value),
      observations: normalizeText(formElement.elements.observations?.value),
      attachment_name: file?.name || "",
      attachment_path: attachmentPath,
      attachment_mime_type: file?.type || "",
      privacy_accepted: Boolean(formElement.elements.privacy_acceptance?.checked),
      vacancy_consent: Boolean(formElement.elements.vacancy_consent?.checked),
      source: "public",
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!hasSupabaseConfig) {
      setStatus("Falta la configuracion de Supabase. No se puede enviar el formulario.", "error");
      return;
    }

    const selectedRoles = getSelectedValues(form, "public_roles");
    if (!selectedRoles.length) {
      setStatus("Selecciona al menos un puesto.", "error");
      return;
    }

    const invalidRoles = selectedRoles.filter((role) => !JOB_OPTIONS.includes(role));
    if (invalidRoles.length) {
      setStatus("Hay puestos no validos en el formulario. Recarga la pagina.", "error");
      return;
    }

    submitButton.disabled = true;
    setStatus("Enviando candidatura...", "");

    try {
      const candidateId = createCandidateId();
      await cvPreparation;
      if (cvInput?.files?.length && !preparedCv) {
        throw new Error("El currículum adjunto no es válido. Quítalo o adjunta un PDF, Word (.docx) o imagen.");
      }
      const file = preparedCv;
      const attachmentPath = await uploadFileToSupabase(candidateId, file);
      await saveCandidate(buildCandidatePayload(form, candidateId, file, attachmentPath));

      form.reset();
      preparedCv = null;
      syncSportSpecialtiesVisibility();
      setStatus("Candidatura enviada correctamente.", "success");
      showToast("Candidatura enviada correctamente.");
    } catch (error) {
      setStatus(error?.message || "No se pudo enviar la candidatura.", "error");
    } finally {
      submitButton.disabled = false;
    }
  }

  function init() {
    if (!form) {
      return;
    }

    if (!hasSupabaseConfig) {
      setStatus("Falta la configuracion de Supabase en config.js.", "error");
    }

    sportRoleCheckbox?.addEventListener("change", syncSportSpecialtiesVisibility);
    cvInput?.addEventListener("change", handleCvChange);
    form.addEventListener("submit", (event) => {
      void handleSubmit(event);
    });
    syncSportSpecialtiesVisibility();
  }

  init();
})();
