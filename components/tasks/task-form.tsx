"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTask, getTaskSettings, type TaskPriority } from "@/lib/firebase/tasks"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import { useEffect } from "react"

export function TaskForm({ onCreated }: { onCreated?: (id: string) => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [statuses, setStatuses] = useState<Array<{ id: string; name: string }>>([])
  const [status, setStatus] = useState<string>("backlog")
  const [saving, setSaving] = useState(false)
  const { data: users } = useFirebaseCollection<any>("users")
  const technicians = (users || []).filter((u: any) => String(u?.role || "").toLowerCase() === "tehnician")
  const [assigneeId, setAssigneeId] = useState<string>("")

  useEffect(() => {
    const run = async () => {
      const s = await getTaskSettings()
      setStatuses(s.statuses)
      setStatus(s.statuses?.[0]?.id || "backlog")
    }
    run()
  }, [])

  const onSubmit = async () => {
    const t = title.trim()
    if (!t) return
    setSaving(true)
    try {
      const id = await createTask({ title: t, description, priority, status, assigneeIds: assigneeId ? [assigneeId] : [] })
      setTitle("")
      setDescription("")
      setAssigneeId("")
      onCreated?.(id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <Input placeholder="Titlu" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Descriere" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Prioritate" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Scăzută</SelectItem>
            <SelectItem value="medium">Medie</SelectItem>
            <SelectItem value="high">Ridicată</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assigneeId} onValueChange={setAssigneeId}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Atribuie specialist" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Neatribuit</SelectItem>
            {technicians.map((t: any) => (
              <SelectItem key={t.id || t.uid} value={t.id || t.uid}>
                {t.nume || t.name || t.displayName || t.email || (t.id || t.uid)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onSubmit} disabled={saving}>{saving ? "Se salvează..." : "Creează"}</Button>
      </div>
    </div>
  )
}


