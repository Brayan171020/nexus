const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;
const PASSWORD_PATTERN = /(password|passwd|pwd)\s*[:=]\s*[^\s,;]+/gi;

export function sanitizePii(value: string): string {
  return value
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(CARD_PATTERN, '[REDACTED_CARD]')
    .replace(PASSWORD_PATTERN, '$1=[REDACTED_SECRET]');
}
