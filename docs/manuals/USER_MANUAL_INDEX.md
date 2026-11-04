# School Administration Portal — Official User Manuals Index

Welcome to the official user manual repository for the **School Administration Portal**.

The portal is an enterprise-grade, Arabic-first school operations and governance system. Because the portal enforces strict separation of duties and zero-trust role-based access control (RBAC), each user role operates within its own dedicated workflows.

---

## 1. Quick Directory: Choose Your Role Manual

Select the manual matching your role:

| #   | Role / Persona               | Target Audience                                                   | Primary Responsibilities & Guide Link                                                                                                                                                                                                   |
| --- | ---------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Platform Owner**           | Super Administrator / System Host                                 | **[Platform Owner Manual](./1_Platform_Owner_Manual.md)**<br>System bootstrap, school provisioning, database backup & disaster recovery, multi-tenant isolation, platform achievements.                                                 |
| 2   | **School Administrator**     | School Principal, Assistant Principal, Admin Deputy               | **[School Principal & Administrator Manual](./2_School_Principal_Administrator_Manual.md)**<br>Empty-app setup, school profile, workweek days, departments, locations, user accounts, circulars, maintenance triage, calendar, reports. |
| 3   | **Department Head**          | Heads of Academic & Admin Departments (Math, Science, English...) | **[Department Head Manual](./3_Department_Head_Manual.md)**<br>Departmental dashboard, reviewing official circulars, downloading/printing attachments, submitting department responses, reporting lab/department repairs.               |
| 4   | **Teacher / Academic Staff** | Teachers, Counselors, Academic Staff                              | **[Teacher & Academic Staff Manual](./4_Teacher_Staff_Manual.md)**<br>Daily dashboard routine, acknowledging general circulars, academic calendar and exams, reporting classroom repairs with photos.                                   |
| 5   | **Maintenance Technician**   | Facilities Operators, Technicians, Service Staff                  | **[Maintenance Technician Manual](./5_Maintenance_Technician_Manual.md)**<br>Mobile maintenance queue, ticket triage, state transitions (`in_progress` -> `completed`), work notes, photo proof uploads.                                |

---

## 2. Role Permissions & Accessible Routes Matrix

| Feature / Route                                    | Platform Owner (`owner`) | School Admin (`school_admin`) | Dept Head (`department_head`) | Teacher / Staff (`staff`) | Maintenance (`operator`) |
| -------------------------------------------------- | :----------------------: | :---------------------------: | :---------------------------: | :-----------------------: | :----------------------: |
| **Personalized Dashboard** (`/dashboard`)          |      Full Platform       |       School Operations       |      Departmental Focus       |      Personal Tasks       |     Work Order Queue     |
| **School Settings** (`/settings/*`)                |        Read/Audit        |          Full Access          |           No Access           |         No Access         |        No Access         |
| **User & Role Management** (`/settings/users`)     |       System Scope       |      School Staff Scope       |           No Access           |         No Access         |        No Access         |
| **Circulars Management** (`/circulars/new`)        |           Yes            |     Create, Edit, Delete      |        View & Respond         |    View & Acknowledge     |        View Only         |
| **Circulars Compliance** (`/reports`)              |    View & Export CSV     |       View & Export CSV       |           No Access           |         No Access         |        No Access         |
| **Maintenance Work Orders** (`/maintenance`)       |      Full Oversight      |        Triage & Assign        |        Submit & Track         |      Submit & Track       |     Execute & Update     |
| **School Calendar** (`/calendar`)                  |       Full Manage        |         Create & Edit         |         View & Filter         |       View & Filter       |      View & Filter       |
| **School Achievements** (`/achievements`)          |     Exclusive Access     |            Hidden             |            Hidden             |          Hidden           |          Hidden          |
| **Database Backup & Restore** (`/settings/backup`) |     Exclusive Access     |            Hidden             |            Hidden             |          Hidden           |          Hidden          |

---

## 3. General Support & Frequently Asked Questions (FAQ)

### Q1: How do I switch between Arabic and English?

Click the language button (`العربية` / `English`) in the top navigation bar at any time. The interface dynamically switches between RTL (Right-to-Left) and LTR (Left-to-Right) layouts while preserving your current view.

### Q2: How do I reset a forgotten password?

On the login screen (`/login`), click the **Forgot password?** (`نسيت كلمة المرور؟`) link. Enter your registered email address to receive an instant, secure reset link.

### Q3: How do Real-Time Notifications work?

When an administrator publishes a circular targeted to your department or assigns a maintenance ticket to your queue, an interactive toast notification appears on your screen in real time over WebSockets. Clicking the toast takes you directly to the relevant record.

### Q4: Why can't I schedule events on Friday and Saturday?

In alignment with the school's operational workweek, Friday and Saturday are configured as official weekly holidays. The calendar engine prevents scheduling events on weekend dates across the date picker, form submission, and server actions, and recurring series automatically skip weekend dates.

### Q5: Who can be assigned as a Maintenance Technician?

Only active faculty accounts assigned the dedicated **Maintenance Operator** role (`operator` / `فني صيانة`) appear in the technician dispatch list. If no technician exists in your school, a warning banner appears with a shortcut to register one in Settings.

### Q6: How are destructive actions confirmed?

All deletion and irreversible actions across the portal (such as deleting departments, locations, user assignments, circulars, or achievements) display an in-app accessible confirmation dialog (`AppMessageBox`) with safety warnings rather than native browser popups.

### Q7: What themes are available and how do I change them?

The portal includes 5 curated visual themes: **Royal Navy (Default)** (`كحلي ملكي [افتراضي]`), **Classic Light** (`فاتح كلاسيكي`), **Slate Dark** (`داكن هادئ`), **Emerald Academy** (`أكاديمية الزمرد`), and **Midnight OLED** (`سواد الليل [OLED]`). Click the palette icon in the header to select your preferred appearance.
