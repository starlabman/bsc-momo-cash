# Crypto Offramp/Onramp Platform

A comprehensive blockchain-to-mobile-money platform enabling seamless conversion between cryptocurrencies and fiat currencies (XOF) via mobile money operators.

## Project info

**URL**: https://lovable.dev/projects/db5817c4-2500-4a73-9883-f2962444934c

## Features

### Core Functionality

#### 🔄 Offramp (Crypto to Fiat)
- Convert cryptocurrency to mobile money (XOF)
- Support for multiple tokens (USDT, USDC, BUSD, DAI, etc.)
- Multi-network support (BSC, Ethereum, Polygon, Avalanche, Arbitrum, Optimism)
- Real-time exchange rate calculations with configurable margins
- Automatic blockchain event tracking and processing
- Direct transfer to mobile money operators (MTN, Moov, Orange, Wave, Free)

#### 💰 Onramp (Fiat to Crypto)
- Convert mobile money to cryptocurrency
- Support for multiple blockchain networks
- Secure recipient wallet address validation
- Country-specific mobile operator integration
- Real-time crypto amount calculations

### Blockchain Integration

- **Multi-Network Support**: BSC, Ethereum, Polygon, Avalanche, Arbitrum, Optimism
- **Wallet Connection**: Integration with multiple wallet providers via WagmiConfig
- **Token Support**: USDT, USDC, BUSD, DAI, and other stablecoins
- **Transaction Tracking**: Comprehensive blockchain event monitoring
- **Network Statistics**: Real-time analytics on network usage and volumes

### Admin Dashboard

#### 📊 Request Management
- View and manage all offramp/onramp requests
- Filter by status (pending, processing, paid, failed, completed)
- Update request status and add notes
- Transaction hash tracking
- Pagination for large datasets

#### 📈 Analytics & Statistics
- Total request counts (offramp/onramp)
- Status breakdown (pending, processing, paid, failed)
- Volume tracking (USD and XOF)
- Blockchain event statistics
- Network usage analytics:
  - Volume by network
  - Transaction counts per network
  - Most/least used networks
  - Unique token tracking per network

#### 🔐 Security Features
- Admin authentication with JWT tokens
- Rate limiting on authentication endpoints
- Audit logging for all admin actions
- IP address tracking
- Session management with token expiration
- Row-Level Security (RLS) policies

### Country & Operator Support

- **Multi-Country Support**: Configurable country list with phone prefixes
- **Mobile Operators**: MTN, Moov, Orange, Wave, Free
- **Smart Detection**: Automatic operator detection from phone numbers
- **Number Validation**: Pattern-based validation for mobile numbers

### Exchange Rate Management

- Real-time exchange rate updates
- Configurable profit margins
- Support for multiple currency pairs (USD/XOF)
- Transparent rate display to users

### Database & Backend

- **Supabase Backend**: Full-stack integration
- **Edge Functions**: Serverless functions for:
  - Offramp request creation
  - Onramp request creation
  - Exchange rate fetching
  - Admin authentication
  - Admin dashboard data
  - Audit logging
- **Database Tables**:
  - Countries and mobile operators
  - Offramp/onramp requests
  - Blockchain events
  - Exchange rates
  - Admin users and audit logs

### User Interface

- Responsive design with Tailwind CSS
- Dark/light mode support
- Real-time form validation
- QR code generation for wallet addresses
- Toast notifications for user feedback
- Comprehensive error handling

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?


## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
