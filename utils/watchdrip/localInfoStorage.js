import {json2str, str2json} from "../../shared/data";

const LOCAL_STORAGE_INFO = 'local_info';
let storage;

export class LocalInfoStorage {
    constructor(localStorage) {
        storage = localStorage;
        this.infoLastUpd = 0;
        this.infoLastUpdAttempt = 0;
        this.infoLastUpdSucess = false
        this.alarmId = 0
        this.read();
    }

    read() {
        let info = storage.getItem(LOCAL_STORAGE_INFO);
        if (!info) return;
        let parsed = str2json(info);

        if (parsed) {
            Object.assign(this, parsed);
        }
    }

    save() {
        storage.setItem(LOCAL_STORAGE_INFO, json2str(this))
    }
}