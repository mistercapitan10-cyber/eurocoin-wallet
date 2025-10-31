#!/usr/bin/env node

/**
 * Test script for Support Messenger API endpoints
 * Usage: node scripts/test-support-api.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_WALLET = '0x1234567890123456789012345678901234567890';
const ADMIN_ID = 123456789;
const ADMIN_USERNAME = 'Test Admin';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function testEndpoint(name, method, url, body = null) {
  log(`\n→ Testing: ${name}`, 'cyan');
  log(`  ${method} ${url}`, 'blue');

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
      log(`  Body: ${JSON.stringify(body, null, 2)}`, 'yellow');
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      log(`✓ Success (${response.status})`, 'green');
      console.log('  Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      log(`✗ Failed (${response.status})`, 'red');
      console.error('  Error:', data);
      return null;
    }
  } catch (error) {
    log(`✗ Request failed: ${error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  logSection('Support Messenger API Tests');
  log('Base URL: ' + BASE_URL, 'blue');
  log('Test Wallet: ' + TEST_WALLET, 'blue');

  let sessionId = null;

  // Test 1: Send user message
  logSection('Test 1: Send User Message');
  const userMessageResult = await testEndpoint(
    'Send User Message',
    'POST',
    `${BASE_URL}/api/support/send-user-message`,
    {
      walletAddress: TEST_WALLET,
      text: 'Hello, I need help with my transaction!',
    }
  );

  if (userMessageResult) {
    sessionId = userMessageResult.sessionId;
    log(`Session ID: ${sessionId}`, 'green');
  }

  // Test 2: Get messages
  logSection('Test 2: Get Messages');
  await testEndpoint(
    'Get Messages',
    'GET',
    `${BASE_URL}/api/support/get-messages?walletAddress=${TEST_WALLET}${sessionId ? `&sessionId=${sessionId}` : ''}`
  );

  // Test 3: Set typing indicator
  logSection('Test 3: Set Typing Indicator');
  await testEndpoint(
    'Set Typing (ON)',
    'POST',
    `${BASE_URL}/api/support/set-typing`,
    {
      walletAddress: TEST_WALLET,
      adminId: ADMIN_ID,
      adminUsername: ADMIN_USERNAME,
      isTyping: true,
    }
  );

  // Test 4: Get typing status
  logSection('Test 4: Get Typing Status');
  await testEndpoint(
    'Get Typing Status',
    'GET',
    `${BASE_URL}/api/support/get-typing-status?walletAddress=${TEST_WALLET}`
  );

  // Wait a bit to simulate admin typing
  log('\n⏳ Waiting 2 seconds (simulating admin typing)...', 'yellow');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 5: Send admin message
  logSection('Test 5: Send Admin Message');
  await testEndpoint(
    'Send Admin Message',
    'POST',
    `${BASE_URL}/api/support/send-admin-message`,
    {
      walletAddress: TEST_WALLET,
      text: 'Hello! How can I help you with your transaction?',
      adminId: ADMIN_ID,
      adminUsername: ADMIN_USERNAME,
      sessionId,
    }
  );

  // Test 6: Get chat history
  logSection('Test 6: Get Chat History');
  await testEndpoint(
    'Get Chat History',
    'GET',
    `${BASE_URL}/api/support/get-chat-history?walletAddress=${TEST_WALLET}&limit=10`
  );

  // Test 7: Send another user message
  logSection('Test 7: Send Another User Message');
  await testEndpoint(
    'Send User Message #2',
    'POST',
    `${BASE_URL}/api/support/send-user-message`,
    {
      walletAddress: TEST_WALLET,
      text: 'My transaction hash is 0xabc123...',
      sessionId,
    }
  );

  // Test 8: Get updated messages
  logSection('Test 8: Get Updated Messages');
  await testEndpoint(
    'Get Messages (Updated)',
    'GET',
    `${BASE_URL}/api/support/get-messages?walletAddress=${TEST_WALLET}&sessionId=${sessionId}`
  );

  // Test 9: Test rate limiting
  logSection('Test 9: Rate Limiting Test');
  log('Sending 11 messages rapidly...', 'yellow');
  for (let i = 1; i <= 11; i++) {
    const result = await testEndpoint(
      `Rate Limit Test #${i}`,
      'POST',
      `${BASE_URL}/api/support/send-user-message`,
      {
        walletAddress: TEST_WALLET,
        text: `Rate limit test message ${i}`,
        sessionId,
      }
    );

    if (!result && i === 11) {
      log('✓ Rate limiting working correctly!', 'green');
    }
  }

  // Test 10: Test invalid wallet
  logSection('Test 10: Invalid Wallet Address');
  await testEndpoint(
    'Invalid Wallet',
    'POST',
    `${BASE_URL}/api/support/send-user-message`,
    {
      walletAddress: 'invalid_wallet',
      text: 'This should fail',
    }
  );

  // Test 11: Test empty message
  logSection('Test 11: Empty Message');
  await testEndpoint(
    'Empty Message',
    'POST',
    `${BASE_URL}/api/support/send-user-message`,
    {
      walletAddress: TEST_WALLET,
      text: '',
    }
  );

  // Test 12: Test long message
  logSection('Test 12: Long Message (2000+ chars)');
  const longText = 'A'.repeat(2500);
  const longMessageResult = await testEndpoint(
    'Long Message',
    'POST',
    `${BASE_URL}/api/support/send-user-message`,
    {
      walletAddress: TEST_WALLET,
      text: longText,
      sessionId,
    }
  );

  if (longMessageResult && longMessageResult.message.text.length <= 2000) {
    log('✓ Message truncated correctly!', 'green');
  }

  logSection('Tests Complete');
  log('All tests finished!', 'green');
  log('\nNote: Check your database to verify data persistence', 'yellow');
}

// Run tests
runTests().catch((error) => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
