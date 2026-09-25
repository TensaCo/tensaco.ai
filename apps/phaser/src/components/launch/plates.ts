/**
 * Canvas drawing for the machine section's plates. Light is 650 nm red on ink; the SLM's phase program is graphite
 * (phase is not light). Exposure is film-like, 1 − exp(−I/I₀), with a fixed I₀ per plate so brightness changes are real.
 */
const INK = [10, 9, 8]
const RED = [255, 42, 18]

const scratch = new Map<number, { c: HTMLCanvasElement; img: ImageData }>()

/**
 * Draw an n × n image into a canvas at `cell` px per sample (nearest-neighbour). `gap` (0…1) darkens a 1-px line between
 * cells with that opacity (the SLM's dead zone is 3.5 % of the pitch per edge: at 8 px per pixel that is ≈ 0.28 of a line).
 */
export function drawGrid(
  canvas: HTMLCanvasElement, n: number, cell: number,
  value: (i: number) => [number, number, number], gap = 0,
) {
  let sc = scratch.get(n)
  if (!sc) {
    const c = document.createElement('canvas'); c.width = c.height = n
    sc = { c, img: c.getContext('2d')!.createImageData(n, n) }
    scratch.set(n, sc)
  }
  const d = sc.img.data
  for (let i = 0; i < n * n; i++) {
    const [r, g, b] = value(i)
    d[4 * i] = r; d[4 * i + 1] = g; d[4 * i + 2] = b; d[4 * i + 3] = 255
  }
  sc.c.getContext('2d')!.putImageData(sc.img, 0, 0)
  const W = n * cell
  if (canvas.width !== W) { canvas.width = W; canvas.height = W }
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(sc.c, 0, 0, W, W)
  if (gap > 0) {
    ctx.fillStyle = `rgba(0,0,0,${gap})`
    for (let k = 1; k <= n; k++) { ctx.fillRect(k * cell - 1, 0, 1, W); ctx.fillRect(0, k * cell - 1, W, 1) }
  }
}

export const exposure = (I: number, I0: number) => 1 - Math.exp(-I / I0)

/** intensity → [r, g, b] on ink */
export function red(t: number): [number, number, number] {
  return [INK[0] + (RED[0] - INK[0]) * t, INK[1] + (RED[1] - INK[1]) * t, INK[2] + (RED[2] - INK[2]) * t]
}

/** light on a graphite phase level (g in 0…1 of the graphite ramp) */
export function redOver(t: number, g: number): [number, number, number] {
  const base = 12 + 32 * g
  return [base + (RED[0] - base) * t, base * 0.97 + (RED[1] - base * 0.97) * t, base * 0.92 + (RED[2] - base * 0.92) * t]
}
