"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createAuthenticatedAxios } from "@/lib/auth"
import { UserCog, Loader2 } from "lucide-react"
import { CustomMultiSelect } from "@/components/ui/custom-multi-select"
import { fetchRoles, fetchPermissions, updateUser, fetchUserDetail } from "@/lib/api"
import type { Role, Permission, User, UpdateUserRequest } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/contexts/LanguageContext"
import { userTranslations } from "./user.translations"

// Replace any existing translations or translate function with:
const translate = (key: string, language: string): string => {
  const keys = key.split(".")
  let translation: any = userTranslations[language as keyof typeof userTranslations]
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key
    }
    translation = translation[k]
  }
  return translation
}

interface EditUserDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user: User | null
}

export function EditUserDrawer({ open, onOpenChange, onSuccess, user }: EditUserDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [formData, setFormData] = useState<UpdateUserRequest>({
    username: "",
    phone: 0,
    first_name: "",
    last_name: "",
    email: "",
    role_ids: [],
    permission_ids: [],
    status: "active",
    password: "",
  })
  const [originalData, setOriginalData] = useState<UpdateUserRequest | null>(null)
  const { toast } = useToast()
  const api = createAuthenticatedAxios()
  const { language } = useLanguage()

  useEffect(() => {
    async function loadUserDetails() {
      if (!user?.id) return

      try {
        setIsLoadingDetails(true)
        const response = await fetchUserDetail(user.id)
        const userData = response.payload

        setFormData({
          username: userData.username,
          phone: userData.phone,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          role_ids: userData.roles.map((role) => role.id),
          permission_ids: userData.permissions.map((permission) => permission.id),
          status: userData.status,
          password: "", // Password is not included in response
        })
        setOriginalData({
          username: userData.username,
          phone: userData.phone,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          role_ids: userData.roles.map((role) => role.id),
          permission_ids: userData.permissions.map((permission) => permission.id),
          status: userData.status,
        })
      } catch (error) {
        console.error("Error loading user details:", error)
        toast({
          variant: "destructive",
          title: translate("common.errorTitle", language),
          description: translate("users.edit.loadError", language),
        })
      } finally {
        setIsLoadingDetails(false)
      }
    }

    if (open && user?.id) {
      loadUserDetails()
    }
  }, [open, user?.id, toast, language])

  useEffect(() => {
    async function loadData() {
      try {
        const [rolesResponse, permissionsResponse] = await Promise.all([
          fetchRoles({
            skip: 1,
            limit: 1000,
            order_direction: "ASC",
            order_by: "id",
          }),
          fetchPermissions({
            skip: 1,
            limit: 1000,
            order_direction: "ASC",
            order_by: "id",
          }),
        ])
        setRoles(rolesResponse.payload.data)
        setPermissions(permissionsResponse.payload.data)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          variant: "destructive",
          title: translate("common.errorTitle", language),
          description: translate("users.edit.loadDataError", language),
        })
      }
    }

    if (open) {
      loadData()
    }
  }, [open, toast, language])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id || !originalData) {
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("users.edit.missingData", language),
      })
      return
    }

    if (!formData.role_ids.length) {
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("users.edit.roleRequired", language),
      })
      return
    }

    try {
      setIsLoading(true)

      const changedFields: Partial<UpdateUserRequest> = {}

      // Compare each field and add to changedFields only if changed
      Object.keys(formData).forEach((key) => {
        const typedKey = key as keyof UpdateUserRequest
        if (JSON.stringify(formData[typedKey]) !== JSON.stringify(originalData[typedKey])) {
          changedFields[typedKey] = formData[typedKey]
        }
      })

      // If password is not changed, remove it from the request
      if (changedFields.password === "") {
        delete changedFields.password
      }

      // Check if there are any changes
      if (Object.keys(changedFields).length === 0) {
        toast({
          title: translate("users.edit.noChanges", language),
          description: translate("users.edit.noChangesDescription", language),
        })
        onOpenChange(false)
        return
      }

      await updateUser(user.id, changedFields)

      toast({
        title: translate("users.edit.success", language),
        description: translate("users.edit.successDescription", language),
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("users.edit.error", language),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 border-b pb-4">
            <UserCog className="h-5 w-5 text-muted-foreground" />
            <div>
              <SheetTitle className="text-lg font-semibold">{translate("users.edit.title", language)}</SheetTitle>
              <SheetDescription className="text-sm">{translate("users.edit.description", language)}</SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {isLoadingDetails ? (
              <LoadingSkeleton />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium">
                      {translate("users.firstName", language)}
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium">
                      {translate("users.lastName", language)}
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    {translate("users.username", language)}
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {translate("users.email", language)}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {translate("users.phone", language)}
                  </Label>
                  <Input
                    id="phone"
                    type="number"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {translate("users.password", language)}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({translate("users.edit.passwordHint", language)})
                    </span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{translate("users.roles", language)}</Label>
                  <CustomMultiSelect
                    options={roles.map((role) => ({
                      label: role.name,
                      value: role.id.toString(),
                    }))}
                    value={formData.role_ids.map(String)}
                    onChange={(values) => setFormData((prev) => ({ ...prev, role_ids: values.map(Number) }))}
                    placeholder={translate("users.selectRoles", language)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {translate("users.additionalPermissions", language)}
                    <span className="ml-1 text-xs text-muted-foreground font-normal">
                      ({translate("common.optional", language)})
                    </span>
                  </Label>
                  <CustomMultiSelect
                    options={permissions.map((permission) => ({
                      label: permission.name,
                      value: permission.id.toString(),
                    }))}
                    value={formData.permission_ids.map(String)}
                    onChange={(values) => setFormData((prev) => ({ ...prev, permission_ids: values.map(Number) }))}
                    placeholder={translate("users.selectPermissions", language)}
                  />
                </div>
              </form>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4 mt-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {translate("common.cancel", language)}
            </Button>
            <Button
              onClick={(e) => handleSubmit(e as any)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || isLoadingDetails}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translate("users.edit.saving", language)}
                </>
              ) : (
                translate("users.edit.saveChanges", language)
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

