import {log} from "@zos/utils";
import * as appServiceMgr from "@zos/app-service";
import {Time} from "@zos/sensor";
import {Commands, FETCH_SERVICE_ACTION} from "../utils/config/constants";

import {connectStatus} from '@zos/ble'
import {LOCAL_STORAGE, LocalInfoStorage} from "../utils/watchdrip/localInfoStorage";
import {createDeviceMessage} from "../core/device/device-message";
import * as alarmMgr from '@zos/alarm'
import {GRAPH_FETCH_PARAM, SERVICE_NAME, WF_INFO_FILE} from "../utils/config/global-constants";
import {Path} from "../utils/path";
import {zeroPad} from "../shared/date";
import {getTimestamp} from "../utils/helper";

const logger = log.getLogger("fetch-service");

/*
typeof WatchdripService
*/
let service = null;

let {messaging, localStorage} = getApp()._options.globalData;

class WatchdripService {
    constructor() {
        this.storage = new LocalInfoStorage(localStorage)
        this.timeSensor = new Time();
        this.connectionActive = false;
        this.infoFile = new Path("full", WF_INFO_FILE);
        this.updatingData = false;
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
        if (!this.connectionActive || !messaging) {
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
        if (this.storage.settings.s_useBGService) {
            this.timeSensor.onPerMinute(() => {
                logger.log("onPerMinute");
                this.fetchInfo();
            });
        } else {
            let alarmId = this.getAlarmId();
            if (!alarmId) {
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
                let newAlarmId = alarmMgr.set(option);

                if (newAlarmId) {
                    logger.log(`runAlarm id ${this.storage.info.alarmId}`);
                } else {
                    logger.log('!!!cannot create ALARM');
                }
            } else {
                logger.log(`alarmAlreadyActive id ${alarmId}`);
            }
        }
    }

    getAlarmId() {
        let alarms = alarmMgr.getAllAlarms();
        if (alarms.length) {
            return alarms[0];
        }
        return 0;
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
        //logger.log("fetchInfo " + this.getTime());
        if (this.updatingData) {
            logger.log("updatingData, return");
            return;
        }

        this.resetLastUpdate();

        if (!connectStatus()) {
            logger.log("No BT Connection");
            this.setError('status_no_bt');
            return;
        }
        this.initConnection();
        this.updatingData = true;
        let params = '';
        if (this.storage.settings.s_graphInfo) {
            params = GRAPH_FETCH_PARAM;
        }
        console.log('request');
        messaging.request({
            method: Commands.getInfo,
            params: params,
        }, {timeout: 3000})
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
                if (!this.storage.info.lastUpdSuccess) {
                    this.setError('status_start_watchdrip');
                } else {
                    this.resetError();
                }
            });
    }

    setError(error) {
        this.storage.info.lastError = error;
        this.save();
    }


    resetError() {
        if (this.storage.info.lastError) {
            this.setError('');
        }
    }

    resetLastUpdate() {
        //logger.log("resetLastUpdate");
        this.storage.info.lastUpdAttempt = getTimestamp();
        this.storage.info.lastUpdSuccess = false;
    }

    saveInfo(info) {
        logger.log("saveInfo");
        this.storage.info.lastUpd = getTimestamp();
        //let dataInfo = str2json(info);
        this.infoFile.overrideWithText(info);
        this.storage.info.lastUpdSuccess = true;
    }

    stopService() {
        logger.log(`stopService`);
        let alarmId = this.getAlarmId();
        if (alarmId) {
            logger.log(`remove alarm id ${alarmId})`);
            alarmMgr.cancel(alarmId);
        }
        appServiceMgr.exit();
    }

    onDestroy() {
        this.dropConnection();
        if (!this.storage.info.lastUpdSuccess) {
            logger.log(`FAIL UPDATE`);
        }
    }

    save() {
        this.storage.saveItem(LOCAL_STORAGE.INFO);
    }
}

function handle(p) {
    try {
        logger.log(`service onInit(${p})`);
        let data = {action: FETCH_SERVICE_ACTION.WRONG_ACTION};
        try {
            if (!(!p || p === 'undefined')) {
                data = JSON.parse(p);
            }
        } catch (e) {
            data = {action: p}
        }
        if (data.action === FETCH_SERVICE_ACTION.WRONG_ACTION) {
            logger.log('WRONG_ACTION');
            return;
        }
        service = new WatchdripService()
        service.init(data);
    } catch (e) {
        logger.log('LifeCycle Error ' + e)
        e && e.stack && e.stack.split(/\n/).forEach((i) => logger.log('error stack:' + i))
    }
}

AppService({
    onEvent(p) {
        logger.log(`service onEvent(${p})`);
        handle(p);
    },
    onInit(p) {
        handle(p);
    },
    onDestroy() {
        logger.log("service on destroy invoke");
        service.onDestroy();
    }
});