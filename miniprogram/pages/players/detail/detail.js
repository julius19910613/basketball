const db = wx.cloud.database();
const COLLECTION_MISSING_CODE = -502005;

function isCollectionMissing(error) {
  if (!error) return false;
  var message = String(error.message || error.errMsg || "");
  return Number(error.errCode) === COLLECTION_MISSING_CODE || message.includes("DATABASE_COLLECTION_NOT_EXIST");
}

function formatDate(value) {
  if (!value) return "-";
  var date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, "0");
  var d = String(date.getDate()).padStart(2, "0");
  var hh = String(date.getHours()).padStart(2, "0");
  var mm = String(date.getMinutes()).padStart(2, "0");
  return y + "-" + m + "-" + d + " " + hh + ":" + mm;
}

function calcAge(birthday) {
  if (!birthday) return null;
  var birthDate = birthday instanceof Date ? birthday : new Date(birthday);
  if (Number.isNaN(birthDate.getTime())) return null;
  var now = new Date();
  var age = now.getFullYear() - birthDate.getFullYear();
  var mDiff = now.getMonth() - birthDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatBirthday(value) {
  if (!value) return "-";
  var date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, "0");
  var d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

var positions = ["PG", "SG", "SF", "PF", "C"];
var positionDisplayNames = ["控球后卫 PG", "得分后卫 SG", "小前锋 SF", "大前锋 PF", "中锋 C"];

function getPositionIndex(pos) {
  var idx = positions.indexOf(pos);
  return idx >= 0 ? idx : 2;
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
      weight: ""
    },
    positionDisplayNames: positionDisplayNames
  },

  onLoad: function (options) {
    var id = options.id;
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

  loadPlayer: function (id) {
    var that = this;
    that.setData({ loading: true, errorMessage: "" });
    db.collection("players").doc(id).get().then(function (res) {
      var player = res.data;
      if (!player) {
        that.setData({
          loading: false,
          errorMessage: "球员不存在或已删除"
        });
        return;
      }
      var age = calcAge(player.birthday);
      that.setData({
        loading: false,
        player: {
          _id: player._id,
          nickname: player.nickname || player.name || "未命名球员",
          realName: player.realName || "-",
          position: player.position || "-",
          age: age !== null ? age : (player.age || "-"),
          birthdayText: formatBirthday(player.birthday),
          height: player.height || "-",
          weight: player.weight || "-",
          createdAtText: formatDate(player.createdAt)
        }
      });
    }).catch(function (error) {
      var message = isCollectionMissing(error)
        ? "当前环境缺少 players 集合，请先在 CloudBase 控制台创建"
        : "加载失败，请稍后重试";
      that.setData({
        loading: false,
        errorMessage: message
      });
      console.error("load player detail failed:", error);
    });
  },

  onEdit: function () {
    var player = this.data.player;
    // 从 birthdayText 反推 birthday 字符串（YYYY-MM-DD）
    var birthdayStr = "";
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
        weight: player.weight === "-" ? "" : String(player.weight)
      }
    });
  },

  onCancel: function () {
    this.setData({ editing: false });
  },

  onEditInput: function (e) {
    var field = e.currentTarget.dataset.field;
    this.setData({
      ["editForm." + field]: e.detail.value
    });
  },

  onEditPositionChange: function (e) {
    this.setData({
      "editForm.positionIndex": Number(e.detail.value)
    });
  },

  onEditBirthdayChange: function (e) {
    this.setData({
      "editForm.birthday": e.detail.value
    });
  },

  validateEditForm: function () {
    var form = this.data.editForm;
    if (!form.nickname.trim()) {
      return "请输入昵称";
    }
    if (form.nickname.trim().length > 20) {
      return "昵称不能超过20个字符";
    }

    var heightNum = Number(form.height);
    var weightNum = Number(form.weight);

    if (form.height && (!Number.isFinite(heightNum) || heightNum < 120 || heightNum > 250)) {
      return "身高需为120-250cm";
    }
    if (form.weight && (!Number.isFinite(weightNum) || weightNum < 30 || weightNum > 200)) {
      return "体重需为30-200kg";
    }

    if (form.birthday) {
      var age = calcAge(form.birthday);
      if (age < 10 || age > 60) {
        return "年龄需在10-60岁之间（当前 " + age + " 岁）";
      }
    }

    return "";
  },

  onSave: function () {
    var that = this;
    var errorMsg = that.validateEditForm();
    if (errorMsg) {
      wx.showToast({ title: errorMsg, icon: "none" });
      return;
    }

    var form = that.data.editForm;
    var updateData = {
      nickname: form.nickname.trim(),
      realName: form.realName.trim(),
      position: positions[form.positionIndex],
      height: form.height ? Number(form.height) : null,
      weight: form.weight ? Number(form.weight) : null,
      updatedAt: db.serverDate()
    };

    if (form.birthday) {
      updateData.birthday = new Date(form.birthday);
      updateData.age = calcAge(form.birthday);
    }

    that.setData({ saving: true });
    wx.showLoading({ title: "保存中...", mask: true });

    db.collection("players").doc(that.data.playerId).update({
      data: updateData
    }).then(function () {
      wx.hideLoading();
      that.setData({ saving: false, editing: false });
      wx.showToast({ title: "保存成功", icon: "success" });
      // 重新加载数据
      that.loadPlayer(that.data.playerId);
    }).catch(function (error) {
      wx.hideLoading();
      that.setData({ saving: false });
      wx.showToast({ title: "保存失败，请重试", icon: "none" });
      console.error("update player failed:", error);
    });
  }
});
