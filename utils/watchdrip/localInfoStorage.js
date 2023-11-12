import {json2str, str2json} from "../../shared/data";
import {WATCHDRIP_SETTINGS_DEFAULTS} from "../config/global-constants";

let storage;

export const LOCAL_STORAGE = {
    SETTINGS: 'settings',
    INFO: 'info',
};

export class LocalInfoStorage {
    constructor(localStorage) {
        storage = localStorage;

        this.settings = WATCHDRIP_SETTINGS_DEFAULTS;
        this.info = {
            lastUpd: 0,
            lastUpdAttempt: 0,
            lastUpdSuccess: false,
            alarmId: 0,
            lastFile: ''
        };
        this.read();
    }

    read() {
        this.readItem(LOCAL_STORAGE.INFO);
        this.readItem(LOCAL_STORAGE.SETTINGS);
    }

    readItem(item) {
        let info = storage.getItem(item);
        if (!info) return;
        let parsed = str2json(info);

        if (parsed) {
            Object.assign(this[item], parsed);
        }
    }


    /**
     * @param {string} item name */
    saveItem(item) {
        storage.setItem(item, json2str(this[item]))
    }
}