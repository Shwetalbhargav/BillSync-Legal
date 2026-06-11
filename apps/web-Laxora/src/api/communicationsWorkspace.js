import { backendGapAdapters } from "./gaps.js";

const whatsappTemplates = [
  {
    id: "appointment-reminder",
    name: "Appointment reminder",
    channel: "WhatsApp",
    status: "Needs provider",
    preview: "Reminder for tomorrow's consultation. Please reply if the time needs to change.",
  },
  {
    id: "document-request",
    name: "Document request",
    channel: "WhatsApp",
    status: "Needs provider",
    preview: "Please share the pending documents so the matter can move ahead.",
  },
];

const smsTemplates = [
  {
    id: "payment-reminder",
    name: "Payment reminder",
    channel: "SMS",
    status: "Needs provider",
    preview: "A short reminder for a pending invoice or payment confirmation.",
  },
  {
    id: "hearing-update",
    name: "Hearing update",
    channel: "SMS",
    status: "Needs provider",
    preview: "A short update about a hearing date or schedule change.",
  },
];

function providerCard(id, name, result) {
  return {
    id,
    name,
    status: result.status === "fulfilled" ? "connected" : "not-connected",
    detail: result.status === "fulfilled" ? "Provider is ready." : `${name} setup is required before messages can be sent.`,
  };
}

export const communicationsWorkspaceApi = {
  async loadCenter() {
    const [whatsappResult, smsResult, logsResult] = await Promise.allSettled([
      backendGapAdapters.whatsappProvider.load(),
      backendGapAdapters.smsProvider.load(),
      backendGapAdapters.communicationLogs.load(),
    ]);

    return {
      providers: [
        providerCard("whatsapp", "WhatsApp", whatsappResult),
        providerCard("sms", "SMS", smsResult),
      ],
      whatsappTemplates,
      smsTemplates,
      logs: [],
      issues: [
        whatsappResult.status === "rejected" ? "WhatsApp is not connected yet." : "",
        smsResult.status === "rejected" ? "SMS is not connected yet." : "",
        logsResult.status === "rejected" ? "Communication logs are waiting on provider setup." : "",
      ].filter(Boolean),
    };
  },

  async sendWhatsApp() {
    return backendGapAdapters.whatsappProvider.send();
  },

  async sendSms() {
    return backendGapAdapters.smsProvider.send();
  },
};
