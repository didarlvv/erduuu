"use client";
import { useState, createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  ArrowDownUp,
  Users,
  FileText,
  Inbox,
  FileJson,
  Building2,
  Briefcase,
  Mail,
  ChevronDown,
  Globe,
  LogOut,
  MessageSquare,
  Archive,
  Home,
  Settings,
} from "lucide-react";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
// import { useEffect } from "react"
// import { fetchMailTypes } from "@/lib/api"
// import type { MailType } from "@/types/mail-types"

const SidebarContext = createContext<{
  isOpen: boolean;
  toggleSidebar: () => void;
}>({
  isOpen: true,
  toggleSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

const menuItems = [
  {
    icon: Home,
    labelKey: "dashboard",
    href: "/dashboard",
    permission: "",
  },
  {
    icon: Globe,
    labelKey: "externalMail",
    permission: "",
    items: [
      {
        labelKey: "outgoing",
        href: "/dashboard/external-mail/outgoing",
        permission: "manager.users.external-mail.readall",
      },
      {
        labelKey: "incoming",
        href: "/dashboard/external-mail/incoming",
        permission: "manager.users.external-mail.readall",
      },
    ],
  },
  {
    icon: ArrowDownUp,
    labelKey: "internalMail",
    permission: "",
    items: [
      {
        labelKey: "sent",
        href: "/dashboard/mails/sent",
        permission: "manager.users.mails.readall",
      },
      {
        labelKey: "inbox",
        href: "/dashboard/mails/inbox",
        permission: "manager.users.mails.readall",
      },
    ],
  },
  {
    icon: Archive,
    labelKey: "archive",
    permission: "manager.users.archive.readall",
    items: [
      {
        labelKey: "externalOutgoing",
        href: "/dashboard/archive/external-mail/outgoing",
        permission: "manager.users.external-mail.readall",
      },
      {
        labelKey: "externalIncoming",
        href: "/dashboard/archive/external-mail/incoming",
        permission: "manager.users.external-mail.readall",
      },
      {
        labelKey: "internalOutgoing",
        href: "/dashboard/archive/mails/sent",
        permission: "manager.users.mails.readall",
      },
      {
        labelKey: "internalIncoming",
        href: "/dashboard/archive/mails/inbox",
        permission: "manager.users.mails.readall",
      },
    ],
  },
  {
    icon: Users,
    labelKey: "users",
    href: "/dashboard/users",
    permission: "manager.users.users.readall",
  },
  {
    icon: Building2,
    labelKey: "organizations",
    href: "/dashboard/organizations",
    permission: "manager.users.organizations.readall",
  },
  {
    icon: Briefcase,
    labelKey: "responsibilities",
    href: "/dashboard/responsibilities",
    permission: "manager.users.responsibilities.readall",
  },
  {
    icon: Settings,
    labelKey: "manager",
    permission: "",
    items: [
      {
        icon: FileJson,
        labelKey: "logs",
        href: "/dashboard/logs",
        permission: "manager.users.logs.readall",
      },
      {
        icon: FileJson,
        labelKey: "files",
        href: "/dashboard/files",
        permission: "manager.users.files.readall",
      },
      {
        icon: Inbox,
        labelKey: "permissions",
        href: "/dashboard/permissions",
        permission: "manager.users.permissions.readall",
      },
      {
        icon: Mail,
        labelKey: "mailTypes",
        href: "/dashboard/mail-types",
        permission: "manager.users.mail-types.readall",
      },
      {
        icon: FileText,
        labelKey: "roles",
        href: "/dashboard/roles",
        permission: "manager.users.roles.readall",
      },
    ],
  },
  {
    icon: MessageSquare,
    labelKey: "chats",
    href: "/dashboard/chat",
    permission: "manager.users.chats.create",
  },
];

const translations = {
  ru: {
    "sidebar.dashboard": "Главная",
    "sidebar.users": "Пользователи",
    "sidebar.roles": "Роли",
    "sidebar.organizations": "Организации",
    "sidebar.responsibilities": "Должности",
    "sidebar.mailTypes": "Типы писем",
    "sidebar.permissions": "Разрешения",
    "sidebar.files": "Файлы",
    "sidebar.externalMail": "Внешние письма",
    "sidebar.internalMail": "Внутренние письма",
    "sidebar.sent": "Отправленные",
    "sidebar.inbox": "Входящие",
    "sidebar.create": "Создать",
    "sidebar.mails": "Письма",
    "sidebar.externalLines": "Внешние линии",
    "sidebar.archive": "Архив",
    "sidebar.logout": "Выйти",
    "sidebar.logoutConfirmTitle": "Вы уверены, что хотите выйти?",
    "sidebar.logoutConfirmDescription":
      "Это действие завершит ваш текущий сеанс. Вам потребуется войти снова для доступа к системе.",
    "sidebar.cancel": "Отмена",
    "sidebar.ministryLogo": "Министерство энергетики Туркменистана",
    "sidebar.ministryName1": "Türkmenistanyň",
    "sidebar.ministryName2": "Energetika ministrligi",
    "sidebar.systemVersion": "Версия системы",
    "sidebar.outgoing": "Исходящие",
    "sidebar.incoming": "Входящие",
    "sidebar.chats": "Чаты",
    "sidebar.externalOutgoing": "Исходящие внешние письма",
    "sidebar.externalIncoming": "Входящие внешние письма",
    "sidebar.internalOutgoing": "Исходящие внутренние письма",
    "sidebar.internalIncoming": "Входящие внутренние письма",
    "sidebar.logs": "Логи",
    "sidebar.manager": "Менеджер",
  },
  tk: {
    "sidebar.dashboard": "Baş sahypa",
    "sidebar.users": "Ulanyjylar",
    "sidebar.roles": "Wezipeler",
    "sidebar.organizations": "Guramalar",
    "sidebar.responsibilities": "Jogapkärçilikler",
    "sidebar.mailTypes": "Hat görnüşleri",
    "sidebar.permissions": "Rugsatlar",
    "sidebar.files": "Faýllar",
    "sidebar.externalMail": "Daşary hatlar",
    "sidebar.internalMail": "Içerki hatlar",
    "sidebar.sent": "Iberildi",
    "sidebar.inbox": "Gelen hatlar",
    "sidebar.create": "Döretmek",
    "sidebar.mails": "Hatlar",
    "sidebar.externalLines": "Daşarky liniýalar",
    "sidebar.archive": "Arhiw",
    "sidebar.logout": "Çykmak",
    "sidebar.logoutConfirmTitle": "Çykmak isleýärsiňizmi?",
    "sidebar.logoutConfirmDescription":
      "Bu hereket häzirki sessiýaňyzy tamamlar. Ulgama girmek üçin täzeden girmeli bolarsyňyz.",
    "sidebar.cancel": "Ýatyrmak",
    "sidebar.ministryLogo": "Türkmenistanyň Energetika ministrligi",
    "sidebar.ministryName1": "Türkmenistanyň",
    "sidebar.ministryName2": "Energetika ministrligi",
    "sidebar.systemVersion": "Ulgamyň wersiýasy",
    "sidebar.outgoing": "Gidýän",
    "sidebar.incoming": "Gelýän",
    "sidebar.chats": "Çatlar",
    "sidebar.externalOutgoing": "Gidýän daşary hatlar",
    "sidebar.externalIncoming": "Gelýän daşary hatlar",
    "sidebar.internalOutgoing": "Gidýän içerki hatlar",
    "sidebar.internalIncoming": "Gelýän içerki hatlar",
    "sidebar.logs": "Loglar",
    "sidebar.manager": "Dolandyryjy",
  },
  en: {
    "sidebar.dashboard": "Dashboard",
    "sidebar.users": "Users",
    "sidebar.roles": "Roles",
    "sidebar.organizations": "Organizations",
    "sidebar.responsibilities": "Responsibilities",
    "sidebar.mailTypes": "Mail Types",
    "sidebar.permissions": "Permissions",
    "sidebar.files": "Files",
    "sidebar.externalMail": "External Mail",
    "sidebar.internalMail": "Internal Mail",
    "sidebar.sent": "Sent",
    "sidebar.inbox": "Inbox",
    "sidebar.create": "Create",
    "sidebar.mails": "Mails",
    "sidebar.externalLines": "External lines",
    "sidebar.archive": "Archive",
    "sidebar.logout": "Logout",
    "sidebar.logoutConfirmTitle": "Are you sure you want to log out?",
    "sidebar.logoutConfirmDescription":
      "This action will end your current session. You will need to log in again to access the system.",
    "sidebar.cancel": "Cancel",
    "sidebar.ministryLogo": "Ministry of Energy of Turkmenistan",
    "sidebar.ministryName1": "Ministry of Energy",
    "sidebar.ministryName2": "of Turkmenistan",
    "sidebar.systemVersion": "System version",
    "sidebar.outgoing": "Outgoing",
    "sidebar.incoming": "Incoming",
    "sidebar.chats": "Chats",
    "sidebar.externalOutgoing": "Outgoing External Mail",
    "sidebar.externalIncoming": "Incoming External Mail",
    "sidebar.internalOutgoing": "Outgoing Internal Mail",
    "sidebar.internalIncoming": "Incoming Internal Mail",
    "sidebar.logs": "Logs",
    "sidebar.manager": "Manager",
  },
};

const translate = (key: string, language: string): string => {
  return translations[language as keyof typeof translations][key] || key;
};

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar() {
  const { isOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const permissions = menuItems.map((item) =>
    item.permission ? usePermission(item.permission) : true
  );
  const { language: currentLanguage } = useLanguage();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const LogoutButton = () => {
    const buttonClasses = cn(
      "flex items-center w-full px-4 py-3 text-[15px] text-gray-700 hover:bg-gray-50 rounded-lg transition-colors",
      !isOpen && "w-12 h-12 p-0 justify-center"
    );
    const iconClasses = cn(
      "w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shadow-sm",
      !isOpen && "w-full h-full"
    );
    const iconSizeClasses = cn("h-5 w-5", !isOpen && "h-6 w-6");
    const iconColorClass = "text-red-600";

    return (
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogTrigger asChild>
          <button
            className={buttonClasses}
            onClick={(e) => {
              e.preventDefault();
              setIsAlertOpen(true);
            }}
          >
            <div className={iconClasses}>
              <LogOut className={cn(iconSizeClasses, iconColorClass)} />
            </div>
            {isOpen && (
              <span className="ml-3">
                {translate("sidebar.logout", currentLanguage)}
              </span>
            )}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {translate("sidebar.logoutConfirmTitle", currentLanguage)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translate("sidebar.logoutConfirmDescription", currentLanguage)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {translate("sidebar.cancel", currentLanguage)}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {translate("sidebar.logout", currentLanguage)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "min-h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out",
          isOpen ? "w-80" : "w-20"
        )}
      >
        <div
          className={cn(
            "p-4 border-b border-gray-200 flex items-center min-h-[89px]",
            isOpen ? "justify-between" : "justify-center"
          )}
        >
          <div
            className={cn(
              "flex items-center",
              isOpen ? "gap-4" : "justify-center"
            )}
          >
            <div
              className={cn(
                "flex-shrink-0",
                isOpen ? "w-14 h-14" : "w-12 h-12"
              )}
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wjTnDDr5vGt6haZTkljVCbMMF60pP6.png"
                alt={translate("sidebar.ministryLogo", language)}
                width={isOpen ? 56 : 48}
                height={isOpen ? 56 : 48}
                className="w-full h-full object-contain"
              />
            </div>
            {isOpen && (
              <div className="flex flex-col">
                <div className="text-base font-medium text-gray-700">
                  {translate("sidebar.ministryName1", language)}
                </div>
                <div className="text-base font-medium text-gray-700">
                  {translate("sidebar.ministryName2", language)}
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4">
          {menuItems.map((item, index) => {
            const hasPermission = permissions[index];

            if (!hasPermission) {
              return null;
            }

            if (item.items) {
              const subItemsWithPermission = item.items.filter(
                (subItem) =>
                  !subItem.permission || usePermission(subItem.permission)
              );

              if (subItemsWithPermission.length === 0) {
                return null;
              }

              return isOpen ? (
                <Collapsible key={item.labelKey} className="group mb-2">
                  <CollapsibleTrigger className="flex items-center w-full px-4 py-3 text-[15px] text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-9 h-9 mr-3 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600 shadow-sm">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="flex-1 text-left font-medium">
                      {translate(`sidebar.${item.labelKey}`, language)}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {subItemsWithPermission.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "flex items-center pl-16 py-2 text-[15px]",
                          pathname === subItem.href
                            ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                            : "text-gray-600 hover:bg-gray-50",
                          "rounded-lg mt-1 transition-colors"
                        )}
                      >
                        {translate(`sidebar.${subItem.labelKey}`, language)}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <DropdownMenu key={item.labelKey}>
                  <DropdownMenuTrigger asChild>
                    <button className="w-12 h-12 mb-2 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600 shadow-sm hover:bg-gray-200 transition-colors">
                      <item.icon className="h-6 w-6" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" className="w-56">
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">
                      {translate(`sidebar.${item.labelKey}`, language)}
                    </div>
                    {subItemsWithPermission.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "flex items-center px-2 py-2 text-sm",
                          pathname === subItem.href
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-700 hover:bg-gray-50",
                          "rounded-md transition-colors"
                        )}
                      >
                        {translate(`sidebar.${subItem.labelKey}`, language)}
                      </Link>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return isOpen ? (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-[15px] mb-1",
                  pathname === item.href
                    ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                    : "text-gray-700 hover:bg-gray-50",
                  "rounded-lg transition-colors"
                )}
              >
                <div className="w-9 h-9 mr-3 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <item.icon className="h-5 w-5" />
                </div>
                <span>{translate(`sidebar.${item.labelKey}`, language)}</span>
              </Link>
            ) : (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center w-12 h-12 mb-1",
                      pathname === item.href
                        ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                        : "text-gray-700 hover:bg-gray-50",
                      "rounded-lg transition-colors"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{translate(`sidebar.${item.labelKey}`, language)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div
          className={cn(
            "p-4 border-t border-gray-200",
            isOpen ? "" : "flex flex-col items-center"
          )}
        >
          {isOpen ? (
            <>
              <LogoutButton />
              <div className="mt-4 text-xs text-gray-500 px-4">
                {translate("sidebar.systemVersion", language)} v1.0.0
              </div>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <LogoutButton />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{translate("sidebar.logout", language)}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

