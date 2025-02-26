"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Filter, ChevronDown, MoreHorizontal, Pencil } from "lucide-react"
import type { User, UsersTableProps } from "@/lib/types"
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
import { userTranslations } from "./user.translations"

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

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function UsersTable({
  users,
  total,
  currentPage,
  isLoading,
  searchTerm,
  status,
  isFiltersOpen,
  filters,
  isAnyFilterApplied,
  hasUpdatePermission,
  onSearch,
  onStatusFilter,
  onFilterChange,
  setIsFiltersOpen,
  clearAllFilters,
  handleEditUser,
  setCurrentPage,
  translate,
}: UsersTableProps) {
  const { language } = useLanguage()
  const [searchInputValue, setSearchInputValue] = useState(searchTerm)

  const handleSearch = useCallback(
    debounce((term: string) => {
      onSearch(term)
    }, 1000),
    [],
  )

  const columns = [
    { key: "user", header: translate("users.title", language) },
    { key: "email", header: "Email" },
    { key: "phone", header: translate("users.phone", language) },
    { key: "status", header: translate("users.status", language) },
    { key: "registrationDate", header: translate("common.creationDate", language) },
    { key: "actions", header: translate("common.actions", language) },
  ]

  const renderUserRow = (user: User) => {
    const formatDate = (timestamp?: string) => {
      if (!timestamp) return "N/A"
      return new Date(Number(timestamp)).toLocaleString(language, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    const formatPhone = (phone?: number) => {
      if (!phone) return "N/A"
      const phoneStr = phone.toString()
      return `+993 ${phoneStr.slice(0, 2)} ${phoneStr.slice(2, 5)} ${phoneStr.slice(5)}`
    }

    const getInitials = (firstName?: string, lastName?: string) => {
      return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase()
    }

    return (
      <TableRow key={user.id}>
        <TableCell className="font-medium">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src={`https://avatar.vercel.sh/${user.username ?? "user"}.png`}
                alt={user.username ?? "User"}
              />
              <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">
                {user.first_name ?? ""} {user.last_name ?? ""}
              </div>
              <div className="text-sm text-muted-foreground">@{user.username ?? "N/A"}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>{user.email ?? "N/A"}</TableCell>
        <TableCell>{formatPhone(user.phone)}</TableCell>
        <TableCell>
          <Badge variant={user.status === "active" ? "success" : "secondary"}>
            {translate(`users.${user.status ?? "inactive"}`, language)}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
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
            onValueChange={(value) => onFilterChange("limit", Number.parseInt(value))}
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
                  <Select value={filters.order_by} onValueChange={(value) => onFilterChange("order_by", value)}>
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
                    onValueChange={(value) => onFilterChange("order_direction", value)}
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
                  <Select value={filters.lang} onValueChange={(value) => onFilterChange("lang", value)}>
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
                  <Select value={status} onValueChange={onStatusFilter}>
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
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
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
            onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(total / filters.limit)))}
            disabled={currentPage === Math.ceil(total / filters.limit) || isLoading}
          >
            {translate("common.next", language)}
          </Button>
        </div>
      </div>
    </div>
  )
}

