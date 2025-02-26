import { getPermissions } from "@/lib/auth"

export function usePermission(requiredPermission: string): boolean {
  const permissions = getPermissions()
  return permissions?.some(
    (permission) =>
      (typeof permission === "string" && permission === requiredPermission) ||
      (typeof permission === "object" && permission.slug === requiredPermission),
  )
}

