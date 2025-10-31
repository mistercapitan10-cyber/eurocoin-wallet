/**
 * NextAuth.js v5 Configuration
 * Unified authentication system supporting OAuth (Google) and MetaMask
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Email from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import { Resend } from "resend";
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
      walletAddress?: `0x${string}`;
    } & DefaultSession["user"];
  }

  interface User {
    authType: AuthType;
    walletAddress?: `0x${string}`;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
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
  if (process.env.DATABASE_URL) {
    // Use DrizzleAdapter with custom schema
    // This ensures it uses the correct table names: users, accounts, sessions, verification_tokens
    adapter = DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    });
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

export const { handlers, signIn, signOut, auth } = NextAuth({
  // ---------------------------------------------------------------------------
  // Database Adapter (optional)
  // ---------------------------------------------------------------------------
  adapter,

  // ---------------------------------------------------------------------------
  // OAuth Providers
  // ---------------------------------------------------------------------------
  providers: [
    ...createEmailProvider(),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      allowDangerousEmailAccountLinking: true, // Allow linking email to existing wallet account
    }),
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
        email: profile?.email,
        userId: user?.id,
      });

      // Always allow sign in (validation happens in other callbacks)
      return true;
    },

    /**
     * Called whenever a JWT is created or updated
     * Add custom fields to JWT token
     */
    async jwt({ token, user, trigger }) {
      // On first sign in (when user object exists)
      if (user) {
        token.userId = user.id;
        token.authType = "email"; // OAuth users are always 'email' type
        token.walletAddress = user.walletAddress;

        console.log("[AUTH] JWT created:", {
          userId: user.id,
          authType: "email",
          email: user.email,
        });
      }

      // On token refresh
      if (trigger === "update") {
        console.log("[AUTH] JWT updated:", {
          userId: token.userId,
        });
      }

      return token;
    },

    /**
     * Called whenever a session is checked
     * Add custom fields to session object
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.authType = (token.authType as AuthType) || "email";
        session.user.walletAddress = token.walletAddress as `0x${string}` | undefined;
      }

      return session;
    },

    /**
     * Called on redirect (sign in, sign out, etc.)
     * Control where users are redirected
     */
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;

      // Default redirect to home page
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
      });

      // Here you can send analytics events, notifications, etc.
      // Example: trackEvent('user_signin', { provider: account?.provider });
    },

    async signOut({ token }) {
      console.log("[AUTH EVENT] User signed out:", {
        userId: token?.userId,
      });
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
          });

          const result = await resend.emails.send({
            from: fromAddress,
            to: identifier,
            subject: `${appName}: ссылка для входа`,
            html: buildVerificationEmailHtml({ url, appName }),
            text: buildVerificationEmailText({ url, appName }),
          });

          if (result.error) {
            console.error("[AUTH][EMAIL] Resend API error:", {
              error: result.error,
              code: result.error.name,
              message: result.error.message,
            });
            throw result.error;
          }

          console.log("[AUTH][EMAIL] Verification email sent successfully", {
            identifier,
            emailId: result.data?.id,
          });
        } catch (error) {
          console.error("[AUTH][EMAIL] Failed to send verification email", {
            identifier,
            error: error instanceof Error ? error.message : String(error),
            errorDetails: error,
          });
          // Re-throw to let NextAuth handle it
          throw error;
        }
      },
    }),
  ];
}

function buildVerificationEmailHtml(params: { url: string; appName: string }) {
  const { url, appName } = params;

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${appName} — Sign in</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f7f7fb; color: #1a1a1f; padding: 32px; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 16px 32px rgba(24, 25, 31, 0.08); }
          .logo { font-size: 20px; font-weight: 700; color: #2f4cff; text-transform: uppercase; letter-spacing: 0.2em; }
          .headline { font-size: 24px; font-weight: 600; margin: 24px 0 12px; color: #111827; }
          .muted { color: #6b7280; font-size: 14px; line-height: 1.6; }
          .button { display: inline-block; margin: 32px 0; padding: 14px 24px; background: linear-gradient(135deg, #2f4cff, #6c7bff); color: #ffffff !important; text-decoration: none; border-radius: 999px; font-weight: 600; }
          .link { word-break: break-all; color: #2f4cff; text-decoration: none; font-size: 13px; }
          .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">${appName}</div>
          <h1 class="headline">Подтверждение входа</h1>
          <p class="muted">
            Мы получили запрос на вход в ${appName}. Нажмите на кнопку ниже, чтобы завершить авторизацию.
            Ссылка действует 24 часа и может быть использована только один раз.
          </p>
          <a class="button" href="${url}" style="display: inline-block; margin: 32px 0; padding: 14px 24px; background: linear-gradient(135deg, #2f4cff, #6c7bff); color: #ffffff !important; text-decoration: none; border-radius: 999px; font-weight: 600;">Войти в аккаунт</a>
          <p class="muted">
            Если кнопка не работает, скопируйте и вставьте эту ссылку в адресную строку браузера:
          </p>
          <p><a class="link" href="${url}">${url}</a></p>
          <p class="footer">
            Если вы не запрашивали вход, просто проигнорируйте это письмо. Ссылка станет недействительной автоматически.
          </p>
        </div>
      </body>
    </html>
  `;
}

function buildVerificationEmailText(params: { url: string; appName: string }) {
  const { url, appName } = params;
  return `Вход в ${appName}\n\nИспользуйте ссылку ниже, чтобы войти в свой аккаунт:\n${url}\n\nЕсли вы не запрашивали вход, просто проигнорируйте это письмо.`;
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
