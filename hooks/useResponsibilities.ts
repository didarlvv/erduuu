"use client"

import { useState, useEffect } from "react"
import { createAuthenticatedAxios } from "@/lib/auth"
import StorageService from "@/lib/storage"
import type { Responsibility } from "@/lib/types"

interface ResponsibilityName {
  id: number
  name: string
  lang: string
}

interface ResponsibilityUser {
  id: number
  first_name: string
  last_name: string
}

interface ResponsibilityWithUser extends Responsibility {
  user: ResponsibilityUser
}

interface ApiResponse<T> {
  payload: T
  delay: number
  timestamp: number
}

export function useResponsibilities() {
  const [responsibilities, setResponsibilities] = useState<number[]>([])
  const [detailedResponsibilities, setDetailedResponsibilities] = useState<ResponsibilityWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAllResponsibilities = async () => {
      try {
        // First try to get from storage
        const storedResponsibilities = StorageService.getResponsibilities() ?? []
        const storedDetailedResponsibilities = StorageService.get("detailed_responsibilities")

        if (storedResponsibilities.length > 0 && storedDetailedResponsibilities) {
          setResponsibilities(storedResponsibilities)
          setDetailedResponsibilities(storedDetailedResponsibilities)
          setIsLoading(false)
          return
        }

        // If not in storage, fetch from API
        const api = createAuthenticatedAxios()

        // First API call to get responsibility IDs
        const response = await api.get<ApiResponse<Responsibility[]>>("/responsibilities/clients")
        const fetchedResponsibilities = response.data?.payload ?? []
        const responsibilityIds = fetchedResponsibilities.map((r) => r.id)

        // Store basic responsibilities
        StorageService.setResponsibilities(responsibilityIds)
        setResponsibilities(responsibilityIds)

        // For each responsibility, fetch detailed permissions
        const detailedResponsibilitiesPromises = responsibilityIds.map(async (id) => {
          const detailsResponse = await api.get<ApiResponse<ResponsibilityWithUser[]>>(
            "/responsibilities/client/read/permissions",
            {
              params: {
                current_responsibility_id: id,
                order_direction: "DESC",
                skip: 1,
                limit: 10,
                order_by: "id",
              },
            },
          )
          return detailsResponse.data?.payload?.[0] ?? null
        })

        const detailedResults = await Promise.all(detailedResponsibilitiesPromises)

        // Filter out any null results and store
        const validDetailedResults = detailedResults.filter(
          (result): result is ResponsibilityWithUser => result !== null,
        )
        StorageService.set("detailed_responsibilities", validDetailedResults)
        setDetailedResponsibilities(validDetailedResults)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch responsibilities"))
        console.error("Error fetching responsibilities:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllResponsibilities()
  }, [])

  return {
    responsibilities,
    detailedResponsibilities,
    isLoading,
    error,
  }
}

