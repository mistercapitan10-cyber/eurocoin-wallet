# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EuroCoin Web Wallet** - Internal dashboard for managing corporate ERC-20 tokens with MetaMask integration. Built with Next.js App Router, wagmi v2, and TailwindCSS.

**Current Phase:** Phase 4 (USD pricing, tax calculator, internal requests)

## Development Commands

### Package Manager
**IMPORTANT:** This project uses `pnpm` exclusively. Do not use `npm` or `yarn`.

```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Format code
pnpm format
```

### Node.js Version
Always use Node.js 20.17.0 (specified in `.nvmrc`):
```bash
nvm use
```

## Architecture & Code Organization

### Directory Structure

```
app/              # Next.js App Router pages (use server components by default)
components/       # React components organized by feature
  ├── ui/         # Base UI components (Button, Card, Modal, Toast, Skeleton)
  ├── wallet/     # Web3 wallet features (ConnectButton, BalanceCard, etc.)
  ├── providers/  # React Context providers (AppProviders, LanguageProvider)
  ├── layout/     # Layout components (Header, Footer, LanguageSwitcher)
  ├── forms/      # Form components (InternalRequestForm)
  └── ...         # Other feature-specific components
lib/              # Core utilities and configuration
  ├── wagmi.tsx   # wagmi v2 client configuration (MetaMask only)
  ├── pricing.ts  # Token price fetching with fallback logic
  ├── i18n/       # Translation dictionaries (Russian + English)
  └── abi/        # Smart contract ABIs
config/           # Configuration files (chains, token, tax)
hooks/            # Custom React hooks for Web3 and app state
```

### Key Architectural Patterns

**Server vs Client Components:**
- Use server components by default
- Only mark components as `'use client'` when using hooks, event handlers, or browser APIs
- Example: `app/layout.tsx` is a server component, `app/page.tsx` is a client component

**Absolute Imports:**
Always use `@/` prefix for imports (configured in tsconfig.json):
```typescript
// ✅ Correct
import { wagmiConfig } from '@/lib/wagmi'
import { ConnectButton } from '@/components/wallet'

// ❌ Wrong
import { wagmiConfig } from '../../../lib/wagmi'
```

**Component Composition:**
- UI components in `/components/ui/`
- Feature components in domain folders (`/wallet/`, `/forms/`, etc.)
- Use barrel exports (`index.ts`) for clean imports

**State Management:**
- **React Query** - Server state (token balance, prices, contract data)
- **React Context** - UI state (language preference, theme)
- **Local State** - Form inputs, modals, loading states

## Web3 Integration

### Blockchain Configuration
- **Supported Networks:** Sepolia testnet (Chain ID: 11155111), Ethereum Mainnet (Chain ID: 1)
- **Wallet:** MetaMask only (via wagmi v2 connector)
- **Library Stack:** wagmi v2 + viem (DO NOT use ethers.js)

### Critical Web3 Rules

1. **Use wagmi hooks exclusively** for all blockchain interactions:
   - `useReadContract` - Read contract data (balance, tax, etc.)
   - `useWriteContract` - Write transactions
   - `useAccount` - Wallet connection state
   - `useConnect` / `useDisconnect` - Connection management

2. **Never use manual `useEffect` for RPC calls** - Let wagmi + React Query handle it

3. **Handle amounts correctly** using viem utilities:
```typescript
import { formatUnits, parseUnits } from 'viem';

const amount = parseUnits('1.5', 18); // BigInt
const formatted = formatUnits(amount, 18); // string
```

4. **Unsupported Networks:** UI must switch to read-only mode with clear alert

5. **Configuration:** All chain/token config is centralized in `/config/`

### Environment Variables

Required environment variables (create `.env.local`):
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

## Code Style & TypeScript Rules

### Strict Requirements

- **TypeScript strict mode** - All code must be fully typed
- **No `any` type** - Use proper type definitions
- **Props typing** - All component props must have interface/type definitions
- **Import ordering** - Enforced by ESLint

### Example Pattern
```typescript
// ✅ Correct
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps): JSX.Element {
  return <button onClick={onClick}>{label}</button>;
}

// ❌ Wrong
export function Button({ label, onClick }: any) {
  return <button onClick={onClick}>{label}</button>;
}
```

## Internationalization

- **Supported Languages:** Russian (ru) + English (en)
- **Translations:** Centralized in `lib/i18n/translations.ts` (600+ keys)
- **Hook:** `useTranslation()` returns `t()` function
- **Persistence:** Language preference stored in localStorage
- **Key Structure:** Nested keys like `home.hero.title`, `wallet.balanceCard.title`

### Translation Pattern
```typescript
import { useTranslation } from '@/hooks/use-translation';

export function Component() {
  const { t } = useTranslation();

  return <h1>{t('home.hero.title')}</h1>;
}
```

## Security Requirements

### Critical Rules

1. **Never request or store:**
   - Seed phrases
   - Private keys
   - Wallet passwords

2. **Environment variables:**
   - Keep `.env*` files in `.gitignore`
   - Store all secrets in environment variables only
   - Use RPC keys with domain restrictions and quotas

3. **Transaction UX:**
   - All transactions require explicit user confirmation via modal
   - Display amount, recipient, and gas/tax fees before confirmation
   - Show toast notifications for transaction status

4. **Logging:**
   - Never log wallet addresses in plain text
   - Mask sensitive data in logs

## Common Development Tasks

### Adding a New Custom Hook

1. Create file in `/hooks/use-[feature-name].ts`
2. Mark with `'use client'` directive
3. Use wagmi hooks or React Query for data fetching
4. Export typed hook function

Example:
```typescript
'use client'
import { useReadContract } from 'wagmi'
import { TOKEN_CONFIG } from '@/config/token'

export function useTokenBalance(address: `0x${string}`) {
  return useReadContract({
    address: TOKEN_CONFIG.address,
    abi: TOKEN_CONFIG.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      refetchInterval: 30000, // 30 seconds
    },
  })
}
```

### Adding a New Component

1. Determine if it's a UI component (`/components/ui/`) or feature component (`/components/[feature]/`)
2. Use server component by default, add `'use client'` only if needed
3. Define props interface
4. Export from barrel file (`index.ts`) if creating a new feature folder

### Working with Contract Data

All contract reads should:
- Use `useReadContract` from wagmi
- Include proper error handling
- Set appropriate refetch intervals
- Have fallback values from config

### Handling Network Switching

Use the `useSupportedNetwork` hook to check if user is on Sepolia or Mainnet. If not:
- Show `UnsupportedNetworkAlert` component
- Disable all write operations
- Allow read-only mode

## Testing

When implementing tests:
- Test components in isolation
- Mock wagmi hooks in tests
- Test both server and client components appropriately
- Verify mobile responsiveness

## Deployment

**Primary Platform:** Vercel (recommended)
**Alternative:** Netlify

Build command: `pnpm build`
Output directory: `.next`

## Additional Resources

Comprehensive documentation is available in `/docs/`:
- `architecture.md` - Detailed architecture overview (in Russian)
- `arch-rules.md` - Project rules and conventions (in Russian)
- These documents contain more detailed information about design system, security, and development workflow
