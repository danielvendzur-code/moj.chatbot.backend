import type { GoalId } from "../types/assistant";

export type FlowOption = {
  id: string;
  label: string;
};

export type GoalOption = FlowOption & {
  description: string;
};

export type DetailFlow = {
  question: string;
  eyebrow: string;
  options: FlowOption[];
};

export const GOALS: GoalOption[] = [
  {
    id: "calculator",
    label: "Počítať cenu",
    description: "Orientačný výpočet podľa konkrétnych parametrov.",
  },
  {
    id: "inquiry",
    label: "Získavať presné dopyty",
    description: "Menej telefonátov tam a späť, viac podkladov vopred.",
  },
  {
    id: "advisor",
    label: "Pomáhať s výberom produktu",
    description: "Pokojné odporúčanie podľa potrieb zákazníka.",
  },
  {
    id: "booking",
    label: "Rezervovať termín",
    description: "Zmysluplný kontext ešte pred výberom termínu.",
  },
  {
    id: "combined",
    label: "Kombinovať viac funkcií",
    description: "Jeden súvislý nástroj namiesto niekoľkých formulárov.",
  },
];

export const DETAIL_FLOWS: Record<GoalId, DetailFlow> = {
  calculator: {
    eyebrow: "Krok 2 · Kalkulačka",
    question: "Od čoho sa cena odvíja?",
    options: ["Rozmery", "Množstvo", "Materiál", "Doprava", "Montáž", "Doplnky"].map(
      (label) => ({ id: label.toLocaleLowerCase("sk"), label }),
    ),
  },
  inquiry: {
    eyebrow: "Krok 2 · Dopytový asistent",
    question: "Čo potrebuje firma od zákazníka zistiť?",
    options: ["Typ služby", "Rozsah", "Lokalitu", "Termín", "Fotografie", "Kontakt"].map(
      (label) => ({ id: label.toLocaleLowerCase("sk"), label }),
    ),
  },
  advisor: {
    eyebrow: "Krok 2 · Produktový poradca",
    question: "Podľa čoho sa zákazník rozhoduje?",
    options: ["Použitie", "Rozpočet", "Veľkosť", "Materiál", "Farba", "Doplnky"].map(
      (label) => ({ id: label.toLocaleLowerCase("sk"), label }),
    ),
  },
  booking: {
    eyebrow: "Krok 2 · Rezervácia",
    question: "Čo má rezervácii predchádzať?",
    options: [
      "Výber služby",
      "Krátky dopyt",
      "Výber pracovníka",
      "Výber lokality",
      "Bez ďalších otázok",
    ].map((label) => ({ id: label.toLocaleLowerCase("sk"), label })),
  },
  combined: {
    eyebrow: "Krok 2 · Kombinácia",
    question: "Ktoré časti majú spolupracovať?",
    options: ["Kalkulačka", "Dopyt", "Produktový poradca", "Rezervácia", "E-mail", "Kalendár"].map(
      (label) => ({ id: label.toLocaleLowerCase("sk"), label }),
    ),
  },
};

const SUMMARY: Record<GoalId, string> = {
  calculator: "Najvhodnejším základom by bola interaktívna kalkulačka s krátkym kvalifikačným dopytom.",
  inquiry: "Najvhodnejším základom by bol dopytový asistent, ktorý pripraví firme použiteľné podklady.",
  advisor: "Najvhodnejším základom by bol produktový poradca s jasným odporúčaním ďalšieho kroku.",
  booking: "Najvhodnejším základom by bol rezervačný asistent s krátkou prípravou pred výberom termínu.",
  combined: "Podľa výberu by dával zmysel kombinovaný dopytový asistent s kalkulačkou.",
};

export function getSummary(goal: GoalId, selectedLabels: string[]): string {
  const detail = selectedLabels.length
    ? ` Zohľadní pritom: ${selectedLabels.slice(0, 4).join(", ").toLocaleLowerCase("sk")}.`
    : "";
  return `${SUMMARY[goal]}${detail}`;
}

export function getSummaryChips(goal: GoalId): string[] {
  const base: Record<GoalId, string[]> = {
    calculator: ["kalkulačka", "dopyt", "e-mail"],
    inquiry: ["dopyt", "fotografie", "e-mail"],
    advisor: ["poradca", "odporúčanie", "dopyt"],
    booking: ["dopyt", "kalendár", "e-mail"],
    combined: ["kalkulačka", "dopyt", "e-mail", "kalendár"],
  };
  return base[goal];
}
