import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 })

    const clientId = process.env.CALENDLY_CLIENT_ID!
    const clientSecret = process.env.CALENDLY_CLIENT_SECRET!
    const redirectUri = process.env.NEXT_PUBLIC_CALENDLY_REDIRECT_URI!

    const tokenResp = await fetch("https://auth.calendly.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    })
    if (!tokenResp.ok) {
      const err = await tokenResp.text()
      return NextResponse.json({ error: "Token exchange failed", details: err }, { status: 500 })
    }
    const tokens = await tokenResp.json()

    // Store tokens in a secure place – for demo return minimal info (do not do this in prod)
    // You would save access_token/refresh_token hashed or in a secrets store
    return NextResponse.json({ ok: true, tokens })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 })
  }
}


