import { logDebug } from './debugLog'

/** iOS (incl. iPadOS, which reports as "MacIntel" but has touch support) —
 * jsPDF's doc.save() (an anchor-click blob download) doesn't reliably work
 * there, so PDF export routes through the Web Share API / a pre-opened tab
 * instead. See services/pdf.ts's savePdf(). */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIPhoneOrIPod = /iP(hone|od)/.test(ua)
  const isIPad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return isIPhoneOrIPod || isIPad
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean }

/** True when running as the installed Home Screen app (standalone display
 * mode), as opposed to a regular browser tab. iOS Safari's storage for a
 * standalone-launched app is not always the same partition as its regular
 * browsing storage — see StandaloneRecoveryBanner.tsx, which uses this to
 * detect the "installed app shows no data" scenario. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  const iosStandaloneFlag = (navigator as NavigatorWithStandalone).standalone === true
  return displayModeStandalone || iosStandaloneFlag
}

/** Must be called synchronously inside the click handler, before any
 * `await` — that's what makes the resulting window.open() count as a
 * direct result of the user gesture, so Safari doesn't popup-block it. The
 * window is later either closed (if navigator.share ends up handling the
 * PDF) or navigated to the finished PDF's blob URL by savePdf(). A
 * window.open() called *after* async work (e.g. building the PDF) is what
 * silently failed before — Safari blocks that one. No-op on non-iOS. */
export function openIOSPlaceholderWindow(): Window | null {
  if (!isIOS()) return null
  logDebug('pdf', 'iOS detected — pre-opening a blank tab synchronously (survives Safari popup blocking)')
  const win = window.open('', '_blank')
  logDebug('pdf', 'pre-opened window reference', { hasWindow: Boolean(win) })
  return win
}
