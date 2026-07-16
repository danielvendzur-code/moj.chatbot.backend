import type { AssistantPreset, InterestId } from "../types/assistant";

export type StepId =
  | "interest"
  | "industry"
  | "priority"
  | "features"
  | "volume"
  | "contact";

export const STEPS: StepId[] = [
  "interest",
  "industry",
  "priority",
  "features",
  "volume",
  "contact",
];

export const QUESTIONS: Record<StepId, [title: string, subtitle: string]> = {
  interest: ["Čo vás zaujíma?", "Vyberte, s čím vám mám pomôcť. Detaily doladíme v ďalších krokoch."],
  industry: ["V akom odvetví podnikáte?", "Podľa odvetvia pripravím vhodné ukážky a tón komunikácie."],
  priority: ["Čo od asistenta čakáte najviac?", "Vyberte hlavný cieľ — podľa neho nastavím správanie bota."],
  features: ["Čo má asistent zvládnuť?", "Označte všetko, čo dáva zmysel. Pokojne viac možností."],
  volume: ["Koľko dopytov mesačne riešite?", "Stačí odhad — pomôže nastaviť kapacitu a cenu."],
  contact: ["Zhrnutie návrhu", "Skontrolujte výber a nechajte mi kontakt — pripravím návrh na mieru."],
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
    description: "Odpovedá návštevníkom 24/7 a je zaučený na vašu firmu.",
    icon: "chat",
  },
  {
    id: "calcbot",
    label: "Chatbot s kalkulačkou",
    description: "Cena podľa rozmerov, materiálu a montáže — hneď na webe.",
    badge: "Najobľúbenejšie",
    icon: "calculator",
  },
  {
    id: "product",
    label: "Produktový konfigurátor",
    description: "Výber modelu, variantov a doplnkov aj s cenou.",
    icon: "cart",
  },
  {
    id: "booking",
    label: "Rezervačný chatbot",
    description: "Krátky dopyt, výber termínu a automatické pripomienky.",
    icon: "calendar",
  },
  {
    id: "custom",
    label: "Niečo iné",
    description: "Popíšte vlastnú predstavu — navrhnem riešenie na mieru.",
    icon: "spark",
  },
];

export type IndustryOption = {
  id: string;
  label: string;
  icon: "tools" | "cart" | "food" | "heart" | "factory" | "spark";
  /* Reálne use-casy chatbotov v danom odvetví — zobrazia sa po výbere. */
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
      "Rezervácia stola či izby vrátane waitlistu",
      "Objednávky a menu s alergénmi na jednu správu",
      "Otváracie hodiny a info 24/7, aj viacjazyčne",
    ],
  },
  {
    id: "zdravie",
    label: "Zdravie a krása",
    icon: "heart",
    examples: [
      "Objednanie termínu s automatickou pripomienkou (menej no-show)",
      "Predpríprava klienta pred návštevou",
      "Cenník, permanentky a časté otázky bez telefonátu",
    ],
  },
  {
    id: "vyroba",
    label: "Výroba a B2B",
    icon: "factory",
    examples: [
      "Kvalifikácia dopytov (RFQ) ešte pred obchodníkom",
      "Technické parametre a dostupnosť z katalógu",
      "Dopyty na servis a náhradné diely s presným kontextom",
    ],
  },
  {
    id: "ine",
    label: "Iné odvetvie",
    icon: "spark",
    examples: [
      "Odpovede na časté otázky 24/7",
      "Zber dopytov a kontaktov s kontextom",
      "Odovzdanie zložitých otázok živému človeku",
    ],
  },
];

export type PriorityOption = {
  id: string;
  label: string;
  description: string;
};

export const PRIORITIES: PriorityOption[] = [
  { id: "dopyty", label: "Viac dopytov z webu", description: "Návštevníkov, čo by odišli, premení na kontakty." },
  { id: "telefonaty", label: "Menej telefonátov a e-mailov", description: "Rutinné otázky vybaví bot, vy len vážnych záujemcov." },
  { id: "nonstop", label: "Dostupnosť aj mimo pracovného času", description: "Večer a cez víkend, keď ľudia reálne hľadajú." },
  { id: "rychlost", label: "Rýchlejšie odpovede zákazníkom", description: "Okamžitá reakcia namiesto čakania na e-mail." },
  { id: "imidz", label: "Modernejší dojem webu", description: "Stránka pôsobí živo a profesionálne." },
];

export type FeatureOption = {
  id: string;
  label: string;
  description: string;
};

export const FEATURES: FeatureOption[] = [
  { id: "faq", label: "Odpovedať na časté otázky", description: "Ceny, otváracie hodiny, postupy…" },
  { id: "dopyty", label: "Zbierať dopyty a kontakty", description: "Použiteľné podklady ešte pred telefonátom." },
  { id: "cena", label: "Počítať cenu podľa parametrov", description: "Rozmery, materiál, montáž — cena hneď." },
  { id: "varianty", label: "Ponúkať varianty a doplnky", description: "Zákazník si vyskladá model bez neistoty." },
  { id: "fotky", label: "Prijímať fotky od zákazníka", description: "Rozsah práce jasný ešte pred obhliadkou." },
  { id: "rezervacie", label: "Rezervovať termíny", description: "Prepojenie na kalendár a pripomienky." },
  { id: "pdf", label: "Vygenerovať PDF ponuku", description: "Hotová ponuka na stiahnutie či do e-mailu." },
  { id: "scoring", label: "Lead scoring", description: "Priorita dopytu podľa hodnoty zákazky." },
  { id: "email", label: "Posielať zhrnutia e-mailom", description: "Vám aj zákazníkovi, automaticky." },
  { id: "crm", label: "Zapisovať do CRM / tabuľky", description: "Každý dopyt na svojom mieste." },
  { id: "handoff", label: "Prepnúť na živého človeka", description: "Zložitú požiadavku odovzdá aj s kontextom." },
  { id: "jazyky", label: "Odpovedať vo viacerých jazykoch", description: "SK, EN, DE… podľa zákazníka." },
];

/* Predvolené funkcie podľa vybraného záujmu — dajú sa upraviť. */
export const RECOMMENDED_FEATURES: Record<InterestId, string[]> = {
  chatbot: ["faq", "dopyty"],
  calcbot: ["cena", "dopyty", "pdf", "email"],
  product: ["varianty", "cena", "dopyty"],
  booking: ["rezervacie", "dopyty", "email"],
  custom: [],
};

export type VolumeOption = {
  id: string;
  label: string;
  description: string;
};

export const VOLUMES: VolumeOption[] = [
  { id: "v20", label: "Do 20", description: "Občasné dopyty, dôraz na osobný tón." },
  { id: "v100", label: "20 – 100", description: "Stabilný tok — asistent odbremení telefón." },
  { id: "v500", label: "100 – 500", description: "Vyťažená prevádzka, triedenie má veľký efekt." },
  { id: "v500plus", label: "Viac než 500", description: "Veľký objem — automatizácia je nutnosť." },
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
