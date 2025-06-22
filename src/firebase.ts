import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBy45M0bXor53i9Ud2zCxF9pYlBdFIk7EE",
  authDomain: "eldik-bank.firebaseapp.com",
  projectId: "eldik-bank",
  storageBucket: "eldik-bank.appspot.com",
  messagingSenderId: "752524675429",
  appId: "1:752524675429:web:98f610f0c31c159864f98c",
};

const app = initializeApp(firebaseConfig);

export const getFirebaseMessaging = () => {
  if (typeof window !== "undefined") {
    return getMessaging(app);
  }
  return null;
};

export const requestForToken = async () => {
  const messaging = getFirebaseMessaging();

  if (!messaging) {
    console.log("Firebase messaging не инициализирован");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted");
      return null;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      console.log("Current token for client: ", currentToken);
      return currentToken;
    } else {
      console.log("No registration token available.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token:", err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getFirebaseMessaging();

    if (!messaging) {
      console.log("Firebase messaging не инициализирован");
      resolve(null);
      return;
    }

    onMessage(messaging, (payload) => {
      console.log("Message received:", payload);
      resolve(payload);
    });
  });
