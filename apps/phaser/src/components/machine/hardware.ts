/**
 * The PHASER bench assembly at true scale (millimetres), around the simulated cavity (axis = +y, beam at x = z = 0).
 *
 *   y ≈ 25…34   end mirror: Ø6.35 mm concave (R 120 mm) dielectric mirror behind a slotted retaining ring, in a 25.4 mm
 *               kinematic mount (2 × M3 knurled adjusters, return springs, cap screws)
 *   y = 5…20    four etched fused-silica phase plates (5 × 5 × 1 mm, AR coated) in slim anodised cells on cantilever arms
 *   y = −10…0   gain crystal (3 × 3 × 10 mm) whose top face is the input/output coupler coating (5 %); side-pumped by a
 *               TO-56 laser diode in a copper heatsink, its leads sleeved in heat-shrink and twisted to a small driver board
 *   y ≈ −22     OV3660 camera module (sensor board, M8 lens holder and barrel, a dab of thread-lock), 24-pin 0.5 mm-pitch
 *               FPC with stiffener
 *   y ≈ −31     ESP32-S3-DevKitC-1 (69 × 25.4 × 1.6 mm): WROOM-1 (18 × 25.5 × 3.1 mm, shield can + PCB antenna), two
 *               USB-C receptacles, BOOT/RST switches, SOT-223 LDO, USB-UART bridge, SOT-23s, RGB LED, 0402/0603
 *               passives with solder fillets, 2 × 22 headers at 2.54 mm (a few pins bent); a USB-C cable leaves the
 *               board, dupont leads run to the pump driver
 *
 * Rods: the 16 mm cage standard (Ø4 mm rods on 16 mm centres), two at the back so the cavity stays open to view.
 * Nothing is new: surfaces carry handling wear from surfaces.ts (nicks and scratches, chipped anodise, tarnished copper,
 * fingerprints), the boards carry bump-mapped copper and silkscreen, pins lean, and wires wander and kink.
 * Static meshes are merged by material (worn materials get box-projected UVs in mm, so the wear has one scale
 * everywhere); pins and passives are instanced.
 * Palette: graphite-dominant darkroom. The only red is the light itself (and the glow it throws on the nearest parts).
 */
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { LENGTH, PLANE_Z } from '@/lib/phaser-sim'
import { canvasTex, icMark, pcb, rng, smudgeTex, wear, type PcbPainter } from './surfaces'

const L = LENGTH * 1e3 // 25
export const PART_Y = {
  endMirror: L, plates: PLANE_Z.map((z) => z * 1e3), coupler: 0, crystalBottom: -10, camera: -22, board: -31.4,
}
const ROD = { r: 2, x: 8, z: -9 } // 16 mm cage standard: Ø4 mm rods, 16 mm centres
const BOARD = { w: 25.4, l: 69, t: 1.6, y: PART_Y.board }
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

// ── procedural textures ───────────────────────────────────────────────────────────────────────────────────────────────
/** turning marks around a rod (roughness), a few long scratches along it and a handling smudge */
const turnedTex = () => {
  const t = canvasTex(128, 512, (c) => {
    const r = rng(9)
    for (let y = 0; y < 512; y++) { const v = 45 + 30 * r(); c.fillStyle = `rgb(0,${v},255)`; c.fillRect(0, y, 128, 1) }
    for (let k = 0; k < 14; k++) { c.fillStyle = `rgba(0,${r() < 0.5 ? 20 : 120},255,0.6)`; c.fillRect(r() * 128, r() * 512, 1, 20 + r() * 200) }
    const g = c.createRadialGradient(40, 300, 2, 40, 300, 60); g.addColorStop(0, 'rgba(0,150,255,0.5)'); g.addColorStop(1, 'rgba(0,150,255,0)')
    c.fillStyle = g; c.fillRect(0, 200, 128, 200)
  }, false)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3)
  return t
}
/** brushed finish: horizontal streaks (for the shield can), as colour */
const brushedTex = (label?: string[]) => canvasTex(512, 512, (c) => {
  const r = rng(5)
  c.fillStyle = '#b4b1aa'; c.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y++) { c.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,40,40'},${0.04 + 0.06 * r()})`; c.fillRect(0, y, 512, 1) }
  // a faint heat tint from reflow near one edge, and a couple of handling scuffs
  const g = c.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(120,90,50,0.07)'); g.addColorStop(0.3, 'rgba(120,90,50,0)')
  c.fillStyle = g; c.fillRect(0, 0, 512, 512)
  if (label) {
    c.fillStyle = 'rgba(40,40,40,0.75)'; c.font = '600 30px monospace'; c.textAlign = 'center'
    label.forEach((l, i) => c.fillText(l, 256, 190 + i * 44))
    c.strokeStyle = 'rgba(40,40,40,0.6)'; c.lineWidth = 3; c.strokeRect(200, 360, 112, 112) // 2-D code
    for (let i = 0; i < 64; i++) if (r() < 0.55) c.fillRect(206 + (i % 8) * 12.5, 366 + Math.floor(i / 8) * 12.5, 11, 11)
  }
})
/** the shield can's roughness: brushed streaks, a thumbprint, and scratches across the grain */
const canRough = () => canvasTex(512, 512, (c) => {
  const r = rng(6)
  c.fillStyle = 'rgb(0,85,255)'; c.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y++) { c.fillStyle = `rgba(0,${r() < 0.5 ? 140 : 50},255,${0.25 * r()})`; c.fillRect(0, y, 512, 1) }
  c.lineWidth = 2.2
  for (let k = 0; k < 26; k++) { // fingerprint ridges: concentric loops, broken
    c.strokeStyle = `rgba(0,150,255,${0.1 + 0.12 * r()})`
    c.beginPath(); c.ellipse(360, 150, 8 + k * 4.2, 11 + k * 5.4, 0.5, r() * 0.8, Math.PI * 2 - r() * 0.8); c.stroke()
  }
  for (let k = 0; k < 4; k++) { // soft smears where it was picked up
    const x = r() * 512, y = r() * 512, rad = 30 + 50 * r(), g = c.createRadialGradient(x, y, 0, x, y, rad)
    g.addColorStop(0, 'rgba(0,150,255,0.22)'); g.addColorStop(1, 'rgba(0,150,255,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, 2 * rad, 2 * rad)
  }
  for (let k = 0; k < 9; k++) { c.strokeStyle = `rgba(0,${r() < 0.5 ? 30 : 170},255,0.7)`; c.lineWidth = 1; c.beginPath(); const x = r() * 512, y = r() * 512, a = r() * Math.PI; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 140 * r(), y + Math.sin(a) * 140 * r()); c.stroke() }
}, false)

/** the flex: amber polyimide over 24 copper traces at 0.5 mm pitch (u across, v along), with a crease and handling marks */
const flexTex = () => canvasTex(256, 1024, (c) => {
  const r = rng(12)
  c.fillStyle = '#5c3a1c'; c.fillRect(0, 0, 256, 1024)
  const pitch = 256 / 26
  for (let k = 1; k <= 24; k++) { c.fillStyle = `rgba(176,122,70,${0.82 + 0.1 * r()})`; c.fillRect(k * pitch + pitch * 0.3, 0, pitch * 0.4, 1024) }
  // printed legend near the connector end and the gold contacts
  c.fillStyle = '#c9a868'; for (let k = 1; k <= 24; k++) c.fillRect(k * pitch + pitch * 0.25, 980, pitch * 0.5, 44)
  c.fillStyle = 'rgba(235,225,205,0.7)'; c.font = '600 18px monospace'; c.save(); c.translate(128, 900); c.rotate(Math.PI / 2); c.textAlign = 'center'; c.fillText('OV3660 24P 2208', 0, 6); c.restore()
  c.fillStyle = 'rgba(255,230,190,0.08)'; c.fillRect(0, 0, 256, 1024)
  c.fillStyle = 'rgba(30,15,5,0.35)'; c.fillRect(0, 300, 256, 5) // a crease from the first time it was folded
  for (let k = 0; k < 30; k++) { c.fillStyle = `rgba(255,235,200,${0.05 * r()})`; c.beginPath(); c.arc(r() * 256, r() * 1024, 4 + 18 * r(), 0, 7); c.fill() }
})

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
  sot: [{ x: -6.3, z: 20.8, r: 0 }, { x: -2.6, z: 20.8, r: 0 }, { x: 3.8, z: 26.6, r: Math.PI / 2 }, { x: -3.2, z: 9.5, r: Math.PI / 2 }],
  testpads: [[-10.2, 13.5], [10.2, 13.2], [6.6, 8.8], [-1.2, 23.4], [1.2, 23.4]] as [number, number][],
  fiducials: [[-11.3, 33.2], [11.3, -8.4]] as [number, number][],
  passives: [] as { x: number; z: number; r: number; big: boolean; res: boolean; name: string }[],
}
{
  const r = rng(42)
  const spots: [number, number, number][] = [[0, 21, 2], [0, 9, 2.4], [6.5, 12, 1.4], [-7.5, 11, 1.4], [5.5, 25.5, 1.2], [-2, 27, 1.2], [8, 7, 1.2], [-8, 17, 1.2], [3, -6, 1.2], [-3, -6, 1.2], [7.2, 1.6, 1.1], [-6.6, -1.2, 1.1]]
  let nr = 1, nc = 1
  for (const [cx, cz, s] of spots) for (let k = 0; k < 5; k++) {
    const rot = (r() < 0.5 ? 0 : Math.PI / 2) + (r() - 0.5) * 0.07 // placement is never perfectly square
    const res = r() < 0.4
    LAYOUT.passives.push({ x: cx + (k - 2) * s * 0.9 + (r() - 0.5) * 0.08, z: cz + (r() - 0.5) * s, r: rot, big: r() < 0.3, res, name: res ? `R${nr++}` : `C${nc++}` })
  }
}
const PX = 24 // texture px per mm on the board

/** the dev board's top: black solder mask over copper, vias, ENIG and soldered pads, bump-mapped silkscreen */
const boardMaps = () => pcb(BOARD.w, BOARD.l, PX, 3, (p: PcbPainter) => {
  const { X, Z } = p, r = rng(3)
  // ground pour along the module keep-out edge, and around the USB end
  p.fill('pour', (c) => { c.rect(X(-12.2), Z(-8.4), 24.4 * PX, 2 * PX); c.rect(X(-12.2), Z(28.2), 24.4 * PX, 5.6 * PX) })
  // traces: Manhattan routes with 45° corners, from parts to the headers
  for (let k = 0; k < 90; k++) {
    const w = r() < 0.2 ? 0.4 : 0.15
    let x = (r() - 0.5) * 20, z = -8 + r() * 38
    const pts: [number, number][] = [[x, z]]
    for (let s = 0; s < 3; s++) {
      if (s % 2 === 0) { const nx = r() < 0.5 ? -11.43 + (r() < 0.5 ? 0 : 22.86) : x + (r() - 0.5) * 8; const d = Math.abs(nx - x) * 0.3; x = nx; z += (r() < 0.5 ? -d : d) }
      else z += (r() - 0.5) * 10
      x = Math.max(-11.5, Math.min(11.5, x)); z = Math.max(-8, Math.min(33, z)); pts.push([x, z])
    }
    p.stroke('trace', w, (c) => { c.moveTo(X(pts[0][0]), Z(pts[0][1])); for (const [a, b] of pts.slice(1)) c.lineTo(X(a), Z(b)) })
  }
  // differential USB pair from the connector to the chip, length-matched meander
  for (const dx of [-0.25, 0.25]) p.stroke('trace', 0.18, (c) => {
    c.moveTo(X(6.2 + dx), Z(27.3)); c.lineTo(X(6.2 + dx), Z(24)); for (let k = 0; k < 4; k++) { c.lineTo(X(5 + dx), Z(23.4 - k * 0.8)); c.lineTo(X(6.2 + dx), Z(23 - k * 0.8)) } c.lineTo(X(2 + dx), Z(19)); c.lineTo(X(2 + dx), Z(-8))
  })
  // vias (tented: a raised ring under the mask) and a few open ones
  for (let k = 0; k < 150; k++) {
    const x = (r() - 0.5) * 22, z = -7 + r() * 39, open = r() < 0.15
    p.fill(open ? 'tin' : 'via', (c) => c.arc(X(x), Z(z), 0.3 * PX, 0, Math.PI * 2))
    p.fill('drill', (c) => c.arc(X(x), Z(z), 0.13 * PX, 0, Math.PI * 2))
  }
  // header pads (the solder fills the ring from below), passive pads with solder, IC pads
  for (let k = 0; k < 22; k++) for (const x of [-11.43, 11.43]) {
    const z = -26.67 + k * 2.54
    p.fill('tin', (c) => k === 0 ? c.rect(X(x - 0.85), Z(z - 0.85), 1.7 * PX, 1.7 * PX) : c.arc(X(x), Z(z), 0.85 * PX, 0, Math.PI * 2))
  }
  for (const q of LAYOUT.passives) {
    const Lp = q.big ? 1.6 : 1.0, Wp = q.big ? 0.8 : 0.5
    for (const s of [-1, 1]) p.fill('tin', (c) => {
      const cx = q.x + Math.cos(q.r) * s * Lp * 0.5, cz = q.z - Math.sin(q.r) * s * Lp * 0.5
      c.save(); c.translate(X(cx), Z(cz)); c.rotate(-q.r); c.rect(-0.3 * PX, (-Wp / 2 - 0.05) * PX, 0.6 * PX, (Wp + 0.1) * PX); c.restore()
    })
  }
  const pad = (k: 'pad' | 'tin' | 'copper', x: number, z: number, w: number, l: number) => p.fill(k, (c) => c.rect(X(x - w / 2), Z(z - l / 2), w * PX, l * PX))
  for (let k = 0; k < 3; k++) pad('tin', LAYOUT.ldo.x - 2.3 + k * 2.3, LAYOUT.ldo.z + 3.1, 0.9, 1.6)
  pad('tin', LAYOUT.ldo.x, LAYOUT.ldo.z - 3.1, 3.4, 1.8)
  for (let k = 0; k < 6; k++) { pad('tin', LAYOUT.bridge.x - 2.3, LAYOUT.bridge.z - 1.25 + k * 0.5, 0.6, 0.25); pad('tin', LAYOUT.bridge.x + 2.3, LAYOUT.bridge.z - 1.25 + k * 0.5, 0.6, 0.25) }
  for (let k = 0; k < 24; k++) pad('tin', LAYOUT.zif.x - 5.75 + k * 0.5, LAYOUT.zif.z - 1.9, 0.28, 1)
  for (const [x, z] of LAYOUT.testpads) p.fill('pad', (c) => c.arc(X(x), Z(z), 0.5 * PX, 0, Math.PI * 2))
  for (const [x, z] of LAYOUT.fiducials) { p.fill('drill', (c) => c.arc(X(x), Z(z), 1 * PX, 0, Math.PI * 2)); p.fill('copper', (c) => c.arc(X(x), Z(z), 0.5 * PX, 0, Math.PI * 2)) }
  // silkscreen (text turned by π: upright for the front camera once the board is turned)
  const s = p.silk
  s.lineWidth = 0.15 * PX
  const outline = (x: number, z: number, w: number, l: number) => s.strokeRect(X(x - w / 2), Z(z - l / 2), w * PX, l * PX)
  const text = (t: string, x: number, z: number, rot = 0, size = 1.2) => {
    s.save(); s.translate(X(x), Z(z)); s.rotate(rot + Math.PI); s.font = `600 ${size * PX}px monospace`; s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillText(t, 0, 0); s.restore()
  }
  for (const b of LAYOUT.buttons) outline(b.x, b.z, 4.4, 3.4)
  for (const u of LAYOUT.usb) outline(u.x, u.z, 9.6, 7.8)
  outline(LAYOUT.ldo.x, LAYOUT.ldo.z, 7.2, 7.6); outline(LAYOUT.bridge.x, LAYOUT.bridge.z, 4.6, 4.6); outline(LAYOUT.rgb.x, LAYOUT.rgb.z, 5.8, 5.8)
  outline(LAYOUT.zif.x, LAYOUT.zif.z, 16.8, 5)
  for (const q of LAYOUT.sot) outline(q.x, q.z, q.r ? 2.2 : 3.4, q.r ? 3.4 : 2.2)
  // pin-1 marks
  for (const [x, z] of [[LAYOUT.bridge.x - 2.8, LAYOUT.bridge.z - 2.6], [LAYOUT.zif.x - 8.9, LAYOUT.zif.z - 2.8], [-12.1, -28]]) { s.beginPath(); s.arc(X(x), Z(z), 0.22 * PX, 0, 7); s.fill() }
  for (const b of LAYOUT.buttons) text(b.name, b.x, b.z - 2.6, 0, 0.9)
  for (const u of LAYOUT.usb) text(u.name, u.x, u.z - 4.8, 0, 0.9)
  text('ESP32-S3-DevKitC-1', 0, 27.5, 0, 1.1); text('v1.1', 0, 29, 0, 0.8)
  text('CAM', LAYOUT.zif.x - 10, LAYOUT.zif.z, -Math.PI / 2, 0.8)
  text('RGB', LAYOUT.rgb.x + 3.6, LAYOUT.rgb.z, -Math.PI / 2, 0.7)
  text('U2', LAYOUT.bridge.x, LAYOUT.bridge.z + 3, 0, 0.6); text('U3', LAYOUT.ldo.x + 4.4, LAYOUT.ldo.z, -Math.PI / 2, 0.6)
  LAYOUT.sot.forEach((q, i) => text(`Q${i + 1}`, q.x + (q.r ? 1.8 : 0), q.z + (q.r ? 0 : 1.6), q.r ? -Math.PI / 2 : 0, 0.5))
  // designators beside most passives (some are left off, as on real boards, where there's no room)
  for (const q of LAYOUT.passives) if (r() < 0.55) text(q.name, q.x + (q.r > 0.7 ? 0.9 : 0), q.z + (q.r > 0.7 ? 0 : 0.85), 0, 0.42)
  const left = ['3V3', '3V3', 'RST', '4', '5', '6', '7', '15', '16', '17', '18', '8', '3', '46', '9', '10', '11', '12', '13', '14', '5V', 'G']
  const right = ['G', 'TX', 'RX', '1', '2', '42', '41', '40', '39', '38', '37', '36', '35', '0', '45', '48', '47', '21', '20', '19', 'G', 'G']
  left.forEach((t, k) => text(t, -9.1, -26.67 + k * 2.54, 0, 0.72)); right.forEach((t, k) => text(t, 9.1, -26.67 + k * 2.54, 0, 0.72))
  // CE / recycling marks and a lot code box for a sticker that isn't there
  s.strokeRect(X(-11.4), Z(-4.2), 4.2 * PX, 1.6 * PX); text('2231', -9.3, -3.4, 0, 0.55)
  s.beginPath(); s.arc(X(9.4), Z(-3.3), 0.6 * PX, 0.5, 5.8); s.stroke(); s.beginPath(); s.arc(X(10.8), Z(-3.3), 0.6 * PX, 0.5, 5.8); s.stroke()
})

/** the WROOM-1 module's own PCB tail: the antenna meander in copper under the mask, a keep-out outline */
const moduleMaps = () => pcb(18, 6.5, PX, 8, (p) => {
  const { X, Z } = p
  p.stroke('trace', 0.5, (c) => {
    let x = -7; c.moveTo(X(x), Z(2.25))
    for (let k = 0; k < 7; k++) { c.lineTo(X(x), Z(-2.25)); x += 1; c.lineTo(X(x), Z(-2.25)); c.lineTo(X(x), Z(1.75)); x += 1; c.lineTo(X(x), Z(1.75)) }
  }, 'square')
  p.fill('tin', (c) => c.rect(X(-8.2), Z(2.1), 1.1 * PX, 0.9 * PX))
  p.silk.lineWidth = 0.12 * PX; p.silk.setLineDash([0.4 * PX, 0.3 * PX]); p.silk.strokeRect(X(-8.6), Z(-2.9), 17.2 * PX, 5.4 * PX)
})

/** the pump driver's board (14 × 12 mm) */
const driverMaps = () => pcb(14, 12, PX, 17, (p) => {
  const { X, Z } = p, r = rng(17)
  p.fill('pour', (c) => c.rect(X(-6.6), Z(-5.6), 13.2 * PX, 11.2 * PX))
  for (let k = 0; k < 14; k++) p.stroke('trace', 0.25 + 0.3 * r(), (c) => { c.moveTo(X((r() - 0.5) * 12), Z((r() - 0.5) * 10)); c.lineTo(X((r() - 0.5) * 12), Z((r() - 0.5) * 10)) })
  for (let k = 0; k < 20; k++) { const x = (r() - 0.5) * 12, z = (r() - 0.5) * 10; p.fill('via', (c) => c.arc(X(x), Z(z), 0.3 * PX, 0, 7)); p.fill('drill', (c) => c.arc(X(x), Z(z), 0.13 * PX, 0, 7)) }
  for (let k = 0; k < 3; k++) p.fill('tin', (c) => c.arc(X(-2.54 + k * 2.54), Z(-4.7), 0.8 * PX, 0, 7))
  for (let k = 0; k < 2; k++) p.fill('tin', (c) => c.arc(X(-3.77 + k * 2.54), Z(4), 0.8 * PX, 0, 7))
  const s = p.silk
  s.lineWidth = 0.14 * PX; s.strokeRect(X(-6.5), Z(-5.5), 13 * PX, 11 * PX)
  s.font = `600 ${0.8 * PX}px monospace`; s.textAlign = 'center'; s.textBaseline = 'middle'
  s.fillText('LD DRV r2', X(3.4), Z(-1.8)); s.font = `600 ${0.6 * PX}px monospace`
  ;['3V3', 'G', 'EN'].forEach((t, k) => s.fillText(t, X(-2.54 + k * 2.54), Z(-3.3)))
  ;['LD+', 'LD-'].forEach((t, k) => s.fillText(t, X(-3.77 + k * 2.54), Z(2.6)))
  s.fillText('I SET', X(4.4), Z(3.6))
})

// ── materials ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** a worn metal: wear maps with box-projected UVs, `tile` mm per repeat (applied when the meshes are merged) */
function worn(tileMm: number, w: ReturnType<typeof wear>, p: THREE.MeshStandardMaterialParameters, normal = 1) {
  const m = new THREE.MeshStandardMaterial({ ...p, map: w.map ?? null, roughness: 1, roughnessMap: w.rough, normalMap: w.normal, normalScale: new THREE.Vector2(normal, normal) })
  m.userData.tile = tileMm
  return m
}
const mats = () => {
  const ano = wear({ seed: 21, nicks: 7, scratches: 30, rough: 0.6, smudge: 0.12, tint: { base: 0x292725, patch: 0x302d2a, bare: 0x9a978f, patchAmount: 0.7 } })
  const anoEdge = wear({ seed: 22, nicks: 9, scratches: 36, rough: 0.42, smudge: 0.14, tint: { base: 0x3a3734, patch: 0x33302d, bare: 0xa8a59e, patchAmount: 0.6 } })
  const cu = wear({ seed: 31, nicks: 22, scratches: 60, rough: 0.45, smudge: 0.22, tint: { base: 0x8a5a40, patch: 0x5a3a2a, bare: 0xc88a66, patchAmount: 0.7 } })
  const brass = wear({ seed: 41, size: 256, nicks: 3, scratches: 9, rough: 0.36, smudge: 0.16, tint: { base: 0x8f8670, patch: 0x5e5543, bare: 0xc2b590, patchAmount: 0.6 } })
  const oxide = wear({ seed: 51, size: 256, nicks: 2, scratches: 5, rough: 0.42, smudge: 0.1, tint: { base: 0x1d1c1c, patch: 0x242220, bare: 0x7d7a75, patchAmount: 0.5 } })
  const plastic = wear({ seed: 61, size: 256, nicks: 1, scratches: 5, rough: 0.62, smudge: 0.16 })
  const boardM = boardMaps(), modM = moduleMaps(), drvM = driverMaps()
  const pcbMat = (q: ReturnType<typeof pcb>) => new THREE.MeshStandardMaterial({ map: q.map, normalMap: q.normal, roughnessMap: q.rm, metalnessMap: q.rm, roughness: 1, metalness: 1 })
  const cr = canRough(), glassSmudge = smudgeTex(81, 0.03, 4, 0.12)
  return {
    anodised: worn(16, ano, { metalness: 0.55 }, 0.7),
    anodisedEdge: worn(14, anoEdge, { metalness: 0.8 }, 0.7),
    copper: worn(10, cu, { metalness: 1 }, 1),
    brass: worn(6, brass, { metalness: 1 }, 0.8),
    oxide: worn(3, oxide, { metalness: 0.85 }, 0.6), // black-oxide cap screws
    socket: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9, metalness: 0.3 }),
    // machined steel: fine turning marks around the rod, as a roughness map stretched along it (cheaper than true anisotropy)
    steel: new THREE.MeshStandardMaterial({ color: 0xa19d95, roughness: 1, roughnessMap: turnedTex(), metalness: 1 }),
    spring: new THREE.MeshStandardMaterial({ color: 0x8f8b84, roughness: 0.3, metalness: 1 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xe6ecea, roughness: 1, roughnessMap: glassSmudge, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false,
      iridescence: 0.65, iridescenceIOR: 1.38, iridescenceThicknessRange: [120, 260], // AR coating: a faint violet-green sheen
      clearcoat: 1, clearcoatRoughness: 1, clearcoatRoughnessMap: glassSmudge, side: THREE.DoubleSide,
    }),
    crystal: new THREE.MeshPhysicalMaterial({
      color: 0xd9dcd6, roughness: 1, roughnessMap: smudgeTex(82, 0.05, 3), metalness: 0, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1,
      iridescence: 0.5, iridescenceIOR: 1.4, iridescenceThicknessRange: [150, 300], side: THREE.DoubleSide,
    }),
    mirror: new THREE.MeshPhysicalMaterial({ color: 0xd8d5ce, roughness: 1, roughnessMap: smudgeTex(83, 0.04, 2, 0.1), metalness: 0.95, iridescence: 0.8, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 420] }),
    coating: new THREE.MeshPhysicalMaterial({ color: 0xd8d5ce, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.55, iridescence: 0.8, iridescenceThicknessRange: [200, 420] }),
    fr4: new THREE.MeshStandardMaterial({ color: 0x151614, roughness: 0.7, metalness: 0 }),
    fr4Edge: new THREE.MeshStandardMaterial({ color: 0x2a2a24, roughness: 0.85, metalness: 0 }), // routed edge: glass weave shows
    boardTop: pcbMat(boardM),
    moduleTop: pcbMat(modM),
    driverTop: pcbMat(drvM),
    can: new THREE.MeshStandardMaterial({ map: brushedTex(), roughness: 1, roughnessMap: cr, metalness: 1 }),
    canMark: new THREE.MeshStandardMaterial({ map: brushedTex(['ESP32-S3-WROOM-1', 'N16R8', 'FCC ID 2AC7Z-ESPS3WROOM1']), roughness: 1, roughnessMap: cr, metalness: 1 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xbfa062, roughness: 1, roughnessMap: smudgeTex(85, 0.28, 4, 0.12), metalness: 1 }),
    pin: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, roughnessMap: smudgeTex(86, 0.3, 6, 0.15), metalness: 1 }), // header pins: gold, tinted per pin
    tin: new THREE.MeshStandardMaterial({ color: 0xc9c7c1, roughness: 0.3, metalness: 1 }),
    solder: new THREE.MeshStandardMaterial({ color: 0xb9b7b0, roughness: 0.22, metalness: 1 }),
    shell: worn(4, wear({ seed: 71, size: 256, nicks: 2, scratches: 9, rough: 0.28, smudge: 0.15, tint: { base: 0xbdbab3, patch: 0xa9a59c, bare: 0xd2cfc8, patchAmount: 0.5 } }), { metalness: 1 }, 0.5),
    plastic: worn(4, plastic, { color: 0x0f0f0f, metalness: 0 }, 0.5),
    ic: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.45, metalness: 0.05 }),
    passive: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0 }),
    ivory: new THREE.MeshStandardMaterial({ color: 0xa39c90, roughness: 0.6, metalness: 0 }),
    ledBody: new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.3, metalness: 0, transparent: true, opacity: 0.9 }),
    flex: new THREE.MeshStandardMaterial({ map: flexTex(), roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide }),
    kapton: new THREE.MeshPhysicalMaterial({ color: 0xc07a2c, roughness: 0.25, metalness: 0, transparent: true, opacity: 0.6, clearcoat: 0.6 }),
    shrink: new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.5, metalness: 0 }),
    glue: new THREE.MeshStandardMaterial({ color: 0x3a3833, roughness: 0.45, metalness: 0 }),
    wireA: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0 }),
    wireB: new THREE.MeshStandardMaterial({ color: 0x8e8a82, roughness: 0.5, metalness: 0 }),
    wireC: new THREE.MeshStandardMaterial({ color: 0x4a4844, roughness: 0.5, metalness: 0 }),
    cable: new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.72, metalness: 0 }),
    lint: new THREE.MeshStandardMaterial({ color: 0x77736b, roughness: 1, metalness: 0 }),
    lensGlass: new THREE.MeshPhysicalMaterial({ color: 0x15181c, roughness: 1, roughnessMap: smudgeTex(84, 0.04, 2), metalness: 0.2, clearcoat: 1, iridescence: 0.8, iridescenceThicknessRange: [200, 400] }),
    markBridge: new THREE.MeshStandardMaterial({ map: icMark(['CP2102N', 'A01 2231'], 4, 4), roughness: 0.5, metalness: 0.05 }),
    markLdo: new THREE.MeshStandardMaterial({ map: icMark(['SGM2212', '3.3 22K'], 6.5, 3.5, false), roughness: 0.5, metalness: 0.05 }),
    markReg: new THREE.MeshStandardMaterial({ map: icMark(['LBMY'], 2.9, 1.6), roughness: 0.5, metalness: 0.05 }),
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
/** a cylinder along x from x0 to x1 */
function cylX(mat: THREE.Material, r: number, x0: number, x1: number, y: number, z: number, seg = 16) {
  const c = cyl(mat, r, Math.abs(x1 - x0), (x0 + x1) / 2, y, z, seg)
  c.rotation.z = Math.PI / 2
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
/** a socket-head cap screw standing on y (axis +y): head Ø 1.6 d, height 0.8 d, hex socket, chamfered top */
function capScrew(m: Mats, d: number, x: number, y: number, z: number, turn = 0) {
  const g = new THREE.Group()
  g.add(cyl(m.oxide, 0.8 * d, 0.7 * d, 0, 0.35 * d, 0, 28))
  g.add(cyl(m.oxide, 0.8 * d, 0.1 * d, 0, 0.75 * d, 0, 28, 0.7 * d))
  const hex = cyl(m.socket, 0.5 * d, 0.02, 0, 0.8 * d + 0.005, 0, 6)
  hex.rotation.y = turn
  g.add(hex)
  g.position.set(x, y, z)
  return g
}
/** a knurled thumb knob (straight knurl as a toothed profile), top at y */
function knob(mat: THREE.Material, r: number, h: number, teeth: number, x: number, y: number, z: number) {
  const s = new THREE.Shape()
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.95 : r
    if (i) s.lineTo(rr * Math.cos(a), rr * Math.sin(a)); else s.moveTo(rr * Math.cos(a), rr * Math.sin(a))
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.06, bevelSegments: 2, curveSegments: 1 })
  geo.rotateX(Math.PI / 2)
  const k = new THREE.Mesh(geo, mat)
  k.position.set(x, y, z)
  return k
}
/** a wire or cable: a tube along a smooth curve through the given points */
function tube(mat: THREE.Material, pts: THREE.Vector3[], r: number, seg = 80, radial = 10) {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), seg, r, radial, false), mat)
}
/**
 * a hand-routed path: the smooth curve through `pts` with a slow wander (two frequencies each way) and a few sharp kinks
 * where the wire was once bent; the ends stay where they are fixed
 */
function wander(pts: THREE.Vector3[], amp: number, seed: number, kinks = 2, n = 64) {
  const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), r = rng(seed)
  const fr = c.computeFrenetFrames(n, false)
  const ph = Array.from({ length: 4 }, () => r() * Math.PI * 2)
  const ks = Array.from({ length: kinks }, () => ({ t: 0.15 + 0.7 * r(), a: (r() - 0.5) * 2.4, b: (r() - 0.5) * 2.4 }))
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, env = Math.sin(Math.PI * t) ** 0.6
    let a = 0.6 * Math.sin(2 * Math.PI * 1.3 * t + ph[0]) + 0.3 * Math.sin(2 * Math.PI * 3.7 * t + ph[1])
    let b = 0.6 * Math.sin(2 * Math.PI * 1.1 * t + ph[2]) + 0.3 * Math.sin(2 * Math.PI * 4.3 * t + ph[3])
    for (const k of ks) { const g = Math.exp(-(((t - k.t) / 0.03) ** 2)); a += k.a * g; b += k.b * g }
    return c.getPointAt(t).addScaledVector(fr.normals[i], amp * env * a).addScaledVector(fr.binormals[i], amp * env * b)
  })
}
/** two wires twisted around a wandering centreline, fanning out to their own end points */
function twisted(mats: [THREE.Material, THREE.Material], center: THREE.Vector3[], starts: THREE.Vector3[], ends: THREE.Vector3[], r: number, pitch: number, seed: number) {
  const c = new THREE.CatmullRomCurve3(wander(center, 0.5, seed, 1), false, 'centripetal')
  const n = 360, fr = c.computeFrenetFrames(n, false), turns = c.getLength() / pitch
  const sm = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
  return [0, 1].map((w) => {
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n, th = 2 * Math.PI * turns * (t + 0.035 * Math.sin(2 * Math.PI * 2.3 * t + seed)) + w * Math.PI // twisted by hand: tighter in places
      const p = c.getPointAt(t).addScaledVector(fr.normals[i], r * Math.cos(th)).addScaledVector(fr.binormals[i], r * Math.sin(th))
      p.lerp(starts[w], 1 - sm(0, 0.08, t)).lerp(ends[w], sm(0.94, 1, t))
      return p
    })
    return tube(mats[w], pts, r * 0.95, 900, 8)
  })
}
/** a flat ribbon (the FPC) of width w along a smooth curve, uv: u across, v along */
function ribbon(mat: THREE.Material, pts: THREE.Vector3[], w: number, across: THREE.Vector3) {
  const curve = new THREE.CatmullRomCurve3(pts)
  const n = 120, pos: number[] = [], uv: number[] = [], idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curve.getPoint(t)
    // the ribbon isn't perfectly flat: a slight twist and a ripple across it
    const tw = 0.05 * Math.sin(Math.PI * t * 2.2), rip = 0.12 * Math.sin(Math.PI * t * 7) * Math.sin(Math.PI * t)
    const a = p.clone().addScaledVector(across, -w / 2).add(V(0, -tw * w / 2 + rip, 0)), b = p.clone().addScaledVector(across, w / 2).add(V(0, tw * w / 2 + rip * 0.6, 0))
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z); uv.push(0, t, 1, t)
    if (i < n) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx); g.computeVertexNormals()
  return new THREE.Mesh(g, mat)
}
/** a blob (solder, glue): a squashed, lumpy sphere */
function blob(mat: THREE.Material, r: number, x: number, y: number, z: number, seed: number, squash = 0.7) {
  const ico = new THREE.IcosahedronGeometry(r, 4)
  ico.deleteAttribute('normal'); ico.deleteAttribute('uv')
  const g = mergeVertices(ico), p = g.attributes.position, q = rng(seed), ph = [q() * 6, q() * 6, q() * 6]
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i)
    const k = 1 + 0.12 * Math.sin(3 * vx / r + ph[0]) * Math.sin(3 * vz / r + ph[1]) + 0.06 * Math.sin(5 * vy / r + ph[2])
    p.setXYZ(i, vx * k, vy * k * squash, vz * k)
  }
  g.computeVertexNormals()
  const m = new THREE.Mesh(g, mat)
  m.position.set(x, y, z)
  return m
}
/** a helical spring along y */
function spring(mat: THREE.Material, r: number, wire: number, h: number, turns: number, x: number, y: number, z: number) {
  const pts = Array.from({ length: turns * 16 + 1 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return V(x + r * Math.cos(a), y + (h * i) / (turns * 16), z + r * Math.sin(a)) })
  return tube(mat, pts, wire, turns * 24, 6)
}
/** a solder-fillet wedge: from the part's end face (x = 0, full height) sloping to the pad (x = 1) */
const filletGeo = () => {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1, 0); s.quadraticCurveTo(0.25, 0.25, 0, 1); s.lineTo(0, 0)
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 6 })
  g.translate(0, 0, -0.5)
  return g
}

/** a plate cell: 5 mm fused-silica plate in a slim square cell on an arm, clamped to the two rods with M2 screws */
function cell(m: Mats, y: number, k: number) {
  const c = new THREE.Group()
  const s = new THREE.Shape()
  s.moveTo(-3.7, -3.7); s.lineTo(3.7, -3.7); s.lineTo(3.7, 3.7); s.lineTo(-3.7, 3.7); s.lineTo(-3.7, -3.7)
  const h = new THREE.Path(); h.moveTo(-2.55, -2.55); h.lineTo(-2.55, 2.55); h.lineTo(2.55, 2.55); h.lineTo(2.55, -2.55); h.lineTo(-2.55, -2.55)
  s.holes.push(h)
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1 }), m.anodised)
  frame.geometry.rotateX(Math.PI / 2)
  frame.position.y = y + 0.7
  c.add(frame)
  // retaining clips over two corners of the plate, each with an M1.2 screw
  for (const [cx, cz] of [[2.6, 2.6], [-2.6, 2.6]]) { c.add(box(m.spring, 1.6, 0.15, 1.6, cx * 0.95, y + 0.78, cz * 0.95)); c.add(cyl(m.oxide, 0.35, 0.3, cx * 1.15, y + 0.95, cz * 1.15, 12)) }
  c.add(box(m.anodised, 3, 1.4, 4.4, 0, y, -5.8, 0.3)) // arm
  c.add(plate(m.anodisedEdge, y + 1.1, 2.2, 0, 22, -12.2, -6.8)) // rod clamp
  for (const x of [4.5, -4.5]) c.add(capScrew(m, 2, x, y + 1.3, -9.5, k * 0.7 + x)) // M2 cap screws, sockets at whatever angle they stopped
  // engraved plate number on the arm
  c.add(box(m.socket, 0.5, 0.02, 0.9, 0, y + 0.71, -5.4 + (k % 2) * 0.1))
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
  // retaining ring with its two spanner slots, holding the mirror in the cell
  {
    const s = new THREE.Shape(); s.absarc(0, 0, 4.1, 0, Math.PI * 2, false)
    const h = new THREE.Path(); h.absarc(0, 0, 3.0, 0, Math.PI * 2, true); s.holes.push(h)
    const ring = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false, curveSegments: 48 }).rotateX(Math.PI / 2), m.oxide)
    ring.position.y = top - 0.02; g.add(ring)
    for (const a of [0.3, 0.3 + Math.PI]) g.add(box(m.socket, 0.7, 0.05, 1, 3.55 * Math.cos(a), top - 0.52, 3.55 * Math.sin(a)))
  }
  for (const [x, z] of [[8.5, 8.5], [-8.5, 8.5]]) {
    g.add(cyl(m.steel, 1.5, 10, x, top + 5.6, z, 20)) // M3 adjuster
    g.add(knob(m.anodisedEdge, 4, 3.6, 40, x, top + 14.5, z)) // knurled knob
    g.add(cyl(m.anodised, 3.2, 0.6, x, top + 14.8, z, 40))
    g.add(cyl(m.steel, 2, 0.2, x, top + 2.9, z, 24)) // hardened seat
  }
  g.add(cyl(m.steel, 1.5, 8, -8.5, top + 5, -8.5, 20)) // pivot
  g.add(new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 12), m.steel).translateX(-8.5).translateY(top + 2.6).translateZ(-8.5)) // pivot ball
  for (const x of [5, -5]) g.add(spring(m.spring, 0.7, 0.14, 4.4, 9, x, top + 2.8, 9.8)) // return springs
  for (const [x, z] of [[10.5, -10.5], [-10.5, -10.5]]) if (z < 0) g.add(capScrew(m, 2.5, x, top + 9.6, z, x * 0.3 + z))
  for (const x of [ROD.x, -ROD.x]) { const s = cyl(m.oxide, 0.9, 1.2, x * 1.5625, top + 6.2, ROD.z, 6); s.rotation.z = Math.PI / 2; g.add(s) } // rod set screws in the plate's side

  // ── the phase plates ──────────────────────────────────────────────────────────────────────────────────────────────
  const plateFaceY: number[] = []
  PART_Y.plates.forEach((y, k) => {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 5), m.glass)
    glass.position.y = y - 0.5
    g.add(glass)
    plateFaceY.push(y)
    const c = cell(m, y - 0.5, k)
    c.rotation.y = [0.004, -0.006, 0.003, -0.002][k] // hand-aligned: no two cells sit quite square
    g.add(c)
  })

  // ── gain crystal (coupler coating on top), side-pumped by a TO-56 diode in a copper heatsink ──────────────────────
  g.add(box(m.crystal, 3, 10, 3, 0, -5, 0))
  g.add(box(m.coating, 3.02, 0.06, 3.02, 0, -0.03, 0))
  g.add(plate(m.anodised, -6.2, 3, 3.4, 22, -12.2, 6))
  g.add(box(m.brass, 0.8, 2.6, 4.6, -1.9, -7.4, 0)) // clamp shoe
  { const s = cyl(m.oxide, 0.8, 5, -5.2, -7.6, 0, 6); s.rotation.z = Math.PI / 2; g.add(s) } // clamp screw through the holder
  for (const x of [6.5, -6.5]) g.add(capScrew(m, 2, x, -6.1, -9.5, x))
  const dy = -2.2 // diode axis height: pumps the crystal from the side through a bore in its heatsink
  g.add(box(m.copper, 8, 8, 8, 6.2, dy, 0, 0.3)) // heatsink block on the holder
  for (let k = 0; k < 6; k++) g.add(box(m.copper, 8, 6.4, 0.5, 6.2, dy, 4.3 + k * 1.0, 0.1)) // fins
  for (const z of [-2.4, 2.4]) g.add(capScrew(m, 1.6, 4.2, dy + 4, z, z))
  const can = cyl(m.shell, 2.8, 3.6, 11.9, dy, 0, 40) // TO-56 can, window facing the crystal
  can.rotation.z = Math.PI / 2; g.add(can)
  const flange = cyl(m.gold, 2.8, 1.1, 13.9, dy, 0, 40); flange.rotation.z = Math.PI / 2; g.add(flange)
  g.add(box(m.gold, 0.6, 0.5, 0.4, 13.9, dy + 2.75, 0)) // orientation tab
  // leads: the two used legs bent a little and sleeved in heat-shrink; the case lead clipped short
  for (const dz of [-1.27, 1.27]) g.add(tube(m.tin, [V(14.4, dy, dz), V(16, dy + 0.05, dz * 1.02), V(17.6, dy - 0.25, dz * 1.12), V(19.6, dy - 0.5, dz * 1.2)], 0.23, 16, 6))
  g.add(cylX(m.tin, 0.23, 14.4, 15.6, dy, 0, 8))
  for (const dz of [-1.27, 1.27]) {
    const pts = [V(17.3, dy - 0.2, dz * 1.1), V(19, dy - 0.42, dz * 1.18), V(20.8, dy - 0.7, dz * 1.2)]
    g.add(tube(m.shrink, pts, 0.52, 12, 10))
    g.add(tube(m.shrink, [pts[0].clone().add(V(-0.01, 0, 0)), pts[0].clone().add(V(0.3, 0, 0))], 0.45, 2, 10)) // shrunk-down lip
  }

  // ── pump driver board on the rods, twisted leads from the diode, dupont leads to the dev board ────────────────────
  const drv = new THREE.Group()
  drv.add(box(m.fr4Edge, 14, 1.6, 12, 0, 0, 0))
  drv.add(new THREE.Mesh(new THREE.PlaneGeometry(14, 12).rotateX(-Math.PI / 2), m.driverTop).translateY(0.81))
  drv.add(box(m.ic, 2.9, 1.0, 1.6, -2, 1.3, -1.5)) // SOT-23-5 regulator
  drv.add(new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.6).rotateX(-Math.PI / 2), m.markReg).translateX(-2).translateY(1.81).translateZ(-1.5))
  for (let k = 0; k < 3; k++) drv.add(box(m.tin, 0.4, 0.2, 0.7, -2.95 + k * 0.95, 0.9, -0.5))
  for (let k = 0; k < 2; k++) drv.add(box(m.tin, 0.4, 0.2, 0.7, -2.95 + k * 1.9, 0.9, -2.5))
  drv.add(box(m.ic, 4, 2.2, 4, 3, 1.9, 1.5, 0.3)) // power inductor
  drv.add(box(m.plastic, 5.1, 2.5, 2.5, -2.5, 2, 4)) // 2-pin header housing
  drv.add(box(m.plastic, 7.6, 2.5, 2.5, 0, -2, -4.7)) // 3-pin header (to the dev board)
  // current-set trimmer (3 mm, ivory body with a slotted rotor) and a sense resistor
  drv.add(box(m.ivory, 3, 1.2, 3.2, 4.4, 1.4, -2.8, 0.2))
  drv.add(cyl(m.spring, 1.1, 0.4, 4.4, 2.1, -2.8, 20))
  { const slot = box(m.socket, 1.9, 0.05, 0.3, 4.4, 2.32, -2.8); slot.rotation.y = 0.8; drv.add(slot) }
  drv.add(box(m.ic, 2, 0.5, 1.2, -4.4, 1.05, 1.8)); for (const s of [-1, 1]) drv.add(box(m.tin, 0.4, 0.52, 1.24, -4.4 + s * 1.05, 1.05, 1.8))
  drv.rotation.x = Math.PI / 2
  drv.position.set(0, -14.5, ROD.z - 3.4)
  g.add(drv)
  for (const x of [5.6, -5.6]) { const s = capScrew(m, 1.6, x, 0, 0, x); s.rotation.x = Math.PI / 2; s.position.set(x, -9.6, ROD.z - 2.6); g.add(s) }
  // the diode pair: twisted by hand (not evenly), soldered to the back of the driver board
  const pairEnds = [V(-2.3, -12.3, -13.45), V(-3.8, -12.2, -13.45)]
  g.add(...twisted([m.wireA, m.wireB],
    [V(20.6, dy - 0.7, 0), V(22, dy - 2.2, -0.6), V(19.5, -10, -6), V(6, -13.4, -12.8), V(-3, -12.3, -13.5)],
    [V(20.6, dy - 0.7, 1.52), V(20.6, dy - 0.7, -1.52)], pairEnds, 0.36, 2.6, 7))
  pairEnds.forEach((p, i) => g.add(blob(m.solder, 0.55, p.x, p.y, p.z + 0.1, 30 + i, 0.8)))
  // dupont leads from the driver's 3-pin header down to 3V3 / GND / GPIO on the dev board's headers (female housings on the pins)
  const by = BOARD.y
  const top0 = by + BOARD.t / 2
  const pinTop = top0 + 2.5 // top of the header spacers
  const drvPins = [-2.54, 0, 2.54].map((dx) => V(dx, -18.2, ROD.z - 3.4 + 4.7))
  const hdr = [[11.43, 26.67], [11.43, 24.13], [11.43, 21.59]].map(([x, z]) => [-x, -z]) as [number, number][] // 3V3-side pins, world coords
  const housing = (x: number, y0: number, z: number, len: number, turn: number) => {
    const h = new THREE.Group()
    h.add(box(m.plastic, 2.54, len, 2.54, 0, len / 2, 0, 0.15))
    h.add(box(m.socket, 0.9, 1.8, 0.02, 0, len * 0.55, 1.28)) // latch window
    h.add(box(m.plastic, 1.2, 0.8, 0.4, 0, len * 0.55, 1.3)) // the latch tongue
    h.add(cyl(m.tin, 0.62, 0.8, 0, len + 0.1, 0, 12)) // crimp barrel peeking out of the back
    h.position.set(x, y0, z); h.rotation.set(turn * 0.6, turn, turn * -0.4)
    return h
  }
  ;[m.wireA, m.wireB, m.wireC].forEach((mat, i) => {
    const [hx, hz] = hdr[i]
    const tilt = [0.03, -0.02, 0.05][i] // housings never sit quite straight on the pins
    const end = V(hx + 5.6 * tilt, pinTop + 14.6, hz + 8.4 * tilt)
    g.add(housing(hx, pinTop, hz, 14, tilt))
    const route = [drvPins[i].clone().setY(drvPins[i].y - 1), drvPins[i].clone().add(V(-2 - i, -4, -2)), V(hx - 3 + i, pinTop + 22, hz + 6), V(hx, pinTop + 18, hz + 0.5), end]
    g.add(tube(mat, wander(route, 0.7, 11 + i, 2), 0.55, 140))
    const hd = housing(drvPins[i].x, drvPins[i].y - 2, drvPins[i].z + 0.3, 12, -tilt)
    hd.rotation.x += Math.PI // pointing down, onto the driver's pin
    hd.position.y += 12
    g.add(hd)
  })

  // ── OV3660 module: sensor board, M8 lens holder, barrel and lens; 24-pin FPC with stiffener to the ZIF ────────────
  const cy = PART_Y.camera
  g.add(plate(m.anodised, cy - 1.2, 2.2, 10, 22, -12.2, 11))
  for (const [x, z] of [[9, 8], [-9, 8]]) g.add(capScrew(m, 2, x, cy - 1, z, x + z))
  g.add(box(m.fr4Edge, 8.5, 1, 8.5, 0, cy - 3.9, 0))
  g.add(box(m.ic, 5.8, 0.9, 5.8, 0, cy - 2.9, 0)) // sensor package (under the holder)
  for (const [x, z] of [[3.6, -3.4], [-3.6, -3.4], [3.6, 3.2], [-3.3, 3.5]]) g.add(box(m.passive, 0.5, 0.3, 1, x, cy - 4.55, z)) // passives on its underside
  g.add(box(m.plastic, 8.3, 2.6, 8.3, 0, cy + 0.1, 0, 0.4)) // holder base
  for (const [x, z] of [[3.3, 3.3], [-3.3, -3.3]]) g.add(cyl(m.brass, 0.5, 0.4, x, cy + 1.45, z, 12)) // heat-staked pegs
  g.add(cyl(m.plastic, 4, 4.2, 0, cy + 3.5, 0, 40)) // M8 threaded holder
  g.add(cyl(m.plastic, 3.5, 3.4, 0, cy + 7, 0, 60)) // barrel
  for (let k = 0; k < 6; k++) g.add(cyl(m.ic, 3.62, 0.25, 0, cy + 5.6 + k * 0.5, 0, 60)) // thread rings
  g.add(cyl(m.lensGlass, 2.3, 0.3, 0, cy + 8.75, 0, 40))
  g.add(blob(m.glue, 0.75, 3.45, cy + 5.6, 1.3, 5, 0.75)) // thread-lock dab where the barrel was set
  const flexPts = [
    V(0, cy - 4.45, 4.25), V(0, cy - 4.8, 6.6), V(0, cy - 6.6, 7.6),
    V(0, by + 3, 5.2), V(0, by + 1.5, 2.2), V(0, by + 1.35, -LAYOUT.zif.z + 1.6),
  ]
  g.add(ribbon(m.flex, flexPts, 12.5, V(1, 0, 0)))
  g.add(box(m.fr4, 12.5, 0.3, 3.2, 0, by + 1.5, -LAYOUT.zif.z + 3.2)) // stiffener at the connector end
  // a strip of Kapton over the flex and its stiffener, holding them down behind the connector
  { const t = box(m.kapton, 14.2, 0.05, 3.1, 0.3, by + 1.72, 1.7); t.rotation.set(0.03, 0.04, 0.01); g.add(t) }

  // ── ESP32-S3-DevKitC-1 (turned 180°: USB-C and its cable at the back, the WROOM antenna at the front) ────────────
  const bgp = new THREE.Group()
  bgp.rotation.y = Math.PI
  g.add(bgp)
  bgp.add(box(m.fr4Edge, BOARD.w, BOARD.t, BOARD.l, 0, by, 0))
  const topFace = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.l).rotateX(-Math.PI / 2), m.boardTop)
  topFace.position.set(0, top0 + 0.01, 0)
  bgp.add(topFace)
  // WROOM-1: module PCB (0.8), shield can (to 3.1 total), antenna tail with the meander
  const W = LAYOUT.wroom
  bgp.add(box(m.fr4Edge, W.w, 0.8, W.l, W.x, top0 + 0.4, W.z))
  const modTop = new THREE.Mesh(new THREE.PlaneGeometry(W.w, 6.5).rotateX(-Math.PI / 2), m.moduleTop)
  modTop.position.set(W.x, top0 + 0.81, W.z - W.l / 2 + 3.25)
  bgp.add(modTop)
  bgp.add(box(m.can, 16.6, 2.3, 17.6, W.x, top0 + 0.8 + 1.15, W.z + 3.2, 0.25))
  // laser marking on the can's lid: a plane turned so it reads upright (not mirrored) from the front camera,
  // through the board's own 180° turn
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(15.6, 16.6).rotateX(-Math.PI / 2).rotateY(Math.PI), m.canMark)
  mark.position.set(W.x, top0 + 0.8 + 2.3 + 0.01, W.z + 3.2)
  bgp.add(mark)
  // castellations with their solder fillets, not all alike
  {
    const r = rng(77)
    for (let k = 0; k < 13; k++) for (const s of [-1, 1]) {
      bgp.add(box(m.gold, 0.9, 0.12, 0.5, W.x + s * 8.75, top0 + 0.06, W.z + 3.2 - 8.4 + k * 1.27))
      const f = new THREE.Mesh(filletGeo(), m.solder)
      f.scale.set(0.5 + 0.35 * r(), 0.45 + 0.35 * r(), 0.55)
      f.rotation.y = s > 0 ? 0 : Math.PI
      f.position.set(W.x + s * 9, top0, W.z + 3.2 - 8.4 + k * 1.27)
      bgp.add(f)
    }
  }
  // USB-C receptacles (8.94 × 3.26 × 7.35) at the +z edge, with their through-hole shell tabs soldered
  for (const u of LAYOUT.usb) {
    bgp.add(box(m.shell, 8.94, 3.26, 7.35, u.x, top0 + 1.63, u.z, 1.2))
    bgp.add(box(m.plastic, 7.8, 1.1, 0.2, u.x, top0 + 1.63, u.z + 3.7)) // the opening
    bgp.add(box(m.ivory, 5.6, 0.7, 0.1, u.x, top0 + 1.63, u.z + 3.6)) // the tongue inside
    for (const s of [-1, 1]) { bgp.add(box(m.shell, 0.5, 1.2, 1.2, u.x + s * 4.6, top0 + 0.5, u.z - 1.8)); bgp.add(blob(m.solder, 0.6, u.x + s * 4.7, top0 + 0.1, u.z - 1.8, 90 + u.x + s, 0.5)) }
  }
  // BOOT / RST tactile switches (4 × 3 × 2)
  for (const b of LAYOUT.buttons) {
    bgp.add(box(m.shell, 4, 1.4, 3, b.x, top0 + 0.7, b.z, 0.1)); bgp.add(box(m.plastic, 1.6, 0.6, 1.2, b.x, top0 + 1.7, b.z, 0.15))
    for (const s of [-1, 1]) for (const t of [-1, 1]) bgp.add(box(m.tin, 0.8, 0.15, 0.5, b.x + s * 2.2, top0 + 0.08, b.z + t * 1))
  }
  // SOT-223 LDO: body 6.5 × 3.5 × 1.6, tab and three legs, marked
  const ldo = LAYOUT.ldo
  bgp.add(box(m.ic, 6.5, 1.6, 3.5, ldo.x, top0 + 0.95, ldo.z + 0.6))
  bgp.add(new THREE.Mesh(new THREE.PlaneGeometry(6.5, 3.5).rotateX(-Math.PI / 2).rotateY(Math.PI), m.markLdo).translateX(ldo.x).translateY(top0 + 1.76).translateZ(ldo.z + 0.6))
  bgp.add(box(m.tin, 3, 0.25, 1.5, ldo.x, top0 + 0.2, ldo.z - 1.9))
  for (let k = 0; k < 3; k++) bgp.add(box(m.tin, 0.7, 0.25, 1.6, ldo.x - 2.3 + k * 2.3, top0 + 0.2, ldo.z + 3))
  // USB-UART bridge (QFN 4 × 4, marked) and the RGB LED (5 × 5)
  bgp.add(box(m.ic, 4, 0.85, 4, LAYOUT.bridge.x, top0 + 0.45, LAYOUT.bridge.z))
  bgp.add(new THREE.Mesh(new THREE.PlaneGeometry(4, 4).rotateX(-Math.PI / 2).rotateY(Math.PI), m.markBridge).translateX(LAYOUT.bridge.x).translateY(top0 + 0.88).translateZ(LAYOUT.bridge.z))
  bgp.add(box(m.ledBody, 5, 1.6, 5, LAYOUT.rgb.x, top0 + 0.8, LAYOUT.rgb.z))
  bgp.add(box(m.ivory, 3.4, 0.05, 3.4, LAYOUT.rgb.x, top0 + 1.61, LAYOUT.rgb.z)) // the die window
  bgp.add(box(m.plastic, 1.6, 0.5, 0.8, LAYOUT.pled.x, top0 + 0.25, LAYOUT.pled.z)) // power LED (off)
  // SOT-23 transistors (auto-reset) and the ESD array
  for (const q of LAYOUT.sot) {
    const t = new THREE.Group()
    t.add(box(m.ic, 2.9, 1, 1.3, 0, 0.6, 0, 0.1))
    for (const x of [-0.95, 0.95]) t.add(box(m.tin, 0.4, 0.15, 0.8, x, 0.12, -0.85))
    t.add(box(m.tin, 0.4, 0.15, 0.8, 0, 0.12, 0.85))
    t.position.set(q.x, top0, q.z); t.rotation.y = q.r + 0.03
    bgp.add(t)
  }
  // camera ZIF connector (24-pin 0.5 mm)
  bgp.add(box(m.ivory, 16, 1.2, 3.8, LAYOUT.zif.x, top0 + 0.6, LAYOUT.zif.z))
  bgp.add(box(m.plastic, 16, 0.5, 1.5, LAYOUT.zif.x, top0 + 1.45, LAYOUT.zif.z - 1.2))
  for (const s of [-1, 1]) bgp.add(box(m.tin, 1, 0.8, 1.2, LAYOUT.zif.x + s * 8.4, top0 + 0.4, LAYOUT.zif.z))
  // passives: 0402 / 0603 bodies (capacitors in tan and grey-brown, resistors black), tinned end caps, solder fillets
  const P = LAYOUT.passives
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m.passive, P.length)
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m.tin, P.length * 2)
  const fillets = new THREE.InstancedMesh(filletGeo(), m.solder, P.length * 2)
  const o = new THREE.Object3D(), pr = rng(99), col = new THREE.Color()
  P.forEach((p, i) => {
    const Lp = p.big ? 1.6 : 1.0, Wp = p.big ? 0.8 : 0.5, Hp = p.res ? (p.big ? 0.45 : 0.32) : (p.big ? 0.8 : 0.5)
    o.rotation.set(0, p.r, 0); o.scale.set(Lp * 0.6, Hp, Wp); o.position.set(p.x, top0 + Hp / 2 + 0.03, p.z); o.updateMatrix(); bodies.setMatrixAt(i, o.matrix)
    bodies.setColorAt(i, p.res ? col.setHex(0x161616) : col.setHex([0x7a6b55, 0x6f6658, 0x8a7a5e, 0x5f5a52][Math.floor(pr() * 4)]))
    for (const s of [-1, 1]) {
      const j = 2 * i + (s > 0 ? 1 : 0)
      const dx = Math.cos(p.r) * s * Lp * 0.4, dz = -Math.sin(p.r) * s * Lp * 0.4
      o.scale.set(Lp * 0.2, Hp * 1.02, Wp * 1.02); o.position.set(p.x + dx, top0 + Hp / 2 + 0.03, p.z + dz); o.updateMatrix(); caps.setMatrixAt(j, o.matrix)
      o.rotation.set(0, p.r + (s > 0 ? 0 : Math.PI), 0)
      o.scale.set(0.12 + 0.12 * pr(), Hp * (0.45 + 0.4 * pr()), Wp * 0.95)
      o.position.set(p.x + Math.cos(p.r) * s * Lp * 0.5, top0, p.z - Math.sin(p.r) * s * Lp * 0.5); o.updateMatrix(); fillets.setMatrixAt(j, o.matrix)
    }
  })
  // 2 × 22 headers at 2.54 mm, pins up (spacer on top of the board). Most pins lean a fraction of a degree; a few were
  // knocked over on the bench (not the three under the dupont housings)
  const pinTip = (() => {
    const shaft = new THREE.BoxGeometry(0.64, 3.0, 0.64).translate(0, 1.5, 0)
    const tip = new THREE.CylinderGeometry(0.3, 0.4525, 0.4, 4, 1).rotateY(Math.PI / 4).translate(0, 3.2, 0)
    return mergeGeometries([shaft.toNonIndexed(), tip.toNonIndexed()])!
  })()
  const pins = new THREE.InstancedMesh(pinTip, m.pin, 44)
  const tails = new THREE.InstancedMesh(new THREE.BoxGeometry(0.64, 6.6, 0.64), m.pin, 44)
  const spacers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.5, 2.5, 2.54), m.plastic, 44)
  const joints = new THREE.InstancedMesh(new THREE.ConeGeometry(0.85, 0.7, 14), m.solder, 44)
  const bent: Record<number, [number, number]> = { 2: [0.16, 0.05], [22 + 4]: [-0.09, -0.11], 9: [0.07, 0.02], [22 + 13]: [0.02, 0.06] }
  const busy = new Set([22 + 19, 22 + 20, 22 + 21])
  const jr = rng(123)
  for (let s = 0; s < 2; s++) for (let k = 0; k < 22; k++) {
    const x = s ? 11.43 : -11.43, z = -26.67 + k * 2.54, i = s * 22 + k
    const [bx, bz] = bent[i] ?? (busy.has(i) ? [0, 0] : [(jr() - 0.5) * 0.03, (jr() - 0.5) * 0.03])
    o.scale.set(1, 1, 1)
    o.rotation.set(bx, jr() * 0.1, (s ? -1 : 1) * Math.abs(bz)); o.position.set(x, pinTop, z); o.updateMatrix(); pins.setMatrixAt(i, o.matrix) // bent outward
    pins.setColorAt(i, col.setRGB(0.75 + 0.1 * jr(), 0.6 + 0.06 * jr(), 0.36 + 0.05 * jr()).multiplyScalar(jr() < 0.1 ? 0.8 : 1))
    o.rotation.set(0, 0, 0); o.position.set(x, pinTop - 3.3, z); o.updateMatrix(); tails.setMatrixAt(i, o.matrix)
    tails.setColorAt(i, col.setRGB(0.72, 0.58, 0.35))
    o.position.set(x, top0 + 1.25, z); o.updateMatrix(); spacers.setMatrixAt(i, o.matrix)
    const js = 0.85 + 0.3 * jr()
    o.scale.set(js, 0.8 + 0.5 * jr(), js); o.position.set(x + (jr() - 0.5) * 0.08, by - BOARD.t / 2 - 0.3, z); o.rotation.set(Math.PI, 0, 0); o.updateMatrix(); joints.setMatrixAt(i, o.matrix)
  }
  bgp.add(bodies, caps, fillets, pins, tails, spacers, joints)
  // a fibre of lint that settled on the board
  bgp.add(tube(m.lint, wander([V(-4, top0 + 0.05, -4), V(-2.5, top0 + 0.12, -3.2), V(-1.2, top0 + 0.05, -4.6), V(0.4, top0 + 0.2, -3.9)], 0.3, 3, 2, 24), 0.035, 48, 5))
  // ── USB-C cable leaving the board (plug overmold, ribbed strain relief, cable sagging away) ─────────────────────
  const u0 = LAYOUT.usb[1]
  const plugZ = u0.z + 3.7 + 8
  bgp.add(box(m.shell, 8.3, 2.5, 3, u0.x, top0 + 1.63, u0.z + 4.9, 1)) // plug shell (inserted)
  const plug = new THREE.Group()
  plug.add(box(m.cable, 12, 6.5, 13, 0, 0, -1.2, 2.2)) // overmold
  plug.add(box(m.plastic, 5, 0.05, 2.2, 0, 3.26, -2.5)) // moulded logo recess
  for (let k = 0; k < 6; k++) { const rr = cyl(m.cable, 2.45 - k * 0.1, 0.55, 0, 0, 5.6 + k * 0.95, 20); rr.rotation.x = Math.PI / 2; plug.add(rr) }
  const relief = cyl(m.cable, 2.2, 6, 0, 0, 7.5, 20, 1.8)
  relief.rotation.x = Math.PI / 2
  plug.add(relief)
  plug.position.set(u0.x, top0 + 1.63, plugZ); plug.rotation.set(0.015, 0.02, 0.01) // pulled a little by the cable's weight
  bgp.add(plug)
  const cable = tube(m.cable, wander([
    V(u0.x, top0 + 1.63, plugZ + 10), V(u0.x + 2, top0 - 2, plugZ + 25),
    V(u0.x + 10, top0 - 18, plugZ + 42), V(u0.x + 22, top0 - 55, plugZ + 60),
  ], 1.4, 21, 1), 1.9, 120, 14)
  bgp.add(cable); nofit.push(cable)
  // hex standoffs from the camera plate down to the board
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

/** box-projected UVs in mm / tile: each triangle takes the plane its normal faces most */
function boxUV(geo: THREE.BufferGeometry, tile: number) {
  const p = geo.attributes.position, uv = new Float32Array(p.count * 2)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3()
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2)
    n.subVectors(c, b).cross(a.clone().sub(b))
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z)
    for (let k = 0; k < 3; k++) {
      const x = p.getX(i + k), y = p.getY(i + k), z = p.getZ(i + k)
      const [u, v] = ax >= ay && ax >= az ? [z, y] : ay >= az ? [x, z] : [x, y]
      uv[2 * (i + k)] = u / tile; uv[2 * (i + k) + 1] = v / tile
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
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
    if (mat.userData.tile) boxUV(geo, mat.userData.tile)
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
