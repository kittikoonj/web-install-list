export function auditFormat(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'ใช่' : 'ไม่';
  return String(value);
}

export function auditChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  labels: Record<string, string>,
  fields?: string[],
): string | undefined {
  const keys = fields ?? Object.keys(labels);
  const parts: string[] = [];

  for (const key of keys) {
    const prev = before[key];
    const next = after[key];
    if (JSON.stringify(prev) === JSON.stringify(next)) continue;
    parts.push(`${labels[key] ?? key}: ${auditFormat(prev)} → ${auditFormat(next)}`);
  }

  return parts.length ? parts.join('; ') : undefined;
}

export function auditCreatedSummary(
  fields: Record<string, unknown>,
  labels: Record<string, string>,
): string {
  return Object.entries(labels)
    .filter(([key]) => {
      const v = fields[key];
      return v !== undefined && v !== null && v !== '';
    })
    .map(([key, label]) => `${label}: ${auditFormat(fields[key])}`)
    .join('; ');
}

export function auditDeletedSummary(label: string, name: string): string {
  return `ลบ ${label}: ${name}`;
}
