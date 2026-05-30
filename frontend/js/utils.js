import { OBSERVATION_FIELDS, TOTAL_DAYS } from "./constants.js";

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return "Bez daty";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateValue}T00:00:00`));
}

export function todayIso() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export function clampDay(value) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) {
    return 1;
  }
  return Math.min(TOTAL_DAYS, Math.max(1, number));
}

export function fieldValues(observation) {
  return OBSERVATION_FIELDS
    .map((field) => observation?.[field.key])
    .filter((value) => Number.isInteger(value));
}

export function completionCount(observation) {
  return fieldValues(observation).length;
}

export function dayAverage(observation) {
  const values = fieldValues(observation);
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function round(value, precision = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "–";
  }
  return Number(value).toFixed(precision);
}

export function byDay(observations) {
  const map = new Map();
  observations.forEach((observation) => {
    map.set(observation.day_number, observation);
  });
  return map;
}

