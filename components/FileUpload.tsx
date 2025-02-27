"use client";

import type * as React from "react";
import { useCallback, useState } from "react";
import { Upload, X, FileIcon, AlertCircle, Loader2 } from "lucide-react";
import { createAuthenticatedAxios } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProps {
  onUploadSuccess: (fileIds: number[]) => void;
  value?: number[];
  multiple?: boolean;
  required?: boolean;
  className?: string;
}

interface UploadedFile {
  id: number;
  name: string;
  original_name: string;
  size: number;
  path?: string;
  created_at?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}

export function FileUpload({
  onUploadSuccess,
  value = [],
  multiple = true,
  required = false,
  className,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const api = createAuthenticatedAxios();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files?.length) {
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    if (!multiple && files.length > 1) {
      setError("Можно загрузить только один файл");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await api.post("/manager/files", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newFiles: UploadedFile[] = response.data.payload.map(
        (file: any) => ({
          id: file.id,
          name: file.name,
          original_name: file.original_name,
          size: file.size,
          path: file.path,
          created_at: file.created_at,
        })
      );

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      onUploadSuccess(newFiles.map((file) => file.id));

      toast({
        title: "Файлы загружены",
        description: `Успешно загружено файлов: ${newFiles.length}`,
      });
    } catch (error) {
      console.error("Ошибка загрузки файлов:", error);
      setError("Не удалось загрузить файлы. Пожалуйста, попробуйте снова.");
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description:
          "Не удалось загрузить файлы. Пожалуйста, попробуйте снова.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files?.length) {
      handleFiles(files);
    }
    event.target.value = ""; // Reset input
  };

  const removeFile = (fileId: number) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    onUploadSuccess(
      uploadedFiles.filter((file) => file.id !== fileId).map((file) => file.id)
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragEnter={handleDrag}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          multiple={multiple}
          disabled={isUploading}
          required={required && uploadedFiles.length === 0}
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">
                Загрузка файлов...
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Перетащите файлы сюда или нажмите для выбора
                {required && <span className="text-destructive">*</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {multiple
                  ? "Можно загрузить несколько файлов"
                  : "Можно загрузить только один файл"}
              </p>
            </>
          )}
        </label>
        {dragActive && (
          <div
            className="absolute inset-0 rounded-lg"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          />
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-8 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {file.original_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                      {file.name.split(".").pop() &&
                        ` • ${file.name.split(".").pop()?.toUpperCase()}`}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
