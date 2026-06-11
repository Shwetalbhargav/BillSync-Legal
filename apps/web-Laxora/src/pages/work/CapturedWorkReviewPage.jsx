import { useEffect, useState } from "react";
import { activitiesApi } from "../../api/activities";
import { timeEntriesApi } from "../../api/timeEntries";
import { workCaptureApi } from "../../api/workCapture";
import { SkeletonBlock, StateCard } from "../../components/common";
import { CapturedWorkList } from "../../components/work/WorkCaptureWidgets";

export function CapturedWorkReviewPage() {
  const [activities, setActivities] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  async function load() {
    setStatus("loading");
    setMessage("");
    try {
      const data = await workCaptureApi.loadCapturedWork();
      setActivities(data);
      setStatus(data.length ? "ready" : "empty");
    } catch (error) {
      setStatus("error");
      setMessage(error?.userMessage || "We could not load captured work right now.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(activity) {
    try {
      await activitiesApi.review(activity.id);
      await load();
    } catch (error) {
      setStatus("error");
      setMessage(error?.userMessage || "We could not mark this work as reviewed.");
    }
  }

  async function convert(activity) {
    try {
      await timeEntriesApi.fromActivity(activity.id);
      await load();
    } catch (error) {
      setStatus("error");
      setMessage(error?.userMessage || "We could not create time from this work.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Captured Work</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Captured Work Review</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review meter captures and create time entries when the details look right.</p>
      </section>
      {status === "loading" ? <SkeletonBlock /> : null}
      {status === "error" ? <StateCard state="error" title="Captured work needs attention" message={message} actionLabel="Retry" /> : null}
      {status === "empty" ? <StateCard state="empty" title="No captured work" message="Start the meter or add time manually to begin." /> : null}
      {status === "ready" ? <CapturedWorkList activities={activities} onConvert={convert} onReview={review} /> : null}
    </div>
  );
}
