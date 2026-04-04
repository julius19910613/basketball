// components/group-animation/group-animation.js
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    players: {
      type: Array,
      value: []
    },
    teams: {
      type: Array,
      value: []
    }
  },

  data: {
    phase: 'idle', // idle | collecting | flying | landing | done
    playerAnimations: [],
    teamTargets: []
  },

  observers: {
    'visible'(val) {
      if (val) {
        this.startAnimation();
      } else {
        this.resetAnimation();
      }
    }
  },

  methods: {
    /**
     * 开始动画
     */
    async startAnimation() {
      const { players, teams } = this.data;
      
      if (players.length === 0 || teams.length === 0) {
        this.triggerEvent('complete');
        return;
      }

      // 准备动画数据
      const windowInfo = await this.getWindowInfo();
      const centerX = windowInfo.windowWidth / 2;
      const centerY = windowInfo.windowHeight / 2;

      // 初始化球员动画数据
      const playerAnimations = players.map((player, index) => ({
        id: player._id,
        name: player.name,
        avatar: player.avatar,
        startX: 0,
        startY: 0,
        endX: (index % 5 - 2) * 30,
        endY: Math.floor(index / 5) * 20,
        teamIndex: this.findPlayerTeam(player._id, teams),
        style: ''
      }));

      // 初始化队伍目标
      const teamTargets = teams.map((team, index) => ({
        name: team.name,
        top: 200 + index * 180
      }));

      this.setData({ playerAnimations, teamTargets });

      // 阶段1：聚合
      await this.collectPhase(playerAnimations, centerX, centerY);
      
      // 阶段2：飞舞
      await this.flyPhase();
      
      // 阶段3：落地
      await this.landPhase(playerAnimations, teamTargets, centerX, centerY);
      
      // 动画完成
      this.setData({ phase: 'done' });
      
      setTimeout(() => {
        this.triggerEvent('complete');
      }, 300);
    },

    /**
     * 聚合阶段
     */
    collectPhase(playerAnimations, centerX, centerY) {
      return new Promise(resolve => {
        const animations = playerAnimations.map((anim, index) => ({
          ...anim,
          style: `--start-x: ${anim.startX}px; --start-y: ${anim.startY}px; --end-x: ${anim.endX}px; --end-y: ${anim.endY}px;`
        }));

        this.setData({ 
          phase: 'collecting',
          playerAnimations: animations
        });

        setTimeout(resolve, 500);
      });
    },

    /**
     * 飞舞阶段
     */
    flyPhase() {
      return new Promise(resolve => {
        this.setData({ phase: 'flying' });
        setTimeout(resolve, 1500);
      });
    },

    /**
     * 落地阶段
     */
    landPhase(playerAnimations, teamTargets, centerX, centerY) {
      return new Promise(resolve => {
        this.setData({ phase: 'landing' });

        let completed = 0;
        const total = playerAnimations.length;

        playerAnimations.forEach((anim, index) => {
          setTimeout(() => {
            const teamIndex = anim.teamIndex;
            const teamTarget = teamTargets[teamIndex];
            
            // 计算目标位置
            const toX = (index % 5 - 2) * 40;
            const toY = teamTarget ? teamTarget.top - centerY : 0;

            const animations = this.data.playerAnimations;
            const animIndex = animations.findIndex(a => a.id === anim.id);
            
            if (animIndex !== -1) {
              animations[animIndex] = {
                ...animations[animIndex],
                style: `--from-x: ${animations[animIndex].endX}px; --from-y: ${animations[animIndex].endY}px; --to-x: ${toX}px; --to-y: ${toY}px;`
              };
              
              this.setData({ playerAnimations: animations });
            }

            completed++;
            if (completed === total) {
              setTimeout(resolve, 600);
            }
          }, teamIndex * 200 + (index % 5) * 50);
        });
      });
    },

    /**
     * 查找球员所在队伍
     */
    findPlayerTeam(playerId, teams) {
      for (let i = 0; i < teams.length; i++) {
        if (teams[i].players && teams[i].players.some(p => p._id === playerId)) {
          return i;
        }
      }
      return 0;
    },

    /**
     * 获取窗口信息
     */
    getWindowInfo() {
      return new Promise(resolve => {
        const info = wx.getSystemInfoSync();
        resolve(info);
      });
    },

    /**
     * 重置动画
     */
    resetAnimation() {
      this.setData({
        phase: 'idle',
        playerAnimations: [],
        teamTargets: []
      });
    }
  }
});
