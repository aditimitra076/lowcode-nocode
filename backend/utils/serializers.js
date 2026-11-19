// The shapes that the API sends to clients (one place, used by several controllers).

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  }
}

export function serializeTable(table) {
  return {
    id: table.id,
    projectId: String(table.project),
    name: table.name,
    fields: (table.fields || []).map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type || 'text',
      required: Boolean(field.required),
      minLength: Number(field.minLength) || 0,
    })),
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
  }
}

export function serializeRecord(record) {
  return {
    id: record.id,
    tableId: String(record.table),
    data: record.data || {},
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}
