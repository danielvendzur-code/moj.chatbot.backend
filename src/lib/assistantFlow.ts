import type { AssistantPreset, InterestId } from "../types/assistant";

export type StepId =
  | "interest"
  | "industry"
  | "priority"
  | "features"
  | "volume"
  | "timeline"
  | "contact";

/* The visible flow is intentionally short: solution, company, key functions,
   timing and contact. Legacy step ids remain exported for saved-state compatibility. */
export const STEPS: StepId[] = ["interest", "industry", "features", "timeline", "contact"];

export const QUESTIONS: Record<StepId, [title: string, subtitle: string]> = {
  interest: [
    "Čo má zákazník na webe vybaviť?",
    "Vyberte najbližší typ. Presný rozsah doladíme podľa vašich podkladov.",
  ],
  industry: [
    "Pre aký typ firmy riešenie pripravujeme?",
    "Pomôže mi to odporučiť správne otázky, výstupy a prepojenia.",
  ],
  priority: [
    "Čo od asistenta očakávate?",
    "Tento krok sa v skrátenom toku nepoužíva.",
  ],
  features: [
    "Ktoré funkcie sú pre vás dôležité?",
    "Základ je označený. Vyberte iba to, čo zákazník naozaj potrebuje.",
  ],
  volume: [
    "Koľko dopytov mesačne riešite?",
    "Tento údaj sa dá doplniť neskôr a nie je samostatným krokom.",
  ],
  timeline: [
    "Kedy chcete riešenie spustiť?",
    "Podľa termínu pripravím realistický postup a rozsah prvej verzie.",
  ],
  contact: [
    "Kam mám poslať konkrétny návrh?",
    "Meno a e-mail stačia. Ostatné údaje sú nepovinné.",
  ],
};

export type InterestOption = {
  id: InterestId;
  label: string;
  description: string;
  badge?: string;
  icon: "chat" | "calculator" | "cart" | "calendar" | "spark";
};

export const INTERESTS: InterestOption[] = [
  {
    id: "chatbot",
    label: "AI chatbot",
    description: "Odpovie, poradí a pripraví dopyt s kontextom.",
    icon: "chat",
  },
  {
    id: "calcbot",
    label: "Chatbot s výpočtom",
    description: "Vypočíta cenu, spotrebu alebo rozsah podľa vašich pravidiel.",
    icon: "calculator",
  },
  {
    id: "product",
    label: "Chatbot s konfigurátorom",
    description: "Prevedie výberom variantov, rozmerov a doplnkov.",
    icon: "cart",
  },
  {
    id: "custom",
    label: "Vlastné riešenie",
    description: "Opíšte proces a navrhnem vhodný postup na mieru.",
    icon: "spark",
  },
];

export type IndustryOption = {
  id: string;
  label: string;
  icon: "tools" | "cart" | "food" | "heart" | "factory" | "spark";
  examples: string[];
};

export const INDUSTRIES: IndustryOption[] = [
  {
    id: "sluzby",
    label: "Služby a remeslá",
    icon: "tools",
    examples: [
      "Cenový dopyt s rozsahom a lokalitou",
      "Fotky ešte pred obhliadkou",
      "Rezervácia termínu alebo obhliadky",
    ],
  },
  {
    id: "eshop",
    label: "E-shop a predaj",
    icon: "cart",
    examples: [
      "Odporúčanie produktu podľa potreby",
      "Výber variantu a doplnkov",
      "Kontakt s hotovou konfiguráciou",
    ],
  },
  {
    id: "gastro",
    label: "Gastro a ubytovanie",
    icon: "food",
    examples: [
      "Rezervácia stola alebo pobytu",
      "Odpovede na časté otázky",
      "Komunikácia vo viacerých jazykoch",
    ],
  },
  {
    id: "zdravie",
    label: "Zdravie a krása",
    icon: "heart",
    examples: [
      "Výber služby a termínu",
      "Predpríprava klienta pred návštevou",
      "Cenník bez opakovaných telefonátov",
    ],
  },
  {
    id: "vyroba",
    label: "Výroba a B2B",
    icon: "factory",
    examples: [
      "Technické parametre dopytu",
      "Kvalifikácia pred obchodníkom",
      "Zápis do CRM alebo tabuľky",
    ],
  },
  {
    id: "ine",
    label: "Iné odvetvie",
    icon: "spark",
    examples: [
      "Vlastné otázky a rozhodovanie",
      "Zber kontaktu s kontextom",
      "Odovzdanie človeku v správnom momente",
    ],
  },
];

export type PriorityOption = {
  id: string;
  label: string;
  description: string;
};

export const PRIORITIES: PriorityOption[] = [
  { id: "dopyty", label: "Viac pripravených dopytov", description: "Získať kontakt aj relevantné vstupy." },
  { id: "telefonaty", label: "Menej opakovaných otázok", description: "Bežné otázky vybaví asistent." },
  { id: "nonstop", label: "Dostupnosť 24/7", description: "Odpovie aj mimo pracovného času." },
  { id: "rychlost", label: "Okamžitá reakcia", description: "Zákazník nečaká na e-mail." },
];

export type FeatureOption = {
  id: string;
  label: string;
  description: string;
  basic?: boolean;
};

export const FEATURES: FeatureOption[] = [
  {
    id: "faq",
    label: "Odpovede podľa vašich podkladov",
    description: "Služby, postup, termíny a časté otázky.",
    basic: true,
  },
  {
    id: "dopyty",
    label: "Pripravený dopyt s kontaktom",
    description: "Odpovede zákazníka prídu spolu v jednom zhrnutí.",
    basic: true,
  },
  {
    id: "email",
    label: "Zhrnutie na e-mail",
    description: "Firma aj zákazník dostanú jasný výsledok.",
    basic: true,
  },
  {
    id: "cena",
    label: "Výpočet podľa vašich pravidiel",
    description: "Cena, spotreba, rozsah alebo návratnosť.",
  },
  {
    id: "varianty",
    label: "Varianty, rozmery a doplnky",
    description: "Krokový konfigurátor produktu alebo služby.",
  },
  {
    id: "fotky",
    label: "Fotky a prílohy",
    description: "Lepší odhad rozsahu ešte pred kontaktom.",
  },
  {
    id: "rezervacie",
    label: "Kalendár a rezervácie",
    description: "Výber termínu a potvrdenie bez prepisovania.",
  },
  {
    id: "crm",
    label: "CRM, tabuľka alebo vlastný systém",
    description: "Dopyt sa zapíše tam, kde s ním pracujete.",
  },
  {
    id: "jazyky",
    label: "Viac jazykov",
    description: "Slovenčina, angličtina, nemčina a ďalšie.",
  },
];

export const BASIC_FEATURE_IDS: string[] = FEATURES.filter((option) => option.basic).map(
  (option) => option.id,
);

export const RECOMMENDED_FEATURES: Record<InterestId, string[]> = {
  chatbot: [],
  calcbot: ["cena"],
  product: ["varianty", "cena"],
  booking: ["rezervacie"],
  custom: [],
};

export const defaultFeatures = (interest: InterestId | null): string[] => [
  ...BASIC_FEATURE_IDS,
  ...(interest ? RECOMMENDED_FEATURES[interest] : []),
];

export type VolumeOption = {
  id: string;
  label: string;
  description: string;
};

export const VOLUMES: VolumeOption[] = [
  { id: "v20", label: "Do 20", description: "Občasné dopyty a osobný prístup." },
  { id: "v100", label: "20 – 100", description: "Stabilný tok dopytov." },
  { id: "v500", label: "100 – 500", description: "Vyťažená prevádzka." },
  { id: "v500plus", label: "Viac než 500", description: "Veľký objem a automatizácia." },
];

export type TimelineOption = {
  id: string;
  label: string;
  description: string;
};

export const TIMELINES: TimelineOption[] = [
  {
    id: "asap",
    label: "Čo najskôr",
    description: "Prioritný návrh podľa pripravenosti podkladov.",
  },
  {
    id: "mesiac",
    label: "Do mesiaca",
    description: "Čas na doladenie logiky, obsahu a vzhľadu.",
  },
  {
    id: "kvartal",
    label: "O 1 – 3 mesiace",
    description: "Pripravíme plán a realistické etapy.",
  },
  {
    id: "rozhliadam",
    label: "Zatiaľ sa rozhliadam",
    description: "Nezáväzný návrh na porovnanie možností.",
  },
];

export const PRESET_TO_INTEREST: Record<AssistantPreset, InterestId> = {
  calculator: "calcbot",
  inquiry: "chatbot",
  advisor: "chatbot",
  booking: "booking",
};

export const labelOf = (
  options: ReadonlyArray<{ id: string; label: string }>,
  id: string | null,
): string => options.find((option) => option.id === id)?.label ?? "—";

export function buildProposalNumber(): string {
  return `MC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}
