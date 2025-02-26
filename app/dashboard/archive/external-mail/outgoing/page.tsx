"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { OutgoingExternalMailsTable } from "@/app/dashboard/external-mail/outgoing/outgoing-external-mails-table"
import { usePermission } from "@/hooks/usePermission"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Mail, Search, Filter, ChevronDown } from "lucide-react"
import { SearchableOrganizationSelect } from "@/components/SearchableOrganizationSelect"
import { SearchableResponsibilitySelect } from "@/components/SearchableResponsibilitySelect"
import { SearchableMailTypeSelect } from "@/components/SearchableMailTypeSelect"
import { useLanguage } from "@/contexts/LanguageContext"
import { fetchExternalMails } from "@/lib/api"
import type { ExternalMail } from "@/lib/types"

const translations = {
  ru: {
    archivedOutgoingExternalMails: "Архивированные исходящие внешние письма",
    manageArchivedOutgoing: "Управление архивированными исходящими письмами",
    manageArchivedOutgoingDescription:
      "Просматривайте, фильтруйте и управляйте архивированными исходящими внешними письмами.",
    accessDenied: "Доступ запрещен",
    noPermission: "У вас нет необходимых прав для просмотра этой страницы.",
    search: "Поиск...",
    filters: "Фильтры",
    clearFilters: "Очистить фильтры",
    recordsPerPage: "Записей на странице",
    records: "записей",
    sortBy: "Сортировать по",
    selectField: "Выберите поле",
    creationDate: "Дата создания",
    title: "Заголовок",
    code: "Код",
    direction: "Направление",
    selectDirection: "Выберите направление",
    ascending: "По возрастанию",
    descending: "По убыванию",
    status: "Статус",
    selectStatus: "Выберите статус",
    all: "Все",
    new: "Новый",
    sent: "Отправлено",
    delivered: "Доставлено",
    organization: "Организация",
    responsibility: "Должность",
    mailType: "Тип письма",
    loadError: "Ошибка загрузки писем:",
  },
  tk: {
    archivedOutgoingExternalMails: "Arhiwlenen gidýän daşarky hatlar",
    manageArchivedOutgoing: "Arhiwlenen gidýän hatlary dolandyrmak",
    manageArchivedOutgoingDescription: "Arhiwlenen gidýän daşarky hatlary görüň, süzüň we dolandyryň.",
    accessDenied: "Giriş gadagan",
    noPermission: "Bu sahypany görmäge ygtyýaryňyz ýok.",
    search: "Gözleg...",
    filters: "Filtrler",
    clearFilters: "Filtrleri arassalamak",
    recordsPerPage: "Sahypa başyna ýazgylar",
    records: "ýazgy",
    sortBy: "Tertiplemek",
    selectField: "Meýdany saýlaň",
    creationDate: "Döredilen senesi",
    title: "Sözbaşy",
    code: "Kod",
    direction: "Ugur",
    selectDirection: "Ugry saýlaň",
    ascending: "Ösýän tertipde",
    descending: "Kemelýän tertipde",
    status: "Ýagdaý",
    selectStatus: "Ýagdaýy saýlaň",
    all: "Hemmesi",
    new: "Täze",
    sent: "Iberildi",
    delivered: "Gowşuryldy",
    organization: "Gurama",
    responsibility: "Wezipe",
    mailType: "Hat görnüşi",
    loadError: "Hatlary ýüklemekde ýalňyşlyk:",
  },
  en: {
    archivedOutgoingExternalMails: "Archived Outgoing External Mails",
    manageArchivedOutgoing: "Manage Archived Outgoing Mails",
    manageArchivedOutgoingDescription: "View, filter, and manage archived outgoing external mails.",
    accessDenied: "Access Denied",
    noPermission: "You don't have the necessary permissions to view this page.",
    search: "Search...",
    filters: "Filters",
    clearFilters: "Clear filters",
    recordsPerPage: "Records per page",
    records: "records",
    sortBy: "Sort by",
    selectField: "Select field",
    creationDate: "Creation date",
    title: "Title",
    code: "Code",
    direction: "Direction",
    selectDirection: "Select direction",
    ascending: "Ascending",
    descending: "Descending",
    status: "Status",
    selectStatus: "Select status",
    all: "All",
    new: "New",
    sent: "Sent",
    delivered: "Delivered",
    organization: "Organization",
    responsibility: "Responsibility",
    mailType: "Mail type",
    loadError: "Error loading mails:",
  },
}

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export default function ArchivedOutgoingExternalMailPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const translate = useCallback(
    (key: string) => {
      return translations[language][key] || key
    },
    [language],
  )

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
    lang: language,
    organization_id: undefined as number | undefined,
    responsibility_id: undefined as number | undefined,
    mail_type_id: undefined as number | undefined,
    status: "",
    start_date: undefined as number | undefined,
    end_date: undefined as number | undefined,
  })
  const [isAnyFilterApplied, setIsAnyFilterApplied] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState("")

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
        skip: (currentPage - 1) * filters.limit,
        take: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        type: "outbox",
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
      setMails(response.data || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error(translate("loadError"), error)
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
    [filters],
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
      lang: language,
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
            <CardTitle>{translate("accessDenied")}</CardTitle>
            <CardDescription>{translate("noPermission")}</CardDescription>
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
          <h1 className="text-2xl font-semibold text-gray-800">{translate("archivedOutgoingExternalMails")}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("manageArchivedOutgoing")}</CardTitle>
          <CardDescription>{translate("manageArchivedOutgoingDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={translate("search")}
                    className="pl-8 w-[300px]"
                    value={searchInputValue}
                    onChange={(e) => {
                      setSearchInputValue(e.target.value)
                      handleSearch(e.target.value)
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {translate("filters")}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? "rotate-180" : ""}`} />
                </Button>
                {isAnyFilterApplied && (
                  <Button variant="ghost" onClick={clearAllFilters} className="flex items-center gap-2">
                    {translate("clearFilters")}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={filters.limit.toString()}
                  onValueChange={(value) => handleFilterChange("limit", Number(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={translate("recordsPerPage")} />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((value) => (
                      <SelectItem key={value} value={value.toString()}>
                        {value} {translate("records")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleContent>
                <Card className="mt-4">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{translate("sortBy")}</label>
                        <Select
                          value={filters.order_by}
                          onValueChange={(value) => handleFilterChange("order_by", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={translate("selectField")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="created_at">{translate("creationDate")}</SelectItem>
                            <SelectItem value="title">{translate("title")}</SelectItem>
                            <SelectItem value="code">{translate("code")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">{translate("direction")}</label>
                        <Select
                          value={filters.order_direction}
                          onValueChange={(value) => handleFilterChange("order_direction", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={translate("selectDirection")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ASC">{translate("ascending")}</SelectItem>
                            <SelectItem value="DESC">{translate("descending")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">{translate("status")}</label>
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={translate("selectStatus")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{translate("all")}</SelectItem>
                            <SelectItem value="new">{translate("new")}</SelectItem>
                            <SelectItem value="sent">{translate("sent")}</SelectItem>
                            <SelectItem value="delivered">{translate("delivered")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">{translate("organization")}</label>
                        <SearchableOrganizationSelect
                          onSelect={(id) => handleFilterChange("organization_id", id)}
                          language={language}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">{translate("responsibility")}</label>
                        <SearchableResponsibilitySelect
                          onSelect={(id) => handleFilterChange("responsibility_id", id)}
                          language={language}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">{translate("mailType")}</label>
                        <SearchableMailTypeSelect
                          onSelect={(id) => handleFilterChange("mail_type_id", id)}
                          language={language}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

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
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

