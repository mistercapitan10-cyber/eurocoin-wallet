import { NextRequest, NextResponse } from "next/server";
import {
  updateExchangeRequestStatus,
  updateInternalRequestStatus,
  getExchangeRequestById,
  getInternalRequestById,
} from "@/lib/database/queries";

interface UpdateRequestData {
  requestId: string;
  status: "pending" | "processing" | "completed" | "rejected" | "cancelled";
  telegramChatId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: UpdateRequestData = await request.json();

    // Validate required fields
    if (!data.requestId || !data.status) {
      return NextResponse.json({ error: "requestId and status are required" }, { status: 400 });
    }

    // Validate status
    const validStatuses = ["pending", "processing", "completed", "rejected", "cancelled"];
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Determine request type by ID prefix
    let updatedRequest;

    if (data.requestId.startsWith("EX-")) {
      // Exchange request
      const existingRequest = await getExchangeRequestById(data.requestId);

      if (!existingRequest) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }

      updatedRequest = await updateExchangeRequestStatus(data.requestId, data.status);
    } else if (data.requestId.startsWith("IR-")) {
      // Internal request
      const existingRequest = await getInternalRequestById(data.requestId);

      if (!existingRequest) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }

      updatedRequest = await updateInternalRequestStatus(data.requestId, data.status);
    } else {
      return NextResponse.json({ error: "Invalid request ID format" }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        request: updatedRequest,
        message: `Request ${data.requestId} status updated to ${data.status}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating request status:", error);
    return NextResponse.json({ error: "Failed to update request status" }, { status: 500 });
  }
}
