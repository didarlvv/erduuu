"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { IncomingExternalMailsTable } from "@/app/dashboard/external-mail/incoming/incoming-external-mails-table"
import { usePermission } from "@/hooks/usePermission"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { archiveTranslations } from "../../archive.translations"
import { fetchExternalMails } from "@/lib/api"
import type { ExternalMail } from "@/lib/types"

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export default function ArchivedIncomingExternalMailPage() {
  const router = useRouter()
  const hasReadAccess = usePermission("manager.users.external-mail.readall")
  const [mails, setMails] = useState<ExternalMail[]>([])
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
    organization_id: undefined as number | undefined,
    responsibility_id: undefined as number | undefined,
    mail_type_id: undefined as number | undefined,
    status: "",
    start_date: undefined as number | undefined,
    end_date: undefined as number | undefined,
  })
  const [isAnyFilterApplied, setIsAnyFilterApplied] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState("")
  const [hasNextPage, setHasNextPage] = useState(true)
  const { language } = useLanguage()

  const translate = useCallback(
    (key: string) => {
      const keys = key.split(".")
      return keys.reduce(
        (obj, k) => obj[k as keyof typeof obj],
        archiveTranslations[language as keyof typeof archiveTranslations],
      ) as string
    },
    [language],
  )

  const loadMails = useCallback(async () => {
    if (!hasReadAccess) return

    try {
      setIsLoading(true)
      const response = await fetchExternalMails({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        type: "inbox",
        is_archived: true,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.organization_id && {
          organization_id: filters.organization_id,
        }),
        ...(filters.responsibility_id && {
          responsibility_id: filters.responsibility_id,
        }),
        ...(filters.mail_type_id && { mail_type_id: filters.mail_type_id }),
        ...(filters.status && { status: filters.status }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      })
      setMails(response.payload.data || [])
      setTotal(response.payload.total || 0)
      setHasNextPage(response.payload.data.length === filters.limit)
    } catch (error) {
      console.error(translate("common.loadError"), error)
      setMails([])
      setTotal(0)
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
          filters.organization_id !== undefined ||
          filters.responsibility_id !== undefined ||
          filters.mail_type_id !== undefined ||
          filters.status !== "" ||
          filters.start_date !== undefined ||
          filters.end_date !== undefined,
      )
      setCurrentPage(1)
    }, 1000),
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
          newFilters.organization_id !== undefined ||
          newFilters.responsibility_id !== undefined ||
          newFilters.mail_type_id !== undefined ||
          newFilters.status !== "" ||
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
      organization_id: undefined,
      responsibility_id: undefined,
      mail_type_id: undefined,
      status: "",
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
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{translate("common.accessDenied")}</CardTitle>
            <CardDescription>{translate("common.noPermission")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Mail className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">{translate("externalMail.incoming.title")}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("externalMail.incoming.manageTitle")}</CardTitle>
          <CardDescription>{translate("externalMail.incoming.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <IncomingExternalMailsTable
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

