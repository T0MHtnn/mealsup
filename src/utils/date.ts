/** Monday-start week containing `reference`, as 7 Date objects. */
export function getWeekDates(reference: Date): Date[] {
  const day = reference.getDay() // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(reference)
  monday.setDate(reference.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b)
}

/** "45 min" under an hour, otherwise "1 h", "1 h 30", "2 h 05". */
export function formatDuration(totalMins: number): string {
  if (totalMins < 60) return `${totalMins} min`
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  return mins === 0 ? `${hours} h` : `${hours} h ${String(mins).padStart(2, '0')}`
}
