# TippinBit

Tip anyone on X with Bitcoin-backed MUSD stablecoin. Built for the Mezo Network Hackathon.

## Overview

TippinBit enables frictionless tipping on X (Twitter) using MUSD, a Bitcoin-backed stablecoin on the Mezo Network. Users can send tips without the recipient needing a wallet or knowing about crypto.

## Prerequisites

- **Node.js:** 22 LTS or higher
- **pnpm:** 9.0.0 or higher

### Installing Prerequisites

```bash
# Install Node.js 22 LTS using nvm (recommended)
nvm install 22
nvm use 22

# Or using volta
volta install node@22

# Install pnpm globally
npm install -g pnpm@9

# Or enable pnpm using Corepack (Node.js 22 includes Corepack)
corepack enable pnpm
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TippinBit
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

Copy the `.env.example` file to `.env.local` and configure the required environment variables:

```bash
cp .env.example .env.local
```

**Required Environment Variables:**

```bash
# Blockchain RPC
NEXT_PUBLIC_SPECTRUM_RPC_URL=https://your-spectrum-rpc-url
NEXT_PUBLIC_MEZO_CHAIN_ID=31611

# WalletConnect Cloud Project ID (get from cloud.walletconnect.com)
# This is a public identifier, safe for public repos
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Contract Addresses (will be added in future stories)
NEXT_PUBLIC_TIP_JAR_ADDRESS=0x...
NEXT_PUBLIC_BORROWING_VAULT_ADDRESS=0x...
NEXT_PUBLIC_MUSD_ADDRESS=0x...

# Redis (Upstash) - for serverless functions
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Environment Variable Details

- **`NEXT_PUBLIC_SPECTRUM_RPC_URL`**: Mezo testnet RPC endpoint (Spectrum RPC premium access)
- **`NEXT_PUBLIC_MEZO_CHAIN_ID`**: Mezo Network chain ID (31611 for testnet)
- **`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`**: WalletConnect Cloud project ID (see setup instructions below)
- **`NEXT_PUBLIC_TIP_JAR_ADDRESS`**: TipJar smart contract address (placeholder for now)
- **`NEXT_PUBLIC_BORROWING_VAULT_ADDRESS`**: BorrowingVault smart contract address (placeholder for now)
- **`NEXT_PUBLIC_MUSD_ADDRESS`**: MUSD token contract address (placeholder for now)
- **`UPSTASH_REDIS_REST_URL`**: Upstash Redis REST API URL
- **`UPSTASH_REDIS_REST_TOKEN`**: Upstash Redis REST API token
- **`NEXT_PUBLIC_BASE_URL`**: Base URL for the application

#### WalletConnect Setup

To enable wallet connections (MetaMask, WalletConnect, Coinbase Wallet), you need a WalletConnect Cloud project ID:

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Sign up or log in
3. Create a new project
4. Copy the Project ID
5. Add it to your `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

**Note:** The WalletConnect Project ID is a public identifier and is safe to commit to public repositories (it's not a secret key).

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Troubleshooting

#### Common Wallet Connection Issues

**"ProjectId is required for WalletConnect"**
- Ensure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set in `.env.local`
- Verify the project ID is valid at [WalletConnect Cloud](https://cloud.walletconnect.com)

**Wrong Network Warning**
- The app automatically detects if you're on the wrong network
- Click "Switch network" to automatically switch to Mezo testnet
- If auto-switch fails, manually switch in your wallet to Mezo testnet (Chain ID: 31611)

**"Unable to connect to network"**
- Check that `NEXT_PUBLIC_SPECTRUM_RPC_URL` is correctly set
- Verify the RPC endpoint is accessible
- Check your internet connection

**MUSD Balance Shows "0.00 MUSD"**
- The MUSD contract address is a placeholder until contracts are deployed
- Balance will update automatically once the contract is deployed in a future story

**WalletConnect QR Code Not Displaying**
- Ensure you're testing on a mobile viewport (375px width)
- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is valid
- Try refreshing the page

## Development Workflow

### Available Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Run tests (when available)
pnpm test
```

## Monorepo Structure

This project uses Turborepo for efficient monorepo management.

```
TippinBit/
├── apps/
│   └── web/                          # Next.js frontend application
│       ├── src/
│       │   ├── app/                  # Next.js App Router
│       │   ├── components/           # React components
│       │   ├── hooks/                # Custom React hooks
│       │   ├── lib/                  # Utility functions
│       │   ├── config/               # Configuration files
│       │   └── types/                # TypeScript type definitions
│       ├── public/                   # Static assets
│       ├── netlify/
│       │   └── functions/            # Netlify serverless functions
│       └── e2e/                      # Playwright E2E tests
│
├── packages/
│   └── contracts/                    # Smart contracts (future)
│
├── docs/                             # Project documentation
│   ├── architecture/                 # Architecture documentation
│   ├── prd/                          # Product requirements
│   └── front-end-spec/               # Frontend specifications
│
├── .bmad-core/                       # BMAD framework files
├── turbo.json                        # Turborepo configuration
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspace configuration
├── .gitignore                        # Git ignore rules
├── .env.example                      # Environment variables template
├── netlify.toml                      # Netlify deployment config
└── README.md                         # This file
```

## Tech Stack

### Frontend Core

- **TypeScript** 5.9.3 - Type-safe JavaScript
- **Next.js** 15.5.4 - React framework with Turbopack
- **React** 19.0.0 - UI library
- **Tailwind CSS** 4.0 - Utility-first CSS (Oxide engine)

### Blockchain

- **Viem** 2.37.11 - Ethereum interactions
- **Wagmi** 2.14.10 - React hooks for Ethereum
- **RainbowKit** 2.2.8 - Wallet connection UI

### State & Data

- **Zustand** 5.0.8 - State management
- **TanStack Query** 5.66.1 - Server state management
- **Zod** 3.24.1 - Runtime type validation

### Backend

- **Node.js** 22 LTS - JavaScript runtime
- **Upstash Redis** - Serverless Redis (HTTP-based)

### Development Tools

- **Turborepo** 2.5.2 - Monorepo build system
- **ESLint** 9.20.0 - Code linting
- **Prettier** 3.4.2 - Code formatting

## Deployment

### Netlify Deployment

This project is configured for deployment on Netlify with the following settings:

**Build Settings:**

- **Build Command:** `pnpm build`
- **Publish Directory:** `apps/web/out`
- **Node.js Version:** 22

**Deployment Strategy:**

- **Production:** Automatic deployments from `main` branch
- **Preview:** Automatic preview deployments for all pull requests
- **Staging:** Branch deploys enabled for `staging` branch

### Environment Variables (Netlify)

Set the following environment variables in the Netlify dashboard:

- `NEXT_PUBLIC_SPECTRUM_RPC_URL`
- `NEXT_PUBLIC_MEZO_CHAIN_ID`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_TIP_JAR_ADDRESS`
- `NEXT_PUBLIC_BORROWING_VAULT_ADDRESS`
- `NEXT_PUBLIC_MUSD_ADDRESS`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_BASE_URL`

**Note:** Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Documentation

- **[Architecture](docs/architecture/index.md)** - System architecture and technical design
- **[PRD](docs/prd/index.md)** - Product requirements document
- **[Frontend Spec](docs/front-end-spec/index.md)** - UI/UX specifications

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the coding standards in `docs/architecture/coding-standards.md`
3. Run `pnpm lint` and `pnpm format` before committing
4. Submit a pull request

## License

[License information to be added]

## Support

For issues and questions, please refer to the project documentation or contact the development team.

---

Built with ❤️ for the Mezo Network Hackathon
