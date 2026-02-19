const encoder = new TextEncoder();

export async function hashPassword(password: string) {
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return btoa(String.fromCharCode(...bytes));
}

export async function passwordsMatch(password: string, hash: string) {
  const computed = await hashPassword(password);
  return computed === hash;
}