"use client"

import { useState, useEffect, useCallback } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Mail, Loader2 } from "lucide-react"
import { updateMailType } from "@/lib/api"
import type { UpdateMailTypeRequest, MailType } from "@/lib/types"
import type React from "react"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/contexts/LanguageContext"
import { mailTypeTranslations } from "./mail-types.translations"

interface EditMailTypeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  mailType: MailType | null
}

export function EditMailTypeDrawer({ open, onOpenChange, onSuccess, mailType }: EditMailTypeDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<UpdateMailTypeRequest>({
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

  // Initialize form data when mailType changes or drawer opens
  useEffect(() => {
    if (mailType && open) {
      setFormData({
        slug: mailType.slug,
        names: mailType.names,
        is_main: mailType.is_main,
      })
    }
  }, [mailType, open])

  const handleNameChange = useCallback((lang: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      names: prev.names.map((name) => (name.lang === lang ? { ...name, name: value } : name)),
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mailType?.id) {
      toast({
        variant: "destructive",
        title: translate("error"),
        description: translate("idNotFound"),
      })
      return
    }

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

      // Сравнение и подготовка измененных данных
      const changedFields: Partial<UpdateMailTypeRequest> = {}
      if (formData.slug !== mailType.slug) {
        changedFields.slug = formData.slug
      }

      const namesChanged = JSON.stringify(formData.names) !== JSON.stringify(mailType.names)
      if (namesChanged) {
        changedFields.names = formData.names
      }

      if (formData.is_main !== mailType.is_main) {
        changedFields.is_main = formData.is_main
      }

      if (Object.keys(changedFields).length === 0) {
        toast({
          title: translate("noChanges"),
          description: translate("noChangesDescription"),
        })
        onOpenChange(false)
        return
      }

      await updateMailType(mailType.id, changedFields)

      toast({
        title: translate("updateSuccess"),
        description: translate("updateSuccessDescription"),
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating mail type:", error)
      toast({
        variant: "destructive",
        title: translate("error"),
        description: translate("updateError"),
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
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <SheetTitle className="text-lg font-semibold">{translate("editMailType")}</SheetTitle>
              <SheetDescription className="text-sm">{translate("editDescription")}</SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium">
                  {translate("identifier")}
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-3 rounded-lg p-3 bg-muted/50">
                <h3 className="font-medium">{translate("mailTypeNames")}</h3>
                {formData.names.map((name) => (
                  <div key={name.lang} className="space-y-2">
                    <Label htmlFor={`name-${name.lang}`} className="text-sm font-medium">
                      {name.lang === "en"
                        ? translate("english")
                        : name.lang === "tk"
                          ? translate("turkmen")
                          : translate("russian")}
                    </Label>
                    <Input
                      id={`name-${name.lang}`}
                      value={name.name}
                      onChange={(e) => handleNameChange(name.lang, e.target.value)}
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
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translate("saving")}
                </>
              ) : (
                translate("saveChanges")
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

