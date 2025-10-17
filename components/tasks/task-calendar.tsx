"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listTasks, getTaskSettings, type Task } from "@/lib/firebase/tasks"
import { Badge } from "@/components/ui/badge"
import { format, isToday, isTomorrow, isPast } from "date-fns"
import { ro } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"

export function TaskCalendar() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<any>(null)
  const { userData } = useAuth()
  const isTechnician = userData?.role === "tehnician"
  const currentUserId = userData?.uid

  useEffect(() => {
    const run = async () => {
      const s = await getTaskSettings()
      setSettings(s)
      const items = await listTasks(isTechnician && currentUserId ? { assigneeId: currentUserId } : undefined)
      setTasks(items)
    }
    run()
  }, [isTechnician, currentUserId])

  const { withDueDate, withoutDueDate } = useMemo(() => {
    const withDate: Task[] = []
    const withoutDate: Task[] = []
    
    tasks.forEach((t) => {
      const d = t.dueDate?.toDate ? t.dueDate.toDate() : (t.dueDate ? new Date(t.dueDate) : null)
      if (d && !isNaN(d.getTime())) {
        withDate.push({ ...t, dueDateObj: d })
      } else {
        withoutDate.push(t)
      }
    })
    
    // Sort by date
    withDate.sort((a: any, b: any) => a.dueDateObj.getTime() - b.dueDateObj.getTime())
    
    return { withDueDate: withDate, withoutDueDate }
  }, [tasks])

  const getStatusColor = (statusId: string) => {
    if (!settings?.statuses) return "#6B7280"
    const status = settings.statuses.find((s: any) => s.id === statusId)
    return status?.color || "#6B7280"
  }

  const getPriorityConfig = (priority: string) => {
    const configs: any = {
      low: { label: "Scăzută", color: "text-gray-600", bg: "bg-gray-100" },
      medium: { label: "Medie", color: "text-blue-600", bg: "bg-blue-100" },
      high: { label: "Ridicată", color: "text-orange-600", bg: "bg-orange-100" },
      urgent: { label: "Urgent", color: "text-red-600", bg: "bg-red-100" },
    }
    return configs[priority] || configs.medium
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Astăzi"
    if (isTomorrow(date)) return "Mâine"
    if (isPast(date)) return format(date, "d MMM yyyy", { locale: ro }) + " (Expirat)"
    return format(date, "d MMM yyyy", { locale: ro })
  }

  return (
    <div className="space-y-6">
      {/* Tasks with Due Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-base" aria-hidden>📅</span>
            Taskuri cu Dată Scadentă
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {withDueDate.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Nu există taskuri cu dată scadentă.
              <br />
              <span className="text-xs">Adaugă o dată scadentă când creezi un task pentru a-l vedea aici.</span>
            </div>
          ) : (
            withDueDate.map((task: any) => {
              const prio = getPriorityConfig(task.priority)
              const isOverdue = isPast(task.dueDateObj) && !isToday(task.dueDateObj)
              
              return (
                <div 
                  key={task.id} 
                  className={`border rounded-lg p-4 ${isOverdue ? 'border-red-200 bg-red-50/30' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: getStatusColor(task.status) }}
                        />
                        <h4 className="font-medium text-sm">{task.title}</h4>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <Badge className={`${prio.bg} ${prio.color} border-0 shrink-0`}>
                      {prio.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-xs" aria-hidden>📅</span>
                    <span className={isOverdue ? "font-medium text-red-600" : "text-muted-foreground"}>
                      {getDateLabel(task.dueDateObj)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Tasks without Due Date */}
      {withoutDueDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              Taskuri fără Dată Scadentă
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {withoutDueDate.map((task) => {
                const prio = getPriorityConfig(task.priority)
                
                return (
                  <div key={task.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: getStatusColor(task.status) }}
                        />
                        <h4 className="font-medium text-sm line-clamp-1">{task.title}</h4>
                      </div>
                    </div>
                    <Badge className={`${prio.bg} ${prio.color} border-0 text-[10px] w-fit`}>
                      {prio.label}
                    </Badge>
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


