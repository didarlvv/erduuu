"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CreateResponsibilityDrawer } from "./create-responsibility-drawer";
import { EditResponsibilityDrawer } from "./edit-responsibility-drawer";
import { usePermission } from "@/hooks/usePermission";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import type { Responsibility } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchResponsibilities } from "@/lib/api";
import { ResponsibilitiesTable } from "./responsibilities-table";
import { translate } from "./responsibility.translations";

export default function ResponsibilitiesPage() {
  const router = useRouter();
  const hasReadAccess = usePermission("manager.users.responsibilities.readall");
  const hasCreateAccess = usePermission(
    "manager.users.responsibilities.create"
  );
  const hasUpdatePermission = usePermission(
    "manager.users.responsibilities.update"
  );
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>(
    []
  );
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedResponsibility, setSelectedResponsibility] =
    useState<Responsibility | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    order_direction: "DESC" as const,
    order_by: "id",
    limit: 10,
    lang: "ru",
    organization_id: undefined as number | undefined,
    responsibility_id: undefined as number | undefined,
  });
  const [isAnyFilterApplied, setIsAnyFilterApplied] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [hasNextPage, setHasNextPage] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    if (!hasReadAccess) {
      router.push("/dashboard");
    }
  }, [hasReadAccess, router]);

  const loadResponsibilities = useCallback(async () => {
    if (!hasReadAccess) return;

    try {
      setIsLoading(true);
      const response = await fetchResponsibilities({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: language,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.organization_id && {
          organization_id: filters.organization_id,
        }),
        ...(filters.responsibility_id && {
          responsibility_id: filters.responsibility_id,
        }),
      });
      setResponsibilities(response.payload.data || []);
      setTotal(response.payload.total || 0);
      setHasNextPage(response.payload.data.length === filters.limit);
    } catch (error) {
      console.error(translate("responsibilities.loadError", language), error);
      setResponsibilities([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filters, hasReadAccess, language]);

  useEffect(() => {
    loadResponsibilities();
  }, [loadResponsibilities]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      setIsAnyFilterApplied(
        searchTerm !== "" ||
          newFilters.order_direction !== "DESC" ||
          newFilters.order_by !== "created_at" ||
          newFilters.limit !== 10 ||
          newFilters.organization_id !== undefined ||
          newFilters.responsibility_id !== undefined
      );
      return newFilters;
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      order_direction: "DESC",
      order_by: "id",
      limit: 10,
      lang: language,
      organization_id: undefined,
      responsibility_id: undefined,
    });
    setSearchTerm("");
    setSearchInputValue("");
    setIsAnyFilterApplied(false);
    setCurrentPage(1);
  };

  const handleEditResponsibility = (responsibility: Responsibility) => {
    setSelectedResponsibility(responsibility);
    setIsEditDrawerOpen(true);
  };

  if (!hasReadAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{translate("common.accessDenied", language)}</CardTitle>
            <CardDescription>
              {translate("common.noPermission", language)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">
            {translate("responsibilities.title", language)}
          </h1>
        </div>
        {hasCreateAccess && (
          <Button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Briefcase className="mr-2 h-4 w-4" />{" "}
            {translate("responsibilities.createResponsibility", language)}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {translate("responsibilities.manageResponsibilities", language)}
          </CardTitle>
          <CardDescription>
            {translate("responsibilities.manageDescription", language)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsibilitiesTable
            responsibilities={responsibilities}
            total={total}
            currentPage={currentPage}
            pageSize={filters.limit}
            onPageChange={setCurrentPage}
            onSearch={handleSearch}
            loading={isLoading}
            onRefresh={loadResponsibilities}
            filters={filters}
            setFilters={setFilters}
            isFiltersOpen={isFiltersOpen}
            setIsFiltersOpen={setIsFiltersOpen}
            isAnyFilterApplied={isAnyFilterApplied}
            clearAllFilters={clearAllFilters}
            handleFilterChange={handleFilterChange}
            searchInputValue={searchInputValue}
            setSearchInputValue={setSearchInputValue}
            hasNextPage={hasNextPage}
            translate={(key) => translate(key, language)}
            currentLanguage={language}
          />
        </CardContent>
      </Card>

      <CreateResponsibilityDrawer
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
        onSuccess={loadResponsibilities}
      />
      <EditResponsibilityDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        onSuccess={loadResponsibilities}
        responsibility={selectedResponsibility}
      />
    </div>
  );
}
