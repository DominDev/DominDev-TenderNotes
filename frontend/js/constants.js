export const APP_NAME = "TenderNotes";
export const TOTAL_DAYS = 14;

export const SCALE = [
  {
    value: 0,
    label: "Trudno",
    icon: "●",
    iconClass: "state-icon--hard",
    title: "Potrzebuje wsparcia",
    description: "Duży płacz, wycofanie, brak kontaktu albo wyraźna zmiana.",
  },
  {
    value: 1,
    label: "Różnie",
    icon: "◐",
    iconClass: "state-icon--mixed",
    title: "Różnie w ciągu dnia",
    description: "Trochę niepewności lub zmęczenia, ale kontakt jest możliwy.",
  },
  {
    value: 2,
    label: "Spokojnie",
    icon: "✓",
    iconClass: "state-icon--calm",
    title: "Dzień wygląda dobrze",
    description: "Kontakt, zabawa, ukojenie i powrót do równowagi.",
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
