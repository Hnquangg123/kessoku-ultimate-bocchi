# Kessoku Band: character notes for the sprites

Researched design notes for the four members of Kessoku Band (*Bocchi the Rock!*, anime by
CloverWorks; anime character design by Kerorira, from Aki Hamaji's manga), written so the v2
sprites (`ART-BRIEF.md`) can draw them accurately and recognisably in the hand of
`reference/bocchi-reference.jpg`.

**Where the colors come from.** The "official fill" hex values were sampled from the official
character art: the TV site's full-body art (`bocchi.rocks/tv/.../character/<member>/main.png`,
the school-uniform designs) and the 2024 omnibus-film art (`bocchi.rocks/omnibus/...`, band
T-shirts). They were taken pixel by pixel from the flat cel fills, so they are exact for the
TV art. The film grades the same colors a little softer and paler. The **sprite ramps** are
*derived*: the official base and shadow, plus a lighter tone and a dark outline tint. They
follow the reference's rules (shadows cooler and more saturated, lights warmer and paler,
outlines a dark tint of the local color) and are tuned to sit beside the reference's pinks. The
derived values are a proposal, not canon. Check them on the sheet.

**Left and right.** "Viewer's left/right" always means *as seen when she faces the viewer*.
The sprites stand three-quarter, facing the viewer's right, so a character's own right side
(viewer's left) is the **near** side, open to view (like Bocchi's clips in the reference). Her
own left side (viewer's right) is the **far** side, half behind the face and hair.

---

## Corrections to `ART-BRIEF.md` (the research disagrees with it)

| member | brief says | the official art and sources show |
| --- | --- | --- |
| Kita | side tail on the **viewer's left** | side tail on the **viewer's right** (her own left). The TV art, the film art and the Good Smile Nendoroid all agree |
| Kita | cherry-red double-cut guitar with a white guard | **Pelham Blue** (light turquoise) **Gibson Les Paul Junior Double Cutaway**, black pickguard, one black P-90, nickel hardware. In the story it is Ryo's guitar, lent to her |
| Kita | "white shirt, red ribbon" | Shuka uniform as she wears it: a **beige/camel cardigan** over a sailor-collared blouse (cream collar with one dark stripe), a red bow, the charcoal Shuka skirt, **white loose socks**, brown loafers |
| Nijika | white blouse, red ribbon tie, black socks, brown loafers | white shirt, **dark grey V-neck sweater vest**, a **big red bow with pink polka dots**, navy skirt, **white short socks**, **red sneakers** (white laces and soles) |
| Nijika | (ponytail tie not given) | the side tail is tied with a **hair-yellow scrunchie** |
| Ryo | jazz-bass body, sunburst or white, tortoiseshell guard | **Fender Precision Bass, Olympic White** (cream white), **mint-green pickguard**, rosewood board, chrome hardware |
| Ryo | amber-gold eyes; black shoes; one clip | **yellow / lemon-gold** eyes; **black tights** and **brown loafers**; **two** dark bar hairpins; a **mole under her left eye** (viewer's right) |
| Bocchi | (fine as drawn) | the anime's eyes are aqua/turquoise, lighter and greener than the reference's blue, and the anime's socks are black knee socks. **Keep the reference** for both: it is the art |

---

## 1. Hitori "Bocchi" Gotoh (後藤ひとり): lead guitar

Shuka High (秀華高校), 1st year. The JA Wikipedia gives her height as 156 cm.

### Hair
- **Color.** Soft pink, with a cool mauve shadow.
  - Official TV fills: base `#f7a2b6`, shadow `#b2678d`, sheen `#fedfe6`.
  - Film fills: base `#f9a9bc`, light `#f9b7c6`, shadow `#b6677f`.
- **Sprite ramp: use the reference's as is.** Light `H #fcc7cd`, base `h #eba2b3`, shadow
  `r #b76c8d`, outline `p #542549` (plum).
- **Length.** Very long and straight. It falls behind her to the hips or the tops of the thighs.
  It is loose and untied, and its tips are slightly ragged and fanned.
- **Bangs.** Heavy bangs reach the eyes and shade them. One or two long strands hang down
  *between* the eyes. Long side locks frame the face down to the chest.
- **Parting.** No clear part. The bangs fall straight from the crown.
- **Ahoge.** A thin strand that arcs up and out over the **viewer's left** side, from above
  the clips. The TV art, the film art and the reference all show it this way.
- **Accessories: two cube hair clips** on her right side (**viewer's left**), at temple height,
  stacked: the **blue cube on top**, the **yellow cube below**. The JA Wikipedia names them as
  one light blue and one yellow, on the right side.
  - Official fills: blue `#4589bc` / `#519dc5`, light `#dcf5fa`. Yellow about `#c4a644`.
  - The reference's facets (`b C B c n` and `Y Z z q u v`) are the ones to use. Each cube is
    about 4x4 px at our density.

### Eyes
- **Color.** In the anime: a dark navy upper iris (`#1a3567` / `#254576`) over a bright aqua
  lower iris (`#7ad7e6` / `#86dae4`), a pale mint lower glint (`#ddf2d1`) and a white catchlight.
  **Sprites keep the reference's eyes:** `E #4e65b5`, `e #4e9ae5`, pupil `M #323253`, glints
  `Q #c6dbd0` / `W #f8fbf3`, lavender `L #a89cd1`, lid line `n #292847`.
- **Shape.** Large and round, with the outer corners drooping (anxious). The upper lash line is
  heavy.
- **Typical expression.** Shy and evasive: eyes sliding aside, a tiny flat mouth, a blush. In
  the TV key art a **grey gloom shadow** falls across her eyes, the series' visual shorthand for
  her dread.

### Outfit (always the same, on stage and at school)
- **Track jacket ("jersey").** Pink, a little warmer and more salmon than her hair.
  - Official fills: `#f7aab0`, shade `#c8718f`.
  - Reference: `j #efa2a8`, `J #ce798c`, `k #be6a84`, `K #8e3a5b`.
  - **High stand collar, zipped to the chin.** White zipper tape down the center front.
  - **One white stripe down each sleeve**, from the shoulder seam to the cuff. The TV art shows
    one stripe. Whether the anime ever shows two is *uncertain*.
  - Ribbed cuffs. The sleeves are long and baggy, and the hands are often half hidden.
- **Skirt.** The Shuka uniform's skirt under the jacket: a charcoal blue-grey pleated skirt,
  knee length.
  - Official fill `#5f636d`, shadow `#2d3241`.
  - The reference uses grey-purple `g #625566` / `G #3e3546`. **Keep the reference.**
- **Socks.** Black knee socks in the anime (`#404042`). The reference draws them over the knee,
  in `g`/`G`. **Keep the reference.**
- **Shoes.** Brown penny loafers. Official `#7c4d38`, dark `#543326`. The reference uses its
  orange-brown shoe ramp (`f F D d x`).
- **Alternative look.** In the 2024 film art: a black Kessoku Band T-shirt (a white logo with a
  ring), a dark pleated skirt, pink leggings, black slip-on shoes and a black wristband. Not used
  for the sprites.

### Instrument
- **The guitar.** Her father's **Gibson Les Paul Custom, Ebony**: a black body with gold
  hardware. Automaton names it a 1968 reissue. The Epiphone "Bocchi Edition" replica confirms
  the glossy black body and gold pickups and hardware.
- **Details for the pixels:**
  - Multi-ply cream binding on the body and neck. The reference renders the binding as gold
    (`A #f0af63`, `a #feda8b`). Keep it.
  - Two gold-covered humbuckers, a gold bridge and tailpiece.
  - A black pickguard.
  - An ebony fingerboard with pearl block inlays.
  - A black headstock with 3+3 gold tuners (the reference's gold dots).
- **How she holds it.** Strap over her left shoulder, the body at the hip, the neck rising to the
  viewer's right at about 30-35 degrees. She is right-handed: the left hand frets, the right hand
  picks.
- **Later guitar.** After episode 12 she gets a **Yamaha Pacifica** (customised PAC611 type):
  a glossy black body, black pickguard, black P-90 cover, chrome ring, Wilkinson vibrato. Not
  needed for v2.

### Personality cues for animation
- She hunches, shoulders up and head down, and takes up as little space as she can. A hand
  clutches her jacket collar at her chin (the TV pose). The eyes dart away. She fidgets.
- She opens almost every line with a stammered "a-" (the official profile notes it). She
  hesitates before every action, then twitches.
- When she plays she transforms: genuinely skilled, focused, the hair flying. Her playing is the
  one confident thing about her, so `focused` should look sure of itself.
- She reacts by freezing first, then falling apart physically.

### Iconic gags and motifs worth a frame
- **Hiding in a box.** At her first live (episode 1) she plays from inside a cardboard
  **"ripe mango" (完熟マンゴー) box**. The JA Wikipedia also lists hiding in trash bins. → our
  `box` pose. A tiny 2-3 px label smudge on the box side would nod to it.
- **Melting and disintegrating.** Under social stress she melts into a puddle, crumbles to dust
  and blows away, or her face "collapses" into a crude, blank one (the JA Wikipedia mentions the
  face collapse). → `melt`. The art-style switches (8-bit, clay and so on) are seen in the show,
  but the specific episodes are *uncertain*.
- **The stress marks and the gloom.** The four short strokes beside her cheek (in the
  reference), sweat drops, and the grey shadow over her eyes.
- **Also:** her failed stage dive, falling flat on her face (episode 12), and the string that
  snaps mid-song, rescued with a glass sake-bottle slide (episode 12).

### Draw it like this
`REF_STAND` as drawn: a pink waterfall of hair down her back, the cubes (blue over yellow) and the
looping ahoge on the viewer's left, a zipped pink track jacket with one white sleeve stripe, a
grey-purple pleated skirt, dark socks, orange-brown loafers, a black gold-bound Les Paul. Hunched
and shy at rest, sure-handed when playing.

---

## 2. Nijika Ijichi (伊地知虹夏): drums, band leader

Shimokitazawa High (下北沢高校), 2nd year. The JA Wikipedia gives her height as 154 cm. Her
sister Seika runs the live house STARRY.

### Hair
- **Color.** Warm golden blonde, with orange-amber shadows.
  - Official TV fills: base `#f1ce5f`, light `#f3d670`, sheen `#fbf3d6`, shadow `#cd842f`
    (deeper `#c37c2c`).
  - Film fills: base `#f3d87d`, light `#f5df94`, shadow `#cc9656`.
- **Sprite ramp (derived):**

  | tone | hex |
  | --- | --- |
  | light | `#fbe7a1` |
  | base | `#f0cc62` |
  | shadow | `#cd8a3a` |
  | deep shadow (optional) | `#a5612b` |
  | outline | `#5e3428` (a warm brown with a plum lean, so it sits beside the reference's `p` and `o`) |

- **Length and shape.** Long. Most of it is gathered into **one high side ponytail on her own
  left, the viewer's RIGHT**. The tail is long and straight and reaches about the waist. Its end
  splits into a few pointed locks that swing.
- **Bangs.** Choppy, side-swept, open at the forehead's center. Long **side locks** fall to the
  jaw or collarbone on both sides. The viewer's-left side has a fuller loose section that flares
  out at chin height.
- **Ahoge: "the Dorito".** One **flat, solid triangular tuft** stands on the crown, slightly
  left of center, its tip leaning toward the viewer's left. It reads like a corn chip: the fan
  nickname is "Nijika Doritos" (Pixiv has the tag). At our density: about 5-6 px tall with a
  4-5 px base, outlined, the light tone on its right face.
- **Tie.** A **scrunchie in the hair's own yellow**, seen in the film art and the Nendoroid. It
  shows as a bumpy ring, about 3x4 px, where the tail leaves the head.
- **The far side.** In our three-quarter view the tail hangs from the upper right of the head,
  behind the far shoulder. It is the hair that `sway` moves.

### Eyes
- **Color.** Red-orange (vermilion), darkening to maroon at the top and glowing gold at the
  bottom.
  - Official film fills: dark `#561c19` / `#904440`, base `#d5543d` / `#d65a43`, lower glow
    `#f3dda7` / `#dc7458`, a white glint.
- **Sprite eyes (derived):**

  | part | hex |
  | --- | --- |
  | iris dark | `#8f3b36` |
  | iris light | `#d9573f` |
  | lower glow | `#f2c27a` (one or two px) |
  | pupil | `#4a1c1c` |
  | glint | `W #f8fbf3` |
  | lid line | `#3a2229` (a warm dark, in place of the reference's navy `n`) |

- **Shape.** Big, round and wide open, the lashes flicking up at the outer corners.
- **Typical expression.** A big, open, toothy grin with bright eyes. Her other stock face is
  the **exasperated** straight-man look (a Nendoroid face): half-lidded and flat-mouthed.

### Outfit (school, the TV design)
- **Shirt.** White, long-sleeved, collared. Official `#efefef`. Use a cool shade like
  `#c9cad6`.
- **Sweater vest.** **Dark grey, V-neck**, worn over the shirt.
  - Official `#49494d`. Shade about `#2e2e36`, light `#5e5e66`.
- **Bow.** A **big red bow with pink polka dots** at the collar. The JA Wikipedia notes that she
  always wears a polka-dot ribbon somewhere.
  - Official red `#d33950`, dots `#ef657a`. Shade about `#9c2238`, outline `#4e1426`.
  - At our density: about 10-12 px wide, with 1-2 dot pixels per loop.
- **Skirt.** Navy pleated, knee length.
  - Official `#2c3c61`, deep `#1b1c3a`. Light about `#415584`.
- **Socks.** **White short socks**, slouched at the ankle or low calf. Official `#ebebe7`. Her
  legs are bare from the skirt down.
- **Shoes.** **Red sneakers** with white laces and soles.
  - Official red `#cb3341`, shadow `#93212e`. Light about `#e65a5f`, soles `#f2f2ee`.
- **Alternative look.** In the film art: a black band T-shirt, plaid beige trousers with
  braces, the polka-dot bow, black sneakers.

### Instrument
- **The kit.** A **TAMA Imperialstar** in **Vintage Red** (Wikipedia).
  - Fan sources add a 22" bass drum with a porthole and a Pearl Chad Smith signature snare
    (black). *Uncertain:* from the Fandom wiki via search snippets, not verified.
  - The cymbals are not identified (*uncertain*).
  - Aniplex's 1/7 figure reproduces the TAMA logo, with the cooperation of Hoshino Gakki.
- **Kit colors, if drawn.** Shell red about `#b8282e`, chrome `#c9d1d6`, coated heads about
  `#eeeae0`, cymbal brass about `#d9b85a`. These are derived, not sampled.
- **Sticks.** Plain **natural light wood**, the same color tip to butt in the Nendoroid. Wood
  about `#e5b789`, shade `#c4935f`. The brief's darker tips are optional, a readability choice,
  not canon. Each stick about 1 px thick and 12-14 px long.
- **How she holds them.** Matched grip, one in each fist. At rest the sticks are crossed low
  before her, or tapped together to count in.

### Personality cues for animation
- Bright, bouncy, and **on the beat**: quick little bobs, a heel kicked up behind her (the TV
  pose), hands clasped behind her back when idle (the TV pose), a wave.
- She plays with a big grin all through the song, the ponytail whipping on every hit. A
  count-in clacks the sticks over her head.
- She is the band's caretaker and straight man. She reacts to nonsense with an exasperated
  deadpan and hands on hips, then bounces straight back to sunny.

### Iconic gags and motifs worth a frame
- **The Dorito ahoge.** Let it bob or twitch a frame after her head (secondary motion). Its
  triangle is her silhouette signature in the 16x16 mini.
- **The exasperated straight-man face** at Ryo's antics: half lids, a flat line mouth, maybe a
  sweat drop.
- **The count-in:** sticks crossed and clacked high, with an impact star at the cross.

### Draw it like this
Sunny blonde with a flat triangle ahoge and a long side tail high on the viewer's right (yellow
scrunchie). Red-orange eyes and a toothy grin. White shirt, dark grey V-neck vest, a huge red
polka-dot bow, navy pleats, bare legs, white socks, red sneakers, light wooden sticks crossed low.
Always moving, always smiling.

---

## 3. Ryo Yamada (山田リョウ): bass, composer

Shimokitazawa High, 2nd year, Nijika's best friend. Her height was not confirmed here
(*uncertain*).

### Hair
- **Color.** Deep cobalt blue.
  - Official TV fills: base `#375fa5`, light `#3f66aa` / `#486dae`, sheen `#a2bedd`, shadow
    `#1b2b60` / `#1e2e64`, mid shadow `#2b4679`.
  - Film fills: base `#4d6da5`, shadow `#2c437b`.
- **Sprite ramp (derived):**

  | tone | hex |
  | --- | --- |
  | sheen (the highlight band) | `#a2bedd` |
  | light | `#5d8ccc` (nudged toward cyan, so it reads warmer) |
  | base | `#375fa5` |
  | shadow | `#233a78` |
  | deep (inner hair, the underside of the bob) | `#1b2b60` |
  | outline | `#161a3d` |

- **Length and shape.** A short, **asymmetric bob** around the jaw.
  - **Viewer's left (her right):** the hair hangs lower and the ends flip outward a little.
  - **Viewer's right (her left):** the hair is **tucked behind the ear**, so the ear shows.
- **Bangs.** Uneven, with a long lock falling over the **viewer's-left eye** and partly hiding
  it. No ahoge.
- **Accessories.**
  - **Two dark bar hairpins**, parallel, slanting, on the viewer's-left side lock at cheek
    height. Official `#4a4b59`; they read near black, with a grey glint. At our density: two
    1-px bars about 5 px long, 2 px apart.
  - **A mole** under her **left eye (viewer's right)**: one dark pixel, about `#5a3a3a`, below
    the outer corner. In three-quarter view it sits under the far eye.
  - Ear piercings on the tucked ear (viewer's right). This is the far side in three-quarter
    view, so they are optional.

### Eyes
- **Color.** Yellow, lemon-gold.
  - Official film fills: upper iris olive-brown `#403620` / `#7f7156`, iris `#e5db69` /
    `#e7dd75`, lower `#faf2ca`, a white glint.
- **Sprite eyes (derived):**

  | part | hex |
  | --- | --- |
  | iris dark | `#6f6034` |
  | iris light | `#e3d566` |
  | lower | `#f8f0c0` |
  | pupil | `#3b3222` |
  | glint | `W` |
  | lid line | the reference's navy `n #292847` (it suits her hair) |

- **Shape.** Narrower than the others, with a **heavy, flat upper lid** that sits low
  (sleepy-cool), the outer corner slightly upturned.
- **Typical expression.** **Deadpan**: half-lidded, a tiny flat mouth, no blush to speak of. Her
  other faces are a **scornful / smug** look (a Nendoroid face) and blank-stare comedy.

### Outfit (school, the TV design)
- **Shirt.** White, with a soft collar. Official `#f0f0ef`.
- **Tie.** A **thin black string ribbon** tied in a small bow, the ends dangling. About
  `#1d1d24`.
- **Sweater.** An **oversized dark navy-charcoal V-neck pullover**. Its long sleeves cover half
  her hands.
  - Official `#383845`, shade `#20202c`. Light about `#4a4a5a`.
- **Skirt.** Navy pleated, the same as Nijika's school skirt.
  - Official `#2c3c61`, deep `#1b1b38`.
- **Legs.** **Black tights**, the whole leg dark from the skirt hem down, no skin.
  - Official `#3c4148` / `#343841`. Light about `#525864`, shade `#2a2e35`.
- **Shoes.** **Brown loafers.** Official `#713d30`, dark `#452117`. The reference's shoe ramp
  works.
- **Summer look.** The Nendoroid drops the sweater: white shirt, string tie, navy skirt, tights.
- **Alternative look.** In the film art: a black band T-shirt over a grey mesh long-sleeve, a
  long black skirt, black slip-ons.

### Instrument
- **Anime: a Fender Precision Bass** in **Olympic White** (Wikipedia). Fan sources name the
  exact series as a Mexican Standard or American Professional (*uncertain*).
- **The details that matter:**
  - The **mint-green pickguard**, confirmed by the Good Smile Nendoroid, which matches the
    American Professional P-Bass in Olympic White.
  - A rosewood fingerboard with dot inlays.
  - A black split-coil pickup, chrome bridge and knobs.
  - A 4-in-line Fender headstock with chrome tuners. On the Nendoroid the headstock is pale.
- **Strap** (Nendoroid): purple with a pink floral pattern.
- **Manga note** (fan source, *uncertain*): in early manga volumes she plays a Yamaha BB-type
  bass in the same white with a mint guard.
- **Sprite colors (derived):** body `#efe9d6`, shade `#cbc2a6`, guard `#cde5c9`, guard shade
  `#a6c4a3`, board `#4a2c22`, metal `#c9d1d6`, pickup `#1f1f22`, outline `o #2e222e`.
- **How she holds it.** Slung **lower and longer** than Bocchi's guitar. The body sits at the
  hip or the top of the thigh, the long neck nearly level, rising only about 15-20 degrees to
  the viewer's right. She plays it fingerstyle (*uncertain*: with a pick at times).

### Personality cues for animation
- **Minimal motion.** She barely moves. Slow breaths, half-lidded, sometimes the arms folded or
  one hand gripping the other arm (the TV pose), legs crossed at the ankle. Whatever she does
  happens late and slow.
- She plays cool and impassive, with small head nods on the beat, never a mugging face. The
  music is the one thing she is visibly passionate about.
- Her comedy is the deadpan and the unexpected: a smug little "doya" smirk, a blank stare. The
  official profile says she is pleased when people call her weird.

### Iconic gags and motifs worth a frame
- **Eating weeds.** She eats wild grass to stave off hunger: it is in the official profile, and
  the Nendoroid includes an "eating grass" face. A blade of grass in her mouth is a perfect idle
  beat.
- **Always broke.** She spends everything on instruments and borrows money, Bocchi's included.
  Her purse turned out, a coin, or a hand held out.
- **Kita's adoration.** Kita sparkles at her, and she stays unmoved.

### Draw it like this
A cool, sleepy-eyed girl with a cobalt bob (longer and clipped on the viewer's left with two dark
bar pins, tucked behind the ear on the right) and a mole under the far eye. Yellow eyes. A big
dark navy sweater over a white shirt and string tie, navy pleats, black tights, brown loafers. A
cream-white P-bass with a mint guard slung low and long. She almost never moves.

---

## 4. Ikuyo Kita (喜多郁代): vocals, rhythm guitar

Shuka High, 1st year (Bocchi's classmate). The JA Wikipedia gives her height as 158 cm. She
dislikes her given name, and everyone calls her Kita.

### Hair
- **Color.** Vivid crimson-red.
  - Official TV fills: base `#df4955`, light `#e2555e` / `#e05059`, shadow `#992e43` /
    `#a43543`, deep `#682229`.
  - Film fills: base `#d4574e`, light `#dd6f67`, shadow `#9e3434`.
- **Sprite ramp (derived):**

  | tone | hex |
  | --- | --- |
  | light | `#ef7a76` (warmer, toward orange) |
  | base | `#df4955` |
  | shadow | `#992e43` (cooler, toward magenta) |
  | deep | `#682229` |
  | outline | `#4a1726` |

  If it shouts too loud beside the reference's soft pinks, take the base down a step, toward
  `#d8505a`.
- **Length and shape.** Shoulder length, just past the shoulders. Layered and soft, with the
  ends **flipping outward**.
- **Bangs.** Wispy, with a strand between the eyes, framing the face. No ahoge (a stray flick
  or two at the crown).
- **Side tail: on her own left, the VIEWER'S RIGHT.** A small **one-side-up** tuft tied above
  and behind the ear. The tie is hidden: no ornament in any official art. The tail is short (its
  tips at about cheek level) and sticks up and out like a little loop or wing.
  - At our density: about 5x6 px, with a 1-px tie line in the shadow tone.
  - In three-quarter view it pokes out from the upper right of the head silhouette, partly
    behind the hair. It is the hair that `sway` moves.

### Eyes
- **Color.** Bright yellow-green (chartreuse).
  - Official film fills: upper iris olive `#444a13` / `#747c34`, iris `#d3d546` / `#d0d23c`,
    lower `#f5f1a3`, a big white glint.
- **Sprite eyes (derived):**

  | part | hex |
  | --- | --- |
  | iris dark | `#5e6a1e` |
  | iris light | `#cdd43e` |
  | lower | `#f2f0a0` |
  | pupil | `#2f330f` |
  | glint | `W` (two glints when she sparkles) |
  | lid line | `#2e2626` |

- **Shape.** Large and round, the lashes flaring up at the outer corners, sparkling.
- **Typical expression.** A **confident, open smile**, eyes bright. Her signature is the
  sparkly **"Kitan" (キターン) face**, a Nendoroid face plate: a beaming wink with sparkles.

### Outfit (school, the TV design: the Shuka uniform as she wears it)
- **Cardigan.** **Beige/camel**, with ribbed cuffs and hem.
  - Official `#d7ae96`, shade `#a27c64`. Light about `#e8c7b0`, deep about `#7a5a48`.
  - The Nendoroid shows small yellow buttons (*uncertain* on the anime).
- **Blouse.** With a **sailor collar**: cream `#f3e3d7`, edged with **one dark stripe** (use
  `o`).
- **Bow.** A **red bow** at the collar.
  - Official `#e45d65`, shade `#ab424a`. Light about `#f08a8c`.
- **Skirt.** **The same charcoal Shuka skirt as Bocchi's** (official `#5f636d` / `#2b303e`).
  For the set, use the reference's `g #625566` / `G #3e3546`.
- **Socks.** **White loose socks**, slouched at mid-calf (`#f3f3f4`). Her legs are bare above.
- **Shoes.** **Brown loafers** (official `#7f513b`, dark `#523125`). The reference's shoe ramp
  works.
- **Alternative look.** In the film art: a black band T-shirt, a long white skirt, black
  slip-ons, a black wristband.

### Instrument
- **The guitar.** A **Gibson Les Paul Junior Double Cutaway** in **Pelham Blue** (Wikipedia). In
  2026 Gibson and Epiphone made official Kita replicas in Pelham Blue: a P-90 bridge pickup, the
  double-cut body.
- **In the story** it is **Ryo's** guitar, lent to her. Kita had first bought a **multi-string
  bass by mistake**, thinking it was a guitar, and Ryo bought it off her. Fan wikis name the
  bass as an Ibanez BTB six-string (*uncertain*).
- **The details that matter.** The Nendoroid matches the standard Junior DC:
  - A light turquoise body.
  - A **black pickguard** over the lower horn.
  - One **black dog-ear P-90**.
  - A nickel wraparound bridge, two black knobs.
  - A rosewood board with dots.
  - A **black headstock**, 3+3 chrome tuners.
- **Strap** (Nendoroid): white with pink flowers.
- **Sprite colors (derived):** body light `#9ad9e4`, base `#5ab4c9`, shade `#3a8097`, deep
  `#275a70`; guard and pickup `#232028`; metal `#c9d1d6`; board `#4a2c22`; outline `o`.
- **How she holds it.** Like Bocchi's guitar (the same angle), but she plays rhythm while
  singing. The body sits a touch higher, and she turns her face to the crowd.

### Personality cues for animation
- **A performer.** She poses: a peace sign by the face, a wink, a heel kicked up, playing to an
  invisible camera (she lives on her "Isosta" social feed).
- She sings open-mouthed while strumming, leans toward the audience, and moves her head and
  shoulders on the beat. More bounce than Ryo, more polish than Nijika.
- She reacts big and positive: sparkles, a burst of light. She reads everything Ryo does in the
  best possible light, with heart eyes. When flustered she drops into a stunned stare or a
  hands-on-head panic, a fan-favourite reaction image.

### Iconic gags and motifs worth a frame
- **The "Kita aura" / "Kitan" sparkle.** A radiant extrovert glow, sparkles popping beside her
  eyes. In the show it is so bright it overwhelms Bocchi, who wilts or melts in it. (The exact
  episodes are *uncertain*; the Nendoroid "Kitan" face confirms the expression.)
- **Selfies.** A peace sign, a phone held up (the Nendoroid includes a smartphone).
- **The bass mix-up.** A guitar that turns out to have six fat strings.

### Draw it like this
Bright crimson hair to the shoulders, ends flicking out, a small side tail sticking up on the
viewer's right. Sparkling yellow-green eyes and a confident open smile. A camel cardigan over a
cream sailor collar with a red bow, the charcoal Shuka pleats (Bocchi's skirt), bare legs, white
loose socks, brown loafers. A light-turquoise Les Paul Junior double-cut with a black guard. She
performs to the crowd and sparkles.

---

## The set at a glance

| | silhouette key (reads in a 16x16 mini) | hair base | eyes | the one accessory | legs |
| --- | --- | --- | --- | --- | --- |
| Bocchi | long hair down the back, looped ahoge on the left | pink `#eba2b3` | blue (reference) | blue over yellow cubes, viewer's left | dark over-knee socks |
| Nijika | triangle on top, tail high on the right | blonde `#f0cc62` | red-orange | the Dorito ahoge; polka-dot bow | bare legs, white socks, red sneakers |
| Ryo | short round bob, longer on the left | cobalt `#375fa5` | yellow | two dark bar pins, viewer's left; mole | black tights |
| Kita | shoulder flip, little tuft up on the right | crimson `#df4955` | yellow-green | side tail, viewer's right; red bow | bare legs, white loose socks |

**Shared colors.**
- Skin: use the reference's `s #fedec7` / `S #f0bcae` for everyone, the same hand. The
  official fills are similar: `#fdefe7` / `#fbe3d7`, shade `#ebbead` / `#e4b29c`.
- Mouth: the reference's `m #aa6257`.
- Lower-body outline: `o #2e222e`.
- Shoes: the reference's loafer ramp for Bocchi, Ryo and Kita.
- Shuka skirt (Bocchi, Kita): the reference's `g`/`G`. Shimokitazawa skirt (Nijika, Ryo): navy
  `#2c3c61` family.

---

## Sources

Official, used for colors and layout:
- Official TV-anime site, character pages and full-body art (the school designs; colors sampled
  here): https://bocchi.rocks/tv/character/ — the art is at
  `https://bocchi.rocks/tv/assets/img/page/character/{hitori,nijika,ryo,ikuyo}/main.png`
- Official omnibus-film site, character profiles and full-body art (film colors; the official
  profiles quoted in paraphrase: Bocchi's "a-", Nijika the caretaker, Ryo's weeds and money, Kita
  and Isosta): https://bocchi.rocks/omnibus/character/ (and `nijika.html`, `ryo.html`,
  `ikuyo.html`)

Licensed merchandise, used for accessories and instrument details:
- Good Smile Company Nendoroid listings, with product photos (Ryo's mint-guard white P-bass and
  two pins; Kita's Pelham Blue LP Jr DC with black guard, side tail on the viewer's right;
  Nijika's yellow scrunchie, sticks, polka-dot bow and red sneakers; the face plates "eating
  grass", "scornful", "Kitan", "exasperated"):
  - https://otakumode.com/shop/65273fc02e461f001d50a745
  - https://otakumode.com/shop/64ed66b56aeadf0027c35c63/Nendoroid-Bocchi-the-Rock!-Ikuyo-Kita
  - https://otakumode.com/shop/650bb32d7edded001dbaca97/Nendoroid-Bocchi-the-Rock!-Nijika-Ijichi-Re-run
- Aniplex 1/7 Nijika figure (the TAMA logo, with Hoshino Gakki):
  https://otakumode.com/shop/68917767fa03c2001d6aa2af

Reference works, used for instruments, heights and gags:
- Wikipedia (EN): the instruments (Ebony LP Custom, Yamaha Pacifica, Vintage Red TAMA
  Imperialstar, Olympic White Fender Precision, Pelham Blue LP Junior Doublecut):
  https://en.wikipedia.org/wiki/Bocchi_the_Rock!
- Wikipedia (EN), the episode list (episode 3, Kita the runaway guitarist; episode 12, the
  string snap and sake-bottle slide, the failed stage dive):
  https://en.wikipedia.org/wiki/List_of_Bocchi_the_Rock!_episodes
- Wikipedia (JA): the cube clips on her right side, light blue and yellow; the heights; the box
  and trash-bin hiding; the face collapse; Nijika's polka-dot ribbon:
  https://ja.wikipedia.org/wiki/ぼっち・ざ・ろっく!

Press and makers, used for guitar specifics and the replicas:
- Automaton Media: Bocchi's guitar named as a Les Paul Custom 1968 Reissue Ebony, borrowed from
  her father: https://automaton-media.com/en/news/20230724-20246/
- SNKRDUNK magazine: the Epiphone Les Paul Custom "Bocchi Edition", gloss black, gold pickups
  and hardware:
  https://snkrdunk.com/en/magazine/2023/11/16/bocchi-the-rock-epiphone-gibson-les-paul-custom-limited-edition-release-date/
- Yamaha: the PACIFICA611V BTR LTD, a replica of the Pacifica she buys in episode 12:
  https://my.yamaha.com/en/musical-instruments/guitars-basses-amps/products/electric-guitars/pac611vbtrltd
- AniTrendz: the Gibson and Epiphone Les Paul Jr. Ikuyo Kita models in Pelham Blue:
  https://www.anitrendz.com/news/2026/04/12/bocchi-the-rocks-ikuyo-kita-gets-guitars-from-gibson-and-epiphone
- Toy People: the Kita models, a double-cut Les Paul Jr. with a P-90:
  https://www.toy-people.com/en/?p=108991

For the mango box:
- Toy People, the mango-box Bocchi figure: https://www.toy-people.com/en/?p=100059
- Siliconera, the manga review mentioning the mango box:
  https://www.siliconera.com/hitori-gotoh-is-a-delight-in-the-bocchi-the-rock-manga/

Fan sources, *uncertain*:
- Pixiv encyclopedia, the "Doritos" tag (fan art tagged "Nijika doritos"):
  https://dic.pixiv.net/a/Doritos
- Fan wikis seen through search snippets only: the Bocchi the Rock! Fandom wiki and Moegirlpedia
  (Ryo's manga Yamaha BB and her MXR Bass D.I.; Nijika's 22" porthole kick and Pearl Chad Smith
  snare; Kita's six-string bass named as an Ibanez BTB). The pages themselves refused automated
  reading, so these details are marked uncertain above.
