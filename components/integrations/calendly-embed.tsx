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

    const initWidget = async () => {
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
      // Retry loop until Calendly is available
      const maxAttempts = 20
      let attempts = 0
      const tryInit = () => {
        // @ts-ignore
        if (window.Calendly && containerRef.current) {
          // Clear any previous iframes to avoid duplicate widgets
          containerRef.current.innerHTML = ""
          // @ts-ignore
          window.Calendly.initInlineWidget({
            url: buildUrl(eventUrl, client),
            parentElement: containerRef.current,
            prefill: undefined,
            utm: undefined,
          })
          initializedRef.current = true
          return
        }
        if (attempts < maxAttempts) {
          attempts += 1
          setTimeout(tryInit, 300)
        }
      }
      tryInit()
    }

    initWidget()

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
      // Clear on unmount/re-render
      if (containerRef.current) containerRef.current.innerHTML = ""
    }
  }, [eventUrl, client?.id, client?.name, client?.email])

  return (
    <div
      ref={containerRef}
      className={className || "w-full"}
      style={{ minWidth: "320px", height: "720px" }}
      aria-label="Calendly scheduling widget"
    />
  )
}

export default CalendlyEmbed


