"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface MultiSelectProps {
  options: { label: string; value: string }[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function MultiSelect({ options, value, onChange, placeholder }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selected = value.map((value) => options.find((option) => option.value === value)?.label).filter(Boolean)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <div
            className={`w-full min-h-[38px] flex flex-wrap gap-1 p-1 text-sm rounded-md border border-input bg-background ring-offset-background ${
              open && "ring-2 ring-ring ring-offset-2"
            }`}
            role="combobox"
            aria-expanded={open}
          >
            {selected.length > 0 ? (
              selected.map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                  onClick={() => {
                    const optionValue = options.find((option) => option.label === label)?.value
                    if (optionValue) {
                      onChange(value.filter((v) => v !== optionValue))
                    }
                  }}
                >
                  {label}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))
            ) : (
              <span className="p-1.5 text-muted-foreground">{placeholder || "Выберите опции..."}</span>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск..." />
          <CommandList>
            <CommandEmpty>Ничего не найдено</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value],
                    )
                  }}
                >
                  <div
                    className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                      value.includes(option.value) ? "bg-primary text-primary-foreground" : "opacity-50"
                    }`}
                  >
                    {value.includes(option.value) && <X className="h-3 w-3" />}
                  </div>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

