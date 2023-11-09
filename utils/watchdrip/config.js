import { WATCHDRIP_SETTINGS_DEFAULTS, WF_CONFIG_FILE,} from "../config/global-constants";

import {Path} from "../path";

let file;
export class WatchdripConfig {
    constructor() {
        file = new Path("full", WF_CONFIG_FILE);

        this.settings = WATCHDRIP_SETTINGS_DEFAULTS;
        this.settingsTime = 0;
        this.infoLastUpd= 0;
        this.infoLastUpdAttempt = 0;
        this.infoLastUpdSucess = false
        this.read();

    }

    read() {
        let parsed = file.fetchJSON();

        if (parsed) {
            parsed.watchdripConfig = {...WATCHDRIP_SETTINGS_DEFAULTS, ...parsed.watchdripConfig};
            Object.assign(this, parsed);
        }
    }

    save() {
        file.overrideWithJSON(this);
    }
}