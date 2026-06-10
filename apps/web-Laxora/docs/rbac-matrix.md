# RBAC Matrix

Bootstrap uses this matrix for navigation and route planning. The dedicated RBAC branch will harden action-level permissions.

| Role | Dashboard | Matters | Tasks | Work Meter | Billing | Finance | Admin | Settings |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin | all | all | all | all | all | all | all | all |
| partner | firm | all | team | team | approve | reports | no | firm |
| lawyer | own/team | assigned | own | own | submit | own | no | own |
| associate | own/team | assigned | own | own | submit | own | no | own |
| intern | own | assigned | own | own | limited | no | no | own |

## Bootstrap Behavior

- Sidebar items are filtered by selected role.
- The role switcher is for tester visibility only.
- Feature branches must replace tester role switching with authenticated user role data.

