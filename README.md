# 🐼 PANDA – EXIST Gründungsstipendium Planner

Internal planning & management dashboard for our EXIST Gründungsstipendium Vorhaben.

**Team:** Jiun & Nina

## Tech Stack

- **Next.js 14** (App Router)
- **Vanilla CSS** (custom design system)
- **Vercel** deployment ready

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Click **Deploy** — zero config needed

Or use the Vercel CLI:

```bash
npx vercel
```

## Project Structure

```
src/
└── app/
    ├── globals.css    # Design system & all styles
    ├── layout.js      # Root layout with metadata
    └── page.js        # Main dashboard page
```

## Features

- 📊 Overall progress tracking
- 🎯 Milestone timeline (Meilensteine)
- 📦 Work package progress (Arbeitspakete)
- 💰 Budget breakdown (Finanzplan)
- 📝 Pinned notes & tasks
- 🎨 Dark glassmorphism UI with animated background
