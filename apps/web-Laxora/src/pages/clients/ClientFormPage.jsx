import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { normalizeClient } from "../../api/normalizers";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { useClientModuleAccess } from "./useClientModuleAccess";

const initialForm = {
  displayName: "",
  email: "",
  phone: "",
  contactInfo: "",
  legalBillingName: "",
  billingLine1: "",
  billingLine2: "",
  billingCity: "",
  billingState: "",
  billingPostalCode: "",
  billingCountry: "India",
  gstin: "",
  contactPerson: "",
  invoiceEmail: "",
  businessEntityType: "individual",
  rcmApplicabilityHint: "",
  paymentTerms: "NET30",
  status: "active",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactRole: "",
  zohoCrmRecordId: "",
  zohoLastSyncedAt: "",
};

function unwrap(response) {
  return response?.data || response;
}

function validate(form) {
  if (!form.displayName.trim()) return "Enter the client name.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
  return "";
}

export function ClientFormPage() {
  const { clientId } = useParams();
  const isEdit = Boolean(clientId);
  const access = useClientModuleAccess();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(isEdit ? "loading" : "ready");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    clientsApi.get(clientId)
      .then((response) => {
        const client = normalizeClient(unwrap(response));
        setForm({
          displayName: client.name,
          email: client.email,
          phone: client.phone,
          contactInfo: client.contactInfo,
          legalBillingName: client.legalBillingName,
          billingLine1: client.billingAddress?.line1 || "",
          billingLine2: client.billingAddress?.line2 || "",
          billingCity: client.billingAddress?.city || "",
          billingState: client.billingAddress?.state || "",
          billingPostalCode: client.billingAddress?.postalCode || "",
          billingCountry: client.billingAddress?.country || "India",
          gstin: client.gstin,
          contactPerson: client.contactPerson,
          invoiceEmail: client.invoiceEmail,
          businessEntityType: client.businessEntityType || "individual",
          rcmApplicabilityHint: client.rcmApplicabilityHint,
          paymentTerms: client.paymentTerms,
          status: String(client.status || "active").toLowerCase(),
          contactName: client.contacts?.[0]?.name || "",
          contactEmail: client.contacts?.[0]?.email || "",
        contactPhone: client.contacts?.[0]?.phone || "",
        contactRole: client.contacts?.[0]?.role || "",
        zohoCrmRecordId: client.integrations?.zoho?.crmRecordId || "",
        zohoLastSyncedAt: client.integrations?.zoho?.lastSyncedAt ? String(client.integrations.zoho.lastSyncedAt).slice(0, 10) : "",
        });
        setStatus("ready");
      })
      .catch((error) => {
        setMessage(error?.userMessage || "We could not load this client for editing.");
        setStatus("error");
      });
  }, [clientId, isEdit]);

  function updateField(field, value) {
    setMessage("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (access.readOnly || (isEdit ? !access.canEdit : !access.canCreate)) {
      setMessage("You can review clients, but changes are paused for this workspace.");
      return;
    }
    const validationMessage = validate(form);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setStatus("saving");
    try {
      const body = {
        displayName: form.displayName.trim(),
        name: form.displayName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        contactInfo: form.contactInfo.trim(),
        legalBillingName: form.legalBillingName.trim(),
        billingAddress: {
          line1: form.billingLine1.trim(),
          line2: form.billingLine2.trim(),
          city: form.billingCity.trim(),
          state: form.billingState.trim(),
          postalCode: form.billingPostalCode.trim(),
          country: form.billingCountry.trim() || "India",
        },
        gstin: form.gstin.trim().toUpperCase(),
        contactPerson: form.contactPerson.trim(),
        invoiceEmail: form.invoiceEmail.trim(),
        businessEntityType: form.businessEntityType,
        rcmApplicabilityHint: form.rcmApplicabilityHint.trim(),
        paymentTerms: form.paymentTerms,
        status: form.status,
        contacts: [
          {
            name: form.contactName.trim(),
            email: form.contactEmail.trim(),
            phone: form.contactPhone.trim(),
            role: form.contactRole.trim(),
          },
        ].filter((contact) => contact.name || contact.email || contact.phone || contact.role),
        integrations: {
          zoho: {
            crmModule: "Accounts",
            crmRecordId: form.zohoCrmRecordId.trim() || undefined,
            lastSyncedAt: form.zohoLastSyncedAt || undefined,
          },
        },
      };
      const response = isEdit ? await clientsApi.replace(clientId, body) : await clientsApi.create(body);
      const saved = normalizeClient(unwrap(response));
      navigate(isEdit ? `/app/clients/${saved.id || clientId}` : "/app/clients", {
        replace: true,
        state: {
          notice: {
            tone: "success",
            title: isEdit ? "Client updated" : "Client added",
            message: `${saved.name || form.displayName.trim()} has been saved to client records.`,
          },
        },
      });
    } catch (error) {
      setMessage(error?.status === 403 ? "You do not have access to save clients." : (error?.userMessage || "We could not save this client right now. Please review the details and try again."));
      setStatus("ready");
    }
  }

  if (access.status === "loading") return <SkeletonBlock />;
  if (access.unavailable || access.readOnly || (isEdit ? !access.canEdit : !access.canCreate)) {
    return (
      <StateCard
        state="permission"
        title={access.readOnly ? "Clients are read-only" : "Client changes are not available"}
        message={access.message || "You do not have access to change client records."}
      />
    );
  }
  if (status === "loading") return <SkeletonBlock />;
  if (status === "error") return <StateCard state="error" title="Client form needs attention" message={message} />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Clients</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{isEdit ? "Edit Client" : "Create Client"}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Keep the core client details clear for matters, invoices, and payments.</p>
      </section>

      <form className="surface-card space-y-4 p-6" onSubmit={handleSubmit}>
        {message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{message}</div> : null}
        <label className="block text-sm font-semibold text-ink">
          Client name
          <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("displayName", event.target.value)} placeholder="Client name" value={form.displayName} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Contact info
          <textarea className="focus-ring mt-1 min-h-24 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("contactInfo", event.target.value)} placeholder="Primary address, billing notes, or client communication preference" value={form.contactInfo} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">
            Email
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("email", event.target.value)} placeholder="client@example.com" value={form.email} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Phone
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("phone", event.target.value)} placeholder="Phone number" value={form.phone} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Payment terms
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("paymentTerms", event.target.value)} value={form.paymentTerms}>
              <option value="DUE_ON_RECEIPT">Due on receipt</option>
              <option value="NET7">Net 7</option>
              <option value="NET15">Net 15</option>
              <option value="NET30">Net 30</option>
              <option value="NET45">Net 45</option>
              <option value="NET60">Net 60</option>
              <option value="NET90">Net 90</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Status
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("status", event.target.value)} value={form.status}>
              <option value="active">Active</option>
              <option value="prospect">Prospect</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        <section className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-primary">Invoice billing details</h2>
              <p className="mt-1 text-xs font-semibold text-muted">Used on invoices and professional documents.</p>
            </div>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              Legal billing name
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("legalBillingName", event.target.value)} placeholder="Legal entity name" value={form.legalBillingName} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Invoice email
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("invoiceEmail", event.target.value)} placeholder="billing@example.com" value={form.invoiceEmail} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              GSTIN
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("gstin", event.target.value.toUpperCase())} placeholder="27ABCDE1234F1Z5" value={form.gstin} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Contact person
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("contactPerson", event.target.value)} placeholder="Billing contact" value={form.contactPerson} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Business/entity type
              <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("businessEntityType", event.target.value)} value={form.businessEntityType}>
                <option value="individual">Individual</option>
                <option value="proprietorship">Proprietorship</option>
                <option value="partnership">Partnership</option>
                <option value="llp">LLP</option>
                <option value="company">Company</option>
                <option value="trust">Trust</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              RCM applicability hint
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("rcmApplicabilityHint", event.target.value)} placeholder="Recipient may be liable under RCM" value={form.rcmApplicabilityHint} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Billing address line 1
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("billingLine1", event.target.value)} value={form.billingLine1} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Billing address line 2
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("billingLine2", event.target.value)} value={form.billingLine2} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              City
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("billingCity", event.target.value)} value={form.billingCity} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              State
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("billingState", event.target.value)} value={form.billingState} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Postal code
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("billingPostalCode", event.target.value)} value={form.billingPostalCode} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Country
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("billingCountry", event.target.value)} value={form.billingCountry} />
            </label>
          </div>
        </section>
        <section className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-bold text-primary">Primary contact</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              Contact name
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("contactName", event.target.value)} placeholder="Contact name" value={form.contactName} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Contact role
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("contactRole", event.target.value)} placeholder="Director, finance head, legal contact" value={form.contactRole} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Contact email
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("contactEmail", event.target.value)} placeholder="contact@example.com" value={form.contactEmail} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Contact phone
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("contactPhone", event.target.value)} placeholder="Contact phone" value={form.contactPhone} />
            </label>
          </div>
        </section>
        <section className="rounded-lg border border-border p-4">
          <h2 className="text-sm font-bold text-primary">Zoho integration</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              Zoho CRM record id
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("zohoCrmRecordId", event.target.value)} placeholder="CRM record id" value={form.zohoCrmRecordId} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Last synced
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("zohoLastSyncedAt", event.target.value)} type="date" value={form.zohoLastSyncedAt} />
            </label>
          </div>
        </section>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link className="focus-ring inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={isEdit ? `/app/clients/${clientId}` : "/app/clients"}>
            Cancel
          </Link>
          <Button isLoading={status === "saving"} type="submit">
            <Save className="h-4 w-4" />
            Save client
          </Button>
        </div>
      </form>
    </div>
  );
}
