"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "./role.translations";
import { updateRole } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import type { Role } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
});

interface EditRoleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  role: Role | null;
}

export function EditRoleDrawer({
  open,
  onOpenChange,
  onSuccess,
  role,
}: EditRoleDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        slug: role.slug,
      });
    }
  }, [role, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!role) return;

    setIsSubmitting(true);
    try {
      await updateRole(role.id, values);
      toast({
        title: translate("roles.updateSuccess", language),
        description: translate("roles.updateSuccessDescription", language),
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update role:", error);
      toast({
        title: translate("roles.updateError", language),
        description: translate("roles.updateErrorDescription", language),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{translate("roles.editRole", language)}</DrawerTitle>
        </DrawerHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 px-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translate("roles.name", language)}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={translate("roles.namePlaceholder", language)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translate("roles.slug", language)}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={translate("roles.slugPlaceholder", language)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DrawerFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? translate("common.updating", language)
                  : translate("common.update", language)}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
