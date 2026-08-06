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

export const QUESTION_STEPS: StepId[] = STEPS.filter((id) => id !== "contact");

export const QUESTIONS: Record<StepId, [title: string, subtitle: string]> = {
  interest: [
    "Aké riešenie chcete na web?",
    "Vyberte jednu možnosť. V ďalších krokoch ju prispôsobíte svojej firme.",
  ],
  industry: [
    "Čo robí vaša firma?",
    "Poradím vám to, čo sa vo vašom odbore najviac oplatí.",
  ],
  features: [
    "Ktoré doplnkové funkcie chcete?",
    "Bežné odpovede a zber dopytu sú samozrejmosť. Najvhodnejšie doplnky označím vopred.",
  ],
  timeline: [
    "Kedy to chcete mať hotové?",
    "Podľa toho si na vás naplánujem čas.",
  ],
  contact: [
    "Kam vám môžem poslať ďalší krok?",
    "Ozvem sa do jedného pracovného dňa.",
  ],
  priority: [
    "Čo je pre vás najdôležitejšie?",
    "Túto otázku teraz nepoužívam.",
  ],
  volume: [
    "Koľko ľudí sa vás denne pýta?",
    "Túto otázku teraz nepoužívam.",
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
    label: "Chatbot",
    description: "Odpovedá zákazníkom, poradí im a pošle vám pripravený dopyt.",
    icon: "chat",
  },
  {
    id: "calcbot",
    label: "Chatbot s kalkulačkou",
    description: "Vypočíta cenu, spotrebu alebo rozsah podľa vašich pravidiel.",
    icon: "calculator",
  },
  {
    id: "product",
    label: "Chatbot s konfigurátorom",
    description: "Prevedie zákazníka výberom produktu, variantov a doplnkov.",
    icon: "options",
  },
  {
    id: "custom",
    label: "Riešenie na mieru",
    description: "Popíšte, čo vás zdržuje, a navrhnem vhodný postup.",
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
      "Spočíta cenu aj s dopravou",
      "Zákazník pošle fotky ešte pred obhliadkou",
      "Termín si dohodne sám",
    ],
  },
  {
    id: "eshop",
    label: "E-shop a predaj",
    icon: "cart",
    examples: [
      "Ukáže stav objednávky a doručenia",
      "Pomôže zmeniť alebo zrušiť objednávku",
      "Spustí vrátenie tovaru alebo reklamáciu",
    ],
  },
  {
    id: "gastro",
    label: "Reštaurácia a ubytovanie",
    icon: "food",
    examples: [
      "Rezervuje stôl alebo pobyt",
      "Odpovie na otázky aj v noci",
      "Zvládne to aj po anglicky",
    ],
  },
  {
    id: "zdravie",
    label: "Zdravie a krása",
    icon: "heart",
    examples: [
      "Klient si vyberie službu a termín",
      "Dozvie sa, čo si má priniesť",
      "Cenník má hneď pred sebou",
    ],
  },
  {
    id: "vyroba",
    label: "Výroba a veľké zákazky",
    icon: "factory",
    examples: [
      "Zapíše rozmery aj množstvo",
      "Pripraví dopyt pre obchodníka",
      "Uloží kontakt do vašej tabuľky",
    ],
  },
  {
    id: "ine",
    label: "Niečo iné",
    icon: "spark",
    examples: [
      "Otázky nastavíme podľa vás",
      "Zbiera kontakty aj s tým, čo zákazník chce",
      "Zložité veci prepošle vám",
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

/* Odpovedanie na otázky a odoslanie pripraveného dopytu sú súčasťou každého
   riešenia. V tomto kroku preto zobrazujeme iba funkcie navyše. */
export const FEATURES: FeatureOption[] = [
  {
    id: "cena",
    label: "Počítať cenu",
    description: "Podľa rozmerov, množstva alebo vašich pravidiel.",
  },
  {
    id: "varianty",
    label: "Konfigurovať produkt alebo službu",
    description: "Varianty, rozmery, materiál a doplnky.",
  },
  {
    id: "advisor",
    label: "Odporúčať vhodný produkt",
    description: "Vyberie z ponuky podľa potrieb a rozpočtu zákazníka.",
  },
  {
    id: "compare",
    label: "Porovnať produkty alebo varianty",
    description: "Ukáže hlavné rozdiely a pomôže s rozhodnutím.",
  },
  {
    id: "tracking",
    label: "Sledovať objednávku",
    description: "Stav platby, expedície a doručenia.",
  },
  {
    id: "order-change",
    label: "Zmeniť alebo zrušiť objednávku",
    description: "Overí údaje a pripraví požiadavku pre e-shop.",
  },
  {
    id: "returns",
    label: "Riešiť vrátenie a reklamáciu",
    description: "Zozbiera číslo objednávky, dôvod a fotografie.",
  },
  {
    id: "stock-alert",
    label: "Upozorniť na dostupnosť alebo cenu",
    description: "Zákazník dostane správu, keď sa produkt vráti alebo zlacnie.",
  },
  {
    id: "cart-recovery",
    label: "Uložiť rozpracovaný výber",
    description: "Zákazník sa môže vrátiť k výberu bez začínania odznova.",
  },
  {
    id: "rezervacie",
    label: "Rezervovať termíny",
    description: "Konzultáciu alebo službu zapíše do kalendára.",
  },
  {
    id: "fotky",
    label: "Prijímať fotky a prílohy",
    description: "Podklady k odhadu, návrhu alebo reklamácii.",
  },
  {
    id: "payment",
    label: "Poslať platobný odkaz alebo zálohu",
    description: "Po výbere ponúkne bezpečný ďalší krok k objednávke.",
  },
  {
    id: "document",
    label: "Vytvoriť ponuku alebo PDF zhrnutie",
    description: "Z odpovedí pripraví prehľad pre zákazníka aj firmu.",
  },
  {
    id: "handoff",
    label: "Odovzdať rozhovor človeku",
    description: "Kolega dostane celý kontext a zákazník nič neopakuje.",
  },
  {
    id: "tabulka",
    label: "Zapisovať do tabuľky alebo CRM",
    description: "Každý dopyt uloží na správne miesto.",
  },
  {
    id: "jazyky",
    label: "Komunikovať v cudzom jazyku",
    description: "Automaticky použije jazyk zákazníka.",
  },
];

export const RECOMMENDED_FEATURES: Record<InterestId, string[]> = {
  chatbot: ["handoff", "tabulka", "jazyky"],
  calcbot: ["cena", "payment", "document"],
  product: ["varianty", "advisor", "compare"],
  booking: ["rezervacie", "payment", "tabulka"],
  custom: ["handoff", "document", "tabulka"],
};

export const INDUSTRY_RECOMMENDED_FEATURES: Record<string, string[]> = {
  sluzby: ["cena", "rezervacie", "fotky", "payment", "document"],
  eshop: ["advisor", "compare", "tracking", "order-change", "returns", "stock-alert", "cart-recovery"],
  gastro: ["rezervacie", "jazyky", "payment", "handoff"],
  zdravie: ["rezervacie", "payment", "jazyky", "handoff"],
  vyroba: ["varianty", "cena", "document", "fotky", "tabulka"],
  ine: ["handoff", "document", "tabulka", "jazyky"],
};

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
  { id: "asap", label: "Čo najskôr", description: "Začnem, len čo mi pošlete podklady." },
  { id: "mesiac", label: "Do mesiaca", description: "Je čas texty pekne doladiť." },
  { id: "kvartal", label: "Za dva až tri mesiace", description: "Rozdelíme to na menšie kroky." },
  { id: "rozhliadam", label: "Len sa pozerám", description: "Pošlem návrh, rozhodnete sa neskôr." },
];

export const PRESET_TO_INTEREST: Record<AssistantPreset, InterestId> = {
  calculator: "calcbot",
  product: "product",
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
