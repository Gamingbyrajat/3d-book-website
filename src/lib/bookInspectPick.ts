import type { Page } from "../content/pages";

export type InspectPickKind = "left" | "right" | "flapFront" | "flapBack";

export type InspectPickUserData = {
  kind: InspectPickKind;
  page: Page;
  pageWidth: number;
  bookHeight: number;
};

/** Key on THREE.Mesh.userData for centralized inspect raycasting. */
export const INSPECT_PICK_USERDATA_KEY = "inspectPick";

/**
 * Gating for which book surfaces participate in image inspect raycasts / hover hints.
 * The static right page sits under the flap until the fold lifts far enough; flap back
 * is not meaningfully toward the camera until mid-fold. Flap front can still register
 * stray hits late in the fold from bent normals — paired with a facing-dot check in the resolver.
 */

const RIGHT_CLEAR_OF_FLAP = 0.46;
const FLAP_BACK_VISIBLE = 0.38;
const FLAP_FRONT_MAX = 0.78;

export function inspectPickAllowed(kind: InspectPickKind, foldProgress: number): boolean {
  if (kind === "right") return foldProgress >= RIGHT_CLEAR_OF_FLAP;
  if (kind === "flapBack") return foldProgress >= FLAP_BACK_VISIBLE;
  if (kind === "flapFront") return foldProgress <= FLAP_FRONT_MAX;
  return true;
}
