const db = wx.cloud.database();
const COLLECTION_MISSING_CODE = -502005;

function isCollectionMissing(error) {
  if (!error) return false;
  const message = String(error.message || error.errMsg || "");
  return Number(error.errCode) === COLLECTION_MISSING_CODE || message.includes("DATABASE_COLLECTION_NOT_EXIST");
}

Page({
  data: {
    loading: true,
    players: [],
    collectionMissingNotified: false
  },

  onShow() {
    this.loadPlayers();
  },

  onPullDownRefresh() {
    this.loadPlayers(true);
  },

  async loadPlayers(fromPullDown = false) {
    this.setData({ loading: true });
    try {
      const res = await db.collection("players").orderBy("createdAt", "desc").get();
      const players = (res.data || []).map((item) => ({
        ...item,
        displayNickname: item.nickname || item.name || "未命名球员",
        displayRealName: item.realName || "-",
        displayPosition: item.position || "-"
      }));
      this.setData({ players, loading: false });
    } catch (error) {
      this.setData({ loading: false });
      if (isCollectionMissing(error)) {
        if (!this.data.collectionMissingNotified) {
          this.setData({ collectionMissingNotified: true });
          wx.showModal({
            title: "请先初始化数据库",
            content: "当前环境缺少 players 集合。请到 CloudBase 控制台创建 players 集合后重试。",
            showCancel: false
          });
        }
      } else {
        wx.showToast({ title: "加载球员失败", icon: "none" });
      }
      console.error("load players failed:", error);
    } finally {
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
    }
  },

  goToCreate() {
    wx.navigateTo({
      url: "/pages/players/create/create"
    });
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/players/detail/detail?id=${id}`
    });
  }
});
