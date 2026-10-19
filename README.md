# Ttcclearancestudent Path Sync

Create a fully functional, responsive, and installable Student Clearance Management System for Torres Capitol College, Inc.



PROJECT TITLE:

Student Clearance Management System



SCHOOL:

Torres Capitol College, Inc.

Purok-2B, Sayre Highway, Pandalatan, Maramag, Bukidnon 8714, Philippines



PROJECT PURPOSE:

Replace the traditional paper-based student clearance process with a centralized digital system where students can request clearance, monitor the approval status of different offices, and receive notifications. Authorized school personnel should be able to review, approve, reject, and manage student clearance requests.



IMPORTANT:

This is a real working system prototype, not just a UI mockup. All buttons, forms, navigation, status updates, filters, search, authentication, and CRUD operations should work properly.



DESIGN / UI / UX:

Create a modern, professional, clean, and student-friendly UI/UX.



Visual style:

- Modern academic technology dashboard

- Professional but visually attractive

- Clean white/light background with subtle blue accents

- Optional dark mode

- Glassmorphism used subtly, not excessively

- Rounded cards and buttons

- Soft shadows

- Smooth transitions and micro-animations

- Clear typography

- Excellent spacing and visual hierarchy

- Use consistent icons

- Responsive on desktop, laptop, tablet, and mobile

- Mobile-first responsive layout

- Avoid cluttered screens

- Use confirmation dialogs for destructive actions

- Use toast notifications for successful or failed actions

- Include loading states and empty states

- Include skeleton loaders where appropriate

- Make accessibility and readability a priority



Do NOT copy the design of an existing clearance system. Create an original interface.



USER ROLES:



1. STUDENT

2. CLEARANCE STAFF / OFFICE APPROVER

3. ADMINISTRATOR



AUTHENTICATION:

Create a secure authentication system.



Include:

- Login

- Student registration

- Forgot password

- Password reset

- Logout

- Role-based access

- Protected routes

- Session persistence



Students must never be able to access the administrator dashboard.



==================================================

STUDENT SIDE

==================================================



Create a Student Dashboard.



Dashboard should display:



- Student name

- Student ID

- Program

- Year level

- Current clearance status

- Progress percentage

- Number of approved offices

- Number of pending offices

- Number of rejected offices

- Current clearance request

- Notifications

- Recent activity



MAIN STUDENT NAVIGATION:



Dashboard

My Clearance

Clearance Status

Notifications

Profile

Help / Support

Logout



STUDENT PROFILE:



Allow students to view and edit:



- Student ID

- Last Name

- First Name

- Middle Name

- Email

- Contact Number

- Program

- Year Level

- Section



Do not allow students to modify sensitive academic information unless permitted by the administrator.



==================================================

CLEARANCE REQUEST

==================================================



Create a clear "Request Clearance" workflow.



The student should be able to:



1. Start a clearance request.

2. Review their information.

3. Confirm the request.

4. Submit the clearance request.

5. Receive a confirmation notification.

6. Track the approval progress.



After submission, automatically create clearance records for the required offices.



Example offices:



- Registrar

- Cashier

- Library

- Guidance Office

- Department / Program Office

- Other authorized school offices



Make the office list configurable by the administrator instead of hard-coded.



==================================================

CLEARANCE STATUS

==================================================



Create a visual clearance tracking page.



Show each office as a separate status card/timeline.



Example:



Registrar

✓ Approved



Cashier

⏳ Pending



Library

✓ Approved



Guidance Office

⏳ Pending



Department Office

✕ Rejected



Use clear status indicators:



Pending = yellow

Approved = green

Rejected = red

Not Started = gray



Display:



- Office name

- Assigned approver

- Status

- Date reviewed

- Remarks

- Last updated

- Action required, if applicable



Create a visual overall progress indicator such as:



3 / 5 Offices Approved

60% Complete



If an office rejects the clearance, clearly show the reason and allow the student to understand what action is required.



==================================================

OFFICE / APPROVER DASHBOARD

==================================================



Create a separate dashboard for authorized clearance personnel.



Each staff member should only see clearance requests assigned to their office.



Dashboard statistics:



- Pending requests

- Approved today

- Rejected today

- Total processed

- Average processing time



Include:



- Search students

- Filter by status

- Filter by program

- Filter by year level

- Filter by date

- Sort requests



Clearance request table should include:



Student ID

Student Name

Program

Year Level

Request Date

Status

Last Updated

Action



==================================================

APPROVAL WORKFLOW

==================================================



When an office opens a clearance request, show a detailed review page.



Display:



Student information

Clearance request information

Previous actions

Current office status



Provide:



[Approve]

[Reject]



Before rejecting, require the staff member to provide a reason.



Before approving, show a confirmation dialog.



After approval:



- Update the office status

- Record the approver

- Record date/time

- Add activity history

- Notify the student



After rejection:



- Update status to Rejected

- Save rejection reason

- Record approver

- Record date/time

- Notify the student



==================================================

ADMIN DASHBOARD

==================================================



Create a powerful but simple administrator dashboard.



Admin navigation:



Dashboard

Students

Clearance Requests

Offices

Users

Reports

Notifications

System Settings

Activity Logs

Logout



ADMIN DASHBOARD STATISTICS:



- Total Students

- Active Students

- Pending Clearances

- Completed Clearances

- Rejected Clearances

- Total Offices

- Requests Today



Include charts showing:



- Clearance status distribution

- Clearance requests over time

- Office approval performance

- Students by program



==================================================

STUDENT MANAGEMENT

==================================================



Admin can:



- Add student

- Edit student

- View student

- Search student

- Filter students

- Activate/deactivate student

- View student's clearance history



Student details page should include:



Personal information

Academic information

Current clearance

Clearance history

Approval history

Activity history



==================================================

OFFICE MANAGEMENT

==================================================



Admin can create and manage clearance offices.



Fields:



- Office Name

- Office Description

- Assigned Staff

- Office Status

- Clearance Order



Example:



1. Registrar

2. Cashier

3. Library

4. Guidance Office

5. Department Office



Admin must be able to add, edit, deactivate, reorder, or remove offices.



Changing the office configuration should automatically affect new clearance requests.



==================================================

USER MANAGEMENT

==================================================



Admin can manage system users.



User types:



Student

Office Staff

Administrator



Admin can:



- Create user

- Edit user

- Change role

- Activate/deactivate account

- Reset password

- Assign staff to an office



==================================================

NOTIFICATION SYSTEM

==================================================



Create an in-system notification center.



Students should receive notifications when:



- Clearance request is submitted

- An office approves the request

- An office rejects the request

- A rejection requires action

- Clearance is completely approved



Staff should receive notifications when:



- A new clearance request is assigned to their office



Admin should receive important system notifications.



Create:



- Notification badge

- Notification dropdown

- Notification page

- Read/unread state

- Mark as read

- Timestamp



==================================================

CLEARANCE COMPLETION

==================================================



When ALL required offices approve the student's clearance:



Automatically change the overall clearance status to:



"COMPLETED"



Show a prominent success screen.



Example:



CLEARANCE COMPLETED

All required offices have approved your clearance.



Include:



- Completion date

- Clearance reference number

- Approved offices

- Clearance history



Add an option to generate/download a printable clearance confirmation.



==================================================

CLEARANCE HISTORY

==================================================



Students should be able to see previous clearance requests.



Display:



Clearance Reference Number

School Year

Request Date

Completion Date

Overall Status



Allow students to open a previous clearance and view its approval history.



==================================================

SEARCH AND FILTERING

==================================================



Implement working search and filters throughout the system.



Search by:



- Student ID

- Student name

- Reference number



Filters:



- Status

- Program

- Year level

- Office

- Date



==================================================

REPORTS

==================================================



Admin reports should include:



- Total clearance requests

- Completed clearances

- Pending clearances

- Rejected clearances

- Office approval statistics

- Clearance requests by program

- Clearance requests by date



Allow reports to be filtered.



Provide print-friendly report layouts.



==================================================

ACTIVITY LOG

==================================================



Create an audit/activity log.



Record:



- User

- Action

- Date

- Time

- Related clearance

- Previous status

- New status



Examples:



"Student submitted clearance request"

"Registrar approved clearance"

"Cashier rejected clearance"

"Admin created new office"



Only administrators can access the complete activity log.



==================================================

DATABASE

==================================================



Use a proper relational database.



Suggested entities:



users

students

offices

clearance_requests

clearance_items

notifications

activity_logs



Use proper relationships and foreign keys.



Each clearance request should have multiple clearance items, one for each required office.



Do not duplicate unnecessary student information.



==================================================

SECURITY

==================================================



Implement:



- Role-based authorization

- Protected routes

- Secure authentication

- Input validation

- Server-side authorization

- Prevent students from accessing admin pages

- Prevent staff from accessing unrelated office records

- Prevent unauthorized modification of clearance status

- Confirmation dialogs for sensitive actions

- Proper error handling



==================================================

RESPONSIVE DESIGN

==================================================



The system must work properly on:



- Android phones

- iPhones

- Tablets

- Laptops

- Desktop computers



On mobile:



- Use a collapsible sidebar or bottom navigation

- Convert large tables into responsive cards

- Keep buttons easy to tap

- Avoid horizontal scrolling whenever possible



==================================================

PWA / INSTALLABLE

==================================================



Make the application installable as a Progressive Web App if supported.



Include:



- App manifest

- App icon

- Responsive mobile layout

- Install prompt

- Offline-friendly app shell

- Proper loading screen



Important:

Do not pretend that server-side operations work offline. Clearly separate offline UI/app-shell functionality from operations that require the database/server.



==================================================

ERROR AND EMPTY STATES

==================================================



Every major page must have:



- Loading state

- Empty state

- Error state

- Success state



Examples:



"No clearance requests yet."

"No students found."

"No notifications."

"Unable to load clearance data. Please try again."



==================================================

FINAL UI QUALITY

==================================================



The finished system should feel like a real college information system, not a simple CRUD demo.



Prioritize:



1. Excellent UX

2. Clear clearance workflow

3. Easy status tracking

4. Professional dashboard

5. Mobile responsiveness

6. Accessibility

7. Reliable database relationships

8. Role-based security

9. Clean visual design

10. Fully functional interactions



Before considering the project complete, test every navigation item, form, button, filter, status update, approval/rejection workflow, notification, authentication flow, and database operation.



Do not leave placeholder buttons or fake functionality.



Use realistic sample data for demonstration, but clearly separate demo data from real student records.



Build the application incrementally and make sure the core clearance workflow works end-to-end before adding secondary features.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ttcclearancestudent-path-sync.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b86682f3-719f-41e5-8bbd-ac9c4da25577).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
