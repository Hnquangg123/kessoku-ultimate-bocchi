// Nijika's nabe-bugyo headband (keepwarm on: she has the pot): a white hachimaki round her forehead
// (W, its lower half in the shirt's cool y), the red rising sun at its front (her bow's R over k, at 49-50), the
// knot's two tails sticking out behind her head on the left. Drawn over whatever she plays (the feast exports it as
// a still), so it covers only pixels every seat pose of hers has the same (checkArt holds it to that), above the
// face box.

import type { Patch } from '../../types'

export const headband: Patch = {
  x: 29,
  y: 24,
  grid: [
    '.Wy..........................', // 24
    'yWWy.........................', // 25
    '..yWWWWWWWWWWWWWWWWWRRWWWWWWW', // 26
    '..yyyyyyyyyyyyyyyyyykkyyyyyyy', // 27
    '.Wy..........................', // 28
    'Wy...........................', // 29
  ],
}
