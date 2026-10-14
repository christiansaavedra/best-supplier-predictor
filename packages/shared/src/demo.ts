// Demo requests shown in the UI panel. The mock LLM recognizes exactly these texts.
export const DEMO_SCENARIOS = [
  {
    id: "bogota",
    title: "Laptops and docks to Bogotá",
    text: "Customer needs 50 Lenovo ThinkPad T14 and 50 Lenovo USB-C docks delivered to Bogotá within a month.",
    lookFor: [
      "T14: MegaByte is cheapest but ranks below Andes because of its delivery record.",
      "T14: NovaLink is new (1 of 1 on time); smoothing keeps it from the top.",
      "Docks: Andes is the clear winner; Pacific is cheaper but its price is 45 days old.",
    ],
  },
  {
    id: "santiago",
    title: "MacBooks to Santiago, urgent",
    text: "We need 20 MacBook Air M3 in Santiago, Chile within a week.",
    lookFor: ["No supplier can deliver in time: the fastest offers are shown, flagged as late."],
  },
  {
    id: "cdmx",
    title: "ThinkPads and Dell laptops to Mexico City",
    text: "Please quote 15 ThinkPads and 15 Dell Latitude 5450 laptops for our Mexico City office, needed in two weeks.",
    lookFor: [
      "ThinkPads: matches more than one model, so the analyst picks.",
      "Dell: not in the catalog, shown as not found.",
    ],
  },
] as const;

export type DemoScenarioId = (typeof DEMO_SCENARIOS)[number]["id"];
