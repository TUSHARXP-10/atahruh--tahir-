import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { db } from "./db";
import { emailLayout, sendEmail } from "./email";

const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const OTP_SUBJECT: Record<string, string> = {
  "sign-in": "Your Aayat al-Ruh sign-in code",
  "email-verification": "Verify your email",
  "forget-password": "Reset your password",
  "change-email": "Confirm your new email",
};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "customer", input: false },
      phone: { type: "string", required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      // Read on every page view; shoppers behind one mobile/office IP must never be throttled here
      "/get-session": false,
      // Brute-force sensitive endpoints stay tight
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 300, max: 5 },
      "/sign-in/email-otp": { window: 60, max: 10 },
      "/email-otp/send-verification-otp": { window: 300, max: 5 },
      "/forget-password/email-otp": { window: 300, max: 5 },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      async sendVerificationOTP({ email, otp, type }) {
        void sendEmail({
          to: email,
          subject: OTP_SUBJECT[type] ?? "Your code",
          text: `Your Aayat al-Ruh code is ${otp}. It expires in 10 minutes.`,
          html: emailLayout({
            title: OTP_SUBJECT[type] ?? "Your code",
            preheader: `Your code is ${otp}`,
            body: `<p>Your one-time code is</p>
<p style="font-family:Georgia,serif;font-size:34px;letter-spacing:10px;color:#e8cd92;margin:18px 0">${otp}</p>
<p style="color:#b8ad9b">It expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
          }),
        });
      },
    }),
    nextCookies(),
  ],
});

export const authFeatures = { google: googleEnabled };

export type AuthSession = typeof auth.$Infer.Session;
