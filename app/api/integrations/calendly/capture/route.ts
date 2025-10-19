import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const clientId: string | undefined = body?.clientId
    const createdByUserId: string | undefined = body?.createdByUserId
    const createdByRole: string | undefined = body?.createdByRole
    const payload = body?.payload || null

    const db = getAdminDb()
    const now = new Date()

    const eventUri = payload?.event?.uri || null
    const inviteeUri = payload?.invitee?.uri || null
    const scheduledAt = payload?.event?.start_time || null

    const docData = {
      clientId: clientId || null,
      eventUri,
      inviteeUri,
      scheduledAt,
      raw: payload || null,
      createdAt: now,
      createdByUserId: createdByUserId || null,
      createdByRole: createdByRole || null,
    }

    if (clientId) {
      await db.collection("clienti").doc(clientId).collection("appointments").add(docData)
    }
    // Always also store in a global collection for cross-viewing
    await db.collection("appointments_global").add(docData)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Calendly capture error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}


