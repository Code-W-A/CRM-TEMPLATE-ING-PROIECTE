"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskList } from "@/components/tasks/task-list"
// Lazy load calendar (simple) to avoid any init issues
import dynamic from "next/dynamic"
const TaskCalendar = dynamic(() => import("@/components/tasks/task-calendar-simple").then(m => m.TaskCalendarSimple), { ssr: false })
import { TaskSettings } from "@/components/tasks/task-settings"
import { LayoutGrid, Calendar, Settings } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("list")
  const { userData } = useAuth()
  const isTechnician = userData?.role === "tehnician"

  return (
    <DashboardShell>
      <DashboardHeader heading="Tasks" text="Planificare, urmărire și raportare a sarcinilor" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-2 md:grid-cols-3 mb-6">
          <TabsTrigger value="list">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Listă
          </TabsTrigger>

     
        </TabsList>

        <TabsContent value="list" className="mt-0">
          <TaskList />
        </TabsContent>
        <TabsContent value="calendar" className="mt-0">
          <TaskCalendar />
        </TabsContent>
        {!isTechnician && (
          <TabsContent value="settings" className="mt-0">
            <TaskSettings />
          </TabsContent>
        )}
      </Tabs>
    </DashboardShell>
  )
}


