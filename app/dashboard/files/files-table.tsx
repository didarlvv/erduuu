"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText, Download, ChevronLeft, ChevronRight } from "lucide-react"
import type { File } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { downloadFile } from "@/lib/api"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations } from "./files.translations"

interface FilesTableProps {
  files: File[]
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onSearch: (term: string) => void
  loading: boolean
}

const translate = (key: string, language: string): string => {
  const keys = key.split(".")
  let translation: any = translations[language as keyof typeof translations]
  for (const k of keys) {
    if (translation[k] === undefined) {
      return key
    }
    translation = translation[k]
  }
  return translation
}

export function FilesTable({ files, total, currentPage, pageSize, onPageChange, loading }: FilesTableProps) {
  const { language } = useLanguage()

  const totalPages = Math.ceil(total / pageSize)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(language === "ru" ? "ru-RU" : language === "tk" ? "tk-TM" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleDownload = async (file: File) => {
    try {
      await downloadFile(file.id)
    } catch (error) {
      console.error("Error downloading file:", error)
      toast.error(translate("files.errorDownloading", language))
    }
  }

  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, total)

  const LoadingSkeleton = () => (
    <>
      {[...Array(pageSize)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-6 w-6" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[200px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[150px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[150px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>{translate("files.fileName", language)}</TableHead>
              <TableHead>{translate("files.originalName", language)}</TableHead>
              <TableHead>{translate("files.fileSize", language)}</TableHead>
              <TableHead>{translate("files.uploadDate", language)}</TableHead>
              <TableHead className="text-right">{translate("files.actions", language)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingSkeleton />
            ) : files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {translate("files.noFiles", language)}
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <FileText className="h-5 w-5 text-blue-500" />
                  </TableCell>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>{file.original_name}</TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>{formatDate(file.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(file)}
                      className="hover:text-blue-500"
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">{translate("files.download", language)}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate("files.showing", language)} {startRecord} {translate("files.to", language)} {endRecord}{" "}
          {translate("files.of", language)} {total} {translate("files.results", language)}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            {translate("files.page", language)} {currentPage} {translate("files.of", language)} {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

