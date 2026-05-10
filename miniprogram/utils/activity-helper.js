function pad(num) {
  return String(num).padStart(2, "0");
}

function formatDate(date) {
  var d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) d = new Date();
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function formatTime(date) {
  var d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) d = new Date();
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function getDefaultDeadline(date, startTime) {
  if (!date) return "";
  return date + " " + (startTime || "18:00");
}

function createEmptyActivity() {
  var now = new Date();
  return {
    title: "",
    activityDate: formatDate(now),
    startTime: "19:00",
    endTime: "22:00",
    location: "",
    ruleType: "ncaa",
    formatType: "3team-double-round-robin",
    teamCount: 3,
    teamNames: ["白队", "黑队", "红队"],
    status: "draft",
    registrationDeadline: getDefaultDeadline(formatDate(now), "18:00"),
    groupingSnapshot: {
      version: 1,
      teams: [
        { teamName: "白队", playerIds: [] },
        { teamName: "黑队", playerIds: [] },
        { teamName: "红队", playerIds: [] }
      ],
      lockedAt: null
    }
  };
}

function formatActivityStatus(status) {
  var map = {
    draft: "草稿",
    registration_open: "报名中",
    registration_closed: "已截止报名",
    grouped: "已分组",
    in_progress: "进行中",
    finished: "已结束"
  };
  return map[status] || "草稿";
}

function normalizeTeamNames(teamNames) {
  return (teamNames || [])
    .map(function (item) {
      return String(item || "").trim();
    })
    .filter(Boolean);
}

function validateActivityForm(form) {
  if (!form.title || !String(form.title).trim()) return "请输入活动名称";
  if (!form.activityDate) return "请选择活动日期";
  if (!form.startTime) return "请选择开始时间";
  if (!form.endTime) return "请选择结束时间";
  if (form.endTime <= form.startTime) return "结束时间需晚于开始时间";
  var names = normalizeTeamNames(form.teamNames);
  if (names.length !== 3) return "请填写3支队伍名称";
  if (new Set(names).size !== names.length) return "队伍名称不能重复";
  return "";
}

function prepareActivityForSave(form, extraData) {
  var teamNames = normalizeTeamNames(form.teamNames);
  var groupingTeams = teamNames.map(function (name) {
    return { teamName: name, playerIds: [] };
  });
  return Object.assign(
    {
      title: String(form.title || "").trim(),
      activityDate: form.activityDate,
      startTime: form.startTime,
      endTime: form.endTime,
      location: String(form.location || "").trim(),
      ruleType: form.ruleType || "ncaa",
      formatType: form.formatType || "3team-double-round-robin",
      teamCount: 3,
      teamNames: teamNames,
      registrationDeadline: form.registrationDeadline || getDefaultDeadline(form.activityDate, "18:00"),
      groupingSnapshot: {
        version: 1,
        teams: groupingTeams,
        lockedAt: null
      }
    },
    extraData || {}
  );
}

function buildRegistrationPayload(activityId, player) {
  return {
    activityId: activityId,
    playerId: player._id,
    openid: player.linkedOpenid || "",
    nicknameSnapshot: player.nickname || player.name || "未命名球员",
    avatarSnapshot: player.avatar || "",
    positionSnapshot: player.position || "-",
    status: "registered"
  };
}

function getRegisteredPlayerIds(registrations) {
  return (registrations || [])
    .filter(function (item) {
      return item && (item.status === "registered" || item.status === "confirmed");
    })
    .map(function (item) {
      return item.playerId;
    })
    .filter(Boolean);
}

function buildActivityGroupingPayload(teamNames, playerIds, groupedIds, version) {
  var names = normalizeTeamNames(teamNames);
  return {
    version: Number(version) || 1,
    selectedPlayerIds: (playerIds || []).filter(Boolean),
    teams: names.map(function (name, index) {
      return {
        teamName: name,
        playerIds: (groupedIds[index] || []).filter(Boolean)
      };
    }),
    lockedAt: null
  };
}

function validateActivityGrouping(playerIds, groupingSnapshot) {
  return validateGroupingLike(playerIds, groupingSnapshot && groupingSnapshot.teams);
}

function validateGroupingLike(playerIds, teams) {
  var selected = Array.from(new Set((playerIds || []).filter(Boolean)));
  var groups = teams || [];
  if (!selected.length) return { ok: false, message: "当前没有已报名球员" };
  if (groups.length !== 3) return { ok: false, message: "活动分组必须保留3支队伍" };
  var hasEmpty = groups.some(function (team) {
    return !(team && team.playerIds && team.playerIds.length);
  });
  if (hasEmpty) return { ok: false, message: "每支队伍至少分到1名球员" };

  var assigned = [];
  groups.forEach(function (team) {
    assigned = assigned.concat(team.playerIds || []);
  });
  var uniqAssigned = Array.from(new Set(assigned));
  if (uniqAssigned.length !== assigned.length) {
    return { ok: false, message: "同一球员不能同时在多支队伍" };
  }
  var missing = selected.filter(function (id) {
    return uniqAssigned.indexOf(id) < 0;
  });
  if (missing.length) return { ok: false, message: "仍有报名球员未分组" };
  return { ok: true, message: "" };
}

function createDoubleRoundRobinSchedule(teamNames) {
  var names = normalizeTeamNames(teamNames);
  if (names.length !== 3) return [];
  var pairings = [
    [names[0], names[1]],
    [names[0], names[2]],
    [names[1], names[2]]
  ];
  var games = [];
  pairings.concat(pairings).forEach(function (pair, index) {
    games.push({
      roundIndex: index < 3 ? 1 : 2,
      gameIndex: index + 1,
      homeTeamName: pair[0],
      awayTeamName: pair[1]
    });
  });
  return games;
}

function buildMatchGroupingFromActivity(groupingSnapshot, homeTeamName, awayTeamName) {
  var teams = ((groupingSnapshot && groupingSnapshot.teams) || []).filter(function (team) {
    return team && (team.teamName === homeTeamName || team.teamName === awayTeamName);
  });
  return {
    teams: teams.map(function (team) {
      return {
        teamName: team.teamName,
        playerIds: (team.playerIds || []).slice()
      };
    })
  };
}

module.exports = {
  createEmptyActivity: createEmptyActivity,
  formatActivityStatus: formatActivityStatus,
  formatDate: formatDate,
  formatTime: formatTime,
  getDefaultDeadline: getDefaultDeadline,
  normalizeTeamNames: normalizeTeamNames,
  validateActivityForm: validateActivityForm,
  prepareActivityForSave: prepareActivityForSave,
  buildRegistrationPayload: buildRegistrationPayload,
  getRegisteredPlayerIds: getRegisteredPlayerIds,
  buildActivityGroupingPayload: buildActivityGroupingPayload,
  validateActivityGrouping: validateActivityGrouping,
  createDoubleRoundRobinSchedule: createDoubleRoundRobinSchedule,
  buildMatchGroupingFromActivity: buildMatchGroupingFromActivity
};
