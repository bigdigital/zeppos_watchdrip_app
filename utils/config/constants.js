import {MINUTE_IN_MS, SECOND_IN_MS} from "../../shared/date";

export const DATA_TIMER_UPDATE_INTERVAL_MS = SECOND_IN_MS * 10;
export const DATA_UPDATE_INTERVAL_MS = MINUTE_IN_MS * 3;

export const DATA_STALE_TIME_MS = MINUTE_IN_MS * 5;

export const SERVER_URL = "http://localhost:29863/";
export const SERVER_INFO_URL = "info.json";
export const SERVER_PUT_TREATMENTS_URL = "add_treatments";
export const SERVER_IMAGE_URL = "image.png";

export const FILES_DIR = "/storage/watchdrip/";

export const Commands = {
  getInfo: "CMD_GET_INFO",
  putTreatment: "CMD_PUT_TREATMENTS",
  getImg: "CMD_GET_IMG",
};

export const ALARM_UPDATE_INTERVAL = 30;  //3 * 60; (in seconds)

export const PROGRESS_UPDATE_INTERVAL_MS = 100;
export const PROGRESS_ANGLE_INC = 30;

export const Colors = {
  default:0xfc6950,
  defaultTransparent:0xababab,
  white:0xffffff,
  black:0x000000,
  bgHigh:0xffa0a0,
  bgLow:0x8bbbff,
  accent:0xffbeff37,
};

/*set to true on wf creation*/
export const TEST_DATA = false;