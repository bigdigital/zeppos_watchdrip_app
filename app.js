import {InfoStorage} from "./utils/watchdrip/infoStorage";
import {Path} from "./utils/path";
import {WATCHDRIP_INFO_DEFAULTS, WATCHDRIP_SETTINGS_DEFAULTS} from "./utils/config/global-constants";

const config = new InfoStorage(
    new Path("data", "config.json"),
    WATCHDRIP_SETTINGS_DEFAULTS
);

const info = new InfoStorage(
    new Path("data", "info.json"),
    WATCHDRIP_INFO_DEFAULTS
);

App({
        globalData: {
            config,
            info
        },
        onCreate(options) {
            // this.globalData.messaging.disConnect();
            console.log("app on create invoke");
        },

        onDestroy(options) {
            console.log("app on destroy invoke");
        }
    }
);
