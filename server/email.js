const nodemailer = require('nodemailer');

/** Escape HTML special characters to prevent injection in email templates */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  console.log(`[email] GMAIL_USER set: ${!!user}, GMAIL_APP_PASSWORD set: ${!!pass}`);
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/**
 * Send a magic link email to the user via Gmail SMTP.
 * Falls back to console logging if GMAIL_USER / GMAIL_APP_PASSWORD are not set.
 */
async function sendMagicLink({ to, name, magicLink, token, ttlMinutes }) {
  const transporter = getTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[MAGIC LINK] No Gmail credentials — logging token instead`);
      console.log(`[MAGIC LINK] User: ${to} (${name})`);
      console.log(`[MAGIC LINK] Link (expires in ${ttlMinutes} min): ${magicLink}`);
      console.log(`[MAGIC LINK] Token only: ${token}\n`);
    } else {
      console.warn(`[MAGIC LINK] No Gmail credentials configured — magic link for ${to} could not be sent. Token redacted.`);
    }
    return;
  }

  const from = `"AI Learn" <${process.env.GMAIL_USER}>`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f0f13; color: #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #7c3aed; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;">
          <span style="font-size: 24px;">🧠</span>
        </div>
        <h1 style="margin: 0; font-size: 22px; color: #f8fafc;">Your AI Learn sign-in link</h1>
      </div>

      <p style="color: #94a3b8; margin: 0 0 24px;">Hi ${esc(name)},</p>
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
    await transporter.sendMail({
      from,
      to,
      subject: 'Your AI Learn sign-in link',
      html,
    });
    console.log(`[email] Magic link sent to ${to}`);
  } catch (err) {
    console.error('[email] Failed to send magic link email:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MAGIC LINK FALLBACK] Token for ${to}: ${token}`);
    }
  }
}

/**
 * Send a welcome email when a user account is first created.
 */
async function sendWelcomeEmail({ to, name }) {
  const transporter = getTransporter();
  const appUrl = process.env.MAGIC_LINK_BASE_URL || 'http://localhost:3000';

  if (!transporter) {
    console.log(`[email] Welcome email (no credentials): ${to} (${name})`);
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f0f13; color: #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #7c3aed; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;">
          <span style="font-size: 24px;">🧠</span>
        </div>
        <h1 style="margin: 0; font-size: 22px; color: #f8fafc;">Welcome to AI Learn!</h1>
      </div>
      <p style="color: #94a3b8; margin: 0 0 16px;">Hi ${esc(name)},</p>
      <p style="color: #94a3b8; margin: 0 0 24px;">Your account has been created. Sign in anytime using your magic link to start learning about LLMs, Agentic AI, and AI Security.</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${appUrl}" style="display: inline-block; background: #7c3aed; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Start Learning
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 0 0 24px;" />
      <p style="color: #475569; font-size: 12px; margin: 0;">AI Learn — Building AI literacy, one lesson at a time.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"AI Learn" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Welcome to AI Learn, ${name}!`,
      html,
    });
    console.log(`[email] Welcome email sent to ${to}`);
  } catch (err) {
    console.error('[email] Failed to send welcome email:', err.message);
  }
}

/**
 * Send a milestone / completion email.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.name
 * @param {string} opts.milestoneTitle  e.g. "LLM Fundamentals Complete!"
 * @param {string} opts.milestoneBody   e.g. "You've finished all lessons in LLM Fundamentals."
 */
async function sendMilestoneEmail({ to, name, milestoneTitle, milestoneBody }) {
  const transporter = getTransporter();
  const appUrl = process.env.MAGIC_LINK_BASE_URL || 'http://localhost:3000';

  if (!transporter) {
    console.log(`[email] Milestone email (no credentials): ${to} — ${milestoneTitle}`);
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f0f13; color: #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 12px;">🏆</div>
        <h1 style="margin: 0; font-size: 22px; color: #f8fafc;">${esc(milestoneTitle)}</h1>
      </div>
      <p style="color: #94a3b8; margin: 0 0 16px;">Hi ${esc(name)},</p>
      <p style="color: #94a3b8; margin: 0 0 32px;">${esc(milestoneBody)}</p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${appUrl}" style="display: inline-block; background: #7c3aed; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Keep Learning
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 0 0 24px;" />
      <p style="color: #475569; font-size: 12px; margin: 0;">AI Learn — Building AI literacy, one lesson at a time.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"AI Learn" <${process.env.GMAIL_USER}>`,
      to,
      subject: milestoneTitle,
      html,
    });
    console.log(`[email] Milestone email sent to ${to}: ${milestoneTitle}`);
  } catch (err) {
    console.error('[email] Failed to send milestone email:', err.message);
  }
}

module.exports = { sendMagicLink, sendWelcomeEmail, sendMilestoneEmail };
