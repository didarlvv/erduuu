"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Shield } from "lucide-react"
import { CustomMultiSelect } from "@/components/ui/custom-multi-select"
import type { CreatePermissionRequest, Role } from "@/lib/types"
import { fetchRoles, createPermission } from "@/lib/api"
import { translate } from "./permissions.translations"
import { useLanguage } from "@/contexts/LanguageContext"

interface CreatePermissionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreatePermissionDrawer({ open, onOpenChange, onSuccess }: CreatePermissionDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [formData, setFormData] = useState<CreatePermissionRequest>({
    name: "",
    slug: "",
    role_ids: [],
  })
  const { toast } = useToast()
  const { language } = useLanguage()

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
          description: translate("permissions.create.loadRolesError", language),
        })
      }
    }

    if (open) {
      loadRoles()
    }
  }, [open, toast, language])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)

      await createPermission(formData)

      toast({
        title: translate("permissions.create.success", language),
        description: translate("permissions.create.successDescription", language),
      })

      onSuccess()
      onOpenChange(false)

      // Reset form
      setFormData({
        name: "",
        slug: "",
        role_ids: [],
      })
    } catch (error) {
      console.error("Error creating permission:", error)
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("permissions.create.error", language),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 border-b pb-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <SheetTitle className="text-lg font-semibold">
                {translate("permissions.create.title", language)}
              </SheetTitle>
              <SheetDescription className="text-sm">
                {translate("permissions.create.description", language)}
              </SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
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
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4 mt-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {translate("common.cancel", language)}
            </Button>
            <Button
              onClick={(e) => handleSubmit(e as React.FormEvent)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading
                ? translate("permissions.create.creating", language)
                : translate("permissions.create.createPermission", language)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

