import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { timeEntriesApi } from "../../api/timeEntries";
import { workCaptureApi } from "../../api/workCapture";
import { SkeletonBlock, StateCard } from "../../components/common";
import { TimeEntryList } from "../../components/work/WorkCaptureWidgets";

export function SubmitWorkPage() {
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  async function load() {
    setStatus("loading");
    setMessage("");
    try {
      const data = await workCaptureApi.loadApprovalQueue();
      setEntries(data);
      setStatus(data.length ? "ready" : "empty");
    } catch (error) {
      setStatus("error");
      setMessage(error?.userMessage || "We could not load draft work right now.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitEntry(entry) {
    try {
      await timeEntriesApi.submit(entry.id);
      await load();
      setMessage("Work submitted. A reviewer can approve it from Approve Work.");
    } catch (error) {
      setStatus("error");
      setMessage(error?.userMessage || "We could not submit this work right now.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Approval</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Submit Work for Approval</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Send complete time entries to reviewers when the description and time look right.</p>
        <div className="mt-4">
          <Link className="text-sm font-semibold text-primary underline-offset-4 hover:underline" to="/app/time-approval">
            Open reviewer queue
          </Link>
        </div>
      </section>
      {status === "loading" ? <SkeletonBlock /> : null}
      {message && status !== "error" ? (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm font-semibold text-success">{message}</div>
      ) : null}
      {status === "error" ? <StateCard state="error" title="Submission queue needs attention" message={message} actionLabel="Retry" onAction={load} /> : null}
      {status === "empty" ? <StateCard state="empty" title="No draft work to submit" message="Saved draft time will appear here before approval." /> : null}
      {status === "ready" ? <TimeEntryList entries={entries} onSubmit={submitEntry} /> : null}
    </div>
  );
}
