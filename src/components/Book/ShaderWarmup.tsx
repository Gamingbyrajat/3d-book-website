import { useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useBookStore } from '../../store';

/**
 * Forces GLSL compile + one draw before the loader dismisses, so the first real
 * scroll does not hitch on program creation (see book_architecture_plan.md §11).
 */
export function ShaderWarmup() {
  const { gl, scene, camera } = useThree();
  const ran = useRef(false);

  useLayoutEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const folds = [0, 0.35, 0.72, 1];
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        const shader = (m as THREE.MeshStandardMaterial & { userData: { foldShader?: { uniforms?: { uFold?: { value: number } } } } })
          .userData?.foldShader;
        if (shader?.uniforms?.uFold) {
          for (const f of folds) {
            shader.uniforms.uFold.value = f;
            gl.compile(scene, camera);
          }
        }
      }
    });

    gl.compile(scene, camera);
    gl.render(scene, camera);

    useBookStore.getState().setShaderWarmed(true);
  }, [gl, scene, camera]);

  return null;
}
