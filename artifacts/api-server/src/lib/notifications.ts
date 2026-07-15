import nodemailer from "nodemailer";
import { logger } from "./logger";

export interface NotificationResult {
  sent: boolean;
  method: string;
  error?: string | null;
}

export async function sendIrrigationAlert(
  email: string,
  farmName: string,
  message: string
): Promise<NotificationResult> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    logger.info(
      { email, farmName, message },
      "Notification queued (GMAIL_USER or GMAIL_APP_PASSWORD not configured)"
    );
    return { sent: false, method: "console-log", error: "No Gmail credentials configured" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    await transporter.sendMail({
      from: `"Precision Harvest AI" <${gmailUser}>`,
      to: email,
      subject: `Irrigation Alert: ${farmName}`,
      html: buildEmailHtml(farmName, message),
      text: `${farmName}: ${message}`,
    });

    logger.info({ email, farmName }, "Irrigation alert sent via Gmail");
    return { sent: true, method: "gmail", error: null };
  } catch (err) {
    logger.error({ err, email, farmName }, "Failed to send via Gmail");
    return { sent: false, method: "gmail", error: (err as Error).message };
  }
}

function buildEmailHtml(farmName: string, message: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', sans-serif; background: #131313; color: #e5e2e1; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: #1c1b1b; border: 1px solid #3c4a42; border-radius: 16px; padding: 32px;">
    <div style="margin-bottom: 24px;">
      <span style="color: #10B981; font-size: 24px; font-weight: 700;">Precision Harvest</span>
      <span style="display: inline-block; margin-left: 12px; background: #10B981; color: #003824; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; vertical-align: middle;">AI ALERT</span>
    </div>
    <h2 style="color: #e5e2e1; font-size: 20px; font-weight: 600; margin-bottom: 8px;">${farmName}</h2>
    <p style="color: #bbcabf; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${message}</p>
    <hr style="border: none; border-top: 1px solid #3c4a42; margin-bottom: 24px;">
    <p style="color: #86948a; font-size: 12px;">This is an automated alert from your Precision Harvest AI system. Irrigation decisions are made autonomously based on real-time weather data.</p>
  </div>
</body>
</html>`;
}
