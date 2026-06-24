(function () {
  "use strict";

  const TEMPLATE_CONFIGS = {
    default: {
      url: "./plantilla.jpeg",
      width: 1024,
      height: 768,
      centerX: 512,
      nameLines: [
        { y: 320, maxWidth: 800, maxSize: 64, minSize: 30 },
        { y: 446, maxWidth: 800, maxSize: 64, minSize: 30 },
      ],
      centerLine: { x: 512, y: 654, maxWidth: 570, maxSize: 44, minSize: 24 },
    },
    pequecampus: {
      url: "./plantilla-pequecampus.png",
      width: 1004,
      height: 650,
      centerX: 502,
      nameLines: [
        { y: 340, maxWidth: 730, maxSize: 52, minSize: 28 },
        { y: 436, maxWidth: 730, maxSize: 52, minSize: 28 },
      ],
      centerLine: { x: 494, y: 574, maxWidth: 720, maxSize: 36, minSize: 22 },
    },
  };
  const PEQUECAMPUS_CENTER_KEY = "pistas de tenis y padel de parque del oeste";

  const form = document.querySelector("#email-form");
  const emailInput = document.querySelector("#email-input");
  const clearButton = document.querySelector("#clear-button");
  const statusMessage = document.querySelector("#status-message");
  const resultsSection = document.querySelector("#results-section");
  const resultsSummary = document.querySelector("#results-summary");
  const cardsGrid = document.querySelector("#cards-grid");

  const templateImagePromises = new Map();
  let currentSearchEmail = "";

  function setStatus(message, tone = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message";
    if (tone) {
      statusMessage.classList.add(tone);
    }
  }

  function normalizeText(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ");
  }

  function normalizeKey(value) {
    return normalizeText(value)
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function slugify(value) {
    const slug = normalizeKey(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "carne";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function getTemplateConfig(row) {
    const centerKey = normalizeKey(row?.centro);
    const isPequecampusCenter =
      centerKey === PEQUECAMPUS_CENTER_KEY ||
      (centerKey.includes("tenis") &&
        centerKey.includes("padel") &&
        centerKey.includes("parque del oeste"));
    return isPequecampusCenter ? TEMPLATE_CONFIGS.pequecampus : TEMPLATE_CONFIGS.default;
  }

  function loadTemplateImage(template) {
    if (templateImagePromises.has(template.url)) {
      return templateImagePromises.get(template.url);
    }

    const imagePromise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo cargar la plantilla del carné."));
      image.src = template.url;
    });

    templateImagePromises.set(template.url, imagePromise);
    return imagePromise;
  }

  function fitFontSize(ctx, text, fontFamily, weight, maxWidth, startSize, minSize) {
    let size = startSize;
    while (size > minSize) {
      ctx.font = `${weight} ${size}px ${fontFamily}`;
      if (ctx.measureText(text).width <= maxWidth) {
        return size;
      }
      size -= 2;
    }
    return minSize;
  }

  function fitSharedFontSize(ctx, texts, fontFamily, weight, options) {
    const longestText = texts
      .filter(Boolean)
      .reduce((longest, text) => (text.length > longest.length ? text : longest), "");
    return fitFontSize(
      ctx,
      longestText,
      fontFamily,
      weight,
      options.maxWidth,
      options.maxSize,
      options.minSize
    );
  }

  function wrapName(ctx, name, maxWidth) {
    const words = normalizeText(name).split(" ").filter(Boolean);
    if (words.length <= 1) {
      return [normalizeText(name), ""];
    }

    let best = [normalizeText(name), ""];
    let bestScore = Number.POSITIVE_INFINITY;

    for (let index = 1; index < words.length; index += 1) {
      const first = words.slice(0, index).join(" ");
      const second = words.slice(index).join(" ");
      const firstWidth = ctx.measureText(first).width;
      const secondWidth = ctx.measureText(second).width;
      const overflow = Math.max(firstWidth - maxWidth, 0) + Math.max(secondWidth - maxWidth, 0);
      const balance = Math.abs(first.length - second.length);
      const score = overflow * 1000 + balance;
      if (score < bestScore) {
        best = [first, second];
        bestScore = score;
      }
    }

    return best;
  }

  function drawTextWithBackdrop(ctx, text, x, y, maxWidth, fontSize, font) {
    if (!text) {
      return;
    }

    ctx.font = font;
    const metrics = ctx.measureText(text);
    const width = Math.min(metrics.width + 28, maxWidth + 32);
    const height = Math.ceil(fontSize * 1.24);
    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.fillRect(x - width / 2, y - height + 7, width, height);
    ctx.fillStyle = "#111827";
    ctx.fillText(text, x, y - 8);
  }

  async function createCardDataUrl(row) {
    const templateConfig = getTemplateConfig(row);
    const template = await loadTemplateImage(templateConfig);
    const canvas = document.createElement("canvas");
    canvas.width = templateConfig.width;
    canvas.height = templateConfig.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(template, 0, 0, templateConfig.width, templateConfig.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const nameFontFamily = "Arial, Helvetica, sans-serif";
    const nameLinesConfig = templateConfig.nameLines;
    const centerLineConfig = templateConfig.centerLine;
    ctx.font = `700 ${nameLinesConfig[0].maxSize}px ${nameFontFamily}`;
    const nameLines = wrapName(ctx, row.alumnado, nameLinesConfig[0].maxWidth);
    const nameSize = fitSharedFontSize(
      ctx,
      nameLines,
      nameFontFamily,
      "700",
      nameLinesConfig[0]
    );
    const nameFont = `700 ${nameSize}px ${nameFontFamily}`;

    nameLines.forEach((line, index) => {
      drawTextWithBackdrop(
        ctx,
        line,
        templateConfig.centerX,
        nameLinesConfig[index].y,
        nameLinesConfig[index].maxWidth,
        nameSize,
        nameFont
      );
    });

    const center = normalizeText(row.centro);
    const centerSize = fitFontSize(
      ctx,
      center,
      nameFontFamily,
      "700",
      centerLineConfig.maxWidth,
      centerLineConfig.maxSize,
      centerLineConfig.minSize
    );
    drawTextWithBackdrop(
      ctx,
      center,
      centerLineConfig.x,
      centerLineConfig.y,
      centerLineConfig.maxWidth,
      centerSize,
      `700 ${centerSize}px ${nameFontFamily}`
    );

    return canvas.toDataURL("image/png");
  }

  function uniqueCardRows(rows) {
    const uniqueRows = new Map();
    rows.forEach((row) => {
      const alumnado = normalizeText(row.alumnado);
      const centro = normalizeText(row.centro);
      if (!alumnado) {
        return;
      }

      const key = `${normalizeKey(alumnado)}|${normalizeKey(centro)}`;
      if (!uniqueRows.has(key)) {
        uniqueRows.set(key, { alumnado, centro });
      }
    });

    return Array.from(uniqueRows.values()).sort((a, b) =>
      a.alumnado.localeCompare(b.alumnado, "es", { sensitivity: "base" })
    );
  }

  async function fetchCardsByEmail(email) {
    const supabase = await window.SupabaseApp.getClient();
    const { data, error } = await supabase.rpc("get_concilia_carnes_by_mail", {
      p_mail: email,
    });

    if (error) {
      throw error;
    }

    return uniqueCardRows(data ?? []);
  }

  async function recordCardDownload(row) {
    const supabase = await window.SupabaseApp.getClient();
    const { data, error } = await supabase.rpc("record_concilia_carne_download", {
      p_mail: currentSearchEmail,
      p_alumnado: row.alumnado,
      p_centro: row.centro,
    });

    if (error) {
      throw error;
    }

    return Boolean(data);
  }

  function triggerBrowserDownload(dataUrl, filename) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  }

  async function renderCards(rows) {
    cardsGrid.innerHTML = "";

    for (const [index, row] of rows.entries()) {
      const dataUrl = await createCardDataUrl(row);
      const filename = `carne-${slugify(row.alumnado)}.png`;
      const item = document.createElement("article");
      item.className = "card-item";
      item.innerHTML = `
        <img class="card-preview" src="${dataUrl}" alt="Carné de ${escapeHtml(row.alumnado)}" />
        <div class="card-actions">
          <p class="card-name">${escapeHtml(row.alumnado)}</p>
          <button class="download-link" type="button">Descargar</button>
        </div>
      `;
      const downloadButton = item.querySelector(".download-link");
      downloadButton.dataset.downloadUrl = dataUrl;
      downloadButton.dataset.filename = filename;
      downloadButton.dataset.alumnado = row.alumnado;
      downloadButton.dataset.centro = row.centro;
      cardsGrid.append(item);
      setStatus(`Generando carné ${index + 1} de ${rows.length}...`);
    }
  }

  async function handleDownloadClick(button) {
    const row = {
      alumnado: button.dataset.alumnado,
      centro: button.dataset.centro,
    };
    const dataUrl = button.dataset.downloadUrl;
    const filename = button.dataset.filename;

    button.disabled = true;
    setStatus("Registrando descarga...");

    try {
      const logged = await recordCardDownload(row);
      if (!logged) {
        setStatus("No se pudo validar la descarga, pero se generará el archivo.", "error");
      } else {
        setStatus("Descarga registrada.", "success");
      }
    } catch (error) {
      setStatus(`No se pudo registrar la descarga: ${error.message}`, "error");
    } finally {
      triggerBrowserDownload(dataUrl, filename);
      button.disabled = false;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const email = normalizeText(emailInput.value).toLocaleLowerCase("es");
    if (!email) {
      setStatus("Introduce un correo electrónico.", "error");
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    currentSearchEmail = email;
    resultsSection.classList.add("hidden");
    cardsGrid.innerHTML = "";

    try {
      setStatus("Buscando alumnado asociado...");
      const rows = await fetchCardsByEmail(email);

      if (rows.length === 0) {
        setStatus("No se encontraron carnés asociados a ese correo.", "error");
        return;
      }

      resultsSummary.textContent = `${rows.length} ${rows.length === 1 ? "carné" : "carnés"}`;
      resultsSection.classList.remove("hidden");
      await renderCards(rows);
      setStatus("Carnés listos para descargar.", "success");
    } catch (error) {
      setStatus(`No se pudieron generar los carnés: ${error.message}`, "error");
    } finally {
      submitButton.disabled = false;
    }
  }

  function init() {
    if (!window.SupabaseApp?.hasConfig) {
      setStatus("Falta la configuración de Supabase.", "error");
      return;
    }

    form.addEventListener("submit", (event) => {
      void handleSubmit(event);
    });
    clearButton.addEventListener("click", () => {
      emailInput.value = "";
      currentSearchEmail = "";
      cardsGrid.innerHTML = "";
      resultsSummary.textContent = "";
      resultsSection.classList.add("hidden");
      setStatus("");
      emailInput.focus();
    });
    cardsGrid.addEventListener("click", (event) => {
      const button = event.target.closest(".download-link");
      if (!button) {
        return;
      }

      void handleDownloadClick(button);
    });
  }

  init();
})();
