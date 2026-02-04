import { test, expect, type APIRequestContext } from "@playwright/test";

const ADMIN_SECRET = process.env.INTERNAL_BALANCE_SIGNING_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

test.describe("withdraw flow", () => {
  test.skip(!ADMIN_SECRET, "INTERNAL_BALANCE_SIGNING_SECRET is required for e2e");

  test("withdraw status update via api", async ({ request }: { request: APIRequestContext }) => {
    const testWallet = "0x1234567890123456789012345678901234567890";
    const uniqueTag = Date.now().toString();

    const creditResponse = await request.post(`${APP_URL}/api/internal-balance/credit`, {
      headers: {
        "Content-Type": "application/json",
        "x-internal-admin-token": ADMIN_SECRET ?? "",
      },
      data: {
        walletAddress: testWallet,
        amount: "5",
        reference: `e2e-${uniqueTag}`,
        createdBy: "e2e",
      },
    });

    expect(creditResponse.ok()).toBeTruthy();

    const createResponse = await request.post(`${APP_URL}/api/internal-balance/withdraw`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        walletAddress: testWallet,
        amount: "2",
        destinationAddress: testWallet,
        note: `e2e-${uniqueTag}`,
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const requestId = created.request?.id as string;
    expect(requestId).toBeTruthy();

    const approveResponse = await request.patch(
      `${APP_URL}/api/internal-balance/withdraw/${requestId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-internal-admin-token": ADMIN_SECRET ?? "",
        },
        data: {
          status: "approved",
          notes: "e2e approve",
        },
      },
    );

    expect(approveResponse.ok()).toBeTruthy();

    const processingResponse = await request.patch(
      `${APP_URL}/api/internal-balance/withdraw/${requestId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-internal-admin-token": ADMIN_SECRET ?? "",
        },
        data: {
          status: "processing",
          notes: "e2e processing",
        },
      },
    );

    expect(processingResponse.ok()).toBeTruthy();

    const completedResponse = await request.patch(
      `${APP_URL}/api/internal-balance/withdraw/${requestId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-internal-admin-token": ADMIN_SECRET ?? "",
        },
        data: {
          status: "completed",
          txHash: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
          notes: "e2e completed",
        },
      },
    );

    expect(completedResponse.ok()).toBeTruthy();
  });
});
