/// <reference path="../../../../typings/index.d.ts" />

import db from "../../../utils/db";

type CloudDb = ReturnType<typeof wx.cloud.database>;
type AppDb = {
  getPlayerSeasonStats(playerId: string, season: string): Promise<any>;
};
let cloudDb: CloudDb | null = null;
let appDb: AppDb | null = null;
const COLLECTION_MISSING_CODE = -502005;

interface PlayerDoc {
  _id?: string | number;
  nickname?: string;
  name?: string;
  realName?: string;
  position?: string;
  avatar?: string;
  isMvp?: boolean;
  age?: number | string;
  birthday?: unknown;
  height?: number | string;
  weight?: number | string;
  createdAt?: unknown;
}

interface PlayerView {
  _id: string;
  nickname: string;
  realName: string;
  position: string;
  avatar: string;
  isMvp: boolean;
  age: number | string;
  birthdayText: string;
  height: number | string;
  weight: number | string;
  createdAtText: string;
}

interface EditForm {
  nickname: string;
  realName: string;
  positionIndex: number;
  birthday: string;
  height: string;
  weight: string;
  avatar: string;
  isMvp: boolean;
}

interface DetailData {
  loading: boolean;
  player: PlayerView | null;
  errorMessage: string;
  editing: boolean;
  saving: boolean;
  playerId: string;
  editForm: EditForm;
  positionDisplayNames: string[];
  matchStats: any;
  avatarPickerVisible: boolean;
  selectedAvatarId: string;
}

function isCollectionMissing(error: any): boolean {
  if (!error) return false;
  const message = String(error.message || error.errMsg || "");
  return Number(error.errCode) === COLLECTION_MISSING_CODE || message.includes("DATABASE_COLLECTION_NOT_EXIST");
}

function formatDate(value: unknown): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return y + "-" + m + "-" + d + " " + hh + ":" + mm;
}

function calcAge(birthday: unknown): number | null {
  if (!birthday) return null;
  const birthDate = birthday instanceof Date ? birthday : new Date(birthday as string | number);
  if (Number.isNaN(birthDate.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const mDiff = now.getMonth() - birthDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatBirthday(value: unknown): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

const positions = ["PG", "SG", "SF", "PF", "C"];
const positionDisplayNames = ["控球后卫 PG", "得分后卫 SG", "小前锋 SF", "大前锋 PF", "中锋 C"];

function getPositionIndex(pos: string): number {
  const idx = positions.indexOf(pos);
  return idx >= 0 ? idx : 2;
}

function getCloudDb(): CloudDb {
  if (!cloudDb) {
    cloudDb = wx.cloud.database();
  }
  return cloudDb;
}

function getAppDb(): AppDb {
  if (!appDb) {
    appDb = db as unknown as AppDb;
  }
  return appDb;
}

Page({
  data: {
    loading: true,
    player: null,
    errorMessage: "",
    editing: false,
    saving: false,
    playerId: "",
    editForm: {
      nickname: "",
      realName: "",
      positionIndex: 0,
      birthday: "",
      height: "",
      weight: "",
      avatar: "",
      isMvp: false
    },
    positionDisplayNames,
    matchStats: null,
    avatarPickerVisible: false,
    selectedAvatarId: ""
  } as DetailData,

  onLoad(options: { id?: string }) {
    const id = options.id;
    if (!id) {
      this.setData({
        loading: false,
        errorMessage: "缺少球员ID"
      });
      return;
    }
    this.setData({ playerId: id });
    this.loadPlayer(id);
  },

  loadPlayer(id: string) {
    const that = this;
    const db = getCloudDb();
    that.setData({ loading: true, errorMessage: "" });
    db.collection("players").doc(id).get().then(function (res: { data?: Partial<PlayerDoc> | null }) {
      const player = res.data;
      if (!player) {
        that.setData({
          loading: false,
          errorMessage: "球员不存在或已删除"
        });
        return;
      }
      const age = calcAge(player.birthday);
      that.setData({
        loading: false,
        player: {
          _id: String(player._id || id),
          nickname: player.nickname || player.name || "未命名球员",
          realName: player.realName || "-",
          position: player.position || "-",
          avatar: player.avatar || "",
          isMvp: player.isMvp || false,
          age: age !== null ? age : player.age || "-",
          birthdayText: formatBirthday(player.birthday),
          height: player.height || "-",
          weight: player.weight || "-",
          createdAtText: formatDate(player.createdAt)
        }
      });
      that.loadPlayerMatchStats(id);
    }).catch(function (error: any) {
      const message = isCollectionMissing(error)
        ? "当前环境缺少 players 集合，请先在 CloudBase 控制台创建"
        : "加载失败，请稍后重试";
      that.setData({
        loading: false,
        errorMessage: message
      });
      console.error("load player detail failed:", error);
    });
  },

  onEdit() {
    const player = this.data.player as PlayerView;
    // 从 birthdayText 反推 birthday 字符串（YYYY-MM-DD）
    let birthdayStr = "";
    if (player.birthdayText && player.birthdayText !== "-") {
      birthdayStr = player.birthdayText;
    }
    this.setData({
      editing: true,
      editForm: {
        nickname: player.nickname === "未命名球员" ? "" : player.nickname,
        realName: player.realName === "-" ? "" : player.realName,
        positionIndex: getPositionIndex(player.position),
        birthday: birthdayStr,
        height: player.height === "-" ? "" : String(player.height),
        weight: player.weight === "-" ? "" : String(player.weight),
        avatar: player.avatar || "",
        isMvp: player.isMvp || false
      }
    });
  },

  onCancel() {
    this.setData({
      editing: false,
      avatarPickerVisible: false
    });
  },

  onChooseAvatar() {
    this.setData({ avatarPickerVisible: true });
  },

  onAvatarSelected(e: WechatMiniprogram.CustomEvent) {
    const avatar = e.detail as { url?: string; id?: string };
    this.setData({
      "editForm.avatar": avatar.url || "",
      selectedAvatarId: avatar.id || ""
    });
  },

  onAvatarPickerClose() {
    this.setData({ avatarPickerVisible: false });
  },

  onEditInput(e: WechatMiniprogram.BaseEvent) {
    const field = (e.currentTarget.dataset.field || "") as keyof EditForm;
    this.setData({
      ["editForm." + field]: (e as WechatMiniprogram.CustomEvent).detail.value
    });
  },

  onEditPositionChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      "editForm.positionIndex": Number(e.detail.value)
    });
  },

  onEditBirthdayChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      "editForm.birthday": e.detail.value
    });
  },

  onToggleMvpEdit(e: WechatMiniprogram.CustomEvent) {
    this.setData({ "editForm.isMvp": e.detail.value });
  },

  validateEditForm(): string {
    const form = this.data.editForm;
    if (!form.nickname.trim()) {
      return "请输入昵称";
    }
    if (form.nickname.trim().length > 20) {
      return "昵称不能超过20个字符";
    }

    const heightNum = Number(form.height);
    const weightNum = Number(form.weight);

    if (form.height && (!Number.isFinite(heightNum) || heightNum < 120 || heightNum > 250)) {
      return "身高需为120-250cm";
    }
    if (form.weight && (!Number.isFinite(weightNum) || weightNum < 30 || weightNum > 200)) {
      return "体重需为30-200kg";
    }

    if (form.birthday) {
      const age = calcAge(form.birthday);
      if (age! < 10 || age! > 60) {
        return "年龄需在10-60岁之间（当前 " + age + " 岁）";
      }
    }

    return "";
  },

  onSave() {
    const that = this;
    const errorMsg = that.validateEditForm();
    if (errorMsg) {
      wx.showToast({ title: errorMsg, icon: "none" });
      return;
    }

    const form = that.data.editForm;
    const updateData: Record<string, any> = {
      nickname: form.nickname.trim(),
      realName: form.realName.trim(),
      position: positions[form.positionIndex],
      avatar: form.avatar || "",
      isMvp: Boolean(form.isMvp),
      updatedAt: getCloudDb().serverDate()
    };

    if (form.height) {
      updateData.height = Number(form.height);
    } else {
      updateData.height = getCloudDb().command.remove();
    }
    if (form.weight) {
      updateData.weight = Number(form.weight);
    } else {
      updateData.weight = getCloudDb().command.remove();
    }
    if (form.birthday) {
      updateData.birthday = new Date(form.birthday);
      updateData.age = calcAge(form.birthday);
    } else {
      updateData.birthday = getCloudDb().command.remove();
      updateData.age = getCloudDb().command.remove();
    }

    that.setData({ saving: true });
    wx.showLoading({ title: "保存中...", mask: true });

    getCloudDb().collection("players").doc(that.data.playerId).update({
      data: updateData
    }).then(function () {
      wx.hideLoading();
      that.setData({ saving: false, editing: false });
      wx.showToast({ title: "保存成功", icon: "success" });
      // 重新加载数据
      that.loadPlayer(that.data.playerId);
    }).catch(function (error: any) {
      wx.hideLoading();
      that.setData({ saving: false });
      wx.showToast({ title: "保存失败，请重试", icon: "none" });
      console.error("update player failed:", error);
    });
  },

  async loadPlayerMatchStats(playerId: string): Promise<void> {
    try {
      const year = new Date().getFullYear();
      const stats = await getAppDb().getPlayerSeasonStats(playerId, String(year));
      this.setData({ matchStats: stats });
    } catch (error) {
      console.error("load player match stats failed:", error);
    }
  },

  goMatchRecords() {
    wx.navigateTo({
      url: `/pages/match/list/list?playerId=${this.data.playerId}`
    });
  }
});

export {};
