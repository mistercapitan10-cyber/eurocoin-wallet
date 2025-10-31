# Support Messenger System - Developer Guide

## Quick Start

### 1. Apply Database Migration

```bash
# Using psql
psql $DATABASE_URL -f lib/database/migrations/add-support-messenger.sql

# OR using Node.js
node -e "
const { query } = require('./lib/database/db');
const fs = require('fs');
const sql = fs.readFileSync('./lib/database/migrations/add-support-messenger.sql', 'utf8');
query(sql).then(() => console.log('Migration applied!')).catch(console.error);
"
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Telegram Bot
TELEGRAM_API_KEY=your_bot_token_from_@BotFather
TELEGRAM_ADMIN_CHAT_ID=your_telegram_chat_id

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Test the API

```bash
# Start dev server
npm run dev

# In another terminal, run tests
node scripts/test-support-api.js
```

## Architecture

### Data Flow

```
User sends message (website)
    ↓
POST /api/support/send-user-message
    ↓
Save to support_messages table
    ↓
Notify admin via Telegram
    ↓
Admin receives notification with buttons
    ↓
Admin clicks "Reply" button
    ↓
Admin types message in Telegram
    ↓
Telegram bot calls POST /api/support/send-admin-message
    ↓
Save to support_messages table
    ↓
User sees message on website (via polling)
```

### Database Schema

```sql
-- Support messages
support_messages
├── id (UUID)
├── session_id (FK → chatbot_sessions)
├── user_wallet_address (VARCHAR)
├── type (enum: user, admin, system)
├── text (TEXT)
├── admin_id (BIGINT, nullable)
├── admin_username (VARCHAR, nullable)
├── is_read (BOOLEAN)
└── created_at (TIMESTAMP)

-- Typing indicators (auto-expire after 30s)
typing_indicators
├── id (UUID)
├── user_wallet_address (VARCHAR)
├── admin_id (BIGINT)
├── admin_username (VARCHAR)
├── is_typing (BOOLEAN)
├── started_at (TIMESTAMP)
└── expires_at (TIMESTAMP)

-- Extended chatbot_sessions
chatbot_sessions
├── ... (existing fields)
├── last_admin_message_at (TIMESTAMP) -- NEW
└── unread_count (INTEGER)            -- NEW
```

## API Reference

### Send User Message

```http
POST /api/support/send-user-message
Content-Type: application/json

{
  "walletAddress": "0x...",
  "text": "Message text",
  "sessionId": "uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": { ... },
  "sessionId": "uuid"
}
```

**Rate Limit:** 10 requests per minute per wallet

### Send Admin Message

```http
POST /api/support/send-admin-message
Content-Type: application/json

{
  "walletAddress": "0x...",
  "text": "Reply text",
  "adminId": 123456789,
  "adminUsername": "Admin Name",
  "sessionId": "uuid" // optional
}
```

### Get Messages

```http
GET /api/support/get-messages?walletAddress=0x...&sessionId=uuid&limit=100
```

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "type": "user",
      "text": "...",
      "adminUsername": null,
      "createdAt": "2025-01-30T...",
      "isRead": true
    }
  ],
  "sessionId": "uuid"
}
```

**Side Effects:**
- Marks all admin messages as read
- Resets unread count

### Get Chat History (for Telegram)

```http
GET /api/support/get-chat-history?walletAddress=0x...&limit=10
```

**Response:**
```json
{
  "messages": [...],
  "count": 10
}
```

### Set Typing Status

```http
POST /api/support/set-typing
Content-Type: application/json

{
  "walletAddress": "0x...",
  "adminId": 123456789,
  "adminUsername": "Admin",
  "isTyping": true
}
```

**Auto-Expires:** After 30 seconds

### Get Typing Status

```http
GET /api/support/get-typing-status?walletAddress=0x...
```

**Response:**
```json
{
  "isTyping": true,
  "adminUsername": "Admin Name",
  "startedAt": "2025-01-30T..."
}
```

## Code Examples

### Using the Support Queries

```typescript
import {
  createSupportMessage,
  getMessagesBySession,
  getTypingIndicator,
  getChatHistory,
} from '@/lib/database/support-queries';

// Create a message
const message = await createSupportMessage({
  sessionId: 'uuid',
  walletAddress: '0x...',
  type: 'user',
  text: 'Hello',
});

// Get messages
const messages = await getMessagesBySession('session-id', 100);

// Check typing status
const typing = await getTypingIndicator('0x...');
if (typing) {
  console.log(`${typing.admin_username} is typing...`);
}

// Get chat history
const history = await getChatHistory('0x...', 10);
```

### Using Telegram Notifications

```typescript
import {
  notifyAdminNewMessage,
  notifyNewExchangeRequest,
  formatChatHistoryForTelegram,
} from '@/lib/telegram/notify-admin';

// Notify admin about new message
await notifyAdminNewMessage('0x...', 'Help needed!');

// Notify about exchange request
await notifyNewExchangeRequest({
  id: '123',
  walletAddress: '0x...',
  email: 'user@example.com',
  tokenAmount: '1000',
  fiatAmount: '1500',
});

// Format history for Telegram
const messages = await getChatHistory('0x...', 10);
const formatted = formatChatHistoryForTelegram(messages);
```

## Security

### Input Validation

All endpoints validate:
- ✅ Wallet address format (`/^0x[0-9a-fA-F]{40}$/`)
- ✅ Message text (not empty, max 2000 chars)
- ✅ Admin ID (must be a number)
- ✅ Session ID (must be valid UUID)

### Sanitization

```typescript
// Removes HTML tags
const clean = sanitizeMessageText('<script>alert("xss")</script>Hello');
// Result: "Hello"

// Truncates long text
const truncated = sanitizeMessageText('A'.repeat(3000), 2000);
// Result: 2000 characters
```

### Rate Limiting

```typescript
// In-memory rate limiting (development)
// 10 messages per minute per wallet
// TODO: Use Redis in production
```

## Testing

### Automated Tests

```bash
node scripts/test-support-api.js
```

Tests cover:
- ✅ Send/receive messages
- ✅ Typing indicators
- ✅ Chat history
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling

### Manual Testing with curl

```bash
# Send message
curl -X POST http://localhost:3000/api/support/send-user-message \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x1234567890123456789012345678901234567890","text":"Test"}'

# Get messages
curl "http://localhost:3000/api/support/get-messages?walletAddress=0x1234567890123456789012345678901234567890"

# Set typing
curl -X POST http://localhost:3000/api/support/set-typing \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x1234567890123456789012345678901234567890","adminId":123,"isTyping":true}'
```

### Database Queries for Testing

```sql
-- Check messages
SELECT * FROM support_messages ORDER BY created_at DESC LIMIT 10;

-- Check typing indicators
SELECT * FROM typing_indicators WHERE expires_at > NOW();

-- Check sessions
SELECT s.*,
       (SELECT COUNT(*) FROM support_messages WHERE session_id = s.id) as msg_count
FROM chatbot_sessions s
ORDER BY updated_at DESC
LIMIT 10;

-- Message statistics
SELECT
  type,
  COUNT(*) as count,
  AVG(LENGTH(text)) as avg_length
FROM support_messages
GROUP BY type;
```

## Troubleshooting

### Messages not saving

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Verify tables exist
psql $DATABASE_URL -c "\dt support_messages"

# Check for errors in logs
tail -f logs/app.log | grep support
```

### Telegram notifications not working

```bash
# Verify environment variables
echo $TELEGRAM_API_KEY
echo $TELEGRAM_ADMIN_CHAT_ID

# Test bot connection
curl "https://api.telegram.org/bot$TELEGRAM_API_KEY/getMe"

# Send test notification
node -e "
const { sendTestNotification } = require('./lib/telegram/notify-admin');
sendTestNotification().then(() => console.log('Sent!')).catch(console.error);
"
```

### Rate limiting issues

```javascript
// Clear rate limit cache (development only)
// In send-user-message/route.ts, the rateLimitMap is in-memory
// Restart the server to clear it

// For production, use Redis
const redis = new Redis();
await redis.del(`rate_limit:${walletAddress}`);
```

## Performance

### Indexes

All critical queries are indexed:
- `support_messages(session_id)`
- `support_messages(user_wallet_address)`
- `support_messages(created_at DESC)`
- `support_messages(user_wallet_address, is_read)` (partial)

### Query Optimization

```sql
-- Use LIMIT to avoid large result sets
SELECT * FROM support_messages WHERE session_id = $1 LIMIT 100;

-- Cleanup expired typing indicators periodically
DELETE FROM typing_indicators WHERE expires_at < NOW();

-- Archive old messages (optional)
INSERT INTO support_messages_archive
SELECT * FROM support_messages
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Monitoring

```sql
-- Slow query analysis
EXPLAIN ANALYZE
SELECT * FROM support_messages WHERE user_wallet_address = '0x...';

-- Table sizes
SELECT
  pg_size_pretty(pg_total_relation_size('support_messages')) as size;
```

## Next Steps

### Phase 2: Telegram Integration (7-10 hours)

- [ ] Extend `app/api/telegram-webhook/route.ts`
- [ ] Add callback button handlers
- [ ] Implement message sending from Telegram
- [ ] Add admin commands (`/cancel`, `/history`)

### Phase 3: Frontend (8-13 hours)

- [ ] Create chat components (`components/support/`)
- [ ] Implement React hooks (`hooks/use-support-messages.ts`)
- [ ] Add modal window
- [ ] Implement polling/SSE
- [ ] Add sound notifications

## Resources

- [Full Implementation Plan](./messenger-implementation-plan.md)
- [Phase 1 Completion Report](./messenger-phase1-completed.md)
- [Phase 1 Summary](./messenger-phase1-summary.md)
- [Telegraf Documentation](https://telegraf.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## Support

For questions or issues:
1. Check the documentation files above
2. Review error logs (`console.error`)
3. Run test script: `node scripts/test-support-api.js`
4. Inspect database directly with psql

---

**Version:** 1.0.0
**Last Updated:** 2025-01-30
**Status:** Phase 1 Complete ✅
