import { useState } from "react";
import { extensionApi } from "../../api/extension";
import { Button, StateCard } from "../../components/common";
import { ConnectedSuccess, ExtensionConnectionCard, ExtensionHero, ExtensionNavActions, SetupChecklist } from "../../components/extension/ExtensionWidgets";

export function ExtensionSetupPage() {
  const [link, setLink] = useState(null);
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState("");

  async function testConnection() {
    setStatus("saving");
    setMessage("");
    try {
      const result = await extensionApi.testWorkspaceLink();
      setLink(result);
      setStatus("success");
    } catch (error) {
      setStatus("ready");
      setMessage(error?.userMessage || "We could not check the extension connection right now.");
    }
  }

  return (
    <div className="space-y-6">
      <ExtensionHero title="Extension Setup" subtitle="Use this guide to add the BillSync Chrome extension and confirm it is ready for your workspace." />
      {message ? <StateCard state="error" title="Connection needs attention" message={message} /> : null}
      {status === "success" ? <ConnectedSuccess /> : null}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SetupChecklist />
        <div className="space-y-4">
          <ExtensionConnectionCard link={link} onRefresh={testConnection} status={status} />
          <section className="surface-card p-5">
            <h2 className="text-base font-bold text-ink">After loading the folder</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Open Gmail or your research tool, complete a short work action, then return to BillSync and check status.</p>
            <div className="mt-4 flex flex-col gap-3">
              <Button isLoading={status === "saving"} onClick={testConnection} type="button">Test connection</Button>
              <ExtensionNavActions />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
