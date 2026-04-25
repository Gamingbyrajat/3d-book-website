import { useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { usePageTexture } from '../../hooks/usePageTexture';
import { usePageImageInspectHandlers } from '../../hooks/usePageImageInspect';
import { pageHasInspectableImage } from '../../lib/pageImageBounds';
import { INSPECT_PICK_USERDATA_KEY } from '../../lib/bookInspectPick';
import type { Page as PageType } from '../../content/pages';
import { PageImageZoomHint } from './PageImageZoomHint';

interface PageProps {
  side: 'left' | 'right';
  bookWidth: number;
  bookHeight: number;
  page?: PageType;
  visible?: boolean;
}

const COVER_EDGE_COLOR = '#1e2128';
const COVER_THICKNESS = 0.025;

export function Page({ side, bookWidth, bookHeight, page, visible = true }: PageProps) {
  const pageWidth = bookWidth / 2;
  const texture = usePageTexture(page);
  const isCover = page?.isCover;
  const pickKind = side === 'left' ? 'left' : 'right';
  const inspect = usePageImageInspectHandlers(page, pageWidth, bookHeight, pickKind);
  const inspectMeshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(pageWidth, bookHeight, 1, 1),
    [pageWidth, bookHeight],
  );

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.92,
      metalness: 0.02,
      envMapIntensity: 0.85,
      side: THREE.FrontSide,
    });
    mat.map = texture ?? null;
    if (isCover) {
      mat.emissive = new THREE.Color('#1a1510');
      mat.emissiveIntensity = 0.05;
    }
    mat.needsUpdate = true;
    return mat;
  }, [texture, isCover]);

  const edgeBottomGeo = useMemo(
    () => new THREE.PlaneGeometry(pageWidth, COVER_THICKNESS),
    [pageWidth],
  );
  const edgeSideGeo = useMemo(
    () => new THREE.PlaneGeometry(COVER_THICKNESS, bookHeight),
    [bookHeight],
  );
  const edgeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COVER_EDGE_COLOR,
        roughness: 0.88,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      material.dispose();
      edgeMat.dispose();
      geometry.dispose();
      edgeBottomGeo.dispose();
      edgeSideGeo.dispose();
    };
  }, [material, edgeMat, geometry, edgeBottomGeo, edgeSideGeo]);

  const showInspect = !isCover && pageHasInspectableImage(page);

  useLayoutEffect(() => {
    const mesh = inspectMeshRef.current;
    if (!mesh) return;
    if (showInspect && page) {
      mesh.userData[INSPECT_PICK_USERDATA_KEY] = {
        kind: pickKind,
        page,
        pageWidth,
        bookHeight,
      };
    } else {
      delete mesh.userData[INSPECT_PICK_USERDATA_KEY];
    }
  }, [showInspect, page, pageWidth, bookHeight, pickKind]);

  if (!visible) return null;

  const xOffset = side === 'left' ? -pageWidth / 2 : pageWidth / 2;
  const zPage = isCover ? 0.003 : 0;
  return (
    <group>
      <mesh
        ref={inspectMeshRef}
        geometry={geometry}
        material={material}
        position={[xOffset, 0, zPage]}
        castShadow
        receiveShadow
        onPointerMove={showInspect ? inspect.onPointerMove : undefined}
        onPointerOut={showInspect ? inspect.onPointerOut : undefined}
      />

      {showInspect && inspect.bounds && (
        <group position={[xOffset, 0, zPage + 0.002]}>
          <Html
            center
            position={inspect.hintPosition}
            distanceFactor={5.5}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[50, 0]}
          >
            <PageImageZoomHint active={inspect.showZoomHint} />
          </Html>
        </group>
      )}

      {isCover && (
        <>
          <mesh
            geometry={edgeBottomGeo}
            material={edgeMat}
            position={[xOffset, -bookHeight / 2, 0.0015]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            geometry={edgeBottomGeo}
            material={edgeMat}
            position={[xOffset, bookHeight / 2, 0.0015]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
          <mesh
            geometry={edgeSideGeo}
            material={edgeMat}
            position={[
              side === 'right' ? xOffset + pageWidth / 2 : xOffset - pageWidth / 2,
              0,
              0.0015,
            ]}
            rotation={[0, Math.PI / 2, 0]}
          />
        </>
      )}
    </group>
  );
}
