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

  useEffect(() => {
    const scriptId = "calendly-widget-script"
    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (document.getElementById(scriptId)) return resolve()
        const s = document.createElement("script")
        s.id = scriptId
        s.src = "https://assets.calendly.com/assets/external/widget.js"
        s.onload = () => resolve()
        document.body.appendChild(s)
      })

    const initWidget = async () => {
      if (initializedRef.current) return
      await ensureScript()
      // @ts-ignore
      if (window.Calendly && containerRef.current) {
        // @ts-ignore
        window.Calendly.initInlineWidget({
          url: buildUrl(eventUrl, client),
          parentElement: containerRef.current,
          prefill: undefined,
          utm: undefined,
        })
        initializedRef.current = true
      }
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
    return () => window.removeEventListener("message", handler)
  }, [eventUrl, client?.id, client?.name, client?.email])

  return (
    <div
      ref={containerRef}
      className={className || "calendly-inline-widget w-full"}
      style={{ minWidth: "320px", height: "720px" }}
      aria-label="Calendly scheduling widget"
    />
  )
}

export default CalendlyEmbed


