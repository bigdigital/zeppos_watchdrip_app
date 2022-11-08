import { buf2Json, buf2str, json2str, str2buf, str2json } from "../shared/data";
import { DebugText } from "../shared/debug";
import { getGlobal } from "../shared/global";
import { MessageBuilder } from "../shared/message";
import { writeImageAutoDetectBestFormat } from "../shared/tga-img";
import {
  Commands,
  DATA_UPDATE_INTERVAL_MS,
} from "../utils/config/constants";
import { DEVICE_WIDTH } from "../utils/config/device";
import {
  WATCHDRIP_CONFIG,
  WATCHDRIP_CONFIG_DEFAULTS,
  WATCHDRIP_CONFIG_LAST_UPDATE,
  WF_INFO,
  WF_INFO_LAST_UPDATE
} from "../utils/config/global-constants";
import {
  COMMON_BUTTON_FETCH,
  COMMON_BUTTON_FETCH_IMG,
  COMMON_TITLE_TEXT, TITLE_TEXT,
} from "../utils/config/styles";

import * as fs from "./../shared/fs";

const logger = DeviceRuntimeCore.HmLogger.getLogger("watchdrip_app");

const { messageBuilder } = getApp()._options.globalData;
const { appId } = hmApp.packageInfo();


const TIME_SENSOR = hmSensor.createSensor(hmSensor.id.TIME);


var dataTextWidget;
let debug;

/*
typeof Watchdrip
*/
var watchdrip = null;

const GoBackType = { NONE: 'none', GO_BACK: 'go_back', HIDE: 'hide' };

class Watchdrip {
  start(page) {
    this.timeSensor = hmSensor.createSensor(hmSensor.id.TIME);
    this.vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE);
    this.debug = new DebugText(hmUI);
    this.debug.setLines(12);
    this.debug.log("onInit");
    this.debug.log(page);
    this.globalNS = getGlobal();
    this.goBackType = GoBackType.NONE;
    this.readConfig();
    switch (page) {
      case "main":
        this.main_page();
        break;
      case "update":
        this.goBackType = GoBackType.GO_BACK;
        this.update_page();
        break;
      case "update_local":
        this.goBackType = GoBackType.HIDE;
        this.update_page();
        break;
      case "hide": 
        this.hide_page();
        break;
      case "config":
        //this.config_page()
        break;
    }
  }


  readConfig() {
    var configLastUpdate = hmFS.SysProGetInt64(WATCHDRIP_CONFIG_LAST_UPDATE);
    var configStr = hmFS.SysProGetChars(WATCHDRIP_CONFIG);
    if (!configStr) {
      this.watchdripConfig = WATCHDRIP_CONFIG_DEFAULTS;
      this.saveConfig();
    } else {
      try {
        this.watchdripConfig = str2json(configStr);
      }
      catch (e) {

      }
    }
  }

  saveConfig() {
    hmFS.SysProSetChars(WATCHDRIP_CONFIG, json2str(this.watchdripConfig));
    hmFS.SysProSetChars(WATCHDRIP_CONFIG_LAST_UPDATE, this.timeSensor.utc);
  }

  main_page() {
    this.debug.log("main_page");
    hmUI.createWidget(hmUI.widget.TEXT, TITLE_TEXT)

    hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
      x: px(30),
      y: px(80),
      w: _ - 2 * px(30),
      h: r - px(100),
      item_space: 10,
      item_config: [{
        type_id: 1,
        item_bg_color: this.state.background,
        item_bg_radius: 10,
        text_view: [{
          x: px(-100),
          y: px(20),
          w: px(360),
          h: px(80),
          key: "name",
          color: this.state.white,
          text_size: 30
        }, {
          x: px(100),
          y: px(20),
          w: px(360),
          h: px(80),
          key: "price",
          color: this.state.white,
          text_size: 30
        }],
        text_view_count: 2,
        item_height: 130
      }],
      item_config_count: 1,
      data_array: c,
      data_count: c.length,
      item_click_func: (t, e) => {
        hmApp.gotoPage({
          file: "pages/wallet",
          param: JSON.stringify({
            id: c[e].id,
            name: c[e].name
          })
        })
      },
      data_type_config: [{
        start: 0,
        end: 1,
        type_id: 1
      }],
      data_type_config_count: 1
    })


    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...COMMON_BUTTON_FETCH,
      click_func: (button_widget) => {
        this.debug.log("click fetchInfo");
        this.fetchInfo();
      },
    });
  }

  update_page() {
    this.debug.log("update_page");
    hmSetting.setBrightScreen(60);
    this.fetchInfo();
  } 

  hide_page() {
    //hmSetting.setScreenOff(); 
    hmApp.setScreenKeep(false); 
    hmSetting.setBrightScreenCancel(); 
  }

  fetchInfo() {
    this.debug.log("fetchInfo");

   // this.startAppUpdate();

    if (messageBuilder.connectStatus() == false) {
      this.debug.log("No bt connection");
      this.handleGoback();
      return;
    }
    messageBuilder
      .request({
        method: Commands.getInfo,
      }, { timeout: 10000 })
      .then((data) => {
        this.debug.log("received data");
        const { result: info = {} } = data;
        this.debug.log("info");
        this.debug.log(info);
        hmFS.SysProSetChars(WF_INFO, info);
        var timeout = this.timeSensor.utc;
        hmFS.SysProSetInt64(WF_INFO_LAST_UPDATE, timeout);
        this.debug.log(timeout);
        this.handleGoback();
      });
  }

  handleGoback() {
    return;
    switch (this.goBackType) {
      case GoBackType.NONE:
        break;
      case GoBackType.GO_BACK:
        hmApp.goBack();
        break;
      case GoBackType.HIDE:
        hmApp.gotoPage({
          url: 'pages/index',
          param: 'hide'
        })
        break;
    }
  }

  startAppUpdate() {
    if (this.system_alarm_id !== null) {
      hmApp.alarmCancel(this.system_alarm_id);
    }
    if (this.watchdripConfig != null && this.watchdripConfig.disableUpdates === true) {
      return;
    }
    this.debug.log("start update app timer");
    this.system_alarm_id = hmApp.alarmNew({
      appid: appId,
      url: "pages/index",
      param: "update_local",
      delay: DATA_UPDATE_INTERVAL_MS,
    });
  }

  /*fetchImg() {
    logger.log("fetchImg");
    debug.log("fetchImg");
    const fileName = SERVER_IMAGE_URL;
    messageBuilder
      .request({
        method: Commands.getImg,
        params: fileName,
      })
      .then((data) => {
        logger.log("receive data");
        const { result = {} } = data;
        debug.log(`Received file size: ${result.length} bytes`);
        logger.log(`Received file size: ${result.length} bytes`);
        let filePath = fs.fullPath(fileName);
        debug.log(filePath);
        let file = fs.getSelfPath() + "/assets";
        const [fileNameArr, err] = hmFS.readdir(file);
        debug.log(file);
        debug.log(fileNameArr);

        const hex = Buffer.from(result, "base64");

        fs.writeRawFileSync(filePath, hex);

        const [fileNameArr2] = hmFS.readdir(file);

        debug.log(fileNameArr2);
        var res = fs.statSync(filePath);
        debug.log(res);
        // Image view
        view = hmUI.createWidget(hmUI.widget.IMG, {
          x: px(0),
          y: px(0),
          w: px(454),
          h: px(454),
          src: fileName,
        });
      });
  }*/

  vibrateNow() {
    this.vibrate.stop();
    this.vibrate.scene = 24;
    this.vibrate.start();
  }

  onDestroy() {
    this.vibrate.stop();
    hmSetting.setBrightScreenCancel();
  }
}


Page({
  onInit(p) {
    logger.debug("page onInit invoked");
    if (!p || p === 'undefined') p = "main";

    watchdrip = new Watchdrip()
    watchdrip.start(p);
    //this.onMessage();
  },
  build() {
    logger.debug("page build invoked");
  },
  onDestroy() {
    logger.debug("page onDestroy invoked");
    watchdrip.onDestroy();
  },
  // onMessage() {
  //   //listener for app side
  //   messageBuilder.on("call", ({ payload: buf }) => {
  //     debug.log("call");
  //     const data = messageBuilder.buf2Json(buf);
  //     debug.log(data);
  //   });
  // },
});
