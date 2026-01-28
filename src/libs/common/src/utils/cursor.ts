export function encodeCursor(date: string | Date): string {
  const dateStr = typeof date === 'string' ? date : date.toISOString();
  return Buffer.from(dateStr).toString('base64');
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

// Composite cursor helpers for (hot_score, created_at)
// Format: base64("<score>::<isoDate>")
export function encodeCompositeCursor(
  score: number,
  date: string | Date,
): string {
  const dateStr = typeof date === 'string' ? date : date.toISOString();
  const payload = `${score}::${dateStr}`;
  return Buffer.from(payload).toString('base64');
}

export function decodeCompositeCursor(
  cursor: string,
): { score: number; date: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    // Expect format: '<score>::<isoDate>'
    const parts = decoded.split('::');
    if (parts.length !== 2) return null;
    const score = parseFloat(parts[0]);
    const date = parts[1];
    if (Number.isNaN(score) || !date) return null;
    return { score, date };
  } catch (err) {
    return null;
  }
}
