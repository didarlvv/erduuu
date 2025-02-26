"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CreatePermissionDrawer } from "./create-permission-drawer"
import { EditPermissionDrawer } from "./edit-permission-drawer"
import { usePermission } from "@/hooks/usePermission"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Shield, Search, Filter, ChevronDown, Plus, MoreHorizontal, Pencil } from "lucide-react"
import type { Permission, PermissionsQueryParams } from "@/lib/types"
import { useLanguage } from "@/contexts/LanguageContext"
import { TableWrapper } from "@/components/TableWrapper"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCell, TableRow } from "@/components/ui/table"
import { fetchPermissions } from "@/lib/api"
import { permissionTranslations } from "./permissions.translations"

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Replace the existing translate function with this:
const translate = (key: string, language: string): string => {
  const keys = key.split(".")
  let translation: any = permissionTranslations[language as keyof typeof permissionTranslations]
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key
    }
    translation = translation[k]
  }
  return translation
}

export default function PermissionsPage() {
  const router = useRouter()
  const hasReadAccess = usePermission("manager.users.permissions.readall")
  const hasCreateAccess = usePermission("manager.users.permissions.create")
  const hasUpdatePermission = usePermission("manager.users.permissions.update")
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<PermissionsQueryParams>({
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

  const loadPermissions = useCallback(async () => {
    if (!hasReadAccess) return

    try {
      setIsLoading(true)
      const response = await fetchPermissions({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        ...(searchTerm && { search: searchTerm }),
      })
      setPermissions(response.payload.data)
      setTotal(response.payload.total)
    } catch (error) {
      console.error(translate("permissions.loadError", language), error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, filters, hasReadAccess, language])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

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

  const handleEditPermission = (permission: Permission) => {
    setSelectedPermission(permission)
    setIsEditDrawerOpen(true)
  }

  const columns = [
    { key: "name", header: translate("permissions.name", language) },
    { key: "slug", header: translate("permissions.slug", language) },
    { key: "id", header: translate("permissions.id", language) },
    { key: "actions", header: translate("permissions.actions", language) },
  ]

  const renderPermissionRow = (permission: Permission) => (
    <TableRow key={permission.id}>
      <TableCell>
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-blue-500" />
          <div>
            <div className="font-semibold">{permission.name}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{permission.slug}</TableCell>
      <TableCell>{permission.id}</TableCell>
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
              <DropdownMenuItem onClick={() => handleEditPermission(permission)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>{translate("common.edit", language)}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )

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
          <Shield className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">{translate("permissions.title", language)}</h1>
        </div>
        {hasCreateAccess && (
          <Button onClick={() => setIsCreateDrawerOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> {translate("permissions.createPermission", language)}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("permissions.managePermissions", language)}</CardTitle>
          <CardDescription>{translate("permissions.manageDescription", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={translate("permissions.searchPlaceholder", language)}
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
                            <SelectItem value="name">{translate("permissions.name", language)}</SelectItem>
                            <SelectItem value="slug">{translate("permissions.slug", language)}</SelectItem>
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
              data={permissions}
              columns={columns}
              loading={isLoading}
              renderRow={renderPermissionRow}
              translations={{
                loading: translate("common.loading", language),
                noDataFound: translate("permissions.noPermissionsFound", language),
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

      <CreatePermissionDrawer
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
        onSuccess={loadPermissions}
      />
      <EditPermissionDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        onSuccess={loadPermissions}
        permission={selectedPermission}
      />
    </div>
  )
}

