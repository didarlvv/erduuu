"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createAuthenticatedAxios } from "@/lib/auth"
import { ShieldCheck, Loader2 } from "lucide-react"
import { CustomMultiSelect } from "@/components/ui/custom-multi-select"
import { fetchPermissions, updateRole, fetchRoleDetail } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/contexts/LanguageContext"
import { translate } from "./role.translations"
import type { UpdateRoleRequest, EditRoleDrawerProps, Permission } from "@/lib/types"

export function EditRoleDrawer({ open, onOpenChange, onSuccess, role }: EditRoleDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [formData, setFormData] = useState<UpdateRoleRequest>({
    name: "",
    slug: "",
    permission_ids: [],
  })
  const [originalData, setOriginalData] = useState<UpdateRoleRequest | null>(null)
  const { toast } = useToast()
  const api = createAuthenticatedAxios()
  const { language } = useLanguage()

  useEffect(() => {
    async function loadRoleDetails() {
      if (!role?.id) return

      try {
        setIsLoadingDetails(true)
        const response = await fetchRoleDetail(role.id)
        const roleData = response.payload

        setFormData({
          name: roleData.name,
          slug: roleData.slug,
          permission_ids: roleData.permissions.map((permission) => permission.id),
        })
        setOriginalData({
          name: roleData.name,
          slug: roleData.slug,
          permission_ids: roleData.permissions.map((permission) => permission.id),
        })
      } catch (error) {
        console.error("Error loading role details:", error)
        toast({
          variant: "destructive",
          title: translate("common.errorTitle", language),
          description: translate("roles.edit.loadError", language),
        })
      } finally {
        setIsLoadingDetails(false)
      }
    }

    if (open && role?.id) {
      loadRoleDetails()
    }
  }, [open, role?.id, toast, language])

  useEffect(() => {
    async function loadPermissions() {
      try {
        const response = await fetchPermissions({
          skip: 1,
          limit: 1000,
          order_direction: "ASC",
          order_by: "id",
        })
        setPermissions(response.payload.data)
      } catch (error) {
        console.error("Error loading permissions:", error)
        toast({
          variant: "destructive",
          title: translate("common.errorTitle", language),
          description: translate("roles.edit.loadPermissionsError", language),
        })
      }
    }

    if (open) {
      loadPermissions()
    }
  }, [open, toast, language])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!role?.id || !originalData) {
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("roles.edit.missingData", language),
      })
      return
    }

    try {
      setIsLoading(true)

      const changedFields: Partial<UpdateRoleRequest> = {}

      // Compare each field and add to changedFields only if changed
      Object.keys(formData).forEach((key) => {
        const typedKey = key as keyof UpdateRoleRequest
        if (JSON.stringify(formData[typedKey]) !== JSON.stringify(originalData[typedKey])) {
          changedFields[typedKey] = formData[typedKey]
        }
      })

      // Check if there are any changes
      if (Object.keys(changedFields).length === 0) {
        toast({
          title: translate("roles.edit.noChanges", language),
          description: translate("roles.edit.noChangesDescription", language),
        })
        onOpenChange(false)
        return
      }

      await updateRole(role.id, changedFields)

      toast({
        title: translate("roles.edit.success", language),
        description: translate("roles.edit.successDescription", language),
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("roles.edit.error", language),
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
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <SheetTitle className="text-lg font-semibold">{translate("roles.edit.title", language)}</SheetTitle>
              <SheetDescription className="text-sm">{translate("roles.edit.description", language)}</SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {isLoadingDetails ? (
              <LoadingSkeleton />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {translate("roles.name", language)}
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
                    {translate("roles.slug", language)}
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{translate("roles.permissions", language)}</Label>
                  <CustomMultiSelect
                    options={permissions.map((permission) => ({
                      label: permission.name,
                      value: permission.id.toString(),
                    }))}
                    value={formData.permission_ids.map(String)}
                    onChange={(values) => setFormData((prev) => ({ ...prev, permission_ids: values.map(Number) }))}
                    placeholder={translate("roles.selectPermissions", language)}
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
                  {translate("roles.edit.saving", language)}
                </>
              ) : (
                translate("roles.edit.saveChanges", language)
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

