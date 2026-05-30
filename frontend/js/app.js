import { isSupabaseConfigured, supabase } from "./supabaseClient.js";
import { getCurrentUser, onAuthStateChange, signIn, signOut, signUp } from "./auth.js";
import { loadObservations, loadSummaryAnswers, saveObservation, saveSummaryAnswer } from "./api.js";
import { drawAreaAverages, drawScoreDistribution, drawTrend } from "./charts.js";
import { renderHistoryHtml, renderObservationFormHtml, readObservationForm, suggestedNextDay, wireScoreButtons } from "./observations.js";
import { renderReportHtml, renderSummaryHtml } from "./reports.js";
import { OBSERVATION_FIELDS, TOTAL_DAYS } from "./constants.js";
import { completionCount, escapeHtml, round } from "./utils.js";
import { getRoute, navigate } from "./router.js";

const app = document.querySelector("#app");
const topbar = document.querySelector("#topbar");
const tabbar = document.querySelector("#tabbar");
const viewTitle = document.querySelector("#viewTitle");
const logoutButton = document.querySelector("#logoutButton");

let currentUser = null;
let observations = [];
let authMode = "signin";

const titles = {
  dashboard: "Dziennik",
  entry: "Wpis dzienny",
  history: "Historia",
  report: "Raport",
  summary: "Podsumowanie",
};

async function boot() {
  if (!isSupabaseConfigured()) {
    renderConfigMissing();
    return;
  }

  currentUser = await getCurrentUser();
  onAuthStateChange(async (user) => {
    currentUser = user;
    if (currentUser) {
      await refreshData();
      renderRoute();
    } else {
      observations = [];
      renderAuth();
    }
  });

  if (!currentUser) {
    renderAuth();
    return;
  }

  await refreshData();
  renderRoute();
}

function renderConfigMissing() {
  topbar.hidden = true;
  tabbar.hidden = true;
  app.innerHTML = `
    <section class="auth">
      <div>
        <p class="section-label">TenderNotes</p>
        <h1 class="auth__brand">TenderNotes</h1>
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
        <p class="section-label">TenderNotes</p>
        <h1 class="auth__brand">TenderNotes</h1>
        <p class="auth__lead">Codzienny, spokojny zapis obserwacji. Dane są rozdzielone per konto i przechowywane w Supabase.</p>
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

async function refreshData() {
  observations = await loadObservations();
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
        <p class="hero__text">Wypełnij krótką kartę raz dziennie. Najważniejszy jest wzorzec w czasie, nie pojedynczy wpis.</p>
        <div class="hero__actions">
          <button class="button" type="button" data-route-action="entry">Dodaj wpis</button>
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
          <p class="metric__label">Średnia</p>
          <p class="metric__value">${round(average)}</p>
        </article>
        <article class="metric">
          <p class="metric__label">Wpisane oceny</p>
          <p class="metric__value">${scoreCount}</p>
        </article>
      </div>

      <section class="panel">
        <h3 class="panel__title">Następny krok</h3>
        <p class="panel__hint">Najbliższy niepełny dzień to dzień ${suggestedNextDay(observations)}.</p>
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
  wireScoreButtons(app);

  app.querySelector("#daySelect").addEventListener("change", (event) => {
    navigate("entry", { day: event.target.value });
  });

  app.querySelector("#observationForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const notice = app.querySelector("#formNotice");
    const payload = readObservationForm(form);

    try {
      await saveObservation(day, payload);
      await refreshData();
      notice.className = "notice notice--success";
      notice.textContent = "Zapisano dzień.";
      notice.hidden = false;
    } catch (error) {
      notice.className = "notice notice--error";
      notice.textContent = translateError(error.message);
      notice.hidden = false;
    }
  });
}

function renderHistory() {
  app.innerHTML = renderHistoryHtml(observations);
}

function renderReport() {
  app.innerHTML = renderReportHtml(observations);
  requestAnimationFrame(() => {
    drawTrend(document.querySelector("#trendChart"), observations);
    drawAreaAverages(document.querySelector("#areaChart"), observations);
    drawScoreDistribution(document.querySelector("#distributionChart"), observations);
  });
}

async function renderSummary() {
  const answers = await loadSummaryAnswers();
  app.innerHTML = renderSummaryHtml(answers);
  app.querySelector("#summaryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const rows = Array.from(form.querySelectorAll("[data-question-key]"));

    await Promise.all(
      rows.map((row) => {
        const key = row.dataset.questionKey;
        const formData = new FormData(form);
        return saveSummaryAnswer(key, {
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

window.addEventListener("hashchange", renderRoute);

boot();
