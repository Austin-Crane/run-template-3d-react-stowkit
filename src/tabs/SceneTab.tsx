import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { useStowKitPack } from '../useStowKitPack';

function RotatingDie({ group }: { group: THREE.Group | null }) {
  const containerRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!containerRef.current || !group) return;
    containerRef.current.clear();
    containerRef.current.add(group);
  }, [group]);

  useFrame((_state, delta) => {
    if (!containerRef.current) return;
    containerRef.current.rotation.x += delta * 0.5;
    containerRef.current.rotation.y += delta * 0.7;
  });

  return <group ref={containerRef} />;
}

export const SceneTab: React.FC = () => {
  const pack = useStowKitPack('default');
  const [diceGroup, setDiceGroup] = useState<THREE.Group | null>(null);

  useEffect(() => {
    if (!pack) return;
    let disposed = false;

    pack.loadMesh('sm_dice').then((mesh) => {
      if (!disposed) setDiceGroup(mesh);
    }).catch((err) => {
      // Ignore transient errors during HMR teardown
      if (!disposed) {
        RundotGameAPI.error('[SceneTab] Error loading dice mesh:', err);
      }
    });

    return () => { disposed = true; };
  }, [pack]);

  return (
    <div className="scene-container">
      <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <RotatingDie group={diceGroup} />
        <OrbitControls enablePan={false} />
        <gridHelper args={[10, 10, '#333333', '#222222']} />
      </Canvas>
    </div>
  );
};
