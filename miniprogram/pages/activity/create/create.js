const app = getApp();
const db = require("../../../utils/db");
const helper = require("../../../utils/activity-helper");

Page({
  data: {
    saving: false,
    form: helper.createEmptyActivity()
  },

  onLoad() {},

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ "form.activityDate": e.detail.value });
  },

  onStartTimeChange(e) {
    const startTime = e.detail.value;
    this.setData({
      "form.startTime": startTime,
      "form.registrationDeadline": helper.getDefaultDeadline(this.data.form.activityDate, startTime)
    });
  },

  onEndTimeChange(e) {
    this.setData({ "form.endTime": e.detail.value });
  },

  onDeadlineInput(e) {
    this.setData({ "form.registrationDeadline": e.detail.value });
  },

  onTeamNameInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ [`form.teamNames[${index}]`]: e.detail.value });
  },

  async save(status) {
    const errorMessage = helper.validateActivityForm(this.data.form);
    if (errorMessage) {
      wx.showToast({ title: errorMessage, icon: "none" });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({ title: status === "registration_open" ? "发布中..." : "保存中...", mask: true });
    try {
      const payload = helper.prepareActivityForSave(this.data.form, {
        status: status,
        createdByOpenid: app.globalData.openid || ""
      });
      const activityId = await db.createActivity(payload);
      wx.hideLoading();
      wx.showToast({ title: status === "registration_open" ? "活动已发布" : "草稿已保存", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/activity/detail/detail?id=${activityId}` });
      }, 250);
    } catch (err) {
      console.error("save activity failed", err);
      wx.hideLoading();
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  },

  onSaveDraft() {
    this.save("draft");
  },

  onPublish() {
    this.save("registration_open");
  }
});
