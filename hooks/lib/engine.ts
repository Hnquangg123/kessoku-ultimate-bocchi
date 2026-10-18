// Kessoku Ultimate Bocchi Theme: the engine the mod runs on.
//
// Pure, no `$` and no `on`: the engine version the mod is written for, how
// versions compare, the features that lean on an engine API the gate probes,
// and the lines help says about them.

/** The oldest Claude Code the mod is written for (the README's floor). */
export const MIN_ENGINE = '2.1.287'

/**
 * The features that lean on a newer engine call, each switched off for the
 * session when the call turns out not to exist. (A hook the engine does not
 * know, such as `session.compact` on an engine before it, refuses the whole
 * module at load, so the hooks are not gated: the floor for them is the
 * engine version the README names.)
 */
export type FeatureKey = 'suggest' | 'notify' | 'version' | 'agents' | 'memo'

/** What each feature needs of the engine, and how help names it. */
export const FEATURES: Readonly<Record<FeatureKey, { api: string; label: string }>> = {
  suggest: { api: '$.prompt.suggest', label: 'the Replay suggestion' },
  notify: { api: '$.ui.notify', label: 'native notifications' },
  version: { api: '$.session.version', label: 'the engine version' },
  agents: { api: '$.agent.register', label: 'the band agent types' },
  memo: { api: '$.tool.register', label: 'the memo tool' },
}

/** `2.1.299`, `2.1.299-dev`, `2.1.280-dev.20260920.t101500.sha1a2b3c4`, `v2.1.1` as their three numbers; null for anything that does not open as a release. */
export function parseVersion(text: string): [number, number, number] | null {
  const m = /^\s*v?(\d+)\.(\d+)\.(\d+)/.exec(text)
  return m === null ? null : [Number(m[1]), Number(m[2]), Number(m[3])]
}

/** Whether `version` is at least `min`, number by number; false for a version that does not parse. */
export function isAtLeast(version: string, min: string): boolean {
  const a = parseVersion(version)
  const b = parseVersion(min)
  if (a === null || b === null) return false
  for (let i = 0; i < 3; i += 1) {
    const x = a[i] as number
    const y = b[i] as number
    if (x !== y) return x > y
  }
  return true
}

/** Help's opening line: the mod's version (when its manifest could be read) and the engine's, with a word when the engine is older than expected. */
export function versionLine(mod: string, engine: string): string {
  const modWord = mod === '' ? '' : ` v${mod}`
  const engineWord = engine === '' ? 'Claude Code (version unknown)' : `Claude Code ${engine}${isAtLeast(engine, MIN_ENGINE) ? '' : ` (older than the mod expects, ${MIN_ENGINE}+)`}`
  return `♪ Kessoku Ultimate Bocchi Theme${modWord} · ${engineWord}`
}

/** Help's line naming the features that are off on this engine, each with the API it misses; '' when every one is on. */
export function offLine(features: Readonly<Record<FeatureKey, boolean>>): string {
  const off = (Object.keys(FEATURES) as FeatureKey[]).filter(k => !features[k]).map(k => `${FEATURES[k].label} (no ${FEATURES[k].api})`)
  return off.length === 0 ? '' : `off on this engine: ${off.join(', ')}`
}
