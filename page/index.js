import {json2str, str2json} from "../shared/data";
import {DebugText} from "../shared/debug";
import {getGlobal} from "../shared/global";
import {gettext as getText} from "i18n";
import {
    Colors,
    Commands,
    DATA_STALE_TIME_MS,
    DATA_TIMER_UPDATE_INTERVAL_MS,
    DATA_UPDATE_INTERVAL_MS,
    PROGRESS_ANGLE_INC,
    PROGRESS_UPDATE_INTERVAL_MS,
    XDRIP_UPDATE_INTERVAL_MS,
} from "../utils/config/constants";
import {
    WATCHDRIP_ALARM_SETTINGS_DEFAULTS, WF_DIR,
    WF_INFO_FILE,
} from "../utils/config/global-constants";
import {
    BG_DELTA_TEXT,
    BG_STALE_RECT,
    BG_TIME_TEXT,
    BG_TREND_IMAGE,
    BG_VALUE_TEXT,
    COMMON_BUTTON_ADD_TREATMENT,
    COMMON_BUTTON_SETTINGS,
    CONFIG_PAGE_SCROLL,
    DEVICE_TYPE,
    IMG_LOADING_PROGRESS,
    MESSAGE_TEXT,
    RADIO_OFF,
    RADIO_ON,
    TITLE_TEXT,
    VERSION_TEXT,
} from "../utils/config/styles";

import * as fs from "./../shared/fs";
import {WatchdripData} from "../utils/watchdrip/watchdrip-data";
import {getDataTypeConfig, img} from "../utils/helper";
import {gotoSubpage} from "../shared/navigate";
import {WatchdripConfig} from "../utils/watchdrip/config";
import {Path} from "../utils/path";

const logger = DeviceRuntimeCore.HmLogger.getLogger("watchdrip_app");

const {messageBuilder} = getApp()._options.globalData;
const {appId} = hmApp.packageInfo();

/*
typeof DebugText
*/
var debug = null;
/*
typeof Watchdrip
*/
var watchdrip = null;

const GoBackType = {NONE: 'none', GO_BACK: 'go_back', HIDE_PAGE: 'hide_page', HIDE: 'hide'};
const PagesType = {
    MAIN: 'main',
    UPDATE: 'update',
    UPDATE_LOCAL: 'update_local',
    HIDE: 'hide',
    CONFIG: 'config',
    ADD_TREATMENT: 'add_treatment'
};
const FetchMode = {DISPLAY: 'display', HIDDEN: 'hidden'};

class Watchdrip {
    constructor() {

        this.createWatchdripDir();
        this.timeSensor = hmSensor.createSensor(hmSensor.id.TIME);
        this.vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE);
        this.globalNS = getGlobal();
        this.goBackType = GoBackType.NONE;
        this.intervalWatchdog = null;
        this.system_alarm_id = null;
        this.lastInfoUpdate = 0;
        this.lastUpdateAttempt = null;
        this.lastUpdateSucessful = false;
        this.updatingData = false;
        this.intervalTimer = null;
        this.updateIntervals = DATA_UPDATE_INTERVAL_MS;
        this.fetchMode = FetchMode.DISPLAY;
        this.conf = new WatchdripConfig();
        debug.setEnabled(this.conf.settings.showLog);

        this.infoFile = new Path("full", WF_INFO_FILE);
    }

    start(data) {
        debug.log("start");
        debug.log(data);
        let pageTitle = '';
        this.goBackType = GoBackType.NONE;
        switch (data.page) {
            case PagesType.MAIN:
                let pkg = hmApp.packageInfo();
                pageTitle = pkg.name
                this.main_page();
                break;
            case PagesType.UPDATE:
                this.goBackType = GoBackType.HIDE;
                this.conf.alarmSettings = {...this.conf.alarmSettings, ...data.params};
                this.fetch_page();
                break;
            case PagesType.UPDATE_LOCAL:
                this.goBackType = GoBackType.HIDE;
                this.fetch_page_local();
                break;
            case PagesType.HIDE:
                this.hide_page();
                break;
            case PagesType.CONFIG:
                pageTitle = getText("settings");
                this.config_page();
                break;
            case PagesType.ADD_TREATMENT:
                pageTitle = getText("add_treatment");
                this.add_treatment_page()
                break;
        }

        if (pageTitle) {
            if (DEVICE_TYPE === "round") {
                this.titleTextWidget = hmUI.createWidget(hmUI.widget.TEXT, {...TITLE_TEXT, text: pageTitle})
            } else {
                hmUI.updateStatusBarTitle(pageTitle);
            }
        }
    }


    main_page() {
        hmSetting.setBrightScreen(60);
        hmApp.setScreenKeep(true);
        this.watchdripData = new WatchdripData(this.timeSensor);
        let pkg = hmApp.packageInfo();
        this.versionTextWidget = hmUI.createWidget(hmUI.widget.TEXT, {...VERSION_TEXT, text: "v" + pkg.version});
        this.messageTextWidget = hmUI.createWidget(hmUI.widget.TEXT, {...MESSAGE_TEXT, text: ""});
        this.bgValTextWidget = hmUI.createWidget(hmUI.widget.TEXT, BG_VALUE_TEXT);
        this.bgValTimeTextWidget = hmUI.createWidget(hmUI.widget.TEXT, BG_TIME_TEXT);
        this.bgDeltaTextWidget = hmUI.createWidget(hmUI.widget.TEXT, BG_DELTA_TEXT);
        this.bgTrendImageWidget = hmUI.createWidget(hmUI.widget.IMG, BG_TREND_IMAGE);
        this.bgStaleLine = hmUI.createWidget(hmUI.widget.FILL_RECT, BG_STALE_RECT);
        this.bgStaleLine.setProperty(hmUI.prop.VISIBLE, false);

        //for display tests
        // this.setMessageVisibility(false);
        // this.setBgElementsVisibility(true);
        // this.updateWidgets();
        // return;

        if (this.conf.settings.disableUpdates) {
            this.showMessage(getText("data_upd_disabled"));
        } else {
            if (this.readInfo()) {
                this.updateWidgets();
            }
            this.fetchInfo();
            this.startDataUpdates();
        }

        /*hmUI.createWidget(hmUI.widget.BUTTON, {
            ...COMMON_BUTTON_FETCH,
            click_func: (button_widget) => {
                this.fetchInfo();
            },
        });*/

        hmUI.createWidget(hmUI.widget.BUTTON, {
            ...COMMON_BUTTON_SETTINGS,
            click_func: (button_widget) => {
                gotoSubpage(PagesType.CONFIG);
            },
        });

        hmUI.createWidget(hmUI.widget.BUTTON, {
            ...COMMON_BUTTON_ADD_TREATMENT,
            click_func: (button_widget) => {
                gotoSubpage(PagesType.ADD_TREATMENT);
            },
        });
    }

    getConfigData() {
        let dataList = [];

        Object.entries(this.conf.settings).forEach(entry => {
            const [key, value] = entry;
            let stateImg = RADIO_OFF
            if (value) {
                stateImg = RADIO_ON
            }
            dataList.push({
                key: key,
                name: getText(key),
                state_src: img('icons/' + stateImg)
            });
        });
        this.configDataList = dataList;

        let dataTypeConfig = [
            getDataTypeConfig(1, 0, dataList.length)
        ]
        return {
            data_array: dataList,
            data_count: dataList.length,
            data_type_config: dataTypeConfig,
            data_type_config_count: dataTypeConfig.length
        }
    }

    add_treatment_page() {
        //not implemented
    }

    config_page() {
        hmUI.setLayerScrolling(false);

        this.configScrollList = hmUI.createWidget(hmUI.widget.SCROLL_LIST,
            {
                ...CONFIG_PAGE_SCROLL,
                item_click_func: (list, index) => {
                    debug.log(index);
                    const key = this.configDataList[index].key
                    let val = this.conf.settings[key]
                    this.conf.settings[key] = !val;
                    this.conf.settingsTime = this.timeSensor.utc; // upd settings time
                    //update list
                    this.configScrollList.setProperty(hmUI.prop.UPDATE_DATA, {
                        ...this.getConfigData(),
                        //Refresh the data and stay on the current page. If it is not set or set to 0, it will return to the top of the list.
                        on_page: 1
                    })
                },
                ...this.getConfigData()
            });
    }

    startDataUpdates() {
        if (this.intervalTimer != null) return; //already started
        debug.log("startDataUpdates");
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

    isTimeout(time, timeout_ms) {
        if (!time) {
            return false;
        }
        return this.timeSensor.utc - time > timeout_ms;
    }

    handleRareCases() {
        let fetch = false;
        if (this.lastUpdateAttempt == null) {
            debug.log("initial fetch");
            fetch = true;
        } else if (this.isTimeout(this.lastUpdateAttempt, DATA_STALE_TIME_MS)) {
            debug.log("the side app not responding, force update again");
            fetch = true;
        }
        if (fetch) {
            this.fetchInfo();
        }
    }

    checkUpdates() {
        //debug.log("checkUpdates");
        this.updateTimesWidget();
        if (this.updatingData) {
            //debug.log("updatingData, return");
            return;
        }
        let lastInfoUpdate = this.readLastUpdate();
        if (!lastInfoUpdate) {
            this.handleRareCases();
        } else {
            if (this.lastUpdateSucessful) {
                if (this.lastInfoUpdate !== lastInfoUpdate) {
                    //update widgets because the data was modified outside the current scope
                    debug.log("update from remote");
                    this.readInfo();
                    this.lastInfoUpdate = lastInfoUpdate;
                    this.updateWidgets();
                    return;
                }
                if (this.isTimeout(lastInfoUpdate, this.updateIntervals)) {
                    debug.log("reached updateIntervals");
                    this.fetchInfo();
                    return;
                }
                const bgTimeOlder = this.isTimeout(this.watchdripData.getBg().time, XDRIP_UPDATE_INTERVAL_MS);
                const statusNowOlder = this.isTimeout(this.watchdripData.getStatus().now, XDRIP_UPDATE_INTERVAL_MS);
                if (bgTimeOlder || statusNowOlder) {
                    if (!this.isTimeout(this.lastUpdateAttempt, DATA_STALE_TIME_MS)) {
                        debug.log("wait DATA_STALE_TIME");
                        return;
                    }
                    debug.log("data older than sensor update interval");
                    this.fetchInfo();
                    return;
                }
                //data not modified from outside scope so nothing to do
                debug.log("data not modified");
            } else {
                this.handleRareCases();
            }
        }
    }

    fetch_page() {
        debug.log("fetch_page");
        hmUI.setStatusBarVisible(false);
        this.prepareNextAlarm();
        if (this.conf.settings.disableUpdates || !this.conf.settings.useAppFetch) {
            this.handleGoBack();
            return;
        }
        hmSetting.setBrightScreen(999);
        this.progressWidget = hmUI.createWidget(hmUI.widget.IMG, IMG_LOADING_PROGRESS);
        this.progressAngle = 0;
        this.stopLoader();
        this.fetchMode = FetchMode.HIDDEN;
        this.fetchInfo(this.conf.alarmSettings.fetchParams);
    }

    fetch_page_local() {
        debug.log("fetch_page");
        hmUI.setStatusBarVisible(false);
        this.progressWidget = hmUI.createWidget(hmUI.widget.IMG, IMG_LOADING_PROGRESS);
        this.progressAngle = 0;
        this.stopLoader();
        this.fetchMode = FetchMode.HIDDEN;
        this.fetchInfo(this.conf.alarmSettings.fetchParams);
    }

    hide_page() {
        hmApp.gotoHome();
    }

    fetchInfo(params = '') {
        debug.log("fetchInfo");
        let isDisplay = true;
        if (this.fetchMode === FetchMode.HIDDEN) {
            isDisplay = false;
        }

        this.resetLastUpdate();

        if (messageBuilder.connectStatus() === false) {
            debug.log("No BT Connection");
            if (isDisplay) {
                this.showMessage(getText("status_no_bt"));
            } else {
                this.handleGoBack();
            }
            return;
        }

        if (params === "") {
            params = WATCHDRIP_ALARM_SETTINGS_DEFAULTS.fetchParams;
        }

        if (isDisplay) {
            this.showMessage(getText("connecting"));
        } else {
            this.startLoader();
            if (this.intervalWatchdog === null) {
                this.intervalWatchdog = this.globalNS.setTimeout(() => {
                    this.stopLoader();
                    this.handleGoBack();
                }, 5000);
            }
        }
        this.updatingData = true;
        messageBuilder
            .request({
                method: Commands.getInfo,
                params: params,
            }, {timeout: 5000})
            .then((data) => {
                debug.log("received data");
                let {result: info = {}} = data;
                //debug.log(info);
                try {
                    if (info.error) {
                        debug.log("Error");
                        debug.log(info);
                        return;
                    }
                    let dataInfo = str2json(info);
                    this.lastInfoUpdate = this.saveInfo(info);
                    info = null;
                    if (isDisplay) {
                        this.watchdripData.setData(dataInfo);
                        this.watchdripData.updateTimeDiff();
                        dataInfo = null;

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
                this.updatingData = false;
                if (isDisplay && !this.lastUpdateSucessful) {
                    this.showMessage(getText("status_start_watchdrip"));
                }
                if (!isDisplay) {
                    this.stopLoader();
                    this.handleGoBack();
                }
            });
    }

    startLoader() {
        this.progressWidget.setProperty(hmUI.prop.VISIBLE, true);
        this.progressWidget.setProperty(hmUI.prop.MORE, {angle: this.progressAngle});
        this.progressTimer = this.globalNS.setInterval(() => {
            this.updateLoader();
        }, PROGRESS_UPDATE_INTERVAL_MS);
    }

    updateLoader() {
        this.progressAngle = this.progressAngle + PROGRESS_ANGLE_INC;
        if (this.progressAngle >= 360) this.progressAngle = 0;
        this.progressWidget.setProperty(hmUI.prop.MORE, {angle: this.progressAngle});
    }

    stopLoader() {
        if (this.progressTimer !== null) {
            this.globalNS.clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
        this.progressWidget.setProperty(hmUI.prop.VISIBLE, false);
    }

    updateWidgets() {
        debug.log('updateWidgets');
        this.setMessageVisibility(false);
        this.setBgElementsVisibility(true);
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

    showMessage(text) {
        this.setBgElementsVisibility(false);
        //use for autowrap
        //
        // let lay = hmUI.getTextLayout(text, {
        //     text_size: MESSAGE_TEXT_SIZE,
        //     text_width: MESSAGE_TEXT_WIDTH,
        //     wrapped: 1
        // });
        // debug.log(lay);
        this.messageTextWidget.setProperty(hmUI.prop.MORE, {text: text});
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
        this.messageTextWidget.setProperty(hmUI.prop.VISIBLE, visibility);
    }

    readInfo() {
        let data = this.infoFile.fetchJSON();
        if (data) {
            debug.log("data was read");
            this.watchdripData.setData(data);
            this.watchdripData.timeDiff = 0;
            data = null;
            return true
        }
        return false;
    }

    readLastUpdate() {
        debug.log("readLastUpdate");
        this.conf.read();
        this.lastUpdateAttempt = this.conf.infoLastUpdAttempt;
        this.lastUpdateSucessful = this.conf.infoLastUpdSucess;

        return this.conf.infoLastUpd;
    }

    resetLastUpdate() {
        debug.log("resetLastUpdate");
        this.lastUpdateAttempt = this.timeSensor.utc;
        this.lastUpdateSucessful = false;
        this.conf.infoLastUpdAttempt = this.lastUpdateAttempt
        this.conf.infoLastUpdSucess = this.lastUpdateSucessful;
    }

    createWatchdripDir() {
        let systemInfo;
        try { //create dir for old firmwares
            systemInfo = hmSetting.getSystemInfo();
        } catch (e) {
            systemInfo.osVersion = 1;
        }
        if (Number(systemInfo.osVersion) < 3) {
            let dir = new Path("full", WF_DIR);
            if (!dir.exists()) {
                dir.mkdir();
            }
        }
    }

    saveInfo(info) {
        debug.log("saveInfo");
        this.infoFile.overrideWithText(info);
        this.lastUpdateSucessful = true;
        let time = this.timeSensor.utc;
        this.conf.infoLastUpd = time
        this.conf.infoLastUpdSucess = this.lastUpdateSucessful;
        return time;
    }

    saveAlarmId(alarm_id) {
        debug.log("saveAlarmId");
        this.conf.alarm_id = alarm_id;
    }

    disableCurrentAlarm() {
        debug.log("disableCurrentAlarm");
        const alarm_id = this.conf.alarm_id; //read saved alarm to disable
        if (alarm_id && alarm_id !== -1) {
            debug.log("stop old app alarm");
            hmApp.alarmCancel(alarm_id);
            this.saveAlarmId('-1');
        }
    }

    prepareNextAlarm() {
        this.disableCurrentAlarm();
        if (this.conf.settings.disableUpdates || !this.conf.settings.useAppFetch) {
            if (this.system_alarm_id !== null) {
                hmApp.alarmCancel(this.system_alarm_id);
            }
            return;
        }
        debug.log("Next alarm in " + this.conf.alarmSettings.fetchInterval + "s");
        if (this.system_alarm_id == null) {
            this.system_alarm_id = hmApp.alarmNew({
                appid: appId,
                url: "page/index",
                param: PagesType.UPDATE_LOCAL,
                delay: this.conf.alarmSettings.fetchInterval,
            });
            this.saveAlarmId(this.system_alarm_id);
        }
    }

    handleGoBack() {
        switch (this.goBackType) {
            case GoBackType.NONE:
                break;
            case GoBackType.GO_BACK:
                hmApp.goBack();
                break;
            case GoBackType.HIDE:
                this.hide_page();
                break;
            case GoBackType.HIDE_PAGE:
                gotoSubpage(PagesType.HIDE);
                break;
        }
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
                let filePath = fs.fullPath(fileName);
                debug.log(filePath);
                let file = fs.getSelfPath() + "/assets";
                const [fileNameArr, err] = hmFS.readdir(file);
                debug.log(file);
                debug.log(fileNameArr);

                const hex = Buffer.from(result, "base64");

                fs.writeRawFileSync(filePath, hex);
                var res = fs.statSync(filePath);
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
        //this.disableCurrentAlarm(); //do not stop alarm on destroy
        this.conf.save();
        this.stopDataUpdates();
        this.vibrate.stop();
        hmSetting.setBrightScreenCancel();
    }
}

Page({
    onInit(p) {
        try {
            debug = new DebugText();
            debug.setLines(20);
            console.log("page onInit");
            let data = {page: PagesType.MAIN};
            try {
                if (!(!p || p === 'undefined')) {
                    data = JSON.parse(p);
                }
            } catch (e) {
                data = {page: p}
            }

            watchdrip = new Watchdrip()
            watchdrip.start(data);
        } catch (e) {
            debug.log('LifeCycle Error ' + e)
            e && e.stack && e.stack.split(/\n/).forEach((i) => debug.log('error stack:' + i))
        }
    },
    build() {
        logger.debug("page build invoked");
    },
    onDestroy() {
        logger.debug("page onDestroy invoked");
        watchdrip.onDestroy();
    },
});
