"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createAuthenticatedAxios } from "@/lib/auth"
import { SearchableOrganizationSelect } from "@/components/SearchableOrganizationSelect"
import { Building2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { organizationTranslations } from "./organization.translations"
import type { CreateOrganizationRequest, CreateOrganizationDrawerProps } from "@/lib/types"

const translate = (key: string, language: string): string => {
  const keys = key.split(".")
  let translation: any = organizationTranslations[language as keyof typeof organizationTranslations]
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key
    }
    translation = translation[k]
  }
  return translation
}

export function CreateOrganizationDrawer({ open, onOpenChange, onSuccess }: CreateOrganizationDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    parent_id: 0,
    slug: "",
    names: [
      { name: "", lang: "en" },
      { name: "", lang: "tk" },
      { name: "", lang: "ru" },
    ],
  })
  const { toast } = useToast()
  const api = createAuthenticatedAxios()
  const { language } = useLanguage()

  const handleInputChange = (lang: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      names: prev.names.map((name) => (name.lang === lang ? { ...name, name: value } : name)),
    }))
  }

  const handleParentSelect = (organizationId: number | null) => {
    setFormData((prev) => ({ ...prev, parent_id: organizationId || 0 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)

      await api.post("/organizations", formData)

      toast({
        title: translate("organizations.create.success", language),
        description: translate("organizations.create.successDescription", language),
      })

      onSuccess()
      onOpenChange(false)

      // Reset form
      setFormData({
        parent_id: 0,
        slug: "",
        names: [
          { name: "", lang: "en" },
          { name: "", lang: "tk" },
          { name: "", lang: "ru" },
        ],
      })
    } catch (error) {
      console.error("Error creating organization:", error)
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("organizations.create.error", language),
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
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <SheetTitle className="text-lg font-semibold">
                {translate("organizations.create.title", language)}
              </SheetTitle>
              <SheetDescription className="text-sm">
                {translate("organizations.create.description", language)}
              </SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-org" className="text-sm font-medium flex items-center gap-2">
                    {translate("organizations.parentOrganization", language)}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({translate("common.optional", language)})
                    </span>
                  </Label>
                  <SearchableOrganizationSelect onSelect={handleParentSelect} language={language} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    {translate("organizations.abbreviation", language)}
                  </Label>
                  <Input
                    id="slug"
                    placeholder="example-org"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {translate("organizations.create.slugDescription", language)}
                  </p>
                </div>

                <div className="space-y-3 rounded-lg p-3 bg-muted/50">
                  <h3 className="font-medium">{translate("organizations.names", language)}</h3>
                  {formData.names.map((name) => (
                    <div key={name.lang} className="space-y-2">
                      <Label htmlFor={`name-${name.lang}`} className="text-sm font-medium">
                        {name.lang === "en"
                          ? translate("languageSelector.english", language)
                          : name.lang === "tk"
                            ? translate("languageSelector.turkmen", language)
                            : translate("languageSelector.russian", language)}
                      </Label>
                      <Input
                        id={`name-${name.lang}`}
                        placeholder={
                          name.lang === "en"
                            ? "Organization name"
                            : name.lang === "tk"
                              ? "Gurama ady"
                              : "Название организации"
                        }
                        value={name.name}
                        onChange={(e) => handleInputChange(name.lang, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
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
                ? translate("organizations.create.creating", language)
                : translate("organizations.create.createOrganization", language)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

