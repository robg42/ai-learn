const { Resend } = require('resend');

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Send a magic link email to the user.
 * Falls back to console logging if RESEND_API_KEY is not set.
 */
async function sendMagicLink({ to, name, magicLink, token, ttlMinutes }) {
  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL || 'AI Learn <noreply@learn.robgregg.com>';

  if (!resend) {
    console.log(`\n[MAGIC LINK] No RESEND_API_KEY — logging token instead`);
    console.log(`[MAGIC LINK] User: ${to} (${name})`);
    console.log(`[MAGIC LINK] Link (expires in ${ttlMinutes} min): ${magicLink}`);
    console.log(`[MAGIC LINK] Token only: ${token}\n`);
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f0f13; color: #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #7c3aed; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;">
          <span style="font-size: 24px;">🧠</span>
        </div>
        <h1 style="margin: 0; font-size: 22px; color: #f8fafc;">Your AI Learn sign-in link</h1>
      </div>

      <p style="color: #94a3b8; margin: 0 0 24px;">Hi ${name},</p>
      <p style="color: #94a3b8; margin: 0 0 32px;">Click the button below to sign in. This link expires in ${ttlMinutes} minutes and can only be used once.</p>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${magicLink}"
           style="display: inline-block; background: #7c3aed; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Sign in to AI Learn
        </a>
      </div>

      <p style="color: #475569; font-size: 13px; margin: 0 0 8px;">Or paste this link into your browser:</p>
      <p style="color: #475569; font-size: 12px; word-break: break-all; margin: 0 0 32px;">${magicLink}</p>

      <hr style="border: none; border-top: 1px solid #1e293b; margin: 0 0 24px;" />
      <p style="color: #475569; font-size: 12px; margin: 0;">If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to,
      subject: 'Your AI Learn sign-in link',
      html,
    });
    console.log(`[email] Magic link sent to ${to}`);
  } catch (err) {
    // Fall back to console so sign-in still works even if email fails
    console.error('[email] Failed to send magic link email:', err.message);
    console.log(`[MAGIC LINK FALLBACK] Token for ${to}: ${token}`);
  }
}

module.exports = { sendMagicLink };
