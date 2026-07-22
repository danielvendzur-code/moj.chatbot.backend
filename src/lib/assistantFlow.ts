import type { AssistantPreset, InterestId } from "../types/assistant";

export type StepId =
  | "interest"
  | "industry"
  | "priority"
  | "features"
  | "volume"
  | "timeline"
  | "contact";

/* Cena nie je samostatný krok. Používateľ vyberie typ riešenia a konkrétne
   funkcie, vrátane výpočtu, si doladí v kroku funkcií. */
export const STEPS: StepId[] = [
  "interest",
  "industry",
  "features",
  "volume",
  "timeline",
  "contact",
];

export const QUESTIONS: Record<StepId, [title: string, subtitle: string]> = {
  interest: [
    "Čo má zákazník cez chatbota vybaviť?",
    "Vyberte najbližší typ riešenia. Presné funkcie nastavíte v ďalších krokoch.",
  ],
  industry: [
    "V akom odvetví podnikáte?",
    "Podľa odvetvia ukážem konkrétne možnosti použitia.",
  ],
  priority: [
    "Čo od asistenta očakávate?",
    "Tento krok sa v skrátenom toku nepoužíva.",
  ],
  features: [
    "Čo má chatbot zvládnuť?",
    "Základ je označený. Pridajte výpočet, rezervácie, fotky alebo prepojenia.",
  ],
  volume: [
    "Koľko dopytov mesačne riešite?",
    "Stačí približný odhad. Pomôže nastaviť rozsah riešenia.",
  ],
  timeline: [
    "Kedy ho chcete spustiť?",
    "Podľa termínu pripravím realistický postup nasadenia.",
  ],
  contact: [
    "Zhrnutie a kontakt",
    "Skontrolujte výber a nechajte kontakt na konkrétny návrh.",
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
    description: "Odpovedá návštevníkom 24/7, poradí a pripraví použiteľný dopyt.",
    icon: "chat",
  },
  {
    id: "calcbot",
    label: "Chatbot s výpočtom",
    description: "Vypočíta cenu, spotrebu alebo rozsah presne podľa vašich pravidiel.",
    icon: "calculator",
  },
  {
    id: "product",
    label: "Chatbot s konfigurátorom",
    description: "Prevedie zákazníka výberom modelu, variantov a doplnkov.",
    icon: "cart",
  },
  {
    id: "booking",
    label: "Rezervácie a termíny",
    description: "Zistí potrebné údaje, ponúkne termín a odošle potvrdenie.",
    icon: "calendar",
  },
  {
    id: "custom",
    label: "Vlastné riešenie",
    description: "Popíšte svoj proces a navrhnem asistenta presne podľa neho.",
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
      "Cenový dopyt aj s fotkami rozsahu práce",
      "Rezervácia obhliadky priamo do kalendára",
      "Urgentné požiadavky aj mimo pracovného času",
    ],
  },
  {
    id: "eshop",
    label: "E-shop a predaj",
    icon: "cart",
    examples: [
      "Odporúčanie produktu podľa potreby zákazníka",
      "Stav objednávky a doručenia bez čakania",
      "Rýchle riešenie výmeny alebo vrátenia tovaru",
    ],
  },
  {
    id: "gastro",
    label: "Gastro a ubytovanie",
    icon: "food",
    examples: [
      "Rezervácia stola alebo izby",
      "Menu, objednávky a alergény na jednom mieste",
      "Informácie 24/7 aj vo viacerých jazykoch",
    ],
  },
  {
    id: "zdravie",
    label: "Zdravie a krása",
    icon: "heart",
    examples: [
      "Objednanie termínu s pripomienkou",
      "Predpríprava klienta pred návštevou",
      "Cenník a časté otázky bez telefonátu",
    ],
  },
  {
    id: "vyroba",
    label: "Výroba a B2B",
    icon: "factory",
    examples: [
      "Kvalifikácia dopytov pred obchodníkom",
      "Technické parametre a dostupnosť z katalógu",
      "Servisné dopyty s presným kontextom",
    ],
  },
  {
    id: "ine",
    label: "Iné odvetvie",
    icon: "spark",
    examples: [
      "Odpovede na časté otázky 24/7",
      "Zber dopytov a kontaktov s kontextom",
      "Odovzdanie zložitej otázky človeku",
    ],
  },
];

export type PriorityOption = {
  id: string;
  label: string;
  description: string;
};

/* Zachované kvôli kompatibilite starších uložených konfigurácií. Tento krok sa
   v aktuálnom toku nezobrazuje. */
export const PRIORITIES: PriorityOption[] = [
  {
    id: "dopyty",
    label: "Viac dopytov a kontaktov",
    description: "Premeniť anonymných návštevníkov na konkrétne dopyty.",
  },
  {
    id: "telefonaty",
    label: "Menej opakovaných otázok",
    description: "Bežné otázky vybaví chatbot a vy riešite vážnych záujemcov.",
  },
  {
    id: "nonstop",
    label: "Dostupnosť 24/7",
    description: "Odpovie aj večer a cez víkend.",
  },
  {
    id: "rychlost",
    label: "Okamžitá reakcia",
    description: "Zákazník nečaká na e-mail ani telefonát.",
  },
  {
    id: "imidz",
    label: "Modernejší web",
    description: "Stránka pôsobí živo a profesionálne.",
  },
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
    label: "Odpovedať na časté otázky",
    description: "Ceny, otváracie hodiny, služby a postupy.",
    basic: true,
  },
  {
    id: "dopyty",
    label: "Zbierať dopyty a kontakty",
    description: "Použiteľné podklady ešte pred telefonátom.",
    basic: true,
  },
  {
    id: "email",
    label: "Posielať zhrnutia e-mailom",
    description: "Vám aj zákazníkovi automaticky.",
    basic: true,
  },
  {
    id: "handoff",
    label: "Prepnúť na živého človeka",
    description: "Zložitú požiadavku odovzdá aj s kontextom.",
    basic: true,
  },
  {
    id: "cena",
    label: "Počítať podľa vašich pravidiel",
    description: "Cena, spotreba, rozsah alebo návratnosť z údajov zákazníka.",
  },
  {
    id: "varianty",
    label: "Ponúkať varianty a doplnky",
    description: "Zákazník si vyskladá produkt bez neistoty.",
  },
  {
    id: "fotky",
    label: "Prijímať fotky a prílohy",
    description: "Rozsah práce je jasný ešte pred obhliadkou.",
  },
  {
    id: "rezervacie",
    label: "Rezervovať termíny",
    description: "Prepojenie na kalendár a pripomienky.",
  },
  {
    id: "whatsapp",
    label: "Otvoriť WhatsApp konverzáciu",
    description: "Plynulé pokračovanie rozhovoru v telefóne.",
  },
  {
    id: "volanie",
    label: "Ponúknuť okamžité zavolanie",
    description: "Klikateľný kontakt v správnom momente.",
  },
  {
    id: "pdf",
    label: "Vygenerovať PDF ponuku",
    description: "Hotová ponuka na stiahnutie alebo do e-mailu.",
  },
  {
    id: "scoring",
    label: "Triediť dopyty podľa priority",
    description: "Viete, ktorému záujemcovi sa venovať ako prvému.",
  },
  {
    id: "crm",
    label: "Zapisovať do CRM alebo tabuľky",
    description: "Každý dopyt skončí na správnom mieste.",
  },
  {
    id: "platba",
    label: "Prijať zálohu alebo platbu",
    description: "Po výbere môže zákazník dokončiť objednávku.",
  },
  {
    id: "jazyky",
    label: "Odpovedať vo viacerých jazykoch",
    description: "Slovenčina, angličtina, nemčina a ďalšie.",
  },
];

export const BASIC_FEATURE_IDS: string[] = FEATURES.filter((option) => option.basic).map(
  (option) => option.id,
);

export const RECOMMENDED_FEATURES: Record<InterestId, string[]> = {
  chatbot: [],
  calcbot: ["cena", "pdf"],
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
  {
    id: "v100",
    label: "20 – 100",
    description: "Stabilný tok, pri ktorom chatbot odbremení telefón.",
  },
  {
    id: "v500",
    label: "100 – 500",
    description: "Vyťažená prevádzka, kde má triedenie veľký efekt.",
  },
  {
    id: "v500plus",
    label: "Viac než 500",
    description: "Veľký objem, pri ktorom je automatizácia nevyhnutná.",
  },
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
    description: "Prioritný návrh a spustenie podľa pripravenosti podkladov.",
  },
  {
    id: "mesiac",
    label: "Do mesiaca",
    description: "Čas na doladenie obsahu, logiky aj vzhľadu.",
  },
  {
    id: "kvartal",
    label: "O 1 – 3 mesiace",
    description: "Pripravím plán a ozvem sa v správnom čase.",
  },
  {
    id: "rozhliadam",
    label: "Zatiaľ sa rozhliadam",
    description: "Nezáväzný návrh, ktorý si môžete porovnať.",
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
  return `NV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}
