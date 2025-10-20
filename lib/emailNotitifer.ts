import util from "util";
import nodemailer from "nodemailer";
import stringify from "fast-safe-stringify";

/**
 * Email notification utilities for errors and info (non-error notifiers).
 *
 * Environment variables used:
 * - NODE_ENV
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * - ALERT_EMAIL_TO, ALERT_EMAIL_FROM (optional)
 */

const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    ALERT_EMAIL_TO,
    ALERT_EMAIL_FROM,
} = process.env;

/** Escape HTML to safely render text inside email HTML. */
const htmlEscape = (s: string) =>
    s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

/** Safely prettify objects (handles circular refs). */
const safeStringifyPretty = (obj: unknown): string => {
    try {
        if (obj instanceof Error) {
            const err = obj as Error & { cause?: unknown };
            const shaped = {
                name: err.name,
                message: err.message,
                stack: err.stack,
                cause: err.cause,
            };
            return stringify(shaped, undefined, 2);
        }

        if (typeof obj === "string") return obj;

        return stringify(obj, undefined, 2);
    } catch {
        return util.inspect(obj, { depth: null, colors: false });
    }
};

type Level = "error" | "info";

/** Build both plain-text and HTML bodies */
const formatBodies = (level: Level, topic: string, payload: unknown) => {
    const prettyJson = safeStringifyPretty(payload);
    const textBody = `${topic}\n\n${prettyJson}`;

    const headerColor = level === "error" ? "#b00020" : "#0b6e0b";
    const label = level.toUpperCase();

    const htmlBody = `
    <div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
      <h3 style="margin:0 0 8px 0; color:${headerColor};">${htmlEscape(label)} — ${htmlEscape(
        topic,
    )}</h3>
      <div style="font-size:13px; line-height:1.4;">
        <pre style="white-space:pre-wrap; word-break:break-word; font-family: monospace; font-size: 12px; margin:0;">
${htmlEscape(prettyJson)}
        </pre>
      </div>
      <hr style="margin:12px 0;" />
      <div style="font-size:11px; color:#666;">Environment: ${htmlEscape(
        String(process.env.NODE_ENV ?? "unknown"),
    )}</div>
    </div>
  `;

    return { textBody, htmlBody };
};

/** Lazily create transporter; returns null if SMTP not configured. */
const buildTransporter = () => {
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        console.warn(
            "SMTP is not fully configured (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS). Email sending will be skipped.",
        );
        return null;
    }

    const smtpPort = Number(SMTP_PORT);
    const useSecure = smtpPort === 465;

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: smtpPort,
        secure: useSecure,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
};

type NotifyOptions = {
    /** override subject if needed */
    subject?: string;
    /** If true, force sending even when NODE_ENV !== "production" (useful for testing) */
    force?: boolean;
};

const dispatchNotification = async (
    level: Level,
    topic: string,
    payload: unknown,
    opts: NotifyOptions = {},
): Promise<void> => {
    const { subject: subjectOverride, force = false } = opts;

    // In non-production, by default just log to console (no email)
    if (process.env.NODE_ENV !== "production" && !force) {
        const tag = level === "error" ? "[alert:error simulated]" : "[alert:info simulated]";
        console.log(tag, topic, safeStringifyPretty(payload).slice(0, 2000));
        return;
    }

    if (!ALERT_EMAIL_TO) {
        console.warn("ALERT_EMAIL_TO is not set; skipping alert email.");
        return;
    }

    const mailer = buildTransporter();
    if (!mailer) {
        // transporter not configured — skip sending but do not throw
        return;
    }

    const { textBody, htmlBody } = formatBodies(level, topic, payload);

    const subjectLine =
        subjectOverride ??
        `${process.env.NODE_ENV ?? "unknown"} - ${level.toUpperCase()}: ${String(topic).slice(0, 100)}`;

    const fromAddress =
        ALERT_EMAIL_FROM ?? SMTP_USER ?? `no-reply@${process.env.VERCEL_URL ?? "example.com"}`;

    try {
        await mailer.sendMail({
            from: fromAddress,
            to: ALERT_EMAIL_TO,
            subject: subjectLine,
            text: textBody,
            html: htmlBody,
        });
    } catch (e) {
        const err = e as Error;
        console.error("Failed to send alert email:", err);
        throw e;
    }
};

/**
 * sendErrorNotice
 * - safe: never throws synchronously; returns a Promise that may reject if transporter/send fails.
 * - Use for error conditions.
 */
export const sendErrorNotice = async (
    topic: string,
    payload: unknown,
    opts: NotifyOptions = {},
): Promise<void> => {
    return dispatchNotification("error", topic, payload, opts);
};

/**
 * sendInfoNotice
 * - safe: never throws synchronously; returns a Promise that may reject if transporter/send fails.
 * - Use for non-error informational notifications.
 */
export const sendInfoNotice = async (
    topic: string,
    payload: unknown,
    opts: NotifyOptions = {},
): Promise<void> => {
    return dispatchNotification("info", topic, payload, opts);
};
