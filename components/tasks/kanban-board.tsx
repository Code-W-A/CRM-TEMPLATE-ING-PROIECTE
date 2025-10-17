"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getTaskSettings, listTasks, updateTask, createTask, type Task } from "@/lib/firebase/tasks"
import { useAuth } from "@/contexts/AuthContext"

export function KanbanBoard() {
  const { userData } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState("")

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const s = await getTaskSettings()
      setSettings(s)
      const items = await listTasks()
      setTasks(items)
      setLoading(false)
    }
    run()
  }, [])

  const columns = useMemo(() => {
    if (!settings) return []
    return [...settings.statuses].sort((a, b) => a.order - b.order)
  }, [settings])

  const tasksByStatus = useMemo(() => {
    const m = new Map<string, Task[]>()
    columns.forEach((c: any) => m.set(c.id, []))
    tasks.forEach((t) => {
      const key = t.status || columns[0]?.id
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(t)
    })
    return m
  }, [tasks, columns])

  const onDrop = async (ev: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    ev.preventDefault()
    const taskId = ev.dataTransfer.getData("text/plain")
    if (!taskId) return
    await updateTask(taskId, { status: newStatus })
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
  }

  const onDragStart = (ev: React.DragEvent<HTMLDivElement>, id?: string) => {
    if (!id) return
    ev.dataTransfer.setData("text/plain", id)
  }

  const addQuickTask = async () => {
    const title = newTitle.trim()
    if (!title) return
    setNewTitle("")
    const id = await createTask({
      title,
      description: "",
      status: columns[0]?.id || "backlog",
      priority: "medium",
      assigneeIds: userData?.uid ? [userData.uid] : [],
    })
    setTasks((prev) => [{ id, title, description: "", status: columns[0]?.id || "backlog", priority: "medium", assigneeIds: userData?.uid ? [userData.uid] : [] }, ...prev])
  }

  if (loading) return <div className="text-sm text-muted-foreground">Se încarcă board-ul…</div>

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="Titlu task nou" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <Button onClick={addQuickTask}>Adaugă</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {columns.map((col: any) => (
          <Card key={col.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, col.id)}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm" style={{ color: col.color }}>{col.name}</span>
                <span className="text-xs text-muted-foreground">{tasksByStatus.get(col.id)?.length || 0}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(tasksByStatus.get(col.id) || []).map((t) => (
                <div key={t.id} draggable onDragStart={(e) => onDragStart(e, t.id)} className="rounded border p-2 bg-white cursor-grab">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">Prioritate: {t.priority}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


