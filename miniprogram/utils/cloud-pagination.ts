export async function fetchAllRecords<T>(
  createQuery: () => any,
  pageSize = 20,
  maxRecords = 500
): Promise<T[]> {
  const records: T[] = [];
  while (records.length < maxRecords) {
    const size = Math.min(pageSize, maxRecords - records.length);
    let query = createQuery();
    if (typeof query.skip === "function") query = query.skip(records.length);
    if (typeof query.limit === "function") query = query.limit(size);
    const result = await query.get();
    const page = result.data || [];
    records.push(...page);
    if (page.length < size) break;
  }
  return records;
}
