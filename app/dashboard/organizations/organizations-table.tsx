"use client"

import { useState, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, Building2, MoreHorizontal, Pencil, ChevronRightIcon, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchOrganizationDetail } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { organizationTranslations } from "./organization.translations"
import type { OrganizationsTableProps, Organization } from "@/lib/types"

export function OrganizationsTable({
  organizations,
  total,
  currentPage,
  pageSize,
  onPageChange,
  loading,
  onEditOrganization,
  currentLanguage,
  translations,
}: OrganizationsTableProps) {
  const [expandedOrganizations, setExpandedOrganizations] = useState<{ [key: number]: Organization[] }>({})
  const [loadingStates, setLoadingStates] = useState<{ [key: number]: boolean }>({})
  const { language } = useLanguage()

  const translate = useCallback(
    (key: string): string => {
      const keys = key.split(".")
      let translation: any = organizationTranslations[language as keyof typeof organizationTranslations]
      for (const k of keys) {
        if (translation[k] === undefined) {
          return key
        }
        translation = translation[k]
      }
      return translation
    },
    [language],
  )

  const totalPages = Math.ceil(total / pageSize)
  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, total)

  const getLocalizedName = (names: { name: string; lang: string }[], lang: string) => {
    return names.find((n) => n.lang === lang)?.name || ""
  }

  const handleExpandOrganization = async (organizationId: number) => {
    if (expandedOrganizations[organizationId]) {
      const newExpandedOrgs = { ...expandedOrganizations }
      delete newExpandedOrgs[organizationId]
      setExpandedOrganizations(newExpandedOrgs)
      return
    }

    setLoadingStates((prev) => ({ ...prev, [organizationId]: true }))

    try {
      const response = await fetchOrganizationDetail(organizationId, currentLanguage)
      setExpandedOrganizations((prev) => ({
        ...prev,
        [organizationId]: response.payload.children,
      }))
    } catch (error) {
      console.error("Error fetching organization details:", error)
    } finally {
      setLoadingStates((prev) => ({ ...prev, [organizationId]: false }))
    }
  }

  const renderOrganizationRow = (
    organization: Organization,
    level = 0,
    isLastChild = true,
    parentIsLast: boolean[] = [],
  ) => {
    const isExpanded = Boolean(expandedOrganizations[organization.id])
    const isLoading = loadingStates[organization.id]
    const hasChildren = organization.children?.length > 0 || (expandedOrganizations[organization.id]?.length ?? 0) > 0

    return (
      <>
        <TableRow
          key={organization.id}
          className={cn("transition-colors hover:bg-muted/50", isExpanded && "bg-muted/30")}
        >
          <TableCell className="relative">
            <div className="flex items-center">
              {/* Indent guides */}
              {level > 0 && (
                <div className="absolute left-0 top-0 h-full">
                  {Array.from({ length: level }).map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "absolute border-l-2 h-full",
                        parentIsLast[index] ? "border-transparent" : "border-muted-foreground/20",
                      )}
                      style={{ left: `${(index + 1) * 2.5}rem` }}
                    />
                  ))}
                </div>
              )}

              {/* Organization icon and expand button */}
              <div className="flex items-center gap-2" style={{ marginLeft: `${level * 2.5}rem` }}>
                <div
                  className={cn(
                    "h-6 w-6 flex items-center justify-center rounded-md transition-colors",
                    isExpanded ? "bg-primary/10" : "bg-muted",
                  )}
                >
                  <Building2 className="h-4 w-4 text-primary" />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 hover:bg-primary/10",
                    hasChildren && "opacity-100",
                    !hasChildren && "opacity-0",
                  )}
                  onClick={() => handleExpandOrganization(organization.id)}
                  disabled={isLoading || !hasChildren}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronRightIcon
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-90",
                      )}
                    />
                  )}
                </Button>
              </div>
            </div>
          </TableCell>

          <TableCell>
            <div className="space-y-1">
              <div className="font-medium">{getLocalizedName(organization.names, "ru")}</div>
              <div className="text-sm text-muted-foreground">{getLocalizedName(organization.names, "tk")}</div>
              <div className="text-sm text-muted-foreground">{getLocalizedName(organization.names, "en")}</div>
            </div>
          </TableCell>
          <TableCell className="font-mono text-sm text-muted-foreground">{organization.slug}</TableCell>
          <TableCell className="text-muted-foreground">{organization.id}</TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">{translate("common.openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{translate("organizations.table.actions")}</DropdownMenuLabel>
                {onEditOrganization && (
                  <DropdownMenuItem onClick={() => onEditOrganization(organization)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>{translate("common.edit")}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {isExpanded &&
          expandedOrganizations[organization.id]?.map((child, index, array) =>
            renderOrganizationRow(child, level + 1, index === array.length - 1, [...parentIsLast, isLastChild]),
          )}
      </>
    )
  }

  const LoadingSkeleton = () => (
    <>
      {[...Array(pageSize)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-8 w-8" />
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[150px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <div className="flex justify-end">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">{translate("organizations.table.structure", language)}</TableHead>
              <TableHead>{translate("organizations.table.name", language)}</TableHead>
              <TableHead>{translate("organizations.table.slug", language)}</TableHead>
              <TableHead>{translate("organizations.table.id", language)}</TableHead>
              <TableHead className="text-right">{translate("organizations.table.actions", language)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingSkeleton />
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {translations.noData}
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((organization, index, array) =>
                renderOrganizationRow(organization, 0, index === array.length - 1, []),
              )
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {`${translate("common.showing")} ${startRecord} ${translate("common.to")} ${endRecord} ${translate("common.of")} ${total} ${translate("common.results")}`}
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
            {`${translate("common.page")} ${currentPage} ${translate("common.of")} ${totalPages}`}
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

