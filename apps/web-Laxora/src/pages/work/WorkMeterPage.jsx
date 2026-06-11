import { useEffect, useMemo, useState } from "react";
import { workCaptureApi } from "../../api/workCapture";
import { workSessionsApi } from "../../api/workSessions";
import { normalizeWorkSession } from "../../api/normalizers";
import { useAuth } from "../../auth/AuthProvider";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { WorkMeterPanel, SaveFailedState, formatElapsed } from "../../components/work/WorkCaptureWidgets";

const initialForm = {
  caseId: "",
  clientId: "",
  activityType: "drafting",
  narrative: "",
};

export function WorkMeterPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [matters, setMatters] = useState([]);
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [saveFailed, setSaveFailed] = useState("");
  const [tick, setTick] = useState(0);

  async function load() {
    setStatus("loading");
    setMessage("");
    try {
      const data = await workCaptureApi.loadMeterOptions();
      setMatters(data.matters);
      setSession(data.current);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(error?.userMessage || "We could not prepare the work meter.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsedLabel = useMemo(() => formatElapsed(session?.startedAt, session?.minutes), [session?.startedAt, session?.minutes, tick]);

  function updateField(field, value) {
    setMessage("");
    setSaveFailed("");
    setForm((current) => {
      if (field === "caseId") {
        const matter = matters.find((item) => item.id === value);
        return { ...current, caseId: value, clientId: matter?.clientId || "" };
      }
      return { ...current, [field]: value };
    });
  }

  async function start() {
    if (!form.caseId || !form.clientId) {
      setMessage("Select a matter before starting the meter.");
      return;
    }
    setStatus("saving");
    try {
      const response = await workSessionsApi.start({
        caseId: form.caseId,
        clientId: form.clientId,
        activityType: form.activityType,
        workTool: "manual",
        narrative: form.narrative.trim() || "Focused legal work",
        billable: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        meterCaptureLevel: "active_window",
      });
      setSession(normalizeWorkSession(response?.data ? response.data : response));
      setStatus("ready");
      setForm(initialForm);
    } catch (error) {
      setStatus("ready");
      setMessage(error?.userMessage || "We could not start the meter right now.");
    }
  }

  async function pauseResume() {
    if (!session?.id) return;
    setStatus("saving");
    try {
      const response = session.status === "paused" ? await workSessionsApi.resume(session.id) : await workSessionsApi.pause(session.id, { reason: "User paused work" });
      setSession(normalizeWorkSession(response?.data ? response.data : response));
      setStatus("ready");
    } catch (error) {
      setStatus("ready");
      setMessage(error?.userMessage || "We could not update the meter right now.");
    }
  }

  async function stop(submitTimeEntry = false) {
    if (!session?.id) return;
    setStatus("saving");
    setSaveFailed("");
    try {
      await workSessionsApi.stop(session.id, {
        endedAt: new Date().toISOString(),
        finalNarrative: session.title || "Focused legal work",
        createTimeEntry: true,
        submitTimeEntry,
      });
      setSession(null);
      setStatus("ready");
      setMessage(submitTimeEntry ? "Work was saved and submitted for approval." : "Work was saved as a draft.");
      await load();
    } catch (error) {
      setStatus("ready");
      setSaveFailed(error?.userMessage || "We could not save this work yet.");
    }
  }

  async function discard() {
    if (!session?.id) return;
    setStatus("saving");
    try {
      await workSessionsApi.discard(session.id, { reason: "Discarded by user" });
      setSession(null);
      setStatus("ready");
    } catch (error) {
      setStatus("ready");
      setMessage(error?.userMessage || "We could not discard this work right now.");
    }
  }

  if (status === "loading") return <SkeletonBlock />;
  if (status === "error") return <StateCard state="error" title="Work meter needs attention" message={message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      {message ? <div className="rounded-lg border border-success/25 bg-success/10 p-3 text-sm font-semibold text-success">{message}</div> : null}
      {saveFailed ? <SaveFailedState elapsedLabel={elapsedLabel} message={saveFailed} onRetry={() => stop(false)} /> : null}
      <WorkMeterPanel
        elapsedLabel={elapsedLabel}
        form={form}
        isSaving={status === "saving"}
        matters={matters}
        onChange={updateField}
        onDiscard={discard}
        onPauseResume={pauseResume}
        onStart={start}
        onStop={stop}
        session={session}
        user={user}
      />
      {session ? (
        <div className="flex justify-end">
          <Button disabled={status === "saving"} onClick={() => stop(true)} type="button" variant="success">Save and submit</Button>
        </div>
      ) : null}
    </div>
  );
}
