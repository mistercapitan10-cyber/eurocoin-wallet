/**
 * NextAuth.js v5 Configuration
 * Unified authentication system supporting OAuth (Google) and MetaMask
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Email from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { VerificationEmail } from "@/emails/VerificationEmail";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/database/drizzle";
import { users, accounts, sessions, verificationTokens } from "@/lib/database/auth-schema";
import type { AuthType } from "@/types/auth";

// =============================================================================
// TypeScript Module Augmentation
// =============================================================================

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      authType: AuthType;
      email?: string;
      name?: string;
      image?: string;
      walletAddress?: `0x${string}`;
    } & DefaultSession["user"];
  }

  interface User {
    authType: AuthType;
    walletAddress?: `0x${string}`;
  }
}

// =============================================================================
// Database Adapter Configuration
// =============================================================================

// Email provider requires adapter for storing verification tokens
// Enable adapter only if DATABASE_URL is available
let adapter: ReturnType<typeof DrizzleAdapter> | undefined;

try {
  if (process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_URL) {
    // Use DrizzleAdapter with custom schema
    // This ensures it uses the correct table names: users, accounts, sessions, verification_tokens
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter = DrizzleAdapter(db, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usersTable: users as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accountsTable: accounts as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessionsTable: sessions as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      verificationTokensTable: verificationTokens as any,
    }) as any;
    console.log("[AUTH] ✅ Database adapter enabled for email authentication");
  } else {
    console.warn(
      "[AUTH] ⚠️  DATABASE_URL not set - email authentication requires database adapter",
    );
    console.warn(
      "[AUTH] ⚠️  Set DATABASE_URL and run 'npm run auth:migrate' to enable email login",
    );
  }
} catch (error) {
  console.error("[AUTH] ❌ Failed to initialize database adapter:", error);
  console.warn("[AUTH] ⚠️  Email authentication will not work without adapter");
  adapter = undefined;
}

// =============================================================================
// NextAuth Configuration
// =============================================================================

// Check if NEXTAUTH_SECRET is set (critical for NextAuth to work)
if (!process.env.NEXTAUTH_SECRET) {
  console.warn("[AUTH] ⚠️  NEXTAUTH_SECRET is not set. NextAuth may not work correctly.");
  console.warn("[AUTH] ⚠️  Generate a secret with: openssl rand -base64 32");
}

// Log environment configuration (without sensitive values)
console.log("[AUTH] Configuration check:", {
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  nextAuthUrl: process.env.NEXTAUTH_URL || "not set",
  hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasResendApiKey: !!process.env.RESEND_API_KEY,
  senderEmail: process.env.SENDER_EMAIL || "not set",
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV,
});

// Validate NEXTAUTH_URL format
const nextAuthUrl = process.env.NEXTAUTH_URL;
if (nextAuthUrl) {
  try {
    const url = new URL(nextAuthUrl);
    console.log("[AUTH] NEXTAUTH_URL validated:", {
      protocol: url.protocol,
      host: url.host,
      origin: url.origin,
    });
  } catch {
    console.error("[AUTH] ❌ Invalid NEXTAUTH_URL format:", nextAuthUrl);
    console.error("[AUTH] ❌ NEXTAUTH_URL must be a valid URL (e.g., https://www.euro-coin.eu)");
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // ---------------------------------------------------------------------------
  // Secret for JWT signing (required for production)
  // ---------------------------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,

  // ---------------------------------------------------------------------------
  // Trust Host (required for production/Vercel)
  // ---------------------------------------------------------------------------
  trustHost: true, // Trust the host header from reverse proxy (Vercel)

  // ---------------------------------------------------------------------------
  // Base URL (explicit for production)
  // ---------------------------------------------------------------------------
  ...(nextAuthUrl && {
    baseUrl: nextAuthUrl,
  }),

  // ---------------------------------------------------------------------------
  // Database Adapter (optional)
  // ---------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: adapter as any,

  // ---------------------------------------------------------------------------
  // OAuth Providers
  // ---------------------------------------------------------------------------
  providers: [
    ...createEmailProvider(),
    // Only add Google provider if credentials are available
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
            allowDangerousEmailAccountLinking: true, // Allow linking email to existing wallet account
          }),
        ]
      : (() => {
          console.warn(
            "[AUTH] Google OAuth provider disabled: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set",
          );
          return [];
        })()),
  ],

  // ---------------------------------------------------------------------------
  // Session Strategy
  // ---------------------------------------------------------------------------
  session: {
    strategy: "jwt", // Use JWT for serverless compatibility (Vercel)
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------
  callbacks: {
    /**
     * Called when user signs in
     * Good place to check if user exists and update authType
     */
    async signIn({ user, account, profile }) {
      // Log sign-in attempt
      console.log("[AUTH] Sign in attempt:", {
        provider: account?.provider,
        email: profile?.email || user?.email,
        userId: user?.id,
        accountId: account?.providerAccountId,
      });

      // Always allow sign in (validation happens in other callbacks)
      return true;
    },

    /**
     * Called whenever a JWT is created or updated
     * Add custom fields to JWT token
     */
    async jwt({ token, user, trigger, account }) {
      // On first sign in (when user object exists)
      if (user) {
        token.userId = user.id;
        token.authType = "email"; // OAuth users are always 'email' type
        token.walletAddress = user.walletAddress;

        console.log("[AUTH] JWT created:", {
          userId: user.id,
          authType: "email",
          email: user.email,
          provider: account?.provider,
          accountId: account?.providerAccountId,
        });
      }

      // On token refresh
      if (trigger === "update") {
        console.log("[AUTH] JWT updated:", {
          userId: token.userId,
          email: token.email,
        });
      }

      return token;
    },

    /**
     * Called whenever a session is checked
     * Add custom fields to session object
     */
    async session({ session, token }) {
      console.log("[AUTH] Session callback called:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasToken: !!token,
        tokenUserId: token?.userId,
        tokenAuthType: token?.authType,
      });

      if (session.user) {
        session.user.id = token.userId as string;
        session.user.authType = (token.authType as AuthType) || "email";
        session.user.walletAddress = token.walletAddress as `0x${string}` | undefined;

        console.log("[AUTH] Session updated:", {
          userId: session.user.id,
          email: session.user.email,
          authType: session.user.authType,
        });
      }

      return session;
    },

    /**
     * Called on redirect (sign in, sign out, etc.)
     * Control where users are redirected
     */
    async redirect({ url, baseUrl }) {
      console.log("[AUTH] Redirect callback called:", {
        url,
        baseUrl,
        envNextAuthUrl: process.env.NEXTAUTH_URL,
      });

      // Allows relative callback URLs
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log("[AUTH] Redirect to relative URL:", redirectUrl);
        return redirectUrl;
      }

      // Allows callback URLs on the same origin
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          console.log("[AUTH] Redirect to same origin:", url);
          return url;
        }
      } catch (error) {
        console.warn("[AUTH] Invalid URL in redirect:", url, error);
      }

      // Default redirect to home page
      console.log("[AUTH] Default redirect to baseUrl:", baseUrl);
      return baseUrl;
    },
  },

  // ---------------------------------------------------------------------------
  // Events (for logging/analytics)
  // ---------------------------------------------------------------------------
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("[AUTH EVENT] User signed in:", {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
        accountId: account?.providerAccountId,
      });

      // Here you can send analytics events, notifications, etc.
      // Example: trackEvent('user_signin', { provider: account?.provider });
    },

    async signOut() {
      console.log("[AUTH EVENT] User signed out");
    },

    async createUser({ user }) {
      console.log("[AUTH EVENT] New user created:", {
        userId: user.id,
        email: user.email,
      });

      // Send welcome email, create initial data, etc.
    },

    async linkAccount({ user, account }) {
      console.log("[AUTH EVENT] Account linked:", {
        userId: user.id,
        provider: account.provider,
      });
    },
  },

  // ---------------------------------------------------------------------------
  // Pages (custom UI)
  // ---------------------------------------------------------------------------
  pages: {
    signIn: "/login", // Custom login page
    error: "/login", // Redirect errors to login page
    // signOut: '/login',
    // verifyRequest: '/auth/verify',
  },

  // ---------------------------------------------------------------------------
  // Security
  // ---------------------------------------------------------------------------
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Debug (only in development)
  // ---------------------------------------------------------------------------
  debug: process.env.NODE_ENV === "development",
});

// =============================================================================
// Helper Functions
// =============================================================================

function createEmailProvider() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.SENDER_EMAIL ?? "noreply@resend.dev";

  // Check if email auth is explicitly disabled
  if (process.env.DISABLE_EMAIL_AUTH === "true") {
    console.warn("[AUTH] Email provider disabled by DISABLE_EMAIL_AUTH=true");
    return [];
  }

  // Check if RESEND_API_KEY is set
  if (!resendApiKey) {
    console.warn("[AUTH] RESEND_API_KEY is not set. Email sign-in is disabled.");
    console.warn("[AUTH] To enable email auth, set RESEND_API_KEY in your .env.local");
    return [];
  }

  // In development, use feature flag (optional check)
  // In production, email auth works if RESEND_API_KEY is set
  if (process.env.NODE_ENV !== "production") {
    const enableEmailAuth = process.env.ENABLE_EMAIL_AUTH !== "false"; // Default: enabled if key is set
    if (!enableEmailAuth) {
      console.warn(
        "[AUTH] Email provider disabled in development. Set ENABLE_EMAIL_AUTH=true to enable.",
      );
      return [];
    }
    console.log("[AUTH] Email provider enabled in development mode");
  }

  const resend = new Resend(resendApiKey);
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "EuroCoin Wallet";

  return [
    Email({
      from: fromAddress,
      maxAge: 24 * 60 * 60, // 24 hours
      // Provide minimal dummy server config to satisfy NextAuth requirement
      // This config is never actually used because sendVerificationRequest overrides it
      server: {
        host: "localhost",
        port: 587,
        auth: {
          user: "resend",
          pass: "dummy",
        },
      },
      // Custom email sending function using Resend API (this overrides default Nodemailer behavior)
      async sendVerificationRequest({ identifier, url }) {
        try {
          console.log("[AUTH][EMAIL] Attempting to send verification email", {
            to: identifier,
            from: fromAddress,
            urlLength: url.length,
            hasResendApiKey: !!resendApiKey,
          });

          // Build email HTML first
          let emailHtml: string;
          try {
            emailHtml = await buildVerificationEmailHtml({ url, appName });
            console.log("[AUTH][EMAIL] Email HTML built successfully", {
              htmlLength: emailHtml.length,
            });
          } catch (htmlError) {
            console.error("[AUTH][EMAIL] Failed to build email HTML:", htmlError);
            throw new Error(
              `Failed to build email HTML: ${htmlError instanceof Error ? htmlError.message : String(htmlError)}`,
            );
          }

          // Send email via Resend
          const result = await resend.emails.send({
            from: fromAddress,
            to: identifier,
            subject: `${appName}: Sign in link`,
            html: emailHtml,
            text: buildVerificationEmailText({ url, appName }),
          });

          if (result.error) {
            console.error("[AUTH][EMAIL] Resend API error:", {
              error: result.error,
              code: result.error.name,
              message: result.error.message,
              identifier,
              from: fromAddress,
            });
            throw result.error;
          }

          console.log("[AUTH][EMAIL] Verification email sent successfully", {
            identifier,
            emailId: result.data?.id,
            from: fromAddress,
          });
        } catch (error) {
          console.error("[AUTH][EMAIL] Failed to send verification email", {
            identifier,
            from: fromAddress,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            errorDetails: error,
          });
          // Re-throw to let NextAuth handle it
          throw error;
        }
      },
    }),
  ];
}

async function buildVerificationEmailHtml(params: { url: string; appName: string }) {
  const { url, appName } = params;

  // Render email using React Email
  return await render(React.createElement(VerificationEmail, { url, appName }));
}

function buildVerificationEmailText(params: { url: string; appName: string }) {
  const { url, appName } = params;
  return `Sign in to ${appName}\n\nUse the link below to sign in to your account:\n${url}\n\nIf you didn't request to sign in, please ignore this email.`;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get current session on server side
 * Use this in Server Components, API Routes, Server Actions
 */
export async function getSession() {
  return await auth();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await auth();
  return !!session?.user;
}

/**
 * Get current user ID
 */
export async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id;
}

/**
 * Check if user has specific auth type
 */
export async function hasAuthType(authType: AuthType) {
  const session = await auth();
  return session?.user?.authType === authType;
}

/**
 * Check if user can make transactions (wallet users only)
 */
export async function canMakeTransactions() {
  const session = await auth();
  return session?.user?.authType === "wallet";
}
