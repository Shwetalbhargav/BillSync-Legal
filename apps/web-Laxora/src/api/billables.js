import { makeResource, request } from "./client.js";

export const billablesApi = {
  ...makeResource("/api/billables"),
  fromEmail: (emailEntryId, body) => request(`/api/billables/from-email/${emailEntryId}`, { method: "POST", body }),
  approve: (id, body) => request(`/api/billables/${id}/approve`, { method: "POST", body }),
  reject: (id, body) => request(`/api/billables/${id}/reject`, { method: "POST", body }),
};
