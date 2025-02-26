import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(timestamp: number | null | undefined, language: string): string {
  if (timestamp == null) {
    return "N/A"
  }
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

export function formatDateCompact(timestamp: number | null | undefined, language: string): string {
  if (timestamp == null) {
    return "N/A"
  }
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (jsonString == null) {
    return fallback
  }
  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error("Error parsing JSON:", error)
    return fallback
  }
}

