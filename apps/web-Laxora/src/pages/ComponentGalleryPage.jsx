import { Mail, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { Button, Card, CardBody, CardHeader, DataTable, Dialog, Drawer, Progress, SkeletonBlock, StateCard, StatusBadge, Tabs, Toast } from "../components/common";
import { Checkbox, Field, SelectField, TextareaField } from "../components/forms";

const tableColumns = [
  { key: "matter", label: "Matter" },
  { key: "owner", label: "Owner" },
  { key: "status", label: "Status" },
];

const tableRows = [
  { id: "1", matter: "Khurana Holdings", owner: "A. Sterling", status: <StatusBadge tone="success">Ready</StatusBadge> },
  { id: "2", matter: "Meridian Infra", owner: "N. Rao", status: <StatusBadge tone="warning">Review</StatusBadge> },
  { id: "3", matter: "Nile Foods", owner: "I. Shah", status: <StatusBadge tone="neutral">Draft</StatusBadge> },
];

export function ComponentGalleryPage() {
  const [tab, setTab] = useState("controls");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          eyebrow="Design System"
          title="BillSync Component Gallery"
          description="Reusable primitives for the legal workspace. The gallery keeps states visible before feature screens are built."
          action={<StatusBadge tone="accent">Branch ready</StatusBadge>}
        />
        <CardBody>
          <Tabs
            items={[
              { label: "Controls", value: "controls" },
              { label: "States", value: "states" },
              { label: "Panels", value: "panels" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </CardBody>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Buttons and badges" description="Primary actions, secondary actions, disabled states, and status tones." />
          <CardBody className="space-y-5">
            <div className="grid max-w-[240px] gap-3 sm:max-w-none sm:flex sm:flex-wrap">
              <Button className="w-full sm:w-auto">Primary action</Button>
              <Button className="w-full sm:w-auto" variant="secondary">Secondary action</Button>
              <Button className="w-full sm:w-auto" variant="ghost">Quiet action</Button>
              <Button className="w-full sm:w-auto" isLoading>Saving</Button>
              <Button className="w-full sm:w-auto" disabled>Disabled</Button>
            </div>
            <div className="grid max-w-[240px] grid-cols-2 gap-2 sm:max-w-none sm:flex sm:flex-wrap">
              <StatusBadge>Neutral</StatusBadge>
              <StatusBadge tone="success">Success</StatusBadge>
              <StatusBadge tone="warning">Needs review</StatusBadge>
              <StatusBadge tone="danger">Attention</StatusBadge>
              <StatusBadge tone="accent">Billable</StatusBadge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Form controls" description="Accessible inputs with helper text, validation, and focus states." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" leftIcon={UserRound} placeholder="A. Sterling" />
            <Field label="Mobile" leftIcon={Phone} placeholder="Registered mobile" />
            <Field error="Please enter a valid work address." label="Work email" leftIcon={Mail} placeholder="name@firm.com" />
            <SelectField label="Role" defaultValue="lawyer">
              <option value="lawyer">Lawyer</option>
              <option value="partner">Partner</option>
              <option value="associate">Associate</option>
              <option value="intern">Intern</option>
            </SelectField>
            <div className="sm:col-span-2">
              <TextareaField description="Shown as a calm helper, not a technical instruction." label="Billing note" placeholder="Summarize the work in client-friendly language." />
            </div>
            <Checkbox label="Ready for billing review" />
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <StateCard state="loading" title="Loading" message="A calm progress state while workspace data is prepared." />
        <StateCard state="empty" title="Empty" message="Helpful guidance appears when there is nothing to review yet." />
        <StateCard state="error" title="Retry" message="Recovery copy stays plain and action-oriented for testers." />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Tables and progress" description="Dense but readable operational data." />
          <CardBody className="space-y-5">
            <DataTable columns={tableColumns} rows={tableRows} />
            <Progress label="Setup progress" value={72} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Loading surfaces" description="Skeletons and notifications for asynchronous work." />
          <CardBody className="space-y-4">
            <SkeletonBlock />
            <Toast title="Saved" message="Your latest changes are ready for review." tone="success" />
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Dialog title="Dialog preview">
          <p className="text-sm leading-6 text-muted">Use dialogs for focused confirmation or short forms. Keep copy direct and non-technical.</p>
        </Dialog>
        <Drawer title="Drawer preview">
          <p className="text-sm leading-6 text-muted">Use drawers for contextual review, assistant guidance, or compact side workflows.</p>
          <Progress label="Review readiness" value={48} />
        </Drawer>
      </section>
    </div>
  );
}
