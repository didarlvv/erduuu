"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CreateUserDrawer } from "./create-user-drawer"
import { EditUserDrawer } from "./edit-user-drawer"
import { usePermission } from "@/hooks/usePermission"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { UserPlus, UsersIcon, Search, Filter, ChevronDown, MoreHorizontal, Pencil } from "lucide-react"
import type { User, UserFilters } from "@/lib/types"
import { useLanguage } from "@/contexts/LanguageContext"
import { TableWrapper } from "@/components/TableWrapper"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCell, TableRow } from "@/components/ui/table"
import { fetchUsers } from "@/lib/api"
import { userTranslations } from "./user.translations"

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Replace the existing translations constant with:
const translations = userTranslations

// Replace the translate function with:
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

export default function UsersPage() {
  const router = useRouter()
  const hasReadAccess = usePermission("manager.users.users.readall")
  const hasCreateAccess = usePermission("manager.users.users.create")
  const hasUpdatePermission = usePermission("manager.users.users.update")
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [status, setStatus] = useState("all")
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<UserFilters>({
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

  const loadUsers = useCallback(async () => {
    if (!hasReadAccess) return

    try {
      setIsLoading(true)
      const response = await fetchUsers({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        ...(searchTerm && { search: searchTerm }),
        ...(status !== "all" && { status }),
      })
      setUsers(response.payload?.data ?? [])
      setTotal(response.payload?.total ?? 0)
    } catch (error) {
      console.error(translate("users.loadError", language), error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, status, filters, hasReadAccess, language])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

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

  const handleStatusFilter = (selectedStatus: string) => {
    setStatus(selectedStatus)
    setIsAnyFilterApplied(selectedStatus !== "all" || searchTerm !== "")
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string | number | string[]) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      setIsAnyFilterApplied(
        newFilters.order_direction !== "DESC" ||
          newFilters.order_by !== "id" ||
          newFilters.lang !== "ru" ||
          newFilters.limit !== 10 ||
          status !== "all" ||
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
    setStatus("all")
    setSearchTerm("")
    setSearchInputValue("")
    setIsAnyFilterApplied(false)
    setCurrentPage(1)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditDrawerOpen(true)
  }

  const columns = [
    { key: "user", header: translate("users.title", language) },
    { key: "email", header: "Email" },
    { key: "phone", header: translate("users.phone", language) },
    { key: "status", header: translate("users.status", language) },
    { key: "registrationDate", header: translate("common.creationDate", language) },
    { key: "actions", header: translate("common.actions", language) },
  ]

  const renderUserRow = (user: User) => {
    const formatDate = (timestamp: string) => {
      return new Date(Number.parseInt(timestamp)).toLocaleString(language, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    const formatPhone = (phone: number) => {
      const phoneStr = phone.toString()
      return `+993 ${phoneStr.slice(0, 2)} ${phoneStr.slice(2, 5)} ${phoneStr.slice(5)}`
    }

    const getInitials = (firstName: string, lastName: string) => {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    return (
      <TableRow key={user.id}>
        <TableCell className="font-medium">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${user.username}.png`} alt={user.username} />
              <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">
                {user.first_name} {user.last_name}
              </div>
              <div className="text-sm text-muted-foreground">@{user.username}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{formatPhone(user.phone)}</TableCell>
        <TableCell>
          <Badge variant={user.status === "active" ? "success" : "secondary"}>
            {translate(`users.${user.status}`, language)}
          </Badge>
        </TableCell>
        <TableCell>{formatDate(user.created_at)}</TableCell>
        <TableCell className="text-right">
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
                <DropdownMenuItem onClick={() => handleEditUser(user)}>
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
          <UsersIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">{translate("users.title", language)}</h1>
        </div>
        {hasCreateAccess && (
          <Button onClick={() => setIsCreateDrawerOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="mr-2 h-4 w-4" /> {translate("users.createUser", language)}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("users.manageUsers", language)}</CardTitle>
          <CardDescription>{translate("users.manageDescription", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={translate("users.searchPlaceholder", language)}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <SelectItem value="email">Email</SelectItem>
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

                      <div className="space-y-2">
                        <label className="text-sm font-medium">{translate("users.status", language)}</label>
                        <Select value={status} onValueChange={handleStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder={translate("users.selectStatus", language)} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{translate("common.all", language)}</SelectItem>
                            <SelectItem value="active">{translate("users.active", language)}</SelectItem>
                            <SelectItem value="inactive">{translate("users.inactive", language)}</SelectItem>
                            <SelectItem value="blocked">{translate("users.blocked", language)}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            <TableWrapper
              data={users}
              columns={columns}
              loading={isLoading}
              renderRow={renderUserRow}
              translations={{
                loading: translate("common.loading", language),
                noDataFound: translate("users.noUsersFound", language),
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

      <CreateUserDrawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen} onSuccess={loadUsers} />
      <EditUserDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        onSuccess={loadUsers}
        user={selectedUser}
      />
    </div>
  )
}

