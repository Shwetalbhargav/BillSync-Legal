import { request } from "./client.js";
import { asList, normalizeAttendanceDay, normalizeAttendanceSummary, normalizeHoliday, normalizeLeaveRequest } from "./normalizers.js";

function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, "data")) return response.data;
  return response;
}

export const attendanceApi = {
  async list(params) {
    const data = unwrap(await request("/api/attendance", { params }));
    return {
      rows: asList(data.rows).map(normalizeAttendanceDay),
      summary: normalizeAttendanceSummary(data.summary),
    };
  },
  rebuild: (params) => request("/api/attendance/rebuild", { method: "POST", params }),
  async listLeaveRequests(params) {
    return asList(unwrap(await request("/api/attendance/leave-requests", { params }))).map(normalizeLeaveRequest);
  },
  createLeaveRequest: (body) => request("/api/attendance/leave-requests", { method: "POST", body }),
  reviewLeaveRequest: (id, body) => request(`/api/attendance/leave-requests/${id}/review`, { method: "POST", body }),
  async listHolidays() {
    return asList(unwrap(await request("/api/attendance/holidays"))).map(normalizeHoliday);
  },
  createHoliday: (body) => request("/api/attendance/holidays", { method: "POST", body }),
};
