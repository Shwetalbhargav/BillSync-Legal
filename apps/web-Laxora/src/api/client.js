const DEFAULT_BASE_URL = "http://localhost:5000";

export const baseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

const friendlyMessages = {
  400: "Please check the details and try again.",
  401: "Please sign in again to continue.",
  403: "This area is not available for your role.",
  404: "We could not find that record.",
  409: "That item already exists.",
  422: "Some details need attention before continuing.",
  500: "BillSync is having trouble right now. Please try again shortly.",
  503: "BillSync is temporarily unavailable. Please try again in a moment.",
};

export async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(friendlyMessages[response.status] || "Something did not go through. Please try again.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function makeResource(resourcePath) {
  return {
    list: () => request(resourcePath),
    get: (id) => request(`${resourcePath}/${id}`),
    create: (body) => request(resourcePath, { method: "POST", body }),
    update: (id, body) => request(`${resourcePath}/${id}`, { method: "PATCH", body }),
    replace: (id, body) => request(`${resourcePath}/${id}`, { method: "PUT", body }),
    remove: (id) => request(`${resourcePath}/${id}`, { method: "DELETE" }),
  };
}
