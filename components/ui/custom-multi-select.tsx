"use client"

import { useState, useRef, useEffect } from "react"
import { X, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  label: string
  value: string
}

interface CustomMultiSelectProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function CustomMultiSelect({ options, value, onChange, placeholder }: CustomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))

  const selected = value.map((v) => options.find((option) => option.value === v)).filter(Boolean) as Option[]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
      setFocusedIndex(-1)
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case "Escape":
        setIsOpen(false)
        break
      case "ArrowDown":
        e.preventDefault()
        setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          toggleOption(filteredOptions[focusedIndex])
        }
        break
    }
  }

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const element = listRef.current.children[focusedIndex] as HTMLElement
      if (element) {
        element.scrollIntoView({ block: "nearest" })
      }
    }
  }, [focusedIndex])

  const toggleOption = (option: Option) => {
    const newValue = value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value]
    onChange(newValue)
  }

  const removeOption = (optionToRemove: Option, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optionToRemove.value))
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={cn(
          "relative w-full min-h-[38px] bg-white rounded-md border border-gray-300 cursor-pointer",
          isOpen && "ring-2 ring-blue-100 border-blue-500",
        )}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0)
          }
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="options-list"
      >
        <div className="flex flex-wrap gap-1 p-1">
          {selected.length > 0 ? (
            selected.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded"
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => removeOption(option, e)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label={`Удалить ${option.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="p-1.5 text-gray-500">{placeholder || "Выберите опции..."}</span>
          )}
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div
            ref={listRef}
            className="max-h-60 overflow-auto"
            role="listbox"
            aria-multiselectable="true"
            id="options-list"
          >
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 text-center">Ничего не найдено</div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer",
                    focusedIndex === index && "bg-gray-50",
                    "hover:bg-gray-50",
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleOption(option)
                  }}
                  role="option"
                  aria-selected={value.includes(option.value)}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-4 h-4 border rounded",
                      value.includes(option.value) ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300",
                    )}
                  >
                    {value.includes(option.value) && <Check className="h-3 w-3" />}
                  </div>
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

