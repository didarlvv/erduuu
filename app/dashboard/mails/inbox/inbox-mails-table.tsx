"use client";

import type React from "react";
import { TableWrapper } from "@/components/TableWrapper";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { InternalMail } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InboxMailsTableProps {
  mails: InternalMail[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  hasNextPage: boolean;
  translate: (key: string, language: string) => string;
  language: string;
}

export const InboxMailsTable: React.FC<InboxMailsTableProps> = ({
  mails,
  currentPage,
  pageSize,
  onPageChange,
  loading,
  hasNextPage,
  translate,
  language,
}) => {
  const router = useRouter();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "progress":
        return "bg-yellow-100 text-yellow-800";
      case "answered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "sender", header: translate("mails.sender", language) },
    { key: "title", header: translate("mails.subject", language) },
    { key: "description", header: translate("mails.description", language) },
    { key: "status", header: translate("mails.tableStatus", language) },
    { key: "sent_time", header: translate("mails.sentTime", language) },
    { key: "created_at", header: translate("mails.createdAt", language) },
    { key: "viewed_at", header: translate("mails.viewedAt", language) },
  ];

  const handleRowClick = (mailId: number) => {
    router.push(`/dashboard/mails/detail?id=${mailId}&type=inbox`);
  };

  const renderMailRow = (mail: InternalMail) => (
    <TableRow
      key={mail.id}
      className="hover:bg-muted/50 cursor-pointer"
      onClick={() => handleRowClick(mail.id)}
    >
      <TableCell>{mail.id}</TableCell>
      <TableCell className="font-medium">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>{mail.sender_fullname}</TooltipTrigger>
            <TooltipContent>
              {mail.sender_name
                .map((name) => `${name.lang}: ${name.name}`)
                .join(", ")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>{mail.title}</TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="max-w-xs truncate">
              {mail.description}
            </TooltipTrigger>
            <TooltipContent>{mail.description}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={getStatusBadgeVariant(mail.status)}>
          {translate(`mails.status.${mail.status}`, language) || mail.status}
        </Badge>
      </TableCell>
      <TableCell>{formatDateTime(Number(mail.sent_time), language)}</TableCell>
      <TableCell>{formatDateTime(Number(mail.created_at), language)}</TableCell>
      <TableCell>
        {mail.viewed_at !== "0"
          ? formatDateTime(Number(mail.viewed_at), language)
          : translate("mails.notViewed", language)}
      </TableCell>
    </TableRow>
  );

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

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          {translate("common.previous", language)}
        </Button>
        <span>
          {translate("common.currentPage", language, { current: currentPage })}
        </span>
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || loading}
        >
          {translate("common.next", language)}
        </Button>
      </div>
    </div>
  );
};

export default InboxMailsTable;
