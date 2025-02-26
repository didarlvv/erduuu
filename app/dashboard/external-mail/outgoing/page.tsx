"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { OutgoingExternalMailsTable } from "./outgoing-external-mails-table"
import { fetchExternalMails } from "@/lib/api"
import { usePermission } from "@/hooks/usePermission"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, Plus, Filter, X } from "lucide-react"
import type { ExternalMail } from "@/lib/types"
import { useLanguage } from "@/contexts/LanguageContext"
import { translate } from "../external-mail.translations"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export default function OutgoingExternalMailPage() {
  const router = useRouter()
  const hasReadAccess = usePermission("manager.users.external-mail.readall")
  const hasCreateAccess = usePermission("manager.users.external-mail.create")
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
    status: "all",
    start_date: undefined as number | undefined,
    end_date: undefined as number | undefined,
  })
  const [isAnyFilterApplied, setIsAnyFilterApplied] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState("")
  const [hasNextPage, setHasNextPage] = useState(true)
  const { language } = useLanguage()

  useEffect(() => {
    if (!hasReadAccess) {
      router.push("/dashboard")
    }
  }, [hasReadAccess, router])

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
        type: "outbox",
        is_archived: false,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.organization_id && {
          organization_id: filters.organization_id,
        }),
        ...(filters.responsibility_id && {
          responsibility_id: filters.responsibility_id,
        }),
        ...(filters.mail_type_id && { mail_type_id: filters.mail_type_id }),
        ...(["new", "replied", "progress", "answered"].includes(filters.status) && { status: filters.status }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      })
      setMails(response.payload.data || [])
      setTotal(response.payload.total || 0)
      setHasNextPage(response.payload.data.length === filters.limit)
    } catch (error) {
      console.error(translate("outgoingMails.loadError", language), error)
      setMails([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, filters, hasReadAccess, language])

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
          filters.status !== "all" ||
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
          newFilters.organization_id !== undefined ||
          newFilters.responsibility_id !== undefined ||
          newFilters.mail_type_id !== undefined ||
          newFilters.status !== "all" ||
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
      status: "all",
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
            <CardTitle>{translate("common.accessDenied", language)}</CardTitle>
            <CardDescription>{translate("common.noPermission", language)}</CardDescription>
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
          <h1 className="text-2xl font-semibold text-gray-800">{translate("outgoingMails.title", language)}</h1>
        </div>
        {hasCreateAccess && (
          <Button
            onClick={() => router.push("/dashboard/external-mail/outgoing/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> {translate("outgoingMails.createMail", language)}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("outgoingMails.manageMails", language)}</CardTitle>
          <CardDescription>{translate("outgoingMails.manageDescription", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-grow">
                <Input
                  placeholder={translate("outgoingMails.searchPlaceholder", language)}
                  value={searchInputValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {translate("common.filters", language)}
              </Button>
              {isAnyFilterApplied && (
                <Button variant="ghost" onClick={clearAllFilters} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {translate("common.clearFilters", language)}
                </Button>
              )}
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => handleFilterChange("limit", Number(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={translate("common.recordsPerPage", language)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 {translate("common.records", language)}</SelectItem>
                  <SelectItem value="10">10 {translate("common.records", language)}</SelectItem>
                  <SelectItem value="20">20 {translate("common.records", language)}</SelectItem>
                  <SelectItem value="50">50 {translate("common.records", language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isFiltersOpen && (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{translate("common.sortBy", language)}</label>
                      <Select value={filters.order_by} onValueChange={(value) => handleFilterChange("order_by", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={translate("common.selectField", language)} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">ID</SelectItem>
                          <SelectItem value="created_at">{translate("common.creationDate", language)}</SelectItem>
                          <SelectItem value="title">{translate("outgoingMails.subject", language)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">{translate("common.direction", language)}</label>
                      <Select
                        value={filters.order_direction}
                        onValueChange={(value) => handleFilterChange("order_direction", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={translate("common.selectDirection", language)} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ASC">{translate("common.ascending", language)}</SelectItem>
                          <SelectItem value="DESC">{translate("common.descending", language)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">{translate("outgoingMails.status", language)}</label>
                      <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={translate("common.selectStatus", language)} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <span className="flex items-center">{translate("common.all", language)}</span>
                          </SelectItem>
                          <SelectItem value="new">
                            <span className="flex items-center">{translate("outgoingMails.statusNew", language)}</span>
                          </SelectItem>
                          <SelectItem value="replied">
                            <span className="flex items-center">
                              {translate("outgoingMails.statusReplied", language)}
                            </span>
                          </SelectItem>
                          <SelectItem value="progress">
                            <span className="flex items-center">
                              {translate("outgoingMails.statusProgress", language)}
                            </span>
                          </SelectItem>
                          <SelectItem value="answered">
                            <span className="flex items-center">
                              {translate("outgoingMails.statusAnswered", language)}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 col-span-full">
                      <label className="text-sm font-medium">{translate("outgoingMails.dateRange", language)}</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">
                            {translate("outgoingMails.startDate", language)}
                          </label>
                          <Input
                            type="date"
                            value={filters.start_date ? new Date(filters.start_date).toISOString().split("T")[0] : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value).valueOf() : undefined
                              handleFilterChange("start_date", date)
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground">
                            {translate("outgoingMails.endDate", language)}
                          </label>
                          <Input
                            type="date"
                            value={filters.end_date ? new Date(filters.end_date).toISOString().split("T")[0] : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value).valueOf() : undefined
                              handleFilterChange("end_date", date)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <OutgoingExternalMailsTable
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

