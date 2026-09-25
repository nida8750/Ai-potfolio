import "server-only";
import nodemailer from "nodemailer";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";
import { env, isSmtpConfigured } from "@/lib/env";
import {
  inquiryReplyHtml,
  inquiryReplySubject,
  inquiryReplyText,
} from "@/lib/mail/inquiry-reply";

export function smtpFromAddress(): string {
  const address = env.smtpFrom || env.smtpUser || CONTACT_EMAIL;
  return `${SITE_NAME} <${address}>`;
}

async function sendSmtpMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure || env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPassword,
    },
  });

  await transporter.sendMail({
    from: smtpFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export async function sendVerificationEmail(input: {
  to: string;
  code: string;
}): Promise<void> {
  await sendSmtpMail({
    to: input.to,
    subject: `${SITE_NAME} verification code`,
    text: `Your ${SITE_NAME} verification code is ${input.code}. Enter this 6-digit code to verify your email. It expires in 30 minutes. If you did not create an account, ignore this email.`,
    html: `<p>Your ${SITE_NAME} verification code is <strong>${input.code}</strong>.</p><p>Enter this 6-digit code on the verify screen. It expires in 30 minutes.</p><p>If you did not create an account, ignore this email.</p>`,
  });
}

export async function sendInquiryThankYouEmail(input: {
  to: string;
  name: string;
  serviceTitle?: string;
  referenceId: string;
}): Promise<void> {
  await sendSmtpMail({
    to: input.to,
    subject: inquiryReplySubject(),
    text: inquiryReplyText(input),
    html: inquiryReplyHtml(input),
  });
}

export async function sendResetEmail(input: { to: string; code: string }): Promise<void> {
  await sendSmtpMail({
    to: input.to,
    subject: `${SITE_NAME} password reset code`,
    text: `Your ${SITE_NAME} password reset code is ${input.code}. Enter this 6-digit code to set a new password. It expires in 30 minutes. If you did not request a reset, ignore this email.`,
    html: `<p>Your ${SITE_NAME} password reset code is <strong>${input.code}</strong>.</p><p>Enter this 6-digit code to set a new password. It expires in 30 minutes.</p><p>If you did not request a reset, ignore this email.</p>`,
  });
}
