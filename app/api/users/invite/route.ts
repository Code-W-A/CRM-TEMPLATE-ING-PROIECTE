import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { to, subject, content, html, attachments } = await request.json()
    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: "Destinatari lipsă" }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "mail.nrg-acces.ro",
      port: Number(process.env.EMAIL_PORT || 465),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || "CRM@nrg-acces.ro",
        pass: process.env.EMAIL_PASS || "CRM@nrg25",
      },
    })

    await transporter.sendMail({
      from: `Customer Relationship Management <${process.env.EMAIL_USER || "CRM@nrg-acces.ro"}>`,
      to,
      subject: subject || "Invitație acces Portal Client – CRM",
      text: content || "Vă-am creat acces în Portalul Client CRM.",
      html: html || undefined,
      attachments: Array.isArray(attachments) ? attachments.map((a: any) => ({
        filename: String(a?.filename || 'attachment'),
        content: a?.content,
        encoding: a?.encoding || undefined,
        contentType: a?.contentType || undefined,
      })) : undefined,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Invite email error", e)
    return NextResponse.json({ error: "Eroare trimitere invitație" }, { status: 500 })
  }
}


