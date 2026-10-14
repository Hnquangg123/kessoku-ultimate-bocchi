// Bocchi's stand: idle and ready, the guitar across the body, the picking hand
// on the strings. It IS the reference (REF_STAND: reference/bocchi-reference.jpg
// read back cell by cell, soles on row 93). Every other pose patches it.

import { REF_STAND } from '../../../../reference/bocchi-reference.grid'
import type { Grid } from '../../types'

export const stand: Grid = REF_STAND

/** The 32x32 portrait window over the head on stand (its top-left): it holds the face overlay. */
export const head = { x: 34, y: 16 }

/** The knee row: a squash lowers every row above it (a breath, a bob, a landing). */
export const bend = 72
