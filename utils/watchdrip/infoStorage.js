import {json2str, str2json} from "../../shared/data";
import {Path} from "../path";

const STORAGE_TYPE = {
    LOCAL_STORAGE: 0,
    FILE: 1,
};

export class InfoStorage {
    storage;

    /**
     *
     * @param storageService could be localstorage or Path
     * @param defaults default data
     * @param itemName Used for local storage
     */
    constructor(storageService, defaults = null, itemName = null) {
        // this.settings = getSettingsDefaults(SETTINGS_CONFIG);
        this.storage = storageService;
        this.storageType = STORAGE_TYPE.LOCAL_STORAGE;

        if (this.storage instanceof Path) {
            this.storageType = STORAGE_TYPE.FILE;
        } else {
            this.itemName = itemName;
        }
        this.data = defaults !== null ? defaults : {};
        this.read();
    }

    read() {
        //console.log('sRead');
        let info = null;
        if (this.storageType === STORAGE_TYPE.FILE) {
            info = this.#readFile();
        } else {
            info = this.#readLocalStorageItem();
        }
        this.#unparse(info)
    }
    get(key, fallback=null) {
        if(this.data[key] !== undefined)
            return this.data[key];
        return fallback;
    }

    set(key, value) {
        this.data[key] = value;
        this.save();
    }

    #readFile() {
        try {
            let info = this.storage.fetchText();
            return info;
        } catch (e) {
        }
        return null;
    }

    #readLocalStorageItem() {
        let info = this.storage.getItem(this.itemName);
        return info
    }

    #unparse(info) {
        if (!info) return;
        //console.log(info)
        let parsed = str2json(info);

        if (parsed) {
            Object.assign(this.data, parsed);
        }
    }

    save() {
        //console.log('save');
        let info = json2str(this.data);
        if (this.storageType === STORAGE_TYPE.FILE) {
            this.#saveFile(info);
        } else {
            this.#saveLocalStorageItem(info);
        }
    }

    /**
     * @param {string} info data */
    #saveFile(info) {
        this.storage.overrideWithText(info);
    }

    /**
     * @param {string} info data */
    #saveLocalStorageItem(info) {
        this.storage.setItem(this.itemName, info)
    }
}