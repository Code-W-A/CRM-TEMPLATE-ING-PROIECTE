"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getTaskSettings, updateTaskSettings, ensureDefaultTaskSettings, normalizeTaskSettings } from "@/lib/firebase/tasks"

export function TaskSettings() {
  const [statuses, setStatuses] = useState<Array<{ id: string; name: string; color: string; order: number }>>([])
  const [priorities, setPriorities] = useState<Array<{ id: string; name: string; color: string; order: number }>>([])
  const [newStatus, setNewStatus] = useState("")

  useEffect(() => {
    const run = async () => {
      const s = await getTaskSettings()
      setStatuses([...(s.statuses || [])].sort((a, b) => a.order - b.order))
      setPriorities([...(s.priorities || [])].sort((a, b) => a.order - b.order))
    }
    run()
  }, [])

  const addStatus = async () => {
    const name = newStatus.trim()
    if (!name) return
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
    const list = [...statuses, { id, name, color: "#93C5FD", order: statuses.length }]
    setStatuses(list)
    setNewStatus("")
    await updateTaskSettings({ statuses: list })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Statusuri</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Nume status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} />
            <Button onClick={addStatus}>Adaugă</Button>
            <Button variant="outline" onClick={async () => {
              const s = await normalizeTaskSettings()
              setStatuses([...(s.statuses || [])])
              setPriorities([...(s.priorities || [])])
            }}>Normalizează</Button>
          </div>
          <div className="space-y-1">
            {statuses.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded" style={{ background: s.color }} />
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Priorități</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {priorities.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded" style={{ background: p.color }} />
              <span>{p.name}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}


