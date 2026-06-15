import { useEffect, useMemo, useState } from "react";
import { courtSyncApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  CourtDailyFeedPanel,
  CourtIssues,
  CourtMatchPanel,
  CourtProviderState,
  CourtReadinessGrid,
  CourtSettingsShell,
  CourtSyncHero,
  CourtSyncSummary,
  ManualHearingSeparation,
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
    setState((current) => ({ ...current, status: "loading", message: "Refreshing court feed..." }));
    try {
      await courtSyncApi.runDailySync();
      const data = await courtSyncApi.loadWorkspace();
      setState({ ...initialState, ...data, status: "ready" });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "ready",
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
    return "Court daily sync";
  }, [view]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Court sync needs attention" message={state.message} actionLabel="Retry" />;

  return (
      <div className="space-y-6">
      <CourtSyncHero title={title} />
      <CourtProviderState sources={state.sources} jobs={state.jobs} courtItems={state.courtItems} onRunSync={runSync} />
      <CourtIssues issues={state.issues} />
      <CourtReadinessGrid readiness={state.readiness} />

      {view === "matches" ? (
        <CourtMatchPanel matters={state.matters} />
      ) : view === "verdict" ? (
        <VerdictDetailShell verdicts={state.verdicts} />
      ) : view === "settings" ? (
        <CourtSettingsShell setupSteps={state.setupSteps} />
      ) : (
        <>
          <CourtSyncSummary courtItems={state.courtItems} hearings={state.hearings} hearingTimeEntries={state.hearingTimeEntries} matters={state.matters} />
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <CourtDailyFeedPanel courtItems={state.courtItems} />
            <ManualHearingSeparation hearings={state.hearings} />
          </div>
        </>
      )}
    </div>
  );
}
