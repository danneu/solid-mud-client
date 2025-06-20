// The easiest thing we can do is at least detect if a line has any readable characters
export function isDecorativeLine(line: string): boolean {
  // Remove all non-letter/number characters
  const readableOnly = line.replace(/[^\p{L}\p{N}]/gu, "");

  // If nothing left, it's purely decorative
  return readableOnly.length === 0;
}
