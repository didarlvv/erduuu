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
import type { ExternalMail } from "@/lib/types"
import { useLanguage } from "@/contexts/LanguageContext"
import { translate } from "../external-mail.translations"
import Link from "next/link"
import { MoreHorizontal, Eye, Pencil } from "lucide-react"
import { formatDateCompact } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface OutgoingExternalMailsTableProps {
  mails: ExternalMail[]
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  loading: boolean
  hasNextPage: boolean
}

export const OutgoingExternalMailsTable: React.FC<OutgoingExternalMailsTableProps> = ({
  mails,
  total,
  currentPage,
  pageSize,
  onPageChange,
  loading,
  hasNextPage,
}) => {
  const { language } = useLanguage()
  const router = useRouter()

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "default"
      case "replied":
        return "secondary"
      case "progress":
        return "warning"
      case "answered":
        return "success"
      case "registered":
        return "info"
      default:
        return "default"
    }
  }

  const getRowColor = (createdAt: number) => {
    const now = Date.now()
    const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24)
    if (diffDays > 5) return "bg-red-100 hover:bg-red-200"
    if (diffDays > 3) return "bg-yellow-100 hover:bg-yellow-200"
    return ""
  }

  const columns = [
    { key: "userInfo", header: translate("outgoingMails.userInfo", language) },
    { key: "title", header: translate("outgoingMails.subject", language) },
    { key: "description", header: translate("outgoingMails.description", language) },
    { key: "status", header: translate("outgoingMails.status", language) },
    { key: "createdAt", header: translate("outgoingMails.createdAt", language) },
    { key: "sentTime", header: translate("outgoingMails.sentTime", language) },
    { key: "receivedTime", header: translate("outgoingMails.receivedTime", language) },
    { key: "externalRegistrationCode", header: translate("outgoingMails.externalRegistrationCode", language) },
    { key: "internalRegistrationCode", header: translate("outgoingMails.internalRegistrationCode", language) },
    { key: "organization", header: translate("outgoingMails.organization", language) },
    { key: "actions", header: translate("common.actions", language) },
  ]

  const handleRowClick = (mailId: string) => {
    router.push(`/dashboard/external-mail/detail?id=${mailId}`)
  }

  const renderMailRow = (mail: ExternalMail) => (
    <TableRow
      key={mail.id}
      className={`hover:bg-muted/50 ${getRowColor(Number(mail.created_at))} cursor-pointer`}
      onClick={() => handleRowClick(mail.id)}
    >
      <TableCell className="font-medium">
        <div>{mail.full_name}</div>
        <div className="text-sm text-muted-foreground">
          {mail.responsibility.names.find((n) => n.lang === language)?.name || mail.responsibility.slug}
        </div>
      </TableCell>
      <TableCell className="max-w-[200px] truncate">{mail.title}</TableCell>
      <TableCell className="max-w-[200px] truncate">{mail.description}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(mail.status)}>
          {translate(`outgoingMails.status${mail.status.charAt(0).toUpperCase() + mail.status.slice(1)}`, language)}
        </Badge>
      </TableCell>
      <TableCell>{formatDateCompact(Number(mail.created_at), language)}</TableCell>
      <TableCell>{formatDateCompact(Number(mail.sent_time), language)}</TableCell>
      <TableCell>{formatDateCompact(Number(mail.received_time), language)}</TableCell>
      <TableCell>{mail.external_registration_code || "-"}</TableCell>
      <TableCell>{mail.internal_registration_code}</TableCell>
      <TableCell>{mail.organization.names.find((n) => n.lang === language)?.name || mail.organization.slug}</TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{translate("common.openMenu", language)}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel>{translate("common.actions", language)}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/external-mail/detail?id=${mail.id}&type=outgoing`} className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                <span>{translate("common.view", language)}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/external-mail/detail?id=${mail.id}&mode=edit`} className="flex items-center">
                <Pencil className="mr-2 h-4 w-4" />
                <span>{translate("common.edit", language)}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <TableWrapper
          data={mails}
          columns={columns}
          loading={loading}
          renderRow={renderMailRow}
          translations={{
            loading: translate("common.loading", language),
            noDataFound: translate("outgoingMails.noMailsFound", language),
          }}
          className="border rounded-md"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate("common.showing", language)} {(currentPage - 1) * pageSize + 1} {translate("common.to", language)}{" "}
          {Math.min(currentPage * pageSize, total)} {translate("common.of", language)} {total}{" "}
          {translate("common.results", language)}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            {translate("common.previous", language)}
          </Button>
          <div className="text-sm">
            {translate("common.page", language)} {currentPage} {translate("common.of", language)}{" "}
            {Math.ceil(total / pageSize)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage || loading}
          >
            {translate("common.next", language)}
          </Button>
        </div>
      </div>
    </div>
  )
}

