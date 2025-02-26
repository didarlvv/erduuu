"use client"

import type React from "react"
import { TableWrapper } from "@/components/TableWrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { InternalMail } from "@/lib/types"
import Link from "next/link"
import { MoreHorizontal, Eye, Archive } from "lucide-react"
import { formatDateCompact } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface SentMailsTableProps {
  mails: InternalMail[]
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  loading: boolean
  hasNextPage: boolean
  translate: (key: string, language: string) => string
  language: string
}

export const SentMailsTable: React.FC<SentMailsTableProps> = ({
  mails,
  total,
  currentPage,
  pageSize,
  onPageChange,
  loading,
  hasNextPage,
  translate,
  language,
}) => {
  const router = useRouter()

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "default"
      case "read":
        return "secondary"
      case "replied":
        return "success"
      case "forwarded":
        return "warning"
      case "archived":
        return "outline"
      default:
        return "secondary"
    }
  }

  const columns = [
    { key: "receiver", header: translate("mails.receiver", language) },
    { key: "subject", header: translate("mails.subject", language) },
    { key: "status", header: translate("mails.status", language) },
    { key: "date", header: translate("mails.date", language) },
    { key: "actions", header: translate("common.actions", language) },
  ]

  const handleRowClick = (mailId: number) => {
    router.push(`/dashboard/mails/detail?id=${mailId}&type=sent`)
  }

  const renderMailRow = (mail: InternalMail) => (
    <TableRow key={mail.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleRowClick(mail.id)}>
      <TableCell className="font-medium">{mail.receiver_fullname}</TableCell>
      <TableCell>{mail.title}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(mail.status)}>
          {translate(`mails.status.${mail.status}`, language) || mail.status}
        </Badge>
      </TableCell>
      <TableCell>{formatDateCompact(Number(mail.created_at), language)}</TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{translate("common.actions", language)}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{translate("common.actions", language)}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/mails/detail?id=${mail.id}&type=sent`} className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                <span>{translate("common.view", language)}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Button onClick={() => handleArchive(mail.id)} className="flex items-center w-full">
                <Archive className="mr-2 h-4 w-4" />
                <span>{translate("mails.archive", language)}</span>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )

  const handleArchive = async (mailId: number) => {
    // Implement archive functionality
    console.log(`Archiving mail with id: ${mailId}`)
  }

  return (
    <div className="space-y-4">
      <TableWrapper
        data={mails}
        columns={columns}
        loading={loading}
        renderRow={renderMailRow}
        translations={{
          loading: translate("common.loading", language),
          noDataFound: translate("mails.noMails", language),
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          {translate("common.showingResults", language, {
            start: (currentPage - 1) * pageSize + 1,
            end: Math.min(currentPage * pageSize, total),
            total,
          })}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            {translate("common.previous", language)}
          </Button>
          <span>
            {translate("common.page", language, {
              current: currentPage,
              total: Math.ceil(total / pageSize),
            })}
          </span>
          <Button variant="outline" onClick={() => onPageChange(currentPage + 1)} disabled={!hasNextPage || loading}>
            {translate("common.next", language)}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SentMailsTable

