import {DebugText} from "../shared/debug";
import {getText} from '@zos/i18n'
import {SERVICE_NAME, WF_DIR, WF_INFO_FILE} from "../utils/config/global-constants";
import * as style from "../utils/config/styles";
import {Path} from "../utils/path";
import {log} from "@zos/utils";
import * as appService from "@zos/app-service";
import * as alarmMgr from "@zos/alarm";
import {emitCustomSystemEvent, getPackageInfo, queryPermission, requestPermission} from "@zos/app";

import * as dispMgr from '@zos/display'

import * as nav from "../shared/navigate";
import * as hmUI from "@zos/ui";
import {
    Colors,
    DATA_STALE_TIME_MS,
    DATA_TIMER_UPDATE_INTERVAL_MS, DATA_UPDATE_INTERVAL_MS,
    FETCH_SERVICE_ACTION,
    XDRIP_UPDATE_INTERVAL_MS
} from "../utils/config/constants";
import {LOCAL_STORAGE, LocalInfoStorage} from "../utils/watchdrip/localInfoStorage";
import {WatchdripData} from "../utils/watchdrip/watchdrip-data";

import { setScrollLock } from '@zos/page'
import {getDataTypeConfig, getTimestamp, img} from "../utils/helper";

const logger = log.getLogger("watchdrip_app");

/*
typeof DebugText
*/
let debug = null;
/*
typeof Watchdrip
*/
let watchdrip = null;

const PagesType = {
    MAIN: 'main',
    CONFIG: 'config',
    ADD_TREATMENT: 'add_treatment'
};

let {localStorage} = getApp()._options.globalData;

class Watchdrip {
    constructor() {
        this.createWatchdripDir();
        this.widgets = {};
        this.serviceRunning = false;
        this.intervalTimer = null;
        this.updateIntervals = DATA_UPDATE_INTERVAL_MS;
        this.storage = new LocalInfoStorage(localStorage);
        debug.setEnabled(this.storage.settings.s_showLog);
        debug.log(this.storage);
    }

    start(data) {
        debug.log("start");
        debug.log(data);
        this.startData = data
        let pageTitle = '';
        //this.goBackType = nav.GoBackType.NONE;

        dispMgr.setWakeUpRelaunch({
            relaunch: true,
        })
        dispMgr.setPageBrightTime({
            brightTime: 60000,
        })

        switch (data.page) {
            case PagesType.MAIN:
                let pkg = getPackageInfo();
                pageTitle = pkg.name
                this.main_page();
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
            if (style.DEVICE_TYPE === "round") {
                this.widgets.titleText = hmUI.createWidget(hmUI.widget.TEXT, {...style.TITLE_TEXT, text: pageTitle})
            } else {
                hmUI.updateStatusBarTitle(pageTitle);
            }
        }
    }

    main_page() {
        this.initFetchService();
        this.infoFile = new Path("full", WF_INFO_FILE);
        this.watchdripData = new WatchdripData();
        let pkg = getPackageInfo();
        this.widgets.versionText = hmUI.createWidget(hmUI.widget.TEXT, {
            ...style.VERSION_TEXT,
            text: "v" + pkg.version
        });


        this.widgets.messageTextWidget = hmUI.createWidget(hmUI.widget.TEXT, {...style.MESSAGE_TEXT, text: ""});
        this.widgets.bgValTextWidget = hmUI.createWidget(hmUI.widget.TEXT, style.BG_VALUE_TEXT);
        this.widgets.bgValTimeTextWidget = hmUI.createWidget(hmUI.widget.TEXT, style.BG_TIME_TEXT);
        this.widgets.bgDeltaTextWidget = hmUI.createWidget(hmUI.widget.TEXT, style.BG_DELTA_TEXT);
        this.widgets.bgTrendImageWidget = hmUI.createWidget(hmUI.widget.IMG, style.BG_TREND_IMAGE);
        this.widgets.bgStaleLine = hmUI.createWidget(hmUI.widget.FILL_RECT, style.BG_STALE_RECT);
        this.widgets.bgStaleLine.setProperty(hmUI.prop.VISIBLE, false);

        hmUI.createWidget(hmUI.widget.BUTTON, {
            ...style.COMMON_BUTTON_SETTINGS,
            click_func: (button_widget) => {
                nav.gotoSubpage(PagesType.CONFIG);
            },
        });

        // hmUI.createWidget(hmUI.widget.BUTTON, {
        //     ...style.COMMON_BUTTON_ADD_TREATMENT,
        //     click_func: (button_widget) => {
        //         nav.gotoSubpage(PagesType.ADD_TREATMENT);
        //     },
        // });

        if (this.storage.settings.s_disableUpdates) {
            this.showMessage(getText("data_upd_disabled"));
        } else {
            this.showMessage(getText("connecting"));
            this.startDataUpdates();
        }
    }

    config_page() {
         setScrollLock({
             lock: true,
         })
        this.configScrollList = hmUI.createWidget(hmUI.widget.SCROLL_LIST,
            {
                ...style.CONFIG_PAGE_SCROLL,
                item_click_func: (list, index) => {
                    debug.log(index);
                    const key = this.configDataList[index].key
                    let val = this.storage.settings[key]
                    this.storage.settings[key] = !val;
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

        this.widgets.bgValTextWidget.setProperty(hmUI.prop.MORE, {
            text: bgObj.getBGVal(),
            color: bgValColor,
        });

        this.widgets.bgDeltaTextWidget.setProperty(hmUI.prop.MORE, {
            text: bgObj.delta + " " + this.watchdripData.getStatus().getUnitText()
        });

        //debug.log(bgObj.getArrowResource());
        this.widgets.bgTrendImageWidget.setProperty(hmUI.prop.SRC, bgObj.getArrowResource());
        this.widgets.bgStaleLine.setProperty(hmUI.prop.VISIBLE, this.watchdripData.isBgStale());
    }

    updateTimesWidget() {
        let bgObj = this.watchdripData.getBg();
        this.widgets.bgValTimeTextWidget.setProperty(hmUI.prop.MORE, {
            text: this.watchdripData.getTimeAgo(bgObj.time),
        });
    }

     startDataUpdates() {
         if (this.intervalTimer != null) return; //already started
         debug.log("startDataUpdates");
         this.intervalTimer = setInterval(() => {
             this.checkUpdates();
         }, DATA_TIMER_UPDATE_INTERVAL_MS);
     }


    stopDataUpdates() {
        if (this.intervalTimer !== null) {
            //debug.log("stopDataUpdates");
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
    }

    readLastUpdate() {
        debug.log("readLastUpdate");
        this.storage.readItem(LOCAL_STORAGE.INFO);
        this.lastUpdateAttempt = this.storage.info.lastUpdAttempt;
        this.lastUpdateSucessful = this.storage.info.lastUpdSuccess;

        return this.storage.info.lastUpd;
    }

    checkUpdates() {
        //debug.log("checkUpdates");
        this.updateTimesWidget();
        let lastInfoUpdate = this.readLastUpdate();

        if (this.storage.info.lastError){
            this.showMessage(getText(this.storage.info.lastError));
        }
        if (this.lastUpdateSucessful) {
            if (this.lastInfoUpdate !== lastInfoUpdate) {
                //update widgets because the data was modified
                debug.log("update from remote");
                this.readInfo();
                this.lastInfoUpdate = lastInfoUpdate;
                this.updateWidgets();
                return;
            }
        }
    }

    fetchInfo(params = '') {
        debug.log("fetchInfo");
        this.emitEvent(FETCH_SERVICE_ACTION.UPDATE);
    }


    isTimeout(time, timeout_ms) {
        if (!time) {
            return false;
        }
        return getTimestamp() - time > timeout_ms;
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
        this.widgets.messageTextWidget.setProperty(hmUI.prop.MORE, {text: text});
        this.setMessageVisibility(true);
    }

    setBgElementsVisibility(visibility) {
        this.widgets.bgValTextWidget.setProperty(hmUI.prop.VISIBLE, visibility);
        this.widgets.bgValTimeTextWidget.setProperty(hmUI.prop.VISIBLE, visibility);
        this.widgets.bgTrendImageWidget.setProperty(hmUI.prop.VISIBLE, visibility);
        this.widgets.bgStaleLine.setProperty(hmUI.prop.VISIBLE, visibility);
        this.widgets.bgDeltaTextWidget.setProperty(hmUI.prop.VISIBLE, visibility);
    }

    setMessageVisibility(visibility) {
        this.widgets.messageTextWidget.setProperty(hmUI.prop.VISIBLE, visibility);
    }

    getConfigData() {
        let dataList = [];

        Object.entries(this.storage.settings).forEach(entry => {
            const [key, value] = entry;
            let stateImg = style.RADIO_OFF
            if (value) {
                stateImg = style.RADIO_ON
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

    initFetchService() {
        this.serviceRunning = this.isServiceRunning();
        debug.log("service running " + this.serviceRunning);
        if (this.storage.settings.s_disableUpdates ){
            if (this.serviceRunning) {
                this.emitEvent(FETCH_SERVICE_ACTION.STOP_SERVICE);
            }
            return;
        }
        if (this.storage.settings.s_useBGService) {
            if (!this.serviceRunning) {
                this.permissionRequest();
            }
        } else {
            if (this.serviceRunning) {
                this.emitEvent(FETCH_SERVICE_ACTION.STOP_SERVICE);
            }
            if (!this.getAlarmId()) {
                this.emitEvent(FETCH_SERVICE_ACTION.START_SERVICE);
            }
        }
    }

    isServiceRunning(){
        let services = appService.getAllAppServices();
        return services.includes(SERVICE_NAME);
    }

    getAlarmId() {
        let alarms = alarmMgr.getAllAlarms();
        if (alarms.length) {
            return alarms[0];
        }
        return 0;
    }

    permissionRequest() {
        // Start time report service
        debug.log('permissionRequest');
        const permissions = ["device:os.bg_service"];

        let [result] = queryPermission({permissions: permissions});

        if (result === 0) {
            debug.log('requestPermission');
            requestPermission({
                permissions: permissions,
                callback:(result) =>{
                    debug.log('callback ret: ' + result);
                    if (result === 2) {
                        this.startFetchService();
                    } else {
                        hmUI.showToast({text: `Service could not be started, activate manually`});
                    }
                },
            });
        } else if (result === 2) {
            this.startFetchService();
        }
    }

    startFetchService() {
        debug.log(`=== start service: ${SERVICE_NAME} ===`);
        const result = appService.start({
            url: SERVICE_NAME,
            param: JSON.stringify({
                action: FETCH_SERVICE_ACTION.START_SERVICE
            }),
            complete_func: (info) => {
                debug.log(`startService result: ` + JSON.stringify(info));
                if (info.result) {
                    this.serviceRunning = true;
                    hmUI.showToast({text: `Service started`});
                }
            },
        });

        if (result) {
            debug.log("startService result: ", result);
        }
    }

    createWatchdripDir() {
        let dir = new Path("full", WF_DIR);

        if (!dir.exists()) {
            dir.mkdir();
        }
    }

    emitEvent(action, params = {}) {
        let obj = {
            eventName: 'event:customize.fetch',
            eventParam: JSON.stringify({
                action, ...params
            })
        }
        debug.log(`emitEvent ${obj.eventParam} `);
        emitCustomSystemEvent(obj)
    }

    onDestroy() {
        switch (this.startData.page) {
            case PagesType.MAIN:

                break;
            case PagesType.CONFIG:
                this.storage.saveItem(LOCAL_STORAGE.SETTINGS);
                break;
            case PagesType.ADD_TREATMENT:
                break;
        }
        this.stopDataUpdates();
        dispMgr.resetPageBrightTime();
    }
}

Page({
    onInit(p) {
        try {
            debug = new DebugText();
            debug.setLines(20);
            debug.setEnabled(true);
            debug.log("page onInit");
            let data = {page: PagesType.MAIN};
            try {
                if (!(!p || p === 'undefined')) {
                    data = JSON.parse(p);
                }
            } catch (e) {
                data = {page: p}
            }
            watchdrip = new Watchdrip();
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
    }
});
