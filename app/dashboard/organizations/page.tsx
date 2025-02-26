"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CreateOrganizationDrawer } from "./create-organization-drawer";
import { EditOrganizationDrawer } from "./edit-organization-drawer";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  ChevronRight,
  Building2,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Loader2,
} from "lucide-react";
import type { Organization, OrganizationFilters } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchOrganizations, fetchOrganizationDetail } from "@/lib/api";
import { organizationTranslations } from "./organization.translations";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const translate = (key: string, language: string): string => {
  const keys = key.split(".");
  let translation: any =
    organizationTranslations[language as keyof typeof organizationTranslations];
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key;
    }
    translation = translation[k];
  }
  return translation;
};

export default function OrganizationsPage() {
  const router = useRouter();
  const hasReadAccess = usePermission("manager.users.organizations.readall");
  const hasCreateAccess = usePermission("manager.users.organizations.create");
  const hasUpdatePermission = usePermission(
    "manager.users.organizations.update"
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<OrganizationFilters>({
    order_direction: "DESC",
    order_by: "id",
    lang: "ru",
    limit: 10,
  });
  const [isAnyFilterApplied, setIsAnyFilterApplied] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const { language } = useLanguage();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(true);
  const [expandedOrganizations, setExpandedOrganizations] = useState<{
    [key: number]: Organization[];
  }>({});
  const [loadingStates, setLoadingStates] = useState<{
    [key: number]: boolean;
  }>({});

  useEffect(() => {
    if (!hasReadAccess) {
      setHasAccess(false);
    }
  }, [hasReadAccess]);

  const loadOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchOrganizations({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        ...(searchTerm && { search: searchTerm }),
      });
      setOrganizations(response.payload?.data ?? []);
      setTotal(response.payload?.total ?? 0);
    } catch (error) {
      console.error(translate("organizations.loadError", language), error);
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("organizations.loadError", language),
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filters, language, toast]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setSearchInputValue(term);
      setIsAnyFilterApplied(
        term !== "" ||
          filters.order_direction !== "DESC" ||
          filters.order_by !== "id" ||
          filters.limit !== 10 ||
          filters.lang !== "ru"
      );
      setCurrentPage(1);
    }, 1000),
    []
  );

  const handleFilterChange = (
    key: string,
    value: string | number | string[]
  ) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      setIsAnyFilterApplied(
        newFilters.order_direction !== "DESC" ||
          newFilters.order_by !== "id" ||
          newFilters.lang !== "ru" ||
          newFilters.limit !== 10 ||
          searchTerm !== ""
      );
      return newFilters;
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      order_direction: "DESC",
      order_by: "id",
      lang: "ru",
      limit: 10,
    });
    setSearchTerm("");
    setSearchInputValue("");
    setIsAnyFilterApplied(false);
    setCurrentPage(1);
  };

  const handleEditOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsEditDrawerOpen(true);
  };

  const handleExpandOrganization = async (organizationId: number) => {
    if (expandedOrganizations[organizationId]) {
      const newExpandedOrgs = { ...expandedOrganizations };
      delete newExpandedOrgs[organizationId];
      setExpandedOrganizations(newExpandedOrgs);
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [organizationId]: true }));

    try {
      const response = await fetchOrganizationDetail(
        organizationId,
        filters.lang
      );
      setExpandedOrganizations((prev) => ({
        ...prev,
        [organizationId]: response.payload.children,
      }));
    } catch (error) {
      console.error("Error fetching organization details:", error);
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("organizations.loadError", language),
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [organizationId]: false }));
    }
  };

  const getLocalizedName = (
    names: { name: string; lang: string }[],
    lang: string
  ) => {
    return names.find((n) => n.lang === lang)?.name || "";
  };

  const renderOrganizationRow = (
    organization: Organization,
    level = 0,
    isLastChild = true,
    parentIsLast: boolean[] = []
  ) => {
    const isExpanded = Boolean(expandedOrganizations[organization.id]);
    const isLoading = loadingStates[organization.id];
    const hasChildren =
      organization.children?.length > 0 ||
      (expandedOrganizations[organization.id]?.length ?? 0) > 0;

    return (
      <>
        <TableRow
          key={organization.id}
          className={cn(
            "transition-colors hover:bg-muted/50",
            isExpanded && "bg-muted/30"
          )}
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
                        parentIsLast[index]
                          ? "border-transparent"
                          : "border-muted-foreground/20"
                      )}
                      style={{ left: `${(index + 1) * 2.5}rem` }}
                    />
                  ))}
                </div>
              )}

              {/* Organization icon and expand button */}
              <div
                className="flex items-center gap-2"
                style={{ marginLeft: `${level * 2.5}rem` }}
              >
                <div
                  className={cn(
                    "h-6 w-6 flex items-center justify-center rounded-md transition-colors",
                    isExpanded ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  <Building2 className="h-4 w-4 text-primary" />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-8 w-8 p-0 hover:bg-primary/10")}
                  onClick={() => handleExpandOrganization(organization.id)}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-90"
                      )}
                    />
                  )}
                </Button>
              </div>
            </div>
          </TableCell>

          <TableCell>{organization.id}</TableCell>
          <TableCell>{organization.slug}</TableCell>
          <TableCell>
            {organization.names.map((name) => (
              <div key={name.lang}>
                {name.lang}: {name.name}
              </div>
            ))}
          </TableCell>
          <TableCell className="text-right">
            {hasUpdatePermission && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">
                      {translate("common.openMenu", language)}
                    </span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {translate("organizations.table.actions", language)}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleEditOrganization(organization)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>{translate("common.edit", language)}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </TableCell>
        </TableRow>
        {isExpanded &&
          expandedOrganizations[organization.id]?.map((child, index, array) =>
            renderOrganizationRow(
              child,
              level + 1,
              index === array.length - 1,
              [...parentIsLast, isLastChild]
            )
          )}
      </>
    );
  };

  if (!hasAccess) {
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
          <Building2 className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">
            {translate("organizations.title", language)}
          </h1>
        </div>
        {hasCreateAccess && (
          <Button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Building2 className="mr-2 h-4 w-4" />{" "}
            {translate("organizations.createOrganization", language)}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {translate("organizations.manageOrganizations", language)}
          </CardTitle>
          <CardDescription>
            {translate("organizations.manageDescription", language)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={translate(
                      "organizations.searchPlaceholder",
                      language
                    )}
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
                  {translate("common.filters", language)}
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
                    {translate("common.clearFilters", language)}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={filters.limit.toString()}
                  onValueChange={(value) =>
                    handleFilterChange("limit", Number.parseInt(value))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={translate("common.recordsPerPage", language)}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">
                      5 {translate("common.records", language)}
                    </SelectItem>
                    <SelectItem value="10">
                      10 {translate("common.records", language)}
                    </SelectItem>
                    <SelectItem value="20">
                      20 {translate("common.records", language)}
                    </SelectItem>
                    <SelectItem value="50">
                      50 {translate("common.records", language)}
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
                          {translate("common.sortBy", language)}
                        </label>
                        <Select
                          value={filters.order_by}
                          onValueChange={(value) =>
                            handleFilterChange("order_by", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={translate(
                                "common.selectField",
                                language
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id">ID</SelectItem>
                            <SelectItem value="created_at">
                              {translate("common.creationDate", language)}
                            </SelectItem>
                            <SelectItem value="name">
                              {translate("organizations.name", language)}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {translate("common.direction", language)}
                        </label>
                        <Select
                          value={filters.order_direction}
                          onValueChange={(value) =>
                            handleFilterChange("order_direction", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={translate(
                                "common.selectDirection",
                                language
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ASC">
                              {translate("common.ascending", language)}
                            </SelectItem>
                            <SelectItem value="DESC">
                              {translate("common.descending", language)}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {translate("common.language", language)}
                        </label>
                        <Select
                          value={filters.lang}
                          onValueChange={(value) =>
                            handleFilterChange("lang", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={translate(
                                "common.selectLanguage",
                                language
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tk">
                              {translate("languageSelector.turkmen", language)}
                            </SelectItem>
                            <SelectItem value="ru">
                              {translate("languageSelector.russian", language)}
                            </SelectItem>
                            <SelectItem value="en">
                              {translate("languageSelector.english", language)}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">
                      {translate("organizations.table.structure", language)}
                    </TableHead>
                    <TableHead>
                      {translate("organizations.table.id", language)}
                    </TableHead>
                    <TableHead>
                      {translate("organizations.table.slug", language)}
                    </TableHead>
                    <TableHead>
                      {translate("organizations.table.name", language)}
                    </TableHead>
                    <TableHead className="text-right">
                      {translate("organizations.table.actions", language)}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        {translate("common.loading", language)}
                      </TableCell>
                    </TableRow>
                  ) : organizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        {translate(
                          "organizations.noOrganizationsFound",
                          language
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizations.map((organization) =>
                      renderOrganizationRow(organization, 0, true, [])
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateOrganizationDrawer
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
        onSuccess={loadOrganizations}
      />
      <EditOrganizationDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        onSuccess={loadOrganizations}
        organization={selectedOrganization}
      />
    </div>
  );
}
