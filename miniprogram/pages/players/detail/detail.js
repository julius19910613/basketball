const db = wx.cloud.database();
const COLLECTION_MISSING_CODE = -502005;

function isCollectionMissing(error) {
  if (!error) return false;
  const message = String(error.message || error.errMsg || "");
  return Number(error.errCode) === COLLECTION_MISSING_CODE || message.includes("DATABASE_COLLECTION_NOT_EXIST");
}

function formatDate(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

Page({
  data: {
    loading: true,
    player: null,
    errorMessage: ""
  },

  onLoad(options) {
    const id = options.id;
    if (!id) {
      this.setData({
        loading: false,
        errorMessage: "缺少球员ID"
      });
      return;
    }
    this.loadPlayer(id);
  },

  async loadPlayer(id) {
    this.setData({ loading: true, errorMessage: "" });
    try {
      const res = await db.collection("players").doc(id).get();
      const player = res.data;
      if (!player) {
        this.setData({
          loading: false,
          errorMessage: "球员不存在或已删除"
        });
        return;
      }
      this.setData({
        loading: false,
        player: {
          ...player,
          nickname: player.nickname || player.name || "未命名球员",
          realName: player.realName || "-",
          position: player.position || "-",
          age: player.age || "-",
          birthdayText: player.birthday ? (player.birthday instanceof Date
            ? player.birthday.getFullYear() + '-' + String(player.birthday.getMonth()+1).padStart(2,'0') + '-' + String(player.birthday.getDate()).padStart(2,'0')
            : String(player.birthday).split('T')[0]) : "-",
          height: player.height || "-",
          weight: player.weight || "-",
          createdAtText: formatDate(player.createdAt)
        }
      });
    } catch (error) {
      const message = isCollectionMissing(error)
        ? "当前环境缺少 players 集合，请先在 CloudBase 控制台创建"
        : "加载失败，请稍后重试";
      this.setData({
        loading: false,
        errorMessage: message
      });
      console.error("load player detail failed:", error);
    }
  }
});
