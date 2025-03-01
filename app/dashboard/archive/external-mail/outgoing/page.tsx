"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OutgoingExternalMailsTable } from "@/app/dashboard/external-mail/outgoing/outgoing-external-mails-table";
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
import { Mail, Search, Filter, ChevronDown } from "lucide-react";
import { SearchableOrganizationSelect } from "@/components/SearchableOrganizationSelect";
import { SearchableResponsibilitySelect } from "@/components/SearchableResponsibilitySelect";
import { SearchableMailTypeSelect } from "@/components/SearchableMailTypeSelect";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchExternalMails } from "@/lib/api";
import type { ExternalMail } from "@/lib/types";
import { translate } from "@/app/dashboard/external-mail/external-mail.translations";

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function ArchivedOutgoingExternalMailPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const hasReadAccess = usePermission("manager.users.external-mail.readall");
  const [mails, setMails] = useState<ExternalMail[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    order_direction: "DESC" as const,
    order_by: "created_at",
    limit: 10,
    lang: language,
    organization_id: undefined as number | undefined,
    responsibility_id: undefined as number | undefined,
    mail_type_id: undefined as number | undefined,
    status: "",
    start_date: undefined as number | undefined,
    end_date: undefined as number | undefined,
  });
  const [isAnyFilterApplied, setIsAnyFilterApplied] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    if (!hasReadAccess) {
      router.push("/dashboard");
    }
  }, [hasReadAccess, router]);

  const loadMails = useCallback(async () => {
    if (!hasReadAccess) return;

    try {
      setIsLoading(true);
      const response = await fetchExternalMails({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        type: "outbox",
        is_archived: true,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.organization_id && {
          organization_id: filters.organization_id,
        }),
        ...(filters.responsibility_id && {
          responsibility_id: filters.responsibility_id,
        }),
        ...(filters.mail_type_id && { mail_type_id: filters.mail_type_id }),
        ...(filters.status && { status: filters.status }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      });
      setMails(response.payload.data || []);
      setTotal(response.payload.total || 0);
      setHasNextPage(response.payload.data.length === filters.limit);
    } catch (error) {
      console.error(translate("common.loadError", language), error);
      setMails([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filters, hasReadAccess, language]);

  useEffect(() => {
    loadMails();
  }, [loadMails]);

  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setSearchInputValue(term);
      setIsAnyFilterApplied(
        term !== "" ||
          filters.order_direction !== "DESC" ||
          filters.order_by !== "created_at" ||
          filters.limit !== 10 ||
          filters.organization_id !== undefined ||
          filters.responsibility_id !== undefined ||
          filters.mail_type_id !== undefined ||
          filters.status !== "" ||
          filters.start_date !== undefined ||
          filters.end_date !== undefined
      );
      setCurrentPage(1);
    }, 1000),
    []
  );

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      setIsAnyFilterApplied(
        searchTerm !== "" ||
          newFilters.order_direction !== "DESC" ||
          newFilters.order_by !== "created_at" ||
          newFilters.limit !== 10 ||
          newFilters.organization_id !== undefined ||
          newFilters.responsibility_id !== undefined ||
          newFilters.mail_type_id !== undefined ||
          newFilters.status !== "" ||
          newFilters.start_date !== undefined ||
          newFilters.end_date !== undefined
      );
      return newFilters;
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      order_direction: "DESC",
      order_by: "created_at",
      limit: 10,
      lang: language,
      organization_id: undefined,
      responsibility_id: undefined,
      mail_type_id: undefined,
      status: "",
      start_date: undefined,
      end_date: undefined,
    });
    setSearchTerm("");
    setSearchInputValue("");
    setIsAnyFilterApplied(false);
    setCurrentPage(1);
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
          <Mail className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">
            {translate("outgoingMails.title", language)}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {translate("outgoingMails.manageMails", language)}
          </CardTitle>
          <CardDescription>
            {translate("outgoingMails.manageDescription", language)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={translate("common.search", language)}
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
                    handleFilterChange("limit", Number(value))
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={translate("common.recordsPerPage", language)}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((value) => (
                      <SelectItem key={value} value={value.toString()}>
                        {value} {translate("common.records", language)}
                      </SelectItem>
                    ))}
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
                            <SelectItem value="created_at">
                              {translate("common.creationDate", language)}
                            </SelectItem>
                            <SelectItem value="title">
                              {translate("outgoingMails.subject", language)}
                            </SelectItem>
                            <SelectItem value="code">
                              {translate("outgoingMails.code", language)}
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
                          {translate("outgoingMails.status", language)}
                        </label>
                        <Select
                          value={filters.status}
                          onValueChange={(value) =>
                            handleFilterChange("status", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={translate(
                                "common.selectStatus",
                                language
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {translate("common.all", language)}
                            </SelectItem>
                            <SelectItem value="new">
                              {translate("outgoingMails.statusNew", language)}
                            </SelectItem>
                            <SelectItem value="sent">
                              {translate("outgoingMails.statusSent", language)}
                            </SelectItem>
                            <SelectItem value="delivered">
                              {translate(
                                "outgoingMails.statusDelivered",
                                language
                              )}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {translate("outgoingMails.organization", language)}
                        </label>
                        <SearchableOrganizationSelect
                          onSelect={(id) =>
                            handleFilterChange("organization_id", id)
                          }
                          language={language}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {translate("outgoingMails.responsibility", language)}
                        </label>
                        <SearchableResponsibilitySelect
                          onSelect={(id) =>
                            handleFilterChange("responsibility_id", id)
                          }
                          language={language}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {translate("outgoingMails.mailType", language)}
                        </label>
                        <SearchableMailTypeSelect
                          onSelect={(id) =>
                            handleFilterChange("mail_type_id", id)
                          }
                          language={language}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            <OutgoingExternalMailsTable
              mails={mails}
              total={total}
              currentPage={currentPage}
              pageSize={filters.limit}
              onPageChange={setCurrentPage}
              onSearch={handleSearch}
              onLanguageChange={(lang) => handleFilterChange("lang", lang)}
              onStatusFilter={(status) => handleFilterChange("status", status)}
              loading={isLoading}
              onRefresh={loadMails}
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
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
