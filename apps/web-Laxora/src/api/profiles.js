import { makeResource, request } from "./client.js";

function makeProfileApi(path) {
  return {
    ...makeResource(path),
    me: () => request(`${path}/me`),
    updateMe: (body) => request(`${path}/me`, { method: "PATCH", body }),
    deleteMe: () => request(`${path}/me`, { method: "DELETE" }),
    byUser: (params) => request(`${path}/by-user`, { params }),
    byId: (params) => request(`${path}/by-id`, { params }),
    dashboard: (params) => request(`${path}/dashboard`, { params }),
  };
}

export const partnerProfilesApi = {
  ...makeProfileApi("/api/partner-profiles"),
  updateMe: (body) => request("/api/partner-profiles/me", { method: "PUT", body }),
  deleteMe: () => request("/api/partner-profiles/me/delete", { method: "POST" }),
  update: (body) => request("/api/partner-profiles/update", { method: "PUT", body }),
  remove: (body) => request("/api/partner-profiles/remove", { method: "POST", body }),
};

export const lawyerProfilesApi = makeProfileApi("/api/lawyer-profiles");
export const associateProfilesApi = makeProfileApi("/api/associate-profiles");

export const internProfilesApi = {
  ...makeProfileApi("/api/intern-profiles"),
  view: (params) => request("/api/intern-profiles/view", { params }),
  update: (body) => request("/api/intern-profiles/update", { method: "PUT", body }),
  remove: (body) => request("/api/intern-profiles/remove", { method: "POST", body }),
};
