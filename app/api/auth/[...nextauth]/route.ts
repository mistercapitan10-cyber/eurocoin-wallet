/**
 * NextAuth.js API Route Handler
 * Handles all OAuth authentication requests
 *
 * Endpoints:
 * - GET  /api/auth/signin         - Sign in page
 * - POST /api/auth/signin/:provider - Initiate OAuth flow
 * - GET  /api/auth/callback/:provider - OAuth callback
 * - POST /api/auth/signout        - Sign out
 * - GET  /api/auth/session        - Get current session
 * - GET  /api/auth/csrf           - Get CSRF token
 * - GET  /api/auth/providers      - Get available providers
 */

import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Export GET and POST handlers from NextAuth config
const { GET: nextAuthGET, POST: nextAuthPOST } = handlers;

// Wrap handlers with error logging
export async function GET(request: NextRequest) {
  try {
    console.log("[AUTH ROUTE] GET request:", {
      url: request.url,
      pathname: request.nextUrl.pathname,
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    });

    const response = await nextAuthGET(request);

    console.log("[AUTH ROUTE] GET response:", {
      status: response.status,
      statusText: response.statusText,
    });

    return response;
  } catch (error) {
    console.error("[AUTH ROUTE] GET error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
    });

    return NextResponse.json(
      {
        error: "Authentication error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH ROUTE] POST request:", {
      url: request.url,
      pathname: request.nextUrl.pathname,
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    });

    const response = await nextAuthPOST(request);

    console.log("[AUTH ROUTE] POST response:", {
      status: response.status,
      statusText: response.statusText,
    });

    return response;
  } catch (error) {
    console.error("[AUTH ROUTE] POST error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
    });

    return NextResponse.json(
      {
        error: "Authentication error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// Note: NextAuth v5 automatically handles all authentication routes
// No need to manually define each endpoint
