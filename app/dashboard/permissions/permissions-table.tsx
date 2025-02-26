"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Shield } from "lucide-react"
import { usePermission } from "@/hooks/usePermission"
import type { Permission } from "@/types/permissions"
import { Skeleton } from "@/components/ui/skeleton"

interface PermissionsTableProps {
  permissions: Permission[]
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onSearch: (term: string) => void
  loading: boolean
  onEditPermission?: (permission: Permission) => void
}

export function PermissionsTable({
  permissions,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onSearch,
  loading,
  onEditPermission,
}: PermissionsTableProps) {
  const hasUpdatePermission = usePermission("manager.users.permissions.update")
  const totalPages = Math.ceil(total / pageSize)

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
              <TableHead>Название</TableHead>
              <TableHead>Идентификатор</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingSkeleton />
            ) : permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Разрешения не найдены
                </TableCell>
              </TableRow>
            ) : (
              permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    <Shield className="h-5 w-5 text-blue-500" />
                  </TableCell>
                  <TableCell className="font-medium">{permission.name}</TableCell>
                  <TableCell>{permission.slug}</TableCell>
                  <TableCell>{permission.id}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Открыть меню</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        {hasUpdatePermission && onEditPermission && (
                          <DropdownMenuItem onClick={() => onEditPermission(permission)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Редактировать</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Удалить</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Показано с {startRecord} по {endRecord} из {total} результатов
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            Предыдущая
          </Button>
          <div className="text-sm">
            Страница {currentPage} из {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            Следующая
          </Button>
        </div>
      </div>
    </div>
  )
}

