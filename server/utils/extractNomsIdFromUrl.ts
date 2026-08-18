export default function extractNomsIdFromUrl(originalUrl: string): string | undefined {
  return originalUrl.match(/^\/person\/([^/?]+)/)?.[1]
}
