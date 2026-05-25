import { BriefcaseBusiness, CircleDashed, UserRoundCheck, UserX } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Employee, GameState } from "@/lib/game";
import { formatMoney } from "@/lib/game";

const workerPageSize = 8;

type WorkerRow = {
  employee: Employee;
  job: string;
  status: "Employed" | "Unemployed";
  statusIcon: typeof UserRoundCheck;
};

export function WorkersPanel({ state }: { state: GameState }) {
  const [page, setPage] = useState(0);
  const activeWorkers: WorkerRow[] = state.ventures.flatMap((venture) =>
    [venture.manager, ...venture.employees].filter((employee): employee is Employee => Boolean(employee)).map((employee) => ({
      employee,
      job: venture.name,
      status: "Employed" as const,
      statusIcon: UserRoundCheck
    }))
  );
  const unemployedWorkers: WorkerRow[] = state.unemployed.map((employee) => ({
    employee,
    job: employee.formerVenture ? `Formerly ${employee.formerVenture}` : "Awaiting assignment",
    status: "Unemployed" as const,
    statusIcon: UserX
  }));
  const workers = [...activeWorkers, ...unemployedWorkers];
  const pageCount = Math.max(1, Math.ceil(workers.length / workerPageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleWorkers = workers.slice(currentPage * workerPageSize, currentPage * workerPageSize + workerPageSize);

  return (
    <Panel as="section" className="workers-panel" aria-label="Workers">
      <SectionHeader icon={<BriefcaseBusiness size={20} />} title="Workers" />
      {workers.length > 0 ? (
        <>
          <div className="worker-list">
            {visibleWorkers.map(({ employee, job, status, statusIcon: StatusIcon }) => (
              <div className="worker-row" key={`${status}-${employee.id}`}>
                <span className="worker-name">
                  <strong>{employee.name}</strong>
                  <small>{employee.role}</small>
                </span>
                <span className="worker-status">
                  <StatusIcon size={16} />
                  {status}
                </span>
                <span className="worker-job">{job}</span>
                <span className="worker-cost">{formatMoney(employee.salary + employee.benefits)} / cycle</span>
              </div>
            ))}
          </div>
          <PaginationControls
            currentPage={currentPage}
            itemCount={workers.length}
            onPageChange={setPage}
            pageCount={pageCount}
            pageSize={workerPageSize}
          />
        </>
      ) : (
        <p className="empty-budget">
          <CircleDashed size={16} />
          No workers yet.
        </p>
      )}
    </Panel>
  );
}

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
