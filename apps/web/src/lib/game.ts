export type Employee = {
  id: string;
  level: "worker" | "manager";
  name: string;
  role: string;
  salary: number;
  benefits: number;
  formerVenture?: string;
};

export type Venture = {
  id: string;
  name: string;
  icon: string;
  action: string;
  category: "operations" | "annotation";
  baseCost: number;
  baseRevenue: number;
  cycleMs: number;
  managerCost: number;
  owned: number;
  progress: number;
  automated: boolean;
  manager?: Employee;
  employees: Employee[];
  lastPayout?: number;
};

export type Upgrade = {
  id: string;
  name: string;
  description: string;
  cost: number;
  ventureId?: string;
  category?: Venture["category"];
  multiplier: number;
  purchased: boolean;
};

export type LayoffProgram = {
  id: string;
  name: string;
  description: string;
  requiredCapacity: number;
  employeeTarget: number;
  multiplier: number;
};

export type LifestyleInterest =
  | "cars"
  | "homes"
  | "yachts"
  | "fashion"
  | "pets"
  | "space"
  | "art"
  | "planes"
  | "travel"
  | "jewelry";
export type LifestyleAssetCategory = "cars" | "houses" | "boats" | "jewelry" | "trips" | "planes";

export type WifeChoice = {
  id: string;
  name: string;
  materialism: number;
  minLifetimeProfit: number;
  interests: LifestyleInterest[];
  description: string;
};

export type LifestyleAsset = {
  id: string;
  name: string;
  category: LifestyleAssetCategory;
  interest: LifestyleInterest;
  cost: number;
  pressureRelief: number;
};

export type GameState = {
  cash: number;
  lifetimeEarnings: number;
  prestige: number;
  totalPrestigeEarned: number;
  ventures: Venture[];
  unemployed: Employee[];
  upgrades: Upgrade[];
  purchasedLayoffProgramIds: string[];
  selectedWifeId: string | null;
  datingWifeId: string | null;
  refusedWifeIds: string[];
  ownedLifestyleAssetIds: string[];
  lastSavedAt: number;
};

export const SAVE_KEY = "zusk-ceo-save";
export const LEGACY_SAVE_KEYS = [
  "zusk-ceo-save-v4",
  "zusk-ceo-save-v5",
  "zusk-ceo-save-v6"
] as const;

const employeeNames = [
  "Avery Park",
  "Samira Cole",
  "Jon Bell",
  "Priya Nair",
  "Mateo Cruz",
  "Elena Brooks",
  "Theo Shaw",
  "Nina Patel",
  "Owen Blake",
  "Mara Singh",
  "Cal Lee",
  "Iris Morgan",
  "Dante Rivera",
  "June Foster",
  "Nolan Price",
  "Tessa Kim",
  "Rafi Stone",
  "Mina Vale",
  "Cole Bennett",
  "Leah Quinn",
  "Eli Hart",
  "Sofia Reed",
  "Noah Finch",
  "Amara West"
];

const rolesByCategory: Record<Venture["category"], string[]> = {
  annotation: ["AI Rater", "Fact Checker", "Prompt Evaluator", "Data QA"],
  operations: ["ML Engineer", "Ops Analyst", "Launch Specialist", "QA Analyst"]
};

const managerRolesByCategory: Record<Venture["category"], string> = {
  annotation: "Annotation Operations Manager",
  operations: "Automation Program Manager"
};

const WORKER_BENEFITS_RATE = 0.22;
const MANAGER_BENEFITS_RATE = 0.28;

/**
 * Creates a worker for a venture using category-specific roles and profitable compensation.
 *
 * @param venture - The venture receiving the new worker.
 * @param index - The worker index used for stable naming, role rotation, and pay growth.
 * @returns A worker employee with salary and benefits rounded to cents.
 */
export function createEmployee(venture: Pick<Venture, "id" | "category" | "baseRevenue">, index: number): Employee {
  const roleList = rolesByCategory[venture.category];
  const salary = roundMoney(Math.max(0.75, venture.baseRevenue * 0.14 * Math.pow(1.015, index)));

  return {
    id: `${venture.id}-employee-${index}`,
    level: "worker",
    name: employeeNames[index % employeeNames.length],
    role: roleList[index % roleList.length],
    salary,
    benefits: roundMoney(salary * WORKER_BENEFITS_RATE)
  };
}

/**
 * Creates the automation manager for a venture.
 *
 * @param venture - The venture being automated.
 * @returns A manager employee with category-specific title and manager benefit rate.
 */
export function createManager(venture: Pick<Venture, "id" | "category" | "baseRevenue" | "owned">): Employee {
  const salary = roundMoney(Math.max(3, venture.baseRevenue * Math.max(venture.owned, 1) * 0.34));

  return {
    id: `${venture.id}-manager`,
    level: "manager",
    name: employeeNames[(venture.id.length + venture.owned) % employeeNames.length],
    role: managerRolesByCategory[venture.category],
    salary,
    benefits: roundMoney(salary * MANAGER_BENEFITS_RATE)
  };
}

export const initialVentures: Venture[] = [
  {
    id: "content-labeling",
    name: "Compare and Rate 2 Models - Shopping",
    icon: "CL",
    action: "Compare",
    category: "annotation",
    baseCost: 4,
    baseRevenue: 2.5,
    cycleMs: 650,
    managerCost: 120,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "safety-ratings",
    name: "Fact Check 2 Models",
    icon: "SR",
    action: "Verify",
    category: "annotation",
    baseCost: 55,
    baseRevenue: 12,
    cycleMs: 1400,
    managerCost: 850,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "rlhf",
    name: "Advanced Image Generation Review",
    icon: "PD",
    action: "Review",
    category: "annotation",
    baseCost: 700,
    baseRevenue: 140,
    cycleMs: 3000,
    managerCost: 7800,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "image-captions",
    name: "Prompt Response Helpfulness Rating",
    icon: "IC",
    action: "Rate",
    category: "annotation",
    baseCost: 8500,
    baseRevenue: 1850,
    cycleMs: 5600,
    managerCost: 62000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "meeting-transcripts",
    name: "Multi-Turn Chat Quality Audit",
    icon: "TC",
    action: "Audit",
    category: "annotation",
    baseCost: 92000,
    baseRevenue: 23500,
    cycleMs: 9200,
    managerCost: 430000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "code-review",
    name: "Code Answer Correctness Review",
    icon: "CR",
    action: "Test",
    category: "annotation",
    baseCost: 780000,
    baseRevenue: 245000,
    cycleMs: 15500,
    managerCost: 3100000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "legal-redlines",
    name: "Policy Violation Edge Case Review",
    icon: "LR",
    action: "Judge",
    category: "annotation",
    baseCost: 6500000,
    baseRevenue: 2400000,
    cycleMs: 26000,
    managerCost: 22000000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "executive-alignment",
    name: "Expert Domain Evaluation Queue",
    icon: "EA",
    action: "Evaluate",
    category: "annotation",
    baseCost: 52000000,
    baseRevenue: 22000000,
    cycleMs: 42000,
    managerCost: 190000000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "model",
    name: "ZuskChat LLM",
    icon: "ZC",
    action: "Release",
    category: "operations",
    baseCost: 8,
    baseRevenue: 20,
    cycleMs: 1600,
    managerCost: 160,
    owned: 1,
    progress: 0,
    automated: false,
    employees: [createEmployee({ id: "model", category: "operations", baseRevenue: 20 }, 0)]
  },
  {
    id: "eval-suite",
    name: "ZuskCode Assistant",
    icon: "ZK",
    action: "Ship",
    category: "operations",
    baseCost: 85,
    baseRevenue: 32,
    cycleMs: 1700,
    managerCost: 1300,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "layoffs",
    name: "ZuskAgent SDK",
    icon: "ZA",
    action: "Deploy",
    category: "operations",
    baseCost: 950,
    baseRevenue: 220,
    cycleMs: 3600,
    managerCost: 10500,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "agent-rollout",
    name: "ZuskOffice Copilot",
    icon: "MA",
    action: "Roll out",
    category: "operations",
    baseCost: 68000,
    baseRevenue: 16000,
    cycleMs: 9200,
    managerCost: 340000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "datacenter",
    name: "Zusk Compute Cathedral",
    icon: "DC",
    action: "Build",
    category: "operations",
    baseCost: 160000,
    baseRevenue: 47000,
    cycleMs: 13000,
    managerCost: 720000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "robot-campus",
    name: "Humanoid Office Campus",
    icon: "HC",
    action: "Staff",
    category: "operations",
    baseCost: 920000,
    baseRevenue: 310000,
    cycleMs: 17000,
    managerCost: 4200000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "enterprise",
    name: "Enterprise Zusk License",
    icon: "EZ",
    action: "Close",
    category: "operations",
    baseCost: 1800000,
    baseRevenue: 620000,
    cycleMs: 24000,
    managerCost: 6800000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "government-contract",
    name: "Government Zusk Mandate",
    icon: "GM",
    action: "Lobby",
    category: "operations",
    baseCost: 16000000,
    baseRevenue: 6200000,
    cycleMs: 33000,
    managerCost: 70000000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  },
  {
    id: "planetary-platform",
    name: "Planetary Zusk Platform",
    icon: "PZ",
    action: "Monopolize",
    category: "operations",
    baseCost: 180000000,
    baseRevenue: 85000000,
    cycleMs: 52000,
    managerCost: 820000000,
    owned: 0,
    progress: 0,
    automated: false,
    employees: []
  }
];

export const initialUpgrades: Upgrade[] = [
  {
    id: "labeling-boost",
    name: "Shopping Task Speedrun",
    description: "Compare and Rate 2 Models - Shopping profit x3",
    cost: 500,
    ventureId: "content-labeling",
    multiplier: 3,
    purchased: false
  },
  {
    id: "safety-boost",
    name: "Source Citation Templates",
    description: "Fact Check 2 Models profit x3",
    cost: 4200,
    ventureId: "safety-ratings",
    multiplier: 3,
    purchased: false
  },
  {
    id: "rlhf-boost",
    name: "Aesthetic Preference Rubric",
    description: "Advanced Image Generation Review profit x4",
    cost: 36000,
    ventureId: "rlhf",
    multiplier: 4,
    purchased: false
  },
  {
    id: "annotation-global",
    name: "Mandatory Reskilling Portal",
    description: "All data annotation jobs profit x2",
    cost: 95000,
    category: "annotation",
    multiplier: 2,
    purchased: false
  },
  {
    id: "annotation-late",
    name: "Global Annotation Mandate",
    description: "Advanced data annotation jobs profit x5",
    cost: 12500000,
    category: "annotation",
    multiplier: 5,
    purchased: false
  },
  {
    id: "model-boost",
    name: "Zusk Synthetic Persona",
    description: "ZuskChat LLM profit x3",
    cost: 5000,
    ventureId: "model",
    multiplier: 3,
    purchased: false
  },
  {
    id: "layoffs-boost",
    name: "Org Chart Shredder",
    description: "ZuskAgent SDK profit x4",
    cost: 45000,
    ventureId: "layoffs",
    multiplier: 4,
    purchased: false
  },
  {
    id: "global-boost",
    name: "Marlon's Genius Memo",
    description: "All Zusk revenue x2",
    cost: 180000,
    multiplier: 2,
    purchased: false
  },
  {
    id: "infrastructure-boost",
    name: "GPU Vanity Megacluster",
    description: "Compute Cathedral and Enterprise Zusk License profit x5",
    cost: 1500000,
    ventureId: "datacenter",
    multiplier: 5,
    purchased: false
  },
  {
    id: "zusk-late",
    name: "Singular Founder Mode",
    description: "Train Zusk Model ventures profit x6",
    cost: 90000000,
    category: "operations",
    multiplier: 6,
    purchased: false
  }
];

export const layoffPrograms: LayoffProgram[] = [
  {
    id: "support-triage-reduction",
    name: "Support Triage Reduction",
    description: "Use ZuskChat capacity to eliminate repetitive support queues. Operations revenue x1.35.",
    requiredCapacity: 35,
    employeeTarget: 2,
    multiplier: 1.35
  },
  {
    id: "junior-code-freeze",
    name: "Junior Code Freeze",
    description: "Freeze entry-level engineering hiring after ZuskCode clears code review. Operations revenue x1.55.",
    requiredCapacity: 145,
    employeeTarget: 4,
    multiplier: 1.55
  },
  {
    id: "middle-management-compression",
    name: "Middle Management Compression",
    description: "Replace weekly status rituals with automated Zusk reports. Operations revenue x1.8.",
    requiredCapacity: 520,
    employeeTarget: 7,
    multiplier: 1.8
  },
  {
    id: "enterprise-services-collapse",
    name: "Enterprise Services Collapse",
    description: "Bundle deployment, onboarding, and account work into ZuskAgent. Operations revenue x2.15.",
    requiredCapacity: 2100,
    employeeTarget: 12,
    multiplier: 2.15
  },
  {
    id: "global-workforce-reset",
    name: "Global Workforce Reset",
    description: "Use mature Zusk capacity to strip the org down to model, compute, and contracts. Operations revenue x2.75.",
    requiredCapacity: 9200,
    employeeTarget: 24,
    multiplier: 2.75
  }
];

export const wifeChoices: WifeChoice[] = [
  {
    id: "ava",
    name: "Ava Sterling",
    materialism: 2,
    minLifetimeProfit: 250,
    interests: ["art", "pets"],
    description: "Low drama, but expects tasteful status signals and a visibly adored dog."
  },
  {
    id: "mira",
    name: "Mira Keene",
    materialism: 3,
    minLifetimeProfit: 1200,
    interests: ["travel", "art"],
    description: "Prefers tasteful escapes, gallery weekends, and proof Marlon can leave the office."
  },
  {
    id: "sloane",
    name: "Sloane Mercer",
    materialism: 4,
    minLifetimeProfit: 2800,
    interests: ["cars", "fashion"],
    description: "Likes fast launches, faster cars, and a wardrobe that photographs well."
  },
  {
    id: "bianca",
    name: "Bianca Vale",
    materialism: 5,
    minLifetimeProfit: 5000,
    interests: ["fashion", "cars", "homes"],
    description: "Brand-forward and image-aware. She wants Marlon photographed near expensive things."
  },
  {
    id: "isla",
    name: "Isla Cross",
    materialism: 6,
    minLifetimeProfit: 28000,
    interests: ["homes", "art", "travel"],
    description: "Wants culture, real estate, and vacations that look effortless but cost plenty."
  },
  {
    id: "valentina",
    name: "Valentina Lux",
    materialism: 7,
    minLifetimeProfit: 90000,
    interests: ["jewelry", "cars", "fashion"],
    description: "Treats every relationship milestone like a product launch with a gift bag."
  },
  {
    id: "celeste",
    name: "Celeste Monaco",
    materialism: 8,
    minLifetimeProfit: 250000,
    interests: ["yachts", "homes", "fashion"],
    description: "Luxury is the baseline. Anything less than waterfront excess creates pressure."
  },
  {
    id: "portia",
    name: "Portia Wren",
    materialism: 8,
    minLifetimeProfit: 750000,
    interests: ["planes", "homes", "art"],
    description: "Measures commitment in flight hours, private collections, and architectural square footage."
  },
  {
    id: "seraphina",
    name: "Seraphina Quill",
    materialism: 9,
    minLifetimeProfit: 1800000,
    interests: ["yachts", "jewelry", "travel"],
    description: "Expects a calendar of islands, auctions, and gifts with security guards nearby."
  },
  {
    id: "nova",
    name: "Nova Starling",
    materialism: 10,
    minLifetimeProfit: 5000000,
    interests: ["space", "yachts", "cars"],
    description: "Only impressed by absurd founder mythology: rockets, hypercars, and floating palaces."
  },
  {
    id: "athena",
    name: "Athena Voss",
    materialism: 11,
    minLifetimeProfit: 25000000,
    interests: ["space", "planes", "homes"],
    description: "Wants the mythology package: private aviation, bunker estates, and orbital headlines."
  },
  {
    id: "victoria",
    name: "Victoria Chrome",
    materialism: 12,
    minLifetimeProfit: 125000000,
    interests: ["space", "yachts", "jewelry"],
    description: "Only accepts dynasty-level spending and assets that make finance reporters whisper."
  }
];

export const lifestyleAssets: LifestyleAsset[] = [
  { id: "used-roadster", name: "Used Electric Roadster", category: "cars", interest: "cars", cost: 18000, pressureRelief: 1 },
  { id: "founder-sedan", name: "Founder Edition Sedan", category: "cars", interest: "cars", cost: 42000, pressureRelief: 2 },
  { id: "electric-supercar", name: "Electric Supercar", category: "cars", interest: "cars", cost: 85000, pressureRelief: 4 },
  { id: "armored-suv", name: "Armored Security SUV", category: "cars", interest: "cars", cost: 210000, pressureRelief: 5 },
  { id: "prototype-hypercar", name: "Prototype Hypercar", category: "cars", interest: "cars", cost: 2200000, pressureRelief: 8 },
  { id: "downtown-loft", name: "Downtown Loft", category: "houses", interest: "homes", cost: 450000, pressureRelief: 2 },
  { id: "hillside-house", name: "Hillside Smart House", category: "houses", interest: "homes", cost: 950000, pressureRelief: 4 },
  { id: "glass-mansion", name: "Glass Hillside Mansion", category: "houses", interest: "homes", cost: 1800000, pressureRelief: 6 },
  { id: "lake-compound", name: "Lake Compound", category: "houses", interest: "homes", cost: 6500000, pressureRelief: 8 },
  { id: "bunker-estate", name: "Bunker Estate", category: "houses", interest: "homes", cost: 42000000, pressureRelief: 11 },
  { id: "weekend-sailboat", name: "Weekend Sailboat", category: "boats", interest: "yachts", cost: 140000, pressureRelief: 2 },
  { id: "party-catamaran", name: "Party Catamaran", category: "boats", interest: "yachts", cost: 750000, pressureRelief: 4 },
  { id: "founder-yacht", name: "Founder Yacht", category: "boats", interest: "yachts", cost: 12000000, pressureRelief: 7 },
  { id: "mega-yacht", name: "Mega Yacht", category: "boats", interest: "yachts", cost: 88000000, pressureRelief: 12 },
  { id: "private-submarine", name: "Private Submarine Tender", category: "boats", interest: "yachts", cost: 160000000, pressureRelief: 15 },
  { id: "tennis-bracelet", name: "Tennis Bracelet", category: "jewelry", interest: "fashion", cost: 9000, pressureRelief: 2 },
  { id: "diamond-collar", name: "Diamond Dog Collar", category: "jewelry", interest: "pets", cost: 1200, pressureRelief: 2 },
  { id: "gallery-necklace", name: "Gallery Opening Necklace", category: "jewelry", interest: "art", cost: 5000, pressureRelief: 3 },
  { id: "designer-wardrobe", name: "Designer Wardrobe Retainer", category: "jewelry", interest: "fashion", cost: 750, pressureRelief: 2 },
  { id: "red-carpet-diamonds", name: "Red Carpet Diamonds", category: "jewelry", interest: "jewelry", cost: 450000, pressureRelief: 6 },
  { id: "auction-tiara", name: "Auction House Tiara", category: "jewelry", interest: "jewelry", cost: 7000000, pressureRelief: 10 },
  { id: "spa-weekend", name: "Napa Spa Weekend", category: "trips", interest: "travel", cost: 8000, pressureRelief: 2 },
  { id: "fashion-week", name: "Fashion Week Circuit", category: "trips", interest: "fashion", cost: 75000, pressureRelief: 4 },
  { id: "private-island-week", name: "Private Island Week", category: "trips", interest: "travel", cost: 900000, pressureRelief: 7 },
  { id: "orbital-honeymoon", name: "Orbital Honeymoon Package", category: "trips", interest: "space", cost: 90000000, pressureRelief: 9 },
  { id: "fractional-jet", name: "Fractional Jet Share", category: "planes", interest: "planes", cost: 6000000, pressureRelief: 5 },
  { id: "private-jet", name: "Private Jet Membership", category: "planes", interest: "space", cost: 24000000, pressureRelief: 6 }
  ,
  { id: "gulfstream", name: "Founder Gulfstream", category: "planes", interest: "planes", cost: 76000000, pressureRelief: 10 },
  { id: "supersonic-concept", name: "Supersonic Concept Jet", category: "planes", interest: "space", cost: 250000000, pressureRelief: 16 }
];

/**
 * Builds a fresh game state for a new save or reset.
 *
 * @returns The default game state with cloned venture and upgrade definitions.
 */
export function createInitialState(): GameState {
  return {
    cash: 6,
    lifetimeEarnings: 0,
    prestige: 0,
    totalPrestigeEarned: 0,
    ventures: structuredClone(initialVentures),
    unemployed: [],
    upgrades: structuredClone(initialUpgrades),
    purchasedLayoffProgramIds: [],
    selectedWifeId: null,
    datingWifeId: null,
    refusedWifeIds: [],
    ownedLifestyleAssetIds: [],
    lastSavedAt: Date.now()
  };
}

/**
 * Formats a numeric value as in-game currency with cents and compact large units.
 *
 * @param value - The amount of money to display.
 * @returns A dollar-formatted string suitable for UI labels.
 */
export function formatMoney(value: number): string {
  if (value < 0) return `-${formatMoney(Math.abs(value))}`;
  if (value < 1000) return `$${value.toFixed(2)}`;

  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx"];
  let scaled = value;
  let unitIndex = -1;

  while (scaled >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }

  return `$${scaled.toFixed(scaled < 10 ? 2 : 1)}${units[unitIndex]}`;
}

/**
 * Calculates the purchase cost for one or more venture expansions.
 *
 * @param venture - The venture being expanded.
 * @param quantity - Number of expansion levels to price.
 * @returns The total cost for the requested quantity.
 */
export function ventureCost(venture: Venture, quantity = 1): number {
  let total = 0;
  for (let i = 0; i < quantity; i += 1) {
    total += venture.baseCost * Math.pow(1.28, venture.owned + i);
  }
  return total;
}

/**
 * Computes the active revenue multiplier for a venture from prestige and purchased upgrades.
 *
 * @param state - The current game state.
 * @param ventureId - The venture receiving the multiplier.
 * @returns The multiplicative boost applied to gross revenue.
 */
export function multiplierFor(state: GameState, ventureId: string): number {
  const prestigeBoost = 1 + state.prestige * 0.02;
  const venture = state.ventures.find((item) => item.id === ventureId);

  // Upgrades can target one venture, a whole category, or all ventures when neither target is set.
  // Multipliers stack multiplicatively with prestige.
  return state.upgrades.reduce((total, upgrade) => {
    if (!upgrade.purchased) return total;
    if (upgrade.category && venture?.category === upgrade.category) {
      return total * upgrade.multiplier;
    }
    if (!upgrade.ventureId || upgrade.ventureId === ventureId) {
      return total * upgrade.multiplier;
    }
    if (upgrade.id === "infrastructure-boost" && ventureId === "enterprise") {
      return total * upgrade.multiplier;
    }
    return total;
  }, prestigeBoost);
}

/**
 * Calculates Zusk's current replacement capacity from owned model-training ventures.
 *
 * @param state - The current game state.
 * @returns A compact capacity score used to unlock manual layoff programs.
 */
export function zuskCapacity(state: GameState): number {
  return state.ventures.reduce((total, venture) => {
    if (venture.category !== "operations" || venture.owned === 0) return total;

    const automationBonus = venture.automated ? 1.7 : 1;
    return total + venture.owned * venture.baseRevenue * automationBonus;
  }, 0);
}

/**
 * Formats Zusk capacity for UI labels without pretending it is currency.
 *
 * @param value - The raw capacity score.
 * @returns A compact capacity label.
 */
export function formatCapacity(value: number): string {
  if (value < 1000) return value.toFixed(value < 100 ? 1 : 0);

  const units = ["K", "M", "B"];
  let scaled = value;
  let unitIndex = -1;

  while (scaled >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }

  return `${scaled.toFixed(scaled < 10 ? 2 : 1)}${units[unitIndex]}`;
}

/**
 * Computes the operations profit multiplier earned from completed layoff programs.
 *
 * @param state - The current game state.
 * @param venture - The venture receiving revenue.
 * @returns A multiplier applied only to model-training ventures.
 */
export function layoffProgramMultiplierFor(state: GameState, venture: Venture): number {
  if (venture.category !== "operations") return 1;

  return layoffPrograms.reduce((total, program) => {
    if (!state.purchasedLayoffProgramIds.includes(program.id)) return total;

    return total * program.multiplier;
  }, 1);
}

/**
 * Totals all salary and benefit costs assigned to a venture.
 *
 * @param venture - The venture whose employees should be costed.
 * @returns The combined payroll for workers and manager.
 */
export function venturePayroll(venture: Venture): number {
  const workerPayroll = venture.employees.reduce(
    (total, employee) => total + employee.salary + employee.benefits,
    0
  );
  const managerPayroll = venture.manager ? venture.manager.salary + venture.manager.benefits : 0;
  return workerPayroll + managerPayroll;
}

/**
 * Calculates compute and overhead costs for automated model-training ventures.
 *
 * @param venture - The venture whose automated infrastructure should be costed.
 * @returns Compute, overhead, and total costs for the venture cycle.
 */
export function ventureComputeCosts(venture: Venture): { compute: number; overhead: number; total: number } {
  if (!venture.automated || venture.category !== "operations") {
    return { compute: 0, overhead: 0, total: 0 };
  }

  // Automated operations stop using worker payroll as their cost model. Capacity expansion now
  // increases GPU spend linearly, while infrastructure overhead grows more slowly with scale.
  const compute = roundMoney(venture.baseRevenue * venture.owned * 0.42);
  const overhead = roundMoney(venture.baseRevenue * Math.max(1, Math.sqrt(venture.owned)) * 0.16);

  return {
    compute,
    overhead,
    total: roundMoney(compute + overhead)
  };
}

/**
 * Calculates the gross revenue for a venture before payroll or compute costs.
 *
 * @param state - The current game state containing upgrades and prestige.
 * @param venture - The venture completing a cycle.
 * @returns The gross payout before operating costs.
 */
export function ventureGrossRevenue(state: GameState, venture: Venture): number {
  // Automated operations run less often, but each completion is a larger productized release.
  const automationRewardMultiplier = venture.automated && venture.category === "operations" ? 2.5 : 1;
  return (
    venture.baseRevenue *
    venture.owned *
    multiplierFor(state, venture.id) *
    automationRewardMultiplier *
    layoffProgramMultiplierFor(state, venture)
  );
}

/**
 * Calculates the net revenue for a venture after the appropriate cost model.
 *
 * @param state - The current game state.
 * @param venture - The venture completing a cycle.
 * @returns The net payout credited on completion.
 */
export function ventureRevenue(state: GameState, venture: Venture): number {
  // Manual operations and annotation work use payroll. Automated operations use compute costs.
  const costs =
    venture.automated && venture.category === "operations"
      ? ventureComputeCosts(venture).total
      : venturePayroll(venture);

  return ventureGrossRevenue(state, venture) - costs;
}

/**
 * Gets the effective cycle duration for a venture.
 *
 * @param venture - The venture whose progress timing is being rendered or advanced.
 * @returns The cycle duration in milliseconds.
 */
export function ventureCycleMs(venture: Venture): number {
  // Automated operations represent bigger release cycles: slower progress bars, larger payout.
  return venture.automated && venture.category === "operations" ? venture.cycleMs * 1.75 : venture.cycleMs;
}

/**
 * Converts venture progress into a clamped percentage ratio.
 *
 * @param venture - The venture whose progress should be displayed.
 * @returns A number between 0 and 1.
 */
export function ventureProgressRatio(venture: Venture): number {
  const cycleMs = ventureCycleMs(venture);
  if (cycleMs <= 0) return 0;

  return Math.min(1, Math.max(0, venture.progress / cycleMs));
}

/**
 * Calculates the remaining cycle time for a running venture.
 *
 * @param venture - The venture whose current cycle should be timed.
 * @returns Remaining milliseconds in the current cycle, or zero when idle or complete.
 */
export function ventureRemainingMs(venture: Venture): number {
  if (venture.owned === 0 || (!venture.automated && venture.progress === 0)) return 0;

  return Math.max(0, ventureCycleMs(venture) - venture.progress);
}

/**
 * Formats a remaining cycle duration for compact venture card display.
 *
 * @param milliseconds - The duration to format.
 * @returns A short countdown label.
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.max(0, milliseconds / 1000);
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  if (seconds < 60) return `${Math.ceil(seconds)}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

/**
 * Calculates automated net income per second using the same payout math as the tick engine.
 *
 * @param state - The current game state containing ventures and multipliers.
 * @returns The projected per-second net cash generated by automated ventures.
 */
export function automatedIncomePerSecond(state: GameState): number {
  return state.ventures.reduce((total, venture) => {
    if (!venture.automated || venture.owned === 0) return total;

    return total + (ventureRevenue(state, venture) / ventureCycleMs(venture)) * 1000;
  }, 0);
}

/**
 * Calculates the recurring cash pressure from a selected wife's unmet interests.
 *
 * @param state - The current game state.
 * @returns The per-second lifestyle pressure cost.
 */
export function currentLifestylePressure(state: GameState): number {
  const wife = wifeChoices.find((choice) => choice.id === state.selectedWifeId);
  if (!wife) return 0;

  const relief = lifestyleAssets.reduce((total, asset) => {
    if (!state.ownedLifestyleAssetIds.includes(asset.id)) return total;
    if (!wife.interests.includes(asset.interest)) return total;
    return total + asset.pressureRelief;
  }, 0);
  const unmetPressure = Math.max(0, wife.materialism - relief);

  return roundMoney(unmetPressure * 0.18);
}

/**
 * Calculates recurring cash pressure while Marlon is dating but not married.
 *
 * @param state - The current game state.
 * @returns The per-second dating pressure cost.
 */
export function currentDatingPressure(state: GameState): number {
  const wife = wifeChoices.find((choice) => choice.id === state.datingWifeId);
  if (!wife || state.selectedWifeId) return 0;

  return roundMoney(wife.materialism * 0.06);
}

/**
 * Calculates cash plus purchased lifestyle asset value.
 *
 * @param state - The current game state.
 * @returns The player's current net worth.
 */
export function currentNetWorth(state: GameState): number {
  const assetValue = lifestyleAssets.reduce(
    (total, asset) => (state.ownedLifestyleAssetIds.includes(asset.id) ? total + asset.cost : total),
    0
  );

  return roundMoney(state.cash + assetValue);
}

/**
 * Finds the next available relationship offer based on lifetime profit.
 *
 * @param state - The current game state.
 * @returns The next wife choice available to date, or null when none qualifies.
 */
export function nextWifeOffer(state: GameState): WifeChoice | null {
  if (state.selectedWifeId || state.datingWifeId) return null;

  return (
    wifeChoices.find(
      (wife) => state.lifetimeEarnings >= wife.minLifetimeProfit && !state.refusedWifeIds.includes(wife.id)
    ) ?? null
  );
}

/**
 * Reduces employee compensation when needed so a new expansion cannot lower net profit.
 *
 * @param employee - The newly created employee to validate.
 * @param state - The current game state used for multipliers.
 * @param venture - The venture receiving the employee.
 * @returns The original employee or a compensation-capped copy.
 */
export function capEmployeeToProfitableExpansion(
  employee: Employee,
  state: GameState,
  venture: Venture
): Employee {
  const marginalGross = venture.baseRevenue * multiplierFor(state, venture.id);
  const maxCompensation = Math.max(0.25, roundMoney(marginalGross * 0.65));
  const compensation = employee.salary + employee.benefits;

  if (compensation <= maxCompensation) return employee;

  const benefitsRate = employee.level === "manager" ? MANAGER_BENEFITS_RATE : WORKER_BENEFITS_RATE;
  const salary = roundMoney(maxCompensation / (1 + benefitsRate));
  return {
    ...employee,
    salary,
    benefits: roundMoney(maxCompensation - salary)
  };
}

/**
 * Rounds money to cents for stable state and UI calculations.
 *
 * @param value - The raw numeric value.
 * @returns The value rounded to two decimal places.
 */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculates how much new prestige can be claimed from lifetime earnings.
 *
 * @param state - The current game state.
 * @returns The unclaimed prestige available on reset.
 */
export function claimablePrestige(state: GameState): number {
  const earned = Math.floor(Math.sqrt(state.lifetimeEarnings / 120000));
  return Math.max(0, earned - state.totalPrestigeEarned);
}
