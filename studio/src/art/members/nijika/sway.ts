// Nijika's sway: the free end of her long side tail one step left (L) and right (R), drawn
// over stand (`_` erases the old ends). They must fit stand, playA and playB: checkArt holds
// the pixels they cover to be the same in all three, so they keep off the cells the play
// poses change: playB's raised forearm over the tail's root (cols to 62 on rows 44-47, 60-61
// on rows 48-50, 59 on row 51) and the far sleeve and vest at col 58 and left of it.
//
// A graded swing, a pendulum from the scrunchie: rows 17-45 never move, so the tail bends
// below the shoulder. The tail keeps stand's ramp (u deep shadow against the sleeve, r, h, the
// lit band H on the right), its p outline, the strand that splits the small flick lock off
// the main lock, and the flick itself (stand's 66-67, rows 54-56).
// R, the end swings out, away from the body: rows 46-52 move 1 px, rows 53-59 2 px. The right
// edge steps 68, 68, 67 x4, 68, 69, 70, 70, 69 (rows 46-56) where stand's is 67, 67, 66 x4,
// 67, 67, 68, 68, 67; the shadow side the sleeve hid comes out (u 3 px wide, 59-61, rows
// 52-54); the strand steps 65, 66, 67 into the flick's split at 67,54; from row 55 the main
// lock leaves the sleeve (a 1-px gap at 59, its own outline at 60) and its left edge steps
// 60, 61, 62, 63 to the tip at 64,59; the flick hangs at 68-70, its tip at 69,56.
// L, the end swings in and comes to rest against the arm: rows 46-59 move 1 px (the sleeve at
// col 58 stops it there). The right edge steps 66, 66, 65 x4, 66, 66, 67, 67, 66, the tail a
// pixel narrower as it turns (its r band 1 px, the H band kept 2 px); the main lock lies
// against the sleeve (u at 59, rows 52-55), its left edge 59, 59, 59, 60, 61 (rows 55-59) to
// the tip at 61,59; the flick at 64-66, its tip at 66,56, the 1-px slit between it and the
// main lock kept.

import type { Patch } from '../../types'

export const sway: { L: Patch; R: Patch } = {
  L: {
    x: 59,
    y: 46,
    grid: [
      '....hH.p_.', // 46
      '.....H.p_.', // 47
      '..rhH.p_..', // 48
      '...hH.p_..', // 49
      '...h.Hp_..', // 50
      '.rh.rHp_..', // 51
      '.rh.rhHp_.', // 52
      '.rh..rHp_.', // 53
      '.rh..pH.p_', // 54
      '..h.p_pHp_', // 55
      '..h.p_.p_.', // 56
      'prhp_.....', // 57
      '.php_.....', // 58
      '..p_......', // 59
    ],
  },
  R: {
    x: 59,
    y: 46,
    grid: [
      '......h.Hp..', // 46
      '......h.Hp..', // 47
      '.....h.Hp...', // 48
      '.....h.Hp...', // 49
      '......hHp...', // 50
      '.....hrHp...', // 51
      '..ur.h.rHp..', // 52
      '..urr.hhrHp.', // 53
      '..urr.hhpHHp', // 54
      '_purrhh._.Hp', // 55
      '__prrhhp_.p.', // 56
      '.__prhp.....', // 57
      '..__.hp.....', // 58
      '..._.p......', // 59
    ],
  },
}
