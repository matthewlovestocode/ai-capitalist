"use client";

import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Factory,
  Gem,
  Heart,
  Play,
  RefreshCcw,
  Settings,
  Siren,
  UserX
} from "lucide-react";
import Image from "next/image";
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
  automatedIncomePerSecond,
  claimablePrestige,
  currentNetWorth,
  createInitialState,
  formatMoney,
  GameState,
  LEGACY_SAVE_KEYS,
  SAVE_KEY
} from "@/lib/game";
import {
  acceptMarriage as acceptMarriageState,
  automateVenture,
  buyLifestyleAsset as buyLifestyleAssetState,
  buyUpgrade as buyUpgradeState,
  buyVenture as buyVentureState,
  isCompatibleSave,
  isVentureUnlocked,
  normalizeSave,
  refuseWife as refuseWifeState,
  resetForPrestige as resetForPrestigeState,
  runTick,
  startDating as startDatingState,
  startVenture as startVentureState
} from "@/lib/gameEngine";

const tickMs = 100;
const THEME_KEY = "zusk-theme";
const ventureTabs: readonly VentureTabConfig[] = [
  { id: "operations", label: "Train Zusk Model", icon: Factory },
  { id: "annotation", label: "Data Annotation", icon: ClipboardList },
  { id: "workers", label: "Workers", icon: BriefcaseBusiness },
  { id: "lifestyle", label: "Lifestyle", icon: Heart }
] as const;

type GameModal = "options" | "reset" | null;
type GameScreen = "menu" | "playing";

/**
 * Runs the main AI Capitalist client experience, including save hydration and game ticks.
 *
 * @param props - Optional URL-driven initial UI state used by routes and smoke tests.
 * @returns The playable game shell.
 */
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
  const [hasSave, setHasSave] = useState(false);
  const [screen, setScreen] = useState<GameScreen>("menu");
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
      setHasSave(false);
      setLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as GameState;
      const normalized = normalizeSave(parsed);
      if (!isCompatibleSave(normalized)) {
        clearSavedGames();
        setHasSave(false);
        setLoaded(true);
        return;
      }
      const elapsed = Math.min(Date.now() - normalized.lastSavedAt, 1000 * 60 * 60 * 8);
      setState(runTick(normalized, elapsed));
      setHasSave(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || screen !== "playing") return;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }));
    setHasSave(true);
  }, [loaded, screen, state]);

  useEffect(() => {
    if (screen !== "playing") return;

    const timer = window.setInterval(() => {
      setState((current) => runTick(current, tickMs));
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const availablePrestige = useMemo(() => claimablePrestige(state), [state]);
  const netWorth = useMemo(() => currentNetWorth(state), [state]);
  const incomePerSecond = useMemo(() => automatedIncomePerSecond(state), [state]);
  const activeVentures = useMemo(
    () =>
      activeTab === "workers"
        ? []
        : activeTab === "lifestyle"
          ? []
        : state.ventures.filter((venture) => venture.category === activeTab),
    [activeTab, state.ventures]
  );

  /**
   * Starts a manual venture cycle when the selected venture is ready.
   *
   * @param id - The venture id to start.
   */
  function startVenture(id: string) {
    setState((current) => startVentureState(current, id));
  }

  /**
   * Buys one expansion level for a venture.
   *
   * @param id - The venture id to expand.
   */
  function buyVenture(id: string) {
    setState((current) => buyVentureState(current, id));
  }

  /**
   * Automates a venture and emits the correct toast for layoffs or annotation management.
   *
   * @param id - The venture id to automate.
   */
  function hireManager(id: string) {
    const automationEvent = automateVenture(state, id).event;
    setState((current) => automateVenture(current, id).state);

    if (automationEvent?.kind === "layoff") {
      setToast({
        id: Date.now(),
        message: `Congratulations. You laid off ${automationEvent.count.toLocaleString()} ${
          automationEvent.count === 1 ? "person" : "people"
        } from ${automationEvent.ventureName}.`
      });
      return;
    }

    if (automationEvent?.kind === "annotation") {
      setToast({
        id: Date.now(),
        message: `${automationEvent.ventureName} management automated. Employees stay assigned to data annotation.`
      });
    }
  }

  /**
   * Purchases a Zusk lever upgrade.
   *
   * @param id - The upgrade id to purchase.
   */
  function buyUpgrade(id: string) {
    setState((current) => buyUpgradeState(current, id));
  }

  /**
   * Starts dating the currently offered relationship prospect.
   *
   * @param id - The wife choice id to date.
   */
  function startDating(id: string) {
    setState((current) => startDatingState(current, id));
  }

  /**
   * Converts the active dating relationship into a marriage.
   */
  function acceptMarriage() {
    setState(acceptMarriageState);
  }

  /**
   * Refuses the current dating relationship and records the breakup.
   */
  function refuseWife() {
    setState(refuseWifeState);
  }

  /**
   * Purchases a lifestyle asset that can reduce relationship pressure.
   *
   * @param id - The lifestyle asset id to purchase.
   */
  function buyLifestyleAsset(id: string) {
    setState((current) => buyLifestyleAssetState(current, id));
  }

  /**
   * Resets the game while banking currently available prestige.
   */
  function resetForPrestige() {
    setState((current) => resetForPrestigeState(current, availablePrestige));
  }

  /**
   * Opens a top-navigation modal and closes the dropdown menu.
   *
   * @param nextModal - The modal to show.
   */
  function openModal(nextModal: "options" | "reset") {
    setModal(nextModal);
    setIsMenuOpen(false);
  }

  /**
   * Starts a brand-new run from the menu and clears any existing local save.
   */
  function startNewGame() {
    clearSavedGames();
    setState(createInitialState());
    setHasSave(false);
    setOpenBudgetId(null);
    setOpenEmployeesId(null);
    setActiveTab("operations");
    setModal(null);
    setScreen("playing");
  }

  /**
   * Continues the hydrated local save from the menu.
   */
  function continueGame() {
    if (!hasSave) return;
    setScreen("playing");
  }

  /**
   * Clears local saves and returns the game to a brand-new state.
   */
  function resetGame() {
    const fresh = createInitialState();
    clearSavedGames();
    setState(fresh);
    setHasSave(false);
    setOpenBudgetId(null);
    setOpenEmployeesId(null);
    setActiveTab("operations");
    setModal(null);
    setToast({
      id: Date.now(),
      message: "Game reset. Marlon Zusk is back at the beginning."
    });
  }

  if (screen === "menu") {
    return (
      <>
        <main className="start-menu" aria-label="AI Capitalist start menu">
          <div className="start-menu-content">
            <Image
              className="start-menu-logo"
              src="/images/branding/zusk-logo.webp"
              alt=""
              width={118}
              height={118}
              priority
              unoptimized
            />
            <p className="eyebrow">Job Killer</p>
            <h1>AI Capitalist</h1>
            <p className="start-menu-copy">
              Marlon Zusk is ready to automate the workforce, scale Zusk, and convert displaced staff into data
              annotation fuel.
            </p>
            <div className="start-menu-actions">
              <Button disabled={!loaded} onClick={startNewGame} type="button" variant="dark">
                <Play size={18} />
                Start Game
              </Button>
              <Button disabled={!loaded || !hasSave} onClick={continueGame} type="button">
                <RefreshCcw size={18} />
                Continue
              </Button>
              <Button onClick={() => openModal("options")} type="button">
                <Settings size={18} />
                Options
              </Button>
            </div>
          </div>
        </main>

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
                  <small>{hasSave ? "A local save is available to continue." : "No local save found."}</small>
                </span>
              </div>
            </div>
          </Modal>
        ) : null}
      </>
    );
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
        <div className="hero-character" aria-hidden>
          <Image
            src="/images/branding/marlon-zusk-character.webp"
            alt=""
            width={180}
            height={220}
            priority
            unoptimized
          />
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

/**
 * Removes the current and legacy local save keys from the browser.
 */
function clearSavedGames() {
  localStorage.removeItem(SAVE_KEY);
  LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));
}
