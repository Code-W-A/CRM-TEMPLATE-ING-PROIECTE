"use client"

import { useEffect, useMemo } from "react"

type CalendlyEmbedProps = {
  eventUrl: string
  client?: { id: string; name?: string; email?: string }
  className?: string
  // Optional metadata to capture who created the booking (admin/client)
  captureMetadata?: { createdByUserId?: string; createdByRole?: string }
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

export function CalendlyEmbed({ eventUrl, client, className, captureMetadata }: CalendlyEmbedProps) {
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
  // Build iframe src including embed parameters
  const iframeSrc = useMemo(() => {
    if (!isValidCalendlyUrl(eventUrl)) return null
    try {
      const u = new URL(buildUrl(eventUrl, client))
      const domain = typeof window !== "undefined" ? window.location.hostname : undefined
      if (domain) u.searchParams.set("embed_domain", domain)
      u.searchParams.set("embed_type", "Inline")
      return u.toString()
    } catch {
      return null
    }
  }, [eventUrl, client?.id, client?.name, client?.email])

  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      try {
        const data = e?.data
        if (!data || typeof data !== "object") return
        if (data.event !== "calendly.event_scheduled") return
        // Capture minimal payload to backend
        await fetch("/api/integrations/calendly/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: client?.id,
            payload: data?.payload || null,
            createdByUserId: captureMetadata?.createdByUserId,
            createdByRole: captureMetadata?.createdByRole,
          }),
        })
      } catch {
        // no-op
      }
    }

    window.addEventListener("message", handler)
    return () => {
      window.removeEventListener("message", handler)
    }
  }, [client?.id, captureMetadata?.createdByUserId, captureMetadata?.createdByRole])

  return (
    iframeSrc ? (
      <iframe
        src={iframeSrc}
        className={className || "w-full"}
        style={{ minWidth: "320px", height: "720px" }}
        frameBorder={0}
        allowTransparency={true}
      />
    ) : (
      <div className="rounded border p-3 text-sm text-muted-foreground">Config invalid: verificați adresa evenimentului Calendly.</div>
    )
  )
}

export default CalendlyEmbed


