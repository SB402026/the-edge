# The Edge — NFL + NCAAF Power Rating System

## URLs
- `/`    → NFL edge calculator
- `/cfb` → NCAAF edge calculator with wide spread penalty system

## Setup
```bash
npm install
cp .env.local.example .env.local
# Add ANTHROPIC_API_KEY to .env.local
npm run dev
```

## Deploy to Vercel
1. Push to GitHub
2. Import at vercel.com
3. Add env var: ANTHROPIC_API_KEY
4. Deploy

## Tuesday Workflow
1. Open app → select week number
2. Tap "Fetch FPI" → ~10 seconds
3. Tap "Fetch Lines" → ~10 seconds  
4. Tap "AI Handicapper" → weekly analysis
