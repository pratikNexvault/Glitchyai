import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const internalKey = req.headers["x-internal-key"];
  if (!internalKey || internalKey !== (process.env.SESSION_SECRET || "")) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    res.status(200).json({ ok: false, error: "SMTP isn't configured yet." });
    return;
  }

  const { to, subject, body } = req.body || {};
  const recipient = (to && String(to).trim()) || process.env.DEFAULT_EMAIL_TO;

  if (!recipient) {
    res.status(200).json({ ok: false, error: "No recipient set." });
    return;
  }

  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"Lumis AI" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject: subject || "Message from Lumis AI",
      text: body || "",
    });

    res.status(200).json({ ok: true, to: recipient });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
}
