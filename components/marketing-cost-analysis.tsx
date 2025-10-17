"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import type { Client } from "@/lib/firebase/firestore"
import { ChevronDown, ChevronUp } from "lucide-react"

function getDate(d: any): Date | null {
  try {
    if (!d) return null
    if (d.toDate) return d.toDate()
    const x = new Date(d)
    return isNaN(x.getTime()) ? null : x
  } catch { return null }
}

export function MarketingCostAnalysis() {
  const { data: clienti } = useFirebaseCollection<Client>("clienti")
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [showDetails, setShowDetails] = useState<boolean>(false)

  const { total, monthly, clientDetails } = useMemo(() => {
    const monthly = Array(12).fill(0)
    let total = 0
    const clientMap = new Map<string, { client: string; total: number; campaigns: number }>()

    ;(clienti || []).forEach((c: any) => {
      const clientName = c.nume || "Necunoscut"
      let clientTotal = 0
      let clientCampaigns = 0

      const entries = Array.isArray(c.acquisitionEntries) ? c.acquisitionEntries : []
      if (entries.length) {
        entries.forEach((e: any) => {
          if (e?.source !== 'paid_campaign') return
          const cost = Number(e?.cost || 0)
          if (!(cost > 0)) return
          const d = getDate(e?.date) || getDate(c.createdAt) || getDate(c.updatedAt)
          if (!d || d.getFullYear() !== year) return
          monthly[d.getMonth()] += cost
          total += cost
          clientTotal += cost
          clientCampaigns += 1
        })
      } else {
        // Fallback pentru date vechi
        if (c.acquisitionSource === 'paid_campaign') {
          const cost = Number(c.campaignCost || 0)
          if (cost > 0) {
            const created = getDate(c.createdAt) || getDate(c.updatedAt) || null
            if (created && created.getFullYear() === year) {
              monthly[created.getMonth()] += cost
              total += cost
              clientTotal += cost
              clientCampaigns += 1
            }
          }
        }
      }

      if (clientTotal > 0) {
        clientMap.set(clientName, { client: clientName, total: clientTotal, campaigns: clientCampaigns })
      }
    })

    const clientDetails = Array.from(clientMap.values()).sort((a, b) => b.total - a.total)
    return { total, monthly, clientDetails }
  }, [clienti, year])

  const years = useMemo(() => {
    const now = new Date().getFullYear()
    return [now - 2, now - 1, now, now + 1]
  }, [])

  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const max = Math.max(1, ...monthly)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Marketing (Campanii plătite)</CardTitle>
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
          <div className="text-sm">Total {year}: <span className="font-semibold">{total.toLocaleString("ro-RO")} RON</span></div>
        </div>
        <div className="w-full overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 min-w-[640px]">
            {monthly.map((v, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-40 w-6 bg-muted relative">
                  <div className="absolute bottom-0 left-0 right-0 bg-emerald-600" style={{ height: `${(v / max) * 100}%` }} />
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
                    <th className="p-2 font-medium text-right">Campanii</th>
                    <th className="p-2 font-medium text-right">Cost total (RON)</th>
                  </tr>
                </thead>
                <tbody>
                  {clientDetails.map((c, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2">{c.client}</td>
                      <td className="p-2 text-right">{c.campaigns}</td>
                      <td className="p-2 text-right font-medium">{c.total.toLocaleString("ro-RO", { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-gray-50">
                  <tr>
                    <td className="p-2 font-semibold">Total</td>
                    <td className="p-2 text-right font-semibold">{clientDetails.reduce((s, c) => s + c.campaigns, 0)}</td>
                    <td className="p-2 text-right font-semibold">{total.toLocaleString("ro-RO", { maximumFractionDigits: 2 })}</td>
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

export default MarketingCostAnalysis


