// pages/match/create-match/create-match.js
Page({
    data: {
        matchType: 'Friendly',
        homeTeam: null,
        awayTeam: null,
        matchDate: '',
        matchTime: '',
        locationName: '',
        myTeams: []
    },

    computed: {
        canSubmit() {
            return this.data.homeTeam && this.data.matchDate && this.data.matchTime && this.data.locationName;
        }
    },

    onLoad() {
        this.loadMyTeams();
    },

    // 加载我的球队列表
    async loadMyTeams() {
        try {
            const db = wx.cloud.database();
            const { result } = await wx.cloud.callFunction({
                name: 'getOpenId'
            });
            const openid = result.openid;

            // 查找我创建或加入的球队
            const res = await db.collection('teams')
                .where({
                    'members.userId': openid
                })
                .get();

            this.setData({ myTeams: res.data });
        } catch (err) {
            console.error('加载球队失败:', err);
        }
    },

    // 选择比赛类型
    selectType(e) {
        const type = e.currentTarget.dataset.type;
        this.setData({ matchType: type });
    },

    // 选择主队
    selectHomeTeam() {
        if (this.data.myTeams.length === 0) {
            wx.showToast({
                title: '您还没有球队',
                icon: 'none'
            });
            return;
        }

        const names = this.data.myTeams.map(t => t.name);
        wx.showActionSheet({
            itemList: names,
            success: (res) => {
                this.setData({
                    homeTeam: this.data.myTeams[res.tapIndex]
                });
            }
        });
    },

    // 选择客队
    selectAwayTeam() {
        // 可以从所有球队中选择
        wx.showToast({
            title: '功能开发中',
            icon: 'none'
        });
    },

    // 选择日期
    onDateChange(e) {
        this.setData({ matchDate: e.detail.value });
    },

    // 选择时间
    onTimeChange(e) {
        this.setData({ matchTime: e.detail.value });
    },

    // 输入地点
    onLocationInput(e) {
        this.setData({ locationName: e.detail.value });
    },

    // 创建比赛
    async createMatch() {
        const { matchType, homeTeam, awayTeam, matchDate, matchTime, locationName } = this.data;

        if (!homeTeam) {
            wx.showToast({ title: '请选择主队', icon: 'none' });
            return;
        }
        if (!matchDate || !matchTime) {
            wx.showToast({ title: '请选择比赛时间', icon: 'none' });
            return;
        }
        if (!locationName) {
            wx.showToast({ title: '请输入比赛地点', icon: 'none' });
            return;
        }

        wx.showLoading({ title: '创建中...' });

        try {
            const db = wx.cloud.database();
            const startTime = new Date(`${matchDate} ${matchTime}`);

            await db.collection('matches').add({
                data: {
                    type: matchType,
                    status: 'scheduled',
                    homeTeamId: homeTeam._id,
                    homeTeam: {
                        _id: homeTeam._id,
                        name: homeTeam.name,
                        logo: homeTeam.logo
                    },
                    awayTeamId: awayTeam ? awayTeam._id : null,
                    awayTeam: awayTeam ? {
                        _id: awayTeam._id,
                        name: awayTeam.name,
                        logo: awayTeam.logo
                    } : null,
                    startTime: startTime,
                    location: {
                        name: locationName
                    },
                    homeScore: 0,
                    awayScore: 0,
                    createdAt: db.serverDate()
                }
            });

            wx.hideLoading();
            wx.showToast({
                title: '创建成功',
                icon: 'success'
            });

            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        } catch (err) {
            wx.hideLoading();
            console.error('创建比赛失败:', err);
            wx.showToast({
                title: '创建失败',
                icon: 'none'
            });
        }
    }
});
