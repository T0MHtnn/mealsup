export interface DetectedTimer {
  label: string
  seconds: number
}

/**
 * Durations mentioned in a recipe step, to offer one-tap timers:
 * "cuire 12 min" -> 12 min, "6 à 7 min" -> 6 min (check early, extend if needed),
 * "1h30" / "2h" -> hours, "30 secondes" -> seconds. Temperatures (°C) are ignored.
 */
export function detectTimers(text: string): DetectedTimer[] {
  const found: DetectedTimer[] = []
  const add = (seconds: number, label: string) => {
    if (seconds > 0 && seconds <= 24 * 3600 && !found.some((t) => t.seconds === seconds)) found.push({ label, seconds })
  }

  // 1h30, 1 h 15, 2h, 2 heures
  const hourRe = /(\d+)\s*(?:h|heures?)(?:\s*(\d{1,2}))?(?![a-zà-ÿ])/gi
  let m: RegExpExecArray | null
  while ((m = hourRe.exec(text))) {
    const h = Number(m[1])
    const min = m[2] ? Number(m[2]) : 0
    add(h * 3600 + min * 60, min ? `${h} h ${String(min).padStart(2, '0')}` : `${h} h`)
  }

  // 12 min, 6 à 7 min, 10-12 minutes
  const minRe = /(\d+)(?:\s*(?:à|-)\s*\d+)?\s*min(?:utes?)?\b/gi
  while ((m = minRe.exec(text))) {
    const min = Number(m[1])
    add(min * 60, `${min} min`)
  }

  // 30 secondes, 20 s
  const secRe = /(\d+)(?:\s*(?:à|-)\s*\d+)?\s*(?:secondes?|sec|s)\b/gi
  while ((m = secRe.exec(text))) {
    const sec = Number(m[1])
    add(sec, `${sec} s`)
  }

  return found.slice(0, 3)
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
