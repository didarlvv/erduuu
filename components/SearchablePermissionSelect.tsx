"use client";

import type React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Permission } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SearchablePermissionSelectProps {
  onSelect: (permissionIds: number[]) => void;
  language: string;
  permissions: Permission[];
  selectedIds: number[];
  onRemove: (permissionId: number) => void;
}

export function SearchablePermissionSelect({
  onSelect,
  language,
  permissions,
  selectedIds,
  onRemove,
}: SearchablePermissionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPermissions, setFilteredPermissions] =
    useState<Permission[]>(permissions);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language: currentLanguage } = useLanguage();

  const filterPermissions = useCallback(() => {
    const filtered = permissions.filter((permission) =>
      permission.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPermissions(filtered);
  }, [searchTerm, permissions]);

  useEffect(() => {
    filterPermissions();
  }, [searchTerm, filterPermissions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (permission: Permission) => {
    if (!selectedIds.includes(permission.id)) {
      onSelect([...selectedIds, permission.id]);
    } else {
      onRemove(permission.id);
    }
  };

  const handleRemove = (e: React.MouseEvent, permissionId: number) => {
    e.stopPropagation();
    onRemove(permissionId);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={`flex items-center justify-between w-full px-3 py-2 bg-white border rounded-md cursor-pointer ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-100"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <div className="flex-1 flex flex-wrap gap-2">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              className="w-full border-none outline-none focus:ring-0 p-0 text-sm"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : selectedIds.length > 0 ? (
            selectedIds.map((id) => {
              const permission = permissions.find((p) => p.id === id);
              return permission ? (
                <span
                  key={permission.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-primary/10 text-primary rounded"
                >
                  {permission.name}
                  <X
                    className="h-3 w-3 text-primary/70 hover:text-primary cursor-pointer"
                    onClick={(e) => handleRemove(e, permission.id)}
                  />
                </span>
              ) : null;
            })
          ) : (
            <span className="text-sm text-muted-foreground">
              Select permissions
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredPermissions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No permissions found
            </div>
          ) : (
            filteredPermissions.map((permission) => (
              <div
                key={permission.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                  selectedIds.includes(permission.id) && "bg-primary/5"
                )}
                onClick={() => handleSelect(permission)}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-4 h-4 border rounded",
                    selectedIds.includes(permission.id)
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300"
                  )}
                >
                  {selectedIds.includes(permission.id) && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                <span
                  className={cn(
                    "flex-1",
                    selectedIds.includes(permission.id) &&
                      "font-medium text-primary"
                  )}
                >
                  {permission.name}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
