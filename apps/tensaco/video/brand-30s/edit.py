#!/usr/bin/env python3
"""TensaCo 30-second brand film: the edit, as code.

Renders the whole timeline frame by frame (footage decoded by ffmpeg, grade + kinetic typography composited with
numpy/PIL) and pipes it to x264 with the music bed. The shot list and copy are the SHOTS / TEXT tables below; see
SCRIPT.md for the script and sources.

  WORK=/tmp/claude-1000/tensaco-video python3 edit.py            # 1920x1080 master -> $WORK/out/tensaco-brand-30s.mp4
  WORK=... python3 edit.py --preview 0 30                         # fast 960x540 preview of a time range

$WORK must hold: bin/ffmpeg, fonts/ (Inter 4.1 extras/ttf, Archivo.ttf), gen/*.mp4 (fal Veo 3.1 clips),
music/m1.mp3, brand/mark-512.png, and team/{group,engineers}.jpg (from team/_group). Stock clips come from ../../public/media/video.
"""
import math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WORK = os.environ.get('WORK', '/tmp/claude-1000/tensaco-video')
HERE = os.path.dirname(os.path.abspath(__file__))
STOCK = os.path.normpath(os.path.join(HERE, '../../public/media/video'))
FF = os.path.join(WORK, 'bin/ffmpeg')
FPS = 30
DUR = 30.0
PREVIEW = '--preview' in sys.argv
SCALE = 0.5 if PREVIEW else 1.0
W, H = int(1920 * SCALE), int(1080 * SCALE)

NAVY = (10, 31, 68)
NAVY_DEEP = (5, 14, 34)
BLUE_LIGHT = (147, 180, 255)
WHITE = (255, 255, 255)

def src(name):
    if name.startswith('stock:'):
        return os.path.join(STOCK, name[6:] + '.mp4')
    return os.path.join(WORK, name)

# ---------------------------------------------------------------- shot list
# start/end on the timeline (s); file; in-point in the source (s); zoom from->to; speed; grade tweaks
def first(*names):
    return next((n for n in names if os.path.exists(src(n))), names[-1])
SHOTS = [
    # Act 1: the constraint (music: sparse pulse, 0-8 s)
    dict(t=(0.0, 2.0),   f='gen/v01_datacenter.mp4', at=0.6, z=(1.00, 1.06)),
    dict(t=(2.0, 4.0),   f='gen/v02_grid.mp4',       at=0.8, z=(1.02, 1.08)),
    dict(t=(4.0, 6.0),   f='gen/v03_review.mp4',     at=0.8, z=(1.00, 1.05)),
    dict(t=(6.0, 8.0),   f='card:navy'),
    # Act 2: compute (music: drums in, 8-16 s)
    dict(t=(8.0, 10.0),  f='gen/v04_laser.mp4',      at=0.3, z=(1.16, 1.22), cx=0.4),  # cx: crop out a mount's marking
    dict(t=(10.0, 11.0), f='gen/v05b_cavity.mp4',    at=0.2, z=(1.04, 1.08)),
    dict(t=(11.0, 12.0), f='gen/v06_chip.mp4',       at=1.2, z=(1.02, 1.06)),
    dict(t=(12.0, 13.0), f='gen/v07b_align.mp4',     at=1.0, z=(1.00, 1.04)),
    dict(t=(13.0, 16.0), f='gen/v05b_cavity.mp4',    at=2.0, z=(1.12, 1.02), dim=0.45, speed=0.6),
    # Act 3: software and the company (music: full drive, accents at 16 and 20 s)
    dict(t=(16.0, 18.0), f='gen/v08_code.mp4',       at=0.8, z=(1.00, 1.06), dim=0.3),
    # the team (team/_group photos, animated with Veo image-to-video; falls back to a push-in on the still)
    dict(t=(18.0, 20.0), f=first('gen/i02b_engineers.mp4', 'team/engineers.jpg', 'gen/v10_team.mp4'), at=0.8, z=(1.12, 1.18), cx=0.3, dim=0.35),
    dict(t=(20.0, 22.0), f=first('gen/i01_group.mp4', 'team/group.jpg', 'stock:team-collaboration-hero'), at=1.2, z=(1.02, 1.08), dim=0.2),
    dict(t=(22.0, 23.0), f='gen/v09b_skyline.mp4',   at=0.8, z=(1.00, 1.04)),
    # build to the hit: quarter-beat cuts
    dict(t=(23.0, 23.25), f='gen/v04_laser.mp4',     at=2.2, z=(1.20, 1.24), cx=0.4),
    dict(t=(23.25, 23.5), f='stock:datacenter-servers', at=3.0, z=(1.05, 1.08)),
    dict(t=(23.5, 23.75), f='gen/v06_chip.mp4',      at=3.0, z=(1.10, 1.14)),
    dict(t=(23.75, 24.0), f='gen/v02_grid.mp4',      at=3.2, z=(1.10, 1.16)),
    # the hit: end card
    dict(t=(24.0, 30.0), f='card:end'),
]

# ---------------------------------------------------------------- copy
# kind: 'head' (headline on footage, lower left), 'center' (big centred title), 'brand' (product title block)
TEXT = [
    dict(t=(0.25, 2.0),  kind='head', lines=['AI is scaling.']),
    dict(t=(2.2, 4.0),   kind='head', lines=['Its limit is energy.']),
    dict(t=(4.2, 6.0),   kind='head', lines=['And trust.']),
    dict(t=(6.15, 7.9),  kind='center', eyebrow='TensaCo', lines=['Two answers.', 'One company.']),
    dict(t=(8.15, 10.0), kind='head', eyebrow='Compute', lines=['Computation,', 'with light.']),
    dict(t=(10.1, 12.9), kind='head', lines=['Neural-network math,', 'done in an optical cavity.']),
    dict(t=(13.1, 15.95), kind='brand', name='PHASER', font='archivo',
         lines=['A neural accelerator that runs', 'at the speed of light.'], small='Built from an off-the-shelf supply chain  ·  phaser.tensaco.ai'),
    dict(t=(16.05, 19.95), kind='brand', name='TensorCode', font='inter',
         lines=['Write what you know.', 'Train what you don’t.'], small='Part code, part trained model  ·  tensorcode.dev', stagger_lines=1.0),
    dict(t=(20.1, 22.0), kind='head', eyebrow='TensaCo', lines=['Faster, more efficient,', 'accountable AI.']),
    dict(t=(22.05, 23.0), kind='head', lines=['Built in San Francisco.']),
]

# ---------------------------------------------------------------- helpers
FONTS = os.path.join(WORK, 'fonts')
def inter(size, weight='Bold', display=True):
    fam = 'InterDisplay' if display else 'Inter'
    return ImageFont.truetype(os.path.join(FONTS, f'extras/ttf/{fam}-{weight}.ttf'), int(size * SCALE))
def archivo(size, weight='ExtraBold'):
    f = ImageFont.truetype(os.path.join(FONTS, 'Archivo.ttf'), int(size * SCALE))
    f.set_variation_by_name(weight)
    return f

def text_img(s, font, fill, tracking=-0.02):
    """Render a string with letter-spacing (em units) to a tight RGBA image. Returns (img, ascent)."""
    size = font.size
    asc, desc = font.getmetrics()
    x = 0.0
    adv = []
    for i, ch in enumerate(s):
        adv.append(x)
        x += font.getlength(ch) + (tracking * size if i < len(s) - 1 else 0)
        if i < len(s) - 1:  # kerning pair
            x += font.getlength(s[i:i + 2]) - font.getlength(s[i]) - font.getlength(s[i + 1])
    im = Image.new('RGBA', (int(math.ceil(x)) + 4, asc + desc + 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for ch, px in zip(s, adv):
        d.text((px + 2, 2), ch, font=font, fill=fill)
    return im, asc

def ease_out(t):  # expo
    t = min(max(t, 0.0), 1.0)
    return 1.0 if t >= 1 else 1 - 2 ** (-10 * t)

def ease_io(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)

class Words:
    """A line of text split into words that rise and fade in one after another."""
    def __init__(self, s, font, fill, tracking=-0.02):
        self.items = []
        space = font.getlength(' ') + tracking * font.size
        x = 0
        for w in s.split(' '):
            im, asc = text_img(w, font, fill, tracking)
            self.items.append((x, im))
            x += im.width - 4 + space
        self.width = x - space
        self.height = self.items[0][1].height if self.items else 0

    def draw(self, canvas, x0, y0, t, stagger=0.07, dur=0.5, rise=36, alpha=1.0):
        for i, (dx, im) in enumerate(self.items):
            k = ease_out((t - i * stagger) / dur)
            if k <= 0:
                continue
            a = k * alpha
            layer = im if a >= 0.999 else _fade(im, a)
            canvas.alpha_composite(layer, (int(x0 + dx), int(y0 + (1 - k) * rise * SCALE)))
        return len(self.items) * stagger + dur

def _fade(im, a):
    r, g, b, al = im.split()
    al = al.point(lambda v: int(v * a))
    return Image.merge('RGBA', (r, g, b, al))

# ---------------------------------------------------------------- text layouts (pre-rendered)
M = int(150 * SCALE)          # left margin
BOTTOM = int(880 * SCALE)     # baseline area of lower-left headlines

def build_text(item):
    k = item['kind']
    L = dict(item=item, parts=[])
    if k == 'head':
        f = inter(104, 'Bold')
        lines = [Words(s, f, WHITE) for s in item['lines']]
        lh = int(118 * SCALE)
        y = BOTTOM - lh * len(lines)
        if item.get('eyebrow'):
            eb, _ = text_img(item['eyebrow'].upper(), inter(26, 'SemiBold', False), BLUE_LIGHT, tracking=0.16)
            L['parts'].append(('eyebrow', eb, M + int(64 * SCALE), y - int(52 * SCALE) if lines else BOTTOM - int(40 * SCALE), 0.0))
        for i, ln in enumerate(lines):
            L['parts'].append(('words', ln, M, y + i * lh, 0.12 + i * 0.16))
    elif k == 'center':
        f = inter(150, 'ExtraBold')
        lines = [Words(s, f, WHITE, tracking=-0.03) for s in item['lines']]
        lh = int(168 * SCALE)
        y = H // 2 - lh * len(lines) // 2 + int(20 * SCALE)
        eb, _ = text_img(item['eyebrow'].upper(), inter(28, 'SemiBold', False), BLUE_LIGHT, tracking=0.2)
        L['parts'].append(('eyebrow_c', eb, (W - eb.width) // 2, y - int(70 * SCALE), 0.0))
        for i, ln in enumerate(lines):
            L['parts'].append(('words', ln, (W - ln.width) // 2, y + i * lh, 0.1 + i * 0.45))
    elif k == 'brand':
        name_font = archivo(200, 'ExtraBold') if item['font'] == 'archivo' else inter(190, 'ExtraBold')
        name, _ = text_img(item['name'], name_font, WHITE, tracking=0.02 if item['font'] == 'archivo' else -0.035)
        f = inter(72, 'SemiBold')
        lines = [Words(s, f, WHITE) for s in item['lines']]
        sm, _ = text_img(item['small'], inter(38, 'SemiBold', False), (190, 208, 255), tracking=0.005)
        lh = int(86 * SCALE)
        y_name = int(250 * SCALE)
        L['parts'].append(('name', name, M - int(8 * SCALE), y_name, 0.0))
        y = y_name + name.height + int(40 * SCALE)
        st = item.get('stagger_lines', 0.25)
        for i, ln in enumerate(lines):
            L['parts'].append(('words', ln, M, y + i * lh, 0.35 + i * st))
        L['parts'].append(('small', sm, M, y + len(lines) * lh + int(44 * SCALE), 0.9 + (len(lines) - 1) * st))
    return L

def draw_text(canvas, L, t):
    item = L['item']
    t0, t1 = item['t']
    lt = t - t0
    out = 1.0
    if t1 - t < 0.2:  # exit fade
        out = max(0.0, (t1 - t) / 0.2)
    for kind, obj, x, y, delay in L['parts']:
        tt = lt - delay
        if tt <= 0:
            continue
        if kind == 'words':
            obj.draw(canvas, x, y, tt, alpha=out)
        elif kind in ('eyebrow', 'eyebrow_c'):
            k = ease_out(tt / 0.5)
            if kind == 'eyebrow':  # blue rule, then the label
                ImageDraw.Draw(canvas).rectangle([M, y + obj.height // 2 - int(2 * SCALE), M + int(48 * SCALE * k), y + obj.height // 2 + int(1 * SCALE)],
                                                 fill=(37, 99, 235, int(255 * out)))
            canvas.alpha_composite(_fade(obj, k * out), (int(x - (1 - k) * 20 * SCALE), int(y)))
        elif kind == 'name':  # wordmark: wipe in from the left with a slight rise
            k = ease_out(tt / 0.7)
            cw = max(1, int(obj.width * k))
            crop = obj.crop((0, 0, cw, obj.height))
            canvas.alpha_composite(_fade(crop, min(1.0, k * 1.4) * out), (int(x), int(y + (1 - k) * 24 * SCALE)))
        elif kind == 'small':
            k = ease_out(tt / 0.5)
            canvas.alpha_composite(_fade(obj, k * out), (int(x), int(y + (1 - k) * 16 * SCALE)))

# ---------------------------------------------------------------- footage
def decode(path, at, dur, speed=1.0):
    """Frames of a clip (or a still) at 30 fps, covering the output size, as an array (n, h, w, 3)."""
    n = int(round(dur * FPS))
    # decode a bit larger than the frame so the push-in has pixels to work with
    ow, oh = int(W * 1.16), int(H * 1.16)
    if path.endswith('.jpg') or path.endswith('.png'):
        im = Image.open(path).convert('RGB')
        s = max(ow / im.width, oh / im.height)
        im = im.resize((int(im.width * s + 1), int(im.height * s + 1)), Image.LANCZOS)
        l, u = (im.width - ow) // 2, (im.height - oh) // 2
        a = np.asarray(im.crop((l, u, l + ow, u + oh)))
        return np.repeat(a[None], n, axis=0)
    vf = f'setpts=PTS/{speed},fps={FPS},scale={ow}:{oh}:force_original_aspect_ratio=increase:flags=lanczos,crop={ow}:{oh}'
    cmd = [FF, '-v', 'error', '-threads', '4', '-ss', f'{at:.3f}', '-i', path, '-t', f'{dur * speed + 0.5:.3f}', '-vf', vf,
           '-frames:v', str(n), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, oh, ow, 3)
    if len(a) < n:  # hold the last frame if the source runs out
        a = np.concatenate([a, np.repeat(a[-1:], n - len(a), axis=0)])
    return a

def push(frame, z, cx=0.5):
    """Centre crop at zoom z (1 = the full decode, up to 1.16 without upscaling) and resize to W x H."""
    oh, ow = frame.shape[:2]
    cw, ch = min(ow / z, ow), min(oh / z, oh)  # z=1: the whole (16% overscanned) decode
    l, u = min(max(cx * ow - cw / 2, 0), ow - cw), (oh - ch) / 2
    return np.asarray(Image.fromarray(frame).resize((W, H), Image.BICUBIC, box=(l, u, l + cw, u + ch)))

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
_r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIGNETTE = (1 - 0.32 * np.clip(_r - 0.45, 0, 1) ** 1.5)[..., None]
# left-side shade behind lower-left headlines
SHADE_L = np.clip(1 - (xx / (W * 0.75)), 0, 1) ** 1.3 * np.clip((yy / H) * 1.3, 0.35, 1)
SHADE_L = SHADE_L[..., None].astype(np.float32)
rng = np.random.default_rng(7)
GRAIN = [rng.normal(0, 3.2, (H, W, 1)).astype(np.float32) for _ in range(6)]

def grade(f, dim=0.0, shade=0.0, i=0):
    x = f.astype(np.float32)
    # gentle filmic contrast and a cool shadow tint to unify generated and stock footage
    x = 255 * (1 / (1 + np.exp(-((x / 255) - 0.5) * 5.2)) - 0.069) / 0.862
    x = x * VIGNETTE
    lum = x.mean(axis=2, keepdims=True)
    shadow = np.clip(1 - lum / 110, 0, 1)
    x += shadow * np.array([-3, 2, 8], np.float32)
    if dim:
        x = x * (1 - dim) + np.array(NAVY_DEEP, np.float32) * dim
    if shade:
        a = SHADE_L * shade
        x = x * (1 - a) + np.array(NAVY_DEEP, np.float32) * a
    x += GRAIN[i % len(GRAIN)]
    return np.clip(x, 0, 255).astype(np.uint8)

# ---------------------------------------------------------------- cards
def navy_bg(t, drift=0.0):
    """Deep navy with a soft moving glow."""
    cx = W * (0.35 + 0.1 * math.sin(t * 0.6 + drift))
    cy = H * (0.4 + 0.05 * math.cos(t * 0.5))
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / W
    glow = np.exp(-(d / 0.42) ** 2)[..., None]
    base = np.array(NAVY_DEEP, np.float32) + glow * (np.array((26, 58, 120), np.float32) - np.array(NAVY_DEEP, np.float32))
    return base

_mark = None
def end_card(t):
    """t: seconds since the hit."""
    global _mark
    if _mark is None:
        m = Image.open(os.path.join(WORK, 'brand/mark-512.png')).convert('RGBA')
        s = int(150 * SCALE)
        m = m.resize((s, s), Image.LANCZOS)
        mask = Image.new('L', (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(26 * SCALE), fill=255)
        m.putalpha(mask)
        word, _ = text_img('TensaCo', inter(190, 'ExtraBold', False), WHITE, tracking=-0.035)
        tag = Words('Intelligence infrastructure for the enterprise.', inter(58, 'Medium'), (225, 232, 245), tracking=-0.01)
        url, _ = text_img('tensaco.ai', inter(48, 'SemiBold', False), BLUE_LIGHT, tracking=0.02)
        _mark = (m, word, tag, url)
    m, word, tag, url = _mark
    bg = navy_bg(24 + t)
    canvas = Image.fromarray(np.clip(bg + GRAIN[int(t * FPS) % 6] * 0.6, 0, 255).astype(np.uint8)).convert('RGBA')
    gap = int(40 * SCALE)
    total = m.width + gap + word.width
    x0 = (W - total) // 2
    ylogo = int(H * 0.40) - m.height // 2
    k = ease_out(t / 1.1)
    sc = 1.0 + 0.06 * (1 - k)
    # mark: scale settle
    ms = m.resize((int(m.width * sc), int(m.height * sc)), Image.LANCZOS)
    canvas.alpha_composite(_fade(ms, min(1, k * 1.5)), (x0 - (ms.width - m.width) // 2, ylogo - (ms.height - m.height) // 2))
    # wordmark: wipe in after the mark
    kw = ease_out((t - 0.15) / 0.9)
    if kw > 0:
        cw = max(1, int(word.width * kw))
        wy = ylogo + (m.height - word.height) // 2 - int(6 * SCALE)
        canvas.alpha_composite(_fade(word.crop((0, 0, cw, word.height)), min(1, kw * 1.3)), (x0 + m.width + gap, wy + int((1 - kw) * 20 * SCALE)))
    tag.draw(canvas, (W - tag.width) // 2, ylogo + m.height + int(80 * SCALE), t - 0.9, stagger=0.05, dur=0.6, rise=24)
    ku = ease_out((t - 1.8) / 0.6)
    if ku > 0:
        # thin rule and the address
        ImageDraw.Draw(canvas).rectangle([(W - int(64 * SCALE)) // 2, int(H * 0.80) - int(40 * SCALE), (W + int(64 * SCALE)) // 2, int(H * 0.80) - int(37 * SCALE)], fill=(37, 99, 235, int(255 * ku)))
        canvas.alpha_composite(_fade(url, ku), ((W - url.width) // 2, int(H * 0.80) + int((1 - ku) * 12 * SCALE)))
    return canvas

# ---------------------------------------------------------------- render
def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    t_from, t_to = (float(args[0]), float(args[1])) if len(args) >= 2 else (0.0, DUR)
    out_dir = os.path.join(WORK, 'out')
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, 'preview.mp4' if PREVIEW else 'video-only.mp4')
    enc = subprocess.Popen([FF, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-threads', '4', '-preset', 'medium' if not PREVIEW else 'veryfast',
                            '-crf', '12' if not PREVIEW else '23', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    texts = [build_text(x) for x in TEXT]
    shade_until = {}
    for x in TEXT:
        if x['kind'] in ('head', 'brand'):
            shade_until[x['t']] = 0.55 if x['kind'] == 'head' else 0.62
    for sh in SHOTS:
        a, b = sh['t']
        if b <= t_from or a >= t_to:
            continue
        a2, b2 = max(a, t_from), min(b, t_to)
        n = int(round((b2 - a2) * FPS))
        f = sh['f']
        frames = None
        if not f.startswith('card:'):
            path = src(f)
            sp = sh.get('speed', 1.0)
            frames = decode(path, sh.get('at', 0) + (a2 - a) * sp, b2 - a2, sp)
        for i in range(n):
            t = a2 + i / FPS
            k = (t - a) / (b - a)
            if f == 'card:end':
                canvas = end_card(t - a)
                img = np.asarray(canvas.convert('RGB')).astype(np.float32)
                # flash on the hit, fade out at the end
                fl = max(0.0, 1 - (t - a) / 0.28) ** 2 * 0.85
                img = img * (1 - fl) + 255 * fl
                fo = ease_io((t - 29.2) / 0.8)
                img = img * (1 - fo)
                frame = np.clip(img, 0, 255).astype(np.uint8)
            else:
                if f == 'card:navy':
                    base = np.clip(navy_bg(t) + GRAIN[i % 6] * 0.6, 0, 255).astype(np.uint8)
                else:
                    z0, z1 = sh.get('z', (1.0, 1.04))
                    z = z0 + (z1 - z0) * ease_io(k) if (b - a) > 0.5 else z0 + (z1 - z0) * k
                    shade = 0.0
                    for tx in TEXT:
                        if tx['t'][0] - 0.3 <= t <= tx['t'][1] + 0.1 and tx['kind'] in ('head', 'brand'):
                            ramp = min(1.0, (t - tx['t'][0] + 0.3) / 0.4, (tx['t'][1] + 0.1 - t) / 0.3)
                            shade = max(shade, ramp * (0.6 if tx['kind'] == 'head' else 0.7))
                    base = grade(push(frames[i], z, sh.get('cx', 0.5)), dim=sh.get('dim', 0.0), shade=shade, i=i)
                canvas = Image.fromarray(base).convert('RGBA')
                for L in texts:
                    t0, t1 = L['item']['t']
                    if t0 <= t < t1:
                        draw_text(canvas, L, t)
                frame = np.asarray(canvas.convert('RGB'))
            enc.stdin.write(frame.tobytes())
        print(f'{a:5.2f}-{b:5.2f} {f}', flush=True)
    enc.stdin.close()
    enc.wait()
    print('wrote', out)

if __name__ == '__main__':
    main()
