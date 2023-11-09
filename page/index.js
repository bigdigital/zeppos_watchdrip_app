import {json2str, str2json} from "../shared/data";
import {DebugText} from "../shared/debug";
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
    SERVICE_NAME,
    WF_DIR,
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

import {WatchdripData} from "../utils/watchdrip/watchdrip-data";
import {getDataTypeConfig, img} from "../utils/helper";
import * as nav from "../shared/navigate";
import {WatchdripConfig} from "../utils/watchdrip/config";
import {Path} from "../utils/path";
import { log } from "@zos/utils";
import { setAutoBrightness } from '@zos/display'
import { BasePage } from "@zeppos/zml/base-page";
import { connectStatus } from '@zos/ble'
import * as appService from "@zos/app-service";
import { queryPermission, requestPermission, getPackageInfo } from "@zos/app";

import { Time } from "@zos/sensor";

const logger = log.getLogger("watchdrip_app");


import * as hmUI from "@zos/ui";

/*
typeof DebugText
*/
 var debug = null;
/*
typeof Watchdrip
*/
var watchdrip = null;


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
        this.timeSensor = new Time();
        this.serviceRunning = false;
        this.conf = new WatchdripConfig(debug);
    }

    start(data) {
        debug.log("start");
        debug.log(data);
        let pageTitle = '';
        this.goBackType = GoBackType.NONE;
        switch (data.page) {
            case PagesType.MAIN:
                let pkg = getPackageInfo();
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
                this.fetch_page();
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

    add_treatment_page() {
        //not implemented
    }

    initFetchService(){
        let services = appService.getAllAppServices();
        this.serviceRunning  = services.includes(SERVICE_NAME);
        logger.log("service status %s",  this.serviceRunning);

        if (!this.serviceRunning)  this.permissionRequest();
    }

    permissionRequest() {
        // Start time report service
        const permissions = ["device:os.bg_service"];


        const [result] = queryPermission({
            permissions,
        });

        if (result === 0) {
            requestPermission({
                permissions,
                callback([result2]) {
                    if (result2 === 2) {
                        startTimeService();
                    }
                },
            });
        } else if (result === 2) {
            startTimeService();
        }
    }

    startTimeService() {
        logger.log(`=== start service: ${SERVICE_NAME} ===`);
        const result = appService.start({
            url: SERVICE_NAME,
            param: JSON.stringify({
                    action: FETCH_SERVICE_ACTION.START
                }),
            complete_func: (info) => {
                logger.log(`startService result: ` + JSON.stringify(info));
                if (info.result) {
                    this.serviceRunning = true;
                    hmUI.showToast({ text: `Service started` });
                }
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

    fetchInfo() {
        debug.log("fetchInfo");

        //this.resetLastUpdate();

        if (connectStatus() === false) {
            debug.log("No BT Connection");

            return;
        }
        let params = ''
        messaging
            .request({
                method: Commands.getInfo,
                params: params,
            }, {timeout: 5000})
            .then((data) => {
                debug.log("received data");
                let {result: info = {}} = data;
                debug.log(info);
                try {
                    if (info.error) {
                        debug.log("Error");
                        debug.log(info);
                        return;
                    }
                    let dataInfo = str2json(info);
                    info = null;

                } catch (e) {
                    debug.log("error:" + e);
                }
            })
            .catch((error) => {
                debug.log("fetch error:" + error);
            })
            .finally(() => {

            });
    }

    onDestroy() {
        this.conf.save();
    }
}


Page(BasePage({
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
}));
