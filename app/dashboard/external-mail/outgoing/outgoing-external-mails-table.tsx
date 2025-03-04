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

interface OutgoingExternalMailsTableProps {
  mails: ExternalMail[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  hasNextPage: boolean;
}

export const OutgoingExternalMailsTable: React.FC<
  OutgoingExternalMailsTableProps
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
    if (diffDays > 5) return "bg-red-100 hover:bg-red-200";
    if (diffDays > 3) return "bg-yellow-100 hover:bg-yellow-200";
    return "";
  };

  const columns = [
    { key: "userInfo", header: translate("outgoingMails.userInfo", language) },
    { key: "title", header: translate("outgoingMails.subject", language) },
    {
      key: "description",
      header: translate("outgoingMails.description", language),
    },
    { key: "status", header: translate("outgoingMails.status", language) },
    { key: "sentTime", header: translate("outgoingMails.sentTime", language) },
    {
      key: "receivedTime",
      header: translate("outgoingMails.receivedTime", language),
    },
    {
      key: "registrationCodes",
      header: translate("outgoingMails.registrationCodes", language),
    },
    {
      key: "organization",
      header: translate("outgoingMails.organization", language),
    },
  ];

  const handleRowClick = (mailId: string) => {
    router.push(`/dashboard/external-mail/detail?id=${mailId}`);
  };

  const renderMailRow = (mail: ExternalMail) => (
    <TableRow
      key={mail.id}
      className={`hover:bg-muted/50 ${getRowColor(
        Number(mail.created_at)
      )} cursor-pointer`}
      onClick={() => handleRowClick(mail.id)}
    >
      <TableCell>
        <div className="font-medium">{mail.full_name}</div>
        <div className="text-xs text-muted-foreground">
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
            `outgoingMails.status${
              mail.status.charAt(0).toUpperCase() + mail.status.slice(1)
            }`,
            language
          )}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDateCompact(Number(mail.sent_time), language)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {mail?.received_time
          ? formatDateCompact(Number(mail.received_time), language)
          : "-"}
      </TableCell>
      <TableCell>
        <div className="text-xs">
          <span className="font-medium">
            {translate("common.external", language)}:{" "}
          </span>
          {mail.external_registration_code || "-"}
        </div>
        <div className="text-xs">
          <span className="font-medium">
            {translate("common.internal", language)}:{" "}
          </span>
          {mail.internal_registration_code}
        </div>
      </TableCell>
      <TableCell className="max-w-[150px] truncate">
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
            noDataFound: translate("outgoingMails.noMailsFound", language),
          }}
          className="border rounded-md text-sm"
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
