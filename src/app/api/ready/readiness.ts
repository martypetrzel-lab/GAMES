export async function checkReadiness(query: () => Promise<unknown>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      query(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Readiness timeout")), timeoutMs);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
