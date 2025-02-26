"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  MoreHorizontal,
  Pencil,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import type { ResponsibilitiesTableProps } from "@/lib/types";

export function ResponsibilitiesTable({
  responsibilities,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onSearch,
  loading,
  onRefresh,
  filters,
  setFilters,
  isFiltersOpen,
  setIsFiltersOpen,
  isAnyFilterApplied,
  clearAllFilters,
  handleFilterChange,
  searchInputValue,
  setSearchInputValue,
  hasNextPage,
  translate,
  currentLanguage,
}: ResponsibilitiesTableProps) {
  const getLocalizedName = (
    names: { name: string; lang: string }[],
    lang: string
  ) => {
    return names.find((n) => n.lang === lang)?.name || "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder={translate("responsibilities.searchPlaceholder")}
              value={searchInputValue}
              onChange={(e) => {
                setSearchInputValue(e.target.value);
                onSearch(e.target.value);
              }}
              className="pl-8 w-[300px]"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {translate("common.filters")}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isFiltersOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => handleFilterChange("limit", Number(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue>{`${pageSize} ${translate(
              "common.items"
            )}`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">{`10 ${translate(
              "common.items"
            )}`}</SelectItem>
            <SelectItem value="20">{`20 ${translate(
              "common.items"
            )}`}</SelectItem>
            <SelectItem value="50">{`50 ${translate(
              "common.items"
            )}`}</SelectItem>
            <SelectItem value="100">{`100 ${translate(
              "common.items"
            )}`}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isFiltersOpen && (
        <div className="bg-muted p-4 rounded-md space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                {translate("common.sortBy")}
              </label>
              <Select
                value={filters.order_by}
                onValueChange={(value) => handleFilterChange("order_by", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={translate("common.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="slug">Slug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">
                {translate("common.sortDirection")}
              </label>
              <Select
                value={filters.order_direction}
                onValueChange={(value) =>
                  handleFilterChange("order_direction", value as "ASC" | "DESC")
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={translate("common.sortDirection")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">
                    {translate("common.ascending")}
                  </SelectItem>
                  <SelectItem value="DESC">
                    {translate("common.descending")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{translate("responsibilities.name")}</TableHead>
              <TableHead>
                {translate("responsibilities.organization")}
              </TableHead>
              <TableHead>{translate("responsibilities.permissions")}</TableHead>
              <TableHead className="text-right">
                {translate("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responsibilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {loading
                    ? translate("common.loading")
                    : translate("responsibilities.noResponsibilitiesFound")}
                </TableCell>
              </TableRow>
            ) : (
              responsibilities.map((responsibility) => (
                <TableRow key={responsibility.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Briefcase className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-semibold">
                          {getLocalizedName(
                            responsibility.names,
                            currentLanguage
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {responsibility.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getLocalizedName(
                      responsibility.organization.names,
                      currentLanguage
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {responsibility.to_read_all && (
                        <Badge variant="secondary">
                          {translate("responsibilities.readAll")}
                        </Badge>
                      )}
                      {responsibility.to_send_all && (
                        <Badge variant="secondary">
                          {translate("responsibilities.sendAll")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">
                            {translate("common.openMenu")}
                          </span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                          {translate("common.actions")}
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {}}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>{translate("common.edit")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate("common.showing")} {(currentPage - 1) * pageSize + 1} -{" "}
          {Math.min(currentPage * pageSize, total)} {translate("common.of")}{" "}
          {total} {translate("common.results")}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            {translate("common.previous")}
          </Button>
          <div className="text-sm">
            {translate("common.page")} {currentPage}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage || loading}
          >
            {translate("common.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
