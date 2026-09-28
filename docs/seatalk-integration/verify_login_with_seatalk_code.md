# Verify Login With SeaTalk Code

**Source:** https://open.seatalk.io/docs/code-to-employee

## API Description

Use this API to exchange an authorization code obtained through a redirect URI configured with Login With SeaTalk (../../../../../../docs/login-with-seatalk-overview) for a user's basic information.

Please note that the authorization code will expire after 10 minutes. 

Request Method: GET

End Point: https://openapi.seatalk.io/open_login/code2employee

## Request Parameter

### Header

| Parameter | Type | Mandatory | Description | Default | Sample |
| --- | --- | --- | --- | --- | --- |
| Authorization | string | Yes | Obtained through the Get App Access Token API | N/A | Bearer c8bda0f77ef940c5bea9f23b2d7fc0d8 |

### Parameter

| Parameter | Type | Mandatory | Description | Default | Sample |
| --- | --- | --- | --- | --- | --- |
| code | string | Yes | Obtained from redirected URI that is configured with Login With SeaTalk | N/A | "123" |

### Request Sample

```
https://openapi.seatalk.io/open_login/code2employee?code=123
```

## Response Parameter

### Result Fields

| Parameters | Type | Description |
| --- | --- | --- |
| code | int | Refer to Error Code for explanations |
| employee | object | The info of the employee |
| ∟employee_code | string | The employee_code of the employee |
| ∟avatar | string | The SeaTalk avatar of the employee |
| ∟name | string | The name of the employee |
| ∟email | string | The email of the employee |
| ∟mobile | string | The mobile phone number of the employee |

### Response Sample

```json
{
"code": 0,
"employee": {
"employee_code": "123",
"avatar": "https://openapi.seatalk.io/file/employee/icon/beedfaa1e335e48293b2e5e624a413860b03010000012b0d0000000002010089",
"name": "Morgan Jackman",
"email": "Morgan.Jackman@example.email.com",
"mobile": "+6593010285"
}
}
```