"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronDown, X } from "lucide-react"
import { fetchOrganizationsExclude } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import type { Organization } from "@/lib/types"

interface SearchableOrganizationSelectProps {
  onSelect: (organizationId: number | null) => void
  excludeParentId?: number
}

const translations = {
  ru: {
    searchPlaceholder: "Поиск организации...",
    selectOrganization: "Выберите организацию",
    loading: "Загрузка...",
    noResults: "Ничего не найдено",
  },
  tk: {
    searchPlaceholder: "Gurama gözlemek...",
    selectOrganization: "Guramany saýlaň",
    loading: "Ýüklenýär...",
    noResults: "Hiç zat tapylmady",
  },
  en: {
    searchPlaceholder: "Search organization...",
    selectOrganization: "Select organization",
    loading: "Loading...",
    noResults: "No results found",
  },
}

export function SearchableOrganizationSelect({ onSelect, excludeParentId }: SearchableOrganizationSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { language: currentLanguage } = useLanguage()

  const fetchOrganizations = useCallback(
    async (search: string) => {
      setLoading(true)
      try {
        const response = await fetchOrganizationsExclude({
          skip: 1,
          limit: 100,
          order_direction: "ASC",
          order_by: "id",
          search: search,
          lang: currentLanguage,
        })
        setOrganizations(response.payload)
      } catch (error) {
        console.error("Error fetching organizations:", error)
      } finally {
        setLoading(false)
      }
    },
    [currentLanguage],
  )

  useEffect(() => {
    fetchOrganizations(searchTerm)
  }, [fetchOrganizations, searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (organization: Organization) => {
    setSelectedOrganization(organization)
    onSelect(organization.id)
    setSearchTerm("")
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedOrganization(null)
    onSelect(null)
    setSearchTerm("")
  }

  const getLocalizedName = (org: Organization) => {
    return org.names.find((n) => n.lang === currentLanguage)?.name || org.slug
  }

  const renderOrganizationItem = (org: Organization, level = 0) => {
    const children = organizations.filter((child) => child.parent_id === org.id)

    return (
      <div key={org.id}>
        <div
          className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${level > 0 ? "pl-6" : ""}`}
          onClick={() => handleSelect(org)}
        >
          {getLocalizedName(org)}
        </div>
        {children.map((child) => renderOrganizationItem(child, level + 1))}
      </div>
    )
  }

  const filteredOrganizations = organizations
    .filter((org) => {
      if (excludeParentId && org.parent_id === excludeParentId) {
        return false
      }
      const name = getLocalizedName(org).toLowerCase()
      return name.includes(searchTerm.toLowerCase())
    })
    .filter((org) => org.parent_id === null) // Get root level organizations

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
            {selectedOrganization
              ? getLocalizedName(selectedOrganization)
              : translations[currentLanguage].selectOrganization}
          </span>
        )}
        <div className="flex items-center gap-2">
          {selectedOrganization && !isOpen && (
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" onClick={handleClear} />
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">{translations[currentLanguage].loading}</div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">{translations[currentLanguage].noResults}</div>
          ) : (
            filteredOrganizations.map((org) => renderOrganizationItem(org))
          )}
        </div>
      )}
    </div>
  )
}

