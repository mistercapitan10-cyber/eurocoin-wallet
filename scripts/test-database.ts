import { config } from "dotenv";
import { resolve } from "path";
import { initializeDatabase, dropDatabase } from "@/lib/database/init";
import {
  createExchangeRequest,
  getExchangeRequestById,
  getExchangeRequestsByWallet,
  updateExchangeRequestStatus,
  createInternalRequest,
  getInternalRequestById,
  getInternalRequestsByWallet,
  updateInternalRequestStatus,
} from "@/lib/database/queries";
import { closePool } from "@/lib/database/db";

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

// Test data
const testWalletAddress = "0x1234567890123456789012345678901234567890";
const testEmail = "test@example.com";

async function runTests() {
  console.log("\n=== Database CRUD Tests ===\n");

  try {
    // Initialize database
    console.log("1. Initializing database...");
    await initializeDatabase();
    console.log("✓ Database initialized\n");

    // Test: Create Exchange Request
    console.log("2. Testing createExchangeRequest...");
    const exchangeRequestId = `EX-${Date.now()}`;
    const exchangeRequest = await createExchangeRequest({
      id: exchangeRequestId,
      wallet_address: testWalletAddress,
      email: testEmail,
      token_amount: "1000",
      fiat_amount: "147750",
      rate: "150 RUB за 1 TOKEN",
      commission: "1.5%",
      comment: "Test exchange request",
    });
    console.log("✓ Exchange request created:", exchangeRequest.id);

    // Test: Get Exchange Request by ID
    console.log("\n3. Testing getExchangeRequestById...");
    const fetchedExchange = await getExchangeRequestById(exchangeRequestId);
    console.log("✓ Exchange request fetched:", fetchedExchange?.id);

    // Test: Get Exchange Requests by Wallet
    console.log("\n4. Testing getExchangeRequestsByWallet...");
    const walletRequests = await getExchangeRequestsByWallet(testWalletAddress);
    console.log(`✓ Found ${walletRequests.length} requests for wallet`);

    // Test: Update Exchange Request Status
    console.log("\n5. Testing updateExchangeRequestStatus...");
    const updatedExchange = await updateExchangeRequestStatus(exchangeRequestId, "processing");
    console.log("✓ Exchange request status updated to:", updatedExchange.status);

    // Test: Create Internal Request
    console.log("\n6. Testing createInternalRequest...");
    const internalRequestId = `IR-${Date.now()}`;
    const internalRequest = await createInternalRequest({
      id: internalRequestId,
      wallet_address: testWalletAddress,
      requester: "Test Requester",
      email: testEmail,
      department: "finance",
      request_type: "topUp",
      priority: "high",
      description: "Test internal request",
    });
    console.log("✓ Internal request created:", internalRequest.id);

    // Test: Get Internal Request by ID
    console.log("\n7. Testing getInternalRequestById...");
    const fetchedInternal = await getInternalRequestById(internalRequestId);
    console.log("✓ Internal request fetched:", fetchedInternal?.id);

    // Test: Get Internal Requests by Wallet
    console.log("\n8. Testing getInternalRequestsByWallet...");
    const walletInternalRequests = await getInternalRequestsByWallet(testWalletAddress);
    console.log(`✓ Found ${walletInternalRequests.length} internal requests for wallet`);

    // Test: Update Internal Request Status
    console.log("\n9. Testing updateInternalRequestStatus...");
    const updatedInternal = await updateInternalRequestStatus(internalRequestId, "completed");
    console.log("✓ Internal request status updated to:", updatedInternal.status);

    console.log("\n=== All Tests Passed! ===\n");
  } catch (error) {
    console.error("\n✗ Test failed:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run tests
runTests();
