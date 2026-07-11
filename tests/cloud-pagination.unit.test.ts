import { fetchAllRecords } from "../miniprogram/utils/cloud-pagination";

describe("cloud pagination", () => {
  test("reads every page until the final partial page", async () => {
    const source = Array.from({ length: 42 }, (_, index) => ({ _id: `p-${index + 1}` }));
    const offsets: number[] = [];
    const createQuery = () => {
      let offset = 0;
      let size = 20;
      const query = {
        skip(value: number) {
          offset = value;
          offsets.push(value);
          return query;
        },
        limit(value: number) {
          size = value;
          return query;
        },
        async get() {
          return { data: source.slice(offset, offset + size) };
        }
      };
      return query;
    };

    const records = await fetchAllRecords(createQuery, 20, 100);

    expect(records).toEqual(source);
    expect(offsets).toEqual([0, 20, 40]);
  });

  test("honors the maximum record guard", async () => {
    const source = Array.from({ length: 30 }, (_, index) => index);
    const records = await fetchAllRecords(() => {
      let offset = 0;
      let size = 20;
      const query = {
        skip(value: number) { offset = value; return query; },
        limit(value: number) { size = value; return query; },
        async get() { return { data: source.slice(offset, offset + size) }; }
      };
      return query;
    }, 20, 25);

    expect(records).toHaveLength(25);
  });
});
