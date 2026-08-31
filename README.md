# The Edge — NFL Power Rating System

NFL betting edge calculator using power ratings vs DraftKings lines.

## Setup

```bash
npm install
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import at vercel.com → New Project
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy

## Weekly Update (Every Tuesday)

1. Go to espn.com/nfl/fpi — update FPI rankings in the app
2. Go to sportsbook.draftkings.com — update lines for the week
3. Hit AI Handicapper for the weekly analysis

## Stack

- Next.js 14
- React 18
- Anthropic claude-sonnet-4-6 via server-side API route
