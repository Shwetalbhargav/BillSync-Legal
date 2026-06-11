import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileAudio, Link2, Mic, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";
import { formatDateTime, formatDuration } from "../work/WorkCaptureWidgets";

export function RecorderHero({ permissionState, onCheckPermission, isChecking }) {
  const ready = permissionState === "ready";
  return (
    <section className="surface-card p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Call and Meeting Recorder</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Capture conversations with matter context</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Prepare the recorder, link the conversation to a matter, and keep a clear review path for transcripts once recording storage is available.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button disabled={isChecking} isLoading={isChecking} onClick={onCheckPermission} type="button">
              <Mic className="h-4 w-4" />
              Check microphone
            </Button>
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to="/states/recorder-permission">
              <ShieldAlert className="h-4 w-4" />
              Permission help
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-blueSoft/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-primary">{ready ? "Ready for this browser session" : "Recorder check needed"}</p>
              <p className="mt-1 text-xs leading-5 text-muted">Saved recordings and transcripts are waiting on the planned recording service.</p>
            </div>
            <StatusBadge tone={ready ? "success" : "warning"}>{ready ? "Ready" : "Setup"}</StatusBadge>
          </div>
          <RecorderWaveform active={ready} />
        </div>
      </div>
    </section>
  );
}

export function RecorderWaveform({ active = false }) {
  const bars = [28, 42, 64, 36, 72, 52, 30, 58, 44, 68, 34, 48];
  return (
    <div className="mt-5 flex h-20 items-center justify-center gap-1 rounded-lg bg-panel px-4">
      {bars.map((height, index) => (
        <span
          aria-hidden="true"
          className={active ? "w-1.5 rounded-full animate-recorder-wave bg-accent" : "w-1.5 rounded-full bg-border"}
          key={height + index}
          style={{ animationDelay: `${index * 90}ms`, height: `${height}%` }}
        />
      ))}
    </div>
  );
}

export function RecorderPermissionPanel({ message, state }) {
  if (state === "ready") {
    return (
      <section className="rounded-lg border border-success/25 bg-success/10 p-4">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <h2 className="text-sm font-bold text-success">Microphone access is ready</h2>
            <p className="mt-1 text-sm leading-6 text-ink">You can use this device for a live recording check. Saved recording storage is still being prepared.</p>
          </div>
        </div>
      </section>
    );
  }

  if (state === "blocked" || state === "unavailable") {
    return (
      <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <h2 className="text-sm font-bold text-warning">{state === "blocked" ? "Microphone access is blocked" : "Recording is not available on this device"}</h2>
            <p className="mt-1 text-sm leading-6 text-ink">{message || "Open your browser privacy settings, allow microphone access for BillSync, then try again."}</p>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

export function RecordingLibrary({ recordings }) {
  if (!recordings.length) {
    return (
      <StateCard
        actionLabel="Check microphone"
        message="New recordings will appear here after recording storage is connected. Nothing is saved silently."
        state="empty"
        title="No saved recordings yet"
      />
    );
  }

  return (
    <DataTable
      columns={[
        { key: "title", label: "Recording" },
        { key: "matter", label: "Matter" },
        { key: "status", label: "Status" },
        { key: "created", label: "Recorded" },
      ]}
      rows={recordings.map((recording) => ({
        id: recording.id,
        title: <Link className="font-bold text-primary hover:underline" to={`/app/recordings/${recording.id}`}>{recording.title}</Link>,
        matter: recording.matter || "Not linked",
        status: <StatusBadge>{recording.status}</StatusBadge>,
        created: formatDateTime(recording.createdAt),
      }))}
    />
  );
}

export function RelatedMeetingWork({ activities, sessions }) {
  const rows = [
    ...sessions.map((session) => ({
      id: `session-${session.id}`,
      title: session.title,
      type: session.kind,
      matter: session.matter || "Matter not set",
      duration: formatDuration(session.minutes),
      date: formatDateTime(session.startedAt),
    })),
    ...activities.map((activity) => ({
      id: `activity-${activity.id}`,
      title: activity.title,
      type: activity.kind,
      matter: activity.matter || "Matter not set",
      duration: formatDuration(activity.minutes),
      date: formatDateTime(activity.occurredAt),
    })),
  ];

  if (!rows.length) {
    return <StateCard state="empty" title="No meeting work found" message="Meeting and call activity will appear here when captured from the work meter or activity review." />;
  }

  return (
    <Card>
      <CardHeader title="Related meeting work" action={<StatusBadge>{rows.length}</StatusBadge>} />
      <CardBody>
        <DataTable
          columns={[
            { key: "title", label: "Work" },
            { key: "type", label: "Type" },
            { key: "matter", label: "Matter" },
            { key: "duration", label: "Duration" },
            { key: "date", label: "Date" },
          ]}
          rows={rows}
        />
      </CardBody>
    </Card>
  );
}

export function TranscriptUnavailablePanel() {
  return (
    <section className="surface-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <FileAudio className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Transcript</p>
          <h2 className="mt-1 text-xl font-bold text-primary">Transcript will appear after recording storage is connected</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This page is ready for saved audio, transcript review, and matter linking. For now, BillSync does not store meeting recordings from this screen.
          </p>
        </div>
        <StatusBadge tone="warning">Not configured</StatusBadge>
      </div>
    </section>
  );
}

export function MatterLinkUnavailablePanel() {
  return (
    <section className="rounded-lg border border-border bg-panel p-5">
      <div className="flex gap-3">
        <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <h2 className="text-base font-bold text-primary">Matter link is waiting on saved recordings</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Once a recording exists, this area will let the team connect it to a client matter and review it from the matter timeline.</p>
        </div>
      </div>
    </section>
  );
}

export function RecorderIssueList({ issues }) {
  if (!issues?.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-sm font-bold text-warning">Some recorder context could not refresh</h2>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function RecordingNotConfiguredCard() {
  return (
    <section className="surface-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Recording detail</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Saved recording is not available yet</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            The detail screen is prepared for transcript review, matter linking, and follow-up work once recordings can be saved.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-blueSoft px-3 py-2 text-sm font-bold text-primary">
          <Sparkles className="h-4 w-4" />
          Future-ready
        </div>
      </div>
    </section>
  );
}
