import type { AssistantPreset, InterestId } from "../types/assistant";

export type StepId =
  | "interest"
  | "industry"
  | "channel"
  | "features"
  | "volume"
  | "contact";

export const STEPS: StepId[] = [
  "interest",
  "industry",
  "channel",
  "features",
  "volume",
  "contact",
];

export const QUESTIONS: Record<StepId, [title: string, subtitle: string]> = {
  interest: ["Čo vás zaujíma?", "Vyberte, s čím vám mám pomôcť. Detaily doladíme v ďalších krokoch."],
  industry: ["V akom odvetví podnikáte?", "Podľa odvetvia pripravím vhodné ukážky a tón komunikácie."],
  channel: ["Kde má asistent bežať?", "Vyberte hlavné miesto nasadenia — ďalšie vieme pridať neskôr."],
  features: ["Čo má asistent zvládnuť?", "Označte všetko, čo dáva zmysel. Pokojne viac možností."],
  volume: ["Koľko dopytov mesačne riešite?", "Stačí odhad — pomôže nastaviť kapacitu a cenu."],
  contact: ["Zhrnutie návrhu", "Skontrolujte výber a nechajte mi kontakt — pripravím návrh na mieru."],
};

export type InterestOption = {
  id: InterestId;
  label: string;
  description: string;
  badge?: string;
  icon: "chat" | "calculator" | "calendar" | "spark";
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
    description: "Spočíta orientačnú cenu a premení ju na hotový dopyt.",
    badge: "Najobľúbenejšie",
    icon: "calculator",
  },
  {
    id: "booking",
    label: "Rezervačný asistent",
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
};

export const INDUSTRIES: IndustryOption[] = [
  { id: "sluzby", label: "Služby a remeslá", icon: "tools" },
  { id: "eshop", label: "E-shop a predaj", icon: "cart" },
  { id: "gastro", label: "Gastro a ubytovanie", icon: "food" },
  { id: "zdravie", label: "Zdravie a krása", icon: "heart" },
  { id: "vyroba", label: "Výroba a B2B", icon: "factory" },
  { id: "ine", label: "Iné odvetvie", icon: "spark" },
];

export type ChannelOption = {
  id: string;
  label: string;
  description: string;
};

export const CHANNELS: ChannelOption[] = [
  { id: "web", label: "Na našom webe", description: "Widget doplníme na existujúce stránky." },
  { id: "novy-web", label: "Web ešte len chystáme", description: "Asistent navrhneme spolu s novým webom." },
  { id: "social", label: "Facebook / Instagram", description: "Odpovede v Messengeri a na Instagrame." },
  { id: "whatsapp", label: "WhatsApp", description: "Konverzácie priamo v telefóne zákazníka." },
  { id: "neviem", label: "Neviem, poradíte mi", description: "Odporučím najvhodnejší kanál podľa cieľa." },
];

export type FeatureOption = {
  id: string;
  label: string;
  description: string;
};

export const FEATURES: FeatureOption[] = [
  { id: "faq", label: "Odpovedať na časté otázky", description: "Ceny, otváracie hodiny, postupy…" },
  { id: "dopyty", label: "Zbierať dopyty a kontakty", description: "Použiteľné podklady ešte pred telefonátom." },
  { id: "cena", label: "Počítať orientačné ceny", description: "Kalkulačka podľa vašich parametrov." },
  { id: "rezervacie", label: "Rezervovať termíny", description: "Prepojenie na kalendár a pripomienky." },
  { id: "email", label: "Posielať zhrnutia e-mailom", description: "Vám aj zákazníkovi, automaticky." },
  { id: "crm", label: "Zapisovať do CRM / tabuľky", description: "Každý dopyt na svojom mieste." },
];

/* Predvolené funkcie podľa vybraného záujmu — dajú sa upraviť. */
export const RECOMMENDED_FEATURES: Record<InterestId, string[]> = {
  chatbot: ["faq", "dopyty"],
  calcbot: ["cena", "dopyty", "email"],
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
