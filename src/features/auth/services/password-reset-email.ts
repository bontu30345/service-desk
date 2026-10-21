export function getPasswordResetPublicOrigin(
  publicUrl = process.env.SERVICE_DESK_PUBLIC_URL,
) {
  if (!publicUrl) {
    throw new Error("Password recovery public URL is not configured.");
  }

  const url = new URL(publicUrl);
  if (
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && url.hostname === "localhost")) ||
    url.username ||
    url.password
  ) {
    throw new Error("Password recovery public URL is invalid.");
  }

  return url.origin;
}

export function isPasswordResetEmailConfigured() {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return false;
  }

  try {
    getPasswordResetPublicOrigin();
    return true;
  } catch {
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  rawToken: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Password recovery email is not configured.");
  }

  const resetUrl = new URL("/reset-password", getPasswordResetPublicOrigin());
  resetUrl.searchParams.set("token", rawToken);
  const safeUrl = resetUrl.toString();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your Service Desk password",
      text: `Use this link within 30 minutes to reset your Service Desk password: ${safeUrl}`,
      html: `<p>Use this link within 30 minutes to reset your Service Desk password:</p><p><a href="${safeUrl}">Reset password</a></p><p>If you did not request this, you can ignore this message.</p>`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Password recovery email delivery failed.");
  }
}
