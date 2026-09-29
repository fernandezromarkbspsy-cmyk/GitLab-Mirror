type JsonLike = unknown;

function normalizeValue(value: JsonLike): JsonLike {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, JsonLike>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeValue(entry)]),
    );
  }

  return value;
}

function stableSerialize(value: JsonLike): string {
  return JSON.stringify(normalizeValue(value));
}

export function generateIdempotencyKey(
  scope: string,
  value: JsonLike,
  operationId: string = crypto.randomUUID(),
): string {
  const serialized = stableSerialize(value);
  let hash = 2166136261;

  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `${scope}:${(hash >>> 0).toString(16)}:${operationId}`;
}

export function buildIdempotencyHeaders(
  scope: string,
  value: JsonLike,
  operationId?: string,
): Record<string, string> {
  return {
    "Idempotency-Key": generateIdempotencyKey(scope, value, operationId),
  };
}
