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
    cup: "杯赛"
  };
  return map[type] || "友谊赛";
}

function getMatchTypeTagClass(type) {
  var map = {
    friendly: "tag-friendly",
    league: "tag-league",
    cup: "tag-cup"
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
    opponent: "",
    matchDate: formatDate(new Date()),
    startTime: "",
    endTime: "",
    location: "",
    matchType: "friendly",
    status: "completed",
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
  extractPlayerMatchStats: extractPlayerMatchStats
};
