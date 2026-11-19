import { EMAIL_PATTERN } from './validation.js'

/**
 * Coerce + validate record payload against table field types,
 * required flags, and minLength (FR-20 / FR-30).
 */
export function coerceRecordData(fields, payload) {
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}
  const data = {}
  const errors = []

  for (const field of fields || []) {
    if (!field?.key) continue

    const hasValue = Object.prototype.hasOwnProperty.call(source, field.key)
    const raw = hasValue ? source[field.key] : undefined
    const label = field.label || field.key
    const required = Boolean(field.required)
    const minLength = Number.isFinite(Number(field.minLength))
      ? Math.max(0, Number(field.minLength))
      : 0

    const isEmpty =
      raw == null ||
      (typeof raw === 'string' && raw.trim() === '') ||
      (field.type === 'boolean' && raw === '')

    if (!hasValue || isEmpty) {
      if (required) {
        errors.push(`“${label}” is required.`)
      }
      if (hasValue) {
        data[field.key] = field.type === 'boolean' ? false : field.type === 'number' ? '' : ''
      }
      continue
    }

    switch (field.type) {
      case 'email': {
        const value = String(raw).trim().toLowerCase()
        if (!EMAIL_PATTERN.test(value)) {
          errors.push(`“${label}” must be a valid email.`)
        }
        if (minLength && value.length < minLength) {
          errors.push(`“${label}” must be at least ${minLength} characters.`)
        }
        data[field.key] = value
        break
      }
      case 'number': {
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
        const value = String(raw).trim()
        if (value && Number.isNaN(Date.parse(value))) {
          errors.push(`“${label}” must be a valid date.`)
        }
        data[field.key] = value
        break
      }
      default: {
        const value = String(raw)
        if (minLength && value.trim().length < minLength) {
          errors.push(`“${label}” must be at least ${minLength} characters.`)
        }
        data[field.key] = value
      }
    }
  }

  return { data, errors }
}
