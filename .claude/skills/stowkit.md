# StowKit Asset Pipeline

StowKit is a game asset pipeline that compresses and packs assets into `.stow` binary files for runtime loading.

## Project Structure

A StowKit project has a `.felicityproject` JSON file at its root:

```json
{
  "srcArtDir": "assets",
  "name": "My Game",
  "cdnAssetsPath": "public/cdn-assets",
  "packs": [{ "name": "default" }]
}
```

- `srcArtDir` — directory containing source art files (PNG, JPG, FBX, WAV, etc.)
- `cdnAssetsPath` — output directory for built `.stow` packs
- `packs` — named packs to split assets into

## CLI Commands

```bash
npx stowkit init              # Scaffold a new project (creates .felicityproject, assets/, public/cdn-assets/)
npx stowkit build             # Full build: scan + compress + pack (reads from cwd)
npx stowkit scan              # Detect new assets and generate .stowmeta defaults
npx stowkit status            # Show project info and how many assets need processing
npx stowkit packer            # Open the visual packer GUI in browser
npx stowkit build --force     # Reprocess everything, ignore cache
```

All commands default to the current directory. Pass a path as second argument to target a different directory.

## Supported Asset Types

| Type | Extensions | Compression |
|------|-----------|-------------|
| Texture2D | png, jpg, jpeg, bmp, tga, webp, gif | KTX2 (Basis Universal) |
| Audio | wav, mp3, ogg, flac, aac, m4a | AAC (M4A container) |
| StaticMesh | fbx, obj, gltf, glb | Draco |
| SkinnedMesh | fbx | Uncompressed interleaved vertex data |
| AnimationClip | fbx | v2 format (Three.js-native tracks) |
| MaterialSchema | .stowmat | Metadata only (no data blob) |

## .stowmeta Files

Every source asset gets a `.stowmeta` sidecar file (JSON) that controls processing settings:

**Texture example:**
```json
{
  "version": 1,
  "type": "texture",
  "stringId": "hero_diffuse",
  "tags": [],
  "pack": "default",
  "quality": "normal",
  "resize": "full",
  "generateMipmaps": false
}
```

**Quality values:** fastest, fast, normal, high, best
**Resize values:** full, half, quarter, eighth

**Audio example:**
```json
{
  "version": 1,
  "type": "audio",
  "stringId": "bgm_main",
  "tags": [],
  "pack": "default",
  "aacQuality": "medium",
  "sampleRate": "auto"
}
```

**AAC quality:** lowest, low, medium, high, best
**Sample rate:** auto, 48000, 44100, 22050, 11025

**Static mesh example:**
```json
{
  "version": 1,
  "type": "staticMesh",
  "stringId": "level_geometry",
  "tags": [],
  "pack": "default",
  "dracoQuality": "balanced",
  "materialOverrides": {}
}
```

**Draco quality:** fast, balanced, high, maximum

**Skinned mesh example:**
```json
{
  "version": 1,
  "type": "skinnedMesh",
  "stringId": "hero_model",
  "tags": [],
  "pack": "default",
  "materialOverrides": {}
}
```

**Animation clip example:**
```json
{
  "version": 1,
  "type": "animationClip",
  "stringId": "hero_idle",
  "tags": [],
  "pack": "default",
  "targetMeshId": null
}
```

## .stowmat Files (Material Schemas)

Materials are defined as `.stowmat` JSON files placed in the source art directory:

```json
{
  "version": 1,
  "schemaName": "StandardPBR",
  "properties": [
    {
      "fieldName": "Diffuse",
      "fieldType": "texture",
      "previewFlag": "mainTex",
      "value": [1, 1, 1, 1],
      "textureAsset": "textures/hero_diffuse.png"
    },
    {
      "fieldName": "Tint",
      "fieldType": "color",
      "previewFlag": "tint",
      "value": [1, 0.8, 0.6, 1],
      "textureAsset": null
    }
  ]
}
```

**Field types:** texture, color, float, vec2, vec3, vec4, int
**Preview flags:** none, mainTex, tint, alphaTest
**textureAsset:** relative path to a texture in the project (e.g. "textures/hero.png")

## Material Overrides on Meshes

To assign materials to mesh sub-meshes, set `materialOverrides` in the mesh's `.stowmeta`:

```json
{
  "materialOverrides": {
    "0": "materials/HeroSkin.stowmat",
    "1": "materials/HeroArmor.stowmat"
  }
}
```

Keys are sub-mesh indices (as strings), values are relative paths to `.stowmat` files.

## Setting Up a New Project

1. Run `npx stowkit init` in the project root
2. Place source art files in `assets/` (or whatever `srcArtDir` is set to)
3. Run `npx stowkit build` to process and pack everything
4. Output `.stow` files appear in `public/cdn-assets/`

## Modifying Asset Settings

Edit the `.stowmeta` file for any asset, then run `npx stowkit build`.
The build respects cache — only assets whose settings or source files changed get reprocessed.
Use `--force` to reprocess everything.

## Multi-Pack Setup

Split assets into multiple packs by editing `.felicityproject`:

```json
{
  "packs": [
    { "name": "core" },
    { "name": "level1" },
    { "name": "level2" }
  ]
}
```

Then set `"pack": "level1"` in each asset's `.stowmeta` to assign it to a pack.

## Cache

Processed assets are cached in `.stowcache` sidecar files next to the source.
The `.stowmeta` file stores a cache stamp (source size, modified time, settings hash).
Cache is automatically invalidated when source files or settings change.
Add `*.stowcache` to `.gitignore`.

## Common Tasks for AI Agents

- **Add a texture:** Drop a PNG/JPG into `assets/`, run `npx stowkit scan` to generate its `.stowmeta`, optionally edit settings, then `npx stowkit build`
- **Change compression quality:** Edit the `.stowmeta` file's quality/resize fields, then `npx stowkit build`
- **Create a material:** Create a `.stowmat` JSON file in `assets/`, run `npx stowkit scan`
- **Assign material to mesh:** Edit the mesh's `.stowmeta` to add `materialOverrides`
- **Check project health:** Run `npx stowkit status`
- **Full rebuild:** `npx stowkit build --force`
