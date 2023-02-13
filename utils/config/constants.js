import {MINUTE_IN_MS, SECOND_IN_MS} from "../../shared/date";

export const DATA_TIMER_UPDATE_INTERVAL_MS = SECOND_IN_MS * 1;
export const DATA_UPDATE_INTERVAL_MS = SECOND_IN_MS * 30;

export const DATA_STALE_TIME_MS = 30 * 1000;

export const SERVER_URL = "http://localhost:29863/";
//export const SERVER_URL = "https://dev.thatguys-service.com/xdrip/";
export const SERVER_INFO_URL = "info.json";
export const SERVER_PUT_TREATMENTS_URL = "add_treatments";
export const SERVER_IMAGE_URL = "image.png";

export const FILES_DIR = "/storage/watchdrip/";

export const Commands = {
  getInfo: "CMD_GET_INFO",
  putTreatment: "CMD_PUT_TREATMENTS",
  getImg: "CMD_GET_IMG",
};

export const DATA_ALARM_UPDATE_INTERVAL = 30;  //5 * 60;

export const Colors = {
  default:0xfc6950,
  defaultTransparent:0xb0b0b0,
  white:0xffffff,
  bgHigh:0xffa0a0,
  bgLow:0x8bbbff,
};

/*set to true on wf creation*/
export const TEST_DATA = false;