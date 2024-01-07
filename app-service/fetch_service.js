import {log} from "@zos/utils";
import * as appServiceMgr from "@zos/app-service";
import {Time} from "@zos/sensor";
import {Commands, FETCH_SERVICE_ACTION} from "../utils/config/constants";

import {connectStatus} from '@zos/ble'
import * as alarmMgr from '@zos/alarm'
import {GRAPH_FETCH_PARAM, SERVICE_NAME, WF_INFO_FILE} from "../utils/config/global-constants";
import {Path} from "../utils/path";
import {zeroPad} from "../shared/date";
import {getTimestamp, objToString} from "../utils/helper";
import {BaseApp} from "../core/zml-app.debug";

const logger = log.getLogger("fetch-service");


/*
typeof WatchdripService
*/
let service = null;

let {/**@type {InfoStorage} */ config,
    /** @type {InfoStorage} */ info
} = getApp()._options.globalData;

/** @type {MessageBuilder} */ let messaging;

let timeSensor = new Time();

class WatchdripService {
    constructor() {
        this.infoFile = new Path("full", WF_INFO_FILE);
        this.updatingData = false;

        this.baseApp = BaseApp({
            globalData: getApp()._options.globalData,
            sidePort: 0,
            onMessagingCreate() {
                messaging = this.globalData.messaging;
            }
        });
    }


    updateError() {
        if (info.data.lastUpdSuccess) {
            this.resetError();
        } else {
            this.setError('status_start_watchdrip');
        }
        this.delayExit();
    }

    // this.setRequestAlarm();
    // messaging.transport.ble.disConnect();
    // this.delayExit();


    //**workaround** add timeout to properly save storage data
    delayExit(timeout = 100) {
        setTimeout(() => {
            appServiceMgr.exit();
        }, timeout);
    }

    dropConnection() {
        logger.log("dropConnection");
        this.baseApp.onDestroy();
    }

    init(data) {
        logger.log(`init ${data.action}`);
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
                logger.log(`runAlarm id ${newAlarmId}`);
            } else {
                logger.log('!!!cannot create ALARM');
            }
        } else {
            logger.log(`alarmAlreadyActive id ${alarmId}`);
        }

        /*

                timeSensor.onPerMinute(() => {
                    logger.log("onPerMinute");
                    this.updatingData = false;
                    config.read();
                    this.fetchInfo();
                }); */
    }

    startFetchService() {
        logger.log(`=== start service: ${SERVICE_NAME} ===`);
        const result = appServiceMgr.start({
            url: SERVICE_NAME,
            param: JSON.stringify({
                action: FETCH_SERVICE_ACTION.START_SERVICE
            }),
            complete_func: (info) => {
                logger.log(`startService result: ` + JSON.stringify(info));
            },
        });

        if (result) {
            logger.log("startService result: ", result);
        }
    }

    setRequestAlarm() {
        logger.log(`setRequestAlarm`);
        let param = JSON.stringify({
            action: FETCH_SERVICE_ACTION.UPDATE
        });
        const option = {
            url: SERVICE_NAME,
            param: param,
            delay: 5
        }
        alarmMgr.set(option);
    }

    getAlarmId() {
        let alarms = alarmMgr.getAllAlarms();
        if (alarms.length) {
            return alarms[0];
        }
        return 0;
    }

    fetchInfo() {
        this.baseApp.onCreate();
        logger.log("fetchInfo");
        if (this.updatingData) {
            logger.log("updatingData, return");
            return;
        }

        this.resetLastUpdate();

        if (!connectStatus()) {
            logger.log("No BT Connection");
            this.setError('status_no_bt');
            this.save();
            return;
        }
        this.updatingData = true;
        console.log('fetchInfo');
        let params = '';
        if (config.data.s_graphInfo) {
            params = GRAPH_FETCH_PARAM;
        }
        messaging.request({
            method: Commands.getInfo,
            params: params,
        }, {timeout: 2000}).then(
            (data) => {
                let {result: info = {}} = data;
                logger.log(objToString(info));
                try {
                    if (info.error) {
                        logger.log("Error");
                        logger.log(info);
                        return;
                    }
                    this.saveInfo(info.result);
                } catch (e) {
                    logger.log("error:" + e);
                }

            })
            .catch((error) => {
                logger.log("fetch error:" + error);
            })
            .finally(() => {
                this.updatingData = false;
                this.updateError();
                this.dropConnection();
        });
    }


    setError(error) {
        info.data.lastError = error;
        //this.save();
    }

    resetError() {
        if (info.data.lastError) {
            this.setError('');
        }
    }

    resetLastUpdate() {
        //logger.log("resetLastUpdate");
        info.data.lastUpdAttempt = getTimestamp();
        info.data.lastUpdSuccess = false;
    }

    saveInfo(info) {
        logger.log("saveInfo");
        //logger.log(info);
        this.infoFile.overrideWithText(info);
        info.data.lastUpd = getTimestamp();
        info.data.lastUpdSuccess = true;
        //this.save();
    }

    stopService() {
        logger.log(`stopService`);
        let alarmId = this.getAlarmId();
        if (alarmId) {
            logger.log(`remove alarm id ${alarmId})`);
            alarmMgr.cancel(alarmId);
        }
        this.dropConnection();
        appServiceMgr.exit();
    }

    destroy() {
        this.dropConnection();
        if (!info.data.lastUpdSuccess) {
            logger.log(`FAIL UPDATE`);
        }
    }

    save() {
        info.save();
    }
}

function getTime() {
    return (
        zeroPad(timeSensor.getHours()) +
        ":" +
        zeroPad(timeSensor.getMinutes()) +
        ":" +
        zeroPad(timeSensor.getSeconds()) +
        "." +
        zeroPad(timeSensor.getTime() % 1000, 4)
    );
}

function handle(p) {
    try {
        logger.log(`handle`);
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
}

AppService({
    onEvent(p) {
        logger.log(`service onEvent(${p})`);
        handle(p);
    },
    onInit(p) {
        logger.log(`service onInit(${p}) ${getTime()}`);
        handle(p);
    },
    onDestroy() {
        logger.log(`service on destroy invoke ${getTime()}`);
        if (service) {
            service.destroy();
            //service = null;
        }
    }
});