"use client"

import { useEffect, useRef } from "react"

type CalendlyEmbedProps = {
  eventUrl: string
  client?: { id: string; name?: string; email?: string }
  className?: string
}

function buildUrl(base: string, client?: { id: string; name?: string; email?: string }) {
  try {
    const url = new URL(base)
    // UTM tagging for per-client tracking
    if (client?.id) url.searchParams.set("utm_content", `client-${client.id}`)
    // Prefill name/email when available
    if (client?.name) url.searchParams.set("name", client.name)
    if (client?.email) url.searchParams.set("email", client.email)
    return url.toString()
  } catch {
    return base
  }
}

export function CalendlyEmbed({ eventUrl, client, className }: CalendlyEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const initializedRef = useRef(false)
  const isValidCalendlyUrl = (url: string) => {
    try {
      const u = new URL(url)
      const hostOk = u.hostname === "calendly.com" || u.hostname.endsWith(".calendly.com")
      const pathParts = u.pathname.split("/").filter(Boolean)
      // Expect at least account and event-type: /{account}/{event}
      return hostOk && pathParts.length >= 2
    } catch {
      return false
    }
  }

  useEffect(() => {
    const scriptId = "calendly-widget-script"
    const cssId = "calendly-widget-css"
    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (document.getElementById(scriptId)) return resolve()
        const s = document.createElement("script")
        s.id = scriptId
        s.src = "https://assets.calendly.com/assets/external/widget.js"
        s.onload = () => resolve()
        document.body.appendChild(s)
      })
    const ensureCss = () => {
      if (document.getElementById(cssId)) return
      const l = document.createElement("link")
      l.id = cssId
      l.rel = "stylesheet"
      l.href = "https://assets.calendly.com/assets/external/widget.css"
      document.head.appendChild(l)
    }

    const setup = async () => {
      if (initializedRef.current) return
      if (!isValidCalendlyUrl(eventUrl)) {
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div class="rounded border p-3 text-sm text-muted-foreground">Config invalid: verificați adresa evenimentului Calendly.</div>'
        }
        return
      }
      await ensureScript()
      ensureCss()
      initializedRef.current = true
    }

    setup()

    const handler = async (e: MessageEvent) => {
      try {
        const data = e?.data
        if (!data || typeof data !== "object") return
        if (data.event !== "calendly.event_scheduled") return
        if (!client?.id) return
        // Capture minimal payload to backend
        await fetch("/api/integrations/calendly/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: client.id, payload: data?.payload || null }),
        })
      } catch {
        // no-op
      }
    }

    window.addEventListener("message", handler)
    return () => {
      window.removeEventListener("message", handler)
      initializedRef.current = false
    }
  }, [eventUrl, client?.id, client?.name, client?.email])

  return (
    <div
      ref={containerRef}
      className={className ? `${className} calendly-inline-widget` : "calendly-inline-widget w-full"}
      // @ts-ignore - Calendly auto-initializes using data-url
      data-url={buildUrl(eventUrl, client)}
      style={{ minWidth: "320px", height: "720px" }}
      aria-label="Calendly scheduling widget"
    />
  )
}

export default CalendlyEmbed


