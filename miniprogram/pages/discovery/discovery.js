// pages/discovery/discovery.js
Page({
    data: {
        searchKeyword: '',
        nearbyTeams: [],
        activities: []
    },

    onLoad() {
        this.loadNearbyTeams();
    },

    onShow() {
        this.loadNearbyTeams();
    },

    onPullDownRefresh() {
        this.loadNearbyTeams().then(() => {
            wx.stopPullDownRefresh();
        });
    },

    // 搜索输入
    onSearchInput(e) {
        this.setData({ searchKeyword: e.detail.value });
        // TODO: 实现搜索逻辑
    },

    // 加载附近球队
    async loadNearbyTeams() {
        try {
            const db = wx.cloud.database();
            const res = await db.collection('teams')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();

            this.setData({ nearbyTeams: res.data });
        } catch (err) {
            console.error('加载附近球队失败:', err);
        }
    },

    // 跳转到球队详情
    goToTeam(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({
            url: `/pages/team-detail/team-detail?id=${id}`
        });
    },

    // 查看更多球队
    seeMoreTeams() {
        wx.switchTab({
            url: '/pages/teams/teams'
        });
    },

    // 查看更多约球信息
    seeMoreActivities() {
        wx.showToast({
            title: '功能开发中',
            icon: 'none'
        });
    }
});
