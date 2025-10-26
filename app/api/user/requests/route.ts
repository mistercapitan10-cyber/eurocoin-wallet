import { NextRequest, NextResponse } from "next/server";
import { getExchangeRequestsByWallet, getInternalRequestsByWallet } from "@/lib/database/queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("walletAddress");
    const type = searchParams.get("type") || "all";

    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    // Validate wallet address format (basic validation)
    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 });
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
      const exchangeRequests = await getExchangeRequestsByWallet(walletAddress);
      result.exchangeRequests = exchangeRequests;
    }

    if (type === "all" || type === "internal") {
      const internalRequests = await getInternalRequestsByWallet(walletAddress);
      result.internalRequests = internalRequests;
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return NextResponse.json({ error: "Failed to fetch user requests" }, { status: 500 });
  }
}
