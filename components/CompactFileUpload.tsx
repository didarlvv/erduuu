"use client";

import type React from "react";

import { useState, useRef } from "react";
import { FileIcon, Loader2 } from "lucide-react";
import { createAuthenticatedAxios } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface CompactFileUploadProps {
  onUploadSuccess: (fileIds: number[]) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  multiple?: boolean;
  className?: string;
}

interface UploadedFile {
  id: number;
  name: string;
  original_name: string;
  size: number;
}

export function CompactFileUpload({
  onUploadSuccess,
  onUploadStart,
  onUploadEnd,
  multiple = true,
  className,
}: CompactFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const api = createAuthenticatedAxios();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log("File change event triggered");
    const files = Array.from(event.target.files || []);
    if (files?.length) {
      await handleFiles(files);
    }
    event.target.value = ""; // Reset input
  };

  const handleFiles = async (files: File[]) => {
    console.log("Handling files:", files);
    if (!multiple && files.length > 1) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Можно загрузить только один файл",
      });
      return;
    }

    try {
      setIsUploading(true);
      onUploadStart();
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      console.log("Sending request to server");
      const response = await api.post("/manager/files", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Server response:", response.data);
      const newFiles: UploadedFile[] = response.data.payload.map(
        (file: any) => ({
          id: file.id,
          name: file.name,
          original_name: file.original_name,
          size: file.size,
        })
      );

      onUploadSuccess(newFiles.map((file) => file.id));

      toast({
        title: "Файлы загружены",
        description: `Успешно загружено файлов: ${newFiles.length}`,
      });
    } catch (error) {
      console.error("Ошибка загрузки файлов:", error);
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description:
          "Не удалось загрузить файлы. Пожалуйста, попробуйте снова.",
      });
    } finally {
      setIsUploading(false);
      onUploadEnd();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className={cn(
          "cursor-pointer",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileIcon className="h-4 w-4" />
        )}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        multiple={multiple}
        disabled={isUploading}
      />
    </div>
  );
}
