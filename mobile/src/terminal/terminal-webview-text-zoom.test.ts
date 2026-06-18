import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const terminalWebViewSource = readFileSync(
  new URL('./TerminalWebView.tsx', import.meta.url),
  'utf8'
)
const terminalHtmlSource = readFileSync(
  new URL('./terminal-webview-html.ts', import.meta.url),
  'utf8'
)

describe('TerminalWebView text zoom', () => {
  it('pins textZoom to 100 so Android system font scale cannot inflate glyphs past xterm cell metrics', () => {
    const start = terminalWebViewSource.indexOf('<WebView')
    expect(start).toBeGreaterThanOrEqual(0)
    const end = terminalWebViewSource.indexOf('/>', start)
    expect(end).toBeGreaterThan(start)
    const webViewProps = terminalWebViewSource.slice(start, end)
    expect(webViewProps).toContain('textZoom={100}')
  })

  it('keeps the HTML source object stable so parent renders do not reload xterm', () => {
    const start = terminalWebViewSource.indexOf('<WebView')
    expect(start).toBeGreaterThanOrEqual(0)
    const end = terminalWebViewSource.indexOf('/>', start)
    expect(end).toBeGreaterThan(start)
    const webViewProps = terminalWebViewSource.slice(start, end)
    expect(terminalWebViewSource).toContain('const XTERM_WEBVIEW_SOURCE = { html: XTERM_HTML }')
    expect(webViewProps).toContain('source={XTERM_WEBVIEW_SOURCE}')
    expect(webViewProps).not.toContain('source={{ html: XTERM_HTML }}')
  })

  it('forces the Claude status dot to text presentation before xterm writes', () => {
    expect(terminalHtmlSource).toContain('font-variant-emoji: text')
    expect(terminalHtmlSource).toContain('var CLAUDE_STATUS_DOT = String.fromCharCode(0x23fa)')
    expect(terminalHtmlSource).toContain('TEXT_PRESENTATION_SELECTOR = String.fromCharCode(0xfe0e)')
    expect(terminalHtmlSource).toContain('function normalizeStatusDotPresentation(data)')
    expect(terminalHtmlSource).toContain(
      'data.replace(CLAUDE_STATUS_DOT_PATTERN, CLAUDE_STATUS_DOT + TEXT_PRESENTATION_SELECTOR)'
    )
    expect(terminalHtmlSource).toContain('writeQueue.push(normalizeStatusDotPresentation(data))')
  })

  it('loads Unicode 11 before replaying mobile terminal bytes', () => {
    expect(terminalHtmlSource).toContain('@xterm/xterm@6.1.0-beta.285')
    expect(terminalHtmlSource).toContain('@xterm/addon-unicode11@0.10.0-beta.285')
    const open = terminalHtmlSource.indexOf('term.open(surface)')
    const unicode = terminalHtmlSource.indexOf("term.unicode.activeVersion = '11'")
    const replay = terminalHtmlSource.indexOf('enqueueWrite(replayData)')
    expect(open).toBeGreaterThanOrEqual(0)
    expect(unicode).toBeGreaterThan(open)
    expect(replay).toBeGreaterThan(unicode)
  })

  it('uses the newer WebGL-capable xterm stack and desktop font fallbacks', () => {
    expect(terminalHtmlSource).toContain('@xterm/addon-webgl@0.20.0-beta.285')
    expect(terminalHtmlSource).toContain('"SF Mono", "Menlo", "Monaco", "Cascadia Mono"')
    expect(terminalHtmlSource).toContain("fontWeight: '300'")
    expect(terminalHtmlSource).toContain("fontWeightBold: '500'")
    expect(terminalHtmlSource).toContain('new window.WebglAddon.WebglAddon()')
  })
})
