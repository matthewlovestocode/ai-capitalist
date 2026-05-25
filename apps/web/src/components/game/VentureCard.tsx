import {
  Lock,
  Play,
  Plus,
  ReceiptText,
  UserCheck,
  UserRound,
  Users
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { VentureCycleStatus } from "@/components/game/VentureCycleStatus";
import type { GameState, Venture } from "@/lib/game";
import {
  formatMoney,
  multiplierFor,
  ventureComputeCosts,
  ventureCycleMs,
  ventureCost,
  ventureGrossRevenue,
  venturePayroll,
  ventureRevenue
} from "@/lib/game";

const ventureEmployeePageSize = 6;

type VentureCardProps = {
  cash: number;
  isBudgetOpen: boolean;
  isEmployeesOpen: boolean;
  isLocked: boolean;
  onBuy: (id: string) => void;
  onHireManager: (id: string) => void;
  onStart: (id: string) => void;
  onToggleBudget: (id: string) => void;
  onToggleEmployees: (id: string) => void;
  state: GameState;
  venture: Venture;
};

/**
 * Renders one venture with progress, expansion, automation, budget, and employee controls.
 *
 * @param props - Venture state, player cash, open panels, lock state, and action callbacks.
 * @returns A venture card for the active venture tab.
 */
export function VentureCard({
  cash,
  isBudgetOpen,
  isEmployeesOpen,
  isLocked,
  onBuy,
  onHireManager,
  onStart,
  onToggleBudget,
  onToggleEmployees,
  state,
  venture
}: VentureCardProps) {
  const [employeePage, setEmployeePage] = useState(0);
  const cost = ventureCost(venture);
  const grossRevenue = ventureGrossRevenue(state, venture);
  const payroll = venturePayroll(venture);
  const computeCosts = ventureComputeCosts(venture);
  const usesComputeBudget = venture.automated && venture.category === "operations";
  const revenue = ventureRevenue(state, venture);
  const cycleMs = ventureCycleMs(venture);
  const canBuy = !isLocked && cash >= cost;
  const canStart = !isLocked && venture.owned > 0 && venture.progress === 0;
  const budgetEmployees = venture.manager ? [venture.manager, ...venture.employees] : venture.employees;
  const employeePageCount = Math.max(1, Math.ceil(budgetEmployees.length / ventureEmployeePageSize));
  const currentEmployeePage = Math.min(employeePage, employeePageCount - 1);
  const visibleEmployees = budgetEmployees.slice(
    currentEmployeePage * ventureEmployeePageSize,
    currentEmployeePage * ventureEmployeePageSize + ventureEmployeePageSize
  );
  const budgetGroups = summarizeCompensation(budgetEmployees);
  const activeEmployees = budgetEmployees.length;
  const ventureImage = ventureImages[venture.id];

  return (
    <Panel as="article" className={`venture-card${isLocked ? " venture-card-locked" : ""}`}>
      <div className="venture-card-layout">
        <div className="venture-art-frame" aria-hidden>
          {ventureImage ? (
            <Image className="venture-art" src={ventureImage} alt="" width={160} height={160} unoptimized />
          ) : null}
        </div>
        <div className="venture-main">
          <div className="venture-heading">
            <div className="venture-title-row">
              <div>
                <h2>{venture.name}</h2>
                <p>
                  {isLocked ? (
                    "Locked until nearby ventures are automated"
                  ) : (
                    <>
                      {activeEmployees} active {activeEmployees === 1 ? "employee" : "employees"} ·{" "}
                      {formatMoney(revenue)} net / cycle · {(cycleMs / 1000).toFixed(1)}s · x
                      {multiplierFor(state, venture.id).toFixed(2)}
                      {venture.lastPayout ? ` · last +${formatMoney(venture.lastPayout)}` : ""}
                    </>
                  )}
                </p>
              </div>
            </div>
            {isLocked ? (
              <span className="locked-badge">
                <Lock size={14} />
                Locked
              </span>
            ) : null}
            <Button
              aria-disabled={!canStart}
              aria-label={`${venture.action} ${venture.name}`}
              onClick={() => onStart(venture.id)}
              variant="icon"
            >
              <Play size={18} />
            </Button>
          </div>
          <VentureCycleStatus isLocked={isLocked} venture={venture} />
          <div className="venture-actions">
            <Button className="venture-action-button expand-button" onClick={() => onBuy(venture.id)} disabled={!canBuy}>
              <Plus size={15} />
              <span className="button-label">Expand</span>
              <span className="button-value">{formatMoney(cost)}</span>
            </Button>
            <Button
              aria-expanded={isBudgetOpen}
              className="venture-action-button budget-button"
              disabled={isLocked}
              onClick={() => onToggleBudget(venture.id)}
              type="button"
            >
              <ReceiptText size={15} />
              <span className="button-label">Budget</span>
            </Button>
            <Button
              aria-expanded={isEmployeesOpen}
              className="venture-action-button employees-button"
              disabled={isLocked}
              onClick={() => onToggleEmployees(venture.id)}
              type="button"
            >
              <Users size={15} />
              <span className="button-label">Employees</span>
            </Button>
            <Button
              className="venture-action-button automate-button"
              onClick={() => onHireManager(venture.id)}
              disabled={isLocked || venture.automated || cash < venture.managerCost}
            >
              <UserCheck size={15} />
              <span className="button-label">{venture.automated ? "Auto" : "Automate"}</span>
              {!venture.automated ? <span className="button-value">{formatMoney(venture.managerCost)}</span> : null}
            </Button>
          </div>
          {isBudgetOpen ? (
            <div className="budget-panel">
              <div className="budget-summary">
                <span>Gross {formatMoney(grossRevenue)}</span>
                <span>
                  {usesComputeBudget ? "Compute" : "Payroll"}{" "}
                  {formatMoney(usesComputeBudget ? computeCosts.total : payroll)}
                </span>
                <strong>Net {formatMoney(revenue)}</strong>
              </div>
              {usesComputeBudget ? (
                <div className="budget-group-list">
                  <div className="budget-group-row">
                    <span>
                      <strong>GPU inference and training runs</strong>
                      <small>{venture.owned.toLocaleString()} automated capacity units</small>
                    </span>
                    <span>Compute {formatMoney(computeCosts.compute)}</span>
                    <span>Overhead {formatMoney(computeCosts.overhead)}</span>
                    <b>Total {formatMoney(computeCosts.total)}</b>
                  </div>
                </div>
              ) : budgetGroups.length > 0 ? (
                <div className="budget-group-list">
                  {budgetGroups.map((group) => (
                    <div className="budget-group-row" key={group.key}>
                      <span>
                        <strong>{group.role}</strong>
                        <small>
                          {group.level} · {group.count} {group.count === 1 ? "person" : "people"} · Avg salary{" "}
                          {formatMoney(group.salary / group.count)}
                        </small>
                      </span>
                      <span>Salary {formatMoney(group.salary)}</span>
                      <span>Benefits {formatMoney(group.benefits)}</span>
                      <b>Total {formatMoney(group.salary + group.benefits)}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-budget">
                  {venture.automated && venture.category === "operations"
                    ? "Automated. Former employees moved to the unemployment pool."
                    : "No payroll yet."}
                </p>
              )}
            </div>
          ) : null}
          {isEmployeesOpen ? (
            <div className="budget-panel employees-panel">
              <div className="detail-panel-heading">
                <UserRound size={16} />
                <strong>Employees</strong>
                <span>{budgetEmployees.length.toLocaleString()} active</span>
              </div>
              {budgetEmployees.length > 0 ? (
                <>
                  <div className="employee-list">
                    {visibleEmployees.map((employee) => (
                      <div className="employee-row" key={employee.id}>
                        <span>
                          <strong>{employee.name}</strong>
                          <small>
                            {employee.level === "manager" ? "Manager" : "Worker"} · {employee.role} · Salary{" "}
                            {formatMoney(employee.salary)} · Benefits {formatMoney(employee.benefits)}
                          </small>
                        </span>
                        <b>{formatMoney(employee.salary + employee.benefits)}</b>
                      </div>
                    ))}
                  </div>
                  <PaginationControls
                    currentPage={currentEmployeePage}
                    itemCount={budgetEmployees.length}
                    onPageChange={setEmployeePage}
                    pageCount={employeePageCount}
                    pageSize={ventureEmployeePageSize}
                  />
                </>
              ) : (
                <p className="empty-budget">
                  {venture.automated && venture.category === "operations"
                    ? "Automated. Former employees moved to the unemployment pool."
                    : "No employees assigned."}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

/**
 * Renders compact pagination controls for a venture employee list.
 *
 * @param props - Current page, total item count, page size, and page change callback.
 * @returns Pagination buttons when more than one page exists, otherwise null.
 */
function PaginationControls({
  currentPage,
  itemCount,
  onPageChange,
  pageCount,
  pageSize
}: {
  currentPage: number;
  itemCount: number;
  onPageChange: (page: number) => void;
  pageCount: number;
  pageSize: number;
}) {
  const start = currentPage * pageSize + 1;
  const end = Math.min(itemCount, (currentPage + 1) * pageSize);

  if (pageCount <= 1) return null;

  return (
    <div className="pagination-controls">
      <Button disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)} type="button">
        Prev
      </Button>
      <span>
        {start}-{end} of {itemCount}
      </span>
      <Button disabled={currentPage >= pageCount - 1} onClick={() => onPageChange(currentPage + 1)} type="button">
        Next
      </Button>
    </div>
  );
}

/**
 * Groups employees by hierarchy level and role for budget summaries.
 *
 * @param employees - Employees assigned to a venture budget.
 * @returns Sorted compensation totals by role, with managers listed first.
 */
function summarizeCompensation(employees: Venture["employees"]) {
  const groups = new Map<
    string,
    {
      benefits: number;
      count: number;
      key: string;
      level: string;
      role: string;
      salary: number;
    }
  >();

  employees.forEach((employee) => {
    const level = employee.level === "manager" ? "Manager" : "Worker";
    const key = `${level}-${employee.role}`;
    const current = groups.get(key) ?? {
      benefits: 0,
      count: 0,
      key,
      level,
      role: employee.role,
      salary: 0
    };

    current.count += 1;
    current.salary += employee.salary;
    current.benefits += employee.benefits;
    groups.set(key, current);
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.level !== b.level) return a.level === "Manager" ? -1 : 1;
    return a.role.localeCompare(b.role);
  });
}

const ventureImages: Record<string, string> = {
  "agent-rollout": "/images/ventures/zuskoffice-copilot.webp",
  "code-review": "/images/ventures/code-answer-review.webp",
  "content-labeling": "/images/ventures/compare-rate-shopping.webp",
  datacenter: "/images/ventures/compute-cathedral.webp",
  enterprise: "/images/ventures/enterprise-zusk-license.webp",
  "eval-suite": "/images/ventures/zuskcode-assistant.webp",
  "executive-alignment": "/images/ventures/domain-evaluation-queue.webp",
  "government-contract": "/images/ventures/government-zusk-mandate.webp",
  "image-captions": "/images/ventures/helpfulness-rating.webp",
  layoffs: "/images/ventures/zuskagent-sdk.webp",
  "legal-redlines": "/images/ventures/policy-edge-case-review.webp",
  "meeting-transcripts": "/images/ventures/chat-quality-audit.webp",
  model: "/images/ventures/zuskchat-llm.webp",
  "planetary-platform": "/images/ventures/planetary-zusk-platform.webp",
  rlhf: "/images/ventures/image-generation-review.webp",
  "robot-campus": "/images/ventures/humanoid-office-campus.webp",
  "safety-ratings": "/images/ventures/fact-check-models.webp"
};
