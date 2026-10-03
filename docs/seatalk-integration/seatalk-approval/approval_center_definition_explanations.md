# Approval Center Definition Explanations

**Source:** https://open.seatalk.io/docs/approval-center-definition-explanations

This document introduces the definitions of different terms and API fields under Approval Center.

## Basic Definitions

- Approval item: the single unit of an approval task in Approval Center. Approvers can perform actions on an approval item such as approving and rejecting it. Each approval item has an ID which has to be unique in a SeaTalk Open Platform app.

- Approver: an Approval Center user who performs actions on approval items, usually a business stakeholder or a manager.

Now let's break down the Approval Center app further.

## Four Tabs

Approval Center has four tabs: Pending, Snoozed, Approved and Rejected. Among them, Pending, Approved and Rejected are directly relevant to your approval service.

- Pending: shows all the approval items pending the user's action.

- Snoozed: shows the approval items snoozed by the user. Snoozing an approval item removes it from the pending list and puts it in the snoozed list. The item will be brought back to the pending list 24 hours later. Snoozing is purely an internal function of Approval Center so you don't need to worry about it for your app's integration with Approval Center.

- Approved: shows all the approval items already approved by the user.

- Rejected: shows all the approval items already rejected by the user.

See the screenshots below for illustrations of the Pending and Approved tab.

![A3oxOKTfALxgX=YSEZ0HACc](https://sos.sp-cdn.shopee.com/c3/53693910/sos/A3oxOKTfALxgX=YSEZ0HACc?sign=1669628156.0505974-NAUUh-0-43158d3675cbd9b192ff529f51d25049)

## Approval Item

The screenshots and table below explain the different elements of an approval item.

![A3oxONAWAKAs3=QSEYYHACc](https://sos.sp-cdn.shopee.com/c3/53693910/sos/A3oxONAWAKAs3=QSEYYHACc?sign=1669621861.1801171-xQp5G-0-aec0ad22575a0e6963a69cc5d6403034)

![A3oxOGwDAJzB3=QSEWQHACc](https://sos.sp-cdn.shopee.com/c3/53693910/sos/A3oxOGwDAJzB3=QSEWQHACc?sign=1669621870.7974637-zeZJt-0-b7f089324f5bd436c9443d80724b536d)

(1st screenshot: an approval item in the Pending tab; 2nd screenshot: an approval item in the Approved/Rejected tab)

| Element | API Parameter Name | Description |
| --- | --- | --- |
| App logo | - | Your app's logo |
| Applicant name | applicant_name | - The name of the applicant for this approval item - Display up to 1 line |
| Attachment icon | has_attachments | - An icon to show if the approval item has any attachments - For display only |
| Update time | updated_at | - The time that the approval item has been updated. When there is no action performed on this approval item (i.e., the applicant just submitted the approval item), it will be the same as the creation time - The time will be displayed based on the current device's timezone and in the language set by the user on SeaTalk (if localisation is supported) |
| Approval item name | item_name | - The name of the approval item (e.g., "Purchase Request") - Your app's name will be displayed if there's no input in the API request - Display up to 1 line together with the item state - Language localisation support available |
| Item state | item_state | - The state of this approval item shown on the right of the approval item name. E.g., "resubmitted" - Language localisation support available |
| Title | title | - The title of the approval item - Display up to 1 line - Language localisation support available |
| Sub-title | subtitle | - The sub-title of the approval item - Display up to 1 line - Language localisation support available |
| Description | description | - The description of the approval item - Display up to 1 line - Language localisation support available |
| Approval Chain | approval_chain | - The list of approvers under the approval item - For display purposes only. See "Approval Chain and Approver Object" below for a screenshot of the UI - Your app can decide whether to display the approval chain or not. If shown, your app needs to push updates to us if there are changes to the approver's name or avatar |
| ∟ Approvers | approvers | The approvers in the approval chain |
| Application Status | status | - (Shown on Approved/Reject tab) The status of the approval item - Language localisation support available |
| ∟ Status Type | state | The status label with a fixed display style. Available styles: - 0: Yellow background (with default status text as "Pending") - 1: Green background (with default status text as "Approved") - 2: Red background (with default status text as "Rejected") - 3: Red background (with default status text as "Terminated") - 4: Grey background (with default status text as "Cancelled") |
| ∟ Status Text | text | The status label text. Your app can overwrite the default text. The default text: - 0: Pending - 1: Approved - 2: Rejected - 3: Terminated - 4: Cancelled |
| Action Button | - | The actions the user can perform on this approval item directly in the list on the Pending/Snooze tab. Two options are available: 1: Approve + Reject + Snooze (for Pending list); Approve + Reject (for Snooze list) 2: View Details + Snooze (for Pending list); View Details (for Snooze list) |
| Approve URL | approve_url | The callback URL that receives a notification when the approval item is approved |
| Reject URL | reject_url | The callback URL that receives a notification when the approval item is rejected |
| Detail URL | app_path | - The URL for the detail page of the approval item - The format of an app path: seatalk://application/sop//?itemId=xxxx |

## Approval Chain and Approver Object

In Approval Center, your app can provide an approval chain for users to preview. An approval chain consists of approvers related to this approval item. In implementation, approval_chain is a list of approver objects.

The table below explains the information of an approver in the approval chain.

| Element | API Parameter Name | Description |
| --- | --- | --- |
| Employee Code | employee_code | The unique identifier of the approver |
| Name | name | The name of the approver |
| Avatar | avatar | The avatar of the approver |
| Action time | action_time | The GMT+0 timestamp when the user approved/rejected the approval item |
| Action status | status | The action that has been performed by the approver |
| ∟ Action type | state | The type of action taken by the approver. There are 5 types of actions available with a fixed display style: - 0: Normal (Blue) - 1: Warning (Yellow) - 2: Alert (Red) - 3: Done (Green) - 4: Cancel (Grey) |
| ∟ Action text | text | - The description of the action taken by the approver - Language localisation support available |
| Comment | comment | The comment left by the approver |

The approval chain in the list view is strictly for display only. Once the user taps on the area of the approval chain, Approval Center will display the full list of approvers as a slide-up window from the bottom of the screen with the following approver information: avatar, name, action, action time and comment (if any).

See the screenshot below for an example of the UI after the user taps on the approval chain area of an approval item card.

![A3oxONNpADDjVvUSEU0AACc](https://sos.sp-cdn.shopee.com/c3/53693910/sos/A3oxONNpADDjVvUSEU0AACc?sign=1669623822.612763-xHYOF-0-72171c2b9a6f61c5aa36b5d9626a0dee)