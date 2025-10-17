"use client"

import type * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Adăugăm importurile pentru iconițe
import {
  ClipboardList,
  Users,
  Settings,
  FileText,
  LayoutDashboard,
  BarChart3,
  FileCodeIcon as FileContract,
  StickyNote,
  Archive,
  List,
  UserPlus,
  Plug
} from "lucide-react"

// Actualizăm componenta MainNav pentru a include iconițele și logo-ul CRM
export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const { userData } = useAuth()

  // Verificăm dacă utilizatorul este admin pentru a afișa meniurile restricționate
  const role = userData?.role
  const isAdmin = role === "admin"
  const isTechnician = role === "tehnician"
  const isAdminOrDispatcher = role === "admin" || role === "dispecer"
  const isClient = role === "client"

  return (
    <div className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      <Link href="/" className="hidden md:flex items-center space-x-2">
        <span className="hidden font-bold sm:inline-block">CRM</span>
      </Link>
      <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
        {isClient ? (
          <Link
            href="/portal"
            className={cn(
              "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
              pathname === "/portal" ? "text-primary" : "text-muted-foreground",
            )}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Proiectele mele</span>
          </Link>
        ) : (
          <>
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
            pathname === "/dashboard" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/dashboard/lucrari"
          className={cn(
            "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
            pathname === "/dashboard/lucrari" || pathname.startsWith("/dashboard/lucrari/")
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Proiecte</span>
        </Link>
        {isAdminOrDispatcher && (
          <Link
            href="/dashboard/arhivate"
            className={cn(
              "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
              pathname === "/dashboard/arhivate" || pathname.startsWith("/dashboard/arhivate/")
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            <Archive className="h-4 w-4" />
            <span>Arhivate</span>
          </Link>
        )}
        {!isTechnician && (
          (() => {
            const [open, setOpen] = useState(false)
            return (
              <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
                <DropdownMenu open={open} onOpenChange={setOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
                        pathname === "/dashboard/clienti" || pathname.startsWith("/dashboard/clienti/") || pathname === "/dashboard/achizitii-client"
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      <Users className="h-4 w-4" />
                      <span>Clienți</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/clienti">
                        <div className="flex items-center gap-2">
                          <List className="h-4 w-4" />
                          <span>Lista clienți</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/achizitii-client">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          <span>Achiziții clienți</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })()
        )}
         
        {isAdmin && (
          <Link
            href="/dashboard/contracte"
            className={cn(
              "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
              pathname === "/dashboard/contracte" || pathname.startsWith("/dashboard/contracte/")
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            <FileContract className="h-4 w-4" />
            <span>Contracte</span>
          </Link>
        )}
        {!isTechnician && userData?.role !== "dispecer" && (
          <Link
            href="/dashboard/rapoarte"
            className={cn(
              "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
              pathname === "/dashboard/rapoarte" ? "text-primary" : "text-muted-foreground",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Rapoarte</span>
          </Link>
        )}
        {!isTechnician && (
          <Link
            href="/dashboard/integrari"
            className={cn(
              "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
              pathname === "/dashboard/integrari" ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Plug className="h-4 w-4" />
            <span>Integrări</span>
          </Link>
        )}
      
    
        {isAdmin && (
          <>
            <Link
              href="/dashboard/utilizatori"
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
                pathname === "/dashboard/utilizatori" ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Utilizatori</span>
            </Link>
            <Link
              href="/dashboard/loguri"
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
                pathname === "/dashboard/loguri" ? "text-primary" : "text-muted-foreground",
              )}
            >
              <FileText className="h-4 w-4" />
              <span>Loguri</span>
            </Link>
          </>
        )}
        {!isTechnician && (
          <Link
            href="/dashboard/note-interne"
            className={cn(
              "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
              pathname === "/dashboard/note-interne" ? "text-primary" : "text-muted-foreground",
            )}
          >
            <StickyNote className="h-4 w-4" />
            <span>Note interne</span>
          </Link>
        )}
          </>
        )}
      </nav>
    </div>
  )
}
