# Tasks Daily Work

Branch: `feat/tasks-daily-work`

## Implemented Screens

- My Tasks: `/app/tasks`
- Task Board: `/app/tasks/board`
- Create Task: `/app/tasks/new`
- Task Detail: `/app/tasks/:taskId`
- Edit Task: `/app/tasks/:taskId/edit`
- My Work Today: `/app/my-work-today`

## Service Contract

`src/api/tasks.js` uses the available task resource:

- List tasks with status, assignee, matter, client, priority, and due-date filters.
- Create tasks with title, matter, client, assignee, due date, priority, and status.
- Update tasks and status.
- Delete tasks when the signed-in role allows it.

## UX States

- Loading states while task data loads.
- Empty states for task list, board, and today's work.
- Retry guidance when task data cannot be refreshed.
- Validation copy for missing title, matter, client, or assignee.
- Task detail work-meter launch with task and matter context.

## Known Gaps

- A persisted task-linked work-session contract is not available yet.
