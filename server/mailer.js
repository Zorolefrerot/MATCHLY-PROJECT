import nodemailer from "nodemailer";

export function recoveryAvailable(env = process.env) {
  if (!env.PUBLIC_ORIGIN) return false;
  if (env.RESEND_API_KEY && env.MAIL_FROM) return true;
  // Render Free blocks outbound SMTP ports. Its deployment must use HTTPS mail.
  return env.RENDER !== "true" && Boolean(env.SMTP_HOST && env.SMTP_FROM);
}
export async function sendRecovery(to, token, env = process.env) {
  const subject = "IDREM ZENKAI — Réinitialisation du mot de passe";
  const text = `Ce lien est valable 30 minutes : ${env.PUBLIC_ORIGIN}/reinitialiser?token=${token}\nSi tu n’es pas à l’origine de cette demande, ignore ce message.`;
  if (env.RESEND_API_KEY && env.MAIL_FROM) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("MAIL_DELIVERY_FAILED");
    return;
  }
  if (!recoveryAvailable(env)) throw new Error("MAIL_NOT_CONFIGURED");
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure: env.SMTP_PORT === "465",
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
    disableFileAccess: true,
    disableUrlAccess: true,
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  await transport.sendMail({ from: env.SMTP_FROM, to, subject, text });
}
