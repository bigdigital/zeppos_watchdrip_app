import {log} from "@zos/utils";
import * as appServiceMgr from "@zos/app-service";
import {Time} from "@zos/sensor";
import {Commands, DATA_TIMER_UPDATE_INTERVAL_MS, FETCH_SERVICE_ACTION} from "../utils/config/constants";

import {connectStatus} from '@zos/ble'
import {BT_STATE, LOCAL_STORAGE, LocalInfoStorage} from "../utils/watchdrip/localInfoStorage";
import * as alarmMgr from '@zos/alarm'
import {GRAPH_FETCH_PARAM, SERVICE_NAME, WF_INFO_FILE} from "../utils/config/global-constants";
import {Path} from "../utils/path";
import {zeroPad} from "../shared/date";
import {getTimestamp} from "../utils/helper";
import {BaseApp} from "../core/zml-app.debug";
import {emitCustomSystemEvent} from "@zos/app";

const logger = log.getLogger("alarm-service");


/*
typeof WatchdripService
*/
let service = null;

let {messaging, localStorage} = getApp()._options.globalData;

class AlarmService {
    constructor() {

    }
    init(data) {
        logger.log(`init ${data.action}`);
        switch (data.action) {
            case ALARM_SERVICE_ACTION.START_SERVICE:
                this.prepare();
                break;
            case FETCH_SERVICE_ACTION.STOP_SERVICE:
                this.stopService();
                break;
        }
    }

    prepare() {
        logger.log("prepare");
        let alarmId = this.getAlarmId();
        if (this.storage.settings.s_useBGService) {

            if (alarmId) {
                logger.log(`remove alarm id ${alarmId})`);
                alarmMgr.cancel(alarmId);
            }
            if (this.contServiceStarted) return;
            this.timeSensor.onPerMinute(() => {
                logger.log("onPerMinute");
                this.updatingData = false;
                this.storage.readItem(LOCAL_STORAGE.SETTINGS);
                this.fetchInfo();
            });
            this.contServiceStarted = true;
        } else {
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
        }
    }


    extendBGLife(){
        logger.log("extendBGLife");
        this.intervalTimer = setInterval(() => {
            this.emitEvent(FETCH_SERVICE_ACTION.EXTEND);
        }, 400);
    }

    emitEvent(action, params = {}) {
        logger.log("emitEvent");
        let obj = {
            eventName: 'event:customize.fetch',
            eventParam: JSON.stringify({
                action, ...params
            })
        }
        emitCustomSystemEvent(obj)
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
    }

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
        service = new AlarmService()
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
        logger.log(`service onInit(${p})`);
        handle(p);
    },
    onDestroy() {
        logger.log("service on destroy invoke");
        if (service) {
            service.onDestroy();
        }
    }
});