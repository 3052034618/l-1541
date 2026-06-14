import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface BuildingProps {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  color: string;
  windows?: boolean;
}

export function Building({ position, width, depth, height, color, windows = true }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);

  const windowTexture = useMemo(() => {
    if (!windows) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, 64, 128);

    const windowColor = '#ffd700';
    const windowDark = '#1a2a4a';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 4; col++) {
        const isLit = Math.random() > 0.3;
        ctx.fillStyle = isLit ? windowColor : windowDark;
        ctx.globalAlpha = isLit ? 0.8 : 0.3;
        ctx.fillRect(8 + col * 14, 8 + row * 14, 10, 10);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, [windows]);

  useFrame((state) => {
    if (meshRef.current && windows) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material.emissiveMap) {
        material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      }
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.1}
          roughness={0.7}
          metalness={0.3}
          map={windowTexture || undefined}
        />
      </mesh>
      {edgesRef && (
        <lineSegments ref={edgesRef}>
          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="#4fc3f7" transparent opacity={0.6} />
        </lineSegments>
      )}
    </group>
  );
}
