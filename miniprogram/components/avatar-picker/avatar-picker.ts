/// <reference path="../../../typings/index.d.ts" />

import { getCategories, getAvatarsByCategory, getAvatarById } from "../../config/avatar-presets";

interface AvatarItem {
  id: string;
  name: string;
  url: string;
  category: string;
}

interface CategoryItem {
  key: string;
  name: string;
}

interface AvatarPickerData {
  categories: CategoryItem[];
  activeCategory: string;
  avatars: AvatarItem[];
  convertedUrlMap: Record<string, string>;
  loading: boolean;
}

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
  } as AvatarPickerData,

  lifetimes: {
    attached: function () {
      this.initCategories();
    }
  },

  observers: {
    "visible": function (visible: boolean) {
      if (visible) {
        this.initCategories();
      }
    }
  },

  methods: {
    initCategories: function (this: WechatMiniprogram.Component.TrivialInstance & { data: AvatarPickerData }) {
      const categories = getCategories();
      const activeCategory = categories.length > 0 ? categories[0].key : "";
      this.setData({
        categories: categories,
        activeCategory: activeCategory
      });
      if (activeCategory) {
        this.loadAvatars(activeCategory);
      }
    },

    loadAvatars: function (this: WechatMiniprogram.Component.TrivialInstance & { data: AvatarPickerData }, category: string) {
      const that = this;
      const avatars = getAvatarsByCategory(category);

      // 检查是否有 cloud:// 格式的 URL 需要转换
      const cloudFiles: string[] = [];
      const cloudIds: string[] = [];
      for (let i = 0; i < avatars.length; i++) {
        const url = avatars[i].url;
        if (url && url.indexOf("cloud://") === 0) {
          cloudFiles.push(url);
          cloudIds.push(avatars[i].id);
        }
      }

      if (cloudFiles.length > 0) {
        that.setData({ loading: true });
        wx.cloud.getTempFileURL({
          fileList: cloudFiles,
          success: function (res: any) {
            const urlMap = that.data.convertedUrlMap;
            const fileList = res.fileList || [];
            for (let j = 0; j < fileList.length; j++) {
              if (fileList[j].tempFileURL) {
                urlMap[cloudFiles[j]] = fileList[j].tempFileURL;
              }
            }
            const displayAvatars = avatars.map(function (item) {
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

    onCategoryTap: function (this: WechatMiniprogram.Component.TrivialInstance & { data: AvatarPickerData }, e: any) {
      const category = e.currentTarget.dataset.key;
      if (category === this.data.activeCategory) return;
      this.setData({ activeCategory: category });
      this.loadAvatars(category);
    },

    onAvatarTap: function (this: WechatMiniprogram.Component.TrivialInstance, e: any) {
      const id = e.currentTarget.dataset.id;
      const name = e.currentTarget.dataset.name;

      // 通过 id 查找原始配置中的 URL（避免保存临时 URL）
      const preset = getAvatarById(id);
      const originalUrl = preset ? preset.url : "";

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

    onMaskTap: function (this: WechatMiniprogram.Component.TrivialInstance) {
      this.closePicker();
    },

    onCloseTap: function (this: WechatMiniprogram.Component.TrivialInstance) {
      this.closePicker();
    },

    closePicker: function (this: WechatMiniprogram.Component.TrivialInstance) {
      this.triggerEvent("close");
    }
  }
});
