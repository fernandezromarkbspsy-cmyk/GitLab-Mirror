export function getNewQueueIds(
  previous: ReadonlySet<string> | null,
  current: ReadonlySet<string>,
): string[] {
  if (previous === null) return [];
  return [...current].filter((id) => !previous.has(id));
}
