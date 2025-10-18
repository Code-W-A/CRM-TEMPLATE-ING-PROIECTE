import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const token = process.env.CALENDLY_PERSONAL_TOKEN
    if (!token) return NextResponse.json({ error: "Missing CALENDLY_PERSONAL_TOKEN" }, { status: 500 })

    // Get current user
    const meResp = await fetch("https://api.calendly.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!meResp.ok) return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    const me = await meResp.json()
    const userUri = me?.resource?.uri
    if (!userUri) return NextResponse.json({ error: "User URI not found" }, { status: 500 })

    // List event types
    const evResp = await fetch(`https://api.calendly.com/event_types?user=${encodeURIComponent(userUri)}&active=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!evResp.ok) return NextResponse.json({ error: "Failed to fetch event types" }, { status: 500 })
    const data = await evResp.json()
    return NextResponse.json({ ok: true, event_types: data?.collection || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 })
  }
}


