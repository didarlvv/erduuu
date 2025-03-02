"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSocket } from "@/hooks/useSocket";
import { useLanguage } from "@/contexts/LanguageContext";
import { chatTranslations } from "@/app/dashboard/chat/chat.translations";
import { usePathname } from "next/navigation";
import { toast, type Id } from "react-toastify";

interface NotificationContextType {
  addNotification: (message: string, sender: string, messageId: string) => void;
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
  const shownNotifications = useRef<Set<string>>(new Set());
  const toastIds = useRef<Map<string, Id>>(new Map());

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
        !shownNotifications.current.has(messageId)
      ) {
        const existingToastId = toastIds.current.get(sender);

        if (existingToastId) {
          toast.update(existingToastId, {
            render: `${sender}: ${message}`,
            autoClose: 5000,
          });
        } else {
          const newToastId = toast.info(`${sender}: ${message}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          toastIds.current.set(sender, newToastId);
        }

        shownNotifications.current.add(messageId);

        // Ограничиваем количество хранимых уведомлений
        if (shownNotifications.current.size > 100) {
          const oldestNotification = shownNotifications.current
            .values()
            .next().value;
          shownNotifications.current.delete(oldestNotification);
        }
      }
    },
    [pathname]
  );

  useEffect(() => {
    const handleNewMessage = (messages: any[]) => {
      messages.forEach((message) => {
        addNotification(message.payload, message.sender_fullname, message.id);
      });
    };

    onNewMessageToChat(handleNewMessage);

    return () => {
      // Очистка при размонтировании
      toast.dismiss();
      shownNotifications.current.clear();
      toastIds.current.clear();
    };
  }, [onNewMessageToChat, addNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
