# 🎬 Bitaca Cinema - Monorepo

> Cultural cinema platform from Capão Bonito/SP, Brazil

[![Lei Paulo Gustavo](https://img.shields.io/badge/Funded-Lei%20Paulo%20Gustavo-blue)](https://capaobonito.sp.gov.br/lei-paulo-gustavo/)
[![PNAB](https://img.shields.io/badge/Funded-PNAB-green)](https://capaobonito.sp.gov.br/lei-aldir-blanc/)
[![Monorepo](https://img.shields.io/badge/Monorepo-pnpm%20+%20Turborepo-orange)](https://turbo.build/)

## 📋 Overview

Bitaca Cinema is a cultural platform showcasing audiovisual productions from Capão Bonito/SP funded by Lei Paulo Gustavo and Política Nacional Aldir Blanc (PNAB). This monorepo contains multiple applications and shared packages for the Bitaca ecosystem.

**About the Cultural Project:** See [PROJETOS-CINEMA.md](docs/PROJETOS-CINEMA.md) for details about the 36 film projects funded by Brazilian cultural policies.

## 🏗️ Project Structure

```
bitaca-cinema/
├── apps/
│   ├── api/              # FastAPI backend with AI agents
│   ├── bet/              # Betting interface application
│   ├── frontend/         # Main frontend application
│   ├── mostra/           # Film showcase platform (23 productions)
│   ├── institucional/    # Institutional website (www.abitaca.com.br)
│   └── streaming-bridge/ # Telegram video streaming proxy
├── packages/
│   ├── ui/               # Shared UI components
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configuration
├── config/
│   ├── nginx/            # Nginx configuration files
│   ├── docker/           # Docker Compose files
│   └── firebase/         # Firebase config (credentials in ~/.secrets/)
├── scripts/
│   ├── deploy/           # Deployment scripts
│   └── setup/            # Setup scripts
├── docs/                 # Documentation
└── tests/                # Test files
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Python 3.12+ (for API)
- Docker & Docker Compose (optional)

### Installation

```bash
# Install dependencies for all workspaces
pnpm install

# Install Turborepo globally (optional)
pnpm add -g turbo
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Lint all apps
pnpm lint
```

### Individual App Commands

```bash
# Run specific app
cd apps/mostra && pnpm dev

# Serve institutional website
pnpm serve:www
```

## 📦 Applications

### 🎬 Mostra Cinema (`apps/mostra`)
Film showcase platform featuring 23 audiovisual productions from Lei Paulo Gustavo. Interactive gallery with voting system and detailed film information.

**Live:** [mostra.abitaca.com.br](https://mostra.abitaca.com.br)

### 🏛️ Institucional (`apps/institucional`)
Official institutional website of Bitaca Cinema. Static site showcasing the cultural space, history, and community impact.

**Live:** [www.abitaca.com.br](https://www.abitaca.com.br)

### 🎲 Bet (`apps/bet`)
Interactive betting interface with horror-themed design and battle system.

**Live:** [bet.abitaca.com.br](https://bet.abitaca.com.br)

### 🔌 API (`apps/api`)
FastAPI backend with:
- AI agents (Gemini integration)
- RL recommendation system
- MongoDB Atlas + Redis
- Cloudflare R2 storage
- TMDB integration

**Stack:** Python 3.12, FastAPI, MongoDB, Redis

### 🌉 Streaming Bridge (`apps/streaming-bridge`)
High-performance streaming proxy for Telegram video content.

**Stack:** Python, FastAPI, Redis caching

### 🎮 Frontend (`apps/frontend`)
Main frontend application (to be consolidated with mostra).

**Stack:** React 19, Vite

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19, Vite
- **Styling:** CSS3, Modern design patterns
- **Build:** Turborepo, pnpm workspaces

### Backend
- **API:** Python 3.12 + FastAPI
- **Database:** MongoDB Atlas, TimescaleDB
- **Cache:** Redis
- **Storage:** Cloudflare R2
- **AI/ML:** Google Gemini, RL agents

### Infrastructure
- **Reverse Proxy:** Nginx
- **Containers:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Deployment:** VPS + Cloudflare CDN

## 🚀 Deployment

### Using Docker Compose

```bash
# From project root
cd config/docker
docker-compose up -d
```

### Manual Deployment

```bash
# Deploy all services
cd scripts/deploy
./deploy.sh

# Deploy API only
./deploy-production.sh
```

### Environment Variables

Each app requires its own `.env` file. Firebase credentials should be stored in `~/.secrets/`.

See individual app directories for specific environment requirements.

## 📝 Documentation

- [Film Projects (Portuguese)](docs/PROJETOS-CINEMA.md) - Information about the 36 funded films
- [API Documentation](apps/api/README.md) - Backend API details
- [Deployment Guide](scripts/deploy/README.md) - Deployment instructions

## 🤝 Contributing

This is a cultural project funded by Brazilian public policies. Contributions are welcome following these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📊 Project Status

- ✅ **Phase 1 Complete:** Project cleanup and restructure
- ✅ **Phase 2 Complete:** Monorepo configuration
- 🔄 **Phase 3 Ongoing:** Feature development
- 📅 **Target:** Production ready by December 2025

## 🌐 Live Sites

- **Institucional:** [www.abitaca.com.br](https://www.abitaca.com.br)
- **Mostra Cinema:** [mostra.abitaca.com.br](https://mostra.abitaca.com.br)
- **Bet:** [bet.abitaca.com.br](https://bet.abitaca.com.br)

## 📞 Contact

**Bitaca Cinema**
- Location: Capão Bonito, São Paulo, Brazil
- Email: contato@abitaca.com.br
- Phone: +55 15 99822-4365
- Instagram: [@abitacacb](https://instagram.com/abitacacb)
- Facebook: [@abitacacb](https://facebook.com/abitacacb)

## 📄 License

Cultural project funded by:
- Lei Paulo Gustavo (Lei Complementar nº 195/2022)
- Política Nacional Aldir Blanc (Lei nº 14.399/2022)

Code is private. Cultural content is for educational and promotional purposes.

---

<div align="center">

**🎬 Preserving memory, celebrating culture 🎬**

*Funded by Lei Paulo Gustavo and PNAB*

</div>
