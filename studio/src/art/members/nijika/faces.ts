// Nijika's faces: overlays laid over the head at (x, y) on stand (shifted by a
// pose's head offset elsewhere), `.` keeping the head's own pixel, `_` erasing
// it. ART-BRIEF.md "The faces" says what each shows.
//
// Over her eyes, grin and chin at Bocchi's face box (16x10 at 42,30: cols
// 42-57, rows 30-39), each a whole grid of the region so it reads as drawn.
// Her idle eye is wide open and round, its upper lid an arch, never the
// sharp upturned (tsurime) slant that reads stern at 1x: the near lid n over
// the iris on row 30 (cols 44-47), its ends a row lower (42-43,31 at the outer
// corner, heavier there with 43,32 under it; 48,31 at the inner), the near
// iris cols 44-47 rows 31-35 (its top in shadow E E E E on row 31, glint W
// 44,32, pupil M 46,32-33, e e, the glow Q Q 45-46,35); the far lid 54-55,30
// down to 53,31 at the inner end and the face edge n/p on col 55, the far
// iris 53-54 rows 31-35 (E 54,31 over W M). The stand's own baked face is the
// earlier flat lid on row 31; every pose here carries a face overlay over it.
// The grin: row 37 i W W W i (46-50), row 38 i i i
// (47-49); the jaw p 44,38-39 and 50-54 down rows 37-39, the chin line m
// 44,37 45,38. In her colors (n lid, E e Q M W iris, i mouth inside, W teeth,
// s S skin, m lips, y the shirt's cool shade for the panic's blue) plus one of
// its own: j, Bocchi's jacket pink, the band's blush.
// She is bright and on the beat, the grin never far; her one other stock face
// is the caretaker's deadpan (glance, melt), and every loop bounces back.
//   half    the blink's in-between: both lids down to row 33 (near n 43-48,33,
//           its flick 42,32; far 53-55,33, flick 56,32), the upper iris under
//           them, so row 34 shows a slice of each iris still lit, its glint
//           kept as Bocchi's half keeps hers (near W e M e 44-47, far W M
//           53-54) over the glow (row 35); eyelid skin on rows 31-32. The
//           grin stays, so a blink moves only the eyes (lid row 30 -> 33 -> 34)
//   blink   closed: a crescent bulging down, n 43-48,34 over 44-47,35 (far
//           53-55,34 over 54,35), the lashes flicking up at 42,33 and 56,33
//   glance  the caretaker's deadpan side-eye (at Ryo's antics, then straight
//           back to sunny in the idle loop): flat lids two rows down, no
//           flicks (n 43-48,33 and 53-55,33, the lid's shade S on row 32), the
//           irises slid to the viewer's left under them (near E M E at
//           43-45,34 with the white W W at 46-47, e e 44-45,35; far M 53,34
//           with W 54,34, e 53,35), the grin shut to a flat line m 46-49,37
//   focus   playing, on the beat and grinning: the eyes narrowed but bright,
//           not cross (only the lids' inner ends step down to the nose: near
//           lid 42-46,31 then 47-48,32 beside the pupil M 46,32, the far lid
//           54-55,31 then 53,32 over M 54,32), the glow gone under a raised
//           lower lid (row 35 skin), and idle's grin widened a pixel each
//           side: teeth W 46-50,37 with i corners 45,37 and 51,37 over the
//           open mouth i 47-49,38; she smiles through the whole song (no
//           blink in the focused loop)
//   happy   ^ ^ arcs (near apex 45-46,32, legs 44,33 47,33 and 43,34 48,34;
//           far apex 53-54,32, legs 52,33 and 55,33), blush j on the cheeks
//           (45-47,36 and 53-54,36), the grin opened wide: teeth W 46-50,37
//           over the tongue P 47-49,38, i at the corners
//   panic   blank white eyes boxed in n under idle's arched lids, opened as
//           wide (near W 44-47 rows 31-33, its corners rounded y on row 34;
//           far W 54,31 and 53-54 rows 32-33, y y on row 34) with
//           a one-pixel pupil each (46,33 and 53,33, crossing in), the shirt's
//           cool y in a band under them (44-47,36 and 53,36), a ~ mouth in
//           runs of two (46,38 -> 47-48,37 -> 49-50,38 -> 51,37)
//   melt    defeated: heavy lids sagging at the outer corners in even steps
//           (near n 45-48,33 -> 43-44,34 -> 43,35; far 53-55,33 -> 54-55,34),
//           dull irises without glints (E E E 45-47,34 over e e 45-46,35; far
//           E 53,34 over e 53,35), the grin gone slack to a small open mouth
//           (m m 47-48,37 over i i 47-48,38)

import type { FaceName, Overlay, Palette } from '../../types'

export const colors: Palette = {
  j: '#efa2a8', // blush (Bocchi's jacket pink: the band's one blush)
}

export const face: Overlay<FaceName> = {
  x: 42,
  y: 30,
  grids: {
    idle: [
      'hhnnnnSssssSnnrh', // 30
      'nnEEEEnssssnEnrH', // 31
      'rnWEMEsssssWMnrH', // 32
      'rseeMessssseEnrH', // 33
      'rseeeessssseeprH', // 34
      'rssQQssssssQsprH', // 35
      'hrssssssssssSprH', // 36
      'hrmsiWWWissSprrH', // 37
      'hhpmsiiisSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
    half: [
      'hhhSSSSssssSrrrh', // 30
      'rssssssssssssprH', // 31
      'nsssssssssssspnH', // 32
      'rnnnnnnssssnnnrH', // 33
      'rsWeMesssssWMprH', // 34
      'rssQQssssssQsprH', // 35
      'hrssssssssssSprH', // 36
      'hrmsiWWWissSprrH', // 37
      'hhpmsiiisSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
    blink: [
      'hhhSSSSssssSrrrh', // 30
      'rssssssssssssprH', // 31
      'rssssssssssssprH', // 32
      'nsssssssssssspnH', // 33
      'rnnnnnnssssnnnrH', // 34
      'rsnnnnssssssnprH', // 35
      'hrssssssssssSprH', // 36
      'hrmsiWWWissSprrH', // 37
      'hhpmsiiisSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
    glance: [
      'hhhSSSSssssSrrrh', // 30
      'rssssssssssssprH', // 31
      'rSSSSSSssssSSprH', // 32
      'rnnnnnnssssnnnrH', // 33
      'rEMEWWsssssMWprH', // 34
      'rseesssssssesprH', // 35
      'hrssssssssssSprH', // 36
      'hrmsmmmmsssSprrH', // 37
      'hhpmsssssSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
    focus: [
      'nhhSSSSssssSrrnh', // 30
      'nnnnnsssssssnnrH', // 31
      'rnWEMnnssssnMnrH', // 32
      'rseeMessssseEnrH', // 33
      'rseeeessssseeprH', // 34
      'rssssssssssssprH', // 35
      'hrssssssssssSprH', // 36
      'hrmiWWWWWisSprrH', // 37
      'hhpmsiiisSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
    happy: [
      'hhhSSSSssssSrrrh', // 30
      'rssssssssssssprH', // 31
      'rssnnssssssnnprH', // 32
      'rsnssnssssnssnrH', // 33
      'rnssssnssssssprH', // 34
      'rssssssssssssprH', // 35
      'hrsjjjsssssjjprH', // 36
      'hrmiWWWWWisSprrH', // 37
      'hhpmiPPPiSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
    panic: [
      'hhnnnnSssssSnnrh', // 30
      'nnWWWWnssssnWnrH', // 31
      'rnWWWWnssssWWnrH', // 32
      'rnWWMWnssssMWnrH', // 33
      'rsyWWysssssyyprH', // 34
      'rssssssssssssprH', // 35
      'hryyyysssssySprH', // 36
      'hrmssiissisSprrH', // 37
      'hhpmissiiSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
    melt: [
      'hhhSSSSssssSrrrh', // 30
      'rssssssssssssprH', // 31
      'rssssssssssssprH', // 32
      'rssnnnnssssnnnrH', // 33
      'rnnEEEsssssEnnrH', // 34
      'rnseessssssesprH', // 35
      'hrssssssssssSprH', // 36
      'hrmssmmssssSprrH', // 37
      'hhpmsiissSpprrrH', // 38
      'hhpssssspprrrrHH', // 39
    ],
  },
}
