/** The HTML input type that edits a table field of the given type. */
export function inputTypeForField(type) {
  if (type === 'email') return 'email';
  if (type === 'number') return 'number';
  if (type === 'date') return 'date';
  return 'text';
}
