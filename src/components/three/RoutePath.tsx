import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { DispatchRoute } from '@/types';

interface RoutePathProps {
  route: DispatchRoute;
}

export function RoutePath({ route }: RoutePathProps) {
  const lineRef = useRef<any>(null);
  const ringRef = useRef<any>(null);

  const points = useMemo(() => {
    return route.path.map(
      (p) => [p.x, 0.1, p.z] as [number, number, number]
    );
  }, [route.path]);

  useFrame((state) => {
    if (ringRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      ringRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color="#2ecc71"
        lineWidth={3}
        transparent
        opacity={0.8}
      />

      {points.map((point, i) => (
        <mesh key={i} position={[point[0], 0.15, point[2]]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#2ecc71" />
        </mesh>
      ))}

      <StartEndMarker position={points[0]} color="#2ecc71" />
      <StartEndMarker position={points[points.length - 1]} color="#e63946" />
    </group>
  );
}

function StartEndMarker({ position, color }: { position: [number, number, number]; color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      ringRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={[position[0], position[1] + 0.5, position[2]]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.6, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
