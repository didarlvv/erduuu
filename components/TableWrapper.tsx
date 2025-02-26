"use client"

import type { ReactNode } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TableWrapperProps<T> {
  data: T[]
  columns: { key: string; header: string }[]
  loading: boolean
  renderRow: (item: T) => ReactNode
  translations: Record<string, string>
}

export function TableWrapper<T>({ data, columns, loading, renderRow, translations }: TableWrapperProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                {translations.loading}
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                {translations.noDataFound}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => renderRow(item))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

