import { EMPTY_OBSERVATION, OBSERVATION_FIELDS, SCALE, TOTAL_DAYS } from "./constants.js";
import { clampDay, completionCount, dayAverage, escapeHtml, formatDate, parseNotes, round, todayIso } from "./utils.js";

export function mergeObservation(observation) {
  return {
    ...EMPTY_OBSERVATION,
    ...(observation ?? {}),
  };
}

export function renderDayPickerHtml(currentDay) {
  return `
    <label class="field">
      <span class="field__label">Dzień obserwacji</span>
      <select class="field__select" id="daySelect">
        ${Array.from({ length: TOTAL_DAYS }, (_, index) => {
          const day = index + 1;
          return `<option value="${day}" ${day === currentDay ? "selected" : ""}>Dzień ${day}</option>`;
        }).join("")}
      </select>
    </label>
  `;
}

export function renderObservationFormHtml(dayNumber, observation) {
  const row = mergeObservation(observation);
  const notes = parseNotes(row.notes);

  return `
    <section class="dashboard">
      <div class="hero">
        <p class="section-label">Wpis dzienny</p>
        <h2 class="hero__title">Dzień ${dayNumber}</h2>
        <p class="hero__text">Wpisuj to, co realnie widzisz rano, przy rozstaniu, odbiorze i w domu. Skala pomaga zobaczyć trend, nie postawić diagnozę.</p>
      </div>

      <form class="panel form-stack" id="observationForm">
        ${renderDayPickerHtml(dayNumber)}

        <label class="field">
          <span class="field__label">Data</span>
          <input class="field__input" type="date" name="observation_date" value="${escapeHtml(row.observation_date || todayIso())}">
        </label>

        <div class="scale-help" aria-label="Legenda skali">
          ${SCALE.map((item) => `
            <div class="scale-help__item">
              <span class="state-icon ${item.iconClass}" aria-hidden="true">${item.icon}</span>
              <span>
                <strong>${item.label}</strong>
                <small>${escapeHtml(item.title)}</small>
                <em>${escapeHtml(item.description)}</em>
              </span>
            </div>
          `).join("")}
        </div>

        <div class="score-grid">
          ${OBSERVATION_FIELDS.map((field) => {
            const value = row[field.key];
            return `
              <fieldset class="score-row">
                <div class="score-row__head">
                  <legend class="score-row__title">${escapeHtml(field.label)}</legend>
                  <p class="score-row__hint">${escapeHtml(field.help)}</p>
                </div>
                <div class="score-options">
                  ${SCALE.map(
                    (item) => `
                      <button
                        class="score-options__button ${value === item.value ? "is-selected" : ""}"
                        type="button"
                        data-score-button
                        data-field="${field.key}"
                        data-value="${item.value}"
                        aria-pressed="${value === item.value ? "true" : "false"}"
                      >
                        <span class="score-options__icon state-icon ${item.iconClass}" aria-hidden="true">${item.icon}</span>
                        <span class="score-options__label visually-hidden">${escapeHtml(item.label)}</span>
                      </button>
                    `,
                  ).join("")}
                </div>
                <input type="hidden" name="${field.key}" value="${Number.isInteger(value) ? value : ""}">
              </fieldset>
            `;
          }).join("")}
        </div>

        <label class="field">
          <span class="field__label">Dodaj notatkę</span>
          <textarea class="field__textarea" name="notes" placeholder="Np. płacz 10 minut przy rozstaniu, po odbiorze pokazała zabawkę..."></textarea>
        </label>

        <button class="button" type="submit">Zapisz obserwację</button>
        <p class="notice" id="formNotice" hidden></p>
        <article class="saved-note" id="savedNote" ${notes.length ? "" : "hidden"}>
          <p class="saved-note__label">Zapisane notatki</p>
          <div class="saved-note__list">
            ${renderNotesList(notes)}
          </div>
        </article>
      </form>
    </section>
  `;
}

export function readObservationForm(form) {
  const formData = new FormData(form);
  const payload = {
    observation_date: formData.get("observation_date") || null,
    notes: formData.get("notes")?.toString().trim() ?? "",
  };

  OBSERVATION_FIELDS.forEach((field) => {
    const value = formData.get(field.key);
    payload[field.key] = value === "" || value === null ? null : Number.parseInt(value, 10);
  });

  return payload;
}

export function renderNotesList(notes) {
  if (!notes.length) {
    return `<p class="saved-note__empty">Brak zapisanych notatek dla tego dnia.</p>`;
  }

  return notes
    .map(
      (note) => `
        <div class="saved-note__item">
          <p class="saved-note__text">${escapeHtml(note.text)}</p>
        </div>
      `,
    )
    .join("");
}

export function wireScoreButtons(root) {
  root.querySelectorAll("[data-score-button]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.field;
      const value = button.dataset.value;
      const row = button.closest(".score-row");
      row.querySelector(`input[name="${field}"]`).value = value;
      row.querySelectorAll("[data-score-button]").forEach((item) => {
        const isSelected = item === button;
        item.classList.toggle("is-selected", isSelected);
        item.setAttribute("aria-pressed", String(isSelected));
      });
    });
  });
}

export function renderHistoryHtml(observations) {
  const map = new Map(observations.map((item) => [item.day_number, item]));

  return `
    <section class="dashboard">
      <div class="hero">
        <p class="section-label">Historia</p>
        <h2 class="hero__title">14 dni</h2>
        <p class="hero__text">Każdy dzień można uzupełnić lub poprawić. Raport aktualizuje się automatycznie po zapisie.</p>
      </div>

      <div class="day-list">
        ${Array.from({ length: TOTAL_DAYS }, (_, index) => {
          const day = index + 1;
          const observation = map.get(day);
          const completed = completionCount(observation);
          const average = dayAverage(observation);
          return `
            <button class="day-card" type="button" data-edit-day="${day}">
              <span class="day-card__header">
                <span>
                  <strong class="day-card__title">Dzień ${day}</strong>
                  <span class="day-card__meta">${formatDate(observation?.observation_date)} · ${completed}/${OBSERVATION_FIELDS.length} pól · średnia ${round(average)}</span>
                </span>
                <span class="pill ${completed === OBSERVATION_FIELDS.length ? "pill--good" : completed ? "pill--warn" : ""}">
                  ${completed === OBSERVATION_FIELDS.length ? "Pełny" : completed ? "Część" : "Pusty"}
                </span>
              </span>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

export function suggestedNextDay(observations) {
  const map = new Map(observations.map((item) => [item.day_number, item]));
  for (let day = 1; day <= TOTAL_DAYS; day += 1) {
    if (completionCount(map.get(day)) < OBSERVATION_FIELDS.length) {
      return day;
    }
  }
  return TOTAL_DAYS;
}

export function parseDayFromSelect(root) {
  return clampDay(root.querySelector("#daySelect")?.value);
}
