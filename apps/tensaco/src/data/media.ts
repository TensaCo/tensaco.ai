/**
 * Every photo and video on the site, by role. Files live in public/media/ (licences and sources in
 * public/media/credits.json). Swap a role's file here to change it everywhere it appears.
 */
export type Asset = { kind: 'video' | 'photo'; src: string; poster?: string; alt: string }

const v = (slug: string, alt: string): Asset => ({ kind: 'video', src: `/media/video/${slug}.mp4`, poster: `/media/video/${slug}.jpg`, alt })
const p = (slug: string, alt: string): Asset => ({ kind: 'photo', src: `/media/photo/${slug}.jpg`, alt })

export const MEDIA = {
  homeHero: v('team-collaboration-hero', 'A team collaborating in a modern office'),
  boardroom: v('boardroom-presentation', 'A presentation to executives in a boardroom'),
  podium: v('conference-speaker', 'A speaker addressing an audience from a podium'),
  handshake: v('handshake-deal', 'Business partners shaking hands in a lobby'),
  skyline: v('city-skyline-golden-hour', 'A city business district at dusk'),
  datacenter: v('datacenter-servers', 'An engineer working in a data center'),
  lab: v('lab-oscilloscope', 'Engineers working in a laboratory'),
  coding: v('software-team-code-review', 'A software team reviewing code together'),
  energy: v('substation-crew', 'Power transmission infrastructure'),
  atrium: v('glass-atrium-office', 'People in a multi-storey glass atrium'),
  control: v('operations-control-room', 'Operators in front of a wall of displays'),
  lobby: v('office-lobby-walking', 'People walking through a corporate atrium'),

  execTeam: p('executive-team', 'The TensaCo leadership team talking around a table in the San Francisco office'),
  boardroomPhoto: p('boardroom-meeting', 'A boardroom meeting'),
  conference: p('conference-audience', 'A conference audience'),
  speaker: p('speaker-audience', 'A speaker at a podium'),
  handshakePhoto: p('handshake-office', 'Two people shaking hands'),
  office: p('office-interior', 'A modern office interior'),
  skylinePhoto: p('city-skyline-dusk', 'A city skyline'),
  datacenterPhoto: p('datacenter-engineer', 'Server racks in a data center'),
  labOptics: p('lab-laser-optics', 'Laser optics on a laboratory bench'),
  electronics: p('electronics-bench', 'An electronics test bench'),
  screens: p('engineers-reviewing-screens', 'TensaCo engineers reviewing optics data and code on monitors'),
  energyPhoto: p('transmission-lines', 'Energy infrastructure'),
  sanFrancisco: p('san-francisco', 'A San Francisco street at blue hour, looking toward downtown and the Bay Bridge'),
  hq: p('glass-headquarters', 'A glass office building'),
  executive: p('woman-executive-desk', 'An executive at her desk'),
  phoneWindow: p('man-suit-phone', 'An executive on a call by a window'),
  whiteboard: p('team-whiteboard', 'A team planning at a whiteboard'),
  networking: p('networking-event', 'People talking at a business event'),
  operations: p('operations-center', 'An operations center'),
  cleanroom: p('cleanroom-engineers', 'Engineers in a clean room'),
  engineeringLab: p('engineering-team-lab', 'An engineering team in a lab'),
  substationPhoto: p('substation', 'An electrical substation'),
  teamScreen: p('team-presentation-screen', 'A team presentation'),
} satisfies Record<string, Asset>
