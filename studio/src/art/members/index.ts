// The band: each member assembled from her own folder of part files (see ../parts.ts).

import type { MemberArt, MemberId } from '../types'
import { bocchi } from './bocchi'
import { kita } from './kita'
import { nijika } from './nijika'
import { ryo } from './ryo'

export const ART: Readonly<Record<MemberId, MemberArt>> = { bocchi, nijika, ryo, kita }
