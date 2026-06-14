import { useMemo } from 'react';
import * as THREE from 'three';
import { Building } from './Building';

const BUILDINGS = [
  { pos: [-40, 0, -30], w: 8, d: 8, h: 25, color: '#1a365d' },
  { pos: [-30, 0, -35], w: 6, d: 6, h: 35, color: '#163150' },
  { pos: [-20, 0, -25], w: 10, d: 8, h: 20, color: '#1e3a5f' },
  { pos: [-25, 0, -15], w: 7, d: 7, h: 30, color: '#183555' },
  { pos: [-35, 0, -10], w: 9, d: 6, h: 22, color: '#1a365d' },
  { pos: [-10, 0, -30], w: 8, d: 10, h: 18, color: '#1e3a5f' },
  { pos: [-15, 0, -40], w: 6, d: 6, h: 28, color: '#163150' },

  { pos: [0, 0, -35], w: 12, d: 10, h: 45, color: '#0f2847' },
  { pos: [15, 0, -30], w: 8, d: 8, h: 32, color: '#163150' },
  { pos: [10, 0, -40], w: 7, d: 9, h: 28, color: '#1a365d' },
  { pos: [25, 0, -35], w: 10, d: 7, h: 38, color: '#132d4b' },
  { pos: [30, 0, -25], w: 6, d: 6, h: 25, color: '#1a365d' },
  { pos: [20, 0, -20], w: 9, d: 8, h: 22, color: '#1e3a5f' },
  { pos: [5, 0, -25], w: 7, d: 7, h: 30, color: '#183555' },

  { pos: [-40, 0, 0], w: 10, d: 12, h: 50, color: '#0f2847' },
  { pos: [-30, 0, 5], w: 8, d: 8, h: 28, color: '#163150' },
  { pos: [-35, 0, 15], w: 7, d: 9, h: 35, color: '#132d4b' },
  { pos: [-25, 0, 10], w: 6, d: 6, h: 22, color: '#1a365d' },
  { pos: [-20, 0, -5], w: 9, d: 7, h: 30, color: '#183555' },

  { pos: [-10, 0, 15], w: 8, d: 10, h: 20, color: '#1e3a5f' },
  { pos: [0, 0, 20], w: 15, d: 12, h: 15, color: '#1a365d' },
  { pos: [10, 0, 10], w: 7, d: 7, h: 25, color: '#163150' },
  { pos: [15, 0, 25], w: 9, d: 8, h: 18, color: '#1e3a5f' },

  { pos: [25, 0, 5], w: 10, d: 10, h: 22, color: '#1a365d' },
  { pos: [35, 0, 10], w: 8, d: 8, h: 35, color: '#132d4b' },
  { pos: [30, 0, 20], w: 7, d: 9, h: 28, color: '#163150' },
  { pos: [40, 0, 25], w: 6, d: 6, h: 20, color: '#1e3a5f' },
  { pos: [35, 0, -5], w: 9, d: 7, h: 32, color: '#183555' },

  { pos: [-35, 0, 30], w: 8, d: 8, h: 24, color: '#1a365d' },
  { pos: [-20, 0, 35], w: 10, d: 7, h: 18, color: '#1e3a5f' },
  { pos: [-5, 0, 38], w: 6, d: 6, h: 22, color: '#163150' },
  { pos: [5, 0, 35], w: 8, d: 10, h: 20, color: '#1a365d' },
  { pos: [20, 0, 38], w: 7, d: 7, h: 26, color: '#183555' },

  { pos: [-45, 0, 25], w: 7, d: 9, h: 30, color: '#132d4b' },
  { pos: [45, 0, -15], w: 8, d: 6, h: 25, color: '#163150' },
];

export function City() {
  const groundGeometry = useMemo(() => new THREE.PlaneGeometry(120, 120), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <primitive object={groundGeometry} attach="geometry" />
        <meshStandardMaterial color="#0a1628" roughness={0.9} metalness={0.1} />
      </mesh>

      <gridHelper args={[120, 60, '#1e3a5f', '#0f2847']} position={[0, 0.01, 0]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#0f2847" transparent opacity={0.5} />
      </mesh>

      {BUILDINGS.map((b, i) => (
        <Building
          key={i}
          position={[b.pos[0], b.h / 2, b.pos[2]]}
          width={b.w}
          depth={b.d}
          height={b.h}
          color={b.color}
        />
      ))}

      {[-30, -10, 10, 30].map((x, i) => (
        <mesh key={`road-h-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, 0]}>
          <planeGeometry args={[2, 100]} />
          <meshStandardMaterial color="#1a2a4a" />
        </mesh>
      ))}

      {[-30, -10, 10, 30].map((z, i) => (
        <mesh key={`road-v-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, z]}>
          <planeGeometry args={[100, 2]} />
          <meshStandardMaterial color="#1a2a4a" />
        </mesh>
      ))}
    </group>
  );
}
