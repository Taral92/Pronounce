# 🎙️ Pronounce

AI-powered pronunciation coach for English, German & Spanish.

## Quick Start

```bash
./setup.sh          # installs all dependencies
# fill in .env files
# run migrations in Supabase SQL editor
cd backend && source venv/bin/activate && uvicorn app.main:app --reload
cd frontend && npm run dev
```

## Architecture

```
pronounce/
├── backend/                    # FastAPI (Python)
│   └── app/
│       ├── main.py             # App entry point
│       ├── config.py           # All config + languages + tier limits
│       ├── models/schemas.py   # All Pydantic models
│       ├── middleware/auth.py  # Clerk JWT validation
│       ├── services/
│       │   ├── db.py           # Supabase client
│       │   ├── usage.py        # Tier limits + usage tracking
│       │   ├── whisper.py      # OpenAI Whisper transcription
│       │   ├── gpt.py          # GPT-4o-mini pronunciation analysis
│       │   └── tts.py          # ElevenLabs TTS
│       └── routers/
│           ├── analyze.py      # POST /analyze
│           ├── tts_router.py   # GET /tts/word
│           ├── user.py         # GET /me/limits
│           ├── stripe_router.py# Stripe webhook + checkout
│           ├── clerk_webhook.py# Clerk webhook (save ref_code)
│           ├── tutor.py        # Tutor dashboard API
│           └── admin.py        # Admin panel API
│
├── frontend/                   # Next.js 14 + Tailwind
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Landing page
│       │   ├── login/          # Sign in (all 3 methods)
│       │   ├── signup/         # Sign up
│       │   ├── pricing/        # Plans + Stripe
│       │   ├── dashboard/      # Main app (record + analyse)
│       │   ├── tutor/dashboard # Tutor stats portal
│       │   └── admin/          # Admin panel (tutors + commissions)
│       ├── components/
│       │   ├── ui/             # ScoreCircle, AudioPlayer, UsageBadge...
│       │   └── pronunciation/  # Recorder, WordCards, FeedbackPanel...
│       ├── hooks/              # useRecorder, useLimits
│       ├── lib/api.ts          # All API calls
│       └── types/index.ts      # TypeScript types
│
└── supabase/migrations/
    ├── 001_core.sql            # users + usage tables
    └── 002_referrals.sql       # tutors + commissions tables

```

## Deploy

- **Frontend**: Vercel (connect GitHub repo, set env vars)
- **Backend**: Railway (connect GitHub repo, set env vars, set start command)

## Tutor Referral System

1. Go to `/admin` → Add Tutor with name, email, commission %
2. Share their link: `https://yourapp.com/?ref=their-ref-code`
3. Students who sign up via link are tracked automatically
4. On subscription → commission recorded instantly via Stripe webhook
5. Go to `/admin` → Commissions → Mark Paid after you pay them
