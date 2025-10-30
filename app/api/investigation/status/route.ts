import { NextRequest, NextResponse } from "next/server";
import {
  getAllInternalRequests,
  getInternalRequestsByWallet,
  getInternalRequestsByEmail,
  getExchangeRequestsByWallet,
  getExchangeRequestsByEmail,
} from "@/lib/database/queries";

interface InvestigationStage {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

const stageLabels: Record<string, string> = {
  submitted: "Заявка подана",
  checking: "Проверка документов",
  analyzing: "Анализ транзакций",
  investigating: "Расследование",
  recovering: "Восстановление средств",
  completed: "Завершено",
};

function getStagesFromStatus(status: string, currentStage?: string | null): InvestigationStage[] {
  const allStages = [
    { id: "submitted", label: stageLabels.submitted, completed: false, current: false },
    { id: "checking", label: stageLabels.checking, completed: false, current: false },
    { id: "analyzing", label: stageLabels.analyzing, completed: false, current: false },
    { id: "investigating", label: stageLabels.investigating, completed: false, current: false },
    { id: "recovering", label: stageLabels.recovering, completed: false, current: false },
    { id: "completed", label: stageLabels.completed, completed: false, current: false },
  ];

  // Map status to stage
  if (status === "completed") {
    allStages.forEach((stage) => {
      stage.completed = true;
      stage.current = false;
    });
    allStages[allStages.length - 1].current = true;
  } else if (status === "pending") {
    allStages[0].completed = true;
    allStages[1].current = true;
  } else if (status === "processing") {
    // If current_stage is provided, use it to determine progress
    if (currentStage) {
      const stageIndex = allStages.findIndex((s) => s.id === currentStage);
      if (stageIndex !== -1) {
        // Mark all previous stages as completed
        for (let i = 0; i < stageIndex; i++) {
          allStages[i].completed = true;
        }
        // Mark current stage as current
        allStages[stageIndex].current = true;
      }
    } else {
      // Default behavior for processing without current_stage
      allStages[0].completed = true;
      allStages[1].completed = true;
      allStages[2].completed = true;
      allStages[3].current = true;
    }
  }

  return allStages;
}

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get("requestId");
    const walletAddress = request.nextUrl.searchParams.get("walletAddress");
    const userEmail = request.nextUrl.searchParams.get("userEmail");

    let allRequests: any[] = [];

    // Get ALL requests for this user (internal + exchange)
    if (walletAddress) {
      // Get both types of requests for specific wallet address
      const [internalReqs, exchangeReqs] = await Promise.all([
        getInternalRequestsByWallet(walletAddress),
        getExchangeRequestsByWallet(walletAddress),
      ]);
      allRequests = [...internalReqs, ...exchangeReqs];
    } else if (userEmail) {
      // Get both types of requests for specific email (OAuth users)
      const [internalReqs, exchangeReqs] = await Promise.all([
        getInternalRequestsByEmail(userEmail),
        getExchangeRequestsByEmail(userEmail),
      ]);
      allRequests = [...internalReqs, ...exchangeReqs];
    } else {
      // No user identifier provided - return empty state
      const emptyStages: InvestigationStage[] = [
        { id: "submitted", label: "Заявка подана", completed: false, current: false },
        { id: "checking", label: "Проверка документов", completed: false, current: false },
        { id: "analyzing", label: "Анализ транзакций", completed: false, current: false },
        { id: "investigating", label: "Расследование", completed: false, current: false },
        { id: "recovering", label: "Восстановление средств", completed: false, current: false },
        { id: "completed", label: "Завершено", completed: false, current: false },
      ];

      return NextResponse.json({
        stages: emptyStages,
        progress: 0,
        requestId: null,
        hasRequests: false,
      });
    }

    if (allRequests.length === 0) {
      // User has no requests - return empty state
      const emptyStages: InvestigationStage[] = [
        { id: "submitted", label: "Заявка подана", completed: false, current: false },
        { id: "checking", label: "Проверка документов", completed: false, current: false },
        { id: "analyzing", label: "Анализ транзакций", completed: false, current: false },
        { id: "investigating", label: "Расследование", completed: false, current: false },
        { id: "recovering", label: "Восстановление средств", completed: false, current: false },
        { id: "completed", label: "Завершено", completed: false, current: false },
      ];

      return NextResponse.json({
        stages: emptyStages,
        progress: 0,
        requestId: null,
        hasRequests: false,
      });
    }

    // Sort all requests by created_at DESC to get the latest
    allRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Use latest or specific request
    const targetRequest = requestId
      ? allRequests.find((r) => r.id === requestId)
      : allRequests[0];

    if (!targetRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const stages = getStagesFromStatus(targetRequest.status, targetRequest.current_stage);
    const completedCount = stages.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / stages.length) * 100);

    return NextResponse.json({
      stages,
      progress,
      requestId: targetRequest.id,
      hasRequests: true,
    });
  } catch (error) {
    console.error("Error fetching investigation status:", error);
    return NextResponse.json({ error: "Failed to fetch investigation status" }, { status: 500 });
  }
}
