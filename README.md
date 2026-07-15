# Precision Harvest - Smart Irrigation Dashboard

Full-stack smart irrigation dashboard with real-time soil moisture + weather monitoring,
AI-powered irrigation decisions, city validation, and live email alerts via Gmail.

---

## WHAT IS INCLUDED

- React 19 + Vite 7 frontend with dynamic status banner
- Express 5 + Node.js backend
- MongoDB Atlas (live database - pre-configured)
- Gmail email alerts via Nodemailer (no domain restriction)
- OpenWeather API for live weather data
- JWT authentication with bcrypt
- React Query with cache clearing on login/logout
- City name validation before saving farm settings
- Clean integer rain probability display

All API keys and DB credentials are pre-filled in artifacts/api-server/.env
Extract, install, and run - no configuration needed.

---

## SETUP (3 steps only)

STEP 1 - Install Node.js and pnpm (skip if already installed)

    Node.js 20+:  https://nodejs.org  (download LTS)
    pnpm 9+:      npm install -g pnpm

STEP 2 - Install all project dependencies

    pnpm install

STEP 3 - Start the app (two terminal windows)

  TERMINAL 1 - API server (port 5000):
    pnpm --filter @workspace/api-server run dev

  TERMINAL 2 - Frontend (port 3000):

    macOS / Linux:
      PORT=3000 BASE_PATH=/ pnpm --filter @workspace/precision-harvest run dev

    Windows PowerShell:
      $env:PORT="3000"; $env:BASE_PATH="/"; pnpm --filter @workspace/precision-harvest run dev

Open in browser:
    http://localhost:3000

---

## ALL COMMANDS

    # Install everything (run once after cloning)
    pnpm install

    # --- DEVELOPMENT (need two terminals) ---

    # Terminal 1: API server
    pnpm --filter @workspace/api-server run dev

    # Terminal 2: Frontend - macOS/Linux
    PORT=3000 BASE_PATH=/ pnpm --filter @workspace/precision-harvest run dev

    # Terminal 2: Frontend - Windows PowerShell
    $env:PORT="3000"; $env:BASE_PATH="/"; pnpm --filter @workspace/precision-harvest run dev

    # --- TYPE CHECK ---
    pnpm run typecheck

    # --- PRODUCTION BUILD ---
    pnpm --filter @workspace/api-server run build
    PORT=3000 BASE_PATH=/ pnpm --filter @workspace/precision-harvest run build

    # --- RUN PRODUCTION BUILD ---
    PORT=5000 node --enable-source-maps artifacts/api-server/dist/index.mjs
    PORT=3000 BASE_PATH=/ pnpm --filter @workspace/precision-harvest run serve

---

## PROJECT STRUCTURE

    artifacts/
      api-server/                  Express 5 backend (port 5000)
        src/
          routes/
            auth.ts                signup, signin
            farms.ts               CRUD + city validation before save
            weather.ts             live weather + AI irrigation + email alert
            analytics.ts           irrigation history
            notifications.ts       test email endpoint
          lib/
            mongodb.ts             MongoDB connection
            notifications.ts       Gmail via Nodemailer (transporter per-call)
            weather.ts             OpenWeather fetch + irrigation logic
            seed.ts                DB seed
            logger.ts              Pino structured logging
        .env                       All live credentials (pre-filled)

      precision-harvest/           React + Vite frontend (port 3000)
        src/
          pages/
            dashboard.tsx          Dynamic banner + AI Evaluation button
            settings.tsx           Farm config + city validation error display
            signin.tsx
            signup.tsx
          hooks/
            use-auth.tsx           JWT auth + queryClient.clear() on login/logout
          lib/
            api-client.ts          fetch wrapper + auth headers
        .env.local                 PORT=3000 BASE_PATH=/ (pre-configured)
        vite.config.ts             Proxies /api to localhost:5000

    lib/
      api-zod/                     Shared Zod validation schemas
      api-client-react/            React Query hooks
      api-spec/                    OpenAPI spec + codegen config
      db/                          Drizzle ORM schema

---

## ALL BUG FIXES INCLUDED

  1. ALERT_EMAIL typo fixed (gamil.com -> gmail.com)
  2. React Query cache cleared on login AND logout (no stale data between users)
  3. Test alert saves email first before sending (no unsaved email mismatch)
  4. Gmail Nodemailer transporter created inside function (env vars always loaded)
  5. Rain probability stored and displayed as clean integer (Math.round)
  6. Specific weather error messages (city not found vs service unavailable)
  7. Weather routes return 422 with exact error message to frontend
  8. City validated against OpenWeather before saving farm settings
  9. Location field shows inline error if city does not exist

---

## CREDENTIALS (pre-configured in artifacts/api-server/.env)

    PORT                  5000
    MONGODB_URI           MongoDB Atlas - live database
    JWT_SECRET            64-byte secret for signing JWTs
    SESSION_SECRET        64-byte secret for sessions
    OPENWEATHER_API_KEY   Live weather data
    GMAIL_USER            Gmail address for sending alerts
    GMAIL_APP_PASSWORD    Gmail App Password (16 chars)
    ALERT_EMAIL           Receives AI evaluation alerts

---

## TROUBLESHOOTING

  pnpm install fails
    -> Check Node.js version: node --version (needs 20+)

  MongoDB connection failed
    -> Whitelist your IP in MongoDB Atlas -> Network Access
    -> The .env already has the correct URI

  Blank page or fetch errors
    -> Terminal 1 (API server) must be running BEFORE opening the browser
    -> Check Terminal 1 shows: Server listening port=5000

  Gmail emails not received
    -> Check spam folder
    -> App Password must be from: Google Account -> Security -> 2-Step Verification -> App Passwords

  Invalid city error when saving settings
    -> Enter the city name as OpenWeather recognizes it (e.g. "London" not "london UK")

  Port already in use
    -> Change PORT in artifacts/api-server/.env (e.g. 5001)
    -> Change PORT in artifacts/precision-harvest/.env.local (e.g. 3001)
    -> Update proxy target in vite.config.ts to match the new API port
