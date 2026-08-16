/**
 * QuestMore — WhatsApp / SMS Alert Service
 * Powered by Termii (https://termii.com) — Nigerian-native messaging API
 *
 * Setup:
 *  1. Sign up at https://app.termii.com
 *  2. Get your API Key from Settings → API Keys
 *  3. Add TERMII_API_KEY=your_key to your .env.local / Vercel env vars
 *
 * Falls back to console.log when key is not configured (dev/staging).
 */

const TERMII_API_KEY = process.env.TERMII_API_KEY || "";
const TERMII_BASE_URL = "https://v3.api.termii.com/api/sms/send";
const ADMIN_PHONE = process.env.ADMIN_WHATSAPP || "2348156307091";

// Formats a raw phone number to international format (strip leading 0, add 234)
function toIntlPhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  if (digits.length === 10) return "234" + digits;
  return digits;
}

interface AlertPayload {
  to: string;         // raw phone number
  message: string;   // text to send
  channel?: "whatsapp" | "generic";
}

/**
 * Core send function. Uses Termii's WhatsApp channel (or SMS fallback).
 */
async function sendAlert({ to, message, channel = "whatsapp" }: AlertPayload) {
  const phone = toIntlPhone(to);

  if (!TERMII_API_KEY) {
    // Dev/staging: just log instead of throwing
    console.log(`[QuestMore WhatsApp MOCK] → ${phone}: ${message}`);
    return { success: true, mock: true };
  }

  try {
    const res = await fetch(TERMII_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        from: "QuestMore",
        sms: message,
        type: "plain",
        channel,
        api_key: TERMII_API_KEY,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[QuestMore WhatsApp] Termii error:", data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[QuestMore WhatsApp] Network error:", err);
    return { success: false, error: String(err) };
  }
}

// ─────────────────────────────────────────
// Named alert templates
// ─────────────────────────────────────────

/** Fired when a new booking is created */
export async function alertNewBooking({
  clientPhone,
  clientName,
  requestCode,
  totalAmount,
  services,
}: {
  clientPhone?: string | null;
  clientName: string;
  requestCode: string;
  totalAmount: number;
  services: string;
}) {
  const promises: Promise<any>[] = [];

  // → Client
  if (clientPhone) {
    promises.push(
      sendAlert({
        to: clientPhone,
        message:
          `✅ *QuestMore Booking Confirmed!*\n\nHi ${clientName}, your request *${requestCode}* has been received.\n` +
          `📋 Services: ${services}\n💰 Amount: ₦${totalAmount.toLocaleString()}\n\n` +
          `Our team is reviewing your booking. You'll be notified once a specialist is assigned.\n\n` +
          `📞 Questions? WhatsApp: +2348156307091\n✉️ questdmore@gmail.com`,
      })
    );
  }

  // → Admin
  promises.push(
    sendAlert({
      to: ADMIN_PHONE,
      message:
        `🔔 *New QuestMore Booking!*\n\nClient: ${clientName}\nCode: *${requestCode}*\n` +
        `Services: ${services}\n💰 Amount: ₦${totalAmount.toLocaleString()}\n\n` +
        `📌 Action required: Review and assign a specialist via Admin Panel.`,
    })
  );

  await Promise.allSettled(promises);
}

/** Fired when admin changes job status */
export async function alertJobStatusUpdate({
  clientPhone,
  clientName,
  requestCode,
  newStatus,
  providerName,
  providerPhone,
  statusNote,
}: {
  clientPhone?: string | null;
  clientName: string;
  requestCode: string;
  newStatus: string;
  providerName?: string | null;
  providerPhone?: string | null;
  statusNote?: string | null;
}) {
  if (!clientPhone) return;

  const statusMessages: Record<string, string> = {
    awaiting_assignment:
      `⚙️ *Job Approved!*\n\nHi ${clientName}, your request *${requestCode}* has been approved by QuestMore Admin.\nWe are now matching you with a certified specialist. Stay tuned!`,
    provider_assigned:
      `👷 *Specialist Assigned!*\n\nHi ${clientName}, a verified specialist has been assigned to your request *${requestCode}*.\n` +
      `👷 Provider: *${providerName || "QuestMore Specialist"}*\n` +
      (providerPhone ? `📞 Contact: wa.me/${toIntlPhone(providerPhone)}\n` : "") +
      `\nThey will contact you shortly to confirm the schedule.`,
    provider_accepted:
      `📅 *Schedule Confirmed!*\n\nHi ${clientName}, your specialist has accepted the job schedule for *${requestCode}*. Work will begin as planned.`,
    work_in_progress:
      `🔨 *Work Has Begun!*\n\nHi ${clientName}, your specialist is now on-site and working on *${requestCode}*.\nYou can track progress in the QuestMore app under "My Activity".`,
    work_completed:
      `🎉 *Work Complete — Action Required!*\n\nHi ${clientName}, your specialist has finished the job for *${requestCode}*.\n\n` +
      `Please inspect the work and confirm completion in the QuestMore app to activate your warranty.\n\n` +
      `📞 Support: +2348156307091`,
    completed:
      `✅ *Job Closed Successfully!*\n\nHi ${clientName}, project *${requestCode}* is now fully closed with QuestMore Quality Assurance Warranty active. Thank you for choosing us! 🙏`,
    cancelled:
      `❌ *Request Cancelled*\n\nHi ${clientName}, your request *${requestCode}* has been cancelled.\n` +
      (statusNote ? `Reason: ${statusNote}\n` : "") +
      `\nFor assistance, contact us: +2348156307091`,
  };

  const msg = statusMessages[newStatus];
  if (!msg) return;

  await sendAlert({ to: clientPhone, message: msg });
}

/** Fired when admin uploads a milestone photo */
export async function alertMilestonePhoto({
  clientPhone,
  clientName,
  requestCode,
  stageLabel,
}: {
  clientPhone?: string | null;
  clientName: string;
  requestCode: string;
  stageLabel: string;
}) {
  if (!clientPhone) return;
  await sendAlert({
    to: clientPhone,
    message:
      `📸 *New Site Photo Added!*\n\nHi ${clientName}, QuestMore Admin just uploaded a progress photo for your project *${requestCode}* at the "${stageLabel}" stage.\n\nOpen your QuestMore app → My Activity → View Progress to see the update.`,
  });
}
