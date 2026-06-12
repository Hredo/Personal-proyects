import nodemailer from "nodemailer"
import { getServerEnv } from "@/lib/env"
import { SITE } from "@/lib/site"

let transport: nodemailer.Transporter | null = null

function getTransport(): nodemailer.Transporter | null {
  if (transport) return transport
  const env = getServerEnv()
  const gmailPw = env.GMAIL_APP_PASSWORD

  if (gmailPw) {
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth: {
        user: "globalhoopstats@gmail.com",
        pass: gmailPw,
      },
    })
    return transport
  }
  return null
}

async function sendEmail(
  to: string,
  subject: string,
  text: string,
): Promise<boolean> {
  const env = getServerEnv()
  const from = env.AUTH_EMAIL_FROM
  const tr = getTransport()

  if (tr) {
    try {
      await tr.sendMail({
        from: `${SITE.name} <${from}>`,
        to,
        subject,
        text,
      })
      return true
    } catch (err) {
      console.error("[auth:email] SMTP send failed:", err)
      return false
    }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${SITE.name} <${from}>`,
          to: [to],
          subject,
          text,
        }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => "")
        console.error(`[auth:email] Resend error ${res.status}: ${body.slice(0, 300)}`)
        return false
      }
      return true
    } catch (err) {
      console.error("[auth:email] Resend fetch failed:", err)
      return false
    }
  }

  console.info(`[auth:email] (no GMAIL_APP_PASSWORD / RESEND_API_KEY) To: ${to} | Subject: ${subject}`)
  console.info(`[auth:email] Body:\n${text}`)
  return true
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<boolean> {
  return sendEmail(
    to,
    "Reset your password - Global Hoop Stats",
    [
      `We received a request to reset the password for your ${SITE.name} account.`,
      "",
      `Click the link below to set a new password. This link expires in 15 minutes.`,
      "",
      resetUrl,
      "",
      "If you didn't request this, you can safely ignore this email.",
      "",
      "---",
      `${SITE.name} · ${SITE.url}`,
      SITE.contact,
    ].join("\n"),
  )
}

export async function sendTwoFactorCodeEmail(
  to: string,
  code: string,
): Promise<boolean> {
  return sendEmail(
    to,
    `Your verification code: ${code} - Global Hoop Stats`,
    [
      `Your two-factor authentication code is:`,
      "",
      code,
      "",
      "This code expires in 5 minutes.",
      "",
      "If you didn't attempt to sign in, please change your password immediately.",
      "",
      "---",
      `${SITE.name} · ${SITE.url}`,
      SITE.contact,
    ].join("\n"),
  )
}

export async function sendTwoFactorSetupEmail(
  to: string,
  code: string,
): Promise<boolean> {
  return sendEmail(
    to,
    `Confirm two-factor authentication setup - Global Hoop Stats`,
    [
      `Please use the following code to confirm enabling two-factor authentication:`,
      "",
      code,
      "",
      "This code expires in 10 minutes.",
      "",
      "If you didn't request this, please secure your account immediately.",
      "",
      "---",
      `${SITE.name} · ${SITE.url}`,
      SITE.contact,
    ].join("\n"),
  )
}
