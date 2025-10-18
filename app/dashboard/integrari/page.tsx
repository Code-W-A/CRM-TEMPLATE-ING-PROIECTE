"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendlyEmbed } from "@/components/integrations/calendly-embed"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"

export default function IntegrariPage() {
  const eventUrl = process.env.NEXT_PUBLIC_CALENDLY_EVENT_URL || ""

  return (
    <DashboardShell>
      <DashboardHeader heading="Integrări" text="Programare întâlniri / consultanță" />
      <Card>
        <CardHeader>
          <CardTitle>Programare întâlniri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eventUrl ? (
            <CalendlyEmbed eventUrl={eventUrl} />
          ) : (
            <div className="rounded border p-4 text-sm text-muted-foreground">
              Config missing: NEXT_PUBLIC_CALENDLY_EVENT_URL
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}


