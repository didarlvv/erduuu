"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "./role.translations";
import { createRole, fetchPermissions } from "@/lib/api";
import { SearchablePermissionSelect } from "@/components/SearchablePermissionSelect";
import type { CreateRoleDrawerProps, Permission } from "@/lib/types";

export function CreateRoleDrawer({
  open,
  onOpenChange,
  onSuccess,
}: CreateRoleDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    permission_ids: [] as number[],
  });
  const { toast } = useToast();
  const { language } = useLanguage();

  useEffect(() => {
    if (open) {
      loadPermissions();
    }
  }, [open]);

  const loadPermissions = async () => {
    try {
      const response = await fetchPermissions({
        skip: 1,
        limit: 1000,
        // lang: language,
        order_by: "id",
        order_direction: "ASC",
      });
      setPermissions(response.payload.data);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("roles.create.permissionsFetchError", language),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.permission_ids.length) {
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("roles.create.permissionRequired", language),
      });
      return;
    }

    try {
      setIsLoading(true);
      await createRole(formData);

      toast({
        title: translate("roles.create.success", language),
        description: translate("roles.create.successDescription", language),
      });

      onSuccess();
      onOpenChange(false);

      // Reset form
      setFormData({
        name: "",
        slug: "",
        permission_ids: [],
      });
    } catch (error) {
      console.error("Error creating role:", error);
      toast({
        variant: "destructive",
        title: translate("common.errorTitle", language),
        description: translate("roles.create.error", language),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionSelect = (selectedIds: number[]) => {
    setFormData((prev) => ({ ...prev, permission_ids: selectedIds }));
  };

  const handlePermissionRemove = (permissionId: number) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.filter((id) => id !== permissionId),
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 border-b pb-4">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <div>
              <SheetTitle className="text-lg font-semibold">
                {translate("roles.create.title", language)}
              </SheetTitle>
              <SheetDescription className="text-sm">
                {translate("roles.create.description", language)}
              </SheetDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  {translate("roles.name", language)}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium">
                  {translate("roles.slug", language)}
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permissions" className="text-sm font-medium">
                  {translate("roles.permissions", language)}
                </Label>
                <SearchablePermissionSelect
                  onSelect={handlePermissionSelect}
                  language={language}
                  permissions={permissions}
                  selectedIds={formData.permission_ids}
                  onRemove={handlePermissionRemove}
                />
              </div>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4 mt-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {translate("common.cancel", language)}
            </Button>
            <Button
              onClick={(e) => handleSubmit(e as any)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading
                ? translate("roles.create.creating", language)
                : translate("roles.create.createRole", language)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
