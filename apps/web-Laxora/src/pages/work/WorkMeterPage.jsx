import { useEffect, useMemo, useRef, useState } from "react";
import { activitySamplesApi } from "../../api/activitySamples";
import { appUsageEventsApi } from "../../api/appUsageEvents";
import { idleIntervalsApi } from "../../api/idleIntervals";
import { workCaptureApi } from "../../api/workCapture";
import { workSessionsApi } from "../../api/workSessions";
import { normalizeTimeEntry, normalizeWorkSession } from "../../api/normalizers";
import { useAuth } from "../../auth/AuthProvider";
import { Button, SkeletonBlock } from "../../components/common";
import { IdleResolutionPrompt, MeterOptionState, WorkMeterPanel, SaveFailedState, formatElapsed } from "../../components/work/WorkCaptureWidgets";

const initialForm = {
  clientId: "",
  caseId: "",
  taskId: "",
  activityType: "drafting",
  activityCode: "",
  workTool: "manual",
  narrative: "",
  billable: true,
};

export function WorkMeterPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [clients, setClients] = useState([]);
  const [matters, setMatters] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState([]);
  const [validation, setValidation] = useState("");
  const [saveFailed, setSaveFailed] = useState("");
  const [lastStopSubmit, setLastStopSubmit] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState(null);
  const [pendingIdle, setPendingIdle] = useState(null);
  const [tick, setTick] = useState(0);
  const hiddenAtRef = useRef(null);
  const activityBucketRef = useRef({
    windowStart: new Date(),
    keyboardCount: 0,
    mouseCount: 0,
    activeSeconds: 0,
    lastInteractionAt: Date.now(),
  });
  const appUsageBucketRef = useRef({ startedAt: new Date() });

  async function load() {
    setStatus("loading");
    setMessage("");
    try {
      const data = await workCaptureApi.loadMeterOptions();
      setClients(data.clients);
      setMatters(data.matters);
      setTasks(data.tasks);
      setSession(data.current);
      setIssues(data.issues || []);
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

  useEffect(() => {
    if (!session?.id || session.status !== "running") return undefined;
    async function checkReturnIdle() {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = new Date();
        return;
      }
      if (!hiddenAtRef.current) return;
      const awaySeconds = Math.round((Date.now() - new Date(hiddenAtRef.current).getTime()) / 1000);
      hiddenAtRef.current = null;
      const thresholdSeconds = Number(session.raw?.webMeter?.idleAfterSeconds || 300);
      if (awaySeconds < thresholdSeconds) return;
      try {
        const result = await idleIntervalsApi.detectForSession(session.id, {
          observedAt: new Date().toISOString(),
          source: "return_prompt",
        });
        if (result.intervals?.some((interval) => interval.status === "pending")) setPendingIdle(result);
      } catch {
        setIssues((current) => [...new Set([...(current || []), "Idle time could not be checked yet."])]);
      }
    }

    document.addEventListener("visibilitychange", checkReturnIdle);
    return () => document.removeEventListener("visibilitychange", checkReturnIdle);
  }, [session]);

  useEffect(() => {
    function markKeyboardActivity() {
      activityBucketRef.current.keyboardCount += 1;
      activityBucketRef.current.lastInteractionAt = Date.now();
    }
    function markMouseActivity() {
      activityBucketRef.current.mouseCount += 1;
      activityBucketRef.current.lastInteractionAt = Date.now();
    }

    window.addEventListener("keydown", markKeyboardActivity);
    window.addEventListener("pointerdown", markMouseActivity);
    return () => {
      window.removeEventListener("keydown", markKeyboardActivity);
      window.removeEventListener("pointerdown", markMouseActivity);
    };
  }, []);

  useEffect(() => {
    if (!session?.id || session.status !== "running") return undefined;
    activityBucketRef.current = {
      windowStart: new Date(),
      keyboardCount: 0,
      mouseCount: 0,
      activeSeconds: 0,
      lastInteractionAt: Date.now(),
    };
    appUsageBucketRef.current = { startedAt: new Date() };

    const secondTimer = window.setInterval(() => {
      const lastInteractionAt = activityBucketRef.current.lastInteractionAt || 0;
      if (document.visibilityState === "visible" && Date.now() - lastInteractionAt <= 60000) {
        activityBucketRef.current.activeSeconds += 1;
      }
    }, 1000);

    async function flushBucket() {
      const bucket = activityBucketRef.current;
      const windowEnd = new Date();
      const sampleSeconds = Math.max(1, Math.round((windowEnd.getTime() - new Date(bucket.windowStart).getTime()) / 1000));
      const activeSeconds = Math.min(bucket.activeSeconds, sampleSeconds);
      const body = {
        windowStart: new Date(bucket.windowStart).toISOString(),
        windowEnd: windowEnd.toISOString(),
        sampleSeconds,
        activeSeconds,
        inactiveSeconds: Math.max(sampleSeconds - activeSeconds, 0),
        keyboardCount: bucket.keyboardCount,
        mouseCount: bucket.mouseCount,
        sourceDevice: "web",
        sourceApp: "web_meter",
      };
      activityBucketRef.current = {
        windowStart: windowEnd,
        keyboardCount: 0,
        mouseCount: 0,
        activeSeconds: 0,
        lastInteractionAt: bucket.lastInteractionAt,
      };
      try {
        await activitySamplesApi.createForSession(session.id, body);
      } catch {
        setIssues((current) => [...new Set([...(current || []), "Activity percentage could not be refreshed yet."])]);
      }
    }

    async function flushAppUsage() {
      const bucket = appUsageBucketRef.current;
      const endedAt = new Date();
      const durationSeconds = Math.max(1, Math.round((endedAt.getTime() - new Date(bucket.startedAt).getTime()) / 1000));
      appUsageBucketRef.current = { startedAt: endedAt };
      try {
        await appUsageEventsApi.createForSession(session.id, {
          appName: "BillSync Legal",
          url: `${window.location.origin}${window.location.pathname}`,
          domain: window.location.hostname,
          startedAt: new Date(bucket.startedAt).toISOString(),
          endedAt: endedAt.toISOString(),
          durationSeconds,
          platform: "web",
          sourceApp: "web_meter",
        });
      } catch {
        setIssues((current) => [...new Set([...(current || []), "App and website history could not be refreshed yet."])]);
      }
    }

    const flushTimer = window.setInterval(flushBucket, 60000);
    const appUsageTimer = window.setInterval(flushAppUsage, 60000);
    return () => {
      window.clearInterval(secondTimer);
      window.clearInterval(flushTimer);
      window.clearInterval(appUsageTimer);
      flushBucket();
      flushAppUsage();
    };
  }, [session?.id, session?.status]);

  const filteredMatters = useMemo(
    () => matters.filter((matter) => !form.clientId || matter.clientId === form.clientId),
    [form.clientId, matters],
  );
  const filteredTasks = useMemo(
    () => tasks.filter((task) => (!form.clientId || task.clientId === form.clientId) && (!form.caseId || task.matterId === form.caseId) && !["done", "cancelled"].includes(String(task.status).toLowerCase())),
    [form.caseId, form.clientId, tasks],
  );
  const elapsedLabel = useMemo(() => formatElapsed(session?.startedAt, session?.minutes), [session?.startedAt, session?.minutes, tick]);

  function updateField(field, value) {
    setMessage("");
    setSaveFailed("");
    setValidation("");
    setForm((current) => {
      if (field === "clientId") {
        return { ...current, clientId: value, caseId: "", taskId: "" };
      }
      if (field === "caseId") {
        const matter = matters.find((item) => item.id === value);
        return { ...current, caseId: value, clientId: matter?.clientId || current.clientId || "", taskId: "" };
      }
      return { ...current, [field]: value };
    });
  }

  async function start() {
    if (!form.caseId || !form.clientId) {
      setValidation("Select a client and matter before starting the meter.");
      return;
    }
    if (form.taskId && !filteredTasks.some((task) => task.id === form.taskId)) {
      setValidation("Choose a task for this matter or leave task blank.");
      return;
    }
    setStatus("saving");
    try {
      const response = await workSessionsApi.start({
        caseId: form.caseId,
        clientId: form.clientId,
        taskId: form.taskId || undefined,
        activityType: form.activityType,
        activityCode: form.activityCode.trim() || undefined,
        workTool: form.workTool,
        narrative: form.narrative.trim() || "Focused legal work",
        billable: form.billable,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        meterCaptureLevel: "none",
      });
      const startedSession = normalizeWorkSession(response?.data ? response.data : response);
      const selectedClient = clients.find((client) => client.id === form.clientId);
      const selectedMatter = matters.find((matter) => matter.id === form.caseId);
      const selectedTask = tasks.find((task) => task.id === form.taskId);
      setSession({
        ...startedSession,
        client: startedSession.client || selectedClient?.name || "",
        matter: startedSession.matter || selectedMatter?.title || "",
        task: startedSession.task || selectedTask?.title || "",
      });
      setLastSavedEntry(null);
      setStatus("ready");
      setForm(initialForm);
    } catch (error) {
      setStatus("ready");
      if (error?.status === 409) {
        setMessage("Another meter is already running. Refresh to continue that work.");
        await load();
      } else {
        setMessage(error?.userMessage || "We could not start the meter right now.");
      }
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
    setLastStopSubmit(submitTimeEntry);
    try {
      const response = await workSessionsApi.stop(session.id, {
        endedAt: new Date().toISOString(),
        finalNarrative: session.title || "Focused legal work",
        createTimeEntry: true,
        submitTimeEntry,
      });
      const savedEntry = response?.timeEntry ? normalizeTimeEntry(response.timeEntry) : null;
      if (savedEntry) {
        setLastSavedEntry({
          ...savedEntry,
          client: savedEntry.client || session.client || "",
          matter: savedEntry.matter || session.matter || "",
        });
      } else {
        setLastSavedEntry(null);
      }
      setSession(null);
      setStatus("ready");
      setMessage(submitTimeEntry ? "Work was saved and submitted." : "Work was saved as a draft.");
      await load();
    } catch (error) {
      setStatus("ready");
      setSaveFailed(error?.userMessage || "We could not save this work yet.");
    }
  }

  async function resolveIdle(intervals, decision) {
    if (!intervals?.length) return;
    setStatus("saving");
    try {
      await Promise.all(intervals.map((interval) => idleIntervalsApi.resolve(interval.id, {
        decision,
        reason: decision === "discarded" ? "Removed after return review" : "Kept after return review",
      })));
      const refreshed = session?.id ? await idleIntervalsApi.listForSession(session.id) : null;
      setPendingIdle(refreshed?.intervals?.some((interval) => interval.status === "pending") ? refreshed : null);
      setStatus("ready");
      setMessage(decision === "discarded" ? "Idle time was removed from payable time." : "Idle time was kept.");
    } catch (error) {
      setStatus("ready");
      setMessage(error?.userMessage || "We could not update idle time right now.");
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
  if (status === "error") {
    return (
      <section className="surface-card p-6">
        <h1 className="text-base font-semibold text-ink">Work meter needs attention</h1>
        <p className="mt-1 text-sm leading-6 text-muted">{message}</p>
        <Button className="mt-4" onClick={load} type="button" variant="secondary">Retry</Button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {message ? <div className="rounded-lg border border-success/25 bg-success/10 p-3 text-sm font-semibold text-success">{message}</div> : null}
      {lastSavedEntry ? (
        <section className="rounded-lg border border-success/25 bg-success/10 p-4">
          <h2 className="text-sm font-bold text-success">{lastSavedEntry.status === "submitted" ? "Submitted work entry" : "Saved draft entry"}</h2>
          <p className="mt-1 break-words text-sm leading-6 text-ink">
            {lastSavedEntry.title} - {lastSavedEntry.matter || "Matter not set"} - {lastSavedEntry.minutes} minutes
          </p>
        </section>
      ) : null}
      {saveFailed ? <SaveFailedState elapsedLabel={elapsedLabel} message={saveFailed} onRetry={() => stop(lastStopSubmit)} /> : null}
      <IdleResolutionPrompt
        idle={pendingIdle}
        isSaving={status === "saving"}
        onDiscard={(intervals) => resolveIdle(intervals, "discarded")}
        onKeep={(intervals) => resolveIdle(intervals, "kept")}
      />
      {!session ? (
        <MeterOptionState
          hasClients={clients.length > 0}
          hasMatters={filteredMatters.length > 0}
          hasTasks={filteredTasks.length > 0}
          issues={issues}
          onRetry={load}
        />
      ) : null}
      <WorkMeterPanel
        clients={clients}
        elapsedLabel={elapsedLabel}
        form={form}
        isSaving={status === "saving"}
        matters={filteredMatters}
        onChange={updateField}
        onDiscard={discard}
        onPauseResume={pauseResume}
        onStart={start}
        onStop={stop}
        session={session}
        tasks={filteredTasks}
        user={user}
        validation={validation}
      />
      {session ? (
        <div className="flex justify-end">
          <Button disabled={status === "saving"} onClick={() => stop(true)} type="button" variant="success">Save and submit</Button>
        </div>
      ) : null}
    </div>
  );
}
