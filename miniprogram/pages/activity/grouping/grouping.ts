/// <reference path="../../../../typings/index.d.ts" />

import db from "../../../utils/db";
import helper from "../../../utils/activity-helper";
import matchHelper from "../../../utils/match-helper";
import env from "../../../config/env";

type AppDb = typeof db;
type ActivityHelper = typeof helper;
type MatchHelper = typeof matchHelper;
type EnvModule = typeof env;
type CloudDb = ReturnType<typeof wx.cloud.database>;

interface LoadOptions {
  id?: string;
}

interface ActivityRecord {
  groupingSnapshot?: {
    version?: number;
    teams?: TeamGroup[];
  } | null;
  teamNames?: Array<string | null | undefined>;
  [key: string]: unknown;
}

interface RegistrationRecord {
  playerId?: string;
  status?: string;
  [key: string]: unknown;
}

interface PlayerRecord {
  _id?: string;
  id?: string;
  playerId?: string;
  nickname?: string;
  name?: string;
  position?: string;
  overall?: number;
  displayNickname?: string;
  displayPosition?: string;
  [key: string]: unknown;
}

interface TeamGroup {
  teamName: string;
  playerIds: string[];
}

interface GroupedPlayerGroup extends TeamGroup {
  players: PlayerRecord[];
}

interface GroupingPageData {
  loading: boolean;
  saving: boolean;
  activityId: string;
  activity: ActivityRecord | null;
  players: PlayerRecord[];
  selectedPlayerIds: string[];
  teamGroups: TeamGroup[];
  groupedPlayers: GroupedPlayerGroup[];
  unassignedPlayers: PlayerRecord[];
}

let cloudDb: CloudDb | null = null;

function getDb(): AppDb {
  return db;
}

function getHelper(): ActivityHelper {
  return helper;
}

function getMatchHelper(): MatchHelper {
  return matchHelper;
}

function getEnv(): EnvModule {
  return env;
}

function getCloudDb(): CloudDb {
  if (!cloudDb) {
    cloudDb = wx.cloud.database();
  }
  return cloudDb;
}

Page({
  data: {
    loading: true,
    saving: false,
    activityId: "",
    activity: null,
    players: [],
    selectedPlayerIds: [],
    teamGroups: [],
    groupedPlayers: [],
    unassignedPlayers: []
  } as GroupingPageData,

  onLoad(options: LoadOptions): void {
    const activityId = options.id || "";
    if (!activityId) {
      wx.showToast({ title: "缺少活动ID", icon: "none" });
      wx.navigateBack();
      return;
    }
    this.setData({ activityId });
    void this.loadData();
  },

  async loadData(): Promise<void> {
    this.setData({ loading: true });
    try {
      const pageDb = getCloudDb();
      const [activity, registrations, playersRes] = await Promise.all([
        getDb().getActivityDetail(this.data.activityId),
        getDb().getActivityRegistrations(this.data.activityId),
        pageDb.collection(getEnv().getCollection("players")).orderBy("createdAt", "desc").get()
      ]);

      const players = ((playersRes.data || []) as PlayerRecord[])
        .map((item: PlayerRecord) => ({
          ...item,
          playerId: item._id || item.id || item.playerId || "",
          displayNickname: item.nickname || item.name || "未命名球员",
          displayPosition: item.position || "-"
        }))
        .filter((item: PlayerRecord) => !!item.playerId);

      const selectedPlayerIds = getHelper().getRegisteredPlayerIds((registrations || []) as RegistrationRecord[]);
      const snapshot = (activity && activity.groupingSnapshot) || {};
      const teamNames = ((activity && activity.teamNames) || []).slice(0, 3);
      const savedTeams = (snapshot.teams || []) as TeamGroup[];
      const teamGroups = teamNames.map((teamName: string | null | undefined, index: number) => {
        const found = savedTeams[index] || { playerIds: [] };
        return {
          teamName: String(teamName || ""),
          playerIds: (found.playerIds || []).filter((id: string) => selectedPlayerIds.includes(id))
        };
      });

      this.setData({
        loading: false,
        activity: (activity || null) as ActivityRecord | null,
        players,
        selectedPlayerIds,
        teamGroups
      });
      this.syncDisplayPlayers();
    } catch (err) {
      console.error("load activity grouping failed", err);
      this.setData({ loading: false });
      wx.showToast({ title: "加载分组失败", icon: "none" });
    }
  },

  getPlayerById(id: string): PlayerRecord | null {
    return this.data.players.find((item: PlayerRecord) => item.playerId === id) || null;
  },

  getTeamPlayers(ids: string[]): PlayerRecord[] {
    return (ids || []).map((id: string) => this.getPlayerById(id)).filter(Boolean) as PlayerRecord[];
  },

  getUnassignedPlayerIds(): string[] {
    const assignedIds: string[] = [];
    (this.data.teamGroups || []).forEach((group: TeamGroup) => {
      assignedIds.push(...(group.playerIds || []));
    });
    const assigned = new Set(assignedIds);
    return this.data.selectedPlayerIds.filter((id: string) => !assigned.has(id));
  },

  syncDisplayPlayers(): void {
    this.setData({
      groupedPlayers: (this.data.teamGroups || []).map((group: TeamGroup) => ({
        teamName: group.teamName,
        playerIds: group.playerIds || [],
        players: this.getTeamPlayers(group.playerIds || [])
      })),
      unassignedPlayers: this.getTeamPlayers(this.getUnassignedPlayerIds())
    });
  },

  onMovePlayer(e: WechatMiniprogram.BaseEvent): void {
    const { id, targetIndex } = e.currentTarget.dataset as { id?: string; targetIndex?: string | number };
    const index = Number(targetIndex);
    if (!id || Number.isNaN(index)) return;
    const teamGroups = (this.data.teamGroups || []).map((group: TeamGroup, groupIndex: number) => {
      const filtered = (group.playerIds || []).filter((item: string) => item !== id);
      if (groupIndex === index) return { ...group, playerIds: Array.from(new Set(filtered.concat(id))) };
      return { ...group, playerIds: filtered };
    });
    this.setData({ teamGroups });
    this.syncDisplayPlayers();
  },

  onAutoBalance(): void {
    if (this.data.selectedPlayerIds.length < 6) {
      wx.showToast({ title: "至少6名报名球员才能三队分组", icon: "none" });
      return;
    }
    const grouped = getMatchHelper().buildSnakeGrouping(this.data.players, this.data.selectedPlayerIds, 3);
    const teamGroups = (this.data.teamGroups || []).map((group: TeamGroup, index: number) => ({
      ...group,
      playerIds: (grouped.groups && grouped.groups[index]) || []
    }));
    this.setData({ teamGroups });
    this.syncDisplayPlayers();
  },

  buildGroupingSnapshot(): ReturnType<ActivityHelper["buildActivityGroupingPayload"]> {
    return getHelper().buildActivityGroupingPayload(
      (this.data.activity && this.data.activity.teamNames) || [],
      this.data.selectedPlayerIds,
      (this.data.teamGroups || []).map((group: TeamGroup) => group.playerIds || []),
      (this.data.activity && this.data.activity.groupingSnapshot && this.data.activity.groupingSnapshot.version) || 1
    );
  },

  async onSaveGrouping(): Promise<void> {
    const snapshot = this.buildGroupingSnapshot();
    const check = getHelper().validateActivityGrouping(this.data.selectedPlayerIds, snapshot);
    if (!check.ok) {
      wx.showToast({ title: check.message, icon: "none" });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({ title: "保存分组...", mask: true });
    try {
      await getDb().saveActivityGrouping(this.data.activityId, snapshot);
      wx.hideLoading();
      wx.showToast({ title: "分组已保存", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/activity/detail/detail?id=${this.data.activityId}` });
      }, 250);
    } catch (err) {
      console.error("save activity grouping failed", err);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  }
});

export {};
