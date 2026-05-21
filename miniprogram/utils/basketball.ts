type BasketballPositionValue = "PG" | "SG" | "SF" | "PF" | "C" | "UTILITY";

type BasketballSkillKey =
  | "twoPointShot"
  | "threePointShot"
  | "freeThrow"
  | "passing"
  | "ballControl"
  | "courtVision"
  | "perimeterDefense"
  | "interiorDefense"
  | "steals"
  | "blocks"
  | "offensiveRebound"
  | "defensiveRebound"
  | "speed"
  | "strength"
  | "stamina"
  | "vertical"
  | "basketballIQ"
  | "teamwork"
  | "clutch";

type BasketballSkills = Record<BasketballSkillKey, number>;
type PartialBasketballSkills = Partial<Record<BasketballSkillKey, number>>;
type PositionWeights = Record<BasketballSkillKey, number>;

interface PositionDetail {
  name: string;
  englishName: string;
  icon: string;
  color: string;
  description: string;
}

// 位置枚举
const BasketballPosition = {
  PG: "PG",
  SG: "SG",
  SF: "SF",
  PF: "PF",
  C: "C",
  UTILITY: "UTILITY"
} as const;

// 位置详情
const POSITION_DETAILS: Record<BasketballPositionValue, PositionDetail> = {
  PG: { name: "控球后卫", englishName: "Point Guard", icon: "🏀", color: "#3B82F6", description: "组织进攻，掌控节奏" },
  SG: { name: "得分后卫", englishName: "Shooting Guard", icon: "🎯", color: "#EF4444", description: "外线得分手" },
  SF: { name: "小前锋", englishName: "Small Forward", icon: "⚡", color: "#F59E0B", description: "全能型球员" },
  PF: { name: "大前锋", englishName: "Power Forward", icon: "💪", color: "#10B981", description: "内线强力球员" },
  C: { name: "中锋", englishName: "Center", icon: "🏔️", color: "#8B5CF6", description: "禁区统治者" },
  UTILITY: { name: "万金油", englishName: "Utility", icon: "✨", color: "#6B7280", description: "可打多个位置" }
};

// 创建默认技能（19项）
function createDefaultBasketballSkills(): BasketballSkills {
  return {
    twoPointShot: 50, threePointShot: 50, freeThrow: 50,
    passing: 50, ballControl: 50, courtVision: 50,
    perimeterDefense: 50, interiorDefense: 50, steals: 50, blocks: 50,
    offensiveRebound: 50, defensiveRebound: 50,
    speed: 50, strength: 50, stamina: 50, vertical: 50,
    basketballIQ: 50, teamwork: 50, clutch: 50
  };
}

// 辅助函数：获取位置的权重配置
function getPositionWeights(position?: BasketballPositionValue | string): PositionWeights {
  const weights: Record<BasketballPositionValue, PositionWeights> = {
    PG: {
      twoPointShot: 0.06, threePointShot: 0.10, freeThrow: 0.04, passing: 0.12, ballControl: 0.12, courtVision: 0.10, perimeterDefense: 0.08, interiorDefense: 0.03, steals: 0.06, blocks: 0.02, offensiveRebound: 0.02, defensiveRebound: 0.04, speed: 0.10, strength: 0.03, stamina: 0.04, vertical: 0.02, basketballIQ: 0.08, teamwork: 0.06, clutch: 0.06
    },
    SG: {
      twoPointShot: 0.10, threePointShot: 0.12, freeThrow: 0.06, passing: 0.06, ballControl: 0.06, courtVision: 0.05, perimeterDefense: 0.10, interiorDefense: 0.03, steals: 0.06, blocks: 0.02, offensiveRebound: 0.02, defensiveRebound: 0.04, speed: 0.08, strength: 0.03, stamina: 0.04, vertical: 0.04, basketballIQ: 0.05, teamwork: 0.05, clutch: 0.09
    },
    SF: {
      twoPointShot: 0.08, threePointShot: 0.07, freeThrow: 0.05, passing: 0.06, ballControl: 0.06, courtVision: 0.06, perimeterDefense: 0.08, interiorDefense: 0.06, steals: 0.06, blocks: 0.04, offensiveRebound: 0.05, defensiveRebound: 0.06, speed: 0.07, strength: 0.05, stamina: 0.04, vertical: 0.05, basketballIQ: 0.06, teamwork: 0.05, clutch: 0.07
    },
    PF: {
      twoPointShot: 0.07, threePointShot: 0.03, freeThrow: 0.04, passing: 0.04, ballControl: 0.04, courtVision: 0.04, perimeterDefense: 0.06, interiorDefense: 0.12, steals: 0.04, blocks: 0.08, offensiveRebound: 0.10, defensiveRebound: 0.10, speed: 0.04, strength: 0.10, stamina: 0.04, vertical: 0.06, basketballIQ: 0.05, teamwork: 0.04, clutch: 0.05
    },
    C: {
      twoPointShot: 0.06, threePointShot: 0.02, freeThrow: 0.04, passing: 0.03, ballControl: 0.03, courtVision: 0.03, perimeterDefense: 0.03, interiorDefense: 0.14, steals: 0.02, blocks: 0.12, offensiveRebound: 0.12, defensiveRebound: 0.12, speed: 0.03, strength: 0.12, stamina: 0.03, vertical: 0.08, basketballIQ: 0.04, teamwork: 0.03, clutch: 0.05
    },
    UTILITY: {
      twoPointShot: 0.055, threePointShot: 0.055, freeThrow: 0.05, passing: 0.055, ballControl: 0.055, courtVision: 0.055, perimeterDefense: 0.055, interiorDefense: 0.055, steals: 0.05, blocks: 0.05, offensiveRebound: 0.055, defensiveRebound: 0.055, speed: 0.055, strength: 0.055, stamina: 0.05, vertical: 0.055, basketballIQ: 0.055, teamwork: 0.055, clutch: 0.055
    }
  };

  if (position && position in weights) {
    return weights[position as BasketballPositionValue];
  }

  return weights.UTILITY;
}

// 辅助函数：获取核心属性
function getCoreAttributes(position?: BasketballPositionValue | string): BasketballSkillKey[] {
  switch (position) {
    case "PG": return ["passing", "ballControl", "courtVision", "threePointShot", "speed"];
    case "SG": return ["threePointShot", "twoPointShot", "perimeterDefense", "speed"];
    case "SF": return ["twoPointShot", "threePointShot", "perimeterDefense", "speed"];
    case "PF": return ["interiorDefense", "defensiveRebound", "offensiveRebound", "strength"];
    case "C": return ["interiorDefense", "blocks", "defensiveRebound", "offensiveRebound", "strength"];
    default: return [];
  }
}

// 辅助函数：获取弱项属性
function getWeakAttributes(position?: BasketballPositionValue | string): BasketballSkillKey[] {
  switch (position) {
    case "PG": return ["interiorDefense", "offensiveRebound", "blocks"];
    case "SG": return ["interiorDefense", "offensiveRebound"];
    case "SF": return [];
    case "PF": return ["threePointShot", "speed"];
    case "C": return ["threePointShot", "ballControl", "speed"];
    default: return [];
  }
}

// Overall V2 计算
function calculateOverallSkill(skills?: PartialBasketballSkills | null, position?: BasketballPositionValue | string): number {
  const weights = getPositionWeights(position);
  const skillSet = skills || createDefaultBasketballSkills();

  // 1. 计算加权算术平均
  let baseScore = 0;
  let totalWeight = 0;
  for (const key in weights) {
    const skillKey = key as BasketballSkillKey;
    baseScore += (skillSet[skillKey] || 0) * weights[skillKey];
    totalWeight += weights[skillKey];
  }
  baseScore = baseScore / totalWeight;

  // 2. 计算加权几何平均
  let geometricSum = 0;
  for (const key in weights) {
    const skillKey = key as BasketballSkillKey;
    const value = Math.max(skillSet[skillKey] || 0, 1);
    geometricSum += Math.log(value) * weights[skillKey];
  }
  const geometricScore = Math.exp(geometricSum / totalWeight);

  // 3. 混合评分
  const hybridScore = baseScore * 0.5 + geometricScore * 0.5;

  // 4. 极端值加成
  const coreAttributes = getCoreAttributes(position);
  let bonus = 0;
  coreAttributes.forEach(function (attr: BasketballSkillKey) {
    const val = skillSet[attr] || 0;
    if (val >= 85) {
      bonus += (val - 85) * 2.0;
    } else if (val >= 80) {
      bonus += (val - 80) * 1.0;
    }
  });

  // 5. 弱项惩罚
  const weakAttributes = getWeakAttributes(position);
  let penalty = 0;
  weakAttributes.forEach(function (attr: BasketballSkillKey) {
    const val = skillSet[attr] || 0;
    if (val < 45) {
      penalty += (45 - val) * 0.8;
    }
  });

  // 6. 最终评分
  let finalScore = hybridScore + bonus - penalty;

  // 非线性拉伸
  if (finalScore >= 65) {
    finalScore = 65 + (finalScore - 65) * 2.0;
  } else if (finalScore >= 55) {
    // 保持
  } else {
    finalScore = 35 + (finalScore - 35) * 0.8;
  }

  return Math.max(1, Math.min(99, Math.round(finalScore)));
}

export default {
  BasketballPosition,
  POSITION_DETAILS,
  createDefaultBasketballSkills,
  calculateOverallSkill
};
