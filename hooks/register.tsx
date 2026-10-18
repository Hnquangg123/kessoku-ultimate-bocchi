// Kessoku Ultimate Bocchi Theme: the hooks module.
//
// One module, nine features, every `on(...)` and `$.noun.method(...)` spelled
// here so the host can read them off the source; the pure parts (the look,
// the price table, the risk classifier, the diff, the notebook, the tree
// shape) live under ./lib.
//
//   theme     the engine themes shipped in themes/ (a dark and a light twin),
//             offered once and switched on through the /config theme row, so
//             the prompt border, the diffs, the status colours and every other
//             thing the engine draws turn charcoal and pink.
//   skin      every render site: tool rows framed in pink, the person's and
//             the assistant's messages with a pink bar, folded tool groups,
//             the spinner's verb and the turn footer borrowed from the band,
//             the hint line, the question dialog, `♪ kessoku` in the footer,
//             and Bocchi's face in the status line.
//   band      the Kessoku Band panel (`/kessoku`): subagents mapped to
//             Nijika, Ryo and Kita by their band agent type (registered at
//             session.start, so the model picks a member by name) or else by
//             what they were asked, Bocchi for the main loop and heavy work,
//             each with task, tokens, cost, status, and each drawn as a slime
//             in its member's color (bouncing, breathing or asleep) on her
//             card and in the strip.
//   cache     Cache Tax: a cold prompt cache holds the next send once, with
//             the re-write cost; `/keepwarm` pings keep it warm; `/cache-tax`.
//   blast     Blast Radius: a risky Bash or PowerShell command (rm -rf,
//             Remove-Item -Recurse, git reset --hard, force push, git clean,
//             migrations, destroys) is held behind the dropped guitar screen
//             listing what would go, Cancel focused.
//   tree      Filetree (`/filetree`): the project's files, lit pink while
//             Claude edits them, neon green once a git commit lands.
//   reflect   a correction becomes a band memo from Nijika offering to save
//             the rule to CLAUDE.md (project or global); Claude can propose a
//             rule itself through the memo tool, and the person still saves it.
//   replay    Replay Theater (`/replay`): the last turn's edits as a setlist,
//             one unified diff at a time, with the file's real line numbers.
//   bocchi    `/bocchi theme|demo|memo|tax|crash|mood <m>|strip|help` previews
//             each piece so the look can be tweaked without waiting for the real thing.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, PluginOptions, Register, RenderInput, Timer } from 'claude-code'

import type {
  KessokuAgent,
  KessokuBand,
  KessokuBlast,
  KessokuCache,
  KessokuLight,
  KessokuMember,
  KessokuMemo,
  KessokuMood,
  KessokuProposal,
  KessokuReplay,
  KessokuTrack,
  KessokuTree,
  KessokuUi,
  KessokuUsage,
} from '../types'
import {
  GUITAR,
  MEMBERS,
  NOTES,
  PALETTE,
  SHIMMER,
  SPINNER_WORDS,
  SPINNER_WORDS_BY_MODE,
  THEME_NAME,
  THEME_NAME_LIGHT,
  THEME_OVERRIDES,
  THEME_OVERRIDES_LIGHT,
  THEME_SLUG,
  THEME_SLUG_LIGHT,
  TURN_WORDS,
  padFace,
  pick,
  textWidth,
} from './lib/palette'
import {
  BAND_AGENTS,
  EMPTY_USAGE,
  addUsage,
  cacheWriteUsd,
  costOf,
  describeCall,
  fmtDuration,
  fmtTokens,
  fmtUsd,
  memberFor,
  memberForTool,
  meter,
  parseDuration,
  priceInfo,
  seatOf,
  slimeState,
} from './lib/band'
import { LIST_MAX, classify, classifyPowerShell, cleanArgs, globToRegExp, isGitCommit, size } from './lib/blast'
import type { Risk } from './lib/blast'
import { cutHunks, patchToUnified, unifiedDiff } from './lib/diff'
import type { Unified } from './lib/diff'
import { offLine, versionLine } from './lib/engine'
import type { FeatureKey } from './lib/engine'
import { MEMO_QUEUE_MAX, MEMO_TOOL, MEMO_TOOL_SPEC, appendRule, checkRule, cleanRule, looksLikeCorrection, memoAnswer, rulePrompt } from './lib/reflect'
import { completions } from './lib/typeahead'
import { CRASH, CRASH_MINI, animOf, cellsFor, composite, encodeCells, frameSignature, isAnimated, spriteId, spritesSvg, viewSize } from './lib/sprite'
import type { CellMode, MemberView, SlimeView, SpritePart } from './lib/sprite'
import { ALWAYS_IGNORED, IGNORED_DIRS, MAX_PATHS, baseName, isAnyHot, isGlowing, isInside, isLit, relPath, treeRows, windowRows } from './lib/tree'

// ---- Names, atoms, options --------------------------------------------------

const PANEL = 'kessoku-band'
const TREE = 'kessoku-filetree'
const BLAST = 'kessoku-blast-radius'
const REPLAY = 'kessoku-replay'

const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit'])
const SHELL_TOOLS = new Set(['Bash', 'PowerShell'])
const OWN_COMMANDS = new Set(['kessoku', 'filetree', 'replay', 'keepwarm', 'cache-tax', 'bocchi'])
const HOLD_LIMIT_MS = 10 * 60 * 1000
const POLL_SECONDS = '0.25'
const POLL_MS = 400
const MAX_DIFF_LINES = 14
const MAX_TRACK_LINES = 120
const MAX_TRACKS = 40
const MAX_AGENTS = 24
const MEASURE_CAP = 5000
const HELD_PROMPT_MS = 15 * 60_000
/** Below this many context tokens a cold send is too cheap to hold for, or to warn about. */
const TAX_MIN_TOKENS = 20_000
/** A set at least this long may have been left to play alone: its end is worth a notification. */
const SET_AWAY_MS = 30_000
/** The cache about to go cold is notified this long before it lapses (half the TTL when that is shorter). */
const COLD_NOTICE_MS = 5 * 60_000
/** What heads every native notification. */
const NOTIFY_TITLE = 'Kessoku Band'

function mainAgent(): KessokuAgent {
  return {
    id: 'main',
    member: 'bocchi',
    description: 'the main conversation',
    type: 'main',
    status: 'idle',
    task: '',
    startedAt: 0,
    endedAt: null,
    model: '',
    usage: EMPTY_USAGE,
    context: 0,
    steps: 0,
    tools: 0,
    cost: 0,
    isError: false,
  }
}

const INITIAL_BAND: KessokuBand = {
  agents: [mainAgent()],
  mood: 'anxious',
  mainTask: '',
  contextPercent: 0,
  window: 0,
  sessionUsd: 0,
  rateLimitPercent: 0,
  isWorking: false,
  lastError: '',
}
const INITIAL_CACHE: KessokuCache = {
  lastWarmAt: 0,
  contextTokens: 0,
  model: '',
  keepWarmUntil: 0,
  isArmed: false,
  heldAt: 0,
  heldText: '',
  heldUsd: 0,
  warmUsd: 0,
  pings: 0,
  pingUsd: 0,
  misses: 0,
  lastPingNote: '',
  engineWriteUsd: 0,
  engineModel: '',
}
const INITIAL_TREE: KessokuTree = { root: '', paths: [], lights: [], isOpen: false, isBand: false, builtAt: 0 }
const INITIAL_REPLAY: KessokuReplay = { tracks: [], index: 0, isOpen: false, inBand: false, setlist: 0 }
const INITIAL_UI: KessokuUi = { isPanelOpen: false, isStripHidden: false, panelWhere: 'none' }

const band = atom({ plugin: 'kessoku-ultimate-bocchi', key: 'band' } as const, INITIAL_BAND)
const cache = atom({ plugin: 'kessoku-ultimate-bocchi', key: 'cache' } as const, INITIAL_CACHE)
const blast = atom({ plugin: 'kessoku-ultimate-bocchi', key: 'blast' } as const, null)
const tree = atom({ plugin: 'kessoku-ultimate-bocchi', key: 'tree' } as const, INITIAL_TREE)
const frame = atom({ plugin: 'kessoku-ultimate-bocchi', key: 'frame' } as const, 0)
const memo = atom({ plugin: 'kessoku-ultimate-bocchi', key: 'memo' } as const, null)
const proposals = atom({ plugin: 'kessoku-ultimate-bocchi', key: 'proposals' } as const, [] as KessokuProposal[])
const replay = atom({ plugin: 'kessoku-ultimate-bocchi', key: 'replay' } as const, INITIAL_REPLAY)
const ui = atom({ plugin: 'kessoku-ultimate-bocchi', key: 'ui' } as const, INITIAL_UI)

type Skin = 'full' | 'light' | 'none'
type Toasts = 'all' | 'important' | 'none'
type CharacterArt = 'sprites' | 'kaomoji'

type Opts = {
  applyTheme: boolean
  transcriptSkin: Skin
  characterArt: CharacterArt
  restyleOthers: boolean
  toasts: Toasts
  accent: string
  paint: boolean
  toolCards: 'all' | 'edits' | 'none'
  spinnerWords: boolean
  ttlMs: number
  isTtlDefault: boolean
  keepWarmMs: number
  reflect: boolean
  openPanel: boolean
}

function readOptions(options: PluginOptions): Opts {
  const accent = typeof options.accent === 'string' && options.accent.trim() !== '' ? options.accent.trim() : 'claude'
  const cards = options.toolCards
  const skin = options.transcriptSkin
  const toasts = options.toasts
  const ttl = Number(options.cacheTtlMinutes)
  return {
    applyTheme: options.applyTheme !== false,
    transcriptSkin: skin === 'light' || skin === 'none' ? skin : 'full',
    characterArt: options.characterArt === 'kaomoji' ? 'kaomoji' : 'sprites',
    restyleOthers: options.restyleOthers === true,
    toasts: toasts === 'important' || toasts === 'none' ? toasts : 'all',
    accent,
    paint: options.paintBackgrounds !== false,
    toolCards: cards === 'edits' || cards === 'none' ? cards : 'all',
    spinnerWords: options.spinnerWords !== false,
    ttlMs: Math.max(1, ttl || 60) * 60_000,
    isTtlDefault: !Number.isFinite(ttl) || ttl === 60,
    keepWarmMs: Math.max(1, Number(options.keepWarmMinutes) || 360) * 60_000,
    reflect: options.reflect !== false,
    openPanel: options.openPanelOnStart !== false,
  }
}

// ---- Module state (lost on a hot reload; the drawings read $.state) ----------

type Held = { command: string; risk: Risk; decision: string | null }

let opts: Opts = readOptions({})
let held: Held | null = null
let isInteractive = true
let hasSurface = false
let uiStarted = false
let isLightTheme = false
let cwd = ''
let ttlOverrideMs: number | null = null
const badSleepers = new Set<string>()
let lastStatus = ''
let tickTimer: Timer | null = null
let shimmerTimer: Timer | null = null
let pruneTimer: Timer | null = null
let keepWarmTimer: Timer | null = null
let moodTimer: Timer | null = null
let memoTimer: Timer | null = null
let pendingTracks: KessokuTrack[] = []
/** The main conversation is being compacted: Bocchi melts, and nothing pings the cache meanwhile. */
let isCompacting = false
/** The warm period (its `lastWarmAt`) the cold-cache notice went out for, so it goes once per period. */
let coldNoticeFor = 0
/** The engine's release (`2.1.299`), '' when it could not say; the mod's own version from its manifest, '' when unread. */
let engineVersion = ''
let modVersion = ''
/**
 * The gate: each feature that leans on a newer engine call, on until the
 * call turns out not to exist (a TypeError where it is first made); a feature
 * that is off calls nothing more, and `/bocchi help` names it. The hooks
 * (`session.compact`, `prompt.autocomplete`) cannot be gated: an engine that
 * does not know an event refuses the whole module at load.
 */
const features: Record<FeatureKey, boolean> = { suggest: true, notify: true, version: true, agents: true, memo: true }
/** The band's agent types as the engine named them (`kessoku-ultimate-bocchi:ryo`), by member; filled at each session.start. */
const bandTypes = new Map<string, string>()

/**
 * A sprite a terminal drawing holds as a Raster, repainted by the sprite
 * clock: `gen` is the drawing of its site that drew it, `sig` the frames it
 * shows, `refusedAt` when the surface last turned a repaint down (0 while it
 * takes them), `triedAt` the last attempt.
 */
type LiveSprite = { requestId: string; key: string; parts: SpritePart[]; w: number; h: number; mode: CellMode; bg: string | undefined; sig: string; gen: number; drawnAt: number; refusedAt: number; triedAt: number }
const liveSprites = new Map<string, LiveSprite>()
/** How many times each site has drawn: a sprite that a site's latest drawing left out is gone. */
const spriteSites = new Map<string, number>()
/** The band's site, which, like the panes, lasts the session. */
let bandRequestId = ''
/** Panes closed since they were last opened: a drawing of one that lands late keeps its Rasters still. */
const closedSites = new Set<string>()
let spriteTimer: Timer | null = null
/** The sprites' frames are 100 ms apart (the studio renders at 10 fps). */
const SPRITE_TICK_MS = 100
/** A refused repaint is tried again this often: a pane shown again from a tab, or the band expanded again, takes its animation back. */
const SPRITE_RETRY_MS = 1000
/** A passing site (a dialog) whose sprite has been refused this long is given up; a pane or the band is tried until it closes or redraws. */
const SPRITE_GIVE_UP_MS = 60_000
/** A finished act stays in the strip's row of slimes this long, asleep, then leaves. */
const SLIME_TAIL_MS = 30_000
/** The strip's row of slimes holds this many at most; the rest are counted `+n`. */
const STRIP_SLIMES = 6
/** The redraw that takes a sleeping act off the strip when its half minute is up (no state changes then), and when it is due. */
let tailTimer: Timer | null = null
let tailTimerAt = 0

type Site = RenderInput<'Pane'> | RenderInput<'AbovePrompt'>
type Draw = JSX.Element

// ---- Small helpers -----------------------------------------------------------

function ttlMs(): number {
  return ttlOverrideMs ?? opts.ttlMs
}

/** The charcoal behind the theme's own boxes: only when asked, and never over a light theme. */
function bg(light = false): string | undefined {
  if (!opts.paint || isLightTheme) return undefined
  return light ? PALETTE.charcoalLight : PALETTE.charcoal
}

/** A toast, by how much the person wanted to hear: `important` ones always (unless none), `chatter` only under `all`. */
function toast($: EngineInterface, text: string, level: 'important' | 'chatter' = 'important'): void {
  if (opts.toasts === 'none') return
  if (opts.toasts === 'important' && level === 'chatter') return
  $.ui.toast(text)
}

/**
 * A native notification through the person's own channel (`$.ui.notify`),
 * titled with the band, for the things worth coming back for. Silent when
 * toasts are off; a channel that cannot send (the desktop app, an SDK host,
 * notifications turned off) or a failed call reads as not sent, and the
 * caller decides what else to show.
 */
async function notify($: EngineInterface, text: string): Promise<boolean> {
  if (opts.toasts === 'none' || !features.notify) return false
  try {
    return (await $.ui.notify(text, { title: NOTIFY_TITLE })).isSent
  } catch (error) {
    if (isMissingApi(error)) features.notify = false
    return false
  }
}

function isPersonPrompt(kind: string): boolean {
  return kind === 'composer' || kind === 'bridge' || kind === 'sdk' || kind === 'unclassified'
}

/** Whether someone can see a screen and answer: the REPL, or a client that attached (the desktop app, a phone). */
function canDraw(): boolean {
  return isInteractive || hasSurface
}

/** Whether a person can press Enter again: the Cache Tax hold needs a composer in front of someone. */
function canResend(kind: string): boolean {
  return canDraw() && (kind === 'composer' || kind === 'bridge' || kind === 'sdk')
}

function isLightValue(value: unknown): boolean {
  return typeof value === 'string' && /light/i.test(value)
}

function isAbsolutePath(path: string): boolean {
  return /^([A-Za-z]:)?[\\/]/.test(path)
}

function joinPath(dir: string, rel: string): string {
  return `${dir.replace(/[\\/]+$/, '')}/${rel.replace(/^[\\/]+/, '')}`
}

function patchAgent(b: KessokuBand, id: string, fn: (a: KessokuAgent) => KessokuAgent): KessokuBand {
  return { ...b, agents: b.agents.map(a => (a.id === id ? fn(a) : a)) }
}

function isLive(a: KessokuAgent): boolean {
  return a.status === 'running' || a.status === 'pending' || a.status === 'waiting'
}

function trimAgents(agents: KessokuAgent[]): KessokuAgent[] {
  if (agents.length <= MAX_AGENTS + 1) return agents
  const main = agents.filter(a => a.id === 'main')
  const rest = agents.filter(a => a.id !== 'main')
  const live = rest.filter(isLive)
  const done = rest.filter(a => !isLive(a)).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))
  return [...main, ...live, ...done].slice(0, MAX_AGENTS + 1)
}

/** A member's mood from the agents on their part of the stage. */
function memberMood(b: KessokuBand, member: KessokuMember, now: number): KessokuMood {
  if (member === 'bocchi') return b.mood
  const mine = b.agents.filter(a => a.member === member && a.id !== 'main')
  if (mine.some(a => isLive(a))) return 'focused'
  const latest = mine.filter(a => a.endedAt !== null).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0]
  if (latest && latest.endedAt !== null && now - latest.endedAt < 8000) return latest.isError ? 'panic' : latest.status === 'killed' ? 'anxious' : 'happy'
  return 'anxious'
}

function statusLine(mood: KessokuMood, detail: string): string {
  const m = MEMBERS.bocchi
  return `${m.faces[mood]} bocchi · ${detail || m.lines[mood]}`
}

/** The status line, written only when it changes: the engine redraws for every write. */
function setStatus($: EngineInterface, text: string): void {
  if (text === lastStatus) return
  lastStatus = text
  $.ui.status(text)
}

function warmth(c: KessokuCache, now: number): string {
  if (c.lastWarmAt === 0) return 'cache: nothing cached yet'
  const left = ttlMs() - (now - c.lastWarmAt)
  if (left <= 0) return `cache COLD ${fmtDuration(-left)} ago`
  const keep = c.keepWarmUntil > now ? ` · keepwarm ${fmtDuration(c.keepWarmUntil - now)}` : ''
  return `cache warm ${fmtDuration(left)}${keep}`
}

/** What re-writing the cache costs: the engine's own estimate for this model when it gave one, else the list price at the TTL's rate. */
function coldWriteUsd(c: KessokuCache): number {
  if (c.engineWriteUsd > 0 && c.engineModel !== '' && c.engineModel === c.model) return c.engineWriteUsd
  return cacheWriteUsd(c.contextTokens, c.model || 'default', ttlMs())
}

function readField(input: Record<string, unknown>, key: string): string {
  const v = input[key]
  return typeof v === 'string' ? v : ''
}

/** The beat of the "playing" marker, from the clock rather than a counter a render hook would have to mutate. */
function noteAt(now: number): string {
  return NOTES[Math.floor(now / 1000) % NOTES.length] as string
}

const SLEEPERS: Readonly<Record<string, readonly string[]>> = {
  sleep: ['sleep', POLL_SECONDS],
  powershell: ['powershell', '-NoProfile', '-NonInteractive', '-Command', `Start-Sleep -Milliseconds ${POLL_MS}`],
  pwsh: ['pwsh', '-NoProfile', '-NonInteractive', '-Command', `Start-Sleep -Milliseconds ${POLL_MS}`],
}

/**
 * Waits a beat without spending the hook's budget: a child process that
 * sleeps (`sleep` where it exists, PowerShell's Start-Sleep on Windows), each
 * candidate tried in turn and remembered when it cannot run. Returns false
 * when none could and the wait fell back to the clock, which the budget counts.
 */
async function pause($: EngineInterface): Promise<boolean> {
  const order = (await $.env.get('OS')) === 'Windows_NT' ? ['powershell', 'pwsh', 'sleep'] : ['sleep', 'pwsh', 'powershell']
  for (const name of order) {
    if (badSleepers.has(name)) continue
    try {
      const run = await $.process.run(SLEEPERS[name] as string[], { timeoutMs: 10000 })
      if (run.exitCode === 0) return true
      badSleepers.add(name) // it ran and refused the arguments: not a sleeper here
    } catch {
      badSleepers.add(name) // it could not start
    }
  }
  await $.clock.sleep(POLL_MS)
  return false
}

async function homeDir($: EngineInterface): Promise<string | null> {
  return (await $.env.get('HOME')) ?? (await $.env.get('USERPROFILE')) ?? null
}

async function configDir($: EngineInterface): Promise<string | null> {
  const set = await $.env.get('CLAUDE_CONFIG_DIR')
  if (set !== undefined && set !== '') return set
  const home = await homeDir($)
  return home === null ? null : `${home}/.claude`
}

/**
 * Whether a failed call means the engine has no such method at all (`$.ui.notify is not a function`), as
 * against a call that was made and refused: the former switches its feature off for the session.
 */
function isMissingApi(error: unknown): boolean {
  return error instanceof TypeError && /not a function/.test(error.message)
}

/**
 * Once per session: the engine's version (a feature off when the call is
 * not there), and the mod's own from its manifest (read through the engine's
 * file system: a hooks module can import no JSON, and a constant would drift
 * from plugin.json). The other calls are probed where they are first made.
 */
async function readEngine($: EngineInterface): Promise<void> {
  engineVersion = ''
  try {
    const v = await $.session.version()
    engineVersion = v.base ?? v.version
  } catch (error) {
    if (isMissingApi(error)) features.version = false
  }
  modVersion = ''
  try {
    const manifest = JSON.parse(await $.fs.read(joinPath($.plugin.root, '.claude-plugin/plugin.json'))) as { version?: unknown }
    if (typeof manifest.version === 'string') modVersion = manifest.version
  } catch {
    modVersion = ''
  }
}

/**
 * At each session.start: the band's agent types for the Agent tool (from the
 * next turn on), kept by the names the engine gave them. A feature off when
 * the engine has no `$.agent.register`; a type the engine or another plugin
 * refuses is simply not offered.
 */
async function registerBand($: EngineInterface): Promise<void> {
  if (!features.agents) return
  for (const spec of BAND_AGENTS) {
    try {
      const r = await $.agent.register({ name: spec.name, description: spec.description, prompt: spec.prompt, tools: spec.tools })
      bandTypes.set(spec.name, r.agent)
    } catch (error) {
      if (isMissingApi(error)) {
        features.agents = false
        return
      }
      bandTypes.delete(spec.name)
    }
  }
}

/** The registered name of a band type spelled another way (`kessoku:ryo`), or null: unknown, unregistered, or already the name. */
function registeredType(type: string): string | null {
  const seat = seatOf(type)
  const name = seat === null ? undefined : bandTypes.get(seat)
  return name === undefined || name === type ? null : name
}

/** At each session.start, while reflect is on: the memo tool Claude proposes a rule through. A feature off when the engine has no `$.tool.register`. */
async function registerMemoTool($: EngineInterface): Promise<void> {
  if (!features.memo || !opts.reflect) return
  try {
    await $.tool.register(MEMO_TOOL_SPEC)
  } catch (error) {
    if (isMissingApi(error)) features.memo = false
  }
}

// ---- Mood and status line ----------------------------------------------------

async function setMood($: EngineInterface, mood: KessokuMood, detail = '', revertMs = 0): Promise<void> {
  await update($, band, b => ({ ...b, mood }))
  setStatus($, statusLine(mood, detail))
  if (moodTimer !== null) {
    moodTimer.cancel()
    moodTimer = null
  }
  if (revertMs > 0) {
    moodTimer = $.clock.after(revertMs, () => {
      moodTimer = null
      void revertMood($)
    })
  }
}

async function revertMood($: EngineInterface): Promise<void> {
  const b = await read($, band)
  const mood: KessokuMood = b.contextPercent >= 85 ? 'melting' : b.isWorking ? 'focused' : 'anxious'
  const detail = mood === 'melting' ? `ctx ${b.contextPercent}% full` : mood === 'focused' ? b.mainTask : ''
  await update($, band, x => ({ ...x, mood }))
  setStatus($, statusLine(mood, detail))
}

// ---- Band bookkeeping --------------------------------------------------------

async function upsertAgent($: EngineInterface, agent: KessokuAgent): Promise<void> {
  await update($, band, b => {
    const has = b.agents.some(a => a.id === agent.id)
    const agents = has ? b.agents.map(a => (a.id === agent.id ? { ...a, ...agent } : a)) : [...b.agents, agent]
    return { ...b, agents: trimAgents(agents) }
  })
}

async function noteTask($: EngineInterface, agentId: string | undefined, task: string): Promise<void> {
  const id = agentId ?? 'main'
  const b = await update($, band, x => {
    if (!x.agents.some(a => a.id === id)) return x
    const next = patchAgent(x, id, a => ({ ...a, task, tools: a.tools + 1 }))
    return id === 'main' ? { ...next, mainTask: task } : next
  })
  if (agentId === undefined && b.mood === 'focused') setStatus($, statusLine('focused', task))
}

function ensureTick($: EngineInterface): void {
  if (tickTimer !== null) return
  tickTimer = $.clock.every(2000, () => {
    void tick($)
  })
}

/**
 * Reconciles the band with the engine's own agent list. The work happens
 * inside the updater, on the value as it stands at the write, so a usage or
 * task patch that landed meanwhile is kept; the state is written only when
 * something changed.
 */
async function tick($: EngineInterface): Promise<void> {
  const list = await $.agent.list()
  const now = await $.clock.now()
  const byId = new Map(list.map(a => [a.id, a] as const))
  const reconcile = (x: KessokuBand): { band: KessokuBand; changed: boolean } => {
    let changed = false
    const agents = x.agents.map(a => {
      if (a.id === 'main') return a
      const info = byId.get(a.id)
      if (info === undefined || (info.status === a.status && (a.isError || info.status !== 'failed'))) return a
      changed = true
      const isDone = info.status === 'completed' || info.status === 'failed' || info.status === 'killed'
      return { ...a, status: info.status, endedAt: isDone && a.endedAt === null ? now : a.endedAt, isError: a.isError || info.status === 'failed' }
    })
    for (const info of list) {
      if (agents.some(a => a.id === info.id)) continue
      changed = true
      agents.push({
        ...mainAgent(),
        id: info.id,
        member: memberFor({ type: info.type, description: info.description, prompt: '', background: false }),
        description: info.description || info.type,
        type: info.type,
        status: info.status,
        startedAt: now,
      })
    }
    return { band: changed ? { ...x, agents: trimAgents(agents) } : x, changed }
  }
  const before = await read($, band)
  const b = reconcile(before).changed ? await update($, band, x => reconcile(x).band) : before
  const anyLive = b.isWorking || b.agents.some(a => a.id !== 'main' && !a.id.startsWith('demo-') && isLive(a))
  if (!anyLive && tickTimer !== null) {
    tickTimer.cancel()
    tickTimer = null
  }
}

type UsageFacts = {
  context: { window: number; percent?: number | null }
  cost?: { usd: number } | undefined
  rateLimits?: ReadonlyArray<{ percentUsed: number }>
}

/** Folds the engine's figures (from `$.session.usage()` or a `session.measure` event) into the band. */
async function applyUsage($: EngineInterface, u: UsageFacts): Promise<void> {
  const rate = Math.max(0, ...(u.rateLimits ?? []).map(r => r.percentUsed))
  // A figure the engine does not have is left out, never zeroed: keep the last reading then.
  const b1 = await update($, band, b => ({ ...b, contextPercent: u.context.percent ?? b.contextPercent, window: u.context.window, sessionUsd: u.cost?.usd ?? b.sessionUsd, rateLimitPercent: Number.isFinite(rate) ? Math.round(rate) : 0 }))
  if (b1.contextPercent >= 85 && b1.mood !== 'panic' && b1.mood !== 'melting') await setMood($, 'melting', `ctx ${b1.contextPercent}% full`)
}

async function refreshUsage($: EngineInterface): Promise<void> {
  await applyUsage($, await $.session.usage())
}

// ---- Theme -----------------------------------------------------------------------

type ThemeRow = { value: unknown; options?: readonly string[]; isLocked: boolean }

async function themeRow($: EngineInterface): Promise<ThemeRow | null> {
  try {
    const rows = await $.config.list()
    return rows.find(r => r.key === 'theme') ?? null
  } catch {
    return null
  }
}

/** The /theme option one of the plugin's themes is listed under, whatever spelling the engine gives it; the light twin only when asked for. */
function themeOptionOf(row: ThemeRow | null, light: boolean): string | undefined {
  const options = row?.options ?? []
  const mine = options.filter(o => {
    const low = o.toLowerCase()
    return low.includes(THEME_SLUG) || low.includes(THEME_NAME.toLowerCase())
  })
  return mine.find(o => /light/i.test(o) === light) ?? (light ? undefined : mine[0])
}

function isKessokuTheme(value: unknown): boolean {
  return typeof value === 'string' && (value.toLowerCase().includes(THEME_SLUG) || value.toLowerCase().includes(THEME_NAME.toLowerCase()))
}

async function storeGet($: EngineInterface, key: string): Promise<unknown> {
  try {
    return await $.store.get(key)
  } catch {
    return undefined
  }
}

async function storeSet($: EngineInterface, key: string, value: unknown): Promise<void> {
  try {
    await $.store.set(key, value)
  } catch {
    // the store is optional: without it the theme is just offered again next time
  }
}

/** Writes one of the themes into the person's own themes folder, for an engine that does not list the plugin's. */
async function writeThemeCopy($: EngineInterface, light: boolean): Promise<string | null> {
  const dir = await configDir($)
  if (dir === null) return null
  const slug = light ? THEME_SLUG_LIGHT : THEME_SLUG
  const path = `${dir}/themes/${slug}.json`
  const theme = { name: light ? THEME_NAME_LIGHT : THEME_NAME, base: light ? 'light' : 'dark', overrides: light ? THEME_OVERRIDES_LIGHT : THEME_OVERRIDES }
  try {
    await $.fs.write(path, `${JSON.stringify(theme, null, 2)}\n`)
    return path
  } catch {
    return null
  }
}

/** Switches the engine's theme row to the Kessoku theme (the light twin on a light theme), remembering the one before. */
async function applyKessokuTheme($: EngineInterface): Promise<string> {
  let row = await themeRow($)
  if (row === null) return 'the engine has no theme row to set here.'
  if (row.isLocked) return 'the theme is locked by your organization, so it stays.'
  // A light base, or the light twin itself, wants the light twin; the twin's own name says "light".
  const light = isLightValue(row.value)
  let mine = themeOptionOf(row, light)
  if (mine === undefined) {
    const copy = await writeThemeCopy($, light)
    if (copy === null) return 'the Kessoku theme is not in the /theme list and no themes folder could be written.'
    // The engine watches its themes folder; give it a moment (a bounded wait, cancelled with the hook).
    try {
      await $.clock.sleep(1500)
    } catch {
      // the wait was cut short; list again anyway
    }
    row = await themeRow($)
    mine = themeOptionOf(row, light) ?? `custom:${light ? THEME_SLUG_LIGHT : THEME_SLUG}`
  }
  if (row !== null && row.value === mine) return `already on: ${mine}`
  if (row !== null && typeof row.value === 'string' && !isKessokuTheme(row.value) && !(await storeGet($, 'themeBefore'))) await storeSet($, 'themeBefore', row.value)
  const r = await $.config.set({ key: 'theme', value: mine })
  if (r.deny !== undefined) return `the theme stays: ${r.deny}`
  isLightTheme = light
  return `on: ${mine}. /bocchi theme off puts the old one back.`
}

async function restoreTheme($: EngineInterface): Promise<string> {
  const before = await storeGet($, 'themeBefore')
  if (typeof before !== 'string') return 'nothing to restore: the Kessoku theme was never switched on from here.'
  const r = await $.config.set({ key: 'theme', value: before })
  if (r.deny !== undefined) return `could not restore ${before}: ${r.deny}`
  try {
    await $.store.delete('themeBefore')
  } catch {
    // fine
  }
  isLightTheme = isLightValue(before)
  return `back to ${before}.`
}

/** Once per machine: asks before switching the theme, and remembers either answer. */
async function offerTheme($: EngineInterface): Promise<void> {
  if (await storeGet($, 'themeAsked')) return
  const row = await themeRow($)
  if (row === null || row.isLocked || isKessokuTheme(row.value)) return
  await storeSet($, 'themeAsked', true)
  let answer = 'Not now'
  try {
    const picked: unknown = await $.ui.ask(`Put on the ${THEME_NAME} theme (pink prompt, charcoal diffs, band colours everywhere)?`, { options: ['Yes, tune up', 'Not now'], header: 'Theme' })
    answer = typeof picked === 'string' ? picked : 'Not now'
  } catch {
    answer = 'Not now'
  }
  if (!answer.startsWith('Yes')) {
    toast($, `${MEMBERS.bocchi.faces.anxious} okay. /bocchi theme on any time`)
    return
  }
  const result = await applyKessokuTheme($)
  toast($, `${MEMBERS.kita.faces.happy} theme ${result}`)
}

// ---- Cache Tax ---------------------------------------------------------------

async function keepWarmTick($: EngineInterface): Promise<void> {
  const c = await read($, cache)
  const b = await read($, band)
  const now = await $.clock.now()
  if (c.keepWarmUntil <= now || b.isWorking || isCompacting || c.lastWarmAt === 0 || c.contextTokens < 1000) return
  const age = now - c.lastWarmAt
  const ttl = ttlMs()
  if (age < ttl - 90_000) return
  // Already cold (keepwarm armed late, or the card's "keep it warm after"): the next send warms it; the pings start then.
  if (age > ttl) return
  const r = await $.model.fork({ prompt: 'Kessoku keep-warm ping. Reply with one word: ok' })
  if (r.isAnswered) {
    const u = r.usage
    const ping = costOf(
      { input: u.input_tokens, output: u.output_tokens, cacheRead: u.cache_read_input_tokens, cacheWrite: u.cache_creation_input_tokens },
      c.model || 'default',
    )
    // The fork says whether the prefix came from the cache: near zero read, the entry had lapsed and the ping paid to re-write it.
    const wasWarm = u.cache_read_input_tokens >= c.contextTokens * 0.5
    const landed = await $.clock.now()
    await update($, cache, x => ({
      ...x,
      lastWarmAt: landed,
      pings: x.pings + 1,
      misses: x.misses + (wasWarm ? 0 : 1),
      pingUsd: x.pingUsd + ping,
      lastPingNote: wasWarm
        ? `ping ${x.pings + 1} read ${fmtTokens(u.cache_read_input_tokens)} from cache for ${fmtUsd(ping)}`
        : `ping ${x.pings + 1} found the cache cold and re-wrote ${fmtTokens(u.cache_creation_input_tokens)} for ${fmtUsd(ping)}`,
    }))
    if (!wasWarm) toast($, `${MEMBERS.bocchi.faces.panic} keepwarm: the cache had gone cold; the ping re-wrote it (${fmtUsd(ping)})`)
  } else {
    await update($, cache, x => ({ ...x, lastPingNote: `ping failed: ${r.reason}` }))
  }
}

/**
 * The cache about to go cold while the session is idle and keepwarm is off:
 * one notification a warm period, shortly before the TTL lapses, priced as
 * the tax would be; a toast where no channel could send it. Keepwarm's own
 * pings make it moot while they run.
 */
async function coldWatch($: EngineInterface): Promise<void> {
  const c = await read($, cache)
  const b = await read($, band)
  const now = await $.clock.now()
  if (c.lastWarmAt === 0 || c.lastWarmAt === coldNoticeFor || b.isWorking || isCompacting || c.keepWarmUntil > now || c.contextTokens < TAX_MIN_TOKENS) return
  const ttl = ttlMs()
  const left = ttl - (now - c.lastWarmAt)
  if (left <= 0 || left > Math.min(COLD_NOTICE_MS, ttl / 2)) return
  coldNoticeFor = c.lastWarmAt
  const text = `Cache Tax: the cache goes cold in ${fmtDuration(left)} · re-writing ${fmtTokens(c.contextTokens)} tokens would cost ≈${fmtUsd(coldWriteUsd(c))} · /keepwarm keeps it warm`
  if (!(await notify($, text))) toast($, `${MEMBERS.bocchi.faces.anxious} ${text}`)
}

function cacheTaxReason(c: KessokuCache, now: number): string {
  const age = c.lastWarmAt > 0 ? fmtDuration(now - c.lastWarmAt) : '?'
  return (
    `${MEMBERS.bocchi.faces.panic} CACHE TAX — the prompt cache went cold ${age} ago! ` +
    `Sending this re-writes ${fmtTokens(c.contextTokens)} tokens ≈ ${fmtUsd(c.heldUsd)} ` +
    `(a warm turn would have cost ≈ ${fmtUsd(c.warmUsd)}). ` +
    `Your prompt is back in the box: press Enter again to pay it and send, or /clear and start from a note.`
  )
}

// ---- Compaction --------------------------------------------------------------

/**
 * A compaction of the main conversation stood: the band's context figure and
 * the main agent's tokens are the compacted set's (0 when the engine did not
 * count it, so no stale figure survives; the next turn measures afresh), the
 * cache has no entry for the new transcript yet (nothing warm, the compacted
 * size to price the next write, no held prompt, no engine estimate for a
 * prefix that is gone), and Bocchi comes back to her real face.
 */
async function settleCompaction($: EngineInterface, before: number | undefined, after: number | undefined): Promise<void> {
  const tokens = after ?? 0
  await update($, band, b => patchAgent({ ...b, contextPercent: after !== undefined && b.window > 0 ? Math.round((after / b.window) * 100) : 0 }, 'main', a => ({ ...a, context: tokens })))
  await update($, cache, c => ({ ...c, lastWarmAt: 0, contextTokens: tokens, isArmed: false, heldAt: 0, heldText: '', heldUsd: 0, warmUsd: 0, engineWriteUsd: 0, engineModel: '' }))
  await revertMood($)
  const shrank = before !== undefined && after !== undefined ? `: ${fmtTokens(before)} → ${fmtTokens(after)} tokens` : ''
  toast($, `${MEMBERS.nijika.faces.happy} Nijika: the set is compacted${shrank}`, 'chatter')
}

// ---- Blast Radius ------------------------------------------------------------

type Report = { summary: string; lines: string[]; more: number; note: string }

/** A `cd` target as an absolute folder, through the engine's own file system; null when it leads nowhere. */
async function resolveDir($: EngineInterface, sessionCwd: string, dir: string): Promise<string | null> {
  if (dir === '-') return null
  let target = dir
  if (target === '~' || target.startsWith('~/')) {
    const home = await homeDir($)
    if (home === null) return null
    target = home + target.slice(1)
  }
  const abs = isAbsolutePath(target) ? target : joinPath(sessionCwd, target)
  try {
    const st = await $.fs.stat(abs, { resolve: true })
    return st.kind === 'dir' ? (st.realPath ?? abs) : null
  } catch {
    return null
  }
}

async function measure($: EngineInterface, risk: Risk, dir: string): Promise<Report> {
  try {
    if (risk.kind === 'rm') {
      if (risk.note !== undefined) return { summary: `${risk.label} (not measured)`, lines: [], more: 0, note: risk.note }
      return await measureRm($, risk.targets, dir)
    }
    if (risk.kind === 'migrate') return { summary: `run ${risk.label}`, lines: [], more: 0, note: 'Pending migrations are not listed here; the database is what changes.' }
    if (risk.kind === 'other') return { summary: risk.label, lines: [], more: 0, note: risk.note }
    if (risk.kind === 'git-push-force') return await measurePush($, risk.args, dir)
    if (risk.kind === 'git-clean') return await measureClean($, risk.args, dir)
    return await measureDiscard($, risk.kind, risk.label, dir)
  } catch (error) {
    return { summary: `${risk.label} (could not measure it)`, lines: [], more: 0, note: `Could not measure: ${String((error as { message?: string })?.message ?? error).slice(0, 200)}` }
  }
}

/** The existing paths an rm target names: `~` expanded, each glob segment matched against the folder it is in. */
async function expandTarget($: EngineInterface, dir: string, target: string): Promise<string[]> {
  let t = target.replace(/\\/g, '/')
  if (t === '~' || t.startsWith('~/')) {
    const home = await homeDir($)
    if (home === null) return []
    t = home.replace(/\\/g, '/') + t.slice(1)
  }
  const absolute = isAbsolutePath(t)
  const parts = t.split('/').filter(p => p !== '')
  // `/var/x` walks from '' ('' + '/var'); `C:/x` from 'C:'; a relative target from the folder.
  let bases: string[] = [absolute ? (t.startsWith('/') ? '' : `${parts.shift() ?? ''}`) : dir.replace(/[\\/]+$/, '')]
  // Windows compares names without regard to case, so a glob there matches that way too.
  const ignoreCase = /^[A-Za-z]:/.test(t) || /^[A-Za-z]:/.test(dir) || dir.includes('\\')
  for (const part of parts) {
    const re = globToRegExp(part, ignoreCase)
    const next: string[] = []
    for (const base of bases) {
      if (re === null) {
        next.push(`${base}/${part}`)
        continue
      }
      let entries: Awaited<ReturnType<typeof $.fs.list>> = []
      try {
        entries = await $.fs.list(base === '' ? '/' : base)
      } catch {
        continue
      }
      for (const en of entries) if (re.test(en.name) && (part.startsWith('.') || !en.name.startsWith('.'))) next.push(`${base}/${en.name}`)
    }
    bases = next
    if (bases.length === 0) break
  }
  const found: string[] = []
  for (const p of bases) {
    try {
      await $.fs.stat(p)
      found.push(p)
    } catch {
      // not there
    }
  }
  return found
}

type Count = { files: number; bytes: number; sample: string[]; capped: boolean }

async function walkCount($: EngineInterface, path: string, label: string, acc: Count): Promise<void> {
  if (acc.files >= MEASURE_CAP) {
    acc.capped = true
    return
  }
  let st
  try {
    st = await $.fs.stat(path)
  } catch {
    return
  }
  if (st.kind !== 'dir' || st.isLink) {
    acc.files += 1
    acc.bytes += st.size
    if (acc.sample.length < LIST_MAX) acc.sample.push(label)
    return
  }
  let entries: Awaited<ReturnType<typeof $.fs.list>> = []
  try {
    entries = await $.fs.list(path)
  } catch {
    return
  }
  for (const en of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
    if (acc.files >= MEASURE_CAP) {
      acc.capped = true
      return
    }
    const child = `${path}/${en.name}`
    const childLabel = `${label}/${en.name}`
    if (en.kind === 'dir' && !en.isLink) await walkCount($, child, childLabel, acc)
    else {
      acc.files += 1
      acc.bytes += en.size
      if (acc.sample.length < LIST_MAX) acc.sample.push(childLabel)
    }
  }
}

async function measureRm($: EngineInterface, targets: string[], dir: string): Promise<Report> {
  if (targets.length === 0) return { summary: 'rm with no paths', lines: [], more: 0, note: 'No paths to expand.' }
  const found: string[] = []
  for (const t of targets) found.push(...(await expandTarget($, dir, t)))
  if (found.length === 0) return { summary: `delete nothing: no file matches ${targets.join(' ')}`, lines: [], more: 0, note: "The paths don't exist as spelled here, so rm has nothing to remove." }
  const acc: Count = { files: 0, bytes: 0, sample: [], capped: false }
  for (const p of found) await walkCount($, p, relPath(dir, p) || baseName(p), acc)
  if (acc.files === 0) return { summary: `delete ${found.length} ${found.length === 1 ? 'path' : 'paths'} with no files inside`, lines: [], more: 0, note: `Paths: ${targets.join(' ')}` }
  return {
    summary: `delete ${acc.capped ? 'at least ' : ''}${acc.files} ${acc.files === 1 ? 'file' : 'files'} (about ${size(acc.bytes)})`,
    lines: acc.sample,
    more: Math.max(0, acc.files - acc.sample.length),
    note: `Paths: ${targets.join(' ')}${acc.capped ? ` · counting stopped at ${MEASURE_CAP} files` : ''}`,
  }
}

async function measureClean($: EngineInterface, args: string[], dir: string): Promise<Report> {
  const { flags, paths } = cleanArgs(args)
  const run = await $.process.run(['git', 'clean', '-n', ...flags, '--', ...paths], { cwd: dir, timeoutMs: 15000 })
  if (run.exitCode !== 0) return { summary: 'git clean (could not dry-run it)', lines: [], more: 0, note: run.stderr.trim().slice(0, 200) }
  const gone = run.stdout.split('\n').filter(l => l.startsWith('Would remove ')).map(l => l.slice(13))
  return {
    summary: gone.length === 0 ? 'remove nothing: no untracked files match' : `remove ${gone.length} untracked ${gone.length === 1 ? 'path' : 'paths'}`,
    lines: gone.slice(0, LIST_MAX),
    more: Math.max(0, gone.length - LIST_MAX),
    note: "From git clean -n. Untracked files are not in git, so they can't be recovered.",
  }
}

async function measureDiscard($: EngineInterface, kind: 'git-reset' | 'git-checkout', label: string, dir: string): Promise<Report> {
  const status = await $.process.run(['git', 'status', '--porcelain'], { cwd: dir, timeoutMs: 15000 })
  if (status.exitCode !== 0) return { summary: `${label} (not a git repo here?)`, lines: [], more: 0, note: status.stderr.trim().slice(0, 200) }
  const rows = status.stdout.split('\n').filter(l => l.length > 3 && !l.startsWith('??'))
  const lost = kind === 'git-reset' ? rows : rows.filter(l => l[1] !== ' ')
  const stat = await $.process.run(['git', 'diff', '--shortstat', kind === 'git-reset' ? 'HEAD' : '--'], { cwd: dir, timeoutMs: 15000 })
  return {
    summary: lost.length === 0 ? 'discard nothing: no uncommitted changes' : `discard uncommitted changes in ${lost.length} ${lost.length === 1 ? 'file' : 'files'}`,
    lines: lost.slice(0, LIST_MAX).map(l => `${l.slice(0, 2)} ${l.slice(3)}`),
    more: Math.max(0, lost.length - LIST_MAX),
    note: stat.stdout.trim() !== '' ? `${stat.stdout.trim()}. Uncommitted changes can't be recovered.` : 'From git status --porcelain.',
  }
}

async function measurePush($: EngineInterface, args: string[], dir: string): Promise<Report> {
  const positional = args.filter(a => !a.startsWith('-'))
  const remote = positional[0] ?? 'origin'
  const spec = (positional[1] ?? '').replace(/^\+/, '')
  let [source, branch] = spec.includes(':') ? spec.split(':') : [spec, spec]
  branch = (branch ?? '').replace(/^refs\/heads\//, '')
  if (!branch || branch === 'HEAD') {
    const head = await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd: dir, timeoutMs: 10000 })
    branch = head.stdout.trim()
    source = 'HEAD'
  }
  source = source || 'HEAD'
  const ref = `${remote}/${branch}`
  const lease = args.some(a => a.startsWith('--force-with-lease') || a === '--force-if-includes')
  const leaseNote = lease ? ' With --force-with-lease git refuses if the remote moved since your last fetch.' : ''
  const known = await $.process.run(['git', 'rev-parse', '--verify', '--quiet', ref], { cwd: dir, timeoutMs: 10000 })
  if (known.exitCode !== 0) return { summary: `force-push to ${ref}`, lines: [], more: 0, note: `No local copy of ${ref}, so the dropped commits can't be listed. Run git fetch first.${leaseNote}` }
  const log = await $.process.run(['git', 'log', '--oneline', '--no-decorate', `${source}..${ref}`], { cwd: dir, timeoutMs: 15000 })
  const dropped = log.stdout.split('\n').filter(l => l !== '')
  return {
    summary: dropped.length === 0 ? `force-push to ${ref}: drops no commits` : `force-push to ${ref}: drops ${dropped.length} ${dropped.length === 1 ? 'commit' : 'commits'}`,
    lines: dropped.slice(0, LIST_MAX),
    more: Math.max(0, dropped.length - LIST_MAX),
    note: `Commits on ${ref} that ${source} doesn't have, as of the last fetch.${leaseNote}`,
  }
}

/** Holds a risky command behind the dropped-guitar screen until Proceed or Cancel. */
async function holdForDecision($: EngineInterface, signal: AbortSignal, command: string, risk: Risk): Promise<{ kind: 'proceed' } | { kind: 'deny'; reason: string }> {
  const mine: Held = { command, risk, decision: null }
  let opened = false
  let summary = risk.label
  let decision: string | null = null
  // Waiting on the clock spends the hook's budget; past this much of it the hold gives up with a clear word.
  let clockWaits = 0
  const waitOnce = async (): Promise<boolean> => {
    if (await pause($)) return true
    clockWaits += 1
    return clockWaits * POLL_MS < 6000
  }
  try {
    // One hold at a time: a second risky call waits for the first to be answered.
    while (held !== null) {
      if (signal.aborted) return { kind: 'deny', reason: 'Kessoku held this command and did not run it: the turn was interrupted. Do not retry it unless the user asks you to.' }
      if (!(await waitOnce())) {
        mine.decision = 'nosleeper'
        break
      }
    }
    if (mine.decision === null) held = mine
    const sessionCwd = await $.session.cwd()
    if (mine.decision !== null) throw new Error('no way to wait')
    const dir = risk.dir ? await resolveDir($, sessionCwd, risk.dir) : sessionCwd
    const report: Report =
      dir === null
        ? { summary: `${risk.label} in ${risk.dir}`, lines: [], more: 0, note: `Couldn't find the folder ${risk.dir}, so what this would change couldn't be measured.` }
        : await measure($, risk, dir)
    summary = report.summary
    await update($, blast, () => ({ command, label: risk.label, ...report, where: 'pane' as const, isHeld: true }))
    reopenSprites(BLAST)
    const placed = await $.ui.open({ id: BLAST, title: '⚠ Dropped guitar', focus: true, closeOnEscape: true, holdToasts: true, rows: Math.min(32, (opts.characterArt === 'sprites' ? 22 : 16) + report.lines.length + (report.more ? 1 : 0)), columns: 70 })
    opened = true
    if (!placed.isPlaced) await update($, blast, s => (s === null ? s : { ...s, where: 'band' as const }))
    await setMood($, 'panic', 'the guitar is falling!! answer the screen')
    // Someone away from the window is told: the screen waits ten minutes for an answer.
    void notify($, `Blast Radius is holding ${risk.label}: it would ${summary}. Answer the dropped-guitar screen.`)
    const startedAt = await $.clock.now()
    while (mine.decision === null) {
      if (signal.aborted) {
        mine.decision = 'interrupted'
        break
      }
      if ((await $.clock.now()) - startedAt > HOLD_LIMIT_MS) {
        mine.decision = 'timeout'
        break
      }
      if (!(await waitOnce())) {
        mine.decision = 'nosleeper'
        break
      }
    }
  } catch {
    if (mine.decision === null) mine.decision = 'error'
  } finally {
    decision = mine.decision
    // The pane and the state go first, so the next hold never finds the old screen; the lock is released whatever happens.
    try {
      try {
        if (opened) await $.ui.close({ id: BLAST })
      } catch {
        // the pane is already gone
      }
      try {
        await update($, blast, () => null)
      } catch {
        // the state write failed; the pane is closed
      }
    } finally {
      if (held === mine) held = null
    }
    void revertMood($).catch(() => undefined)
  }
  if (decision === 'proceed') {
    toast($, `${MEMBERS.bocchi.faces.hiding} the guitar fell. running: ${risk.label}`)
    return { kind: 'proceed' }
  }
  const why: Record<string, string> = {
    cancel: 'the user caught the guitar (Cancel)',
    closed: 'the user closed the guard screen',
    timeout: 'no answer within 10 minutes',
    interrupted: 'the turn was interrupted',
    nosleeper: 'this host has no sleep or PowerShell to wait with, so the screen could not stay up',
    error: 'the guard hit an error while holding it',
  }
  return {
    kind: 'deny',
    reason: `Kessoku Blast Radius held this command and did not run it: ${why[decision ?? ''] ?? 'no answer was recorded'}. It would have: ${summary}. Do not retry it unless the user asks you to.`,
  }
}

// ---- Filetree ----------------------------------------------------------------

async function walk($: EngineInterface, root: string, rel: string, depth: number, acc: string[]): Promise<string[]> {
  if (depth > 5 || acc.length >= MAX_PATHS) return acc
  let entries
  try {
    entries = await $.fs.list(rel === '' ? root : `${root}/${rel}`)
  } catch {
    return acc
  }
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  for (const en of sorted) {
    if (acc.length >= MAX_PATHS) break
    if (en.name.startsWith('.') && en.name !== '.claude' && en.name !== '.github') continue
    const path = rel === '' ? en.name : `${rel}/${en.name}`
    if (en.kind === 'dir') {
      if (!IGNORED_DIRS.has(en.name)) await walk($, root, path, depth + 1, acc)
    } else if (en.kind === 'file') {
      acc.push(path)
    }
  }
  return acc
}

async function buildTree($: EngineInterface): Promise<void> {
  const root = await $.session.root()
  let paths: string[] = []
  try {
    // -z and no quoting: a name with a space or a non-ASCII letter arrives as the file system spells it.
    const run = await $.process.run(['git', '-c', 'core.quotePath=false', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, timeoutMs: 8000 })
    // Git knows what is ignored; only the folders no one wants to see are filtered here.
    if (run.exitCode === 0) paths = run.stdout.split(/\0|\n/).filter(l => l !== '' && !l.split('/').some(p => ALWAYS_IGNORED.has(p)))
  } catch {
    // not a git repo, or no git: walk instead
  }
  if (paths.length === 0) paths = await walk($, root, '', 0, [])
  const now = await $.clock.now()
  await update($, tree, t => ({ ...t, root, paths: paths.slice(0, MAX_PATHS), builtAt: now }))
}

async function light($: EngineInterface, filePath: string, kind: KessokuLight['kind'], by: KessokuMember): Promise<void> {
  const t = await read($, tree)
  const root = t.root || cwd
  // A file outside the project has no row to light; counting it would only inflate the header.
  if (!isInside(root, filePath)) return
  const path = relPath(root, filePath)
  const now = await $.clock.now()
  await update($, tree, x => {
    const lights = x.lights.filter(l => l.path !== path && isLit(l, now)).slice(-60)
    lights.push({ path, kind, at: now, by })
    const paths = kind !== 'read' && !x.paths.includes(path) ? [...x.paths, path].slice(0, MAX_PATHS) : x.paths
    return { ...x, lights, paths }
  })
  ensureShimmer($)
}

async function commitLights($: EngineInterface, by: KessokuMember): Promise<void> {
  const now = await $.clock.now()
  let lit = 0
  await update($, tree, x => {
    lit = 0
    const lights = x.lights.map(l => {
      if (l.kind === 'edited' || l.kind === 'editing') {
        lit += 1
        return { ...l, kind: 'committed' as const, at: now, by }
      }
      return l
    })
    return { ...x, lights }
  })
  if (lit > 0) toast($, `${MEMBERS.kita.faces.happy} committed! ${lit} ${lit === 1 ? 'file' : 'files'} lit neon green`)
  ensureShimmer($)
}

/**
 * The shimmer: a fast beat only while a file is being edited (the one state
 * that animates), and a slow prune while any light is lit, so an open tree
 * does not redraw the pane five times a second for nothing.
 */
function ensureShimmer($: EngineInterface): void {
  if (shimmerTimer === null) {
    shimmerTimer = $.clock.every(180, () => {
      void shimmer($)
    })
  }
  if (pruneTimer === null) {
    pruneTimer = $.clock.every(5000, () => {
      void prune($)
    })
  }
}

async function shimmer($: EngineInterface): Promise<void> {
  const t = await read($, tree)
  const now = await $.clock.now()
  if (!t.isOpen || !isAnyHot(t.lights, now)) {
    if (shimmerTimer !== null) {
      shimmerTimer.cancel()
      shimmerTimer = null
    }
    return
  }
  await update($, frame, f => f + 1)
}

async function prune($: EngineInterface): Promise<void> {
  const t = await read($, tree)
  const now = await $.clock.now()
  if (t.lights.some(l => !isLit(l, now))) await update($, tree, x => ({ ...x, lights: x.lights.filter(l => isLit(l, now)) }))
  if (t.lights.length === 0 && pruneTimer !== null) {
    pruneTimer.cancel()
    pruneTimer = null
  }
}

async function toggleTree($: EngineInterface, isAsked: boolean): Promise<string> {
  const t = await read($, tree)
  if (t.isOpen && isAsked) {
    await update($, tree, x => ({ ...x, isOpen: false, isBand: false }))
    await $.ui.close({ id: TREE })
    return 'Filetree: lights out.'
  }
  await buildTree($)
  reopenSprites(TREE)
  const placed = await $.ui.open({ id: TREE, title: '♪ Filetree', columns: 46, rows: 20 })
  await update($, tree, x => ({ ...x, isOpen: true, isBand: !placed.isPlaced }))
  ensureShimmer($)
  const built = await read($, tree)
  return `Filetree: ${built.paths.length} files under ${built.root}${placed.isPlaced ? '' : ' (drawn above the prompt: no room for a pane)'}.`
}

// ---- Reflect -----------------------------------------------------------------

async function draftMemo($: EngineInterface, original: string): Promise<void> {
  await update($, memo, () => ({ rule: '', original, at: 0, status: 'drafting' as const, savedTo: '' }))
  let rule = ''
  try {
    const r = await $.model.complete({ model: 'haiku', prompt: rulePrompt(original), maxTokens: 120, effort: 'low', timeoutMs: 20000 })
    rule = r.isAnswered ? cleanRule(r.text) : ''
  } catch {
    rule = ''
  }
  if (rule === '') {
    await update($, memo, () => null)
    await showNextProposal($)
    return
  }
  const now = await $.clock.now()
  await update($, memo, () => ({ rule, original, at: now, status: 'open' as const, savedTo: '' }))
}

/**
 * The memo tool's call: Claude (or a band member, by her act) proposes a rule.
 * Checked, then put on Nijika's card as an open memo with a byline, or queued
 * behind the memo already up; nothing is written until the person presses
 * Save. A refusal says why, and so does a session nobody can answer.
 */
async function proposeRule($: EngineInterface, input: Record<string, unknown>, agentId: string | undefined): Promise<{ result: string } | { deny: string }> {
  if (!opts.reflect) return { deny: 'Kessoku memos are off (the reflect option in /config), so nothing was proposed. Say the rule in your reply if it matters.' }
  const checked = checkRule(input.rule)
  if ('why' in checked) return { deny: `Kessoku memo refused: ${checked.why}. Nothing was proposed.` }
  if (!canDraw()) {
    if ((await $.session.surfaces().catch(() => [])).length === 0) return { deny: 'Kessoku memo: nobody is at a screen to press Save in this session, so nothing was proposed. Say the rule in your reply instead.' }
    hasSurface = true
  }
  const rule = checked.rule
  const why = typeof input.why === 'string' ? input.why.replace(/\s+/g, ' ').trim().slice(0, 300) : ''
  const by: KessokuMember = agentId === undefined ? 'bocchi' : ((await read($, band)).agents.find(a => a.id === agentId)?.member ?? 'bocchi')
  const now = await $.clock.now()
  const isSame = (other: string) => other.toLowerCase() === rule.toLowerCase()
  const shown = await read($, memo)
  if ((shown !== null && shown.status !== 'skipped' && isSame(shown.rule)) || (await read($, proposals)).some(p => isSame(p.rule))) return { result: memoAnswer('duplicate') }
  const card: KessokuMemo = { rule, original: why, at: now, status: 'open', savedTo: '', by }
  const up = await update($, memo, x => (x === null ? card : x))
  if (up !== null && up.rule === card.rule && up.at === card.at && up.by === card.by) return { result: memoAnswer('open') }
  if ((await read($, proposals)).length >= MEMO_QUEUE_MAX) return { deny: `Kessoku memo: ${MEMO_QUEUE_MAX} proposals already wait behind the memo on screen, so this one was not queued. Let the user catch up first.` }
  const queue = await update($, proposals, x => [...x, { rule, why, by, at: now }])
  return { result: memoAnswer('queued', queue.length) }
}

/** The oldest queued proposal onto Nijika's card, once the card is free. */
async function showNextProposal($: EngineInterface): Promise<void> {
  if ((await read($, memo)) !== null) return
  const next = (await read($, proposals))[0]
  if (next === undefined) return
  await update($, proposals, x => x.filter(p => !(p.at === next.at && p.rule === next.rule)))
  const now = await $.clock.now()
  const card: KessokuMemo = { rule: next.rule, original: next.why, at: now, status: 'open', savedTo: '', by: next.by }
  const up = await update($, memo, x => (x === null ? card : x))
  // A memo got there first: the proposal goes back to the head of the queue.
  if (up === null || up.rule !== card.rule || up.at !== card.at) await update($, proposals, x => [next, ...x])
}

async function saveRule($: EngineInterface, where: 'project' | 'global'): Promise<void> {
  const m = await read($, memo)
  if (m === null || m.rule === '') return
  let path: string
  if (where === 'global') {
    const dir = await configDir($)
    if (dir === null) {
      toast($, `${MEMBERS.nijika.faces.panic} Nijika could not find your Claude config folder (no HOME or USERPROFILE)`)
      return
    }
    path = `${dir}/CLAUDE.md`
  } else {
    path = `${await $.session.root()}/CLAUDE.md`
  }
  try {
    let existing = ''
    try {
      if (await $.fs.exists(path)) existing = await $.fs.read(path)
    } catch {
      existing = ''
    }
    await $.fs.write(path, appendRule(existing, m.rule))
  } catch (error) {
    toast($, `${MEMBERS.nijika.faces.panic} Nijika could not write ${path}: ${String((error as { message?: string })?.message ?? error).slice(0, 120)}`)
    return
  }
  // Marked saved only while the card still holds the rule just written: a memo that took it during the write stays open.
  const isWritten = (x: KessokuMemo | null): x is KessokuMemo => x !== null && x.at === m.at && x.rule === m.rule
  const saved = await update($, memo, x => (isWritten(x) ? { ...x, status: 'saved' as const, savedTo: path } : x))
  toast($, `${MEMBERS.nijika.faces.happy} Nijika wrote it down: ${path}`)
  if (isWritten(saved) && saved.status === 'saved') scheduleMemoClear($, saved, 6000)
}

async function skipRule($: EngineInterface): Promise<void> {
  const skipped = await update($, memo, x => (x === null ? x : { ...x, status: 'skipped' as const }))
  if (skipped !== null) scheduleMemoClear($, skipped, 10)
}

/**
 * Takes an answered memo off Nijika's card after `ms`, then brings the next
 * proposal up. Only that memo, still as it was answered: a memo that took the
 * card since (a new correction's, or another conversation's, the timer being
 * module state that outlives a /clear or a resume) stays up.
 */
function scheduleMemoClear($: EngineInterface, answered: KessokuMemo, ms: number): void {
  if (memoTimer !== null) memoTimer.cancel()
  memoTimer = $.clock.after(ms, () => {
    memoTimer = null
    void (async () => {
      await update($, memo, x => (x !== null && x.at === answered.at && x.rule === answered.rule && x.status === answered.status ? null : x))
      await showNextProposal($)
    })().catch(() => undefined)
  })
}

// ---- Replay Theater ----------------------------------------------------------

type Patch = { oldStart: number; oldLines: number; newStart: number; newLines: number; lines: string[] }

function readPatch(result: unknown): Patch[] | null {
  if (typeof result !== 'object' || result === null) return null
  const patch = (result as { structuredPatch?: unknown }).structuredPatch
  if (!Array.isArray(patch)) return null
  return patch.filter((h): h is Patch => typeof h === 'object' && h !== null && Array.isArray((h as Patch).lines))
}

/** The edit as the tool reported it (real line numbers from its structuredPatch), or diffed from the input when the result carries none. */
function tracksFor(tool: string, input: Record<string, unknown>, result: unknown, by: KessokuMember): KessokuTrack[] {
  const filePath = readField(input, 'file_path') || readField(input, 'notebook_path')
  const file = relPath(cwd, filePath) || '(unknown file)'
  const out = (typeof result === 'object' && result !== null ? result : {}) as { type?: unknown; gitDiff?: { additions?: number; deletions?: number } }
  const patch = readPatch(result)
  let d: Unified
  if (patch !== null && patch.length > 0) d = patchToUnified(patch)
  else if (tool === 'Edit') d = unifiedDiff(readField(input, 'old_string'), readField(input, 'new_string'))
  else if (tool === 'Write') d = unifiedDiff('', readField(input, 'content'))
  else if (tool === 'NotebookEdit') d = unifiedDiff('', readField(input, 'new_source'))
  else return []
  if (out.gitDiff && typeof out.gitDiff.additions === 'number' && typeof out.gitDiff.deletions === 'number') {
    d = { ...d, add: out.gitDiff.additions, del: out.gitDiff.deletions }
  }
  let note = ''
  if (tool === 'Write') note = out.type === 'create' ? 'new file' : 'rewrite'
  else if (tool === 'Edit' && input.replace_all === true) note = 'replace all'
  else if (tool === 'NotebookEdit') note = `cell ${readField(input, 'cell_id') || '?'}`
  if (d.isApproximate) note = note ? `${note} · large rewrite` : 'large rewrite'
  // The setlist keeps what the viewer can show (the state is read on every strip draw), cut on hunk lines so it still parses as a diff.
  const hunks = cutHunks(d.hunks, MAX_TRACK_LINES).text
  return [{ tool, file, hunks, add: d.add, del: d.del, note, by }]
}

async function openReplay($: EngineInterface): Promise<boolean> {
  const r = await read($, replay)
  if (r.tracks.length === 0) return false
  await update($, replay, x => ({ ...x, index: 0, isOpen: true, inBand: false }))
  reopenSprites(REPLAY)
  const placed = await $.ui.open({ id: REPLAY, title: '♪ Replay Theater', focus: true, closeOnEscape: true, rows: Math.min(MAX_DIFF_LINES + 10, 26), columns: 72 })
  await update($, replay, x => ({ ...x, inBand: !placed.isPlaced }))
  return true
}

async function closeReplay($: EngineInterface): Promise<void> {
  await update($, replay, x => ({ ...x, isOpen: false, inBand: false }))
  // Always by id: a pane that waited undrawn in a narrow terminal is open to the engine too.
  await $.ui.close({ id: REPLAY }).catch(() => undefined)
}

/**
 * Replay's quiet second door: `/replay 3 tracks` as the prompt box's dim
 * suggestion, Tab to take, after a turn that put edits on the setlist. The
 * engine shows it only in an empty box between turns; `/replay` ignores the
 * words after it, so the taken suggestion runs as the command.
 */
function suggestReplay($: EngineInterface, tracks: number): void {
  if (!features.suggest) return
  void (async () => {
    try {
      await $.prompt.suggest({ text: `/replay ${tracks} ${tracks === 1 ? 'track' : 'tracks'}` })
    } catch (error) {
      if (isMissingApi(error)) features.suggest = false
    }
  })()
}

// ---- The panel ---------------------------------------------------------------

async function togglePanel($: EngineInterface, isAsked: boolean): Promise<string> {
  const u = await read($, ui)
  if (u.isPanelOpen && isAsked) {
    await update($, ui, x => ({ ...x, isPanelOpen: false, panelWhere: 'none' as const }))
    await $.ui.close({ id: PANEL })
    return 'Kessoku Band: the panel left the stage.'
  }
  reopenSprites(PANEL)
  const placed = await $.ui.open({ id: PANEL, title: '♪ Kessoku Band', ...panelSize() })
  await update($, ui, x => ({ ...x, isPanelOpen: true, panelWhere: placed.isPlaced ? ('pane' as const) : ('band' as const) }))
  await refreshUsage($).catch(() => undefined)
  return placed.isPlaced ? 'Kessoku Band: the panel is on stage.' : 'Kessoku Band: no room for a pane here, so the panel is drawn above the prompt.'
}

// ---- Sprites -----------------------------------------------------------------

/**
 * What a sprite drawing is: the sprites on one pixel canvas, how a terminal
 * packs them into cells, how large a remote surface shows each pixel, the
 * background a terminal paints under transparent pixels, and the words that
 * stand for it where no picture can be drawn.
 */
type SpriteSpec = { key: string; parts: SpritePart[]; w: number; h: number; mode: CellMode; scale: number; bg?: string; alt: string }

/** One sprite at the canvas origin. */
function oneSprite(key: string, id: string, mode: CellMode, scale: number, alt: string, bgColor?: string): SpriteSpec {
  const anim = animOf(id)
  return { key, parts: [{ id, x: 0, y: 0 }], w: anim?.w ?? 0, h: anim?.h ?? 0, mode, scale, bg: bgColor, alt }
}

/** A member in a mood: her whole figure (96x96), the window over her head (32x32), or her hand-drawn mini head (16x16). */
function memberSprite(key: string, member: KessokuMember, mood: KessokuMood, view: MemberView, mode: CellMode, scale: number, bgColor?: string): SpriteSpec {
  return oneSprite(key, spriteId(member, mood, view), mode, scale, `${MEMBERS[member].name}, ${mood}`, bgColor)
}

/** What a slime's picture says: whose act it is and what it is doing. */
function slimeAlt(a: KessokuAgent): string {
  return `${MEMBERS[a.member].name}'s act, ${slimeState(a.status)}`
}

/**
 * One act's slime, keyed by the act's id: the slime (36x24) one CSS pixel a
 * pixel on a remote surface, its mini (18x12) in quadrants in a terminal
 * (9x3 cells).
 */
function actSprite(a: KessokuAgent, isTerminal: boolean, bgColor?: string): SpriteSpec {
  const view: SlimeView = isTerminal ? 'slime-mini' : 'slime'
  return oneSprite(`slime-${a.id}`, spriteId(a.member, slimeState(a.status), view), 'quad', 1, slimeAlt(a), bgColor)
}

/**
 * The acts the strip's row of slimes shows: every live act, and every act that
 * ended less than SLIME_TAIL_MS ago (asleep), by the band's order and then
 * when each came on stage; the live ones first when there are more than
 * STRIP_SLIMES, the rest only counted. `nextTail` is when the first of the
 * sleeping ones shown is due to leave (0 when none is).
 */
function stripActs(b: KessokuBand, now: number): { shown: KessokuAgent[]; more: number; nextTail: number } {
  const order: readonly KessokuMember[] = ['bocchi', 'nijika', 'ryo', 'kita']
  const byStage = (x: KessokuAgent, y: KessokuAgent) => order.indexOf(x.member) - order.indexOf(y.member) || x.startedAt - y.startedAt
  const acts = b.agents.filter(a => a.id !== 'main')
  const live = acts.filter(isLive).sort(byStage)
  const resting = acts.filter(a => !isLive(a) && a.endedAt !== null && now - a.endedAt < SLIME_TAIL_MS).sort(byStage)
  const all = [...live, ...resting]
  const shown = all.slice(0, STRIP_SLIMES)
  const leaving = shown.filter(a => !isLive(a)).map(a => (a.endedAt ?? now) + SLIME_TAIL_MS)
  return { shown: shown.sort(byStage), more: all.length - shown.length, nextTail: leaving.length > 0 ? Math.min(...leaving) : 0 }
}

/**
 * The strip's row of slimes as one picture, two pixels apart: the slimes on a
 * remote surface, their minis in quadrants in a terminal (9x3 cells each).
 */
function stripSlimeSpec(acts: readonly KessokuAgent[], more: number, isTerminal: boolean): SpriteSpec {
  const view: SlimeView = isTerminal ? 'slime-mini' : 'slime'
  const { w, h } = viewSize(view)
  const pitch = w + 2
  const parts = acts.map((a, i) => ({ id: spriteId(a.member, slimeState(a.status), view), x: i * pitch, y: 0 }))
  const alt = `Slimes on stage: ${acts.map(slimeAlt).join('; ')}${more > 0 ? `; and ${more} more` : ''}`
  return { key: 'strip-slimes', parts, w: Math.max(0, acts.length * pitch - 2), h, mode: 'quad', scale: 1, bg: bg(), alt }
}

/** The acts on stage in words: `4 slimes on stage (3 playing, 1 waiting)`, or `0 on stage` (and without slimes, as before, `n on stage`). */
function stageWords(b: KessokuBand): string {
  const live = b.agents.filter(a => a.id !== 'main' && isLive(a))
  if (opts.characterArt !== 'sprites' || live.length === 0) return `${live.length} on stage`
  const playing = live.filter(a => a.status === 'running').length
  return `${live.length} ${live.length === 1 ? 'slime' : 'slimes'} on stage (${playing} playing, ${live.length - playing} waiting)`
}

/**
 * The redraw that lets a sleeping act leave the strip once its half minute is
 * up, when nothing else changes then: one timer, for the first act due.
 */
function scheduleTail($: EngineInterface, at: number, now: number): void {
  if (at <= 0 || (tailTimer !== null && tailTimerAt > now && tailTimerAt <= at)) return
  if (tailTimer !== null) tailTimer.cancel()
  tailTimerAt = at
  tailTimer = $.clock.after(Math.max(1, at - now + 1), () => {
    tailTimer = null
    tailTimerAt = 0
    $.ui.invalidate('ui.render')
  })
}

/**
 * A terminal draws a head as the member's hand-drawn mini (16x16): in half
 * blocks (16x8 cells, every color kept) where there is room, in quadrants
 * (8x4) in the small spots. A remote surface draws the portrait, one CSS
 * pixel a pixel.
 */
type HeadMode = CellMode

/** The cells the mini takes in a head mode. */
function headCells(mode: HeadMode): { columns: number; rows: number } {
  const { w, h } = viewSize('mini')
  return cellsFor(w, h, mode)
}

/** The cells an act's slime takes in a terminal: its mini in quadrants (9x3). */
function slimeCells(): { columns: number; rows: number } {
  const { w, h } = viewSize('slime-mini')
  return cellsFor(w, h, 'quad')
}

/** A member's head as `e`'s surface draws a small one: the mini in quadrants on a terminal (8x4 cells), the portrait elsewhere (32 CSS pixels). */
function headSprite(key: string, e: RenderInput, member: KessokuMember, mood: KessokuMood, bgColor?: string): SpriteSpec {
  return memberSprite(key, member, mood, e.surface === 'terminal' ? 'mini' : 'portrait', 'quad', 1, bgColor)
}

/**
 * The sprite as the surface `e` draws pictures: a Raster on the terminal
 * (its frame for now, then repainted by the sprite clock), an animated Svg on
 * the desktop, the editor and the phone, in a Box under the Raster's key (an
 * Svg carries none), so every picture is found by its key on every surface.
 * Null where art is off, the frames are missing, or the surface has neither,
 * so the caller draws the face as text.
 */
function drawSprite($: EngineInterface, e: RenderInput, spec: SpriteSpec, now: number): Draw | null {
  if (opts.characterArt !== 'sprites' || spec.w === 0 || spec.parts.every(p => animOf(p.id) === undefined)) return null
  if (e.surface === 'terminal') {
    const { Raster } = $.ui.resolve(e)
    const { cells, columns, rows } = encodeCells(composite(spec.parts, spec.w, spec.h, now), spec.w, spec.h, spec.mode, spec.bg, isLightTheme)
    // A sprite that never changes needs no clock; neither does one of a pane that has closed.
    if (isAnimated(spec.parts) && !closedSites.has(e.requestId)) {
      const gen = spriteSites.get(e.requestId) ?? 0
      liveSprites.set(`${e.requestId}\u0000${spec.key}`, { requestId: e.requestId, key: spec.key, parts: spec.parts, w: spec.w, h: spec.h, mode: spec.mode, bg: spec.bg, sig: frameSignature(spec.parts, now), gen, drawnAt: now, refusedAt: 0, triedAt: 0 })
      ensureSpriteClock($)
    }
    return <Raster key={spec.key} columns={columns} rows={rows} cells={cells} />
  }
  const table = $.ui.resolve(e)
  if (!('Svg' in table)) return null
  const { Box, Svg } = table
  return (
    <Box key={spec.key}>
      <Svg source={spritesSvg(spec.parts, spec.w, spec.h, spec.scale)} alt={spec.alt} width={spec.w * spec.scale} height={spec.h * spec.scale} isInteractive />
    </Box>
  )
}

/** The clock that walks the terminal's sprites through their frames, while any is on screen. */
function ensureSpriteClock($: EngineInterface): void {
  if (spriteTimer !== null) return
  spriteTimer = $.clock.every(SPRITE_TICK_MS, () => {
    void spriteTick($)
  })
}

/**
 * A terminal site is drawing afresh: the sprites its last drawing held and
 * this one leaves out are let go at the next beat. Only the terminal holds
 * Rasters, so a desktop or phone drawing of the same pane counts for nothing.
 */
function beginSprites(e: RenderInput): void {
  if (e.surface !== 'terminal') return
  spriteSites.set(e.requestId, (spriteSites.get(e.requestId) ?? 0) + 1)
}

/** A pane closed: its sprites go with it, and a drawing still on its way when it closed registers none. */
function dropSprites(requestId: string): void {
  for (const [id, s] of liveSprites) if (s.requestId === requestId) liveSprites.delete(id)
  spriteSites.delete(requestId)
  closedSites.add(requestId)
}

/** A pane is opened (again): its drawings may hold sprites. */
function reopenSprites(requestId: string): void {
  closedSites.delete(requestId)
}

function isLastingSite(requestId: string): boolean {
  return requestId === PANEL || requestId === TREE || requestId === BLAST || requestId === REPLAY || requestId === bandRequestId
}

/**
 * One beat: every Raster whose frame changed is repainted in place with
 * `$.ui.blit`, no render pass. A refusal is taken as "not on screen right
 * now" (a pane behind another's tab, the band collapsed, a tree not mounted
 * yet): the sprite is tried again every second and picks its animation up
 * when the surface takes it. A sprite goes when its site redraws without it,
 * its pane closes, or (a passing site's) after a minute of refusals.
 */
async function spriteTick($: EngineInterface): Promise<void> {
  if (liveSprites.size === 0) {
    if (spriteTimer !== null) {
      spriteTimer.cancel()
      spriteTimer = null
    }
    return
  }
  const now = await $.clock.now()
  for (const [id, s] of [...liveSprites]) {
    // Replaced by a newer drawing since the snapshot: that entry has its own turn.
    if (liveSprites.get(id) !== s) continue
    if (s.gen < (spriteSites.get(s.requestId) ?? 0)) {
      liveSprites.delete(id)
      continue
    }
    const sig = frameSignature(s.parts, now)
    // A fresh drawing's first refusals are likely the surface still mounting it: retry at once for a second.
    const retryMs = now - s.drawnAt < SPRITE_RETRY_MS ? SPRITE_TICK_MS : SPRITE_RETRY_MS
    if (s.refusedAt > 0 ? now - s.triedAt < retryMs : sig === s.sig) continue
    const { cells, columns, rows } = encodeCells(composite(s.parts, s.w, s.h, now), s.w, s.h, s.mode, s.bg, isLightTheme)
    s.triedAt = now
    let isTaken = false
    try {
      isTaken = (await $.ui.blit({ requestId: s.requestId, key: s.key, cells, columns, rows })).deny === undefined
    } catch {
      isTaken = false
    }
    // Redrawn while the repaint was on its way: the newer entry stands.
    if (liveSprites.get(id) !== s) continue
    if (isTaken) {
      s.sig = sig
      s.refusedAt = 0
      continue
    }
    if (s.refusedAt === 0) s.refusedAt = now
    if (!isLastingSite(s.requestId) && now - s.refusedAt > SPRITE_GIVE_UP_MS) liveSprites.delete(id)
  }
}

// ---- Drawing -----------------------------------------------------------------

function cardColor(mood: KessokuMood, base: string): string {
  if (mood === 'panic') return 'error'
  if (mood === 'melting') return 'inactive'
  return base
}

/** The panel's size when it is opened: room for the sprites beside the cards' text when art is on. */
function panelSize(): { columns: number; rows: number } {
  return opts.characterArt === 'sprites' ? { columns: 64, rows: 28 } : { columns: 56, rows: 18 }
}

/**
 * The rows a card's text takes: its header, Bocchi's two lines, a subagent's two (one above the prompt), the more
 * and idle lines. `actRows` is what a subagent's slime takes beside its lines where one is drawn (its rows when
 * taller than the lines).
 */
function cardTextRows(b: KessokuBand, member: KessokuMember, compact: boolean, actRows = 0): number {
  const mine = b.agents.filter(a => a.member === member && a.id !== 'main').length
  const shown = Math.min(mine, compact ? 2 : 4)
  return 1 + (member === 'bocchi' ? 2 : 0) + shown * Math.max(compact ? 1 : 2, actRows) + (mine > shown ? 1 : 0) + (member !== 'bocchi' && mine === 0 ? 1 : 0)
}

/**
 * How a terminal's panel cards draw the heads (the minis): in half blocks
 * (16x8 cells) where every card that tall fits the room with a readable
 * column of text beside it, in quadrants (8x4) where they fit (or where the
 * cards scroll anyway, which dropping the heads would not stop), not at all
 * where even the quadrants would squeeze the text or add the scroll.
 * `cardRows` is each drawn card's text rows, `fixedRows` the panel's own
 * lines around them; `tallRows`, where given, the cards' rows in the tall
 * layout, whose acts each have their slime beside their lines.
 */
function panelHead(bodyColumns: number, bodyRows: number, compact: boolean, cardRows: readonly number[], fixedRows: number, tallRows: readonly number[] = cardRows): HeadMode | null {
  // The panel's own padding, then each card's border and padding.
  const inner = bodyColumns - (compact ? 0 : 2) - 4
  const textBeside = (mode: HeadMode) => inner - headCells(mode).columns - 1
  const height = (spriteRows: number, rows: readonly number[] = cardRows) => fixedRows + rows.reduce((n, r) => n + 2 + Math.max(r, spriteRows), 0)
  if (!compact && textBeside('half') >= 34 && height(headCells('half').rows, tallRows) <= bodyRows) return 'half'
  if (textBeside('quad') >= 24 && (height(headCells('quad').rows) <= bodyRows || height(0) > bodyRows)) return 'quad'
  return null
}

function drawPanel($: EngineInterface, e: Site, b: KessokuBand, c: KessokuCache, now: number, compact: boolean): Draw {
  const { Box, Text, Button } = $.ui.resolve(e)
  const width = Math.max(30, e.props.bodyColumns - 2)
  const members: KessokuMember[] = ['bocchi', 'nijika', 'ryo', 'kita']
  const onStage = b.agents.filter(a => a.id !== 'main' && isLive(a)).length
  const note = noteAt(now)
  const main = b.agents.find(a => a.id === 'main') ?? mainAgent()
  // Above the prompt the band is short: idle members step aside.
  const hasCard = (member: KessokuMember) => !compact || member === 'bocchi' || b.agents.some(a => a.member === member && a.id !== 'main')
  // The title, the ctx line and the footer, the plan line and the last wrong note when they show.
  const fixedRows = 3 + (b.rateLimitPercent > 0 ? 1 : 0) + (b.lastError ? 1 : 0)
  const cardRows = members.filter(hasCard).map(member => cardTextRows(b, member, compact))
  // Each act is drawn as her slime (character art on): in a terminal's tall layout its mini in quadrants beside
  // the act's two lines, three rows; where the cards are shorter, one glyph at the line's head.
  const slimes = opts.characterArt === 'sprites'
  const tallRows = members.filter(hasCard).map(member => cardTextRows(b, member, compact, slimes ? slimeCells().rows : 0))
  const head = e.surface === 'terminal' ? panelHead(e.props.bodyColumns, e.props.scroll.bodyRows, compact, cardRows, fixedRows, tallRows) : null

  const memberBox = (member: KessokuMember) => {
    const m = MEMBERS[member]
    const mood = memberMood(b, member, now)
    const color = cardColor(mood, m.color)
    const mine = b.agents.filter(a => a.member === member && a.id !== 'main').sort((x, y) => y.startedAt - x.startedAt)
    if (!hasCard(member)) return null
    // Her sprite beside the card: on a remote surface her whole figure (her portrait above the prompt), one CSS
    // pixel a pixel; in a terminal her mini, in half blocks or quadrants.
    const spec =
      e.surface !== 'terminal'
        ? memberSprite(`sprite-${member}`, member, mood, compact ? 'portrait' : 'full', 'quad', 1)
        : head === null
          ? null
          : memberSprite(`sprite-${member}`, member, mood, 'mini', head, 1, bg(true))
    const sprite = spec === null ? null : drawSprite($, e, spec, now)
    // The text column beside a terminal's sprite: the card's border and padding, the sprite, the gap.
    const textCols = width - 4 - (sprite !== null && e.surface === 'terminal' && head !== null ? headCells(head).columns + 1 : 0)
    const rows: Draw[] = []
    if (member === 'bocchi') {
      rows.push(
        <Text key="main-task" wrap="truncate-end">
          <Text color="text">{m.lines[mood]}</Text>
          {b.mainTask ? <Text dimColor> · {b.mainTask}</Text> : null}
        </Text>,
      )
      // The figures that matter first, so a narrow column cuts the token counts, never the cost.
      rows.push(
        <Text key="main-stats" dimColor wrap="truncate-end">
          ctx {b.contextPercent}% · ≈{fmtUsd(main.cost)}
          {main.startedAt ? ` · ${fmtDuration(now - main.startedAt)}` : ''} · in {fmtTokens(main.usage.input + main.usage.cacheRead + main.usage.cacheWrite)} · out {fmtTokens(main.usage.output)}
        </Text>,
      )
    }
    const shown = compact ? mine.slice(0, 2) : mine.slice(0, 4)
    for (const a of shown) {
      const live = isLive(a)
      const mark = live ? note : a.isError ? '✖' : a.status === 'killed' ? '◌' : '✓'
      const age = fmtDuration((a.endedAt ?? now) - a.startedAt)
      // The act's slime at the head of its row: a picture on a remote surface, and in a terminal where the cards are
      // tall (the heads in half blocks); elsewhere in a terminal her color as one glyph, so no card grows for it.
      const state = slimeState(a.status)
      const picture = slimes && (e.surface !== 'terminal' || head === 'half') ? drawSprite($, e, actSprite(a, e.surface === 'terminal', bg(true)), now) : null
      const glyph = slimes && picture === null && e.surface === 'terminal'
      const beside = picture !== null && e.surface === 'terminal' ? slimeCells().columns + 1 : glyph ? 2 : 0
      // The description takes what the slime, the mark, the status and the age leave.
      const descMax = sprite === null ? Math.max(10, width - 30 - beside) : Math.max(10, textCols - beside - 2 - textWidth(` ${a.status} ${age}`))
      const line = (
        <Text key={`a-${a.id}`} wrap="truncate-end">
          {glyph ? (
            <Text color={m.color} bold={state === 'active'} dimColor={state === 'asleep'}>
              {'● '}
            </Text>
          ) : null}
          <Text color={live ? m.color : a.isError ? 'error' : 'inactive'} bold={live}>
            {mark} {a.description.slice(0, descMax)}
          </Text>
          <Text dimColor> {a.status} {age}</Text>
        </Text>
      )
      // The numbers before the task name: a cut takes the end of the name, never the cost.
      const stats = compact ? null : (
        <Text key={`s-${a.id}`} dimColor wrap="truncate-end">
          {'   '}ctx {b.window > 0 ? Math.round((a.context / b.window) * 100) : 0}% · {fmtTokens(a.usage.input + a.usage.cacheRead + a.usage.cacheWrite + a.usage.output)} · ≈{fmtUsd(a.cost)} · {a.task || a.type}
        </Text>
      )
      if (picture === null) {
        rows.push(line)
        if (stats !== null) rows.push(stats)
        continue
      }
      rows.push(
        <Box key={`act-${a.id}`} flexDirection="row" gap={1}>
          {picture}
          <Box flexDirection="column" flexGrow={1} flexShrink={1}>
            {line}
            {stats}
          </Box>
        </Box>,
      )
    }
    if (mine.length > shown.length) rows.push(<Text key="more" dimColor>{'   '}+ {mine.length - shown.length} more</Text>)
    if (member !== 'bocchi' && mine.length === 0) rows.push(<Text key="idle" dimColor wrap="truncate-end">no subagent on stage · {m.lines.anxious}</Text>)
    // A chip on the name line counting her slimes on stage.
    const onHerStage = mine.filter(isLive).length
    const chip =
      slimes && onHerStage > 0
        ? [
            ' ',
            <Text key={`chip-${member}`} color={PALETTE.charcoal} backgroundColor={m.color} bold>
              {` ${onHerStage} on stage `}
            </Text>,
          ]
        : null
    if (sprite === null) {
      return (
        <Box key={`card-${member}`} flexDirection="column" borderStyle={compact ? 'single' : 'round'} borderColor={color} borderDimColor={mood === 'anxious'} paddingX={1} backgroundColor={bg(true)}>
          <Text wrap="truncate-end">
            <Text color={color} bold>{padFace(m.faces[mood])} {m.name}</Text>
            {chip}
            <Text dimColor> · {m.instrument} · {m.role}</Text>
          </Text>
          {rows}
        </Box>
      )
    }
    return (
      <Box key={`card-${member}`} flexDirection="row" gap={1} borderStyle={compact ? 'single' : 'round'} borderColor={color} borderDimColor={mood === 'anxious'} paddingX={1} backgroundColor={bg(true)}>
        {sprite}
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          <Text wrap="truncate-end">
            <Text color={color} bold>{m.name}</Text>
            <Text color={color}> {mood}</Text>
            {chip}
            <Text dimColor> · {m.instrument} · {m.role}</Text>
          </Text>
          {rows}
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" backgroundColor={bg()} paddingX={compact ? 0 : 1}>
      <Box flexDirection="row" justifyContent="space-between">
        <Text color={opts.accent} bold>♪ KESSOKU BAND {note}</Text>
        <Text color={b.isWorking ? PALETTE.hotPink : 'inactive'}>{b.isWorking ? '● live' : '○ idle'}</Text>
      </Box>
      <Text dimColor wrap="truncate-end">
        ctx <Text color={b.contextPercent >= 85 ? 'error' : opts.accent}>{meter(b.contextPercent, 10)}</Text> {b.contextPercent}% · session {fmtUsd(b.sessionUsd)} · {onStage} on stage · {warmth(c, now)}
      </Text>
      {b.rateLimitPercent > 0 ? (
        <Text dimColor wrap="truncate-end">
          plan <Text color={b.rateLimitPercent >= 80 ? 'warning' : opts.accent}>{meter(b.rateLimitPercent, 10)}</Text> {b.rateLimitPercent}% of the fullest window
        </Text>
      ) : null}
      {members.map(memberBox)}
      {b.lastError ? <Text color="error" wrap="truncate-end">✖ last wrong note: {b.lastError}</Text> : null}
      {compact ? (
        <Box flexDirection="row" gap={2}>
          <Button key="panel-hide" label="Hide" hotkey="h" plain dimColor onPress={() => void update($, ui, x => ({ ...x, isPanelOpen: false, panelWhere: 'none' as const }))} />
          <Text dimColor>/kessoku toggles · estimates from a price table, not your bill</Text>
        </Box>
      ) : (
        <Text dimColor>cost ≈ list prices × tokens, not your bill · /kessoku toggles</Text>
      )}
    </Box>
  )
}

/**
 * The four heads side by side, two pixels apart: the strip's picture. A
 * terminal draws the minis in quadrants (35x4 cells for four), a remote
 * surface the portraits, one CSS pixel a pixel.
 */
function stripSpec(b: KessokuBand, members: readonly KessokuMember[], now: number, isTerminal: boolean): SpriteSpec {
  const view: MemberView = isTerminal ? 'mini' : 'portrait'
  const { w, h } = viewSize(view)
  const pitch = w + 2
  const parts = members.map((member, i) => ({ id: spriteId(member, memberMood(b, member, now), view), x: i * pitch, y: 0 }))
  const names = members.map(member => `${MEMBERS[member].name}, ${memberMood(b, member, now)}`).join('; ')
  return { key: 'strip-sprites', parts, w: members.length * pitch - 2, h, mode: 'quad', scale: 1, bg: bg(), alt: `Kessoku Band: ${names}` }
}

/**
 * The strip above the prompt. With art on and the rows to spare, the heads are
 * one picture with the band's line and the buttons beside it, and the acts on
 * stage follow as a row of slimes (`stripActs`): beside the heads on a remote
 * surface, under the minis in a terminal where `slimeRoom` says the band has
 * the rows for them, as many as the width holds up to STRIP_SLIMES, then
 * `+n`. Otherwise the one-line strip.
 */
function drawStrip($: EngineInterface, e: RenderInput<'AbovePrompt'>, b: KessokuBand, c: KessokuCache, r: KessokuReplay, now: number, isRoomy: boolean, slimeRoom: boolean): Draw {
  const { Box, Text, Button } = $.ui.resolve(e)
  const members: KessokuMember[] = ['bocchi', 'nijika', 'ryo', 'kita']
  const isTerminal = e.surface === 'terminal'
  const narrow = e.props.bodyColumns < 90
  const words = stageWords(b)
  // With art on and the rows to spare: the heads as one picture, the band's line and the buttons beside it
  // (a narrow terminal keeps Bocchi alone); otherwise the one-line strip below.
  const sprite = isRoomy ? drawSprite($, e, stripSpec(b, narrow && isTerminal ? ['bocchi'] : members, now, isTerminal), now) : null
  if (sprite !== null) {
    const { shown, more, nextTail } = stripActs(b, now)
    // In a terminal each slime is 10 columns with its gap, and `+n` wants 4 beside them.
    const fits = isTerminal ? Math.max(0, Math.floor((e.props.bodyColumns - 5) / (slimeCells().columns + 1))) : STRIP_SLIMES
    const acts = shown.slice(0, fits)
    const extra = more + shown.length - acts.length
    const slimePicture = acts.length > 0 && (!isTerminal || slimeRoom) ? drawSprite($, e, stripSlimeSpec(acts, extra, isTerminal), now) : null
    if (slimePicture !== null) scheduleTail($, nextTail, now)
    const slimeRow =
      slimePicture === null ? null : (
        <Box flexDirection="row" gap={1} alignItems="flex-end">
          {slimePicture}
          {extra > 0 ? <Text dimColor>{`+${extra}`}</Text> : null}
        </Box>
      )
    const text = (
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        <Text wrap="truncate-end">
          <Text color={opts.accent} bold>♪ </Text>
          {members.map((member, i) => {
            const mood = memberMood(b, member, now)
            return (
              <Text key={`strip-name-${member}`} color={cardColor(mood, MEMBERS[member].color)} bold={mood === 'focused'}>
                {i > 0 ? ' · ' : ''}
                {MEMBERS[member].name}
              </Text>
            )
          })}
        </Text>
        <Text dimColor wrap="truncate-end">
          {words} · {fmtUsd(b.sessionUsd)} · {warmth(c, now)}
        </Text>
        <Box flexDirection="row" gap={2}>
          {r.tracks.length > 0 && !r.isOpen ? <Button key="strip-replay" label={`Replay ${r.tracks.length}`} hotkey="r" plain onPress={() => void openReplay($)} /> : null}
          <Button key="strip-panel" label="Panel" hotkey="k" plain onPress={() => void togglePanel($, true)} />
          <Button key="strip-hide" label="Hide" hotkey="h" plain dimColor onPress={() => void update($, ui, x => ({ ...x, isStripHidden: true }))} />
        </Box>
      </Box>
    )
    if (isTerminal && slimeRow !== null) {
      return (
        <Box flexDirection="column" paddingX={1} backgroundColor={bg()}>
          <Box flexDirection="row" gap={1}>
            {sprite}
            {text}
          </Box>
          {slimeRow}
        </Box>
      )
    }
    return (
      <Box flexDirection="row" gap={1} paddingX={1} backgroundColor={bg()}>
        {sprite}
        {slimeRow}
        {text}
      </Box>
    )
  }
  return (
    <Box flexDirection="row" gap={1} paddingX={1} backgroundColor={bg()}>
      <Text color={opts.accent} bold>♪</Text>
      {members.map(member => {
        const mood = memberMood(b, member, now)
        return (
          <Text key={`strip-${member}`} color={cardColor(mood, MEMBERS[member].color)} bold={mood === 'focused'}>
            {narrow ? MEMBERS[member].faces[mood] : `${padFace(MEMBERS[member].faces[mood])} ${MEMBERS[member].name}`}
          </Text>
        )
      })}
      <Box flexShrink={1} minWidth={8}>
        <Text dimColor wrap="truncate-end">
          │ {words} · {fmtUsd(b.sessionUsd)} · {warmth(c, now)}
        </Text>
      </Box>
      {r.tracks.length > 0 && !r.isOpen ? (
        <Button key="strip-replay" label={`Replay ${r.tracks.length}`} hotkey="r" plain onPress={() => void openReplay($)} />
      ) : null}
      <Button key="strip-panel" label="Panel" hotkey="k" plain onPress={() => void togglePanel($, true)} />
      <Button key="strip-hide" label="Hide" hotkey="h" plain dimColor onPress={() => void update($, ui, x => ({ ...x, isStripHidden: true }))} />
    </Box>
  )
}

/**
 * The guard screen's picture: Bocchi panicking beside her guitar hitting the
 * stage. A remote surface shows her whole beside the crash at her feet, one
 * CSS pixel a pixel. A terminal draws her mini head and the crash where
 * `columns` (the room inside the screen's frame) and `rows` (what the room
 * spares beside the command and the buttons) hold them: her mini in half
 * blocks beside the crash in quadrants (8 rows, 66 columns) where it can, her
 * mini beside the small crash, both in quadrants (4 rows, 33 columns), where
 * it must, the crash alone where her head does not fit, nothing where neither
 * does. The half blocks are the mini at zoom 2 in the quadrant canvas: one
 * Raster, each of its cells the mini's pixel over the one below.
 */
function blastSpec(isTerminal: boolean, columns: number, rows: number): SpriteSpec | null {
  const alt = 'Bocchi panics as her guitar crashes onto the stage'
  if (!isTerminal) {
    const crash = animOf(CRASH)
    const whole = animOf(spriteId('bocchi', 'panic', 'full'))
    if (crash === undefined) return null
    if (whole === undefined) return { key: 'blast-sprite', parts: [{ id: CRASH, x: 0, y: 0 }], w: crash.w, h: crash.h, mode: 'quad', scale: 1, alt }
    // The crash tucks into the right eighth of her canvas, which her figure leaves clear.
    const x = Math.round((whole.w * 7) / 8)
    return { key: 'blast-sprite', parts: [{ id: spriteId('bocchi', 'panic', 'full'), x: 0, y: 0 }, { id: CRASH, x, y: whole.h - crash.h }], w: x + crash.w, h: whole.h, mode: 'quad', scale: 1, alt }
  }
  const head = spriteId('bocchi', 'panic', 'mini')
  const tiers = [
    { zoom: 2, crash: CRASH },
    { zoom: 1, crash: CRASH_MINI },
  ]
  for (const tier of tiers) {
    const crash = animOf(tier.crash)
    if (crash === undefined || rows < cellsFor(crash.w, crash.h, 'quad').rows) continue
    const mini = animOf(head)
    if (mini !== undefined) {
      // An eighth of her head apart: two columns beside the large head, one beside the small.
      const headW = mini.w * tier.zoom
      const gap = Math.max(1, Math.round(headW / 8))
      const w = headW + gap + crash.w
      const h = Math.max(mini.h * tier.zoom, crash.h)
      if (cellsFor(w, h, 'quad').columns <= columns) return { key: 'blast-sprite', parts: [{ id: head, x: 0, y: 0, zoom: tier.zoom }, { id: tier.crash, x: headW + gap, y: 0 }], w, h, mode: 'quad', scale: 1, bg: bg(), alt }
    }
    if (cellsFor(crash.w, crash.h, 'quad').columns <= columns) return { key: 'blast-sprite', parts: [{ id: tier.crash, x: 0, y: 0 }], w: crash.w, h: crash.h, mode: 'quad', scale: 1, bg: bg(), alt }
  }
  return null
}

function drawBlast($: EngineInterface, e: Site, s: KessokuBlast, now: number): Draw {
  const { Box, Text, Button } = $.ui.resolve(e)
  const width = e.props.bodyColumns
  // Inside the double border and the padding; the rows left once the frame, the title, the command, its damage,
  // the listed paths, the note, the buttons and the hint have theirs (a button scrolled out of a band's view
  // takes no hotkey, so the picture gets only what is left).
  const inner = width - 4
  const listed = s.lines.length + (s.more > 0 ? 1 : 0)
  const spare = e.props.scroll.bodyRows - 10 - (listed > 0 ? listed + 1 : 0) - (s.note ? Math.ceil(s.note.length / Math.max(20, inner)) : 0)
  const spec = blastSpec(e.surface === 'terminal', inner, spare)
  const picture = spec === null ? null : drawSprite($, e, spec, now)
  // The buttons answer the held call; with none held (a `/bocchi crash`
  // preview) they just take the screen down.
  const decide = (choice: string) => () => {
    if (held !== null) {
      if (held.decision === null) held.decision = choice
      return
    }
    void (async () => {
      await update($, blast, () => null)
      await $.ui.close({ id: BLAST })
      await revertMood($)
    })()
  }
  const list = s.lines.map((line, i) => (
    <Text key={`l${i}`} color={PALETTE.blush} wrap="truncate-end">
      {'   '}{line}
    </Text>
  ))
  if (s.more > 0) list.push(<Text key="more" dimColor>{'   '}+ {s.more} more</Text>)
  const command = (
    <Text key="blast-command" wrap="truncate-end">
      <Text dimColor>Command  </Text>
      <Text bold color="text">{s.command}</Text>
    </Text>
  )
  const would = (
    <Text key="blast-would" wrap="truncate-end">
      <Text dimColor>Would    </Text>
      <Text bold color="error">{s.summary}</Text>
    </Text>
  )
  // Without a picture: the ASCII guitar where its five rows fit the same budget, the one-line crash where one does, else nothing.
  const ascii =
    width >= 62 && spare >= GUITAR.length
      ? GUITAR.map((row, i) => <Text key={`g${i}`} color={i === 3 ? 'error' : opts.accent}>{row}</Text>)
      : spare >= 1
        ? <Text key="blast-crash" color="error">*  C R A S H  *</Text>
        : null
  // With art on, the command and its damage come first, so nothing drawn for show pushes them (or the buttons) out of a short band.
  const top = picture !== null ? [command, would, picture] : opts.characterArt === 'sprites' ? [command, would, ascii] : [ascii, command, would]
  return (
    <Box flexDirection="column" borderStyle="double" borderColor="error" paddingX={1} backgroundColor={bg()}>
      <Text color="error" bold wrap="truncate-end">
        {picture === null ? `${MEMBERS.bocchi.faces.panic} ` : ''}DROPPED GUITAR · {s.label}
      </Text>
      {top}
      {list.length > 0 ? <Box flexDirection="column" marginTop={1}>{list}</Box> : null}
      {s.note ? <Text dimColor italic wrap="wrap">{s.note}</Text> : null}
      <Box flexDirection="row" gap={2} marginTop={1}>
        <Button key="blast-cancel" label="Cancel — catch it!" hotkey="0" variant="primary" autoFocus onPress={decide('cancel')} />
        <Button key="blast-proceed" label="Proceed — let it fall (p)" hotkey="p" onPress={decide('proceed')} />
      </Box>
      <Text dimColor>Bocchi is frozen until you answer · Esc cancels · a letter never fires from the prompt, so a stray digit can't let it fall</Text>
    </Box>
  )
}

function drawCacheTax($: EngineInterface, e: RenderInput<'AbovePrompt'>, c: KessokuCache, now: number): Draw {
  const { Box, Text, Button } = $.ui.resolve(e)
  const age = c.lastWarmAt > 0 ? fmtDuration(now - c.lastWarmAt) : '?'
  const { price, isExact } = priceInfo(c.model || 'default')
  const rate = ttlMs() > 5 * 60_000 ? price.cacheWriteHour : price.cacheWrite
  // Bocchi panicking beside the bill: her mini in quadrants on a terminal (four rows), her portrait elsewhere.
  const sprite = drawSprite($, e, headSprite('tax-sprite', e, 'bocchi', 'panic', bg()), now)
  return (
    <Box flexDirection="row" gap={1} borderStyle="round" borderColor="error" paddingX={1} backgroundColor={bg()}>
      {sprite}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        <Text color="error" bold wrap="truncate-end">
          {sprite === null ? `${MEMBERS.bocchi.faces.panic} ` : ''}CACHE TAX · the cache went cold {age} ago!!
        </Text>
        <Text wrap="wrap">
          <Text color="text">Sending re-writes </Text>
          <Text bold color={opts.accent}>{fmtTokens(c.contextTokens)} tokens</Text>
          <Text color="text"> at {c.engineWriteUsd > 0 && c.engineModel === c.model ? "the engine's rate" : `${isExact ? '' : '~'}$${rate}/MTok`} ≈ </Text>
          <Text bold color="error">{fmtUsd(c.heldUsd)}</Text>
          <Text dimColor> (a warm turn: ≈{fmtUsd(c.warmUsd)}). Your prompt is back in the box: press Enter to pay and send.</Text>
        </Text>
        <Box flexDirection="row" flexWrap="wrap" columnGap={2} marginTop={1}>
          <Button
            key="tax-keepwarm"
            label={c.keepWarmUntil > now ? 'Keep warm: on' : `Keep it warm after (${fmtDuration(opts.keepWarmMs)})`}
            hotkey="w"
            plain
            onPress={() => void update($, cache, x => ({ ...x, keepWarmUntil: now + opts.keepWarmMs }))}
          />
          <Button key="tax-clear" label="Start fresh (/clear)" hotkey="f" plain onPress={() => void $.prompt.fill({ text: '/clear', mode: 'replace' })} />
          <Button key="tax-dismiss" label="Dismiss" hotkey="d" plain dimColor onPress={() => void update($, cache, x => ({ ...x, heldAt: 0 }))} />
        </Box>
      </Box>
    </Box>
  )
}

function drawMemo($: EngineInterface, e: RenderInput<'AbovePrompt'>, m: KessokuMemo, now: number): Draw {
  const table = $.ui.resolve(e)
  const { Box, Text, Button } = table
  const n = MEMBERS.nijika
  // Nijika at work: scribbling while the memo drafts, beaming once it is saved, her usual smile in between.
  const mood: KessokuMood = m.status === 'drafting' ? 'focused' : m.status === 'saved' ? 'happy' : 'anxious'
  const sprite = drawSprite($, e, headSprite('memo-sprite', e, 'nijika', mood, bg()), now)
  const face = (f: string) => (sprite === null ? `${f} ` : '')
  if (m.status === 'drafting') {
    return (
      <Box flexDirection="row" gap={1} paddingX={1} backgroundColor={bg()}>
        {sprite}
        <Text color={n.color}>{face(n.faces.focused)}Nijika is scribbling a band memo…</Text>
      </Box>
    )
  }
  if (m.status === 'saved') {
    return (
      <Box flexDirection="row" gap={1} paddingX={1} backgroundColor={bg()}>
        {sprite}
        <Text wrap="truncate-end">
          <Text color="success">✓ {face(n.faces.happy)}saved to {m.savedTo}: </Text>
          <Text color="text">{m.rule}</Text>
        </Text>
      </Box>
    )
  }
  const Input = 'Input' in table ? table.Input : null
  const keep = (value: string) => void update($, memo, x => (x === null ? x : { ...x, rule: value.trim() || x.rule, status: 'open' as const }))
  return (
    <Box flexDirection="row" gap={1} borderStyle="round" borderColor={n.color} paddingX={1} backgroundColor={bg()}>
      {sprite}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {m.by === undefined ? (
          <Text wrap="truncate-end">
            <Text color={n.color} bold>{face(n.faces.focused)}NIJIKA · band memo</Text>
            <Text dimColor> · "no, in this band we do it like this"</Text>
          </Text>
        ) : (
          // A rule Claude proposed through the memo tool: the same card, signed by who proposed it.
          <Text wrap="truncate-end">
            <Text color={n.color} bold>{face(n.faces.focused)}NIJIKA · band memo</Text>
            <Text dimColor> · proposed by </Text>
            <Text color={MEMBERS[m.by].color}>{MEMBERS[m.by].name}</Text>
            <Text dimColor> mid-set</Text>
          </Text>
        )}
        {m.status === 'editing' && Input !== null ? (
          <Input key="memo-rule" label="rule " value={m.rule} submitLabel="keep" autoFocus onSubmit={keep} />
        ) : (
          <Text color="text" wrap="wrap">"{m.rule}"</Text>
        )}
        <Box flexDirection="row" flexWrap="wrap" columnGap={2} marginTop={1}>
          <Button key="memo-save" label="Save to ./CLAUDE.md" hotkey="s" variant="primary" autoFocus onPress={() => void saveRule($, 'project')} />
          <Button key="memo-global" label="Global instead" hotkey="g" plain onPress={() => void saveRule($, 'global')} />
          {Input !== null ? <Button key="memo-edit" label="Edit" hotkey="e" plain onPress={() => void update($, memo, x => (x === null ? x : { ...x, status: 'editing' as const }))} /> : null}
          <Button key="memo-skip" label="Skip" hotkey="k" plain dimColor onPress={() => void skipRule($)} />
        </Box>
      </Box>
    </Box>
  )
}

function drawReplay($: EngineInterface, e: Site, r: KessokuReplay, inBand: boolean, now: number): Draw {
  const { Box, Text, Button, Code } = $.ui.resolve(e)
  const total = r.tracks.length
  if (total === 0) {
    return (
      <Box paddingX={1} backgroundColor={bg()}>
        <Text dimColor>No edits on the setlist yet.</Text>
      </Box>
    )
  }
  const k = Math.max(0, Math.min(r.index, total - 1))
  const track = r.tracks[k] as KessokuTrack
  const by = MEMBERS[track.by]
  const maxLines = inBand ? Math.max(4, Math.min(MAX_DIFF_LINES, (e.props as { maxRows?: number }).maxRows ?? 20) - 8) : MAX_DIFF_LINES
  // Cut on hunk lines with the header counts rewritten, so the Code element still reads it as a diff.
  const window = cutHunks(track.hunks, maxLines)
  const source = window.text
  const cut = window.hidden > 0
  const go = (to: number) => () => void update($, replay, x => ({ ...x, index: Math.max(0, Math.min(to, total - 1)) }))
  // Whoever played the track, at it, beside the header (four rows in a terminal).
  const sprite = drawSprite($, e, headSprite('replay-sprite', e, track.by, 'focused', bg()), now)
  const header = (
    <Box flexDirection="column" flexGrow={1} flexShrink={1}>
      <Box flexDirection="row" justifyContent="space-between">
        <Text color={opts.accent} bold>♪ REPLAY THEATER · setlist #{r.setlist}</Text>
        <Text bold color="text">track {k + 1} of {total}</Text>
      </Box>
      <Text wrap="truncate-end">
        {r.tracks.map((t, n) => (
          <Text key={`t${n}`} color={n === k ? opts.accent : 'inactive'} inverse={n === k} bold={n === k}>
            {` ${n + 1} `}
          </Text>
        ))}
      </Text>
      <Text wrap="truncate-start">
        <Text color={by.color}>{sprite === null ? `${by.faces.focused} ` : `${by.name} · `}</Text>
        <Text color="text" bold>{track.file}</Text>
        <Text dimColor> · {track.tool}{track.note ? ` · ${track.note}` : ''} · </Text>
        <Text color="success">+{track.add}</Text>
        <Text dimColor> </Text>
        <Text color="error">-{track.del}</Text>
      </Text>
    </Box>
  )
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={opts.accent} paddingX={1} backgroundColor={bg()}>
      {sprite === null ? (
        header
      ) : (
        <Box flexDirection="row" gap={1}>
          {sprite}
          {header}
        </Box>
      )}
      {source === '' ? (
        <Text dimColor>{'   '}(no line changes)</Text>
      ) : (
        <Box flexDirection="column">
          <Code source={source} format="diff" path={track.file} wrap="truncate-end" />
          {cut ? <Text dimColor>{'   '}… {window.hidden} more lines</Text> : null}
        </Box>
      )}
      <Box flexDirection="row" gap={2} marginTop={1}>
        <Button key="replay-prev" label="◀ Prev" hotkey="p" onPress={go(k - 1)} />
        <Button key="replay-next" label="Next ▶" hotkey="n" variant="primary" autoFocus onPress={go(k + 1)} />
        <Button key="replay-close" label="Close" hotkey="c" role="dismiss" onPress={() => void closeReplay($)} />
      </Box>
    </Box>
  )
}

function drawTree($: EngineInterface, e: Site, t: KessokuTree, beat: number, now: number): Draw {
  const { Box, Text, Button } = $.ui.resolve(e)
  const rows = treeRows(t.paths)
  const lit = new Map<string, KessokuLight>()
  for (const l of t.lights) if (isLit(l, now)) lit.set(l.path, l)
  const newest = [...t.lights].filter(l => isLit(l, now)).sort((a, b) => b.at - a.at)[0]
  const room = Math.max(6, (e.props.scroll?.bodyRows ?? 16) - 5)
  const win = windowRows(rows, newest?.path ?? null, room)
  const shimmerColor = SHIMMER[beat % SHIMMER.length] as string
  const rootName = baseName(t.root)
  return (
    <Box flexDirection="column" paddingX={1} backgroundColor={bg()}>
      <Box flexDirection="row" justifyContent="space-between">
        <Text color={opts.accent} bold wrap="truncate-end">♪ FILETREE · {rootName}</Text>
        <Text dimColor>{lit.size} lit</Text>
      </Box>
      {t.paths.length === 0 ? <Text dimColor>no files found (or still building)</Text> : null}
      {win.above > 0 ? <Text dimColor>{'   '}↑ {win.above} more</Text> : null}
      {win.rows.map(row => {
        const l = lit.get(row.path)
        const indent = '  '.repeat(row.depth)
        if (row.isDir) {
          return (
            <Text key={row.key} dimColor wrap="truncate-end">
              {indent}▸ {row.name}
            </Text>
          )
        }
        if (l === undefined) {
          return (
            <Text key={row.key} color="text" dimColor wrap="truncate-end">
              {indent}  {row.name}
            </Text>
          )
        }
        const by = MEMBERS[l.by]
        if (l.kind === 'committed') {
          return (
            <Text key={row.key} color="success" bold wrap="truncate-end">
              {indent}✓ {row.name} <Text dimColor>committed</Text>
            </Text>
          )
        }
        if (l.kind === 'read') {
          return (
            <Text key={row.key} color={PALETTE.blush} wrap="truncate-end">
              {indent}· {row.name} <Text dimColor>read</Text>
            </Text>
          )
        }
        if (l.kind === 'edited' && !isGlowing(l, now)) {
          return (
            <Text key={row.key} color={PALETTE.rose} wrap="truncate-end">
              {indent}♪ {row.name} <Text dimColor>edited · awaiting a commit</Text>
            </Text>
          )
        }
        const color = l.kind === 'editing' ? shimmerColor : opts.accent
        return (
          <Text key={row.key} color={color} bold wrap="truncate-end">
            {indent}{l.kind === 'editing' ? NOTES[beat % NOTES.length] : '♪'} {row.name} <Text dimColor>{by.faces.focused} {by.name}</Text>
          </Text>
        )
      })}
      {win.below > 0 ? <Text dimColor>{'   '}↓ {win.below} more</Text> : null}
      <Box flexDirection="row" gap={2}>
        <Button key="tree-refresh" label="Refresh" hotkey="f" plain dimColor onPress={() => void buildTree($)} />
        <Button key="tree-close" label="Close" hotkey="c" plain dimColor role="dismiss" onPress={() => void toggleTree($, true)} />
        <Text dimColor>pink = editing · rose = edited · green = committed</Text>
      </Box>
    </Box>
  )
}

// ---- Previews (`/bocchi ...`) ---------------------------------------------------

async function demoBand($: EngineInterface, on: boolean): Promise<string> {
  const now = await $.clock.now()
  if (!on) {
    await update($, band, b => ({ ...b, agents: b.agents.filter(a => !a.id.startsWith('demo-')) }))
    return 'Kessoku Band: the demo acts left the stage.'
  }
  const DEMO_MODEL = 'claude-sonnet-5-5'
  const demo = (id: string, member: KessokuMember, description: string, task: string, status: KessokuAgent['status'], usage: KessokuUsage, startedAgo: number, endedAgo: number | null, isError = false): KessokuAgent => ({
    id: `demo-${id}`,
    member,
    description,
    type: 'general-purpose',
    status,
    task,
    startedAt: now - startedAgo,
    endedAt: endedAgo === null ? null : now - endedAgo,
    model: DEMO_MODEL,
    usage,
    context: usage.input + usage.cacheRead + usage.cacheWrite,
    steps: 7,
    tools: 12,
    cost: costOf(usage, DEMO_MODEL),
    isError,
  })
  await upsertAgent($, demo('nijika', 'nijika', 'Plan the auth refactor rollout', 'TaskCreate: 5 tasks', 'running', { input: 3000, output: 4200, cacheRead: 38000, cacheWrite: 2000 }, 48_000, null))
  await upsertAgent($, demo('ryo', 'ryo', 'Find every call site of legacyQuery()', 'Grep "legacyQuery"', 'running', { input: 1200, output: 2100, cacheRead: 61000, cacheWrite: 900 }, 17_000, null))
  await upsertAgent($, demo('ryo2', 'ryo', 'Benchmark the cache warm-up', 'waiting on the build', 'waiting', { input: 400, output: 600, cacheRead: 9000, cacheWrite: 200 }, 26_000, null))
  await upsertAgent($, demo('kita', 'kita', 'Update README for the new CLI flags', 'Edit README.md', 'completed', { input: 900, output: 3800, cacheRead: 22000, cacheWrite: 500 }, 95_000, 4_000))
  await upsertAgent($, demo('kita2', 'kita', 'Polish the settings page styles', 'Edit src/settings.css', 'failed', { input: 700, output: 900, cacheRead: 15000, cacheWrite: 300 }, 160_000, 70_000, true))
  await update($, band, b => ({ ...b, sessionUsd: b.sessionUsd || 0.42, contextPercent: b.contextPercent || 34, window: b.window || 200_000 }))
  return 'Kessoku Band: five demo acts are on stage (Nijika, Ryo ×2, Kita ×2): playing, waiting, done and failed, a slime each. `/bocchi demo off` clears them.'
}

async function demoMemo($: EngineInterface, proposed: boolean): Promise<string> {
  const now = await $.clock.now()
  if (proposed) {
    await update($, memo, () => ({ rule: 'Use pnpm, not npm, for every script in this repository.', original: 'ran npm twice this session; package.json has a pnpm lockfile', at: now, status: 'open' as const, savedTo: '', by: 'bocchi' as const }))
    return 'Reflect: a sample memo Claude proposed through the memo tool is above the prompt (Save writes a real line to CLAUDE.md).'
  }
  await update($, memo, () => ({ rule: 'Always use pnpm instead of npm in this repository.', original: 'no — in this repo we always use pnpm, not npm', at: now, status: 'open', savedTo: '' }))
  return 'Reflect: a sample band memo is above the prompt (Save writes a real line to CLAUDE.md).'
}

async function demoTax($: EngineInterface): Promise<string> {
  const now = await $.clock.now()
  const model = 'claude-sonnet-5-5'
  await update($, cache, c => {
    const tokens = c.contextTokens || 330_316
    const m = c.model || model
    return {
      ...c,
      model: m,
      contextTokens: tokens,
      lastWarmAt: c.lastWarmAt || now - 2 * ttlMs(),
      heldAt: now,
      heldText: '',
      isArmed: true,
      heldUsd: cacheWriteUsd(tokens, m, ttlMs()),
      warmUsd: (tokens * priceInfo(m).price.cacheRead) / 1_000_000,
    }
  })
  return 'Cache Tax: a sample cold-cache warning is above the prompt (nothing is held; your next send clears it).'
}

async function demoCrash($: EngineInterface): Promise<string> {
  if (held !== null) return 'Blast Radius: a real command is held right now; answer that screen first.'
  await update($, blast, () => ({
    command: 'rm -rf build',
    label: 'rm -rf',
    summary: 'delete 9 files (about 1.4 MB)',
    lines: ['build/index.html', 'build/assets/logo.png', 'build/js/app.js', 'build/js/chunk-1.js', 'build/js/chunk-2.js', 'build/js/chunk-3.js', 'build/css/app.css', 'build/manifest.json', 'build/robots.txt'],
    more: 0,
    note: 'Preview only: nothing is held and nothing runs. The real screen holds the command until you answer.',
    where: 'pane' as const,
    isHeld: true,
  }))
  reopenSprites(BLAST)
  const placed = await $.ui.open({ id: BLAST, title: '⚠ Dropped guitar', focus: true, closeOnEscape: true, rows: opts.characterArt === 'sprites' ? 31 : 25, columns: 70 })
  if (!placed.isPlaced) await update($, blast, s => (s === null ? s : { ...s, where: 'band' as const }))
  await setMood($, 'panic', 'the guitar is falling!! (preview)', 20_000)
  $.clock.after(20_000, () => {
    // A real hold that started meanwhile owns the pane; the preview leaves it alone.
    if (held !== null) return
    void (async () => {
      await update($, blast, () => null)
      await $.ui.close({ id: BLAST })
    })()
  })
  return 'Blast Radius: the dropped-guitar screen is up for 20 seconds (preview).'
}

async function demoReplay($: EngineInterface): Promise<string> {
  const a = unifiedDiff('export function greet(name) {\n  return "hi " + name\n}\n', 'export function greet(name) {\n  return `hi ${name}!`\n}\n')
  const b = unifiedDiff('', '# Greeter\n\nSays hi.\n')
  await update($, replay, x => ({
    ...x,
    tracks: [
      { tool: 'Edit', file: 'src/greet.js', hunks: a.hunks, add: a.add, del: a.del, note: 'preview', by: 'kita' as const },
      { tool: 'Write', file: 'README.md', hunks: b.hunks, add: b.add, del: b.del, note: 'new file', by: 'kita' as const },
    ],
    index: 0,
    setlist: x.setlist + 1,
  }))
  await openReplay($)
  return 'Replay Theater: a two-track sample setlist is open (preview).'
}

const HELP_LINES = [
  '/kessoku          toggle the Kessoku Band panel (subagents as Nijika, Ryo, Kita; Bocchi is the main loop)',
  '/filetree         toggle the file tree: pink while Claude edits a file, neon green once a commit lands',
  '/replay           step through the last turn\'s edits as a setlist, one diff at a time',
  '/keepwarm [90m|2h|off]   keep the prompt cache warm with cheap pings (default from config)',
  '/cache-tax        is the cache warm, and what would a cold send cost?',
  '/bocchi theme [on|off|status]   switch Claude Code\'s own theme to Kessoku Bocchi (the light twin on a light theme), or back',
  '/bocchi strip     hide or show the band strip above the prompt',
  '/bocchi mood <anxious|focused|happy|panic|melting|hiding>   try a face in the status line',
  '/bocchi demo [off]   put sample acts on the panel · /bocchi memo [proposed] · /bocchi tax · /bocchi crash · /bocchi setlist   previews',
  'Blast Radius and Reflect need no command: a risky command or a correction brings them up, and Claude can propose a rule itself with the memo tool (you still press Save).',
  "Band agent types: Claude can delegate to kessoku-ultimate-bocchi:nijika (plans, reviews, triage), :ryo (searches, shells, tests) and :kita (edits to named files); each act sits on its member's card by name.",
  'Config: /config → kessoku-ultimate-bocchi (engine theme, transcript skin, restyle other mods, toasts, accent, backgrounds, tool cards, spinner words, cache TTL, keepwarm, reflect, panel on start).',
]

/** `/bocchi help`: the mod's and the engine's versions first, then every command, then what is off on this engine (only when something is). */
function help(): string {
  const off = offLine(features)
  return [versionLine(modVersion, engineVersion), ...HELP_LINES, ...(off === '' ? [] : [off])].join('\n')
}

/** The panel, the timers, the first face and the theme offer: once per load, when a screen exists. */
async function startUi($: EngineInterface): Promise<void> {
  if (uiStarted) return
  uiStarted = true
  const row = await themeRow($)
  isLightTheme = isLightValue(row?.value)

  const panes = await $.ui.panes()
  const hasPanel = panes.some(p => p.id === PANEL)
  if (hasPanel) {
    await update($, ui, x => ({ ...x, isPanelOpen: true, panelWhere: panes.find(p => p.id === PANEL)?.isPlaced ? ('pane' as const) : ('band' as const) }))
  } else if (opts.openPanel) {
    // Unasked, the engine seats a pane only where it is a sidebar; elsewhere the strip stays and a toast says how to open it.
    reopenSprites(PANEL)
    const placed = await $.ui.open({ id: PANEL, title: '♪ Kessoku Band', ...panelSize() })
    if (placed.isPlaced) {
      await update($, ui, x => ({ ...x, isPanelOpen: true, panelWhere: 'pane' as const }))
    } else {
      await $.ui.close({ id: PANEL }).catch(() => undefined)
      await update($, ui, x => ({ ...x, isPanelOpen: false, panelWhere: 'none' as const }))
      if (!(await storeGet($, 'panelHinted'))) {
        toast($, `${MEMBERS.nijika.faces.anxious} /kessoku opens the band panel (the terminal is too narrow for a sidebar)`, 'chatter')
        await storeSet($, 'panelHinted', true)
      }
    }
  }
  const t = await read($, tree)
  if (t.isOpen && !panes.some(p => p.id === TREE)) await update($, tree, x => ({ ...x, isOpen: false, isBand: false }))
  else if (t.isOpen && t.lights.length > 0) ensureShimmer($)
  const r = await read($, replay)
  if (r.isOpen && !r.inBand && !panes.some(p => p.id === REPLAY)) await update($, replay, x => ({ ...x, isOpen: false }))
  await update($, blast, () => null)
  // A memo already answered, or a face set with a timer, does not survive the reload that lost the timer.
  const m = await read($, memo)
  if (m !== null && (m.status === 'saved' || m.status === 'skipped')) await update($, memo, () => null)
  await showNextProposal($)
  const b = await read($, band)
  if (b.isWorking) ensureTick($)

  if (keepWarmTimer !== null) keepWarmTimer.cancel()
  keepWarmTimer = $.clock.every(60_000, () => {
    void coldWatch($).catch(() => undefined)
    void keepWarmTick($)
  })
  if (b.mood === 'happy' || b.mood === 'panic' || b.mood === 'hiding') await revertMood($)
  else await setMood($, b.isWorking ? 'focused' : 'anxious', b.isWorking ? b.mainTask : '')
  await refreshUsage($).catch(() => undefined)
  // The theme offer waits a beat so the session starts without a dialog in the way.
  if (opts.applyTheme) {
    $.clock.after(1500, () => {
      void offerTheme($).catch(() => undefined)
    })
  }
}

// ---- register ------------------------------------------------------------------

export const register: Register = (on, options) => {
  opts = readOptions(options)

  // -- session: commands, then the screen work once a screen exists ---------------------
  on('session.start', async ($, e, next) => {
    cwd = e.cwd
    isInteractive = e.isInteractive
    hasSurface = e.surface !== null
    uiStarted = false
    await $.command.register({ name: 'kessoku', description: 'Kessoku Band: toggle the live agent panel' })
    await $.command.register({ name: 'filetree', description: 'Kessoku: toggle the concert-lit file tree' })
    await $.command.register({ name: 'replay', description: 'Replay Theater: step through the last turn\'s edits as a setlist' })
    await $.command.register({ name: 'keepwarm', description: 'Cache Tax: keep the prompt cache warm (e.g. /keepwarm 90m, /keepwarm off)', argumentHint: '[duration|off]' })
    await $.command.register({ name: 'cache-tax', description: 'Cache Tax: is the cache warm, and what would a cold send cost?' })
    await $.command.register({ name: 'bocchi', description: 'Kessoku theme: help, the engine theme, previews, moods, the strip', argumentHint: '[help|theme on|off|strip|mood <m>|demo|memo [proposed]|tax|crash|setlist]' })
    await readEngine($).catch(() => undefined)
    // What the model can do with the band: delegate to a member by name, and propose a rule for Nijika's card.
    await registerBand($).catch(() => undefined)
    await registerMemoTool($).catch(() => undefined)
    // The REPL has its screen now; a host like the desktop app attaches its client a moment later (session.attach);
    // a bare `claude -p` or SDK run never does, and the commands are enough for it.
    if (canDraw()) await startUi($)
    return next(e)
  })

  on('session.attach', async ($, e, next) => {
    hasSurface = true
    if (!uiStarted) await startUi($).catch(() => undefined)
    return next(e)
  }).catch(($, e, next) => next(e))


  // -- /clear: the conversation ends and the process goes on; nothing of the old one should hold the new one ----
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      pendingTracks = []
      await update($, cache, c => ({ ...INITIAL_CACHE, keepWarmUntil: c.keepWarmUntil, engineWriteUsd: c.engineWriteUsd, engineModel: c.engineModel, model: c.model }))
      await update($, band, () => INITIAL_BAND)
      await update($, replay, x => ({ ...INITIAL_REPLAY, setlist: x.setlist }))
      await update($, tree, x => ({ ...x, lights: [] }))
      await update($, memo, () => null)
      await update($, proposals, () => [])
      if (memoTimer !== null) {
        memoTimer.cancel()
        memoTimer = null
      }
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // -- commands ------------------------------------------------------------------
  on('command.run', { command: 'kessoku' }, async $ => ({ text: await togglePanel($, true) }))
  on('command.run', { command: 'filetree' }, async $ => ({ text: await toggleTree($, true) }))
  on('command.run', { command: 'replay' }, async $ => {
    const opened = await openReplay($)
    const r = await read($, replay)
    return { text: opened ? `Replay Theater: ${r.tracks.length} ${r.tracks.length === 1 ? 'track' : 'tracks'} on the setlist.` : 'Replay Theater: no edits on the last setlist.' }
  })
  on('command.run', { command: 'keepwarm' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const now = await $.clock.now()
    if (arg === 'off' || arg === 'stop') {
      await update($, cache, c => ({ ...c, keepWarmUntil: 0 }))
      return { text: 'keepwarm off.' }
    }
    const ms = arg === '' ? opts.keepWarmMs : parseDuration(arg)
    if (ms === null) return { text: `keepwarm: couldn't read "${e.args.trim()}". Try /keepwarm 90m, /keepwarm 2h, or /keepwarm off.` }
    await update($, cache, c => ({ ...c, keepWarmUntil: now + ms }))
    const c = await read($, cache)
    const ping = (c.contextTokens * priceInfo(c.model || 'default').price.cacheRead) / 1_000_000
    return { text: `keepwarm on for ${fmtDuration(ms)}: a cheap ping (≈${fmtUsd(ping)} at ${fmtTokens(c.contextTokens)} tokens) lands shortly before the ${fmtDuration(ttlMs())} cache would lapse, while the session is idle.` }
  })
  on('command.run', { command: 'cache-tax' }, async $ => {
    const c = await read($, cache)
    const now = await $.clock.now()
    const write = coldWriteUsd(c)
    const warm = (c.contextTokens * priceInfo(c.model || 'default').price.cacheRead) / 1_000_000
    const lines = [
      `${MEMBERS.bocchi.faces[c.lastWarmAt > 0 && now - c.lastWarmAt > ttlMs() ? 'panic' : 'anxious']} Cache Tax`,
      `state      ${warmth(c, now)} (TTL ${fmtDuration(ttlMs())})`,
      `context    ${fmtTokens(c.contextTokens)} tokens on ${c.model || 'the session model'}`,
      `cold send  ≈ ${fmtUsd(write)} to re-write the cache${c.engineWriteUsd > 0 && c.engineModel === c.model ? " (the engine's own estimate)" : ''} · warm send ≈ ${fmtUsd(warm)}`,
      `keepwarm   ${c.keepWarmUntil > now ? `on, ${fmtDuration(c.keepWarmUntil - now)} left` : 'off (/keepwarm to arm it)'} · ${c.pings} pings so far (≈${fmtUsd(c.pingUsd)}${c.misses > 0 ? `, ${c.misses} found it cold` : ''})${c.lastPingNote ? ` · ${c.lastPingNote}` : ''}`,
    ]
    return { text: lines.join('\n') }
  })
  on('command.run', { command: 'bocchi' }, async ($, e) => {
    const [verb = 'help', ...rest] = e.args.trim().split(/\s+/)
    const arg = rest.join(' ').toLowerCase()
    switch (verb.toLowerCase()) {
      case 'theme': {
        if (arg === 'off' || arg === 'restore') return { text: `Kessoku theme ${await restoreTheme($)}` }
        if (arg === 'on' || arg === 'apply') {
          await storeSet($, 'themeAsked', true)
          return { text: `Kessoku theme ${await applyKessokuTheme($)}` }
        }
        const row = await themeRow($)
        const dark = themeOptionOf(row, false)
        const current = row === null ? 'unknown (no theme row here)' : String(row.value)
        return { text: `Kessoku theme: current theme is ${current}; the Kessoku Bocchi theme is ${dark === undefined ? 'not in the /theme list yet' : `listed as ${dark}`}. /bocchi theme on | off.` }
      }
      case 'strip': {
        const u = await update($, ui, x => ({ ...x, isStripHidden: !x.isStripHidden }))
        return { text: u.isStripHidden ? 'Kessoku: the strip is hidden.' : 'Kessoku: the strip is back above the prompt.' }
      }
      case 'mood': {
        const moods: KessokuMood[] = ['anxious', 'focused', 'happy', 'panic', 'melting', 'hiding']
        const mood = moods.find(m => m === arg)
        if (mood === undefined) return { text: `Moods: ${moods.join(', ')}` }
        await setMood($, mood, '', 15_000)
        return { text: `${MEMBERS.bocchi.faces[mood]} ${mood} for 15 seconds, then back to the real one.` }
      }
      case 'demo':
        return { text: await demoBand($, arg !== 'off') }
      case 'memo':
        return { text: await demoMemo($, arg === 'proposed') }
      case 'tax':
        return { text: await demoTax($) }
      case 'crash':
        return { text: await demoCrash($) }
      case 'setlist':
        return { text: await demoReplay($) }
      default:
        return { text: help() }
    }
  }).catch(() => ({ text: `${MEMBERS.bocchi.faces.panic} /bocchi hit a wrong note and could not finish; try again.` }))

  // -- turns -----------------------------------------------------------------------
  on('turn.start', async ($, e, next) => {
    pendingTracks = []
    // The session's folder moves with /cd or a worktree change; the labels and the guard follow it.
    cwd = await $.session.cwd().catch(() => cwd)
    const now = await $.clock.now()
    const head = e.text.replace(/\s+/g, ' ').trim().slice(0, 48)
    await update($, band, b => patchAgent({ ...b, isWorking: true, mainTask: head, lastError: '' }, 'main', a => ({ ...a, status: 'running', startedAt: a.startedAt || now, task: '' })))
    await setMood($, 'focused', head ? `"${head}"` : '')
    ensureTick($)
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    const u = r.usage
    if (u !== null && u !== undefined) {
      const delta: KessokuUsage = { input: u.input_tokens, output: u.output_tokens, cacheRead: u.cache_read_input_tokens, cacheWrite: u.cache_creation_input_tokens }
      const context = u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens
      const id = e.agentId ?? 'main'
      await update($, band, b => (b.agents.some(a => a.id === id) ? patchAgent(b, id, a => ({ ...a, usage: addUsage(a.usage, delta), context, steps: a.steps + 1, model: u.model, cost: a.cost + costOf(delta, u.model) })) : b))
      if (e.agentId === undefined) {
        const now = await $.clock.now()
        await update($, cache, c => ({ ...c, lastWarmAt: now, contextTokens: context + u.output_tokens, model: u.model }))
      }
    }
    return r
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    const now = await $.clock.now()
    if (e.agentId !== undefined) {
      const id = e.agentId
      const ok = e.reason === 'answer'
      // A subagent the person stopped is not a wrong note; only an error or a refusal is.
      const status: KessokuAgent['status'] = ok ? 'completed' : e.reason === 'aborted' ? 'killed' : 'failed'
      const isError = e.reason === 'error' || e.reason === 'refusal'
      await update($, band, b => patchAgent(b, id, a => ({ ...a, status, endedAt: now, isError: a.isError || isError, task: ok ? 'encore!' : `stopped: ${e.reason}` })))
      const b = await read($, band)
      const a = b.agents.find(x => x.id === id)
      if (a !== undefined) {
        const m = MEMBERS[a.member]
        toast($, `${ok ? m.faces.happy : m.faces.panic} ${m.name} ${ok ? 'finished' : 'stopped'}: ${a.description.slice(0, 50)} · ${fmtTokens(a.usage.input + a.usage.cacheRead + a.usage.cacheWrite + a.usage.output)} · ≈${fmtUsd(a.cost)}`, 'chatter')
      }
      return r
    }
    await update($, band, b => patchAgent({ ...b, isWorking: false }, 'main', a => ({ ...a, status: 'idle' })))
    const edits = pendingTracks.length
    if (edits > 0) {
      const tracks = pendingTracks.slice(-MAX_TRACKS)
      pendingTracks = []
      const setlist = await update($, replay, x => ({ ...x, tracks, index: 0, setlist: x.setlist + 1 }))
      if (e.reason === 'answer' && !setlist.isOpen && canDraw()) suggestReplay($, tracks.length)
    }
    await update($, cache, c => ({ ...c, lastWarmAt: now }))
    // A long set may have played to an empty room: its end is announced (an interrupted one had the person there).
    if (e.durationMs >= SET_AWAY_MS && e.reason !== 'aborted') {
      const took = fmtDuration(e.durationMs)
      void notify($, e.reason === 'answer' ? `Nijika: the set is done after ${took}${edits > 0 ? ` · ${edits} ${edits === 1 ? 'edit' : 'edits'} on the setlist (/replay)` : ''}` : `Nijika: the set stopped on ${e.reason} after ${took}`)
    }
    if (e.reason === 'answer') await setMood($, 'happy', `${MEMBERS.bocchi.lines.happy} ${fmtDuration(e.durationMs)}${edits > 0 ? ` · ${edits} ${edits === 1 ? 'edit' : 'edits'} on the setlist (/replay)` : ''}`, 6000)
    else if (e.reason === 'aborted') await setMood($, 'hiding', 'interrupted… hiding in the box', 8000)
    else await setMood($, 'panic', `the turn ended on ${e.reason}`, 8000)
    await refreshUsage($).catch(() => undefined)
    return r
  })

  on('session.measure', async ($, e, next) => {
    await applyUsage($, e).catch(() => undefined)
    return next(e)
  })

  // -- compaction: Bocchi melts while the set is compacted; afterwards the figures are the compacted set's ----
  on('session.compact', async ($, e, next) => {
    // A subagent's transcript, or the engine's precompute pass (it installs nothing): not the band's business.
    if (e.agentId !== undefined || e.trigger === 'precompute') return next(e)
    isCompacting = true
    await setMood($, 'melting', 'compacting the set…').catch(() => undefined)
    const r = await next(e).catch(async (error: unknown) => {
      // The compaction failed: the engine says so; Bocchi only comes back.
      isCompacting = false
      await revertMood($).catch(() => undefined)
      throw error
    })
    isCompacting = false
    try {
      if (r.skip === undefined) await settleCompaction($, r.tokensBefore, r.tokensAfter)
      else await revertMood($)
    } catch {
      // the figures could not be reset here; the next measurement sets them
    }
    return r
  }).catch(($, e, next) => next(e))

  on('classic.PostModelSwitch', async ($, e, next) => {
    // The engine's TTL wins only while the person kept the default; a configured TTL is theirs.
    if (opts.isTtlDefault) ttlOverrideMs = e.cache_ttl === '5m' ? 5 * 60_000 : 60 * 60_000
    // The engine priced the re-cache itself; Cache Tax prefers that figure while the model matches.
    await update($, cache, c => ({
      ...c,
      model: e.to_model || c.model,
      engineModel: e.to_model || c.engineModel,
      engineWriteUsd: typeof e.estimated_cache_write_usd === 'number' ? e.estimated_cache_write_usd : c.engineWriteUsd,
      contextTokens: typeof e.context_tokens === 'number' && e.context_tokens > 0 ? e.context_tokens : c.contextTokens,
      lastWarmAt: e.prompt_cache_warm === false ? 0 : c.lastWarmAt,
    }))
    return next(e)
  }).catch(($, e, next) => next(e))

  // -- subagents -------------------------------------------------------------------
  on('agent.spawn', async ($, e, next) => {
    const r = await next(e)
    if (r.deny !== undefined || r.agentId === undefined) return r
    const now = await $.clock.now()
    // A band type seats by name; any other, by the keyword tables.
    const isNamed = seatOf(e.subagentType) !== null
    const member = memberFor({ type: e.subagentType, description: e.description, prompt: e.prompt, background: e.background })
    await upsertAgent($, {
      ...mainAgent(),
      id: r.agentId,
      member,
      description: e.description || e.subagentType,
      type: e.subagentType,
      status: 'running',
      task: 'warming up',
      startedAt: now,
      model: r.model || e.model || '',
    })
    ensureTick($)
    const m = MEMBERS[member]
    toast($, `${m.faces.focused} ${m.name} takes the stage: ${e.description.slice(0, 60)}${isNamed ? ` (seated by name: ${e.subagentType})` : ''}`, 'chatter')
    return r
  }).catch(($, e, next) => next(e))

  on('classic.SubagentStart', async ($, e, next) => {
    const now = await $.clock.now()
    const seated: KessokuAgent = { ...mainAgent(), id: e.agent_id, member: memberFor({ type: e.agent_type, description: '', prompt: '', background: false }), description: e.agent_type, type: e.agent_type, status: 'running', startedAt: now }
    // Only an act no spawn has seated, decided inside the write: the engine starts the subagent while the spawn's
    // hook is still seating it, and a check made before the write let this bare act land over the spawn's.
    await update($, band, b => (b.agents.some(a => a.id === e.agent_id) ? b : { ...b, agents: trimAgents([...b.agents, seated]) }))
    ensureTick($)
    return next(e)
  }).catch(($, e, next) => next(e))

  on('classic.SubagentStop', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, band, b => patchAgent(b, e.agent_id, a => (isLive(a) ? { ...a, status: 'completed', endedAt: now } : a)))
    return next(e)
  }).catch(($, e, next) => next(e))

  // -- tool calls: the guard, the lights, the setlist, the task line ----------------
  on('tool.call', async ($, e, next) => {
    const input = e as unknown as Record<string, unknown>
    const tool = String(e.tool)
    const agentId = e.agentId

    // The guard, where someone can answer it: a headless run with no screen is the person's own permission settings' business.
    if (SHELL_TOOLS.has(tool)) {
      const command = readField(input, 'command')
      const risk = tool === 'PowerShell' ? classifyPowerShell(command) : classify(command)
      if (risk !== null && (canDraw() || (await $.session.surfaces().catch(() => [])).length > 0)) {
        hasSurface = true
        const verdict = await holdForDecision($, next.signal, command, risk)
        if (verdict.kind === 'deny') return { deny: verdict.reason }
      }
    }

    const filePath = readField(input, 'file_path') || readField(input, 'notebook_path')
    const isEdit = EDIT_TOOLS.has(tool)
    // The bookkeeping before the call runs alongside it, never ahead of it: the tool is not kept waiting.
    const pre = (async (): Promise<KessokuMember> => {
      const member = agentId === undefined ? 'bocchi' : ((await read($, band)).agents.find(a => a.id === agentId)?.member ?? 'bocchi')
      await noteTask($, agentId, describeCall(tool, input, cwd))
      if (isEdit && filePath !== '') await light($, filePath, 'editing', member)
      else if (tool === 'Read' && filePath !== '') await light($, filePath, 'read', member)
      return member
    })().catch((): KessokuMember => 'bocchi')

    // A band type spelled short (`kessoku:ryo`) goes to the Agent tool as the type the engine registered, which it
    // resolves before any spawn hook could rename it.
    const alias = tool === 'Agent' ? registeredType(readField(input, 'subagent_type')) : null
    const ran = await next(alias === null ? e : ({ ...e, subagent_type: alias } as typeof e))
    const member = await pre

    const failed = ran.deny === undefined && ran.isError === true
    if (isEdit && filePath !== '') await light($, filePath, failed ? 'read' : 'edited', member)
    if (isEdit && ran.deny === undefined && !failed) {
      try {
        pendingTracks.push(...tracksFor(tool, input, (ran as { result?: unknown }).result, member))
      } catch {
        // recording must never stop the edit
      }
    }
    if (failed) {
      const why = `${tool}${agentId ? ` (${MEMBERS[member].name})` : ''}: ${(ran.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)}`
      await update($, band, b => patchAgent({ ...b, lastError: why }, agentId ?? 'main', a => ({ ...a, isError: true })))
      if (agentId === undefined) await setMood($, 'panic', `wrong note in ${tool}`, 5000)
    }
    if (SHELL_TOOLS.has(tool) && !failed && isGitCommit(readField(input, 'command'))) await commitLights($, member)
    return ran
  }).catch(($, e, next) => {
    if (next.called) return next(e)
    const command = typeof (e as Record<string, unknown>).command === 'string' ? ((e as Record<string, unknown>).command as string) : ''
    const tool = String(e.tool)
    const risky = canDraw() && SHELL_TOOLS.has(tool) && (tool === 'PowerShell' ? classifyPowerShell(command) : classify(command)) !== null
    return risky ? { deny: 'Kessoku Blast Radius: its guard failed while holding this risky command, so it did not run. Do not retry it unless the user asks you to.' } : next(e)
  })

  // -- the memo tool: the mod's own tool, answered here (beneath the bookkeeping above); no Haiku call, the rule arrives written --
  // The matcher is spelled out (it is MEMO_TOOL) so the host reads it off the source.
  on('tool.call', { tool: 'mcp__kessoku-ultimate-bocchi__memo' }, async ($, e) => proposeRule($, e as unknown as Record<string, unknown>, e.agentId)).catch(() => ({
    deny: 'Kessoku memo: Nijika dropped her pen, so nothing was proposed. Say the rule in your reply instead.',
  }))

  // -- prompts: Cache Tax and Reflect --------------------------------------------
  on('prompt.submit', async ($, e, next) => {
    if (!isPersonPrompt(e.origin.kind)) return next(e)
    const text = e.text
    const c = await read($, cache)
    const b = await read($, band)
    const now = await $.clock.now()
    // The one held prompt, re-sent in time, passes; anything else is judged afresh.
    const isResend = c.isArmed && now - c.heldAt < HELD_PROMPT_MS && (c.heldText === '' || c.heldText === text)
    if (c.isArmed) await update($, cache, x => ({ ...x, isArmed: false, heldAt: 0, heldText: '' }))
    if (!isResend && !b.isWorking && canResend(e.origin.kind) && c.lastWarmAt > 0 && c.contextTokens >= TAX_MIN_TOKENS && now - c.lastWarmAt > ttlMs()) {
      hasSurface = hasSurface || (await $.session.surfaces().catch(() => [])).length > 0
      if (!canDraw()) return next(e)
      const heldUsd = coldWriteUsd(c)
      const warmUsd = (c.contextTokens * priceInfo(c.model || 'default').price.cacheRead) / 1_000_000
      const next_ = await update($, cache, x => ({ ...x, isArmed: true, heldAt: now, heldText: text, heldUsd, warmUsd }))
      await setMood($, 'panic', `cache tax ≈${fmtUsd(heldUsd)}!!`)
      $.clock.after(250, () => {
        void (async () => {
          const filled = await $.prompt.fill({ text, mode: 'replace' })
          if (!filled.isFilled) {
            toast($, `${MEMBERS.bocchi.faces.panic} cache tax: your prompt could not be put back; it was: ${text.slice(0, 80)}`)
            await update($, cache, x => ({ ...x, isArmed: false, heldAt: 0, heldText: '' }))
          }
        })().catch(() => undefined)
      })
      return { drop: cacheTaxReason(next_, now) }
    }
    if (opts.reflect && looksLikeCorrection(text)) {
      $.clock.after(30, () => {
        void draftMemo($, text)
      })
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // -- the typeahead: /bocchi's sub-commands and /keepwarm's durations, beneath the engine's own rows ------
  on('prompt.autocomplete', async ($, e, next) => {
    const mine = completions(e)
    if (mine.length === 0) return next(e)
    const r = await next(e)
    return { suggestions: [...r.suggestions, ...mine] }
  }).catch(($, e, next) => next(e))

  // -- the theme row: follow it once written, so the charcoal backgrounds know light from dark ------
  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const r = await next(e)
    if (r.deny === undefined) isLightTheme = isLightValue(r.value)
    return r
  }).catch(($, e, next) => next(e))

  // -- panes closing ---------------------------------------------------------------
  on('ui.close', async ($, e, next) => {
    if (e.id === PANEL) await update($, ui, x => ({ ...x, isPanelOpen: false, panelWhere: 'none' as const }))
    else if (e.id === TREE) await update($, tree, x => ({ ...x, isOpen: false, isBand: false }))
    else if (e.id === REPLAY) await update($, replay, x => ({ ...x, isOpen: false, inBand: false }))
    else if (e.id === BLAST && e.origin.kind !== 'unload' && held !== null && held.decision === null) held.decision = 'closed'
    const r = await next(e)
    // Once it is closed: a drawing that was on its way registers nothing for it either.
    dropSprites(e.id)
    return r
  }).catch(($, e, next) => next(e))

  // -- drawing: other mods' elements, restyled when asked ----------------------------
  on('ui.resolve', async ($, e, next) => {
    const table = await next(e)
    if (!opts.restyleOthers) return table
    const Box = table.Box
    const Text = table.Text
    const restyledBox = ((p: Parameters<typeof Box>[0]) => Box(p.borderStyle !== undefined && p.borderColor === undefined ? { ...p, borderColor: opts.accent } : p)) as typeof Box
    const restyledText = ((p: Parameters<typeof Text>[0]) => Text(p.color === undefined && p.dimColor !== true && p.backgroundColor === undefined ? { ...p, color: 'text' } : p)) as typeof Text
    return { ...table, Box: restyledBox, Text: restyledText }
  })

  // -- drawing: the skin -----------------------------------------------------------
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    const inner = await next(e)
    const tool = e.props.tool
    const isEdit = EDIT_TOOLS.has(tool)
    const isMemo = tool === MEMO_TOOL
    if (opts.toolCards === 'none' || (opts.toolCards === 'edits' && !isEdit && !isMemo)) return inner
    const { Box, Text } = $.ui.resolve(e)
    // The memo tool's row is Nijika's card title: a rule proposed, held for the person's Save.
    if (isMemo) {
      const n = MEMBERS.nijika
      const tint = e.props.isErrored ? 'error' : n.color
      return (
        <Box flexDirection="column" borderStyle="round" borderColor={tint} borderDimColor={!e.props.isRunning && !e.props.isErrored} paddingX={1}>
          <Text wrap="truncate-end">
            <Text color={tint} bold>♪ kessoku memo · {e.props.isErrored ? 'sent back' : e.props.isRunning ? 'proposing a rule' : 'proposed a rule'}</Text>
            <Text dimColor> · {e.props.isErrored ? `${n.faces.panic} Nijika could not take it` : `${n.faces.focused} Nijika holds it for Save`}</Text>
          </Text>
          {inner}
        </Box>
      )
    }
    const m = MEMBERS[memberForTool(tool)]
    const color = e.props.isErrored ? 'error' : e.props.isRunning ? opts.accent : PALETTE.rose
    const state = e.props.isErrored ? 'wrong note' : e.props.isInterrupted ? 'cut off' : e.props.isRunning ? 'playing' : '♪'
    const header = (
      <Text wrap="truncate-end">
        <Text color={color} bold>{isEdit ? '♫' : '♪'} {tool}</Text>
        <Text dimColor> · {m.faces[e.props.isErrored ? 'panic' : e.props.isRunning ? 'focused' : 'happy']} {m.name} · {state}</Text>
      </Text>
    )
    // An edit is a setlist card with a frame; any other call is one header line over the engine's row, so the transcript stays short.
    if (!isEdit) {
      return (
        <Box flexDirection="column">
          {header}
          {inner}
        </Box>
      )
    }
    return (
      <Box flexDirection="column" borderStyle="round" borderColor={color} borderDimColor={!e.props.isRunning && !e.props.isErrored} paddingX={1}>
        {header}
        {inner}
      </Box>
    )
  })

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    const inner = await next(e)
    if (opts.toolCards === 'none' || !EDIT_TOOLS.has(e.props.tool)) return inner
    const { Box, Text } = $.ui.resolve(e)
    const out = (e.props.output ?? {}) as Record<string, unknown>
    const file = relPath(cwd, readField(out, 'filePath') || readField(out, 'file_path') || readField(out, 'notebook_path'))
    const diff = out.gitDiff as { additions?: number; deletions?: number } | undefined
    const counts = diff && typeof diff.additions === 'number' && typeof diff.deletions === 'number' ? ` · +${diff.additions} -${diff.deletions}` : ''
    const color = e.props.isErrored ? 'error' : opts.accent
    return (
      <Box flexDirection="column" borderStyle="single" borderColor={color} borderDimColor paddingX={1}>
        <Text wrap="truncate-end">
          <Text color={color} bold>♫ setlist · {file || e.props.tool}</Text>
          <Text dimColor> · {MEMBERS.kita.faces[e.props.isErrored ? 'panic' : 'happy']} {e.props.isErrored ? 'Kita missed a chord' : 'Kita approves'}{counts}</Text>
        </Text>
        {inner}
      </Box>
    )
  })

  on('ui.render', { component: 'Spinner' }, ($, e, next) => {
    if (opts.transcriptSkin === 'none') return next(e)
    const suffix = e.props.mode === 'tool-use' ? ' ♪' : e.props.mode === 'responding' ? ' ♫' : '…'
    if (e.surface === 'terminal' && opts.spinnerWords) {
      const words = SPINNER_WORDS_BY_MODE[e.props.mode] ?? SPINNER_WORDS
      return next({ ...e, props: { ...e.props, word: pick(words, e.props.word), suffix } })
    }
    return next({ ...e, props: { ...e.props, suffix } })
  })

  on('ui.render', { component: 'SessionMode' }, ($, e, next) => {
    if (opts.transcriptSkin === 'none') return next(e)
    return next({ ...e, props: { ...e.props, modes: [...e.props.modes, '♪ kessoku'] } })
  })

  on('ui.render', { component: 'TurnDuration' }, ($, e, next) => {
    if (opts.transcriptSkin === 'none') return next(e)
    return next({ ...e, props: { ...e.props, word: pick(TURN_WORDS, e.requestId) } })
  })

  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    if (opts.transcriptSkin === 'none' || e.props.isDraft) return next(e)
    const b = await read($, band)
    const face = MEMBERS.bocchi.faces[b.mood]
    return next({ ...e, props: { ...e.props, tail: ` ♪ ${face}${e.props.isWorking ? '' : ' /bocchi help'}` } })
  })

  on('ui.render', { component: 'ToolProgress' }, ($, e, next) => {
    if (opts.transcriptSkin === 'none' || !e.props.hint.includes('run in background')) return next(e)
    return next({ ...e, props: { ...e.props, hint: e.props.hint.replace('run in background', 'let Ryo take it backstage') } })
  })

  on('ui.render', { component: 'InfoNotice' }, ($, e, next) => {
    if (opts.transcriptSkin === 'none' || e.props.text.startsWith('♪')) return next(e)
    return next({ ...e, props: { ...e.props, text: `♪ ${e.props.text}` } })
  })

  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    const inner = await next(e)
    if (opts.transcriptSkin !== 'full' || e.props.isExpanded || e.props.origin.kind !== 'composer') return inner
    const { Box } = $.ui.resolve(e)
    return (
      <Box flexDirection="column" borderStyle="quote" borderColor={opts.accent}>
        {inner}
      </Box>
    )
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const inner = await next(e)
    if (opts.transcriptSkin !== 'full') return inner
    const { Box } = $.ui.resolve(e)
    return (
      <Box flexDirection="column" borderStyle="quote" borderColor={MEMBERS.bocchi.color} borderDimColor={e.props.isSummary === true}>
        {inner}
      </Box>
    )
  })

  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const inner = await next(e)
    if (opts.transcriptSkin !== 'full' || e.props.isExpanded) return inner
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={1}>
        <Text color={e.props.isActive ? opts.accent : PALETTE.rose}>♪</Text>
        {inner}
      </Box>
    )
  })

  on('ui.render', { component: 'CommandOutput' }, async ($, e, next) => {
    if (opts.transcriptSkin !== 'full' || !OWN_COMMANDS.has(e.props.command)) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const color = e.props.isErrored ? 'error' : opts.accent
    const lines = e.props.text.split('\n')
    return (
      <Box flexDirection="column" borderStyle="round" borderColor={color} borderDimColor paddingX={1}>
        <Text color={color} bold>♪ /{e.props.command}{e.props.args ? ` ${e.props.args}` : ''}</Text>
        {lines.map((line, i) => (
          <Text key={`c${i}`} color={e.props.isErrored ? 'error' : 'text'} wrap="wrap">
            {line}
          </Text>
        ))}
      </Box>
    )
  })

  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    const inner = await next(e)
    if (opts.transcriptSkin !== 'full') return inner
    const { Box, Text } = $.ui.resolve(e)
    const n = MEMBERS.nijika
    const now = await $.clock.now()
    beginSprites(e)
    const sprite = drawSprite($, e, headSprite('ask-sprite', e, 'nijika', 'focused'), now)
    if (sprite !== null) {
      return (
        <Box flexDirection="column">
          <Box flexDirection="row" gap={1} alignItems="center">
            {sprite}
            <Text color={n.color} bold>Nijika asks the band</Text>
          </Box>
          {inner}
        </Box>
      )
    }
    return (
      <Box flexDirection="column">
        <Text color={n.color} bold>{n.faces.focused} Nijika asks the band</Text>
        {inner}
      </Box>
    )
  })

  // -- drawing: panes, one hook per pane so other mods' panes never run this module -------
  // A drawing that may hold sprites marks its site first (beginSprites), after its reads and before it draws.
  on('ui.render', { component: 'Pane', requestId: PANEL }, async ($, e) => {
    const now = await $.clock.now()
    const b = await read($, band)
    const c = await read($, cache)
    beginSprites(e)
    return drawPanel($, e, b, c, now, false)
  })
  on('ui.render', { component: 'Pane', requestId: TREE }, async ($, e) => {
    const now = await $.clock.now()
    return drawTree($, e, await read($, tree), await read($, frame), now)
  })
  on('ui.render', { component: 'Pane', requestId: BLAST }, async ($, e) => {
    const s = await read($, blast)
    const now = await $.clock.now()
    beginSprites(e)
    if (s === null) {
      const { Text } = $.ui.resolve(e)
      return <Text dimColor>the guitar is safe.</Text>
    }
    return drawBlast($, e, s, now)
  })
  on('ui.render', { component: 'Pane', requestId: REPLAY }, async ($, e) => {
    const r = await read($, replay)
    const now = await $.clock.now()
    beginSprites(e)
    if (!r.isOpen) {
      const { Text } = $.ui.resolve(e)
      return <Text dimColor>No setlist open.</Text>
    }
    return drawReplay($, e, r, false, now)
  })

  // -- drawing: the band above the prompt, by priority ---------------------------------
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    bandRequestId = e.requestId
    if (e.props.hasSurvey) {
      beginSprites(e)
      return next(e)
    }
    const now = await $.clock.now()
    const s = await read($, blast)
    if (s !== null && s.isHeld && s.where === 'band') {
      beginSprites(e)
      return drawBlast($, e, s, now)
    }
    const c = await read($, cache)
    if (c.heldAt > 0 && now - c.heldAt < HELD_PROMPT_MS) {
      beginSprites(e)
      return drawCacheTax($, e, c, now)
    }
    const m = await read($, memo)
    if (m !== null && m.status !== 'skipped') {
      beginSprites(e)
      return drawMemo($, e, m, now)
    }
    const r = await read($, replay)
    const t = await read($, tree)
    const u = await read($, ui)
    const b = await read($, band)
    const beat = t.isOpen && t.isBand ? await read($, frame) : 0
    // Other mods' bands stack under this one's drawing rather than vanishing behind it.
    const { Box } = $.ui.resolve(e)
    const below = await next(e)
    const stack = (top: Draw): Draw => (
      <Box flexDirection="column">
        {top}
        {below}
      </Box>
    )
    beginSprites(e)
    if (r.isOpen && r.inBand) return stack(drawReplay($, e, r, true, now))
    if (t.isOpen && t.isBand) return stack(drawTree($, e, t, beat, now))
    if (u.isPanelOpen && u.panelWhere === 'band') return stack(drawPanel($, e, b, c, now, true))
    if (u.isStripHidden) return below
    // The strip's heads take four rows on a terminal: only where the band has them to spare beside whatever stacks below;
    // the row of slimes under them three more, so seven in all.
    // The engine answers its own band as a bare engine reference: anything else is another mod's drawing.
    const hasBelow = below.type !== 'engine'
    const isRoomy = e.surface !== 'terminal' || e.props.maxRows >= (hasBelow ? 10 : 6)
    const slimeRoom = e.surface !== 'terminal' || e.props.maxRows >= (hasBelow ? 11 : 7)
    return stack(drawStrip($, e, b, c, r, now, isRoomy, slimeRoom))
  })
}
