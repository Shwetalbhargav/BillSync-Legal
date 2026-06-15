import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { normalizeWorkSession } from "../../api/normalizers";
import { workSessionsApi } from "../../api/workSessions";
import { SkeletonBlock, StateCard } from "../../components/common";
import { AppUsageTimeline, IdleMarkers, WorkSessionDetailPanel } from "../../components/work/WorkCaptureWidgets";

function unwrap(response) {
  return response?.data || response;
}

export function WorkSessionDetailPage() {
  const { sessionId } = useParams();
  const [state, setState] = useState({ status: "loading", session: null, message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const response = await workSessionsApi.get(sessionId);
      setState({ status: "ready", session: normalizeWorkSession(unwrap(response)), message: "" });
    } catch (error) {
      setState({ status: "error", session: null, message: error?.userMessage || "We could not load this work session." });
    }
  }

  useEffect(() => {
    load();
  }, [sessionId]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Work session needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary hover:underline" to="/app/work-sessions">
        <ArrowLeft className="h-4 w-4" />
        Back to work sessions
      </Link>
      <WorkSessionDetailPanel session={state.session} />
      <IdleMarkers intervals={state.session.idleIntervals} />
      <AppUsageTimeline sessions={[state.session]} />
    </div>
  );
}
