import React, { useState, useEffect } from "react";
import { onMessageListener } from "../../firebase";
import type { MessagePayload } from "firebase/messaging";
import { toast } from "react-toastify";

interface Notification {
  title: string;
  body: string;
}

const NotificationHandler: React.FC = () => {
  const [notification, setNotification] = useState<Notification>({
    title: "",
    body: "",
  });

  useEffect(() => {
    const listenMessages = async () => {
      try {
        const payload = await onMessageListener();
        if (payload) {
          const { title = "Новое уведомление", body = "Новое сообщение" } =
            (payload as MessagePayload).notification || {};
          setNotification({ title, body });
          toast.info(`${title}: ${body}`, {
            position: "top-right",
            autoClose: 4000,
          });
        }
      } catch (err) {
        console.error("Ошибка при получении уведомления:", err);
        toast.error("Не удалось получить уведомление");
      }
    };

    listenMessages();
  }, [notification]);

  return <></>;
};

export default NotificationHandler;
