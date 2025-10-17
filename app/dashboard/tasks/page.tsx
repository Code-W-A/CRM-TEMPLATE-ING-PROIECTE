"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KanbanBoard } from "@/components/tasks/kanban-board"
import { TaskCalendar } from "@/components/tasks/task-calendar"
import { TaskGantt } from "@/components/tasks/task-gantt"
import { TimesheetView } from "@/components/tasks/timesheet-view"
import { TaskSettings } from "@/components/tasks/task-settings"

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("board")

  return (
    <DashboardShell>
      <DashboardHeader heading="Tasks" text="Planificare, urmărire și raportare a sarcinilor." />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
          <TabsTrigger value="timesheets">Pontaj</TabsTrigger>
          <TabsTrigger value="settings">Setări</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="pt-4">
          <KanbanBoard />
        </TabsContent>
        <TabsContent value="calendar" className="pt-4">
          <TaskCalendar />
        </TabsContent>
        <TabsContent value="gantt" className="pt-4">
          <TaskGantt />
        </TabsContent>
        <TabsContent value="timesheets" className="pt-4">
          <TimesheetView />
        </TabsContent>
        <TabsContent value="settings" className="pt-4">
          <TaskSettings />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}


