import { useEffect, useRef, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useBookStore } from "../../store";
import {
  getPageImageUvBounds,
  pageHasInspectableImage,
  uvInImageBounds,
} from "../../lib/pageImageBounds";
import { screenRectForUvBounds } from "../../lib/screenRectForUvBounds";
import {
  inspectPickAllowed,
  INSPECT_PICK_USERDATA_KEY,
  type InspectPickUserData,
} from "../../lib/bookInspectPick";

type Props = {
  rootRef: RefObject<THREE.Group | null>;
};

/**
 * One canvas-level click pipeline: raycast in distance order, first hit that passes
 * UV bounds, fold gating, and camera-facing wins. Avoids the static right page stealing
 * events from the flap while the fold is still shallow.
 */
export function BookInspectClickResolver({ rootRef }: Props) {
  const { gl, camera, size } = useThree();
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    const canvas = gl.domElement;

    const onClick = (ev: MouseEvent) => {
      if (ev.button !== 0) return;
      if (useBookStore.getState().imageInspect.open) return;

      const root = rootRef.current;
      if (!root) return;

      const rect = canvas.getBoundingClientRect();
      const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      const hits = raycaster.current.intersectObject(root, true);
      const foldProgress = useBookStore.getState().foldProgress;
      const camWorld = new THREE.Vector3();
      camera.getWorldPosition(camWorld);

      for (const hit of hits) {
        if (hit.object.type !== "Mesh" || !hit.uv || !hit.face) continue;
        const mesh = hit.object as THREE.Mesh;
        const meta = mesh.userData[INSPECT_PICK_USERDATA_KEY] as InspectPickUserData | undefined;
        if (!meta?.page || !pageHasInspectableImage(meta.page)) continue;

        const bounds = getPageImageUvBounds(meta.page);
        if (!bounds || !uvInImageBounds(hit.uv, bounds)) continue;
        if (!inspectPickAllowed(meta.kind, foldProgress)) continue;

        const worldNormal = hit.face.normal
          .clone()
          .transformDirection(mesh.matrixWorld)
          .normalize();
        const toCam = camWorld.clone().sub(hit.point).normalize();
        if (worldNormal.dot(toCam) <= 0.04) continue;

        const rectOut = screenRectForUvBounds(camera, mesh, meta.pageWidth, meta.bookHeight, bounds, size);

        useBookStore.getState().openImageInspect({
          src: meta.page.image!,
          alt: meta.page.imageAlt ?? meta.page.title ?? "Book illustration",
          fromRect: rectOut,
        });
        ev.stopPropagation();
        return;
      }
    };

    canvas.addEventListener("click", onClick, { capture: true });
    return () => canvas.removeEventListener("click", onClick, { capture: true });
  }, [gl, camera, size, rootRef]);

  return null;
}
