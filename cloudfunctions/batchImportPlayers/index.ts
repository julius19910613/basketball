import * as cloud from "wx-server-sdk";
import envRouter from "../common/env-router";

const { getCollection } = envRouter;

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

type Position = "PG" | "SG" | "SF" | "PF" | "C";

interface ImportedPlayer {
  nickname?: string | null;
  realName?: string | null;
  position?: string | null;
  height?: string | number | null;
  weight?: string | number | null;
  birthday?: string | null;
  age?: string | number | null;
}

interface BatchImportPlayersEvent {
  _envVersion?: string;
  players?: ImportedPlayer[];
}

interface PlayerRecord {
  nickname: string;
  realName: string;
  position: Position;
  height: number | null;
  weight: number | null;
  birthday: Date | null;
  age: number | null;
  createdAt: unknown;
  updatedAt: unknown;
}

interface CloudDocument {
  _id: string;
  [key: string]: unknown;
}

interface CloudCountResult {
  total: number;
}

interface CloudGetResult {
  data: CloudDocument[];
}

interface CloudAddResult {
  _id: string;
}

interface CloudQuery {
  count(): Promise<CloudCountResult>;
  get(): Promise<CloudGetResult>;
}

interface CloudDocumentRef {
  update(options: { data: Record<string, unknown> }): Promise<unknown>;
}

interface CloudCollection {
  where(query: Record<string, unknown>): CloudQuery;
  doc(id: string): CloudDocumentRef;
  add(options: { data: PlayerRecord }): Promise<CloudAddResult>;
}

interface CloudDatabase {
  serverDate(): unknown;
  collection(name: string): CloudCollection;
}

interface BatchImportResult {
  index: number;
  nickname?: string;
  status: "skip" | "updated" | "added" | "error";
  reason?: string;
  error?: string;
  _id?: string;
}

interface BatchImportPlayersResponse {
  success: boolean;
  message?: string;
  total?: number;
  successCount?: number;
  failCount?: number;
  results?: BatchImportResult[];
}

const db = (cloud as unknown as { database(): CloudDatabase }).database();

// 位置映射: G→SG, F→SF, C→C
function mapPosition(pos?: string | null): Position {
  if (!pos) return "SF";
  const p = String(pos).trim().toUpperCase();
  if (p === "C") return "C";
  if (p === "G") return "SG";
  if (p === "F") return "SF";
  // 已经是精确位置的直接返回
  if (["PG", "SG", "SF", "PF", "C"].indexOf(p) !== -1) return p as Position;
  return "SF";
}

// 解析生日字符串 "1992年1月23日" → Date
function parseBirthday(str?: string | null): Date | null {
  if (!str) return null;
  const match = String(str).match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const d = parseInt(match[3], 10);
  return new Date(y, m, d);
}

// 根据生日计算年龄
function calcAge(birthday: Date | null): number | null {
  if (!birthday) return null;
  const now = new Date();
  let age = now.getFullYear() - birthday.getFullYear();
  const mDiff = now.getMonth() - birthday.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}

// 云函数入口
async function main(event: BatchImportPlayersEvent): Promise<BatchImportPlayersResponse> {
  const envVersion = event._envVersion || "release";
  const players = event.players;
  if (!players || !Array.isArray(players) || players.length === 0) {
    return { success: false, message: "players 数组为空" };
  }

  const results: BatchImportResult[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const birthday = parseBirthday(p.birthday);
    const age = birthday ? calcAge(birthday) : (p.age ? Number(p.age) : null);

    const record: PlayerRecord = {
      nickname: (p.nickname || "").trim(),
      realName: (p.realName || p.nickname || "").trim(),
      position: mapPosition(p.position),
      height: p.height ? Number(p.height) : null,
      weight: p.weight ? Number(p.weight) : null,
      birthday,
      age,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };

    // 校验必填
    if (!record.nickname) {
      results.push({ index: i, status: "skip", reason: "昵称为空" });
      failCount++;
      continue;
    }

    try {
      // 检查是否已存在（按昵称去重）
      const collectionName = getCollection("players", envVersion);
      const existRes = await db.collection(collectionName).where({
        nickname: record.nickname
      }).count();

      if (existRes.total > 0) {
        // 已存在则更新
        const existData = await db.collection(collectionName).where({
          nickname: record.nickname
        }).get();

        if (existData.data && existData.data.length > 0) {
          await db.collection(collectionName).doc(existData.data[0]._id).update({
            data: {
              position: record.position,
              height: record.height,
              weight: record.weight,
              birthday: record.birthday,
              age: record.age,
              realName: record.realName,
              updatedAt: db.serverDate()
            }
          });
          results.push({ index: i, nickname: record.nickname, status: "updated" });
          successCount++;
        }
      } else {
        // 新增
        const addRes = await db.collection(collectionName).add({ data: record });
        results.push({ index: i, nickname: record.nickname, status: "added", _id: addRes._id });
        successCount++;
      }
    } catch (err) {
      results.push({ index: i, nickname: record.nickname, status: "error", error: String(err) });
      failCount++;
    }
  }

  return {
    success: true,
    total: players.length,
    successCount,
    failCount,
    results
  };
}

export { main };
