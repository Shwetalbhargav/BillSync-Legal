import { useEffect, useState } from "react";
import { recordingsApi } from "../../api/recordings";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  RecorderHero,
  RecorderIssueList,
  RecorderPermissionPanel,
  RecordingLibrary,
  RelatedMeetingWork,
  TranscriptUnavailablePanel,
} from "../../components/recordings/RecorderWidgets";

const initialState = {
  status: "loading",
  recordings: [],
  activities: [],
  sessions: [],
  issues: [],
  message: "",
};

function permissionErrorMessage(error) {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return "Microphone access is blocked. Allow microphone access for BillSync in your browser settings, then try again.";
  }
  if (error?.name === "NotFoundError") {
    return "No microphone was found on this device.";
  }
  return "We could not check the microphone right now. Please try again.";
}

export function RecordingLibraryPage() {
  const [state, setState] = useState(initialState);
  const [permissionState, setPermissionState] = useState("idle");
  const [permissionMessage, setPermissionMessage] = useState("");

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await recordingsApi.loadWorkspace();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ ...initialState, status: "error", message: error?.userMessage || "We could not load recorder workspace right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function checkPermission() {
    setPermissionState("checking");
    setPermissionMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState("unavailable");
      setPermissionMessage("Recording is not available in this browser. Try a current Chrome or Edge browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState("ready");
    } catch (error) {
      setPermissionState("blocked");
      setPermissionMessage(permissionErrorMessage(error));
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Recorder needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <RecorderHero isChecking={permissionState === "checking"} onCheckPermission={checkPermission} permissionState={permissionState} />
      <RecorderPermissionPanel message={permissionMessage} state={permissionState} />
      <RecorderIssueList issues={state.issues} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <section className="surface-card p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-accent">Library</p>
                <h2 className="text-xl font-bold text-primary">Saved recordings</h2>
              </div>
            </div>
            <RecordingLibrary recordings={state.recordings} />
          </section>
          <RelatedMeetingWork activities={state.activities} sessions={state.sessions} />
        </div>
        <div className="min-w-0">
          <TranscriptUnavailablePanel />
        </div>
      </div>
    </div>
  );
}
