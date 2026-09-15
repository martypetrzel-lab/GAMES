import { describe, expect, it } from "vitest";
import { buildGameMetadata } from "./metadata";

describe("metadata hry", () => {
  it("vždy používají interní canonical URL", () => {
    const metadata = buildGameMetadata({ title: "Portal 2", slug: "portal-2", imageUrl: null });
    expect(metadata.alternates).toEqual({ canonical: "/hra/portal-2" });
    expect(metadata.openGraph).toMatchObject({ url: "/hra/portal-2" });
  });
});
