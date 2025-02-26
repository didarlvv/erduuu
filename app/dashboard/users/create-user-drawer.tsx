"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createAuthenticatedAxios } from "@/lib/auth"
import { UserPlus } from "lucide-react"
import { CustomMultiSelect } from "@/components/ui/custom-multi-select"
import { fetchRoles, fetchPermissions } from "@/lib/api"
import type { Role, Permission } from "@/lib/types"
import { useLanguage } from "@/contexts/LanguageContext"
import { userTranslations } from "./user.translations"
import type { CreateUserRequest, CreateUserDrawerProps } from "@/lib/types"

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

export function CreateUserDrawer({ open, onOpenChange, onSuccess }: CreateUserDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: "",
    phone: 0,
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    role_ids: [],
    permission_ids: [],
    status: "active",
  })
  const { toast } = useToast()
  const api = createAuthenticatedAxios()
  const { language } = useLanguage()

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
          description: translate("users.create.loadError", language),
        })
      }
    }

    if (open) {
      loadData()
    }
  }, [open, toast, language])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.role_ids.length) {
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("users.create.roleRequired", language),
      })
      return
    }

    try {
      setIsLoading(true)

      await api.post("/manager/users", formData)

      toast({
        title: translate("users.create.success", language),
        description: translate("users.create.successDescription", language),
      })

      onSuccess()
      onOpenChange(false)

      // Reset form
      setFormData({
        username: "",
        phone: 0,
        password: "",
        first_name: "",
        last_name: "",
        email: "",
        role_ids: [],
        permission_ids: [],
        status: "active",
      })
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("users.create.error", language),
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
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <div>
              <SheetTitle className="text-lg font-semibold">{translate("users.create.title", language)}</SheetTitle>
              <SheetDescription className="text-sm">{translate("users.create.description", language)}</SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
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
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  required
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
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4 mt-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {translate("common.cancel", language)}
            </Button>
            <Button
              onClick={(e) => handleSubmit(e as any)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading
                ? translate("users.create.creating", language)
                : translate("users.create.createUser", language)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

