"use client"

import { Bell } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLanguage } from "@/contexts/LanguageContext"
import { fetchNotificationCount, fetchNotifications } from "@/lib/api"
import type { Notification, NotificationCount } from "@/types/notifications"
import { cn } from "@/lib/utils"
import { useResponsibilities } from "@/hooks/useResponsibilities"

const translations = {
  ru: {
    notifications: "Уведомления",
    noNotifications: "Нет новых уведомлений",
    from: "От",
    to: "Кому",
    code: "Код",
    internal: "Внутренний",
    external: "Внешний",
    error: "О��ибка загрузки уведомлений",
    loading: "Загрузка...",
  },
  tk: {
    notifications: "Duýduryşlar",
    noNotifications: "Täze duýduryş ýok",
    from: "Kimden",
    to: "Kime",
    code: "Kod",
    internal: "Içerki",
    external: "Daşarky",
    error: "Duýduryşlary ýüklemekde ýalňyşlyk",
    loading: "Ýüklenýär...",
  },
  en: {
    notifications: "Notifications",
    noNotifications: "No new notifications",
    from: "From",
    to: "To",
    code: "Code",
    internal: "Internal",
    external: "External",
    error: "Error loading notifications",
    loading: "Loading...",
  },
}

export function NotificationsPopover() {
  const { language } = useLanguage()
  const [counts, setCounts] = useState<NotificationCount[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { responsibilities, isLoading: isLoadingResponsibilities, error: responsibilitiesError } = useResponsibilities()

  const translate = useCallback(
    (key: keyof typeof translations.en) => {
      return translations[language as keyof typeof translations][key]
    },
    [language],
  )

  const totalCount = counts.reduce((acc, curr) => acc + Number.parseInt(curr.count), 0)

  const fetchData = useCallback(async () => {
    if (responsibilities.length === 0) return

    try {
      const countResponse = await fetchNotificationCount(responsibilities)
      setCounts(countResponse.payload)

      const notificationsResponse = await fetchNotifications(responsibilities)
      setNotifications(notificationsResponse.payload)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }, [responsibilities])

  useEffect(() => {
    if (!isLoadingResponsibilities && responsibilities.length > 0) {
      fetchData()
      // Set up polling interval
      const interval = setInterval(fetchData, 10000) // Poll every 10 seconds

      return () => clearInterval(interval)
    }
  }, [fetchData, isLoadingResponsibilities, responsibilities])

  if (isLoadingResponsibilities) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  if (responsibilitiesError) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled title={translate("error")}>
        <Bell className="h-5 w-5 text-destructive" />
      </Button>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={translate("notifications")}>
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <h4 className="text-sm font-semibold">{translate("notifications")}</h4>
        </div>
        <div className="max-h-96 overflow-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">{translate("noNotifications")}</div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex flex-col gap-1 p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{notification.title}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs",
                        notification.type === "internal" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700",
                      )}
                    >
                      {translate(notification.type)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>
                      {translate("code")}: {notification.code}
                    </div>
                    <div>
                      {translate("from")}: {notification.sender}
                    </div>
                    <div>
                      {translate("to")}: {notification.receiver}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

