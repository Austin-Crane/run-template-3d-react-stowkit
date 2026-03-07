# CDN Assets

This folder contains assets that will be deployed to the CDN for optimized loading.

## Two Types of Assets

### 1. StowKit Packs (`.stow` files)

**Built** asset packs containing compressed 3D models, textures for 3D models, animations, and audio.

**Workflow:**
1. Source assets go in the `assets/` folder (FBX, PNG, etc.)
2. Run `npx stowkit build` to process and pack them
3. Output `.stow` files appear here automatically
4. Deploy with `rundot deploy` to upload to the CDN

**Example:** `default.stow` — DO NOT manually edit this file

### 2. UI Assets (images, icons, etc.)

**Manual** assets like UI textures, icons, and images that don't need StowKit compression.

**Workflow:**
1. Add PNG/JPG files directly to this folder
2. Reference them in code using `RundotGameAPI.cdn.fetchAsset()`
3. Deploy with `rundot deploy` to upload to the CDN

**Examples:** `icon-play.png`, `button-background.jpg`, `ui-badge.png`

## Loading Assets in Code

### Loading from StowKit Packs

```typescript
import { useStowKitPack } from '../useStowKitPack';

const pack = useStowKitPack('default');

// Load a 3D model
pack.loadMesh('my_model').then((mesh) => {
  scene.add(mesh);
});

// Load a 3D texture (for models)
pack.loadTexture('my_texture').then((texture) => {
  material.map = texture;
});

// Load audio
pack.loadAudio('sound_effect', audioListener).then((audio) => {
  audio.play();
});
```

### Loading UI Assets (icons, images)

```typescript
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

// Fetch a UI image
const iconBlob = await RundotGameAPI.cdn.fetchAsset('icon-play.png');
const iconUrl = URL.createObjectURL(iconBlob);

// Use in React
<img src={iconUrl} alt="Play" />

// Or in Three.js
const loader = new THREE.TextureLoader();
const texture = loader.load(iconUrl);
```

## When to Use Each Approach

**Use StowKit (assets/ folder):**
- 3D models (FBX, OBJ, GLTF)
- Textures for 3D models
- Game audio and sound effects
- Assets that benefit from compression

**Use Direct CDN (this folder):**
- UI icons and buttons
- 2D game sprites (if not using 3D)
- Images that need to be directly accessible
- Small PNG/JPG files for interface elements

## Important Notes

- **StowKit packs** - DO NOT manually edit `.stow` files, they're auto-generated
- **UI assets** - DO manually add PNG/JPG files for UI elements
- **DO** commit both `.stow` files and UI assets to version control
- All files here are automatically uploaded to the CDN when you deploy
