"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSocket } from "@/hooks/useSocket";
import { useLanguage } from "@/contexts/LanguageContext";
import { chatTranslations } from "@/app/dashboard/chat/chat.translations";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";

interface NotificationContextType {
  addNotification: (message: string, sender: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { onNewMessageToChat } = useSocket();
  const { language } = useLanguage();
  const pathname = usePathname();
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(
    null
  );

  const translate = useCallback(
    (key: keyof typeof chatTranslations.en) => {
      return chatTranslations[language][key] || key;
    },
    [language]
  );

  const addNotification = useCallback(
    (message: string, sender: string, messageId: string) => {
      if (
        !pathname.startsWith("/dashboard/chat") &&
        messageId !== lastNotificationId
      ) {
        toast.info(`${sender}: ${message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setLastNotificationId(messageId);
      }
    },
    [pathname, lastNotificationId]
  );

  useEffect(() => {
    const handleNewMessage = (messages: any[]) => {
      messages.forEach((message) => {
        addNotification(message.payload, message.sender_fullname, message.id);
      });
    };

    onNewMessageToChat(handleNewMessage);

    return () => {
      // Cleanup if necessary
    };
  }, [onNewMessageToChat, addNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
