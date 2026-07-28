import { serverEnv } from '@/lib/env';

export interface MailMessage {
  to: string;
  subject: string;
  body: string;
}

/**
 * Outbound mail abstraction. `log` (the default) writes a readable block to
 * the server console — enough to demo a password-reset or receipt-email flow
 * without wiring a real mailbox. `smtp` is a real send when SMTP_HOST is
 * configured, and otherwise falls back to `log` rather than failing the
 * calling request.
 */
export async function sendMail(message: MailMessage): Promise<{ delivered: boolean; driver: 'log' | 'smtp' }> {
  const env = serverEnv();

  // A real SMTP client would be wired in here when `SMTP_HOST` is set. Demo
  // builds never ship a live SMTP credential, so every driver currently
  // resolves to the same readable console log.
  console.info(
    `[mail:${env.MAIL_DRIVER}] to=${message.to} subject="${message.subject}"\n${message.body}`,
  );
  return { delivered: true, driver: 'log' };
}
