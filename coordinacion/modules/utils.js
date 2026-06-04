function renderIcon(name) {
  return `<svg class="button-icon" aria-hidden="true"><use href="./icons.svg#icon-${name}"></use></svg>`;
}

function debounce(callback, wait = 250) {
  let timeoutId = 0;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
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
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es");
}

function sortTextValues(values) {
  return [...values].sort((left, right) =>
    String(left).localeCompare(String(right), "es", { sensitivity: "base", numeric: true })
  );
}

function sanitizeFileName(name) {
  return String(name ?? "archivo")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

function toCsvValue(value) {
  const normalized = String(value ?? "").replaceAll('"', '""');
  return `"${normalized}"`;
}

// --- Date/time helpers ---

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

// --- CSV / import helpers ---

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
    .replace(/^﻿/, "")
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

// --- Canvas helpers ---

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
