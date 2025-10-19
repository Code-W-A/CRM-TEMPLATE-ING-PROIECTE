"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendlyEmbed } from "@/components/integrations/calendly-embed"
import { useAuth } from "@/contexts/AuthContext"

export default function ProgramariPage() {
  const eventUrl = process.env.NEXT_PUBLIC_CALENDLY_EVENT_URL || ""
  const { user, userData } = useAuth()

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
              <CalendlyEmbed eventUrl={eventUrl} captureMetadata={{ createdByUserId: user?.uid, createdByRole: userData?.role }} />
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


