"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { EquipmentReport } from "@/components/equipment-report"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { SalesAnalysis } from "@/components/sales-analysis"
import { MarketingCostAnalysis } from "@/components/marketing-cost-analysis"
import { AcquisitionReport } from "@/components/acquisition-report"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("equipment")

  return (
    <DashboardShell>
      <DashboardHeader heading="Rapoarte" text="Generează și vizualizează rapoarte pentru echipamente și intervenții" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-1 md:grid-cols-5">
          <TabsTrigger value="equipment">Rapoarte per Echipament</TabsTrigger>
          <TabsTrigger value="annual">Analiză Anuală</TabsTrigger>
          <TabsTrigger value="sales">Analiză Vânzări</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="acquisition">Achiziție clienți</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="pt-4">
          <EquipmentReport className="w-full" reportType="detailed" />
        </TabsContent>

        <TabsContent value="annual" className="pt-4">
          <EquipmentReport className="w-full" reportType="annual" />
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
