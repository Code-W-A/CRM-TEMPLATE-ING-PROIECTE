"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendlyEmbed } from "@/components/integrations/calendly-embed"

export default function ProgramariPage() {
  const eventUrl = process.env.NEXT_PUBLIC_CALENDLY_EVENT_URL || ""

  return (
    <ProtectedRoute>
      <DashboardShell>
        <DashboardHeader heading="Programări" text="Întâlniri / consultanță" />
        <Card>
          <CardHeader>
            <CardTitle>Programări întâlniri / consultanță</CardTitle>
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
    </ProtectedRoute>
  )
}


