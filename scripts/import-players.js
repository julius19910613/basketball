/**
 * 批量导入球员数据
 * 
 * 使用方式：
 * 1. 在微信开发者工具的「云开发控制台」中测试云函数
 * 2. 或在前端代码中调用 wx.cloud.callFunction
 * 
 * 云函数名: batchImportPlayers
 */

const players = [
  { nickname: "抓奶可", position: "G", height: 183, weight: 77 },
  { nickname: "无敌詹蜜文", position: "G", height: 178, weight: 83 },
  { nickname: "大哥", position: "C", height: 187, weight: 82 },
  { nickname: "卢德华", position: "C", height: 183, weight: 95 },
  { nickname: "开当的凯", position: "C", height: 189, weight: 105 },
  { nickname: "拍手嘴硬高", position: "G", height: 178, weight: 80 },
  { nickname: "午觉罗", position: "F" },
  { nickname: "大\"白\"肚", position: "G", height: 173, weight: 83 },
  { nickname: "组委会一把手李", position: "C", height: 196, weight: 95 },
  { nickname: "骚当", position: "F", height: 183, weight: 78 },
  { nickname: "贱桂", position: "F", height: 180, weight: 77 },
  { nickname: "磕比", position: "G", height: 183, weight: 90 },
  { nickname: "AVGPT", position: "F", height: 188, weight: 95 },
  { nickname: "太黑了隐藏了", position: "G" },
  { nickname: "钩子🍑", position: "C" },
  { nickname: "正义皓", position: "F", height: 182, weight: 93 },
  { nickname: "党企代表要生三", position: "F", height: 184, weight: 77 },
  { nickname: "黑老王", position: "F", height: 180, weight: 82 },
  { nickname: "Dao小帅", position: "F" }
];

// === 调用方式 ===

// 方式1：前端调用
// wx.cloud.callFunction({
//   name: 'batchImportPlayers',
//   data: { players: players }
// }).then(res => {
//   console.log('导入结果:', res.result);
// });

// 方式2：云开发控制台测试
// 在 batchImportPlayers 云函数的测试面板中，输入以下 JSON 作为测试参数：
console.log(JSON.stringify({ players: players }, null, 2));
