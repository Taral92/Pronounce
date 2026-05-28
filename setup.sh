#!/bin/bash
set -e
GREEN='\033[0;32m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════╗"
echo "║     🎙️  Pronounce — Setup Script      ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# ── Backend
echo -e "${GREEN}[1/3] Setting up Python backend...${NC}"
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet
if [ ! -f .env ]; then cp .env.example .env; echo "  → .env created from .env.example"; fi
deactivate
cd ..

# ── Frontend
echo -e "${GREEN}[2/3] Installing Node.js dependencies...${NC}"
cd frontend
npm install --silent
if [ ! -f .env.local ]; then cp .env.local.example .env.local; echo "  → .env.local created from .env.local.example"; fi
cd ..

echo -e "${GREEN}[3/3] Done!${NC}"
echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ PRONOUNCE IS READY TO CONFIGURE"
echo "══════════════════════════════════════════════════"
echo ""
echo "STEP 1 — Fill in your API keys:"
echo "  → backend/.env         (OpenAI, ElevenLabs, Clerk, Supabase, Stripe)"
echo "  → frontend/.env.local  (Clerk publishable key, Stripe price IDs)"
echo ""
echo "STEP 2 — Run Supabase migrations:"
echo "  → Open supabase.com → your project → SQL Editor"
echo "  → Run: supabase/migrations/001_core.sql"
echo "  → Run: supabase/migrations/002_referrals.sql"
echo ""
echo "STEP 3 — Configure Clerk Dashboard:"
echo "  → Enable: Google, Apple, Email Magic Link, Email+Password"
echo "  → Webhooks → Add endpoint: http://localhost:8000/webhooks/clerk"
echo "  → Copy Signing Secret → paste into backend/.env CLERK_WEBHOOK_SECRET"
echo ""
echo "STEP 4 — Configure Stripe Dashboard:"
echo "  → Webhooks → Add endpoint: http://localhost:8000/webhooks/stripe"
echo "  → Events: checkout.session.completed, customer.subscription.*"
echo "  → Copy Signing Secret → paste into backend/.env STRIPE_WEBHOOK_SECRET"
echo "  → Create 2 products (Pro Monthly \$4.99, Pro Annual \$39)"
echo "  → Copy price IDs → paste into both .env files"
echo ""
echo "STEP 5 — Set your admin user ID:"
echo "  → Sign up on the app, go to Clerk Dashboard → Users"
echo "  → Copy your user ID (user_xxxxx)"
echo "  → Paste into backend/.env ADMIN_CLERK_USER_ID"
echo "  → In Supabase: UPDATE users SET tier='admin' WHERE id='user_xxxxx'"
echo ""
echo "STEP 6 — Start the app:"
echo "  Terminal 1 → cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  Terminal 2 → cd frontend && npm run dev"
echo ""
echo "  🌐 App:      http://localhost:3000"
echo "  📖 API Docs: http://localhost:8000/docs"
echo "  🔧 Admin:    http://localhost:3000/admin"
echo ""
echo "══════════════════════════════════════════════════"
