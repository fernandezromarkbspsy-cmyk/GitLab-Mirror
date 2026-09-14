# SOC 5 Outbound User Manual

## What this app is for

SOC 5 Outbound helps the operations team manage truck requests from start to finish.
It replaces spreadsheet-based tracking with one shared place to:

- Create and review linehaul requests
- Approve requests and assign trucks
- Record truck arrival at the dock
- Confirm completed docking
- Monitor daily activity and performance
- Manage user access

The screens you can see depend on your role.

## Before you start

You need an active SOC 5 Outbound account. Use the login page to sign in with the method provided by your organization:

- **SeaTalk QR:** Scan the QR code with SeaTalk.
- **Email and password:** Enter your work email and password.
- **Email verification code:** If your organization uses email verification, request a code and enter it on the login page.

On your first login, you may be asked to change your password. Enter a new password with at least 12 characters, enter it again, and select **Change password**.

## Your role

| Role | Main responsibilities | Screens available |
| --- | --- | --- |
| **Ops PIC** | Create and monitor outbound linehaul requests | Dashboard, LH Request |
| **FTE Ops** | Review requests, approve or reject them, and monitor operations | Dashboard, LH Request, KPI Analytics, User Management |
| **FTE Midmile** | Confirm an approved request by assigning a truck, or return it to Outbound | Dashboard, Truck Request, User Management |
| **Document Officer** | Record docking details and confirm completed docking | Dashboard, Docking Confirmation |

Some administrator accounts can switch between roles from the profile menu. The selected role changes which work areas and actions are shown.

## Getting around the app

### Sidebar

Use the sidebar on the left to open:

- **Dashboard:** Overall activity and request summary
- **Requests > LH Request:** Outbound linehaul requests
- **Requests > Truck Request:** Approved requests waiting for Midmile action
- **Docking Confirmation:** Trucks waiting to be docked or confirmed
- **KPI Analytics:** Daily volume and performance figures
- **User Management:** User accounts and roles, when your role allows it

On a small screen, select **Menu** to open the sidebar.

### Header tools

The header can include these tools:

- **Search:** Find requests, usually by plate number on request screens.
- **Date filters:** Change the date range used by the dashboard and lists.
- **Notifications:** See new request updates. Select a notification to mark it as read, or use **Mark all as read**.
- **Profile menu:** View your account, switch role when permitted, or sign out.

The request lists refresh automatically. You can also select the refresh button above a list.

## Request lifecycle

A request normally follows this path:

`Pending` -> `Approved` -> `Assigned` -> `For Docking` -> `Docked` -> `Confirmed`

A request can also be returned or stopped:

- **Rejected:** FTE Ops rejected the request.
- **Rejected by MM:** FTE Midmile returned the request with a reason.
- **Cancelled:** The request was cancelled.

The available action buttons depend on the request status and your role.

## Daily workflow

### 1. Create an outbound linehaul request

Ops PIC users create the request. FTE Ops users can also work with the request list according to their permissions.

1. Open **Requests > LH Request**.
2. Select **Add new**.
3. Search for a cluster by typing at least three characters. Select the correct cluster from the suggestions.
4. Check or complete the region and dock number.
5. Enter the current backlog count and, when available, the backlog time.
6. Choose the required truck size.
7. Review the information.
8. Select **Create request**.

The new request appears with **Pending** status. A notification is sent when the request changes.

### 2. Review, approve, or reject a request

FTE Ops users review requests in **Requests > LH Request**.

1. Use the search box, status filter, date range, or column sorting to find the request.
2. Select the request menu, then select **View** to open its details.
3. Check the cluster, region, dock number, backlog count, truck size, and request time.
4. Select the appropriate action:
   - **Approve** to send the request to Midmile.
   - **Reject** to stop the request. Add a clear reason when asked.
   - **Cancel** when the request is no longer needed.
5. Confirm the action.

Approved requests move to the Midmile queue.

### 3. Assign a truck

FTE Midmile users handle approved requests in **Requests > Truck Request**.

1. Open the **Pending confirmation** section.
2. Find an approved request.
3. Select **Assign**.
4. Enter the truck's:
   - Plate number
   - Truck size
   - Truck type
   - Expected provide time, if known
5. Select **Assign truck**.

The request moves forward for docking. If the request cannot be fulfilled, select **Reject**, enter the reason, and submit it. The request is returned to Outbound as **Rejected by MM**.

### 4. Record docking

Document Officers handle trucks in **Docking Confirmation**.

1. Open **Docking Confirmation**.
2. Find a truck with **For Docking** or **Assigned** status.
3. Select **Dock truck**.
4. Enter or check:
   - Driver ID
   - LH trip number
   - Docked time
5. Select **Mark as docked**.
6. Print the truck label when the print preview appears, if a label is required.

The request changes to **Docked**.

### 5. Confirm completed docking

1. Stay on **Docking Confirmation**.
2. Find the request marked **Docked**.
3. Check that the details are correct.
4. Select **Confirm**.

The request changes to **Confirmed** and is included in completed activity.

## Working with request lists

### Search

Use the search field above the request list. On the LH Request screen, search is designed for plate numbers. You can also use the global search shortcut, **Ctrl + F** on Windows or **Cmd + F** on Mac, to focus the search field.

### Filter

Use the filter controls to narrow the list by:

- Status
- Date from and date to
- Search text

After changing a filter, the list updates to show matching requests.

### Sort

Select a column heading such as request time, cluster, dock number, backlog count, or plate number to sort the list. Select it again to change between ascending and descending order.

### View details

Select the action menu on a request and choose **View**. The details panel shows the request information and available actions.

### Change the list size or page

Use **Show row** to choose how many rows appear at once. Use the previous and next arrow buttons to move between pages.

### Export a list

1. Apply the filters you need.
2. Select **Export**.
3. Open the downloaded CSV file in Excel or another spreadsheet application.

The export uses the current list filters.

## Dashboard

The Dashboard gives a quick view of current operations. It can show:

- Total requests
- Pending requests
- Requests waiting for docking
- Docked or completed requests
- Intraday dispatch activity
- Truck-size mix
- Recent trips and assigned trucks

Select a summary card or list item to open the related request view. Use the date range controls to change the reporting period.

The dashboard is updated automatically. New request activity may also produce a notification and a short alert sound.

## KPI Analytics

FTE Ops users can open **KPI Analytics** to review:

- Total requests
- Confirmed requests
- Cancelled requests
- Average approval time
- Daily request volume for the last 30 days

Use these figures to compare workload and follow up on delays or unusual volumes.

## User Management

FTE Ops and FTE Midmile users with access to administration can manage the user directory.

### Add an Ops PIC

1. Open **User Management**.
2. Select **Add Ops PIC**.
3. Enter the person's name.
4. Enter the OPS ID in the format shown, such as `ops12345`.
5. Select **Create user**.

The new account appears in the directory.

### Change a user's role

1. Find the user in the directory. Use the search box if needed.
2. Open the role list in that user's row.
3. Select the new role.

The role is updated immediately. Give the user the correct sign-in instructions for their new role.

### Disable an account

1. Find the active user.
2. Select **Disable**.
3. Confirm the action if prompted.

A disabled account cannot continue normal work in the application. Disable accounts when a person no longer needs access.

## Notifications

Notifications are used for request changes and queue updates.

- A badge shows how many notifications are unread.
- Open the bell menu to read the latest updates.
- Select an individual notification to mark it as read.
- Select **Mark all as read** to clear the unread count.

If you are waiting for work, keep the application open so the queue and notifications can refresh.

## Common problems

### I cannot see a menu item

Your role may not have permission to use that area. Ask an administrator to confirm your role.

### I cannot find a request

Check the status and date filters, clear the search field, and move through the other pages. Select the refresh button to load the latest data.

### A request is not available for my action

The request may be in the wrong status, or another user may already have acted on it. Refresh the list and check the current status.

### My changes were not saved

Look for an error message near the form. Check that all required fields are complete, then try again. If the problem continues, record the request ID and contact your system administrator.

### I cannot sign in

Check that you are using your work account and the correct sign-in method. For email verification, request a new code only when needed. Contact your administrator if your account is disabled or has not been provisioned.

## Good operating habits

- Check the cluster, dock, backlog, and truck details before submitting or approving a request.
- Use clear rejection remarks so the next team knows what to fix.
- Confirm driver ID, trip number, and docked time before marking a truck as docked.
- Refresh the list before taking action on a request that has been waiting for a long time.
- Sign out when you finish, especially on a shared computer.
- Do not share passwords or email verification codes.

## Quick reference

| Task | Screen | Role |
| --- | --- | --- |
| Create a linehaul request | LH Request | Ops PIC |
| Approve or reject a request | LH Request | FTE Ops |
| Assign a truck | Truck Request | FTE Midmile |
| Return an unfulfilled request | Truck Request | FTE Midmile |
| Dock a truck | Docking Confirmation | Document Officer |
| Confirm docking | Docking Confirmation | Document Officer |
| Review performance | KPI Analytics | FTE Ops |
| Add or disable users | User Management | FTE Ops / FTE Midmile |
