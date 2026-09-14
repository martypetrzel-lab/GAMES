export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: "invalid-response" | "rate-limited" | "timeout" | "unavailable",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ProviderError";
  }
}
