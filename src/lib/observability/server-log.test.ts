import { describe, expect, it } from "vitest";
import { sanitizeLogMessage } from "./sanitize-log";

describe("safe server logging", () => {
  it("odstraňuje databázové URL, e-mail a tokeny", () => {
    const result = sanitizeLogMessage(
      "postgresql://user:secret@db/x contact ops@example.cz token=abc123",
    );
    expect(result).not.toContain("secret");
    expect(result).not.toContain("ops@example.cz");
    expect(result).not.toContain("abc123");
  });
});
