# CampusCompass

CampusCompass is a College Discovery Platform MVP for exploring Indian colleges, saving shortlists, and comparing options side by side. It is built for internship evaluation with typed data models, reusable components, and graceful empty, loading, and error states.

## Tech Stack

- Next.js 15 App Router with TypeScript
- TailwindCSS and shadcn-style UI primitives
- Supabase Auth and PostgreSQL
- Zustand for compare and saved state
- React Hook Form and Zod for auth forms
- next-themes for system-aware dark mode

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
3. Add your Supabase project values to `.env.local`.
4. Start the app:
   ```bash
   npm run dev
   ```

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run `supabase/schema.sql`.
4. Enable Email/Password auth in Authentication settings.
5. Confirm Row Level Security policies are enabled for `colleges` and `saved_colleges`.

## Seed Instructions

The schema file creates both tables and inserts 15 colleges: IIT Bombay, IIT Delhi, BITS Pilani, VJTI, COEP, SPIT, NIT Trichy, VIT Vellore, Manipal Institute of Technology, NMIMS, SRM, Thapar, IIIT Hyderabad, DTU, and Jadavpur University.

## Deployment on Vercel

1. Make sure `.env.local` has your Supabase values locally:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
2. Push the project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/SkaaBroach853/campus_compare.git
   git push -u origin main
   ```
3. Import the GitHub repository in Vercel.
4. Add these Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy with the default Next.js settings. This repo also includes `vercel.json` so Vercel uses `npm install`, `npm run build`, and `.next`.
6. Verify login, signup, saved colleges, and Supabase reads in the deployed preview.

## Screenshots

- Landing page: add screenshot here
- Colleges listing: add screenshot here
- College detail: add screenshot here
- Compare table: add screenshot here
- Saved colleges: add screenshot here

## Architecture Decisions

- Supabase is the single source of truth for colleges and saved records; UI pages do not hardcode college data.
- Client-side Supabase access keeps auth and saved-college interactions simple for the MVP.
- Zustand owns fast local UI state for compare selections and saved IDs.
- Components are modular so listing, landing, detail, compare, and saved pages share card and state behavior.
- Dark mode uses `next-themes` with system preference as the default.
