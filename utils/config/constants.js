import {MINUTE_IN_MS, SECOND_IN_MS} from "../../shared/date";

export const DATA_TIMER_UPDATE_INTERVAL_MS = SECOND_IN_MS * 5;
export const DATA_UPDATE_INTERVAL_MS = MINUTE_IN_MS * 10;

export const DATA_STALE_TIME_MS = MINUTE_IN_MS * 2;

export const SERVER_URL = "http://localhost:29863/";
//export const SERVER_URL = "https://dev.thatguys-service.com/xdrip/test/";
export const SERVER_INFO_URL = "info.json";
export const SERVER_PUT_TREATMENTS_URL = "add_treatments";
export const SERVER_IMAGE_URL = "image.png";

export const Commands = {
    getInfo: "CMD_GET_INFO",
    putTreatment: "CMD_PUT_TREATMENTS",
    getImg: "CMD_GET_IMG",
};

export const XDRIP_UPDATE_INTERVAL_MS = MINUTE_IN_MS * 5 + SECOND_IN_MS * 30;

export const ALARM_UPDATE_INTERVAL = 3 * 60; //(in seconds)

export const PROGRESS_UPDATE_INTERVAL_MS = 100;
export const PROGRESS_ANGLE_INC = 30;

export const Colors = {
    default: 0x333333,
    defaultTransparent: 0x059AF7,
    white: 0xffffff,
    black: 0x000000,
    bgHigh: 0xffa0a0,
    bgLow: 0x8bbbff,
    accent: 0xffbeff37,
};

/*set to true on wf creation*/
export const TEST_DATA = false;

export const MMOLL_TO_MGDL = 18.0182;
export const GRAPH_LIMIT = 18;


export const FETCH_SERVICE_ACTION = {
    START_SERVICE: 'start',
    UPDATE: 'update',
    STOP_SERVICE: 'stop'
};

export const QUERY_PERMISSION_STATUS = {
    NOT_AUTHORIZED: 0,
    UNKNOWN_PERMISSION: 1,
    AUTHORIZED: 2
};