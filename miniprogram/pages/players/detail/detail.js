const db = wx.cloud.database();

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
          height: player.height || "-",
          weight: player.weight || "-",
          createdAtText: formatDate(player.createdAt)
        }
      });
    } catch (error) {
      this.setData({
        loading: false,
        errorMessage: "加载失败，请稍后重试"
      });
      console.error("load player detail failed:", error);
    }
  }
});
