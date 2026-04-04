var basketball = require('../../utils/basketball');

Component({
  properties: {
    player: {
      type: Object,
      value: null
    }
  },

  data: {
    overall: 0,
    positionInfo: null,
    skillSummary: []
  },

  lifetimes: {
    attached: function() {
      if (this.properties.player) {
        this.updateDisplay(this.properties.player);
      }
    }
  },

  methods: {
    updateDisplay: function(profile) {
      var skills = profile.skills || basketball.createDefaultBasketballSkills();
      var pos = profile.position || 'UTILITY';
      
      var overall = profile.overall || basketball.calculateOverallSkill(skills, pos);
      var posInfo = basketball.POSITION_DETAILS[pos];
      
      // 计算技能概要
      var summary = [
        { label: '投篮', value: Math.round((skills.twoPointShot + skills.threePointShot + skills.freeThrow) / 3) },
        { label: '组织', value: Math.round((skills.passing + skills.ballControl + skills.courtVision) / 3) },
        { label: '防守', value: Math.round((skills.perimeterDefense + skills.interiorDefense + skills.steals + skills.blocks) / 4) },
        { label: '篮板', value: Math.round((skills.offensiveRebound + skills.defensiveRebound) / 2) },
        { label: '身体', value: Math.round((skills.speed + skills.strength + skills.stamina + skills.vertical) / 4) }
      ];

      this.setData({
        overall: overall,
        positionInfo: posInfo,
        skillSummary: summary
      });
    }
  }
});
