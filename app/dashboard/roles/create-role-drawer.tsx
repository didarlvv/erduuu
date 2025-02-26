"use client";

import { useState } from "react";
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
import { createRole } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
});

interface CreateRoleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRoleDrawer({
  open,
  onOpenChange,
  onSuccess,
}: CreateRoleDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await createRole(values);
      toast({
        title: translate("roles.createSuccess", language),
        description: translate("roles.createSuccessDescription", language),
      });
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create role:", error);
      toast({
        title: translate("roles.createError", language),
        description: translate("roles.createErrorDescription", language),
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
          <DrawerTitle>{translate("roles.createRole", language)}</DrawerTitle>
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
                  ? translate("common.creating", language)
                  : translate("common.create", language)}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
