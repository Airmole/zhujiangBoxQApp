// pages/score/showScore/showScore.js
var wxCharts = require('../../utils/wxcharts.js');
var app = getApp();
var lineChart = null;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    stuId: "",
    password: "",
    jsonContent: '',
    allJsonGet: '',
    PicURL: "",
    PicArr: [""],
    hasUserInfo: false,
    isLoading: true,
    showGraphic: true,
    painting: {},
    shareBtn: true,
    shareImage: ''
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    var that = this;
    console.log(options);

    wx.getSystemInfo({
      success(res) {
        if (res.system.indexOf('iOS') >= 0) {
          that.setData({
            shareBtn: false,
          })
        }
      }
    })

    var uid = wx.getStorageSync('uid');
    var pwd = wx.getStorageSync('newpwd');
    var cookie = options.cookie;
    var vcode = options.vcode;
    var scoreCache = wx.getStorageSync('p19Score');
    let showCache = true;
    if (options.update == '1') {
      showCache = false;
      that.GetScoreData(uid, pwd, cookie, vcode);
      return;
    }

    if (scoreCache.code == "200" && showCache) {
      that.setData({
        stuId: uid,
        password: pwd,
        jsonContent: scoreCache.scoreByTerm,
        allJsonGet: scoreCache,
        isLoading: false
      })
      that.charts();
    } else if ((uid == '' || pwd == '') || (vcode == '' || cookie == '')) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
    } else {
      that.GetScoreData(uid, pwd, cookie, vcode);
    }

  },
  /**
   * 查询成绩
   */
  GetScoreData: function (uid, pwd, cookie, vcode) {
    wx.showToast({
      title: "加载中...",
      icon: "loading",
      duration: 60000
    })
    var that = this;
    wx.request({
      url: 'https://api.airmole.cn/zhujiangBox/score.php',
      method: "POST",
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: {
        username: uid,
        password: pwd,
        cookie: cookie,
        vcode: vcode
      },
      success: function (res) {
        console.log(res.data)
        that.setData({
          jsonContent: res.data.scoreByTerm,
          allJsonGet: res.data,
        })
        if (Object.keys(res.data).length == 0) {
          wx.redirectTo({
            url: '/pages/error/queryerror?ErrorTips=暂时无法查询'
          })
        }
        if (Object.keys(res.data).length != 0) {
          if (res.data.code == "401" && res.data.desc == "学号、密码不正确？") {
            that.reLogin();
          }
          if (res.data.code == "500" && res.data.desc == '验证码可能不对，再试一次') {
            wx.showToast({
              title: res.data.desc,
              icon: "none",
            })
            wx.redirectTo({
              url: '/pages/vcode/vcode?to=score&update=1'
            })
            return;
          }
          that.setData({
            isLoading: false
          });
          wx.hideToast();
          wx.setStorageSync('p19Score', res.data);
          that.charts();
          wx.showToast({
            title: "更新完成",
            icon: "succeed",
            duration: 2000
          })
        } else {
          wx.redirectTo({
            url: '/pages/error/queryerror?ErrorTips=' + res.data.desc
          })
        }
      }
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this;
    that.onLoad();
    wx.stopPullDownRefresh();
    wx.showToast({
      title: "更新完成",
      icon: "succeed",
      duration: 2000
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  //图表相关
  createSimulationData: function () {
    var that = this;
    var categories = [];
    var data1 = [];
    var data2 = [];
    var scoreJson = that.data.jsonContent;
    if (scoreJson.length < 2) {
      console.log("scoreJson.length==" + scoreJson.length);
      that.setData({
        showGraphic: false
      })
    }
    for (var key in scoreJson) {
      categories.push(key);
      data1.push(scoreJson[key].avg);
      data2.push(scoreJson[key].gpa);
    }
    categories = categories.reverse();
    data1 = data1.reverse();
    data2 = data2.reverse();
    return {
      categories: categories,
      data1: data1,
      data2: data2,
    }
  },

  touchHandler: function (e) {
    // console.log(lineChart.getCurrentDataIndex(e));
    lineChart.showToolTip(e, {
      // background: '#7cb5ec',
      format: function (item, category) {
        return category + ' ' + item.name + ':' + item.data
      }
    });
  },
  charts: function (e) {
    var that = this;
    var windowWidth = 320;
    try {
      var res = wx.getSystemInfoSync();
      windowWidth = res.windowWidth * 0.95;
    } catch (e) {
      console.error('getSystemInfoSync failed!');
    }
    var simulationData = this.createSimulationData();
    console.log(simulationData)
    var that = this;
    if (simulationData.categories.length <= 0) {
      that.setData({
        showGraphic: false
      })
    } else {
      lineChart = new wxCharts({
        canvasId: 'lineCanvas',
        type: 'line',
        categories: simulationData.categories,
        animation: true,
        background: '#7acfa6',
        series: [{
          name: '算术平均分',
          data: simulationData.data1,
          format: (val) => val + "分"
        },
        {
          name: '加权平均分',
          data: simulationData.data2,
          format: (val) => val + "分"
        }
        ],
        xAxis: {
          disableGrid: true
        },
        yAxis: {
          title: '每学期学分趋势',
          format: (val) => val.toFixed(2),
          min: 60
        },
        width: windowWidth,
        height: 200,
        dataLabel: false,
        dataPointShape: true,
        extra: {
          lineStyle: 'curve'
        }
      });

    }
  },
  //注销重登录
  reLogin: function () {
    app.globalData.uid = "";
    app.globalData.pwd = "";
    app.globalData.newpwd = "";
    wx.setStorageSync('uid', '');
    wx.setStorageSync('pwd', '');
    wx.setStorageSync('newpwd', '');
    wx.redirectTo({
      url: '/pages/index/index'
    })
  },
  eventDraw() {
    var that = this;
    if (that.data.shareImage != '') {
      wx.previewImage({
        urls: [that.data.shareImage],
      })
      wx.showToast({
        title: '图片已保存至相册，记得分享给朋友们哟',
        icon: 'none',
        duration: 3000
      })
      return
    }
    wx.showLoading({
      title: '绘制分享图片中',
      mask: true
    })

    let userNickName = wx.getStorageSync('nickName');
    if (userNickName == '') {
      userNickName = that.data.stuId;
    } else {
      userNickName = '';
    }
    let nickName = {
      type: 'text',
      content: userNickName,
      fontSize: 26,
      color: '#000',
      textAlign: 'center',
      top: 350,
      left: 300,
      lineHeight: 20,
      MaxLineNumber: 1,
      breakWord: true,
      width: 160
    };


    var newArr = [];
    let countNum = 0;
    const mockData = that.data.jsonContent;
    for (let p in mockData) {
      for (let q in mockData[p].score) {
        if (mockData[p].score[q].score >= 60) {
          countNum++;
          let newTempArr = {
            SerialNo: countNum,
            className: mockData[p].score[q].courseName,
            gpa: mockData[p].score[q].gpa,
            credit: mockData[p].score[q].credit,
            score: mockData[p].score[q].score
          };
          newArr.push(newTempArr);
        }
      }
    }
    let midNum = 0;
    if (newArr.length % 2 == 0 && newArr.length > 0) {
      midNum = newArr.length / 2;
    } else {
      midNum = (newArr.length + 1) / 2;
    }
    var whitePaperHeight = (midNum * 20) + 35;
    var pushArr = [{
      type: 'image',
      url: 'https://upload-images.jianshu.io/upload_images/4697920-673a4cca008d75dc.png',
      top: 0,
      left: 0,
      width: 600,
      height: 390
    }, {
      type: 'image',
      url: 'https://upload-images.jianshu.io/upload_images/4697920-08dc98107d9e5bbc.png',
      top: 390 + whitePaperHeight,
      left: 0,
      width: 600,
      height: 275
    }];

    let makeupFullPicArr = [{
      type: 'rect',
      background: '#ffffff',
      top: 390,
      left: 11,
      width: 576,
      height: whitePaperHeight
    }, {
      type: 'rect',
      background: '#EF835F',
      top: 390,
      left: 0,
      width: 11,
      height: whitePaperHeight
    }, {
      type: 'rect',
      background: '#EF835F',
      top: 390,
      left: 587,
      width: 13,
      height: whitePaperHeight
    }, {
      type: 'text',
      content: '序号',
      fontSize: 13,
      color: '#000',
      textAlign: 'left',
      top: 400,
      left: 17,
      lineHeight: 20,
      MaxLineNumber: 1,
      breakWord: true,
      width: 30
    }, {
      type: 'text',
      content: '课程名称',
      fontSize: 13,
      color: '#000',
      textAlign: 'left',
      top: 400,
      left: 48,
      lineHeight: 20,
      MaxLineNumber: 1,
      breakWord: true,
      width: 200
    }, {
      type: 'text',
      content: '学分',
      fontSize: 13,
      color: '#000',
      textAlign: 'left',
      top: 400,
      left: 245,
      lineHeight: 20,
      MaxLineNumber: 1,
      breakWord: true,
      width: 30
    }, {
      type: 'text',
      content: '成绩',
      fontSize: 13,
      color: '#000',
      textAlign: 'left',
      top: 400,
      left: 273,
      lineHeight: 20,
      MaxLineNumber: 1,
      breakWord: true,
      width: 30
    }, {
      type: 'text',
      content: '序号',
      fontSize: 13,
      color: '#000',
      textAlign: 'left',
      top: 400,
      left: 310,
      lineHeight: 20,
      MaxLineNumber: 1,
      breakWord: true,
      width: 30
    }, {
      type: 'text',
      content: '课程名称',
      fontSize: 13,
      color: '#000',
      textAlign: 'left',
      top: 400,
      left: 338,
      lineHeight: 20,
      MaxLineNumber: 1,
      breakWord: true,
      width: 200
    }, {
      type: 'text',
      content: '学分',
      fontSize: 13,
      color: '#000',
      textAlign: 'left',
      top: 400,
      left: 528,
      lineHeight: 20,
      MaxLineNumber: 1,
      breakWord: true,
      width: 30
    }, {
      type: 'text',
      content: '成绩',
      fontSize: 13,
      color: '#000',
      textAlign: 'left',
      top: 400,
      left: 558,
      lineHeight: 20,
      MaxLineNumber: 1,
      breakWord: true,
      width: 30
    }];
    pushArr.push(nickName);
    pushArr = pushArr.concat(makeupFullPicArr);

    var topX = 400;
    var leftY = 20;
    for (let i = 0; i < midNum; i++) {
      topX = topX + 20;
      let tempNo = {
        type: 'text',
        content: newArr[i].SerialNo + '',
        fontSize: 14,
        color: '#000',
        textAlign: 'left',
        top: topX,
        left: leftY,
        lineHeight: 20,
        MaxLineNumber: 1,
        breakWord: true,
        width: 20
      };
      pushArr.push(tempNo);
      let tempClassName = {
        type: 'text',
        content: newArr[i].className,
        fontSize: 14,
        color: '#000',
        textAlign: 'left',
        top: topX,
        left: leftY + 25,
        lineHeight: 20,
        MaxLineNumber: 1,
        breakWord: true,
        width: 180
      };
      pushArr.push(tempClassName);
      let tempCredit = {
        type: 'text',
        content: newArr[i].credit,
        fontSize: 13,
        color: '#000',
        textAlign: 'center',
        top: topX,
        left: leftY + 230,
        lineHeight: 20,
        MaxLineNumber: 1,
        breakWord: true,
        width: 20
      };
      pushArr.push(tempCredit);
      let tempScore = {
        type: 'text',
        content: newArr[i].score,
        fontSize: 13,
        color: '#000',
        textAlign: 'center',
        top: topX,
        left: leftY + 260,
        lineHeight: 20,
        MaxLineNumber: 1,
        breakWord: true,
        width: 20
      };
      pushArr.push(tempScore);
    }

    topX = 400;
    leftY = 310;
    for (let i = midNum; i < newArr.length; i++) {
      topX = topX + 20;
      let tempNo = {
        type: 'text',
        content: newArr[i].SerialNo + '',
        fontSize: 14,
        color: '#000',
        textAlign: 'left',
        top: topX,
        left: leftY,
        lineHeight: 20,
        MaxLineNumber: 1,
        breakWord: true,
        width: 20
      };
      pushArr.push(tempNo);
      let tempClassName = {
        type: 'text',
        content: newArr[i].className,
        fontSize: 14,
        color: '#000',
        textAlign: 'left',
        top: topX,
        left: leftY + 25,
        lineHeight: 20,
        MaxLineNumber: 1,
        breakWord: true,
        width: 180
      };
      pushArr.push(tempClassName);
      let tempCredit = {
        type: 'text',
        content: newArr[i].credit,
        fontSize: 13,
        color: '#000',
        textAlign: 'center',
        top: topX,
        left: leftY + 230,
        lineHeight: 20,
        MaxLineNumber: 1,
        breakWord: true,
        width: 20
      };
      pushArr.push(tempCredit);
      let tempScore = {
        type: 'text',
        content: newArr[i].score,
        fontSize: 13,
        color: '#000',
        textAlign: 'center',
        top: topX,
        left: leftY + 255,
        lineHeight: 20,
        MaxLineNumber: 1,
        breakWord: true,
        width: 20
      };
      pushArr.push(tempScore);
    }
    console.log(newArr);
    that.setData({
      painting: {
        width: 600,
        height: 390 + whitePaperHeight + 275,
        clear: false,
        views: pushArr
      }
    })
  },
  eventSave() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.shareImage,
      success(res) {
        wx.showToast({
          title: '图片已保存至相册，记得分享给朋友们哟',
          icon: 'none',
          duration: 3000
        })
      }
    })
  },
  eventGetImage(event) {
    var that = this;
    console.log(event)
    wx.hideLoading()
    const {
      tempFilePath,
      errMsg
    } = event.detail
    if (errMsg === 'canvasdrawer:ok') {
      this.setData({
        shareImage: tempFilePath
      })
      wx.previewImage({
        urls: [tempFilePath],
      })
      that.eventSave();
    }
  },
  refreshData: function () {
    wx.redirectTo({
      url: '/pages/vcode/vcode?to=score&update=1',
    })
  }
})