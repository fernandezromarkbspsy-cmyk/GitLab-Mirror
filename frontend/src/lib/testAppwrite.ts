// C:\Users\spxph4227\Desktop\soc5-outbound\frontend\src\lib\testAppwrite.ts

import { getCurrentUser } from "./auth";

getCurrentUser()
  .then((user) => {
    console.log("Appwrite connected:", user);
  })
  .catch((error) => {
    console.log("Appwrite response:", error.message);
  });
