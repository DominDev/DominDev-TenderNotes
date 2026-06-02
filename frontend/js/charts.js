import { OBSERVATION_FIELDS, SCORE_MAX } from "./constants.js";
import { dayAverage, formatSerenityIndex } from "./utils.js";

export const AREA_COLORS = [
  "#2f746f",
  "#b8583c",
  "#4976a8",
  "#8b6f35",
  "#6d7891",
  "#4f8a59",
  "#7b5ea7",
  "#c06f3d",
  "#3f7f96",
];

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * scale));
  canvas.height = Math.max(1, Math.floor(rect.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  return { ctx, width: rect.width, height: rect.height };
}

function clear(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fffdf9";
  ctx.fillRect(0, 0, width, height);
}

function drawAxes(ctx, width, height, padding) {
  ctx.strokeStyle = "#e7d9ca";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();
}

export function drawTrend(canvas, observations) {
  const { ctx, width, height } = setupCanvas(canvas);
  const padding = { top: 18, right: 14, bottom: 28, left: 34 };
  clear(ctx, width, height);
  drawAxes(ctx, width, height, padding);

  const points = Array.from({ length: 14 }, (_, index) => {
    const day = index + 1;
    const observation = observations.find((item) => item.day_number === day);
    return {
      day,
      value: dayAverage(observation),
    };
  });

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const middleY = padding.top + plotHeight / 2;
  ctx.strokeStyle = "#d9c4ae";
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.moveTo(padding.left, middleY);
  ctx.lineTo(width - padding.right, middleY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#756a61";
  ctx.font = "12px system-ui";
  ctx.fillText("✓", 10, padding.top + 4);
  ctx.fillText("◐", 8, middleY + 4);
  ctx.fillText("☁", 8, height - padding.bottom + 4);

  ctx.strokeStyle = "#2f746f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  let started = false;

  points.forEach((point, index) => {
    if (point.value === null) {
      return;
    }
    const x = padding.left + (plotWidth / 13) * index;
    const y = padding.top + plotHeight - (plotHeight / SCORE_MAX) * point.value;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  points.forEach((point, index) => {
    const x = padding.left + (plotWidth / 13) * index;
    if (point.value !== null) {
      const y = padding.top + plotHeight - (plotHeight / SCORE_MAX) * point.value;
      ctx.fillStyle = "#2f746f";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (index % 2 === 0) {
      ctx.fillStyle = "#756a61";
      ctx.fillText(String(point.day), x - 3, height - 8);
    }
  });

  if (!started) {
    ctx.fillStyle = "#756a61";
    ctx.font = "14px system-ui";
    ctx.fillText("Brak danych do wykresu.", padding.left, height / 2);
  }
}

export function drawAreaAverages(canvas, observations) {
  const { ctx, width, height } = setupCanvas(canvas);
  const padding = { top: 18, right: 10, bottom: 22, left: 28 };
  clear(ctx, width, height);
  drawAxes(ctx, width, height, padding);

  const values = OBSERVATION_FIELDS.map((field) => {
    const scores = observations
      .map((observation) => observation[field.key])
      .filter((value) => Number.isInteger(value));
    const average = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
    return { field, average };
  });

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const barGap = 5;
  const barWidth = Math.max(10, plotWidth / values.length - barGap);

  values.forEach((item, index) => {
    const x = padding.left + index * (barWidth + barGap);
    const barHeight = item.average === null ? 0 : (plotHeight / SCORE_MAX) * item.average;
    const y = height - padding.bottom - barHeight;
    ctx.fillStyle = AREA_COLORS[index % AREA_COLORS.length];
    ctx.fillRect(x, y, barWidth, barHeight);

    if (item.average !== null) {
      ctx.fillStyle = "#24201d";
      ctx.font = "11px system-ui";
      ctx.fillText(formatSerenityIndex(item.average), x, y - 5);
    }
  });
}

export function drawScoreDistribution(canvas, observations) {
  const { ctx, width, height } = setupCanvas(canvas);
  const padding = { top: 18, right: 14, bottom: 28, left: 30 };
  clear(ctx, width, height);
  drawAxes(ctx, width, height, padding);

  const labels = ["Trudno", "Różnie", "Spokojnie"];
  const counts = [0, 1, 2].map((score) => ({
    score,
    count: observations.reduce((total, observation) => {
      return total + OBSERVATION_FIELDS.filter((field) => observation[field.key] === score).length;
    }, 0),
  }));
  const max = Math.max(1, ...counts.map((item) => item.count));
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const barWidth = plotWidth / counts.length - 18;

  counts.forEach((item, index) => {
    const x = padding.left + index * (plotWidth / counts.length) + 9;
    const barHeight = (plotHeight / max) * item.count;
    const y = height - padding.bottom - barHeight;
    ctx.fillStyle = item.score === 0 ? "#b8583c" : item.score === 1 ? "#c49342" : "#3c7a4a";
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = "#24201d";
    ctx.font = "13px system-ui";
    ctx.fillText(String(item.count), x + barWidth / 2 - 4, y - 7);
    ctx.fillStyle = "#756a61";
    ctx.fillText(labels[item.score], Math.max(4, x + barWidth / 2 - 24), height - 8);
  });
}
