var app = getApp();
Page({
  data: {
    uid: '',
    pwd: '',
    inputShowed: false,
    isLoading: '加载中',
    isShowAllCourse: false,
    isLogined: false,
    grids: [{
      id: 0,
      icon: 'cjcx',
      name: '成绩查询',
      url: '/pages/vcode/vcode?to=score&update=0'
    }, {
      id: 1,
      icon: 'grxx',
      name: '个人信息',
      url: '/pages/myInfo/myInfo'
    }, {
      id: 2,
      icon: 'gyhz',
      name: '关于盒子',
      url: '/pages/about/about'
    }]
  },
  onLoad: function () {
    var that = this;
    var uid = wx.getStorageSync('uid');
    var pwd = wx.getStorageSync('newpwd');
    if (uid != '' && pwd != '') {
      that.setData({
        uid: uid,
        pwd: pwd,
        isLoading: 'finished',
        isLogined: true
      });
      // console.log(that.data.uid + '-' + that.data.pwd)
    } else {
      that.setData({
        isLoading: 'finished',
        isLogined: false
      });
    }
  },
  onReady: function () {
    var that = this;
    this.onLoad();
  },

  onShow: function () { },
  bindGetUserInfo: function (e) {
    console.log(e);
    app.globalData.nickName = e.detail.userInfo.nickName;
    wx.setStorageSync('nickName', e.detail.userInfo.nickName);
    wx.navigateTo({
      url: '/pages/login/login',
    })
  },
  goPage: function (e) {
    var that = this;
    console.log(e.currentTarget.dataset);
    if (e.currentTarget.dataset.id < 2 && (that.data.uid == '' || that.data.pwd == '')) {
      wx.showToast({
        icon: 'none',
        image: '/images/about.png',
        title: '本功能需要登录',
      })
      return;
    } else {
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    }
  },
  goShellBox: function () {
    wx.navigateToMiniProgram({
      appId: '1109608669',
      success(res) {
        // 打开成功
      }
    })
  },
 onShareAppMessage: function() {
    wx.showShareMenu({
      showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
    })
  }
});