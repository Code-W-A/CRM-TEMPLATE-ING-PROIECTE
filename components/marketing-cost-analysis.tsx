"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import type { Client } from "@/lib/firebase/firestore"

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

  const { total, monthly } = useMemo(() => {
    const monthly = Array(12).fill(0)
    let total = 0
    ;(clienti || []).forEach((c: any) => {
      if (c.acquisitionSource !== 'paid_campaign') return
      const cost = Number(c.campaignCost || 0)
      if (!(cost > 0)) return
      const created = getDate(c.createdAt) || getDate(c.updatedAt) || null
      if (!created || created.getFullYear() !== year) return
      monthly[created.getMonth()] += cost
      total += cost
    })
    return { total, monthly }
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
      </CardContent>
    </Card>
  )
}

export default MarketingCostAnalysis


