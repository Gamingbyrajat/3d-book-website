import { Canvas } from '@react-three/fiber';
import { Book } from './Book';
import { BookShadow } from './BookShadow';
import * as THREE from 'three';

export function BookCanvas() {
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
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.LinearToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 2]}
        camera={{
          position: [0, 0, 5],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        frameloop="always"
      >
        <ambientLight intensity={3.2} />
        <directionalLight position={[0, 0, 5]} intensity={1.5} />
        <directionalLight position={[3, 2, 4]} intensity={0.5} />
        <directionalLight position={[-3, -1, 3]} intensity={0.2} />

        <Book />
        <BookShadow />
      </Canvas>
    </div>
  );
}
