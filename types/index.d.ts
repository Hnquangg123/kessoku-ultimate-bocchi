// Kessoku Ultimate Bocchi Theme: the state contract.
//
// Every value the mod keeps in `$.state` (the session's own, so it survives a
// hot reload of the module) is declared here under the mod's name. The hooks
// module imports these types; `claude plugin validate` holds every `$.state`
// key the module names to this file. Self-contained: no import, no reference.

/** The four band members a piece of work can be assigned to. */
export type KessokuMember = 'bocchi' | 'nijika' | 'ryo' | 'kita'

/** The expression a member's face shows. */
export type KessokuMood = 'anxious' | 'focused' | 'happy' | 'panic' | 'melting' | 'hiding'

/** Token counts, summed over every response of one agent loop. */
export type KessokuUsage = {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

/** The main loop (`id: 'main'`) or one subagent, as the band panel shows it. */
export type KessokuAgent = {
  id: string
  member: KessokuMember
  description: string
  type: string
  status: 'pending' | 'running' | 'waiting' | 'idle' | 'completed' | 'failed' | 'killed'
  task: string
  startedAt: number
  endedAt: number | null
  model: string
  usage: KessokuUsage
  context: number
  steps: number
  tools: number
  cost: number
  isError: boolean
}

/** What the Kessoku Band panel and the strip above the prompt draw from. */
export type KessokuBand = {
  agents: KessokuAgent[]
  mood: KessokuMood
  mainTask: string
  contextPercent: number
  window: number
  sessionUsd: number
  /** The fullest rate-limit window of the plan, in percent; 0 off a subscription. */
  rateLimitPercent: number
  isWorking: boolean
  lastError: string
}

/** Cache Tax: when the prompt cache was last warmed, and what a cold send costs. */
export type KessokuCache = {
  lastWarmAt: number
  contextTokens: number
  model: string
  keepWarmUntil: number
  isArmed: boolean
  heldAt: number
  /** The prompt that was held, so a timely re-send (and only that) passes without a second warning. */
  heldText: string
  heldUsd: number
  warmUsd: number
  pings: number
  pingUsd: number
  /** Pings that found the cache already cold and paid to re-write it. */
  misses: number
  lastPingNote: string
  /** The engine's own re-cache estimate from the last model switch, and the model it priced. */
  engineWriteUsd: number
  engineModel: string
}

/** Blast Radius: the risky command on hold and what it would do. */
export type KessokuBlast = {
  command: string
  label: string
  summary: string
  lines: string[]
  more: number
  note: string
  where: 'pane' | 'band'
  isHeld: boolean
}

/** One file lit on the file tree: being edited, edited, read, or committed. */
export type KessokuLight = {
  path: string
  kind: 'editing' | 'edited' | 'read' | 'committed'
  at: number
  by: KessokuMember
}

/** The file tree pane: the project's paths and the lights on them. */
export type KessokuTree = {
  root: string
  paths: string[]
  lights: KessokuLight[]
  isOpen: boolean
  isBand: boolean
  builtAt: number
}

/** Reflect: the band-manager memo Nijika drafts from a correction. */
export type KessokuMemo = {
  rule: string
  original: string
  at: number
  status: 'drafting' | 'open' | 'editing' | 'saved' | 'skipped'
  savedTo: string
}

/** One track of the Replay Theater setlist: one file edit as a unified diff. */
export type KessokuTrack = {
  tool: string
  file: string
  hunks: string
  add: number
  del: number
  note: string
  by: KessokuMember
}

/** Replay Theater: the last turn's setlist and where the viewer stands. */
export type KessokuReplay = {
  tracks: KessokuTrack[]
  index: number
  isOpen: boolean
  inBand: boolean
  setlist: number
}

/** Which of the theme's drawings are up. */
export type KessokuUi = {
  isPanelOpen: boolean
  isStripHidden: boolean
  panelWhere: 'pane' | 'band' | 'none'
}

declare module 'claude-code' {
  interface PluginState {
    'kessoku-ultimate-bocchi': {
      band: KessokuBand
      cache: KessokuCache
      blast: KessokuBlast | null
      tree: KessokuTree
      /** The shimmer's beat while a file is being edited: its own value, so only the tree pane redraws with it. */
      frame: number
      memo: KessokuMemo | null
      replay: KessokuReplay
      ui: KessokuUi
    }
  }
}
