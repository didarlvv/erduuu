"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CreateResponsibilityDrawer } from "./create-responsibility-drawer"
import { EditResponsibilityDrawer } from "./edit-responsibility-drawer"
import { ResponsibilitiesTable } from "./responsibilities-table"
import { usePermission } from "@/hooks/usePermission"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Briefcase, Search, Filter, ChevronDown } from "lucide-react"
import type { Responsibility, ResponsibilityFilters } from "./responsibility.types"
import { useLanguage } from "@/contexts/LanguageContext"
import { fetchResponsibilities } from "@/lib/api"
import { responsibilityTranslations } from "./responsibility.translations"

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

const translate = (key: string, language: string): string => {
  const keys = key.split(".")
  let translation: any = responsibilityTranslations[language as keyof typeof responsibilityTranslations]
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key
    }
    translation = translation[k]
  }
  return translation
}

export default function ResponsibilitiesPage() {
  const router = useRouter()
  const hasReadAccess = usePermission("manager.users.responsibilities.readall")
  const hasCreateAccess = usePermission("manager.users.responsibilities.create")
  const hasUpdatePermission = usePermission("manager.users.responsibilities.update")
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedResponsibility, setSelectedResponsibility] = useState<Responsibility | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<ResponsibilityFilters>({
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

  const loadResponsibilities = useCallback(async () => {
    if (!hasReadAccess) return

    try {
      setIsLoading(true)
      const response = await fetchResponsibilities({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        ...(searchTerm && { search: searchTerm }),
      })
      setResponsibilities(response.payload.data)
      setTotal(response.payload.total)
    } catch (error) {
      console.error(translate("responsibilities.loadError", language), error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, filters, hasReadAccess, language])

  useEffect(() => {
    loadResponsibilities()
  }, [loadResponsibilities])

  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term)
      setSearchInputValue(term)
      setIsAnyFilterApplied(
        term !== "" ||
          filters.order_direction !== "DESC" ||
          filters.order_by !== "id" ||
          filters.limit !== 10 ||
          filters.lang !== "ru",
      )
      setCurrentPage(1)
    }, 300),
    [],
  )

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      setIsAnyFilterApplied(
        searchTerm !== "" ||
          newFilters.order_direction !== "DESC" ||
          newFilters.order_by !== "id" ||
          newFilters.lang !== "ru" ||
          newFilters.limit !== 10,
      )
      return newFilters
    })
    setCurrentPage(1)
  }

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

  const handleEditResponsibility = (responsibility: Responsibility) => {
    setSelectedResponsibility(responsibility)
    setIsEditDrawerOpen(true)
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
          <Briefcase className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">{translate("responsibilities.title", language)}</h1>
        </div>
        {hasCreateAccess && (
          <Button onClick={() => setIsCreateDrawerOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Briefcase className="mr-2 h-4 w-4" /> {translate("responsibilities.createResponsibility", language)}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("responsibilities.manageResponsibilities", language)}</CardTitle>
          <CardDescription>{translate("responsibilities.manageDescription", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={translate("responsibilities.searchPlaceholder", language)}
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

            <ResponsibilitiesTable
              responsibilities={responsibilities}
              total={total}
              currentPage={currentPage}
              isLoading={isLoading}
              searchTerm={searchTerm}
              isFiltersOpen={isFiltersOpen}
              filters={filters}
              isAnyFilterApplied={isAnyFilterApplied}
              hasUpdatePermission={hasUpdatePermission}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              setIsFiltersOpen={setIsFiltersOpen}
              clearAllFilters={clearAllFilters}
              handleEditResponsibility={handleEditResponsibility}
              setCurrentPage={setCurrentPage}
              translate={translate}
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

      <CreateResponsibilityDrawer
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
        onSuccess={loadResponsibilities}
      />
      <EditResponsibilityDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        onSuccess={loadResponsibilities}
        responsibility={selectedResponsibility}
      />
    </div>
  )
}

