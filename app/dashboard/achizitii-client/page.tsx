"use client"

import { useMemo, useRef, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import { updateClient, type Client, addUserLogEntry } from "@/lib/firebase/firestore"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { Download, Search, Users, DollarSign, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const SOURCES = [
  { value: "recomandare", label: "Recomandare", color: "bg-emerald-500", desc: "Clienți veniți prin recomandare directă" },
  { value: "organic_seo", label: "Organic (SEO)", color: "bg-blue-500", desc: "Clienți din căutări organice (SEO)" },
  { value: "organic_social", label: "Organic (Social)", color: "bg-purple-500", desc: "Clienți din social media organic" },
  { value: "paid_campaign", label: "Campanii plătite", color: "bg-amber-500", desc: "Clienți din campanii Ads plătite" },
]

const SOURCE_MAP = Object.fromEntries(SOURCES.map(s => [s.value, s]))

function toDate(v: any): Date | null {
  try { if (!v) return null; if (v.toDate) return v.toDate(); const d = new Date(v); return isNaN(d.getTime()) ? null : d } catch { return null }
}

export default function AchizitiiClient() {
  const { userData } = useAuth()
  const isReadOnly = userData?.role !== "admin"
  const { data: clientiRaw, loading } = useFirebaseCollection<Client>("clienti")
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [editOpen, setEditOpen] = useState(false)
  const [editClient, setEditClient] = useState<any>(null)
  const [editSource, setEditSource] = useState<string>("")
  const [editCost, setEditCost] = useState<string>("")
  const [editDate, setEditDate] = useState<string>("")
  const [editNote, setEditNote] = useState<string>("")
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const clienti = useMemo(() => clientiRaw || [], [clientiRaw])

  // Filter
  const filtered = useMemo(() => {
    return clienti.filter((c: any) => {
      const created = toDate(c.createdAt) || toDate(c.updatedAt)
      if (!created || created.getFullYear() !== year) return false
      if (sourceFilter !== "all" && c.acquisitionSource !== sourceFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const name = (c.nume || "").toLowerCase()
        const loc = (c.locatii?.[0]?.nume || c.locatii?.[0]?.adresa || "").toLowerCase()
        if (!name.includes(q) && !loc.includes(q)) return false
      }
      return true
    })
  }, [clienti, year, sourceFilter, searchQuery])

  // KPIs
  const kpis = useMemo(() => {
    const counts: Record<string, number> = { recomandare: 0, organic_seo: 0, organic_social: 0, paid_campaign: 0 }
    let paidTotal = 0
    let paidCount = 0
    filtered.forEach((c: any) => {
      const src = c.acquisitionSource
      if (src && counts.hasOwnProperty(src)) counts[src] += 1
      if (src === "paid_campaign") {
        const cost = Number(c.campaignCost || 0)
        if (cost > 0) paidTotal += cost
        paidCount += 1
      }
    })
    const total = filtered.length
    const paidCpc = paidCount > 0 ? paidTotal / paidCount : 0
    return { counts, total, paidTotal, paidCount, paidCpc }
  }, [filtered])

  const years = useMemo(() => { const now = new Date().getFullYear(); return [now - 2, now - 1, now, now + 1] }, [])

  const openEdit = (client: any) => {
    setEditClient(client)
    setEditSource("")
    setEditCost("")
    setEditDate("")
    setEditNote("")
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditClient(null)
    setEditSource("")
    setEditCost("")
    setEditDate("")
    setEditNote("")
    setEditingEntryId(null)
  }

  const saveEntry = async () => {
    if (!editClient) return
    if (!editSource) {
      toast({ title: "Eroare", description: "Selectează sursa de achiziție.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const payload: Partial<Client> = {}
      const prev = (editClient.acquisitionEntries || []) as Array<any>
      
      if (editingEntryId) {
        // Editing existing entry
        const updated = prev.map((e: any) => {
          if (e.id === editingEntryId) {
            return {
              ...e,
              source: editSource,
              cost: editCost === "" ? undefined : Number(Number(editCost).toFixed(2)),
              date: editDate ? new Date(editDate).toISOString() : e.date,
              note: editNote || undefined,
            }
          }
          return e
        })
        payload.acquisitionEntries = updated
        
        // Update old fields for compatibility
        const latest = updated[updated.length - 1]
        payload.acquisitionSource = latest?.source as any
        payload.campaignCost = typeof latest?.cost === "number" ? latest.cost : undefined
        
        await updateClient(editClient.id, payload)
        await addUserLogEntry({ actiune: "Editare intrare achiziție", detalii: `id=${editClient.id}; sursă=${editSource}`, categorie: "Clienți" })
        toast({ title: "Actualizat", description: "Intrarea a fost actualizată." })
        setEditClient({ ...editClient, acquisitionEntries: updated })
      } else {
        // Adding new entry
        const newEntry = {
          id: `${Date.now()}`,
          source: editSource,
          cost: editCost === "" ? undefined : Number(Number(editCost).toFixed(2)),
          date: editDate ? new Date(editDate).toISOString() : new Date().toISOString(),
          note: editNote || undefined,
        }
        payload.acquisitionEntries = [...prev, newEntry]
        
        // Update old fields for compatibility
        payload.acquisitionSource = editSource as any
        if (editCost !== "") {
          const val = Number(editCost)
          if (isFinite(val) && val >= 0) payload.campaignCost = Number(val.toFixed(2))
        } else {
          payload.campaignCost = undefined as any
        }
        
        await updateClient(editClient.id, payload)
        await addUserLogEntry({ actiune: "Adăugare intrare achiziție", detalii: `id=${editClient.id}; sursă=${editSource}`, categorie: "Clienți" })
        toast({ title: "Adăugat", description: "Intrarea a fost adăugată." })
        setEditClient({ ...editClient, acquisitionEntries: [...prev, newEntry] })
      }
      
      setEditSource("")
      setEditCost("")
      setEditDate("")
      setEditNote("")
      setEditingEntryId(null)
    } catch (e: any) {
      toast({ title: "Eroare", description: e?.message || "Încearcă din nou.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (!editClient) return
    try {
      const rest = (editClient.acquisitionEntries || []).filter((x: any) => (x.id || x) !== entryId)
      await updateClient(editClient.id, { acquisitionEntries: rest as any })
      await addUserLogEntry({ actiune: "Ștergere intrare achiziție", detalii: `id=${editClient.id}`, categorie: "Clienți" })
      toast({ title: "Șters", description: "Intrarea a fost ștearsă." })
      setEditClient({ ...editClient, acquisitionEntries: rest })
    } catch (er: any) {
      toast({ title: "Eroare", description: er?.message || "Nu s-a putut șterge.", variant: "destructive" })
    }
  }

  const startEditEntry = (entry: any) => {
    setEditSource(entry.source || "")
    setEditCost(typeof entry.cost === 'number' ? String(entry.cost) : "")
    setEditDate(entry.date ? new Date(entry.date).toISOString().slice(0,10) : "")
    setEditNote(entry.note || "")
    setEditingEntryId(entry.id)
  }

  const cancelEditEntry = () => {
    setEditSource("")
    setEditCost("")
    setEditDate("")
    setEditNote("")
    setEditingEntryId(null)
  }

  const exportCsv = () => {
    const header = ["id","nume","acquisitionSource","campaignCost","createdAt"]
    const rows = filtered.map((c: any) => [c.id, c.nume, c.acquisitionSource || "", c.campaignCost ?? "", (c.createdAt?.toDate?.() || new Date()).toISOString()])
    const csv = [header.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `achizitii_clienti_${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const Row = ({ c }: { c: any }) => {
    const first = c.locatii?.[0]
    const locText = first?.nume || first?.adresa || "—"
    const created = toDate(c.createdAt) || toDate(c.updatedAt)
    const entries = (c.acquisitionEntries || []) as Array<any>
    
    // Calculate totals
    const totalCost = entries.reduce((sum: number, e: any) => {
      const cost = typeof e.cost === 'number' ? e.cost : 0
      return sum + cost
    }, 0)
    
    // Fallback to old fields if no entries
    const hasFallback = !entries.length && c.acquisitionSource
    const fallbackCost = typeof c.campaignCost === 'number' ? c.campaignCost : 0
    
    return (
      <tr className="border-b hover:bg-gray-50/50">
        <td className="p-3">
          <div className="font-medium text-sm">{c.nume}</div>
          <div className="text-xs text-muted-foreground truncate max-w-xs" title={locText}>{locText}</div>
        </td>
        <td className="p-3">
          {entries.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {entries.map((e: any, idx: number) => {
                const src = SOURCE_MAP[e.source]
                return src ? (
                  <Badge key={idx} variant="outline" className="gap-1">
                    <div className={`w-2 h-2 rounded-full ${src.color}`} />
                    {src.label}
                  </Badge>
                ) : null
              })}
            </div>
          ) : hasFallback ? (
            <Badge variant="outline" className="gap-1.5">
              <div className={`w-2 h-2 rounded-full ${SOURCE_MAP[c.acquisitionSource]?.color || 'bg-gray-400'}`} />
              {SOURCE_MAP[c.acquisitionSource]?.label || c.acquisitionSource}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </td>
        <td className="p-3 text-sm">
          {entries.length > 0 ? (
            <div>
              <div className="font-medium">{totalCost.toFixed(2)} RON</div>
              <div className="text-xs text-muted-foreground">{entries.length} {entries.length === 1 ? 'intrare' : 'intrări'}</div>
            </div>
          ) : hasFallback && fallbackCost > 0 ? (
            `${fallbackCost.toFixed(2)} RON`
          ) : (
            "—"
          )}
        </td>
        <td className="p-3 text-sm text-muted-foreground">
          {created ? created.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
        </td>
        <td className="p-3 text-right">
          <Button variant="ghost" size="sm" onClick={() => openEdit(c)} disabled={isReadOnly}>
            <Edit className="h-4 w-4" />
          </Button>
        </td>
      </tr>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Achiziții clienți"
        text="Gestionează sursele de achiziție și costurile de marketing per client"
      />

      <TooltipProvider>
        {isReadOnly && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            Vizualizare – doar adminii pot edita datele.
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total clienți</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.total}</div>
              <p className="text-xs text-muted-foreground mt-1">în {year}</p>
            </CardContent>
          </Card>

          {SOURCES.slice(0, 2).map((s) => (
            <Tooltip key={s.value}>
              <TooltipTrigger asChild>
                <Card className="cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpis.counts[s.value]}</div>
                    <p className="text-xs text-muted-foreground mt-1">clienți</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>{s.desc}</TooltipContent>
            </Tooltip>
          ))}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cost per client (paid)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.paidCpc.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} RON</div>
              <p className="text-xs text-muted-foreground mt-1">{kpis.paidCount} campanii</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions Toolbar */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
              <div className="flex flex-col md:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Caută după nume sau locație..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="An" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Toate sursele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate sursele</SelectItem>
                    {SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Table */}
        <Card>
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-base font-semibold">Lista clienți ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Se încarcă...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nu există clienți pentru filtrele selectate.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50/50 text-xs text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="p-3 text-left font-medium">Client</th>
                      <th className="p-3 text-left font-medium">Sursă achiziție</th>
                      <th className="p-3 text-left font-medium">Cost campanie</th>
                      <th className="p-3 text-left font-medium">Data înregistrare</th>
                      <th className="p-3 text-right font-medium">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c: any) => <Row key={c.id} c={c} />)}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* Edit Dialog - 2 columns with fixed left */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-4xl h-[85vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Gestionează achiziții client</DialogTitle>
            <DialogDescription>
              Adaugă noi intrări sau gestionează surse existente pentru {editClient?.nume}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 grid md:grid-cols-2 gap-6 px-6 py-4 overflow-hidden">
            {/* Left column: Form (scrollable) */}
            <div className="flex flex-col space-y-4 overflow-hidden">
              <div className="pb-2 border-b flex-shrink-0">
                <h3 className="font-semibold text-sm">{editingEntryId ? "Editează intrare" : "Adaugă intrare nouă"}</h3>
              </div>
              <div className="grid gap-4 overflow-y-auto pr-2">
                <div className="grid gap-2">
                  <Label htmlFor="source">Sursă achiziție *</Label>
                  <Select value={editSource} onValueChange={setEditSource}>
                    <SelectTrigger id="source">
                      <SelectValue placeholder="Selectează sursa" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${s.color}`} />
                            <span>{s.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editSource && (
                    <p className="text-xs text-muted-foreground">{SOURCE_MAP[editSource]?.desc}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cost">Cost campanie (RON)</Label>
                  <Input
                    id="cost"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0.00"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Opțional - costul asociat acestei surse de achiziție</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Dată achiziție</Label>
                  <Input id="date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Lasă gol pentru data curentă</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="note">Notă (opțional)</Label>
                  <Textarea id="note" placeholder="ex: campanie Google Ads - brand" value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={2} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveEntry} disabled={saving || !editSource} className="flex-1">
                    {saving ? (editingEntryId ? "Se salvează..." : "Se adaugă...") : (editingEntryId ? "Salvează" : "Adaugă intrare")}
                  </Button>
                  {editingEntryId && (
                    <Button variant="outline" onClick={cancelEditEntry} disabled={saving}>
                      Anulează
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: List (scrollable) */}
            <div className="flex flex-col space-y-4 overflow-hidden">
              <div className="pb-2 border-b flex-shrink-0">
                <h3 className="font-semibold text-sm">
                  Intrări existente ({Array.isArray(editClient?.acquisitionEntries) ? editClient.acquisitionEntries.length : 0})
                </h3>
              </div>
              {Array.isArray(editClient?.acquisitionEntries) && editClient.acquisitionEntries.length > 0 ? (
                <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                  {[...editClient.acquisitionEntries]
                    .sort((a: any, b: any) => {
                      const da = new Date(a?.date || 0).getTime()
                      const db = new Date(b?.date || 0).getTime()
                      return db - da
                    })
                    .map((e: any, idx: number) => (
                      <div key={(e.id || idx) as any} className="rounded-md border p-3 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${SOURCE_MAP[e.source]?.color || 'bg-gray-400'}`} />
                              <span className="font-medium text-sm">{SOURCE_MAP[e.source]?.label || e.source}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {e.date ? new Date(e.date).toLocaleDateString("ro-RO", { day: '2-digit', month: 'short', year: 'numeric' }) : "fără dată"}
                              {typeof e.cost === 'number' && <> · {e.cost.toFixed(2)} RON</>}
                            </div>
                            {e.note && <div className="text-xs text-muted-foreground mt-2 italic">{e.note}</div>}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => startEditEntry(e)}>
                            Editează
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteEntry(e.id)}>
                            Șterge
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8 flex-1 flex items-center justify-center">
                  Nicio intrare. Adaugă prima sursă de achiziție.
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={closeEdit}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
