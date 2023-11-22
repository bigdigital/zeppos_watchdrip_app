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

const logger = log.getLogger("fetch-service");


/*
typeof WatchdripService
*/
let service = null;

let {messaging, localStorage} = getApp()._options.globalData;

class WatchdripService {
    constructor() {
        this.storage = new LocalInfoStorage(localStorage);
        this.timeSensor = new Time();
        this.infoFile = new Path("full", WF_INFO_FILE);
        this.updatingData = false;
        this.contServiceStarted = false;
        let _this = this;

        this.baseApp = BaseApp({
            globalData: getApp()._options.globalData,
            sidePort: this.storage.info.sidePort,
            onMessagingCreate() {
                this.globalData.messaging.transport.on('shake:response', (data) => (_this.onShakeResponse(data)));
                messaging = this.globalData.messaging;
                _this.onMsgInit();
            }
        });
    }

    onShakeResponse(data) {
        logger.log('eventBus shake:response port' + data.port2);
        if ( this.storage.info.bt_state !== BT_STATE.SHAKE ){
            logger.log('do not expect shake');
            return;
        }
        this.storage.info.sidePort = data.port2;
        this.setBTState(BT_STATE.SHAKE_DONE)

        if (!this.storage.settings.s_useBGService){
            this.setRequestAlarm();
            //**workaround** add timeout to properly save storage data
            setTimeout(()=>{
                appServiceMgr.exit();
            }, 100)
        }
    }

    nextBTState(){
        let arr = Object.values(BT_STATE);
        let index = arr.findIndex(x => x === this.storage.info.bt_state)
        index++;

        if (index>=arr.length){
            console.log('end');
            return;
        }
        this.setBTState(arr[index]);
    }

    setBTState(state){
        console.log(`state ${state}`);
        this.storage.info.bt_state = state
        this.save();
    }

    onMsgInit() {
        logger.log(`onMsgInit sidePort: ${this.storage.info.sidePort} btState ${this.storage.info.bt_state}`);
        if (this.storage.info.bt_state !== BT_STATE.SHAKE_DONE){
            this.setBTState(BT_STATE.SHAKE);
        }
    }

    dropConnection() {
        logger.log("dropConnection");
        this.storage.info.sidePort = 0;
        this.setBTState(BT_STATE.DISCONNECTED);
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

    setRequestAlarm(){
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

    fetchInfo() {
        this.baseApp.onCreate();
        logger.log("fetchInfo " + this.getTime());
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

       logger.log(`bt_state  ${this.storage.info.bt_state}` );
       switch (this.storage.info.bt_state){
           case BT_STATE.SHAKE:
               messaging.transport.fork(2000);
               break;
           case BT_STATE.SHAKE_DONE:
               this.nextBTState();
               this.extendBGLife();
               this.requestInfo();
               break;
       }
    }

    requestInfo() {
        this.updatingData = true;
        console.log('requestInfo');
        let params = '';
        if (this.storage.settings.s_graphInfo) {
            params = GRAPH_FETCH_PARAM;
        }
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
                logger.log("lastUpdSuccess:" + this.storage.info.lastUpdSuccess);
                this.updatingData = false;
                this.nextBTState();
                if (!this.storage.info.lastUpdSuccess) {
                    this.setError('status_start_watchdrip');
                } else {
                    this.resetError();
                }
                this.dropConnection();
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
        this.infoFile.overrideWithText(info);
        this.storage.info.lastUpd = getTimestamp();
        this.storage.info.lastUpdSuccess = true;
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

    onDestroy() {
        //this.dropConnection();
        if (!this.storage.info.lastUpdSuccess && this.storage.info.bt_state === BT_STATE.REQUEST) {
            logger.log(`FAIL UPDATE`);
        }
        if (this.storage.info.bt_state === BT_STATE.REQUEST){
            this.dropConnection();
        }
        else if ( this.storage.info.bt_state === BT_STATE.SHAKE){
            this.dropConnection();
        }

    }

    save() {
        this.storage.saveItem(LOCAL_STORAGE.INFO);
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