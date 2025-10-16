"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function UtilizatoriLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { userData, loading } = useAuth()
  const [overrideOk, setOverrideOk] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const flag = typeof window !== "undefined" ? sessionStorage.getItem("utilizatori-temp-pass-ok") : null
      if (flag === "1") setOverrideOk(true)
    } catch {}
  }, [])

  useEffect(() => {
    if (userData?.role === "admin") {
      setOverrideOk(true)
    }
  }, [userData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "crm2025!") {
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("utilizatori-temp-pass-ok", "1")
        }
      } catch {}
      setOverrideOk(true)
      setError(null)
    } else {
      setError("Parolă incorectă.")
    }
  }

  if (loading) return null

  if (overrideOk) return <>{children}</>

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 border rounded-md p-6 shadow-sm bg-background">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Acces temporar Utilizatori</h1>
          <p className="text-sm text-muted-foreground">Introduceți parola temporară pentru a continua.</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Parolă</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="crm2025!"
            required
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit">Accesează</Button>
        </div>
        <p className="text-xs text-muted-foreground">Această măsură este provizorie pentru inițializare. Ștergeți ulterior acest mecanism.</p>
      </form>
    </div>
  )
}
