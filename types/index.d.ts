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

/**
 * What a subagent's slime shows: `active` while the act runs (a bounce),
 * `idle` while it is pending or waiting (a breath), `asleep` once it is done,
 * failed or killed (a doze, a z drifting up). Derived from the agent's status.
 */
export type KessokuSlimeState = 'active' | 'idle' | 'asleep'

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
  /** Calls by tool name, this act (the main loop's reset at every turn). */
  toolTally: Record<string, number>
  /** The task line's words for its newest call; empty before one. */
  lastTool: string
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
  /** The set: the main loop's turn, counted from the session's first (0 before it). */
  set: number
  /** What the set was asked: the head of the prompt that started it (mainTask follows the tool in hand). */
  setPrompt: string
  /** When the current (or last) set started. */
  setStartedAt: number
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

/** Reflect: the band-manager memo Nijika drafts from a correction, or holds for a rule Claude proposed through the memo tool. */
export type KessokuMemo = {
  rule: string
  /** The correction it was drafted from, or the proposal's own why. */
  original: string
  at: number
  status: 'drafting' | 'open' | 'editing' | 'saved' | 'skipped'
  savedTo: string
  /** Who proposed the rule through the memo tool (Bocchi for the main loop); absent on a memo drafted from a correction. */
  by?: KessokuMember
}

/** A rule proposed through the memo tool while another memo was up, waiting its turn on Nijika's card. */
export type KessokuProposal = {
  rule: string
  why: string
  by: KessokuMember
  at: number
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

/** What the set in play has done that the band does not keep elsewhere: the recap's and the tour's counters, reset once it is counted. */
export type KessokuTally = {
  /** The set the tally began with (0 before any): only that set's main-loop spend is the difference below. */
  set: number
  /** The main loop's spend when the set began: its spend during the set is the difference. */
  mainUsd: number
  /** Tool calls that came back as errors, by the member who made them. */
  errors: Record<KessokuMember, number>
  /** Commands Blast Radius held, and those of them that did not run. */
  held: number
  stopped: number
  /** Commits that landed. */
  commits: number
}

/** The card Nijika holds up above the prompt when a set of half a minute or more ends: what the set did. */
export type KessokuRecap = {
  set: number
  /** How the set ended: `answer`, else the engine's reason (`error`, `refusal`, ...). */
  reason: string
  ms: number
  /** What the set cost, at list prices: the main loop's spend during it and its acts' so far. */
  usd: number
  edits: number
  acts: number
  /** Tool calls that came back as errors, the main loop's and its acts'. */
  errors: number
  /** Commands Blast Radius held. */
  held: number
  /** The member the card names: her acts and their spend and her newest act's words, or the main loop's tool calls when no act ran. */
  mvp: { member: KessokuMember; acts: number; usd: number; what: string; tracks: number }
  at: number
}

/** A project's tour, or every project's, as the /bocchi stats page reads it (worked out from the store when the page opens). */
export type KessokuTourView = {
  /** The project's name; `all projects` for several. */
  label: string
  /** The projects that have played a set. */
  projects: number
  /** The first night played, `YYYY-MM-DD`; '' before any. */
  since: string
  nights: number
  sets: number
  ms: number
  usd: number
  edits: number
  commits: number
  memos: number
  held: number
  stopped: number
  acts: Record<KessokuMember, number>
  errors: Record<KessokuMember, number>
  longest: { ms: number; day: string } | null
  priciest: { usd: number; day: string } | null
  /** Who hit the most wrong notes (the band's order breaks a tie); null with none. */
  mostErrors: { member: KessokuMember; count: number } | null
  /** The last nights played, oldest first: the page's "cost a night". */
  recent: { day: string; usd: number; sets: number }[]
}

/** The /bocchi stats page: up or not, where, which projects, and what it shows. */
export type KessokuTour = {
  isOpen: boolean
  inBand: boolean
  scope: 'project' | 'all'
  view: KessokuTourView | null
}

/** Which of the theme's drawings are up. */
export type KessokuUi = {
  isPanelOpen: boolean
  isStripHidden: boolean
  panelWhere: 'pane' | 'band' | 'none'
  /** The member whose channel is open across the mixer; null for the mix. */
  solo: KessokuMember | null
  /** The act listed first on her solo (pressed under her pit); null for the newest. */
  soloAct: string | null
  /** When an automatic solo (or one whose last act ended) returns to the mix; 0 for a chosen one with acts on stage. */
  soloUntil: number
  /** The solo was chosen (her name pressed, /bocchi solo), not opened by autoSolo: her new act calls off its pending end, and autoSolo never replaces it. */
  soloChosen: boolean
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
      /** Proposed rules queued behind the memo on screen, oldest first. */
      proposals: KessokuProposal[]
      replay: KessokuReplay
      ui: KessokuUi
      /** The last set's recap while it is up; null once the next set starts or it is dismissed. */
      recap: KessokuRecap | null
      /** The set in play's counters. */
      tally: KessokuTally
      /** The /bocchi stats page. */
      tour: KessokuTour
    }
  }
}
