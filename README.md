# Fio a Fio

Customer dashboard for managing an ironing package. Customer accounts, package usage, and delivery history are stored in Supabase PostgreSQL.

## Local setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the project's Connect panel.
3. Run the SQL migrations in `supabase/migrations/` in timestamp order. The initial migration creates the package and garment catalog, customer data tables, row-level security policies, and atomic delivery creation. The delivery edit/delete migration adds the corresponding secure database functions.
4. In Supabase Auth URL Configuration, allow the local callback `http://localhost:3000/auth/callback`. For phone testing, also allow `http://<computer-lan-ip>:3000/auth/callback`. Add the deployed app's `/auth/callback` URL before production use. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin for email verification and password-reset links.
5. Start the app:

   ```bash
   npm install
   npm run dev
   ```

New accounts receive an active Essencial package with 30 monthly credits. Delivery records snapshot garment names and credit values so later catalog changes do not rewrite history. A new account starts with no deliveries.

The current SQL migrations can be safely run again against the initialized schema. Migrations that change catalog or configuration data should use deterministic upserts so existing rows can be replaced. Schema changes should preserve customer package and delivery history unless a migration explicitly documents a data replacement.

The migration enables row-level security and only grants customers read access to their own records. Delivery creation is performed through a database function that checks the signed-in user, active package, garment catalog, quantities, and current credit values.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable project key. It is designed for client applications and does not bypass row-level security.
- `NEXT_PUBLIC_SITE_URL` (optional locally): canonical app origin used to create auth email links. In production, set it to the deployed origin.

Never put a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable or commit credentials to the repository.
