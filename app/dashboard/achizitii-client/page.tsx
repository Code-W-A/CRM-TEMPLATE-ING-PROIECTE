"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import { updateClient, type Client } from "@/lib/firebase/firestore"

const SOURCES = [
  { value: "recomandare", label: "Recomandare" },
  { value: "organic_seo", label: "Organic (SEO)" },
  { value: "organic_social", label: "Organic (Social Media)" },
  { value: "paid_campaign", label: "Campanii de marketing plătit" },
]

export default function AchizitiiClient() {
  const { data: clienti, loading } = useFirebaseCollection<Client>("clienti")
  const [draft, setDraft] = useState<Record<string, { source?: string; cost?: string }>>({})

  const items = useMemo(() => clienti || [], [clienti])

  const handleChange = (id: string, field: "source" | "cost", value: string) => {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const handleSave = async (c: Client) => {
    const d = draft[c.id!]
    if (!d) return
    const payload: Partial<Client> = {}
    if (d.source) payload.acquisitionSource = d.source as any
    if (d.cost !== undefined) payload.campaignCost = d.cost === "" ? undefined : Number(d.cost)
    await updateClient(c.id!, payload)
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Achiziții Client" text="Sursă achiziție și cost campanie per client" />
      <div className="space-y-3">
        {loading && <div className="text-sm text-muted-foreground">Se încarcă...</div>}
        {!loading && items.map((c) => {
          const first = Array.isArray(c.locatii) && c.locatii.length ? c.locatii[0] : null
          const locText = first?.nume || first?.adresa || "—"
          const d = draft[c.id!] || {}
          return (
            <Card key={c.id}>
              <CardContent className="p-3 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <div>
                  <div className="text-sm font-medium">{c.nume}</div>
                  <div className="text-xs text-muted-foreground">{locText}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Sursă achiziție</div>
                  <Select value={d.source ?? (c as any).acquisitionSource ?? ""} onValueChange={(v) => handleChange(c.id!, "source", v)}>
                    <SelectTrigger><SelectValue placeholder="Selectează sursa" /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Cost campanie (RON)</div>
                  <Input
                    type="number"
                    inputMode="decimal"
                    defaultValue={(c as any).campaignCost ?? ""}
                    onChange={(e) => handleChange(c.id!, "cost", e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => handleSave(c)}>Salvează</Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </DashboardShell>
  )
}


