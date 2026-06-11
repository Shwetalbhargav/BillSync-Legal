import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadMatterAudit } from "../../api/matterTabs";
import { AuditList, MatterTabShell, SectionIssues } from "../../components/matters/MatterTabWidgets";

export function MatterAuditPage() {
  const { matterId } = useParams();
  const [state, setState] = useState({ loading: true, error: "", matter: null, logs: [], documentEvents: [], activityEvents: [], issues: [] });

  async function load() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loadMatterAudit(matterId);
      setState({ loading: false, error: "", ...data });
    } catch (error) {
      setState({
        loading: false,
        error: error?.userMessage || "We could not load this matter right now.",
        matter: null,
        logs: [],
        documentEvents: [],
        activityEvents: [],
        issues: [],
      });
    }
  }

  useEffect(() => {
    load();
  }, [matterId]);

  return (
    <MatterTabShell activeTab="audit" error={state.error} loading={state.loading} matter={state.matter} onRetry={load}>
      <SectionIssues issues={state.issues} />
      <AuditList activityEvents={state.activityEvents} documentEvents={state.documentEvents} logs={state.logs} />
    </MatterTabShell>
  );
}
