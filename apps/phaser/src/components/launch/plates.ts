/**
 * Canvas drawing for the machine section's plates. Light is 650 nm red on ink; the SLM's phase program is graphite
 * (phase is not light). Exposure is film-like, 1 − exp(−I/I₀), with a fixed I₀ per plate so brightness changes are real.
 */
const RED = [255, 42, 18]

export const exposure = (I: number, I0: number) => 1 - Math.exp(-I / I0)

/** light on a graphite phase level (g in 0…1 of the graphite ramp) */
export function redOver(t: number, g: number): [number, number, number] {
  const base = 12 + 32 * g
  return [base + (RED[0] - base) * t, base * 0.97 + (RED[1] - base * 0.97) * t, base * 0.92 + (RED[2] - base * 0.92) * t]
}
