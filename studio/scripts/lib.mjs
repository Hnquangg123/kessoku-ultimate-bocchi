// Shared by the studio's rendering scripts: bundle the compositions once, open
// one headless browser, and read the compositions out of the bundle.

import path from 'node:path'
import { bundle } from '@remotion/bundler'
import { getCompositions, openBrowser } from '@remotion/renderer'
import { OUT, STUDIO } from './studio.mjs'

export { OUT, STUDIO }

export async function open() {
  const t0 = Date.now()
  const serveUrl = await bundle({ entryPoint: path.join(STUDIO, 'src', 'index.ts'), onProgress: () => undefined })
  const browser = await openBrowser('chrome', { logLevel: 'error' })
  const compositions = await getCompositions(serveUrl, { puppeteerInstance: browser, logLevel: 'error' })
  console.log(`bundled ${compositions.length} compositions in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  return { serveUrl, browser, compositions }
}
