# BillSync Legal: Frontend API Mapping Checklist (Lawyer Testing Suite)

This document maps the refined lawyer-first UI screens to the required data, actions, and backend behaviors. 

---

## 1. Authentication & Identity
### **Login**
- **Data needed:** None (initial state).
- **User actions:** Enter credentials, Click "Sign In", Click "Forgot Password".
- **Backend/API behavior:** `POST /auth/login` (returns JWT, user profile, firm context).
- **States:**
  - **Loading:** Spinner/Overlay on button (`Loading Workspace` screen).
  - **Error:** "Invalid credentials" or "Account locked" (Non-technical).
  - **Success:** Redirect to Dashboard or Setup Status.

---

## 2. Onboarding & Readiness
### **My Setup Status**
- **Data needed:** Connection status for: Browser Extension, Email, Legal Research, Calendar, Billing System. Setup % progress.
- **User actions:** Click "Start Setup", Click "Update Now", Click "Book Call".
- **Backend/API behavior:** `GET /user/setup-status` (returns boolean flags for all integrations).
- **States:**
  - **Loading:** Section skeletons.
  - **Empty:** N/A (Always shows status).
  - **Error:** "Status currently unavailable."

### **Chrome Extension Setup**
- **Data needed:** Step progress (1-8).
- **User actions:** Download zip, Copy developer path, Trigger test event, Click "Submit Test Results".
- **Backend/API behavior:** `POST /extension/test-event` (verifies handshake from browser).
- **States:**
  - **Success:** "Extension Connected" indicator.

### **Chrome Extension Status**
- **Data needed:** Connection health, Last captured item (Title, Time, Source).
- **User actions:** Click "Fix Now", Click "Test Connection", Click "Refresh Status".
- **Backend/API behavior:** `GET /extension/health` (Real-time diagnostic check).
- **States:**
  - **Error:** `Extension Connection - Needs Attention` screen logic.

---

## 3. Core Workflows (Lawyer Dashboard)
### **Lawyer Dashboard**
- **Data needed:** User greeting, Daily total worked, Active "Work Meter" state, Task list (Top 3), Recent matters (Top 2).
- **User actions:** Click "Start Work", Toggle task, Click "View All".
- **Backend/API behavior:** `GET /dashboard/summary` (Aggregated data for performance).
- **States:**
  - **Empty:** `Empty Dashboard` screen (No tasks/matters).

### **Work Meter (Standalone/Active)**
- **Data needed:** Client/Matter/Task dropdown options, Live timer value (if running).
- **User actions:** Select Matter/Task, Enter Notes, Click "Stop Work", Click "Submit for Billing", Click "Discard".
- **Backend/API behavior:** `POST /time-entries/start`, `PATCH /time-entries/stop`, `POST /time-entries/submit`.
- **States:**
  - **Error:** `Save Failed - Work Meter` screen (includes retry logic).
  - **Success:** Toast notification: "Time entry submitted for billing."

---

## 4. Matter & Task Management
### **My Matters / My Matters (Simplified)**
- **Data needed:** List of active matters (Name, ID, Client, Status, Last Action).
- **User actions:** Search matters, Filter by status, Click "Start Work" on matter.
- **Backend/API behavior:** `GET /matters?assigned_to=me`.
- **States:**
  - **Empty:** `No Matters Assigned` screen (with "Ask Admin" CTA).
  - **Search:** "No matters found matching '[query]'."

### **Matter Detail / Matter Timeline**
- **Data needed:** Financial summary (Invoiced, Budget, Unbilled), Next Steps, Team members, Activity Timeline.
- **User actions:** Click "Start Task", Click "Continue Setup", Filter timeline.
- **Backend/API behavior:** `GET /matters/{id}/details`, `GET /matters/{id}/timeline`.

### **My Tasks / Task Detail**
- **Data needed:** Task counts (Active, Overdue, Due Today), Task list (Description, Matter, Due Date).
- **User actions:** Click "Start Work", Click "Finish Task", Edit description.
- **Backend/API behavior:** `GET /tasks`, `PATCH /tasks/{id}/status`.
- **States:**
  - **Empty:** "Your task list is clear for today."

---

## 5. Automated Capture & Review
### **Gmail / Research Capture Review**
- **Data needed:** List of captured activities (Subject/Title, Date, Duration, Suggested Matter).
- **User actions:** Select items, Click "Confirm as Billable", Click "Dismiss", Click "Assign Matter".
- **Backend/API behavior:** `GET /captured-work/review`, `POST /captured-work/bulk-confirm`.
- **States:**
  - **Empty:** "No captured Gmail work yet."
  - **Success:** "3 items added to your billables."

### **My Billables (Simple Review)**
- **Data needed:** Totals (Unsubmitted, Recorded, Ready), List of confirmed time entries.
- **User actions:** Select entries, Click "Mark Ready for Billing", Export list.
- **Backend/API behavior:** `GET /billing/billables`.

---

## 6. Intelligence & Support
### **AI Assistant**
- **Data needed:** Chat history, Suggested actions (Summarize, Draft notes).
- **User actions:** Send message, Click "Summarize this file", Click "Try Again".
- **Backend/API behavior:** `POST /ai/chat` (Streamed response).
- **States:**
  - **Loading:** `AI Assistant - Taking Longer Than Expected` screen.
  - **Empty:** "How can I help you get ahead today?"

### **Help / Guide Center**
- **Data needed:** Featured workflows, How-to guides, Topic list.
- **User actions:** Search guides, Click "Ask a Question", Click "Send Email".
- **Backend/API behavior:** `GET /content/guides`.

---

## Technical Developer Notes (API Specifications)
- **Base URL:** `https://api.billsync.legal/v1`
- **Auth:** Bearer Token (JWT) required for all endpoints except `/auth/login`.
- **Error Handling:** API must return standard 4xx/5xx codes, but Frontend must map these to friendly messages (e.g., 401 -> `Session Expired` screen, 503 -> `BillSync temporarily unavailable`).
- **Web Meter Logic:** Persistence required via LocalStorage to handle `Internet Offline` states; sync to backend on reconnection.
- **AI Streaming:** Use Server-Sent Events (SSE) for AI Assistant to provide real-time typing feedback.
- **Pagination:** All lists (`Matters`, `Tasks`, `Billables`) should support cursor-based pagination for high-density performance.
