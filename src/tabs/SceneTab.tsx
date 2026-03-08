import { useRef, useEffect } from 'react';
import { GameScene } from '../GameScene';

export const SceneTab: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const game = new GameScene(containerRef.current);
    return () => game.dispose();
  }, []);

  return <div ref={containerRef} className="scene-container" />;
};
