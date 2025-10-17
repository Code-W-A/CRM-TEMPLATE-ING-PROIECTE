"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { listTasks, getTaskSettings, type Task } from "@/lib/firebase/tasks"
import { useAuth } from "@/contexts/AuthContext"

export function TaskCalendarSimple() {
  const { userData } = useAuth()
  const isTechnician = userData?.role === "tehnician"
  const currentUserId = userData?.uid

  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const s = await getTaskSettings()
        setSettings(s)
        const items = await listTasks(isTechnician && currentUserId ? { assigneeId: currentUserId } : undefined)
        setTasks(items || [])
      } catch (e) {
        console.error("Calendar load error", e)
        setTasks([])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [isTechnician, currentUserId])

  const toJsDate = (value: any): Date | null => {
    try {
      if (!value) return null
      // Firestore Timestamp
      if (typeof value === "object" && typeof value.toDate === "function") {
        const d = value.toDate()
        return isNaN(d?.getTime?.() || NaN) ? null : d
      }
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d
    } catch {
      return null
    }
  }

  const getStatusColor = (statusId: string): string => {
    try {
      const st = settings?.statuses?.find((s: any) => s.id === statusId)
      return st?.color || "#6B7280"
    } catch {
      return "#6B7280"
    }
  }

  const getPriorityBadge = (priority: string): { label: string; bg: string; text: string } => {
    switch (priority) {
      case "low":
        return { label: "Scăzută", bg: "bg-gray-100", text: "text-gray-700" }
      case "high":
        return { label: "Ridicată", bg: "bg-orange-100", text: "text-orange-700" }
      case "urgent":
        return { label: "Urgent", bg: "bg-red-100", text: "text-red-700" }
      default:
        return { label: "Medie", bg: "bg-blue-100", text: "text-blue-700" }
    }
  }

  // Build two lists without useMemo to avoid bundler init issues
  const withDate: Array<{ task: Task; date: Date }> = []
  const withoutDate: Task[] = []
  for (const t of tasks) {
    const d = toJsDate((t as any).dueDate)
    if (d) withDate.push({ task: t, date: d })
    else withoutDate.push(t)
  }
  withDate.sort((a, b) => a.date.getTime() - b.date.getTime())

  const formatDate = (d: Date) => d.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Taskuri cu dată scadentă</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div className="text-sm text-muted-foreground">Se încarcă...</div>}
          {!loading && withDate.length === 0 && (
            <div className="text-sm text-muted-foreground">Nu există taskuri cu dată scadentă.</div>
          )}
          {!loading && withDate.map(({ task, date }) => {
            const pr = getPriorityBadge((task as any).priority)
            const overdue = date.getTime() < new Date().setHours(0, 0, 0, 0)
            return (
              <div key={task.id} className={`border rounded-lg p-3 ${overdue ? "border-red-200 bg-red-50/40" : "bg-white"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor((task as any).status) }} />
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</div>
                    )}
                  </div>
                  <Badge className={`${pr.bg} ${pr.text} border-0`}>{pr.label}</Badge>
                </div>
                <div className="text-xs mt-2">
                  <span className={overdue ? "text-red-600 font-medium" : "text-muted-foreground"}>{formatDate(date)}</span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {withoutDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Taskuri fără dată scadentă</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {withoutDate.map((task) => {
                const pr = getPriorityBadge((task as any).priority)
                return (
                  <div key={task.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor((task as any).status) }} />
                      <span className="text-sm font-medium line-clamp-1">{task.title}</span>
                    </div>
                    <Badge className={`${pr.bg} ${pr.text} border-0 text-[10px] mt-2 w-fit`}>{pr.label}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


