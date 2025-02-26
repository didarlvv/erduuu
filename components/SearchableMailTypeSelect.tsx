"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronDown, X } from "lucide-react"
import { fetchMailTypes } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import type { MailType } from "@/lib/types"

interface SearchableMailTypeSelectProps {
  onSelect: (mailTypeId: number | null) => void
  language: string
}

const translations = {
  ru: {
    searchPlaceholder: "Поиск типа письма...",
    selectMailType: "Выберите тип письма",
    loading: "Загрузка...",
    noResults: "Ничего не найдено",
  },
  tk: {
    searchPlaceholder: "Hat görnüşini gözlemek...",
    selectMailType: "Hat görnüşini saýlaň",
    loading: "Ýüklenýär...",
    noResults: "Hiç zat tapylmady",
  },
  en: {
    searchPlaceholder: "Search mail type...",
    selectMailType: "Select mail type",
    loading: "Loading...",
    noResults: "No results found",
  },
}

export function SearchableMailTypeSelect({ onSelect, language }: SearchableMailTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [mailTypes, setMailTypes] = useState<MailType[]>([])
  const [selectedMailType, setSelectedMailType] = useState<MailType | null>(null)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { language: currentLanguage } = useLanguage()

  const fetchMailTypesData = useCallback(
    async (search: string) => {
      setLoading(true)
      try {
        const response = await fetchMailTypes({
          skip: 1,
          limit: 100,
          order_direction: "ASC",
          order_by: "id",
          search: search,
          lang: currentLanguage,
        })
        setMailTypes(response.payload)
      } catch (error) {
        console.error("Error fetching mail types:", error)
      } finally {
        setLoading(false)
      }
    },
    [currentLanguage],
  )

  useEffect(() => {
    fetchMailTypesData(searchTerm)
  }, [fetchMailTypesData, searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (mailType: MailType) => {
    setSelectedMailType(mailType)
    onSelect(mailType.id)
    setSearchTerm("")
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedMailType(null)
    onSelect(null)
    setSearchTerm("")
  }

  const getLocalizedName = (mailType: MailType) => {
    return mailType.names.find((n) => n.lang === currentLanguage)?.name || mailType.slug
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
            {selectedMailType ? getLocalizedName(selectedMailType) : translations[currentLanguage].selectMailType}
          </span>
        )}
        <div className="flex items-center gap-2">
          {selectedMailType && !isOpen && (
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" onClick={handleClear} />
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">{translations[currentLanguage].loading}</div>
          ) : mailTypes.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">{translations[currentLanguage].noResults}</div>
          ) : (
            mailTypes.map((mailType) => (
              <div
                key={mailType.id}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelect(mailType)}
              >
                {getLocalizedName(mailType)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

