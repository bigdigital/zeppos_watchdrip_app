import {log} from "@zos/utils";
import * as appServiceMgr from "@zos/app-service";
import {Time} from "@zos/sensor";
import {FETCH_SERVICE_ACTION} from "../shared/navigate";
import {Commands} from "../utils/config/constants";
import {str2json} from "../shared/data";

import {connectStatus} from '@zos/ble'
import {LocalInfoStorage} from "../utils/watchdrip/localInfoStorage";

const logger = log.getLogger("fetch.service");

/*
typeof WatchdripService
*/
let service = null;

const {messaging} = getApp()._options.globalData;

class WatchdripService {
    constructor() {
        this.storage = new LocalInfoStorage()
        this.storage.read();
        this.timeSensor = new Time();
    }

    init(data) {
        logger.log("service init");
        logger.log(data);
        switch (data.action) {
            case FETCH_SERVICE_ACTION.START_SERVICE:
                fetchInfo();
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

        //this.resetLastUpdate();

        if (connectStatus() === false) {
            logger.log("No BT Connection");

            return;
        }
        let params = ''
        messaging
            .request({
                method: Commands.getInfo,
                params: params,
            }, {timeout: 5000})
            .then((data) => {
                logger.log("received data");
                let {result: info = {}} = data;
                logger.log(info);
                try {
                    if (info.error) {
                        logger.log("Error");
                        logger.log(info);
                        return;
                    }
                    let dataInfo = str2json(info);
                    logger.log(dataInfo);
                    info = null;

                } catch (e) {
                    logger.log("error:" + e);
                }
            })
            .catch((error) => {
                logger.log("fetch error:" + error);
            })
            .finally(() => {

            });
    }

    onDestroy() {
        this.storage.save();
    }
}

AppService({
    onEvent(p) {
        logger.log(`service onEvent(${p})`);
    },
    onInit(p) {
        logger.log(`service onInit(${p})`);
        let data = {action: FETCH_SERVICE_ACTION.STOP_SERVICE};
        try {
            if (!(!p || p === 'undefined')) {
                data = JSON.parse(p);
            }
        } catch (e) {
            data = {action: p}
        }
        service = new WatchdripService()
        service.init(data);
    },
    onDestroy() {
        logger.log("service on destroy invoke");
        service.onDestroy();
    },
});