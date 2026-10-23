# Dictionary monorepo

This repository contains the web app, Expo mobile app, and shared Supabase data access.

## Workspace layout

- `apps/web` — React and Vite web app
- `apps/mobile` — Expo React Native app
- `packages/shared` — shared Supabase client, word and login services, and data types

## Setup

Install pnpm, then install all workspace dependencies from the repository root:

```sh
pnpm install
```

Create `apps/web/.env` from `apps/web/.env.example` and `apps/mobile/.env` from `apps/mobile/.env.example`. Set the Supabase URL and anon key in each file. Expo reads the mobile values from `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Run

```sh
pnpm dev:web
pnpm dev:mobile
```

Build the web app with `pnpm build:web`. From `apps/mobile`, Expo can also be started with `pnpm start`, `pnpm android`, or `pnpm ios`.
