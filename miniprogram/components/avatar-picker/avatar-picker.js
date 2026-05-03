var avatarPresets = require("../../config/avatar-presets");

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    selectedId: {
      type: String,
      value: ""
    }
  },

  data: {
    categories: [],
    activeCategory: "",
    avatars: [],
    convertedUrlMap: {},
    loading: false
  },

  lifetimes: {
    attached: function () {
      this.initCategories();
    }
  },

  observers: {
    "visible": function (visible) {
      if (visible) {
        this.initCategories();
      }
    }
  },

  methods: {
    initCategories: function () {
      var categories = avatarPresets.getCategories();
      var activeCategory = categories.length > 0 ? categories[0].key : "";
      this.setData({
        categories: categories,
        activeCategory: activeCategory
      });
      if (activeCategory) {
        this.loadAvatars(activeCategory);
      }
    },

    loadAvatars: function (category) {
      var that = this;
      var avatars = avatarPresets.getAvatarsByCategory(category);

      // 检查是否有 cloud:// 格式的 URL 需要转换
      var cloudFiles = [];
      var cloudIds = [];
      for (var i = 0; i < avatars.length; i++) {
        var url = avatars[i].url;
        if (url && url.indexOf("cloud://") === 0) {
          cloudFiles.push(url);
          cloudIds.push(avatars[i].id);
        }
      }

      if (cloudFiles.length > 0) {
        that.setData({ loading: true });
        wx.cloud.getTempFileURL({
          fileList: cloudFiles,
          success: function (res) {
            var urlMap = that.data.convertedUrlMap;
            var fileList = res.fileList || [];
            for (var j = 0; j < fileList.length; j++) {
              if (fileList[j].tempFileURL) {
                urlMap[cloudFiles[j]] = fileList[j].tempFileURL;
              }
            }
            var displayAvatars = avatars.map(function (item) {
              return {
                id: item.id,
                name: item.name,
                url: item.url && item.url.indexOf("cloud://") === 0
                  ? (urlMap[item.url] || "")
                  : item.url,
                category: item.category
              };
            });
            that.setData({
              avatars: displayAvatars,
              convertedUrlMap: urlMap,
              loading: false
            });
          },
          fail: function () {
            that.setData({
              avatars: avatars.map(function (item) {
                return {
                  id: item.id,
                  name: item.name,
                  url: item.url && item.url.indexOf("cloud://") === 0 ? "" : item.url,
                  category: item.category
                };
              }),
              loading: false
            });
          }
        });
      } else {
        that.setData({
          avatars: avatars.map(function (item) {
            return {
              id: item.id,
              name: item.name,
              url: item.url || "",
              category: item.category
            };
          })
        });
      }
    },

    onCategoryTap: function (e) {
      var category = e.currentTarget.dataset.key;
      if (category === this.data.activeCategory) return;
      this.setData({ activeCategory: category });
      this.loadAvatars(category);
    },

    onAvatarTap: function (e) {
      var id = e.currentTarget.dataset.id;
      var name = e.currentTarget.dataset.name;

      // 通过 id 查找原始配置中的 URL（避免保存临时 URL）
      var preset = avatarPresets.getAvatarById(id);
      var originalUrl = preset ? preset.url : "";

      if (!originalUrl) {
        wx.showToast({ title: "该头像暂未上传", icon: "none" });
        return;
      }

      this.setData({ selectedId: id });
      this.triggerEvent("select", {
        id: id,
        url: originalUrl,
        name: name
      });
      this.closePicker();
    },

    preventScroll: function () {
      // 阻止遮罩层触摸滚动冒泡到底层页面
      return;
    },

    onMaskTap: function () {
      this.closePicker();
    },

    onCloseTap: function () {
      this.closePicker();
    },

    closePicker: function () {
      this.triggerEvent("close");
    }
  }
});
