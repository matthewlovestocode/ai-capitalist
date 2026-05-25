import { Clock3, Gauge, Pause } from "lucide-react";
import { formatDuration, ventureProgressRatio, ventureRemainingMs, type Venture } from "@/lib/game";

/**
 * Displays a compact venture cycle state with countdown-first timing.
 *
 * @param props - Venture timing state and locked state.
 * @returns A countdown status row for the venture card.
 */
export function VentureCycleStatus({ isLocked, venture }: { isLocked: boolean; venture: Venture }) {
  const isRunning = venture.owned > 0 && (venture.automated || venture.progress > 0);
  const remainingMs = ventureRemainingMs(venture);
  const progressPercent = ventureProgressRatio(venture) * 100;

  if (isLocked) {
    return (
      <div className="cycle-status cycle-status-muted">
        <Pause size={15} />
        <span>Locked</span>
      </div>
    );
  }

  if (!isRunning) {
    return (
      <div className="cycle-status cycle-status-muted">
        <Clock3 size={15} />
        <span>{venture.owned > 0 ? "Ready" : "Not started"}</span>
      </div>
    );
  }

  return (
    <div className="cycle-status">
      <Gauge size={15} />
      <span>{venture.automated ? "Auto cycle" : "Manual cycle"}</span>
      <strong>{formatDuration(remainingMs)}</strong>
      <div className="cycle-meter" aria-hidden>
        <span style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}
