"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { fetchSpecialMails } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Mail, Users, ArrowRight, Bell } from "lucide-react"
import type { SpecialMail } from "@/types/special-mails"
import { useLanguage } from "@/contexts/LanguageContext"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const translations = {
  ru: {
    dashboard: "Панель управления",
    specialMails: "Специальные письма",
    searchMails: "Поиск писем...",
    search: "Поиск",
    loadError: "Не удалось загру��ить письма. Пожалуйста, попробуйте позже.",
    createdBy: "Создал",
    members: "Участники",
    noMails: "Писем не найдено",
    internal: "Внутреннее",
    external: "Внешнее",
    unreadMessages: "непрочитанных",
  },
  tk: {
    dashboard: "Dolandyryş paneli",
    specialMails: "Ýörite hatlar",
    searchMails: "Hatlary gözle...",
    search: "Gözle",
    loadError: "Hatlary ýükläp bolmady. Soňrak gaýtadan synanyşyň.",
    createdBy: "Dörediji",
    members: "Agzalar",
    noMails: "Hat tapylmady",
    internal: "Içerki",
    external: "Daşarky",
    unreadMessages: "okalmedik",
  },
  en: {
    dashboard: "Dashboard",
    specialMails: "Special Mails",
    searchMails: "Search mails...",
    search: "Search",
    loadError: "Failed to load mails. Please try again later.",
    createdBy: "Created by",
    members: "Members",
    noMails: "No mails found",
    internal: "Internal",
    external: "External",
    unreadMessages: "unread",
  },
}

const translate = (key: string, language: string): string => {
  return translations[language as keyof typeof translations][key as keyof (typeof translations)["en"]] || key
}

export default function DashboardPage() {
  const [mails, setMails] = useState<SpecialMail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguage()
  const router = useRouter()

  const loadMails = useCallback(
    async (search = "") => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetchSpecialMails({
          search,
          order_direction: "DESC",
          skip: 1,
          limit: 10,
          lang: language,
          locals: [], // Initialize with empty locals array as per API spec
        })
        setMails(response.payload)
      } catch (err) {
        setError(translate("loadError", language))
      } finally {
        setIsLoading(false)
      }
    },
    [language],
  )

  useEffect(() => {
    loadMails()
  }, [loadMails])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadMails(searchTerm)
  }

  const handleMailClick = (mail: SpecialMail) => {
    const basePath = mail.reference === "internal" ? "/dashboard/mails" : "/dashboard/external-mail/incoming"
    router.push(`${basePath}/${mail.mail_id}`)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold text-gray-900">{translate("dashboard", language)}</h1>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {translate("specialMails", language)}
            </CardTitle>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="search"
                placeholder={translate("searchMails", language)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[300px]"
              />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4 mr-2" />
                {translate("search", language)}
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">{error}</div>
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="p-4">
                    <Skeleton className="h-6 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </Card>
                ))
              ) : mails.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">{translate("noMails", language)}</div>
              ) : (
                mails.map((mail) => (
                  <Card
                    key={mail.mail_id}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleMailClick(mail)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium text-lg">{mail.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {translate("createdBy", language)}: {mail.creator}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>
                            {mail.member_count} {translate("members", language)}
                          </span>
                        </Badge>
                        <Badge
                          variant={mail.reference === "external" ? "secondary" : "default"}
                          className="flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          <span>{translate(mail.reference, language)}</span>
                        </Badge>
                        {mail.unread_count > 0 && (
                          <Badge variant="default" className="bg-blue-500 flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            <span>
                              {mail.unread_count} {translate("unreadMessages", language)}
                            </span>
                          </Badge>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

