# Kessoku Band sprites: the animation brief (v2)

How the six moods move. The timelines live in `src/anim/moods.ts` as keyframes with holds, 10
frames a second (100 ms a frame, the mod's sprite clock). Read `ART-BRIEF.md` first: the poses,
faces, sway overlays, squash and head offsets named here are drawn there.

## Principles (what v1 lacked)

- **Never a dead frame.** Something always lives: a breath, a sway of the hair, a blink, an effect
  drifting. A loop that is only face swaps reads as a slideshow.
- **Overlapping action.** The body leads, the hair follows a frame or two later (sway against the
  motion, then settling back), the effects lag behind the body.
- **Anticipation, action, follow-through.** A jump crouches first and lands into a crouch; a
  strum cocks the wrist before the downstroke; a panic starts with a freeze.
- **Ease with holds.** Long holds at the extremes, single frames through the middle. Two frames
  in a row that differ by one pixel of the whole body are a jitter; use them only for panic.
- **Blinks have an in-between:** `half`, `blink`, `half`, then open (300 ms in all), every 2-4 s,
  never on the same beat in two loops that play side by side (stagger them per member).
- **Personality in timing.** Bocchi hesitates and twitches; Nijika is on the beat and bouncy; Ryo
  barely moves and stays cool; Kita sparkles and performs to the crowd.
- **Loops close.** The last frame leads into the first with no pop: same pose, squash 0, sway
  neutral, no effect cut mid-flight unless it fades out.

## The key

```ts
type Key = {
  hold: number            // frames (100 ms each)
  pose: PoseName
  face?: FaceName          // not on the box
  peek?: PeekName          // the box only
  dx?: number; dy?: number // the whole figure moved (shakes, jumps)
  squash?: number          // rows above `bend` lowered: 1 a breath or a beat, 2 a landing
  sway?: 'L' | 'R'         // the hair's ends a step aside
  melt?: number            // 0 whole, 1 a puddle
  fx?: readonly Fx[]       // effects, placed from the portrait window's top-left (the head);
                           // on: 'ground' from the soles, on: 'body' at canvas pixels on the pose
}
```

## The moods (Bocchi's beats; the others follow their notes)

**anxious** (her resting state; about 4 s). Breathing: squash 0 for ~8 frames, 1 for ~6, the hair
swaying R as she sinks and L as she rises, a frame behind. One blink (half-blink-half). She
glances away to the left, the gloom lines (`gloom`) flicker in beside her head (then
held), a sweat drop slides down beside her face over ~6 frames, she blinks it off and looks back.
- Nijika: bright and bouncy, a quick bob (squash 1 for 2 frames) every ~6 frames, ponytail swinging
  after each; a blink; a twinkle.
- Ryo: still. A long slow breath, heavy `half` lids most of the time, one slow blink, a glance;
  her bob tips sway once.
- Kita: confident; a breath; sparkles twinkle beside her eyes in turn (her "Kita aura"); side tail
  sways; one blink.

**focused** (playing; 1.6 s, 16 frames). The strum: stand (on the strings) -> playB (downstroke,
squash 1 on the hit) -> stand -> playA (upstroke), a frame each, four times. The hair sways on the
off-beats. Two notes in flight at a time, rising in an arc from beside the instrument past the
head over ~8 frames each, alternating the single and the beamed note, staggered by 4 frames. A
blink on the last bar (not Ryo: she never blinks mid-song; Nijika smiles through, `focus` all along).
- Nijika: sticks alternate (playA right up / playB left up, stand between), squash 1 on every
  hit, a small impact star at the stick tip on the hits (an `on: 'body'` effect centred on
  `tips[pose]` from her play.ts: it rides with the sticks when they are redrawn).
- Kita: a twinkle at her eye on the downbeat of bars 2 and 4.

**happy** (a jump; about 2 s, 20 frames). crouch 2 frames (anticipation) -> cheer dy -6 (launch) ->
cheer dy -10 -> cheer dy -11 for 2 frames (the hang; sparkles burst out at both sides) -> cheer
dy -6 -> crouch 2 frames (landing; dust puffs at the feet) -> stand squash 1 -> stand `happy` 6
frames with a sparkle twinkling (Kita: a heart) -> stand `idle` 2 frames. The jump height is
capped by headroom: the effects and the ahoge must stay on the canvas.

**panic** (about 1 s, 10 frames). A freeze frame first (panic pose, `panic` face, the bang popping
in small then big), then a shake: dx -2, +2, -1, +1, -2, +2 a frame each, a hop (dy -2) mid-shake,
sweat drops flying off both sides in arcs, a settle frame.

**melting** (about 3 s). The `melt` face 3 frames, sinking into a puddle over ~9 frames
(`melt` 0.1 -> 1, easing in: slow first, fast at the end), drops falling beside her, a long hold
in the puddle (8 frames), oozing back up over 3 frames, a `half` then an `idle` blink.

**hiding** (about 3 s). In the box: `peekL` held, a blink, `peekL`, a duck (the whole figure dy 1
for one frame), `peekR` held, a blink. Ryo dozes instead: `peekBlink`, z's rising one after another.

## The mini

The terminal's 16x16 mini follows the scene on the member's mini rig: the face or peek, the melt
(at half scale), the move scaled down (`dx/2`, `dy/4` kept within -3..1, no squash), the effects
from `FX_MINI` at their portrait-window places halved and pulled inside. Ground effects stay out;
a body effect shows only where it falls inside the portrait window. In the portrait an effect
keyed off the window's edge is pulled in to it: keep Bocchi's left-side effects below window row
15, clear of her clips (window columns 2-8, rows 5-14).

## The slimes (`src/anim/slimes.ts`)

A slime is one act on stage; its loop is its state's, not a mood. The keys are the same kind,
with holds, and each state's loop is one length for the four members, its beats placed member by
member a quarter of the loop apart down the band's row (Bocchi, Nijika, Ryo, Kita), so a row of
slimes ripples. A key: `squash` (rows lower), `stretch` (rows taller), `dy` (the hop), `face`
(Bocchi's `awake`), `z` (where the z is on the slime and on its mini, and its color).

**active** (the act runs; 1.6 s, 16 frames): a bounce and a long hold. A squash on the floor
(anticipation), a stretch (take-off), a hop of one pixel (two frames in the air), a landing squash.
Bocchi hesitates (the squash held two frames) and is awake throughout; Nijika bobs once more on the
off-beat; Ryo bounces once and holds longest; Kita hangs in the air a frame longer, performing.

**idle** (pending or waiting; 2.4 s, 24 frames): a slow breath, squash 1 held 8 frames. Nothing else.

**asleep** (done, failed or killed; 3.2 s, 32 frames): a slower breath (squash 1 held 12 frames)
and a `z` from the 3x5 font drifting up on her open side (Bocchi's and Ryo's right, Nijika's and
Kita's left), twice a loop: 14 frames each, up a row every other frame, a column outward halfway,
fading in (dusk, lavender), held pale, fading out. Mid-tones with no outline, so the z shows on a
dark surface and a light one. On the mini it rises from its own free corner, on frames where the
slime's z moves too.

## The effects in motion

An effect never pops on and off in the same place for a whole loop: it rises, drifts, grows in or
fades (a smaller frame first and last). Notes rise 2 rows a frame and drift a column every other
frame. Sparkles pulse: small (twinkle), big (sparkle), small, gone. Sweat slides 1 row a frame.
