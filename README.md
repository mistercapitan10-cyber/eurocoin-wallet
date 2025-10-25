# EuroCoin Web Wallet

Internal dashboard for managing corporate ERC-20 tokens with MetaMask integration. Built with Next.js App Router, wagmi v2, and TailwindCSS.

## Features

- 🔐 MetaMask wallet integration
- 💰 Real-time token balance tracking
- 🌐 Multi-network support (Sepolia testnet & Ethereum mainnet)
- 💱 USD price conversion
- 🧮 Automatic tax calculation
- 🌍 Internationalization (Russian & English)
- 📱 Responsive design

## Prerequisites

- Node.js 20.17.0 (specified in `.nvmrc`)
- pnpm package manager
- MetaMask browser extension

## Getting Started

### Install dependencies

**IMPORTANT:** This project uses `pnpm` exclusively. Do not use `npm` or `yarn`.

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Token Configuration
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_TOKEN_SYMBOL=COIN
NEXT_PUBLIC_TOKEN_DECIMALS=18

# Pricing (fallback if API fails)
NEXT_PUBLIC_TOKEN_PRICE_USD=1.50

# RPC (optional, has fallback)
NEXT_PUBLIC_RPC_URL=https://sepolia.drpc.org

# Tax Configuration
NEXT_PUBLIC_TOKEN_TAX_FUNCTION=tax
NEXT_PUBLIC_TOKEN_TAX_BPS=200
NEXT_PUBLIC_TOKEN_TAX_SCALE=10000
```

### Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
pnpm build
pnpm start
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Web3:** wagmi v2 + viem
- **Styling:** TailwindCSS
- **Language:** TypeScript (strict mode)
- **Package Manager:** pnpm

## Project Structure

```
app/              # Next.js App Router pages
components/       # React components (UI, wallet, forms, layout)
lib/              # Core utilities and Web3 configuration
config/           # Chain, token, and tax configuration
hooks/            # Custom React hooks
docs/             # Architecture and project documentation
```

## Documentation

See the `/docs` folder for detailed documentation:

- `architecture.md` - Detailed architecture overview
- `arch-rules.md` - Project rules and conventions
- `CLAUDE.md` - AI assistant guidelines

## Deployment

Recommended platforms:
- Vercel (primary)
- Netlify

Build command: `pnpm build`
Output directory: `.next`

## License

Internal use only
