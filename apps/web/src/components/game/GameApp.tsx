"use client";

import { BriefcaseBusiness, Building2, ClipboardList, Factory, Gem, Heart, RefreshCcw, Siren, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/game/StatCard";
import { ThemeToggle, ThemeMode } from "@/components/game/ThemeToggle";
import { LifestylePanel } from "@/components/game/LifestylePanel";
import { TopNav } from "@/components/game/TopNav";
import { UpgradePanel } from "@/components/game/UpgradePanel";
import { VentureCard } from "@/components/game/VentureCard";
import { VentureTabs, VentureTabConfig, VentureTabId } from "@/components/game/VentureTabs";
import { WorkersPanel } from "@/components/game/WorkersPanel";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Panel } from "@/components/ui/Panel";
import { Toast, ToastMessage } from "@/components/ui/Toast";
import {
  claimablePrestige,
  capEmployeeToProfitableExpansion,
  currentDatingPressure,
  currentNetWorth,
  createEmployee,
  createInitialState,
  createManager,
  currentLifestylePressure,
  Employee,
  formatMoney,
  GameState,
  LEGACY_SAVE_KEYS,
  lifestyleAssets,
  nextWifeOffer,
  SAVE_KEY,
  ventureCycleMs,
  ventureCost,
  ventureRevenue
} from "@/lib/game";

const tickMs = 100;
const THEME_KEY = "zusk-theme";
const ventureTabs: readonly VentureTabConfig[] = [
  { id: "operations", label: "Train Zusk Model", icon: Factory },
  { id: "annotation", label: "Data Annotation", icon: ClipboardList },
  { id: "workers", label: "Workers", icon: BriefcaseBusiness },
  { id: "lifestyle", label: "Lifestyle", icon: Heart }
] as const;

type GameModal = "options" | "reset" | null;

export function GameApp({
  initialEmployeesId = null,
  initialBudgetId = null,
  initialModal = null,
  initialTab = "operations",
  initialUpgradeDrawerOpen = false
}: {
  initialEmployeesId?: string | null;
  initialBudgetId?: string | null;
  initialModal?: GameModal;
  initialTab?: VentureTabId;
  initialUpgradeDrawerOpen?: boolean;
}) {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [activeTab, setActiveTab] = useState<VentureTabId>(initialTab);
  const [openBudgetId, setOpenBudgetId] = useState<string | null>(initialBudgetId);
  const [openEmployeesId, setOpenEmployeesId] = useState<string | null>(initialEmployeesId);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpgradeDrawerOpen, setIsUpgradeDrawerOpen] = useState(initialUpgradeDrawerOpen);
  const [modal, setModal] = useState<GameModal>(initialModal);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const queryTheme = new URLSearchParams(window.location.search).get("theme");
    if (queryTheme === "dark" || queryTheme === "light") {
      setTheme(queryTheme);
      document.documentElement.dataset.theme = queryTheme;
      return;
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    const nextTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) {
      setLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as GameState;
      const normalized = normalizeSave(parsed);
      if (!isCompatibleSave(normalized)) {
        clearSavedGames();
        setLoaded(true);
        return;
      }
      const elapsed = Math.min(Date.now() - normalized.lastSavedAt, 1000 * 60 * 60 * 8);
      setState(runTick(normalized, elapsed));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }));
  }, [loaded, state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((current) => runTick(current, tickMs));
    }, tickMs);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const availablePrestige = useMemo(() => claimablePrestige(state), [state]);
  const netWorth = useMemo(() => currentNetWorth(state), [state]);
  const incomePerSecond = useMemo(
    () =>
      state.ventures.reduce((total, venture) => {
        if (!venture.automated || venture.owned === 0) return total;
        return total + (ventureRevenue(state, venture) / ventureCycleMs(venture)) * 1000;
      }, 0),
    [state]
  );
  const activeVentures = useMemo(
    () =>
      activeTab === "workers"
        ? []
        : activeTab === "lifestyle"
          ? []
        : state.ventures.filter((venture) => venture.category === activeTab),
    [activeTab, state.ventures]
  );

  function startVenture(id: string) {
    setState((current) => ({
      ...current,
      ventures: current.ventures.map((venture) =>
        venture.id === id && isVentureUnlocked(current, venture) && venture.owned > 0 && venture.progress === 0
          ? { ...venture, progress: 1 }
          : venture
      )
    }));
  }

  function buyVenture(id: string) {
    setState((current) => {
      const venture = current.ventures.find((item) => item.id === id);
      if (!venture) return current;
      if (!isVentureUnlocked(current, venture)) return current;
      const cost = ventureCost(venture);
      if (current.cash < cost) return current;

      return {
        ...current,
        cash: current.cash - cost,
        ...assignEmployeeToVenture(current, id)
      };
    });
  }

  function hireManager(id: string) {
    const currentVenture = state.ventures.find((item) => item.id === id);
    const laidOffCount = currentVenture?.employees.length ?? 0;
    const shouldLayOff = currentVenture?.category === "operations";

    setState((current) => {
      const venture = current.ventures.find((item) => item.id === id);
      if (!venture || !isVentureUnlocked(current, venture) || venture.automated || current.cash < venture.managerCost) return current;
      const automatesWithLayoffs = venture.category === "operations";

      return {
        ...current,
        cash: current.cash - venture.managerCost,
        ventures: current.ventures.map((item) =>
          item.id === id
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
              ...current.unemployed,
              ...venture.employees.map((employee) => ({
                ...employee,
                formerVenture: venture.name
              }))
            ]
          : current.unemployed
      };
    });

    if (
      !currentVenture ||
      !isVentureUnlocked(state, currentVenture) ||
      state.cash < currentVenture.managerCost ||
      currentVenture.automated
    ) {
      return;
    }

    if (shouldLayOff && laidOffCount > 0) {
      setToast({
        id: Date.now(),
        message: `Congratulations. You laid off ${laidOffCount.toLocaleString()} ${
          laidOffCount === 1 ? "person" : "people"
        } from ${currentVenture.name}.`
      });
      return;
    }

    if (!shouldLayOff) {
      setToast({
        id: Date.now(),
        message: `${currentVenture.name} management automated. Employees stay assigned to data annotation.`
      });
    }
  }

  function buyUpgrade(id: string) {
    setState((current) => {
      const upgrade = current.upgrades.find((item) => item.id === id);
      if (!upgrade || upgrade.purchased || current.cash < upgrade.cost) return current;

      return {
        ...current,
        cash: current.cash - upgrade.cost,
        upgrades: current.upgrades.map((item) =>
          item.id === id ? { ...item, purchased: true } : item
        )
      };
    });
  }

  function startDating(id: string) {
    setState((current) => {
      const offer = nextWifeOffer(current);
      if (offer?.id !== id) return current;

      return {
        ...current,
        datingWifeId: id
      };
    });
  }

  function acceptMarriage() {
    setState((current) => ({
      ...current,
      selectedWifeId: current.datingWifeId,
      datingWifeId: null
    }));
  }

  function refuseWife() {
    setState((current) => {
      if (!current.datingWifeId) return current;
      const breakupBonus = Math.max(100, current.lifetimeEarnings * 0.06);

      return {
        ...current,
        cash: current.cash + breakupBonus,
        datingWifeId: null,
        refusedWifeIds: current.refusedWifeIds.includes(current.datingWifeId)
          ? current.refusedWifeIds
          : [...current.refusedWifeIds, current.datingWifeId]
      };
    });
  }

  function buyLifestyleAsset(id: string) {
    setState((current) => {
      const asset = lifestyleAssets.find((item) => item.id === id);
      if (!asset || current.ownedLifestyleAssetIds.includes(id) || current.cash < asset.cost) return current;

      return {
        ...current,
        cash: current.cash - asset.cost,
        ownedLifestyleAssetIds: [...current.ownedLifestyleAssetIds, id]
      };
    });
  }

  function resetForPrestige() {
    if (availablePrestige <= 0) return;
    const fresh = createInitialState();
    setState({
      ...fresh,
      prestige: state.prestige + availablePrestige,
      totalPrestigeEarned: state.totalPrestigeEarned + availablePrestige
    });
  }

  function openModal(nextModal: "options" | "reset") {
    setModal(nextModal);
    setIsMenuOpen(false);
  }

  function resetGame() {
    const fresh = createInitialState();
    clearSavedGames();
    setState(fresh);
    setOpenBudgetId(null);
    setOpenEmployeesId(null);
    setActiveTab("operations");
    setModal(null);
    setToast({
      id: Date.now(),
      message: "Game reset. Marlon Zusk is back at the beginning."
    });
  }

  return (
    <>
      <TopNav
        isMenuOpen={isMenuOpen}
        onOpenOptions={() => openModal("options")}
        onOpenReset={() => openModal("reset")}
        onOpenUpgrades={() => {
          setIsUpgradeDrawerOpen(true);
          setIsMenuOpen(false);
        }}
        onToggleMenu={() => setIsMenuOpen((current) => !current)}
      />
      <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Job Killer</p>
          <h1>AI Capitalist</h1>
          <p className="hero-copy">
            Marlon Zusk&apos;s agenda is to replace his entire workforce with Zusk, then migrate
            the displaced staff into data annotation jobs that make the model smarter.
          </p>
        </div>
        <Panel className="cash-panel">
          <span>Cash</span>
          <strong>{formatMoney(state.cash)}</strong>
          <small>{formatMoney(incomePerSecond)} / sec automated net profit</small>
        </Panel>
      </section>

      <section className="stats-grid">
        <StatCard icon={<Building2 size={18} />} label="Lifetime profit" value={formatMoney(state.lifetimeEarnings)} />
        <StatCard icon={<Gem size={18} />} label="Net worth" value={formatMoney(netWorth)} />
        <StatCard icon={<Siren size={18} />} label="Prestige" value={state.prestige.toLocaleString()} />
        <StatCard icon={<UserX size={18} />} label="Unemployed" value={state.unemployed.length.toLocaleString()} />
        <Button className="prestige-button" onClick={resetForPrestige} disabled={availablePrestige === 0} variant="dark">
          <RefreshCcw size={18} />
          Relaunch Zusk for {availablePrestige.toLocaleString()} prestige
        </Button>
      </section>

      <section className="venture-column">
        <VentureTabs activeTab={activeTab} onChange={setActiveTab} tabs={ventureTabs} />

        {activeTab === "workers" ? (
          <WorkersPanel state={state} />
        ) : activeTab === "lifestyle" ? (
          <LifestylePanel
            onAcceptMarriage={acceptMarriage}
            onBuyAsset={buyLifestyleAsset}
            onRefuseWife={refuseWife}
            onStartDating={startDating}
            state={state}
          />
        ) : (
          <div
            className="venture-list"
            role="tabpanel"
            aria-label={activeTab === "operations" ? "Train Zusk Model" : "Data annotation jobs"}
          >
            {activeVentures.map((venture) => (
              <VentureCard
              cash={state.cash}
              isBudgetOpen={openBudgetId === venture.id}
              isEmployeesOpen={openEmployeesId === venture.id}
              isLocked={!isVentureUnlocked(state, venture)}
              key={venture.id}
              onBuy={buyVenture}
              onHireManager={hireManager}
              onStart={startVenture}
              onToggleBudget={(id) => setOpenBudgetId((current) => (current === id ? null : id))}
              onToggleEmployees={(id) => setOpenEmployeesId((current) => (current === id ? null : id))}
              state={state}
              venture={venture}
            />
            ))}
          </div>
        )}
      </section>

      <Toast toast={toast} />
      </main>

      {isUpgradeDrawerOpen ? (
        <div className="drawer-backdrop" role="presentation" onClick={() => setIsUpgradeDrawerOpen(false)}>
          <div className="right-drawer" role="dialog" aria-modal="true" aria-label="Zusk Levers" onClick={(event) => event.stopPropagation()}>
            <UpgradePanel
              cash={state.cash}
              onBuyUpgrade={buyUpgrade}
              onClose={() => setIsUpgradeDrawerOpen(false)}
              upgrades={state.upgrades}
            />
          </div>
        </div>
      ) : null}

      {modal === "options" ? (
        <Modal title="Options" onClose={() => setModal(null)}>
          <div className="modal-content">
            <div className="option-row">
              <span>
                <strong>Theme</strong>
                <small>Switch the game between light and dark mode.</small>
              </span>
              <ThemeToggle
                theme={theme}
                onToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              />
            </div>
            <div className="option-row">
              <span>
                <strong>Save status</strong>
                <small>Progress is saved locally in this browser.</small>
              </span>
            </div>
          </div>
        </Modal>
      ) : null}

      {modal === "reset" ? (
        <Modal title="Reset Game" onClose={() => setModal(null)}>
          <div className="modal-content">
            <p>
              Resetting clears cash, ventures, employees, upgrades, prestige, and unemployment. This cannot be undone.
            </p>
            <div className="modal-actions">
              <Button onClick={() => setModal(null)} type="button">
                Cancel
              </Button>
              <Button onClick={resetGame} type="button" variant="dark">
                Confirm reset
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function clearSavedGames() {
  localStorage.removeItem(SAVE_KEY);
  LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));
}

function isVentureUnlocked(state: GameState, venture: GameState["ventures"][number]): boolean {
  const categoryVentures = state.ventures.filter((item) => item.category === venture.category);
  const ventureIndex = categoryVentures.findIndex((item) => item.id === venture.id);
  const highestAutomatedIndex = categoryVentures.reduce(
    (highest, item, index) => (item.automated ? Math.max(highest, index) : highest),
    -1
  );
  const highestUnlockedIndex = Math.max(1, highestAutomatedIndex + 2);

  return ventureIndex <= highestUnlockedIndex;
}

function assignEmployeeToVenture(state: GameState, ventureId: string): Pick<GameState, "ventures" | "unemployed"> {
  const venture = state.ventures.find((item) => item.id === ventureId);
  if (!venture) return { ventures: state.ventures, unemployed: state.unemployed };

  if (venture.automated && venture.category === "operations") {
    return {
      unemployed: state.unemployed,
      ventures: state.ventures.map((item) =>
        item.id === ventureId ? { ...item, owned: item.owned + 1 } : item
      )
    };
  }

  const nextIndex = venture.employees.length + venture.owned;
  let unemployed = state.unemployed;
  let employee: Employee;

  if (venture.category === "annotation" && unemployed.length > 0) {
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
      item.id === ventureId
        ? { ...item, owned: item.owned + 1, employees: [...item.employees, cappedEmployee] }
        : item
    )
  };
}

function isCompatibleSave(state: GameState): boolean {
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

function normalizeSave(state: GameState): GameState {
  return {
    ...state,
    datingWifeId: state.datingWifeId ?? null,
    ownedLifestyleAssetIds: Array.isArray(state.ownedLifestyleAssetIds)
      ? state.ownedLifestyleAssetIds
      : [],
    refusedWifeIds: Array.isArray(state.refusedWifeIds) ? state.refusedWifeIds : [],
    selectedWifeId: state.selectedWifeId ?? null
  };
}

function runTick(state: GameState, deltaMs: number): GameState {
  let cashEarned = 0;

  const ventures = state.ventures.map((venture) => {
    if (venture.owned === 0 || (!venture.automated && venture.progress === 0)) {
      return venture;
    }

    let progress = venture.progress + deltaMs;
    let earned = 0;

    const cycleMs = ventureCycleMs(venture);

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
    return { ...venture, progress };
  });

  return {
    ...state,
    cash: Math.max(
      0,
      state.cash +
        cashEarned -
        (currentLifestylePressure(state) + currentDatingPressure(state)) * (deltaMs / 1000)
    ),
    lifetimeEarnings: state.lifetimeEarnings + cashEarned,
    ventures
  };
}
