import type { AssistantPreset, InterestId } from "../types/assistant";

export type StepId =
  | "interest"
  | "industry"
  | "priority"
  | "features"
  | "volume"
  | "timeline"
  | "contact";

/* Hlavný cieľ bol odstránený z toku: každý chatbot má pokrývať odpovede,
   dopyty aj okamžitú reakciu. Používateľ vyberá iba konkrétne funkcie. */
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
    "Vyberte hlavný spôsob použitia. Kalkulačku, konfiguráciu a ďalšie funkcie doladíte neskôr.",
  ],
  industry: [
    "V akom odvetví podnikáte?",
    "Po výbere hneď ukážem, čo môže chatbot vo vašom odvetví riešiť.",
  ],
  priority: [
    "Čo od asistenta čakáte najviac?",
    "Tento krok sa už v skrátenom toku nepoužíva.",
  ],
  features: [
    "Čo má chatbot zvládnuť?",
    "Základné funkcie sú označené. Pridajte výpočet, rezervácie, fotky alebo ďalšie prepojenia.",
  ],
  volume: [
    "Koľko dopytov mesačne riešite?",
    "Stačí približný odhad. Výber nemení funkcie, pomáha iba nastaviť rozsah riešenia.",
  ],
  timeline: [
    "Kedy chcete chatbota spustiť?",
    "Podľa termínu pripravím realistický postup nasadenia.",
  ],
  contact: [
    "Kam mám poslať návrh?",
    "Najprv nechajte kontakt. Pod ním si môžete skontrolovať celý výber.",
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
    label: "Dopyty a poradenstvo",
    description: "Odpovie návštevníkom, poradí a pripraví kompletný dopyt 24/7.",
    icon: "chat",
  },
  {
    id: "product",
    label: "Výber produktu alebo služby",
    description: "Prevedie zákazníka možnosťami, variantmi a doplnkami bez neistoty.",
    icon: "cart",
  },
  {
    id: "booking",
    label: "Rezervácie a termíny",
    description: "Zodpovie otázky, vyberie termín a zozbiera potrebné údaje.",
    icon: "calendar",
  },
  {
    id: "custom",
    label: "Vlastný proces",
    description: "Popíšte, čo má zákazník vybaviť, a navrhnem riešenie presne pre vás.",
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
      "Zachytenie urgentných požiadaviek mimo pracovného času",
    ],
  },
  {
    id: "eshop",
    label: "E-shop a predaj",
    icon: "cart",
    examples: [
      "Stav objednávky a doručenia bez čakania na podporu",
      "Odporúčanie produktu podľa potreby zákazníka",
      "Záchrana opusteného košíka a rýchle vrátenie tovaru",
    ],
  },
  {
    id: "gastro",
    label: "Gastro a ubytovanie",
    icon: "food",
    examples: [
      "Rezervácia stola či izby vrátane čakacej listiny",
      "Objednávky a menu s alergénmi na jednu správu",
      "Otváracie hodiny a informácie 24/7 aj vo viacerých jazykoch",
    ],
  },
  {
    id: "zdravie",
    label: "Zdravie a krása",
    icon: "heart",
    examples: [
      "Objednanie termínu s automatickou pripomienkou",
      "Predpríprava klienta pred návštevou",
      "Cenník, permanentky a časté otázky bez telefonátu",
    ],
  },
  {
    id: "vyroba",
    label: "Výroba a B2B",
    icon: "factory",
    examples: [
      "Kvalifikácia dopytov ešte pred obchodníkom",
      "Technické parametre a dostupnosť z katalógu",
      "Servisné dopyty a náhradné diely s presným kontextom",
    ],
  },
  {
    id: "ine",
    label: "Iné odvetvie",
    icon: "spark",
    examples: [
      "Odpovede na časté otázky 24/7",
      "Zber dopytov a kontaktov s kontextom",
      "Odovzdanie zložitej otázky živému človeku",
    ],
  },
];

export type PriorityOption = {
  id: string;
  label: string;
  description: string;
};

export const PRIORITIES: PriorityOption[] = [
  {
    id: "dopyty",
    label: "Viac dopytov a kontaktov",
    description: "Premeniť anonymných návštevníkov na konkrétne dopyty s kontaktom.",
  },
  {
    id: "telefonaty",
    label: "Menej opakovaných otázok",
    description: "Ceny, hodiny a bežné otázky vybaví bot — vy riešite len vážnych záujemcov.",
  },
  {
    id: "nonstop",
    label: "Dostupnosť 24/7",
    description: "Odpovie aj večer a cez víkend, keď ľudia reálne rozhodujú.",
  },
  {
    id: "rychlost",
    label: "Okamžitá reakcia",
    description: "Zákazník má odpoveď hneď, nečaká na e-mail ani telefonát.",
  },
  {
    id: "imidz",
    label: "Vyššia dôvera a moderný web",
    description: "Stránka pôsobí živo a profesionálne — to zvyšuje konverziu.",
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
    label: "Kalkulačka podľa vašich pravidiel",
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
    description: "Klikateľný kontakt v správnom momente rozhovoru.",
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
    description: "Po výbere môže zákazník rovno dokončiť objednávku.",
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
  { id: "v20", label: "Do 20", description: "Občasné dopyty, dôraz na osobný tón." },
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
    description: "Dostatok času na doladenie obsahu, logiky aj vzhľadu.",
  },
  {
    id: "kvartal",
    label: "O 1 – 3 mesiace",
    description: "Pripravím plán a ozvem sa v správnom čase.",
  },
  {
    id: "rozhliadam",
    label: "Zatiaľ sa rozhliadam",
    description: "Nezáväzný návrh s cenou, ktorý si môžete pokojne porovnať.",
  },
];

export const PRESET_TO_INTEREST: Record<AssistantPreset, InterestId> = {
  calculator: "chatbot",
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
