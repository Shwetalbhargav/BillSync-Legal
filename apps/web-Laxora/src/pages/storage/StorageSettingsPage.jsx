import { useEffect, useState } from "react";
import { storageWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import { ProviderCards, ProviderNotConnected, SectionIssues, StorageHero } from "../../components/storage/StorageWidgets";
import { useDocumentModuleAccess } from "./useDocumentModuleAccess";

export function StorageSettingsPage() {
  const access = useDocumentModuleAccess();
  const [state, setState] = useState({ status: "loading", providers: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await storageWorkspaceApi.loadLibrary();
      setState({ status: "ready", providers: data.providers, issues: data.issues, message: "" });
    } catch (error) {
      setState({ status: "error", providers: [], issues: [], message: error?.userMessage || "We could not load storage settings right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Storage settings are not available" message={access.message} />;
  if (!access.canRead) return <StateCard state="permission" title="Storage settings are not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Storage settings need attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <StorageHero canCreate={access.canCreate} title="Storage settings" />
      <SectionIssues issues={state.issues} />
      <ProviderNotConnected />
      <ProviderCards providers={state.providers} />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Setup steps</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["Connect provider", "Choose matter folder rules", "Enable document transfer"].map((step) => (
            <div className="rounded-lg border border-border p-4" key={step}>
              <p className="font-bold text-ink">{step}</p>
              <p className="mt-1 text-sm leading-6 text-muted">This step will be enabled as provider setup is completed.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
