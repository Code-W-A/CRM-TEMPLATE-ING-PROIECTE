"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listTasks, type Task } from "@/lib/firebase/tasks"

export function TaskGantt() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const run = async () => {
      const items = await listTasks()
      setTasks(items)
    }
    run()
  }, [])

  const rows = useMemo(() => {
    return tasks.map((t) => {
      const start = t.startDate?.toDate ? t.startDate.toDate() : (t.startDate ? new Date(t.startDate) : null)
      const end = t.dueDate?.toDate ? t.dueDate.toDate() : (t.dueDate ? new Date(t.dueDate) : null)
      return { id: t.id!, title: t.title, start, end }
    })
  }, [tasks])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gantt (simplificat)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Task</th>
                <th className="p-2">Start</th>
                <th className="p-2">Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{r.start ? r.start.toISOString().slice(0, 10) : "-"}</td>
                  <td className="p-2">{r.end ? r.end.toISOString().slice(0, 10) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}


