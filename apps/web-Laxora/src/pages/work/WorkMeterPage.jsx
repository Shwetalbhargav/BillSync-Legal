import { useEffect, useMemo, useRef, useState } from "react";
import { activitySamplesApi } from "../../api/activitySamples";
import { appUsageEventsApi } from "../../api/appUsageEvents";
import { idleIntervalsApi } from "../../api/idleIntervals";
import { workCaptureApi } from "../../api/workCapture";
import { workSessionsApi } from "../../api/workSessions";
import { normalizeTimeEntry, normalizeWorkSession } from "../../api/normalizers";
import { useAuth } from "../../auth/AuthProvider";
import { Button, SkeletonBlock } from "../../components/common";
import {
  IdleResolutionPrompt,
  MeterOptionState,
  WorkMeterPanel,
  SaveFailedState,
  formatDuration,
  formatElapsed,
  getDefaultWorkToolForType,
  getWorkToolForType,
} from "../../components/work/WorkCaptureWidgets";

const initialForm = {
  clientId: "",
  caseId: "",
  taskId: "",
  activityType: "drafting",
  activityCode: "",
  workTool: getDefaultWorkToolForType("drafting"),
  workspaceProvider: "google",
  narrative: "",
  billable: true,
};

const privilegedMeterRoles = new Set(["admin", "owner", "partner"]);
const internalMeterTools = new Set(["manual", "billbot_ai", "other"]);
const workspaceProviders = new Set(["google", "zoho", "microsoft"]);

const toolTargetsByProvider = {
  google: {
    microsoft_word: { url: "https://docs.google.com/document/u/0/create", external: true },
    google_docs: { url: "https://docs.google.com/document/u/0/create", external: true },
    pdf_reader: { url: "https://drive.google.com/drive/u/0/my-drive", external: true },
    google_chrome: { url: "https://www.google.com/", external: true },
    gmail: { url: "https://mail.google.com/mail/u/0/#inbox?lb_meter=1&lb_compose=1&lb_prompt=BillSync%20Work%20Meter", external: true },
    google_meet: { url: "https://meet.google.com/new", external: true },
    zoom: { url: "https://zoom.us/start/videomeeting", external: true },
    microsoft_teams: { url: "https://teams.microsoft.com/v2/", external: true },
    whatsapp: { url: "https://web.whatsapp.com/", external: true },
    billbot_ai: { url: "/app/assistant", external: false },
  },
  zoho: {
    microsoft_word: { url: "https://writer.zoho.in/writer/open/new", external: true },
    google_docs: { url: "https://writer.zoho.in/writer/open/new", external: true },
    pdf_reader: { url: "https://workdrive.zoho.in/home", external: true },
    google_chrome: { url: "https://www.google.com/", external: true },
    gmail: { url: "https://mail.zoho.in/zm/#mail/folder/inbox", external: true },
    google_meet: { url: "https://meeting.zoho.in/meeting", external: true },
    zoom: { url: "https://zoom.us/start/videomeeting", external: true },
    microsoft_teams: { url: "https://teams.microsoft.com/v2/", external: true },
    whatsapp: { url: "https://web.whatsapp.com/", external: true },
    billbot_ai: { url: "/app/assistant", external: false },
  },
  microsoft: {
    microsoft_word: { url: "https://www.microsoft365.com/launch/word", external: true },
    google_docs: { url: "https://www.microsoft365.com/launch/word", external: true },
    pdf_reader: { url: "https://www.microsoft365.com/launch/onedrive", external: true },
    google_chrome: { url: "https://www.bing.com/", external: true },
    gmail: { url: "https://outlook.office.com/mail/", external: true },
    google_meet: { url: "https://teams.microsoft.com/v2/", external: true },
    zoom: { url: "https://zoom.us/start/videomeeting", external: true },
    microsoft_teams: { url: "https://teams.microsoft.com/v2/", external: true },
    whatsapp: { url: "https://web.whatsapp.com/", external: true },
    billbot_ai: { url: "/app/assistant", external: false },
  },
};

const toolNames = {
  microsoft_word: "Microsoft Word",
  google_docs: "Google Docs",
  pdf_reader: "PDF reader",
  google_chrome: "Google Chrome",
  gmail: "Gmail",
  google_meet: "Google Meet",
  zoom: "Zoom",
  microsoft_teams: "Microsoft Teams",
  whatsapp: "WhatsApp",
  billbot_ai: "BillBot AI",
  manual: "Lexora manual work",
  other: "Other tool",
};

function isExternalMeterTool(workTool) {
  return Boolean(workTool && !internalMeterTools.has(workTool));
}

function valueMatchesUser(value, userId) {
  if (!value || !userId) return false;
  if (typeof value === "string") return value === userId;
  if (typeof value === "object") return value._id === userId || value.id === userId || value.userId === userId;
  return false;
}

function itemBelongsToUser(item, userId) {
  if (!userId) return true;
  const raw = item.raw || item;
  const directFields = [
    item.ownerId,
    item.userId,
    item.assigneeId,
    raw.ownerUserId,
    raw.primaryLawyerId,
    raw.assignedTo,
    raw.userId,
    raw.createdBy,
  ];
  if (directFields.some((value) => valueMatchesUser(value, userId))) return true;
  return [raw.assignedUsers, raw.team, raw.assignments, raw.lawyers, raw.members].some((group) =>
    Array.isArray(group) && group.some((value) => valueMatchesUser(value?.userId || value?.user || value, userId)),
  );
}

function withWorkSessionParam(url, sessionId) {
  if (!sessionId || !url || /^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith("http")) return url;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.startsWith("/files/")) return parsed.toString();
    const hashIndex = parsed.hash.indexOf("?");
    if (hashIndex >= 0) {
      const hashPath = parsed.hash.slice(0, hashIndex);
      const hashParams = new URLSearchParams(parsed.hash.slice(hashIndex + 1));
      hashParams.set("lb_work_session_id", sessionId);
      parsed.hash = `${hashPath}?${hashParams.toString()}`;
    } else {
      parsed.searchParams.set("lb_work_session_id", sessionId);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function toAbsoluteUrl(url) {
  if (!url) return "";
  return url.startsWith("/") ? `${window.location.origin}${url}` : url;
}

function getToolTarget(workTool, workspaceProvider = "google") {
  const provider = workspaceProviders.has(workspaceProvider) ? workspaceProvider : "google";
  return toolTargetsByProvider[provider]?.[workTool] || toolTargetsByProvider.google[workTool] || null;
}

function createToolLauncher(workTool, workspaceProvider) {
  const target = getToolTarget(workTool, workspaceProvider);
  if (!target?.url) return null;
  return (sessionId) => {
    const toolUrl = toAbsoluteUrl(target.url);
    const launchUrl = withWorkSessionParam(toolUrl, sessionId);
    window.open(launchUrl, "_blank");
  };
}

function hasZohoWorkspace(item) {
  const zoho = item?.integrations?.zoho || item?.raw?.integrations?.zoho;
  return Boolean(zoho?.workdriveFolderUrl || zoho?.workdriveFolderId || zoho?.crmRecordId || zoho?.lastSyncedAt);
}

function inferWorkspaceProvider({ client, matter }) {
  const explicit =
    matter?.raw?.workspaceProvider ||
    matter?.raw?.integrations?.workspaceProvider ||
    matter?.raw?.integrations?.preferredProvider ||
    client?.raw?.workspaceProvider ||
    client?.raw?.integrations?.workspaceProvider ||
    client?.raw?.integrations?.preferredProvider;
  const normalized = String(explicit || "").toLowerCase();
  if (workspaceProviders.has(normalized)) return normalized;
  return hasZohoWorkspace(matter) || hasZohoWorkspace(client) ? "zoho" : "google";
}

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
  const [liveActivity, setLiveActivity] = useState({ keyboardCount: 0, mouseCount: 0, activeSeconds: 0 });
  const hiddenAtRef = useRef(null);
  const sessionRef = useRef(null);
  const lastMouseMoveCountAtRef = useRef(0);
  const lastActivityTickAtRef = useRef(Date.now());
  const flushActivityRef = useRef(async () => {});
  const flushAppUsageRef = useRef(async () => {});
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
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
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
      if (isExternalMeterTool(session.workTool)) return;
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
      if (sessionRef.current?.status !== "running") return;
      activityBucketRef.current.keyboardCount += 1;
      activityBucketRef.current.lastInteractionAt = Date.now();
      setLiveActivity({
        keyboardCount: activityBucketRef.current.keyboardCount,
        mouseCount: activityBucketRef.current.mouseCount,
        activeSeconds: activityBucketRef.current.activeSeconds,
      });
    }
    function markMouseActivity() {
      if (sessionRef.current?.status !== "running") return;
      activityBucketRef.current.mouseCount += 1;
      activityBucketRef.current.lastInteractionAt = Date.now();
      setLiveActivity({
        keyboardCount: activityBucketRef.current.keyboardCount,
        mouseCount: activityBucketRef.current.mouseCount,
        activeSeconds: activityBucketRef.current.activeSeconds,
      });
    }
    function markMouseMoveActivity() {
      const now = Date.now();
      if (now - lastMouseMoveCountAtRef.current < 750) return;
      lastMouseMoveCountAtRef.current = now;
      markMouseActivity();
    }

    window.addEventListener("keydown", markKeyboardActivity);
    window.addEventListener("pointerdown", markMouseActivity);
    window.addEventListener("pointermove", markMouseMoveActivity);
    window.addEventListener("wheel", markMouseActivity, { passive: true });
    return () => {
      window.removeEventListener("keydown", markKeyboardActivity);
      window.removeEventListener("pointerdown", markMouseActivity);
      window.removeEventListener("pointermove", markMouseMoveActivity);
      window.removeEventListener("wheel", markMouseActivity);
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
    lastActivityTickAtRef.current = Date.now();
    setLiveActivity({ keyboardCount: 0, mouseCount: 0, activeSeconds: 0 });
    appUsageBucketRef.current = { startedAt: new Date() };

    const secondTimer = window.setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.max(1, Math.round((now - lastActivityTickAtRef.current) / 1000));
      lastActivityTickAtRef.current = now;
      const lastInteractionAt = activityBucketRef.current.lastInteractionAt || 0;
      const isFocusedOnLexora = document.visibilityState === "visible" && now - lastInteractionAt <= 60000;
      const isFocusedOnLaunchedTool = document.visibilityState === "hidden" && isExternalMeterTool(session.workTool);
      if (isFocusedOnLexora || isFocusedOnLaunchedTool) {
        activityBucketRef.current.activeSeconds += elapsedSeconds;
        setLiveActivity({
          keyboardCount: activityBucketRef.current.keyboardCount,
          mouseCount: activityBucketRef.current.mouseCount,
          activeSeconds: activityBucketRef.current.activeSeconds,
        });
      }
    }, 1000);

    async function flushBucket() {
      const bucket = activityBucketRef.current;
      const windowEnd = new Date();
      const sampleSeconds = Math.max(1, Math.round((windowEnd.getTime() - new Date(bucket.windowStart).getTime()) / 1000));
      if (sampleSeconds < 2 && !bucket.keyboardCount && !bucket.mouseCount && !bucket.activeSeconds) return;
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
      setLiveActivity({ keyboardCount: 0, mouseCount: 0, activeSeconds: 0 });
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
      if (durationSeconds < 2) return;
      appUsageBucketRef.current = { startedAt: endedAt };
      try {
        await appUsageEventsApi.createForSession(session.id, {
          appName: document.visibilityState === "hidden" && isExternalMeterTool(session.workTool)
            ? toolNames[session.workTool] || session.workTool.replaceAll("_", " ")
            : "BillSync Legal",
          url: document.visibilityState === "hidden" && isExternalMeterTool(session.workTool)
            ? getToolTarget(session.workTool, session.workspaceProvider)?.url || ""
            : `${window.location.origin}${window.location.pathname}`,
          domain: document.visibilityState === "hidden" && isExternalMeterTool(session.workTool)
            ? ""
            : window.location.hostname,
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

    flushActivityRef.current = flushBucket;
    flushAppUsageRef.current = flushAppUsage;
    const flushTimer = window.setInterval(flushBucket, 15000);
    const appUsageTimer = window.setInterval(flushAppUsage, 60000);
    return () => {
      window.clearInterval(secondTimer);
      window.clearInterval(flushTimer);
      window.clearInterval(appUsageTimer);
      flushActivityRef.current = async () => {};
      flushAppUsageRef.current = async () => {};
      flushBucket();
      flushAppUsage();
    };
  }, [session?.id, session?.status, session?.workTool]);

  const canSeeAllMeterOptions = privilegedMeterRoles.has(String(user?.role || "").toLowerCase());
  const userScopedMatters = useMemo(
    () => canSeeAllMeterOptions ? matters : matters.filter((matter) => itemBelongsToUser(matter, user?.id)),
    [canSeeAllMeterOptions, matters, user?.id],
  );
  const userScopedTasks = useMemo(
    () => canSeeAllMeterOptions ? tasks : tasks.filter((task) => itemBelongsToUser(task, user?.id)),
    [canSeeAllMeterOptions, tasks, user?.id],
  );
  const userScopedClients = useMemo(() => {
    if (canSeeAllMeterOptions) return clients;
    const matterClientIds = new Set(userScopedMatters.map((matter) => matter.clientId).filter(Boolean));
    return clients.filter((client) => itemBelongsToUser(client, user?.id) || matterClientIds.has(client.id));
  }, [canSeeAllMeterOptions, clients, user?.id, userScopedMatters]);
  const filteredMatters = useMemo(
    () => userScopedMatters.filter((matter) => !form.clientId || matter.clientId === form.clientId),
    [form.clientId, userScopedMatters],
  );
  const filteredTasks = useMemo(
    () => userScopedTasks.filter((task) => (!form.clientId || task.clientId === form.clientId) && (!form.caseId || task.matterId === form.caseId) && !["done", "cancelled"].includes(String(task.status).toLowerCase())),
    [form.caseId, form.clientId, userScopedTasks],
  );
  const elapsedLabel = useMemo(() => formatElapsed(session?.startedAt, session?.minutes, session?.status), [session?.startedAt, session?.minutes, session?.status, tick]);

  function updateField(field, value) {
    setMessage("");
    setSaveFailed("");
    setValidation("");
    setForm((current) => {
      if (field === "clientId") {
        const client = clients.find((item) => item.id === value);
        return { ...current, clientId: value, caseId: "", taskId: "", workspaceProvider: inferWorkspaceProvider({ client }) };
      }
      if (field === "caseId") {
        const matter = matters.find((item) => item.id === value);
        const clientId = matter?.clientId || current.clientId || "";
        const client = clients.find((item) => item.id === clientId);
        return { ...current, caseId: value, clientId, taskId: "", workspaceProvider: inferWorkspaceProvider({ client, matter }) };
      }
      if (field === "activityType") {
        return { ...current, activityType: value, workTool: getDefaultWorkToolForType(value) };
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
    const matchedWorkTool = getWorkToolForType(form.activityType, form.workTool);
    setStatus("saving");
    try {
      const response = await workSessionsApi.start({
        caseId: form.caseId,
        clientId: form.clientId,
        taskId: form.taskId || undefined,
        activityType: form.activityType,
        activityCode: form.activityCode.trim() || undefined,
        workTool: matchedWorkTool,
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
        workTool: startedSession.workTool || matchedWorkTool,
        workspaceProvider: form.workspaceProvider,
      });
      setLastSavedEntry(null);
      setStatus("ready");
      setForm(initialForm);
      const launchSelectedTool = createToolLauncher(matchedWorkTool, form.workspaceProvider);
      if (launchSelectedTool) launchSelectedTool(startedSession.id);
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
      await Promise.allSettled([
        flushActivityRef.current(),
        flushAppUsageRef.current(),
      ]);
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
            {lastSavedEntry.title} - {lastSavedEntry.matter || "Matter not set"} - {formatDuration(lastSavedEntry.minutes)}
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
          hasClients={userScopedClients.length > 0}
          hasMatters={filteredMatters.length > 0}
          hasTasks={filteredTasks.length > 0}
          issues={issues}
          onRetry={load}
        />
      ) : null}
      <WorkMeterPanel
        clients={userScopedClients}
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
        liveActivity={liveActivity}
      />
      {session ? (
        <div className="flex justify-end">
          <Button disabled={status === "saving"} onClick={() => stop(true)} type="button" variant="success">Save and submit</Button>
        </div>
      ) : null}
    </div>
  );
}
