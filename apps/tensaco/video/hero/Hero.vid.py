# The tensaco.ai homepage hero: a silent ~21 s background loop cut from the licensed stock clips in
# public/media/video/ (sources and licences: public/media/credits.json). Open this file in the CommandAGI video
# editor to see and edit the timeline; ./build.sh renders it and installs home-hero.mp4, home-hero-720.mp4 and
# home-hero.jpg.
#
# Edit the cut by editing SHOTS: (clip, in, out) in source seconds. Each shot dissolves into the next. The last shot is
# the skyline again, ending on the frame the first shot starts from, so the loop wraps without a visible cut.
from commandagi.design.media import clip, track, transition, video

MEDIA = "../../public/media/video/"
DISSOLVE = 0.6  # seconds of cross-dissolve into each shot

SHOTS = [
    # clip                         in    out     picture
    ("city-skyline-golden-hour",   2.0,  5.2),   # downtown towers at golden hour, slow aerial drift
    ("datacenter-servers",         0.5,  3.7),   # rack-mounted servers, status LEDs
    ("operations-control-room",    1.0,  4.4),   # operators before a wall of displays
    ("substation-crew",            1.5,  4.9),   # line crew at an electrical substation, aerial
    ("lab-oscilloscope",           0.5,  3.7),   # engineer probing a circuit at an oscilloscope
    ("software-team-code-review",  1.0,  4.4),   # a software team reviewing code on a monitor
    ("office-lobby-walking",       2.5,  5.9),   # colleagues walking through a bright lobby
    ("city-skyline-golden-hour",   0.2,  2.0),   # back to the skyline, ending where shot 1 begins (seamless loop)
]


def shots():
    t = 0.0
    for i, (name, in_, out) in enumerate(SHOTS):
        yield clip(
            *([transition(kind="crossDissolve", duration=DISSOLVE)] if i else []),
            src=f"{MEDIA}{name}.mp4", start=round(t, 3), in_=in_, out=out, fit_mode="fill", name=f"{i + 1:02d} {name}",
        )
        t += out - in_


result = video(
    track(*shots(), name="V1"),
    name="Hero", width=1920, height=1080, fps=30, background="#0a1f44",
)
