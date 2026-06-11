import { useEffect, useState } from "react";
import { extensionApi } from "../../api/extension";
import { SkeletonBlock, StateCard } from "../../components/common";
import { ConnectedSuccess, ExtensionConnectionCard, ExtensionHero, RecentCaptureList } from "../../components/extension/ExtensionWidgets";

export function ExtensionStatusPage() {
  const [state, setState] = useState({ status: "loading", link: null, captures: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await extensionApi.setupStatus();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", link: null, captures: [], issues: [], message: error?.userMessage || "We could not load extension status right now." });
    }
  }

  async function testConnection() {
    setState((current) => ({ ...current, status: "saving", message: "" }));
    try {
      const link = await extensionApi.testWorkspaceLink();
      setState((current) => ({ ...current, status: "ready", link }));
    } catch (error) {
      setState((current) => ({ ...current, status: "ready", message: error?.userMessage || "We could not check the connection right now." }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Extension status needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <ExtensionHero title="Extension Status" subtitle="Check whether BillSync is ready to capture email and research work from Chrome." />
      {state.message ? <StateCard state="error" title="Connection needs attention" message={state.message} /> : null}
      {state.link?.available ? <ConnectedSuccess /> : null}
      {state.issues.length ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-ink">
          <p className="font-bold text-warning">Some details need another refresh.</p>
          <ul className="mt-2 space-y-1">{state.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
        </div>
      ) : null}
      <ExtensionConnectionCard link={state.link} onRefresh={testConnection} status={state.status} />
      <RecentCaptureList captures={state.captures} />
    </div>
  );
}
