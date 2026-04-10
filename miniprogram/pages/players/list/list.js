const db = wx.cloud.database();

Page({
  data: {
    loading: true,
    players: []
  },

  onLoad() {
    this.loadPlayers();
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
      wx.showToast({ title: "加载球员失败", icon: "none" });
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
