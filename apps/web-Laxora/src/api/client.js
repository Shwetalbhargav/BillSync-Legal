const DEFAULT_BASE_URL = "http://localhost:5000";
const env = import.meta.env || {};

export const baseUrl = (env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

export const friendlyMessages = {
  0: "Please check your internet connection and try again.",
  400: "Please check the details and try again.",
  401: "Please sign in again to continue.",
  403: "This area is not available for your role.",
  404: "We could not find that record.",
  409: "That item already exists.",
  422: "Some details need attention before continuing.",
  429: "Please wait a moment and try again.",
  500: "BillSync is having trouble right now. Please try again shortly.",
  503: "BillSync is temporarily unavailable. Please try again in a moment.",
};

export class BillSyncApiError extends Error {
  constructor({ data = null, message, path, status = 0 }) {
    super(message || friendlyMessages[status] || "Something did not go through. Please try again.");
    this.name = "BillSyncApiError";
    this.data = data;
    this.path = path;
    this.status = status;
    this.userMessage = this.message;
  }
}

function normalizePath(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      return;
    }
    query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

function isFormBody(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  if (contentType.includes("text/")) return response.text();
  return null;
}

export async function request(path, options = {}) {
  const { body, headers, params, ...fetchOptions } = options;
  const url = `${normalizePath(path)}${buildQuery(params)}`;
  const formBody = isFormBody(body);

  try {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        ...(formBody ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      ...fetchOptions,
      body: body && !formBody && typeof body !== "string" ? JSON.stringify(body) : body,
    });

    const data = await parseResponse(response);
    if (!response.ok) {
      throw new BillSyncApiError({
        data,
        path,
        status: response.status,
        message: friendlyMessages[response.status],
      });
    }

    return data;
  } catch (error) {
    if (error instanceof BillSyncApiError) throw error;
    throw new BillSyncApiError({
      path,
      status: 0,
      message: friendlyMessages[0],
      data: { cause: error?.message },
    });
  }
}

export function makeResource(resourcePath, { idKey = "id" } = {}) {
  return {
    list: (params) => request(resourcePath, { params }),
    get: (id, params) => request(`${resourcePath}/${id}`, { params }),
    create: (body) => request(resourcePath, { method: "POST", body }),
    update: (id, body) => request(`${resourcePath}/${id}`, { method: "PATCH", body }),
    replace: (id, body) => request(`${resourcePath}/${id}`, { method: "PUT", body }),
    remove: (id) => request(`${resourcePath}/${id}`, { method: "DELETE" }),
    idKey,
    path: resourcePath,
  };
}

export function createUploadBody(files = [], fields = {}) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value);
  });
  files.forEach((file) => form.append("files", file));
  return form;
}

export function makeCursorParams({ cursor, limit = 25, ...rest } = {}) {
  return {
    ...rest,
    cursor,
    limit,
  };
}
