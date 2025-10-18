"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendlyEmbed } from "@/components/integrations/calendly-embed"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import type { Client } from "@/lib/firebase/firestore"

const OPTIONS = [{ value: "calendly", label: "Programare întâlniri / consultanță" }]

export default function IntegrariPage() {
  const [opt, setOpt] = useState<string>(OPTIONS[0].value)
  const eventUrl = process.env.NEXT_PUBLIC_CALENDLY_EVENT_URL || ""
  const { data: clienti } = useFirebaseCollection<Client>("clienti")
  const [selectedClientId, setSelectedClientId] = useState<string>("none")
  const selectedClient = useMemo(() => (clienti || []).find((c: any) => c.id === selectedClientId) || null, [clienti, selectedClientId])
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    if (selectedClient) {
      setName(selectedClient.nume || "")
      setEmail((selectedClient as any).email || "")
    } else {
      setName("")
      setEmail("")
    }
  }, [selectedClientId])

  return (
    <DashboardShell>
      <DashboardHeader heading="Integrări" text="Programare întâlniri / consultanță" />
      <Card>
        <CardHeader>
          <CardTitle>Integrări</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Alege integrarea</span>
            <Select value={opt} onValueChange={setOpt}>
              <SelectTrigger className="w-[320px]">
                <SelectValue placeholder="Selectează" />
              </SelectTrigger>
              <SelectContent>
                {OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {opt === "calendly" && (
            <div className="mt-2 space-y-4">
              {/* Admin controls: pick client and prefill */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1">
                  <Label>Client</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selectează client (opțional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Fără asociere</SelectItem>
                      {(clienti || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.nume || c.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label>Nume pentru programare</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nume" />
                </div>
                <div className="grid gap-1">
                  <Label>Email pentru programare</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplu.ro" />
                </div>
              </div>

              {eventUrl ? (
                <CalendlyEmbed
                  eventUrl={eventUrl}
                  client={selectedClientId !== "none" ? { id: selectedClientId, name: name || undefined, email: email || undefined } : undefined}
                />
              ) : (
                <div className="rounded border p-4 text-sm text-muted-foreground">
                  Config missing: NEXT_PUBLIC_CALENDLY_EVENT_URL
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}


