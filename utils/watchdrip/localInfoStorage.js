import {json2str, str2json} from "../../shared/data";
import {LocalStorage} from '@zos/storage'

const LOCAL_STORAGE_INFO = 'local_info';
let storage;

export class LocalInfoStorage {
    constructor() {
        storage = new LocalStorage()
        this.infoLastUpd = 0;
        this.infoLastUpdAttempt = 0;
        this.infoLastUpdSucess = false
        this.read();
    }

    read() {
        let parsed = str2json(storage.getItem(LOCAL_STORAGE_INFO));

        if (parsed) {
            Object.assign(this, parsed);
        }
    }

    save() {
        storage.setItem(LOCAL_STORAGE_INFO, json2str(this))
    }
}