import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { recordingsApi } from "../../api/recordings";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import {
  MatterLinkUnavailablePanel,
  RecordingNotConfiguredCard,
  TranscriptUnavailablePanel,
} from "../../components/recordings/RecorderWidgets";

export function RecordingDetailPage() {
  const { recordingId } = useParams();
  const [state, setState] = useState({ status: "loading", recording: null, transcript: null, message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await recordingsApi.getRecording(recordingId);
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", recording: null, transcript: null, message: error?.userMessage || "We could not load this recording right now." });
    }
  }

  useEffect(() => {
    load();
  }, [recordingId]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Recording needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary hover:underline" to="/app/recordings">
        <ArrowLeft className="h-4 w-4" />
        Back to recordings
      </Link>
      <RecordingNotConfiguredCard />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TranscriptUnavailablePanel />
        <div className="space-y-4">
          <MatterLinkUnavailablePanel />
          <section className="rounded-lg border border-border bg-panel p-5">
            <h2 className="text-base font-bold text-primary">Follow-up actions</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              After saved recordings are connected, this area will support transcript review, matter timeline updates, and time capture.
            </p>
            <Button className="mt-4 w-full" disabled type="button" variant="secondary">Waiting for saved recording</Button>
          </section>
        </div>
      </div>
    </div>
  );
}
