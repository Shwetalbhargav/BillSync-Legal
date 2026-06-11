import { useEffect, useState } from "react";
import { captureApi } from "../../api/capture";
import { SkeletonBlock, StateCard } from "../../components/common";
import { CaptureHero, CaptureReviewList, getSelectedMapping, SectionIssues } from "../../components/capture/CaptureReviewWidgets";

export function CaptureReviewPage({ source = "gmail" }) {
  const [state, setState] = useState({ status: "loading", entries: [], clients: [], matters: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await captureApi.loadReview(source);
      setState({ status: data.entries.length ? "ready" : "empty", message: "", ...data });
    } catch (error) {
      setState({ status: "error", entries: [], clients: [], matters: [], issues: [], message: error?.userMessage || "We could not load captured work right now." });
    }
  }

  useEffect(() => {
    load();
  }, [source]);

  async function mapEntry(entry, convert) {
    const mapping = getSelectedMapping(entry.id);
    if (!mapping.clientId || !mapping.matterId) {
      setState((current) => ({ ...current, message: "Select a client and matter before saving." }));
      return;
    }
    setState((current) => ({ ...current, status: "saving", message: "" }));
    try {
      await captureApi.mapEntry(entry.id, { ...mapping, convert });
      await load();
    } catch (error) {
      setState((current) => ({ ...current, status: "ready", message: error?.userMessage || "We could not save this mapping right now." }));
    }
  }

  async function convertEntry(entry) {
    setState((current) => ({ ...current, status: "saving", message: "" }));
    try {
      await captureApi.convertEntry(entry.id, { status: "submitted" });
      await load();
    } catch (error) {
      setState((current) => ({ ...current, status: "ready", message: error?.userMessage || "Map this item to a matter before converting it." }));
    }
  }

  async function generateNarrative(entry) {
    setState((current) => ({ ...current, status: "saving", message: "" }));
    try {
      await captureApi.generateNarrative(entry.id);
      await load();
    } catch (error) {
      setState((current) => ({ ...current, status: "ready", message: error?.userMessage || "We could not draft a summary right now." }));
    }
  }

  return (
    <div className="space-y-6">
      <CaptureHero source={source} />
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      <SectionIssues issues={state.issues} />
      {state.status === "loading" ? <SkeletonBlock /> : null}
      {state.status === "error" ? <StateCard state="error" title="Captured work needs attention" message={state.message} actionLabel="Retry" /> : null}
      {state.status === "empty" ? (
        <CaptureReviewList clients={state.clients} entries={[]} matters={state.matters} source={source} />
      ) : null}
      {["ready", "saving"].includes(state.status) ? (
        <CaptureReviewList
          clients={state.clients}
          entries={state.entries}
          matters={state.matters}
          onConvert={convertEntry}
          onGenerate={generateNarrative}
          onMap={mapEntry}
          source={source}
        />
      ) : null}
    </div>
  );
}
