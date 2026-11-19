/** First letters of the first two words of a name, upper case ("Ada Lovelace" -> "AL"). */
export function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
