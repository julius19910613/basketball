// 技能输入组件
var basketball = require('../../utils/basketball');

Component({
  properties: {
    skills: {
      type: Object,
      value: null
    }
  },

  data: {
    skillGroups: [
      {
        title: '投篮能力',
        items: [
          { key: 'twoPointShot', label: '两分投篮' },
          { key: 'threePointShot', label: '三分投篮' },
          { key: 'freeThrow', label: '罚球' }
        ]
      },
      {
        title: '组织能力',
        items: [
          { key: 'passing', label: '传球' },
          { key: 'ballControl', label: '控球' },
          { key: 'courtVision', label: '场上视野' }
        ]
      },
      {
        title: '防守能力',
        items: [
          { key: 'perimeterDefense', label: '外线防守' },
          { key: 'interiorDefense', label: '内线防守' },
          { key: 'steals', label: '抢断' },
          { key: 'blocks', label: '盖帽' }
        ]
      },
      {
        title: '篮板能力',
        items: [
          { key: 'offensiveRebound', label: '进攻篮板' },
          { key: 'defensiveRebound', label: '防守篮板' }
        ]
      },
      {
        title: '身体素质',
        items: [
          { key: 'speed', label: '速度' },
          { key: 'strength', label: '力量' },
          { key: 'stamina', label: '耐力' },
          { key: 'vertical', label: '弹跳' }
        ]
      },
      {
        title: '篮球智商',
        items: [
          { key: 'basketballIQ', label: '篮球智商' },
          { key: 'teamwork', label: '团队配合' },
          { key: 'clutch', label: '关键表现' }
        ]
      }
    ],
    currentSkills: null
  },

  lifetimes: {
    attached: function() {
      // 初始化技能
      var skills = this.properties.skills || basketball.createDefaultBasketballSkills();
      this.setData({ currentSkills: skills });
    }
  },

  methods: {
    onSkillChange: function(e) {
      var key = e.currentTarget.dataset.key;
      var value = e.detail.value;
      var skills = this.data.currentSkills;
      
      if (!skills) {
        skills = basketball.createDefaultBasketballSkills();
      }
      
      skills[key] = parseInt(value);
      this.setData({ currentSkills: skills });
      
      // 触发事件通知父组件
      this.triggerEvent('change', { skills: skills });
    }
  }
});
