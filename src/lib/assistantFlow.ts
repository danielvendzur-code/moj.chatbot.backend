import type { AssistantPreset, InterestId } from "../types/assistant";
import type { WidgetIconName } from "../components/widget/WidgetIcon";

export type StepId =
  | "interest"
  | "features"
  | "details"
  | "industry"
  | "priority"
  | "volume"
  | "timeline"
  | "contact";

export const STEPS: StepId[] = [
  "interest",
  "features",
  "details",
  "industry",
  "timeline",
  "contact",
];

export const QUESTION_STEPS: StepId[] = STEPS.filter((id) => id !== "contact");

export const QUESTIONS: Record<StepId, [title: string, subtitle: string]> = {
  interest: [
    "Čo chcete pridať na web?",
    "Vyberte Chatbot, Kalkulačku, Konfigurátor alebo Kombinované riešenie. Potom pokračujete doplnkami.",
  ],
  features: [
    "Ktoré doplnkové funkcie chcete?",
    "Sú voliteľné. Vyberte pokojne viac možností alebo pokračujte bez nich.",
  ],
  details: [
    "Čo konkrétne má riešenie riešiť?",
    "Teraz nastavte, s čím má vybraný nástroj pracovať. Môžete vybrať viac možností.",
  ],
  industry: [
    "Čo robí vaša firma?",
    "Vyberte odvetvie, aby som vedel návrh lepšie prispôsobiť vašej ponuke.",
  ],
  timeline: [
    "Kedy to chcete mať hotové?",
    "Vyberte približný termín.",
  ],
  /* The old heading asked the visitor to pay with their contact details for
     something vague they could not picture. This names what they get instead,
     and says out loud that it costs nothing. */
  contact: [
    "Váš návrh je pripravený",
    "Pošlem vám rozsah aj cenu do 24 hodín. Nezáväzne a bez registrácie.",
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
    badge: "Samostatne",
    description: "Odpovedá, radí a zbiera pripravené dopyty.",
    icon: "chat",
  },
  {
    id: "calculator",
    label: "Kalkulačka",
    badge: "Samostatne",
    description: "Počíta cenu, spotrebu alebo rozsah podľa vašich pravidiel.",
    icon: "calculator",
  },
  {
    id: "configurator",
    label: "Konfigurátor",
    badge: "Samostatne",
    description: "Prevedie výberom variantov, rozmerov, farieb a doplnkov.",
    icon: "options",
  },
  {
    id: "calcbot",
    label: "Kombinované riešenie",
    badge: "Spojené",
    description: "Spojí chatbot, kalkulačku a/alebo konfigurátor do jedného riešenia.",
    icon: "spark",
  },
  {
    id: "product",
    label: "Chatbot + konfigurátor",
    badge: "Spojené",
    description: "Vysvetlí možnosti a prevedie zákazníka celým výberom.",
    icon: "options",
  },
  {
    id: "custom",
    label: "Riešenie na mieru",
    badge: "Na mieru",
    description: "Spojíme funkcie do jedného procesu podľa vašej firmy.",
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

export const FEATURES: FeatureOption[] = [
  {
    id: "answers",
    label: "Odpovedať na otázky zákazníkov",
    description: "Ponuka, dostupnosť, doprava, služby a bežné otázky priamo na webe.",
  },
  {
    id: "leads",
    label: "Zbierať dopyty a kontakty",
    description: "Zistí, čo zákazník potrebuje, a odošle firme pripravený kontakt.",
  },
  {
    id: "cena",
    label: "Počítať orientačnú cenu",
    description: "Podľa rozmerov, množstva, variantu alebo vašich pravidiel.",
  },
  {
    id: "calc-dimensions",
    label: "Počítať podľa rozmerov",
    description: "Dĺžka, šírka, plocha, objem alebo iné rozmery.",
  },
  {
    id: "calc-quantity",
    label: "Počítať podľa množstva",
    description: "Kusy, metre, balenia alebo iné množstvo.",
  },
  {
    id: "calc-variant",
    label: "Počítať podľa typu alebo modelu",
    description: "Cena sa mení podľa zvoleného produktu, variantu alebo služby.",
  },
  {
    id: "calc-extras",
    label: "Pripočítať montáž, dopravu a doplnky",
    description: "Do výsledku zahrnie voliteľné položky a príplatky.",
  },
  {
    id: "varianty",
    label: "Skladať variant produktu alebo služby",
    description: "Prevedie zákazníka jednotlivými voľbami v správnom poradí.",
  },
  {
    id: "dimensions",
    label: "Vyberať rozmery a množstvo",
    description: "Rozmery, počet kusov alebo rozsah zákazky.",
  },
  {
    id: "materials",
    label: "Vyberať farby a materiály",
    description: "Zobrazí iba reálne dostupné farby, povrchy a materiály.",
  },
  {
    id: "addons",
    label: "Vyberať doplnky a príslušenstvo",
    description: "Voliteľné prvky pridá k hlavnej zostave prehľadne na jednom mieste.",
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
    description: "Upozorní zákazníka, keď sa produkt vráti alebo zlacnie.",
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

/* Krok 2 obsahuje iba doplnkové funkcie k zvolenému nástroju. Jadro nástroja
   sa pýta až v nasledujúcom kroku cez DETAILS. */
export const FEATURE_IDS_BY_INTEREST: Record<InterestId, string[]> = {
  chatbot: [
    "advisor",
    "leads",
    "tracking",
    "order-change",
    "returns",
    "rezervacie",
    "handoff",
    "jazyky",
    "stock-alert",
  ],
  calculator: ["document", "fotky", "tabulka", "payment"],
  configurator: [
    "cena",
    "compare",
    "fotky",
    "document",
    "tabulka",
    "cart-recovery",
    "payment",
  ],
  calcbot: [
    "advisor",
    "leads",
    "document",
    "payment",
    "fotky",
    "tabulka",
    "rezervacie",
    "handoff",
  ],
  product: [
    "advisor",
    "compare",
    "stock-alert",
    "cart-recovery",
    "document",
    "tabulka",
    "payment",
  ],
  booking: ["payment", "jazyky", "tabulka", "handoff", "document"],
  custom: ["leads", "handoff", "document", "tabulka", "jazyky", "fotky", "rezervacie", "payment"],
};

export type DetailOption = {
  id: string;
  label: string;
  description: string;
};

export const DETAILS: DetailOption[] = [
  {
    id: "chat-offer",
    label: "Ponuka a služby",
    description: "Čo ponúkate, čo jednotlivé služby zahŕňajú a pre koho sú.",
  },
  {
    id: "chat-pricing",
    label: "Ceny a cenník",
    description: "Ceny, balíky, príplatky a podmienky vašej ponuky.",
  },
  {
    id: "chat-availability",
    label: "Dostupnosť a termíny",
    description: "Kedy je služba alebo produkt dostupný a aké sú možnosti termínu.",
  },
  {
    id: "chat-orders",
    label: "Objednávky a doprava",
    description: "Objednanie, doručenie, stav a bežné otázky po nákupe.",
  },
  {
    id: "chat-custom",
    label: "Vlastné otázky",
    description: "Konkrétne témy a odpovede podľa vašej firmy.",
  },
  {
    id: "calc-price",
    label: "Cena",
    description: "Orientačná alebo výsledná cena podľa vašich pravidiel.",
  },
  {
    id: "calc-dimensions-detail",
    label: "Rozmery, plocha alebo objem",
    description: "Dĺžka, šírka, výška, plocha, objem alebo iné rozmery.",
  },
  {
    id: "calc-quantity-detail",
    label: "Množstvo",
    description: "Kusy, metre, balenia alebo iná jednotka množstva.",
  },
  {
    id: "calc-variant-detail",
    label: "Typ alebo model",
    description: "Výsledok sa mení podľa produktu, variantu alebo druhu služby.",
  },
  {
    id: "calc-extras-detail",
    label: "Montáž, doprava a príplatky",
    description: "Voliteľné položky, doprava, montáž a ďalšie pravidlá výsledku.",
  },
  {
    id: "config-variant",
    label: "Variant alebo model",
    description: "Zákazník vyberá typ produktu, služby alebo zostavy.",
  },
  {
    id: "config-dimensions",
    label: "Rozmery a množstvo",
    description: "Rozmery, počet kusov alebo rozsah zákazky.",
  },
  {
    id: "config-materials",
    label: "Farby a materiály",
    description: "Farby, povrchy, materiály a ďalšie vizuálne varianty.",
  },
  {
    id: "config-addons",
    label: "Doplnky a príslušenstvo",
    description: "Voliteľné prvky, ktoré sa pridávajú k hlavnej konfigurácii.",
  },
];

export const DETAIL_IDS_BY_INTEREST: Record<InterestId, string[]> = {
  chatbot: [
    "chat-offer",
    "chat-pricing",
    "chat-availability",
    "chat-orders",
    "chat-custom",
  ],
  calculator: [
    "calc-price",
    "calc-dimensions-detail",
    "calc-quantity-detail",
    "calc-variant-detail",
    "calc-extras-detail",
  ],
  configurator: [
    "config-variant",
    "config-dimensions",
    "config-materials",
    "config-addons",
  ],
  calcbot: [
    "chat-offer",
    "chat-pricing",
    "chat-availability",
    "chat-orders",
    "chat-custom",
    "calc-price",
    "calc-dimensions-detail",
    "calc-quantity-detail",
    "calc-variant-detail",
    "calc-extras-detail",
    "config-variant",
    "config-dimensions",
    "config-materials",
    "config-addons",
  ],
  product: [
    "chat-offer",
    "chat-pricing",
    "config-variant",
    "config-dimensions",
    "config-materials",
    "config-addons",
  ],
  booking: ["chat-availability", "chat-offer", "chat-custom"],
  custom: [
    "chat-offer",
    "chat-pricing",
    "chat-availability",
    "chat-orders",
    "chat-custom",
    "calc-price",
    "calc-dimensions-detail",
    "calc-quantity-detail",
    "calc-variant-detail",
    "calc-extras-detail",
    "config-variant",
    "config-dimensions",
    "config-materials",
    "config-addons",
  ],
};

export const RECOMMENDED_FEATURES: Record<InterestId, string[]> = {
  chatbot: [],
  calculator: [],
  configurator: [],
  calcbot: [],
  product: [],
  booking: [],
  custom: [],
};

export const INDUSTRY_RECOMMENDED_FEATURES: Record<string, string[]> = {
  sluzby: ["rezervacie", "fotky", "payment", "document"],
  eshop: ["advisor", "tracking", "order-change", "returns", "stock-alert", "cart-recovery"],
  gastro: ["rezervacie", "jazyky", "payment", "handoff"],
  zdravie: ["rezervacie", "payment", "jazyky", "handoff"],
  vyroba: ["document", "fotky", "tabulka", "compare"],
  ine: ["leads", "handoff", "document", "tabulka", "jazyky"],
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
  { id: "mesiac", label: "Do mesiaca", description: "Máme priestor všetko doladiť." },
  { id: "kvartal", label: "Za dva až tri mesiace", description: "Rozdelíme to na menšie kroky." },
  { id: "rozhliadam", label: "Len sa pozerám", description: "Najprv si chcete ujasniť možnosti." },
];

export const PRESET_TO_INTEREST: Record<AssistantPreset, InterestId> = {
  calculator: "calculator",
  product: "configurator",
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
