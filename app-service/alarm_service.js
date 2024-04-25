import {log} from "@zos/utils";
import {Time} from "@zos/sensor";
import {ALARM_SERVICE_ACTION, PagesType} from "../utils/config/constants";
import * as alarmMgr from '@zos/alarm'
import {zeroPad} from "../shared/date";
import {getPackageInfo} from "@zos/app";
import * as notificationMgr from "@zos/notification";

const logger = log.getLogger("alarm-service");

/*
typeof AlarmService
*/
let service = null;

let {/**@type {InfoStorage} */ config,
    /** @type {InfoStorage} */ info
} = getApp()._options.globalData;

/** @type {MessageBuilder} */ let messaging = null;

let timeSensor = new Time();

class AlarmService {
    constructor() {
    }

    // Send a notification
    sendNotification() {
        logger.log("send notification");
        notificationMgr.notify({
            title: "Time Service",
            content: `Now the time is ${timeSensor.getHours()}:${timeSensor.getMinutes()}:${timeSensor.getSeconds()}`,
            actions: [
                {
                    text: "Home Page",
                    file: "pages/index",
                },
                {
                    text: "Stop Service",
                    file: "app-service/time_service",
                    param: "action=exit", //! processed in onEvent()
                },
            ],
        });
    }

    init(data) {
        logger.log(`init ${data.action}`);
        switch (data.action) {
            case ALARM_SERVICE_ACTION.UPDATE:
                this.update();
                break;
        }
    }

    update() {
        logger.log(`update`);
        //  this.runMainApp();
    }

    runMainApp() {
        let appId = getPackageInfo().appId;
        logger.log(`runMainApp`);
        let param = JSON.stringify({
            page: PagesType.MAIN
        });
        const option = {
            appid: appId,
            url: 'page/index',
            param: param,
            delay: 1
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
        let data = {action: ALARM_SERVICE_ACTION.UPDATE};
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
        logger.log(`service onInit(${p}) ${getTime()}`);
        handle(p);
    },
    onDestroy() {
        logger.log(`service on destroy invoke ${getTime()}`);
    }
});