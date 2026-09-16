// C:\Users\spxph4227\Desktop\soc5-outbound\frontend\src\lib\appwrite.ts

import { Client } from "appwrite";

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const appwriteClient = client;
