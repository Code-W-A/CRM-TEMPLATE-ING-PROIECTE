"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
// Eliminăm rapoartele pe echipament și afișăm pe tip proiect
import { ProjectTypeReport } from "@/components/project-type-report"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { SalesAnalysis } from "@/components/sales-analysis"
import { MarketingCostAnalysis } from "@/components/marketing-cost-analysis"
import { AcquisitionReport } from "@/components/acquisition-report"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("project-type")

  return (
    <DashboardShell>
      <DashboardHeader heading="Rapoarte" text="Generează și vizualizează rapoarte în funcție de tipul proiectului" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="project-type">Tip proiect</TabsTrigger>
          <TabsTrigger value="sales">Analiză Vânzări</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="acquisition">Achiziție clienți</TabsTrigger>
        </TabsList>

        <TabsContent value="project-type" className="pt-4">
          <ProjectTypeReport />
        </TabsContent>

        <TabsContent value="sales" className="pt-4">
          <SalesAnalysis />
        </TabsContent>
        <TabsContent value="marketing" className="pt-4">
          <MarketingCostAnalysis />
        </TabsContent>
        <TabsContent value="acquisition" className="pt-4">
          <AcquisitionReport />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
