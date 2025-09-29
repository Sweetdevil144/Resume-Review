# Fundamental Architecture

- User uploads a resume and sees status.
- Admin reviews, sets status and optional score/notes.

## **Tables**

### 1. `profiles`

- `id` (uuid, PK, references `auth.users`)
- `email` (text, unique)
- `full_name` (text)
- `role` (enum: `user` | `admin`, default `user`)
- `created_at` (timestamptz)

### 2. `submissions`

- `id` (uuid, PK)
- `user_id` (uuid, FK → `profiles.id`)
- `file_url` (text) – signed/public URL to uploaded PDF
- `original_name` (text)
- `mime_type` (text)
- `size_bytes` (bigint)
- `status` (enum: `pending` | `approved` | `needs_revision` | `rejected`)
- `score` (numeric, nullable)
- `admin_notes` (text, nullable)
- `created_at`, `updated_at`

Indexes: by `user_id`, `status`, `created_at desc`.

## **Security (RLS)**

- `profiles`: user can read self; admin can update.
- `submissions`:
  - user can insert/read their own rows.
  - admin can read/update all rows (set `status`, `score`, `admin_notes`).

No storage policies here; the app will use Supabase Storage signed URLs or another storage and save the `file_url` only.

## **Flows**

- User signs in with magic link (Supabase Auth).
- User uploads PDF → app stores file → inserts `submissions` row with `status='pending'`.
- Admin dashboard lists newest submissions → admin opens one → sets `status` to `approved`/`needs_revision`/`rejected`, and optional `score` + `admin_notes`.
- User dashboard shows their submissions and statuses.
