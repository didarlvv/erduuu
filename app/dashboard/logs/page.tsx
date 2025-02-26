"use client"

import { useEffect, useState, useCallback } from "react"
import { LogsTable } from "./logs-table"
import { fetchLogs } from "@/lib/api"
import type { Log } from "@/types/logs"
import { useLanguage } from "@/contexts/LanguageContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { translations } from "./logs.translations"

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

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [method, setMethod] = useState("all")
  const { language } = useLanguage()

  const pageSize = 10

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetchLogs({
        skip: currentPage,
        limit: pageSize,
        order_direction: "DESC",
        order_by: "id",
        ...(searchTerm && { search: searchTerm }),
        ...(method !== "all" && { method }),
      })
      setLogs(response.payload.data)
      setTotal(response.payload.total)
    } catch (error) {
      console.error(translate("loadError", language), error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, method, language])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleMethodFilter = (selectedMethod: string) => {
    setMethod(selectedMethod)
    setCurrentPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">{translate("logs.title", language)}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("logs.manageLogs", language)}</CardTitle>
          <CardDescription>{translate("logs.manageDescription", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <LogsTable
            logs={logs}
            total={total}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onSearch={handleSearch}
            onMethodFilter={handleMethodFilter}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}

