export const APP_NAME = "TenderNotes";
export const TOTAL_DAYS = 14;
export const SCORE_MAX = 3;

export const SCALE = [
  {
    value: 0,
    label: "Trudno",
    shortLabel: "Trudno",
    icon: "☁",
    iconClass: "state-icon--hard",
    chartColor: "#b8583c",
    title: "Potrzebuje dużo wsparcia",
    description: "Duży płacz, wycofanie, brak kontaktu albo wyraźna zmiana.",
  },
  {
    value: 1,
    label: "Trochę trudno",
    shortLabel: "Trochę",
    icon: "◒",
    iconClass: "state-icon--uneasy",
    chartColor: "#c49342",
    title: "Było napięcie, ale kontakt był możliwy",
    description: "Płacz, zmęczenie lub niepewność pojawiały się wyraźnie, ale dziecko dawało się ukoić.",
  },
  {
    value: 2,
    label: "Raczej spokojnie",
    shortLabel: "Raczej",
    icon: "◐",
    iconClass: "state-icon--settling",
    chartColor: "#4976a8",
    title: "Dzień wracał do równowagi",
    description: "Były drobne trudności, ale kontakt, zabawa lub ukojenie szybko wracały.",
  },
  {
    value: 3,
    label: "Spokojnie",
    shortLabel: "Spokojnie",
    icon: "✓",
    iconClass: "state-icon--calm",
    chartColor: "#3c7a4a",
    title: "Dzień wygląda spokojnie",
    description: "Kontakt, zabawa, ukojenie i powrót do równowagi wyglądają typowo.",
  },
];

export const OBSERVATION_FIELDS = [
  {
    key: "morning_before_nursery",
    label: "Rano przed żłobkiem",
    shortLabel: "Rano",
    help: "Nastrój i gotowość przed wyjściem.",
  },
  {
    key: "separation",
    label: "Rozstanie",
    shortLabel: "Rozstanie",
    help: "Reakcja przy pożegnaniu i możliwość ukojenia.",
  },
  {
    key: "nursery_info",
    label: "Info ze żłobka",
    shortLabel: "Żłobek",
    help: "Konkretne obserwacje przekazane przez opiekunki.",
  },
  {
    key: "pickup",
    label: "Odbiór",
    shortLabel: "Odbiór",
    help: "Kontakt i reakcja przy odbieraniu.",
  },
  {
    key: "after_nursery_home",
    label: "Po żłobku w domu",
    shortLabel: "Po żłobku",
    help: "Regulacja, napięcie i powrót do równowagi.",
  },
  {
    key: "play",
    label: "Zabawa",
    shortLabel: "Zabawa",
    help: "Aktywność, ciekawość i zaangażowanie w zabawę.",
  },
  {
    key: "parent_contact",
    label: "Kontakt z rodzicem",
    shortLabel: "Kontakt",
    help: "Szukane bliskości, reakcja i dostępność w kontakcie.",
  },
  {
    key: "sleep",
    label: "Sen",
    shortLabel: "Sen",
    help: "Jakość zasypiania, nocy i drzemek.",
  },
  {
    key: "food",
    label: "Jedzenie",
    shortLabel: "Jedzenie",
    help: "Apetyt i typowe zachowanie przy posiłkach.",
  },
];

export const SUMMARY_QUESTIONS = [
  {
    key: "photos_only_or_also_home",
    text: "Czy trudność widać tylko na zdjęciach, czy też w domu i przy odbiorze?",
  },
  {
    key: "nursery_confirms_withdrawal",
    text: "Czy opiekunki potwierdzają, że dziecko często stoi z boku lub jest wycofane?",
  },
  {
    key: "recovers_after_pickup",
    text: "Czy po odbiorze wraca do kontaktu, zabawy i normalnej aktywności?",
  },
  {
    key: "sleep_food_regulation_worse",
    text: "Czy pogorszył się sen, jedzenie albo regulacja emocji?",
  },
  {
    key: "regression_signs",
    text: "Czy pojawił się regres, np. utrata słów, gestów, wskazywania lub reakcji na imię?",
  },
  {
    key: "many_days_many_areas",
    text: "Czy trudności utrzymują się przez większość dni i w kilku obszarach naraz?",
  },
];

export const EMPTY_OBSERVATION = {
  observation_date: "",
  morning_before_nursery: null,
  separation: null,
  nursery_info: null,
  pickup: null,
  after_nursery_home: null,
  play: null,
  parent_contact: null,
  sleep: null,
  food: null,
  notes: "",
};
