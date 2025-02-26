"use client"

import { useState, useCallback } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createMailType } from "@/lib/api"
import { Mail } from "lucide-react"
import type { CreateMailTypeRequest } from "@/lib/types"
import type React from "react"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/contexts/LanguageContext"

import { mailTypeTranslations } from "./mail-types.translations"

interface CreateMailTypeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateMailTypeDrawer({ open, onOpenChange, onSuccess }: CreateMailTypeDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateMailTypeRequest>({
    slug: "",
    names: [
      { name: "", lang: "en" },
      { name: "", lang: "tk" },
      { name: "", lang: "ru" },
    ],
    is_main: false,
  })
  const { toast } = useToast()
  const { language } = useLanguage()

  const translate = useCallback(
    (key: string) => {
      return mailTypeTranslations[language]?.[key] || key
    },
    [language],
  )

  const handleInputChange = useCallback((lang: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      names: prev.names.map((name) => (name.lang === lang ? { ...name, name: value } : name)),
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Валидация формы
    if (!formData.slug.trim()) {
      toast({
        title: translate("error"),
        description: translate("errors.emptySlug"),
        variant: "destructive",
      })
      return
    }

    if (formData.names.some((name) => !name.name.trim())) {
      toast({
        title: translate("error"),
        description: translate("errors.emptyName"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await createMailType(formData)
      toast({
        title: translate("success"),
        description: translate("successDescription"),
      })
      onSuccess()
      onOpenChange(false)

      // Reset form
      setFormData({
        slug: "",
        names: [
          { name: "", lang: "en" },
          { name: "", lang: "tk" },
          { name: "", lang: "ru" },
        ],
        is_main: false,
      })
    } catch (error) {
      console.error("Error creating mail type:", error)
      toast({
        variant: "destructive",
        title: translate("error"),
        description: translate("errorDescription"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] border-l">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 border-b pb-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <SheetTitle className="text-lg font-semibold">{translate("createMailType")}</SheetTitle>
              <SheetDescription className="text-sm">{translate("fillForm")}</SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    {translate("abbreviation")}
                  </Label>
                  <Input
                    id="slug"
                    placeholder={translate("abbreviationPlaceholder")}
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{translate("abbreviationHint")}</p>
                </div>

                <div className="space-y-3 rounded-lg p-3 bg-muted/50">
                  <h3 className="font-medium">{translate("mailTypeNames")}</h3>
                  {formData.names.map((name) => (
                    <div key={name.lang} className="space-y-2">
                      <Label htmlFor={`name-${name.lang}`} className="text-sm font-medium">
                        {translate(name.lang === "en" ? "english" : name.lang === "tk" ? "turkmen" : "russian")}
                      </Label>
                      <Input
                        id={`name-${name.lang}`}
                        placeholder={
                          name.lang === "en"
                            ? "Mail type name"
                            : name.lang === "tk"
                              ? "Hat görnüşiň ady"
                              : "Название типа письма"
                        }
                        value={name.name}
                        onChange={(e) => handleInputChange(name.lang, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_main" className="text-sm font-medium">
                    {translate("mainType")}
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_main"
                      checked={formData.is_main}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_main: checked }))}
                    />
                    <Label htmlFor="is_main">{formData.is_main ? translate("yes") : translate("no")}</Label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4 mt-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {translate("cancel")}
            </Button>
            <Button
              onClick={(e) => handleSubmit(e as any)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? translate("creating") : translate("create")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

