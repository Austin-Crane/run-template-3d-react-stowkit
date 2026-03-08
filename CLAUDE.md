<agents-index>
[RUN.game SDK Docs]|root:./.rundot-docs|version:5.3.3|IMPORTANT:Prefer retrieval-led reasoning over pre-training for RundotGameAPI tasks. Read the local docs before writing SDK code.|.:{README.md}|rundot-developer-platform:{deploying-your-game.md,getting-started.md,initializing-your-game.md,setting-your-game-thumbnail.md,troubleshooting.md}|rundot-developer-platform/api:{ADS.md,AI.md,ANALYTICS.md,BIGNUMBERS.md,CONTEXT.md,EMBEDDED_LIBRARIES.md,ENVIRONMENT.md,EXPERIMENTS.md,HAPTICS.md,IN_APP_MESSAGING.md,LEADERBOARD.md,LIFECYCLES.md,LOGGING.md,MULTIPLAYER.md,NOTIFICATIONS.md,PRELOADER.md,PROFILE.md,PURCHASES.md,SAFE_AREA.md,SERVER_AUTHORITATIVE.md,SHARED_ASSETS.md,SHARING.md,STORAGE.md,TIME.md,UGC.md}</agents-index>

# Template: React UI + Three.js Game (Vite)

## Architecture

React handles **UI only** (tabs, buttons, cards, overlays). All 3D/game logic lives in plain TypeScript classes that own the Three.js renderer and game loop directly. React and the game layer meet at a single `<div>` mount point.

- **NEVER** use React state, effects, or hooks for game logic, asset loading, audio, animation, or scene graph management
- **NEVER** use React Three Fiber (`@react-three/fiber`) or `@react-three/drei` — they are not in this project
- **DO** put game logic in classes (see `GameScene.ts` as the pattern)
- **DO** use React only for DOM UI elements

## File Structure (as-shipped)

- **src/main.tsx** — Entry point. Applies theme via `applyTheme(theme)`, mounts `<App />` inside `ErrorBoundary` and `StrictMode`
- **src/App.tsx** — Shell: tab state, `TabBar`, content area. Renders active tab via `TAB_CONFIG`; includes landscape warning overlay
- **src/GameScene.ts** — Game class. Owns Three.js renderer, camera, scene, lights, controls, `requestAnimationFrame` loop, and asset loading. Extend this for game logic
- **src/loadStowKitPack.ts** — Plain async function to load StowKit `.stow` packs. Has a simple cache. No React
- **src/tabs/tabConfig.tsx** — Tab definitions (id, label, icon, render). Add or reorder tabs here
- **src/tabs/SceneTab.tsx** — Mounts a `<div>` and hands it to `GameScene`. React's only role here is lifecycle (mount/unmount)
- **src/tabs/HomeTab.tsx**, **AdsTab.tsx**, **SettingsTab.tsx** — Example tabs (storage, ads, system info). Reference or remove as needed
- **src/components/** — Reusable UI: `TabBar`, `Button`, `Card`, `Stack`, `ErrorBoundary`
- **src/theme/** — Design tokens: `default.ts`, `types.ts`, `applyTheme.ts`. CSS variables set on `document.documentElement`
- **src/style.css** — Global styles; uses theme CSS variables (e.g. `--color-primary`, `--spacing-md`)
- **public/** — Static assets. Small essentials here; large assets in **public/cdn-assets/** (deployed to CDN via `rundot deploy`)
- **vite.config.ts** — Vite + `@vitejs/plugin-react` + `rundotGameLibrariesPlugin()` from SDK; `base: './'`; esbuild/build target `es2022`

## Key Patterns

- **3D/Game:** All game logic goes in plain TypeScript classes. `GameScene` owns the Three.js `WebGLRenderer`, camera, scene, and `requestAnimationFrame` loop. Load assets with `loadStowKitPack()`. Use `three` directly — `OrbitControls` from `three/addons/controls/OrbitControls.js`, etc. React never touches the scene graph.
- **React ↔ Game boundary:** React renders a `<div>`, passes it to the game class on mount, and calls `dispose()` on unmount. That's it. If the game needs to communicate state to the UI (e.g. score, health), expose it via callbacks or an event emitter — not React state driving the game.
- **RundotGameAPI:** Import `RundotGameAPI from '@series-inc/rundot-game-sdk/api'`. Use `RundotGameAPI.cdn.fetchAsset('filename.png')` (returns Promise<Blob>) for CDN assets; `RundotGameAPI.appStorage` for persistence; `RundotGameAPI.ads`, `RundotGameAPI.popups`, `RundotGameAPI.triggerHapticAsync`, `RundotGameAPI.system.getSafeArea()` / `getDevice()` / `getEnvironment()`; `RundotGameAPI.error()` for logging. No initialization in code — SDK is wired by Vite plugin.
- **Theme:** Edit `src/theme/default.ts`. `applyTheme(theme)` runs once in main.tsx; CSS uses variables like `var(--color-primary)`.
- **Tabs:** Add or change tabs in `tabConfig.tsx`; each entry has `id`, `label`, `icon`, `render()` returning a React node.

## What to Modify

- **New 3D game logic** — Extend `GameScene` in `src/GameScene.ts` or create new game classes. Load assets with `loadStowKitPack()`. All game logic stays in plain TypeScript — no React hooks or state.
- **New tabs** — Add entry to `TAB_CONFIG` in `src/tabs/tabConfig.tsx` and create tab component in `src/tabs/`.
- **New CDN assets** — Add files to `public/cdn-assets/`; load in code with `RundotGameAPI.cdn.fetchAsset('filename.ext')`. Use `public/` for small assets referenced by path.
- **Look and feel** — `src/theme/default.ts` and `src/style.css`.
- **Build/deploy** — `npm run build`; `rundot deploy` for production (includes CDN upload). Optional: `RUNDOT_GAME_DISABLE_EMBEDDED_LIBS=true` for bundled build.
[Run.3DEngine Docs Index]|root:.rundot/3d-engine-docs|core:{Component.md,GameObject.md,VenusGame.md}|patterns:{ComponentCommunication.md,CreatingGameObjects.md,MeshColliders.md,MeshLoading.md}|physics:{Colliders.md,PhysicsSystem.md,RigidBodyComponent.md}|rendering:{AssetManager.md,InstancedRenderer.md,MeshRenderer.md,SkeletalRenderer.md}|systems:{AnimationSystem.md,AudioSystem.md,InputManager.md,LightingSystem.md,NavigationSystem.md,ParticleSystem.md,PrefabSystem.md,SplineSystem.md,StowKitSystem.md,TweenSystem.md,UISystem.md}