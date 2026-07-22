// NEXT_PUBLIC_BACKEND_URL is inlined at build time. When it's set (an
// explicit override baked into the image), it always wins. When it's left
// unset, this falls back to the same host the page was served from on
// port 8000 — resolved live in the browser via window.location, not at
// build time — so one built image keeps working across different hosts
// (e.g. once a real domain is behind Nginx) without a rebuild. The
// server-side "http://backend:8000" branch only matters if this module is
// ever imported from server-rendered code; postJson itself is only called
// from client components today.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://backend:8000");

export async function postJson<TResponse>(
  path: string,
  body: unknown
): Promise<TResponse> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const detail = data?.detail;
    throw new Error(
      typeof detail === "string" ? detail : `Request to ${path} failed`
    );
  }

  return response.json() as Promise<TResponse>;
}
