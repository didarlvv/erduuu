"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronDown, X, Check } from "lucide-react"
import { fetchUsers } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SearchableUserSelectProps {
  onSelect: (userId: number | null) => void
  language: string
  multiple?: boolean
  selectedIds?: number[]
  onRemove?: (userId: number) => void
}

export function SearchableUserSelect({
  onSelect,
  language,
  multiple = false,
  selectedIds = [],
  onRemove,
}: SearchableUserSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { language: currentLanguage } = useLanguage()

  const fetchUsersData = useCallback(
    async (search: string) => {
      setLoading(true)
      try {
        const response = await fetchUsers({
          skip: 1,
          limit: 100,
          order_direction: "ASC",
          order_by: "id",
          search: search,
          lang: currentLanguage,
        })
        setUsers(response.payload.data)
        // Update selectedUsers with full user data
        if (multiple && selectedIds.length > 0) {
          const selectedUsersData = response.payload.data.filter((user) => selectedIds.includes(user.id))
          setSelectedUsers(selectedUsersData)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    },
    [currentLanguage, multiple, selectedIds],
  )

  useEffect(() => {
    fetchUsersData(searchTerm)
  }, [searchTerm, fetchUsersData])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (user: User) => {
    if (multiple) {
      if (!selectedIds.includes(user.id)) {
        onSelect(user.id)
        setSelectedUsers((prev) => [...prev, user])
      } else {
        onRemove?.(user.id)
        setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id))
      }
    } else {
      setSelectedUsers([user])
      onSelect(user.id)
      setSearchTerm("")
      setIsOpen(false)
    }
  }

  const handleRemove = (e: React.MouseEvent, userId: number) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove(userId)
      setSelectedUsers((prev) => prev.filter((user) => user.id !== userId))
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedUsers([])
    onSelect(null)
    setSearchTerm("")
  }

  const getDisplayName = (user: User) => {
    return `${user.first_name} ${user.last_name}`
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
        <div className="flex-1 flex flex-wrap gap-2">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              className="w-full border-none outline-none focus:ring-0 p-0 text-sm"
              placeholder="Поиск пользователей..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : multiple ? (
            selectedUsers.length > 0 ? (
              selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded"
                >
                  {getDisplayName(user)}
                  <X
                    className="h-3 w-3 text-primary/70 hover:text-primary cursor-pointer"
                    onClick={(e) => handleRemove(e, user.id)}
                  />
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Выберите пользователей</span>
            )
          ) : (
            <span className="text-sm">
              {selectedUsers[0] ? getDisplayName(selectedUsers[0]) : "Выберите пользователя"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          {!multiple && selectedUsers[0] && !isOpen && (
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" onClick={handleClear} />
          )}
          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Загрузка...</div>
          ) : users.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Ничего �����е н��йдено</div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                  selectedIds.includes(user.id) && "bg-primary/5",
                )}
                onClick={() => handleSelect(user)}
              >
                {multiple && (
                  <div
                    className={cn(
                      "flex items-center justify-center w-4 h-4 border rounded",
                      selectedIds.includes(user.id) ? "border-primary bg-primary text-white" : "border-gray-300",
                    )}
                  >
                    {selectedIds.includes(user.id) && <Check className="h-3 w-3" />}
                  </div>
                )}
                <span className={cn("flex-1", selectedIds.includes(user.id) && "font-medium text-primary")}>
                  {getDisplayName(user)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

