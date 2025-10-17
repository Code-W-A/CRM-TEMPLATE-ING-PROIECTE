"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import { createTask, listTasks, updateTask, getTaskSettings, type Task, type TaskPriority } from "@/lib/firebase/tasks"
import { useAuth } from "@/contexts/AuthContext"
import { Plus, Calendar as CalIcon, User, Pencil, Trash2 } from "lucide-react"

export function TaskList() {
  const { userData } = useAuth()
  const isTechnician = userData?.role === "tehnician"
  const currentUserId = userData?.uid

  const [settings, setSettings] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { data: users } = useFirebaseCollection<any>("users")
  const technicians = useMemo(() => (users || []).filter((u: any) => String(u?.role || "").toLowerCase() === "tehnician"), [users])

  // Filters
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>(isTechnician ? (currentUserId || "all") : "all")

  // Create/Edit Dialog
  const [open, setOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [assigneeId, setAssigneeId] = useState<string>("none")
  const [discipline, setDiscipline] = useState<string>("altul")
  const [phase, setPhase] = useState<string>("Altul")
  const [dueDate, setDueDate] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const s = await getTaskSettings()
      setSettings(s)
      const items = await listTasks(isTechnician && currentUserId ? { assigneeId: currentUserId } : undefined)
      setTasks(items)
      setLoading(false)
    }
    run()
  }, [isTechnician, currentUserId])

  const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: "Scăzută", color: "text-gray-700", bg: "bg-gray-100" },
    medium: { label: "Medie", color: "text-blue-700", bg: "bg-blue-100" },
    high: { label: "Ridicată", color: "text-orange-700", bg: "bg-orange-100" },
    urgent: { label: "Urgent", color: "text-red-700", bg: "bg-red-100" },
  }

  const doneStatusId = useMemo(() => {
    const byId = settings?.statuses || []
    const found = byId.find((s: any) => String(s?.id).toLowerCase() === "done")
      || byId.find((s: any) => String(s?.name || "").toLowerCase().includes("finalizat"))
    return found?.id || "done"
  }, [settings])

  const filtered = useMemo(() => {
    let list = tasks
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((t) => (t.title || "").toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q))
    }
    if (priorityFilter !== "all") list = list.filter((t) => t.priority === (priorityFilter as any))
    if (assigneeFilter !== "all") list = list.filter((t) => Array.isArray(t.assigneeIds) && t.assigneeIds.includes(assigneeFilter))
    return list
  }, [tasks, search, priorityFilter, assigneeFilter])

  const resetDialog = () => {
    setEditingTask(null)
    setTitle("")
    setDescription("")
    setPriority("medium")
    setAssigneeId("none")
    setDiscipline("altul")
    setPhase("Altul")
    setDueDate("")
  }

  const openCreate = () => {
    resetDialog()
    setOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setTitle(task.title || "")
    setDescription(task.description || "")
    setPriority((task.priority as TaskPriority) || "medium")
    setAssigneeId(task.assigneeIds?.[0] || "none")
    setDiscipline((task as any).discipline || "altul")
    setPhase((task as any).phase || "Altul")
    const d = task.dueDate?.toDate ? task.dueDate.toDate() : (task.dueDate ? new Date(task.dueDate) : null)
    setDueDate(d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "")
    setOpen(true)
  }

  const saveTask = async () => {
    const t = title.trim()
    if (!t) return
    setSaving(true)
    try {
      if (editingTask?.id) {
        const update: any = {
          title: t,
          description,
          priority,
          assigneeIds: assigneeId === "none" ? [] : [assigneeId],
          discipline,
          phase,
        }
        if (dueDate) update.dueDate = new Date(dueDate)
        await updateTask(editingTask.id, update)
        setTasks((prev) => prev.map((x) => (x.id === editingTask.id ? { ...x, ...update } : x)))
      } else {
        const data: any = {
          title: t,
          description,
          status: settings?.statuses?.[0]?.id || "backlog",
          priority,
          assigneeIds: assigneeId === "none" ? [] : [assigneeId],
          discipline,
          phase,
        }
        if (dueDate) data.dueDate = new Date(dueDate)
        const id = await createTask(data)
        setTasks((prev) => [{ id, ...data }, ...prev])
      }
      setOpen(false)
      resetDialog()
    } finally {
      setSaving(false)
    }
  }

  const markDone = async (task: Task) => {
    if (!task.id) return
    if (task.status === doneStatusId) return
    await updateTask(task.id, { status: doneStatusId })
    setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, status: doneStatusId } : x)))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          {!isTechnician && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetDialog() }}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" /> Adaugă task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingTask ? "Editează task" : "Task nou"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Label>Titlu *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titlu task" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descriere</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Detalii..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Prioritate</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Scăzută</SelectItem>
                          <SelectItem value="medium">Medie</SelectItem>
                          <SelectItem value="high">Ridicată</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Specialist</Label>
                      <Select value={assigneeId} onValueChange={setAssigneeId}>
                        <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Neatribuit</SelectItem>
                          {technicians.map((t: any) => (
                            <SelectItem key={t.id || t.uid} value={t.id || t.uid}>
                              {t.nume || t.name || t.displayName || t.email || (t.id || t.uid)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="grid gap-2">
                      <Label>Disciplină</Label>
                      <Select value={discipline} onValueChange={setDiscipline}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="arhitectura">Arhitectură</SelectItem>
                          <SelectItem value="structura">Structură</SelectItem>
                          <SelectItem value="instalatii">Instalații</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="altul">Altul</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Fază</Label>
                      <Select value={phase} onValueChange={setPhase}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SF">SF</SelectItem>
                          <SelectItem value="DALI">DALI</SelectItem>
                          <SelectItem value="DTAC">DTAC</SelectItem>
                          <SelectItem value="PT">PT</SelectItem>
                          <SelectItem value="DE">DE</SelectItem>
                          <SelectItem value="PTH">PTH</SelectItem>
                          <SelectItem value="AsBuilt">AsBuilt</SelectItem>
                          <SelectItem value="Supraveghere">Supraveghere</SelectItem>
                          <SelectItem value="Altul">Altul</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Data scadentă (opțional)</Label>
                      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setOpen(false); resetDialog() }}>Anulează</Button>
                  <Button onClick={saveTask} disabled={saving || !title.trim()}>{saving ? "Se salvează..." : (editingTask ? "Salvează" : "Creează")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex gap-2">
          <Input className="w-[220px]" placeholder="Caută..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Prioritate" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate prioritățile</SelectItem>
              <SelectItem value="low">Scăzută</SelectItem>
              <SelectItem value="medium">Medie</SelectItem>
              <SelectItem value="high">Ridicată</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          {!isTechnician && (
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Specialist" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toți</SelectItem>
                {technicians.map((t: any) => (
                  <SelectItem key={t.id || t.uid} value={t.id || t.uid}>
                    {t.nume || t.name || t.displayName || t.email || (t.id || t.uid)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Taskuri</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {loading && <div className="text-sm text-muted-foreground py-6">Se încarcă...</div>}
          {!loading && filtered.length === 0 && (
            <div className="text-sm text-muted-foreground py-6">Nu există taskuri.</div>
          )}
          {!loading && filtered.map((t) => {
            const pr = priorityConfig[t.priority] || priorityConfig.medium
            const tech = technicians.find((x: any) => (x.id || x.uid) === t.assigneeIds?.[0])
            const d = t.dueDate?.toDate ? t.dueDate.toDate() : (t.dueDate ? new Date(t.dueDate) : null)
            return (
              <div key={t.id} className="py-3 flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="flex items-center gap-1">
                      {(t as any).discipline && (
                        <Badge className="bg-gray-100 text-gray-700 border-0 text-[10px]">{String((t as any).discipline).charAt(0).toUpperCase() + String((t as any).discipline).slice(1)}</Badge>
                      )}
                      {(t as any).phase && (
                        <Badge className="bg-gray-100 text-gray-700 border-0 text-[10px]">{String((t as any).phase)}</Badge>
                      )}
                      <Badge className={`${pr.bg} ${pr.color} border-0 text-[10px]`}>{pr.label}</Badge>
                    </div>
                  </div>
                  {t.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</div>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {tech ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5"><AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">{(tech.nume || tech.name || tech.email || "U").substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <span>{tech.nume || tech.name || tech.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5"><User className="h-3 w-3" /><span>Neatribuit</span></div>
                    )}
                    {d && (
                      <div className="flex items-center gap-1.5"><CalIcon className="h-3 w-3" /><span>{d.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })}</span></div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isTechnician && (
                    <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  )}
                  {isTechnician && (
                    <Button 
                      size="sm" 
                      variant={t.status === doneStatusId ? "outline" : "default"}
                      onClick={() => markDone(t)}
                      disabled={t.status === doneStatusId}
                    >
                      {t.status === doneStatusId ? "Finalizat" : "Finalizează"}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}


