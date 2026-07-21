import type { AssistantPreset, InterestId } from "../types/assistant";

export type StepId =
  | "interest"
  | "industry"
  | "priority"
  | "features"
  | "volume"
  | "timeline"
  | "contact";

/* Hlavný cieľ sa už nepýta samostatne. Moderný chatbot má kombinovať
   odpovede, kvalifikáciu a konverziu; konkrétne potreby sa vyberajú vo funkciách. */
export const STEPS: StepId[] = [
  "interest",
  "industry",
  "features",
  "volume",
  "timeline",
  "contact",
];

export const QUESTIONS: Record<StepId, [title: string, subtitle: string]> = {
  interest: ["Aký chatbot chcete?", "Vyberte najbližší typ. Konkrétne funkcie doladíte v ďalších krokoch."],
  industry: ["V akom odvetví podnikáte?", "Podľa odvetvia pripravím vhodné otázky, ukážky a tón komunikácie."],
  priority: ["Čo od asistenta čakáte najviac?", "Tento krok sa v aktuálnom postupe nepoužíva."],
  features: ["Čo má chatbot zvládnuť?", "Základné funkcie sú označené. Vyberte všetky nadstavby, ktoré majú pre váš web zmysel."],
  volume: ["Koľko dopytov mesačne riešite?", "Stačí odhad — pomôže nastaviť kapacitu, integrácie a rozsah riešenia."],
  timeline: ["Kedy chcete chatbota spustiť?", "Podľa termínu prispôsobím návrh aj harmonogram nasadenia."],
  contact: ["Kam vám mám poslať návrh?", "Najprv nechajte kontakt. Pod formulárom si môžete skontrolovať celý výber."],
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
    description: "Počas rozhovoru vypočíta cenu, spotrebu alebo návratnosť.",
    badge: "Najobľúbenejšie",
    icon: "calculator",
  },
  {
    id: "product",
    label: "Chatbot s konfigurátorom",
    description: "Prevedie výberom modelu, variantov a doplnkov aj s cenou.",
    icon: "cart",
  },
  {
    id: "booking",
    label: "Rezervačný chatbot",
    description: "Zodpovie otázky, vyberie službu a ponúkne voľný termín.",
    icon: "calendar",
  },
  {
    id: "custom",
    label: "Riešenie na mieru",
    description: "Popíšte vlastnú predstavu — navrhnem vhodný priebeh a funkcie.",
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
      "Rezervácia stola či izby vrátane waitlistu",
      "Objednávky a menu s alergénmi na jednu správu",
      "Otváracie hodiny a informácie 24/7, aj viacjazyčne",
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

/* Zachované kvôli spätnej kompatibilite uložených návrhov, ale samostatný krok je odstránený. */
export const PRIORITIES: PriorityOption[] = [
  { id: "dopyty", label: "Viac dopytov a kontaktov", description: "Premeniť anonymných návštevníkov na konkrétne dopyty s kontaktom." },
  { id: "telefonaty", label: "Menej opakovaných otázok", description: "Ceny, hodiny a bežné otázky vybaví bot — vy riešite len vážnych záujemcov." },
  { id: "nonstop", label: "Dostupnosť 24/7", description: "Odpovie aj večer a cez víkend, keď ľudia reálne rozhodujú." },
  { id: "rychlost", label: "Okamžitá reakcia", description: "Zákazník má odpoveď hneď, nečaká na e-mail ani telefonát." },
  { id: "imidz", label: "Vyššia dôvera a moderný web", description: "Stránka pôsobí živo a profesionálne — to zvyšuje konverziu." },
];

export type FeatureOption = {
  id: string;
  label: string;
  description: string;
  basic?: boolean;
};

export const FEATURES: FeatureOption[] = [
  { id: "faq", label: "Odpovedať na časté otázky", description: "Ceny, otváracie hodiny, postupy…", basic: true },
  { id: "dopyty", label: "Zbierať dopyty a kontakty", description: "Použiteľné podklady ešte pred telefonátom.", basic: true },
  { id: "email", label: "Posielať zhrnutia e-mailom", description: "Vám aj zákazníkovi, automaticky.", basic: true },
  { id: "handoff", label: "Prepnúť na živého človeka", description: "Zložitú požiadavku odovzdá aj s kontextom.", basic: true },
  { id: "cena", label: "Počítať cenu podľa parametrov", description: "Rozmery, materiál, montáž — cena hneď." },
  { id: "varianty", label: "Ponúkať varianty a doplnky", description: "Zákazník si vyskladá model bez neistoty." },
  { id: "fotky", label: "Prijímať fotky a prílohy", description: "Rozsah práce jasný ešte pred obhliadkou." },
  { id: "rezervacie", label: "Rezervovať termíny", description: "Prepojenie na kalendár a pripomienky." },
  { id: "pdf", label: "Vygenerovať PDF ponuku", description: "Hotová ponuka na stiahnutie či do e-mailu." },
  { id: "scoring", label: "Triediť dopyty podľa priority", description: "Vážne a hodnotné dopyty uvidíte ako prvé." },
  { id: "crm", label: "Zapisovať do CRM alebo tabuľky", description: "Každý dopyt automaticky na svojom mieste." },
  { id: "jazyky", label: "Odpovedať vo viacerých jazykoch", description: "SK, EN, DE… podľa zákazníka." },
  { id: "whatsapp", label: "Prepojiť telefonát alebo WhatsApp", description: "V správnom momente ponúkne priamy kontakt." },
  { id: "objednavka", label: "Prijať objednávku alebo rezerváciu", description: "Zozbiera výber, údaje a odošle potvrdenie." },
  { id: "analytics", label: "Merať otázky a konverzie", description: "Uvidíte, čo ľudia riešia a kde odchádzajú." },
  { id: "sprava", label: "Jednoducho aktualizovať odpovede", description: "Cenník a informácie sa dajú meniť bez prerábania bota." },
];

export const BASIC_FEATURE_IDS: string[] = FEATURES.filter((option) => option.basic).map(
  (option) => option.id,
);

export const RECOMMENDED_FEATURES: Record<InterestId, string[]> = {
  chatbot: ["analytics"],
  calcbot: ["cena", "pdf", "analytics"],
  product: ["varianty", "cena", "objednavka"],
  booking: ["rezervacie", "whatsapp"],
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
  { id: "v100", label: "20 – 100", description: "Stabilný tok — chatbot odbremení telefón." },
  { id: "v500", label: "100 – 500", description: "Vyťažená prevádzka, triedenie má veľký efekt." },
  { id: "v500plus", label: "Viac než 500", description: "Veľký objem — automatizácia je nutnosť." },
];

export type TimelineOption = {
  id: string;
  label: string;
  description: string;
};

export const TIMELINES: TimelineOption[] = [
  { id: "asap", label: "Čo najskôr", description: "Návrh dostanete prioritne, spustenie do pár týždňov." },
  { id: "mesiac", label: "Do mesiaca", description: "Dosť času na doladenie obsahu aj vzhľadu." },
  { id: "kvartal", label: "O 1 – 3 mesiace", description: "Pripravím plán a ozvem sa v správnom čase." },
  { id: "rozhliadam", label: "Zatiaľ sa rozhliadam", description: "Nezáväzný návrh s cenou — rozhodnete sa v pokoji." },
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
