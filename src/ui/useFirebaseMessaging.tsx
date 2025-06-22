import { useEffect, useState } from "react";
import { requestForToken } from "../firebase";
import { useSaveFCMTokenMutation } from "../api/authApi";

export const useFirebaseMessaging = () => {
  const [saveFCMToken] = useSaveFCMTokenMutation();
  const [isInitialized, setIsInitialized] = useState(false); // Флаг для предотвращения повторов

  useEffect(() => {
    const initMessaging = async () => {
      // Проверяем, авторизован ли пользователь
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken || isInitialized) {
        console.log("Нет токена или уже инициализировано, пропускаем FCM");
        return;
      }

      try {
        const token = await requestForToken();
        if (token) {
          console.log("FCM токен получен:", token);
          await saveFCMToken({ fcm_token: token }).unwrap();
          console.log("FCM токен сохранён");
          setIsInitialized(true); // Помечаем как инициализировано
        } else {
          console.log("FCM токен не получен");
        }
      } catch (error) {
        console.error("Ошибка сохранения FCM токена:", error);
        setIsInitialized(true); // Помечаем как инициализировано, чтобы не повторять
      }
    };

    initMessaging();
  }, [saveFCMToken, isInitialized]);
};
