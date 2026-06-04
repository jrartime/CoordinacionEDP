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
    return createClient(supabaseConfig.url, supabaseConfig.anonKey);
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
      const file = form.elements.cv_file?.files?.[0] ?? null;
      const attachmentPath = await uploadFileToSupabase(candidateId, file);
      await saveCandidate(buildCandidatePayload(form, candidateId, file, attachmentPath));

      form.reset();
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
    form.addEventListener("submit", (event) => {
      void handleSubmit(event);
    });
    syncSportSpecialtiesVisibility();
  }

  init();
})();
