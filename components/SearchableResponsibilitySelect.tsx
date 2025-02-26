"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronDown, X } from "lucide-react"
import { fetchResponsibilities } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import type { Responsibility } from "@/lib/types"

interface SearchableResponsibilitySelectProps {
  onSelect: (responsibilityId: number | null) => void
  language: string
}

const translations = {
  ru: {
    searchPlaceholder: "Поиск должности...",
    selectResponsibility: "Выберите должность",
    loading: "Загрузка...",
    noResults: "Ничего не найдено",
  },
  tk: {
    searchPlaceholder: "Wezipe gözlemek...",
    selectResponsibility: "Wezipäni saýlaň",
    loading: "Ýüklenýär...",
    noResults: "Hiç zat tapylmady",
  },
  en: {
    searchPlaceholder: "Search position...",
    selectResponsibility: "Select position",
    loading: "Loading...",
    noResults: "No results found",
  },
}

export function SearchableResponsibilitySelect({ onSelect, language }: SearchableResponsibilitySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
  const [selectedResponsibility, setSelectedResponsibility] = useState<Responsibility | null>(null)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { language: currentLanguage } = useLanguage()

  const fetchResponsibilitiesData = useCallback(
    async (search: string) => {
      setLoading(true)
      try {
        const response = await fetchResponsibilities({
          skip: 1,
          limit: 100,
          order_direction: "ASC",
          order_by: "id",
          search: search,
          lang: currentLanguage,
        })
        setResponsibilities(response.payload.data)
      } catch (error) {
        console.error("Error fetching responsibilities:", error)
      } finally {
        setLoading(false)
      }
    },
    [currentLanguage],
  )

  useEffect(() => {
    fetchResponsibilitiesData(searchTerm)
  }, [fetchResponsibilitiesData, searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (responsibility: Responsibility) => {
    setSelectedResponsibility(responsibility)
    onSelect(responsibility.id)
    setSearchTerm("")
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedResponsibility(null)
    onSelect(null)
    setSearchTerm("")
  }

  const getLocalizedName = (resp: Responsibility) => {
    return resp.names.find((n) => n.lang === currentLanguage)?.name || resp.slug
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={`flex items-center justify-between w-full px-3 py-2 bg-white border rounded-md cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0)
          }
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            className="w-full border-none outline-none focus:ring-0 p-0 text-sm"
            placeholder={translations[currentLanguage].searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm">
            {selectedResponsibility
              ? getLocalizedName(selectedResponsibility)
              : translations[currentLanguage].selectResponsibility}
          </span>
        )}
        <div className="flex items-center gap-2">
          {selectedResponsibility && !isOpen && (
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" onClick={handleClear} />
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">{translations[currentLanguage].loading}</div>
          ) : responsibilities.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">{translations[currentLanguage].noResults}</div>
          ) : (
            responsibilities.map((resp) => (
              <div
                key={resp.id}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelect(resp)}
              >
                {getLocalizedName(resp)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

