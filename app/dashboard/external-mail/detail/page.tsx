"use client";

import { CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { useResponsibilities } from "@/hooks/useResponsibilities";
import { useSocket } from "@/hooks/useSocket";
import {
  fetchExternalMailDetail,
  proceedExternalMail,
  downloadFile,
  archiveExternalMail,
} from "@/lib/api";
import type { ExternalMailDetail } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  User,
  Building2,
  Briefcase,
  Download,
  ArrowLeft,
  FileIcon,
  ImageIcon,
  FileVideoIcon,
  FileAudioIcon,
  FileSpreadsheetIcon,
  FileIcon as FilePresentationIcon,
  FileArchiveIcon,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "../external-mail.translations";
import { formatDate } from "@/lib/utils";
import { ExternalMailChat } from "@/components/ExternalMailChat";

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "svg":
      return <ImageIcon className="h-12 w-12 text-primary" />;
    case "mp4":
    case "avi":
    case "mov":
    case "wmv":
      return <FileVideoIcon className="h-12 w-12 text-primary" />;
    case "mp3":
    case "wav":
    case "ogg":
      return <FileAudioIcon className="h-12 w-12 text-primary" />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FileSpreadsheetIcon className="h-12 w-12 text-primary" />;
    case "ppt":
    case "pptx":
      return <FilePresentationIcon className="h-12 w-12 text-primary" />;
    case "zip":
    case "rar":
    case "7z":
      return <FileArchiveIcon className="h-12 w-12 text-primary" />;
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
    default:
      return <FileIcon className="h-12 w-12 text-primary" />;
  }
};

export default function ExternalMailDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mailId = searchParams.get("id");
  const { language } = useLanguage();
  const [mail, setMail] = useState<ExternalMailDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProceeding, setIsProceeding] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const { responsibilities } = useResponsibilities();
  const currentResponsibilityId = responsibilities[0];
  const { isConnected } = useSocket();

  const hasAccess = usePermission(`manager.users.external-mail.readone`);
  const hasProceedPermission = usePermission(
    `manager.users.external-mails.proceed`
  );
  const hasArchivePermission = true;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "registered":
        return "bg-blue-100 text-blue-800";
      case "proceeded":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    if (!mailId) {
      console.error("Mail ID is missing");
      router.push("/dashboard");
      return;
    }

    async function loadMail() {
      try {
        setIsLoading(true);
        const data = await fetchExternalMailDetail(Number(mailId), language);
        setMail(data);
      } catch (error) {
        console.error("Error loading mail:", error);
        setMail(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (hasAccess) {
      loadMail();
    } else {
      setIsLoading(false);
    }
  }, [mailId, hasAccess, router, language]);

  const handleProceed = async () => {
    if (!mailId) return;
    try {
      setIsProceeding(true);
      await proceedExternalMail(Number(mailId));
      console.log("Mail proceeded successfully");
      router.refresh();
    } catch (error) {
      console.error("Error proceeding mail:", error);
    } finally {
      setIsProceeding(false);
    }
  };

  const handleArchive = async () => {
    if (!mailId) return;
    try {
      setIsArchiving(true);
      await archiveExternalMail(Number(mailId));
      console.log("Mail archived successfully");
      router.refresh();
    } catch (error) {
      console.error("Error archiving mail:", error);
    } finally {
      setIsArchiving(false);
    }
  };

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
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{translate("detail.accessDenied", language)}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {translate("detail.noPermission", language)}
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!mail) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{translate("detail.notFound", language)}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {translate("detail.notFoundDescription", language)}
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                const mailType =
                  mail?.type === "inbox" ? "incoming" : "outgoing";
                router.push(`/dashboard/external-mail/${mailType}`);
              }}
            >
              {translate("detail.backToList", language)}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentResponsibilityId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {translate("detail.noResponsibilities", language)}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {translate("detail.noResponsibilitiesDescription", language)}
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="fixed top-4 right-4 z-50">
        {isConnected ? (
          <Badge variant="secondary" className="gap-1">
            <Wifi className="h-3 w-3" />
            {translate("detail.connected", language)}
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="gap-1 bg-yellow-100 text-yellow-700"
          >
            <WifiOff className="h-3 w-3" />
            {translate("detail.reconnecting", language)}
          </Badge>
        )}
      </div>
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (mail?.type === "inbox") {
              router.push("/dashboard/external-mail/incoming");
            } else if (mail?.type === "outbox") {
              router.push("/dashboard/external-mail/outgoing");
            } else {
              router.push("/dashboard/external-mail");
            }
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />{" "}
          {translate("detail.backToList", language)}
        </Button>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeVariant(
              mail?.status || ""
            )}`}
          >
            {translate(`detail.status.${mail?.status || ""}`, language)}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              mail?.is_archived
                ? "bg-blue-100 text-gray-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {mail?.is_archived
              ? translate("detail.isArchived", language)
              : translate("detail.notArchived", language)}
          </span>
          {hasProceedPermission && mail?.status !== "proceeded" && (
            <Button
              variant="default"
              size="sm"
              onClick={handleProceed}
              disabled={isProceeding}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
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
          {hasArchivePermission && !mail?.is_archived && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleArchive}
              disabled={isArchiving}
              className="bg-blue-600 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              {isArchiving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {translate("detail.archiving", language)}
                </div>
              ) : (
                translate("detail.archive", language)
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
              <p className="text-sm text-muted-foreground mt-1">
                {mail.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {mail.type === "inbox"
                  ? translate("detail.receivedDate", language)
                  : translate("detail.sentDate", language)}
                :
              </p>
              <p className="text-lg font-bold">
                {formatDate(
                  Number(mail.received_time || mail.sent_time),
                  language
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {mail.type === "inbox"
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
                <span className="font-medium">
                  {translate("detail.organization", language)}:
                </span>
                <span>
                  {mail.organization.names.find((n) => n.lang === language)
                    ?.name || mail.organization.slug}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {translate("detail.position", language)}:
                </span>
                <span>
                  {mail.responsibility.names.find((n) => n.lang === language)
                    ?.name || mail.responsibility.slug}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {translate("detail.mailType", language)}:
                </span>
                <span>
                  {mail.mail_type?.names.find((n) => n.lang === language)
                    ?.name || mail.mail_type?.slug}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {translate("detail.externalCode", language)}:
                </span>
                <span>{mail.external_registration_code}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-muted-foreground" />

                <span className="font-medium">
                  {translate("detail.internalCode", language)}:
                </span>
                <span>{mail.internal_registration_code}</span>
              </div>
            </div>
          </div>

          {mail.files && mail.files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">
                {translate("detail.attachedFiles", language)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mail.files.map((file) => (
                  <Card key={file.id} className="flex flex-col justify-between">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center mb-4">
                        {getFileIcon(file.original_name)}
                      </div>
                      <h4
                        className="font-medium text-center mb-2 truncate"
                        title={file.original_name}
                      >
                        {file.original_name}
                      </h4>
                      <p className="text-sm text-center text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadFile(file.id, file.original_name)
                        }
                      >
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

      {mail.type === "inbox" ? (
        <ExternalMailChat
          mail={mail}
          currentResponsibilityId={currentResponsibilityId}
          isDisabled={mail.status === "proceeded"}
        />
      ) : null}
    </div>
  );
}
