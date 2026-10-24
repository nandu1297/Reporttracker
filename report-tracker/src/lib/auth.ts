// Cookie value is a SHA-256 of the password, so the password itself never lands in the browser.
export async function authToken() {
  const data = new TextEncoder().encode("report-tracker:" + (process.env.APP_PASSWORD ?? ""));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
