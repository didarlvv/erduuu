"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Briefcase, MoreHorizontal, Pencil } from "lucide-react"
import type { Responsibility, ResponsibilitiesTableProps } from "@/lib/types"

export function ResponsibilitiesTable({
  responsibilities,
  total,
  currentPage,
  isLoading,
  searchTerm,
  isFiltersOpen,
  filters,
  isAnyFilterApplied,
  hasUpdatePermission,
  onSearch,
  onFilterChange,
  setIsFiltersOpen,
  clearAllFilters,
  handleEditResponsibility,
  setCurrentPage,
  translate,
}: ResponsibilitiesTableProps) {
  const getLocalizedName = (names: { name: string; lang: string }[], lang: string) => {
    return names.find((n) => n.lang === lang)?.name || ""
  }

  const renderResponsibilityRow = (responsibility: Responsibility) => {
    return (
      <TableRow key={responsibility.id}>
        <TableCell className="font-medium">
          <div className="flex items-center space-x-3">
            <Briefcase className="h-5 w-5 text-gray-500" />
            <div>
              <div className="font-semibold">{getLocalizedName(responsibility.names, filters.lang)}</div>
              <div className="text-sm text-muted-foreground">{responsibility.slug}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>{getLocalizedName(responsibility.organization.names, filters.lang)}</TableCell>
        <TableCell>
          <div className="space-y-1">
            {responsibility.to_read_all && (
              <Badge variant="secondary">{translate("responsibilities.readAll", filters.lang)}</Badge>
            )}
            {responsibility.to_send_all && (
              <Badge variant="secondary">{translate("responsibilities.sendAll", filters.lang)}</Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{translate("common.openMenu", filters.lang)}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{translate("common.actions", filters.lang)}</DropdownMenuLabel>
              {hasUpdatePermission && (
                <DropdownMenuItem onClick={() => handleEditResponsibility(responsibility)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>{translate("common.edit", filters.lang)}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }

  if (isLoading) {
    return <div className="text-center py-4">{translate("common.loading", filters.lang)}</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translate("responsibilities.name", filters.lang)}</TableHead>
            <TableHead>{translate("responsibilities.organization", filters.lang)}</TableHead>
            <TableHead>{translate("responsibilities.permissions", filters.lang)}</TableHead>
            <TableHead>{translate("common.actions", filters.lang)}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responsibilities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {translate("responsibilities.noResponsibilitiesFound", filters.lang)}
              </TableCell>
            </TableRow>
          ) : (
            responsibilities.map(renderResponsibilityRow)
          )}
        </TableBody>
      </Table>
    </div>
  )
}

