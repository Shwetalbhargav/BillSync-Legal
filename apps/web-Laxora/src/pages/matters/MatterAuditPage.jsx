import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadMatterAudit } from "../../api/matterTabs";
import { AuditList, MatterTabShell, SectionIssues } from "../../components/matters/MatterTabWidgets";
import { useMatterModuleAccess } from "./useMatterModuleAccess";

export function MatterAuditPage() {
  const { matterId } = useParams();
  const access = useMatterModuleAccess();
  const [state, setState] = useState({ loading: true, error: "", matter: null, logs: [], documentEvents: [], activityEvents: [], issues: [] });

  async function load() {
    if (access.unavailable || !access.canRead) {
      setState((current) => ({ ...current, loading: false, error: access.message || "You do not have access to this matter." }));
      return;
    }
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loadMatterAudit(matterId);
      setState({ loading: false, error: "", ...data });
    } catch (error) {
      setState({
        loading: false,
        error: error?.status === 403 ? "You do not have access to this matter." : (error?.userMessage || "We could not load this matter right now."),
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
  }, [matterId, access.status, access.unavailable, access.canRead]);

  return (
    <MatterTabShell activeTab="audit" error={state.error} loading={state.loading} matter={state.matter} onRetry={load}>
      <SectionIssues issues={state.issues} />
      <AuditList activityEvents={state.activityEvents} documentEvents={state.documentEvents} logs={state.logs} />
    </MatterTabShell>
  );
}
