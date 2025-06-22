importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBy45M0bXor53i9Ud2zCxF9pYlBdFIk7EE",
  projectId: "eldik-bank",
  messagingSenderId: "752524675429",
  appId: "1:752524675429:web:98f610f0c31c159864f98c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "Новое уведомление";
  const notificationOptions = {
    body: payload.notification?.body || "Обновление статуса вашей заявки",
    icon: "/logo192.png",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
