"use client";

import { CardFooter } from "@/components/ui/card";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { fetchInternalMailDetail, archiveInternalMail } from "@/lib/api";
import type {
  InternalMailDetail,
  InternalMailDetailResponse,
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Archive,
  Forward,
  Reply,
  FileIcon,
  Download,
  FileText,
  Image,
  Film,
  Music,
  ArchiveIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { mailTranslations } from "../mail.translations";
import { formatDate, formatFileSize } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const translate = (
  key: string,
  language: string,
  params: Record<string, string | number> = {}
): string => {
  const keys = key.split(".");
  let translation: any =
    mailTranslations[language as keyof typeof mailTranslations];
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key;
    }
    translation = translation[k];
  }
  if (typeof translation === "string") {
    return Object.entries(params).reduce(
      (str, [key, value]) =>
        str.replace(new RegExp(`{${key}}`, "g"), String(value)),
      translation
    );
  }
  return key;
};

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
      return <FileText className="h-6 w-6" />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return <Image className="h-6 w-6" />;
    case "mp4":
    case "avi":
    case "mov":
      return <Film className="h-6 w-6" />;
    case "mp3":
    case "wav":
      return <Music className="h-6 w-6" />;
    case "zip":
    case "rar":
      return <ArchiveIcon className="h-6 w-6" />;
    default:
      return <FileIcon className="h-6 w-6" />;
  }
};

export default function MailDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mailId = searchParams?.get("id");
  const { toast } = useToast();
  const { language } = useLanguage();
  const [mailDetail, setMailDetail] =
    useState<InternalMailDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasReadAccess = usePermission("manager.users.mails.readone");
  const hasArchiveAccess = usePermission("manager.users.mails.archive");

  const loadMailDetail = useCallback(async () => {
    if (!mailId) {
      console.error("Mail ID is missing");
      router.push("/dashboard/mails/inbox");
      return;
    }

    try {
      setIsLoading(true);
      const data = await fetchInternalMailDetail(Number(mailId), language);
      setMailDetail(data);
    } catch (error) {
      console.error("Failed to fetch mail details:", error);
      toast({
        title: translate("mails.detail.errors.fetchFailed", language),
        description: translate("mails.detail.errors.tryAgain", language),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [mailId, language, router, toast]);

  useEffect(() => {
    loadMailDetail();
  }, [loadMailDetail]);

  const handleArchive = async () => {
    if (!hasArchiveAccess || !mailDetail) return;

    try {
      await archiveInternalMail(mailDetail.payload.id);
      toast({
        title: translate("mails.detail.success.mailArchived", language),
        description: translate(
          "mails.detail.success.mailArchivedDescription",
          language
        ),
      });
      router.push("/dashboard/mails/inbox");
    } catch (error) {
      console.error("Failed to archive mail:", error);
      toast({
        title: translate("mails.detail.errors.archiveFailed", language),
        description: translate("mails.detail.errors.tryAgain", language),
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "bg-gray-100 text-gray-800";
      case "read":
        return "bg-blue-100 text-blue-800";
      case "replied":
        return "bg-green-100 text-green-800";
      case "forwarded":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderStatus = (status: string) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeVariant(
        status
      )}`}
    >
      {translate(`mails.status.${status}`, language) || status}
    </span>
  );

  const renderFiles = (files: InternalMailDetail["files"]) => (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file) => (
        <Card key={file.id} className="flex flex-col justify-between">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-4">
              {getFileIcon(file.name)}
            </div>
            <h3
              className="text-sm font-semibold text-center mb-2 truncate"
              title={file.name}
            >
              {file.name}
            </h3>
            <p className="text-xs text-muted-foreground text-center">
              {formatFileSize(file.size)}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-4">
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {translate("mails.detail.actions.download", language)}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const renderChildMails = (children: InternalMailDetail[]) => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="replies">
        <AccordionTrigger>
          {translate("mails.detail.fields.replies", language)} (
          {children.length})
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {children.map((child) => (
              <Card key={child.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{child.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {child.sender_fullname}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(child.sent_time, language)}
                  </div>
                </div>
                <p className="mt-2 text-sm">{child.description}</p>
              </Card>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
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
    );
  }

  if (!hasReadAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {translate("mails.common.accessDenied", language)}
            </CardTitle>
            <CardDescription>
              {translate("mails.common.noPermission", language)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!mailDetail) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {translate("mails.common.notFound", language)}
            </CardTitle>
            <CardDescription>
              {translate("mails.detail.common.mailNotFound", language)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/mails/inbox")}>
              {translate("mails.common.actions.backToList", language)}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mail = mailDetail;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/mails/inbox")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />{" "}
          {translate("mails.common.actions.back", language)}
        </Button>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/dashboard/mails/create?reply=${mail.id}`)
            }
          >
            <Reply className="mr-2 h-4 w-4" />
            {translate("mails.detail.actions.reply", language)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/dashboard/mails/create?forward=${mail.id}`)
            }
          >
            <Forward className="mr-2 h-4 w-4" />
            {translate("mails.detail.actions.forward", language)}
          </Button>
          {hasArchiveAccess && !mail.is_archived && (
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              {translate("mails.detail.actions.archive", language)}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {mail.sender_fullname.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{mail.title}</CardTitle>
                <CardDescription>
                  {mail.sender_fullname} (
                  {mail.sender.names.find((n) => n.lang === language)?.name ||
                    mail.sender.names[0]?.name}
                  )
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {formatDate(mail.sent_time, language)}
              </div>
              {renderStatus(mail.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="font-semibold">
              {translate("mails.detail.fields.recipients", language)}:
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
              {mail.receiver_fullname} (
              {mail.receiver.names.find((n) => n.lang === language)?.name ||
                mail.receiver.names[0]?.name}
              )
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="font-semibold">
              {translate("mails.detail.fields.mailType", language)}:
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
              {mail.mail_type.names.find((n) => n.lang === language)?.name ||
                mail.mail_type.names[0]?.name}
            </span>
          </div>

          <div className="text-sm">
            <h3 className="font-semibold mb-1">
              {translate("mails.detail.fields.description", language)}:
            </h3>
            <p>{mail.description}</p>
          </div>

          {mail.files && mail.files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                {translate("mails.detail.fields.attachments", language)}:
              </h3>
              {renderFiles(mail.files)}
            </div>
          )}

          {mail.children &&
            mail.children.length > 0 &&
            renderChildMails(mail.children)}
        </CardContent>
      </Card>
    </div>
  );
}
