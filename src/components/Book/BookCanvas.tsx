import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Book } from './Book';
import { BookShadow } from './BookShadow';
import { ShaderWarmup } from './ShaderWarmup';
import { PaperRustleDriver } from './PaperRustleDriver';
import { useBookQuality } from '../../hooks/useBookQuality';

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.42} />
      <hemisphereLight intensity={0.22} groundColor="#c9bfb0" color="#fff8ef" />
      <directionalLight
        castShadow
        position={[4.5, 7, 5.5]}
        intensity={1.05}
        color="#fff5e6"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={18}
        shadow-camera-near={3}
        shadow-camera-left={-3.8}
        shadow-camera-right={3.8}
        shadow-camera-top={3.2}
        shadow-camera-bottom={-3.6}
        shadow-bias={-0.00008}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-3.5, 3, 2.5]} intensity={0.32} color="#d4e4ff" />
      <directionalLight position={[0, -2, 4]} intensity={0.12} color="#f0ebe1" />
    </>
  );
}

export function BookCanvas() {
  const { dprCap, useContactShadows } = useBookQuality();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.88,
        }}
        dpr={[1, dprCap]}
        camera={{
          position: [0, 0.15, 5],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        frameloop="always"
      >
        <SceneLights />
        <Suspense fallback={null}>
          <Environment preset="apartment" environmentIntensity={0.52} />
        </Suspense>
        <Book />
        {useContactShadows ? (
          <Suspense fallback={null}>
            <ContactShadows
              position={[0.1, -2.05, 0.1]}
              opacity={0.38}
              scale={14}
              blur={2.1}
              far={5.5}
              resolution={512}
              frames={1}
              color="#1a1410"
            />
          </Suspense>
        ) : (
          <BookShadow />
        )}
        <ShaderWarmup />
        <PaperRustleDriver />
      </Canvas>
    </div>
  );
}
