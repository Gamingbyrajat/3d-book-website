import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBookStore } from '../../store';
import { usePageTexture } from '../../hooks/usePageTexture';
import type { Page } from '../../content/pages';

interface FlapProps {
  bookWidth: number;
  bookHeight: number;
  frontPage?: Page;
  backPage?: Page;
  reactSpreadIndex: number;
}

const SEGMENTS_X = 48;
const SEGMENTS_Y = 24;

export function Flap({ bookWidth, bookHeight, frontPage, backPage, reactSpreadIndex }: FlapProps) {
  const pageWidth = bookWidth / 2;
  const meshRef = useRef<THREE.Mesh>(null);

  const frontTexture = usePageTexture(frontPage);
  const backTexture = usePageTexture(backPage);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(pageWidth, bookHeight, SEGMENTS_X, SEGMENTS_Y),
    [pageWidth, bookHeight]
  );

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      side: THREE.DoubleSide,
    });

    const pw = pageWidth;
    const bh = bookHeight;

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFold = { value: 0 };
      shader.uniforms.uFrontMap = { value: null };
      shader.uniforms.uBackMap = { value: null };
      shader.uniforms.uHasFrontMap = { value: 0 };
      shader.uniforms.uHasBackMap = { value: 0 };
      mat.userData.shader = shader;

      shader.vertexShader = 'uniform float uFold;\nvarying vec2 vPageUv;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        float xN = (position.x + ${(pw / 2).toFixed(6)}) / ${pw.toFixed(6)};
        float yN = (position.y + ${(bh / 2).toFixed(6)}) / ${bh.toFixed(6)};

        vPageUv = vec2(xN, yN);

        float cornerDelay = yN * 0.25;
        float localFold = clamp((uFold - cornerDelay) / max(1.0 - cornerDelay, 0.01), 0.0, 1.0);

        float bend = localFold * 3.14159;
        float dist = position.x + ${(pw / 2).toFixed(6)};

        transformed.x = cos(bend) * dist - ${(pw / 2).toFixed(6)};
        transformed.z = sin(bend) * dist;

        float curlStrength = 0.12 + 0.08 * (1.0 - yN);
        float curlAmount = sin(bend) * curlStrength;
        float curlWave = sin(xN * 3.14159);
        transformed.z += curlAmount * curlWave;

        float cornerLift = sin(localFold * 3.14159) * 0.05 * (1.0 - yN) * xN;
        transformed.z += cornerLift;
        `
      );

      shader.fragmentShader =
        'uniform sampler2D uFrontMap;\nuniform sampler2D uBackMap;\nuniform float uHasFrontMap;\nuniform float uHasBackMap;\nvarying vec2 vPageUv;\n' +
        shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        vec2 fuv = vPageUv;
        vec2 buv = vec2(1.0 - vPageUv.x, vPageUv.y);

        if (gl_FrontFacing) {
          if (uHasFrontMap > 0.5) {
            diffuseColor = texture2D(uFrontMap, fuv);
          }
        } else {
          if (uHasBackMap > 0.5) {
            diffuseColor = texture2D(uBackMap, buv);
          }
        }
        `
      );
    };

    return mat;
  }, [pageWidth, bookHeight]);

  useFrame(() => {
    const store = useBookStore.getState();
    const storeSpread = store.spreadIndex;
    const shader = material.userData.shader;
    if (!shader) return;

    // Detect mismatch: store has advanced/retreated past what React has rendered
    // Hold the fold position to prevent 1-frame texture pop
    let foldValue = store.foldProgress;

    if (storeSpread > reactSpreadIndex) {
      // Store moved forward but React hasn't re-rendered with new textures yet
      // Keep flap locked fully turned (on the left) so old textures aren't visible
      foldValue = 1.0;
    } else if (storeSpread < reactSpreadIndex) {
      // Store moved backward but React still has the newer textures
      // Keep flap locked flat (on the right) until React catches up
      foldValue = 0.0;
    }

    shader.uniforms.uFold.value = foldValue;

    if (frontTexture) {
      shader.uniforms.uFrontMap.value = frontTexture;
      shader.uniforms.uHasFrontMap.value = 1;
    } else {
      shader.uniforms.uHasFrontMap.value = 0;
    }
    if (backTexture) {
      shader.uniforms.uBackMap.value = backTexture;
      shader.uniforms.uHasBackMap.value = 1;
    } else {
      shader.uniforms.uHasBackMap.value = 0;
    }
  });

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  const isCover = frontPage?.isCover || backPage?.isCover;
  const zPos = isCover ? 0.003 : 0.001;

  if (frontPage?.isFormPage) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[pageWidth / 2, 0, zPos]}
    />
  );
}
