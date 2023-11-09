import {DebugText} from "../shared/debug";
import {gettext as getText} from "i18n";
import {SERVICE_NAME, WF_DIR} from "../utils/config/global-constants";
import * as style from "../utils/config/styles";
import {Path} from "../utils/path";
import {log} from "@zos/utils";
import * as appService from "@zos/app-service";
import {getPackageInfo, queryPermission, requestPermission} from "@zos/app";

import {Time} from "@zos/sensor";
import * as hmUI from "@zos/ui";
import {GoBackType} from "../shared/navigate";
import {WatchdripConfig} from "../utils/watchdrip/config";
import {FETCH_SERVICE_ACTION, QUERY_PERMISSION_STATUS} from "../utils/config/constants";

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


class Watchdrip {
    constructor() {
        this.createWatchdripDir();
        this.widgets = {};
        this.timeSensor = new Time();
        this.serviceRunning = false;
        this.conf = new WatchdripConfig();
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
            case PagesType.CONFIG:
                pageTitle = getText("settings");
                //this.config_page();
                break;
            case PagesType.ADD_TREATMENT:
                pageTitle = getText("add_treatment");
                this.add_treatment_page()
                break;
        }

        if (pageTitle) {
            if (DEVICE_TYPE === "round") {
                this.widgets.titleText = hmUI.createWidget(hmUI.widget.TEXT, {...style.TITLE_TEXT, text: pageTitle})
            } else {
                hmUI.updateStatusBarTitle(pageTitle);
            }
        }
    }

    main_page() {
        this.initFetchService();

        let pkg = getPackageInfo();
        this.widgets.versionText = hmUI.createWidget(hmUI.widget.TEXT, {...style.VERSION_TEXT, text: "v" + pkg.version});
    }

    add_treatment_page() {
        //not implemented
    }

    initFetchService() {
        let services = appService.getAllAppServices();
        this.serviceRunning = services.includes(SERVICE_NAME);
        logger.log("service status %s", this.serviceRunning);

        if (!this.serviceRunning) this.permissionRequest();
    }

    permissionRequest() {
        // Start time report service
        const permissions = ["device:os.bg_service"];


        const [result] = queryPermission({permissions:permissions});
        debug.log('callback perm1');
        debug.log(result);
        if (result === 0) {
            debug.log('requestPermission');
            requestPermission({
                permissions: permissions,
                function: (result) =>{
                    debug.log('callback perm2');
                    debug.log(result);
                    if (result === 2) {
                        this.startFetchService();
                    }
                },
            });
        } else if (result === 2) {
            this.startFetchService();
        }
    }

    startFetchService() {
        logger.log(`=== start service: ${SERVICE_NAME} ===`);
        const result = appService.start({
            url: SERVICE_NAME,
            param: JSON.stringify({
                action: FETCH_SERVICE_ACTION.START_SERVICE
            }),
            complete_func: (info) => {
                logger.log(`startService result: ` + JSON.stringify(info));
                if (info.result) {
                    this.serviceRunning = true;
                    hmUI.showToast({text: `Service started`});
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

    onDestroy() {
        this.conf.save();
    }
}

Page( {
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
