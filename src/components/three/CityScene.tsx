import { useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sky } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { City } from './City';
import { BloodVehicleMesh } from './BloodVehicleMesh';
import { StationMarker } from './StationMarker';
import { RoutePath } from './RoutePath';
import { useVehicleStore } from '@/store/useVehicleStore';
import { mockStations } from '@/data/mockData';

function CameraController() {
  const { camera } = useThree();
  
  useFrame(() => {
  });

  return null;
}

function SceneContent() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const routes = useVehicleStore((state) => state.routes);
  const activeRoutes = routes.filter((r) => r.status === 'active');

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={0.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 30, 0]} intensity={0.8} color="#4fc3f7" distance={100} />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <City />

      {vehicles.map((vehicle) => (
        <BloodVehicleMesh key={vehicle.id} vehicle={vehicle} />
      ))}

      {mockStations.map((station) => (
        <StationMarker key={station.id} station={station} />
      ))}

      {activeRoutes.map((route) => (
        <RoutePath key={route.id} route={route} />
      ))}

      <fog attach="fog" args={['#0a1628', 50, 150]} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={0.5} />
      </EffectComposer>
    </>
  );
}

export function CityScene() {
  return (
    <Canvas
      camera={{ position: [60, 50, 60], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      shadows
    >
      <color attach="background" args={['#0a1628']} />
      <Suspense fallback={null}>
        <SceneContent />
        <CameraController />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={20}
          maxDistance={150}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
        />
      </Suspense>
    </Canvas>
  );
}
