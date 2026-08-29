# Migrations

This sandbox cannot reach `*.supabase.co` (network egress is blocked here), so
these SQL files were never applied automatically. Run them yourself, in
order, before using the app:

1. Open the Supabase dashboard → your project → **SQL Editor**.
2. Paste the contents of `migrations/0001_init.sql`, run it.
3. Paste the contents of `migrations/0002_storage.sql`, run it.

(Or, if you have the Supabase CLI linked to this project: `supabase db push`.)

## Google OAuth (manual, dashboard-only)

1. Supabase dashboard → **Authentication → Sign In / Providers → Google**.
2. Enable it, paste `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from
   `.env.local`.
3. In the Google Cloud Console, make sure the OAuth client's **Authorized
   redirect URI** includes:
   `https://rkgdnlybpqqwevlnhucd.supabase.co/auth/v1/callback`

## Demo accounts

After the migrations are applied, run:

```bash
npm run seed:demo
```

This uses `SUPABASE_SECRET_KEY` to create 3 auth users (bypassing email
confirmation) with a profile, a sample training plan, and a starter
conversation each. See `scripts/seed-demo.mjs` for the credentials it
prints.
