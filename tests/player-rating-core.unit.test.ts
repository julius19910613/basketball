import {
  assertRateLimit,
  assertRatingOpen,
  buildRatingSummary,
  checkPlayerAttendance,
  sanitizeRatingInput
} from "../cloudfunctions/submitPlayerRating/rating-core";

describe("player rating core", () => {
  test("sanitizes score, tags, and comments", () => {
    expect(sanitizeRatingInput({
      matchId: " m1 ",
      playerId: " p1 ",
      score: 9,
      tags: ["得分稳定", "防守在线", "关键先生"],
      comment: "  关键球很稳  "
    })).toEqual({
      matchId: "m1",
      playerId: "p1",
      score: 9,
      starValue: 4.5,
      tags: ["得分稳定", "防守在线", "关键先生"],
      comment: "关键球很稳"
    });
  });

  test("rejects duplicate tags", () => {
    expect(() => sanitizeRatingInput({
      matchId: "m1",
      playerId: "p1",
      score: 8,
      tags: ["得分稳定", "得分稳定"]
    })).toThrow(/重复/);
  });

  test("rejects invalid tags instead of silently filtering them", () => {
    expect(() => sanitizeRatingInput({
      matchId: "m1",
      playerId: "p1",
      score: 8,
      tags: ["得分稳定", "非法标签"]
    })).toThrow(/标签/);
  });

  test("rejects too many tags instead of silently truncating them", () => {
    expect(() => sanitizeRatingInput({
      matchId: "m1",
      playerId: "p1",
      score: 8,
      tags: ["得分稳定", "防守在线", "关键先生", "团队配合"]
    })).toThrow(/标签/);
  });

  test("rejects overlong comments instead of silently truncating them", () => {
    expect(() => sanitizeRatingInput({
      matchId: "m1",
      playerId: "p1",
      score: 8,
      comment: "a".repeat(81)
    })).toThrow(/80|短评|comment/);
  });

  test("derives score from starValue and rejects mismatched score/starValue pairs", () => {
    expect(sanitizeRatingInput({
      matchId: "m1",
      playerId: "p1",
      starValue: 4.5
    })).toMatchObject({
      score: 9,
      starValue: 4.5
    });

    expect(() => sanitizeRatingInput({
      matchId: "m1",
      playerId: "p1",
      score: 8,
      starValue: 4.5
    })).toThrow(/评分|starValue|score/);
  });

  test("rejects non-finished matches and closed sessions", () => {
    expect(() => assertRatingOpen({ matchStatus: "ongoing" })).toThrow("比赛结束后才可评分");
    expect(() => assertRatingOpen({ matchStatus: "finished", ratingSession: { status: "closed" } })).toThrow("本场评分已关闭");
    expect(() => assertRatingOpen({ matchStatus: "finished" })).not.toThrow();
    expect(() => assertRatingOpen({ matchStatus: "finished", ratingSession: { status: "open" } })).not.toThrow();
  });

  test("requires played playerStats when present and falls back to selectedPlayerIds only for old data", () => {
    expect(checkPlayerAttendance({
      matchStatus: "finished",
      playerStats: [{ playerId: "p1", played: true }, { playerId: "p2", played: false }],
      selectedPlayerIds: ["p2"]
    }, "p2")).toEqual({ allowed: false, compatMode: false, reason: "仅出场球员可被评分" });

    expect(checkPlayerAttendance({
      matchStatus: "finished",
      playerStats: [],
      selectedPlayerIds: ["p2"]
    }, "p2")).toEqual({ allowed: true, compatMode: true });
  });

  test("enforces match and player rate limits from record timestamps", () => {
    const now = 1700000010000;
    expect(() => assertRateLimit([{ playerId: "p1", updatedAt: now - 2000 }], "p2", now)).toThrow("操作过于频繁");
    expect(() => assertRateLimit([{ playerId: "p1", updatedAt: now - 9000 }], "p1", now)).toThrow("该球员评分更新过于频繁");
    expect(() => assertRateLimit([{ playerId: "p1", updatedAt: now - 11000 }], "p1", now)).not.toThrow();
  });

  test("builds rating summaries from source ratings", () => {
    expect(buildRatingSummary([
      { score: 10, tags: ["关键先生"], updatedAt: "2026-01-01T00:00:00.000Z" },
      { score: 8, tags: ["关键先生", "防守在线"], updatedAt: "2026-01-02T00:00:00.000Z" }
    ])).toMatchObject({
      ratingCount: 2,
      averageScore: 9,
      averageStar: 4.5,
      tagSummary: [{ tag: "关键先生", count: 2 }, { tag: "防守在线", count: 1 }]
    });
  });
});
