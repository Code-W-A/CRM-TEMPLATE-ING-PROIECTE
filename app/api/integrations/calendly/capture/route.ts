import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const clientId: string | undefined = body?.clientId
    const payload = body?.payload || null
    if (!clientId) {
      return NextResponse.json({ error: "Missing clientId" }, { status: 400 })
    }

    const db = getAdminDb()
    const now = new Date()

    const eventUri = payload?.event?.uri || null
    const inviteeUri = payload?.invitee?.uri || null
    const scheduledAt = payload?.event?.start_time || null

    await db
      .collection("clienti")
      .doc(clientId)
      .collection("appointments")
      .add({
        eventUri,
        inviteeUri,
        scheduledAt,
        raw: payload || null,
        createdAt: now,
      })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Calendly capture error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}


