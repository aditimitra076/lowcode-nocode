const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Coerce + validate record payload against table field types.
 * Email fields must look like emails; numbers/dates/booleans are checked too.
 */
export function coerceRecordData(fields, payload) {
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}
  const data = {}
  const errors = []

  for (const field of fields || []) {
    if (!field?.key || !Object.prototype.hasOwnProperty.call(source, field.key)) continue

    const raw = source[field.key]
    const label = field.label || field.key

    switch (field.type) {
      case 'email': {
        const value = raw == null ? '' : String(raw).trim().toLowerCase()
        if (value && !EMAIL_PATTERN.test(value)) {
          errors.push(`“${label}” must be a valid email.`)
        }
        data[field.key] = value
        break
      }
      case 'number': {
        if (raw === '' || raw == null) {
          data[field.key] = ''
          break
        }
        const number = typeof raw === 'number' ? raw : Number(String(raw).trim())
        if (Number.isNaN(number)) {
          errors.push(`“${label}” must be a number.`)
          data[field.key] = String(raw)
        } else {
          data[field.key] = number
        }
        break
      }
      case 'boolean': {
        if (typeof raw === 'boolean') {
          data[field.key] = raw
        } else {
          const text = String(raw ?? '')
            .trim()
            .toLowerCase()
          data[field.key] = ['true', '1', 'yes', 'on'].includes(text)
        }
        break
      }
      case 'date': {
        const value = raw == null ? '' : String(raw).trim()
        if (value && Number.isNaN(Date.parse(value))) {
          errors.push(`“${label}” must be a valid date.`)
        }
        data[field.key] = value
        break
      }
      default: {
        data[field.key] = raw == null ? '' : String(raw)
      }
    }
  }

  return { data, errors }
}
