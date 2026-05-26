import * as cloud from "wx-server-sdk";
import envRouter from "../common/env-router";
import {
  assertRateLimit,
  assertRatingOpen,
  buildRatingSummary,
  checkPlayerAttendance,
  sanitizeRatingInput
} from "./rating-core";

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = (cloud as unknown as { database(): any }).database();
const _ = db.command;
const { getCollection } = envRouter;

interface SubmitPlayerRatingEvent {
  _envVersion?: string;
  matchId?: string;
  playerId?: string;
  score?: number;
  tags?: string[];
  comment?: string;
}

interface CloudDoc {
  _id?: string;
  [key: string]: any;
}

function errorResult(message: string): { success: false; message: string } {
  return { success: false, message };
}

async function getFirst(collectionName: string, query: Record<string, unknown>): Promise<CloudDoc | null> {
  const res = await db.collection(collectionName).where(query).limit(1).get();
  return (res.data || [])[0] || null;
}

async function upsertRating(
  collectionName: string,
  uniqueQuery: Record<string, unknown>,
  payload: Record<string, unknown>
): Promise<"created" | "updated"> {
  try {
    await db.collection(collectionName).add({
      data: Object.assign({}, payload, {
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      })
    });
    return "created";
  } catch (err) {
    const existing = await getFirst(collectionName, uniqueQuery);
    if (!existing || !existing._id) throw err;
    await db.collection(collectionName).doc(existing._id).update({
      data: Object.assign({}, payload, {
        updatedAt: db.serverDate()
      })
    });
    return "updated";
  }
}

async function recomputeSummaries(
  envVersion: string,
  matchId: string,
  playerId: string,
  compatMode: boolean
): Promise<{ matchSummary: unknown; playerSummary: unknown }> {
  const ratingsName = getCollection("player_ratings", envVersion);
  const matchSummaryName = getCollection("match_player_rating_summaries", envVersion);
  const playerSummaryName = getCollection("player_rating_summaries", envVersion);

  const matchRatingsRes = await db.collection(ratingsName).where({ matchId, playerId }).get();
  const matchSummary = buildRatingSummary(matchRatingsRes.data as any[]);
  const matchSummaryQuery = { matchId, playerId };
  const existingMatchSummary = await getFirst(matchSummaryName, matchSummaryQuery);
  const matchSummaryPayload = Object.assign({}, matchSummaryQuery, matchSummary, {
    compatMode,
    updatedAt: db.serverDate()
  });

  if (existingMatchSummary && existingMatchSummary._id) {
    await db.collection(matchSummaryName).doc(existingMatchSummary._id).update({ data: matchSummaryPayload });
  } else {
    await db.collection(matchSummaryName).add({ data: Object.assign({}, matchSummaryPayload, { createdAt: db.serverDate() }) });
  }

  const playerRatingsRes = await db.collection(ratingsName).where({ playerId }).get();
  const playerSummary = buildRatingSummary(playerRatingsRes.data as any[]);
  const playerSummaryQuery = { playerId };
  const existingPlayerSummary = await getFirst(playerSummaryName, playerSummaryQuery);
  const playerSummaryPayload = Object.assign({}, playerSummaryQuery, playerSummary, {
    updatedAt: db.serverDate()
  });

  if (existingPlayerSummary && existingPlayerSummary._id) {
    await db.collection(playerSummaryName).doc(existingPlayerSummary._id).update({ data: playerSummaryPayload });
  } else {
    await db.collection(playerSummaryName).add({ data: Object.assign({}, playerSummaryPayload, { createdAt: db.serverDate() }) });
  }

  return { matchSummary, playerSummary };
}

export async function main(event: SubmitPlayerRatingEvent): Promise<Record<string, unknown>> {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  if (!openid) return errorResult("无法获取用户身份");

  const envVersion = event._envVersion || "release";
  const matchesName = getCollection("matches", envVersion);
  const ratingsName = getCollection("player_ratings", envVersion);

  try {
    const input = sanitizeRatingInput(event);
    const matchRes = await db.collection(matchesName).doc(input.matchId).get();
    const match = (matchRes.data || null) as CloudDoc | null;
    assertRatingOpen(match);
    const attendance = checkPlayerAttendance(match!, input.playerId);
    if (!attendance.allowed) throw new Error(attendance.reason || "球员不可评分");

    const now = Date.now();
    const recentRes = await db.collection(ratingsName)
      .where({
        matchId: input.matchId,
        _openid: openid
      })
      .orderBy("updatedAt", "desc")
      .limit(20)
      .get();
    assertRateLimit(recentRes.data as any[], input.playerId, now);

    const uniqueQuery = {
      matchId: input.matchId,
      playerId: input.playerId,
      _openid: openid
    };
    const status = await upsertRating(ratingsName, uniqueQuery, {
      _openid: openid,
      matchId: input.matchId,
      playerId: input.playerId,
      score: input.score,
      starValue: input.starValue,
      tags: input.tags,
      comment: input.comment,
      compatMode: attendance.compatMode
    });

    const summaries = await recomputeSummaries(envVersion, input.matchId, input.playerId, attendance.compatMode);
    return {
      success: true,
      status,
      rating: input,
      compatMode: attendance.compatMode,
      matchSummary: summaries.matchSummary,
      playerSummary: summaries.playerSummary
    };
  } catch (err) {
    console.error("submitPlayerRating failed", err);
    return errorResult(err instanceof Error ? err.message : "提交评分失败");
  }
}
