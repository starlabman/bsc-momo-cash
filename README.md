# SikaPay — Plateforme Crypto Offramp/Onramp

Une plateforme complète de conversion blockchain-mobile money permettant des conversions transparentes entre cryptomonnaies et monnaies fiduciaires (XOF) via les opérateurs de mobile money.

## Project info

**URL**: https://lovable.dev/projects/db5817c4-2500-4a73-9883-f2962444934c

## Fonctionnalités

### 🔄 Offramp (Crypto → Mobile Money)
- Conversion de cryptomonnaies vers mobile money (XOF)
- Support multi-tokens : USDT, USDC, BUSD, DAI, etc.
- Support multi-réseaux : BSC, Ethereum, Polygon, Avalanche, Arbitrum, Optimism
- Calculs de taux de change en temps réel avec marges configurables
- Suivi et traitement automatique des événements blockchain
- Transfert direct vers les opérateurs mobile money (MTN, Moov, Orange, Wave, Free)
- **Adresse de paiement unique visuelle** liée à chaque référence de transaction

### 💰 Onramp (Mobile Money → Crypto)
- Conversion de mobile money vers cryptomonnaies
- Support de multiples réseaux blockchain
- Validation sécurisée des adresses de portefeuilles destinataires
- Intégration des opérateurs mobiles spécifiques par pays
- Calculs des montants crypto en temps réel
- **Identifiant de paiement unique** affiché pour chaque transaction

### 🔗 Liens de Paiement
- Création de demandes de paiement partageables avec lien unique
- Liens sécurisés avec expiration (7 jours)
- Support Offramp et Onramp
- QR Code intégré pour scan facile
- Partage multi-canal : copie, partage natif, QR code
- Suivi du statut en temps réel

### ⛓️ Intégration Blockchain
- **Multi-Network** : BSC, Ethereum, Polygon, Avalanche, Arbitrum, Optimism
- **Multi-Token** : USDT, USDC, BUSD, DAI et autres stablecoins
- **Suivi de transactions** : Monitoring complet des événements blockchain
- **Statistiques réseau** : Analytiques en temps réel sur l'utilisation et les volumes

### 🛡️ Dashboard Admin

#### Gestion des requêtes
- Vue et gestion de toutes les requêtes offramp/onramp
- Filtres par statut (pending, processing, paid, failed, completed)
- Mise à jour du statut et ajout de notes
- Suivi des hash de transaction
- Pagination pour les grands jeux de données

#### Analytiques & Statistiques
- Compteurs de requêtes (offramp/onramp)
- Répartition par statut
- Suivi des volumes (USD et XOF)
- Statistiques blockchain et réseau

#### Gestion de la Visibilité (avec cascade)
- **Pays** : Activer/désactiver des pays — la désactivation d'un pays désactive automatiquement ses opérateurs liés
- **Opérateurs** : Activer/désactiver des opérateurs mobile money
- **Blockchains** : Activer/désactiver des réseaux — la désactivation d'un réseau désactive automatiquement ses tokens liés
- **Tokens** : Activer/désactiver des tokens par réseau
- **Actions groupées** : Boutons « Tout activer / Tout désactiver » pour chaque section

#### Sécurité
- Authentification admin avec JWT
- Rate limiting sur les endpoints d'authentification
- Audit logging de toutes les actions admin
- Tracking d'adresse IP
- Gestion de session avec expiration de token
- Row-Level Security (RLS)

### 🌍 Support Pays & Opérateurs
- Support multi-pays avec préfixes téléphoniques
- Opérateurs : MTN, Moov, Orange, Wave, Free
- Détection automatique de l'opérateur depuis le numéro
- Validation par pattern des numéros mobiles

### 💱 Gestion des Taux de Change
- Taux de change en temps réel (APIs multiples avec fallback)
- Marges de profit configurables
- Support des paires USD/XOF
- Affichage transparent des taux

### 🗄️ Backend & Base de Données
- **Supabase** : Backend full-stack
- **Edge Functions** :
  - Création de demandes offramp/onramp
  - Récupération des taux de change
  - Authentification et validation admin
  - Dashboard admin
  - Audit logging
  - Récupération des demandes de paiement par lien
  - Toggle de visibilité (pays, opérateurs, blockchains, tokens) avec cascade
  - Recherche de transactions
  - Monitoring blockchain et webhooks
- **Tables principales** : countries, mobile_operators, offramp_requests, onramp_requests, blockchain_events, exchange_rates, admin_users, admin_audit_logs, blockchain_visibility, country_visibility, token_visibility

## Stack Technique

- **Frontend** : React, TypeScript, Vite
- **UI** : Tailwind CSS, shadcn/ui
- **Backend** : Supabase (Edge Functions, PostgreSQL, RLS)
- **Autres** : React Query, React Router, Recharts, QRCode.react, Zod

## Développement Local

```sh
# Cloner le repo
git clone <YOUR_GIT_URL>

# Naviguer dans le projet
cd <YOUR_PROJECT_NAME>

# Installer les dépendances
npm i

# Lancer le serveur de développement
npm run dev
```

## Domaine Personnalisé

Pour connecter un domaine, allez dans Project > Settings > Domains et cliquez sur Connect Domain.

Plus d'infos : [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
