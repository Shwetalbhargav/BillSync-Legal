import { useEffect, useMemo, useState } from "react";
import { communicationsWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  CommunicationHero,
  CommunicationLogs,
  InboxShell,
  ProviderCards,
  ProviderNotConnected,
  SectionIssues,
  SetupSteps,
  TemplateTable,
} from "../../components/communications/CommunicationWidgets";

const initialState = {
  status: "loading",
  providers: [],
  whatsappTemplates: [],
  smsTemplates: [],
  logs: [],
  issues: [],
  message: "",
};

export function CommunicationCenterPage({ view = "center" }) {
  const [state, setState] = useState(initialState);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await communicationsWorkspaceApi.loadCenter();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ ...initialState, status: "error", message: error?.userMessage || "We could not load communications right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const title = useMemo(() => {
    if (view === "whatsapp") return "WhatsApp communications";
    if (view === "sms") return "SMS communications";
    if (view === "logs") return "Communication logs";
    return "Communication center";
  }, [view]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Communications need attention" message={state.message} actionLabel="Retry" />;

  const templates = view === "sms" ? state.smsTemplates : state.whatsappTemplates;

  return (
    <div className="space-y-6">
      <CommunicationHero title={title} />
      <SectionIssues issues={state.issues} />
      <ProviderNotConnected channel={view === "sms" ? "SMS" : view === "whatsapp" ? "WhatsApp" : "Messaging"} />
      <ProviderCards providers={state.providers} />
      {view === "logs" ? (
        <section className="surface-card p-5">
          <h2 className="text-xl font-bold text-primary">Communication logs</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Delivery, replies, and failed attempts will appear here after providers are connected.</p>
          <div className="mt-4">
            <CommunicationLogs logs={state.logs} />
          </div>
        </section>
      ) : (
        <>
          <InboxShell channel={view === "sms" ? "SMS" : "WhatsApp"} templates={templates} />
          <section className="surface-card p-5">
            <h2 className="text-xl font-bold text-primary">{view === "sms" ? "SMS templates" : "WhatsApp templates"}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Templates are visible for planning only until provider approval is connected.</p>
            <div className="mt-4">
              <TemplateTable templates={templates} />
            </div>
          </section>
        </>
      )}
      <SetupSteps />
    </div>
  );
}
