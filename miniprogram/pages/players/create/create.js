const db = wx.cloud.database();
const COLLECTION_MISSING_CODE = -502005;

function isCollectionMissing(error) {
  if (!error) return false;
  const message = String(error.message || error.errMsg || "");
  return Number(error.errCode) === COLLECTION_MISSING_CODE || message.includes("DATABASE_COLLECTION_NOT_EXIST");
}

function calcAge(birthdayStr) {
  if (!birthdayStr) return 0;
  var birthDate = new Date(birthdayStr);
  var today = new Date();
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

Page({
  data: {
    submitting: false,
    positionIndex: 0,
    positions: ["PG", "SG", "SF", "PF", "C"],
    positionDisplayNames: ["控球后卫 PG", "得分后卫 SG", "小前锋 SF", "大前锋 PF", "中锋 C"],
    form: {
      nickname: "",
      realName: "",
      birthday: "",
      height: "",
      weight: ""
    }
  },

  onFieldInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  onBirthdayChange(e) {
    this.setData({
      "form.birthday": e.detail.value
    });
  },

  onPositionChange(e) {
    this.setData({
      positionIndex: Number(e.detail.value)
    });
  },

  validateForm() {
    const { nickname, realName, birthday, height, weight } = this.data.form;

    if (!nickname.trim()) {
      return "请输入昵称";
    }
    if (nickname.trim().length > 20) {
      return "昵称不能超过20个字符";
    }
    if (!realName.trim()) {
      return "请输入真实姓名";
    }
    if (realName.trim().length > 30) {
      return "真实姓名不能超过30个字符";
    }

    if (!birthday) {
      return "请选择生日";
    }

    const age = calcAge(birthday);
    const heightNum = Number(height);
    const weightNum = Number(weight);

    if (age < 10 || age > 60) {
      return "年龄需在10-60岁之间 (当前 " + age + " 岁)";
    }
    if (!Number.isFinite(heightNum) || heightNum < 120 || heightNum > 250) {
      return "身高需为120-250cm";
    }
    if (!Number.isFinite(weightNum) || weightNum < 30 || weightNum > 200) {
      return "体重需为30-200kg";
    }

    return "";
  },

  async onSubmit() {
    const errorMessage = this.validateForm();
    if (errorMessage) {
      wx.showToast({ title: errorMessage, icon: "none" });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: "保存中...", mask: true });

    try {
      const { nickname, realName, birthday, height, weight } = this.data.form;
      const age = calcAge(birthday);

      await db.collection("players").add({
        data: {
          nickname: nickname.trim(),
          realName: realName.trim(),
          position: this.data.positions[this.data.positionIndex],
          birthday: new Date(birthday),
          age: age,
          height: Number(height),
          weight: Number(weight),
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      });

      wx.hideLoading();
      wx.showToast({ title: "新增成功", icon: "success" });
      setTimeout(() => {
        wx.navigateBack();
      }, 500);
    } catch (error) {
      wx.hideLoading();
      if (isCollectionMissing(error)) {
        wx.showModal({
          title: "请先初始化数据库",
          content: "当前环境缺少 players 集合。请到 CloudBase 控制台创建 players 集合后再新增球员。",
          showCancel: false
        });
      } else {
        wx.showToast({ title: "新增失败，请重试", icon: "none" });
      }
      console.error("create player failed:", error);
      this.setData({ submitting: false });
    }
  }
});
