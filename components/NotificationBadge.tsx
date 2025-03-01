import type React from "react";
import { useNotification } from "@/contexts/NotificationContext";
import { Badge } from "@/components/ui/badge";

export const NotificationBadge: React.FC = () => {
  const { notifications } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className="absolute -top-1 -right-1 px-2 py-1 text-xs"
    >
      {notifications.length}
    </Badge>
  );
};
