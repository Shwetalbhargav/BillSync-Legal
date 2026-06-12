import { useEffect, useMemo, useState } from "react";
import { cloudIntegrationsApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  CloudDocumentTable,
  CloudProviderCards,
  CloudProviderHero,
  CloudProviderNotConnected,
  ProviderRequirementGrid,
  SectionIssues,
  SetupModePanel,
} from "../../components/integrations/CloudProviderWidgets";

const initialState = {
  status: "loading",
  providers: [],
  documents: [],
  issues: [],
  message: "",
};

function providerIdForView(view) {
  if (view === "google") return "google_drive";
  if (view === "aws") return "s3";
  return "";
}

function titleForView(view) {
  if (view === "google") return "Google Drive setup";
  if (view === "aws") return "AWS firm storage setup";
  return "AWS and Google integrations";
}

export function CloudIntegrationsPage({ view = "overview" }) {
  const [state, setState] = useState(initialState);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await cloudIntegrationsApi.loadWorkspace();
      setState({ ...initialState, ...data, status: "ready" });
    } catch (error) {
      setState({ ...initialState, status: "error", message: error?.userMessage || "We could not load cloud storage setup right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const providerId = providerIdForView(view);
  const provider = useMemo(() => state.providers.find((item) => item.id === providerId), [providerId, state.providers]);
  const title = useMemo(() => titleForView(view), [view]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Cloud storage setup needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <CloudProviderHero title={title} />
      <SectionIssues issues={state.issues} />
      <CloudProviderNotConnected providerName={provider?.name || "Cloud storage"} />

      {view === "overview" ? (
        <>
          <CloudProviderCards providers={state.providers} />
          <section className="surface-card p-5">
            <h2 className="text-xl font-bold text-primary">Cloud storage records</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Review saved document records that already point to cloud providers.</p>
            <div className="mt-4">
              <CloudDocumentTable documents={state.documents} />
            </div>
          </section>
        </>
      ) : (
        <>
          <SetupModePanel provider={provider} />
          <ProviderRequirementGrid provider={provider} />
          <section className="surface-card p-5">
            <h2 className="text-xl font-bold text-primary">{provider?.name || "Provider"} document records</h2>
            <p className="mt-1 text-sm leading-6 text-muted">These are saved references only until direct file movement is connected.</p>
            <div className="mt-4">
              <CloudDocumentTable documents={state.documents} providerId={providerId} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
