# EGY CINEMA — Landing Site

A bilingual (English + Arabic, RTL) marketing site and admin panel for the [EGY CINEMA](https://github.com/Youssf-Mohamed/movie_app) Flutter streaming app.

- **Public site** — SEO-optimized landing page, changelog, per-platform download buttons. Bilingual EN/AR with hreflang.
- **Admin panel** — protected at `/admin`. Sign in with Supabase Auth to create and publish releases (version, patch notes, per-platform download URLs, force-update flag).

Built with **Astro 5** (static + server), deployed on **Vercel**, backed by the same **Supabase** project the Flutter app uses.

## Stack

| Layer | Choice |
|---|---|
| Framework | [Astro 5](https://astro.build) (static + server routes) |
| Hosting | [Vercel](https://vercel.com) (free tier) |
| Backend | [Supabase](https://supabase.com) — `app_config` table + RLS |
| Auth | Supabase Auth (email + password) |
| Fonts | Cairo + IBM Plex Mono via `@fontsource` |
| SEO | `@astrojs/sitemap`, JSON-LD, `hreflang`, `llms.txt`, OG image |

## Project structure

```
src/
├── i18n/              EN + AR translation strings, typed access
├── lib/               Supabase client + SEO helpers
├── components/        MarqueeRule, DownloadButton, PlatformPills
├── layouts/           Base (public) + AdminLayout
├── pages/
│   ├── index.astro    Redirects to /en
│   ├── en/            English landing + changelog
│   ├── ar/            Arabic landing + changelog (dir="rtl")
│   └── admin/         Login, release list, release form, /api routes
├── styles/global.css  Marquee design system (CSS variables)
└── env.d.ts
public/
├── favicon.svg
├── llms.txt           AI-readable product summary
├── robots.txt
└── og-image.png       1200×630 social preview
scripts/
├── build-og-image.mjs Rasterizes the OG image from SVG
└── fix-imports.mjs    One-shot import-path repair utility
```

## Local development

```sh
npm install
cp .env.example .env   # fill in PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

The dev server runs on `http://localhost:4321`. The admin panel is at `http://localhost:4321/admin`.

## Build

```sh
npm run build
```

Outputs static HTML to `dist/client/` and a Vercel serverless function bundle to `dist/server/`.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. In Vercel, click "New Project" → import the repo → Framework: **Astro** → Deploy.
3. Set environment variables in the Vercel project:
   - `PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
4. Every push to `main` auto-deploys.

The site will be live at `https://egy-cinema.vercel.app`. Swap in a real custom domain via Vercel → Domains.

## Admin setup

The admin panel is gated by the `admins` table in Supabase. To add an admin:

1. Sign up through Supabase Auth (email + password) — either via the Supabase dashboard's Authentication tab or by inserting a user manually.
2. In the Supabase SQL editor, run:
   ```sql
   INSERT INTO public.admins (user_id, email)
   SELECT id, email FROM auth.users WHERE email = 'you@example.com';
   ```
3. Visit `/admin`, sign in, and you can now create, edit, and publish releases.

## How releases work

A "release" is one row in the `app_config` table. The admin form writes:
- `min_version` — the version this release announces (also gates the Flutter app's force-update logic)
- `release_date`
- `notes_markdown` + `notes_html` — release notes (rendered to HTML server-side, displayed on the public changelog)
- `is_published` — toggle visibility on the public site
- `is_force_update` — sets `policy = 'force_update'`, which the Flutter app reads to block older versions
- Per-platform download URLs (Windows, macOS, Linux, Android, iOS) + a generic `download_url` fallback

Both the public landing site and the Flutter app read from the same `app_config` rows. The public site's `latest_release` view returns the most recent published row; the changelog view returns all published rows newest-first.

## License

MIT
