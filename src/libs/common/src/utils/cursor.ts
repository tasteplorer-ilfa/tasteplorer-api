export function encodeCursor(date: string | Date): string {
  const dateStr = typeof date === 'string' ? date : date.toISOString();
  return Buffer.from(dateStr).toString('base64');
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}
