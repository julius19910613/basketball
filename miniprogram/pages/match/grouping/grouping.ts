/// <reference path="../../../../typings/index.d.ts" />

type Id = string | number;

interface MatchPlayer {
  _id?: Id;
  id?: Id;
  playerId?: Id;
  nickname?: string;
  name?: string;
  position?: string;
  overall?: number;
  [key: string]: any;
}

interface DisplayPlayer extends MatchPlayer {
  playerId: Id;
  displayNickname: string;
  displayPosition: string;
}

interface TeamGroup {
  teamName: string;
  playerIds: Id[];
  [key: string]: any;
}

interface GroupingPayload {
  selectedPlayerIds: Id[];
  playerStats: any[];
  grouping: {
    teams: TeamGroup[];
  };
}

interface MatchRecord {
  _id?: Id;
  selectedPlayerIds?: Id[];
  playerStats?: any[];
  teamNames?: string[];
  grouping?: {
    teams?: TeamGroup[];
    teamAPlayerIds?: Id[];
    teamBPlayerIds?: Id[];
    [key: string]: any;
  } | null;
  [key: string]: any;
}

interface GroupingPageData {
  loading: boolean;
  saving: boolean;
  matchId: string;
  match: MatchRecord | null;
  players: DisplayPlayer[];
  selectedPlayerIds: Id[];
  teamGroups: TeamGroup[];
  showPlayerPicker: boolean;
  tempSelectedPlayerIds: Id[];
  groupedPlayers: Array<{
    teamName: string;
    playerIds: Id[];
    players: DisplayPlayer[];
  }>;
  unassignedPlayers: DisplayPlayer[];
  matchTeamsText: string;
  statusText: string;
}

interface LoadOptions {
  id?: string;
  [key: string]: any;
}

interface DatasetEvent extends WechatMiniprogram.BaseEvent {
  currentTarget: WechatMiniprogram.BaseEvent["currentTarget"] & {
    dataset: {
      id?: Id;
      targetIndex?: string | number;
    };
  };
  detail: {
    value?: any;
    [key: string]: any;
  };
}

let dbModule: any;
let helperModule: any;
let cloudDb: any;

function getDb(): any {
  if (!dbModule) {
    dbModule = require("../../../utils/db");
  }
  return dbModule;
}

function getHelper(): any {
  if (!helperModule) {
    helperModule = require("../../../utils/match-helper");
  }
  return helperModule;
}

function getCloudDb(): any {
  if (!cloudDb) {
    cloudDb = wx.cloud.database();
  }
  return cloudDb;
}

Page({
  data: {
    loading: true,
    saving: false,
    matchId: "",
    match: null,
    players: [],
    selectedPlayerIds: [],
    teamGroups: [],
    showPlayerPicker: false,
    tempSelectedPlayerIds: [],
    groupedPlayers: [],
    unassignedPlayers: [],
    matchTeamsText: "",
    statusText: ""
  } as GroupingPageData,

  async onLoad(options: LoadOptions): Promise<void> {
    const matchId = options.id || "";
    if (!matchId) {
      wx.showToast({ title: "缺少比赛ID", icon: "none" });
      wx.navigateBack();
      return;
    }
    this.setData({ matchId });
    await this.loadData();
  },

  async loadData(): Promise<void> {
    this.setData({ loading: true });
    try {
      const db = getDb();
      const helper = getHelper();
      const [match, playersRes] = await Promise.all([
        db.getMatchDetail(this.data.matchId),
        getCloudDb().collection("players").orderBy("createdAt", "desc").get()
      ]);

      const players = ((playersRes.data || []) as MatchPlayer[])
        .map((item: MatchPlayer) => ({
          ...item,
          playerId: item._id || item.id || item.playerId || "",
          displayNickname: item.nickname || item.name || "未命名球员",
          displayPosition: item.position || "-"
        }))
        .filter((item: DisplayPlayer) => !!item.playerId);

      const selectedPlayerIds = ((match.selectedPlayerIds || []) as Id[])
        .concat(((match.playerStats || []) as any[]).filter((p: any) => p.played).map((p: any) => p.playerId))
        .filter(Boolean) as Id[];
      const uniqSelected = Array.from(new Set(selectedPlayerIds));
      const teamNames = ((match.teamNames || []) as string[]).filter(Boolean);
      const defaultTeams = teamNames.length >= 2 ? teamNames : ["A队", "B队"];
      let groupsFromDoc = (((match.grouping && match.grouping.teams) || []) as TeamGroup[]);
      if (!groupsFromDoc.length && match.grouping) {
        groupsFromDoc = [
          { teamName: defaultTeams[0], playerIds: match.grouping.teamAPlayerIds || [] },
          { teamName: defaultTeams[1], playerIds: match.grouping.teamBPlayerIds || [] }
        ];
      }
      const teamGroups = defaultTeams.map((name: string, index: number) => {
        const found = groupsFromDoc[index] || ({} as TeamGroup);
        const ids = ((found.playerIds || []) as Id[]).filter((id: Id) => uniqSelected.includes(id));
        return { teamName: name, playerIds: ids };
      });

      this.setData({
        loading: false,
        match,
        matchTeamsText: (((match.teamNames || []) as string[]).filter(Boolean).join(" vs ")) || "未设置队伍",
        statusText: helper.isGroupingLocked(match) ? "分组已锁定" : "草稿",
        players,
        selectedPlayerIds: uniqSelected,
        teamGroups,
        tempSelectedPlayerIds: uniqSelected
      });
      this.syncDisplayPlayers();
    } catch (err) {
      console.error("load grouping data failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载分组失败", icon: "none" });
    }
  },

  getPlayerById(id: Id): DisplayPlayer | null {
    return this.data.players.find((item: DisplayPlayer) => item.playerId === id) || null;
  },

  getTeamPlayers(ids: Id[]): DisplayPlayer[] {
    return (ids || []).map((id: Id) => this.getPlayerById(id)).filter(Boolean) as DisplayPlayer[];
  },

  getUnassignedPlayerIds(): Id[] {
    const assignedIds: Id[] = [];
    (this.data.teamGroups || []).forEach((group: TeamGroup) => {
      assignedIds.push(...(group.playerIds || []));
    });
    const assigned = new Set(assignedIds);
    return this.data.selectedPlayerIds.filter((id: Id) => !assigned.has(id));
  },

  syncDisplayPlayers(): void {
    const groupedPlayers = (this.data.teamGroups || []).map((group: TeamGroup) => ({
      teamName: group.teamName,
      playerIds: group.playerIds || [],
      players: this.getTeamPlayers(group.playerIds || [])
    }));
    this.setData({
      groupedPlayers,
      unassignedPlayers: this.getTeamPlayers(this.getUnassignedPlayerIds())
    });
  },

  isGroupingLocked(): boolean {
    return !!getHelper().isGroupingLocked(this.data.match);
  },

  onShowPlayerPicker(): void {
    if (this.isGroupingLocked()) return;
    this.setData({
      showPlayerPicker: true,
      tempSelectedPlayerIds: [...this.data.selectedPlayerIds]
    });
  },

  onHidePlayerPicker(): void {
    this.setData({ showPlayerPicker: false });
  },

  onPlayerSelectionChange(e: DatasetEvent): void {
    const next = (e.detail && e.detail.value) || [];
    this.setData({ tempSelectedPlayerIds: next });
  },

  onConfirmPlayerPicker(): void {
    const selectedPlayerIds = Array.from(new Set(this.data.tempSelectedPlayerIds));
    const selectedSet = new Set(selectedPlayerIds);
    this.setData({
      selectedPlayerIds,
      teamGroups: (this.data.teamGroups || []).map((group: TeamGroup) => ({
        ...group,
        playerIds: (group.playerIds || []).filter((id: Id) => selectedSet.has(id))
      })),
      showPlayerPicker: false
    });
    this.syncDisplayPlayers();
  },

  onMovePlayer(e: DatasetEvent): void {
    if (this.isGroupingLocked()) return;
    const { id, targetIndex } = e.currentTarget.dataset;
    const index = Number(targetIndex);
    if (!id || Number.isNaN(index)) return;

    const teamGroups = (this.data.teamGroups || []).map((group: TeamGroup, groupIndex: number) => {
      const filtered = (group.playerIds || []).filter((item: Id) => item !== id);
      if (groupIndex === index) return { ...group, playerIds: Array.from(new Set(filtered.concat(id))) };
      return { ...group, playerIds: filtered };
    });
    this.setData({ teamGroups });
    this.syncDisplayPlayers();
  },

  onAutoBalance(): void {
    if (this.isGroupingLocked()) return;
    if (this.data.selectedPlayerIds.length < 2) {
      wx.showToast({ title: "至少选择2名球员", icon: "none" });
      return;
    }
    const helper = getHelper();
    const grouped =
      (this.data.teamGroups || []).length === 2
        ? helper.buildBalancedTwoTeamGrouping(this.data.players, this.data.selectedPlayerIds)
        : helper.buildSnakeGrouping(this.data.players, this.data.selectedPlayerIds, this.data.teamGroups.length);
    const teamGroups = (this.data.teamGroups || []).map((group: TeamGroup, index: number) => ({
      ...group,
      playerIds: (grouped.groups && grouped.groups[index]) || []
    }));
    this.setData({ teamGroups });
    this.syncDisplayPlayers();
  },

  buildGroupingPayload(): GroupingPayload {
    const helper = getHelper();
    return {
      selectedPlayerIds: this.data.selectedPlayerIds,
      playerStats: helper.buildPlayerStatsForSelection(
        this.data.players,
        (this.data.match && this.data.match.playerStats) || [],
        this.data.selectedPlayerIds
      ),
      grouping: {
        teams: (this.data.teamGroups || []).map((group: TeamGroup) => ({
          teamName: group.teamName,
          playerIds: group.playerIds || []
        }))
      }
    };
  },

  async onSaveDraft(): Promise<void> {
    if (this.isGroupingLocked()) return;
    this.setData({ saving: true });
    wx.showLoading({ title: "保存草稿..." });
    try {
      const db = getDb();
      const helper = getHelper();
      await db.updateDraftGrouping(this.data.matchId, this.buildGroupingPayload());
      wx.hideLoading();
      wx.showToast({ title: "草稿已保存", icon: "success" });
      const latest = await db.getMatchDetail(this.data.matchId);
      this.setData({
        match: latest,
        statusText: helper.isGroupingLocked(latest) ? "分组已锁定" : "草稿"
      });
    } catch (err) {
      console.error("save draft failed", err);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onFinalize(): Promise<void> {
    if (this.isGroupingLocked()) return;
    const helper = getHelper();
    const check = helper.validateGrouping(this.data.selectedPlayerIds, {
      teams: (this.data.teamGroups || []).map((group: TeamGroup) => ({
        teamName: group.teamName,
        playerIds: group.playerIds || []
      }))
    });
    if (!check.ok) {
      wx.showToast({ title: check.message, icon: "none" });
      return;
    }

    const confirm = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: "完成分组",
        content: "保存后分组将不可修改，是否继续？",
        success: (res: WechatMiniprogram.ShowModalSuccessCallbackResult) => resolve(!!res.confirm),
        fail: () => resolve(false)
      });
    });
    if (!confirm) return;

    this.setData({ saving: true });
    wx.showLoading({ title: "正在完成..." });
    try {
      await getDb().finalizeMatchGrouping(this.data.matchId, this.buildGroupingPayload());
      wx.hideLoading();
      wx.showToast({ title: "分组已完成", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/match/detail/detail?id=${this.data.matchId}` });
      }, 400);
    } catch (err) {
      console.error("finalize grouping failed", err);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  }
});

export {};
