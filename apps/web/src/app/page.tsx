import { GameApp } from "@/components/game/GameApp";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const modal = typeof params?.modal === "string" ? params.modal : null;
  const initialModal = modal === "options" || modal === "reset" ? modal : null;
  const tab = typeof params?.tab === "string" ? params.tab : null;
  const initialTab = tab === "annotation" || tab === "workers" || tab === "lifestyle" ? tab : "operations";
  const initialUpgradeDrawerOpen = params?.drawer === "upgrades";
  const initialBudgetId = typeof params?.budget === "string" ? params.budget : null;
  const initialEmployeesId = typeof params?.employees === "string" ? params.employees : null;

  return (
    <GameApp
      initialBudgetId={initialBudgetId}
      initialEmployeesId={initialEmployeesId}
      initialModal={initialModal}
      initialTab={initialTab}
      initialUpgradeDrawerOpen={initialUpgradeDrawerOpen}
    />
  );
}
