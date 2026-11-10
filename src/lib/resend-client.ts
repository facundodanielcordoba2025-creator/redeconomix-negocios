import { Resend } from 'resend';

/**
 * RedEconomiX MAIL SYSTEM - L100
 * Centralized Resend client for transactional emails.
 */
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey && process.env.NODE_ENV === 'production') {
  console.warn('RESEND_API_KEY is missing. Emails will not be sent.');
}

export const resend = new Resend(resendApiKey || 'dummy-key');
