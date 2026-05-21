/// <reference path="../../../../typings/index.d.ts" />
import db from "../../../utils/db";
import helper from "../../../utils/match-helper";

const matchTypeOptions = ["friendly", "league", "cup", "fiba", "ncaa"] as const;
const matchTypeDisplay = ["友谊赛", "联赛", "杯赛", "全场球赛 (FIBA)", "全场球赛 (NCAA)"] as const;

interface PlayerItem {
  _id?: string;
  id?: string;
  playerId?: string;
  nickname?: string;
  name?: string;
  displayNickname: string;
  position?: string;
  displayPosition: string;
  [key: string]: unknown;
}

interface CreatePageData {
  teamId: string;
  matchId: string;
  editMode: boolean;
  loading: boolean;
  saving: boolean;
  players: PlayerItem[];
  selectedPlayerIds: string[];
  tempSelectedPlayerIds: string[];
  showPlayerPicker: boolean;
  isAllPlayersSelected: boolean;
  form: ReturnType<typeof helper.createEmptyMatch>;
}

interface LoadOptions {
  teamId?: string;
  id?: string;
}

interface InputEvent extends WechatMiniprogram.BaseEvent {
  currentTarget: WechatMiniprogram.BaseEvent["currentTarget"] & {
    dataset: {
      field?: string;
      index?: string | number;
    };
  };
  detail: {
    value: string;
  };
}

interface PickerEvent extends WechatMiniprogram.BaseEvent {
  detail: {
    value: string;
  };
}

interface CheckboxEvent extends WechatMiniprogram.BaseEvent {
  detail: {
    value: string[];
  };
}

interface ToggleEvent extends WechatMiniprogram.BaseEvent {
  currentTarget: WechatMiniprogram.BaseEvent["currentTarget"] & {
    dataset: {
      id?: string;
    };
  };
}

Page({
  data: {
    teamId: "",
    matchId: "",
    editMode: false,
    loading: true,
    saving: false,
    players: [],
    selectedPlayerIds: [],
    tempSelectedPlayerIds: [],
    showPlayerPicker: false,
    isAllPlayersSelected: false,
    form: helper.createEmptyMatch("")
  } as CreatePageData,

  async onLoad(options: LoadOptions): Promise<void> {
    const teamId = options.teamId || "";
    const matchId = options.id || "";
    this.setData({ teamId, matchId, editMode: !!matchId, "form.teamId": teamId });
    await this.loadPlayers();
    if (matchId) await this.loadDetail(matchId);
    this.setData({ loading: false });
  },

  async loadPlayers(): Promise<void> {
    try {
      const cloudDb = wx.cloud.database();
      const res = await cloudDb.collection("players").orderBy("createdAt", "desc").get();
      const players = (res.data || [])
        .map((item: Record<string, unknown>) => ({
          ...item,
          playerId: (item._id as string) || (item.id as string) || (item.playerId as string) || "",
          displayNickname: (item.nickname as string) || (item.name as string) || "未命名球员",
          displayPosition: (item.position as string) || "-"
        }))
        .filter((item: PlayerItem) => !!item.playerId);
      this.setData({ players });
    } catch (err) {
      console.error("load players failed", err);
      wx.showToast({ title: "加载球员失败", icon: "none" });
    }
  },

  async loadDetail(id: string): Promise<void> {
    try {
      const detail = await db.getMatchDetail(id);
      const selectedPlayerIds = (detail.selectedPlayerIds || [])
        .concat((detail.playerStats || []).filter((p: { played?: boolean; playerId?: string }) => p.played).map((p: { playerId?: string }) => p.playerId));
      this.setData({
        selectedPlayerIds: Array.from(new Set(selectedPlayerIds)),
        form: Object.assign(helper.createEmptyMatch(this.data.teamId), detail, {
          matchTypeIndex: Math.max(0, matchTypeOptions.indexOf(detail.matchType))
        })
      });
    } catch (err) {
      console.error("load match detail failed", err);
      wx.showToast({ title: "加载比赛失败", icon: "none" });
    }
  },

  onShowPlayerPicker(): void {
    const tempSelectedPlayerIds = [...this.data.selectedPlayerIds];
    const allIds = this.data.players
      .map((player: PlayerItem) => player.playerId)
      .filter((id): id is string => !!id);
    this.setData({
      showPlayerPicker: true,
      tempSelectedPlayerIds,
      isAllPlayersSelected: allIds.length > 0 && allIds.every((id: string) => tempSelectedPlayerIds.includes(id))
    });
  },

  onHidePlayerPicker(): void {
    this.setData({ showPlayerPicker: false });
  },

  onPlayerSelectionChange(e: CheckboxEvent): void {
    const tempSelectedPlayerIds = e.detail.value || [];
    const allIds = this.data.players
      .map((player: PlayerItem) => player.playerId)
      .filter((id): id is string => !!id);
    this.setData({
      tempSelectedPlayerIds,
      isAllPlayersSelected: allIds.length > 0 && allIds.every((id: string) => tempSelectedPlayerIds.includes(id))
    });
  },

  onConfirmPlayers(): void {
    const { tempSelectedPlayerIds, players, form } = this.data;
    const newPlayerStats = helper.buildPlayerStatsForSelection(players, form.playerStats || [], tempSelectedPlayerIds);
    this.setData({
      "form.playerStats": newPlayerStats,
      selectedPlayerIds: [...tempSelectedPlayerIds],
      showPlayerPicker: false
    });
  },

  onTogglePlayerSelection(e: ToggleEvent): void {
    const id = e.currentTarget.dataset.id || "";
    const tempSelectedPlayerIds = this.data.tempSelectedPlayerIds;
    const index = tempSelectedPlayerIds.indexOf(id);
    const newSelected = [...tempSelectedPlayerIds];
    if (index > -1) {
      newSelected.splice(index, 1);
    } else {
      newSelected.push(id);
    }
    const allIds = this.data.players
      .map((player: PlayerItem) => player.playerId)
      .filter((id): id is string => !!id);
    this.setData({
      tempSelectedPlayerIds: newSelected,
      isAllPlayersSelected: allIds.length > 0 && allIds.every((itemId: string) => newSelected.includes(itemId))
    });
  },

  onToggleSelectAllPlayers(): void {
    const allIds = this.data.players
      .map((player: PlayerItem) => player.playerId)
      .filter((id): id is string => !!id);
    if (!allIds.length) {
      this.setData({
        tempSelectedPlayerIds: [],
        isAllPlayersSelected: false
      });
      return;
    }

    const isAllPlayersSelected = allIds.every((id: string) => this.data.tempSelectedPlayerIds.includes(id));
    const nextSelectedIds = isAllPlayersSelected ? [] : allIds;
    this.setData({
      tempSelectedPlayerIds: nextSelectedIds,
      isAllPlayersSelected: !isAllPlayersSelected
    });
  },

  noop(): void {},

  onInput(e: InputEvent): void {
    const field = e.currentTarget.dataset.field || "";
    const value = e.detail.value;
    this.setData({ [`form.${field}`]: value } as unknown as Partial<CreatePageData>);
  },

  onMatchDateChange(e: PickerEvent): void {
    this.setData({ "form.matchDate": e.detail.value });
  },

  onStartTimeChange(e: PickerEvent): void {
    this.setData({ "form.startTime": e.detail.value });
  },

  onEndTimeChange(e: PickerEvent): void {
    this.setData({ "form.endTime": e.detail.value });
  },

  onTypeChange(e: PickerEvent): void {
    const index = Number(e.detail.value);
    this.setData({
      "form.matchType": matchTypeOptions[index],
      "form.matchTypeText": matchTypeDisplay[index]
    });
  },

  onTeamNameInput(e: InputEvent): void {
    const index = Number(e.currentTarget.dataset.index);
    const value = e.detail.value;
    this.setData({ [`form.teamNames[${index}]`]: value } as unknown as Partial<CreatePageData>);
  },

  onAddTeam(): void {
    const names = (this.data.form.teamNames || []).slice();
    names.push(`队伍${names.length + 1}`);
    this.setData({ "form.teamNames": names });
  },

  onRemoveTeam(e: InputEvent): void {
    const index = Number(e.currentTarget.dataset.index);
    const names = (this.data.form.teamNames || []).slice();
    if (names.length <= 2) {
      wx.showToast({ title: "至少保留2支队伍", icon: "none" });
      return;
    }
    names.splice(index, 1);
    this.setData({ "form.teamNames": names });
  },

  validateForm(): string {
    const form = this.data.form;
    const teamNames = (form.teamNames || []).map((name: unknown) => String(name || "").trim()).filter(Boolean);
    if (teamNames.length < 2) return "至少录入2支球队";
    const uniq = new Set(teamNames);
    if (uniq.size !== teamNames.length) return "球队名称不能重复";
    if (!form.matchDate) return "请选择比赛日期";
    if (form.startTime && form.endTime && form.endTime <= form.startTime) return "结束时间需晚于开始时间";
    if (this.data.selectedPlayerIds.length < 4) return "至少选择4名球员";
    return "";
  },

  async onGoGrouping(): Promise<void> {
    const errorMessage = this.validateForm();
    if (errorMessage) {
      wx.showToast({ title: errorMessage, icon: "none" });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({ title: "处理中...", mask: true });
    try {
      const payload = Object.assign({}, this.data.form, {
        _id: this.data.matchId || undefined,
        teamId: this.data.teamId || this.data.form.teamId || "",
        status: "draft",
        isGroupingLocked: false,
        selectedPlayerIds: this.data.selectedPlayerIds,
        teamNames: this.data.form.teamNames.map((name: unknown) => String(name || "").trim()).filter(Boolean),
        grouping: this.data.form.grouping || {
          teams: this.data.form.teamNames.map((name: unknown) => ({ teamName: String(name || "").trim(), playerIds: [] })),
          lockedAt: null
        },
        playerStats: (this.data.form.playerStats || []).map((item: Record<string, unknown>) => ({
          ...item,
          played: this.data.selectedPlayerIds.includes(item.playerId as string)
        }))
      });
      const matchId = await db.saveMatchDraft(payload);
      wx.hideLoading();
      wx.navigateTo({ url: `/pages/match/grouping/grouping?id=${matchId}` });
    } catch (err) {
      console.error("go grouping failed", err);
      wx.hideLoading();
      wx.showToast({ title: "操作失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  }
});

export {};
