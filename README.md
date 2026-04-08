# FORGE & GLOW — The Ultimate Performance & Wellness Protocol

> [!IMPORTANT]
> **Production Ready**: This application is now fully integrated with Supabase for real-time tracking, authentication, and date-aware routine management.

## 🚀 Environment Variables (Vercel)

Set the following in your Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
- `SUPABASE_URL`: (Optional) Project URL for server-side checks.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for `api/db-health.js` verification.

## 🗄️ Database Setup
The database schema is located at:
`supabase/migrations/20260407_initial_tables.sql`

Run this script in the Supabase SQL Editor to initialize the `daily_metrics`, `item_completions`, and `exercise_completions` tables.

## 🩺 Health Endpoints
- `/api/public-config`: Verifies credential exposure (safe).
- `/api/db-health`: Verifies table connectivity and integrity.

## 🔐 Default Login (Temporary)
- **Username**: `MAHINDRA CHINTALA`
- **Password**: `fq7Jjs43`

---

## 🎨 Premium Features
- **Black + Gold Theme**: High-contrast, premium aesthetic.
- **Date-Aware Flow**: Automatic alignment with current week dates.
- **Schedule Rules**: 
  - Tuesday: Legs Day (Enforced)
  - Saturday: No Legs workout
  - Sunday: Active Rest Only
- **YouTube Integration**: "Watch on YouTube" links for every exercise.
- **Responsive Design**: Optimized for Mobile, Tablet, and Desktop.
