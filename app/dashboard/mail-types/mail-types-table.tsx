"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, Mail, MoreHorizontal, Pencil } from "lucide-react"
import type { MailType } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/contexts/LanguageContext"
import { useCallback } from "react"
import { mailTypeTranslations } from "./mail-types.translations"

interface MailTypesTableProps {
  mailTypes: MailType[]
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onSearch: (term: string) => void
  loading: boolean
  onEditMailType?: (mailType: MailType) => void
  onSort: (column: string) => void
  sortColumn: string
  sortDirection: string
}

export function MailTypesTable({
  mailTypes,
  total,
  currentPage,
  pageSize,
  onPageChange,
  loading,
  onEditMailType,
  onSort,
  sortColumn,
  sortDirection,
}: MailTypesTableProps) {
  const { language } = useLanguage()

  const translate = useCallback((key: string) => mailTypeTranslations[language]?.[key] || key, [language])

  const totalPages = Math.ceil(total / pageSize)

  const getLocalizedName = useCallback((names: { name: string; lang: string }[], lang: string) => {
    return names.find((n) => n.lang === lang)?.name || ""
  }, [])

  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, total)

  const LoadingSkeleton = () => (
    <>
      {[...Array(pageSize)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-6 w-6" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[200px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[150px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[50px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )

  const renderTableRow = useCallback(
    (mailType: MailType) => {
      return (
        <TableRow key={mailType.id}>
          <TableCell>
            <Mail className="h-5 w-5 text-blue-500" />
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <div>{getLocalizedName(mailType.names, "ru")}</div>
              <div className="text-sm text-gray-500">{getLocalizedName(mailType.names, "tk")}</div>
              <div className="text-sm text-gray-500">{getLocalizedName(mailType.names, "en")}</div>
            </div>
          </TableCell>
          <TableCell className="font-mono text-sm">{mailType.slug}</TableCell>
          <TableCell>{mailType.id}</TableCell>
          <TableCell>
            {mailType.is_main ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {translate("yes")}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {translate("no")}
              </span>
            )}
          </TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{translate("openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{translate("actions")}</DropdownMenuLabel>
                {onEditMailType && (
                  <DropdownMenuItem onClick={() => onEditMailType(mailType)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>{translate("edit")}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      )
    },
    [onEditMailType, translate, getLocalizedName],
  )

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>
                <button onClick={() => onSort("name")} className="flex items-center">
                  {translate("name")}
                  {sortColumn === "name" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => onSort("identifier")} className="flex items-center">
                  {translate("identifier")}
                  {sortColumn === "identifier" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => onSort("id")} className="flex items-center">
                  ID
                  {sortColumn === "id" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => onSort("main")} className="flex items-center">
                  {translate("main")}
                  {sortColumn === "main" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </button>
              </TableHead>
              <TableHead className="text-right">{translate("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingSkeleton />
            ) : mailTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {translate("noMailTypesFound")}
                </TableCell>
              </TableRow>
            ) : (
              mailTypes.map(renderTableRow)
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate("showing")} {startRecord} {translate("to")} {endRecord} {translate("of")} {total}{" "}
          {translate("results")}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            {translate("page")} {currentPage} {translate("of")} {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

