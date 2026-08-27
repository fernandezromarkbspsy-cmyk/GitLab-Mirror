# Get Started on SeaTalk RN App

**Source:** https://open.seatalk.io/docs/rn-sdk-guide_get-started

## SeaTalk React Native SDK

React Native is an open-source mobile application framework, and it provides almost the same experience as the native mobile application. With SeaTalk RN SDK, you may utilize built-in basic components and client APIs to set up your own apps easily. 

## Architecture

There will be three layers of concepts, namely the host application (the Host App), the React Native SDK (the RN SDK) and the React Native application (the RN App).

- An RN App is any third-party React Native application built on top of the SeaTalk RN SDK. There could be as many applications as necessary.

- The RN SDK provides access to shared APIs and resources that an RN App might need. It also contains all of the native modules the host app exposes for RN to use. There's only one SDK.

- The Host App is the native (iOS/Android) app for the RN application to be embedded in. For development, we will be using the SeaTalk RN app, which you may download from https://app.sea.com after logging in with your company account. If you don't see a SeaTalk RN app in the list, please request access from the SeaTalk RN team (contact nigel.yeo@shopee.com or cooper.xuyuan@shopee.com).

![01.rn_structure.jpg](https://open.seatalk.io/apidocs/seagroup/res/rn_sdk/01.rn_structure.jpg)

## Language

We support development in both ES6 and TypeScript. For the TypeScript version please refer to the table below. Listed below is the list of third-party dependencies for Version 1.0 of our RN SDK.

| Package | Source Version | Type Version |
| --- | --- | --- |
| node | 14.0.14 | N/A |
| typescript | 3.9.3 | N/A |
| react | 16.9.0 | 16.9.0 |
| react-native | 0.61.5 | 0.61.5 |
| react-redux | 7.2.0 | 7.1.9 |
| redux | 4.0.5 | 3.6.0 |
| rxjs | 6.5.3 | 6.5.3 |

&nbsp;