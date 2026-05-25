import {
  capEmployeeToProfitableExpansion,
  createEmployee,
  createInitialState,
  createManager,
  currentDatingPressure,
  currentLifestylePressure,
  Employee,
  GameState,
  lifestyleAssets,
  nextWifeOffer,
  Venture,
  ventureCost,
  ventureCycleMs,
  ventureRevenue
} from "@/lib/game";

export type AutomationEvent =
  | { kind: "layoff"; count: number; ventureName: string }
  | { kind: "annotation"; ventureName: string }
  | null;

/**
 * Buys one additional unit of a venture.
 *
 * Manual operations and annotation ventures hire or reassign one worker. Automated operations only
 * scale compute capacity. Invalid, locked, or unaffordable purchases are no-ops so UI handlers can
 * dispatch safely.
 */
export function buyVenture(state: GameState, ventureId: string): GameState {
  const venture = state.ventures.find((item) => item.id === ventureId);
  if (!venture || !isVentureUnlocked(state, venture)) return state;

  const cost = ventureCost(venture);
  if (state.cash < cost) return state;

  return {
    ...state,
    cash: roundMoney(state.cash - cost),
    ...assignEmployeeToVenture(state, ventureId)
  };
}

/**
 * Starts an idle manual venture.
 *
 * Automated ventures are advanced by the tick loop, so this action intentionally only moves
 * player-triggered ventures from progress 0 into a running state.
 */
export function startVenture(state: GameState, ventureId: string): GameState {
  return {
    ...state,
    ventures: state.ventures.map((venture) =>
      venture.id === ventureId &&
      isVentureUnlocked(state, venture) &&
      venture.owned > 0 &&
      venture.progress === 0
        ? { ...venture, progress: 1 }
        : venture
    )
  };
}

/**
 * Converts a venture into automated mode.
 *
 * The returned state is authoritative. The event is only a UI-facing description for toast messages.
 */
export function automateVenture(
  state: GameState,
  ventureId: string
): { event: AutomationEvent; state: GameState } {
  const venture = state.ventures.find((item) => item.id === ventureId);
  if (!venture || !isVentureUnlocked(state, venture) || venture.automated || state.cash < venture.managerCost) {
    return { event: null, state };
  }

  const automatesWithLayoffs = venture.category === "operations";
  /**
   * Operations automation replaces product staff with compute plus one manager.
   * Annotation automation only removes manual execution; workers stay assigned and no manager payroll is added.
   */
  const nextState = {
    ...state,
    cash: roundMoney(state.cash - venture.managerCost),
    ventures: state.ventures.map((item) =>
      item.id === ventureId
        ? {
            ...item,
            automated: true,
            manager: automatesWithLayoffs ? createManager(item) : item.manager,
            employees: automatesWithLayoffs ? [] : item.employees,
            progress: item.progress || 1
          }
        : item
    ),
    unemployed: automatesWithLayoffs
      ? [
          ...state.unemployed,
          ...venture.employees.map((employee) => ({
            ...employee,
            formerVenture: venture.name
          }))
        ]
      : state.unemployed
  };

  if (automatesWithLayoffs && venture.employees.length > 0) {
    return { event: { kind: "layoff", count: venture.employees.length, ventureName: venture.name }, state: nextState };
  }

  if (!automatesWithLayoffs) {
    return { event: { kind: "annotation", ventureName: venture.name }, state: nextState };
  }

  return { event: null, state: nextState };
}

/**
 * Purchases a one-time upgrade.
 *
 * Upgrade effects are applied later by multiplier calculations; this function only records ownership
 * and spends cash.
 */
export function buyUpgrade(state: GameState, upgradeId: string): GameState {
  const upgrade = state.upgrades.find((item) => item.id === upgradeId);
  if (!upgrade || upgrade.purchased || state.cash < upgrade.cost) return state;

  return {
    ...state,
    cash: roundMoney(state.cash - upgrade.cost),
    upgrades: state.upgrades.map((item) => (item.id === upgradeId ? { ...item, purchased: true } : item))
  };
}

/**
 * Starts dating the current eligible candidate.
 *
 * The candidate must match the current offer, which prevents deep links or stale UI from selecting
 * locked or previously refused candidates.
 */
export function startDating(state: GameState, wifeId: string): GameState {
  const offer = nextWifeOffer(state);
  if (offer?.id !== wifeId) return state;

  return {
    ...state,
    datingWifeId: wifeId
  };
}

/**
 * Converts the current dating relationship into marriage.
 *
 * Married partners activate full lifestyle pressure, while dating pressure stops.
 */
export function acceptMarriage(state: GameState): GameState {
  return {
    ...state,
    selectedWifeId: state.datingWifeId,
    datingWifeId: null
  };
}

/**
 * Ends the current dating relationship and marks that candidate as refused.
 *
 * Refused candidates stay skipped so the rotation can move on to later, more materialistic options.
 */
export function refuseWife(state: GameState): GameState {
  if (!state.datingWifeId) return state;

  /**
   * Refusing a candidate gives an immediate cash bump and removes her from future offers, which creates
   * the "break up and chase a richer tier" loop.
   */
  const breakupBonus = Math.max(100, state.lifetimeEarnings * 0.06);
  return {
    ...state,
    cash: roundMoney(state.cash + breakupBonus),
    datingWifeId: null,
    refusedWifeIds: state.refusedWifeIds.includes(state.datingWifeId)
      ? state.refusedWifeIds
      : [...state.refusedWifeIds, state.datingWifeId]
  };
}

/**
 * Buys a lifestyle asset once.
 *
 * Assets increase net worth and can reduce pressure when their interest category matches the selected wife.
 */
export function buyLifestyleAsset(state: GameState, assetId: string): GameState {
  const asset = lifestyleAssets.find((item) => item.id === assetId);
  if (!asset || state.ownedLifestyleAssetIds.includes(assetId) || state.cash < asset.cost) return state;

  return {
    ...state,
    cash: roundMoney(state.cash - asset.cost),
    ownedLifestyleAssetIds: [...state.ownedLifestyleAssetIds, assetId]
  };
}

/**
 * Performs a prestige reset.
 *
 * The run restarts from a fresh initial state while carrying forward the newly claimable prestige.
 * Temporary run data like employees, assets, relationships, and progress is intentionally reset.
 */
export function resetForPrestige(state: GameState, availablePrestige: number): GameState {
  if (availablePrestige <= 0) return state;

  const fresh = createInitialState();
  return {
    ...fresh,
    prestige: state.prestige + availablePrestige,
    totalPrestigeEarned: state.totalPrestigeEarned + availablePrestige
  };
}

/**
 * Returns whether a venture can be interacted with in the current progression window.
 */
export function isVentureUnlocked(state: GameState, venture: Venture): boolean {
  const categoryVentures = state.ventures.filter((item) => item.category === venture.category);
  const ventureIndex = categoryVentures.findIndex((item) => item.id === venture.id);
  const highestAutomatedIndex = categoryVentures.reduce(
    (highest, item, index) => (item.automated ? Math.max(highest, index) : highest),
    -1
  );
  const highestUnlockedIndex = Math.max(1, highestAutomatedIndex + 2);

  /**
   * The first two ventures in a category are available at the start. After that, each automation unlocks
   * visibility and actions up to two ventures ahead of the highest automated venture.
   */
  return ventureIndex <= highestUnlockedIndex;
}

/**
 * Checks whether a normalized save has the minimum shape the engine needs.
 *
 * Saves are user-owned localStorage data, so new versions should be normalized rather than dropped
 * whenever a field can be safely defaulted.
 */
export function isCompatibleSave(state: GameState): boolean {
  return (
    typeof state.prestige === "number" &&
    typeof state.totalPrestigeEarned === "number" &&
    Array.isArray(state.unemployed) &&
    Array.isArray(state.ownedLifestyleAssetIds) &&
    Array.isArray(state.refusedWifeIds) &&
    (typeof state.selectedWifeId === "string" || state.selectedWifeId === null) &&
    (typeof state.datingWifeId === "string" || state.datingWifeId === null) &&
    state.ventures.every((venture) => venture.category === "operations" || venture.category === "annotation")
  );
}

/**
 * Backfills fields introduced after older saves were created.
 *
 * This keeps localStorage saves durable without forcing a hard reset whenever the game model grows.
 */
export function normalizeSave(state: GameState): GameState {
  return {
    ...state,
    datingWifeId: state.datingWifeId ?? null,
    ownedLifestyleAssetIds: Array.isArray(state.ownedLifestyleAssetIds) ? state.ownedLifestyleAssetIds : [],
    refusedWifeIds: Array.isArray(state.refusedWifeIds) ? state.refusedWifeIds : [],
    selectedWifeId: state.selectedWifeId ?? null
  };
}

/**
 * Advances the whole game by a number of milliseconds.
 *
 * This is the authoritative payout path. UI progress bars may animate for smoothness, but cash only
 * changes here when stored progress crosses the active venture cycle duration.
 */
export function runTick(state: GameState, deltaMs: number): GameState {
  let cashEarned = 0;

  const ventures = state.ventures.map((venture) => {
    if (venture.owned === 0 || (!venture.automated && venture.progress === 0)) {
      return venture;
    }

    let progress = venture.progress + deltaMs;
    let earned = 0;
    const cycleMs = ventureCycleMs(venture);

    /**
     * Automated ventures may complete multiple cycles while the tab is backgrounded or during offline
     * catch-up. Manual ventures complete once and then return to idle progress 0.
     */
    while (progress >= cycleMs) {
      earned += ventureRevenue(state, venture);
      progress -= cycleMs;

      if (!venture.automated) {
        progress = 0;
        break;
      }
    }

    progress = Math.max(0, Math.min(progress, cycleMs));
    cashEarned += earned;
    return { ...venture, lastPayout: earned > 0 ? earned : venture.lastPayout, progress };
  });

  const lifestylePressure = (currentLifestylePressure(state) + currentDatingPressure(state)) * (deltaMs / 1000);
  const nextCash = Math.max(0, state.cash + cashEarned - lifestylePressure);

  return {
    ...state,
    cash: roundMoney(nextCash),
    lifetimeEarnings: state.lifetimeEarnings + cashEarned,
    ventures
  };
}

/**
 * Applies the employee side effects of a venture expansion.
 *
 * Automated operations add owned compute capacity without hiring. All other ventures add one worker,
 * preferring unemployed workers for annotation tasks.
 */
function assignEmployeeToVenture(state: GameState, ventureId: string): Pick<GameState, "ventures" | "unemployed"> {
  const venture = state.ventures.find((item) => item.id === ventureId);
  if (!venture) return { ventures: state.ventures, unemployed: state.unemployed };

  if (venture.automated && venture.category === "operations") {
    /**
     * Once model-training work is automated, expansion scales compute capacity instead of hiring staff.
     */
    return {
      unemployed: state.unemployed,
      ventures: state.ventures.map((item) => (item.id === ventureId ? { ...item, owned: item.owned + 1 } : item))
    };
  }

  const nextIndex = venture.employees.length + venture.owned;
  let unemployed = state.unemployed;
  let employee: Employee;

  if (venture.category === "annotation" && unemployed.length > 0) {
    /**
     * Annotation ventures preferentially absorb laid-off operations employees before creating new workers.
     */
    const [reassigned, ...remaining] = unemployed;
    const annotationEmployee = createEmployee(venture, nextIndex);
    employee = {
      ...reassigned,
      role: annotationEmployee.role,
      salary: annotationEmployee.salary,
      benefits: annotationEmployee.benefits
    };
    unemployed = remaining;
  } else {
    employee = createEmployee(venture, nextIndex);
  }

  const cappedEmployee = capEmployeeToProfitableExpansion(employee, state, venture);

  return {
    unemployed,
    ventures: state.ventures.map((item) =>
      item.id === ventureId ? { ...item, owned: item.owned + 1, employees: [...item.employees, cappedEmployee] } : item
    )
  };
}

/**
 * Keeps money state stable at cents precision after purchases, payouts, and pressure drains.
 */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
