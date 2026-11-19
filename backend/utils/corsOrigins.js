const DEFAULT_ORIGIN = 'http://localhost:5173'

/**
 * CLIENT_ORIGIN may hold one origin or several, separated by commas
 * (for example "http://localhost:5173,https://studio.example.com").
 * A trailing slash is removed because browsers send origins without one.
 */
export function parseClientOrigins(value) {
  const origins = String(value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)

  return origins.length ? [...new Set(origins)] : [DEFAULT_ORIGIN]
}
