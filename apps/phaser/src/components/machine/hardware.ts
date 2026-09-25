/**
 * The PHASER bench assembly, modelled in millimetres at true scale around the simulated cavity (axis = +y, beam at x = z = 0).
 *
 *   y ≈ 25…31   end mirror: Ø6.35 mm concave (R 120 mm) dielectric mirror in a mini kinematic mount (two adjusters)
 *   y = 5…20    four etched fused-silica phase plates (5 × 5 × 1 mm, AR coated) held in 16 mm cage plates
 *   y = −10…0   gain crystal (3 × 3 × 10 mm); its top face carries the input/output coupler coating (5 %)
 *   y ≈ −22     OV3660 camera module (sensor board + lens holder) in a cage plate, looking up at the 5 % tap
 *   y ≈ −31     ESP32-S3 dev board (WROOM-1 module, 2 × USB-C, headers), fed by the camera's 24-pin FPC
 *
 * Two stainless rods (Ø3 mm, 16 mm apart) at the back carry every part; each phase plate sits in a slim anodised cell on a
 * cantilever arm, so the cavity stays open to view from the front. Standoffs hold the frame on the dev board.
 * Materials are physically based (anodised aluminium, stainless, fused silica with AR coatings, dielectric mirror, black
 * FR-4, gold pads, polyimide flex) and kept in the darkroom palette. The only red is the light itself.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { LENGTH, PLANE_Z } from '@/lib/phaser-sim'

const L = LENGTH * 1e3 // 25
export const PART_Y = {
  endMirror: L, plates: PLANE_Z.map((z) => z * 1e3), coupler: 0, crystalBottom: -10, camera: -22, board: -31.4,
}

const mats = () => ({
  anodised: new THREE.MeshStandardMaterial({ color: 0x2b2927, roughness: 0.5, metalness: 0.6 }),
  anodisedEdge: new THREE.MeshStandardMaterial({ color: 0x3a3734, roughness: 0.32, metalness: 0.8 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x9a968f, roughness: 0.28, metalness: 1 }),
  brass: new THREE.MeshStandardMaterial({ color: 0x8c8474, roughness: 0.35, metalness: 1 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xe6ecea, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false,
    iridescence: 0.6, iridescenceIOR: 1.38, iridescenceThicknessRange: [120, 260], // AR coating sheen
    clearcoat: 1, clearcoatRoughness: 0.02, side: THREE.DoubleSide,
  }),
  crystal: new THREE.MeshPhysicalMaterial({
    color: 0xd9dcd6, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1,
    iridescence: 0.5, iridescenceIOR: 1.4, iridescenceThicknessRange: [150, 300], side: THREE.DoubleSide,
  }),
  mirror: new THREE.MeshPhysicalMaterial({
    color: 0xd9d6cf, roughness: 0.06, metalness: 0.9, iridescence: 0.8, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 420],
  }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x121312, roughness: 0.6, metalness: 0.1 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xb59a5e, roughness: 0.3, metalness: 1 }),
  shield: new THREE.MeshStandardMaterial({ color: 0xb8b6b0, roughness: 0.32, metalness: 1 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.7, metalness: 0 }),
  ivory: new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.6, metalness: 0 }),
  flex: new THREE.MeshStandardMaterial({ color: 0x6e4a2a, roughness: 0.45, metalness: 0.25, side: THREE.DoubleSide }),
  lensGlass: new THREE.MeshPhysicalMaterial({ color: 0x1a1d22, roughness: 0.05, metalness: 0.2, clearcoat: 1, iridescence: 0.7, iridescenceThicknessRange: [200, 400] }),
})
type Mats = ReturnType<typeof mats>

/** a horizontal 20 × 20 mm cage plate (thickness t, top face at y) with four rod holes and a central bore */
function cagePlate(m: Mats, y: number, t: number, bore: number, size = 20) {
  // footprint: 20 wide, from z = −11 (behind the rods) to z = +size/2 (in front of the axis)
  const s = size / 2, r = 1.2, zb = -11
  const shape = new THREE.Shape()
  shape.moveTo(-s + r, zb); shape.lineTo(s - r, zb); shape.quadraticCurveTo(s, zb, s, zb + r); shape.lineTo(s, s - r)
  shape.quadraticCurveTo(s, s, s - r, s); shape.lineTo(-s + r, s); shape.quadraticCurveTo(-s, s, -s, s - r); shape.lineTo(-s, zb + r)
  shape.quadraticCurveTo(-s, zb, -s + r, zb)
  const hole = (x: number, z: number, rad: number) => { const h = new THREE.Path(); h.absarc(x, z, rad, 0, Math.PI * 2, true); return h }
  shape.holes.push(hole(0, 0, bore / 2), hole(8, -9, 1.55), hole(-8, -9, 1.55))
  const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2, curveSegments: 24 })
  geo.rotateX(Math.PI / 2) // extrude along −y
  const mesh = new THREE.Mesh(geo, m.anodised)
  mesh.position.y = y
  return mesh
}

function box(mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  b.position.set(x, y, z)
  return b
}
function cyl(mat: THREE.Material, r: number, h: number, x: number, y: number, z: number, seg = 32) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat)
  c.position.set(x, y, z)
  return c
}

/** a flat ribbon (the FPC) of width w along a smooth curve */
function ribbon(mat: THREE.Material, pts: THREE.Vector3[], w: number, across: THREE.Vector3) {
  const curve = new THREE.CatmullRomCurve3(pts)
  const n = 60, pos: number[] = [], idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n)
    const a = p.clone().addScaledVector(across, -w / 2), b = p.clone().addScaledVector(across, w / 2)
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z)
    if (i < n) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return new THREE.Mesh(g, mat)
}

/** a slim square cell around a 5 mm plate (1.2 mm wall, 1.4 mm tall) on an arm back to a clamp on the two rods */
function cell(m: Mats, y: number) {
  const c = new THREE.Group()
  const s = new THREE.Shape()
  s.moveTo(-3.7, -3.7); s.lineTo(3.7, -3.7); s.lineTo(3.7, 3.7); s.lineTo(-3.7, 3.7); s.lineTo(-3.7, -3.7)
  const h = new THREE.Path(); h.moveTo(-2.5, -2.5); h.lineTo(-2.5, 2.5); h.lineTo(2.5, 2.5); h.lineTo(2.5, -2.5); h.lineTo(-2.5, -2.5)
  s.holes.push(h)
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1 }), m.anodised)
  frame.geometry.rotateX(Math.PI / 2)
  frame.position.y = y + 0.7
  c.add(frame)
  c.add(box(m.anodised, 3, 1.4, 5.4, 0, y, -6.3)) // arm
  c.add(box(m.anodisedEdge, 20, 1.8, 3.2, 0, y, -9)) // rod clamp
  for (const x of [5, -5]) c.add(cyl(m.steel, 0.55, 1.9, x, y, -7.4, 12)) // clamp screws (heads)
  return c
}

export interface Assembly {
  group: THREE.Group
  /** the glass plates (for the renderer to draw the pixel faces on top) */
  plateFaceY: number[]
  bounds: THREE.Box3
}

export function buildAssembly(): Assembly {
  const m = mats()
  const g = new THREE.Group()
  const top = L

  // ── cage rods and the plates they carry ─────────────────────────────────────────────────────────────────────────────
  for (const x of [8, -8]) g.add(cyl(m.steel, 1.5, 58, x, 2, -9, 20))

  // ── end mirror in a mini kinematic mount ─────────────────────────────────────────────────────────────────────────────
  g.add(cagePlate(m, top + 5.5, 3, 5)) // fixed plate on the rods
  const front = cagePlate(m, top + 2.2, 2.2, 5, 18)
  front.material = m.anodisedEdge
  g.add(front)
  const mir = cyl(m.mirror, 3.175, 3, 0, top + 1.5, 0, 48)
  g.add(mir) // concave face at y = top, coating facing down into the cavity
  for (const [x, z] of [[6.2, 6.2], [-6.2, 6.2]]) {
    g.add(cyl(m.steel, 0.9, 7, x, top + 5, z, 16)) // adjuster screw
    g.add(cyl(m.anodisedEdge, 2.4, 3, x, top + 8.6, z, 24)) // knurled knob
  }
  g.add(cyl(m.steel, 0.9, 5, -6.2, top + 4.6, -6.2, 16)) // pivot ball screw

  // ── the phase plates in their cage plates ────────────────────────────────────────────────────────────────────────────
  const plateFaceY: number[] = []
  for (const y of PART_Y.plates) {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), m.glass)
    glass.position.y = y - 0.5 // etched face at y (top), 1 mm fused silica below
    glass.renderOrder = 4
    g.add(glass)
    plateFaceY.push(y)
    g.add(cell(m, y - 0.5))
  }

  // ── gain crystal with the coupler coating on its top face ──────────────────────────────────────────────────────────
  const crystal = box(m.crystal, 3, 10, 3, 0, -5, 0)
  crystal.renderOrder = 4
  g.add(crystal)
  const coat = box(m.mirror, 3.02, 0.06, 3.02, 0, -0.03, 0)
  ;(coat.material as THREE.MeshPhysicalMaterial) = m.mirror.clone()
  ;(coat.material as THREE.MeshPhysicalMaterial).transparent = true
  ;(coat.material as THREE.MeshPhysicalMaterial).opacity = 0.55
  g.add(coat)
  g.add(cagePlate(m, -6.5, 2, 3.4)) // crystal holder
  g.add(box(m.brass, 0.8, 2.4, 4.6, 1.9, -7.2, 0)) // clamp shoe

  // ── OV3660 camera module on its cage plate ─────────────────────────────────────────────────────────────────────────
  const cy = PART_Y.camera
  g.add(cagePlate(m, cy - 1.2, 2, 9.5))
  g.add(box(m.pcb, 8.5, 1, 8.5, 0, cy - 3, 0)) // sensor board, hanging under the plate
  g.add(box(m.gold, 1.2, 0.12, 1.2, 3.1, cy - 3.56, 3.1))
  const holder = cyl(m.plastic, 4, 5.5, 0, cy + 1.5, 0, 36) // lens holder (M8 barrel)
  g.add(holder)
  g.add(cyl(m.plastic, 3.2, 2, 0, cy + 5, 0, 36)) // lens barrel
  g.add(cyl(m.lensGlass, 2.1, 0.3, 0, cy + 6.05, 0, 36)) // front lens
  // FPC: 24-pin polyimide flex from the sensor board down to the dev board's connector
  const flex = ribbon(m.flex, [
    new THREE.Vector3(0, cy - 3.6, 4.3), new THREE.Vector3(0, cy - 4.2, 7.5), new THREE.Vector3(0, cy - 6.5, 9.5),
    new THREE.Vector3(0, cy - 8.4, 9.2), new THREE.Vector3(0, PART_Y.board + 1.2, 6.5), new THREE.Vector3(0, PART_Y.board + 1.05, 2.5),
  ], 7.5, new THREE.Vector3(1, 0, 0))
  g.add(flex)

  // ── ESP32-S3 dev board (DevKitC-1 class: 69 × 25.5 mm, WROOM-1, two USB-C) ───────────────────────────────────────────
  const by = PART_Y.board
  const board = new THREE.Group()
  board.add(box(m.pcb, 25.5, 1.6, 69, 0, by, 0))
  // WROOM-1 module: shielded can + PCB antenna tail
  board.add(box(m.pcb, 18, 0.8, 25.5, 0, by + 1.2, -18))
  board.add(box(m.shield, 15.8, 2.4, 17.6, 0, by + 2.4, -15.5))
  board.add(box(m.gold, 12, 0.05, 5.2, 0, by + 1.63, -28)) // antenna trace area
  // USB-C connectors at the far end
  for (const x of [-6.5, 6.5]) board.add(box(m.shield, 8.9, 3.2, 7.3, x, by + 2.4, 32.2))
  // FPC connector (receives the camera flex)
  board.add(box(m.ivory, 10, 1.4, 4, 0, by + 1.5, 2.5))
  board.add(box(m.plastic, 10, 0.6, 1.6, 0, by + 2.4, 1.3))
  // pin headers along both edges (22 each, 2.54 mm pitch)
  const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.64, 6, 0.64), m.gold, 44)
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(2.5, 2.5, 2.54), m.plastic, 44)
  const o = new THREE.Object3D()
  for (let s = 0; s < 2; s++) for (let k = 0; k < 22; k++) {
    const x = s ? 11.43 : -11.43, z = -26.7 + k * 2.54, i = s * 22 + k
    o.position.set(x, by - 2, z); o.updateMatrix(); pins.setMatrixAt(i, o.matrix)
    o.position.set(x, by - 2.1, z); o.updateMatrix(); bodies.setMatrixAt(i, o.matrix)
  }
  board.add(pins, bodies)
  // buttons, LED, regulator, a few passives
  for (const [x, z] of [[-8, 24.5], [8, 24.5]]) { board.add(box(m.shield, 3.5, 1.2, 3.5, x, by + 1.4, z)); board.add(cyl(m.plastic, 1, 0.6, x, by + 2.2, z, 16)) }
  board.add(box(m.plastic, 5, 1.2, 6, 5, by + 1.4, 15))
  board.add(box(m.plastic, 3, 1, 3, -5, by + 1.3, 12))
  for (let k = 0; k < 10; k++) board.add(box(k % 3 ? m.ivory : m.gold, 1, 0.5, 0.5, -9 + (k % 5) * 2.2, by + 1.05, 8 + Math.floor(k / 5) * 2.4))
  g.add(board)
  // standoffs from the camera's cage plate down to the board
  for (const [x, z] of [[8, 8], [-8, 8], [8, -8], [-8, -8]]) g.add(cyl(m.brass, 1.6, cy - 3.2 - by - 0.8, x, (cy - 3.2 + by + 0.8) / 2, z, 6))
  // rod clamps at the end-mirror mount, crystal holder and camera plate are the cage plates themselves

  const bounds = new THREE.Box3().setFromObject(g)
  return { group: mergeByMaterial(g), plateFaceY, bounds }
}

/** bake every plain mesh into one mesh per material (a dozen draw calls instead of ~90); instanced meshes stay as they are */
function mergeByMaterial(root: THREE.Group) {
  root.updateMatrixWorld(true)
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>()
  const keep: THREE.Object3D[] = []
  root.traverse((o) => {
    if ((o as THREE.InstancedMesh).isInstancedMesh) { keep.push(o); return }
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    let geo = m.geometry.clone().applyMatrix4(m.matrixWorld)
    if (geo.index) geo = geo.toNonIndexed()
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k)
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((geo.attributes.position.count) * 2), 2))
    const mat = m.material as THREE.Material
    ;(byMat.get(mat) ?? byMat.set(mat, []).get(mat)!).push(geo)
  })
  const out = new THREE.Group()
  for (const [mat, geos] of byMat) {
    const merged = new THREE.Mesh(mergeGeometries(geos, false)!, mat)
    if ((mat as THREE.MeshPhysicalMaterial).transparent) merged.renderOrder = 4
    out.add(merged)
  }
  for (const k of keep) { k.updateMatrixWorld(true); const c = k.clone(); c.matrix.copy(k.matrixWorld); c.matrixAutoUpdate = false; out.add(c) }
  return out
}

/** darkroom lighting: a dim warm key from above-left, a cool-neutral rim from behind, and very little fill */
export function addLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xece8df, 0x0a0908, 0.6))
  const key = new THREE.DirectionalLight(0xfff4e6, 3.2)
  key.position.set(-40, 80, 60)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xe9e5dc, 2)
  rim.position.set(50, 30, -70)
  scene.add(rim)
  // the circulating light is red and it does light up the parts right next to the beam
  const glow = new THREE.PointLight(0xff2a12, 30, 22, 2)
  glow.position.set(0, 12.5, 0)
  scene.add(glow)
}
