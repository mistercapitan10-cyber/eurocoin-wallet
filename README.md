# 💰 EuroCoin Web Wallet

> Modern Web3 wallet interface for corporate token management with MetaMask integration, real-time fraud investigation tracking, and seamless exchange functionality.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38bdf8)](https://tailwindcss.com/)
[![wagmi](https://img.shields.io/badge/wagmi-v2.0-purple)](https://wagmi.sh/)

## 🌟 Overview

EuroCoin Web Wallet is a comprehensive dashboard for managing corporate ERC-20 tokens on Ethereum. It provides secure MetaMask integration, real-time price tracking, automated fraud investigation workflows, and seamless exchange functionality for corporate teams.

## ✨ Key Features

### 🔐 Wallet & Blockchain

- **MetaMask Integration** - Secure wallet connection with Ethereum network support
- **Multi-Network Support** - Ethereum Mainnet and Sepolia testnet
- **Real-time Balance** - Live token balance updates with automatic refresh
- **USD Conversion** - Dynamic price tracking via CoinGecko API
- **Tax Calculator** - Built-in transaction fee calculator

### 🛡️ Security & Fraud Investigation

- **Investigation Tracker** - Real-time progress tracking for fraud cases
- **Telegram Integration** - Two-way communication between admins and users
- **Automated Workflows** - Stage-based investigation process with live updates
- **Transaction Analysis** - Direct blockchain analysis for suspicious transactions

### 💱 Exchange & Trading

- **Exchange Calculator** - Real-time TOKEN ↔ RUB conversion with live rates
- **Dynamic Pricing** - Automatic exchange rate updates via CoinGecko
- **Commission Management** - Configurable trading fees
- **Request System** - Streamlined exchange request workflow

### 🤖 Chatbot Support

- **Anti-Fraud Assistant** - Dedicated chatbot for fraud victims
- **Real-time Translation** - Instant EN ↔ RU translation
- **Admin Chat** - Direct communication with support team via Telegram
- **Transaction Help** - Blockchain analysis and recovery guidance

### 📊 Analytics & Visualization

- **Dexscreener Charts** - Interactive real-time price charts
- **Token Statistics** - Comprehensive wallet analytics
- **Request History** - Full audit trail of all operations
- **Progress Tracking** - Visual investigation progress timeline

### 🌍 Internationalization

- **Multi-language** - Full Russian and English support
- **Dynamic Content** - All UI elements translated
- **Locale-aware** - Automatic date/time formatting
- **RTL Support Ready** - Architecture ready for RTL languages

### 🎨 Modern UI/UX

- **Dark/Light Theme** - Automatic theme switching
- **Responsive Design** - Mobile-first approach
- **Smooth Animations** - Polished transitions
- **Accessibility** - WCAG compliant components

## 🚀 Quick Start

### Prerequisites

- Node.js 20.17.0+ (see `.nvmrc`)
- pnpm 8.0+
- MetaMask browser extension
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.sample .env.local

# Initialize database
npm run db:init

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Docker

You can run the project inside containers—with continuous health-check logging per service—without installing Node.js locally.

#### Development mode

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

The dev stack (Next.js + Postgres + Redis) will be available at [http://localhost:3000](http://localhost:3000). Source code is mounted for hot reloading. Health logs appear as:

```
[health][web-dev][info] 2025-10-27T15:00:07Z status=200 OK
```

#### Production-like mode

```bash
docker compose -f docker/docker-compose.prod.yml up --build -d
```

Override environment variables as needed via `.env.local` or `docker compose ... -e VAR=value`. Follow logs with:

```bash
docker compose -f docker/docker-compose.prod.yml logs -f
```

These compose files start the full stack (web, Postgres, Redis) with health checks automatically wired in.

### Environment Variables

```env
# Blockchain Configuration
NEXT_PUBLIC_TOKEN_ADDRESS=0x88F43B9f5A6d4ADEF8f80D646732F5b6153C2586
NEXT_PUBLIC_TOKEN_SYMBOL=EURC
NEXT_PUBLIC_TOKEN_DECIMALS=18
NEXT_PUBLIC_TOKEN_CHAIN_ID=1

# Pricing
NEXT_PUBLIC_PRICE_SOURCE=coingecko
NEXT_PUBLIC_COINGECKO_TOKEN_ID=euro-coin
NEXT_PUBLIC_TOKEN_PRICE_USD=1.00

# Exchange
NEXT_PUBLIC_EXCHANGE_RATE_RUB_PER_TOKEN=150
NEXT_PUBLIC_EXCHANGE_COMMISSION_PERCENT=1.5

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/web_wallet_db

# Telegram Bot
TELEGRAM_API_KEY=your_telegram_bot_token
TELEGRAM_MANAGER_CHAT_ID=your_chat_id

# Email (Optional)
SENDER_EMAIL=noreply@company.io
RECIPIENT_EMAIL=support@company.io
```

## 📁 Project Structure

```
web-wallet/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── chatbot/             # Chatbot endpoints
│   │   ├── investigation/        # Investigation tracking
│   │   ├── submit-request/      # Request submission
│   │   └── telegram-webhook/    # Telegram integration
│   ├── login/                    # Login page
│   ├── profile/                  # User profile
│   ├── exchange/                 # Exchange calculator
│   └── info/                     # Info pages
├── components/
│   ├── chatbot/                  # Chat widget & notifications
│   ├── wallet/                    # Wallet components
│   ├── exchange/                  # Exchange calculator
│   ├── dashboard/                 # Investigation progress
│   ├── layout/                    # Header, footer, navigation
│   └── ui/                        # Reusable UI components
├── hooks/
│   ├── use-wallet-connection.ts  # Wallet connection logic
│   ├── use-token-balance.ts      # Token balance tracking
│   ├── use-token-price.ts        # Price fetching
│   ├── use-active-section.ts     # Navigation tracking
│   └── use-exchange-rate.ts      # Exchange rate fetching
├── lib/
│   ├── database/                 # PostgreSQL queries
│   ├── i18n/                      # Internationalization
│   └── wagmi.tsx                  # Web3 configuration
├── config/
│   ├── chains.ts                  # Blockchain configuration
│   ├── token.ts                   # Token configuration
│   └── tax.ts                     # Tax configuration
└── docs/                          # Documentation
```

## 🛠️ Tech Stack

### Core

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.0 (strict mode)
- **Styling:** TailwindCSS 3.0
- **Database:** PostgreSQL
- **Package Manager:** pnpm 8

### Web3

- **wagmi** v2 - React Hooks for Ethereum
- **viem** - TypeScript Ethereum library
- **MetaMask** - Browser wallet integration

### Backend

- **Telegraf** - Telegram bot framework
- **Resend** - Email delivery
- **Next.js API Routes** - Serverless functions

### UI/UX

- **React Hot Toast** - Toast notifications
- **next-themes** - Theme management
- **Lucide Icons** - Icon library
- **date-fns** - Date formatting

### Development

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety

## 📖 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[Architecture](./docs/architecture.md)** - System architecture overview
- **[Arch Rules](./docs/arch-rules.md)** - Development rules and conventions
- **[Requirements](./docs/requirements.md)** - Business requirements
- **[Chatbot Implementation](./docs/chatbot-implementation-plan.md)** - Chatbot features
- **[Exchange Implementation](./docs/exchange-implementation-plan.md)** - Exchange system

## 🎯 Key Workflows

### 1. Wallet Connection

```
User → MetaMask Connect → Network Validation → Balance Fetch → USD Conversion
```

### 2. Exchange Request

```
User Input → Rate Calculation → Database Save → Telegram Notification → Admin Response
```

### 3. Investigation Tracking

```
Submit Request → Stage 1-6 Progress → Real-time Updates → Completion
```

### 4. Chatbot Support

```
User Message → Telegram Forward → Admin Response → Real-time Update → Translation
```

## 🔧 Development

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Database operations
npm run db:init       # Initialize database
npm run db:migrate    # Run migrations
npm run db:test       # Test database

# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment Variables:** Add all variables from `.env.local` in Vercel dashboard.

### Manual Build

```bash
pnpm build
pnpm start
```

## 📝 License

Internal use only - EuroCoin Corporation

## 🤝 Contributing

This is an internal project. For questions or issues, contact the development team.

## 📧 Support

- **Email:** support@eurocoin.io
- **Telegram:** @corporate_bot
- **Documentation:** See `/docs` folder

---

Made with ❤️ by EuroCoin Development Team
