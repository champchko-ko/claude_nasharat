# User Manual: Maintenance Technician & Facilities Operator

> **Role Key:** `operator`  
> **Access Scope:** Facilities maintenance dispatch queue, work order state transitions, technical progress logs, and resolution evidence uploads.

---

## 1. Introduction

As a **Maintenance Technician or Facilities Operator**, you are responsible for campus safety, physical facilities readiness, and rapid repair resolution.

The portal functions seamlessly on mobile phones and tablets, allowing you to manage work orders on the move across campus.

> **Role & Eligibility Note:** To receive work orders in the maintenance queue, your account must be assigned the dedicated **Maintenance Operator** role (`operator` / `فني صيانة`). The dispatcher interface strictly routes work orders to verified technicians.

---

## 2. Phase 1: Logging In & Mobile Access

1. Open the portal URL on your mobile phone browser (or install the portal as a Progressive Web App on your home screen).
2. Enter your email and password provided by the School Administrator.
3. Tap **Sign In**.
4. The mobile navigation drawer adapts automatically to your screen size.

---

## 3. Phase 2: Daily Maintenance Workflows

### 1. Receiving Assigned Work Orders

When a teacher reports an issue and the School Administrator assigns it to you:

1. You will receive an immediate **Real-Time Push Notification** on your screen.
2. The **Notification Bell** in the top header will display an unread alert.
3. Tapping the notification takes you directly to the work order.

---

### 2. Inspecting Ticket Details & Reporter Evidence

Open the ticket from your **Maintenance Queue** (`/maintenance`):

- **Specific Location:** (e.g., `مبنى الإدارة - غرفة 204`).
- **Category & Priority:** Review if the ticket is flagged as an **Emergency** or **Urgent**.
- **Report Description:** Symptoms observed by the teacher or staff member.
- **Initial Report Photo:** Tap the attached image to zoom in and examine the broken hardware before heading to the room.

---

### 3. Step-by-Step Ticket Lifecycle

The portal enforces a verified state-machine workflow to ensure accountability:

```
[ Assigned ]  ➔  [ In Progress ]  ➔  [ Completed ]  ➔  [ Closed by Admin ]
```

#### Step 1: Starting the Repair (`in_progress`)

1. When you arrive at the location and begin diagnosing or fixing the equipment, open the ticket.
2. Tap the action button **Start Work** (`بدء العمل`).
3. The ticket status updates to `in_progress`.
   - The reporter and administration can see that an operator is actively on site.

#### Step 2: Adding Work Notes & Updates

If you need to leave the site to fetch spare parts from storage:

1. Scroll down to the **Work Notes** section on the ticket.
2. Enter a brief note (e.g., `تم فحص الضاغط، جاري إحضار صمام بديل من المستودع`).
3. Tap **Post Note**.
4. This keeps the reporting teacher informed without requiring phone calls.

#### Step 3: Completing the Work & Attaching Photo Evidence (`completed`)

Once the equipment is repaired and tested:

1. On the ticket page, tap **Mark Completed** (`تم الإنجاز`).
2. **Resolution Summary:** Enter a brief description of the repair (e.g., `تم استبدال قاطع الكهرباء الرئيسي وإعادة تشغيل الإنارة بنجاح`).
3. **Completion Evidence (Recommended):** Take a photo of the repaired equipment with your phone camera and attach it.
4. Tap **Submit Completion**.
5. The School Administrator will review your work and photo proof before archiving the ticket as `closed`.

---

### 4. Handling Rejections or Unserviceable Requests

If a request is outside maintenance scope (e.g., software installation) or duplicate:

1. Tap **Reject Request** (`رفض الطلب`).
2. Enter a mandatory reason explaining why the ticket cannot be fulfilled.
3. Tap **Confirm Rejection**. The ticket is routed back to the dispatcher.
