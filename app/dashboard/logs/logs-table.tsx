"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import type { Log } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations } from "./logs.translations"

interface LogsTableProps {
  logs: Log[]
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onSearch: (term: string) => void
  onMethodFilter: (method: string) => void
  loading: boolean
}

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

export function LogsTable({
  logs,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onSearch,
  onMethodFilter,
  loading,
}: LogsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const totalPages = Math.ceil(total / pageSize)
  const { language } = useLanguage()

  const handleSearch = () => {
    onSearch(searchTerm)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(language === "en" ? "en-US" : language === "tk" ? "tk-TM" : "ru-RU")
  }

  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, total)

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800"
      case "POST":
        return "bg-green-100 text-green-800"
      case "PUT":
        return "bg-yellow-100 text-yellow-800"
      case "DELETE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: number) => {
    if (status < 300) return "bg-green-100 text-green-800"
    if (status < 400) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder={translate("logs.searchPlaceholder", language)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
          <Button onClick={handleSearch} variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select onValueChange={onMethodFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={translate("logs.filterByMethod", language)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate("logs.allMethods", language)}</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{translate("logs.id", language)}</TableHead>
              <TableHead>{translate("logs.method", language)}</TableHead>
              <TableHead>{translate("logs.url", language)}</TableHead>
              <TableHead>{translate("logs.status", language)}</TableHead>
              <TableHead>{translate("logs.user", language)}</TableHead>
              <TableHead>{translate("logs.ip", language)}</TableHead>
              <TableHead>{translate("logs.date", language)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  <Skeleton className="h-4 w-[200px] mx-auto" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  {translate("logs.noLogs", language)}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(log.method)}`}>
                      {log.method}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{log.url}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell>{log.user.username}</TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {translate("logs.showing", language)} {startRecord} {translate("logs.to", language)} {endRecord}{" "}
          {translate("logs.of", language)} {total} {translate("logs.results", language)}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            {translate("logs.page", language)} {currentPage} {translate("logs.of", language)} {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

