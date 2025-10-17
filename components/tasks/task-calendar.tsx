"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listTasks, getTaskSettings, type Task } from "@/lib/firebase/tasks"

export function TaskCalendar() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const run = async () => {
      await getTaskSettings()
      const items = await listTasks()
      setTasks(items)
    }
    run()
  }, [])

  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>()
    tasks.forEach((t) => {
      const d = t.dueDate?.toDate ? t.dueDate.toDate() : (t.dueDate ? new Date(t.dueDate) : null)
      if (!d) return
      const key = d.toISOString().slice(0, 10)
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(t)
    })
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [tasks])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar sarcini</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {byDay.length === 0 && <div className="text-sm text-muted-foreground">Nu există sarcini cu termen.</div>}
        {byDay.map(([date, items]) => (
          <div key={date} className="border rounded p-2">
            <div className="text-sm font-medium mb-1">{date}</div>
            <div className="flex flex-wrap gap-2">
              {items.map((t) => (
                <div key={t.id} className="rounded border px-2 py-1 text-xs bg-white">
                  {t.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


