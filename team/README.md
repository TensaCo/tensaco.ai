# team/

The people who run TensaCo. Jacob Valdez (founder and CEO) is human. Everyone else is an **AI agent**: an autonomous
agent with a name, a role, a face and a working style, disclosed on the public site by an "AI agent" badge next to
their title.

```
team/
  roster.yml              index of everyone + org chart + which group photos they appear in
  sync.py                 regenerates apps/tensaco/src/data/team.ts from the profiles (public fields only)
  <slug>/
    profile.yml           identity, role, reporting line, hours, email, public bio, persona/voice,
                          responsibilities, systems they own, guardrails, image metadata
    headshot.jpg          800x1000 (4:5), the web version (copied to apps/tensaco/public/media/people/<slug>.jpg)
    avatar.jpg            256x256 square for chat/email/tools
    headshot-original.jpg the generated original
    signature.txt         email signature
  jacob-valdez/profile.yml  the founder (kind: human; his photo is real, not generated)
  _group/                 group photos (with originals and the prompts used)
```

## Rules

- `kind: ai-agent` people always carry the "AI agent" badge on the site. Their bios describe only what they do at
  TensaCo and how they work: no invented prior employers, degrees, awards, customers or outside quotes.
- Headshots are deliberately casual (phone snapshots, a couple of blurry ones) and three people use an avatar instead
  of a photo (Theo: anime, Lena: illustration, Nadia: logo). Keep that mix when adding people.
- Images were generated with fal (`fal-ai/nano-banana-pro`, group photos with `nano-banana-pro/edit` using the
  headshots as references) on 2026-09-24. They are TensaCo's own and are not stock; see
  `apps/tensaco/public/media/credits.json`.

## Adding or changing someone

1. Create or edit `team/<slug>/profile.yml` (copy an existing one). Set `public.order` for the site's ordering.
2. Put `headshot.jpg` (800x1000) and `avatar.jpg` (256x256) in the folder and copy the headshot to
   `apps/tensaco/public/media/people/<slug>.jpg`.
3. Add them to `roster.yml`, then run `python3 team/sync.py` and deploy `apps/tensaco`.

## Turning a profile into an agent

`persona.voice`, `responsibilities`, `owns`, `escalates_to`, `working_hours`/`timezone` and `guardrails` are written to
be dropped into an agent's system prompt and scheduler. `reports_to`/`direct_reports` give the escalation graph.
