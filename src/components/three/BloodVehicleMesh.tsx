import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { BloodVehicle } from '@/types';
import { useVehicleStore } from '@/store/useVehicleStore';

interface BloodVehicleMeshProps {
  vehicle: BloodVehicle;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  idle: '#f1c40f',
  moving: '#2ecc71',
  collecting: '#3498db',
  maintenance: '#e74c3c',
};

export function BloodVehicleMesh({ vehicle, onClick }: BloodVehicleMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef<THREE.Mesh>(null);
  const selectVehicle = useVehicleStore((state) => state.selectVehicle);
  const selectedVehicleId = useVehicleStore((state) => state.selectedVehicleId);
  const isSelected = selectedVehicleId === vehicle.id;

  const statusColor = statusColors[vehicle.status] || '#3498db';

  useFrame((state) => {
    if (pulseRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      pulseRef.current.scale.setScalar(scale);
      const material = pulseRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.5 - Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
    if (groupRef.current && vehicle.status === 'moving') {
      groupRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectVehicle(vehicle.id);
    onClick?.();
  };

  const totalInventory = useMemo(() => {
    return vehicle.inventory.A + vehicle.inventory.B + vehicle.inventory.O + vehicle.inventory.AB;
  }, [vehicle.inventory]);

  return (
    <group
      ref={groupRef}
      position={[vehicle.position.x, 1, vehicle.position.z]}
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
      <mesh ref={pulseRef} position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2, 32]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.5, 1.2, 5]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.3} />
      </mesh>

      <mesh position={[0, 1.1, -0.8]} castShadow>
        <boxGeometry args={[2.4, 0.8, 2.5]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.3} />
      </mesh>

      <mesh position={[0, 1.1, -0.5]}>
        <boxGeometry args={[2.2, 0.6, 1.8]} />
        <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh position={[-1.1, -0.3, 1.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.1, -0.3, 1.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.1, -0.3, -1.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.1, -0.3, -1.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[0, 0.8, 1.5]}>
        <boxGeometry args={[2, 0.05, 0.8]} />
        <meshStandardMaterial color="#e63946" emissive="#e63946" emissiveIntensity={0.5} />
      </mesh>

      <mesh position={[-0.5, 0.8, 1.5]}>
        <boxGeometry args={[0.08, 0.3, 0.15]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.5, 0.8, 1.5]}>
        <boxGeometry args={[0.08, 0.3, 0.15]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {isSelected && (
        <mesh position={[0, 2, 0]} rotation={[0, 0, 0]}>
          <ringGeometry args={[1.5, 1.6, 32]} />
          <meshBasicMaterial color="#3498db" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      <Billboard position={[0, 3.5, 0]}>
        <Html
          center
          distanceFactor={10}
          position={[0, 0, 0]}
          style={{
            pointerEvents: 'none',
          }}
        >
          <div
            className={`px-3 py-2 rounded-lg backdrop-blur-md border text-white text-xs whitespace-nowrap transition-all duration-300 ${
              isSelected
                ? 'bg-blue-500/80 border-blue-400 shadow-lg shadow-blue-500/50'
                : hovered
                ? 'bg-slate-800/90 border-slate-600'
                : 'bg-slate-900/70 border-slate-700/50'
            }`}
          >
            <div className="font-bold text-sm mb-1">{vehicle.number}</div>
            <div className="flex items-center gap-1 mb-1">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: statusColor }}
              />
              <span className="text-slate-300">
                {vehicle.status === 'idle' && '待命'}
                {vehicle.status === 'moving' && '行驶中'}
                {vehicle.status === 'collecting' && '采集中'}
                {vehicle.status === 'maintenance' && '维护中'}
              </span>
            </div>
            <div className="text-slate-400">库存: {totalInventory} 单位</div>
            <div className="text-slate-400">预约: {vehicle.reservationCount} 人</div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
}
