"use client"

class StorageService implements StorageService {
  private static readonly RESPONSIBILITIES_KEY = "user_responsibilities"

  static getItem(key: string): string | null {
    if (typeof window === "undefined") return null
    try {
      return localStorage.getItem(key)
    } catch (e) {
      return null
    }
  }

  static setItem(key: string, value: string): void {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      console.error("Error setting localStorage", e)
    }
  }

  static removeItem(key: string): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(key)
  }

  static getResponsibilities(): number[] {
    try {
      const stored = this.getItem(this.RESPONSIBILITIES_KEY)
      return stored ? (JSON.parse(stored) ?? []) : []
    } catch (e) {
      console.error("Error getting responsibilities from storage:", e)
      return []
    }
  }

  static setResponsibilities(responsibilities: number[]): void {
    try {
      this.setItem(this.RESPONSIBILITIES_KEY, JSON.stringify(responsibilities))
    } catch (e) {
      console.error("Error setting responsibilities in storage:", e)
    }
  }

  static set(key: string, value: any): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }

  static get(key: string): any {
    if (typeof window !== "undefined") {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) ?? null) : null
    }
    return null
  }
}

export default StorageService

