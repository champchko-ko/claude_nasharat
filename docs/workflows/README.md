# School Administration Portal — End-to-End Role Workflows

This directory contains comprehensive, real-life operational workflows for every user role in the School Administration Portal, starting from a completely blank/empty deployment to full daily operations.

---

## 1. Role Overview & System Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Platform Owner (owner)                            │
│  - Bootstrap platform from empty app                                        │
│  - Create & govern School Tenants                                           │
│  - Manage School Achievements add-on & system-wide audit                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ provisions School Admin
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      School Administrator (school_admin)                    │
│  - Setup School Profile, Working Days, Date Format, & Logo                  │
│  - Configure Campus Locations & Academic Departments                        │
│  - Provision Staff & Assign Roles (Department Heads, Staff, Operators)      │
│  - Issue Circulars, Triage Maintenance, Manage Calendar, View Reports        │
└──────────────┬───────────────────────┼──────────────────────────┬───────────┘
               │                       │                          │
               ▼                       ▼                          ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌────────────────────┐
│ Department Head (head)  │ │      Staff / Teacher    │ │ Maintenance (op)   │
│ - Receive circ. tasks   │ │ - Check dashboard       │ │ - Receive tickets  │
│ - Department responses  │ │ - School circulars      │ │ - Progress status  │
│ - Lab/Dept maintenance  │ │ - Academic calendar     │ │ - Work notes       │
│ - Scoped calendar view  │ │ - Report repairs        │ │ - Proof photos     │
└─────────────────────────┘ └─────────────────────────┘ └────────────────────┘
```

---

## 2. Directory of Workflow Guides

| #   | Role                     | Workflow Guide                                                             | Primary Focus & Empty-App Starting Point                                                                                                          |
| --- | ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Platform Owner**       | [1_platform_owner_workflow.md](./1_platform_owner_workflow.md)             | Initial system bootstrap, claiming owner privilege, school creation, platform settings, achievements module.                                      |
| 2   | **School Administrator** | [2_school_admin_workflow.md](./2_school_admin_workflow.md)                 | First-time school onboarding, workweek settings, department/location setup, staff provisioning, issuing circulars, maintenance triage, reporting. |
| 3   | **Department Head**      | [3_department_head_workflow.md](./3_department_head_workflow.md)           | Department dashboard, receiving and responding to circulars, file attachment review, reporting departmental maintenance.                          |
| 4   | **Teacher / Staff**      | [4_teacher_staff_workflow.md](./4_teacher_staff_workflow.md)               | Daily dashboard routine, acknowledging general circulars, checking academic calendar, submitting classroom maintenance requests.                  |
| 5   | **Maintenance Operator** | [5_maintenance_operator_workflow.md](./5_maintenance_operator_workflow.md) | Ticket triage queue, transitioning legal repair states, logging work progress, uploading resolution photo evidence.                               |

---

## 3. Real-Life Multi-Tenant Operational Flow

1. **Day 0 (System Bootstrap):**
   - Platform Owner initializes Supabase & Vercel, creates the first account, and claims Platform Owner.
   - Platform Owner creates the school tenant and provisions the initial School Administrator account.
2. **Day 1 (School Onboarding):**
   - School Administrator logs in, fills in School Profile (Vision, Mission, Contact, Sunday–Thursday workweek), creates departments (Math, Science, English, etc.), locations (Building A, Science Lab, Room 101), and provisions accounts for Department Heads, Teachers, and Maintenance Operators.
3. **Day 2+ (Daily Academic Operations):**
   - School Admin issues official administrative circulars with PDF guidelines.
   - Department Heads and Staff receive instant Realtime notifications, review directives, and submit official acknowledgments.
   - Staff report facility repairs (AC failure, projector issues) via maintenance tickets with photos.
   - Operators pick up tickets, execute repairs, upload photo proof, and mark them completed.
   - School Admin monitors compliance on the Reports dashboard and exports verified CSV sheets.
