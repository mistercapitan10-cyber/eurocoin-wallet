# Etherscan API Setup

## Overview

The wallet statistics feature uses the Etherscan API to fetch transaction history for connected MetaMask wallets.

## Getting an API Key

1. Visit [Etherscan.io](https://etherscan.io/)
2. Create a free account or sign in
3. Navigate to **API-KEYs** section
4. Create a new API key
5. Copy your API key

## Environment Variables

Add the following to your `.env.local` file:

```env
# Etherscan API Key (required for wallet statistics)
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_api_key_here

# Base URL for Etherscan API (optional, defaults to mainnet)
NEXT_PUBLIC_ETHERSCAN_BASE_URL=https://api.etherscan.io/api
```

## API Endpoints Used

### Mainnet

- API Endpoint: `https://api.etherscan.io/api`
- Rate Limit: 5 calls/second with API key

### Sepolia Testnet

- API Endpoint: `https://api-sepolia.etherscan.io/api`
- Rate Limit: 5 calls/second with API key

## Features

### Transaction History

- Fetches last 100 outgoing transactions from the connected wallet
- Calculates total spent (including gas fees)
- Identifies failed/cancelled transactions

### Statistics Calculated

1. **Total Spent**: Sum of all transaction values + gas fees
2. **Cancelled Amount**: Sum of gas fees from failed transactions

## Rate Limiting

The free tier has a rate limit of **5 calls per second**. If you exceed this limit, the component will display an error message.

## Error Handling

- If API key is invalid: Silent failure, shows empty statistics
- If rate limit is exceeded: Shows "Rate limit exceeded" message
- If network error: Shows "Failed to fetch transaction history"

## Cost

- **Etherscan API**: Free for basic usage
- No additional charges for transaction history

## Security Notes

- API key is public (NEXT*PUBLIC*\*)
- Safe to expose in frontend
- No sensitive operations require the key
- Consider rate limiting in production
