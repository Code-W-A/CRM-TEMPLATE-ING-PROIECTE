"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useFirebaseCollection } from "@/hooks/use-firebase-collection"
import { getTaskSettings, listTasks, updateTask, createTask, type Task } from "@/lib/firebase/tasks"
import { useAuth } from "@/contexts/AuthContext"
import { Plus, Calendar, User, Flag, Circle, AlertCircle } from "lucide-react"

export function KanbanBoard() {
  const { userData } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { data: users } = useFirebaseCollection<any>("users")
  const technicians = useMemo(() => {
    return (users || []).filter((u: any) => String(u?.role || "").toLowerCase() === "tehnician")
  }, [users])
  const canAssign = userData?.role === "admin" || userData?.role === "dispecer"
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>("all")

  // Create task dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPriority, setNewPriority] = useState<string>("medium")
  const [newStatus, setNewStatus] = useState<string>("")
  const [newAssignee, setNewAssignee] = useState<string>("none")
  const [newDueDate, setNewDueDate] = useState<string>("")
  const [saving, setSaving] = useState(false)

  // Task detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

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
    const byId: Record<string, any> = {}
    for (const s of settings.statuses || []) {
      if (!byId[s.id]) byId[s.id] = s
    }
    return Object.values(byId).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)) as any[]
  }, [settings])

  const visibleTasks = useMemo(() => {
    if (filterAssigneeId === "all") return tasks
    return tasks.filter((t) => Array.isArray(t.assigneeIds) && t.assigneeIds.includes(filterAssigneeId))
  }, [tasks, filterAssigneeId])

  const tasksByStatus = useMemo(() => {
    const m = new Map<string, Task[]>()
    columns.forEach((c: any) => m.set(c.id, []))
    visibleTasks.forEach((t) => {
      const key = t.status || columns[0]?.id
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(t)
    })
    return m
  }, [visibleTasks, columns])

  const columnRenderList = useMemo(() => {
    const seen = new Set<string>()
    return columns.map((col: any, idx: number) => {
      let base = String(col?.id ?? "col")
      let key = `${base}-${col?.order ?? idx}`
      while (seen.has(key)) {
        key = `${key}-dup`
      }
      seen.add(key)
      return { key, col, idx }
    })
  }, [columns])

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

  const assignTask = async (taskId: string, technicianUserId: string) => {
    await updateTask(taskId, { assigneeIds: technicianUserId ? [technicianUserId] : [] })
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assigneeIds: technicianUserId ? [technicianUserId] : [] } : t)))
  }

  const createTaskFromDialog = async () => {
    const title = newTitle.trim()
    if (!title) return
    setSaving(true)
    try {
      const taskData: any = {
        title,
        description: newDescription,
        status: newStatus || columns[0]?.id || "backlog",
        priority: newPriority as any,
        assigneeIds: newAssignee !== "none" ? [newAssignee] : [],
      }
      
      // Add dueDate if set
      if (newDueDate) {
        taskData.dueDate = new Date(newDueDate)
      }
      
      const id = await createTask(taskData)
      setTasks((prev) => [
        {
          id,
          ...taskData,
        },
        ...prev,
      ])
      setNewTitle("")
      setNewDescription("")
      setNewPriority("medium")
      setNewAssignee("none")
      setNewDueDate("")
      setCreateOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  useEffect(() => {
    if (columns.length && !newStatus) setNewStatus(columns[0]?.id || "backlog")
  }, [columns, newStatus])

  const priorityConfig: Record<string, { label: string; color: string; bg: string; badgeBg: string; badgeText: string; icon: any; borderColor: string }> = {
    low: { 
      label: "Scăzută", 
      color: "text-gray-600", 
      bg: "bg-white", 
      badgeBg: "bg-gray-100",
      badgeText: "text-gray-700",
      icon: Circle,
      borderColor: "border-gray-200"
    },
    medium: { 
      label: "Medie", 
      color: "text-blue-600", 
      bg: "bg-blue-50/30", 
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-700",
      icon: AlertCircle,
      borderColor: "border-blue-200"
    },
    high: { 
      label: "Ridicată", 
      color: "text-orange-600", 
      bg: "bg-orange-50/30", 
      badgeBg: "bg-orange-100",
      badgeText: "text-orange-700",
      icon: Flag,
      borderColor: "border-orange-200"
    },
    urgent: { 
      label: "Urgent", 
      color: "text-red-600", 
      bg: "bg-red-50/30", 
      badgeBg: "bg-red-100",
      badgeText: "text-red-700",
      icon: AlertCircle,
      borderColor: "border-red-200"
    },
  }

  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="text-sm text-muted-foreground">Se încarcă taskurile...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-3">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Adaugă Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Task Nou</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titlu Task *</Label>
                  <Input 
                    placeholder="Titlu task" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descriere</Label>
                  <Textarea 
                    placeholder="Detalii..." 
                    value={newDescription} 
                    onChange={(e) => setNewDescription(e.target.value)} 
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col: any) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioritate</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Scăzută</SelectItem>
                        <SelectItem value="medium">Medie</SelectItem>
                        <SelectItem value="high">Ridicată</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Data Scadentă (opțional)</Label>
                  <Input 
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Atribuie Specialist</Label>
                  <Select value={newAssignee} onValueChange={setNewAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Neatribuit</SelectItem>
                      {technicians.map((tech: any) => (
                        <SelectItem key={tech.id || tech.uid} value={tech.id || tech.uid}>
                          {tech.nume || tech.name || tech.displayName || tech.email || (tech.id || tech.uid)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Anulează
                </Button>
                <Button 
                  onClick={createTaskFromDialog} 
                  disabled={saving || !newTitle.trim()}
                >
                  {saving ? "Se creează..." : "Creează Task"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <span className="text-sm text-muted-foreground">{visibleTasks.length} taskuri</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtru tehnician:</span>
          <Select value={filterAssigneeId} onValueChange={setFilterAssigneeId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toți" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți</SelectItem>
              {technicians.map((tech: any) => (
                <SelectItem key={tech.id || tech.uid} value={tech.id || tech.uid}>
                  {tech.nume || tech.name || tech.displayName || tech.email || (tech.id || tech.uid)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columnRenderList.map(({ key, col }) => {
          const isDragOver = dragOverColumn === col.id
          const tasksCount = tasksByStatus.get(col.id)?.length || 0
          
          return (
            <Card
              key={key}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverColumn(col.id)
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => {
                onDrop(e, col.id)
                setDragOverColumn(null)
              }}
              className={`h-fit ${isDragOver ? 'border-2 border-blue-500 bg-blue-50/30' : ''}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: col.color }}
                    ></div>
                    <span className="text-sm font-semibold">{col.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tasksCount}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                {(tasksByStatus.get(col.id) || []).map((t) => {
                  const tech = technicians.find((x: any) => (x.id || x.uid) === t.assigneeIds?.[0])
                  const prio = priorityConfig[t.priority] || priorityConfig.medium
                  const PriorityIcon = prio.icon
                  
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, t.id)}
                      onClick={() => openTaskDetail(t)}
                      className={`
                        rounded-lg border ${prio.borderColor} ${prio.bg}
                        p-3 cursor-pointer hover:shadow-md transition-shadow
                      `}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-sm font-medium flex-1 line-clamp-2">{t.title}</div>
                        <Badge className={`text-[10px] ${prio.badgeBg} ${prio.badgeText} border-0 shrink-0 flex items-center gap-1`}>
                          <PriorityIcon className="h-3 w-3" />
                          {prio.label}
                        </Badge>
                      </div>
                      
                      {t.description && (
                        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{t.description}</div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        {tech ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                {(tech.nume || tech.name || tech.email || "U").substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {tech.nume || tech.name || tech.email}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Neatribuit</span>
                          </div>
                        )}
                        {t.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(t.dueDate.seconds * 1000).toLocaleDateString("ro-RO", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {tasksCount === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <p className="text-xs">Niciun task</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Task detail/edit dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Descriere</Label>
                <p className="text-sm mt-1">{selectedTask.description || "Fără descriere"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Status</Label>
                  <Select
                    value={selectedTask.status}
                    onValueChange={async (v) => {
                      await updateTask(selectedTask.id!, { status: v })
                      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, status: v } : t)))
                      setSelectedTask({ ...selectedTask, status: v })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Prioritate</Label>
                  <Select
                    value={selectedTask.priority}
                    onValueChange={async (v) => {
                      await updateTask(selectedTask.id!, { priority: v as any })
                      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, priority: v as any } : t)))
                      setSelectedTask({ ...selectedTask, priority: v as any })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Scăzută</SelectItem>
                      <SelectItem value="medium">Medie</SelectItem>
                      <SelectItem value="high">Ridicată</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {canAssign && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Atribuie specialist</Label>
                  <Select
                    value={(selectedTask.assigneeIds && selectedTask.assigneeIds[0]) || "none"}
                    onValueChange={async (v) => {
                      const userId = v === "none" ? "" : v
                      await assignTask(selectedTask.id!, userId)
                      setSelectedTask({ ...selectedTask, assigneeIds: userId ? [userId] : [] })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Neatribuit</SelectItem>
                      {technicians.map((tech: any) => (
                        <SelectItem key={tech.id || tech.uid} value={tech.id || tech.uid}>
                          {tech.nume || tech.name || tech.displayName || tech.email || (tech.id || tech.uid)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
