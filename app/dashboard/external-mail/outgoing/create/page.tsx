"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SearchableOrganizationSelect } from "@/components/SearchableOrganizationSelect"
import { SearchableResponsibilitySelect } from "@/components/SearchableResponsibilitySelect"
import { SearchableMailTypeSelect } from "@/components/SearchableMailTypeSelect"
import { FileUpload } from "@/components/FileUpload"
import { createExternalMail } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Mail, ArrowLeft, Calendar, Plus } from "lucide-react"
import type { CreateExternalMailRequest, FileResponse } from "@/lib/types"
import { usePermission } from "@/hooks/usePermission"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLanguage } from "@/contexts/LanguageContext"
import { CreateOrganizationDrawer } from "@/app/dashboard/organizations/create-organization-drawer"
import { translate } from "../../external-mail.translations"

export default function CreateOutgoingExternalMailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { language } = useLanguage()
  const hasCreateAccess = usePermission("manager.users.external-mail.create")
  const [isLoading, setIsLoading] = useState(false)
  const [sentDate, setSentDate] = useState<Date>(new Date())
  const [isCreateOrganizationOpen, setIsCreateOrganizationOpen] = useState(false)
  const [formData, setFormData] = useState<CreateExternalMailRequest>({
    full_name: "",
    title: "",
    description: "",
    organization_id: 0,
    responsibility_id: 0,
    mail_type_id: 0,
    type: "outbox",
    file_ids: [],
    sent_time: Date.now(),
    internal_registration_code: "",
  })

  if (!hasCreateAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{translate("common.accessDenied", language)}</CardTitle>
            <CardDescription>{translate("common.noPermission", language)}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.full_name.trim()) {
        throw new Error(translate("outgoingMails.senderRequired", language))
      }
      if (!formData.title.trim()) {
        throw new Error(translate("outgoingMails.titleRequired", language))
      }
      if (!formData.organization_id) {
        throw new Error(translate("outgoingMails.organizationRequired", language))
      }
      if (!formData.responsibility_id) {
        throw new Error(translate("outgoingMails.responsibilityRequired", language))
      }
      if (!formData.mail_type_id) {
        throw new Error(translate("outgoingMails.mailTypeRequired", language))
      }
      if (!formData.internal_registration_code.trim()) {
        throw new Error(translate("outgoingMails.internalNumberRequired", language))
      }
      if (formData.file_ids.length === 0) {
        throw new Error(translate("outgoingMails.fileRequired", language))
      }

      // Create external mail with selected dates
      await createExternalMail({
        ...formData,
        type: "outbox",
        sent_time: sentDate.getTime(),
      })

      toast({
        title: translate("common.success", language),
        description: translate("outgoingMails.mailCreated", language),
      })
      router.push("/dashboard/external-mail/outgoing")
    } catch (error) {
      console.error("Error creating outgoing external mail:", error)
      toast({
        variant: "destructive",
        title: translate("common.error", language),
        description: error instanceof Error ? error.message : translate("outgoingMails.failedToCreate", language),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUploadSuccess = (files: FileResponse[]) => {
    setFormData((prev) => ({
      ...prev,
      file_ids: files.map((file) => file.id),
    }))
  }

  const handleOrganizationCreated = (newOrganizationId: number) => {
    setFormData((prev) => ({
      ...prev,
      organization_id: newOrganizationId,
    }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/external-mail/outgoing")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translate("outgoingMails.backToList", language)}
          </Button>
          <h1 className="text-2xl font-semibold text-gray-800">
            {translate("outgoingMails.createOutgoingExternalMail", language)}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("outgoingMails.createForm", language)}</CardTitle>
          <CardDescription>{translate("outgoingMails.fillAllFields", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="full_name" className="text-sm font-medium">
                  {translate("outgoingMails.senderFullName", language)} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  placeholder={translate("outgoingMails.senderFullName", language)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  {translate("outgoingMails.title", language)} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={translate("outgoingMails.title", language)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  {translate("outgoingMails.description", language)}
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder={translate("outgoingMails.description", language)}
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {translate("outgoingMails.responsibility", language)} <span className="text-red-500">*</span>
                </label>
                <SearchableResponsibilitySelect
                  onSelect={(id) =>
                    setFormData((prev) => ({
                      ...prev,
                      responsibility_id: id || 0,
                    }))
                  }
                  language={language}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {translate("outgoingMails.organization", language)} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-grow">
                    <SearchableOrganizationSelect
                      onSelect={(id) =>
                        setFormData((prev) => ({
                          ...prev,
                          organization_id: id || 0,
                        }))
                      }
                      language={language}
                    />
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => setIsCreateOrganizationOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {translate("outgoingMails.mailType", language)} <span className="text-red-500">*</span>
                </label>
                <SearchableMailTypeSelect
                  onSelect={(id) => setFormData((prev) => ({ ...prev, mail_type_id: id || 0 }))}
                  language={language}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="internal_registration_code" className="text-sm font-medium">
                  {translate("outgoingMails.internalRegistrationNumber", language)}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  id="internal_registration_code"
                  value={formData.internal_registration_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      internal_registration_code: e.target.value,
                    }))
                  }
                  placeholder={translate("outgoingMails.internalRegistrationNumber", language)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {translate("outgoingMails.sendDate", language)} <span className="text-red-500">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {sentDate ? (
                        format(sentDate, "PPP")
                      ) : (
                        <span>{translate("outgoingMails.selectDate", language)}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={sentDate}
                      onSelect={(newDate) => setSentDate(newDate || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {translate("outgoingMails.attachedFiles", language)} <span className="text-red-500">*</span>
              </label>
              <FileUpload
                onUploadSuccess={handleFileUploadSuccess}
                maxSize={10 * 1024 * 1024} // 10MB
                acceptedTypes={["image/jpeg", "image/png", "application/pdf"]}
                maxFiles={5}
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/external-mail/outgoing")}
                disabled={isLoading}
              >
                {translate("common.cancel", language)}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 animate-spin" />
                    {translate("common.creating", language)}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {translate("outgoingMails.createMail", language)}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <CreateOrganizationDrawer
        open={isCreateOrganizationOpen}
        onOpenChange={setIsCreateOrganizationOpen}
        onSuccess={handleOrganizationCreated}
      />
    </div>
  )
}

