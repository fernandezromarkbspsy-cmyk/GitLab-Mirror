# Create Approval Item

**Source:** https://open.seatalk.io/docs/create-approval-item

## API Description

Use this API to create a new standard approval item in the approval center server. 

Request Method: `POST`

End Point: https://openapi.seatalk.io/approval_center/v2/create

Note:

- This API requires Create Approval Item permission and the relevant Data Scope

- To use this API properly, make sure your app's Data Scope covers every employee in the approval_chain, pending_list, approved_list, and rejected_list

## Request Parameter

Header

| Parameter | Type | Mandatory | Description | Default | Sample |
| --- | --- | --- | --- | --- | --- |
| Authorization | string | Yes | Obtained through the Get App Access Token API | N/A | Bearer c8bda0f77ef940c5bea9f23b2d7fc0d8 |
| Content-Type | string | Yes | Request header format | N/A | application/json |

Parameter

You can refer to Approval Center Definition Explanations (/docs/approval-center-definition-explanations) for a more detailed introduction to the different elements of an approval item.

| Parameter | Type | Mandatory | Max Length | Description | Default | Sample |
| --- | --- | --- | --- | --- | --- | --- |
| item_id | string | Yes | 30 char | The ID of the approval item | N/A | 202101 |
| created_at | int | Yes | int64 | The timestamp when the approval item was created | | |
| updated_at | int | Yes | int64 | - The timestamp when the approval item was updated - When there is no action done on this item, it will be the same as created_at | | |
| applicant_name | string | Yes | 50 char | The name of the applicant for this approval item | | |
| has_attachments | bool | No | | An icon to show if the approval item has any attachments. For display only | | |
| item_name | TextStructure | No | 50 char per language | - The name of the approval item - The app name will be displayed if this field is not passed in | The current App's name | "Sick Leave" |
| item_state | TextStructure | No | 20 char per language | The state of this approval item shown on the right of the approval item name | "" | "Resubmitted" |
| title | TextStructure | Yes | 100 char per language | The title of the approval item | "" | "Take 3 Day Sick Leave" |
| subtitle | TextStructure | No | 100 char per language | The subtitle of the approval item | "" | "Aug 12, 2020 (AM) - Aug 14, 2020 (PM)" |
| description | TextStructure | No | 500 char per language | The description of the approval item | "" | "Need to take 3-day sick leave" |
| approval_chain | object | No | 65535 bytes | The list of approvers under the approval item. For display purposes only | null | |
| ∟approvers | []ApproverOfApprovalChain | Yes | 100 at maximum | The approvers in the approval chain | | |
| status | object | Yes | | The status of the approval item | | |
| ∟state | int | Yes | | The status label with a fixed display style. Available styles: - 0: Yellow background (with default status text as "Pending") - 1: Green background (with default status text as "Approved") - 2: Red background (with default status text as "Rejected") - 3: Red background (with default status text as "Terminated") - 4: Grey background (with default status text as "Cancelled") | | |
| ∟text | TextStructure | No | 50 char per language | The status label text. Your app can overwrite the default text provided above | default EN text | "Pending Finance" |
| action_button | int | No | | The actions the user can perform on this approval item directly in the list on the Pending/Snooze tab. - 1: Approve + Reject + Snooze - 2: View Details + Snooze | 1 | |
| app_path | string | No | 500 char | - The app path to the detailed page of the approval item - This field is optional if the action_button field is set to 1; and it is mandatory if the action_button field is set to 2 - Follow this link format: seatalk://application/sop//?itemId=xxxx | | |
| approve_url | string | Yes | 500 char | - A callback URL on your app's server. When the user approves this item in Approval Center, we will send the following info to this callback URL in the request Body (JSON): { "item_id": "item's-id", "reason": "", "employee": { "employee_code": "e_12345", "name": "Jason", "email": "jasonsemail@domain.com" } } - A callback request can be verified by comparing a local signature and a remote one. See Approval Center Callback Signature Verification for detail | | |
| reject_url | string | Yes | 500 char | - A callback URL on your SOP App's server. When the user rejects this item in Approval Center, we will send the following info to this callback URL in the request Body (JSON): { "item_id": "item's-id", "reason": "Reason for rejecting", "employee": { "employee_code": "e_12345", "name": "Jason", "email": "jasonemail@domain.com" } } - A callback request can be verified by comparing a local signature and a remote one. See Approval Center Callback Signature Verification for detail | | |
| pending_list | []UserInfo | Yes | - Can be empty - 100 at maximum | The list of pending approvers | | |
| approved_list | []UserInfo | Yes | - Can be empty - 100 at maximum | The list of users who already approved the item | | |
| rejected_list | []UserInfo | Yes | - Can be empty - 100 at maximum | The list of users who already rejected the item | | |

Approver of Approval Chain

| Parameter | Type | Mandatory | Max Length | Description | Default | Sample |
| --- | --- | --- | --- | --- | --- | --- |
| employee_code | string | No | | - The employee_code of the approver - Approval Center will display the employee's name and avatar if the employee_code isn't passed in | | |
| name | string | No | 50 char | - The name of the approver - Must be passed in if no employee_code is passed in | | |
| avatar | string | No | 200 char | - The avatar URL of the approver | "" | |
| action_time | int | Yes | 64 | The GMT+0 timestamp when the user approved/rejected the approval item | | 1631165254 |
| status | object | Yes | | The action that has been performed by the approver | | |
| ∟state | int | No | | The type of action taken by the approver. There are 5 types of actions available with a fixed display style: - 0: normal (blue) - 1: warning (yellow) - 2: alert (red) - 3: done (green) - 4: cancel (grey) | | 0 |
| ∟text | TextStructure | No | 50 char per language | The description of the action taken by the approver | | "Finance Edited" |
| comment | string | No | 500 char per language | The comment left by the approver | "" | "The amount is not correct, please check and re-apply again" |

TextStructure

| Parameter | Type | Mandatory | Max Length |
| --- | --- | --- | --- |
| en | string | No | 50 char |
| vi | string | No | 50 char |
| zh-hans | string | No | 50 char |
| zh-hant | string | No | 50 char |
| th | string | No | 50 char |
| id | string | No | 50 char |

TextStructure Sample

```json
{
"en": "English",
"vi": "Vietnamese",
"zh-hans": "Simplified Chinese",
"zh-hant": "Traditional Chinese",
"th": "Thai",
"id": "Bahasa Indonesia"
}
```

UserInfo

| Parameters | Type | Description |
| --- | --- | --- |
| employee_code | string | The employee_code of the user |
| ts | int | The timestamp when the user did the action |

Request Sample

```json
{
"item_id": "test_item_id",
"applicant_name": "Test",
"action_button": 1,
"item_name": {
"en": "test"
},
"item_state": {
"en": "Test State"
},
"created_at": 1632912334,
"has_attachments": true,
"title": {
"en": "Test Title"
},
"subtitle": {
"en": "Test Subtitle"
},
"description": {
"en": "Test Description"
},
"approval_chain": {
"approvers": [
{
"employee_code": "12345",
"action_time": 1632912334,
"status": {
"state": 2,
"text": {
"en": "Test"
}
},
"comment": "Blablabla"
}
]
},
"status": {
"text": {
"en": "Pending"
},
"state": 0
},
"updated_at": 1632912334,
"app_path": "seatalk://application/sop/xxxxx/",
"approve_url": "https://path/to/callback",
"reject_url": "https://path/to/callback",
"approved_list": [],
"rejected_list": [],
"pending_list": [
{
"employee_code": "12345",
"ts": 1632912334
}
]
}
```

## Response Parameter

Result Fields

| Parameters | Type | Description |
| --- | --- | --- |
| code | int | Refer to Error Code for explanations |

Response Sample

```json
{
"code": 0
}
```