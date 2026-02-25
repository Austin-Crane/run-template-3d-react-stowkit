# Template: React 3D (React Three Fiber + Vite)

## File Structure (as-shipped)

- **src/main.tsx** — Entry point. Applies theme via `applyTheme(theme)`, mounts `<App />` inside `ErrorBoundary` and `StrictMode`
- **src/App.tsx** — Shell: tab state, `TabBar`, content area. Renders active tab via `TAB_CONFIG`; includes landscape warning overlay
- **src/tabs/tabConfig.tsx** — Tab definitions (id, label, icon, render). Add or reorder tabs here
- **src/tabs/SceneTab.tsx** — 3D scene tab. `<Canvas>` from `@react-three/fiber`, `@react-three/drei` (e.g. OrbitControls). Replace or extend for your game
- **src/tabs/HomeTab.tsx**, **AdsTab.tsx**, **SettingsTab.tsx** — Example tabs (storage, ads, system info). Reference or remove as needed
- **src/components/** — Reusable UI: `TabBar`, `Button`, `Card`, `Stack`, `ErrorBoundary`
- **src/theme/** — Design tokens: `default.ts`, `types.ts`, `applyTheme.ts`. CSS variables set on `document.documentElement`
- **src/style.css** — Global styles; uses theme CSS variables (e.g. `--color-primary`, `--spacing-md`)
- **public/** — Static assets. Small essentials here; large assets in **public/cdn-assets/** (deployed to CDN via `rundot deploy`)
- **vite.config.ts** — Vite + `@vitejs/plugin-react` + `rundotGameLibrariesPlugin()` from SDK; `base: './'`; esbuild/build target `es2022`

## Key Patterns

- **3D:** Use React Three Fiber. Put scene content inside `<Canvas>`. Animation in `useFrame()`; refs for mesh/material. Use `@react-three/drei` for controls and helpers (OrbitControls, etc.). Three.js types from `three`.
- **RundotGameAPI:** Import `RundotGameAPI from '@series-inc/rundot-game-sdk/api'`. Use `RundotGameAPI.cdn.fetchAsset('filename.png')` (returns Promise<Blob>) for CDN assets; `RundotGameAPI.appStorage` for persistence; `RundotGameAPI.ads`, `RundotGameAPI.popups`, `RundotGameAPI.triggerHapticAsync`, `RundotGameAPI.system.getSafeArea()` / `getDevice()` / `getEnvironment()`; `RundotGameAPI.error()` for logging. No initialization in code — SDK is wired by Vite plugin.
- **Theme:** Edit `src/theme/default.ts`. `applyTheme(theme)` runs once in main.tsx; CSS uses variables like `var(--color-primary)`.
- **Tabs:** Add or change tabs in `tabConfig.tsx`; each entry has `id`, `label`, `icon`, `render()` returning a React node.

## What to Modify

- **New 3D game logic** — New or modified scene in `src/tabs/SceneTab.tsx` (or a dedicated scene component); keep `<Canvas>` and R3F/drei usage.
- **New tabs** — Add entry to `TAB_CONFIG` in `src/tabs/tabConfig.tsx` and create tab component in `src/tabs/`.
- **New CDN assets** — Add files to `public/cdn-assets/`; load in code with `RundotGameAPI.cdn.fetchAsset('filename.ext')`. Use `public/` for small assets referenced by path.
- **Look and feel** — `src/theme/default.ts` and `src/style.css`.
- **Build/deploy** — `npm run build`; `rundot deploy` for production (includes CDN upload). Optional: `RUNDOT_GAME_DISABLE_EMBEDDED_LIBS=true` for bundled build.
