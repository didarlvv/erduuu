"use client"
import { useRouter, usePathname } from "next/navigation"
import type React from "react"
import { ChevronDown, Phone, Shield, Bell, ChevronLeft, ChevronRight } from "lucide-react"
import { getUserData } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/Sidebar"
import { LanguageSelector } from "@/components/LanguageSelector"
import { useLanguage } from "@/contexts/LanguageContext"
import { NotificationsPopover } from "@/components/NotificationsPopover"
import { useState, useEffect } from "react"
import { fetchMailTypes } from "@/lib/api"
import Link from "next/link"
import type { MailType } from "@/types/mail-types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Local translations
const translations = {
  ru: {
    "header.dashboard": "Панель управления",
    "header.userInfo": "Информация о пользователе",
    "header.position": "Должность",
    "header.status": "Статус",
    "header.active": "Активный",
    "header.inactive": "Неактивный",
    "header.phone": "Телефон",
    "header.systemLanguage": "Язык системы",
    "header.users": "Пользователи",
    "header.roles": "Роли",
    "header.organizations": "Организации",
    "header.responsibilities": "Должности",
    "header.mailTypes": "Типы писем",
    "header.permissions": "Разрешения",
    "header.files": "Файлы",
    "header.externalMail": "Внешние письма",
    "header.internalMail": "Внутренние письма",
    "header.mails": "Письма",
    "header.archive": "Архив",
    "header.chat": "Чаты",
    "header.logs": "Логи",
  },
  tk: {
    "header.dashboard": "Dolandyryş paneli",
    "header.userInfo": "Ulanyjy maglumaty",
    "header.position": "Wezipe",
    "header.status": "Ýagdaý",
    "header.active": "Işjeň",
    "header.inactive": "Işjeň däl",
    "header.phone": "Telefon",
    "header.systemLanguage": "Ulgam dili",
    "header.users": "Ulanyjylar",
    "header.roles": "Wezipeler",
    "header.organizations": "Guramalar",
    "header.responsibilities": "Jogapkärçilikler",
    "header.mailTypes": "Hat görnüşleri",
    "header.permissions": "Rugsatlar",
    "header.files": "Faýllar",
    "header.externalMail": "Daşary hatlar",
    "header.internalMail": "Içerki hatlar",
    "header.mails": "Hatlar",
    "header.archive": "Arhiw",
    "header.chat": "Çatlar",
    "header.logs": "Loglar",
  },
  en: {
    "header.dashboard": "Dashboard",
    "header.userInfo": "User Information",
    "header.position": "Position",
    "header.status": "Status",
    "header.active": "Active",
    "header.inactive": "Inactive",
    "header.phone": "Phone",
    "header.systemLanguage": "System Language",
    "header.users": "Users",
    "header.roles": "Roles",
    "header.organizations": "Organizations",
    "header.responsibilities": "Responsibilities",
    "header.mailTypes": "Mail Types",
    "header.permissions": "Permissions",
    "header.files": "Files",
    "header.externalMail": "External Mail",
    "header.internalMail": "Internal Mail",
    "header.mails": "Mails",
    "header.archive": "Archive",
    "header.chat": "Chats",
    "header.logs": "Logs",
  },
}

// Local translate function
const translate = (key: string, language: string): string => {
  return translations[language as keyof typeof translations]?.[key] || key
}

const getLocalizedName = (names: { name: string; lang: string }[], lang: string) => {
  return names.find((n) => n.lang === lang)?.name || ""
}

type MailTypesButtonsProps = {
  mailTypes: MailType[]
  language: string
}

const MailTypesButtons: React.FC<MailTypesButtonsProps> = ({ mailTypes, language }) => {
  return (
    <div className="flex space-x-2 overflow-x-auto">
      {mailTypes.map((mailType) => (
        <Button key={mailType.id} variant="ghost" className="whitespace-nowrap">
          <Link href={`/dashboard/mails/${mailType.slug}`}>{getLocalizedName(mailType.names, language)}</Link>
        </Button>
      ))}
    </div>
  )
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const userData = getUserData()
  const { isOpen, toggleSidebar } = useSidebar()
  const { language } = useLanguage()

  const [mailTypes, setMailTypes] = useState<MailType[]>([])

  useEffect(() => {
    const loadMainMailTypes = async () => {
      try {
        const response = await fetchMailTypes({
          is_main: true,
          order_by: "id",
          order_direction: "ASC",
          skip: 1,
          limit: 1000,
        })
        setMailTypes(response.payload)
      } catch (error) {
        console.error("Error fetching main mail types:", error)
      }
    }

    loadMainMailTypes()
  }, [])

  const formatPhoneNumber = (phone?: number) => {
    if (!phone) return "N/A"
    const phoneStr = phone.toString()
    return `+993 ${phoneStr.slice(0, 2)} ${phoneStr.slice(2, 5)} ${phoneStr.slice(5)}`
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-[88px] items-center px-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-4">
          {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <nav className="flex items-center space-x-4 overflow-x-auto">
            <MailTypesButtons mailTypes={mailTypes} language={language} />
          </nav>
          <div className="flex items-center space-x-4">
            <NotificationsPopover>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
              </Button>
            </NotificationsPopover>
            <LanguageSelector />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-full px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                      {userData?.first_name?.[0]?.toUpperCase() ?? ""}
                      {userData?.last_name?.[0]?.toUpperCase() ?? ""}
                    </div>
                    <span className="font-medium">
                      {userData?.first_name ?? ""} {userData?.last_name ?? ""}
                    </span>
                    <ChevronDown size={16} />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="font-semibold">
                  {translate("header.userInfo", language)}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-3 py-2 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">{translate("header.position", language)}:</span>
                    <span className="font-medium ml-auto">{userData?.roles?.[0]?.name ?? "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={cn("w-2 h-2 rounded-full", {
                        "bg-green-500": userData?.status === "active",
                        "bg-red-500": userData?.status !== "active",
                      })}
                    />
                    <span className="text-muted-foreground">{translate("header.status", language)}:</span>
                    <span className="font-medium ml-auto">
                      {translate(`header.${userData?.status ?? "inactive"}`, language)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">{translate("header.phone", language)}:</span>
                    <span className="font-medium ml-auto">{formatPhoneNumber(userData?.phone)}</span>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

