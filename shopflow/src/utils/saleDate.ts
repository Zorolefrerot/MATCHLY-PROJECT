export function parseSaleDate(timestamp: string): Date | null {
  const value = timestamp.trim();
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dayFirst = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (dayFirst) {
    return new Date(
      Number(dayFirst[3]),
      Number(dayFirst[2]) - 1,
      Number(dayFirst[1]),
      Number(dayFirst[4] || 0),
      Number(dayFirst[5] || 0)
    );
  }

  // An earlier version saved only HH:mm; there is no safe way to infer its calendar day.
  return null;
}

export function formatSaleTime(timestamp: string): string {
  const date = parseSaleDate(timestamp);
  return date
    ? new Intl.DateTimeFormat('fr-CD', { hour: '2-digit', minute: '2-digit' }).format(date)
    : timestamp;
}

export function formatSaleDateTime(timestamp: string): string {
  const date = parseSaleDate(timestamp);
  if (date) {
    return new Intl.DateTimeFormat('fr-CD', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
  return /^\d{1,2}:\d{2}$/.test(timestamp.trim())
    ? `Date non enregistrée · ${timestamp}`
    : timestamp;
}
