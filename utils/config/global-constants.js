import {ALARM_UPDATE_INTERVAL} from "./constants";

export const WATCHDRIP_APP_ID = "28962";

export const WF_INFO = "watchdrip_info";
export const WF_INFO_LAST_UPDATE = "watchdrip_info_last";
export const WF_INFO_LAST_UPDATE_ATTEMPT = "watchdrip_info_last_attempt";
export const WF_INFO_LAST_UPDATE_SUCCESS = "watchdrip_info_last_success";

export const WF_SYSTEM_ALARM_ID = "watchdrip_alarm_id";
export const WATCHDRIP_ALARM_CONFIG = "watchdrip_alarm_config";

export const WATCHDRIP_CONFIG = "watchdrip_config";
export const WATCHDRIP_CONFIG_LAST_UPDATE = "watchdrip_config_last";

export const WATCHDRIP_CONFIG_DEFAULTS = {
    disableUpdates: false,
    showLog: false,
    useAppFetch: false,
};

export const WATCHDRIP_ALARM_CONFIG_DEFAULTS = {
    fetchInterval: ALARM_UPDATE_INTERVAL,
    fetchParams: ""
};