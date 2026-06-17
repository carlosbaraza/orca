import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./TerminalWebView.tsx', import.meta.url), 'utf8')

describe('TerminalWebView text zoom', () => {
  it('pins textZoom to 100 so Android system font scale cannot inflate glyphs past xterm cell metrics', () => {
    const start = source.indexOf('<WebView')
    expect(start).toBeGreaterThanOrEqual(0)
    const end = source.indexOf('/>', start)
    expect(end).toBeGreaterThan(start)
    const webViewProps = source.slice(start, end)
    expect(webViewProps).toContain('textZoom={100}')
  })

  it('forces the Claude status dot to text presentation before xterm writes', () => {
    expect(source).toContain('font-variant-emoji: text')
    expect(source).toContain('var CLAUDE_STATUS_DOT = String.fromCharCode(0x23fa)')
    expect(source).toContain('TEXT_PRESENTATION_SELECTOR = String.fromCharCode(0xfe0e)')
    expect(source).toContain('function normalizeStatusDotPresentation(data)')
    expect(source).toContain(
      'data.replace(CLAUDE_STATUS_DOT_PATTERN, CLAUDE_STATUS_DOT + TEXT_PRESENTATION_SELECTOR)'
    )
    expect(source).toContain('writeQueue.push(normalizeStatusDotPresentation(data))')
  })

  it('loads Unicode 11 before replaying mobile terminal bytes', () => {
    expect(source).toContain('@xterm/xterm@6.1.0-beta.285')
    expect(source).toContain('@xterm/addon-unicode11@0.10.0-beta.285')
    const open = source.indexOf('term.open(surface)')
    const unicode = source.indexOf("term.unicode.activeVersion = '11'")
    const replay = source.indexOf('enqueueWrite(replayData)')
    expect(open).toBeGreaterThanOrEqual(0)
    expect(unicode).toBeGreaterThan(open)
    expect(replay).toBeGreaterThan(unicode)
  })

  it('uses the newer WebGL-capable xterm stack and desktop font fallbacks', () => {
    expect(source).toContain('@xterm/addon-webgl@0.20.0-beta.285')
    expect(source).toContain('"SF Mono", "Menlo", "Monaco", "Cascadia Mono"')
    expect(source).toContain("fontWeight: '300'")
    expect(source).toContain("fontWeightBold: '500'")
    expect(source).toContain('new window.WebglAddon.WebglAddon()')
  })
})
