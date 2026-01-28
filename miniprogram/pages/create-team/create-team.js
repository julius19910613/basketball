// pages/create-team/create-team.js
const db = wx.cloud.database()

Page({
  data: {
    formData: {
      name: '',
      region: '',
      color: '#FF6B35',
      logo: ''
    },
    openid: '',
    uploading: false
  },

  onLoad: function(options) {
    this.getOpenId()
  },

  // 获取用户 openid
  getOpenId: function() {
    wx.cloud.callFunction({
      name: 'getOpenId'
    }).then(res => {
      this.setData({
        openid: res.result.openid
      })
    }).catch(err => {
      console.error('获取 openid 失败', err)
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      })
    })
  },

  // 输入队名
  inputName: function(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  // 输入地区
  inputRegion: function(e) {
    this.setData({
      'formData.region': e.detail.value
    })
  },

  // 选择队服颜色
  chooseColor: function(e) {
    const colors = ['#FF6B35', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#E91E63', '#607D8B', '#795548']
    wx.showActionSheet({
      itemList: ['橙色', '绿色', '蓝色', '黄色', '紫色', '粉色', '灰色', '棕色'],
      success: (res) => {
        this.setData({
          'formData.color': colors[res.tapIndex]
        })
      }
    })
  },

  // 选择队徽
  chooseLogo: function() {
    const that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        that.setData({ uploading: true })
        const filePath = res.tempFilePaths[0]
        const cloudPath = `team-logos/${Date.now()}.jpg`

        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: uploadRes => {
            that.setData({
              'formData.logo': uploadRes.fileID,
              uploading: false
            })
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            })
          },
          fail: err => {
            console.error('上传失败', err)
            that.setData({ uploading: false })
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            })
          }
        })
      }
    })
  },

  // 提交创建
  submit: function() {
    const { name, region } = this.data.formData

    if (!name) {
      wx.showToast({
        title: '请输入队名',
        icon: 'none'
      })
      return
    }

    if (!region) {
      wx.showToast({
        title: '请输入地区',
        icon: 'none'
      })
      return
    }

    if (!this.data.openid) {
      wx.showToast({
        title: '获取用户信息中，请稍候',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '创建中...'
    })

    // 创建球队
    db.collection('teams').add({
      data: {
        name: this.data.formData.name,
        region: this.data.formData.region,
        color: this.data.formData.color,
        logo: this.data.formData.logo,
        create_time: db.serverDate(),
        create_by: this.data.openid
      }
    }).then(res => {
      const teamId = res._id

      // 将创建者添加为队长
      return db.collection('team_members').add({
        data: {
          team_id: teamId,
          openid: this.data.openid,
          role: 'captain',
          join_time: db.serverDate()
        }
      })
    }).then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '创建成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      console.error('创建球队失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '创建失败，请重试',
        icon: 'none'
      })
    })
  }
})
