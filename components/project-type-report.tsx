"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type WorkOrderLite = {
  id: string
  tipLucrare?: string
  statusLucrare?: string
  client?: string
  locatie?: string
}

export function ProjectTypeReport() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [works, setWorks] = useState<WorkOrderLite[]>([])

  useEffect(() => {
    const loadWorks = async () => {
      setLoading(true)
      setError(null)
      try {
        const q = query(collection(db, "lucrari"), orderBy("dataEmiterii"))
        const snap = await getDocs(q)
        const items: WorkOrderLite[] = snap.docs.map((d) => {
          const data: any = d.data()
          return {
            id: d.id,
            tipLucrare: data?.tipLucrare || "Nedefinit",
            statusLucrare: data?.statusLucrare || "Nedefinit",
            client: data?.client || "N/A",
            locatie: data?.locatie || "N/A",
          }
        })
        setWorks(items)
      } catch (e: any) {
        console.error("Eroare încărcare lucrări pentru raport tip proiect:", e)
        setError("Nu s-au putut încărca datele rapoartelor.")
      } finally {
        setLoading(false)
      }
    }
    loadWorks()
  }, [])

  // Filter state
  const typeOptions = useMemo(() => {
    const set = new Set<string>(["Toate"])
    works.forEach((w) => set.add(w.tipLucrare || "Nedefinit"))
    return Array.from(set)
  }, [works])

  const [selectedType, setSelectedType] = useState<string>("Toate")
  const clientOptions = useMemo(() => {
    const set = new Set<string>(["Toți clienții"])
    // Opțional, putem filtra opțiunile de client după tipul selectat pentru focus mai bun
    const base = selectedType === "Toate" ? works : works.filter((w) => (w.tipLucrare || "Nedefinit") === selectedType)
    base.forEach((w) => set.add(w.client || "N/A"))
    return Array.from(set)
  }, [works, selectedType])

  const [selectedClient, setSelectedClient] = useState<string>("Toți clienții")

  const locationOptions = useMemo(() => {
    const set = new Set<string>(["Toate locațiile"])
    // Dependență de client: dacă e selectat un client anume, limităm locațiile
    const base = works.filter((w) => {
      const typeOk = selectedType === "Toate" || (w.tipLucrare || "Nedefinit") === selectedType
      const clientOk = selectedClient === "Toți clienții" || (w.client || "N/A") === selectedClient
      return typeOk && clientOk
    })
    base.forEach((w) => set.add(w.locatie || "N/A"))
    return Array.from(set)
  }, [works, selectedType, selectedClient])

  const [selectedLocation, setSelectedLocation] = useState<string>("Toate locațiile")

  // Dacă se schimbă clientul și locația curentă nu mai există în opțiuni, resetăm
  useEffect(() => {
    if (!locationOptions.includes(selectedLocation)) {
      setSelectedLocation("Toate locațiile")
    }
  }, [locationOptions, selectedLocation])

  const filteredWorks = useMemo(() => {
    return works.filter((w) => {
      const typeOk = selectedType === "Toate" || (w.tipLucrare || "Nedefinit") === selectedType
      const clientOk = selectedClient === "Toți clienții" || (w.client || "N/A") === selectedClient
      const locationOk = selectedLocation === "Toate locațiile" || (w.locatie || "N/A") === selectedLocation
      return typeOk && clientOk && locationOk
    })
  }, [works, selectedType, selectedClient, selectedLocation])

  const stats = useMemo(() => {
    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    const byClient: Record<string, number> = {}
    const byLocation: Record<string, number> = {}
    for (const w of filteredWorks) {
      const t = (w.tipLucrare || "Nedefinit").trim() || "Nedefinit"
      const s = (w.statusLucrare || "Nedefinit").trim() || "Nedefinit"
      const c = (w.client || "N/A").trim() || "N/A"
      const l = (w.locatie || "N/A").trim() || "N/A"
      byType[t] = (byType[t] || 0) + 1
      byStatus[s] = (byStatus[s] || 0) + 1
      byClient[c] = (byClient[c] || 0) + 1
      byLocation[l] = (byLocation[l] || 0) + 1
    }
    const typeData = Object.entries(byType).map(([name, count]) => ({ name, interventii: count }))
    const statusData = Object.entries(byStatus).map(([name, count]) => ({ name, interventii: count }))
    const clientData = Object.entries(byClient)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, interventii: count }))
    const locationData = Object.entries(byLocation)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, interventii: count }))
    const total = filteredWorks.length
    return { total, byType, byStatus, typeData, statusData, clientData, locationData }
  }, [filteredWorks])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6" />
        <span className="ml-2 text-gray-600">Se încarcă rapoartele...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Rapoarte după Tip proiect</CardTitle>
          <Badge variant="secondary">Total: {stats.total}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tip proiect:</span>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alegeți tipul" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Client:</span>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alegeți clientul" />
              </SelectTrigger>
              <SelectContent>
                {clientOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Locație:</span>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alegeți locația" />
              </SelectTrigger>
              <SelectContent>
                {locationOptions.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="type" className="w-full">
       

          <TabsContent value="type" className="rounded-md border p-4 mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="interventii" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="client" className="rounded-md border p-4 mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.clientData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="interventii" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="location" className="rounded-md border p-4 mt-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.locationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="interventii" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


