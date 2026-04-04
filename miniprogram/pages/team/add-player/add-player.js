var basketball = require('../../../utils/basketball');
var db = wx.cloud.database();

Page({
  data: {
    name: '',
    position: 'UTILITY',
    positionIndex: 5,
    positions: ['PG', 'SG', 'SF', 'PF', 'C', 'UTILITY'],
    positionDisplayNames: [
      '控球后卫 (PG)',
      '得分后卫 (SG)',
      '小前锋 (SF)',
      '大前锋 (PF)',
      '中锋 (C)',
      '万金油 (UTILITY)'
    ],
    positionInfo: null,
    skills: null,
    overall: 50,
    submitting: false
  },

  onLoad: function() {
    var defaultSkills = basketball.createDefaultBasketballSkills();
    var posInfo = basketball.POSITION_DETAILS['UTILITY'];
    this.setData({
      skills: defaultSkills,
      positionInfo: posInfo,
      overall: basketball.calculateOverallSkill(defaultSkills, 'UTILITY')
    });
  },

  // 输入姓名
  onNameInput: function(e) {
    this.setData({ name: e.detail.value });
  },

  // 位置选择
  onPositionChange: function(e) {
    var index = parseInt(e.detail.value);
    var pos = this.data.positions[index];
    var posInfo = basketball.POSITION_DETAILS[pos];
    
    this.setData({
      positionIndex: index,
      position: pos,
      positionInfo: posInfo,
      overall: basketball.calculateOverallSkill(this.data.skills, pos)
    });
  },

  // 技能变化
  onSkillsChange: function(e) {
    var skills = e.detail.skills;
    this.setData({
      skills: skills,
      overall: basketball.calculateOverallSkill(skills, this.data.position)
    });
  },

  // 提交
  onSubmit: function() {
    if (!this.data.name || this.data.name.trim() === '') {
      wx.showToast({ title: '请输入球员姓名', icon: 'none' });
      return;
    }

    var that = this;
    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...', mask: true });

    db.collection('players').add({
      data: {
        name: this.data.name,
        position: this.data.position,
        skills: this.data.skills,
        overall: this.data.overall,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      },
      success: function(res) {
        wx.hideLoading();
        wx.showToast({ title: '添加成功', icon: 'success' });
        setTimeout(function() {
          wx.navigateBack();
        }, 1500);
      },
      fail: function(err) {
        wx.hideLoading();
        wx.showToast({ title: '添加失败', icon: 'none' });
        console.error('添加球员失败:', err);
        that.setData({ submitting: false });
      }
    });
  }
});
