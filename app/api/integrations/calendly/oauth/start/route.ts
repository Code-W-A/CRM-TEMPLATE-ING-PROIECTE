import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const clientId = process.env.CALENDLY_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_CALENDLY_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Missing CALENDLY_CLIENT_ID or NEXT_PUBLIC_CALENDLY_REDIRECT_URI" }, { status: 500 })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "default",
  })

  const url = `https://auth.calendly.com/oauth/authorize?${params.toString()}`
  return NextResponse.redirect(url)
}


