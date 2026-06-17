import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    // Force the limiter to be active even though the suite runs under Vitest.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VITEST", "");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("allows requests under the limit", async () => {
    const { rateLimit } = await import("@/lib/rateLimit");

    const options = { limit: 3, windowMs: 1000 };

    expect(rateLimit("key-a", options).allowed).toBe(true);
    expect(rateLimit("key-a", options).allowed).toBe(true);
    expect(rateLimit("key-a", options).allowed).toBe(true);
  });

  it("blocks requests over the limit within the window", async () => {
    const { rateLimit } = await import("@/lib/rateLimit");

    const options = { limit: 2, windowMs: 1000 };

    expect(rateLimit("key-b", options).allowed).toBe(true);
    expect(rateLimit("key-b", options).allowed).toBe(true);
    expect(rateLimit("key-b", options).allowed).toBe(false);
  });

  it("tracks keys independently", async () => {
    const { rateLimit } = await import("@/lib/rateLimit");

    const options = { limit: 1, windowMs: 1000 };

    expect(rateLimit("key-c", options).allowed).toBe(true);
    expect(rateLimit("key-c", options).allowed).toBe(false);
    expect(rateLimit("key-d", options).allowed).toBe(true);
  });

  it("resets after the window elapses", async () => {
    const { rateLimit } = await import("@/lib/rateLimit");

    const options = { limit: 1, windowMs: 1000 };

    expect(rateLimit("key-e", options).allowed).toBe(true);
    expect(rateLimit("key-e", options).allowed).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(rateLimit("key-e", options).allowed).toBe(true);
  });

  it("is a no-op under the test environment", async () => {
    vi.stubEnv("VITEST", "true");
    vi.resetModules();

    const { rateLimit } = await import("@/lib/rateLimit");

    const options = { limit: 1, windowMs: 1000 };

    // Many calls, all allowed because the limiter is disabled in tests.
    expect(rateLimit("key-f", options).allowed).toBe(true);
    expect(rateLimit("key-f", options).allowed).toBe(true);
    expect(rateLimit("key-f", options).allowed).toBe(true);
  });
});
