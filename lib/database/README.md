# Database Module

This module provides PostgreSQL database functionality for the web-wallet application.

## Structure

```
lib/database/
├── db.ts          # Connection pool and query functions
├── schema.sql     # PostgreSQL schema (tables, indexes, triggers)
├── init.ts        # Database initialization functions
├── queries.ts     # CRUD operations for requests
└── README.md      # This file
```

## Setup

1. Install PostgreSQL locally or use a cloud service
2. Set the `DATABASE_URL` environment variable:

   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/web_wallet_db
   ```

3. Initialize the database schema:
   ```bash
   npm run db:init
   ```

## Usage

### Initialize Database

```bash
npm run db:init
```

This will create all tables, indexes, and triggers defined in `schema.sql`.

### Test Database Operations

```bash
npm run db:test
```

This will run CRUD tests for both exchange and internal requests.

## Database Schema

### exchange_requests

Stores exchange (token to fiat) requests from users.

- Primary key: `id` (VARCHAR(50))
- Indexed on: `wallet_address`, `status`
- Auto-updates `updated_at` via trigger

### internal_requests

Stores internal/contact form requests.

- Primary key: `id` (VARCHAR(50))
- Indexed on: `wallet_address`, `status`
- Auto-updates `updated_at` via trigger

## Available Functions

### Exchange Requests

- `createExchangeRequest(data)` - Create a new exchange request
- `getExchangeRequestById(id)` - Get request by ID
- `getExchangeRequestsByWallet(walletAddress)` - Get all requests for a wallet
- `updateExchangeRequestStatus(id, status)` - Update request status
- `getAllExchangeRequests()` - Get all exchange requests

### Internal Requests

- `createInternalRequest(data)` - Create a new internal request
- `getInternalRequestById(id)` - Get request by ID
- `getInternalRequestsByWallet(walletAddress)` - Get all requests for a wallet
- `updateInternalRequestStatus(id, status)` - Update request status
- `getAllInternalRequests()` - Get all internal requests

## Request Statuses

- `pending` - Request is pending review
- `processing` - Request is being processed
- `completed` - Request has been completed
- `rejected` - Request was rejected
- `cancelled` - Request was cancelled

## Connection Pool

The connection pool is configured with:

- Maximum 20 concurrent connections
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

Pool errors are automatically logged for debugging.
