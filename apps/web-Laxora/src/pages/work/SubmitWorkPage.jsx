import { useEffect, useState } from "react";
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
      </section>
      {status === "loading" ? <SkeletonBlock /> : null}
      {status === "error" ? <StateCard state="error" title="Submission queue needs attention" message={message} actionLabel="Retry" /> : null}
      {status === "empty" ? <StateCard state="empty" title="No draft work to submit" message="Saved draft time will appear here before approval." /> : null}
      {status === "ready" ? <TimeEntryList entries={entries} onSubmit={submitEntry} /> : null}
    </div>
  );
}
