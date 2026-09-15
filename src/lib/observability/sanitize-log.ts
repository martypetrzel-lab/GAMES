export function sanitizeLogMessage(message: string) {
  return message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[REDACTED_DATABASE_URL]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\b(?:password|token|authorization|cookie)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
    .slice(0, 240);
}
