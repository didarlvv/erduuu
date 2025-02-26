"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CreateRoleDrawer } from "./create-role-drawer"
import { EditRoleDrawer } from "./edit-role-drawer"
import { usePermission } from "@/hooks/usePermission"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldCheck, UserPlus } from "lucide-react"
import type { Role, RoleFilters } from "@/lib/types"
import { useLanguage } from "@/contexts/LanguageContext"
import { fetchRoles } from "@/lib/api"
import { RolesTable } from "./roles-table"
import { translate } from "./role.translations"

export default function RolesPage() {
  const router = useRouter()
  const hasReadAccess = usePermission("manager.users.roles.readall")
  const hasCreateAccess = usePermission("manager.users.roles.create")
  const hasUpdatePermission = usePermission("manager.users.roles.update")
  const [roles, setRoles] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<RoleFilters>({
    order_direction: "DESC",
    order_by: "id",
    lang: "ru",
    limit: 10,
  })
  const [isAnyFilterApplied, setIsAnyFilterApplied] = useState(false)
  const { language } = useLanguage()

  useEffect(() => {
    if (!hasReadAccess) {
      router.push("/dashboard")
    }
  }, [hasReadAccess, router])

  const loadRoles = useCallback(async () => {
    if (!hasReadAccess) return

    try {
      setIsLoading(true)
      const response = await fetchRoles({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        ...(searchTerm && { search: searchTerm }),
      })
      setRoles(response.payload ?? [])
      setTotal(response.total ?? 0)
    } catch (error) {
      console.error(translate("roles.loadError", language), error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, filters, hasReadAccess, language])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term)
      setIsAnyFilterApplied(
        term !== "" ||
          filters.order_direction !== "DESC" ||
          filters.order_by !== "id" ||
          filters.limit !== 10 ||
          filters.lang !== "ru",
      )
      setCurrentPage(1)
    },
    [filters],
  )

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      setIsAnyFilterApplied(
        newFilters.order_direction !== "DESC" ||
          newFilters.order_by !== "id" ||
          newFilters.lang !== "ru" ||
          newFilters.limit !== 10 ||
          searchTerm !== "",
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
    setIsAnyFilterApplied(false)
    setCurrentPage(1)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
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
          <ShieldCheck className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">{translate("roles.title", language)}</h1>
        </div>
        {hasCreateAccess && (
          <Button onClick={() => setIsCreateDrawerOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="mr-2 h-4 w-4" /> {translate("roles.createRole", language)}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("roles.manageRoles", language)}</CardTitle>
          <CardDescription>{translate("roles.manageDescription", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <RolesTable
            roles={roles}
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
            handleEditRole={handleEditRole}
            setCurrentPage={setCurrentPage}
            translate={(key) => translate(key, language)}
          />
        </CardContent>
      </Card>

      <CreateRoleDrawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen} onSuccess={loadRoles} />

      <EditRoleDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        onSuccess={loadRoles}
        role={selectedRole}
      />
    </div>
  )
}

