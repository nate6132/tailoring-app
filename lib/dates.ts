export function getDefaultDueDate(from: Date = new Date()): string {
  const date = new Date(from)
  const day = date.getDay()

  // day: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const daysToAdd: Record<number, number> = {
    0: 5,  // Sunday → Friday (5 days)
    1: 6,  // Monday → Sunday (6 days)
    2: 6,  // Tuesday → Monday (6 days)
    3: 6,  // Wednesday → Tuesday (6 days)
    4: 6,  // Thursday → Wednesday (6 days)
    5: 6,  // Friday → Thursday (6 days)
    6: 6,  // Saturday → Friday (6 days)
  }

  date.setDate(date.getDate() + daysToAdd[day])
  return date.toISOString().split('T')[0]
}