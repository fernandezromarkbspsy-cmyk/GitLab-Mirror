# Set Notification Badge

**Source:** https://open.seatalk.io/docs/messaging_send-notification-badge

## API Description

Use this API to configure the notification badge that appears on the top-right corner of the app on Workspace. The notification badge will be a red dot with configurable unread notification counts. 

Request Method: `POST`

End Point: https://openapi.seatalk.io/messaging/v2/badge

Note:

- This API requires Send Discover Page Notification Badge permission and the relevant Service Scope

## Request Parameter

Header

| Parameter | Type | Mandatory | Description | Default | Sample |
| --- | --- | --- | --- | --- | --- |
| Authorization | string | Yes | Obtained through the Get App Access Token API | | Bearer c8bda0f77ef940c5bea9f23b2d7fc0d8 |
| Content-Type | string | Yes | Content-Type | | application/json |

Body

| Parameter | Type | Mandatory | Length/Size Limit | Description | Default |
| --- | --- | --- | --- | --- | --- |
| badges | []object | Yes | 100 | The list of users for whom the notification badge is to be updated | |
| ∟employee_code | string | Yes | | The employee_code of the user | |
| ∟toggle | bool | Yes | | Whether to turn on the notification badge - true to toggle on - false to toggle off | |
| ∟count | int | No | | An optional number inside the badge icon to indicate the number of unread notifications | 0 |
| ∟version | int | No | | - An optional monotonically increasing number to indicate the recency of the request to avoid concurrency - It will be reset to 0 if this field is not provided | 0 |

Request Body Sample

```json
{
"badges": [
{
"employee_code": "18231",
"toggle": true,
"count": 3,
"version": 123456789
}
]
}
```

## Response Parameter

Result Fields

| Parameters | Type | Description |
| --- | --- | --- |
| code | int | Refer to Error Code for explanations |
| failed_offsets | []int | The failed recipients offsets (starting from 0) |
| failed_reasons | []string | - EMPLOYEE_ID_NOT_FOUND: employee_code is not valid - VERSION_OUTDATED: the request is superseded by another request with a higher version - APP_REGISTRATION_REQUIRED: the employee has not registered on the SeaTalk App yet |

Response Sample

```json
{
"code": 0,
"failed_offsets": [],
"failed_reasons": []
}
```