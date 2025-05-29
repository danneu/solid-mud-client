// SIMPLE
// Matches http(s)://domain.com/path/style/urls
// Stops at ?, #, or common punctuation
const URL_REGEX =
  /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9._~-]*)*\/?/g;

export function linkify(input: string): string {
  // Regex to match http:// or https:// URLs
  // Matches until whitespace, end of string, or common punctuation that typically ends URLs
  // const urlRegex = /https?:\/\/[^\s<>"{}|\\^\[\]`]+/g;

  return escapeHtml(input) // escape html first!
    .replace(URL_REGEX, (url) => {
      // Clean up trailing punctuation that's likely not part of the URL
      // but keep trailing slashes
      const cleanUrl = url.replace(/[.,;:!?]+$/, "");

      // HTML escape the URL for safety
      const escapedUrl = escapeHtml(cleanUrl);

      return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedUrl}</a>`;
    });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
