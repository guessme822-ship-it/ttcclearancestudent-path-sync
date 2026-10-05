# Student Clearance Management System — Torres Capitol College, Inc.

Built in phases. The core clearance flow (request → office review → completion) works end to end before the secondary features are added.

## Visual direction
- Light, clean academic dashboard: white surfaces, deep academic blue as the main color, sky-blue accents
- Fonts: Plus Jakarta Sans for headings, Figtree for body text
- Rounded cards, soft shadows, a light frosted-glass effect only on the top bar and dialogs
- Status colors: Pending yellow, Approved green, Rejected red, Not Started gray
- Mobile: bottom navigation for students, a slide-out sidebar for staff and admin, tables turn into cards
- Dark mode is optional and comes last

## Phase 1 — Foundation and login
- Turn on Lovable Cloud (database plus logins)
- Login, student registration, forgot password, reset password page, logout, and sessions that stay signed in
- Three roles: Student, Office Staff, Administrator. Roles are stored separately and checked on the server
- Each role is sent to its own area. Students are blocked from staff and admin pages

## Phase 2 — Core clearance workflow
- Offices that the admin can configure: name, description, assigned staff, active/inactive, order
- A student requests clearance in steps: Start → Review info → Confirm → Submit. This creates one record for each currently active office, plus a reference number
- Student status page: one card per office showing the approver, date, remarks, and the action needed if rejected. Includes an overall progress ring ("3 / 5 approved, 60%")
- Staff queue lists only requests for their own office. It has search, filters (status, program, year, date), and sorting
- Review page: Approve opens a confirmation. Reject requires a reason. Both save who acted and when, add to the history, and notify the student
- When every office approves, the request is automatically marked COMPLETED. The student sees a success screen and can print a clearance confirmation

## Phase 3 — Dashboards and notifications
- Student dashboard: profile summary, progress, approved/pending/rejected counts, recent activity
- Staff dashboard: pending, approved today, rejected today, total processed, average processing time
- Admin dashboard: 7 key numbers plus 4 charts (status mix, requests over time, office performance, students by program)
- Notification bell with an unread badge, a dropdown, a full page, and mark as read / mark all as read

## Phase 4 — Admin management
- Students: add, edit, view details (personal, academic, current clearance, history, activity), search, filter, activate/deactivate
- Offices: add, edit, deactivate, reorder, remove (with a confirmation)
- Users: create, edit, change role, activate/deactivate, send a password reset, assign staff to an office
- Reports: filterable by date, program, office, and status, with a print-friendly layout
- Activity log (admin only): user, action, date and time, related clearance, old status → new status
- System settings: school year, semester, whether students can edit academic fields

## Phase 5 — Installable app and polish
- App manifest, app icon, install prompt, loading screen
- Offline: only the app shell and an "You're offline. Changes need a connection" banner. Approvals, requests, and other data never pretend to work offline. Offline mode works only on the published app, not in the editor preview
- Loading skeletons, empty states, error states with retry, and success messages on every main page
- Profile page: students edit contact details. Academic fields are locked unless the admin allows editing
- Help / Support page

## Demo data
- Sample offices (Registrar, Cashier, Library, Guidance, Department Office) and demo accounts (1 admin, 1 staff per office, a few students), all clearly marked "DEMO"
- The admin can filter demo records out or delete them in one step

## Technical details
- Tables: profiles (linked to the login user), user_roles (separate from profiles; app_role enum), students (academic data, is_demo), offices (sort_order, is_active), office_staff, clearance_requests (reference_no, school_year, status, completed_at), clearance_items (request_id, office_id, status, reviewed_by, reviewed_at, remarks), notifications, activity_logs, settings
- Row-level security: students read only their own data. Staff read and update only items for their own office. Admin has full access through has_role()
- Status changes go through server functions protected by requireSupabaseAuth, with Zod validation and an office-membership check. A database trigger recalculates the overall status, creates notifications, and writes the audit log
- Protected areas: /student, /staff, /admin under the _authenticated layout, with a role gate on each
- Installable app: vite-plugin-pwa with a guarded registration that is off in the preview
