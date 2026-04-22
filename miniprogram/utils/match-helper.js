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

var POSITION_ORDER = ["PG", "SG", "SF", "PF", "C", "OTHER"];

function normalizePositionKey(pos) {
  var p = String(pos || "")
    .trim()
    .toUpperCase();
  if (p === "PG" || p === "SG" || p === "SF" || p === "PF" || p === "C") return p;
  return "OTHER";
}

function getPlayerNumericScore(player) {
  var s = Number(player.overall || player.skillLevel || player.score || 0);
  return Number.isFinite(s) ? s : 0;
}

function avgOf(arr, getter) {
  if (!arr.length) return 0;
  var sum = 0;
  for (var i = 0; i < arr.length; i += 1) {
    sum += getter(arr[i]);
  }
  return sum / arr.length;
}

function numericRange(values) {
  var min = Infinity;
  var max = -Infinity;
  for (var i = 0; i < values.length; i += 1) {
    var v = values[i];
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  var r = max - min;
  return Number.isFinite(r) && r > 0 ? r : 1;
}

function bucketSplitPenalty(team0, team1) {
  var countPen = Math.abs(team0.length - team1.length) * 1e6;
  var all = team0.concat(team1);
  var hs = [];
  var ws = [];
  var ss = [];
  for (var i = 0; i < all.length; i += 1) {
    hs.push(toNumber(all[i].height));
    ws.push(toNumber(all[i].weight));
    ss.push(getPlayerNumericScore(all[i]));
  }
  var rh = numericRange(hs);
  var rw = numericRange(ws);
  var rs = numericRange(ss);
  var h0 = avgOf(team0, function (p) {
    return toNumber(p.height);
  });
  var h1 = avgOf(team1, function (p) {
    return toNumber(p.height);
  });
  var w0 = avgOf(team0, function (p) {
    return toNumber(p.weight);
  });
  var w1 = avgOf(team1, function (p) {
    return toNumber(p.weight);
  });
  var s0 = avgOf(team0, getPlayerNumericScore);
  var s1 = avgOf(team1, getPlayerNumericScore);
  return (
    countPen +
    (Math.abs(h0 - h1) / rh) * 10 +
    (Math.abs(w0 - w1) / rw) * 10 +
    (Math.abs(s0 - s1) / rs) * 10
  );
}

function greedyPartitionBucket(bucket) {
  var sorted = bucket.slice().sort(function (a, b) {
    return getPlayerNumericScore(b) - getPlayerNumericScore(a);
  });
  var team0 = [];
  var team1 = [];
  for (var i = 0; i < sorted.length; i += 1) {
    var p = sorted[i];
    var c0 = team0.length;
    var c1 = team1.length;
    if (c0 > c1) {
      team1.push(p);
    } else if (c1 > c0) {
      team0.push(p);
    } else {
      var cIf0 = bucketSplitPenalty(team0.concat([p]), team1);
      var cIf1 = bucketSplitPenalty(team0, team1.concat([p]));
      if (cIf0 <= cIf1) team0.push(p);
      else team1.push(p);
    }
  }
  return { team0: team0, team1: team1 };
}

function bestPartitionTwoTeamsInBucket(bucket) {
  var n = bucket.length;
  if (n === 0) return { team0: [], team1: [] };
  if (n === 1) return { team0: [bucket[0]], team1: [] };
  if (n > 14) return greedyPartitionBucket(bucket);

  var k = Math.floor(n / 2);
  var bestCost = Infinity;
  var best0 = [];
  var best1 = [];
  var chosen = [];

  function dfs(start) {
    if (chosen.length === k) {
      var pick = {};
      for (var i = 0; i < chosen.length; i += 1) pick[chosen[i]] = true;
      var t0 = [];
      var t1 = [];
      for (var j = 0; j < n; j += 1) {
        if (pick[j]) t0.push(bucket[j]);
        else t1.push(bucket[j]);
      }
      var c = bucketSplitPenalty(t0, t1);
      if (c < bestCost) {
        bestCost = c;
        best0 = t0;
        best1 = t1;
      }
      return;
    }
    var remain = n - start;
    var need = k - chosen.length;
    if (remain < need) return;
    for (var s = start; s < n; s += 1) {
      chosen.push(s);
      dfs(s + 1);
      chosen.pop();
    }
  }

  dfs(0);
  return { team0: best0, team1: best1 };
}

function buildBalancedTwoTeamGrouping(players, selectedPlayerIds) {
  var selectedSet = new Set(uniqIds(selectedPlayerIds));
  var selectedList = (players || [])
    .filter(function (item) {
      var id = item.playerId || item._id || item.id;
      return selectedSet.has(id);
    })
    .map(function (item) {
      var playerId = item.playerId || item._id || item.id;
      return Object.assign({}, item, { playerId: playerId });
    });

  var buckets = { PG: [], SG: [], SF: [], PF: [], C: [], OTHER: [] };
  for (var b = 0; b < selectedList.length; b += 1) {
    var pl = selectedList[b];
    buckets[normalizePositionKey(pl.position)].push(pl);
  }

  var team0Ids = [];
  var team1Ids = [];
  for (var pi = 0; pi < POSITION_ORDER.length; pi += 1) {
    var posKey = POSITION_ORDER[pi];
    var bucket = buckets[posKey];
    if (!bucket.length) continue;
    var part = bestPartitionTwoTeamsInBucket(bucket);
    for (var u = 0; u < part.team0.length; u += 1) team0Ids.push(part.team0[u].playerId);
    for (var v = 0; v < part.team1.length; v += 1) team1Ids.push(part.team1[v].playerId);
  }

  return {
    groups: [uniqIds(team0Ids), uniqIds(team1Ids)]
  };
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
  buildSnakeGrouping: buildSnakeGrouping,
  buildBalancedTwoTeamGrouping: buildBalancedTwoTeamGrouping
};
