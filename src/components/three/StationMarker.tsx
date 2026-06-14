import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { BloodStation } from '@/types';

interface StationMarkerProps {
  station: BloodStation;
  onClick?: () => void;
}

const stationColors: Record<string, { primary: string; secondary: string; icon: string }> = {
  station: { primary: '#e63946', secondary: '#ff6b6b', icon: '血站' },
  donation_point: { primary: '#2ecc71', secondary: '#58d68d', icon: '献血点' },
  emergency_center: { primary: '#f1c40f', secondary: '#f4d03f', icon: '急救中心' },
  mall: { primary: '#9b59b6', secondary: '#bb8fce', icon: '商圈' },
};

export function StationMarker({ station, onClick }: StationMarkerProps) {
  const markerRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const colors = stationColors[station.type] || stationColors.donation_point;

  useFrame((state) => {
    if (pulseRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      pulseRef.current.scale.setScalar(scale);
      const material = pulseRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 - Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
    if (markerRef.current) {
      markerRef.current.position.y = 2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <group
      position={[station.position.x, 0, station.position.z]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      <mesh ref={pulseRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color={colors.primary} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      <group ref={markerRef}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0, 0.6, 1.5, 4]} />
          <meshStandardMaterial color={colors.primary} emissive={colors.primary} emissiveIntensity={0.3} />
        </mesh>

        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color={colors.secondary} emissive={colors.secondary} emissiveIntensity={0.5} />
        </mesh>

        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshBasicMaterial color={colors.primary} transparent opacity={0.3} />
        </mesh>
      </group>

      <Billboard position={[0, 3.5, 0]}>
        <Html center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div
            className={`px-3 py-1.5 rounded-lg backdrop-blur-md border text-white text-xs whitespace-nowrap transition-all duration-300 ${
              hovered ? 'scale-110' : ''
            }`}
            style={{
              backgroundColor: `${colors.primary}99`,
              borderColor: colors.secondary,
            }}
          >
            <div className="font-bold">{station.name}</div>
            <div className="text-xs opacity-80">{colors.icon}</div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
}
