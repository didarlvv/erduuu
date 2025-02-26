"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { SearchableOrganizationSelect } from "@/components/SearchableOrganizationSelect"
import { SearchableUserSelect } from "@/components/SearchableUserSelect"
import { createResponsibility } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { responsibilityTranslations } from "./responsibility.translations"
import type { CreateResponsibilityDto } from "@/lib/types"
import { Briefcase, Loader2 } from "lucide-react"

const translate = (key: string, language: string): string => {
  const keys = key.split(".")
  let translation: any = responsibilityTranslations[language as keyof typeof responsibilityTranslations]
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key
    }
    translation = translation[k]
  }
  return translation
}

interface CreateResponsibilityDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateResponsibilityDrawer({ open, onOpenChange, onSuccess }: CreateResponsibilityDrawerProps) {
  const [formData, setFormData] = useState<CreateResponsibilityDto>({
    slug: "",
    to_read_all: false,
    to_send_all: false,
    organization_id: 0,
    user_id: 0,
    names: [
      { name: "", lang: "en" },
      { name: "", lang: "tk" },
      { name: "", lang: "ru" },
    ],
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { language } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createResponsibility(formData)
      toast({
        title: translate("responsibilities.responsibilityCreated", language),
        description: translate("responsibilities.createSuccessDescription", language),
        variant: "default",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating responsibility:", error)
      toast({
        title: translate("responsibilities.createError", language),
        description: translate("responsibilities.createErrorDescription", language),
        variant: "destructive",
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
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <div>
              <SheetTitle className="text-lg font-semibold">
                {translate("responsibilities.createResponsibility", language)}
              </SheetTitle>
              <SheetDescription className="text-sm">
                {translate("responsibilities.createDescription", language)}
              </SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">{translate("responsibilities.name", language)}</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{translate("responsibilities.organization", language)}</Label>
                <SearchableOrganizationSelect onSelect={(id) => setFormData({ ...formData, organization_id: id })} />
              </div>
              <div className="space-y-2">
                <Label>User</Label>
                <SearchableUserSelect onSelect={(id) => setFormData({ ...formData, user_id: id })} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="to_read_all"
                  checked={formData.to_read_all}
                  onCheckedChange={(checked) => setFormData({ ...formData, to_read_all: checked })}
                />
                <Label htmlFor="to_read_all">{translate("responsibilities.readAll", language)}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="to_send_all"
                  checked={formData.to_send_all}
                  onCheckedChange={(checked) => setFormData({ ...formData, to_send_all: checked })}
                />
                <Label htmlFor="to_send_all">{translate("responsibilities.sendAll", language)}</Label>
              </div>
              {formData.names.map((name, index) => (
                <div key={name.lang} className="space-y-2">
                  <Label
                    htmlFor={`name-${name.lang}`}
                  >{`${translate("responsibilities.name", language)} (${name.lang.toUpperCase()})`}</Label>
                  <Input
                    id={`name-${name.lang}`}
                    value={name.name}
                    onChange={(e) => {
                      const newNames = [...formData.names]
                      newNames[index].name = e.target.value
                      setFormData({ ...formData, names: newNames })
                    }}
                    required
                  />
                </div>
              ))}
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
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translate("responsibilities.creating", language)}
                </>
              ) : (
                translate("responsibilities.createResponsibility", language)
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

