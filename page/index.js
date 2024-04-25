import {DebugText} from "../shared/debug";
import {getText} from '@zos/i18n'
import {
    FETCH_SERVICE_NAME,
    WATCHDRIP_INFO_DEFAULTS,
    WATCHDRIP_SETTINGS_DEFAULTS, WF_CONFIG_FILE,
    WF_DIR,
    WF_INFO_FILE, WF_STATUS_FILE
} from "../utils/config/global-constants";
import * as style from "../utils/config/styles";
import {Path} from "../utils/path";
import {log} from "@zos/utils";
import * as appServiceMgr from "@zos/app-service";
import * as alarmMgr from "@zos/alarm";
import {emitCustomSystemEvent, getPackageInfo, queryPermission, requestPermission} from "@zos/app";

import * as dispMgr from '@zos/display'

import * as nav from "../shared/navigate";
import * as hmUI from "@zos/ui";
import {
    Colors,
    DATA_TIMER_UPDATE_INTERVAL_MS,
    DATA_UPDATE_INTERVAL_MS,
    FETCH_SERVICE_ACTION,
    PagesType
} from "../utils/config/constants";
import {WatchdripData} from "../utils/watchdrip/watchdrip-data";

import {getDataTypeConfig, getTimestamp, img} from "../utils/helper";
import {InfoStorage} from "../utils/watchdrip/infoStorage";

const logger = log.getLogger("watchdrip_app");

/*
typeof DebugText
*/
let debug = null;
/*
typeof Watchdrip
*/
let watchdrip = null;

class Watchdrip {
    constructor() {
        this.createWatchdripDir();
        this.widgets = {};
        this.serviceRunning = false;
        this.intervalTimer = null;
        this.updateIntervals = DATA_UPDATE_INTERVAL_MS;
        this.lastInfoUpdate = 0;

        this.configStorage = new InfoStorage(
            new Path("full", WF_CONFIG_FILE),
            WATCHDRIP_SETTINGS_DEFAULTS
        );

        this.statusStorage = new InfoStorage(
            new Path("full", WF_STATUS_FILE),
            WATCHDRIP_INFO_DEFAULTS
        );
        debug.setEnabled(this.configStorage.data.s_showLog);
        //debug.log(config.data);
        //debug.log(info.data);
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

        if (this.configStorage.data.s_disableUpdates) {
            this.showMessage(getText("data_upd_disabled"));
        } else {
            this.showMessage(getText("connecting"));
            this.startDataUpdates();
        }
    }

    config_page() {
        this.configScrollList = hmUI.createWidget(hmUI.widget.SCROLL_LIST,
            {
                ...style.CONFIG_PAGE_SCROLL,
                item_click_func: (list, index) => {
                    debug.log(index);
                    const key = this.configDataList[index].key
                    let val = this.configStorage.data[key]
                    this.configStorage.data[key] = !val;
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
        // debug.log(data)
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
        let _self = this;
        this.intervalTimer = setInterval(() => {
            _self.checkUpdates();
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
        this.statusStorage.read();
    }

    checkUpdates() {
        debug.log("checkUpdates");
        this.tryToStartServiceAfterPermission();
        this.updateTimesWidget();
        this.readLastUpdate();

        if (this.statusStorage.data.lastError) {
            this.showMessage(getText(this.statusStorage.data.lastError));
        }
        if (this.statusStorage.data.lastUpdSuccess) {
            if (this.lastInfoUpdate !== this.statusStorage.data.lastUpd) {
                //update widgets because the data was modified
                debug.log("update from remote");
                this.readInfo();
                this.lastInfoUpdate = this.statusStorage.data.lastUpd;
                this.updateWidgets();
            }
        }
    }

    fetchInfo(params = '') {
        debug.log("fetchInfo");
        this.emitEvent(FETCH_SERVICE_ACTION.UPDATE);
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

        Object.entries(this.configStorage.data).forEach(entry => {
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
        let serviceRunning = this.isServiceRunning();
        if (this.configStorage.data.s_disableUpdates) {
            if (serviceRunning) {
                this.emitEvent(FETCH_SERVICE_ACTION.STOP);
            }
            return;
        }
        if (serviceRunning){
            this.emitEvent(FETCH_SERVICE_ACTION.UPDATE);
        }
        else {
            this.permissionRequest();
        }
    }

    tryToStartServiceAfterPermission(){
        let serviceRunning = this.isServiceRunning();
        if (!this.configStorage.data.s_disableUpdates && !serviceRunning) {
            const permissions = ["device:os.bg_service"];
            let [result] = queryPermission({permissions: permissions});

            if (result === 0) {
                this.showMessage(`Service could not be started, activate manually`)
            } if (result === 2) {
                this.fetchServiceStart();
                this.showMessage(getText("connecting"));
            }
        }
    }

    isServiceRunning() {
        let services = appServiceMgr.getAllAppServices();
        return services.includes(FETCH_SERVICE_NAME);
    }

    getAlarmId() {
        let alarms = alarmMgr.getAllAlarms();
        if (alarms.length) {
            debug.log("getAlarmId " + alarms[0]);
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
           let _self = this;
            requestPermission({
                permissions,
                callback([result]){
                    debug.log('callback ret: ' + result);
                    if (result === 2) {
                        _self.fetchServiceStart();
                    } else {
                        _self.showMessage(`Service could not be started, activate manually`)
                    }
                },
            });
        } else if (result === 2) {
            this.fetchServiceStart();
        }
    }

    fetchServiceStart() {
        logger.log(`=== start service: ${FETCH_SERVICE_NAME} ===`);
        const result = appServiceMgr.start({
            url: FETCH_SERVICE_NAME,
            param: JSON.stringify({
                action: FETCH_SERVICE_ACTION.START
            }),
            complete_func: (info) => {
                logger.log(`startService compl result: ` + JSON.stringify(info));
            },
        });

        if (result) {
            logger.log("startService result: ", result);
        }
    }

    createWatchdripDir() {
        let dir = new Path("full", WF_DIR);

        if (!dir.exists()) {
            dir.mkdir();
        }
    }

    emitEvent(action) {
        let obj = {
            eventName: 'event:customize.fetch',
            eventParam: JSON.stringify({
                action: action
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
                this.configStorage.save();
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
