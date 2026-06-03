import { isSupabaseConfigured, supabase } from "./supabaseClient.js?v=20260603-1";
import { getCurrentUser, onAuthStateChange, signIn, signOut, signUp } from "./auth.js?v=20260603-1";
import { archiveChild, createChild, loadChildren, loadObservations, loadSummaryAnswers, saveObservation, saveSummaryAnswer, updateChild } from "./api.js?v=20260603-1";
import { drawAreaAverages, drawScoreDistribution, drawTrend } from "./charts.js?v=20260603-1";
import { renderHistoryHtml, renderNotesList, renderObservationFormHtml, readObservationForm, suggestedNextDay, wireScoreButtons } from "./observations.js?v=20260603-1";
import { renderReportHtml, renderSummaryHtml } from "./reports.js?v=20260603-1";
import { OBSERVATION_FIELDS, TOTAL_DAYS } from "./constants.js?v=20260603-1";
import { childInitials, completionCount, escapeHtml, formatChildAge, formatSerenityIndex, makeId, parseNotes, serializeNotes } from "./utils.js?v=20260603-1";
import { getRoute, navigate } from "./router.js?v=20260603-1";

const app = document.querySelector("#app");
const topbar = document.querySelector("#topbar");
const tabbar = document.querySelector("#tabbar");
const viewTitle = document.querySelector("#viewTitle");
const logoutButton = document.querySelector("#logoutButton");
const childSwitcherButton = document.querySelector("#childSwitcherButton");
const childSwitcherAvatar = document.querySelector("#childSwitcherAvatar");
const childSwitcherName = document.querySelector("#childSwitcherName");
const childSwitcherMeta = document.querySelector("#childSwitcherMeta");

let currentUser = null;
let children = [];
let selectedChildId = null;
let observations = [];
let authMode = "signin";
let printRedrawTimer = null;

const AVATAR_COLORS = ["#2f746f", "#4976a8", "#c06f3d", "#7b5ea7", "#4f8a59", "#b8583c"];
const AGE_BANDS = [
  { value: "0-2", label: "0-2 lata" },
  { value: "3-5", label: "3-5 lat" },
  { value: "6-8", label: "6-8 lat" },
  { value: "9-12", label: "9-12 lat" },
  { value: "13+", label: "13+ lat" },
];

const titles = {
  dashboard: "Dziennik",
  entry: "Wpis dzienny",
  history: "Historia",
  report: "Raport",
  summary: "Pytania otwarte",
};

async function boot() {
  wirePrintRedraw();

  if (!isSupabaseConfigured()) {
    renderConfigMissing();
    return;
  }

  currentUser = await getCurrentUser();
  onAuthStateChange(async (user) => {
    currentUser = user;
    if (currentUser) {
      await refreshChildrenAndData();
      renderRoute();
    } else {
      children = [];
      selectedChildId = null;
      observations = [];
      renderAuth();
    }
  });

  if (!currentUser) {
    renderAuth();
    return;
  }

  await refreshChildrenAndData();
  renderRoute();
}

function renderConfigMissing() {
  topbar.hidden = true;
  tabbar.hidden = true;
  app.innerHTML = `
    <section class="auth">
      <div>
        <div class="auth-brand">
          <img class="auth-brand__mark" src="./assets/logo.svg" alt="" width="64" height="64">
          <h1 class="auth-brand__name">TenderNotes</h1>
        </div>
        <p class="auth__lead">Aplikacja jest gotowa strukturalnie, ale wymaga podpięcia projektu Supabase.</p>
      </div>
      <div class="panel">
        <h2 class="panel__title">Brakuje konfiguracji</h2>
        <p class="panel__hint">Uzupełnij <strong>frontend/js/config.js</strong> wartościami <strong>Project URL</strong> i <strong>anon public key</strong> z Supabase.</p>
      </div>
    </section>
  `;
}

function renderAuth(message = "") {
  topbar.hidden = true;
  tabbar.hidden = true;
  app.innerHTML = `
    <section class="auth">
      <div>
        <div class="auth-brand">
          <img class="auth-brand__mark" src="./assets/logo.svg" alt="" width="64" height="64">
          <h1 class="auth-brand__name">TenderNotes</h1>
        </div>
        <p class="auth__lead">Kilka minut dziennie, żeby spokojnie zobaczyć rytm ostatnich dni.</p>
      </div>

      <div class="panel">
        <div class="auth-switch" role="tablist" aria-label="Logowanie lub rejestracja">
          <button class="auth-switch__button ${authMode === "signin" ? "is-active" : ""}" type="button" data-auth-mode="signin">Logowanie</button>
          <button class="auth-switch__button ${authMode === "signup" ? "is-active" : ""}" type="button" data-auth-mode="signup">Rejestracja</button>
        </div>

        <form class="auth-form" id="authForm">
          <label class="field" ${authMode === "signin" ? "hidden" : ""}>
            <span class="field__label">Imię lub nazwa</span>
            <input class="field__input" name="displayName" autocomplete="name">
          </label>
          <label class="field">
            <span class="field__label">Email</span>
            <input class="field__input" type="email" name="email" autocomplete="email" required>
          </label>
          <label class="field">
            <span class="field__label">Hasło</span>
            <input class="field__input" type="password" name="password" autocomplete="${authMode === "signin" ? "current-password" : "new-password"}" minlength="6" required>
          </label>
          <button class="button" type="submit">${authMode === "signin" ? "Zaloguj" : "Utwórz konto"}</button>
          ${message ? `<p class="notice">${escapeHtml(message)}</p>` : ""}
          <p class="notice" id="authNotice" hidden></p>
        </form>
      </div>
    </section>
  `;

  app.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      authMode = button.dataset.authMode;
      renderAuth();
    });
  });

  app.querySelector("#authForm").addEventListener("submit", handleAuthSubmit);
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const notice = form.querySelector("#authNotice");
  const formData = new FormData(form);
  const email = formData.get("email").toString().trim();
  const password = formData.get("password").toString();
  const displayName = formData.get("displayName")?.toString().trim() ?? "";

  notice.hidden = true;

  try {
    if (authMode === "signin") {
      await signIn(email, password);
    } else {
      await signUp(email, password, displayName);
      renderAuth("Konto utworzone. Jeśli Supabase wymaga potwierdzenia emaila, sprawdź skrzynkę.");
    }
  } catch (error) {
    notice.className = "notice notice--error";
    notice.textContent = translateError(error.message);
    notice.hidden = false;
  }
}

function selectedChildStorageKey() {
  return currentUser ? `tendernotes:selectedChild:${currentUser.id}` : "tendernotes:selectedChild";
}

function getSelectedChild() {
  return children.find((child) => child.id === selectedChildId) ?? null;
}

function selectChild(childId) {
  selectedChildId = childId;
  if (currentUser && childId) {
    localStorage.setItem(selectedChildStorageKey(), childId);
  }
}

function ensureSelectedChild() {
  const stored = currentUser ? localStorage.getItem(selectedChildStorageKey()) : null;
  const storedChild = children.find((child) => child.id === stored);
  selectedChildId = storedChild?.id ?? children[0]?.id ?? null;

  if (selectedChildId && currentUser) {
    localStorage.setItem(selectedChildStorageKey(), selectedChildId);
  }
}

async function refreshChildrenAndData() {
  children = await loadChildren();
  ensureSelectedChild();
  await refreshData();
}

async function refreshData() {
  observations = selectedChildId ? await loadObservations(selectedChildId) : [];
  updateChildSwitcher();
}

function updateChildSwitcher() {
  const child = getSelectedChild();

  if (!currentUser || !child) {
    childSwitcherButton.hidden = true;
    return;
  }

  childSwitcherButton.hidden = false;
  childSwitcherAvatar.textContent = childInitials(child.display_name);
  childSwitcherAvatar.style.background = child.avatar_color || AVATAR_COLORS[0];
  childSwitcherName.textContent = child.display_name;
  childSwitcherMeta.textContent = formatChildAge(child) || AGE_BANDS.find((item) => item.value === child.age_band)?.label || "Profil dziecka";
}

function renderChrome(routeName) {
  topbar.hidden = false;
  tabbar.hidden = false;
  viewTitle.textContent = titles[routeName] ?? "TenderNotes";
  document.querySelectorAll(".tabbar__button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === routeName);
  });
}

function renderRoute() {
  if (!currentUser) {
    renderAuth();
    return;
  }

  const route = getRoute();
  renderChrome(route.name);

  if (!selectedChildId) {
    renderNoChild();
    resetViewScroll();
    return;
  }

  if (route.name === "entry") {
    renderEntry(Number(route.params.get("day")) || suggestedNextDay(observations));
  } else if (route.name === "history") {
    renderHistory();
  } else if (route.name === "report") {
    renderReport();
  } else if (route.name === "summary") {
    renderSummary();
  } else {
    renderDashboard();
  }

  resetViewScroll();
}

function resetViewScroll() {
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    app.scrollTo?.({ top: 0, left: 0, behavior: "instant" });
  });
}

function renderNoChild() {
  app.innerHTML = `
    <section class="dashboard">
      <div class="hero">
        <p class="section-label">TenderNotes</p>
        <h2 class="hero__title">Dodaj dziecko</h2>
        <p class="hero__text">KaĹĽde dziecko ma osobny dziennik, pytania i raport. DziÄ™ki temu obserwacje nie mieszajÄ… siÄ™ miÄ™dzy profilami.</p>
        <div class="hero__actions">
          <button class="button" type="button" data-child-add>Dodaj dziecko</button>
        </div>
      </div>
    </section>
  `;
}

function renderDashboard() {
  const completedDays = observations.filter((observation) => completionCount(observation) > 0).length;
  const fullDays = observations.filter((observation) => completionCount(observation) === OBSERVATION_FIELDS.length).length;
  const scoreCount = observations.reduce((total, observation) => {
    return total + OBSERVATION_FIELDS.filter((field) => Number.isInteger(observation[field.key])).length;
  }, 0);
  const average = scoreCount
    ? observations.reduce((sum, observation) => {
        return sum + OBSERVATION_FIELDS.reduce((fieldSum, field) => fieldSum + (Number.isInteger(observation[field.key]) ? observation[field.key] : 0), 0);
      }, 0) / scoreCount
    : null;

  app.innerHTML = `
    <section class="dashboard">
      <div class="hero">
        <p class="section-label">TenderNotes</p>
        <h2 class="hero__title">Dzień po dniu</h2>
        <p class="hero__text">Zapisuj krótkie obserwacje po dniu. TenderNotes pomaga zobaczyć, co wraca najczęściej i gdzie dzień układa się spokojnie.</p>
        <div class="hero__actions">
          <button class="button" type="button" data-route-action="entry">Wypełnij dzień</button>
          <button class="button button--secondary" type="button" data-route-action="report">Zobacz raport</button>
        </div>
      </div>

      <div class="metrics">
        <article class="metric">
          <p class="metric__label">Rozpoczęte dni</p>
          <p class="metric__value">${completedDays}/${TOTAL_DAYS}</p>
        </article>
        <article class="metric">
          <p class="metric__label">Pełne dni</p>
          <p class="metric__value">${fullDays}</p>
        </article>
        <article class="metric">
          <p class="metric__label">Wskaźnik spokoju</p>
          <p class="metric__value">${formatSerenityIndex(average)}</p>
        </article>
        <article class="metric">
          <p class="metric__label">Zaznaczone pola</p>
          <p class="metric__value">${scoreCount}</p>
        </article>
      </div>

      <section class="panel">
        <h3 class="panel__title">Następny krok</h3>
        <p class="panel__hint">Najbliższy dzień do uzupełnienia: ${suggestedNextDay(observations)}. Wystarczy kilka spokojnych odpowiedzi i krótka notatka.</p>
        <div class="action-row">
          <button class="button button--secondary" type="button" data-route-action="entry" data-day="${suggestedNextDay(observations)}">Otwórz dzień</button>
        </div>
      </section>
    </section>
  `;
}

function renderEntry(dayNumber) {
  const day = Math.max(1, Math.min(TOTAL_DAYS, dayNumber));
  const observation = observations.find((item) => item.day_number === day);
  app.innerHTML = renderObservationFormHtml(day, observation);
  const form = app.querySelector("#observationForm");
  const notice = app.querySelector("#formNotice");
  const getCurrentObservation = () => observations.find((item) => item.day_number === day);
  const buildPayload = (notes) => {
    const payload = readObservationForm(form);
    payload.notes = serializeNotes(notes);
    return payload;
  };

  wireScoreButtons(app, async () => {
    const currentNotes = parseNotes(getCurrentObservation()?.notes);

    try {
      await saveObservation(selectedChildId, day, buildPayload(currentNotes));
      await refreshData();
      setNotice(notice, "success", "Odpowiedź zapisana.");
    } catch (error) {
      setNotice(notice, "error", translateError(error.message));
    }
  });

  app.querySelector("#daySelect").addEventListener("change", (event) => {
    navigate("entry", { day: event.target.value });
  });

  app.querySelector("#noteCancelButton").addEventListener("click", () => {
    clearNoteEditState(form);
    setNotice(notice, "success", "Edycja notatki anulowana.");
  });

  app.querySelector("#savedNote").addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-note-edit]");
    const deleteButton = event.target.closest("[data-note-delete]");
    const currentNotes = parseNotes(getCurrentObservation()?.notes);

    if (editButton) {
      const noteIndex = Number.parseInt(editButton.dataset.noteEdit, 10);
      const note = currentNotes[noteIndex];

      if (!note) {
        return;
      }

      form.dataset.editingNoteIndex = String(noteIndex);
      form.querySelector('textarea[name="notes"]').value = note.text;
      form.querySelector("#noteFieldLabel").textContent = "Edytuj notatkę";
      form.querySelector("#noteSubmitButton").textContent = "Zapisz notatkę";
      form.querySelector("#noteCancelButton").hidden = false;
      form.querySelector('textarea[name="notes"]').focus();
      return;
    }

    if (deleteButton) {
      const noteIndex = Number.parseInt(deleteButton.dataset.noteDelete, 10);
      const nextNotes = currentNotes.filter((_note, index) => index !== noteIndex);

      try {
        await saveObservation(selectedChildId, day, buildPayload(nextNotes));
        await refreshData();
        renderSavedNotes(app, nextNotes);
        clearNoteEditState(form);
        setNotice(notice, "success", "Notatka usunięta.");
      } catch (error) {
        setNotice(notice, "error", translateError(error.message));
      }
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentObservation = observations.find((item) => item.day_number === day);
    const existingNotes = parseNotes(currentObservation?.notes);
    const textarea = form.querySelector('textarea[name="notes"]');
    const noteText = textarea.value.trim();
    const editingIndex = Number.parseInt(form.dataset.editingNoteIndex ?? "", 10);
    const isEditing = Number.isInteger(editingIndex) && existingNotes[editingIndex];

    if (!noteText) {
      setNotice(notice, "error", isEditing ? "Wpisz treść notatki albo anuluj edycję." : "Wpisz notatkę przed dodaniem.");
      return;
    }

    const now = new Date().toISOString();
    const nextNotes = [...existingNotes];
    let message = "Notatka dodana.";

    if (isEditing) {
      nextNotes[editingIndex] = {
        ...nextNotes[editingIndex],
        text: noteText,
        updated_at: now,
      };
      message = "Notatka zaktualizowana.";
    } else {
      nextNotes.push({
        id: makeId("note"),
        text: noteText,
        created_at: now,
        updated_at: null,
      });
    }

    try {
      await saveObservation(selectedChildId, day, buildPayload(nextNotes));
      await refreshData();
      clearNoteEditState(form);
      renderSavedNotes(app, nextNotes);
      setNotice(notice, "success", message);
    } catch (error) {
      setNotice(notice, "error", translateError(error.message));
    }
  });
}

function setNotice(notice, type, message) {
  notice.className = `notice notice--${type}`;
  notice.textContent = message;
  notice.hidden = false;
}

function renderSavedNotes(root, notes) {
  const savedNote = root.querySelector("#savedNote");
  const savedNoteList = savedNote?.querySelector(".saved-note__list");

  if (!savedNote || !savedNoteList) {
    return;
  }

  savedNoteList.innerHTML = renderNotesList(notes);
  savedNote.hidden = !notes.length;
}

function clearNoteEditState(form) {
  delete form.dataset.editingNoteIndex;
  form.querySelector('textarea[name="notes"]').value = "";
  form.querySelector("#noteFieldLabel").textContent = "Dodaj notatkę";
  form.querySelector("#noteSubmitButton").textContent = "Dodaj notatkę";
  form.querySelector("#noteCancelButton").hidden = true;
}

function monthInputValue(child) {
  return child?.birth_month ? child.birth_month.slice(0, 7) : "";
}

function toBirthMonth(value) {
  return value ? `${value}-01` : null;
}

function renderAvatarColorOptions(selectedColor = AVATAR_COLORS[0]) {
  return AVATAR_COLORS.map(
    (color) => `
      <label class="color-choice" title="${color}">
        <input class="color-choice__input" type="radio" name="avatar_color" value="${color}" ${color === selectedColor ? "checked" : ""}>
        <span class="color-choice__swatch" style="background: ${color}" aria-hidden="true"></span>
      </label>
    `,
  ).join("");
}

function renderChildSheet(editChildId = "") {
  const editingChild = children.find((child) => child.id === editChildId) ?? null;
  const selectedColor = editingChild?.avatar_color || AVATAR_COLORS[0];
  const sheet = document.createElement("div");
  sheet.className = "child-sheet";
  sheet.id = "childSheet";
  sheet.innerHTML = `
    <div class="child-sheet__backdrop" data-child-close></div>
    <section class="child-sheet__panel" role="dialog" aria-modal="true" aria-label="Profile dzieci">
      <div class="child-sheet__header">
        <div>
          <p class="section-label">Profile dzieci</p>
          <h2 class="child-sheet__title">Wybierz dziecko</h2>
        </div>
        <button class="icon-button" type="button" data-child-close aria-label="Zamknij">×</button>
      </div>

      <div class="child-list">
        ${children
          .map(
            (child) => `
              <article class="child-card ${child.id === selectedChildId ? "is-selected" : ""}">
                <button class="child-card__main" type="button" data-child-select="${child.id}">
                  <span class="child-avatar" style="background: ${child.avatar_color || AVATAR_COLORS[0]}" aria-hidden="true">${childInitials(child.display_name)}</span>
                  <span>
                    <strong>${escapeHtml(child.display_name)}</strong>
                    <small>${escapeHtml(formatChildAge(child) || AGE_BANDS.find((item) => item.value === child.age_band)?.label || "Profil dziecka")}</small>
                  </span>
                </button>
                <button class="icon-button child-card__edit" type="button" data-child-edit="${child.id}" aria-label="Edytuj ${escapeHtml(child.display_name)}">✎</button>
              </article>
            `,
          )
          .join("")}
      </div>

      <form class="child-form panel" id="childForm" data-edit-child-id="${editingChild?.id ?? ""}">
        <h3 class="panel__title">${editingChild ? "Edytuj dziecko" : "Dodaj dziecko"}</h3>
        <label class="field">
          <span class="field__label">Imię lub nazwa</span>
          <input class="field__input" name="display_name" value="${escapeHtml(editingChild?.display_name ?? "")}" required>
        </label>
        <label class="field">
          <span class="field__label">Miesiąc urodzenia</span>
          <input class="field__input" type="month" name="birth_month" value="${escapeHtml(monthInputValue(editingChild))}">
        </label>
        <label class="field">
          <span class="field__label">Przedział wieku</span>
          <select class="field__select" name="age_band">
            ${AGE_BANDS.map((band) => `<option value="${band.value}" ${(editingChild?.age_band ?? "0-2") === band.value ? "selected" : ""}>${band.label}</option>`).join("")}
          </select>
        </label>
        <fieldset class="color-choice-group">
          <legend class="field__label">Kolor avatara</legend>
          <div class="color-choice-group__items">
            ${renderAvatarColorOptions(selectedColor)}
          </div>
        </fieldset>
        <div class="child-form__actions">
          <button class="button" type="submit">${editingChild ? "Zapisz dziecko" : "Dodaj dziecko"}</button>
          ${editingChild ? `<button class="button button--ghost" type="button" data-child-new>Dodaj nowe</button>` : ""}
          ${editingChild ? `<button class="button button--ghost button--danger" type="button" data-child-archive="${editingChild.id}">Ukryj dziecko</button>` : ""}
        </div>
        <p class="notice" id="childNotice" hidden></p>
      </form>
    </section>
  `;

  document.body.append(sheet);
  sheet.querySelector("#childForm").addEventListener("submit", handleChildSubmit);
  sheet.querySelector('input[name="display_name"]')?.focus();
}

function closeChildSheet() {
  document.querySelector("#childSheet")?.remove();
}

function openChildSheet(editChildId = "") {
  closeChildSheet();
  renderChildSheet(editChildId);
}

async function handleChildSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const notice = form.querySelector("#childNotice");
  const formData = new FormData(form);
  const editChildId = form.dataset.editChildId;
  const payload = {
    display_name: formData.get("display_name").toString().trim(),
    birth_month: toBirthMonth(formData.get("birth_month")?.toString()),
    age_band: formData.get("age_band")?.toString() || "0-2",
    avatar_color: formData.get("avatar_color")?.toString() || AVATAR_COLORS[0],
  };

  try {
    const saved = editChildId ? await updateChild(editChildId, payload) : await createChild(payload);
    selectChild(saved.id);
    await refreshChildrenAndData();
    closeChildSheet();
    renderRoute();
  } catch (error) {
    notice.className = "notice notice--error";
    notice.textContent = translateError(error.message);
    notice.hidden = false;
  }
}

function renderHistory() {
  app.innerHTML = renderHistoryHtml(observations);
}

function renderReport() {
  app.innerHTML = renderReportHtml(observations, getSelectedChild());
  requestAnimationFrame(drawReportCharts);
}

function drawReportCharts() {
  const trendChart = document.querySelector("#trendChart");
  const areaChart = document.querySelector("#areaChart");
  const distributionChart = document.querySelector("#distributionChart");

  if (!trendChart || !areaChart || !distributionChart) {
    return;
  }

  drawTrend(trendChart, observations);
  drawAreaAverages(areaChart, observations);
  drawScoreDistribution(distributionChart, observations);
}

function redrawReportChartsForPrint() {
  if (getRoute().name !== "report") {
    return;
  }

  window.clearTimeout(printRedrawTimer);
  drawReportCharts();
  printRedrawTimer = window.setTimeout(drawReportCharts, 80);
}

function wirePrintRedraw() {
  window.addEventListener("beforeprint", redrawReportChartsForPrint);
  window.addEventListener("afterprint", () => {
    window.clearTimeout(printRedrawTimer);
    requestAnimationFrame(drawReportCharts);
  });
}

async function renderSummary() {
  const answers = await loadSummaryAnswers(selectedChildId);
  app.innerHTML = renderSummaryHtml(answers);
  app.querySelector("#summaryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const rows = Array.from(form.querySelectorAll("[data-question-key]"));

    await Promise.all(
      rows.map((row) => {
        const key = row.dataset.questionKey;
        const formData = new FormData(form);
        return saveSummaryAnswer(selectedChildId, key, {
          answer: formData.get(`${key}_answer`) || null,
          evidence: formData.get(`${key}_evidence`)?.toString().trim() ?? "",
          next_step: formData.get(`${key}_next_step`)?.toString().trim() ?? "",
        });
      }),
    );

    navigate("report");
  });
}

function translateError(message) {
  if (!message) {
    return "Wystąpił błąd.";
  }
  if (message.includes("Invalid login credentials")) {
    return "Nieprawidłowy email lub hasło.";
  }
  if (message.includes("Email not confirmed")) {
    return "Email nie został jeszcze potwierdzony.";
  }
  return message;
}

document.body.addEventListener("click", (event) => {
  if (event.target.closest("[data-child-add]")) {
    openChildSheet();
    return;
  }

  if (event.target.closest("[data-child-close]")) {
    closeChildSheet();
    return;
  }

  if (event.target.closest("[data-child-new]")) {
    openChildSheet();
    return;
  }

  const childEdit = event.target.closest("[data-child-edit]");
  if (childEdit) {
    openChildSheet(childEdit.dataset.childEdit);
    return;
  }

  const childSelect = event.target.closest("[data-child-select]");
  if (childSelect) {
    selectChild(childSelect.dataset.childSelect);
    refreshData().then(() => {
      closeChildSheet();
      renderRoute();
    });
    return;
  }

  const childArchive = event.target.closest("[data-child-archive]");
  if (childArchive) {
    if (!window.confirm("UkryÄ‡ to dziecko? Dane zostanÄ… zachowane, ale profil zniknie z listy.")) {
      return;
    }

    archiveChild(childArchive.dataset.childArchive)
      .then(async () => {
        if (selectedChildId === childArchive.dataset.childArchive) {
          localStorage.removeItem(selectedChildStorageKey());
          selectedChildId = null;
        }
        await refreshChildrenAndData();
        closeChildSheet();
        renderRoute();
      })
      .catch((error) => {
        const notice = document.querySelector("#childNotice");
        if (notice) {
          notice.className = "notice notice--error";
          notice.textContent = translateError(error.message);
          notice.hidden = false;
        }
      });
    return;
  }

  const action = event.target.closest("[data-route-action]");
  if (action) {
    navigate(action.dataset.routeAction, action.dataset.day ? { day: action.dataset.day } : {});
  }

  const editDay = event.target.closest("[data-edit-day]");
  if (editDay) {
    navigate("entry", { day: editDay.dataset.editDay });
  }

  if (event.target.closest("[data-print]")) {
    window.print();
  }
});

tabbar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-route]");
  if (button) {
    navigate(button.dataset.route);
  }
});

logoutButton.addEventListener("click", async () => {
  await signOut();
});

childSwitcherButton.addEventListener("click", () => {
  openChildSheet(selectedChildId);
});

window.addEventListener("hashchange", renderRoute);

boot();
