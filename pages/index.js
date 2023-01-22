import {json2str, str2json} from "../shared/data";
import {DebugText} from "../shared/debug";
import {getGlobal} from "../shared/global";
import {
    Colors,
    Commands,
    DATA_ALARM_UPDATE_INTERVAL,
    DATA_STALE_TIME_MS,
    DATA_TIMER_UPDATE_INTERVAL_MS,
    DATA_UPDATE_INTERVAL_MS,
} from "../utils/config/constants";
import {
    WATCHDRIP_CONFIG,
    WATCHDRIP_CONFIG_DEFAULTS,
    WATCHDRIP_CONFIG_LAST_UPDATE,
    WF_INFO,
    WF_INFO_LAST_UPDATE
} from "../utils/config/global-constants";
import {
    BG_DELTA_TEXT,
    BG_STALE_RECT,
    BG_TIME_TEXT,
    BG_TREND_IMAGE,
    BG_VALUE_TEXT,
    MESSAGE_TEXT,
    MESSAGE_TEXT2,
    MESSAGE_TEXT3,
    TITLE_TEXT,
    VERSION_TEXT,
} from "../utils/config/styles";

import * as fs from "./../shared/fs";
import {WatchdripData} from "../utils/watchdrip/watchdrip-data";

const logger = DeviceRuntimeCore.HmLogger.getLogger("watchdrip_app");

const {messageBuilder} = getApp()._options.globalData;
const {appId} = hmApp.packageInfo();

let debug;

/*
typeof Watchdrip
*/
let watchdrip = null;

const GoBackType = {NONE: 'none', GO_BACK: 'go_back', HIDE: 'hide'};

class Watchdrip {
    start(page) {
        this.timeSensor = hmSensor.createSensor(hmSensor.id.TIME);
        this.vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE);
        debug.log("onInit");
        debug.log(page);
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
        let configLastUpdate = hmFS.SysProGetInt64(WATCHDRIP_CONFIG_LAST_UPDATE);
        let configStr = hmFS.SysProGetChars(WATCHDRIP_CONFIG);
        if (!configStr) {
            this.watchdripConfig = WATCHDRIP_CONFIG_DEFAULTS;
            this.saveConfig();
        } else {
            try {
                this.watchdripConfig = str2json(configStr);
            } catch (e) {

            }
        }
    }

    saveConfig() {
        hmFS.SysProSetChars(WATCHDRIP_CONFIG, json2str(this.watchdripConfig));
        hmFS.SysProSetChars(WATCHDRIP_CONFIG_LAST_UPDATE, this.timeSensor.utc);
    }

    main_page() {
        hmSetting.setBrightScreen(60);
        hmApp.setScreenKeep(true);
        this.watchdripData = new WatchdripData(this.timeSensor);
        let pkg = hmApp.packageInfo();
        this.titleTextWidget = hmUI.createWidget(hmUI.widget.TEXT, TITLE_TEXT)
        this.versionTextWidget = hmUI.createWidget(hmUI.widget.TEXT, {...VERSION_TEXT, text: "v" + pkg.version});
        this.messageTextWidget1 = hmUI.createWidget(hmUI.widget.TEXT, {...MESSAGE_TEXT, text: ""});
        this.messageTextWidget2 = hmUI.createWidget(hmUI.widget.TEXT, {...MESSAGE_TEXT2, text: ""});
        this.messageTextWidget3 = hmUI.createWidget(hmUI.widget.TEXT, {...MESSAGE_TEXT3, text: ""});

        this.bgValTextWidget = hmUI.createWidget(hmUI.widget.TEXT, BG_VALUE_TEXT);
        this.bgValTimeTextWidget = hmUI.createWidget(hmUI.widget.TEXT, BG_TIME_TEXT);
        this.bgDeltaTextWidget = hmUI.createWidget(hmUI.widget.TEXT, BG_DELTA_TEXT);
        this.bgTrendImageWidget = hmUI.createWidget(hmUI.widget.IMG, BG_TREND_IMAGE);
        this.bgStaleLine = hmUI.createWidget(hmUI.widget.FILL_RECT, BG_STALE_RECT);

        this.showMessage("Connecting...", "", "");

        //for display tests
        // this.setMessageVisibility(false);
        // this.setBgElementsVisibility(true);
        // this.updateWidgets();
        // return;

        watchdrip.fetchInfo();
        this.startDataUpdates();

        /*hmUI.createWidget(hmUI.widget.BUTTON, {
            ...COMMON_BUTTON_FETCH,
            click_func: (button_widget) => {
                this.fetchInfo();
            },
        });*/
    }

    startDataUpdates() {
        if (this.intervalTimer != null) return; //already started
        //debug.log("startDataUpdates");
        this.checkUpdates(); //start immediately
        this.intervalTimer = this.globalNS.setInterval(() => {
            this.checkUpdates();
        }, DATA_TIMER_UPDATE_INTERVAL_MS);
    }

    stopDataUpdates() {
        if (this.intervalTimer !== null) {
            //debug.log("stopDataUpdates");
            this.globalNS.clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
    }

    checkUpdates() {
        this.updateTimesWidget();
        //debug.log("checkUpdates");
        if (this.updatingData) {
            // debug.log("updatingData, return");
            return;
        }
        let lastInfoUpdate = hmFS.SysProGetInt64(WF_INFO_LAST_UPDATE);
        let utc = this.timeSensor.utc;
        if (!lastInfoUpdate) {
            if (this.lastUpdateAttempt == null) {
                debug.log("initial fetch");
                watchdrip.fetchInfo();
                return;
            }
            if (utc - this.lastUpdateAttempt > DATA_STALE_TIME_MS) {
                debug.log("the side app not responding, force update again");
                watchdrip.fetchInfo();
                return;
            }
        } else {
            if (!this.lastUpdateSucessful) {
                if (this.lastUpdateAttempt !== null)
                    if ((utc - this.lastUpdateAttempt > DATA_STALE_TIME_MS)) {
                        debug.log("reached DATA_STALE_TIME_MS");
                        watchdrip.fetchInfo();
                        return;
                    } else {
                        return;
                    }
            }
            if ((utc - lastInfoUpdate > DATA_UPDATE_INTERVAL_MS)) {
                debug.log("reached DATA_UPDATE_INTERVAL_MS");
                watchdrip.fetchInfo();
                return;
            }
            if (this.lastInfoUpdate === lastInfoUpdate) {
                //debug.log("data not modified");
                return;
            }
            watchdrip.fetchInfo();
        }
    }

    update_page() {
        debug.log("update_page");
        hmSetting.setBrightScreen(60);
        this.fetchInfo();
    }

    hide_page() {
        //hmSetting.setScreenOff();
        hmApp.setScreenKeep(false);
        hmSetting.setBrightScreenCancel();
    }

    fetchInfo() {
        debug.log("fetchInfo");
        this.lastUpdateSucessful = false;
        // this.startAppUpdate();
        if (messageBuilder.connectStatus() == false) {
            debug.log("No bt connection");
            this.showMessage('Please make sure', 'the bluetooth is enabled', 'on your phone');
            return;
        }
        this.updatingData = true;
        debug.log("fetchInfoStart");
        messageBuilder
            .request({
                method: Commands.getInfo,
            }, {timeout: 2000})
            .then((data) => {
                debug.log("received data");
                const {result: info = {}} = data;
                debug.log(info);
               try {
                    if (info.error) {
                        debug.log("error:" + info.message);
                    } else {
                        let dataInfo = str2json(info);
                        this.watchdripData.setData(dataInfo);
                        this.watchdripData.updateTimeDiff();
                        this.lastInfoUpdate = this.saveInfo(info);
                        this.lastUpdateSucessful = true;
                        this.setMessageVisibility(false);
                        this.setBgElementsVisibility(true);
                        this.updateWidgets();
                    }
                } catch (e) {
                    debug.log("error:" + e);
                }
            })
            .catch((error) => {
                debug.log("fetch error:" + error);
            })
            .finally(() => {
                if (!this.lastUpdateSucessful) {
                    this.showMessage('Launch "Watchdrip+" app', 'on your phone and activate', '"web server" option');
                }
                this.updatingData = false;
            });
    }

    updateWidgets() {
        this.updateValuesWidget()
        this.updateTimesWidget()
    }

    updateValuesWidget() {
        let bgValColor = Colors.white;
        let bgObj = this.watchdripData.getBg();
        if (bgObj.isHigh) {
            bgValColor = Colors.bgHigh;
        } else if (bgObj.isLow) {
            bgValColor = Colors.bgLow;
        }

        this.bgValTextWidget.setProperty(hmUI.prop.MORE, {
            text: bgObj.getBGVal(),
            color: bgValColor,
        });

        this.bgDeltaTextWidget.setProperty(hmUI.prop.MORE, {
            text: bgObj.delta + " " + this.watchdripData.getStatus().getUnitText()
        });

        //debug.log(bgObj.getArrowResource());
        this.bgTrendImageWidget.setProperty(hmUI.prop.SRC, bgObj.getArrowResource());
        this.bgStaleLine.setProperty(hmUI.prop.VISIBLE, this.watchdripData.isBgStale());
    }

    updateTimesWidget() {
        let bgObj = this.watchdripData.getBg();
        this.bgValTimeTextWidget.setProperty(hmUI.prop.MORE, {
            text: this.watchdripData.getTimeAgo(bgObj.time),
        });
    }

    showMessage(line1, line2, line3) {
        this.setBgElementsVisibility(false);
        this.messageTextWidget1.setProperty(hmUI.prop.MORE, {text: line1});
        this.messageTextWidget2.setProperty(hmUI.prop.MORE, {text: line2});
        this.messageTextWidget3.setProperty(hmUI.prop.MORE, {text: line3});
        this.setMessageVisibility(true);
    }

    setBgElementsVisibility(visibility) {
        this.bgValTextWidget.setProperty(hmUI.prop.VISIBLE, visibility);
        this.bgValTimeTextWidget.setProperty(hmUI.prop.VISIBLE, visibility);
        this.bgTrendImageWidget.setProperty(hmUI.prop.VISIBLE, visibility);
        this.bgStaleLine.setProperty(hmUI.prop.VISIBLE, visibility);
        this.bgDeltaTextWidget.setProperty(hmUI.prop.VISIBLE, visibility);
    }

    setMessageVisibility(visibility) {
        this.messageTextWidget1.setProperty(hmUI.prop.VISIBLE, visibility);
        this.messageTextWidget2.setProperty(hmUI.prop.VISIBLE, visibility);
        this.messageTextWidget3.setProperty(hmUI.prop.VISIBLE, visibility);
    }

    saveInfo(info) {
        hmFS.SysProSetChars(WF_INFO, info);
        let time = this.timeSensor.utc;
        hmFS.SysProSetInt64(WF_INFO_LAST_UPDATE, time);
        return time;
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
        debug.log("start update app timer");
        this.system_alarm_id = hmApp.alarmNew({
            appid: appId,
            url: "pages/index",
            param: "update_local",
            delay: DATA_ALARM_UPDATE_INTERVAL,
        });
    }

    fetchImg() {
        const fileName = SERVER_IMAGE_URL;
        messageBuilder
            .request({
                method: Commands.getImg,
                params: fileName,
            })
            .then((data) => {
                logger.log("receive data");
                const {result = {}} = data;
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
                let res = fs.statSync(filePath);
                debug.log(res);
                // Image view
                let view = hmUI.createWidget(hmUI.widget.IMG, {
                    x: px(0),
                    y: px(0),
                    src: fileName,
                });
            });
    }

    vibrateNow() {
        this.vibrate.stop();
        this.vibrate.scene = 24;
        this.vibrate.start();
    }

    onDestroy() {
        this.stopDataUpdates();
        this.vibrate.stop();
        hmSetting.setBrightScreenCancel();
    }
}


Page({
    onInit(p) {
        logger.debug("page onInit invoked");
        if (!p || p === 'undefined') p = "main";

        debug = new DebugText(hmUI);
        debug.setLines(12);

        watchdrip = new Watchdrip()
        watchdrip.start(p);

    },
    build() {
        logger.debug("page build invoked");
    },
    onDestroy() {
        logger.debug("page onDestroy invoked");
        watchdrip.onDestroy();
    },
});
