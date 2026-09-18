# DSDF Fiber Operations Portal  
## Client Delivery Document

**Prepared for:** DSDF Consultancy Services Pvt. Limited  
**Product:** Fiber Operations Portal (Admin + Field Engineer App)  
**Date:** 6 September 2026

---

## 1. Purpose

This document describes what will be delivered as the **DSDF Fiber Operations Portal** — a web system to manage fiber companies, customer links, field tickets, engineers, attendance, SLA, and operations reports.

The portal replaces the earlier desktop/single-file operations tool with a production web application that office staff and field engineers can use from a browser or phone.

---

## 2. What the client will receive

Two connected applications on one platform:

| Application | Who uses it | How they access it |
| --- | --- | --- |
| **Admin Operations Panel** | Office / NOC / operations team | Web browser on desktop or laptop |
| **Field Engineer App** | Field engineers | Phone browser (mobile-first) or desktop |

Both applications share the same live data. When an admin assigns a ticket, the engineer sees it immediately. When an engineer updates attendance or ticket status, the office sees it in admin.

The client will also receive:

- Secure login for admin and engineers
- Cloud database (MongoDB) for all operational records
- CSV exports for tickets, customers, engineers, and attendance
- Optional WhatsApp alert when a ticket is assigned to an engineer
- First-admin setup and engineer onboarding by invite link

---

## 3. Admin Operations Panel

Office users log in with email and password.

### 3.1 Operations dashboard

A live home screen showing:

- Total customers and fiber links
- Open vs closed tickets
- SLA-breached tickets
- Active field engineers
- Incoming ticket flow (Implementation vs Support, by month)
- Recent tickets with status and SLA result

### 3.2 Companies

Register and maintain client / ISP companies:

- Company name, contact, email, address
- Active / Inactive status
- Remarks

A customer link cannot be created until the company is registered.

### 3.3 Customers and links

Full fiber-link master for each customer circuit:

- Customer name and registered company
- City, service type, bandwidth
- Link type: Linear or Link Protection
- Path: Main Path or Protection Path
- Fiber core: Single Core or Dual Core
- Category: FTTH, Enterprise, Bank, Other
- Managed by own team or vendor (vendor name and contact)
- A-end and B-end location names
- A-end and B-end latitude / longitude
- Implementation date
- Customer contact
- Default SLA hours (typically 4 hours)
- Status and remarks

**Link ID rule (as agreed):**

- For most companies, the system **auto-generates** a unique Link ID in the format  
  `DSDF-COMP-CITY-M/P-00001`
- For **Vodafone Idea Limited**, Link ID is **entered manually** (not auto-generated)

### 3.4 Tickets

Create and manage field tickets against a customer link.

**Ticket types**

- **Support** — incident / restoration work
- **Implementation** — new or change implementation

**Ticket fields**

- Company ticket number
- Customer / link
- Priority: Critical, High, Medium, Low
- Status: Open → Assigned → In Progress → Pending → Resolved → Closed
- Primary and secondary engineer
- Open time and close time
- SLA hours (defaults from the customer link)
- A-end / B-end, optical power readings
- Optical status: Pending, OK, Not OK
- Affected path (Main / Protection)
- Resolution notes and remarks

**Business rules**

- An **Implementation** ticket can be closed only when optical status is **OK**
- When a ticket is closed, the system calculates **duration** and marks SLA as **MET** or **BREACHED**
- Assigning an engineer can send a **WhatsApp** notification to that engineer

### 3.5 Engineers

Maintain the field team:

- Name, employee ID, post, department
- WhatsApp mobile number
- Joining date, area, Active / Inactive
- Password (set by admin, or later by the engineer)

**Onboarding**

1. Admin creates the engineer
2. Admin generates a one-time onboarding link
3. Engineer opens the link on their phone, sets a password, and activates the field app

### 3.6 Attendance

Office can view and maintain attendance for all engineers:

- Date, in-time, out-time
- Status: Present, Absent, Leave, Half Day
- Remarks

Engineers can also mark their own attendance from the field app.

### 3.7 Reports

Operations reporting without leaving the portal:

- **Incoming ticket flow** — Implementation vs Support by month
- **Repeated links** — same-month tickets that reopen after a link was resolved/closed
- **Attendance report** — filter by date range, engineer, and status (Present / Absent / Leave / Half Day)
- **CSV download** for Tickets, Customers, Engineers, and Attendance

### 3.8 Settings

- Change admin password
- See WhatsApp Cloud API status (configured or not)

---

## 4. Field Engineer App

Engineers log in with **mobile number and password**.

The app is built for phone use (bottom navigation) and also works as a desktop portal.

### 4.1 Home

- Counts of assigned, open, and closed jobs
- Recent assigned tickets
- Quick actions: mark attendance, open tickets

### 4.2 Tickets

Engineers see **only tickets assigned to them**.

They can update:

- Status and remarks
- Resolution
- Optical power / optical status (where required)
- Close the job when work is complete

They cannot see other engineers’ tickets or change company / customer masters.

### 4.3 Attendance

Engineer marks own attendance (Present, Absent, Leave, Half Day) with in/out time.

### 4.4 Account

Engineer can change their own password.

---

## 5. Security and access

| Role | Login | What they can do |
| --- | --- | --- |
| **Admin** | Email + password | Full operations: companies, links, tickets, engineers, attendance, reports, settings |
| **Engineer** | Mobile + password | Own tickets, own attendance, own password |

Additional controls:

- Sessions are secured with signed cookies
- Passwords are stored hashed (never in plain text)
- First-time setup: if no admin exists, a first admin account can be created from the login page
- Engineers are activated through an admin-generated onboarding link

---

## 6. WhatsApp assignment alerts

When an admin assigns a ticket, the system can send a WhatsApp message to the engineer with:

- Ticket number and type
- Customer and link
- Priority and city

**What the client needs for live WhatsApp**

- A Meta (Facebook) Business app with WhatsApp product enabled  
  *(Meta’s free test sender can be used; a dedicated business number is not required to start)*
- Access token and Phone Number ID from Meta
- Engineer mobile numbers added as allowed recipients in Meta (for test / production as applicable)

Until Meta credentials are provided, assignment still works inside the portal. WhatsApp is recorded as a dry-run (not sent). This is intentional so operations are never blocked by messaging setup.

---

## 7. Technology delivered

| Item | Delivery |
| --- | --- |
| Web application | Next.js (React) production app |
| Database | MongoDB cloud database |
| Admin UI | Desktop-first operations panel |
| Field UI | Mobile-first engineer app (PWA-ready) |
| Hosting readiness | Standard Node.js web deploy (client or FusionAIX hosting as agreed) |


---

## 8. What is not included in this delivery

The following are **out of scope** unless a later phase is approved:

- Inventory / materials / stock issue and return
- Native iOS or Android store apps (engineers use the mobile web app)
- Customer self-service portal or public website
- Billing, invoicing, or payment collection
- GPS live tracking of engineers
- Two-way WhatsApp chat or ticket creation from WhatsApp
- Multi-company / multi-tenant white-label for other firms
- Data migration from the old desktop file (can be quoted separately)
- Production hosting, domain, SSL, and Meta WhatsApp production approval (unless contracted)

---

## 9. Client responsibilities

To go live, the client will provide or confirm:

1. Company list and initial customer / link data (or approve empty start)
2. Engineer names and WhatsApp mobile numbers
3. Admin users who should receive office login
4. Hosting / domain decision (if FusionAIX is not hosting)
5. Meta WhatsApp credentials, if live assignment SMS/WhatsApp is required
6. Confirmation of SLA hours per link and the Vodafone Idea manual Link ID process

---

## 10. Acceptance — what “done” means

The delivery is accepted when the client can:

1. Log in as admin and create a company, customer link, engineer, and ticket
2. See the ticket on the engineer’s phone after assignment
3. Have the engineer update ticket status and mark attendance
4. See SLA **MET / BREACHED** after a ticket is closed
5. Confirm Implementation tickets cannot close unless optical status is **OK**
6. Download CSV reports for tickets, customers, engineers, and attendance
7. Generate an engineer onboarding link and complete first login
8. (Optional) Receive a WhatsApp assignment message once Meta is configured

---

## 11. Summary for the client

You will receive a **live operations portal** for DSDF fiber work:

- Office staff run companies, links, tickets, engineers, attendance, and reports
- Field engineers run assigned jobs and attendance from their phone
- Link IDs, Implementation optical checks, and SLA are enforced in the system
- WhatsApp assignment alerts are ready once Meta is connected

No inventory module is included in this phase. Everything listed in sections 3–7 is in scope for this delivery.
