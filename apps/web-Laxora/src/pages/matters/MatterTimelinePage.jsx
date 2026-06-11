import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadMatterTimeline } from "../../api/matterTabs";
import { MatterTabShell, SectionIssues, TimelineList } from "../../components/matters/MatterTabWidgets";

export function MatterTimelinePage() {
  const { matterId } = useParams();
  const [state, setState] = useState({ loading: true, error: "", matter: null, timeline: [], issues: [] });

  async function load() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loadMatterTimeline(matterId);
      setState({ loading: false, error: "", ...data });
    } catch (error) {
      setState({ loading: false, error: error?.userMessage || "We could not load this matter right now.", matter: null, timeline: [], issues: [] });
    }
  }

  useEffect(() => {
    load();
  }, [matterId]);

  return (
    <MatterTabShell activeTab="timeline" error={state.error} loading={state.loading} matter={state.matter} onRetry={load}>
      <SectionIssues issues={state.issues} />
      <TimelineList items={state.timeline} />
    </MatterTabShell>
  );
}
