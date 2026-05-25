import { Car, Gem, Heart, Home, Plane, Ship, ShoppingBag, Ticket, Watch } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  currentDatingPressure,
  currentLifestylePressure,
  formatMoney,
  GameState,
  LifestyleAssetCategory,
  lifestyleAssets,
  nextWifeOffer,
  WifeChoice,
  wifeChoices
} from "@/lib/game";

const assetTabs: { id: LifestyleAssetCategory; label: string; icon: typeof Car }[] = [
  { id: "cars", label: "Cars", icon: Car },
  { id: "houses", label: "Houses", icon: Home },
  { id: "boats", label: "Boats", icon: Ship },
  { id: "jewelry", label: "Jewelry", icon: Watch },
  { id: "trips", label: "Trips", icon: Ticket },
  { id: "planes", label: "Planes", icon: Plane }
];

export function LifestylePanel({
  onAcceptMarriage,
  onBuyAsset,
  onRefuseWife,
  onStartDating,
  state
}: {
  onAcceptMarriage: () => void;
  onBuyAsset: (id: string) => void;
  onRefuseWife: () => void;
  onStartDating: (id: string) => void;
  state: GameState;
}) {
  const [activeAssetTab, setActiveAssetTab] = useState<LifestyleAssetCategory>("cars");
  const selectedWife = wifeChoices.find((wife) => wife.id === state.selectedWifeId);
  const datingWife = wifeChoices.find((wife) => wife.id === state.datingWifeId);
  const offer = nextWifeOffer(state);
  const ownedLifestyleAssetIds = state.ownedLifestyleAssetIds ?? [];
  const pressure = currentLifestylePressure(state);
  const datingPressure = currentDatingPressure(state);

  return (
    <div className="lifestyle-layout">
      <Panel as="section" className="lifestyle-panel">
        <SectionHeader icon={<Heart size={20} />} title="Dating Offers" />
        <div className="relationship-status">
          <span>Relationship</span>
          <strong>{selectedWife?.name ?? datingWife?.name ?? "Single"}</strong>
          <small>
            {selectedWife
              ? "Married. Full asset pressure is active."
              : datingWife
                ? `${formatMoney(datingPressure)} / sec pressure to marry.`
                : offer
                  ? `${offer.name} wants to date Marlon.`
                  : "No offer yet. Grow lifetime profit to attract the next prospect."}
          </small>
        </div>
        {datingWife ? (
          <div className="relationship-actions">
            <Button onClick={onAcceptMarriage} type="button" variant="dark">
              Marry {datingWife.name}
            </Button>
            <Button onClick={onRefuseWife} type="button">
              Refuse and break up
            </Button>
          </div>
        ) : null}
        <div className="wife-grid">
          {wifeChoices.map((wife) => (
            <WifeCard
              isDating={wife.id === state.datingWifeId}
              isLocked={state.lifetimeEarnings < wife.minLifetimeProfit || state.refusedWifeIds.includes(wife.id)}
              isOffered={offer?.id === wife.id}
              isSelected={wife.id === state.selectedWifeId}
              key={wife.id}
              onStartDating={onStartDating}
              wife={wife}
            />
          ))}
        </div>
      </Panel>

      <Panel as="section" className="lifestyle-panel">
        <SectionHeader icon={<Gem size={20} />} title="Asset Pressure" />
        <div className="pressure-summary">
          <span>Selected wife</span>
          <strong>{selectedWife?.name ?? "None"}</strong>
          <small>{formatMoney(pressure)} / sec pressure from unmet interests</small>
        </div>
        <div className="asset-tab-bar" role="tablist" aria-label="Asset categories">
          {assetTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAssetTab === tab.id;

            return (
              <button
                aria-selected={isActive}
                key={tab.id}
                onClick={() => setActiveAssetTab(tab.id)}
                role="tab"
                type="button"
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="asset-list">
          {lifestyleAssets.filter((asset) => asset.category === activeAssetTab).map((asset) => {
            const owned = ownedLifestyleAssetIds.includes(asset.id);
            const wanted = selectedWife?.interests.includes(asset.interest) ?? false;

            return (
              <Button
                className={`asset-row${wanted ? " asset-row-wanted" : ""}`}
                disabled={owned || state.cash < asset.cost}
                key={asset.id}
                onClick={() => onBuyAsset(asset.id)}
                type="button"
              >
                <ShoppingBag size={16} />
                <span>
                  <strong>{asset.name}</strong>
                  <small>
                    {asset.interest} · relief {asset.pressureRelief}
                    {wanted ? " · wanted" : ""}
                  </small>
                </span>
                <b>{owned ? "Owned" : formatMoney(asset.cost)}</b>
              </Button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function WifeCard({
  isDating,
  isLocked,
  isOffered,
  isSelected,
  onStartDating,
  wife
}: {
  isDating: boolean;
  isLocked: boolean;
  isOffered: boolean;
  isSelected: boolean;
  onStartDating: (id: string) => void;
  wife: WifeChoice;
}) {
  return (
    <button
      aria-pressed={isSelected || isDating}
      className="wife-card"
      disabled={!isOffered}
      onClick={() => onStartDating(wife.id)}
      type="button"
    >
      <span>
        <strong>{wife.name}</strong>
        <small>{wife.description}</small>
      </span>
      <b>Materialism {wife.materialism}/10</b>
      <b>Requires {formatMoney(wife.minLifetimeProfit)} lifetime profit</b>
      <em>{wife.interests.join(" · ")}</em>
      <em>{isSelected ? "Married" : isDating ? "Dating" : isOffered ? "Offer available" : isLocked ? "Locked or refused" : ""}</em>
    </button>
  );
}
