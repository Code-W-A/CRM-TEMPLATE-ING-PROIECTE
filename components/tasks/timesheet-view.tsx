"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTimesheet, type TaskTimeEntry } from "@/lib/firebase/tasks"
import { useAuth } from "@/contexts/AuthContext"

export function TimesheetView() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<TaskTimeEntry[]>([])

  useEffect(() => {
    const run = async () => {
      const data = await getTimesheet({ userId: user?.uid })
      setEntries(data)
    }
    run()
  }, [user?.uid])

  const totalSec = useMemo(() => entries.reduce((s, e) => s + (Number(e.durationSec) || 0), 0), [entries])
  const hh = Math.floor(totalSec / 3600)
  const mm = Math.floor((totalSec % 3600) / 60)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pontaj</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm mb-2">Total: {hh}h {mm}m</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Task</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Durată</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const s = e.startedAt?.toDate ? e.startedAt.toDate() : (e.startedAt ? new Date(e.startedAt) : null)
                const f = e.endedAt?.toDate ? e.endedAt.toDate() : (e.endedAt ? new Date(e.endedAt) : null)
                const d = Number(e.durationSec) || 0
                const h = Math.floor(d / 3600); const m = Math.floor((d % 3600) / 60)
                return (
                  <tr key={e.id} className="border-t">
                    <td className="p-2">{e.taskId}</td>
                    <td className="p-2">{s ? s.toISOString() : '-'}</td>
                    <td className="p-2">{f ? f.toISOString() : '-'}</td>
                    <td className="p-2">{h}h {m}m</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}


