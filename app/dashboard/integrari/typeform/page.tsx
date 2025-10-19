"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TypeformIntegrationPage() {
  const formUrl = process.env.NEXT_PUBLIC_TYPEFORM_URL || ""

  return (
    <DashboardShell>
      <DashboardHeader heading="Integrări" text="Formular (Typeform)" />
      <Card>
        <CardHeader>
          <CardTitle>Formular Typeform</CardTitle>
        </CardHeader>
        <CardContent>
          {formUrl ? (
            <iframe
              title="Typeform"
              src={formUrl}
              className="w-full"
              style={{ minHeight: 720 }}
              frameBorder={0}
              allow="camera; microphone; autoplay; encrypted-media;"
            />
          ) : (
            <div className="rounded border p-4 text-sm text-muted-foreground">
              Config missing: NEXT_PUBLIC_TYPEFORM_URL
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}


