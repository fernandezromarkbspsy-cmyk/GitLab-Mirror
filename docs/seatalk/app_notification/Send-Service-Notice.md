# Send Service Notice (New)

**Source:** https://open.seatalk.io/docs/messaging_send-service-notice

## API Description

Use this API to send service notices to an employee/employees in SeaTalk. A service notice is a message specifically sent to the "Application Center" channel on SeaTalk. "Application Center" is a unidirectional message channel for SeaTalk Open Platform apps to push notices to a single app user/specific group of app users. Since the communication is unidirectional, users cannot send a reply in the channel. The channel will consolidate and display service notices from all apps used by a user. 

The type of service notice message can be customised. Currently, only interactive message cards (https://open.seatalk.io/docs/interactive-msg_overview) are supported as the available message type for service notices. See Message Type (https://open.seatalk.io/docs/messaging_message-types_) for the design of different message types.

See an example of service notices sent to Application Center below:

![AnoyjYMA7FkJxAIhtgEIAEc](https://sos.sp-cdn.shopee.com/c3/53693910/sos/AnoyjYMA7FkJxAIhtgEIAEc?sign=1652237162.1266592-ViGoU-0-17e7fbcdb7522970957e488e7d7d2868)

Note:

- This API requires Send Service Notice (Internationalized) permission

- The recipient(s) of a service notice must be included in the app's Service Scope

- This API is not necessary for the bot capability. Bot capability requires Send Message to a Bot User API

- [As of 2022-05-19] For developers that have been using the historic version of this API (with the endpoint https://openapi.seatalk.io/messaging/v2/service_notice/i18n), please note that the historic version will be deprecated soon. We suggest you switch the API to the current one to improve the end-user experience. The functionalities will be the same, with the only change being the message format of service notices

Request Method: `POST`

End Point: https://openapi.seatalk.io/messaging/v2/service_notice/send_message (https://openapi.seatalk.io/messaging/v2/service_notice/send_message)

## Send an Interactive Message Card

### Request Parameter

For a comprehensive introduction to building an interactive message card, see Build a Card (https://open.seatalk.io/docs/interactive-msg_build-a-card).

Header

| Parameter | Type | Mandatory | Description | Default | Sample |
| --- | --- | --- | --- | --- | --- |
| Authorization | string | Yes | Obtained through the Get App Access Token API | | Bearer c8bda0f77ef940c5bea9f23b2d7fc0d8 |
| Content-Type | string | Yes | Content-Type | | application/json |

Body

| Parameter | Type | Mandatory | Length/Size Limit | Description | Default | Sample |
| --- | --- | --- | --- | --- | --- | --- |
| tag | string | Yes | 20 characters | The type of the service notice message | N/A | "interactive_message" |
| (message_object) | object | Yes | N/A | - The message object whose structure depends on the specified "tag" field - For a comprehensive introduction to building an interactive message card, see Build a Card | N/A | See the request body sample below |
| employee_codes | []string | Yes | Min: 1 recipient Max: 50 recipients | A list of employee_codes that specify the recipients of this service notice message | N/A | ["abcdefg", "hijklmn"] |
| usable_platform | string | No | N/A | The platform(s) where the service notice message can be viewed fully and acted on (e.g., tapping a button on an interactive message card) - "all": all platforms (mobile + desktop) - "mobile": mobile platforms only (iOS + Android). On desktop platforms, a default message will be shown with text "[Interactive Message] This message can only be viewed on mobile devices due to the App's setting. Please check this message on SeaTalk Mobile App." - "desktop": desktop platforms only (Desktop + Web). On mobile platforms, a default message will be shown with text "[Interactive Message] This message can only be viewed on desktop devices due to the App's setting. Please check this message on SeaTalk Desktop/Web App." | "all" | "mobile" |

Request Body Sample

```json
{
"tag": "interactive_message",
"interactive_message": {
"default": {
"elements": [
{
"element_type": "title",
"title": {
"text": "Mail pending for collection"
}
},
{
"element_type": "description",
"description": {
"text": "You have a mail at the office lobby pending for collection. Please visit the lobby during the office hours to collect it."
}
},
{
"element_type": "button",
"button": {
"button_type": "redirect",
"text": "View details",
"mobile_link": {
"type": "web",
"path": "https://webApp.com/somePath"
},
"desktop_link": {
"type": "web",
"path": "https://webApp.com/somePath"
}
}
},
{
"element_type": "button",
"button": {
"button_type": "callback",
"text": "I have collected it",
"value": "collected"
}
}
]
},
"zh-Hans": {
"elements": [
{
"element_type": "title",
"title": {
"text": "待取信件"
}
},
{
"element_type": "description",
"description": {
"text": "你有一封待取的信件，请在办公时间段前往大厅领取。"
}
},
{
"element_type": "button",
"button": {
"button_type": "redirect",
"text": "查看详情",
"mobile_link": {
"type": "web",
"path": "https://webApp.com/somePath"
},
"desktop_link": {
"type": "web",
"path": "https://webApp.com/somePath"
}
}
},
{
"element_type": "button",
"button": {
"button_type": "callback",
"text": "我已取件",
"value": "collected"
}
}
]
}
},
"employee_codes": [
"abcdegf",
"hijklmn",
"opqrstu"
]
}
```

### Response Parameter

Result Fields

| Parameters | Type | Mandatory | Description |
| --- | --- | --- | --- |
| code | int | Yes | - Refer to Error Codes for explanations - 0 if the message is sent successfully |
| delivery | []object | No | The information about the delivery of the message |
| ∟code | int | Yes | - The delivery status of the message sent to a particular user - Refer to Error Codes - 0 if the message is sent successfully to this user |
| ∟employee_code | string | Yes | employee_code of the recipient |
| ∟message_id | string | No | The unique identifier of the message if it has been successfully sent out to this user |

Response Sample

```json
{
"code": 0,
"delivery": [
{
"code": 0,
"employee_code": "abcdefg",
"message_id": "abcdefghijklmn"
},
{
"code": 0,
"employee_code": "hijklmn",
"message_id": "opqrstuvwxyzab"
},
{
"code": 3001,
"employee_code": "opqrstu"
}
]
}
```