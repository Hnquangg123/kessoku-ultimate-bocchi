// Kita's faces: overlays laid over the head at (x, y) on stand (shifted by a
// pose's head offset elsewhere), `.` keeping the head's own pixel, `_` erasing
// it. ART-BRIEF.md "The faces" says what each shows.
//
// Bocchi's face box and eye drawing (16x10 at 42,30: cols 42-57, rows 30-39),
// so the band's faces move as one. Every face is drawn on the POLISHED stand
// (its bangs closed over the forehead, h at 46-47,30; the lashes winging up and
// out at 43,31; one pupil pixel in the near iris's top row), so index.ts's
// polish carry finds none of the old pixels here and leaves these as drawn.
// Her eyes sit where Bocchi's do: the lid line n two pixels thick on rows
// 31-32 (near cols 43-48, the top row one pixel longer at the outer corner,
// 43,31, so the lashes flick up and out where Bocchi's droop; the eye's outer
// edge n down col 44 to row 34), the far eye cols 53-55 (its outer edge on the
// face outline, col 55); a hair strand r down col 51 (rows 31-33) between the
// eyes in every face. Her mouth is the stand's open smile on REF's mouth row
// (m b b m on 47-50,38 over m m on 48-49,39, the jaw); the chin line 44,37
// 45,38. Recolored to her eyes (lid n, pupil M, iris E Q e, glow L, glint W),
// then made hers: a performer, confident, sparkling. Colors of her own: only
// the panic's two cool tints, Bocchi's exact y and L (keyed y and u here), so
// the band's panics match and the export spends no new color on them.
//   idle    the stand's own face region: sparkly eyes (two glints in the near
//           iris, W at 45,33 and 48,34; the far one 54,34), the confident
//           open smile
//   half    the lids a row lower: their top row on 43-48,32 (the flick at
//           43,32, as idle's at 43,31) over 44-48,33, the outer edge 44,34;
//           the far lid 53-54,32 (p 55,32) over 53-55,33; only the irises'
//           middle row shows (E e e W, its outer pixel in the lid's shadow;
//           far e W), their bottoms (row 35) under skin
//   blink   shut: a crescent on rows 34-35 (44-48,34 over 45-47,35; far
//           53-55,34 over 54,35), the lash flick up at 43,33
//   (the lid's top row goes 31 -> 32 -> 34 through a blink, and the flick
//   43,31 -> 43,32 -> 43,33 with it, as Bocchi's lids close)
//   glance  a look to the crowd, the viewer's left (where the anxious mood's
//           sparkle pops): the near iris slid one column out inside idle's
//           outline (M E E on 45-47,33, Q e on 45-46,34, e L on 45-46,35),
//           the white on the nose side (Z at 48,33 under the lid, W W on
//           47-48,34, the glint run into it); the far iris on its nose side
//           (M e L down col 53), its white Z over W at 54,33-34; the smile kept
//   focus   singing while she plays: the lids slant down toward the nose (the
//           inner lid tops off on row 31, 47-48 near and 53 far; the lid over
//           the inner iris on 47-48,33 and 53,33), the outer wing kept, the
//           iris bottoms (row 35) under skin; the mouth opened into a tall O
//           (m m on 48-49,37 over the smile), so the blink on the focused
//           mood's last bar (focus -> half -> blink -> half) changes the mouth
//           too, as a sung syllable
//   happy   the "Kitan" wink: the near eye shut in a ^ (apex 45-46,32, legs
//           44,33 47,33 and 43,34 48,34), the far eye open and sparkling (two
//           glints, W at 53,33 and 54,34, under its lid 53-54,31 / 53-55,32);
//           bow-pink blush B a row under the eyes (45-47,36 and 53-54,36); the
//           smile opened wide and laughing, a D: its open top b on 47-50,37
//           between the upturned corners m (46,37 51,37), the tongue R R on
//           48-49,38 inside m (47,38 50,38), the lip m m (48-49,39)
//   panic   a stunned stare: blank white eyes (the near white 4x3 at 45-48,
//           rows 33-35, the far 2x3 at 53-54) with a one-pixel pupil M in each
//           (47,34 and 53,34), the lower corners softened in Bocchi's lavender
//           u (45,35 48,35 and 54,35), a band of her pale grey-blue y on the
//           skin under both eyes (45-48,36 and 53-54,36): the cool shock
//           shading, pale, not the guitar's cyan (which read as tears welling
//           and matched the sweat drops); row for row Bocchi's panic rows
//           35-36. Bocchi's ~ mouth in runs of two (46,39 ->
//           47-48,38 -> 49-50,39 -> 51,38) in place of the smile
//   melt    half lids two pixels thick at the inner end, sagging at both outer
//           corners in even steps (near 44,33 -> 43-44,34 -> 43,35; far
//           53-55,33 -> 54-55,34 -> 55,35), the irises dulled (no glint: Q E E E
//           and e e; the far E over e Q), the smile gone slack into a small 'o'
//           (m b m down 48-49, rows 37-39)

import type { FaceName, Overlay, Palette } from '../../types'

/** The panic's cool shading under the eyes: Bocchi's own two (her zipper grey-blue y, her lavender L), so the band's panics match. */
export const colors: Palette = {
  y: '#c7d0e8', // under-eye band (Bocchi's y)
  u: '#a89cd1', // the eyes' lower corners (Bocchi's lavender L)
}

export const face: Overlay<FaceName> = {
  x: 42,
  y: 30,
  grids: {
    idle: [
      'rHhhhhhhhhrrhhhr', // 30
      'rnnnnnnrrrsnnprh', // 31
      'rsnnnnnssrsnnnrH', // 32
      'rsnWMEESSrSMEnrr', // 33
      'rsnQeeWSSSSeWnrr', // 34
      'rssseLSSSSSeLprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSmbbmSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
    half: [
      'rHhhhhhhhhrrhhhr', // 30
      'rhhssssrrrsssprh', // 31
      'rnnnnnnssrsnnprH', // 32
      'rsnnnnnSSrSnnnrr', // 33
      'rsnEeeWSSSSeWnrr', // 34
      'rsssssSSSSSssprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSmbbmSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
    blink: [
      'rHhhhhhhhhrrhhhr', // 30
      'rhhssssrrrsssprh', // 31
      'rssssssssrsssprH', // 32
      'rnsssssSSrSssprr', // 33
      'rsnnnnnSSSSnnnrr', // 34
      'rssnnnSSSSSsnprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSmbbmSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
    glance: [
      'rHhhhhhhhhrrhhhr', // 30
      'rnnnnnnrrrsnnprh', // 31
      'rsnnnnnssrsnnnrH', // 32
      'rsnMEEZSSrSMZnrr', // 33
      'rsnQeWWSSSSeWnrr', // 34
      'rsseLsSSSSSLSprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSmbbmSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
    focus: [
      'rHhhhhhhhhrrhhhr', // 30
      'rnnnnssrrrssnprh', // 31
      'rsnnnnnssrsnnnrH', // 32
      'rsnWMnnSSrSnEnrr', // 33
      'rsnQeeWSSSSeWnrr', // 34
      'rsssssSSSSSssprr', // 35
      'hrssssssssssSprr', // 36
      'hrmSssmmsssSprrr', // 37
      'hhpmSmbbmSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
    happy: [
      'rHhhhhhhhhrrhhhr', // 30
      'rhhssssrrrsnnprh', // 31
      'rssnnssssrsnnnrH', // 32
      'rsnssnsSSrSWEnrr', // 33
      'rnssssnSSSSeWnrr', // 34
      'rsssssSSSSSeLprr', // 35
      'hrsBBBsssssBBprr', // 36
      'hrmSmbbbbmsSprrr', // 37
      'hhpmSmRRmSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
    panic: [
      'rHhhhhhhhhrrhhhr', // 30
      'rnnnnnnrrrsnnprh', // 31
      'rsnnnnnssrsnnnrH', // 32
      'rsnWWWWSSrSWWnrr', // 33
      'rsnWWMWSSSSMWnrr', // 34
      'rssuWWuSSSSWuprr', // 35
      'hrsyyyyssssyyprr', // 36
      'hrmSsssssssSprrr', // 37
      'hhpmSmmssmpprrrr', // 38
      'hhpSmSSmmprrrrrH', // 39
    ],
    melt: [
      'rHhhhhhhhhrrhhhr', // 30
      'rhhssssrrrsssprh', // 31
      'rsssnnnssrsnnprH', // 32
      'rsnnnnnSSrSnnnrr', // 33
      'rnnQEEESSSSEnnrr', // 34
      'rnsseeSSSSSeQnrr', // 35
      'hrssssssssssSprr', // 36
      'hrmSssmmsssSprrr', // 37
      'hhpmSsbbsSpprrrr', // 38
      'hhpSssmmpprrrrrH', // 39
    ],
  },
}
