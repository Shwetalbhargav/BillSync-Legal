import { useEffect, useMemo, useState } from "react";
import { courtSyncApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  CourtMatchPanel,
  CourtSettingsShell,
  CourtNewsroomFeed,
  CourtNewsroomHero,
  VerdictDetailShell,
} from "../../components/court/CourtSyncWidgets";

const initialState = {
  status: "loading",
  hearings: [],
  hearingTimeEntries: [],
  matters: [],
  courtItems: [],
  matches: [],
  verdicts: [],
  sources: [],
  jobs: [],
  stats: {},
  setupSteps: [],
  readiness: [],
  issues: [],
  message: "",
  isRefreshing: false,
};

export function CourtSyncPage({ view = "dashboard" }) {
  const [state, setState] = useState(initialState);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await courtSyncApi.loadWorkspace();
      setState({ ...initialState, ...data, status: "ready" });
    } catch (error) {
      setState({
        ...initialState,
        status: "error",
        message: error?.userMessage || "We could not load court sync right now.",
      });
    }
  }

  async function runSync() {
    setState((current) => ({ ...current, isRefreshing: true, message: "" }));
    try {
      await courtSyncApi.runDailySync();
      const data = await courtSyncApi.loadWorkspace();
      setState({ ...initialState, ...data, status: "ready" });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "ready",
        isRefreshing: false,
        message: error?.userMessage || "Court sync could not run right now.",
        issues: [...(current.issues || []), error?.userMessage || "Court sync could not run right now."],
      }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const title = useMemo(() => {
    if (view === "matches") return "Court case match";
    if (view === "verdict") return "Verdict detail";
    if (view === "settings") return "Court sync settings";
    return "The Gavel Gathering";
  }, [view]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Court sync needs attention" message={state.message} actionLabel="Retry" />;

  return (
      <div className="space-y-6">
      <CourtNewsroomHero title={title} itemCount={state.courtItems.length} isRefreshing={state.isRefreshing} onRefresh={runSync} />

      {view === "matches" ? (
        <CourtMatchPanel matters={state.matters} />
      ) : view === "verdict" ? (
        <VerdictDetailShell verdicts={state.verdicts} />
      ) : view === "settings" ? (
        <CourtSettingsShell setupSteps={state.setupSteps} />
      ) : (
        <CourtNewsroomFeed courtItems={state.courtItems} />
      )}
    </div>
  );
}
