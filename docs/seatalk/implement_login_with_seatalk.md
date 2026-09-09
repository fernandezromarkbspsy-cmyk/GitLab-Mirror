Implement Login With SeaTalk


Please note that the minimum mobile client version required for Login with SeaTalk is 3.17.
In this article, we will walk you through how to implement Login with SeaTalk on your website. The following steps need to be done: 

Create an app on SeaTalk Open Platform
Configure your service's Redirect URI on SeaTalk Open Platform
Add in Login With SeaTalk JS framework on your website so that you can redirect users to the SeaTalk Login Page
Get user identity after the SeaTalk server directs back to your service after a user authenticates the login with SeaTalk
Create an App
First, create an app on SeaTalk Open Platform by filling out information of your app. After you have developed your website and are ready to link Login with SeaTalk with the website, navigate to the Basic Info section of your app's detail page and get the App ID.



Configure the Redirect URI
Navigate to the App Capability > Login With SeaTalk section. Configure a Redirect URI that matches your service exactly. Redirect URI controls which URI can obtain an authentication code that will be used to exchange for the user identity.



Add in Login With SeaTalk JS Framework
You can easily add a standard Login with Seatalk Button to your website by using the HTML and JavaScript Library. When a user taps the login button, he/she will be redirected to the SeaTalk Login Page, as described in Login with SeaTalk Overview.

See the following code snippet for an example:

<div id="seatalk_login_app_info" data-redirect_uri="[YOUR_REDIRECT_URI]" data-appid="[YOUR_APPID]" data-response_type="code" data-state="[STATE]"></div> 
<div id="seatalk_login_button" data-size="small" data-logo_size="22" data-copywriting="Continue with SeaTalk" data-theme="light" data-align="center"></div> 
<script src="https://static.cdn.haiserve.com/seatalk/client/shared/sop/auth.js">
</script>

Copy
An element with the ID seatalk_login_app_info is used to specify the information of your app on SeaTalk Open Platform：

Data Attributes

Value

Mandatory

Description

data-appid

String

Yes

Your app's App ID, which is the unique identifier of your app

data-redirect_uri

String 

Yes

The redirection endpoint URI after successful authorization

data-response_type

code

Yes 

- The authorized type

- Value must be set to "code"

data-state

String

No 

- A value used by the client to maintain the state between the request and callback. When the authorization is successful, data-state will be appended to the redirect URI for verification

- The parameter should be used for preventing the case where unauthorized commands are submitted from a user that the website trusts ("request forgery" or "session riding")

An element with the ID seatalk_login_button will be rendered as a Login With SeaTalk button. You can customize the button by the parameters provided in the data attributes below:

Data Attributes

Value

Mandatory

Description

data-size

small | default | large

No

The size of the button

data-align

center | border

No 

- The alignment of the button icon and text

- Default: center

data-theme

default | dark

No

The theme of the button

data-logo_size

String

No 

- The size of the SeaTalk Logo

- Default: 22 pixels

data-copywriting

String

No 

- The copywriting of the button

- Default: Login with SeaTalk

SeaTalk Open Platform provides design guidelines for the Login with SeaTalk button. See Button Design Guidelines for detail.

You can also enable the One-Tap login method for your website. See One-Tap Login for how to turn on the capability.

Get User Identity
After users grant your app on the SeaTalk Login Page the permission to access their SeaTalk profile, they will be redirected to the service you provided before in the data-redirect_uri attributes within the code.

Upon redirection, an authorization code will be appended at the end of the redirect URI for your service as a temporary token that carries the user information. An example of the redirect URI is https://www.yourwebsite.com/?code=1f2b62b4210448a19ac1a83da59fb32c&state=test.

The token will expire after 10 minutes. You can use the code to exchange for the user profile information by calling Verify Login with SeaTalk Code API.

