"use client"

import { CardFooter } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePermission } from "@/hooks/usePermission"
import { useResponsibilities } from "@/hooks/useResponsibilities"
import {
  fetchExternalMailDetail,
  proceedExternalMail,
  fetchResponsibilitiesWithPermissions,
  downloadFile,
} from "@/lib/api"
import type { ExternalMailDetail, ChatMessage, ResponsibilitiesResponse } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileText,
  User,
  Building2,
  Briefcase,
  Download,
  ArrowLeft,
  Send,
  PaperclipIcon,
  FileIcon,
  ImageIcon,
  FileVideoIcon,
  FileAudioIcon,
  FileSpreadsheetIcon,
  FileIcon as FilePresentationIcon,
  FileArchiveIcon,
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useSocket } from "@/hooks/useSocket"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { ErrorBoundary } from "react-error-boundary"
import { getUserData } from "@/lib/auth"
import { Checkbox } from "@/components/ui/checkbox"
import { translate } from "../external-mail.translations"
import { formatDate } from "@/lib/utils"

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() || ""
  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "svg":
      return <ImageIcon className="h-12 w-12 text-primary" />
    case "mp4":
    case "avi":
    case "mov":
    case "wmv":
      return <FileVideoIcon className="h-12 w-12 text-primary" />
    case "mp3":
    case "wav":
    case "ogg":
      return <FileAudioIcon className="h-12 w-12 text-primary" />
    case "xls":
    case "xlsx":
    case "csv":
      return <FileSpreadsheetIcon className="h-12 w-12 text-primary" />
    case "ppt":
    case "pptx":
      return <FilePresentationIcon className="h-12 w-12 text-primary" />
    case "zip":
    case "rar":
    case "7z":
      return <FileArchiveIcon className="h-12 w-12 text-primary" />
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
    default:
      return <FileIcon className="h-12 w-12 text-primary" />
  }
}

export default function ExternalMailDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mailType = searchParams.get("type") as "incoming" | "outgoing"
  const mailId = searchParams.get("id")
  const { language } = useLanguage()
  const [mail, setMail] = useState<ExternalMailDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState("")
  const [isProceeding, setIsProceeding] = useState(false)
  const { socket, isConnected, emitNewMessageToRoom } = useSocket()
  const [allUsers, setAllUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const userData = getUserData()
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const { responsibilities } = useResponsibilities()
  const currentResponsibilityId = responsibilities[0]?.id

  const hasAccess = usePermission(`manager.users.external-mail.readone`)
  const hasProceedPermission = usePermission(`manager.users.external-mails.proceed`)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "registered":
        return "default"
      case "in_progress":
        return "warning"
      case "completed":
        return "success"
      default:
        return "secondary"
    }
  }

  useEffect(() => {
    if (!mailId || !mailType) {
      console.error("Mail ID or type is missing")
      router.push("/dashboard")
      return
    }

    async function loadMail() {
      try {
        setIsLoading(true)
        const data = await fetchExternalMailDetail(Number(mailId), language, mailType)
        setMail(data)
      } catch (error) {
        console.error("Error loading mail:", error)
        setMail(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (hasAccess) {
      loadMail()
    } else {
      setIsLoading(false)
    }
  }, [mailId, mailType, hasAccess, router, language])

  useEffect(() => {
    async function loadUsers() {
      if (!currentResponsibilityId) return
      try {
        const response: ResponsibilitiesResponse = await fetchResponsibilitiesWithPermissions({
          skip: currentPage,
          limit: pageSize,
          order_direction: "DESC",
          order_by: "id",
          search: searchTerm,
          current_responsibility_id: currentResponsibilityId,
          lang: language,
        })
        setAllUsers(response.payload ?? [])
        setTotal(response.payload?.length ?? 0)
      } catch (error) {
        console.error("Error loading users:", error)
      }
    }

    loadUsers()
  }, [currentPage, searchTerm, language, currentResponsibilityId])

  useEffect(() => {
    if (isConnected && mail) {
      socket?.emit("roomMessages", {
        reference: mail.type,
        mail_id: mail.id,
      })
    }
  }, [isConnected, socket, mail])

  useEffect(() => {
    if (!socket) return

    const handleRoomMessage = (data: ChatMessage | ChatMessage[]) => {
      console.log("Received new message:", data)
      if (Array.isArray(data)) {
        setChatMessages((prev) => [...prev, ...data])
      } else {
        setChatMessages((prev) => [...prev, data])
      }
    }

    socket.on("roomMessage", handleRoomMessage)

    return () => {
      socket.off("roomMessage", handleRoomMessage)
    }
  }, [socket])

  const handleProceed = async () => {
    if (!mailId) return
    try {
      setIsProceeding(true)
      await proceedExternalMail(Number(mailId), mailType)
      console.log("Mail proceeded successfully")
      router.refresh()
    } catch (error) {
      console.error("Error proceeding mail:", error)
    } finally {
      setIsProceeding(false)
    }
  }

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleSendMessage = () => {
    if (messageText.trim() && mail) {
      socket?.emit("newMessageToRoom", {
        payload: messageText,
        member_ids: selectedUsers,
        reference: "external",
        mail_id: mail.id,
      })
      setMessageText("")
      setSelectedUsers([]) // Clear selection after sending
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{translate("detail.accessDenied", language)}</CardTitle>
            <p className="text-sm text-muted-foreground">{translate("detail.noPermission", language)}</p>
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
            <CardTitle>{translate("detail.notFound", language)}</CardTitle>
            <p className="text-sm text-muted-foreground">{translate("detail.notFoundDescription", language)}</p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/dashboard/external-mail/${mailType}`)}>
              {translate("detail.backToList", language)}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentResponsibilityId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{translate("detail.noResponsibilities.ru", language)}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {translate("detail.noResponsibilitiesDescription.ru", language)}
            </p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/external-mail/${mailType}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {translate("detail.backToList", language)}
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(mail.status)}>
            {translate(`detail.status.${mail.status}`, language)}
          </Badge>
          {hasProceedPermission && (
            <Button variant="default" size="sm" onClick={handleProceed} disabled={isProceeding}>
              {isProceeding ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {translate("detail.proceeding", language)}
                </div>
              ) : (
                translate("detail.proceed", language)
              )}
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{mail.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{mail.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {mailType === "incoming"
                  ? translate("detail.receivedDate", language)
                  : translate("detail.sentDate", language)}
                :
              </p>
              <p className="text-lg font-bold">{formatDate(Number(mail.received_time || mail.sent_time), language)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {mailType === "incoming"
                    ? translate("detail.sender", language)
                    : translate("detail.recipient", language)}
                  :
                </span>
                <span>
                  {mail.first_name} {mail.last_name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{translate("detail.organization", language)}:</span>
                <span>{mail.organization.names.find((n) => n.lang === language)?.name || mail.organization.slug}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{translate("detail.position", language)}:</span>
                <span>
                  {mail.responsibility.names.find((n) => n.lang === language)?.name || mail.responsibility.slug}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{translate("detail.externalCode", language)}:</span>
                <span>{mail.external_registration_code}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-muted-foreground" />

                <span className="font-medium">{translate("detail.internalCode", language)}:</span>
                <span>{mail.internal_registration_code}</span>
              </div>
            </div>
          </div>

          {mail.files && mail.files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">{translate("detail.attachedFiles", language)}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mail.files.map((file) => (
                  <Card key={file.id} className="flex flex-col justify-between">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center mb-4">{getFileIcon(file.original_name)}</div>
                      <h4 className="font-medium text-center mb-2 truncate" title={file.original_name}>
                        {file.original_name}
                      </h4>
                      <p className="text-sm text-center text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-6">
                      <Button variant="outline" size="sm" onClick={() => downloadFile(file.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        {translate("detail.download", language)}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-24rem)]">
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="bg-muted">
            <CardTitle>{translate("detail.chat", language)}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-grow flex flex-col">
            <ErrorBoundary
              fallback={<div className="p-4">There was an error loading the chat. Please try again later.</div>}
            >
              <ScrollArea className="flex-grow p-4">
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`mb-4 flex ${msg.creator_id === userData?.id ? "justify-end" : "justify-start"}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg shadow ${
                        msg.creator_id === userData?.id ? "bg-primary text-primary-foreground" : "bg-secondary"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{msg.fullname}</span>
                        <span className="text-xs opacity-70">{formatDate(Number(msg.created_at), language)}</span>
                      </div>
                      <p className="text-sm break-words">{msg.payload}</p>
                      {msg.files && msg.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.files.map((file, index) => (
                            <div key={index} className="text-xs text-blue-500 underline flex items-center">
                              <PaperclipIcon className="h-3 w-3 mr-1" />
                              {file.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </ScrollArea>
              <div className="p-4 border-t bg-background">
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={translate("detail.typeMessage", language)}
                    className="flex-grow"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">{translate("detail.sendMessage", language)}</span>
                  </Button>
                </div>
                {selectedUsers.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {translate("detail.selectedUsers", language)}: {selectedUsers.length}
                  </div>
                )}
              </div>
            </ErrorBoundary>
          </CardContent>
        </Card>
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-muted">
            <CardTitle>{translate("detail.users", language)}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            <ScrollArea className="h-[calc(100vh-36rem)]">
              <div className="p-4 space-y-4">
                {allUsers.map((userResp) => (
                  <motion.div
                    key={userResp.id}
                    className="flex items-center p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleUserSelection(userResp.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(userResp.id)}
                      onCheckedChange={() => toggleUserSelection(userResp.id)}
                      className="mr-2"
                    />
                    <Avatar className="mr-3">
                      <AvatarImage
                        src={`https://api.dicebear.com/6.x/initials/svg?seed=${userResp.user.first_name} ${userResp.user.last_name}`}
                      />
                      <AvatarFallback>
                        {userResp.user.first_name?.[0]}
                        {userResp.user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium block">
                        {userResp.user.first_name} {userResp.user.last_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {userResp.names.find((n) => n.lang === language)?.name || userResp.slug}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

