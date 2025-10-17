"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import type { Lucrare } from "@/lib/firebase/firestore"
import { ChevronDown, ChevronUp } from "lucide-react"

function parseMaybeDate(value: any): Date | null {
  try {
    if (!value) return null
    if (value?.toDate) return value.toDate()
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

function computeOfferTotal(l: any, includeVAT: boolean): number {
  // Prefer snapshot total if present
  const snap = l?.acceptedOfferSnapshot
  const products: any[] = Array.isArray(snap?.products) ? snap.products : Array.isArray(l?.products) ? l.products : []
  const subtotal = products.reduce((s, p) => s + (Number(p?.quantity || p?.cantitate || 0) * Number(p?.price || p?.pretUnitar || 0)), 0)
  const adj = Number(l?.offerAdjustmentPercent ?? snap?.adjustmentPercent ?? 0) || 0
  const vat = Number(l?.offerVAT ?? snap?.offerVAT ?? 0)
  const discounted = subtotal * (1 - adj / 100)
  return includeVAT ? discounted * (1 + (vat > 0 ? vat : 0) / 100) : discounted
}

export function SalesAnalysis() {
  const { data: lucrari, loading } = useFirebaseCollection<Lucrare>("lucrari")
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [includeVAT, setIncludeVAT] = useState<boolean>(true)
  const [showDetails, setShowDetails] = useState<boolean>(false)

  const { series, totalYear, avgPerMonth, bestMonth, worstMonth, clientDetails } = useMemo(() => {
    const monthly: number[] = Array(12).fill(0)
    let yearlyTotal = 0
    const clientMap = new Map<string, { client: string; total: number; count: number }>()

    lucrari.forEach((l: any) => {
      // Count only accepted offers
      const accepted = String(l?.offerResponse?.status || "").toLowerCase() === "accept"
      if (!accepted) return

      // Choose acceptance date; fallback to ofertaDocument.dataOferta or updatedAt
      let d = parseMaybeDate(l?.offerResponse?.at)
      if (!d) d = parseMaybeDate(l?.ofertaDocument?.dataOferta)
      if (!d) d = parseMaybeDate(l?.updatedAt)
      if (!d || d.getFullYear() !== year) return

      const value = computeOfferTotal(l, includeVAT)
      if (!isFinite(value)) return
      monthly[d.getMonth()] += value
      yearlyTotal += value

      // Aggregate per client
      const clientName = l?.client || "Necunoscut"
      const existing = clientMap.get(clientName) || { client: clientName, total: 0, count: 0 }
      existing.total += value
      existing.count += 1
      clientMap.set(clientName, existing)
    })

    const bestIdx = monthly.reduce((bi, v, i, arr) => (v > arr[bi] ? i : bi), 0)
    const worstIdx = monthly.reduce((wi, v, i, arr) => (v < arr[wi] ? i : wi), 0)
    const avg = yearlyTotal / 12

    const clientDetails = Array.from(clientMap.values()).sort((a, b) => b.total - a.total)

    return {
      series: monthly,
      totalYear: yearlyTotal,
      avgPerMonth: avg,
      bestMonth: { index: bestIdx, value: monthly[bestIdx] },
      worstMonth: { index: worstIdx, value: monthly[worstIdx] },
      clientDetails,
    }
  }, [lucrari, year, includeVAT])

  const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const years = useMemo(() => {
    const now = new Date().getFullYear()
    return [now - 2, now - 1, now, now + 1]
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analiză Vânzări (Oferte acceptate)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">An</span>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="Alege anul" /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Include TVA</span>
            <Toggle pressed={includeVAT} onPressedChange={setIncludeVAT} aria-label="Include TVA">
              {includeVAT ? "Da" : "Nu"}
            </Toggle>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total an" value={totalYear} />
          <Stat label="Medie/lună" value={avgPerMonth} />
          <Stat label={`Luna bună (${months[bestMonth.index]})`} value={bestMonth.value} />
          <Stat label={`Luna slabă (${months[worstMonth.index]})`} value={worstMonth.value} />
        </div>

        <div className="mt-2">
          <MiniBars labels={months} values={series} loading={loading} />
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
                    <th className="p-2 font-medium text-right">Oferte acceptate</th>
                    <th className="p-2 font-medium text-right">Total vânzări (RON)</th>
                  </tr>
                </thead>
                <tbody>
                  {clientDetails.map((c, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2">{c.client}</td>
                      <td className="p-2 text-right">{c.count}</td>
                      <td className="p-2 text-right font-medium">{c.total.toLocaleString("ro-RO", { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-gray-50">
                  <tr>
                    <td className="p-2 font-semibold">Total</td>
                    <td className="p-2 text-right font-semibold">{clientDetails.reduce((s, c) => s + c.count, 0)}</td>
                    <td className="p-2 text-right font-semibold">{totalYear.toLocaleString("ro-RO", { maximumFractionDigits: 0 })}</td>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value.toLocaleString("ro-RO", { maximumFractionDigits: 0 })} RON</div>
    </div>
  )
}

function MiniBars({ labels, values, loading }: { labels: string[]; values: number[]; loading?: boolean }) {
  const max = Math.max(1, ...values)
  return (
    <div className="w-full overflow-x-auto">
      <div className="grid grid-cols-12 gap-2 min-w-[640px]">
        {values.map((v, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="h-40 w-6 bg-muted relative">
              <div
                className="absolute bottom-0 left-0 right-0 bg-blue-600"
                style={{ height: `${(v / max) * 100}%` }}
                aria-label={`${labels[i]}: ${v}`}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{labels[i]}</div>
            <div className="text-[10px] text-muted-foreground">{v.toLocaleString("ro-RO", { maximumFractionDigits: 0 })}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SalesAnalysis


