/**
 * The PHASER bench assembly at true scale (millimetres), around the simulated cavity (axis = +y, beam at x = z = 0).
 *
 *   y ≈ 25…34   end mirror: Ø6.35 mm concave (R 120 mm) dielectric mirror in a 25.4 mm kinematic mount (2 × M3 adjusters)
 *   y = 5…20    four etched fused-silica phase plates (5 × 5 × 1 mm, AR coated) in slim anodised cells on cantilever arms
 *   y = −10…0   gain crystal (3 × 3 × 10 mm) whose top face is the input/output coupler coating (5 %); side-pumped by a
 *               TO-56 laser diode in a heatsink, wired to a small driver board on the rods
 *   y ≈ −22     OV3660 camera module (sensor board, M8 lens holder and barrel), 24-pin 0.5 mm-pitch FPC with stiffener
 *   y ≈ −31     ESP32-S3-DevKitC-1 (69 × 25.4 × 1.6 mm): WROOM-1 (18 × 25.5 × 3.1 mm, shield can + PCB antenna), two
 *               USB-C receptacles, BOOT/RST switches, SOT-223 LDO, USB-UART bridge, RGB LED, 0402/0603 passives,
 *               2 × 22 headers at 2.54 mm; a USB-C cable leaves the board, dupont leads run to the pump driver
 *
 * Rods: the 16 mm cage standard (Ø4 mm rods on 16 mm centres), two at the back so the cavity stays open to view.
 * Textures are drawn once on canvases (solder mask, copper traces, vias, ENIG pads, silkscreen; brushed shield can;
 * anodise grain; copper under polyimide). Static meshes are merged by material; pins and passives are instanced.
 * Palette: graphite-dominant darkroom. The only red is the light itself (and the glow it throws on the nearest parts).
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { LENGTH, PLANE_Z } from '@/lib/phaser-sim'

const L = LENGTH * 1e3 // 25
export const PART_Y = {
  endMirror: L, plates: PLANE_Z.map((z) => z * 1e3), coupler: 0, crystalBottom: -10, camera: -22, board: -31.4,
}
const ROD = { r: 2, x: 8, z: -9 } // 16 mm cage standard: Ø4 mm rods, 16 mm centres
const BOARD = { w: 25.4, l: 69, t: 1.6, y: PART_Y.board }

// ── procedural textures ───────────────────────────────────────────────────────────────────────────────────────────────
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, color = true) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  draw(cv.getContext('2d')!)
  const t = new THREE.CanvasTexture(cv)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
/** fine grain for anodised aluminium (roughness), tiling */
const grainTex = () => {
  const t = canvasTex(256, 256, (c) => {
    const r = rng(11), img = c.createImageData(256, 256)
    for (let i = 0; i < 256 * 256; i++) { const v = 150 + 50 * (r() - 0.5) + 20 * (r() - 0.5); img.data[4 * i] = img.data[4 * i + 1] = img.data[4 * i + 2] = v; img.data[4 * i + 3] = 255 }
    c.putImageData(img, 0, 0)
  }, false)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4)
  return t
}
/** turning marks: fine bands (roughness), repeated along a rod's length */
const turnedTex = () => {
  const t = canvasTex(64, 256, (c) => {
    const r = rng(9)
    for (let y = 0; y < 256; y++) { const v = 45 + 30 * r(); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(0, y, 64, 1) }
  }, false)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 6)
  return t
}
/** brushed finish: horizontal streaks (for the shield can), as colour and roughness */
const brushedTex = (label?: string[]) => canvasTex(512, 512, (c) => {
  const r = rng(5)
  c.fillStyle = '#b4b1aa'; c.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y++) { c.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,40,40'},${0.04 + 0.06 * r()})`; c.fillRect(0, y, 512, 1) }
  if (label) {
    c.fillStyle = 'rgba(40,40,40,0.75)'; c.font = '600 30px monospace'; c.textAlign = 'center'
    label.forEach((l, i) => c.fillText(l, 256, 190 + i * 44))
    c.strokeStyle = 'rgba(40,40,40,0.6)'; c.lineWidth = 3; c.strokeRect(200, 360, 112, 112) // QR-ish marking
    for (let i = 0; i < 40; i++) c.fillRect(206 + (i % 8) * 12, 366 + Math.floor(i / 8) * 20, r() < 0.5 ? 10 : 5, 8)
  }
})

/** BoxGeometry's top face maps u the other way round from how the marking is drawn */
const mirrorU = (t: THREE.Texture) => { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; return t }

/** Board layout (mm, board coordinates: x across −12.7…12.7, z along −34.5…34.5; WROOM at −z, USB at +z) */
const LAYOUT = {
  wroom: { x: 0, z: -21.75, w: 18, l: 25.5 },
  usb: [{ x: -6.2, z: 31.1, name: 'UART' }, { x: 6.2, z: 31.1, name: 'USB' }],
  buttons: [{ x: -9.2, z: 24.5, name: 'BOOT' }, { x: 9.2, z: 24.5, name: 'RST' }],
  ldo: { x: 3.2, z: 17 },
  bridge: { x: -4.8, z: 15.5 },
  rgb: { x: -8.6, z: 4.5 },
  pled: { x: 8.6, z: 20.5 },
  zif: { x: 0, z: 2.5 },
  passives: [] as { x: number; z: number; r: number; big: boolean }[],
}
{
  const r = rng(42)
  const spots: [number, number, number][] = [[0, 21, 2], [0, 9, 2.4], [6.5, 12, 1.4], [-7.5, 11, 1.4], [5.5, 25.5, 1.2], [-2, 27, 1.2], [8, 7, 1.2], [-8, 17, 1.2], [3, -6, 1.2], [-3, -6, 1.2]]
  for (const [cx, cz, s] of spots) for (let k = 0; k < 5; k++) {
    const rot = r() < 0.5 ? 0 : Math.PI / 2
    LAYOUT.passives.push({ x: cx + (k - 2) * s * 0.9, z: cz + (r() - 0.5) * s, r: rot, big: r() < 0.3 })
  }
}
const PX = 16 // texture px per mm on the board
const bx = (x: number) => (x + BOARD.w / 2) * PX, bz = (z: number) => (z + BOARD.l / 2) * PX

/** the dev board's top: black solder mask, copper traces under it, vias, ENIG pads, white silkscreen */
const boardTex = () => canvasTex(BOARD.w * PX, BOARD.l * PX, (c) => {
  const r = rng(3)
  c.fillStyle = '#0d0f0e'; c.fillRect(0, 0, BOARD.w * PX, BOARD.l * PX)
  // traces (copper under mask reads slightly lighter), Manhattan routes from parts to the headers
  c.strokeStyle = '#1b1f1c'; c.lineCap = 'square'
  for (let k = 0; k < 70; k++) {
    c.lineWidth = r() < 0.2 ? 8 : 3
    let x = (r() - 0.5) * 20, z = -8 + r() * 38
    c.beginPath(); c.moveTo(bx(x), bz(z))
    for (let s = 0; s < 3; s++) {
      if (s % 2 === 0) x = r() < 0.5 ? -11.43 + (r() < 0.5 ? 0 : 22.86) : x + (r() - 0.5) * 8
      else z += (r() - 0.5) * 10
      x = Math.max(-11.5, Math.min(11.5, x)); z = Math.max(-8, Math.min(33, z))
      c.lineTo(bx(x), bz(z))
    }
    c.stroke()
  }
  // ground pour hatching near the module keep-out edge
  c.fillStyle = '#151816'; c.fillRect(bx(-12.2), bz(-8.4), 24.4 * PX, 2 * PX)
  // vias
  for (let k = 0; k < 90; k++) {
    const x = (r() - 0.5) * 22, z = -7 + r() * 38
    c.fillStyle = '#8a7648'; c.beginPath(); c.arc(bx(x), bz(z), 0.3 * PX, 0, Math.PI * 2); c.fill()
    c.fillStyle = '#060706'; c.beginPath(); c.arc(bx(x), bz(z), 0.14 * PX, 0, Math.PI * 2); c.fill()
  }
  // ENIG pads: header rings, passives, ICs, USB, buttons, ZIF
  const gold = '#b99d62'
  c.fillStyle = gold
  for (let k = 0; k < 22; k++) for (const x of [-11.43, 11.43]) { const z = -26.67 + k * 2.54; c.beginPath(); c.arc(bx(x), bz(z), 0.85 * PX, 0, Math.PI * 2); c.fill() }
  c.fillStyle = '#050505'
  for (let k = 0; k < 22; k++) for (const x of [-11.43, 11.43]) { const z = -26.67 + k * 2.54; c.beginPath(); c.arc(bx(x), bz(z), 0.5 * PX, 0, Math.PI * 2); c.fill() }
  c.fillStyle = gold
  for (const p of LAYOUT.passives) {
    const L = p.big ? 1.6 : 1.0, W = p.big ? 0.8 : 0.5
    const [dx, dz] = p.r ? [0, L / 2] : [L / 2, 0]
    for (const s of [-1, 1]) c.fillRect(bx(p.x + s * dx - (p.r ? W / 2 : 0.25)), bz(p.z + s * dz - (p.r ? 0.25 : W / 2)), (p.r ? W : 0.5) * PX, (p.r ? 0.5 : W) * PX)
  }
  const pad = (x: number, z: number, w: number, l: number) => c.fillRect(bx(x - w / 2), bz(z - l / 2), w * PX, l * PX)
  for (let k = 0; k < 3; k++) pad(LAYOUT.ldo.x - 2.3 + k * 2.3, LAYOUT.ldo.z + 3.1, 0.9, 1.6)
  pad(LAYOUT.ldo.x, LAYOUT.ldo.z - 3.1, 3.4, 1.8)
  for (let k = 0; k < 6; k++) { pad(LAYOUT.bridge.x - 2.3, LAYOUT.bridge.z - 1.25 + k * 0.5, 0.6, 0.25); pad(LAYOUT.bridge.x + 2.3, LAYOUT.bridge.z - 1.25 + k * 0.5, 0.6, 0.25) }
  for (let k = 0; k < 24; k++) pad(LAYOUT.zif.x - 5.75 + k * 0.5, LAYOUT.zif.z - 1.9, 0.28, 1)
  // silkscreen
  c.strokeStyle = 'rgba(222,218,208,0.85)'; c.fillStyle = 'rgba(222,218,208,0.85)'; c.lineWidth = 2
  const outline = (x: number, z: number, w: number, l: number) => c.strokeRect(bx(x - w / 2), bz(z - l / 2), w * PX, l * PX)
  for (const b of LAYOUT.buttons) outline(b.x, b.z, 4.4, 3.4)
  for (const u of LAYOUT.usb) outline(u.x, u.z, 9.6, 7.8)
  outline(LAYOUT.ldo.x, LAYOUT.ldo.z, 7.2, 7.6); outline(LAYOUT.bridge.x, LAYOUT.bridge.z, 4.6, 4.6); outline(LAYOUT.rgb.x, LAYOUT.rgb.z, 5.8, 5.8)
  outline(LAYOUT.zif.x, LAYOUT.zif.z, 16.8, 5)
  c.font = `600 ${1.2 * PX}px monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'
  const text = (s: string, x: number, z: number, rot = 0, size = 1.2) => {
    c.save(); c.translate(bx(x), bz(z)); c.rotate(rot); c.font = `600 ${size * PX}px monospace`; c.fillText(s, 0, 0); c.restore()
  }
  for (const b of LAYOUT.buttons) text(b.name, b.x, b.z - 2.6, 0, 0.9)
  for (const u of LAYOUT.usb) text(u.name, u.x, u.z - 4.8, 0, 0.9)
  text('ESP32-S3-DevKitC-1', 0, 27.5, 0, 1.1); text('v1.1', 0, 29, 0, 0.8)
  text('CAM', LAYOUT.zif.x - 10, LAYOUT.zif.z, -Math.PI / 2, 0.8)
  text('RGB', LAYOUT.rgb.x + 3.6, LAYOUT.rgb.z, -Math.PI / 2, 0.7)
  const left = ['3V3', '3V3', 'RST', '4', '5', '6', '7', '15', '16', '17', '18', '8', '3', '46', '9', '10', '11', '12', '13', '14', '5V', 'G']
  const right = ['G', 'TX', 'RX', '1', '2', '42', '41', '40', '39', '38', '37', '36', '35', '0', '45', '48', '47', '21', '20', '19', 'G', 'G']
  left.forEach((s, k) => text(s, -9.1, -26.67 + k * 2.54, 0, 0.72)); right.forEach((s, k) => text(s, 9.1, -26.67 + k * 2.54, 0, 0.72))
  // board edge highlight (the FR-4 edge reads lighter on black boards)
  c.strokeStyle = 'rgba(60,62,58,1)'; c.lineWidth = 3; c.strokeRect(1, 1, BOARD.w * PX - 2, BOARD.l * PX - 2)
})

/** the WROOM-1 module's own PCB (antenna meander in copper under the mask) */
const moduleTex = () => canvasTex(18 * PX, 6.5 * PX, (c) => {
  c.fillStyle = '#0c0d0c'; c.fillRect(0, 0, 18 * PX, 6.5 * PX)
  c.strokeStyle = '#1e211e'; c.lineWidth = 0.5 * PX
  c.beginPath(); let x = 2 * PX; c.moveTo(x, 5.5 * PX)
  for (let k = 0; k < 7; k++) { c.lineTo(x, 1 * PX); x += 1 * PX; c.lineTo(x, 1 * PX); c.lineTo(x, 5 * PX); x += 1 * PX; c.lineTo(x, 5 * PX) }
  c.stroke()
})

/** the camera flex: amber polyimide over 24 copper traces at 0.5 mm pitch (u across, v along) */
const flexTex = () => canvasTex(256, 512, (c) => {
  c.fillStyle = '#5c3a1c'; c.fillRect(0, 0, 256, 512)
  const pitch = 256 / 26
  for (let k = 1; k <= 24; k++) { c.fillStyle = 'rgba(176,122,70,0.9)'; c.fillRect(k * pitch + pitch * 0.3, 0, pitch * 0.4, 512) }
  c.fillStyle = 'rgba(255,230,190,0.08)'; c.fillRect(0, 0, 256, 512)
})

// ── materials ───────────────────────────────────────────────────────────────────────────────────────────────────────
const mats = () => {
  const grain = grainTex()
  return {
    anodised: new THREE.MeshStandardMaterial({ color: 0x292725, roughness: 0.62, roughnessMap: grain, metalness: 0.55, bumpMap: grain, bumpScale: 0.02 }),
    anodisedEdge: new THREE.MeshStandardMaterial({ color: 0x3a3734, roughness: 0.4, roughnessMap: grain, metalness: 0.8 }),
    // machined steel: fine turning marks around the rod, as a roughness map stretched along it (cheaper than true anisotropy)
    steel: new THREE.MeshStandardMaterial({ color: 0xa19d95, roughness: 1, roughnessMap: turnedTex(), metalness: 1 }),
    brass: new THREE.MeshStandardMaterial({ color: 0x8a8272, roughness: 0.35, metalness: 1 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xe6ecea, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false,
      iridescence: 0.65, iridescenceIOR: 1.38, iridescenceThicknessRange: [120, 260], // AR coating: a faint violet-green sheen
      clearcoat: 1, clearcoatRoughness: 0.02, side: THREE.DoubleSide,
    }),
    crystal: new THREE.MeshPhysicalMaterial({
      color: 0xd9dcd6, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1,
      iridescence: 0.5, iridescenceIOR: 1.4, iridescenceThicknessRange: [150, 300], side: THREE.DoubleSide,
    }),
    mirror: new THREE.MeshPhysicalMaterial({ color: 0xd8d5ce, roughness: 0.04, metalness: 0.95, iridescence: 0.8, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 420] }),
    coating: new THREE.MeshPhysicalMaterial({ color: 0xd8d5ce, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.55, iridescence: 0.8, iridescenceThicknessRange: [200, 420] }),
    fr4: new THREE.MeshStandardMaterial({ color: 0x151614, roughness: 0.7, metalness: 0 }),
    boardTop: new THREE.MeshStandardMaterial({ map: boardTex(), roughness: 0.55, metalness: 0.15 }),
    moduleTop: new THREE.MeshStandardMaterial({ map: moduleTex(), roughness: 0.55, metalness: 0.1 }),
    can: new THREE.MeshStandardMaterial({ map: mirrorU(brushedTex(['ESP32-S3-WROOM-1', 'N16R8', 'FCC ID 2AC7Z-ESPS3WROOM1'])), roughness: 0.35, metalness: 1 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xbfa062, roughness: 0.28, metalness: 1 }),
    tin: new THREE.MeshStandardMaterial({ color: 0xc9c7c1, roughness: 0.3, metalness: 1 }),
    shell: new THREE.MeshStandardMaterial({ color: 0xbdbab3, roughness: 0.3, metalness: 1 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.65, metalness: 0 }),
    ic: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.45, metalness: 0.05 }),
    ceramic: new THREE.MeshStandardMaterial({ color: 0x6f6658, roughness: 0.6, metalness: 0 }),
    ivory: new THREE.MeshStandardMaterial({ color: 0xa39c90, roughness: 0.6, metalness: 0 }),
    ledBody: new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.3, metalness: 0, transparent: true, opacity: 0.9 }),
    flex: new THREE.MeshStandardMaterial({ map: flexTex(), roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide }),
    wireA: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.55, metalness: 0 }),
    wireB: new THREE.MeshStandardMaterial({ color: 0x8e8a82, roughness: 0.55, metalness: 0 }),
    wireC: new THREE.MeshStandardMaterial({ color: 0x4a4844, roughness: 0.55, metalness: 0 }),
    cable: new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.75, metalness: 0 }),
    lensGlass: new THREE.MeshPhysicalMaterial({ color: 0x15181c, roughness: 0.04, metalness: 0.2, clearcoat: 1, iridescence: 0.8, iridescenceThicknessRange: [200, 400] }),
  }
}
type Mats = ReturnType<typeof mats>

// ── geometry helpers ─────────────────────────────────────────────────────────────────────────────────────────────────
function box(mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, round = 0) {
  const b = new THREE.Mesh(round ? new RoundedBoxGeometry(w, h, d, 2, round) : new THREE.BoxGeometry(w, h, d), mat)
  b.position.set(x, y, z)
  return b
}
function cyl(mat: THREE.Material, r: number, h: number, x: number, y: number, z: number, seg = 32, rTop = r) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat)
  c.position.set(x, y, z)
  return c
}
/** a horizontal plate with a rounded footprint from z0 to z1, width w, thickness t (top at y), central bore and rod holes */
function plate(mat: THREE.Material, y: number, t: number, bore: number, w: number, z0: number, z1: number) {
  const s = w / 2, r = 1.5
  const shape = new THREE.Shape()
  shape.moveTo(-s + r, z0); shape.lineTo(s - r, z0); shape.quadraticCurveTo(s, z0, s, z0 + r); shape.lineTo(s, z1 - r)
  shape.quadraticCurveTo(s, z1, s - r, z1); shape.lineTo(-s + r, z1); shape.quadraticCurveTo(-s, z1, -s, z1 - r); shape.lineTo(-s, z0 + r)
  shape.quadraticCurveTo(-s, z0, -s + r, z0)
  const hole = (x: number, z: number, rad: number) => { const h = new THREE.Path(); h.absarc(x, z, rad, 0, Math.PI * 2, true); return h }
  if (bore > 0 && z0 < -bore / 2 && z1 > bore / 2) shape.holes.push(hole(0, 0, bore / 2))
  if (z0 < ROD.z - ROD.r && z1 > ROD.z + ROD.r) shape.holes.push(hole(ROD.x, ROD.z, ROD.r + 0.05), hole(-ROD.x, ROD.z, ROD.r + 0.05))
  const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 2, curveSegments: 24 })
  geo.rotateX(Math.PI / 2)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = y
  return mesh
}
/** a wire or cable: a tube along a smooth curve through the given points */
function tube(mat: THREE.Material, pts: THREE.Vector3[], r: number, seg = 80) {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), seg, r, 10, false), mat)
}
/** a flat ribbon (the FPC) of width w along a smooth curve, uv: u across, v along */
function ribbon(mat: THREE.Material, pts: THREE.Vector3[], w: number, across: THREE.Vector3) {
  const curve = new THREE.CatmullRomCurve3(pts)
  const n = 80, pos: number[] = [], uv: number[] = [], idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n)
    const a = p.clone().addScaledVector(across, -w / 2), b = p.clone().addScaledVector(across, w / 2)
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z); uv.push(0, i / n, 1, i / n)
    if (i < n) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx); g.computeVertexNormals()
  return new THREE.Mesh(g, mat)
}
/** a catenary-like sag between two points: the midpoint drops by `sag` */
const sagged = (a: THREE.Vector3, b: THREE.Vector3, sag: number, n = 6) =>
  Array.from({ length: n + 1 }, (_, i) => { const t = i / n; const p = a.clone().lerp(b, t); p.y -= sag * 4 * t * (1 - t); return p })

/** a plate cell: 5 mm fused-silica plate in a slim square cell on an arm, clamped to the two rods with M2 screws */
function cell(m: Mats, y: number) {
  const c = new THREE.Group()
  const s = new THREE.Shape()
  s.moveTo(-3.7, -3.7); s.lineTo(3.7, -3.7); s.lineTo(3.7, 3.7); s.lineTo(-3.7, 3.7); s.lineTo(-3.7, -3.7)
  const h = new THREE.Path(); h.moveTo(-2.55, -2.55); h.lineTo(-2.55, 2.55); h.lineTo(2.55, 2.55); h.lineTo(2.55, -2.55); h.lineTo(-2.55, -2.55)
  s.holes.push(h)
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1 }), m.anodised)
  frame.geometry.rotateX(Math.PI / 2)
  frame.position.y = y + 0.7
  c.add(frame)
  c.add(box(m.anodised, 3, 1.4, 4.4, 0, y, -5.8, 0.3)) // arm
  c.add(plate(m.anodisedEdge, y + 1.1, 2.2, 0, 22, -12.2, -6.8)) // rod clamp
  for (const x of [4.5, -4.5]) c.add(cyl(m.steel, 0.9, 0.9, x, y + 1.55, -9.5, 16)) // M2 cap screws
  return c
}

export interface Assembly {
  group: THREE.Group
  plateFaceY: number[]
  /** bounds of the assembly for framing (cables that leave the frame are excluded) */
  bounds: THREE.Box3
}

export function buildAssembly(): Assembly {
  const m = mats()
  const g = new THREE.Group()
  const nofit: THREE.Object3D[] = []
  const top = L

  // ── rods ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  for (const x of [ROD.x, -ROD.x]) {
    g.add(cyl(m.steel, ROD.r, 62, x, 2.6, ROD.z, 28))
    g.add(cyl(m.steel, ROD.r - 0.25, 0.5, x, 33.85, ROD.z, 28)) // chamfered ends
  }

  // ── end mirror in a 25.4 mm kinematic mount (fixed plate + spring-loaded front plate, two M3 adjusters) ───────────
  g.add(plate(m.anodised, top + 9.4, 6.35, 7, 25.4, -12.7, 12.7))
  g.add(plate(m.anodisedEdge, top + 2.6, 2.5, 5.6, 22, -8.5, 11))
  g.add(cyl(m.anodised, 4.3, 2.4, 0, top + 1.2, 0, 48)) // mirror cell
  g.add(cyl(m.mirror, 3.175, 0.4, 0, top + 0.05, 0, 48)) // coated face (concave, R 120 mm: sag 0.04 mm)
  for (const [x, z] of [[8.5, 8.5], [-8.5, 8.5]]) {
    g.add(cyl(m.steel, 1.5, 10, x, top + 5.6, z, 20)) // M3 adjuster
    const knob = cyl(m.anodisedEdge, 4, 4, x, top + 12.5, z, 40) // knurled knob
    g.add(knob)
    g.add(cyl(m.anodised, 3.2, 0.6, x, top + 14.8, z, 40))
  }
  g.add(cyl(m.steel, 1.5, 8, -8.5, top + 5, -8.5, 20)) // pivot
  for (const x of [5, -5]) g.add(cyl(m.brass, 0.6, 5, x, top + 5.7, 9.8, 10)) // return springs

  // ── the phase plates ──────────────────────────────────────────────────────────────────────────────────────────────
  const plateFaceY: number[] = []
  for (const y of PART_Y.plates) {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), m.glass)
    glass.position.y = y - 0.5
    g.add(glass)
    plateFaceY.push(y)
    g.add(cell(m, y - 0.5))
  }

  // ── gain crystal (coupler coating on top), side-pumped by a TO-56 diode in a heatsink ─────────────────────────────
  g.add(box(m.crystal, 3, 10, 3, 0, -5, 0))
  g.add(box(m.coating, 3.02, 0.06, 3.02, 0, -0.03, 0))
  g.add(plate(m.anodised, -6.2, 3, 3.4, 22, -12.2, 6))
  g.add(box(m.brass, 0.8, 2.6, 4.6, -1.9, -7.4, 0)) // clamp shoe
  const dy = -2.2 // diode axis height: pumps the crystal from the side through a bore in its heatsink
  g.add(box(m.anodised, 8, 8, 8, 6.2, dy, 0, 0.4)) // heatsink block on the holder
  for (let k = 0; k < 4; k++) g.add(box(m.anodised, 8, 6, 0.8, 6.2, dy, 4.4 + k * 1.6)) // fins
  const can = cyl(m.shell, 2.8, 3.6, 11.9, dy, 0, 32) // TO-56 can, window facing the crystal
  can.rotation.z = Math.PI / 2; g.add(can)
  const flange = cyl(m.gold, 2.8, 1.1, 13.9, dy, 0, 32); flange.rotation.z = Math.PI / 2; g.add(flange)
  for (const dz of [-1, 0, 1]) { const leg = cyl(m.tin, 0.23, 4, 16.3, dy, dz * 1.27, 8); leg.rotation.z = Math.PI / 2; g.add(leg) }

  // ── pump driver board on the rods, dupont leads to the dev board, the diode lead ──────────────────────────────────
  const drv = new THREE.Group()
  drv.add(box(m.fr4, 14, 1.6, 12, 0, 0, 0))
  drv.add(box(m.ic, 2.9, 1.2, 1.6, -2, 1.1, -1.5)) // SOT-23-5 regulator
  drv.add(box(m.ic, 4, 2.2, 4, 3, 1.9, 1.5, 0.3)) // power inductor
  drv.add(box(m.plastic, 5.1, 2.5, 2.5, -2.5, 2, 4)) // 2-pin header housing
  drv.add(box(m.plastic, 7.6, 2.5, 2.5, 0, -2, -4.7)) // 3-pin header (to the dev board)
  drv.rotation.x = Math.PI / 2
  drv.position.set(0, -14.5, ROD.z - 3.4)
  g.add(drv)
  g.add(tube(m.wireA, [new THREE.Vector3(16.3, dy, 1.27), new THREE.Vector3(19, dy - 0.4, 1.2), new THREE.Vector3(18, -10, -6), new THREE.Vector3(6, -13.5, -12.5), new THREE.Vector3(-2.5, -12.5, -13.5)], 0.45))
  g.add(tube(m.wireB, [new THREE.Vector3(16.3, dy, -1.27), new THREE.Vector3(19.4, dy - 0.8, -1.4), new THREE.Vector3(18.4, -10.6, -7), new THREE.Vector3(6.2, -14.2, -12.7), new THREE.Vector3(-3.5, -12.5, -13.5)], 0.45))
  // dupont leads from the driver's 3-pin header down to 3V3 / GND / GPIO on the dev board's headers (female housings on the pins)
  const by = BOARD.y
  const top0 = by + BOARD.t / 2
  const pinTop = top0 + 2.5 // top of the header spacers
  const drvPins = [-2.54, 0, 2.54].map((dx) => new THREE.Vector3(dx, -18.2, ROD.z - 3.4 + 4.7))
  const hdr = [[11.43, 26.67], [11.43, 24.13], [11.43, 21.59]].map(([x, z]) => [-x, -z]) as [number, number][] // 3V3-side pins, world coords
  ;[m.wireA, m.wireB, m.wireC].forEach((mat, i) => {
    const [hx, hz] = hdr[i]
    const end = new THREE.Vector3(hx, pinTop + 14, hz)
    g.add(box(m.plastic, 2.54, 14, 2.54, hx, pinTop + 7, hz)) // female housing on the pin
    g.add(tube(mat, [drvPins[i].clone().setY(drvPins[i].y - 1), drvPins[i].clone().add(new THREE.Vector3(-2 - i, -4, -2)), new THREE.Vector3(hx - 3 + i, pinTop + 22, hz + 6), new THREE.Vector3(hx, pinTop + 18, hz + 0.5), end], 0.55))
    g.add(box(m.plastic, 2.54, 12, 2.54, drvPins[i].x, drvPins[i].y + 4, drvPins[i].z + 0.3)) // housing on the driver pin
  })

  // ── OV3660 module: sensor board, M8 lens holder, barrel and lens; 24-pin FPC with stiffener to the ZIF ────────────
  const cy = PART_Y.camera
  g.add(plate(m.anodised, cy - 1.2, 2.2, 10, 22, -12.2, 11))
  g.add(box(m.fr4, 8.5, 1, 8.5, 0, cy - 3.9, 0))
  g.add(box(m.ic, 5.8, 0.9, 5.8, 0, cy - 2.9, 0)) // sensor package (under the holder)
  g.add(box(m.plastic, 8.3, 2.6, 8.3, 0, cy + 0.1, 0, 0.4)) // holder base
  g.add(cyl(m.plastic, 4, 4.2, 0, cy + 3.5, 0, 40)) // M8 threaded holder
  g.add(cyl(m.plastic, 3.5, 3.4, 0, cy + 7, 0, 60)) // barrel
  for (let k = 0; k < 6; k++) g.add(cyl(m.ic, 3.62, 0.25, 0, cy + 5.6 + k * 0.5, 0, 60)) // knurl rings
  g.add(cyl(m.lensGlass, 2.3, 0.3, 0, cy + 8.75, 0, 40))
  const flexPts = [
    new THREE.Vector3(0, cy - 4.45, 4.25), new THREE.Vector3(0, cy - 4.8, 6.6), new THREE.Vector3(0, cy - 6.6, 7.6),
    new THREE.Vector3(0, by + 3, 5.2), new THREE.Vector3(0, by + 1.5, 2.2), new THREE.Vector3(0, by + 1.35, -LAYOUT.zif.z + 1.6),
  ]
  g.add(ribbon(m.flex, flexPts, 12.5, new THREE.Vector3(1, 0, 0)))
  g.add(box(m.fr4, 12.5, 0.3, 3.2, 0, by + 1.5, -LAYOUT.zif.z + 3.2)) // stiffener at the connector end

  // ── ESP32-S3-DevKitC-1 (turned 180°: USB-C and its cable at the back, the WROOM antenna at the front) ────────────
  const bgp = new THREE.Group()
  bgp.rotation.y = Math.PI
  g.add(bgp)
  bgp.add(box(m.fr4, BOARD.w, BOARD.t, BOARD.l, 0, by, 0))
  const topFace = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.l).rotateX(-Math.PI / 2), m.boardTop)
  topFace.position.set(0, top0 + 0.01, 0)
  bgp.add(topFace)
  // WROOM-1: module PCB (0.8), shield can (to 3.1 total), antenna tail with the meander
  const W = LAYOUT.wroom
  bgp.add(box(m.fr4, W.w, 0.8, W.l, W.x, top0 + 0.4, W.z))
  const modTop = new THREE.Mesh(new THREE.PlaneGeometry(W.w, 6.5).rotateX(-Math.PI / 2), m.moduleTop)
  modTop.position.set(W.x, top0 + 0.81, W.z - W.l / 2 + 3.25)
  bgp.add(modTop)
  bgp.add(box(m.can, 16.6, 2.3, 17.6, W.x, top0 + 0.8 + 1.15, W.z + 3.2, 0.25))
  for (let k = 0; k < 13; k++) for (const s of [-1, 1]) bgp.add(box(m.gold, 0.9, 0.12, 0.5, W.x + s * 8.75, top0 + 0.06, W.z + 3.2 - 8.4 + k * 1.27)) // castellations
  // USB-C receptacles (8.94 × 3.26 × 7.35) at the +z edge
  for (const u of LAYOUT.usb) {
    bgp.add(box(m.shell, 8.94, 3.26, 7.35, u.x, top0 + 1.63, u.z, 1.2))
    bgp.add(box(m.plastic, 7.8, 1.1, 0.2, u.x, top0 + 1.63, u.z + 3.7)) // the opening
  }
  // BOOT / RST tactile switches (4 × 3 × 2)
  for (const b of LAYOUT.buttons) { bgp.add(box(m.shell, 4, 1.6, 3, b.x, top0 + 0.8, b.z, 0.1)); bgp.add(box(m.plastic, 1.6, 0.6, 1.2, b.x, top0 + 1.9, b.z)) }
  // SOT-223 LDO: body 6.5 × 3.5 × 1.6, tab and three legs
  const ldo = LAYOUT.ldo
  bgp.add(box(m.ic, 6.5, 1.6, 3.5, ldo.x, top0 + 0.95, ldo.z + 0.6))
  bgp.add(box(m.tin, 3, 0.25, 1.5, ldo.x, top0 + 0.2, ldo.z - 1.9))
  for (let k = 0; k < 3; k++) bgp.add(box(m.tin, 0.7, 0.25, 1.6, ldo.x - 2.3 + k * 2.3, top0 + 0.2, ldo.z + 3))
  // USB-UART bridge (QFN 4 × 4) and the RGB LED (5 × 5)
  bgp.add(box(m.ic, 4, 0.85, 4, LAYOUT.bridge.x, top0 + 0.45, LAYOUT.bridge.z))
  bgp.add(box(m.ledBody, 5, 1.6, 5, LAYOUT.rgb.x, top0 + 0.8, LAYOUT.rgb.z))
  bgp.add(box(m.plastic, 1.6, 0.5, 0.8, LAYOUT.pled.x, top0 + 0.25, LAYOUT.pled.z)) // power LED (off)
  // camera ZIF connector (24-pin 0.5 mm)
  bgp.add(box(m.ivory, 16, 1.2, 3.8, LAYOUT.zif.x, top0 + 0.6, LAYOUT.zif.z))
  bgp.add(box(m.plastic, 16, 0.5, 1.5, LAYOUT.zif.x, top0 + 1.45, LAYOUT.zif.z - 1.2))
  // passives: 0402 / 0603 bodies and tinned end caps (instanced)
  const P = LAYOUT.passives
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m.ceramic, P.length)
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m.tin, P.length * 2)
  const o = new THREE.Object3D()
  P.forEach((p, i) => {
    const Lp = p.big ? 1.6 : 1.0, Wp = p.big ? 0.8 : 0.5, Hp = p.big ? 0.8 : 0.35
    o.rotation.set(0, p.r, 0); o.scale.set(Lp * 0.6, Hp, Wp); o.position.set(p.x, top0 + Hp / 2, p.z); o.updateMatrix(); bodies.setMatrixAt(i, o.matrix)
    for (const s of [-1, 1]) {
      o.scale.set(Lp * 0.2, Hp * 1.02, Wp * 1.02)
      const dx = Math.cos(p.r) * s * Lp * 0.4, dz = -Math.sin(p.r) * s * Lp * 0.4
      o.position.set(p.x + dx, top0 + Hp / 2, p.z + dz); o.updateMatrix(); caps.setMatrixAt(2 * i + (s > 0 ? 1 : 0), o.matrix)
    }
  })
  // 2 × 22 headers at 2.54 mm, pins up (spacer on top of the board)
  const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.64, 8.4, 0.64), m.gold, 44)
  const spacers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.5, 2.5, 2.54), m.plastic, 44)
  const joints = new THREE.InstancedMesh(new THREE.ConeGeometry(0.85, 0.7, 12), m.tin, 44)
  for (let s = 0; s < 2; s++) for (let k = 0; k < 22; k++) {
    const x = s ? 11.43 : -11.43, z = -26.67 + k * 2.54, i = s * 22 + k
    o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1)
    o.position.set(x, top0 + 8.4 / 2 - 2.5, z); o.updateMatrix(); pins.setMatrixAt(i, o.matrix)
    o.position.set(x, top0 + 1.25, z); o.updateMatrix(); spacers.setMatrixAt(i, o.matrix)
    o.position.set(x, by - BOARD.t / 2 - 0.3, z); o.rotation.set(Math.PI, 0, 0); o.updateMatrix(); joints.setMatrixAt(i, o.matrix)
  }
  bgp.add(bodies, caps, pins, spacers, joints)
  // ── USB-C cable leaving the board (plug overmold, strain relief, cable sagging away) ─────────────────────────────
  const u0 = LAYOUT.usb[1]
  const plugZ = u0.z + 3.7 + 8
  bgp.add(box(m.shell, 8.3, 2.5, 3, u0.x, top0 + 1.63, u0.z + 4.9, 1)) // plug shell (inserted)
  bgp.add(box(m.cable, 12, 6.5, 13, u0.x, top0 + 1.63, plugZ - 1.2, 2.2)) // overmold
  const relief = cyl(m.cable, 2.4, 6, u0.x, top0 + 1.63, plugZ + 7.5, 20, 1.9)
  relief.rotation.x = Math.PI / 2
  bgp.add(relief)
  const cable = tube(m.cable, [
    new THREE.Vector3(u0.x, top0 + 1.63, plugZ + 10), new THREE.Vector3(u0.x + 2, top0 - 2, plugZ + 25),
    new THREE.Vector3(u0.x + 10, top0 - 18, plugZ + 42), new THREE.Vector3(u0.x + 22, top0 - 55, plugZ + 60),
  ], 1.9, 60)
  bgp.add(cable); nofit.push(cable)
  // standoffs from the camera plate down to the board
  for (const [x, z] of [[9, 8], [-9, 8], [ROD.x, ROD.z], [-ROD.x, ROD.z]]) {
    const h = cy - 3.4 - top0
    g.add(cyl(m.brass, 1.6, h, x, top0 + h / 2, z, 6))
  }


  // bounds for framing, without the cable that leaves the frame
  const bounds = new THREE.Box3()
  g.updateMatrixWorld(true)
  g.traverse((ob) => { if ((ob as THREE.Mesh).isMesh && !nofit.includes(ob)) bounds.expandByObject(ob, true) })
  return { group: mergeByMaterial(g), plateFaceY, bounds }
}

/** bake every plain mesh into one mesh per material; instanced meshes stay as they are */
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
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2))
    const mat = m.material as THREE.Material
    ;(byMat.get(mat) ?? byMat.set(mat, []).get(mat)!).push(geo)
  })
  const out = new THREE.Group()
  for (const [mat, geos] of byMat) {
    const merged = new THREE.Mesh(mergeGeometries(geos, false)!, mat)
    if ((mat as THREE.MeshPhysicalMaterial).transparent) merged.renderOrder = 4
    out.add(merged)
  }
  for (const k of keep) { const c = k.clone(); c.matrix.copy(k.matrixWorld); c.matrixAutoUpdate = false; out.add(c) }
  return out
}

/** darkroom lighting: a dim warm key from above-left, a neutral rim from behind, very little fill */
export function addLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xece8df, 0x0a0908, 0.55))
  const key = new THREE.DirectionalLight(0xfff4e6, 3)
  key.position.set(-40, 80, 60)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xe9e5dc, 2)
  rim.position.set(50, 30, -70)
  scene.add(rim)
  // the circulating light is red and it lights the parts right next to the beam
  const glow = new THREE.PointLight(0xff2a12, 30, 22, 2)
  glow.position.set(0, 12.5, 0)
  scene.add(glow)
}
