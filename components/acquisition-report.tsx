"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import type { Client } from "@/lib/firebase/firestore"
import { ChevronDown, ChevronUp } from "lucide-react"

function toDate(v: any): Date | null {
  try {
    if (!v) return null
    if (v.toDate) return v.toDate()
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

const SOURCE_LABELS: Record<string, string> = {
  recomandare: "Recomandare",
  organic_seo: "Organic (SEO)",
  organic_social: "Organic (Social Media)",
  paid_campaign: "Campanii de marketing plătit",
}

export function AcquisitionReport() {
  const { data: clienti } = useFirebaseCollection<Client>("clienti")
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [showDetails, setShowDetails] = useState<boolean>(false)

  const { counts, totalCount, paidTotalCost, paidCount, paidCostPerClient, monthlyCounts, clientDetails } = useMemo(() => {
    const counts: Record<string, number> = { recomandare: 0, organic_seo: 0, organic_social: 0, paid_campaign: 0 }
    const monthlyCounts: number[] = Array(12).fill(0)
    let paidTotalCost = 0
    let paidCount = 0
    const clientDetailsMap = new Map<string, { client: string; sources: string[]; totalCost: number; entries: number }>()

    for (const c of clienti || []) {
      const clientName = (c as any).nume || "Necunoscut"
      const clientSources = new Set<string>()
      let clientCost = 0
      let clientEntries = 0

      const entries = Array.isArray((c as any).acquisitionEntries) ? (c as any).acquisitionEntries : []
      if (entries.length) {
        entries.forEach((e: any) => {
          const d = toDate(e?.date) || toDate((c as any).createdAt) || toDate((c as any).updatedAt)
          if (!d || d.getFullYear() !== year) return
          const src = e?.source
          if (src && SOURCE_LABELS[src]) {
            counts[src] = (counts[src] || 0) + 1
            clientSources.add(SOURCE_LABELS[src])
            clientEntries += 1
          }
          monthlyCounts[d.getMonth()] += 1
          if (src === 'paid_campaign') {
            const cost = Number(e?.cost || 0)
            if (cost > 0) {
              paidTotalCost += cost
              clientCost += cost
            }
            paidCount += 1
          }
        })
      } else {
        // fallback pentru datele vechi
        const created = toDate((c as any).createdAt) || toDate((c as any).updatedAt)
        if (!created || created.getFullYear() !== year) continue
        const src = (c as any).acquisitionSource as string | undefined
        const key = src && SOURCE_LABELS[src] ? src : undefined
        if (key) {
          counts[key] = (counts[key] || 0) + 1
          clientSources.add(SOURCE_LABELS[key])
          clientEntries += 1
        }
        monthlyCounts[created.getMonth()] += 1
        if (src === 'paid_campaign') {
          const cost = Number((c as any).campaignCost || 0)
          if (cost > 0) {
            paidTotalCost += cost
            clientCost += cost
          }
          paidCount += 1
        }
      }

      if (clientSources.size > 0) {
        clientDetailsMap.set(clientName, {
          client: clientName,
          sources: Array.from(clientSources),
          totalCost: clientCost,
          entries: clientEntries,
        })
      }
    }

    const totalCount = Object.values(counts).reduce((s, v) => s + (v || 0), 0)
    const paidCostPerClient = paidCount > 0 ? paidTotalCost / paidCount : 0
    const clientDetails = Array.from(clientDetailsMap.values()).sort((a, b) => b.totalCost - a.totalCost || b.entries - a.entries)
    return { counts, totalCount, paidTotalCost, paidCount, paidCostPerClient, monthlyCounts, clientDetails }
  }, [clienti, year])

  const years = useMemo(() => {
    const now = new Date().getFullYear()
    return [now - 2, now - 1, now, now + 1]
  }, [])

  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const max = Math.max(1, ...monthlyCounts)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achiziție clienți – structură și cost per client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">An</span>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="An" /></SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">Total clienți {year}: <span className="font-semibold text-foreground">{totalCount}</span></div>
        </div>

        {/* Breakdown by source */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(SOURCE_LABELS).map(([key, label]) => (
            <div key={key} className="rounded border p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-lg font-semibold">{(counts as any)[key] || 0}</div>
            </div>
          ))}
        </div>

        {/* Paid campaign KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded border p-3">
            <div className="text-xs text-muted-foreground">Clienți din campanii plătite</div>
            <div className="text-lg font-semibold">{paidCount}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-muted-foreground">Cost total (RON)</div>
            <div className="text-lg font-semibold">{paidTotalCost.toLocaleString("ro-RO")}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-xs text-muted-foreground">Cost per client (RON)</div>
            <div className="text-lg font-semibold">{paidCostPerClient.toLocaleString("ro-RO", { maximumFractionDigits: 0 })}</div>
          </div>
        </div>

        {/* Monthly counts chart */}
        <div className="w-full overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 min-w-[640px]">
            {monthlyCounts.map((v, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-40 w-6 bg-muted relative">
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-600" style={{ height: `${(v / max) * 100}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{months[i]}</div>
                <div className="text-[10px] text-muted-foreground">{v.toLocaleString("ro-RO")}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Client details toggle */}
        <div className="mt-4 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full"
          >
            {showDetails ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
            {showDetails ? "Ascunde detalii per client" : "Vezi detalii per client"}
          </Button>
          {showDetails && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-2 font-medium">Client</th>
                    <th className="p-2 font-medium">Surse achiziție</th>
                    <th className="p-2 font-medium text-right">Intrări</th>
                    <th className="p-2 font-medium text-right">Cost total (RON)</th>
                  </tr>
                </thead>
                <tbody>
                  {clientDetails.map((c, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2">{c.client}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {c.sources.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 text-right">{c.entries}</td>
                      <td className="p-2 text-right font-medium">
                        {c.totalCost > 0 ? c.totalCost.toLocaleString("ro-RO", { maximumFractionDigits: 2 }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-gray-50">
                  <tr>
                    <td className="p-2 font-semibold">Total</td>
                    <td className="p-2"></td>
                    <td className="p-2 text-right font-semibold">{clientDetails.reduce((s, c) => s + c.entries, 0)}</td>
                    <td className="p-2 text-right font-semibold">{paidTotalCost.toLocaleString("ro-RO", { maximumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default AcquisitionReport


