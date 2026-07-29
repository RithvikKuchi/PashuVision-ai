# PashuVision AI — Intelligent Breed Recognition

**AI-powered image recognition system for identifying Indian cattle and buffalo breeds**, built for Smart India Hackathon 2025 under the **Bharat Pashudhan** initiative.

🔗 **Live Demo:** [cattle-breed-recogni-1vp7.bolt.host](https://cattle-breed-recogni-1vp7.bolt.host/login)

---

## Problem Statement

| | |
|---|---|
| **Problem Statement ID** | SIH25004 |
| **Title** | Image Based Breed Recognition for Cattle and Buffaloes of India |
| **Category** | Software |
| **Theme** | Agriculture, FoodTech & Rural Development |
| **Organization** | Ministry of Fisheries, Animal Husbandry & Dairying |

### Background

The Government of India runs the **Bharat Pashudhan App (BPA)** to record breeding, health, and nutrition data of dairy animals. Field Level Workers (FLWs) collect this data across villages, but breed identification is currently done **manually** — leading to frequent misidentification.

This poor-quality data directly affects:
- Research accuracy
- Government policy decisions
- Breed improvement programs
- National dairy planning

### Challenge

Build an AI-based image recognition system that can:
- Identify cattle and buffalo breeds from images
- Work across Indian indigenous, exotic, and crossbred animals
- Integrate with the Bharat Pashudhan App
- Give real-time breed predictions
- Remain easy to use for field workers with minimal technical training

---

## Features

- [x] Upload or capture animal image
- [x] Predict breed with confidence score
- [x] Suggest top possible breed matches
- [ ] Fast inference on mobile devices
- [ ] Offline / low-network support
- [ ] Full BPA (Bharat Pashudhan App) integration

*(Checklist reflects current build status — update as features are completed.)*

---

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- React Router v7
- Recharts (analytics/dashboard visualizations)
- Lucide React (icons)

**Backend / Data**
- Supabase (Auth + Postgres database)
- Database schema managed via Supabase migrations

**AI / Recognition**
- Image-based breed classification service (see `src/lib/aiService.ts`)

**Internationalization**
- Built-in multi-language support: Punjabi, Kannada, Malayalam, Gujarati — making the tool accessible to Field Level Workers across different states

---

## Project Structure

```
src/
├── components/       # Shared UI components (AppLayout, UI primitives)
├── context/          # Auth, Theme, Toast, and i18n context providers
├── i18n/              # Language files (pa, kn, ml, gu)
├── lib/               # Supabase client + AI recognition service
├── pages/             # App screens
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── PredictPage.tsx       # Core breed recognition flow
│   ├── AnimalsPage.tsx
│   ├── AnimalDetailPage.tsx
│   ├── HistoryPage.tsx
│   ├── AnalyticsPage.tsx
│   └── AdminPage.tsx
├── types/             # Shared TypeScript types
└── App.tsx

supabase/
└── migrations/        # Database schema (pashuvision_schema.sql)
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm
- A Supabase project (for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/pashuvision-ai.git
cd pashuvision-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key in .env
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

---

## Environment Variables

Create a `.env` file in the root directory with:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ Never commit your `.env` file. It's already excluded via `.gitignore`.

---

## Roadmap

- [ ] Integrate a trained CNN/transfer-learning model (e.g. EfficientNet/ResNet) for breed classification
- [ ] Optimize model for on-device / mobile inference (TensorFlow Lite or ONNX)
- [ ] Add offline caching for low-network rural areas
- [ ] Build BPA-compatible API integration layer
- [ ] Expand breed coverage to all ICAR-NBAGR registered cattle and buffalo breeds

---

## Impact

Accurate, AI-assisted breed identification helps ensure:
- Reliable data for national dairy and breeding programs
- Better-targeted breed improvement schemes
- Reduced manual error at the point of data collection
- Faster, more confident decisions for Field Level Workers with no specialized training

---
