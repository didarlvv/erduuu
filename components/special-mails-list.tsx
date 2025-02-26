"use client"

import { useEffect, useState } from "react"
import { Mail, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { SpecialMail } from "@/types/special-mails"

interface SpecialMailsListProps {
  mails: SpecialMail[]
  isLoading: boolean
}

export function SpecialMailsList({ mails, isLoading }: SpecialMailsListProps) {
  const [parsedMails, setParsedMails] = useState<(SpecialMail & { parsedTitle: string })[]>([])

  useEffect(() => {
    // Parse JSON titles where applicable
    const parsed = mails.map((mail) => {
      try {
        const titleObj = JSON.parse(mail.title)
        return { ...mail, parsedTitle: titleObj.title }
      } catch {
        // If parsing fails, use the original title
        return { ...mail, parsedTitle: mail.title }
      }
    })
    setParsedMails(parsed)
  }, [mails])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {parsedMails.map((mail) => (
        <Card key={mail.mail_id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium">{mail.parsedTitle}</h3>
                {mail.unread_count > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {mail.unread_count} new
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Created by {mail.creator}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-sm">{mail.member_count}</span>
              </div>
              <Badge variant={mail.reference === "internal" ? "default" : "secondary"}>
                <Mail className="h-3 w-3 mr-1" />
                {mail.reference}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

