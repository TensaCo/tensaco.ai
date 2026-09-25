/**
 * Procedural surface maps for the bench hardware, drawn once on canvases: colour, height → normal, roughness/metalness.
 *
 * Nothing here is a photograph: every map comes from a seeded generator, so the render is the same on every load.
 *   wear()      tiling nicks, dings, scratches and smudges for machined metal and anodise (chipped anodise shows bare
 *               aluminium; fresh copper shows in the nicks of the tarnished heatsink)
 *   pcb()       a board's top from its layers: copper under the mask (raised), mask openings (recessed pads), vias, drills,
 *               and silkscreen as a thick raised ink with ragged edges and a small misregistration
 * Roughness and metalness share one map (G = roughness, B = metalness, as three.js reads them).
 */
import * as THREE from 'three'

export function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, color = true) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  draw(cv.getContext('2d')!)
  return texOf(cv, color)
}
function texOf(cv: HTMLCanvasElement, color: boolean) {
  const t = new THREE.CanvasTexture(cv)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function fromPixels(w: number, h: number, px: (i: number, d: Uint8ClampedArray) => void, color: boolean) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  const c = cv.getContext('2d')!, img = c.createImageData(w, h)
  for (let i = 0; i < w * h; i++) { px(i, img.data); img.data[4 * i + 3] = 255 }
  c.putImageData(img, 0, 0)
  return texOf(cv, color)
}
const tile = (t: THREE.Texture) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t }

/** periodic value noise on a w × h grid with `cells` lattice cells across (smooth, tiles) */
function noise(w: number, h: number, cells: number, seed: number) {
  const r = rng(seed), g = new Float32Array(cells * cells).map(() => r())
  const out = new Float32Array(w * h)
  const xi = new Int32Array(w), xu = new Float32Array(w)
  for (let x = 0; x < w; x++) { const f = (x / w) * cells, x0 = Math.floor(f), s = f - x0; xi[x] = x0; xu[x] = s * s * (3 - 2 * s) }
  for (let y = 0; y < h; y++) {
    const f = (y / h) * cells, y0 = Math.floor(f), sy = f - y0, uy = sy * sy * (3 - 2 * sy)
    const r0 = (y0 % cells) * cells, r1 = ((y0 + 1) % cells) * cells, o = y * w
    for (let x = 0; x < w; x++) {
      const i0 = xi[x] % cells, i1 = (xi[x] + 1) % cells, ux = xu[x]
      const a = g[r0 + i0] + (g[r0 + i1] - g[r0 + i0]) * ux, b = g[r1 + i0] + (g[r1 + i1] - g[r1 + i0]) * ux
      out[o + x] = a + (b - a) * uy
    }
  }
  return out
}
const fbmCache = new Map<string, Float32Array>()
function fbm(w: number, h: number, cells: number, seed: number, oct = 4) {
  const key = `${w}|${h}|${cells}|${seed}|${oct}`
  const hit = fbmCache.get(key)
  if (hit) return hit
  const out = new Float32Array(w * h)
  let amp = 1, sum = 0
  for (let o = 0; o < oct; o++) { const n = noise(w, h, cells << o, seed + o * 101); for (let i = 0; i < out.length; i++) out[i] += amp * n[i]; sum += amp; amp *= 0.5 }
  for (let i = 0; i < out.length; i++) out[i] /= sum
  fbmCache.set(key, out)
  return out
}
/** the same field, shifted (a cheap new-looking copy of a cached tiling field) */
function rolled(a: Float32Array, w: number, h: number, dx: number, dy: number) {
  const o = new Float32Array(a.length)
  for (let y = 0; y < h; y++) { const src = ((y + dy) % h) * w; for (let x = 0; x < w; x++) o[y * w + x] = a[src + ((x + dx) % w)] }
  return o
}
/** a 1-2-1 blur, separable */
function blur(a: Float32Array, w: number, h: number, wrap: boolean) {
  const t = new Float32Array(a.length), o = new Float32Array(a.length)
  for (let y = 0; y < h; y++) {
    const r = y * w
    for (let x = 0; x < w; x++) {
      const l = x > 0 ? x - 1 : wrap ? w - 1 : 0, rr = x < w - 1 ? x + 1 : wrap ? 0 : w - 1
      t[r + x] = (a[r + l] + 2 * a[r + x] + a[r + rr]) * 0.25
    }
  }
  for (let y = 0; y < h; y++) {
    const u = (y > 0 ? y - 1 : wrap ? h - 1 : 0) * w, d = (y < h - 1 ? y + 1 : wrap ? 0 : h - 1) * w, r = y * w
    for (let x = 0; x < w; x++) o[r + x] = (t[u + x] + 2 * t[r + x] + t[d + x]) * 0.25
  }
  return o
}
/** a tangent-space normal map from a height field (height in pixels × strength); canvas rows run down, v runs up */
function normalMap(hgt: Float32Array, w: number, h: number, strength: number, wrap: boolean) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  const c = cv.getContext('2d')!, img = c.createImageData(w, h), d = img.data, k = 0.5 * strength
  for (let y = 0; y < h; y++) {
    const u = (y > 0 ? y - 1 : wrap ? h - 1 : 0) * w, dn = (y < h - 1 ? y + 1 : wrap ? 0 : h - 1) * w, r = y * w
    for (let x = 0; x < w; x++) {
      const l = x > 0 ? x - 1 : wrap ? w - 1 : 0, rr = x < w - 1 ? x + 1 : wrap ? 0 : w - 1
      const nx = -(hgt[r + rr] - hgt[r + l]) * k, ny = (hgt[dn + x] - hgt[u + x]) * k
      const inv = 127.5 / Math.sqrt(nx * nx + ny * ny + 1), p = 4 * (r + x)
      d[p] = 127.5 + nx * inv; d[p + 1] = 127.5 + ny * inv; d[p + 2] = 127.5 + inv; d[p + 3] = 255
    }
  }
  c.putImageData(img, 0, 0)
  return texOf(cv, false)
}

export interface WearOptions {
  seed: number
  size?: number
  /** small dents with a raised lip */
  nicks: number
  /** long hairline scratches */
  scratches: number
  /** base roughness, and how much smudges (fingerprints, handling) change it */
  rough: number
  smudge: number
  /** a colour map: base colour, what patches drift to (tarnish), what shows inside a nick (bare metal) */
  tint?: { base: THREE.ColorRepresentation; patch: THREE.ColorRepresentation; bare: THREE.ColorRepresentation; patchAmount: number }
}
export interface Wear { normal: THREE.Texture; rough: THREE.Texture; map?: THREE.Texture }

/** a tiling wear set: dents and scratches as height (→ normal), smudges as roughness, optional tarnish/bare-metal colour */
export function wear(o: WearOptions): Wear {
  const S = o.size ?? 512, r = rng(o.seed)
  const hgt = new Float32Array(S * S), bare = new Float32Array(S * S), dr = new Float32Array(S * S)
  const put = (x: number, y: number, dh: number, b = 0, rr = 0) => {
    const i = (((y % S) + S) % S) * S + (((x % S) + S) % S)
    hgt[i] += dh; if (b > bare[i]) bare[i] = b; dr[i] += rr
  }
  for (let i = 0; i < S * S; i++) hgt[i] = 0.25 * (r() - 0.5)
  // scratches: slightly curved hairlines, a shallow groove with a lighter or glossier trace
  for (let k = 0; k < o.scratches; k++) {
    let x = r() * S, y = r() * S, a = r() * Math.PI * 2
    const len = 20 + r() * r() * 260, depth = 0.3 + 0.7 * r(), bend = (r() - 0.5) * 0.01
    for (let s = 0; s < len; s++) {
      const fade = Math.sin((Math.PI * s) / len)
      put(Math.round(x), Math.round(y), -depth * fade, 0, -0.14 * fade)
      x += Math.cos(a); y += Math.sin(a); a += bend
    }
  }
  // nicks: short elongated dents with a raised lip; bare metal inside
  for (let k = 0; k < o.nicks; k++) {
    const cx = r() * S, cy = r() * S, a = r() * Math.PI, big = r() < 0.08
    const len = (big ? 8 : 2.5) + r() * (big ? 14 : 6), wid = (big ? 2.5 : 1.2) + r() * 2, depth = 3 + 5 * r()
    const ca = Math.cos(a), sa = Math.sin(a), R = Math.ceil(len + 3)
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const u = (i * ca + j * sa) / len, v = (-i * sa + j * ca) / wid, d2 = u * u + v * v
      if (d2 < 1) put(Math.round(cx + i), Math.round(cy + j), -depth * (1 - d2), d2 < 0.55 ? 0.85 : 0.4, 0.1)
      else if (d2 < 2.2) put(Math.round(cx + i), Math.round(cy + j), 0.27 * depth * (1 - (d2 - 1) / 1.2), 0, 0)
    }
  }
  const smooth = blur(hgt, S, S, true)
  const sm = rolled(fbm(S, S, 4, 7, 4), S, S, (o.seed * 97) % S, (o.seed * 57) % S)
  const rough = fromPixels(S, S, (i, d) => {
    const v = Math.max(0.04, Math.min(1, o.rough + o.smudge * (sm[i] - 0.5) * 2 + dr[i]))
    d[4 * i] = 0; d[4 * i + 1] = 255 * v; d[4 * i + 2] = 255
  }, false)
  const out: Wear = { normal: tile(normalMap(smooth, S, S, 0.9, true)), rough: tile(rough) }
  if (o.tint) {
    // mixed in sRGB (display) space: close enough for wear, and much cheaper per pixel
    const rgb = (c: THREE.ColorRepresentation) => { const k = new THREE.Color(c).getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace); return [255 * k.r, 255 * k.g, 255 * k.b] }
    const base = rgb(o.tint.base), patch = rgb(o.tint.patch), bareC = rgb(o.tint.bare), pa = o.tint.patchAmount
    const pn = rolled(fbm(S, S, 3, 13, 5), S, S, (o.seed * 71) % S, (o.seed * 37) % S)
    out.map = tile(fromPixels(S, S, (i, d) => {
      const p = Math.max(0, Math.min(1, (pn[i] - 0.5) * 3 + 0.5)) * pa, b = bare[i]
      for (let k = 0; k < 3; k++) d[4 * i + k] = (base[k] + (patch[k] - base[k]) * p) * (1 - b) + bareC[k] * b
    }, true))
  }
  return out
}

// ── printed circuit boards ────────────────────────────────────────────────────────────────────────────────────────────
type Layer = { col: string; h: number; rough: number; metal: number }
export const PCB_LAYERS = {
  trace: { col: '#1b201c', h: 150, rough: 0.42, metal: 0 },
  pour: { col: '#151916', h: 142, rough: 0.44, metal: 0 },
  via: { col: '#252a25', h: 158, rough: 0.42, metal: 0 },
  pad: { col: '#c4a66a', h: 70, rough: 0.26, metal: 1 }, // ENIG in a mask opening (below the mask surface)
  tin: { col: '#c9c7c1', h: 96, rough: 0.2, metal: 1 }, // solder on a pad
  copper: { col: '#b8764c', h: 72, rough: 0.3, metal: 1 }, // bare copper (an exposed test pad, slightly tarnished)
  drill: { col: '#040404', h: 0, rough: 0.9, metal: 0 },
  mask: { col: '#0d0f0e', h: 120, rough: 0.46, metal: 0 },
} satisfies Record<string, Layer>
export type PcbLayer = keyof typeof PCB_LAYERS

export interface PcbPainter {
  /** mm → canvas px */
  X: (x: number) => number
  Z: (z: number) => number
  px: number
  fill(layer: PcbLayer, path: (c: CanvasRenderingContext2D) => void): void
  stroke(layer: PcbLayer, width: number, path: (c: CanvasRenderingContext2D) => void, cap?: CanvasLineCap): void
  /** the silkscreen: draw white onto it */
  silk: CanvasRenderingContext2D
}
export interface PcbMaps { map: THREE.Texture; normal: THREE.Texture; rm: THREE.Texture }

/** a board top w × l mm at px per mm; `draw` paints copper/mask layers and the silkscreen */
export function pcb(w: number, l: number, px: number, seed: number, draw: (p: PcbPainter) => void, opts: { mask?: string } = {}): PcbMaps {
  const W = Math.round(w * px), H = Math.round(l * px)
  const mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return { cv, c: cv.getContext('2d')! } }
  const col = mk(), ht = mk(), rm = mk(), silk = mk()
  const mask = { ...PCB_LAYERS.mask, col: opts.mask ?? PCB_LAYERS.mask.col }
  const grey = (v: number) => `rgb(${v},${v},${v})`
  const styles = (L: Layer) => [[col.c, L.col], [ht.c, grey(L.h)], [rm.c, `rgb(0,${Math.round(L.rough * 255)},${Math.round(L.metal * 255)})`]] as const
  const paint = (L: Layer, path: (c: CanvasRenderingContext2D) => void, how: (c: CanvasRenderingContext2D, s: string) => void) => {
    for (const [c, s] of styles(L)) { c.beginPath(); path(c); how(c, s) }
  }
  paint(mask, (c) => c.rect(0, 0, W, H), (c, s) => { c.fillStyle = s; c.fill() })
  silk.c.fillStyle = silk.c.strokeStyle = '#fff'
  const P: PcbPainter = {
    X: (x) => (x + w / 2) * px, Z: (z) => (z + l / 2) * px, px, silk: silk.c,
    fill: (k, path) => paint(PCB_LAYERS[k], path, (c, s) => { c.fillStyle = s; c.fill() }),
    stroke: (k, lw, path, cap = 'round') => paint(PCB_LAYERS[k], path, (c, s) => { c.strokeStyle = s; c.lineWidth = lw * px; c.lineCap = cap; c.lineJoin = 'round'; c.stroke() }),
  }
  draw(P)

  // post: copper relief softened by the mask; the silk ink ragged, a little off register, thick and matte
  const n = W * H, r = rng(seed)
  const hd = ht.c.getImageData(0, 0, W, H).data, cd = col.c.getImageData(0, 0, W, H), rd = rm.c.getImageData(0, 0, W, H)
  let hgt = new Float32Array(n)
  for (let i = 0; i < n; i++) hgt[i] = hd[4 * i] / 255 * 3
  hgt = blur(blur(hgt, W, H, false), W, H, false)
  const sd = silk.c.getImageData(0, 0, W, H).data
  const grain = fbm(W, H, Math.max(4, Math.round(W / 6)), seed + 3, 1), blot = fbm(W, H, 6, seed + 5, 3)
  const off = Math.round(0.07 * px) // silk registration error, px
  let sa = new Float32Array(n)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const xs = x - off, ys = y + off
    if (xs < 0 || ys >= H) continue
    const a = sd[4 * (ys * W + xs) + 3] / 255
    sa[y * W + x] = a * (grain[y * W + x] > 0.28 ? 1 : 0.35)
  }
  sa = blur(sa, W, H, false)
  const silkCol = [218, 214, 204]
  for (let i = 0; i < n; i++) {
    const a = Math.min(1, sa[i] * 1.25)
    const onMetal = rd.data[4 * i + 2] > 128
    const tone = 1 + 0.1 * (blot[i] - 0.5) + 0.05 * (r() - 0.5)
    for (let k = 0; k < 3; k++) cd.data[4 * i + k] = (cd.data[4 * i + k] * (onMetal ? 1 : tone)) * (1 - a) + silkCol[k] * (0.93 + 0.1 * grain[i]) * a
    hgt[i] += a * (1.6 + 0.6 * grain[i]) + 0.05 * (r() - 0.5)
    rd.data[4 * i + 1] = rd.data[4 * i + 1] * (1 - a) + 230 * a + (onMetal ? 0 : 40 * (blot[i] - 0.5))
    rd.data[4 * i + 2] *= 1 - a
  }
  col.c.putImageData(cd, 0, 0); rm.c.putImageData(rd, 0, 0)
  return { map: texOf(col.cv, true), normal: normalMap(hgt, W, H, 1.1, false), rm: texOf(rm.cv, false) }
}

/** a small laser-marked top for an IC package: text slightly lighter and rougher than the moulding, a pin-1 dimple */
export function icMark(lines: string[], wmm: number, lmm: number, dot = true) {
  const px = 64, W = Math.round(wmm * px), H = Math.round(lmm * px)
  return canvasTex(W, H, (c) => {
    c.fillStyle = '#141414'; c.fillRect(0, 0, W, H)
    const r = rng(lines.join('').length * 17)
    for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(255,255,255,${0.02 * r()})`; c.fillRect(r() * W, r() * H, 2, 2) }
    c.fillStyle = 'rgba(128,126,120,0.6)'; c.textAlign = 'center'; c.textBaseline = 'middle'
    const fs = Math.min(0.26 * H, (1.5 * W) / Math.max(...lines.map((l) => l.length)))
    c.font = `500 ${fs}px monospace`
    lines.forEach((l, i) => c.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * fs * 1.25))
    if (dot) { c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(0.14 * W, 0.2 * H, 0.05 * Math.min(W, H) + 2, 0, Math.PI * 2); c.fill() }
  })
}
