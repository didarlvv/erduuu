"use client"

import type React from "react"

import { useCallback, useState, useEffect } from "react"
import { toast } from "sonner"
import { Upload, X, FileIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileWithPreview } from "@/types/files"

interface FileUploadProps {
  onFileSelect: (files: FileWithPreview[]) => void
  maxSize?: number // in bytes, default 5MB
  acceptedTypes?: string[] // e.g. ['image/jpeg', 'image/png']
  maxFiles?: number // maximum number of files, default 5
}

export function FileUpload({
  onFileSelect,
  maxSize = 5 * 1024 * 1024,
  acceptedTypes = ["image/jpeg", "image/png", "application/pdf"],
  maxFiles = 5,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [dragActive, setDragActive] = useState(false)

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [files])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `Файл ${file.name} слишком большой. Максимальный размер: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`
      }
      if (!acceptedTypes.includes(file.type)) {
        return `Файл ${file.name}: неподдерживаемый тип файла`
      }
      return null
    },
    [maxSize, acceptedTypes],
  )

  const processFiles = useCallback(
    (newFiles: File[]) => {
      if (files.length + newFiles.length > maxFiles) {
        toast.error(`Максимальное количество файлов: ${maxFiles}`)
        return
      }

      const validFiles: FileWithPreview[] = []
      const errors: string[] = []

      newFiles.forEach((file) => {
        const error = validateFile(file)
        if (error) {
          errors.push(error)
        } else {
          const fileWithPreview: FileWithPreview = Object.assign(file, {
            preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
            id: `${file.name}-${Date.now()}`,
          })
          validFiles.push(fileWithPreview)
        }
      })

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error))
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles])
        onFileSelect([...files, ...validFiles])
      }
    },
    [files, maxFiles, validateFile, onFileSelect],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length === 0) return

      processFiles(droppedFiles)
    },
    [processFiles],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      processFiles(selectedFiles)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const updatedFiles = prev.filter((f) => f.id !== fileId)
      onFileSelect(updatedFiles)
      return updatedFiles
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="w-full space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-lg border-2 border-dashed border-gray-300 p-6 transition-all",
          dragActive && "border-primary bg-primary/5",
          "hover:border-primary hover:bg-primary/5",
        )}
      >
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          disabled={files.length >= maxFiles}
          accept={acceptedTypes.join(",")}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          multiple
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <p className="text-sm text-gray-600">Перетащите файлы сюда или нажмите для выбора</p>
            <p className="mt-1 text-xs text-gray-500">
              {acceptedTypes
                .join(", ")
                .replace(/image\//g, "")
                .replace(/application\//g, "")}
            </p>
            <p className="mt-1 text-xs text-gray-500">Максимальный размер файла: {formatFileSize(maxSize)}</p>
            <p className="mt-1 text-xs text-gray-500">Максимальное количество файлов: {maxFiles}</p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="font-semibold">Выбранные файлы:</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileIcon className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Удалить файл"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

