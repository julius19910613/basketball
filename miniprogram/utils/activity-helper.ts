function pad(num: number): string {
  return String(num).padStart(2, "0");
}

function formatDate(date: Date | string | number): string {
  let d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) d = new Date();
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function formatTime(date: Date | string | number): string {
  let d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) d = new Date();
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function getDefaultDeadline(date: string, startTime?: string): string {
  if (!date) return "";
  return date + " " + (startTime || "18:00");
}

type ActivityStatus =
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "grouped"
  | "in_progress"
  | "finished";

interface GroupingTeam {
  teamName: string;
  playerIds: string[];
}

interface GroupingSnapshot {
  version: number;
  teams: GroupingTeam[];
  lockedAt: string | null;
  selectedPlayerIds?: string[];
}

interface ActivityFormInput {
  title?: string;
  activityDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  ruleType?: string;
  formatType?: string;
  teamNames?: Array<string | null | undefined>;
  status?: ActivityStatus | string;
  registrationDeadline?: string;
  groupingSnapshot?: GroupingSnapshot;
}

interface ActivityFormData {
  title: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  location: string;
  ruleType: string;
  formatType: string;
  teamCount: number;
  teamNames: string[];
  status: ActivityStatus;
  registrationDeadline: string;
  groupingSnapshot: GroupingSnapshot;
}

interface ActivitySaveBase {
  title: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  location: string;
  ruleType: string;
  formatType: string;
  teamCount: number;
  teamNames: string[];
  registrationDeadline: string;
  groupingSnapshot: GroupingSnapshot;
}

type SaveExtraData = Record<string, unknown>;
type ActivitySavePayload = ActivitySaveBase & SaveExtraData;

interface RegistrationPlayer {
  _id: string;
  linkedOpenid?: string;
  nickname?: string;
  name?: string;
  avatar?: string;
  position?: string;
}

interface RegistrationPayload {
  activityId: string;
  playerId: string;
  openid: string;
  nicknameSnapshot: string;
  avatarSnapshot: string;
  positionSnapshot: string;
  status: "registered";
}

interface ActivityRegistrationRecord {
  status?: string;
  playerId?: string;
}

interface GroupingValidationResult {
  ok: boolean;
  message: string;
}

interface ScheduleGame {
  roundIndex: number;
  gameIndex: number;
  homeTeamName: string;
  awayTeamName: string;
}

interface GroupingSnapshotInput {
  teams?: Array<{
    teamName?: string;
    playerIds?: string[];
  } | null> | null;
}

function createEmptyActivity(): ActivityFormData {
  const now = new Date();
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

function formatActivityStatus(status?: string): string {
  const map: Record<ActivityStatus, string> = {
    draft: "草稿",
    registration_open: "报名中",
    registration_closed: "已截止报名",
    grouped: "已分组",
    in_progress: "进行中",
    finished: "已结束"
  };
  return map[status as ActivityStatus] || "草稿";
}

function normalizeTeamNames(teamNames?: Array<string | null | undefined>): string[] {
  return (teamNames || [])
    .map(function (item: string | null | undefined) {
      return String(item || "").trim();
    })
    .filter(Boolean);
}

function validateActivityForm(form: ActivityFormInput): string {
  if (!form.title || !String(form.title).trim()) return "请输入活动名称";
  if (!form.activityDate) return "请选择活动日期";
  if (!form.startTime) return "请选择开始时间";
  if (!form.endTime) return "请选择结束时间";
  if (form.endTime <= form.startTime) return "结束时间需晚于开始时间";
  const names = normalizeTeamNames(form.teamNames);
  if (names.length !== 3) return "请填写3支队伍名称";
  if (new Set(names).size !== names.length) return "队伍名称不能重复";
  return "";
}

function prepareActivityForSave(form: ActivityFormInput, extraData?: SaveExtraData): ActivitySavePayload {
  const teamNames = normalizeTeamNames(form.teamNames);
  const groupingTeams = teamNames.map(function (name: string) {
    return { teamName: name, playerIds: [] };
  });
  return Object.assign(
    {
      title: String(form.title || "").trim(),
      activityDate: form.activityDate || "",
      startTime: form.startTime || "",
      endTime: form.endTime || "",
      location: String(form.location || "").trim(),
      ruleType: form.ruleType || "ncaa",
      formatType: form.formatType || "3team-double-round-robin",
      teamCount: 3,
      teamNames: teamNames,
      registrationDeadline: form.registrationDeadline || getDefaultDeadline(form.activityDate || "", "18:00"),
      groupingSnapshot: {
        version: 1,
        teams: groupingTeams,
        lockedAt: null
      }
    },
    extraData || {}
  ) as ActivitySavePayload;
}

function buildRegistrationPayload(activityId: string, player: RegistrationPlayer): RegistrationPayload {
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

function getRegisteredPlayerIds(registrations?: ActivityRegistrationRecord[]): string[] {
  return (registrations || [])
    .filter(function (item: ActivityRegistrationRecord | undefined) {
      return item && (item.status === "registered" || item.status === "confirmed");
    })
    .map(function (item: ActivityRegistrationRecord) {
      return item.playerId;
    })
    .filter(Boolean) as string[];
}

function buildActivityGroupingPayload(teamNames: Array<string | null | undefined>, playerIds: string[], groupedIds: string[][], version?: number): GroupingSnapshot {
  const names = normalizeTeamNames(teamNames);
  return {
    version: Number(version) || 1,
    selectedPlayerIds: (playerIds || []).filter(Boolean),
    teams: names.map(function (name: string, index: number) {
      return {
        teamName: name,
        playerIds: (groupedIds[index] || []).filter(Boolean)
      };
    }),
    lockedAt: null
  };
}

function validateActivityGrouping(playerIds: string[], groupingSnapshot?: GroupingSnapshotInput | null): GroupingValidationResult {
  return validateGroupingLike(playerIds, groupingSnapshot && groupingSnapshot.teams);
}

function validateGroupingLike(
  playerIds?: Array<string | null | undefined>,
  teams?: Array<{ teamName?: string; playerIds?: string[] } | null> | null
): GroupingValidationResult {
  const selected = Array.from(new Set((playerIds || []).filter(Boolean))) as string[];
  const groups = teams || [];
  if (!selected.length) return { ok: false, message: "当前没有已报名球员" };
  if (groups.length !== 3) return { ok: false, message: "活动分组必须保留3支队伍" };
  const hasEmpty = groups.some(function (team) {
    return !(team && team.playerIds && team.playerIds.length);
  });
  if (hasEmpty) return { ok: false, message: "每支队伍至少分到1名球员" };

  let assigned: string[] = [];
  groups.forEach(function (team) {
    assigned = assigned.concat(team?.playerIds || []);
  });
  const uniqAssigned = Array.from(new Set(assigned));
  if (uniqAssigned.length !== assigned.length) {
    return { ok: false, message: "同一球员不能同时在多支队伍" };
  }
  const missing = selected.filter(function (id) {
    return uniqAssigned.indexOf(id) < 0;
  });
  if (missing.length) return { ok: false, message: "仍有报名球员未分组" };
  return { ok: true, message: "" };
}

function createDoubleRoundRobinSchedule(teamNames?: Array<string | null | undefined>): ScheduleGame[] {
  const names = normalizeTeamNames(teamNames);
  if (names.length !== 3) return [];
  const pairings: [string, string][] = [
    [names[0], names[1]],
    [names[0], names[2]],
    [names[1], names[2]]
  ];
  const games: ScheduleGame[] = [];
  pairings.concat(pairings).forEach(function (pair: [string, string], index: number) {
    games.push({
      roundIndex: index < 3 ? 1 : 2,
      gameIndex: index + 1,
      homeTeamName: pair[0],
      awayTeamName: pair[1]
    });
  });
  return games;
}

function buildMatchGroupingFromActivity(groupingSnapshot: GroupingSnapshotInput | null | undefined, homeTeamName: string, awayTeamName: string): { teams: GroupingTeam[] } {
  const teams = ((groupingSnapshot && groupingSnapshot.teams) || []).filter(function (team) {
    return team && (team.teamName === homeTeamName || team.teamName === awayTeamName);
  });
  return {
    teams: teams.map(function (team) {
      return {
        teamName: team?.teamName || "",
        playerIds: (team?.playerIds || []).slice()
      };
    })
  };
}

export default {
  createEmptyActivity,
  formatActivityStatus,
  formatDate,
  formatTime,
  getDefaultDeadline,
  normalizeTeamNames,
  validateActivityForm,
  prepareActivityForSave,
  buildRegistrationPayload,
  getRegisteredPlayerIds,
  buildActivityGroupingPayload,
  validateActivityGrouping,
  createDoubleRoundRobinSchedule,
  buildMatchGroupingFromActivity
};
