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
import type { FileResponse } from "@/types/files"
import { usePermission } from "@/hooks/usePermission"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLanguage } from "@/contexts/LanguageContext"
import { CreateOrganizationDrawer } from "@/app/dashboard/organizations/create-organization-drawer"
import type { CreateExternalMailRequest } from "@/lib/types"
import { translate } from "../../external-mail.translations"

export default function CreateIncomingExternalMailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const hasCreateAccess = usePermission("manager.users.external-mail.create")
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState<Date>(new Date())
  const { language } = useLanguage()
  const [isCreateOrganizationOpen, setIsCreateOrganizationOpen] = useState(false)
  const [sentDate, setSentDate] = useState<Date>(new Date())
  const [receivedDate, setReceivedDate] = useState<Date>(new Date())

  const [formData, setFormData] = useState<CreateExternalMailRequest>({
    full_name: "",
    title: "",
    description: "",
    organization_id: 0,
    responsibility_id: 0,
    mail_type_id: 0,
    type: "inbox",
    file_ids: [],
    sent_time: Date.now(),
    received_time: Date.now(),
    internal_registration_code: "",
    external_registration_code: "",
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
        throw new Error(translate("incomingMails.senderFullNameRequired", language))
      }
      if (!formData.title.trim()) {
        throw new Error(translate("incomingMails.titleRequired", language))
      }
      if (!formData.organization_id) {
        throw new Error(translate("incomingMails.selectOrganization", language))
      }
      if (!formData.responsibility_id) {
        throw new Error(translate("incomingMails.selectResponsibility", language))
      }
      if (!formData.mail_type_id) {
        throw new Error(translate("incomingMails.selectMailType", language))
      }
      if (!formData.internal_registration_code.trim()) {
        throw new Error(translate("incomingMails.internalRegistrationCodeRequired", language))
      }

      if (formData.file_ids.length === 0) {
        throw new Error(translate("incomingMails.attachFileRequired", language))
      }

      // Create external mail with selected date
      await createExternalMail({
        ...formData,
        type: "inbox",
        sent_time: sentDate.getTime(),
        received_time: receivedDate.getTime(),
      })

      toast({
        title: translate("common.success", language),
        description: translate("incomingMails.incomingExternalMailCreated", language),
      })
      router.push("/dashboard/external-mail/incoming")
    } catch (error) {
      console.error("Error creating incoming external mail:", error)
      toast({
        variant: "destructive",
        title: translate("common.error", language),
        description: error instanceof Error ? error.message : translate("incomingMails.failedToCreateMail", language),
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
    setIsCreateOrganizationOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/external-mail/incoming")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translate("incomingMails.backToList", language)}
          </Button>
          <h1 className="text-2xl font-semibold text-gray-800">
            {translate("incomingMails.createIncomingExternalMail", language)}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{translate("incomingMails.createForm", language)}</CardTitle>
          <CardDescription>{translate("incomingMails.fillRequiredFields", language)}</CardDescription>
          <CardDescription>{translate("incomingMails.pageDescription", language)}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="full_name" className="text-sm font-medium">
                  {translate("incomingMails.senderFullName", language)} <span className="text-red-500">*</span>
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
                  placeholder={translate("incomingMails.enterSenderFullName", language)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  {translate("incomingMails.title", language)} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={translate("incomingMails.enterMailTitle", language)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                {translate("incomingMails.description", language)}
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
                placeholder={translate("incomingMails.enterMailDescription", language)}
                className="min-h-[60px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {translate("incomingMails.organization", language)} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <SearchableOrganizationSelect
                    onSelect={(id) =>
                      setFormData((prev) => ({
                        ...prev,
                        organization_id: id || 0,
                      }))
                    }
                    language={language}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => setIsCreateOrganizationOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {translate("incomingMails.responsibility", language)} <span className="text-red-500">*</span>
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
                  {translate("incomingMails.mailType", language)} <span className="text-red-500">*</span>
                </label>
                <SearchableMailTypeSelect
                  onSelect={(id) => setFormData((prev) => ({ ...prev, mail_type_id: id || 0 }))}
                  language={language}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="internal_registration_code" className="text-sm font-medium">
                  {translate("incomingMails.internalRegistrationCode", language)}{" "}
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
                  placeholder={translate("incomingMails.enterInternalRegistrationCode", language)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="external_registration_code" className="text-sm font-medium">
                  {translate("incomingMails.externalRegistrationCode", language)}
                </label>
                <Input
                  id="external_registration_code"
                  value={formData.external_registration_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      external_registration_code: e.target.value,
                    }))
                  }
                  placeholder={translate("incomingMails.enterExternalRegistrationCode", language)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {translate("incomingMails.sentDate", language)} <span className="text-red-500">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {sentDate ? (
                        format(sentDate, "PPP")
                      ) : (
                        <span>{translate("incomingMails.selectSentDate", language)}</span>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {translate("incomingMails.receivedDate", language)} <span className="text-red-500">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {receivedDate ? (
                        format(receivedDate, "PPP")
                      ) : (
                        <span>{translate("incomingMails.selectReceivedDate", language)}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={receivedDate}
                      onSelect={(newDate) => setReceivedDate(newDate || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {translate("incomingMails.attachedFiles", language)} <span className="text-red-500">*</span>
              </label>
              <FileUpload
                onUploadSuccess={handleFileUploadSuccess}
                maxSize={10 * 1024 * 1024} // 10MB
                acceptedTypes={["image/jpeg", "image/png", "application/pdf"]}
                maxFiles={5}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/external-mail/incoming")}
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
                    {translate("incomingMails.createMail", language)}
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

