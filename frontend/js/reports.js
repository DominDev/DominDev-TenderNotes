import { OBSERVATION_FIELDS, SUMMARY_QUESTIONS, TOTAL_DAYS } from "./constants.js";
import { AREA_COLORS } from "./charts.js";
import { completionCount, escapeHtml, formatDate, formatSerenityIndex, parseNotes, toSerenityIndex } from "./utils.js";

export function buildReport(observations) {
  const completedDays = observations.filter((observation) => completionCount(observation) > 0);
  const allScores = [];
  const zeroCountsByField = new Map();

  OBSERVATION_FIELDS.forEach((field) => zeroCountsByField.set(field.key, 0));

  observations.forEach((observation) => {
    OBSERVATION_FIELDS.forEach((field) => {
      const score = observation[field.key];
      if (Number.isInteger(score)) {
        allScores.push(score);
      }
      if (score === 0) {
        zeroCountsByField.set(field.key, zeroCountsByField.get(field.key) + 1);
      }
    });
  });

  const average = allScores.length ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : null;
  const scoreCounts = [0, 1, 2].map((score) => allScores.filter((value) => value === score).length);
  const weakest = OBSERVATION_FIELDS
    .map((field) => ({
      label: field.label,
      zeros: zeroCountsByField.get(field.key),
      average: fieldAverage(observations, field.key),
    }))
    .sort((a, b) => b.zeros - a.zeros || (a.average ?? 99) - (b.average ?? 99))
    .slice(0, 3);

  return {
    completedDays: completedDays.length,
    totalDays: TOTAL_DAYS,
    average,
    serenityIndex: toSerenityIndex(average),
    scoreCounts,
    weakest,
    areaAverages: OBSERVATION_FIELDS.map((field) => ({
      label: field.shortLabel,
      average: fieldAverage(observations, field.key),
    })),
    insights: buildInsights(completedDays, average, scoreCounts, weakest),
    notesByDay: buildNotesByDay(observations),
  };
}

function fieldAverage(observations, key) {
  const values = observations.map((item) => item[key]).filter((value) => Number.isInteger(value));
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildInsights(completedDays, average, scoreCounts, weakest) {
  const insights = [];
  const zeroCount = scoreCounts[0] ?? 0;

  if (!completedDays.length) {
    return ["Wypełnij pierwsze dni, aby zobaczyć wzorce i trendy."];
  }

  if (average !== null && average >= 1.5) {
    insights.push("Większość odpowiedzi układa się w spokojny obraz dnia.");
  }

  if (average !== null && average >= 1 && average < 1.5) {
    insights.push("Wynik w środku skali nie jest sam w sobie alarmem. Oznacza, że obok spokojnych chwil pojawiają się trudniejsze momenty. Warto patrzeć, czy wracają w tych samych sytuacjach.");
  }

  if (zeroCount >= 6) {
    insights.push("Stan „Trudno” pojawia się kilka razy. Warto sprawdzić, czy dotyczy tych samych sytuacji i dni.");
  }

  const repeatedWeakness = weakest.find((item) => item.zeros >= 3);
  if (repeatedWeakness) {
    insights.push(`Najczęściej powtarzająca się trudność: ${repeatedWeakness.label}.`);
  }

  if (completedDays.length < 14) {
    insights.push(`Raport jest częściowy: uzupełniono ${completedDays.length} z 14 dni.`);
  }

  if (!insights.length) {
    insights.push("Dane są mieszane. Najwięcej powiedzą kolejne dni i konkretne notatki.");
  }

  return insights;
}

function buildNotesByDay(observations) {
  return observations
    .map((observation) => ({
      dayNumber: observation.day_number,
      date: observation.observation_date,
      notes: parseNotes(observation.notes),
    }))
    .filter((item) => item.notes.length)
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

function renderReportNotesHtml(notesByDay) {
  if (!notesByDay.length) {
    return "";
  }

  return `
    <section class="panel report-notes">
      <h3 class="panel__title">Notatki</h3>
      <div class="report-notes__list">
        ${notesByDay
          .map(
            (day) => `
              <article class="report-notes__day">
                <h4 class="report-notes__title">Dzień ${day.dayNumber}${day.date ? ` · ${formatDate(day.date)}` : ""}</h4>
                <ul class="report-notes__items">
                  ${day.notes.map((note) => `<li class="report-notes__item">${escapeHtml(note.text)}</li>`).join("")}
                </ul>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderWeakestHtml(weakest, className = "") {
  return `
    <section class="panel report-weaknesses ${className}">
      <h3 class="panel__title">Najczęściej zaznaczane trudności</h3>
      <ul class="insights">
        ${weakest
          .map(
            (item) => `
              <li class="insights__item">
                <strong>${escapeHtml(item.label)}</strong><br>
                Dni z trudnością: ${item.zeros}, wskaźnik: ${formatSerenityIndex(item.average)}
              </li>
            `,
          )
          .join("")}
      </ul>
    </section>
  `;
}

function interpolateColor(from, to, ratio) {
  return from.map((channel, index) => Math.round(channel + (to[index] - channel) * ratio));
}

function reportColorTokens(average) {
  if (average === null || average === undefined || Number.isNaN(average)) {
    return {
      accent: "117, 106, 97",
      background: "250, 247, 242",
      border: "213, 202, 190",
    };
  }

  const clamped = Math.max(0, Math.min(2, average));
  const hard = [184, 88, 60];
  const mixed = [196, 147, 66];
  const calm = [47, 116, 111];
  const accent = clamped <= 1 ? interpolateColor(hard, mixed, clamped) : interpolateColor(mixed, calm, clamped - 1);
  const background = interpolateColor([255, 247, 243], [248, 251, 247], clamped / 2);
  const border = interpolateColor([219, 147, 123], [47, 116, 111], clamped / 2);

  return {
    accent: accent.join(", "),
    background: background.join(", "),
    border: border.join(", "),
  };
}

function reportHeroStyle(average) {
  const tokens = reportColorTokens(average);
  return `--report-accent: ${tokens.accent}; --report-bg: ${tokens.background}; --report-border: ${tokens.border};`;
}

function reportHeroText(serenityIndex) {
  if (serenityIndex === null) {
    return "Wypełnij kilka pól, żeby zobaczyć pierwszy obraz dnia. To ma być spokojna obserwacja, nie ocena.";
  }

  if (serenityIndex < 35) {
    return "To niższy wynik, ale nadal punkt orientacyjny. Sprawdź trend, notatki i powtarzające się sytuacje.";
  }

  if (serenityIndex < 65) {
    return "Wynik około środka skali zwykle nie jest powodem do niepokoju. Są spokojniejsze chwile i trudniejsze momenty. Dzieci miewają gorsze dni; patrz, czy trudności wracają.";
  }

  return "Wysoki wskaźnik oznacza przewagę spokojnych obserwacji. Patrz dalej na rytm kilku dni, nie pojedynczy moment.";
}

export function renderReportHtml(observations) {
  const report = buildReport(observations);

  return `
    <section class="dashboard">
      <div class="hero report-hero" style="${reportHeroStyle(report.average)}">
        <p class="section-label">Wskaźnik spokoju</p>
        <h2 class="hero__title">${formatSerenityIndex(report.average)}</h2>
        <p class="hero__text">${reportHeroText(report.serenityIndex)}</p>
      </div>

      <div class="metrics">
        <article class="metric">
          <p class="metric__label">Dni</p>
          <p class="metric__value">${report.completedDays}/${report.totalDays}</p>
        </article>
        <article class="metric">
          <p class="metric__label">Trudno</p>
          <p class="metric__value">${report.scoreCounts[0]}</p>
        </article>
        <article class="metric">
          <p class="metric__label">Różnie</p>
          <p class="metric__value">${report.scoreCounts[1]}</p>
        </article>
        <article class="metric">
          <p class="metric__label">Spokojnie</p>
          <p class="metric__value">${report.scoreCounts[2]}</p>
        </article>
      </div>

      <section class="chart-grid">
        <article class="chart-panel chart-panel--wide">
          <h3 class="chart-panel__title">Trend wskaźnika dziennego</h3>
          <canvas class="chart" id="trendChart"></canvas>
        </article>
        <article class="chart-panel chart-panel--area">
          <h3 class="chart-panel__title">Wskaźnik spokoju per obszar</h3>
          <div class="chart-panel__body chart-panel__body--area">
            <canvas class="chart" id="areaChart"></canvas>
            <div class="chart-legend" aria-label="Podpisy wykresu wskaźnika per obszar">
              ${report.areaAverages
                .map(
                  (item, index) => `
                    <div class="chart-legend__item">
                      <span class="chart-legend__swatch" style="background: ${AREA_COLORS[index % AREA_COLORS.length]}"></span>
                      <span class="chart-legend__label">${escapeHtml(item.label)}</span>
                      <strong class="chart-legend__value">${formatSerenityIndex(item.average)}</strong>
                    </div>
                  `,
                )
                .join("")}
            </div>
          </div>
        </article>
        <article class="chart-panel chart-panel--distribution">
          <h3 class="chart-panel__title">Rozkład nastrojów</h3>
          <canvas class="chart" id="distributionChart"></canvas>
        </article>
        ${renderWeakestHtml(report.weakest, "report-weaknesses--print")}
      </section>

      <section class="panel">
        <h3 class="panel__title">Wnioski</h3>
        <ul class="insights">
          ${report.insights.map((item) => `<li class="insights__item">${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>

      ${renderWeakestHtml(report.weakest)}

      ${renderReportNotesHtml(report.notesByDay)}

      <section class="panel">
        <h3 class="panel__title">Pytania otwarte</h3>
        <p class="panel__hint">Wypełnij je po kilku lub czternastu dniach, kiedy łatwiej zobaczyć rytm i powtarzające się sytuacje.</p>
        <div class="action-row">
          <button class="button button--secondary" type="button" data-route-action="summary">Otwórz pytania</button>
          <button class="button button--ghost" type="button" data-print>Drukuj raport</button>
        </div>
      </section>
    </section>
  `;
}

export function renderSummaryHtml(answers) {
  const answerMap = new Map(answers.map((answer) => [answer.question_key, answer]));

  return `
    <section class="dashboard">
      <div class="hero">
        <p class="section-label">Pytania otwarte</p>
        <h2 class="hero__title">Dodatkowy kontekst</h2>
        <p class="hero__text">Zapisz odpowiedzi wtedy, kiedy widać już kilka dni obserwacji i łatwiej nazwać powtarzające się sytuacje.</p>
      </div>

      <form class="question-list" id="summaryForm">
        ${SUMMARY_QUESTIONS.map((question) => {
          const answer = answerMap.get(question.key) ?? {};
          return `
            <article class="question" data-question-key="${question.key}">
              <h3 class="question__title">${escapeHtml(question.text)}</h3>
              <label class="field question__field">
                <span class="field__label">Odpowiedź</span>
                <select class="field__select" name="${question.key}_answer">
                  <option value="">Wybierz</option>
                  <option value="tak" ${answer.answer === "tak" ? "selected" : ""}>Tak</option>
                  <option value="nie" ${answer.answer === "nie" ? "selected" : ""}>Nie</option>
                  <option value="nie_wiem" ${answer.answer === "nie_wiem" ? "selected" : ""}>Nie wiem</option>
                </select>
              </label>
              <label class="field question__field">
                <span class="field__label">Co za tym przemawia?</span>
                <textarea class="field__textarea" name="${question.key}_evidence">${escapeHtml(answer.evidence)}</textarea>
              </label>
              <label class="field question__field">
                <span class="field__label">Co dalej?</span>
                <textarea class="field__textarea" name="${question.key}_next_step">${escapeHtml(answer.next_step)}</textarea>
              </label>
            </article>
          `;
        }).join("")}
        <button class="button" type="submit">Zapisz podsumowanie</button>
      </form>
    </section>
  `;
}
