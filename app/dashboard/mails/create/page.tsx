"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SearchableMailTypeSelect } from "@/components/SearchableMailTypeSelect";
import { FileUpload } from "@/components/FileUpload";
import { createInternalMail } from "@/lib/api";
import { createAuthenticatedAxios } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { Mail, ArrowLeft } from "lucide-react";
import type { FileResponse } from "@/lib/types";
import { usePermission } from "@/hooks/usePermission";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomMultiSelect } from "@/components/ui/custom-multi-select";
import { mailTranslations } from "../mail.translations";

interface Responsibility {
  id: number;
  to_send_all: boolean;
  to_read_all: boolean;
  slug: string;
  names: {
    id: number;
    name: string;
    lang: string;
  }[];
}

interface AvailableReceiver {
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
  id: number;
  to_send_all: boolean;
  to_read_all: boolean;
  slug: string;
  names: {
    id: number;
    name: string;
    lang: string;
  }[];
}

interface CreateMailFormData {
  title: string;
  description: string;
  code: string;
  sender_id: number;
  receiver_ids: number[];
  mail_type_id: number;
  file_ids: number[];
  status: string;
}

export default function CreateMailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const hasCreateAccess = usePermission("manager.users.mails.create");
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>(
    []
  );
  const [availableReceivers, setAvailableReceivers] = useState<
    AvailableReceiver[]
  >([]);
  const [isLoadingResponsibilities, setIsLoadingResponsibilities] =
    useState(true);
  const [isLoadingReceivers, setIsLoadingReceivers] = useState(false);
  const [formData, setFormData] = useState<CreateMailFormData>({
    title: "",
    description: "",
    code: "",
    sender_id: 0,
    receiver_ids: [],
    mail_type_id: 0,
    file_ids: [],
    status: "new",
  });
  const [date, setDate] = useState<Date>(new Date());

  const translate = useCallback((key: string, language: string) => {
    const keys = key.split(".");
    return keys.reduce(
      (obj, key) => obj[key as keyof typeof obj] ?? key,
      mailTranslations[language as keyof typeof mailTranslations]
    ) as string;
  }, []);

  const fetchAvailableReceivers = useCallback(
    async (responsibilityId: number) => {
      setIsLoadingReceivers(true);
      try {
        const api = createAuthenticatedAxios();
        console.log(responsibilityId);
        const response = await api.get(
          "/responsibilities/client/send/permissions",
          {
            params: {
              current_responsibility_id: responsibilityId,
              skip: 1,
              limit: 100,
              order_direction: "DESC",
              order_by: "id",
            },
          }
        );
        setAvailableReceivers(response.data.payload);
      } catch (error) {
        console.error("Error fetching available receivers:", error);
        toast({
          variant: "destructive",
          title: translate("mails.create.createError", language),
          description: translate(
            "mails.create.errors.fetchReceiversError",
            language
          ),
        });
      } finally {
        setIsLoadingReceivers(false);
      }
    },
    [language, toast, translate]
  );

  useEffect(() => {
    const fetchResponsibilities = async () => {
      try {
        const api = createAuthenticatedAxios();
        const response = await api.get("/responsibilities/clients");
        const responsibilities = response.data.payload;
        console.log(response);

        setResponsibilities(responsibilities);

        if (responsibilities.length === 1) {
          const responsibility = responsibilities[0];
          setFormData((prev) => ({
            ...prev,
            sender_id: responsibility.id,
          }));
          await fetchAvailableReceivers(responsibility.id);
        }
      } catch (error) {
        console.error("Error fetching responsibilities:", error);
        toast({
          variant: "destructive",
          title: translate("mails.create.createError", language),
          description: translate("responsibilities.fetchError", language),
        });
      } finally {
        setIsLoadingResponsibilities(false);
      }
    };

    fetchResponsibilities();
  }, [toast, translate, language, fetchAvailableReceivers]);

  const handleResponsibilityChange = async (responsibilityId: string) => {
    const id = Number.parseInt(responsibilityId);
    setFormData((prev) => ({ ...prev, sender_id: id, receiver_ids: [] }));
    await fetchAvailableReceivers(id);
  };

  if (!hasCreateAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {translate("mails.create.accessDenied", language)}
            </CardTitle>
            <CardDescription>
              {translate("mails.create.noPermission", language)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.title.trim()) {
        throw new Error(
          translate("mails.create.errors.titleRequired", language)
        );
      }
      if (!formData.description.trim()) {
        throw new Error(
          translate("mails.create.errors.descriptionRequired", language)
        );
      }
      if (!formData.code.trim()) {
        throw new Error(
          translate("mails.create.errors.codeRequired", language)
        );
      }
      if (!formData.sender_id) {
        throw new Error(
          translate("mails.create.errors.senderRequired", language)
        );
      }
      if (formData.receiver_ids.length === 0) {
        throw new Error(
          translate("mails.create.errors.receiverRequired", language)
        );
      }
      if (!formData.mail_type_id) {
        throw new Error(
          translate("mails.create.errors.mailTypeRequired", language)
        );
      }
      if (!date) {
        throw new Error(
          translate("mails.create.errors.dateRequired", language)
        );
      }

      await createInternalMail({
        ...formData,
        sent_time: date.getTime(),
        status: "new",
        parent_id: 0,
      });

      toast({
        title: translate("mails.create.createSuccess", language),
        description: translate(
          "mails.create.createSuccessDescription",
          language
        ),
      });
      router.push("/dashboard/mails/sent");
    } catch (error) {
      console.error("Error creating mail:", error);
      toast({
        variant: "destructive",
        title: translate("mails.create.createError", language),
        description:
          error instanceof Error
            ? error.message
            : translate("mails.create.createErrorDescription", language),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploadSuccess = (files: FileResponse[]) => {
    setFormData((prev) => ({
      ...prev,
      file_ids: files,
    }));
  };

  const getLocalizedName = (names: { name: string; lang: string }[]) => {
    return names.find((n) => n.lang === language)?.name || names[0]?.name;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/mails/sent")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {translate("mails.create.backToList", language)}
          </Button>
          <h1 className="text-2xl font-semibold text-gray-800">
            {translate("mails.create.title", language)}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {translate("mails.create.createFormTitle", language)}
          </CardTitle>
          <CardDescription>
            {translate("mails.create.createFormDescription", language)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {translate("mails.create.responsibility", language)}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.sender_id.toString()}
                onValueChange={handleResponsibilityChange}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={translate(
                      "mails.create.selectResponsibility",
                      language
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {responsibilities.map((responsibility) => (
                    <SelectItem
                      key={responsibility.id}
                      value={responsibility.id.toString()}
                    >
                      {getLocalizedName(responsibility.names)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.sender_id !== 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {translate("mails.create.receivers", language)}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <CustomMultiSelect
                  options={availableReceivers.map((receiver) => ({
                    value: receiver.user.id.toString(),
                    label: `${receiver.user.first_name} ${receiver.user.last_name}`,
                  }))}
                  value={formData.receiver_ids.map(String)}
                  onChange={(selectedIds) =>
                    setFormData((prev) => ({
                      ...prev,
                      receiver_ids: selectedIds.map(Number),
                    }))
                  }
                  placeholder={translate(
                    "mails.create.selectReceivers",
                    language
                  )}
                  disabled={isLoadingReceivers}
                />
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  {translate("mails.create.title", language)}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder={translate(
                    "mails.create.titlePlaceholder",
                    language
                  )}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  {translate("mails.create.code", language)}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder={translate(
                    "mails.create.codePlaceholder",
                    language
                  )}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                {translate("mails.create.description", language)}{" "}
                <span className="text-red-500">*</span>
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
                placeholder={translate(
                  "mails.create.descriptionPlaceholder",
                  language
                )}
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {translate("mails.create.sendDate", language)}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP")
                    ) : (
                      <span>
                        {translate("mails.create.selectDate", language)}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => setDate(newDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {translate("mails.create.mailType", language)}{" "}
                <span className="text-red-500">*</span>
              </label>
              <SearchableMailTypeSelect
                onSelect={(id) =>
                  setFormData((prev) => ({ ...prev, mail_type_id: id || 0 }))
                }
                language={language}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {translate("mails.create.attachments", language)}
              </label>
              <FileUpload
                onUploadSuccess={handleFileUploadSuccess}
                maxSize={10 * 1024 * 1024}
                acceptedTypes={["image/jpeg", "image/png", "application/pdf"]}
                maxFiles={5}
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/mails/sent")}
                disabled={isLoading || isLoadingResponsibilities}
              >
                {translate("mails.create.cancel", language)}
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading || isLoadingResponsibilities || isLoadingReceivers
                }
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 animate-spin" />
                    {translate("mails.create.creating", language)}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {translate("mails.create.create", language)}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
