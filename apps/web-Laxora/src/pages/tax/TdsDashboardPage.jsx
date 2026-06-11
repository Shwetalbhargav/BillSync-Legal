import { useEffect, useState } from "react";
import { taxWorkspaceApi } from "../../api";
import { StateCard } from "../../components/common";
import { TaxHero, TdsNotConfigured, TdsReadinessCards } from "../../components/tax/TaxWidgets";

export function TdsDashboardPage() {
  const [state, setState] = useState({ status: "loading", message: "" });

  useEffect(() => {
    async function load() {
      setState({ status: "loading", message: "" });
      try {
        await taxWorkspaceApi.loadTds();
        setState({ status: "ready", message: "" });
      } catch (error) {
        setState({ status: "not-ready", message: error?.message || "TDS setup is not turned on yet." });
      }
    }
    load();
  }, []);

  if (state.status === "loading") {
    return <StateCard state="loading" title="Checking TDS setup" message="We are checking whether deduction setup is available for this workspace." />;
  }

  return (
    <div className="space-y-6">
      <TaxHero mode="tds" />
      <TdsNotConfigured message={state.message} />
      <TdsReadinessCards />
    </div>
  );
}
