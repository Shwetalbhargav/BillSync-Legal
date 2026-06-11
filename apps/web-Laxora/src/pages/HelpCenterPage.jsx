import { BookOpen, LifeBuoy, Plug, Timer } from "lucide-react";
import { Card, CardBody, CardHeader, StatusBadge } from "../components/common";

const guides = [
  {
    title: "Start your day",
    icon: BookOpen,
    message: "Review dashboard reminders, assigned matters, and work that is ready for billing review.",
  },
  {
    title: "Use the work meter",
    icon: Timer,
    message: "Start the meter before focused work and add a clear note before submitting for review.",
  },
  {
    title: "Connect the extension",
    icon: Plug,
    message: "Use extension setup to capture email and research work with fewer manual steps.",
  },
  {
    title: "Get help",
    icon: LifeBuoy,
    message: "If something looks unfamiliar, ask your firm administrator or use the assistant for plain-language guidance.",
  },
];

export function HelpCenterPage() {
  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Guide Center</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Help Center</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Short, practical guidance for lawyers and firm operators using BillSync day to day.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <Card key={guide.title}>
              <CardHeader title={guide.title} action={<StatusBadge tone="accent">Guide</StatusBadge>} />
              <CardBody>
                <div className="flex gap-3">
                  <div className="rounded-lg bg-blueSoft p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm leading-6 text-muted">{guide.message}</p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
