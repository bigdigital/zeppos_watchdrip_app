import {log} from "@zos/utils";
import * as appServiceMgr from "@zos/app-service";
import {Time} from "@zos/sensor";
import {Commands, FETCH_SERVICE_ACTION} from "../utils/config/constants";
import {str2json} from "../shared/data";

import {connectStatus} from '@zos/ble'
import {LocalInfoStorage} from "../utils/watchdrip/localInfoStorage";
// import {createDeviceMessage} from "../core/device/device-message";
// import {MessageBuilder} from "../shared/message";
// import {getPackageInfo} from "../core/common/common";
// import {wrapperMessage} from "../core/common/message";
// import {WATCHDRIP_APP_ID} from "../utils/config/global-constants";
// import {BasePage} from "../core/device/base-page";

const logger = log.getLogger("fetch-service");

/*
typeof WatchdripService
*/
let service = null;

let {messaging, localStorage} = getApp()._options.globalData;

class WatchdripService {
    constructor() {
        this.storage = new LocalInfoStorage(localStorage)
        this.storage.read();
        this.timeSensor = new Time();
        this.connectionActive = false;

        this.timeSensor.onPerMinute(() => {

            this.fetchInfo();

        });
    }


    initConnection() {
        if (this.connectionActive) {
            return;
        }
        logger.log("initConnection");
        this.connectionActive = true;

        //we need to recreate connection to force start side app
      //  messaging.disConnect();
       // messaging = createDeviceMessage();
       // messaging.connect();
    }

    dropConnection() {
        if (!this.connectionActive) {
            return;
        }
        logger.log("dropConnection");
     //   messaging.disConnect();
        this.connectionActive = false;
    }

    init(data) {
        logger.log("service init");
        logger.log(data.action);
        switch (data.action) {
            case FETCH_SERVICE_ACTION.START_SERVICE:
                this.fetchInfo();
                break;
            case FETCH_SERVICE_ACTION.UPDATE:
                break;
            case FETCH_SERVICE_ACTION.STOP_SERVICE:
                appServiceMgr.exit();
                break;
        }
    }

    fetchInfo() {
        logger.log("fetchInfo");
        logger.log(
            `time: ${this.timeSensor.getHours()}:${this.timeSensor.getMinutes()}:${this.timeSensor.getSeconds()}`
        );
        //this.resetLastUpdate();

        if (!connectStatus()) {
            logger.log("No BT Connection");

            return;
        }
        this.initConnection();


        let params = ''
        console.log('do request');
        messaging.request({
                method: Commands.getInfo,
                params: params,
            }, {timeout: 5000})
            .then((data) => {
                logger.log("received data");
                let {result: info = {}} = data;
                //logger.log(info);
                try {
                    if (info.error) {
                        logger.log("Error");
                        logger.log(info);
                        return;
                    }
                    let dataInfo = str2json(info);
                    logger.log(info);
                    info = null;

                } catch (e) {
                    logger.log("error:" + e);
                }
            })
            .catch((error) => {
                logger.log("fetch error:" + error);
            })
            .finally(() => {
                //this.dropConnection();
            });
    }

    onDestroy() {
        this.dropConnection();
        this.storage.save();
    }
}

AppService({
    onEvent(p) {
        logger.log(`service onEvent(${p})`);
    },
    onInit(p) {
        try {
            logger.log(`service onInit(${p})`);
            let data = {action: FETCH_SERVICE_ACTION.START_SERVICE};
            try {
                if (!(!p || p === 'undefined')) {
                    data = JSON.parse(p);
                }
            } catch (e) {
                data = {action: p}
            }
            service = new WatchdripService()
            service.init(data);
        } catch (e) {
            logger.log('LifeCycle Error ' + e)
            e && e.stack && e.stack.split(/\n/).forEach((i) => logger.log('error stack:' + i))
        }
    },
    onDestroy() {
        logger.log("service on destroy invoke");
        service.onDestroy();
    }
});