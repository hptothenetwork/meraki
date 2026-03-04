export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  try {
    const reqHost = new URL(req.url).host;
    const originHost = new URL(origin).host;
    if (reqHost !== originHost) {
      throw new Error("Origin mismatch");
    }
  } catch {
    throw new Error("CSRF origin mismatch");
  }
}
