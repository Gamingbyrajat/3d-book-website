import { useMemo } from 'react';
import * as THREE from 'three';
import { usePageTexture } from '../../hooks/usePageTexture';
import type { Page as PageType } from '../../content/pages';

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

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(pageWidth, bookHeight, 1, 1),
    [pageWidth, bookHeight]
  );

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#ffffff',
      side: THREE.FrontSide,
    });
  }, []);

  const edgeBottomGeo = useMemo(
    () => new THREE.PlaneGeometry(pageWidth, COVER_THICKNESS),
    [pageWidth]
  );
  const edgeSideGeo = useMemo(
    () => new THREE.PlaneGeometry(COVER_THICKNESS, bookHeight),
    [bookHeight]
  );
  const edgeMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: COVER_EDGE_COLOR, side: THREE.DoubleSide }),
    []
  );

  if (texture) {
    material.map = texture;
    material.needsUpdate = true;
  }

  if (!visible) return null;

  const xOffset = side === 'left' ? -pageWidth / 2 : pageWidth / 2;

  return (
    <group>
      <mesh
        geometry={geometry}
        material={material}
        position={[xOffset, 0, isCover ? 0.003 : 0]}
      />

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
