/**
 * The physical ring of the research preset "Reflective SLM ring" (phaser-design src/core/runtime/presets.ts): a
 * 20 × 80 mm rectangle with corners SLM → fold → out-coupler → in-coupler, lens R 40 mm down the right leg, lens L 40 mm up
 * the left leg, the gain 60 mm up it. Units: mm. The table is the x–z plane and the beam runs at y = 0.
 *
 * Route position s (mm) starts at the SLM and follows the light: 0 SLM, 40 lens R, 80 fold, 100 out, 140 lens L, 160 gain,
 * 180 in, 200 = SLM again. The simulator's compact route (15-reservoir.ts) has the same three free-space segments
 * 0–40, 40–140 and 140–200 mm; the couplers and mirrors only scale the field, and the model injects the input at the SLM
 * plane (arch.ts `inputFirst`).
 */
export type V3 = [number, number, number]

const CORNERS: V3[] = [[20, 0, 0], [20, 0, 80], [0, 0, 80], [0, 0, 0]] // SLM, fold, out, in
const LEG_START = [0, 80, 100, 180, 200]

export function at(s: number): { p: V3; d: V3 } {
  s = ((s % 200) + 200) % 200
  let k = 0
  while (s >= LEG_START[k + 1]) k++
  const a = CORNERS[k], b = CORNERS[(k + 1) % 4]
  const len = LEG_START[k + 1] - LEG_START[k]
  const t = (s - LEG_START[k]) / len
  const d: V3 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len, (b[2] - a[2]) / len]
  return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], d }
}

export const ELEMENTS = {
  slm: 0, lensR: 40, fold: 80, out: 100, lensL: 140, gain: 160, in: 180,
} as const

/** which simulator segment a route position belongs to, and the distance into it */
export function segmentOf(s: number): { seg: number; z: number } {
  if (s < 40) return { seg: 0, z: s }
  if (s < 140) return { seg: 1, z: s - 40 }
  return { seg: 2, z: s - 140 }
}

/**
 * The compact route applies fold, roof and out-coupler (power 0.995 · 0.995 · 0.95) at lens R. Physically they sit at
 * 80 and 100 mm, so slices before them are brighter by the losses not yet taken. Power factor for a slice at s.
 */
export function physicalPowerFactor(s: number): number {
  if (s >= 40 && s < 80) return 1 / (0.995 * 0.995 * 0.95)
  if (s >= 80 && s < 100) return 1 / 0.95
  return 1
}
