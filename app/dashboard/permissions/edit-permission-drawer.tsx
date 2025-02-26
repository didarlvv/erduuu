"use client"

import { Skeleton } from "@/components/ui/skeleton"

import type React from "react"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Shield, Loader2 } from "lucide-react"
import { CustomMultiSelect } from "@/components/ui/custom-multi-select"
import { fetchRoles, updatePermission, fetchPermissionDetail } from "@/lib/api"
import type { UpdatePermissionRequest, Permission, Role } from "@/lib/types"
import { translate } from "./permissions.translations"
import { useLanguage } from "@/contexts/LanguageContext"

interface EditPermissionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  permission: Permission | null
}

export function EditPermissionDrawer({ open, onOpenChange, onSuccess, permission }: EditPermissionDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [formData, setFormData] = useState<UpdatePermissionRequest>({
    name: "",
    slug: "",
    role_ids: [],
  })
  const [originalData, setOriginalData] = useState<UpdatePermissionRequest | null>(null)
  const { toast } = useToast()
  const { language } = useLanguage()

  useEffect(() => {
    async function loadPermissionDetails() {
      if (!permission?.id) return

      try {
        setIsLoadingDetails(true)
        const response = await fetchPermissionDetail(permission.id)
        const permissionData = response.payload

        setFormData({
          name: permissionData.name,
          slug: permissionData.slug,
          role_ids: permissionData.roles.map((role) => role.id),
        })
        setOriginalData({
          name: permissionData.name,
          slug: permissionData.slug,
          role_ids: permissionData.roles.map((role) => role.id),
        })
      } catch (error) {
        console.error("Error loading permission details:", error)
        toast({
          variant: "destructive",
          title: translate("common.errorTitle", language),
          description: translate("permissions.edit.loadError", language),
        })
      } finally {
        setIsLoadingDetails(false)
      }
    }

    if (open && permission?.id) {
      loadPermissionDetails()
    }
  }, [open, permission?.id, toast, language])

  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await fetchRoles({
          skip: 1,
          limit: 1000,
          order_direction: "ASC",
          order_by: "id",
        })
        setRoles(response.payload.data)
      } catch (error) {
        console.error("Error loading roles:", error)
        toast({
          variant: "destructive",
          title: translate("common.errorTitle", language),
          description: translate("permissions.edit.loadRolesError", language),
        })
      }
    }

    if (open) {
      loadRoles()
    }
  }, [open, toast, language])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!permission?.id || !originalData) {
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("permissions.edit.missingData", language),
      })
      return
    }

    try {
      setIsLoading(true)

      const changedFields: Partial<UpdatePermissionRequest> = {}

      // Compare each field and add to changedFields only if changed
      Object.keys(formData).forEach((key) => {
        const typedKey = key as keyof UpdatePermissionRequest
        if (JSON.stringify(formData[typedKey]) !== JSON.stringify(originalData[typedKey])) {
          changedFields[typedKey] = formData[typedKey]
        }
      })

      // Check if there are any changes
      if (Object.keys(changedFields).length === 0) {
        toast({
          title: translate("permissions.edit.noChanges", language),
          description: translate("permissions.edit.noChangesDescription", language),
        })
        onOpenChange(false)
        return
      }

      await updatePermission(permission.id, changedFields)

      toast({
        title: translate("permissions.edit.success", language),
        description: translate("permissions.edit.successDescription", language),
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating permission:", error)
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("permissions.edit.error", language),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 border-b pb-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <SheetTitle className="text-lg font-semibold">{translate("permissions.edit.title", language)}</SheetTitle>
              <SheetDescription className="text-sm">
                {translate("permissions.edit.description", language)}
              </SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {isLoadingDetails ? (
              <LoadingSkeleton />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {translate("permissions.name", language)}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    {translate("permissions.slug", language)}
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{translate("permissions.roles", language)}</Label>
                  <CustomMultiSelect
                    options={roles.map((role) => ({
                      label: role.name,
                      value: role.id.toString(),
                    }))}
                    value={formData.role_ids.map(String)}
                    onChange={(values) => setFormData((prev) => ({ ...prev, role_ids: values.map(Number) }))}
                    placeholder={translate("permissions.selectRoles", language)}
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
                  {translate("permissions.edit.saving", language)}
                </>
              ) : (
                translate("permissions.edit.saveChanges", language)
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

