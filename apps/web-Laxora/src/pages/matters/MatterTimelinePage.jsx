import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadMatterTimeline } from "../../api/matterTabs";
import { MatterTabShell, SectionIssues, TimelineList } from "../../components/matters/MatterTabWidgets";
import { useMatterModuleAccess } from "./useMatterModuleAccess";

export function MatterTimelinePage() {
  const { matterId } = useParams();
  const access = useMatterModuleAccess();
  const [state, setState] = useState({ loading: true, error: "", matter: null, timeline: [], issues: [] });

  async function load() {
    if (access.unavailable || !access.canRead) {
      setState((current) => ({ ...current, loading: false, error: access.message || "You do not have access to this matter." }));
      return;
    }
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loadMatterTimeline(matterId);
      setState({ loading: false, error: "", ...data });
    } catch (error) {
      setState({ loading: false, error: error?.status === 403 ? "You do not have access to this matter." : (error?.userMessage || "We could not load this matter right now."), matter: null, timeline: [], issues: [] });
    }
  }

  useEffect(() => {
    load();
  }, [matterId, access.status, access.unavailable, access.canRead]);

  return (
    <MatterTabShell activeTab="timeline" error={state.error} loading={state.loading} matter={state.matter} onRetry={load}>
      <SectionIssues issues={state.issues} />
      <TimelineList items={state.timeline} />
    </MatterTabShell>
  );
}
