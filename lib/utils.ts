import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  timestamp: number | string | null | undefined,
  language: string
): string {
  if (timestamp == null) {
    return "N/A";
  }
  const date = new Date(Number(timestamp));
  if (isNaN(date.getTime())) {
    console.error("Invalid timestamp:", timestamp);
    return "Invalid Date";
  }
  return new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function safeJsonParse<T>(
  jsonString: string | null | undefined,
  fallback: T
): T {
  if (jsonString == null) {
    return fallback;
  }
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return fallback;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}

export function formatDateCompact(timestamp: number, language: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(language, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(timestamp: number, language: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString(language, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
