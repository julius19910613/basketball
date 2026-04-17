function toNumber(value) {
  var num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function calcFgPct(made, attempted) {
  var m = toNumber(made);
  var a = toNumber(attempted);
  if (!a) return 0;
  return Math.round((m / a) * 1000) / 10;
}

function calcTeamPoints(playerStats) {
  return (playerStats || [])
    .filter(function (item) {
      return item && item.played;
    })
    .reduce(function (sum, item) {
      return sum + toNumber(item.points);
    }, 0);
}

function calcQuarterTotals(quarters) {
  return (quarters || []).reduce(
    function (acc, item) {
      return {
        scoreUs: acc.scoreUs + toNumber(item.scoreUs),
        scoreOpponent: acc.scoreOpponent + toNumber(item.scoreOpponent)
      };
    },
    { scoreUs: 0, scoreOpponent: 0 }
  );
}

function getMatchResult(scoreUs, scoreOpponent) {
  var us = toNumber(scoreUs);
  var opponent = toNumber(scoreOpponent);
  if (us > opponent) return "win";
  if (us < opponent) return "loss";
  return "draw";
}

function formatMatchType(type) {
  var map = {
    friendly: "友谊赛",
    league: "联赛",
    cup: "杯赛",
    fiba: "全场球赛 (FIBA)",
    ncaa: "全场球赛 (NCAA)"
  };
  return map[type] || "友谊赛";
}

function getMatchTypeTagClass(type) {
  var map = {
    friendly: "tag-friendly",
    league: "tag-league",
    cup: "tag-cup",
    fiba: "tag-fiba",
    ncaa: "tag-ncaa"
  };
  return map[type] || "tag-friendly";
}

function formatDate(date) {
  var d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) d = new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function createEmptyPlayerStat(player) {
  return {
    playerId: player._id,
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

function createEmptyMatch(teamId) {
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

function uniqIds(ids) {
  return Array.from(new Set((ids || []).filter(Boolean)));
}

function validateGrouping(selectedPlayerIds, grouping) {
  var selected = uniqIds(selectedPlayerIds);
  var teams = (grouping && grouping.teams) || [];
  if (!selected.length) return { ok: false, message: "请先选择球员" };
  if (teams.length < 2) return { ok: false, message: "至少需要2支队伍" };
  var emptyTeam = teams.some(function (item) {
    return !uniqIds(item && item.playerIds).length;
  });
  if (emptyTeam) return { ok: false, message: "每支队伍至少1名球员" };
  var assigned = [];
  teams.forEach(function (item) {
    assigned = assigned.concat(uniqIds(item && item.playerIds));
  });
  var uniqAssigned = uniqIds(assigned);
  if (uniqAssigned.length !== assigned.length) return { ok: false, message: "同一球员不能同时在多支队伍" };
  var missing = selected.filter(function (id) {
    return !uniqAssigned.includes(id);
  });
  if (missing.length) return { ok: false, message: "仍有球员未分组" };
  return { ok: true, message: "" };
}

function buildSnakeGrouping(players, selectedPlayerIds, teamCount) {
  var selectedSet = new Set(uniqIds(selectedPlayerIds));
  var count = Math.max(2, Number(teamCount) || 2);
  var sorted = (players || [])
    .filter(function (item) {
      return selectedSet.has(item.playerId || item._id || item.id);
    })
    .map(function (item) {
      var playerId = item.playerId || item._id || item.id;
      var score = Number(item.overall || item.skillLevel || 0);
      return Object.assign({}, item, { playerId: playerId, score: Number.isFinite(score) ? score : 0 });
    })
    .sort(function (a, b) {
      return b.score - a.score;
    });

  var groups = Array.from({ length: count }, function () {
    return [];
  });
  var pointer = 0;
  var step = 1;
  sorted.forEach(function (item) {
    groups[pointer].push(item.playerId);
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

function normalizePlayerStat(item) {
  var next = Object.assign({}, item);
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

function prepareMatchForSave(matchData) {
  var playerStats = (matchData.playerStats || [])
    .filter(function (item) {
      return item && item.played;
    })
    .map(normalizePlayerStat);

  var quarters = (matchData.quarters || []).map(function (item, index) {
    return {
      quarter: item.quarter || index + 1,
      scoreUs: toNumber(item.scoreUs),
      scoreOpponent: toNumber(item.scoreOpponent)
    };
  });

  var scoreUs = toNumber(matchData.scoreUs);
  var scoreOpponent = toNumber(matchData.scoreOpponent);

  return Object.assign({}, matchData, {
    scoreUs: scoreUs,
    scoreOpponent: scoreOpponent,
    quarters: quarters,
    playerStats: playerStats,
    result: getMatchResult(scoreUs, scoreOpponent)
  });
}

function extractPlayerMatchStats(match) {
  return (match.playerStats || [])
    .filter(function (item) {
      return item && item.played;
    })
    .map(function (item) {
      var stat = normalizePlayerStat(item);
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

module.exports = {
  calcFgPct: calcFgPct,
  calcTeamPoints: calcTeamPoints,
  calcQuarterTotals: calcQuarterTotals,
  getMatchResult: getMatchResult,
  formatMatchType: formatMatchType,
  getMatchTypeTagClass: getMatchTypeTagClass,
  createEmptyPlayerStat: createEmptyPlayerStat,
  createEmptyMatch: createEmptyMatch,
  prepareMatchForSave: prepareMatchForSave,
  extractPlayerMatchStats: extractPlayerMatchStats,
  validateGrouping: validateGrouping,
  buildSnakeGrouping: buildSnakeGrouping
};
