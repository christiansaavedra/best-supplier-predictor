// Mock data standing in for what supplier connectors would sync (ADR 0009).
// Prices are defined in USD and converted to each supplier's currency.

export const countries = [
  { code: "US", name: "United States" },
  { code: "MX", name: "Mexico" },
  { code: "CO", name: "Colombia" },
  { code: "BR", name: "Brazil" },
  { code: "CL", name: "Chile" },
];

export const usdRates: Record<string, number> = {
  USD: 1,
  MXN: 0.054,
  COP: 0.00024,
  BRL: 0.18,
  CLP: 0.00104,
};

export const users = [
  { name: "Ana Torres", email: "ana@example.com", role: "analyst", countryCode: "CO" },
  { name: "Martín Rojas", email: "martin@example.com", role: "manager", countryCode: "CO" },
  { name: "Sofía Ruiz", email: "sofia@example.com", role: "viewer", countryCode: "US" },
] as const;

// onTimeRate drives the generated delivery history.
export const suppliers = [
  { key: "northstar", name: "NorthStar Distribution", countryCode: "US", currency: "USD", onTimeRate: 0.9 },
  { key: "pacific", name: "Pacific IT Wholesale", countryCode: "US", currency: "USD", onTimeRate: 0.8 },
  { key: "gulf", name: "Gulf Coast Tech Supply", countryCode: "US", currency: "USD", onTimeRate: 0.75 },
  { key: "megabyte", name: "MegaByte Mayoristas", countryCode: "MX", currency: "MXN", onTimeRate: 0.55 },
  { key: "andes", name: "Andes Tech Supply", countryCode: "CO", currency: "COP", onTimeRate: 0.95 },
  { key: "novalink", name: "NovaLink Andina", countryCode: "CO", currency: "COP", onTimeRate: null },
  { key: "paulista", name: "Paulista Componentes", countryCode: "BR", currency: "BRL", onTimeRate: 0.85 },
  { key: "conosur", name: "Cono Sur Distribuidora", countryCode: "CL", currency: "CLP", onTimeRate: 0.88 },
] as const;

export type SupplierKey = (typeof suppliers)[number]["key"];

// No Dell products on purpose: "Dell" requests demonstrate the not-found state.
export const products = [
  { sku: "LEN-T14-G5", brand: "Lenovo", category: "laptop", model: "ThinkPad T14 Gen 5", usd: 1200 },
  { sku: "LEN-X1C-G12", brand: "Lenovo", category: "laptop", model: "ThinkPad X1 Carbon Gen 12", usd: 1750 },
  { sku: "HP-840-G11", brand: "HP", category: "laptop", model: "EliteBook 840 G11", usd: 1350 },
  { sku: "HP-450-G10", brand: "HP", category: "laptop", model: "ProBook 450 G10", usd: 850 },
  { sku: "APL-MBA13-M3", brand: "Apple", category: "laptop", model: "MacBook Air 13 M3", usd: 1100 },
  { sku: "APL-MBP14-M4", brand: "Apple", category: "laptop", model: "MacBook Pro 14 M4", usd: 1700 },
  { sku: "LEN-M70Q-G5", brand: "Lenovo", category: "desktop", model: "ThinkCentre M70q Gen 5", usd: 780 },
  { sku: "HP-E24-G5", brand: "HP", category: "monitor", model: "E24 G5", usd: 190 },
  { sku: "LG-27UP850", brand: "LG", category: "monitor", model: "27UP850-W", usd: 420 },
  { sku: "SAM-S80UD", brand: "Samsung", category: "monitor", model: "ViewFinity S8 27", usd: 380 },
  { sku: "LEN-USBC-DOCK", brand: "Lenovo", category: "dock", model: "ThinkPad Universal USB-C Dock", usd: 220 },
  { sku: "HP-USBC-G5", brand: "HP", category: "dock", model: "USB-C Dock G5", usd: 200 },
  { sku: "LOG-MXKEYS-S", brand: "Logitech", category: "keyboard", model: "MX Keys S", usd: 110 },
  { sku: "LOG-MXM3S", brand: "Logitech", category: "mouse", model: "MX Master 3S", usd: 100 },
  { sku: "JAB-EV2-65", brand: "Jabra", category: "headset", model: "Evolve2 65", usd: 230 },
  { sku: "CIS-MR36", brand: "Cisco", category: "access point", model: "Meraki MR36", usd: 650 },
  { sku: "UBI-U6-PRO", brand: "Ubiquiti", category: "access point", model: "UniFi U6 Pro", usd: 160 },
  { sku: "CIS-C9200-24P", brand: "Cisco", category: "switch", model: "Catalyst 9200-24P", usd: 2400 },
  { sku: "APL-IPH15-128", brand: "Apple", category: "phone", model: "iPhone 15 128GB", usd: 800 },
  { sku: "SAM-S24-128", brand: "Samsung", category: "phone", model: "Galaxy S24 128GB", usd: 750 },
] as const;

export type Sku = (typeof products)[number]["sku"];

export type ScenarioOffer = {
  supplier: SupplierKey;
  usd: number;
  leadTimeDays: number;
  daysSinceUpdate?: number;
};

// Hand-written offers for the demo scenarios. Every other product/country pair gets generated offers.
export const scenarioOffers: { sku: Sku; country: string; offers: ScenarioOffer[]; note: string }[] = [
  {
    sku: "LEN-T14-G5",
    country: "CO",
    note: "Cheapest supplier (MegaByte) loses on track record; new supplier (NovaLink) is kept from the top by smoothing.",
    offers: [
      { supplier: "andes", usd: 1180, leadTimeDays: 7 },
      { supplier: "megabyte", usd: 1160, leadTimeDays: 12 },
      { supplier: "northstar", usd: 1290, leadTimeDays: 10 },
      { supplier: "novalink", usd: 1190, leadTimeDays: 5 },
    ],
  },
  {
    sku: "LEN-USBC-DOCK",
    country: "CO",
    note: "Clear winner (Andes). Pacific is cheapest but its price is 45 days old.",
    offers: [
      { supplier: "andes", usd: 210, leadTimeDays: 5 },
      { supplier: "northstar", usd: 235, leadTimeDays: 9 },
      { supplier: "pacific", usd: 199, leadTimeDays: 14, daysSinceUpdate: 45 },
    ],
  },
  {
    sku: "APL-MBA13-M3",
    country: "CL",
    note: "No offer arrives within a week: late fallback.",
    offers: [
      { supplier: "conosur", usd: 1150, leadTimeDays: 9 },
      { supplier: "northstar", usd: 1120, leadTimeDays: 12 },
      { supplier: "pacific", usd: 1095, leadTimeDays: 16 },
      { supplier: "megabyte", usd: 1080, leadTimeDays: 18 },
    ],
  },
];

// Delivery history only exists where a supplier has shipped before.
// NovaLink is new: a single on-time delivery to Colombia.
export const novalinkHistory = [{ countryCode: "CO", onTime: true }];

export function routeRisk(origin: string, destination: string): number {
  if (origin === destination) return 0.05;
  if (destination === "BR") return 0.45;
  if (destination === "US") return 0.25;
  if (origin === "US") return destination === "MX" ? 0.15 : 0.2;
  return 0.3;
}
