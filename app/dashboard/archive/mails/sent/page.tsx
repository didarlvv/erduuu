"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePermission } from "@/hooks/usePermission"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { fetchInternalSentMails } from "@/lib/api"
import { SentMailsTable } from "@/app/dashboard/mails/sent/sent-mails-table"
import type { InternalMail } from "@/lib/types"

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export default function ArchivedSentMailsPage() {
  const router = useRouter()
  const hasReadAccess = usePermission("manager.users.mails.readall")
  const [mails, setMails] = useState<InternalMail[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    order_direction: "DESC" as const,
    order_by: "created_at",
    limit: 10,
    lang: "ru",
    is_read: undefined as boolean | undefined,
    start_date: undefined as number | undefined,
    end_date: undefined as number | undefined,
  })
  const [isAnyFilterApplied, setIsAnyFilterApplied] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState("")
  const { language } = useLanguage()
  const [hasNextPage, setHasNextPage] = useState(true)

  const translations = {
    ru: {
      archivedSentMails: "Архив отправленных писем",
      manageSentMails: "Управление архивированными отправленными письмами",
      manageSentMailsDescription: "Просмотр, фильтрация и управление архивированными отправленными письмами.",
      accessDenied: "Доступ запрещен",
      noPermission: "У вас нет необходимых прав для просмотра этой страницы.",
      loadError: "Ошибка загрузки отправленных писем",
    },
    tk: {
      archivedSentMails: "Iberilen hatlaryň arhiwi",
      manageSentMails: "Arhiwlenen iberilen hatlary dolandyrmak",
      manageSentMailsDescription: "Arhiwlenen iberilen hatlary görmek, süzmek we dolandyrmak.",
      accessDenied: "Giriş gadagan",
      noPermission: "Bu sahypany görmäge rugsadyňyz ýok.",
      loadError: "Iberilen hatlary ýüklemekde ýalňyşlyk",
    },
    en: {
      archivedSentMails: "Archived Sent Mails",
      manageSentMails: "Manage Archived Sent Mails",
      manageSentMailsDescription: "View, filter, and manage archived sent mails.",
      accessDenied: "Access Denied",
      noPermission: "You don't have the necessary permissions to view this page.",
      loadError: "Error loading sent mails",
    },
  }

  const translate = useCallback(
    (key: string) => {
      return translations[language][key] || key
    },
    [language],
  )

  const loadMails = useCallback(async () => {
    if (!hasReadAccess) return

    try {
      setIsLoading(true)
      const response = await fetchInternalSentMails({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        is_archived: true, // This is the key difference for archived mails
        ...(searchTerm && { search: searchTerm }),
        ...(filters.is_read !== undefined && { is_read: filters.is_read }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      })
      setMails(response.payload)
      setTotal(response.total || 0)
      setHasNextPage(response.payload.length === filters.limit)
    } catch (error) {
      console.error(translate("loadError"), error)
      setMails([])
      setTotal(0)
      setHasNextPage(false)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, filters, hasReadAccess, translate])

  useEffect(() => {
    loadMails()
  }, [loadMails])

  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term)
      setSearchInputValue(term)
      setIsAnyFilterApplied(
        term !== "" ||
          filters.order_direction !== "DESC" ||
          filters.order_by !== "created_at" ||
          filters.limit !== 10 ||
          filters.is_read !== undefined ||
          filters.start_date !== undefined ||
          filters.end_date !== undefined,
      )
      setCurrentPage(1)
    }, 300),
    [],
  )

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      setIsAnyFilterApplied(
        searchTerm !== "" ||
          newFilters.order_direction !== "DESC" ||
          newFilters.order_by !== "created_at" ||
          newFilters.limit !== 10 ||
          newFilters.is_read !== undefined ||
          newFilters.start_date !== undefined ||
          newFilters.end_date !== undefined,
      )
      return newFilters
    })
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setFilters({
      order_direction: "DESC",
      order_by: "created_at",
      limit: 10,
      lang: "ru",
      is_read: undefined,
      start_date: undefined,
      end_date: undefined,
    })
    setSearchTerm("")
    setSearchInputValue("")
    setIsAnyFilterApplied(false)
    setCurrentPage(1)
  }

  if (!hasReadAccess) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>{translate("accessDenied")}</CardTitle>
          <CardDescription>{translate("noPermission")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Mail className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">{translate("archivedSentMails")}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("manageSentMails")}</CardTitle>
          <CardDescription>{translate("manageSentMailsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <SentMailsTable
            mails={mails}
            total={total}
            currentPage={currentPage}
            pageSize={filters.limit}
            onPageChange={setCurrentPage}
            onSearch={handleSearch}
            onLanguageChange={(lang) => handleFilterChange("lang", lang)}
            onStatusFilter={(status) => handleFilterChange("status", status)}
            loading={isLoading}
            onRefresh={loadMails}
            filters={filters}
            setFilters={setFilters}
            isFiltersOpen={isFiltersOpen}
            setIsFiltersOpen={setIsFiltersOpen}
            isAnyFilterApplied={isAnyFilterApplied}
            clearAllFilters={clearAllFilters}
            handleFilterChange={handleFilterChange}
            searchInputValue={searchInputValue}
            setSearchInputValue={setSearchInputValue}
            hasNextPage={hasNextPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}

