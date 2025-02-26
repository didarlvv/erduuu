"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FilesTable } from "./files-table"
import { fetchFiles } from "@/lib/api"
import { usePermission } from "@/hooks/usePermission"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { FileText, Search, Filter, ChevronDown } from "lucide-react"
import type { File } from "@/lib/types"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations } from "./files.translations"

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

const translate = (key: string, language: string): string => {
  const keys = key.split(".")
  let translation: any = translations[language as keyof typeof translations]
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key
    }
    translation = translation[k]
  }
  return translation
}

export default function FilesPage() {
  const router = useRouter()
  const hasReadAccess = usePermission("manager.users.files.readall")
  const hasUploadAccess = usePermission("manager.users.files.create")
  const [files, setFiles] = useState<File[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    order_direction: "DESC",
    order_by: "id",
    limit: 10,
    lang: "",
  })
  const [isAnyFilterApplied, setIsAnyFilterApplied] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState("")
  const { language } = useLanguage()

  useEffect(() => {
    if (!hasReadAccess) {
      router.push("/dashboard")
    }
  }, [hasReadAccess, router])

  const loadFiles = useCallback(async () => {
    if (!hasReadAccess) return

    try {
      setIsLoading(true)
      const response = await fetchFiles({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.lang && { lang: filters.lang }),
      })
      setFiles(response.payload.data)
      setTotal(response.payload.total)
    } catch (error) {
      console.error(translate("files.loadError", language), error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, filters, hasReadAccess, language])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term)
      setSearchInputValue(term)
      setIsAnyFilterApplied(
        term !== "" ||
          filters.order_direction !== "DESC" ||
          filters.order_by !== "id" ||
          filters.limit !== 10 ||
          filters.lang !== "",
      )
      setCurrentPage(1)
    }, 1000),
    [],
  )

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      setIsAnyFilterApplied(
        searchTerm !== "" ||
          newFilters.order_direction !== "DESC" ||
          newFilters.order_by !== "id" ||
          newFilters.limit !== 10 ||
          newFilters.lang !== "",
      )
      return newFilters
    })
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setFilters({
      order_direction: "DESC",
      order_by: "id",
      limit: 10,
      lang: "",
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
          <FileText className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">{translate("files.title", language)}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("files.manageFiles", language)}</CardTitle>
          <CardDescription>{translate("files.manageDescription", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={translate("files.searchPlaceholder", language)}
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
                            <SelectItem value="created_at">{translate("files.creationDate", language)}</SelectItem>
                            <SelectItem value="original_name">{translate("files.originalName", language)}</SelectItem>
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
                            <SelectItem value="all">{translate("common.all", language)}</SelectItem>
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

            <FilesTable
              files={files}
              total={total}
              currentPage={currentPage}
              pageSize={filters.limit}
              onPageChange={setCurrentPage}
              onSearch={handleSearch}
              loading={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

