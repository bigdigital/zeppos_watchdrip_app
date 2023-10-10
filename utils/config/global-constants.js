import {ALARM_UPDATE_INTERVAL} from "./constants";

export const WATCHDRIP_APP_ID = "28962";


 export const WF_DIR = "/storage/js_apps/data/watchdrip";
 export const WF_INFO_FILE = WF_DIR + "/info.json";
 export const WF_CONFIG_FILE = WF_DIR + "/config.json";

export const WATCHDRIP_SETTINGS_DEFAULTS = {
    disableUpdates: false,
    showLog: false,
    useAppFetch: false,
};

export const WATCHDRIP_ALARM_SETTINGS_DEFAULTS = {
    fetchInterval: ALARM_UPDATE_INTERVAL,
    fetchParams: ""
};