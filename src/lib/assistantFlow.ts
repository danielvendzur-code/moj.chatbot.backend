import type { AssistantPreset, InterestId } from "../types/assistant";
import type { WidgetIconName } from "../components/widget/WidgetIcon";

export type StepId =
  | "interest"
  | "industry"
  | "priority"
  | "features"
  | "volume"
  | "timeline"
  | "contact";

export const STEPS: StepId[] = ["interest", "industry", "features", "timeline", "contact"];

export const QUESTIONS: Record<StepId, [title: string, subtitle: string]> = {
  interest: [
    "Čo má váš web vybaviť za vás?",
    "Vyberte jednu možnosť. Každá vedie k inému typu riešenia.",
  ],
  industry: [
    "Aký typ firmy máte?",
    "Vyberte jednu možnosť. Podľa odvetvia spresním odporúčanie.",
  ],
  priority: [
    "Čo od asistenta očakávate?",
    "Tento krok sa v skrátenom toku nepoužíva.",
  ],
  features: [
    "Čo má riešenie vedieť?",
    "Môžete vybrať viac možností. Označte iba to, čo je pre vás dôležité.",
  ],
  volume: [
    "Koľko dopytov mesačne riešite?",
    "Tento údaj sa dá doplniť neskôr a nie je samostatným krokom.",
  ],
  timeline: [
    "Kedy to chcete spustiť?",
    "Vyberte jednu možnosť. Presný harmonogram pripravím podľa rozsahu.",
  ],
  contact: [
    "Kam mám poslať návrh?",
    "Na základe odpovedí pripravím odporúčaný rozsah a presnú cenu.",
  ],
};

export type InterestOption = {
  id: InterestId;
  label: string;
  description: string;
  badge?: string;
  icon: WidgetIconName;
};

export const INTERESTS: InterestOption[] = [
  {
    id: "chatbot",
    label: "Odpovedať zákazníkom",
    description: "Vysvetlí služby, poradí a pripraví dopyt.",
    icon: "chat",
  },
  {
    id: "calcbot",
    label: "Počítať cenu",
    description: "Vypočíta cenu alebo rozsah podľa vašich pravidiel.",
    icon: "calculator",
  },
  {
    id: "product",
    label: "Pomôcť s výberom",
    description: "Prevedie zákazníka variantmi a doplnkami.",
    icon: "options",
  },
  {
    id: "custom",
    label: "Nie som si istý",
    description: "Opíšte situáciu a navrhnem najjednoduchší postup.",
    icon: "spark",
  },
];

export type IndustryOption = {
  id: string;
  label: string;
  icon: WidgetIconName;
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
      "Pripravené zadanie pred obchodníkom",
      "Zápis do CRM alebo tabuľky",
    ],
  },
  {
    id: "ine",
    label: "Iný typ firmy",
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
    label: "Odpovede podľa podkladov",
    description: "Služby, postup a časté otázky.",
    basic: true,
  },
  {
    id: "dopyty",
    label: "Pripravený dopyt",
    description: "Kontakt aj odpovede v jednom zhrnutí.",
    basic: true,
  },
  {
    id: "cena",
    label: "Výpočet ceny",
    description: "Cena alebo rozsah podľa vašich pravidiel.",
  },
  {
    id: "varianty",
    label: "Výber variantov",
    description: "Rozmery, materiály a doplnky.",
  },
  {
    id: "rezervacie",
    label: "Termíny a rezervácie",
    description: "Výber termínu bez prepisovania.",
  },
  {
    id: "fotky",
    label: "Fotky a prílohy",
    description: "Lepší odhad ešte pred kontaktom.",
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
  { id: "asap", label: "Čo najskôr", description: "Začneme podľa pripravenosti podkladov." },
  { id: "mesiac", label: "Do mesiaca", description: "Priestor na doladenie obsahu a logiky." },
  { id: "kvartal", label: "O 1 – 3 mesiace", description: "Pripravíme plán a jednotlivé etapy." },
  { id: "rozhliadam", label: "Zatiaľ sa rozhliadam", description: "Najprv si porovnáte možnosti." },
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
