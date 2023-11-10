import {log} from "@zos/utils";
import * as appServiceMgr from "@zos/app-service";
import {Time} from "@zos/sensor";
import {Commands, FETCH_SERVICE_ACTION} from "../utils/config/constants";

import {connectStatus} from '@zos/ble'
import {LOCAL_STORAGE, LocalInfoStorage} from "../utils/watchdrip/localInfoStorage";
import {createDeviceMessage} from "../core/device/device-message";
import * as alarmMgr from '@zos/alarm'
import {getPackageInfo} from "@zos/app";
import {SERVICE_NAME, WF_INFO_FILE} from "../utils/config/global-constants";
import {Path} from "../utils/path";
import {zeroPad} from "../shared/date";
import {str2json} from "../shared/data";

const logger = log.getLogger("fetch-service");

/*
typeof WatchdripService
*/
let service = null;

let {messaging, localStorage} = getApp()._options.globalData;

class WatchdripService {
    constructor() {
        getPackageInfo().appId

        this.storage = new LocalInfoStorage(localStorage)
        this.timeSensor = new Time();
        this.connectionActive = false;
        this.infoFile = new Path("full", WF_INFO_FILE);
        this.updatingData = false;
        this.dateTime = new Date();
    }

    initConnection() {
        if (this.connectionActive) {
            return;
        }
        logger.log("initConnection");
        this.connectionActive = true;

        //we need to recreate connection to force start side app
        this.dropConnection();
        messaging = createDeviceMessage();
        messaging.connect();
    }

    dropConnection() {
        if (!this.connectionActive) {
            return;
        }
        logger.log("dropConnection");
        messaging.disConnect();
        this.connectionActive = false;
    }

    init(data) {
        switch (data.action) {
            case FETCH_SERVICE_ACTION.START_SERVICE:
                this.prepare();
                this.fetchInfo();
                break;
            case FETCH_SERVICE_ACTION.UPDATE:
                this.fetchInfo();
                break;
            case FETCH_SERVICE_ACTION.STOP_SERVICE:
                this.stopService();
                break;
        }
    }

    prepare() {
        logger.log("prepare");
        if (this.storage.settings.useBGService) {
            this.timeSensor.onPerMinute(() => {
                logger.log("onPerMinute");
                this.fetchInfo();
            });
        } else {
            if (!this.storage.info.alarmId) {
                let param = JSON.stringify({
                    action: FETCH_SERVICE_ACTION.UPDATE
                });
                const option = {
                    url: SERVICE_NAME,
                    param: param,
                    store: true,
                    delay: 0,
                    repeat_type: alarmMgr.REPEAT_MINUTE,
                    repeat_period: 1,
                    repeat_duration: 1,
                }
                this.storage.info.alarmId = alarmMgr.set(option);

                if (this.storage.info.alarmId) {
                    this.save();
                    logger.log(`runAlarm id ${this.storage.info.alarmId}`);
                } else {
                    logger.log('!!!cannot create ALARM');
                }
            } else {
                logger.log(`alarmAlreadyActive id ${this.storage.info.alarmId}`);
            }
        }
    }


    getTime() {
        return (
            zeroPad(this.timeSensor.getHours()) +
            ":" +
            zeroPad(this.timeSensor.getMinutes()) +
            ":" +
            zeroPad(this.timeSensor.getSeconds()) +
            "." +
            zeroPad(this.timeSensor.getTime() % 1000, 4)
        );
    }

    fetchInfo() {
        logger.log("fetchInfo "+ this.getTime());
        if (this.updatingData) {
            logger.log("updatingData, return");
            return;
        }

        this.resetLastUpdate();

        if (!connectStatus()) {
            logger.log("No BT Connection");

            return;
        }
        this.initConnection();
        this.updatingData = true;
        let params = '';
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
                    //let dataInfo = str2json(info);
                    this.saveInfo(info);
                    info = null;
                } catch (e) {
                    logger.log("error:" + e);
                }
            })
            .catch((error) => {
                logger.log("fetch error:" + error);
            })
            .finally(() => {
                this.save();
                this.updatingData = false;
                this.dropConnection();
            });
    }

    resetLastUpdate() {
        logger.log("resetLastUpdate");
        this.storage.info.lastUpdAttempt = this.dateTime.getTime();
        this.storage.info.lastUpdSuccess = false;
    }

    saveInfo(info) {
        logger.log("saveInfo");

        this.storage.info.lastUpd = this.dateTime.getTime();
        let dataInfo = str2json(info);
        dataInfo.status.fetch = this.storage.info.lastUpd;
        this.infoFile.overrideWithJSON(info);
        this.storage.info.lastUpdSuccess = true;
    }

    stopService() {
        logger.log(`stopService`);
        if (this.storage.info.alarmId) {
            logger.log(`remove alarm id ${this.storage.info.alarmId})`);
            if (!alarmMgr.cancel(this.storage.info.alarmId)) {
                logger.log(`service onEvent(${p})`);
                this.storage.info.alarmId = 0;
                this.save();
            }
        }
        appServiceMgr.exit();
    }

    onDestroy() {
        this.dropConnection();
        if ( !this.storage.info.lastUpdSuccess) {
            logger.log(`FAIL UPDATE`);
        }
    }

    save(){
        this.storage.saveItem(LOCAL_STORAGE.INFO);
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