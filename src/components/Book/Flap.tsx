import { useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBookStore } from '../../store';
import { usePageTexture } from '../../hooks/usePageTexture';
import type { Page } from '../../content/pages';
import { useBookQuality } from '../../hooks/useBookQuality';

interface FlapProps {
  bookWidth: number;
  bookHeight: number;
  frontPage?: Page;
  backPage?: Page;
  reactSpreadIndex: number;
}

function bendVertexBlock(pw: number, bh: number): string {
  return `
        float xN = (position.x + ${(pw / 2).toFixed(6)}) / ${pw.toFixed(6)};
        float yN = (position.y + ${(bh / 2).toFixed(6)}) / ${bh.toFixed(6)};

        float cornerDelay = yN * 0.22;
        float localFold = clamp((uFold - cornerDelay) / max(1.0 - cornerDelay, 0.01), 0.0, 1.0);

        float bend = localFold * 3.14159265;
        float dist = position.x + ${(pw / 2).toFixed(6)};

        float bendScale = mix(1.0, 0.9, localFold);
        transformed.x = (cos(bend) * dist - ${(pw / 2).toFixed(6)}) * bendScale;
        transformed.z = sin(bend) * dist * bendScale;

        float curlEnvelope = sin(localFold * 3.14159265);
        float curlStrength = (0.088 + 0.058 * (1.0 - yN)) * (0.62 + 0.38 * curlEnvelope);
        float curlWave = sin(xN * 3.14159265);
        transformed.z += sin(bend) * curlStrength * curlWave;

        float cornerLift = curlEnvelope * 0.038 * (1.0 - yN) * xN;
        transformed.z += cornerLift;

        float warpAmp = 0.0035 * curlEnvelope;
        float warpPhase = bend * 1.12 + xN * 21.0 + yN * 14.0;
        transformed.z += warpAmp * sin(warpPhase);
        transformed.y += warpAmp * 0.5 * sin(xN * 18.5 + yN * 10.5 + bend);
`;
}

function createFoldMaterial(pw: number, bh: number, backFace: boolean): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.91,
    metalness: 0.02,
    envMapIntensity: 0.95,
    side: backFace ? THREE.BackSide : THREE.FrontSide,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFold = { value: 0 };
    mat.userData.foldShader = shader;

    shader.vertexShader = 'uniform float uFold;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        #include <begin_vertex>
        ${bendVertexBlock(pw, bh)}
        `,
    );
  };

  return mat;
}

export function Flap({ bookWidth, bookHeight, frontPage, backPage, reactSpreadIndex }: FlapProps) {
  const pageWidth = bookWidth / 2;
  const { segmentsX, segmentsY } = useBookQuality();

  const frontTexture = usePageTexture(frontPage);
  const backTexture = usePageTexture(backPage);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(pageWidth, bookHeight, segmentsX, segmentsY),
    [pageWidth, bookHeight, segmentsX, segmentsY],
  );

  const backMapAdjusted = useMemo(() => {
    if (!backTexture) return null;
    const t = backTexture.clone();
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.repeat.set(-1, 1);
    t.offset.set(1, 0);
    t.needsUpdate = true;
    return t;
  }, [backTexture]);

  const isCoverBoth = !!(frontPage?.isCover || backPage?.isCover);

  const frontMat = useMemo(() => {
    const mat = createFoldMaterial(pageWidth, bookHeight, false);
    mat.map = frontTexture ?? null;
    mat.emissive = new THREE.Color(isCoverBoth ? '#221a14' : '#000000');
    mat.emissiveIntensity = isCoverBoth ? 0.06 : 0;
    mat.needsUpdate = true;
    return mat;
  }, [pageWidth, bookHeight, frontTexture, isCoverBoth]);

  const backMat = useMemo(() => {
    const mat = createFoldMaterial(pageWidth, bookHeight, true);
    mat.map = backMapAdjusted ?? null;
    mat.emissive = new THREE.Color(isCoverBoth ? '#221a14' : '#000000');
    mat.emissiveIntensity = isCoverBoth ? 0.05 : 0;
    mat.needsUpdate = true;
    return mat;
  }, [pageWidth, bookHeight, backMapAdjusted, isCoverBoth]);

  useFrame(() => {
    const store = useBookStore.getState();
    const storeSpread = store.spreadIndex;
    const prefersRM = store.prefersReducedMotion;

    type FoldShader = { uniforms?: { uFold?: { value: number } } };
    const frontShader = frontMat.userData.foldShader as FoldShader | undefined;
    const backShader = backMat.userData.foldShader as FoldShader | undefined;

    let foldValue = store.foldProgress;

    if (prefersRM) {
      foldValue = 0;
    } else if (storeSpread > reactSpreadIndex) {
      // Store moved forward but React hasn't re-rendered with new textures yet
      foldValue = 1.0;
    } else if (storeSpread < reactSpreadIndex) {
      // Store moved backward but React still has the newer textures
      foldValue = 0.0;
    }

    if (frontShader?.uniforms?.uFold) {
      // WebGL uniform — imperative Three.js, not React render state
      // eslint-disable-next-line react-hooks/immutability -- uFold drives bend; must update every frame
      frontShader.uniforms.uFold.value = foldValue;
    }
    if (backShader?.uniforms?.uFold) {
      // eslint-disable-next-line react-hooks/immutability -- uFold drives bend; must update every frame
      backShader.uniforms.uFold.value = foldValue;
    }
  });

  useEffect(() => {
    return () => {
      frontMat.dispose();
      backMat.dispose();
      backMapAdjusted?.dispose();
      geometry.dispose();
    };
  }, [frontMat, backMat, backMapAdjusted, geometry]);

  const isCover = frontPage?.isCover || backPage?.isCover;
  const zPos = isCover ? 0.003 : 0.001;

  if (frontPage?.isFormPage) return null;

  return (
    <group position={[pageWidth / 2, 0, zPos]}>
      <mesh
        geometry={geometry}
        material={frontMat}
        position={[0, 0, 0.00025]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometry}
        material={backMat}
        position={[0, 0, -0.00025]}
        castShadow
        receiveShadow
      />
    </group>
  );
}
