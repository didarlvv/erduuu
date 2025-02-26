"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CreateMailTypeDrawer } from "./create-mail-type-drawer"
import { EditMailTypeDrawer } from "./edit-mail-type-drawer"
import { usePermission } from "@/hooks/usePermission"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Mail, Search, Filter, ChevronDown, Plus, MoreHorizontal, Pencil } from "lucide-react"
import type { MailType } from "@/lib/types"
import { useLanguage } from "@/contexts/LanguageContext"
import { TableWrapper } from "@/components/TableWrapper"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCell, TableRow } from "@/components/ui/table"
import { fetchMailTypes } from "@/lib/api"
import { mailTypeTranslations } from "./mail-types.translations"
import { toast } from "@/components/ui/use-toast"

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

const translate = (key: string, language: string): string => {
  const keys = key.split(".")
  let translation: any = mailTypeTranslations[language as keyof typeof mailTypeTranslations]
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key
    }
    translation = translation[k]
  }
  return translation
}

export default function MailTypesPage() {
  const router = useRouter()
  const hasReadAccess = usePermission("manager.users.mail-types.readall")
  const hasCreateAccess = usePermission("manager.users.mail-types.create")
  const hasUpdatePermission = usePermission("manager.users.mail-types.update")
  const [mailTypes, setMailTypes] = useState<MailType[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedMailType, setSelectedMailType] = useState<MailType | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    order_direction: "DESC",
    order_by: "id",
    lang: "ru",
    limit: 10,
  })
  const [isAnyFilterApplied, setIsAnyFilterApplied] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState("")
  const { language } = useLanguage()

  useEffect(() => {
    if (!hasReadAccess) {
      router.push("/dashboard")
    }
  }, [hasReadAccess, router])

  const handleSearch = debounce((term: string) => {
    setSearchTerm(term)
    setSearchInputValue(term)
    updateFilters({ search: term })
    setCurrentPage(1)
  }, 300)

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => {
      const updatedFilters = { ...prev, ...newFilters }
      setIsAnyFilterApplied(
        searchTerm !== "" ||
          updatedFilters.order_direction !== "DESC" ||
          updatedFilters.order_by !== "id" ||
          updatedFilters.lang !== "ru" ||
          updatedFilters.limit !== 10,
      )
      return updatedFilters
    })
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string | number) => {
    updateFilters({ [key]: value })
  }

  const loadMailTypes = useCallback(async () => {
    if (!hasReadAccess) return

    try {
      setIsLoading(true)
      const response = await fetchMailTypes({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        ...(searchTerm && { search: searchTerm }),
      })
      setMailTypes(response.payload ?? [])
      setTotal(response.total ?? 0)
    } catch (error) {
      console.error("Error loading mail types:", error)
      toast({
        title: translate("errors.loadError", language),
        description: translate("errors.loadErrorDescription", language),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, filters, hasReadAccess, language])

  useEffect(() => {
    loadMailTypes()
  }, [loadMailTypes])

  const clearAllFilters = () => {
    setFilters({
      order_direction: "DESC",
      order_by: "id",
      lang: "ru",
      limit: 10,
    })
    setSearchTerm("")
    setSearchInputValue("")
    setIsAnyFilterApplied(false)
    setCurrentPage(1)
  }

  const handleEditMailType = (mailType: MailType) => {
    setSelectedMailType(mailType)
    setIsEditDrawerOpen(true)
  }

  const columns = [
    { key: "name", header: translate("mailTypes.name", language) },
    { key: "identifier", header: translate("mailTypes.identifier", language) },
    { key: "id", header: "ID" },
    { key: "main", header: translate("mailTypes.main", language) },
    { key: "actions", header: translate("common.actions", language) },
  ]

  const renderMailTypeRow = (mailType: MailType) => {
    const getLocalizedName = (names: { name: string; lang: string }[], lang: string) => {
      return names.find((n) => n.lang === lang)?.name ?? ""
    }

    return (
      <TableRow key={mailType.id}>
        <TableCell>
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <div className="font-semibold">{getLocalizedName(mailType.names ?? [], "ru")}</div>
              <div className="text-sm text-muted-foreground">{getLocalizedName(mailType.names ?? [], "tk")}</div>
              <div className="text-sm text-muted-foreground">{getLocalizedName(mailType.names ?? [], "en")}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="font-mono text-sm">{mailType.slug}</TableCell>
        <TableCell>{mailType.id}</TableCell>
        <TableCell>
          <Badge variant={mailType.is_main ? "success" : "secondary"}>
            {mailType.is_main ? translate("mailTypes.yes", language) : translate("mailTypes.no", language)}
          </Badge>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{translate("common.openMenu", language)}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{translate("common.actions", language)}</DropdownMenuLabel>
              {hasUpdatePermission && (
                <DropdownMenuItem onClick={() => handleEditMailType(mailType)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>{translate("common.edit", language)}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
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
          <h1 className="text-2xl font-semibold text-gray-800">{translate("mailTypes.title", language)}</h1>
        </div>
        {hasCreateAccess && (
          <Button onClick={() => setIsCreateDrawerOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> {translate("mailTypes.createMailType", language)}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("mailTypes.manageMailTypes", language)}</CardTitle>
          <CardDescription>{translate("mailTypes.manageDescription", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={translate("mailTypes.searchPlaceholder", language)}
                    className="pl-8 w-[300px]"
                    value={searchInputValue}
                    onChange={(e) => {
                      setSearchInputValue(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch(e.target.value)
                      }
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {translate("common.filters", language)}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? "rotate-180" : ""}`} />
                </Button>
                {isAnyFilterApplied && (
                  <Button variant="ghost" onClick={clearAllFilters} className="flex items-center gap-2">
                    {translate("common.clearFilters", language)}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={filters.limit.toString()}
                  onValueChange={(value) => handleFilterChange("limit", Number.parseInt(value))}
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
            </div>

            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleContent>
                <Card className="mt-4">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{translate("common.sortBy", language)}</label>
                        <Select
                          value={filters.order_by}
                          onValueChange={(value) => handleFilterChange("order_by", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={translate("common.selectField", language)} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id">ID</SelectItem>
                            <SelectItem value="created_at">{translate("common.creationDate", language)}</SelectItem>
                            <SelectItem value="slug">{translate("mailTypes.identifier", language)}</SelectItem>
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
                        <label className="text-sm font-medium">{translate("common.language", language)}</label>
                        <Select value={filters.lang} onValueChange={(value) => handleFilterChange("lang", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={translate("common.selectLanguage", language)} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tk">{translate("languageSelector.turkmen", language)}</SelectItem>
                            <SelectItem value="ru">{translate("languageSelector.russian", language)}</SelectItem>
                            <SelectItem value="en">{translate("languageSelector.english", language)}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            <TableWrapper
              data={mailTypes}
              columns={columns}
              loading={isLoading}
              renderRow={renderMailTypeRow}
              translations={{
                loading: translate("common.loading", language),
                noDataFound: translate("mailTypes.noMailTypesFound", language),
              }}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {translate("common.showing", language)} {(currentPage - 1) * filters.limit + 1}{" "}
                {translate("common.to", language)} {Math.min(currentPage * filters.limit, total)}{" "}
                {translate("common.of", language)} {total} {translate("common.results", language)}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  {translate("common.previous", language)}
                </Button>
                <div className="text-sm">
                  {translate("common.page", language)} {currentPage} {translate("common.of", language)}{" "}
                  {Math.ceil(total / filters.limit)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(total / filters.limit)))}
                  disabled={currentPage === Math.ceil(total / filters.limit) || isLoading}
                >
                  {translate("common.next", language)}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateMailTypeDrawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen} onSuccess={loadMailTypes} />
      <EditMailTypeDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        onSuccess={loadMailTypes}
        mailType={selectedMailType}
      />
    </div>
  )
}

