"use client"

import { useMemo, useState } from "react"
import { collectionGroup, orderBy, query, collection } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import type { Client } from "@/lib/firebase/firestore"

export default function ProgramariAdminPage() {
  const cg = query(collectionGroup(db, "appointments"), orderBy("scheduledAt", "desc"))
  const global = query(collection(db, "appointments_global"), orderBy("createdAt", "desc"))
  const { data: dataClientSub } = useFirebaseCollection<any>("appointments", [], cg)
  const { data: dataGlobal } = useFirebaseCollection<any>("appointments_global", [], global)
  const all = [...(dataClientSub || []), ...(dataGlobal || [])]
  const { data: clients } = useFirebaseCollection<Client>("clienti")
  const { user } = useAuth()

  const [clientFilter, setClientFilter] = useState<string>("all")
  const [myOnly, setMyOnly] = useState(false)

  const filtered = useMemo(() => {
    let list = clientFilter === "all" ? all : all.filter((a: any) => a?.clientId === clientFilter)
    if (myOnly && user?.uid) list = list.filter((a: any) => a?.createdByUserId === user.uid)
    return [...list].sort((a: any, b: any) => {
      const ta = a?.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
      const tb = b?.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
      return tb - ta
    })
  }, [all, clientFilter, myOnly, user?.uid])

  const clientName = (id?: string) => clients.find((c) => c.id === id)?.nume || id || "—"

  return (
    <DashboardShell>
      <DashboardHeader heading="Programări" text="Programări capturate din Calendly" />
      <Card>
        <CardHeader>
          <CardTitle>Programări ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Filtru client</span>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[320px]">
                  <SelectValue placeholder="Selectează client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți clienții</SelectItem>
                  {[...clients].sort((a, b) => (a.nume || "").localeCompare(b.nume || "", "ro", { sensitivity: "base" })).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nume || c.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="my-only" checked={myOnly} onCheckedChange={(v) => setMyOnly(Boolean(v))} />
              <Label htmlFor="my-only" className="text-sm">Doar ale mele</Label>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Ora (tz)</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Invitat</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Eveniment</TableHead>
                <TableHead>Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a: any, idx: number) => {
                const when = a?.scheduledAt ? new Date(a.scheduledAt) : null
                const clientId = a?.clientId
                return (
                  <TableRow key={a.id || idx}>
                    <TableCell>{when ? when.toLocaleString("ro-RO") : "—"}{a?.timezone ? ` (${a.timezone})` : ""}</TableCell>
                    <TableCell>
                      {clientId ? (
                        <Link className="text-blue-600 hover:underline" href={`/dashboard/clienti/${clientId}`}>{clientName(clientId)}</Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{a?.inviteeName || "—"}</TableCell>
                    <TableCell>{a?.inviteeEmail || "—"}</TableCell>
                    <TableCell>
                      {a?.eventUri ? (
                        <a className="text-blue-600 hover:underline break-all" href={a.eventUri} target="_blank" rel="noreferrer">Eveniment</a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="space-x-2">
                      {a?.rescheduleUrl && (
                        <a className="text-blue-600 hover:underline" href={a.rescheduleUrl} target="_blank" rel="noreferrer">Reprogramează</a>
                      )}
                      {a?.cancelUrl && (
                        <a className="text-red-600 hover:underline" href={a.cancelUrl} target="_blank" rel="noreferrer">Anulează</a>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {!filtered.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">Nu există programări pentru filtrul selectat.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}


