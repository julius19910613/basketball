export interface RatingInput {
  matchId?: string;
  playerId?: string;
  score?: number;
  starValue?: number;
  tags?: string[];
  comment?: string;
}

export interface MatchForRating {
  _id?: string;
  matchStatus?: string;
  ratingSession?: {
    status?: string;
    [key: string]: unknown;
  } | null;
  playerStats?: Array<{ playerId?: string; played?: boolean; [key: string]: unknown }> | null;
  selectedPlayerIds?: string[] | null;
}

export interface SanitizedRating {
  matchId: string;
  playerId: string;
  score: number;
  starValue: number;
  tags: string[];
  comment: string;
}

export interface AttendanceCheck {
  allowed: boolean;
  compatMode: boolean;
  reason?: string;
}

export const RATING_TAG_WHITELIST = [
  "得分稳定",
  "篮板积极",
  "组织清晰",
  "防守在线",
  "关键先生",
  "团队配合",
  "拼抢积极",
  "投篮手感",
  "节奏掌控",
  "进步明显"
];

export function sanitizeRatingInput(input: RatingInput): SanitizedRating {
  const matchId = String(input.matchId || "").trim();
  const playerId = String(input.playerId || "").trim();

  if (!matchId) throw new Error("缺少比赛ID");
  if (!playerId) throw new Error("缺少球员ID");

  const hasScore = input.score !== undefined && input.score !== null;
  const hasStarValue = input.starValue !== undefined && input.starValue !== null;
  if (!hasScore && !hasStarValue) {
    throw new Error("缺少评分");
  }

  let score = 0;
  let starValue = 0;
  if (hasScore) {
    const rawScore = Number(input.score);
    if (!Number.isFinite(rawScore) || Math.trunc(rawScore) !== rawScore || rawScore < 1 || rawScore > 10) {
      throw new Error("score必须是1-10的整数");
    }
    score = rawScore;
  }

  if (hasStarValue) {
    const rawStarValue = Number(input.starValue);
    if (
      !Number.isFinite(rawStarValue) ||
      rawStarValue < 0.5 ||
      rawStarValue > 5 ||
      Math.round(rawStarValue * 2) !== rawStarValue * 2
    ) {
      throw new Error("starValue必须是0.5-5且按0.5步进");
    }
    starValue = rawStarValue;
  }

  if (hasScore && !hasStarValue) {
    starValue = score / 2;
  } else if (!hasScore && hasStarValue) {
    score = starValue * 2;
  } else if (score !== starValue * 2) {
    throw new Error("score与starValue不一致");
  }

  const allowedTags = new Set(RATING_TAG_WHITELIST);
  const tags = (Array.isArray(input.tags) ? input.tags : []).map((tag) => String(tag || "").trim());
  if (tags.length > 3) {
    throw new Error("标签最多选择3个");
  }
  const seenTags = new Set<string>();
  tags.forEach((tag) => {
    if (!tag || !allowedTags.has(tag)) {
      throw new Error("包含非法标签");
    }
    if (seenTags.has(tag)) {
      throw new Error("标签不能重复");
    }
    seenTags.add(tag);
  });
  const comment = String(input.comment || "").trim();
  if (comment.length > 80) {
    throw new Error("短评不能超过80字");
  }

  return {
    matchId,
    playerId,
    score,
    starValue,
    tags,
    comment
  };
}

export function assertRatingOpen(match: MatchForRating | null | undefined): void {
  if (!match) throw new Error("比赛不存在");
  if (match.matchStatus !== "finished") {
    throw new Error("比赛结束后才可评分");
  }
  if (match.ratingSession && match.ratingSession.status && match.ratingSession.status !== "open") {
    throw new Error("本场评分已关闭");
  }
}

export function checkPlayerAttendance(match: MatchForRating, playerId: string): AttendanceCheck {
  const playerStats = Array.isArray(match.playerStats) ? match.playerStats : [];
  if (playerStats.length > 0) {
    const found = playerStats.some((item) => String(item.playerId || "") === playerId && item.played === true);
    return found
      ? { allowed: true, compatMode: false }
      : { allowed: false, compatMode: false, reason: "仅出场球员可被评分" };
  }

  const selectedPlayerIds = Array.isArray(match.selectedPlayerIds) ? match.selectedPlayerIds : [];
  const found = selectedPlayerIds.map(String).indexOf(playerId) !== -1;
  return found
    ? { allowed: true, compatMode: true }
    : { allowed: false, compatMode: true, reason: "球员不在本场参赛名单" };
}

export function assertRateLimit(
  records: Array<{ playerId?: string; updatedAt?: unknown; createdAt?: unknown }>,
  playerId: string,
  nowMs: number
): void {
  const latestForMatch = latestRecordTime(records);
  if (latestForMatch && nowMs - latestForMatch < 3000) {
    throw new Error("操作过于频繁，请稍后再试");
  }

  const latestForPlayer = latestRecordTime(records.filter((item) => String(item.playerId || "") === playerId));
  if (latestForPlayer && nowMs - latestForPlayer < 10000) {
    throw new Error("该球员评分更新过于频繁，请稍后再试");
  }
}

export function latestRecordTime(records: Array<{ updatedAt?: unknown; createdAt?: unknown }>): number {
  return (records || []).reduce((latest, item) => {
    return Math.max(latest, toTimeMs(item.updatedAt), toTimeMs(item.createdAt));
  }, 0);
}

export function toTimeMs(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object") {
    const obj = value as { $date?: string | number; seconds?: number; _seconds?: number };
    if (obj.$date) return toTimeMs(obj.$date);
    if (typeof obj.seconds === "number") return obj.seconds * 1000;
    if (typeof obj._seconds === "number") return obj._seconds * 1000;
  }
  return 0;
}

export function buildRatingSummary(
  ratings: Array<{ score?: number; tags?: string[]; updatedAt?: unknown; createdAt?: unknown }>
): {
  ratingCount: number;
  averageScore: number;
  averageStar: number;
  tagSummary: Array<{ tag: string; count: number }>;
  updatedAtMs: number;
} {
  const valid = (ratings || []).filter((item) => Number(item.score) >= 1 && Number(item.score) <= 10);
  const total = valid.reduce((sum, item) => sum + Number(item.score || 0), 0);
  const tagCounts: Record<string, number> = {};
  valid.forEach((item) => {
    (Array.isArray(item.tags) ? item.tags : []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const averageScore = valid.length ? Math.round((total / valid.length) * 10) / 10 : 0;
  return {
    ratingCount: valid.length,
    averageScore,
    averageStar: Math.round((averageScore / 2) * 10) / 10,
    tagSummary: Object.keys(tagCounts)
      .map((tag) => ({ tag, count: tagCounts[tag] }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, 5),
    updatedAtMs: latestRecordTime(valid)
  };
}
