const rorVercelOrigin = /^https:\/\/ror-frontend(?:-[a-z0-9-]+)?\.vercel\.app$/i;

export function isRorVercelOrigin(origin: string) {
  return rorVercelOrigin.test(origin.replace(/\/$/, ""));
}
