"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Filter, ChevronDown, Pencil, ShieldCheck } from "lucide-react";
import { TableWrapper } from "@/components/TableWrapper";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Role, RolesQueryParams } from "@/lib/types";

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

interface RolesTableProps {
  roles: Role[];
  total: number;
  currentPage: number;
  isLoading: boolean;
  searchTerm: string;
  isFiltersOpen: boolean;
  filters: RolesQueryParams;
  isAnyFilterApplied: boolean;
  hasUpdatePermission: boolean;
  onSearch: (term: string) => void;
  onFilterChange: (key: string, value: string | number) => void;
  setIsFiltersOpen: (isOpen: boolean) => void;
  clearAllFilters: () => void;
  handleEditRole: (role: Role) => void;
  setCurrentPage: (page: number) => void;
  translate: (key: string) => string;
}

export function RolesTable({
  roles,
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
  handleEditRole,
  setCurrentPage,
  translate,
}: RolesTableProps) {
  const [searchInputValue, setSearchInputValue] = useState(searchTerm);

  const handleSearch = useCallback(
    debounce((term: string) => {
      onSearch(term);
    }, 300),
    []
  );

  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: translate("roles.name") },
    { key: "slug", header: translate("roles.slug") },
    { key: "actions", header: translate("common.actions") },
  ];

  const renderRoleRow = (role: Role) => {
    return (
      <TableRow key={role.id}>
        <TableCell>{role.id}</TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            <div>
              <div className="font-semibold">{role.name}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>{role.slug}</TableCell>
        <TableCell className="text-right">
          {hasUpdatePermission && (
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => handleEditRole(role)}
            >
              <span className="sr-only">{translate("common.edit")}</span>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Input
              placeholder={translate("roles.searchPlaceholder")}
              className="pl-8 w-[300px]"
              value={searchInputValue}
              onChange={(e) => {
                setSearchInputValue(e.target.value);
                handleSearch(e.target.value);
              }}
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
          {isAnyFilterApplied && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="flex items-center gap-2"
            >
              {translate("common.clearFilters")}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filters.limit?.toString()}
            onValueChange={(value) => onFilterChange("limit", Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={translate("common.recordsPerPage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 {translate("common.records")}</SelectItem>
              <SelectItem value="10">
                10 {translate("common.records")}
              </SelectItem>
              <SelectItem value="20">
                20 {translate("common.records")}
              </SelectItem>
              <SelectItem value="50">
                50 {translate("common.records")}
              </SelectItem>
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
                  <label className="text-sm font-medium">
                    {translate("common.sortBy")}
                  </label>
                  <Select
                    value={filters.order_by}
                    onValueChange={(value) => onFilterChange("order_by", value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={translate("common.selectField")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="created_at">
                        {translate("common.creationDate")}
                      </SelectItem>
                      <SelectItem value="name">
                        {translate("roles.name")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {translate("common.direction")}
                  </label>
                  <Select
                    value={filters.order_direction}
                    onValueChange={(value) =>
                      onFilterChange("order_direction", value as "ASC" | "DESC")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={translate("common.selectDirection")}
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {translate("common.language")}
                  </label>
                  <Select
                    value={filters.lang}
                    onValueChange={(value) => onFilterChange("lang", value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={translate("common.selectLanguage")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tk">
                        {translate("languageSelector.turkmen")}
                      </SelectItem>
                      <SelectItem value="ru">
                        {translate("languageSelector.russian")}
                      </SelectItem>
                      <SelectItem value="en">
                        {translate("languageSelector.english")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <TableWrapper
        data={roles}
        columns={columns}
        loading={isLoading}
        renderRow={renderRoleRow}
        translations={{
          loading: translate("common.loading"),
          noDataFound: translate("roles.noRolesFound"),
        }}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate("common.showing")}{" "}
          {(currentPage - 1) * (filters.limit ?? 10) + 1}{" "}
          {translate("common.to")}{" "}
          {Math.min(currentPage * (filters.limit ?? 10), total)}{" "}
          {translate("common.of")} {total} {translate("common.results")}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1 || isLoading}
          >
            {translate("common.previous")}
          </Button>
          <div className="text-sm">
            {translate("common.page")} {currentPage} {translate("common.of")}{" "}
            {Math.ceil(total / (filters.limit ?? 10))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage(
                Math.min(
                  currentPage + 1,
                  Math.ceil(total / (filters.limit ?? 10))
                )
              )
            }
            disabled={
              currentPage === Math.ceil(total / (filters.limit ?? 10)) ||
              isLoading
            }
          >
            {translate("common.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
