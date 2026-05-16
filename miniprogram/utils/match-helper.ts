type NumericLike = string | number | null | undefined;
type MatchResult = "win" | "loss" | "draw";
type MatchType = "friendly" | "league" | "cup" | "fiba" | "ncaa";
type MatchStatus = "draft" | "finalized";
type PositionKey = "PG" | "SG" | "SF" | "PF" | "C" | "OTHER";

interface PlayerLike {
  _id?: string;
  playerId?: string;
  id?: string;
  nickname?: string;
  displayNickname?: string;
  position?: string;
  displayPosition?: string;
  overall?: number;
  skillLevel?: number;
  score?: number;
  height?: NumericLike;
  weight?: NumericLike;
  [key: string]: unknown;
}

interface PlayerStat {
  playerId: string;
  nickname: string;
  position: string;
  played: boolean;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  shotsMade: number;
  shotsAttempted: number;
  threePtMade: number;
  threePtAttempted: number;
  ftMade: number;
  ftAttempted: number;
  fgPct?: number;
  threePtPct?: number;
  ftPct?: number;
}

interface Quarter {
  quarter: number;
  scoreUs: number;
  scoreOpponent: number;
}

interface GroupingTeam {
  teamName: string;
  playerIds: string[];
}

interface MatchGrouping {
  teams: GroupingTeam[];
  lockedAt: string | null;
}

interface Match {
  _id?: string;
  teamId?: string;
  teamNames?: string[];
  matchDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  matchType?: MatchType | string;
  status?: MatchStatus | string;
  isGroupingLocked?: boolean;
  selectedPlayerIds?: string[];
  grouping?: MatchGrouping | { teamAPlayerIds?: string[]; teamBPlayerIds?: string[] } | null;
  scoreUs?: NumericLike;
  scoreOpponent?: NumericLike;
  quarters?: Quarter[];
  playerStats?: PlayerStat[];
  highlights?: string;
  opponent?: string;
  result?: MatchResult | string;
  [key: string]: unknown;
}

interface GroupingValidationResult {
  ok: boolean;
  message: string;
}

interface SnakeGroupingResult {
  groups: string[][];
}

interface BalancedGroupingResult {
  groups: [string[], string[]];
}

interface PartitionResult {
  team0: PlayerLike[];
  team1: PlayerLike[];
}

function toNumber(value: NumericLike): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function calcFgPct(made: NumericLike, attempted: NumericLike): number {
  const m = toNumber(made);
  const a = toNumber(attempted);
  if (!a) return 0;
  return Math.round((m / a) * 1000) / 10;
}

function calcTeamPoints(playerStats: Array<{ played?: boolean; points?: NumericLike } | null | undefined>): number {
  return (playerStats || [])
    .filter(function (item) {
      return item && item.played;
    })
    .reduce(function (sum, item) {
      return sum + toNumber(item!.points);
    }, 0);
}

function calcQuarterTotals(quarters: Array<{ scoreUs?: NumericLike; scoreOpponent?: NumericLike } | null | undefined>): { scoreUs: number; scoreOpponent: number } {
  return (quarters || []).reduce<{ scoreUs: number; scoreOpponent: number }>(
    function (acc, item) {
      return {
        scoreUs: acc.scoreUs + toNumber(item && item.scoreUs),
        scoreOpponent: acc.scoreOpponent + toNumber(item && item.scoreOpponent)
      };
    },
    { scoreUs: 0, scoreOpponent: 0 }
  );
}

function getMatchResult(scoreUs: NumericLike, scoreOpponent: NumericLike): MatchResult {
  const us = toNumber(scoreUs);
  const opponent = toNumber(scoreOpponent);
  if (us > opponent) return "win";
  if (us < opponent) return "loss";
  return "draw";
}

function formatMatchType(type: string | null | undefined): string {
  const map: Record<string, string> = {
    friendly: "友谊赛",
    league: "联赛",
    cup: "杯赛",
    fiba: "全场球赛 (FIBA)",
    ncaa: "全场球赛 (NCAA)"
  };
  return map[type || ""] || "友谊赛";
}

function getMatchTypeTagClass(type: string | null | undefined): string {
  const map: Record<string, string> = {
    friendly: "tag-friendly",
    league: "tag-league",
    cup: "tag-cup",
    fiba: "tag-fiba",
    ncaa: "tag-ncaa"
  };
  return map[type || ""] || "tag-friendly";
}

function formatDate(date: Date | string | number): string {
  let d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function createEmptyPlayerStat(player: PlayerLike): PlayerStat {
  return {
    playerId: player._id || player.playerId || player.id || "",
    nickname: player.nickname || player.displayNickname || "未命名球员",
    position: player.position || player.displayPosition || "-",
    played: false,
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
    shotsMade: 0,
    shotsAttempted: 0,
    threePtMade: 0,
    threePtAttempted: 0,
    ftMade: 0,
    ftAttempted: 0
  };
}

function createEmptyMatch(teamId: string | null | undefined): Match {
  return {
    teamId: teamId || "",
    teamNames: ["A队", "B队"],
    matchDate: formatDate(new Date()),
    startTime: "",
    endTime: "",
    location: "",
    matchType: "friendly",
    status: "draft",
    isGroupingLocked: false,
    selectedPlayerIds: [],
    grouping: {
      teams: [
        { teamName: "A队", playerIds: [] },
        { teamName: "B队", playerIds: [] }
      ],
      lockedAt: null
    },
    scoreUs: 0,
    scoreOpponent: 0,
    quarters: [
      { quarter: 1, scoreUs: 0, scoreOpponent: 0 },
      { quarter: 2, scoreUs: 0, scoreOpponent: 0 },
      { quarter: 3, scoreUs: 0, scoreOpponent: 0 },
      { quarter: 4, scoreUs: 0, scoreOpponent: 0 }
    ],
    playerStats: [],
    highlights: ""
  };
}

function uniqIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set((ids || []).filter(Boolean))) as string[];
}

function buildPlayerStatsForSelection(
  players: PlayerLike[],
  existingPlayerStats: Array<Partial<PlayerStat> & { playerId?: string } | null | undefined>,
  selectedPlayerIds: Array<string | null | undefined>
): Array<Partial<PlayerStat> & { playerId: string; played: boolean }> {
  const selected = new Set(uniqIds(selectedPlayerIds));
  const statsById: Record<string, Partial<PlayerStat> & { playerId?: string }> = {};
  (existingPlayerStats || []).forEach(function (item) {
    if (item && item.playerId) statsById[item.playerId] = item;
  });
  return (players || [])
    .map(function (player) {
      const playerId = player.playerId || player._id || player.id || "";
      if (!playerId) return null;
      const existing = statsById[playerId];
      if (existing) {
        return Object.assign({}, existing, {
          playerId: playerId,
          nickname: existing.nickname || player.nickname || player.displayNickname || "未命名球员",
          position: existing.position || player.position || player.displayPosition || "-",
          played: selected.has(playerId)
        });
      }
      const next = createEmptyPlayerStat(player);
      next.playerId = playerId;
      next.played = selected.has(playerId);
      return next;
    })
    .filter(Boolean) as Array<Partial<PlayerStat> & { playerId: string; played: boolean }>;
}

function isGroupingLocked(match: { isGroupingLocked?: boolean } | null | undefined): boolean {
  return !!(match && match.isGroupingLocked);
}

function validateGrouping(
  selectedPlayerIds: Array<string | null | undefined>,
  grouping: { teams?: Array<{ playerIds?: Array<string | null | undefined> } | null> } | null | undefined
): GroupingValidationResult {
  const selected = uniqIds(selectedPlayerIds);
  const teams = (grouping && grouping.teams) || [];
  if (!selected.length) return { ok: false, message: "请先选择球员" };
  if (teams.length < 2) return { ok: false, message: "至少需要2支队伍" };
  const emptyTeam = teams.some(function (item) {
    return !uniqIds((item && item.playerIds) || []).length;
  });
  if (emptyTeam) return { ok: false, message: "每支队伍至少1名球员" };
  let assigned: string[] = [];
  teams.forEach(function (item) {
    assigned = assigned.concat(uniqIds((item && item.playerIds) || []));
  });
  const uniqAssigned = uniqIds(assigned);
  if (uniqAssigned.length !== assigned.length) return { ok: false, message: "同一球员不能同时在多支队伍" };
  const missing = selected.filter(function (id) {
    return !uniqAssigned.includes(id);
  });
  if (missing.length) return { ok: false, message: "仍有球员未分组" };
  return { ok: true, message: "" };
}

const POSITION_ORDER: PositionKey[] = ["PG", "SG", "SF", "PF", "C", "OTHER"];

function normalizePositionKey(pos: string | null | undefined): PositionKey {
  const p = String(pos || "")
    .trim()
    .toUpperCase();
  if (p === "PG" || p === "SG" || p === "SF" || p === "PF" || p === "C") return p;
  return "OTHER";
}

function getPlayerNumericScore(player: { overall?: NumericLike; skillLevel?: NumericLike; score?: NumericLike }): number {
  const s = Number(player.overall || player.skillLevel || player.score || 0);
  return Number.isFinite(s) ? s : 0;
}

function avgOf<T>(arr: T[], getter: (item: T) => number): number {
  if (!arr.length) return 0;
  let sum = 0;
  for (let i = 0; i < arr.length; i += 1) {
    sum += getter(arr[i]);
  }
  return sum / arr.length;
}

function numericRange(values: number[]): number {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const r = max - min;
  return Number.isFinite(r) && r > 0 ? r : 1;
}

function bucketSplitPenalty(team0: PlayerLike[], team1: PlayerLike[]): number {
  const countPen = Math.abs(team0.length - team1.length) * 1e6;
  const all = team0.concat(team1);
  const hs: number[] = [];
  const ws: number[] = [];
  const ss: number[] = [];
  for (let i = 0; i < all.length; i += 1) {
    hs.push(toNumber(all[i].height));
    ws.push(toNumber(all[i].weight));
    ss.push(getPlayerNumericScore(all[i]));
  }
  const rh = numericRange(hs);
  const rw = numericRange(ws);
  const rs = numericRange(ss);
  const h0 = avgOf(team0, function (p) {
    return toNumber(p.height);
  });
  const h1 = avgOf(team1, function (p) {
    return toNumber(p.height);
  });
  const w0 = avgOf(team0, function (p) {
    return toNumber(p.weight);
  });
  const w1 = avgOf(team1, function (p) {
    return toNumber(p.weight);
  });
  const s0 = avgOf(team0, getPlayerNumericScore);
  const s1 = avgOf(team1, getPlayerNumericScore);
  return (
    countPen +
    (Math.abs(h0 - h1) / rh) * 10 +
    (Math.abs(w0 - w1) / rw) * 10 +
    (Math.abs(s0 - s1) / rs) * 10
  );
}

function greedyPartitionBucket(bucket: PlayerLike[]): PartitionResult {
  const sorted = bucket.slice().sort(function (a, b) {
    return getPlayerNumericScore(b) - getPlayerNumericScore(a);
  });
  const team0: PlayerLike[] = [];
  const team1: PlayerLike[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const p = sorted[i];
    const c0 = team0.length;
    const c1 = team1.length;
    if (c0 > c1) {
      team1.push(p);
    } else if (c1 > c0) {
      team0.push(p);
    } else {
      const cIf0 = bucketSplitPenalty(team0.concat([p]), team1);
      const cIf1 = bucketSplitPenalty(team0, team1.concat([p]));
      if (cIf0 <= cIf1) team0.push(p);
      else team1.push(p);
    }
  }
  return { team0: team0, team1: team1 };
}

function bestPartitionTwoTeamsInBucket(bucket: PlayerLike[]): PartitionResult {
  const n = bucket.length;
  if (n === 0) return { team0: [], team1: [] };
  if (n === 1) return { team0: [bucket[0]], team1: [] };
  if (n > 14) return greedyPartitionBucket(bucket);

  const k = Math.floor(n / 2);
  let bestCost = Infinity;
  let best0: PlayerLike[] = [];
  let best1: PlayerLike[] = [];
  const chosen: number[] = [];

  function dfs(start: number) {
    if (chosen.length === k) {
      const pick: Record<number, boolean> = {};
      for (let i = 0; i < chosen.length; i += 1) pick[chosen[i]] = true;
      const t0: PlayerLike[] = [];
      const t1: PlayerLike[] = [];
      for (let j = 0; j < n; j += 1) {
        if (pick[j]) t0.push(bucket[j]);
        else t1.push(bucket[j]);
      }
      const c = bucketSplitPenalty(t0, t1);
      if (c < bestCost) {
        bestCost = c;
        best0 = t0;
        best1 = t1;
      }
      return;
    }
    const remain = n - start;
    const need = k - chosen.length;
    if (remain < need) return;
    for (let s = start; s < n; s += 1) {
      chosen.push(s);
      dfs(s + 1);
      chosen.pop();
    }
  }

  dfs(0);
  return { team0: best0, team1: best1 };
}

function buildBalancedTwoTeamGrouping(players: PlayerLike[], selectedPlayerIds: Array<string | null | undefined>): BalancedGroupingResult {
  const selectedSet = new Set(uniqIds(selectedPlayerIds));
  const selectedList = (players || [])
    .filter(function (item) {
      const id = item.playerId || item._id || item.id;
      return id && selectedSet.has(id);
    })
    .map(function (item) {
      const playerId = item.playerId || item._id || item.id;
      return Object.assign({}, item, { playerId: playerId || "" });
    });

  const buckets: Record<PositionKey, PlayerLike[]> = { PG: [], SG: [], SF: [], PF: [], C: [], OTHER: [] };
  for (let b = 0; b < selectedList.length; b += 1) {
    const pl = selectedList[b];
    buckets[normalizePositionKey(pl.position)].push(pl);
  }

  const team0Ids: string[] = [];
  const team1Ids: string[] = [];
  for (let pi = 0; pi < POSITION_ORDER.length; pi += 1) {
    const posKey = POSITION_ORDER[pi];
    const bucket = buckets[posKey];
    if (!bucket.length) continue;
    const part = bestPartitionTwoTeamsInBucket(bucket);
    for (let u = 0; u < part.team0.length; u += 1) team0Ids.push(part.team0[u].playerId || "");
    for (let v = 0; v < part.team1.length; v += 1) team1Ids.push(part.team1[v].playerId || "");
  }

  return {
    groups: [uniqIds(team0Ids), uniqIds(team1Ids)]
  };
}

function buildSnakeGrouping(players: PlayerLike[], selectedPlayerIds: Array<string | null | undefined>, teamCount: NumericLike): SnakeGroupingResult {
  const selectedSet = new Set(uniqIds(selectedPlayerIds));
  const count = Math.max(2, Number(teamCount) || 2);
  const sorted = (players || [])
    .filter(function (item) {
      const id = item.playerId || item._id || item.id;
      return id && selectedSet.has(id);
    })
    .map(function (item) {
      const playerId = item.playerId || item._id || item.id;
      const score = Number(item.overall || item.skillLevel || 0);
      return Object.assign({}, item, { playerId: playerId || "", score: Number.isFinite(score) ? score : 0 });
    })
    .sort(function (a, b) {
      return (b as PlayerLike & { score: number }).score - (a as PlayerLike & { score: number }).score;
    });

  const groups: string[][] = Array.from({ length: count }, function () {
    return [];
  });
  let pointer = 0;
  let step = 1;
  sorted.forEach(function (item) {
    const id = (item as PlayerLike & { playerId: string }).playerId;
    groups[pointer].push(id);
    pointer += step;
    if (pointer >= count) {
      pointer = count - 1;
      step = -1;
    } else if (pointer < 0) {
      pointer = 0;
      step = 1;
    }
  });

  return {
    groups: groups.map(function (ids) {
      return uniqIds(ids);
    })
  };
}

function normalizePlayerStat(item: Partial<PlayerStat>): PlayerStat {
  const next = Object.assign({}, item) as PlayerStat;
  next.points = toNumber(next.points);
  next.rebounds = toNumber(next.rebounds);
  next.assists = toNumber(next.assists);
  next.steals = toNumber(next.steals);
  next.blocks = toNumber(next.blocks);
  next.turnovers = toNumber(next.turnovers);
  next.fouls = toNumber(next.fouls);
  next.shotsMade = toNumber(next.shotsMade);
  next.shotsAttempted = toNumber(next.shotsAttempted);
  next.threePtMade = toNumber(next.threePtMade);
  next.threePtAttempted = toNumber(next.threePtAttempted);
  next.ftMade = toNumber(next.ftMade);
  next.ftAttempted = toNumber(next.ftAttempted);
  next.fgPct = calcFgPct(next.shotsMade, next.shotsAttempted);
  next.threePtPct = calcFgPct(next.threePtMade, next.threePtAttempted);
  next.ftPct = calcFgPct(next.ftMade, next.ftAttempted);
  return next;
}

function prepareMatchForSave(matchData: Partial<Match>): Match {
  const playerStats = (matchData.playerStats || [])
    .filter(function (item) {
      return item && item.played;
    })
    .map(normalizePlayerStat);

  const quarters = (matchData.quarters || []).map(function (item, index) {
    return {
      quarter: item?.quarter || index + 1,
      scoreUs: toNumber(item?.scoreUs),
      scoreOpponent: toNumber(item?.scoreOpponent)
    };
  });

  const scoreUs = toNumber(matchData.scoreUs);
  const scoreOpponent = toNumber(matchData.scoreOpponent);

  return Object.assign({}, matchData, {
    scoreUs: scoreUs,
    scoreOpponent: scoreOpponent,
    quarters: quarters,
    playerStats: playerStats,
    result: getMatchResult(scoreUs, scoreOpponent)
  }) as Match;
}

function extractPlayerMatchStats(match: Partial<Match>): Array<Partial<PlayerStat> & { matchId?: string; teamId?: string; opponent?: string; matchDate?: string; matchType?: string; result?: MatchResult }> {
  return (match.playerStats || [])
    .filter(function (item) {
      return item && item.played;
    })
    .map(function (item) {
      const stat = normalizePlayerStat(item as Partial<PlayerStat>);
      return {
        matchId: match._id,
        playerId: stat.playerId,
        teamId: match.teamId,
        nickname: stat.nickname,
        opponent: match.opponent,
        matchDate: match.matchDate,
        matchType: match.matchType,
        result: getMatchResult(match.scoreUs, match.scoreOpponent),
        points: stat.points,
        rebounds: stat.rebounds,
        assists: stat.assists,
        steals: stat.steals,
        blocks: stat.blocks,
        turnovers: stat.turnovers,
        fouls: stat.fouls,
        shotsMade: stat.shotsMade,
        shotsAttempted: stat.shotsAttempted,
        fgPct: stat.fgPct,
        threePtMade: stat.threePtMade,
        threePtAttempted: stat.threePtAttempted,
        threePtPct: stat.threePtPct,
        ftMade: stat.ftMade,
        ftAttempted: stat.ftAttempted,
        ftPct: stat.ftPct
      };
    });
}

export = {
  calcFgPct: calcFgPct,
  calcTeamPoints: calcTeamPoints,
  calcQuarterTotals: calcQuarterTotals,
  getMatchResult: getMatchResult,
  formatMatchType: formatMatchType,
  getMatchTypeTagClass: getMatchTypeTagClass,
  createEmptyPlayerStat: createEmptyPlayerStat,
  createEmptyMatch: createEmptyMatch,
  buildPlayerStatsForSelection: buildPlayerStatsForSelection,
  isGroupingLocked: isGroupingLocked,
  prepareMatchForSave: prepareMatchForSave,
  extractPlayerMatchStats: extractPlayerMatchStats,
  validateGrouping: validateGrouping,
  buildSnakeGrouping: buildSnakeGrouping,
  buildBalancedTwoTeamGrouping: buildBalancedTwoTeamGrouping
};
