"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePermission } from "@/hooks/usePermission"
import { fetchInternalMailDetail, archiveInternalMail } from "@/lib/api"
import type { InternalMailDetail } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Archive, Forward, Reply } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/contexts/LanguageContext"
import { mailTranslations } from "../mail.translations"
import { formatDate } from "@/lib/utils"

const translate = (key: string, language: string, params: Record<string, string | number> = {}): string => {
  const keys = key.split(".")
  let translation: any = mailTranslations[language as keyof typeof mailTranslations]
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key
    }
    translation = translation[k]
  }
  if (typeof translation === "string") {
    return Object.entries(params).reduce(
      (str, [key, value]) => str.replace(new RegExp(`{${key}}`, "g"), String(value)),
      translation,
    )
  }
  return key
}

export default function MailDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mailId = searchParams?.get("id")
  const mailType = searchParams?.get("type") as "inbox" | "sent"
  const { toast } = useToast()
  const { language } = useLanguage()
  const [mail, setMail] = useState<InternalMailDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const hasReadAccess = usePermission("manager.users.mails.readone")
  const hasArchiveAccess = usePermission("manager.users.mails.archive")

  const loadMailDetail = async () => {
    if (!mailId || !mailType) {
      console.error("Mail ID or type is missing")
      router.push("/dashboard/mails/inbox")
      return
    }

    try {
      setIsLoading(true)
      const data = await fetchInternalMailDetail(Number(mailId), language)
      setMail(data)
    } catch (error) {
      console.error("Failed to fetch mail details:", error)
      toast({
        title: translate("mails.detail.errors.fetchFailed", language),
        description: translate("mails.detail.errors.tryAgain", language),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMailDetail()
  }, [loadMailDetail, mailId, mailType, language])

  const handleArchive = async () => {
    if (!hasArchiveAccess || !mail) return

    try {
      await archiveInternalMail(mail.id)
      toast({
        title: translate("mails.detail.success.mailArchived", language),
        description: translate("mails.detail.success.mailArchivedDescription", language),
      })
      router.push(`/dashboard/mails/${mailType}`)
    } catch (error) {
      console.error("Failed to archive mail:", error)
      toast({
        title: translate("mails.detail.errors.archiveFailed", language),
        description: translate("mails.detail.errors.tryAgain", language),
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "default"
      case "read":
        return "secondary"
      case "replied":
        return "secondary"
      case "forwarded":
        return "secondary"
      default:
        return "default"
    }
  }

  const renderStatus = () => (
    <Badge variant={getStatusBadgeVariant(mail?.status || "new")}>
      {translate(`mails.status.${mail?.status}`, language) || mail?.status}
    </Badge>
  )

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasReadAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{translate("mails.common.accessDenied", language)}</CardTitle>
            <p className="text-sm text-muted-foreground">{translate("mails.common.noPermission", language)}</p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!mail) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{translate("mails.common.notFound", language)}</CardTitle>
            <p className="text-sm text-muted-foreground">{translate("mails.detail.common.mailNotFound", language)}</p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/dashboard/mails/${mailType}`)}>
              {translate("mails.common.actions.backToList", language)}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/mails/${mailType}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {translate("mails.common.actions.back", language)}
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/mails/create?reply=${mail.id}`)}>
            <Reply className="mr-2 h-4 w-4" />
            {translate("mails.detail.actions.reply", language)}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/mails/create?forward=${mail.id}`)}>
            <Forward className="mr-2 h-4 w-4" />
            {translate("mails.detail.actions.forward", language)}
          </Button>
          {hasArchiveAccess && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              {translate("mails.detail.actions.archive", language)}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{mail.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={mail.sender?.avatar} alt={mail.sender?.full_name} />
                <AvatarFallback>{mail.sender?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{mail.sender?.full_name}</p>
                <p className="text-sm text-muted-foreground">{mail.sender?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{formatDate(mail.sent_time, language)}</p>
              {renderStatus()}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">{translate("mails.detail.fields.recipients", language)}:</h3>
            <div className="flex flex-wrap gap-2">
              {mail.recipients?.map((recipient, index) => (
                <Badge key={index} variant="outline">
                  {recipient.full_name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div dangerouslySetInnerHTML={{ __html: mail.content }} />
          </div>

          {mail.attachments && mail.attachments.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">{translate("mails.detail.fields.attachments", language)}:</h3>
              <ul className="list-disc pl-5">
                {mail.attachments.map((attachment, index) => (
                  <li key={index}>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {attachment.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

