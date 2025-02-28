"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SentMailsTable } from "./sent-mails-table";
import { fetchInternalSentMails } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { useResponsibilities } from "@/hooks/useResponsibilities";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Mail, Plus, Filter, X } from "lucide-react";
import type { InternalMail, InternalMailsResponse } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { mailTranslations } from "../mail.translations";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-range-picker";

// Обновить функцию translate для корректной обработки вложенных ключей
const translate = (
  key: string,
  language: string,
  params: Record<string, string | number> = {}
): string => {
  const keys = key.split(".");
  let translation: any =
    mailTranslations[language as keyof typeof mailTranslations];
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key;
    }
    translation = translation[k];
  }
  if (typeof translation === "string") {
    return Object.entries(params).reduce(
      (str, [key, value]) =>
        str.replace(new RegExp(`{${key}}`, "g"), String(value)),
      translation
    );
  }
  return key;
};

// Обновить типы фильтров
type Filters = {
  order_direction: "ASC" | "DESC";
  order_by: string;
  limit: number;
  lang: string;
  status: string;
  start_date?: number;
  end_date?: number;
};

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function SentMailsPage() {
  const router = useRouter();
  const hasReadAccess = usePermission("manager.users.mails.readall");
  const hasCreateAccess = usePermission("manager.users.mails.create");
  const { detailedResponsibilities } = useResponsibilities();
  const [mails, setMails] = useState<InternalMail[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  // Обновить useState для фильтров
  const [filters, setFilters] = useState<Filters>({
    order_direction: "DESC",
    order_by: "created_at",
    limit: 10,
    lang: "ru",
    status: "all",
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

  // Обновить loadMails
  const loadMails = useCallback(async () => {
    if (!hasReadAccess) return;

    try {
      setIsLoading(true);
      const sender_ids = detailedResponsibilities?.map((resp) => resp.id) ?? [];
      console.log(detailedResponsibilities);
      const response: InternalMailsResponse = await fetchInternalSentMails({
        skip: currentPage,
        limit: filters.limit,
        order_direction: filters.order_direction,
        order_by: filters.order_by,
        lang: filters.lang,
        is_archived: false,
        sender_ids,
        search: searchTerm,
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      });
      setMails(response.payload || []);
      setTotal(response.total || 0);
      setHasNextPage(response.payload.length === filters.limit);
    } catch (error) {
      console.error(translate("mails.errors.loadFailed", language), error);
      setMails([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    filters,
    hasReadAccess,
    language,
    detailedResponsibilities,
  ]);

  // Обновить useEffect
  useEffect(() => {
    loadMails();
  }, [loadMails, filters, currentPage, searchTerm]);

  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setSearchInputValue(term);
      setIsAnyFilterApplied(
        term !== "" ||
          filters.order_direction !== "DESC" ||
          filters.order_by !== "created_at" ||
          filters.limit !== 10 ||
          filters.start_date !== undefined ||
          filters.end_date !== undefined ||
          filters.status !== "all"
      );
      setCurrentPage(1);
    }, 300),
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
          newFilters.start_date !== undefined ||
          newFilters.end_date !== undefined ||
          newFilters.status !== "all"
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
      lang: "ru",
      status: "all",
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
            {translate("mails.sent", language)}
          </h1>
        </div>
        {hasCreateAccess && (
          <Button
            onClick={() => router.push("/dashboard/mails/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />{" "}
            {translate("mails.create", language)}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("mails.title", language)}</CardTitle>
          <CardDescription>{translate("mails.sent", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-grow">
                <Input
                  placeholder={translate("mails.searchPlaceholder", language)}
                  value={searchInputValue}
                  onChange={(e) => {
                    setSearchInputValue(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {translate("common.filters", language)}
              </Button>
              {isAnyFilterApplied && (
                <Button
                  variant="ghost"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {translate("common.clearFilters", language)}
                </Button>
              )}
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) =>
                  handleFilterChange("limit", Number(value))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue
                    placeholder={translate("common.itemsPerPage", language)}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">
                    5 {translate("common.itemsPerPage", language)}
                  </SelectItem>
                  <SelectItem value="10">
                    10 {translate("common.itemsPerPage", language)}
                  </SelectItem>
                  <SelectItem value="20">
                    20 {translate("common.itemsPerPage", language)}
                  </SelectItem>
                  <SelectItem value="50">
                    50 {translate("common.itemsPerPage", language)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isFiltersOpen && (
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
                            placeholder={translate("common.sortBy", language)}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">
                            {translate("mails.date", language)}
                          </SelectItem>
                          <SelectItem value="title">
                            {translate("mails.subject", language)}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {translate("common.orderDirection", language)}
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
                              "common.orderDirection",
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
                        {translate("mails.filterByStatus", language)}
                      </label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) =>
                          handleFilterChange("status", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={translate("mails.status", language)}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {translate("mails.all", language)}
                          </SelectItem>
                          <SelectItem value="sent">
                            {translate("mails.sent", language)}
                          </SelectItem>
                          <SelectItem value="pending">
                            {translate("mails.pending", language)}
                          </SelectItem>
                          <SelectItem value="failed">
                            {translate("mails.failed", language)}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {translate("mails.filterByDate", language)}
                      </label>
                      <div className="flex gap-2">
                        <DatePicker
                          placeholder={translate("mails.startDate", language)}
                          value={
                            filters.start_date
                              ? new Date(filters.start_date)
                              : undefined
                          }
                          onChange={(date) =>
                            handleFilterChange("start_date", date?.getTime())
                          }
                        />
                        <DatePicker
                          placeholder={translate("mails.endDate", language)}
                          value={
                            filters.end_date
                              ? new Date(filters.end_date)
                              : undefined
                          }
                          onChange={(date) =>
                            handleFilterChange("end_date", date?.getTime())
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <SentMailsTable
              mails={mails}
              total={total}
              currentPage={currentPage}
              pageSize={filters.limit}
              onPageChange={setCurrentPage}
              onSearch={handleSearch}
              onLanguageChange={(lang) => handleFilterChange("lang", lang)}
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
              translate={translate}
              language={language}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
