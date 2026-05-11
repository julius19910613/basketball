/// <reference path="../../typings/index.d.ts" />

/**
 * 预设头像配置
 * 
 * 使用说明：
 * 1. 将 GIF 头像文件上传到 CloudBase 云存储
 * 2. 在云存储管理后台获取文件的 https URL
 * 3. 将下方 url 替换为你的云存储链接
 * 
 * 支持两种格式：
 * - https://xxx     直接访问的 URL（推荐，无延迟）
 * - cloud://xxx     云存储 fileID（需要在组件内调用 getTempFileURL 转换）
 * 
 * 分类：
 * - basketball   篮球经典
 * - cartoon      动漫卡通
 * - meme         趣味表情
 */

interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: string;
  categoryName: string;
}

interface Category {
  key: string;
  name: string;
}

const AVATAR_PRESETS: AvatarPreset[] = [
  // ===== 篮球经典 =====
  {
    id: "basketball-1",
    name: "篮球火焰",
    url: "",
    category: "basketball",
    categoryName: "篮球经典"
  },
  {
    id: "basketball-2",
    name: "篮框爆扣",
    url: "",
    category: "basketball",
    categoryName: "篮球经典"
  },
  {
    id: "basketball-3",
    name: "穿针",
    url: "",
    category: "basketball",
    categoryName: "篮球经典"
  },
  {
    id: "basketball-4",
    name: "三分命中",
    url: "",
    category: "basketball",
    categoryName: "篮球经典"
  },
  // ===== 动漫卡通 =====
  {
    id: "cartoon-1",
    name: "贪婪小黄人",
    url: "",
    category: "cartoon",
    categoryName: "动漫卡通"
  },
  {
    id: "cartoon-2",
    name: "蓝瘦香菇",
    url: "",
    category: "cartoon",
    categoryName: "动漫卡通"
  },
  {
    id: "cartoon-3",
    name: "火影忍者",
    url: "",
    category: "cartoon",
    categoryName: "动漫卡通"
  },
  {
    id: "cartoon-4",
    name: "猫和老鼠",
    url: "",
    category: "cartoon",
    categoryName: "动漫卡通"
  },
  // ===== 趣味表情 =====
  {
    id: "meme-1",
    name: "拥抱篮球",
    url: "",
    category: "meme",
    categoryName: "趣味表情"
  },
  {
    id: "meme-2",
    name: "加油打气",
    url: "",
    category: "meme",
    categoryName: "趣味表情"
  },
  {
    id: "meme-3",
    name: "MVP 冰淇淋",
    url: "",
    category: "meme",
    categoryName: "趣味表情"
  },
  {
    id: "meme-4",
    name: "实在人",
    url: "",
    category: "meme",
    categoryName: "趣味表情"
  }
];

const DEFAULT_AVATAR = "/images/default_avatar.svg";

/**
 * 获取所有分类
 */
function getCategories(): Category[] {
  const map: Record<string, boolean> = {};
  const categories: Category[] = [];
  for (let i = 0; i < AVATAR_PRESETS.length; i++) {
    const item = AVATAR_PRESETS[i];
    if (!map[item.category]) {
      map[item.category] = true;
      categories.push({
        key: item.category,
        name: item.categoryName
      });
    }
  }
  return categories;
}

/**
 * 按分类获取头像
 */
function getAvatarsByCategory(category: string): AvatarPreset[] {
  const result: AvatarPreset[] = [];
  for (let i = 0; i < AVATAR_PRESETS.length; i++) {
    if (AVATAR_PRESETS[i].category === category) {
      result.push(AVATAR_PRESETS[i]);
    }
  }
  return result;
}

/**
 * 获取所有头像
 */
function getAllAvatars(): AvatarPreset[] {
  return AVATAR_PRESETS.slice();
}

/**
 * 根据 id 获取头像
 */
function getAvatarById(id: string): AvatarPreset | null {
  for (let i = 0; i < AVATAR_PRESETS.length; i++) {
    if (AVATAR_PRESETS[i].id === id) {
      return AVATAR_PRESETS[i];
    }
  }
  return null;
}

export {
  AVATAR_PRESETS,
  getCategories,
  getAvatarsByCategory,
  getAllAvatars,
  getAvatarById,
  DEFAULT_AVATAR
};
