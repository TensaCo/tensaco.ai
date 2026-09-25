/**
 * The hero: the research ring at true proportions (mm), with the beam drawn from the simulated field.
 *
 * Every trip the simulator (src/lib/phaser-sim.ts, the research model) makes one round trip and hands back the angular
 * spectrum at the start of each free-space segment. The beam is a stack of translucent cross-sections every `spacing` mm
 * along the route; each is |E|² at that distance, propagated with the same angular-spectrum kernel the model uses. A
 * front sweeps the route once per trip: sections behind it show the new trip, sections ahead still show the last one.
 * Brightness is 1 − exp(−|E|²/I₀), a film-like exposure of the true intensity. The SLM panel shows its phase program in
 * graphite and the intensity landing on it in red, one texel per pixel.
 */
import * as THREE from 'three'
import { buildKernel, createField, slice, N, SLM_PHASE, DX, LENS } from '@/lib/phaser-sim'
import { LiveRing } from '@/lib/live'
import { at, ELEMENTS, physicalPowerFactor, segmentOf, type V3 } from './ring'

const RED = new THREE.Vector3(1.0, 0.165, 0.07)
const W = N * DX * 1e3 // window width, mm (1.28)
export const I0 = 0.4 // exposure: |E|² (field units) that reaches 63 % brightness

export interface RingOptions {
  canvas: HTMLCanvasElement
  width: number
  height: number
  dpr: number
  /** mm between beam cross-sections */
  spacing: number
  /** seconds per displayed round trip; 0 = the caller advances the simulation and calls refresh() */
  tripSeconds: number
  /** the simulation to draw (default: a new one this scene drives itself) */
  live?: LiveRing
  framing: 'hero' | 'overview'
}

export interface RingStatus { trip: number; step: number; u: number; tripInStep: number; gain: number }

const v = (a: V3) => new THREE.Vector3(a[0], a[1], a[2])

type View = { pos: V3; target: V3; shift: [number, number] }
/** cameras (mm). hero: a long lens 16 mm from the SLM, inside the ring; overview: the whole ring from above one corner */
const FRAMING: Record<'hero' | 'overview', { landscape: View; portrait: View }> = {
  hero: {
    landscape: { pos: [11, 5.5, 12], target: [20, 0, 0], shift: [-0.18, 0.1] },
    portrait: { pos: [9, 6.5, 17], target: [20, 0, 0], shift: [0, 0.1] },
  },
  overview: {
    landscape: { pos: [-62, 56, 136], target: [10, 0, 42], shift: [0, 0] },
    portrait: { pos: [-40, 110, 120], target: [10, 0, 42], shift: [0, 0] },
  },
}

export class RingScene {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly live: LiveRing
  private sheetS: number[] = []
  private sheetDone: Uint8Array
  private tex: THREE.DataArrayTexture
  private texData: Uint8Array
  private slmTex: THREE.DataTexture
  private slmData: Uint8Array
  private work = createField()
  private sliceI = new Float64Array(N * N)
  private progress = 0 // 0…1 through the displayed trip
  private opts: RingOptions
  private pointer = new THREE.Vector2()
  private t = 0
  private aspect = 1
  onTrip?: (s: RingStatus) => void

  constructor(opts: RingOptions) {
    this.opts = opts
    this.live = opts.live ?? new LiveRing(1234)
    const r = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
    if (!r.capabilities.isWebGL2) throw new Error('WebGL2 required')
    r.setClearColor(0x0a0908, 1)
    this.renderer = r
    this.camera = new THREE.PerspectiveCamera(22, 1, 0.5, 600)
    this.resize(opts.width, opts.height, opts.dpr)

    // ── beam: one instanced quad per cross-section, each sampling its own layer of an 8-bit array texture ──
    for (let s = opts.spacing / 2; s < 200; s += opts.spacing) this.sheetS.push(s)
    const S = this.sheetS.length
    this.sheetDone = new Uint8Array(S)
    this.texData = new Uint8Array(N * N * S)
    this.tex = new THREE.DataArrayTexture(this.texData, N, N, S)
    this.tex.format = THREE.RedFormat
    this.tex.type = THREE.UnsignedByteType
    this.tex.minFilter = this.tex.magFilter = THREE.LinearFilter
    this.tex.unpackAlignment = 1
    this.tex.needsUpdate = true
    const geo = new THREE.PlaneGeometry(W, W)
    const layer = new Float32Array(S)
    for (let k = 0; k < S; k++) layer[k] = k
    geo.setAttribute('aLayer', new THREE.InstancedBufferAttribute(layer, 1))
    const mat = new THREE.ShaderMaterial({
      uniforms: { uField: { value: this.tex }, uRed: { value: RED }, uGain: { value: opts.framing === 'hero' ? 0.45 : 0.9 } },
      vertexShader: /* glsl */ `
        attribute float aLayer;
        varying vec2 vUv; varying float vLayer; varying float vFacing;
        void main() {
          vUv = uv; vLayer = aLayer;
          vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vec3 n = normalize(mat3(modelViewMatrix) * mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0));
          vFacing = abs(dot(n, normalize(-mv.xyz)));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        precision highp sampler2DArray;
        uniform sampler2DArray uField; uniform vec3 uRed; uniform float uGain;
        varying vec2 vUv; varying float vLayer; varying float vFacing;
        void main() {
          float t = texture(uField, vec3(vUv, vLayer)).r;
          // seen edge-on a section covers a path through the beam; keep its exposure bounded
          float a = uGain * t * mix(1.6, 1.0, vFacing);
          gl_FragColor = vec4(uRed * a, 1.0);
        }`,
      transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    })
    const beam = new THREE.InstancedMesh(geo, mat, S)
    const o = new THREE.Object3D()
    this.sheetS.forEach((s, k) => {
      const { p, d } = at(s)
      o.position.set(p[0], p[1], p[2])
      o.lookAt(p[0] + d[0], p[1] + d[1], p[2] + d[2])
      o.updateMatrix()
      beam.setMatrixAt(k, o.matrix)
    })
    beam.frustumCulled = false
    beam.renderOrder = 2
    this.scene.add(beam)

    // ── the same sections as a continuous volume, ray-marched per leg, so a leg seen side-on still shows its beam ──
    const legs: [number, number][] = [[0, 80], [80, 100], [100, 180], [180, 200]]
    for (const [s0, s1] of legs) {
      const len = s1 - s0
      const box = new THREE.BoxGeometry(W, W, len)
      box.translate(0, 0, len / 2)
      const a = at(s0 + 0.001), o2 = new THREE.Object3D()
      o2.position.set(...a.p); o2.lookAt(a.p[0] + a.d[0], a.p[1] + a.d[1], a.p[2] + a.d[2]); o2.updateMatrixWorld()
      const m = new THREE.ShaderMaterial({
        uniforms: {
          uField: { value: this.tex }, uRed: { value: RED }, uInv: { value: o2.matrixWorld.clone().invert() },
          uS0: { value: s0 }, uLen: { value: len }, uSpacing: { value: opts.spacing }, uCount: { value: S }, uW: { value: W }, uDensity: { value: opts.framing === 'hero' ? 1.1 : 2.2 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          precision highp sampler2DArray;
          uniform sampler2DArray uField; uniform vec3 uRed; uniform mat4 uInv;
          uniform float uS0, uLen, uSpacing, uCount, uW, uDensity;
          varying vec3 vWorld;
          float sampleAt(vec3 p) {
            float lf = clamp((uS0 + p.z) / uSpacing - 0.5, 0.0, uCount - 1.0);
            float l0 = floor(lf);
            vec2 uv = p.xy / uW + 0.5;
            float a = texture(uField, vec3(uv, l0)).r, b = texture(uField, vec3(uv, min(l0 + 1.0, uCount - 1.0))).r;
            return mix(a, b, lf - l0);
          }
          void main() {
            vec3 ro = (uInv * vec4(cameraPosition, 1.0)).xyz;
            vec3 rd = normalize((uInv * vec4(vWorld, 1.0)).xyz - ro);
            vec3 lo = vec3(-0.5 * uW, -0.5 * uW, 0.0), hi = vec3(0.5 * uW, 0.5 * uW, uLen);
            vec3 inv = 1.0 / rd;
            vec3 t0 = (lo - ro) * inv, t1 = (hi - ro) * inv;
            vec3 tn = min(t0, t1), tf = max(t0, t1);
            float a = max(max(tn.x, tn.y), max(tn.z, 0.0)), b = min(min(tf.x, tf.y), tf.z);
            if (b <= a) discard;
            const int STEPS = 64;
            float dt = (b - a) / float(STEPS), acc = 0.0;
            for (int i = 0; i < STEPS; i++) acc += sampleAt(ro + rd * (a + (float(i) + 0.5) * dt));
            acc *= dt * uDensity;
            gl_FragColor = vec4(uRed * (1.0 - exp(-acc)), 1.0);
          }`,
        transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
      })
      const mesh = new THREE.Mesh(box, m)
      mesh.applyMatrix4(o2.matrixWorld)
      mesh.renderOrder = 2
      this.scene.add(mesh)
    }

    // ── the SLM: phase program (graphite) + intensity on it (red), one texel per pixel, dead-zone grid ──
    this.slmData = new Uint8Array(N * N * 4)
    this.slmTex = new THREE.DataTexture(this.slmData, N, N, THREE.RGBAFormat)
    this.slmTex.minFilter = THREE.LinearFilter
    this.slmTex.magFilter = THREE.NearestFilter
    this.slmTex.needsUpdate = true
    const slmMat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: this.slmTex } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(uMap, vUv).rgb;
          // inter-pixel dead zone: fill factor 0.93 → 3.5 % of the pitch per edge; fade out when a pixel is < 4 screen px
          vec2 g = vUv * 64.0; vec2 f = abs(fract(g) - 0.5);
          vec2 w = fwidth(g);
          float line = max(step(0.4825, f.x), step(0.4825, f.y));
          float vis = 1.0 - smoothstep(0.12, 0.3, max(w.x, w.y));
          c *= 1.0 - 0.55 * line * vis;
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: THREE.FrontSide,
    })
    const slmNormal = new THREE.Vector3(-1, 0, 1).normalize()
    const slmPos = v(at(0).p)
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(W, W), slmMat)
    panel.position.copy(slmPos)
    panel.lookAt(slmPos.clone().add(slmNormal))
    panel.renderOrder = 1
    this.scene.add(panel)

    this.scene.add(this.hardware(slmPos, slmNormal))
    if (this.live.step === 0) this.live.warm(60)
    this.refresh()
  }

  /** hairline drawings of the parts, at their real size and place */
  private hardware(slmPos: THREE.Vector3, slmNormal: THREE.Vector3) {
    const g = new THREE.Group()
    const line = (pts: THREE.Vector3[], opacity: number, loop = false) => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const m = new THREE.LineBasicMaterial({ color: 0xe9e5dc, transparent: true, opacity, depthWrite: false })
      g.add(loop ? new THREE.LineLoop(geo, m) : new THREE.Line(geo, m))
    }
    const circle = (s: number, R: number, opacity: number) => {
      const { p, d } = at(s)
      const o = new THREE.Object3D(); o.position.set(...p); o.lookAt(p[0] + d[0], p[1] + d[1], p[2] + d[2]); o.updateMatrix()
      const pts = Array.from({ length: 96 }, (_, i) => new THREE.Vector3(R * Math.cos((i / 96) * Math.PI * 2), R * Math.sin((i / 96) * Math.PI * 2), 0).applyMatrix4(o.matrix))
      line(pts, opacity, true)
    }
    const plate = (c: THREE.Vector3, normal: THREE.Vector3, w: number, h: number, t: number, opacity: number) => {
      const o = new THREE.Object3D(); o.position.copy(c); o.lookAt(c.clone().add(normal)); o.updateMatrix()
      const box = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, t))
      const m = new THREE.LineSegments(box, new THREE.LineBasicMaterial({ color: 0xe9e5dc, transparent: true, opacity, depthWrite: false }))
      m.applyMatrix4(o.matrix)
      g.add(m)
    }
    // route axis: a faint hairline so the sampled cross-sections read as one path
    const axis: THREE.Vector3[] = []
    for (let s = 0; s <= 200; s += 1) axis.push(v(at(s).p))
    line(axis, 0.07)
    // lenses: Ø 1.2 mm clear aperture, and a 2.5 mm mount ring
    for (const s of [ELEMENTS.lensR, ELEMENTS.lensL]) {
      circle(s, LENS.aperture / 2, 0.55)
      circle(s, 1.25, 0.22)
      circle(s + 0.6, 1.25, 0.12)
      circle(s - 0.6, 1.25, 0.12)
    }
    // corner optics at 45°
    const d45 = (a: V3, b: V3) => v(a).negate().add(v(b)).normalize()
    const corner = (s: number) => { const i = at(s - 0.01).d, o = at(s + 0.01).d; return d45(i, o) } // bisector normal
    plate(slmPos.clone().sub(slmNormal.clone().multiplyScalar(0.08)), slmNormal, 1.9, 1.6, 0.12, 0.14) // LCOS die around the active area
    plate(v(at(ELEMENTS.fold).p), corner(ELEMENTS.fold), 2.5, 2.5, 0.35, 0.4)
    plate(v(at(ELEMENTS.out).p), corner(ELEMENTS.out), 2.5, 2.5, 0.2, 0.3)
    plate(v(at(ELEMENTS.in).p), corner(ELEMENTS.in), 2.5, 2.5, 0.2, 0.3)
    // gain: a slab the beam passes through
    const gp = at(ELEMENTS.gain)
    plate(v(gp.p), v(gp.d), 2.0, 2.0, 3.0, 0.28)
    // the table: 5 mm hairline grid 6 mm below the beam
    const grid: THREE.Vector3[] = []
    for (let x = -30; x <= 50; x += 5) grid.push(new THREE.Vector3(x, -6, -30), new THREE.Vector3(x, -6, 110))
    for (let z = -30; z <= 110; z += 5) grid.push(new THREE.Vector3(-30, -6, z), new THREE.Vector3(50, -6, z))
    const gg = new THREE.BufferGeometry().setFromPoints(grid)
    g.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0xe9e5dc, transparent: true, opacity: 0.035, depthWrite: false })))
    return g
  }

  private nextTrip() {
    this.live.trip()
    this.paintSlm()
    this.sheetDone.fill(0)
    this.emit()
  }

  private emit() {
    const r = this.live.res
    this.onTrip?.({ trip: r.trip, step: this.live.step, u: r.u, tripInStep: r.tripInStep, gain: r.gain })
  }

  /** repaint every section and the SLM from the simulation's current trip */
  refresh() {
    this.paintSlm()
    for (let k = 0; k < this.sheetS.length; k++) this.paintSheet(k)
    this.tex.needsUpdate = true
    this.emit()
  }

  private kernels = new Map<number, ReturnType<typeof buildKernel>>()
  private paintSheet(k: number) {
    const s = this.sheetS[k]
    const { seg, z } = segmentOf(s)
    const key = Math.round(z * 1000)
    let kern = this.kernels.get(key)
    if (!kern) { kern = buildKernel(z * 1e-3); this.kernels.set(key, kern) }
    slice(this.live.spectra[seg], kern, this.work, this.sliceI)
    const f = physicalPowerFactor(s)
    const off = k * N * N
    for (let i = 0; i < N * N; i++) this.texData[off + i] = Math.round(255 * (1 - Math.exp((-this.sliceI[i] * f) / I0)))
    this.tex.addLayerUpdate(k)
    this.sheetDone[k] = 1
  }

  private paintSlm() {
    const pmax = Math.max(...SLM_PHASE)
    for (let i = 0; i < N * N; i++) {
      const g = 0.05 + 0.1 * (SLM_PHASE[i] / pmax) // graphite: phase is not light
      const t = 1 - Math.exp(-this.live.slmI[i] / (0.25 * I0))
      const r = g * (1 - t) + 1.0 * t, gg = g * (1 - t) + 0.165 * t, b = g * 0.97 * (1 - t) + 0.07 * t
      this.slmData[4 * i] = Math.round(255 * r); this.slmData[4 * i + 1] = Math.round(255 * gg)
      this.slmData[4 * i + 2] = Math.round(255 * b); this.slmData[4 * i + 3] = 255
    }
    this.slmTex.needsUpdate = true
  }

  setPointer(x: number, y: number) { this.pointer.set(x, y) }

  resize(w: number, h: number, dpr: number) {
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.aspect = w / Math.max(1, h)
    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
  }

  /** camera: a long lens close to the SLM corner, looking down the ring; slow 15 s drift + faint parallax */
  view: View | null = null
  private placeCamera() {
    const portrait = this.aspect < 0.9
    const drift = Math.sin((this.t / 15) * Math.PI * 2)
    const f = FRAMING[this.opts.framing][portrait ? 'portrait' : 'landscape']
    const base = v(this.view ? this.view.pos : f.pos)
    const target = v(this.view ? this.view.target : f.target)
    base.x += 0.9 * drift + 0.6 * this.pointer.x
    base.y += 0.4 * Math.cos((this.t / 15) * Math.PI * 2) - 0.35 * this.pointer.y
    this.camera.position.copy(base)
    this.camera.lookAt(target)
    // off-axis framing (a shifted lens): put the SLM where the layout wants it
    const [sx, sy] = this.view ? this.view.shift : f.shift
    this.camera.setViewOffset(1000, 1000 / this.aspect, sx * 1000, (sy * 1000) / this.aspect, 1000, 1000 / this.aspect)
  }

  /** advance display time by dt seconds (the front sweeps one route per `tripSeconds`) */
  frame(dt: number) {
    dt = Math.min(dt, 0.1)
    this.t += dt
    if (!this.opts.tripSeconds) { this.render(); return }
    this.progress += dt / this.opts.tripSeconds
    if (this.progress >= 1) {
      // finish any sections the front skipped, then start the next trip
      let dirty = false
      for (let k = 0; k < this.sheetS.length; k++) if (!this.sheetDone[k]) { this.paintSheet(k); dirty = true }
      if (dirty) this.tex.needsUpdate = true
      this.progress -= Math.floor(this.progress)
      this.nextTrip()
    }
    const front = this.progress * 200
    let dirty = false
    for (let k = 0; k < this.sheetS.length; k++) if (!this.sheetDone[k] && this.sheetS[k] <= front) { this.paintSheet(k); dirty = true }
    if (dirty) this.tex.needsUpdate = true
    this.render()
  }

  render() {
    this.placeCamera()
    this.renderer.render(this.scene, this.camera)
  }

  get front() { return this.progress * 200 }

  /** screen positions (CSS px, canvas-relative) of the parts, for HTML labels */
  anchors(): Record<keyof typeof ELEMENTS, { x: number; y: number; visible: boolean }> {
    const el = this.renderer.domElement
    const w = el.clientWidth, h = el.clientHeight
    const out = {} as Record<keyof typeof ELEMENTS, { x: number; y: number; visible: boolean }>
    for (const [k, s] of Object.entries(ELEMENTS) as [keyof typeof ELEMENTS, number][]) {
      const p = v(at(s).p)
      p.y += k === 'slm' ? 0.9 : 1.3
      p.project(this.camera)
      out[k] = { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h, visible: p.z < 1 && Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95 }
    }
    return out
  }

  dispose() {
    this.renderer.dispose()
    this.tex.dispose()
    this.slmTex.dispose()
  }
}
