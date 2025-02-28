"use client";

import type React from "react";
import { TableWrapper } from "@/components/TableWrapper";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ExternalMail } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "../external-mail.translations";
import { formatDateCompact } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface IncomingExternalMailsTableProps {
  mails: ExternalMail[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  hasNextPage: boolean;
}

export const IncomingExternalMailsTable: React.FC<
  IncomingExternalMailsTableProps
> = ({
  mails,
  total,
  currentPage,
  pageSize,
  onPageChange,
  loading,
  hasNextPage,
}) => {
  const { language } = useLanguage();
  const router = useRouter();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "proceeded":
        return "bg-green-100 text-green-800";
      case "registered":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRowColor = (createdAt: number) => {
    const now = Date.now();
    const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
    if (diffDays > 5)
      return "bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800";
    if (diffDays > 3)
      return "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800";
    return "";
  };

  const columns = [
    { key: "userInfo", header: translate("incomingMails.userInfo", language) },
    { key: "title", header: translate("incomingMails.subject", language) },
    {
      key: "description",
      header: translate("incomingMails.description", language),
    },
    { key: "status", header: translate("incomingMails.status", language) },
    { key: "sentTime", header: translate("incomingMails.sentTime", language) },
    {
      key: "receivedTime",
      header: translate("incomingMails.receivedTime", language),
    },
    {
      key: "registrationCodes",
      header: translate("incomingMails.registrationCodes", language),
    },
    {
      key: "organization",
      header: translate("incomingMails.organization", language),
    },
  ];

  const handleRowClick = (mailId: string) => {
    router.push(`/dashboard/external-mail/detail?id=${mailId}&type=incoming`);
  };

  const renderMailRow = (mail: ExternalMail) => (
    <TableRow
      key={mail.id}
      className={`hover:bg-muted/50 ${getRowColor(
        Number(mail.created_at)
      )} cursor-pointer`}
      onClick={() => handleRowClick(mail.id)}
    >
      <TableCell className="font-medium">
        <div>{mail.full_name}</div>
        <div className="text-sm text-muted-foreground">
          {mail.responsibility.names.find((n) => n.lang === language)?.name ||
            mail.responsibility.slug}
        </div>
      </TableCell>
      <TableCell className="max-w-[200px] truncate">{mail.title}</TableCell>
      <TableCell className="max-w-[200px] truncate">
        {mail.description}
      </TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeVariant(
            mail.status
          )}`}
        >
          {translate(
            `incomingMails.status${
              mail.status.charAt(0).toUpperCase() + mail.status.slice(1)
            }`,
            language
          )}
        </span>
      </TableCell>
      <TableCell>
        {formatDateCompact(Number(mail.sent_time), language)}
      </TableCell>
      <TableCell>
        {formatDateCompact(Number(mail.received_time), language)}
      </TableCell>
      <TableCell>
        <div>
          <span className="font-medium">
            {translate("common.external", language)}:{" "}
          </span>
          {mail.external_registration_code || "-"}
        </div>
        <div>
          <span className="font-medium">
            {translate("common.internal", language)}:{" "}
          </span>
          {mail.internal_registration_code}
        </div>
      </TableCell>
      <TableCell>
        {mail.organization.names.find((n) => n.lang === language)?.name ||
          mail.organization.slug}
      </TableCell>
    </TableRow>
  );

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
            noDataFound: translate("incomingMails.noMailsFound", language),
          }}
          className="border rounded-md"
        />
      </div>

      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          {translate("common.previous", language)}
        </Button>
        <span className="text-sm font-medium">
          {translate("common.page", language)} {currentPage}
        </span>
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
  );
};
