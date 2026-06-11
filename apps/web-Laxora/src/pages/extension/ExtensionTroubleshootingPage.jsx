import { useState } from "react";
import { Link } from "react-router-dom";
import { extensionApi } from "../../api/extension";
import { Button, StateCard } from "../../components/common";
import { ConnectedSuccess, ExtensionHero, TroubleshootingList } from "../../components/extension/ExtensionWidgets";

export function ExtensionTroubleshootingPage() {
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState("");

  async function runCheck() {
    setStatus("saving");
    setMessage("");
    try {
      await extensionApi.testWorkspaceLink();
      setStatus("success");
    } catch (error) {
      setStatus("ready");
      setMessage(error?.userMessage || "We could not check the extension connection right now.");
    }
  }

  return (
    <div className="space-y-6">
      <ExtensionHero title="Extension Troubleshooting" subtitle="Use these checks when capture is not showing up or the Chrome icon is hard to find." />
      {message ? <StateCard state="error" title="Connection needs attention" message={message} /> : null}
      {status === "success" ? <ConnectedSuccess /> : null}
      <section className="surface-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink">Quick check</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Run this after signing in and loading the extension folder.</p>
          </div>
          <Button isLoading={status === "saving"} onClick={runCheck} type="button">Test connection</Button>
        </div>
      </section>
      <TroubleshootingList />
      <div className="flex justify-end">
        <Link className="focus-ring inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/extension/setup">
          Back to setup
        </Link>
      </div>
    </div>
  );
}
