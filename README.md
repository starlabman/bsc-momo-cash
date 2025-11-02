# Crypto Offramp/Onramp Platform

Une plateforme complète de conversion blockchain-mobile money permettant des conversions transparentes entre cryptomonnaies et monnaies fiduciaires (XOF) via les opérateurs de mobile money.

## Project info

**URL**: https://lovable.dev/projects/db5817c4-2500-4a73-9883-f2962444934c

## Features

### Core Functionality

#### 🔄 Offramp (Crypto to Fiat)
- Conversion de cryptomonnaies vers mobile money (XOF)
- Support de multiples tokens (USDT, USDC, BUSD, DAI, etc.)
- Support multi-réseaux (BSC, Ethereum, Polygon, Avalanche, Arbitrum, Optimism)
- Calculs de taux de change en temps réel avec marges configurables
- Suivi et traitement automatique des événements blockchain
- Transfert direct vers les opérateurs mobile money (MTN, Moov, Orange, Wave, Free)

#### 💰 Onramp (Fiat to Crypto)
- Conversion de mobile money vers cryptomonnaies
- Support de multiples réseaux blockchain
- Validation sécurisée des adresses de portefeuilles destinataires
- Intégration des opérateurs mobiles spécifiques par pays
- Calculs des montants crypto en temps réel

#### 🔗 Payment Links (Paiement par Lien)
- **Création de demandes de paiement partageable**: Initiez une demande et générez un lien unique
- **Liens sécurisés avec expiration**: Validité de 7 jours pour chaque lien
- **Support Offramp et Onramp**: Fonctionne pour les deux types de transactions
- **QR Code intégré**: Scan facile pour les paiements crypto
- **Partage multi-canal**: Copie, partage natif, ou QR code
- **Informations complètes**: Affichage des montants, adresses, et instructions de paiement
- **Suivi du statut**: Visibilité en temps réel de l'état de la transaction

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

- **Supabase Backend**: Intégration full-stack
- **Edge Functions**: Fonctions serverless pour:
  - Création de demandes offramp
  - Création de demandes onramp
  - Récupération des taux de change
  - Authentification admin
  - Données du tableau de bord admin
  - Journal d'audit
  - Récupération des demandes de paiement par lien
- **Database Tables**:
  - Pays et opérateurs mobiles
  - Demandes offramp/onramp (avec support des liens de paiement)
  - Événements blockchain
  - Taux de change
  - Utilisateurs admin et journaux d'audit

### Payment Link System

- **Token-based Links**: Chaque demande peut générer un token unique (UUID)
- **Expiration automatique**: Les liens expirent après 7 jours
- **Public Access**: RLS policies permettent l'accès public via token valide
- **Type Detection**: Différenciation automatique entre offramp et onramp
- **Requester Information**: Stockage du nom du demandeur et infos additionnelles
- **Payment Instructions**: Instructions détaillées pour effectuer le paiement
- **Status Tracking**: Suivi de l'état `paid_via_link` pour les paiements complétés

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
