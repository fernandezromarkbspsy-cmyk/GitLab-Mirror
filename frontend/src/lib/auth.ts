// C:\Users\spxph4227\Desktop\soc5-outbound\frontend\src\lib\auth.ts

import { Account, ID, Models } from "appwrite";
import { appwriteClient } from "./appwrite";

const account = new Account(appwriteClient);

export async function createAccount(
  email: string,
  password: string,
  name: string,
): Promise<Models.User<Models.Preferences>> {
  return account.create<Models.Preferences>(ID.unique(), email, password, name);
}

export async function login(email: string, password: string) {
  return account.createEmailPasswordSession(email, password);
}

export async function logout() {
  return account.deleteSession("current");
}

export async function getCurrentUser(): Promise<Models.User<Models.Preferences>> {
  return account.get<Models.Preferences>();
}
