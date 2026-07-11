import path from "path";
import automator from "miniprogram-automator";

type MiniProgramInstance = Awaited<ReturnType<typeof automator.launch>>;
type PageInstance = NonNullable<Awaited<ReturnType<MiniProgramInstance["reLaunch"]>>>;

interface DevDataSnapshot {
  collections: Record<string, Array<Record<string, any>>>;
}

const DEV_COLLECTIONS = [
  "dev_players",
  "dev_matches",
  "dev_activities",
  "dev_activity_registrations",
  "dev_player_match_stats",
  "dev_player_ratings",
  "dev_match_player_rating_summaries",
  "dev_player_rating_summaries",
  "dev_teams",
  "dev_users"
];

const runLiveDevSuite = process.env.LIVE_DEV_E2E === "1";
const describeLiveDev = runLiveDevSuite ? describe : describe.skip;

async function waitUntilLoaded(page: PageInstance, field: string): Promise<any> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (!(await page.data(field))) return page.data();
    await page.waitFor(250);
  }
  throw new Error(`页面加载超时: ${field}`);
}

function idsOf(records: Array<Record<string, any>>): Set<string> {
  return new Set(records.map((item) => String(item._id || "")).filter(Boolean));
}

describeLiveDev("线上 dev 数据与核心页面（只读）", () => {
  let miniProgram: MiniProgramInstance;
  let snapshot: DevDataSnapshot;

  beforeAll(async () => {
    miniProgram = process.env.E2E_WS_ENDPOINT
      ? await automator.connect({ wsEndpoint: process.env.E2E_WS_ENDPOINT })
      : await automator.launch({
        cliPath: process.env.WECHAT_DEVTOOLS_CLI || "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
        projectPath: process.env.MINIPROGRAM_PROJECT_PATH || path.join(__dirname, ".."),
        port: Number(process.env.E2E_AUTOMATION_PORT || 9421),
        trustProject: true
      });

    snapshot = await miniProgram.evaluate(function (collectionNames: string[]) {
      const cloudDb = wx.cloud.database();
      function readAll(name: string, offset: number, records: any[]): Promise<{ name: string; data: any[] }> {
        return cloudDb.collection(name).skip(offset).limit(20).get().then(function (result: any) {
          const page = result.data || [];
          const next = records.concat(page);
          return page.length < 20 ? { name: name, data: next } : readAll(name, next.length, next);
        });
      }
      return Promise.all(collectionNames.map(function (name: string) {
        return readAll(name, 0, []);
      })).then(function (results: Array<{ name: string; data: any[] }>) {
        const collections: Record<string, any[]> = {};
        results.forEach(function (result) {
          collections[result.name] = result.data;
        });
        return { collections: collections };
      });
    }, DEV_COLLECTIONS) as DevDataSnapshot;
  }, 120000);

  afterAll(async () => {
    if (miniProgram) await miniProgram.close();
  });

  test("只访问 dev 集合且核心数据已装载", () => {
    expect(Object.keys(snapshot.collections).sort()).toEqual(DEV_COLLECTIONS.slice().sort());
    expect(Object.keys(snapshot.collections).every((name) => name.startsWith("dev_"))).toBe(true);
    expect(snapshot.collections.dev_players.length).toBeGreaterThan(0);
    expect(snapshot.collections.dev_matches.length).toBeGreaterThan(0);
    expect(snapshot.collections.dev_activities.length).toBeGreaterThan(0);
    expect(snapshot.collections.dev_activity_registrations.length).toBeGreaterThan(0);
  });

  test("活动、比赛、报名和评分引用保持完整", () => {
    const collections = snapshot.collections;
    const playerIds = idsOf(collections.dev_players);
    const matchIds = idsOf(collections.dev_matches);
    const activityIds = idsOf(collections.dev_activities);

    const orphanActivityMatches = collections.dev_matches
      .filter((match) => match.activityId && !activityIds.has(String(match.activityId)))
      .map((match) => ({ _id: match._id, activityId: match.activityId }));
    expect(orphanActivityMatches).toEqual([]);

    const missingSelectedPlayers = collections.dev_matches.reduce((missing: any[], match) => {
      (match.selectedPlayerIds || []).forEach((id: string) => {
        if (!playerIds.has(String(id))) missing.push({ matchId: match._id, playerId: id });
      });
      return missing;
    }, []);
    expect(missingSelectedPlayers).toEqual([]);

    collections.dev_matches.forEach((match) => {
      (match.playerStats || []).forEach((stat: any) => expect(playerIds.has(String(stat.playerId))).toBe(true));

      const groupedIds = ((match.grouping && match.grouping.teams) || [])
        .reduce((ids: string[], team: any) => ids.concat(team.playerIds || []), []);
      if (match.activityId && groupedIds.length) {
        expect(Array.from(new Set(match.selectedPlayerIds || [])).sort())
          .toEqual(Array.from(new Set(groupedIds)).sort());
      }
    });

    collections.dev_activity_registrations.forEach((registration) => {
      expect(activityIds.has(String(registration.activityId))).toBe(true);
      expect(playerIds.has(String(registration.playerId))).toBe(true);
    });
    collections.dev_player_match_stats.forEach((stat) => {
      expect(matchIds.has(String(stat.matchId))).toBe(true);
      expect(playerIds.has(String(stat.playerId))).toBe(true);
    });
    collections.dev_player_ratings.forEach((rating) => {
      expect(matchIds.has(String(rating.matchId))).toBe(true);
      expect(playerIds.has(String(rating.playerId))).toBe(true);
    });
    collections.dev_match_player_rating_summaries.forEach((summary) => {
      expect(matchIds.has(String(summary.matchId))).toBe(true);
      expect(playerIds.has(String(summary.playerId))).toBe(true);
    });
    collections.dev_player_rating_summaries.forEach((summary) => {
      expect(playerIds.has(String(summary.playerId))).toBe(true);
    });
  });

  test("已生成赛程的活动进入进行中或已结束状态", () => {
    const activityIdsWithMatches = new Set(
      snapshot.collections.dev_matches.map((match) => match.activityId).filter(Boolean)
    );
    snapshot.collections.dev_activities.forEach((activity) => {
      if (activityIdsWithMatches.has(activity._id)) {
        expect(["in_progress", "finished"]).toContain(activity.status);
      }
    });
  });

  test("球员、比赛和活动列表读取线上 dev 数据", async () => {
    const playerPage = await miniProgram.switchTab("/pages/players/list/list") as PageInstance;
    const playerData = await waitUntilLoaded(playerPage, "loading");
    expect(playerData.players).toHaveLength(snapshot.collections.dev_players.length);

    const matchPage = await miniProgram.switchTab("/pages/match/list/list") as PageInstance;
    const matchData = await waitUntilLoaded(matchPage, "loading");
    expect(matchData.matches).toHaveLength(Math.min(snapshot.collections.dev_matches.length, 20));

    const activityPage = await miniProgram.reLaunch("/pages/activity/list/list") as PageInstance;
    const activityData = await waitUntilLoaded(activityPage, "loading");
    expect(activityData.activities).toHaveLength(Math.min(snapshot.collections.dev_activities.length, 20));
  });

  test("球员详情按 dev 环境路由读取", async () => {
    const firstPlayer = snapshot.collections.dev_players[0];
    const page = await miniProgram.reLaunch(`/pages/players/detail/detail?id=${firstPlayer._id}`) as PageInstance;
    const pageData = await waitUntilLoaded(page, "loading");
    expect(pageData.errorMessage).toBe("");
    expect(pageData.player._id).toBe(firstPlayer._id);
  });
});
