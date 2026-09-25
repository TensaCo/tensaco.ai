/**
 * The machine: the linear-stack cavity at true proportions (mm), drawn from the live simulation.
 *
 * The cavity axis is vertical: input mirror/coupler at y = 0, four fabricated phase plates 5 mm apart, concave end mirror
 * at y = 25 mm; the output tap leaves through the input mirror to a camera below it. The hardware around the cavity (cage,
 * mounts, gain crystal, camera module, dev board) is modelled at true scale in hardware.ts. Light goes up through the planes,
 * reflects, and comes back down: route position s (mm) runs 0 → 24 up and 24 → 48 down.
 *
 * Wavefronts: dozens of short packets travel the route at once (time-multiplexed, nearly overlapping), each drawn as a handful of crest sheets (stylised: true 650 nm crests cannot
 * be drawn at this scale). Every sheet's cross-section is the simulated |E|² at its plane on the trip it belongs to,
 * computed from the model's own angular spectrum for that gap, so the pattern changes as a packet passes each plane and
 * reflects. The model itself is continuous-wave; the packets show where along the round trip we are looking.
 * Each plate shows its etched phase pattern (graphite, per pixel) and the light crossing it (red).
 */
import * as THREE from 'three'
import { DX, GAPS, LENGTH, N, PLANES, PLANE_DATA, PLANE_Z, slice, createField } from '@/lib/phaser-sim'
import { LiveStack } from '@/lib/live'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { addLights, buildAssembly } from './hardware'

const RED = new THREE.Vector3(1.0, 0.165, 0.07)
const L_MM = LENGTH * 1e3 // 24
const ROUTE_MM = 2 * L_MM // the route in air, up and back (the glass is drawn thin)
const W = N * DX * 1e3 // window / plate width, mm (2.56)
const SLICE = 0.6 // mm between precomputed cross-sections along the route
const LAYERS = Math.round(ROUTE_MM / SLICE) // per trip
const PACKETS = 36 // time-multiplexed wavefronts in flight at once, 1.4 mm apart along the 50 mm round trip
const CRESTS = 3
const CREST_GAP = 0.3 // mm between drawn crests (stylised)
const ENVELOPE = [0.5, 1, 0.5]

export type V3 = [number, number, number]
/** a camera: the direction it looks from, and the rectangle of the frame (normalised device coordinates, −1…1, y up)
 *  that the whole assembly must fit inside; distance and lens shift are solved from these */
type View = { dir: V3; box: [number, number, number, number] }
export type Framing = 'hero' | 'section'
const FRAMING: Record<Framing, { landscape: View; portrait: View }> = {
  hero: {
    landscape: { dir: [0.3, 0.25, 0.92], box: [0.02, 0.56, -0.86, 0.8] },
    portrait: { dir: [0.3, 0.25, 0.92], box: [-0.62, 0.62, -0.25, 0.74] },
  },
  section: {
    landscape: { dir: [0.3, 0.25, 0.92], box: [-0.34, 0.34, -0.94, 0.94] },
    portrait: { dir: [0.3, 0.25, 0.92], box: [-0.3, 0.3, -0.94, 0.94] },
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
  private bounds = new THREE.Box3()
  private fitted = { key: '', dist: 100, target: new THREE.Vector3(), sx: 0, sy: 0 }
  private work = createField()
  private sliceI = new Float64Array(N * N)
  private clock = 0 // route mm travelled by the leading packet
  private t = 0
  private aspect = 1
  private pointer = new THREE.Vector2()
  view: View | null = null
  /** true when WebGL runs on a software rasteriser */
  software = false
  onTrip?: (s: StackStatus) => void

  constructor(opts: StackOptions) {
    this.opts = opts
    this.live = opts.live ?? new LiveStack(1234)
    const r = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
    if (!r.capabilities.isWebGL2) throw new Error('WebGL2 required')
    // no GPU (software rasteriser): render at reduced resolution, it is fill-rate bound
    const gl = r.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const name = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
    this.software = /swiftshader|llvmpipe|software/i.test(name)
    r.setClearColor(0x0a0908, 1)
    r.toneMapping = THREE.ACESFilmicToneMapping
    r.toneMappingExposure = 1.0
    this.renderer = r
    const pmrem = new THREE.PMREMGenerator(r)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.45
    pmrem.dispose()
    this.camera = new THREE.PerspectiveCamera(22, 1, 1, 3000)
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
      uniforms: { uField: { value: this.tex }, uRed: { value: RED }, uGain: { value: 0.55 } },
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

    // ── phase plates: etched pattern in graphite (per pixel), light crossing them in red ──
    // the etched face: light (red) over the program (graphite), with the relief of the etch drawn where neighbouring
    // pixels differ in depth (a step catches light along its edge); the steps fade out when a pixel is smaller than ~2 px
    const panelMat = (tex: THREE.DataTexture, depth: THREE.DataTexture) => new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex }, uDepth: { value: depth } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; uniform sampler2D uDepth; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(uMap, vUv).rgb;
          vec2 g = vUv * 64.0, f = fract(g), w = fwidth(g);
          float d0 = texture2D(uDepth, vUv).r;
          float dx = abs(texture2D(uDepth, vUv + vec2(1.0 / 64.0, 0.0)).r - d0) * step(1.0 - 0.08, f.x);
          float dy = abs(texture2D(uDepth, vUv + vec2(0.0, 1.0 / 64.0)).r - d0) * step(1.0 - 0.08, f.y);
          float vis = 1.0 - smoothstep(0.3, 0.6, max(w.x, w.y));
          c += vec3(0.55, 0.53, 0.5) * clamp(2.5 * max(dx, dy), 0.0, 1.0) * vis;
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
    })
    for (let p = 0; p < PLANES; p++) {
      const data = new Uint8Array(N * N * 4)
      const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true
      const ph = PLANE_DATA[p].phase
      let pm = 0
      for (const x of ph) pm = Math.max(pm, x)
      const dd = new Uint8Array(ph.length)
      for (let k = 0; k < ph.length; k++) dd[k] = Math.round((255 * ph[k]) / pm)
      const depth = new THREE.DataTexture(dd, 64, 64, THREE.RedFormat)
      depth.magFilter = depth.minFilter = THREE.NearestFilter; depth.needsUpdate = true
      const m = new THREE.Mesh(new THREE.PlaneGeometry(W, W).rotateX(-Math.PI / 2), panelMat(tex, depth))
      m.position.y = PLANE_Z[p] * 1e3 + 0.01
      m.renderOrder = 1
      this.scene.add(m)
      this.panels.push({ tex, data })
    }
    const asm = buildAssembly()
    this.scene.add(asm.group)
    this.bounds.copy(asm.bounds)
    addLights(this.scene)

    if (this.live.cav.trip === 0) this.live.warm(40)
    this.clock = (this.live.cav.trip - 1) * ROUTE_MM + ROUTE_MM * 0.62 // start mid-trip: packets spread over the stack
    this.paintPanels()
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
    for (let i = 0; i < N * N; i++) this.texData[off + i] = Math.round(255 * (1 - Math.exp(-this.sliceI[i] / 0.5)))
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
        const gph = 0.08 + 0.16 * (ph[k] / pmax)
        const t = 1 - Math.exp(-I[k] / 1.0)
        data[4 * k] = 255 * (gph * (1 - t) + t); data[4 * k + 1] = 255 * (gph * (1 - t) + 0.165 * t)
        data[4 * k + 2] = 255 * (gph * 0.95 * (1 - t) + 0.07 * t); data[4 * k + 3] = 255
      }
      tex.needsUpdate = true
    }
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
    this.renderer.setPixelRatio(this.software ? Math.min(dpr, 0.7) : dpr)
    this.renderer.setSize(w, h, false)
    this.aspect = w / Math.max(1, h)
    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
  }

  /** distance and lens shift that fit the whole assembly into the view's frame rectangle */
  private fit(v: View) {
    const key = `${this.aspect.toFixed(3)}|${v.dir}|${v.box}`
    if (this.fitted.key === key) return this.fitted
    const dir = new THREE.Vector3(...v.dir).normalize(), target = this.bounds.getCenter(new THREE.Vector3())
    const cam = this.camera.clone()
    const b = this.bounds, corners: THREE.Vector3[] = []
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) corners.push(new THREE.Vector3(x, y, z))
    const [x0, x1, y0, y1] = v.box
    const extent = (d: number) => {
      cam.position.copy(target).addScaledVector(dir, d); cam.lookAt(target); cam.clearViewOffset(); cam.updateMatrixWorld(); cam.updateProjectionMatrix()
      let a = Infinity, bx = -Infinity, c = Infinity, e = -Infinity
      for (const k of corners) { const q = k.clone().project(cam); a = Math.min(a, q.x); bx = Math.max(bx, q.x); c = Math.min(c, q.y); e = Math.max(e, q.y) }
      return { minX: a, maxX: bx, minY: c, maxY: e }
    }
    let lo = 10, hi = 3000
    for (let it = 0; it < 40; it++) {
      const d = (lo + hi) / 2, r = extent(d)
      if (r.maxX - r.minX > x1 - x0 || r.maxY - r.minY > y1 - y0) lo = d; else hi = d
    }
    const r = extent(hi)
    const dx = (x0 + x1) / 2 - (r.minX + r.maxX) / 2, dy = (y0 + y1) / 2 - (r.minY + r.maxY) / 2
    this.fitted = { key, dist: hi, target, sx: -dx / 2, sy: dy / 2 }
    return this.fitted
  }

  private placeCamera() {
    const f = FRAMING[this.opts.framing][this.aspect < 0.9 ? 'portrait' : 'landscape']
    const vw = this.view ?? f
    const a = (this.t / 15) * Math.PI * 2
    const { dist, target, sx, sy } = this.fit(vw)
    const base = new THREE.Vector3(...vw.dir).normalize().multiplyScalar(dist)
    base.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.04 * Math.sin(a) + 0.03 * this.pointer.x)
    base.y += dist * (0.01 * Math.cos(a) - 0.015 * this.pointer.y)
    this.camera.position.copy(target).add(base)
    this.camera.lookAt(target)
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
  }
}
