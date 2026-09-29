# Financial Signal Processing & AI Predictor

React, TypeScript, and Vite app for exploring market data and forecasts. The analysis screen calls the Supabase Edge Function `analyze`.

## Run locally

Requirements: Node.js 20 or newer and npm.

1. Install dependencies with `npm install` (or `npm ci` from a clean checkout).
2. Create a root `.env` file based on `.env.example` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Start the development server with `npm run dev`.
4. Open the URL Vite prints, normally <http://localhost:5173>.

The browser needs network access to the configured Supabase project, and that project must have the `analyze` Edge Function deployed for live analysis to work.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Secrets and variables → Actions** and add these repository secrets:
   - `VITE_SUPABASE_URL`: the Supabase project URL.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: the project's publishable/anon key.
3. Open **Settings → Pages** and set the source to **GitHub Actions**.
4. Push to `main` (or manually run **Deploy to GitHub Pages** from the Actions tab). The workflow builds and publishes the app; its URL appears in the `github-pages` deployment environment.

The workflow uses the repository name as the Vite base path, so it works for a standard project Pages URL. The Supabase key is embedded in browser code at build time; use only a Supabase publishable/anon key and enforce access with Supabase policies. The Supabase `analyze` Edge Function must be deployed separately.

## Other commands

- `npm run build` creates the production build in `dist/`.
- `npm run preview` serves that build locally.
- `npm run lint` checks the source with ESLint.
- `npm test` runs the Vitest suite.
