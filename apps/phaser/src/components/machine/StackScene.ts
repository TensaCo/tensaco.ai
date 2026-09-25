/**
 * The machine: the linear-stack cavity at true proportions (mm), drawn from the live simulation.
 *
 * The cavity axis is vertical: input mirror/coupler at y = 0, four LCD phase planes 4.8 mm apart, concave end mirror at
 * y = 24 mm; the output tap leaves through the input mirror to a detector below it. Light goes up through the planes,
 * reflects, and comes back down: route position s (mm) runs 0 → 24 up and 24 → 48 down.
 *
 * Wavefronts: a few packets travel the route, each drawn as a handful of crest sheets (stylised: true 650 nm crests cannot
 * be drawn at this scale). Every sheet's cross-section is the simulated |E|² at its plane on the trip it belongs to,
 * computed from the model's own angular spectrum for that gap, so the pattern changes as a packet passes each plane and
 * reflects. The model itself is continuous-wave; the packets show where along the round trip we are looking.
 * Each LCD panel shows its phase program (graphite, per pixel) and the light landing on it (red, per sample).
 */
import * as THREE from 'three'
import { GAPS, LENGTH, N, PITCH, PLANES, PLANE_DATA, PLANE_Z, ROUTE_LENGTH, slice, createField } from '@/lib/phaser-sim'
import { LiveStack } from '@/lib/live'

const RED = new THREE.Vector3(1.0, 0.165, 0.07)
const L_MM = LENGTH * 1e3 // 24
const ROUTE_MM = ROUTE_LENGTH * 1e3 // 48
const W = N * PITCH * 1e3 / 2 // window / panel width, mm (4.064)
const SLICE = 0.6 // mm between precomputed cross-sections along the route
const LAYERS = Math.round(ROUTE_MM / SLICE) // per trip
const PACKETS = 3
const CRESTS = 5
const CREST_GAP = 0.55 // mm between drawn crests (stylised)
const ENVELOPE = [0.35, 0.75, 1, 0.75, 0.35]
export const DETECTOR_Y = -7

export type V3 = [number, number, number]
type View = { pos: V3; target: V3; shift: [number, number] }
export type Framing = 'hero' | 'section'
const FRAMING: Record<Framing, { landscape: View; portrait: View }> = {
  hero: {
    landscape: { pos: [47, 46, 92], target: [0, 8.5, 0], shift: [-0.2, 0] },
    portrait: { pos: [62, 64, 124], target: [0, 8.5, 0], shift: [0.03, 0.02] },
  },
  section: {
    landscape: { pos: [46, 40, 92], target: [0, 8.5, 0], shift: [0, 0] },
    portrait: { pos: [56, 50, 110], target: [0, 8.5, 0], shift: [0, 0] },
  },
}

/** route position (mm) → height on the axis and direction */
export const yAt = (s: number) => { s = ((s % ROUTE_MM) + ROUTE_MM) % ROUTE_MM; return s < L_MM ? s : ROUTE_MM - s }

export interface StackOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  dpr: number
  /** seconds per displayed round trip */
  tripSeconds: number
  framing: Framing
  live?: LiveStack
}

export interface StackStatus { trip: number; step: number; u: number; tripInStep: number; gain: number }

const v = (a: V3) => new THREE.Vector3(a[0], a[1], a[2])

export class StackScene {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly live: LiveStack
  private opts: StackOptions
  private tex: THREE.DataArrayTexture
  private texData: Uint8Array
  private layerTrip: Int32Array
  private crests: THREE.InstancedMesh
  private aLayer: THREE.InstancedBufferAttribute
  private aWeight: THREE.InstancedBufferAttribute
  private panels: { tex: THREE.DataTexture; data: Uint8Array }[] = []
  private detector: { tex: THREE.DataTexture; data: Uint8Array }
  private work = createField()
  private sliceI = new Float64Array(N * N)
  private clock = 0 // route mm travelled by the leading packet
  private t = 0
  private aspect = 1
  private pointer = new THREE.Vector2()
  view: View | null = null
  onTrip?: (s: StackStatus) => void

  constructor(opts: StackOptions) {
    this.opts = opts
    this.live = opts.live ?? new LiveStack(1234)
    const r = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
    if (!r.capabilities.isWebGL2) throw new Error('WebGL2 required')
    r.setClearColor(0x0a0908, 1)
    this.renderer = r
    this.camera = new THREE.PerspectiveCamera(22, 1, 1, 800)
    this.resize(opts.width, opts.height, opts.dpr)

    // ── cross-sections: an 8-bit array texture, LAYERS per trip, two trips (ring buffer by trip parity) ──
    this.texData = new Uint8Array(N * N * LAYERS * 2)
    this.layerTrip = new Int32Array(LAYERS * 2).fill(-1)
    this.tex = new THREE.DataArrayTexture(this.texData, N, N, LAYERS * 2)
    this.tex.format = THREE.RedFormat
    this.tex.type = THREE.UnsignedByteType
    this.tex.minFilter = this.tex.magFilter = THREE.LinearFilter
    this.tex.unpackAlignment = 1
    this.tex.needsUpdate = true

    const geo = new THREE.PlaneGeometry(W, W)
    geo.rotateX(-Math.PI / 2) // horizontal sheets, normal along the axis
    this.aLayer = new THREE.InstancedBufferAttribute(new Float32Array(PACKETS * CRESTS), 1)
    this.aWeight = new THREE.InstancedBufferAttribute(new Float32Array(PACKETS * CRESTS), 1)
    this.aLayer.setUsage(THREE.DynamicDrawUsage); this.aWeight.setUsage(THREE.DynamicDrawUsage)
    geo.setAttribute('aLayer', this.aLayer)
    geo.setAttribute('aWeight', this.aWeight)
    const mat = new THREE.ShaderMaterial({
      uniforms: { uField: { value: this.tex }, uRed: { value: RED }, uGain: { value: opts.framing === 'hero' ? 1.0 : 1.0 } },
      vertexShader: /* glsl */ `
        attribute float aLayer; attribute float aWeight;
        varying vec2 vUv; varying float vLayer; varying float vWeight;
        void main() { vUv = uv; vLayer = aLayer; vWeight = aWeight; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        precision highp sampler2DArray;
        uniform sampler2DArray uField; uniform vec3 uRed; uniform float uGain;
        varying vec2 vUv; varying float vLayer; varying float vWeight;
        void main() {
          if (vWeight <= 0.0) discard;
          float t = texture(uField, vec3(vUv, vLayer)).r;
          gl_FragColor = vec4(uRed * uGain * vWeight * t, 1.0);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    })
    this.crests = new THREE.InstancedMesh(geo, mat, PACKETS * CRESTS)
    this.crests.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.crests.frustumCulled = false
    this.crests.renderOrder = 3
    this.scene.add(this.crests)

    // ── LCD panels: phase program in graphite (per pixel), light landing on them in red (per sample) ──
    const panelMat = (tex: THREE.DataTexture) => new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(uMap, vUv).rgb;
          // black matrix between pixels: fill factor 0.85 → 3.9 % of the pitch per edge; fades when pixels get small on screen
          vec2 g = vUv * 64.0; vec2 f = abs(fract(g) - 0.5); vec2 w = fwidth(g);
          float line = max(step(0.461, f.x), step(0.461, f.y));
          float vis = 1.0 - smoothstep(0.25, 0.5, max(w.x, w.y));
          c *= 1.0 - 0.7 * line * vis;
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
    })
    for (let p = 0; p < PLANES; p++) {
      const data = new Uint8Array(N * N * 4)
      const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true
      const m = new THREE.Mesh(new THREE.PlaneGeometry(W, W).rotateX(-Math.PI / 2), panelMat(tex))
      m.position.y = PLANE_Z[p] * 1e3
      m.renderOrder = 1
      this.scene.add(m)
      this.panels.push({ tex, data })
    }
    {
      const data = new Uint8Array(N * N * 4)
      const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true
      const m = new THREE.Mesh(new THREE.PlaneGeometry(W, W).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }))
      m.position.y = DETECTOR_Y
      this.scene.add(m)
      this.detector = { tex, data }
    }
    this.scene.add(this.hardware())

    if (this.live.cav.trip === 0) this.live.warm(40)
    this.clock = (this.live.cav.trip - 1) * ROUTE_MM + ROUTE_MM * 0.62 // start mid-trip: packets spread over the stack
    this.paintPanels()
  }

  /** hairline drawings of the parts at true size */
  private hardware() {
    const g = new THREE.Group()
    const mat = (opacity: number) => new THREE.LineBasicMaterial({ color: 0xe9e5dc, transparent: true, opacity, depthWrite: false })
    const box = (w: number, h: number, d: number, y: number, opacity: number) => {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), mat(opacity))
      e.position.y = y
      g.add(e)
    }
    const fill = (w: number, h: number, d: number, y: number, color: number, opacity: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }))
      m.position.y = y
      g.add(m)
    }
    // input mirror / coupler (reflecting face at y = 0) and the end mirror (face at y = 24)
    box(7, 1.6, 7, -0.8, 0.5); fill(7, 1.6, 7, -0.8, 0xe9e5dc, 0.035)
    box(7, 2.4, 7, L_MM + 1.2, 0.5); fill(7, 2.4, 7, L_MM + 1.2, 0xe9e5dc, 0.035)
    // LCD glass around each active area
    for (const z of PLANE_Z) box(5.6, 0.7, 5.6, z * 1e3, 0.22)
    // detector below the input mirror, and its package
    box(5.2, 0.8, 5.2, DETECTOR_Y - 0.45, 0.3)
    // the optical axis
    const axis = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, DETECTOR_Y, 0), new THREE.Vector3(0, L_MM + 2.4, 0)])
    g.add(new THREE.Line(axis, mat(0.08)))
    // the bench: 5 mm hairline grid under the detector
    const pts: THREE.Vector3[] = []
    const y0 = DETECTOR_Y - 1
    for (let x = -30; x <= 30; x += 5) pts.push(new THREE.Vector3(x, y0, -30), new THREE.Vector3(x, y0, 30))
    for (let z = -30; z <= 30; z += 5) pts.push(new THREE.Vector3(-30, y0, z), new THREE.Vector3(30, y0, z))
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat(0.035)))
    return g
  }

  private layerFor(trip: number, s: number) {
    const l = Math.min(LAYERS - 1, Math.max(0, Math.floor(s / SLICE)))
    return (trip % 2) * LAYERS + l
  }

  /** make sure the cross-section at route position s of `trip` is in the texture; returns its layer or -1 */
  private ensure(trip: number, s: number): number {
    const slot = trip % 2
    if (this.live.spectraTrip[slot] !== trip) return -1
    const layer = this.layerFor(trip, s)
    if (this.layerTrip[layer] === trip) return layer
    const sc = (Math.floor(s / SLICE) + 0.5) * SLICE // centre of the layer's span, mm
    let gi = GAPS.length - 1
    for (let i = 0; i < GAPS.length; i++) if (sc * 1e-3 < GAPS[i].distance + GAPS[i].length) { gi = i; break }
    slice(this.live.spectra[slot][gi], sc * 1e-3 - GAPS[gi].distance, this.work, this.sliceI)
    const off = layer * N * N
    for (let i = 0; i < N * N; i++) this.texData[off + i] = Math.round(255 * (1 - Math.exp(-this.sliceI[i] / 3.5)))
    this.tex.addLayerUpdate(layer)
    this.tex.needsUpdate = true
    this.layerTrip[layer] = trip
    return layer
  }

  private paintPanels() {
    for (let p = 0; p < PLANES; p++) {
      const { data, tex } = this.panels[p]
      const ph = PLANE_DATA[p].phase, I = this.live.planeI[p]
      let pmax = 0
      for (const x of ph) pmax = Math.max(pmax, x)
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const k = j * N + i
        const gph = 0.08 + 0.16 * (ph[(j >> 1) * 64 + (i >> 1)] / pmax)
        const t = 1 - Math.exp(-I[k] / 7)
        data[4 * k] = 255 * (gph * (1 - t) + t); data[4 * k + 1] = 255 * (gph * (1 - t) + 0.165 * t)
        data[4 * k + 2] = 255 * (gph * 0.95 * (1 - t) + 0.07 * t); data[4 * k + 3] = 255
      }
      tex.needsUpdate = true
    }
    const { data, tex } = this.detector
    for (let k = 0; k < N * N; k++) {
      const t = 1 - Math.exp(-this.live.tapI[k] / 0.15)
      data[4 * k] = 255 * (0.05 * (1 - t) + t); data[4 * k + 1] = 255 * (0.05 * (1 - t) + 0.165 * t); data[4 * k + 2] = 255 * (0.048 * (1 - t) + 0.07 * t); data[4 * k + 3] = 255
    }
    tex.needsUpdate = true
    const c = this.live.cav
    this.onTrip?.({ trip: c.trip, step: this.live.step, u: c.u, tripInStep: c.tripInStep, gain: c.gain })
  }

  private layoutCrests() {
    const o = new THREE.Object3D()
    for (let k = 0; k < PACKETS; k++) {
      const lead = this.clock - (k * ROUTE_MM) / PACKETS
      for (let c = 0; c < CRESTS; c++) {
        const i = k * CRESTS + c
        const a = lead - c * CREST_GAP
        const trip = Math.floor(a / ROUTE_MM)
        const s = a - trip * ROUTE_MM
        const layer = trip >= 0 ? this.ensure(trip, s) : -1
        o.position.set(0, yAt(s), 0)
        o.updateMatrix()
        this.crests.setMatrixAt(i, o.matrix)
        this.aLayer.setX(i, Math.max(0, layer))
        this.aWeight.setX(i, layer < 0 ? 0 : ENVELOPE[c])
      }
    }
    this.crests.instanceMatrix.needsUpdate = true
    this.aLayer.needsUpdate = true
    this.aWeight.needsUpdate = true
  }

  setPointer(x: number, y: number) { this.pointer.set(x, y) }

  resize(w: number, h: number, dpr: number) {
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.aspect = w / Math.max(1, h)
    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
  }

  private placeCamera() {
    const f = FRAMING[this.opts.framing][this.aspect < 0.9 ? 'portrait' : 'landscape']
    const vw = this.view ?? f
    const a = (this.t / 15) * Math.PI * 2
    const base = v(vw.pos)
    const orbit = 0.05 * Math.sin(a) + 0.03 * this.pointer.x
    base.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit)
    base.y += 0.8 * Math.cos(a) - 1.2 * this.pointer.y
    this.camera.position.copy(base)
    this.camera.lookAt(v(vw.target))
    const [sx, sy] = vw.shift
    this.camera.setViewOffset(1000, 1000 / this.aspect, sx * 1000, (sy * 1000) / this.aspect, 1000, 1000 / this.aspect)
  }

  /** advance display time by dt seconds */
  frame(dt: number) {
    dt = Math.min(dt, 0.1)
    this.t += dt
    this.clock += (dt / this.opts.tripSeconds) * ROUTE_MM
    // the leading packet starts trip n when it leaves the input mirror: simulate it then
    while (Math.floor(this.clock / ROUTE_MM) >= this.live.cav.trip) { this.live.trip(); this.paintPanels() }
    this.render()
  }

  render() {
    this.layoutCrests()
    this.placeCamera()
    this.renderer.render(this.scene, this.camera)
  }

  /** screen positions (CSS px, canvas-relative) of points on the axis, for HTML annotations */
  project(p: V3): { x: number; y: number } {
    const el = this.renderer.domElement
    const q = v(p).project(this.camera)
    return { x: (q.x * 0.5 + 0.5) * el.clientWidth, y: (-q.y * 0.5 + 0.5) * el.clientHeight }
  }

  dispose() {
    this.renderer.dispose()
    this.tex.dispose()
    for (const p of this.panels) p.tex.dispose()
    this.detector.tex.dispose()
  }
}
