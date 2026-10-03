# Overview of Approval Center

**Source:** https://open.seatalk.io/docs/overview-of-approval-center

Approval Center is a one-stop approval tool that aggregates and organises an approver's approval items from different systems. With Approval Center, approvers no longer need to visit different approval systems/apps to process the approval items assigned to them. They can check pending approval items from different sources and approve, snooze or reject them, all in Approval Center. This makes the approvers' experience more convenient and streamlined.

SeaTalk Open Platform provides server APIs (for backend) and RN SDKs (for frontend) if you want to integrate your approval system/app with Approval Center.

In this overview introduction of Approval Center, we will walk you through the following topics for you to understand Approval Center and decide whether it's suitable for your use case:

- What is Approval Center?

- When should I integrate with Approval Center?

- I have decided that I need to integrate my system/app with Approval Center. How to proceed?

## What is Approval Center

Approval Center is a mobile-only application on SeaTalk that consolidates approval items from multiple sources into one place so that approvers can manage them without leaving SeaTalk.

For example, a manager can check different approval items for Leave and Claim, which are two separate apps but they are both integrated with Approval Center. Instead of visiting the Leave and Claim apps on two separate web portals outside SeaTalk, the manager can save time and effort by just opening Approval Center on her SeaTalk mobile app to do the same task.


### Core Functionalities

- View pending and processed approval items

- Approve/reject/snooze an approval item

- View the details of an approval item

## When to Integrate with Approval Center

Consider integrating with Approval Center if:

- You already have a standalone approval app where approvers can visit and perform actions, but they prefer/want to do it on SeaTalk.

- You don't have an approval app yet, but you plan to build one to fulfil some business scenarios that involve approval processes + the approvers use SeaTalk as the primary work tool.

- The approvers of your approval system/app are already using Approval Center to manage approval items from other approval systems.

## How to Integrate with Approval Center

We highly recommend you go through the following docs to help you assess whether integration with Approval Center is suitable and needed:

- Introduction to the concepts related to Approval Center - to understand approval items and approver information

- Server API docs - to understand the backend integration

- RN SDK docs - to understand the frontend integration

If Approval Center fulfils your need, follow the steps below to integrate your app with Approval Center:

#### Create an App on SeaTalk Open Platform

- Make sure you have created an app on SeaTalk Open Platform with the "Workspace App" capability (see Build a Workspace App for details).

#### Configure Approval Center Related Permissions

- Go to your app's configuration page.

- Under General Settings > Scopes & Permission, select the necessary server APIs based on your particular use case.

- Wait for your organisation admin's approval on the permission application.

#### Integrate Your Approval Service with Approval Center

- Read the server API docs under the Approval Center Integration category to understand what fields you need to provide in API requests.

- Make sure you call the Get App Access Token API to get the access token before calling Approval Center integration server APIs.

- Make sure you follow the RN SDK doc to complete the integration with the frontend so that the user experience is closed-loop (i.e., the approval/rejection action can be successfully handled by both Approval Center and your app).

See the sequence diagram below for a complete interaction process between your app's client & server and Approval Center's client & server.

![A3oxOJScAPyj4xwfEX8JACc](https://sos.sp-cdn.shopee.com/c3/53693910/sos/A3oxOJScAPyj4xwfEX8JACc?sign=1682674608.820826-5Q6Tw-0-d690ed4db802eb30e7e0b76919d42dc7)

Note:

- It is strongly recommended that your app server synchronises the status of approval items in real-time/frequently as it affects the end-user experience of your app users (i.e., the approvers).