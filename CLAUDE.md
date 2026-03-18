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
- **src/App.tsx** — Shell: mounts fullscreen `GameScene` into a `<div>`. Includes landscape warning overlay
- **src/GameScene.ts** — Game class. Owns Three.js renderer, camera, scene, lights, controls, `requestAnimationFrame` loop, and asset loading. Extend this for game logic
- **src/loadStowKitPack.ts** — Plain async function to load StowKit `.stow` packs. Has a simple cache. No React
- **src/components/** — Reusable UI: `Button`, `Card`, `Stack`, `ErrorBoundary`
- **src/theme/** — Design tokens: `default.ts`, `types.ts`, `applyTheme.ts`. CSS variables set on `document.documentElement`
- **src/style.css** — Global styles; uses theme CSS variables (e.g. `--color-primary`, `--spacing-md`)
- **public/** — Static assets. Small essentials here; large assets in **public/cdn-assets/** (deployed to CDN via `rundot deploy`)
- **vite.config.ts** — Vite + `@vitejs/plugin-react` + `rundotGameLibrariesPlugin()` from SDK; `base: './'`; esbuild/build target `es2022`

## Key Patterns

- **3D/Game:** All game logic goes in plain TypeScript classes. `GameScene` owns the Three.js `WebGLRenderer`, camera, scene, and `requestAnimationFrame` loop. Load assets with `loadStowKitPack()`. Use `three` directly — `OrbitControls` from `three/addons/controls/OrbitControls.js`, etc. React never touches the scene graph.
- **StowKit loading:** Always use `loadStowKitPack(packName)` from `src/loadStowKitPack.ts` — it handles CDN fetch, WASM config, and caching. Never load `.stow` files directly with `StowKitLoader.load()` in this template (CDN requires `RundotGameAPI.cdn.fetchAsset`).
- **React ↔ Game boundary:** React renders a `<div>`, passes it to the game class on mount, and calls `dispose()` on unmount. That's it. If the game needs to communicate state to the UI (e.g. score, health), expose it via callbacks or an event emitter — not React state driving the game.
- **RundotGameAPI:** Import `RundotGameAPI from '@series-inc/rundot-game-sdk/api'`. Use `RundotGameAPI.cdn.fetchAsset('filename.png')` (returns Promise<Blob>) for CDN assets; `RundotGameAPI.appStorage` for persistence; `RundotGameAPI.ads`, `RundotGameAPI.popups`, `RundotGameAPI.triggerHapticAsync`, `RundotGameAPI.system.getSafeArea()` / `getDevice()` / `getEnvironment()`; `RundotGameAPI.error()` for logging. No initialization in code — SDK is wired by Vite plugin.
- **Theme:** Edit `src/theme/default.ts`. `applyTheme(theme)` runs once in main.tsx; CSS uses variables like `var(--color-primary)`.

## What to Modify

- **New 3D game logic** — Extend `GameScene` in `src/GameScene.ts` or create new game classes. Load assets with `loadStowKitPack()`. All game logic stays in plain TypeScript — no React hooks or state.
- **New CDN assets** — Add files to `public/cdn-assets/`; load in code with `RundotGameAPI.cdn.fetchAsset('filename.ext')`. Use `public/` for small assets referenced by path.
- **Look and feel** — `src/theme/default.ts` and `src/style.css`.
- **Build/deploy** — `npm run build`; `rundot deploy` for production (includes CDN upload). Optional: `RUNDOT_GAME_DISABLE_EMBEDDED_LIBS=true` for bundled build.

## StowKit Asset Pipeline

**Adding assets is always a two-step process:**
1. Place source file (FBX, GLB, PNG, WAV) in `assets/`, run `stowkit build`
2. Load from `.stow` pack in game code: `pack.loadMesh('stringId')`, `pack.loadTexture('stringId')`, etc.

- **NEVER** load raw source files directly (`THREE.FBXLoader`, `THREE.TextureLoader`, `THREE.GLTFLoader`, `fetch('assets/...')`)
- **NEVER** manually create `.stowmeta` files — they are auto-generated by `stowkit build`
- **NEVER** use `stowkit store` commands to find local project files — the store is a remote shared registry
- To find local assets: glob `assets/`, read `.stowmeta` files, or run `stowkit status`
- To add an asset: place file in `assets/` → `stowkit build` → use `loadStowKitPack('default')` then `pack.loadMesh()`/`pack.loadTexture()`/etc.
- **Sounds/Audio:** When the user asks for sounds, **first** use the MCP asset store search to find existing sounds — there are many available. Only create/synthesize sounds as a last resort if nothing suitable exists in the store.

## UI Design Guidelines

This runs on phones. Design for **portrait, touch, one-thumb reach**.

### Layout & Layering
- The `.app-container` caps at 720×1280 (9:16) — design UI within this, not the full viewport
- The canvas (Three.js) composites as its own GPU layer. HTML overlays sit on top naturally — no `z-index` needed if they're siblings of `.scene-container`
- Game HUD overlays: use `position: absolute` within the game container (not `position: fixed` — there's no scrolling, and fixed creates unnecessary compositor layers). Set `pointer-events: none` on the overlay container, `pointer-events: auto` on interactive children only
- Use `RundotGameAPI.system.getSafeArea()` to inset UI away from notches/home indicators — apply returned padding to fixed overlays, not just the app shell
- For fullscreen game scenes (no tabs), hide the `TabBar` and let `.scene-container` fill the app container; overlay HUD elements as absolutely-positioned HTML siblings of the canvas div

### Preventing Jitter Between HTML Overlays and Canvas
- **Only animate `transform` and `opacity`** on overlay elements — these are the only two CSS properties handled by the compositor thread. Animating `top`, `left`, `width`, `height`, `margin`, `padding`, `box-shadow` etc. forces layout on the main thread and competes with your `requestAnimationFrame` game loop, causing mutual stutter
- Use `transform: translate(x, y)` instead of `top`/`left` for positioning animations
- `will-change: transform` promotes an element to its own compositor layer — but it's a **last resort for existing perf problems**, not preventative. Overuse wastes GPU memory. Toggle it via JS before/after animation, don't leave it in stylesheets permanently
- `will-change` creates a new stacking context eagerly — can break z-ordering unexpectedly
- Apply `contain: content` (shorthand for `layout paint style`) on overlay panels — tells the browser that DOM changes inside won't affect anything outside, so it can skip recalculating the rest of the page
- **Don't** re-render React on every game frame — if the game updates a score at 60fps, throttle the React update to every 100–200ms or use a ref + direct DOM mutation for the counter

### Canvas Sizing & DPI
- **Don't use `renderer.setPixelRatio()`** — Three.js docs recommend against it. It silently multiplies sizes behind the scenes and breaks post-processing, GPU picking, `gl_FragCoord`, and screenshot capture
- Instead, handle DPI manually: `const dpr = Math.min(window.devicePixelRatio, 2);` then `renderer.setSize(width * dpr, height * dpr, false)` (false = don't touch CSS). Cap at 2 because DPR 3 (modern iPhones) means 9x pixels — destroys mobile fill rate for minimal visual gain
- Use `ResizeObserver` on the container element, not `window.addEventListener('resize')` — it's element-level (catches tab switches, flexbox reflows), fires between layout and paint, and provides dimensions via `contentRect` without forcing `getBoundingClientRect()` layout thrashing
- **Don't** put `<canvas>` inside a scrollable container — causes janky resize. The canvas belongs in a fixed-size container

### Touch & Interaction
- Minimum touch target: **44×44px** — anything smaller is unusable on phone. Pad icons with transparent hit areas if needed
- Buttons need `:active` state feedback, not just `:hover` (hover doesn't exist on mobile) — use `transform: scale(0.95)` or opacity change on `:active`
- Set `touch-action: none` on the canvas container — prevents the browser from intercepting touches for pan, zoom, or double-tap-to-zoom. The browser resolves `touch-action` by intersecting values up the DOM tree, so setting it on the container covers all children
- If your game calls `preventDefault()` on touch events, you **must** use `{ passive: false }` — browsers default `touchstart`/`touchmove` to passive on window/document/body, and passive listeners silently ignore `preventDefault()`. Prefer `touch-action: none` in CSS over `preventDefault()` — it's more efficient (informs the browser before any event fires)
- For game controls overlaid on the canvas: use transparent `<div>` touch zones positioned over the canvas, **not** Three.js raycasting for UI buttons
- Use `RundotGameAPI.triggerHapticAsync()` on meaningful interactions (purchases, confirmations) — not on every tap

### Using the Theme System
- **Always use CSS variables** (`var(--color-primary)`, `var(--spacing-md)`) — never hardcode colors or sizes in component styles
- For semi-transparent surfaces over the game canvas: `background: rgba(0,0,0,0.6)` + `backdrop-filter: blur(8px)` — looks intentional, not like a broken overlay
- Use `--color-surface` with alpha for cards on game scenes: `background: color-mix(in srgb, var(--color-surface) 80%, transparent)`
- Gradients: use `--color-primary` → `--color-secondary` to stay on-brand (already set up in `.btn-primary`)
- Text on game overlays: use `text-shadow: 0 1px 3px rgba(0,0,0,0.8)` for readability against dynamic 3D backgrounds

### Game HUD Patterns
- Score/health/timer: absolutely-positioned HTML elements over the canvas — fast to update, accessible, styled with CSS. **Never** render HUD as 3D text or sprites
- Use the `Card` component for popup modals (game over, settings, shop) — it already has the right border, radius, and backdrop
- Animate HUD changes with CSS transitions on `transform`/`opacity` only (`--animation-fast` for score ticks, `--animation-normal` for panel slides) — don't use JS `requestAnimationFrame` for UI animation, that's for the game loop
- Communicate game state → React UI via an event emitter or callback on the game class (e.g. `onScoreChange`, `onGameOver`) — React subscribes in `useEffect`, updates local state. Game class never imports React

### Mobile Renderer Settings
- **`antialias`**: Native MSAA (`antialias: true`) is the cheapest AA when NOT using post-processing — but 4x MSAA quadruples the color buffer memory. On low-end mobile, skip AA and render at 1.25–1.5x DPR instead (CSS downscale provides implicit AA)
- **`preserveDrawingBuffer: false`** (default): Lets tiled-rendering mobile GPUs (Adreno, Mali, Apple) discard the framebuffer after compositing instead of writing it back to memory. Only set `true` if you need `canvas.toDataURL()` for screenshots
- **`alpha: true`**: MDN warns that `alpha: false` can be *more* expensive on some platforms (RGB backbuffer emulated on RGBA). Use `alpha: true` with shaders outputting `alpha: 1.0` if you want an opaque canvas. Set `premultipliedAlpha: false` if your blending assumes straight alpha
- **`powerPreference: 'high-performance'`**: Worth setting as a hint, but on mobile (single GPU) it has no effect. On laptops Chrome picks GPU based on AC/battery regardless
- **`failIfMajorPerformanceCaveat: true`**: Causes context creation to fail if the browser would use software rendering — better to show a fallback message than run at 2fps
- **NEVER** use `logarithmicDepthBuffer` — it uses `gl_FragDepth` which disables Early-Z testing on the GPU, devastating for mobile performance
- Keep draw calls under ~100–200 for 60fps on mid-range mobile — use `InstancedMesh` or merged geometries to reduce. Check `renderer.info.render.calls` to monitor

## Three.js Gotchas

- `DirectionalLight` targets: always `scene.add(dirLight.target)` — Three.js needs the target in the scene graph for shadow camera orientation
- `castShadow`/`receiveShadow` don't propagate to children — after loading a StowKit mesh, traverse to enable: `mesh.traverse(c => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } })`
- StowKit `pack.loadMesh()` returns a `THREE.Group` with nested children — always traverse when setting per-mesh properties
- Always call `renderer.shadowMap.enabled = true` and set `dirLight.castShadow = true` for shadows to work
- Near clipping plane (`camera.near`) too small causes z-fighting artifacts — if the camera zooms out far, increase `near` (e.g. `0.5` or `1` instead of `0.1`). Keep the near/far ratio reasonable (< 10000:1).

## Skinned Mesh + Animation

`clone(true)` on a `SkinnedMesh` does **NOT** rebind the skeleton — every clone still points at the original bones, so they all T-pose or move in unison. And calling `loadSkinnedMesh()` per instance is way too expensive (re-decodes geometry + textures from scratch). The correct pattern is **load once, clone with rebind**.

### Step 1 — Load template once (expensive, do it once at startup)
```ts
this.enemyTemplate = await pack.loadSkinnedMesh('character/my_character');
this.enemyWalkClip = await pack.loadAnimationClip('animations/anim_walk');
// Don't add the template to the scene — it's just a source to clone from
```

### Step 2 — Clone helper (rebinds skeleton to cloned bones)
```ts
function cloneSkinnedMesh(source: THREE.Group): THREE.Group {
  const clone = source.clone(true);

  const sourceBones: THREE.Bone[] = [];
  const cloneBones: THREE.Bone[] = [];
  source.traverse((n) => { if ((n as THREE.Bone).isBone) sourceBones.push(n as THREE.Bone); });
  clone.traverse((n) =>  { if ((n as THREE.Bone).isBone) cloneBones.push(n as THREE.Bone); });

  clone.traverse((n) => {
    const sm = n as THREE.SkinnedMesh;
    if (!sm.isSkinnedMesh) return;
    const newBones = sm.skeleton.bones.map(
      (b) => cloneBones[sourceBones.indexOf(b)] ?? b
    );
    sm.skeleton = new THREE.Skeleton(newBones, sm.skeleton.boneInverses);
    sm.bind(sm.skeleton, sm.bindMatrix);
  });

  return clone;
}
```

### Step 3 — Per spawn (cheap — just a CPU-side array remap)
```ts
const charGroup = cloneSkinnedMesh(this.enemyTemplate);
scene.add(charGroup);
const mixer = new THREE.AnimationMixer(charGroup);
mixer.clipAction(this.enemyWalkClip).play();
```

### Step 4 — Every frame
```ts
mixer.update(delta);
```

### Step 5 — On death/removal
```ts
mixer.stopAllAction();
scene.remove(charGroup);
```

### Quick Reference
| Method | When to use |
|--------|-------------|
| `loadSkinnedMesh(id)` | Once, to get the template mesh |
| `loadAnimationClip(id)` | Once, to get reusable clip data |
| `loadAnimation(group, id)` | Convenience — loads + plays in one call. Only use for one-off instances |
| `cloneSkinnedMesh()` + `new AnimationMixer` | Every subsequent instance — clone template, rebind skeleton, drive independently |

- **NEVER** call `loadSkinnedMesh()` per enemy/instance — it re-decodes the full mesh from the asset pack every time
- **NEVER** rely on `clone(true)` alone for skinned meshes — you will get T-posing clones that all share one skeleton

[Run.3DEngine Docs Index]|root:.rundot/3d-engine-docs|core:{Component.md,GameObject.md,VenusGame.md}|patterns:{ComponentCommunication.md,CreatingGameObjects.md,MeshColliders.md,MeshLoading.md}|physics:{Colliders.md,PhysicsSystem.md,RigidBodyComponent.md}|rendering:{AssetManager.md,InstancedRenderer.md,MeshRenderer.md,SkeletalRenderer.md}|systems:{AnimationSystem.md,AudioSystem.md,InputManager.md,LightingSystem.md,NavigationSystem.md,ParticleSystem.md,PrefabSystem.md,SplineSystem.md,StowKitSystem.md,TweenSystem.md,UISystem.md}