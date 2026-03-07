# Assets Folder

This is the **source** folder for all game assets. Place your raw 3D models, textures, and audio files here, then use StowKit to process and pack them.

## Workflow

### 1. Add Your Files

Place source files directly in this folder:

- **3D Models**: `.fbx`, `.obj`, `.gltf`, `.glb`
- **Textures**: `.png`, `.jpg`, `.jpeg`
- **Audio**: `.wav`, `.mp3`, `.ogg`

### 2. Scan for New Assets

```bash
npx stowkit scan
```

This generates a `.stowmeta` file for each asset with default settings. These files control how the asset is processed.

### 3. Create Material Files (for textured models)

Materials are defined in `.stowmat` JSON files that reference your textures.

**Example: `M_Robot.stowmat`**

```json
{
  "version": 1,
  "schemaName": "",
  "properties": [
    {
      "fieldName": "Diffuse",
      "fieldType": "texture",
      "previewFlag": "mainTex",
      "value": [1, 1, 1, 1],
      "textureAsset": "T_Robot_Diffuse.png"
    },
    {
      "fieldName": "Tint",
      "fieldType": "color",
      "previewFlag": "tint",
      "value": [1, 1, 1, 1],
      "textureAsset": null
    }
  ]
}
```

After creating a `.stowmat` file, run `npx stowkit scan` to register it.

### 4. Assign Materials to Meshes

Edit the mesh's `.stowmeta` file to reference your material:

**Example: `Robot.fbx.stowmeta`**

```json
{
  "version": 1,
  "stringId": "robot",
  "type": "staticMesh",
  "pack": "default",
  "dracoQuality": "balanced",
  "materialOverrides": {
    "0": "M_Robot.stowmat"
  }
}
```

The key `"0"` refers to the first submesh. Use `"1"`, `"2"`, etc. for additional submeshes if your model has multiple materials.

### 5. Build the Pack

```bash
npx stowkit build
```

This processes all assets and creates `public/cdn-assets/default.stow`.

## Important Notes

- **DO** place source files here (FBX, PNG, etc.)
- **DO** edit `.stowmeta` files to change compression settings
- **DO** create `.stowmat` files for materials
- **DO NOT** edit `.stowcache` files (auto-generated cache)
- **ADD to `.gitignore`**: `*.stowcache` (optional - these are build artifacts)

## Metadata Files

Each asset gets a `.stowmeta` file that controls processing:

### Texture Settings

```json
{
  "type": "texture",
  "stringId": "my_texture",
  "pack": "default",
  "quality": "normal",
  "resize": "full",
  "generateMipmaps": false
}
```

- **quality**: `fastest`, `fast`, `normal`, `high`, `best`
- **resize**: `full`, `half`, `quarter`, `eighth`

### Mesh Settings

```json
{
  "type": "staticMesh",
  "stringId": "my_model",
  "pack": "default",
  "dracoQuality": "balanced",
  "materialOverrides": {}
}
```

- **dracoQuality**: `fast`, `balanced`, `high`, `maximum`

## Common Tasks

**Change texture quality:**
1. Edit the texture's `.stowmeta` file
2. Change `"quality": "high"` or `"resize": "half"`
3. Run `npx stowkit build`

**Change model compression:**
1. Edit the mesh's `.stowmeta` file
2. Change `"dracoQuality": "high"`
3. Run `npx stowkit build`

**Assign multiple materials:**
```json
"materialOverrides": {
  "0": "M_Body.stowmat",
  "1": "M_Eyes.stowmat",
  "2": "M_Clothes.stowmat"
}
```

## Rebuild Everything

To force a full rebuild (ignoring cache):

```bash
npx stowkit build --force
```

## Check Project Status

```bash
npx stowkit status
```

This shows how many assets are in the project and which need processing.
