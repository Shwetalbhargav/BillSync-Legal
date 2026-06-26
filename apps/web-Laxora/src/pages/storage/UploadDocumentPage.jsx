import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { storageWorkspaceApi } from "../../api";
import { Button, SkeletonBlock, StateCard, Toast } from "../../components/common";
import {
  ProviderCards,
  SectionIssues,
  StorageHero,
  UploadReadinessPanel,
} from "../../components/storage/StorageWidgets";
import { useDocumentModuleAccess } from "./useDocumentModuleAccess";

const blankForm = {
  title: "",
  caseId: "",
  clientId: "",
  documentType: "other",
  provider: "local",
  storageKey: "",
  originalFileName: "",
  mimeType: "",
  sizeBytes: "",
  externalUrl: "",
  description: "",
};

export function UploadDocumentPage() {
  const navigate = useNavigate();
  const access = useDocumentModuleAccess();
  const [state, setState] = useState({ status: "loading", matters: [], clients: [], providers: [], issues: [], message: "" });
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await storageWorkspaceApi.loadUploadOptions();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", matters: [], clients: [], providers: [], issues: [], message: error?.userMessage || "We could not load upload choices right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selectedMatter = useMemo(() => state.matters.find((matter) => matter.id === form.caseId), [form.caseId, state.matters]);

  function update(field, value) {
    setNotice(null);
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "caseId") {
        const matter = state.matters.find((item) => item.id === value);
        next.clientId = matter?.clientId || next.clientId;
      }
      return next;
    });
  }

  function captureFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setNotice({ tone: "warning", title: "Document record ready", message: "The selected file details are captured. Direct file transfer will be enabled after storage setup is complete." });
    setForm((current) => ({
      ...current,
      title: current.title || file.name.replace(/\.[^.]+$/, ""),
      originalFileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: String(file.size || 0),
      storageKey: current.storageKey || `local/${Date.now()}-${file.name}`,
    }));
  }

  async function save(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.caseId || !form.clientId || !form.storageKey.trim()) {
      setNotice({ tone: "warning", title: "Document details need attention", message: "Choose a matter, add a title, and keep a storage reference before saving." });
      return;
    }
    setSaving(true);
    try {
      const saved = await storageWorkspaceApi.createDocumentRecord({
        ...form,
        title: form.title.trim(),
        storageKey: form.storageKey.trim(),
        originalFileName: form.originalFileName.trim() || form.title.trim(),
        sizeBytes: Number(form.sizeBytes || 0),
      });
      setNotice({ tone: "success", title: "Document record saved", message: "The document is now linked to the selected matter." });
      navigate(`/app/document-storage/${saved.id}`);
    } catch (error) {
      setNotice({ tone: "warning", title: "Document was not saved", message: error?.userMessage || "Please review the document details and try again." });
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Document upload is not available" message={access.message} />;
  if (!access.canCreate) return <StateCard state="permission" title="Document upload is not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Upload choices need attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <StorageHero canCreate={access.canCreate} title="Add document" />
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      <SectionIssues issues={state.issues} />
      <UploadReadinessPanel />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form className="surface-card space-y-4 p-5" onSubmit={save}>
          <div>
            <h2 className="text-xl font-bold text-primary">Document details</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Save a clear record now, then connect file transfer when the storage provider is ready.</p>
          </div>
          <Field label="Title">
            <input className="form-input" value={form.title} onChange={(event) => update("title", event.target.value)} />
          </Field>
          <Field label="Matter">
            <select className="form-input" value={form.caseId} onChange={(event) => update("caseId", event.target.value)}>
              <option value="">Choose matter</option>
              {state.matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
            </select>
          </Field>
          <Field label="Client">
            <select className="form-input" value={form.clientId} onChange={(event) => update("clientId", event.target.value)}>
              <option value="">Choose client</option>
              {state.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </Field>
          {selectedMatter?.client && form.clientId ? <p className="text-sm text-muted">Matched to {selectedMatter.client} from the selected matter.</p> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Type">
              <select className="form-input" value={form.documentType} onChange={(event) => update("documentType", event.target.value)}>
                <option value="pleading">Pleading</option>
                <option value="contract">Contract</option>
                <option value="evidence">Evidence</option>
                <option value="correspondence">Correspondence</option>
                <option value="invoice">Invoice</option>
                <option value="research">Research</option>
                <option value="note">Note</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Storage">
              <select className="form-input" value={form.provider} onChange={(event) => update("provider", event.target.value)}>
                <option value="local">BillSync record</option>
                <option value="zoho_workdrive">Zoho WorkDrive</option>
                <option value="google_drive">Google Drive</option>
                <option value="s3">Firm storage</option>
                <option value="external">External link</option>
              </select>
            </Field>
          </div>
          <Field label="Choose file">
            <input className="form-input" type="file" onChange={captureFile} />
          </Field>
          <Field label="Storage reference">
            <input className="form-input" value={form.storageKey} onChange={(event) => update("storageKey", event.target.value)} placeholder="Folder or document reference" />
          </Field>
          <Field label="Linked location">
            <input className="form-input" value={form.externalUrl} onChange={(event) => update("externalUrl", event.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Description">
            <textarea className="form-input min-h-28" value={form.description} onChange={(event) => update("description", event.target.value)} />
          </Field>
          <Button disabled={saving} isLoading={saving} type="submit">Save document record</Button>
        </form>
        <div className="space-y-4">
          <ProviderCards providers={state.providers} />
        </div>
      </div>
    </div>
  );
}

function Field({ children, label }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
