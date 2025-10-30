import { NextRequest, NextResponse } from "next/server";
import {
  getExchangeRequestsByWallet,
  getInternalRequestsByWallet,
  getExchangeRequestsByEmail,
  getInternalRequestsByEmail,
} from "@/lib/database/queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("walletAddress");
    const userEmail = searchParams.get("userEmail");
    const type = searchParams.get("type") || "all";

    // Validate that at least one identifier is provided
    if (!walletAddress && !userEmail) {
      return NextResponse.json(
        { error: "Either walletAddress or userEmail is required" },
        { status: 400 }
      );
    }

    // Validate wallet address format if provided
    if (walletAddress) {
      if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
        return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 });
      }
    }

    // Validate userEmail format if provided
    if (userEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        return NextResponse.json({ error: "Invalid userEmail format" }, { status: 400 });
      }
    }

    // Fetch requests based on type
    const result: {
      exchangeRequests: any[];
      internalRequests: any[];
    } = {
      exchangeRequests: [],
      internalRequests: [],
    };

    if (type === "all" || type === "exchange") {
      const exchangeRequests = walletAddress
        ? await getExchangeRequestsByWallet(walletAddress)
        : await getExchangeRequestsByEmail(userEmail!);
      result.exchangeRequests = exchangeRequests;
    }

    if (type === "all" || type === "internal") {
      const internalRequests = walletAddress
        ? await getInternalRequestsByWallet(walletAddress)
        : await getInternalRequestsByEmail(userEmail!);
      result.internalRequests = internalRequests;
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return NextResponse.json({ error: "Failed to fetch user requests" }, { status: 500 });
  }
}
