"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { startTimeEntry, stopTimeEntry } from "@/lib/firebase/tasks"
import { useAuth } from "@/contexts/AuthContext"

export function TimeTracker({ taskId }: { taskId: string }) {
  const { user } = useAuth()
  const [running, setRunning] = useState(false)
  const entryIdRef = useRef<string | null>(null)

  const start = async () => {
    if (!user?.uid) return
    const id = await startTimeEntry(taskId, user.uid)
    entryIdRef.current = id
    setRunning(true)
  }

  const stop = async () => {
    if (!entryIdRef.current) return
    await stopTimeEntry(entryIdRef.current)
    entryIdRef.current = null
    setRunning(false)
  }

  return (
    <div className="flex gap-2">
      {!running ? (
        <Button size="sm" onClick={start}>Pornește</Button>
      ) : (
        <Button size="sm" variant="destructive" onClick={stop}>Oprește</Button>
      )}
    </div>
  )
}


