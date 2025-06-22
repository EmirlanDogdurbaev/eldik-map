import { useEffect } from "react";
import { requestForToken } from "../firebase";
import { useSaveFCMTokenMutation } from "../api/authApi";

export const useFirebaseMessaging = () => {
  const [saveFCMToken] = useSaveFCMTokenMutation();

  useEffect(() => {
    const initMessaging = async () => {
      const token = await requestForToken();
      if (token) {
        try {
          await saveFCMToken({ fcm_token: token }).unwrap();
        } catch (error) {
          console.error("Ошибка сохранения токена:", error);
        }
      }
    };
    initMessaging();
  }, [saveFCMToken]);
};
