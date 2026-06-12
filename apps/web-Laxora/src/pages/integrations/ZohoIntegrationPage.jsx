import { useEffect, useMemo, useState } from "react";
import { zohoWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  AttachmentReviewShell,
  SectionIssues,
  WorkDriveLinkPanel,
  ZohoHero,
  ZohoLogsTable,
  ZohoModulesTable,
  ZohoStatusCard,
  ZohoSyncActions,
} from "../../components/integrations/ZohoWidgets";

const initialForm = {
  caseId: "",
  folderId: "",
  folderUrl: "",
};

const initialState = {
  status: "loading",
  connection: {},
  connectUrl: "",
  modules: [],
  logs: [],
  clients: [],
  matters: [],
  issues: [],
  message: "",
  actionResult: null,
};

function titleForView(view) {
  if (view === "workdrive") return "Zoho WorkDrive link";
  if (view === "logs") return "Zoho sync logs";
  return "Zoho integration";
}

function validateWorkDrive(form) {
  if (!form.caseId) return "Select a matter before saving the WorkDrive link.";
  if (!form.folderId.trim() && !form.folderUrl.trim()) return "Enter a WorkDrive folder id or folder link.";
  return "";
}

export function ZohoIntegrationPage({ view = "overview" }) {
  const [state, setState] = useState(initialState);
  const [form, setForm] = useState(initialForm);
  const [formMessage, setFormMessage] = useState("");

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await zohoWorkspaceApi.loadWorkspace();
      setState({ ...initialState, ...data, connection: data.status, status: "ready" });
    } catch (error) {
      setState({ ...initialState, status: "error", message: error?.userMessage || "We could not load Zoho settings right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const title = useMemo(() => titleForView(view), [view]);

  function updateForm(field, value) {
    setFormMessage("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSync(kind) {
    setState((current) => ({ ...current, status: "saving", message: "", actionResult: null }));
    try {
      const result = kind === "clients"
        ? await zohoWorkspaceApi.syncClients()
        : kind === "matters"
          ? await zohoWorkspaceApi.syncMatters()
          : await zohoWorkspaceApi.syncInvoices();
      setState((current) => ({ ...current, status: "ready", actionResult: result }));
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "ready",
        message: error?.userMessage || "Zoho sync could not finish right now. Please review the connection and try again.",
      }));
    }
  }

  async function handleWorkDriveSubmit(event) {
    event.preventDefault();
    const validationMessage = validateWorkDrive(form);
    if (validationMessage) {
      setFormMessage(validationMessage);
      return;
    }

    setState((current) => ({ ...current, status: "saving" }));
    try {
      await zohoWorkspaceApi.linkWorkDrive({
        caseId: form.caseId,
        folderId: form.folderId.trim(),
        folderUrl: form.folderUrl.trim(),
      });
      setForm(initialForm);
      setFormMessage("WorkDrive link saved.");
      setState((current) => ({ ...current, status: "ready" }));
      await load();
    } catch (error) {
      setFormMessage(error?.userMessage || "We could not save the WorkDrive link right now.");
      setState((current) => ({ ...current, status: "ready" }));
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Zoho settings need attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <ZohoHero title={title} />
      <SectionIssues issues={[...state.issues, state.message].filter(Boolean)} />
      <ZohoStatusCard connectUrl={state.connectUrl} status={state.connection} />

      {view === "workdrive" ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <WorkDriveLinkPanel
            form={form}
            matters={state.matters}
            message={formMessage}
            onChange={updateForm}
            onSubmit={handleWorkDriveSubmit}
            status={state.status}
          />
          <AttachmentReviewShell />
        </div>
      ) : view === "logs" ? (
        <section className="surface-card p-5">
          <h2 className="text-xl font-bold text-primary">Zoho sync logs</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Review recent Zoho activity and items that need another look.</p>
          <div className="mt-4">
            <ZohoLogsTable logs={state.logs} />
          </div>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <ZohoSyncActions onSync={handleSync} result={state.actionResult} status={state.status} />
          <section className="surface-card p-5">
            <h2 className="text-xl font-bold text-primary">Available Zoho modules</h2>
            <p className="mt-1 text-sm leading-6 text-muted">These modules come from the connected Zoho account.</p>
            <div className="mt-4">
              <ZohoModulesTable modules={state.modules} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
