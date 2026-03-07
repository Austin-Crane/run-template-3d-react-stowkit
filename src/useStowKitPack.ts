import { useRef, useState, useEffect } from 'react';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { StowKitLoader, AssetMemoryCache, type StowKitPack } from '@series-inc/stowkit-three-loader';

export function useStowKitPack(packName: string): StowKitPack | null {
  const [pack, setPack] = useState<StowKitPack | null>(null);
  const packRef = useRef<StowKitPack | null>(null);

  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        if (import.meta.env.DEV) {
          await AssetMemoryCache.clear();
        }

        const blob = await RundotGameAPI.cdn.fetchAsset(`${packName}.stow`);
        if (disposed) return;

        const arrayBuffer = await blob.arrayBuffer();
        if (disposed) return;

        const cacheKey = import.meta.env.DEV
          ? `${packName}.stow::${arrayBuffer.byteLength}::${Date.now()}`
          : `${packName}.stow`;

        const loaded = await StowKitLoader.loadFromMemory(
          arrayBuffer,
          {
            basisPath: '/stowkit/basis/',
            dracoPath: '/stowkit/draco/',
            wasmPath: '/stowkit/stowkit_reader.wasm',
          },
          cacheKey,
        );
        if (disposed) return;

        packRef.current = loaded;
        setPack(loaded);
      } catch (err) {
        RundotGameAPI.error(`[useStowKitPack] Error loading pack "${packName}":`, err);
      }
    })();

    return () => {
      disposed = true;
      packRef.current?.dispose();
      packRef.current = null;
    };
  }, [packName]);

  return pack;
}
