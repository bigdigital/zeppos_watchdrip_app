import {getDeviceInfo} from "@zos/device";
import {getPackageInfo} from "@zos/app";

import * as hmFS from '@zos/fs';

const deviceID = getDeviceInfo().deviceName;
export const isMiBand7 = deviceID === "Xiaomi Smart Band 7";

export class Path {
    constructor(scope, path) {
        let patchOrig = path;
        if (path[0] != "/") path = "/" + path;

        this.scope = scope;
        this.path = path;

        if (scope === "assets") {
            this.relativePath = path;
            this.absolutePath = FsTools.fullAssetPath(path);
        } else if (scope === "data") {
            this.relativePath = "data://" + patchOrig;
            this.absolutePath = FsTools.fullDataPath(path);
        } else if (scope === "full") {
            this.relativePath = `../../../${path.substring(9)}`;
            if (this.relativePath.endsWith("/"))
                this.relativePath = this.relativePath.substring(0, this.relativePath.length - 1);
            this.absolutePath = path;
        } else {
            throw new Error("Unknown scope provided")
        }
    }

    get(path) {
        const newPath = this.path === "/" ? path : `${this.path}/${path}`;
        return new Path(this.scope, newPath);
    }

    resolve() {
        return new Path("full", this.absolutePath);
    }

    src() {
        if (this.scope !== "assets")
            throw new Error("Can't get src for non-asset");
        return this.relativePath.substring(1);
    }

    stat() {
        let options = {path: this.relativePath};
        if (this.scope === "data") {
            return hmFS.statSync(options);
        } else {
            return hmFS.statAssetsSync(options);
        }
    }

    size() {
        const st  = this.stat();
        if (!st) return null;
        if (st.size) {
            // Is file, nothing to do anymore
            return st.size;
        }

        let output = 0;
        for (const file of this.list()[0]) {
            output += this.get(file).size();
        }

        return output;
    }

    open(flags) {
        let options = {path: this.relativePath, flag: flags};

        if (this.scope === "data") {
            this._f = hmFS.openSync(options);
        } else {
            this._f = hmFS.openAssetsSync(options);
        }

        return this._f;
    }

    remove() {
        if (this.scope === "assets")
            return this.resolve().remove();

        try {
            let path = isMiBand7 ? this.absolutePath : this.relativePath;
            hmFS.rmSync({path: path});
            return true;
        } catch (e) {
            return false;
        }
    }

    removeTree() {
        // Recursive !!!
        const [files, e] = this.list();
        for (let i in files) {
            this.get(files[i]).removeTree();
        }

        this.remove();
    }

    fetch(limit = Infinity) {
        const st = this.stat();
        if (!st) {
            return null;
        }
        const length = Math.min(limit, st.size);
        const buffer = new ArrayBuffer(st.size);
        this.open(hmFS.O_RDONLY);
        this.read(buffer, 0, length);
        this.close();

        return buffer;
    }

    fetchText(limit = Infinity) {
        const buf = this.fetch(limit);
        if (!buf) return buf;
        let text= FsTools.ab2str(buf)
       // console.log(text);
        return text;
    }

    fetchJSON() {
        const text = this.fetchText();
        if (!text) return text;
        return JSON.parse(text);
    }

    override(buffer) {
        this.remove();

        this.open(hmFS.O_WRONLY | hmFS.O_CREAT);
        this.write(buffer, 0, buffer.byteLength);
        this.close();
    }

    overrideWithText(text) {
        console.log(text);
        return this.override(FsTools.str2ab(text));
    }

    overrideWithJSON(data) {
        return this.overrideWithText(JSON.stringify(data));
    }

    copy(destEntry) {
        const buf = this.fetch();
        destEntry.override(buf);
    }

    exists() {
        return this.stat();
    }

    list() {
        let path = isMiBand7 ? this.absolutePath : this.relativePath;
        return hmFS.readdirSync({path: path});
    }

    mkdir() {
        const path = isMiBand7 ? this.absolutePath : this.relativePath;
        console.log("mkdir " + path);
        return hmFS.mkdirSync(path);
    }

    read(buffer, offset, length) {
        console.log("read " + this.path);
        hmFS.readSync({fd: this._f, buffer: buffer, options: {offset: offset, length: length}})
    }

    write(buffer, offset, length) {
        console.log("write " + this.path);
        hmFS.writeSync({fd: this._f, buffer: buffer, options: {offset: offset, length: length}})
    }

    close() {
        hmFS.closeSync(this._f);
    }
}

export class FsTools {
    static getAppLocation() {
        if (FsTools.overrideAppPage) {
            return FsTools.overrideAppPage;
        }

        const packageInfo = getPackageInfo();
        const idn = packageInfo.appId.toString(16).padStart(8, "0").toUpperCase();
        return [`js_${packageInfo.type}s`, idn];
    }

    static fullAssetPath(path) {
        const [base, idn] = FsTools.getAppLocation();
        return `/storage/${base}/${idn}/assets${path}`;
    }

    static fullDataPath(path) {
        const [base, idn] = FsTools.getAppLocation();
        return `/storage/${base}/data/${idn}${path}`;
    }

    static str2ab(str) {
        let buf = new ArrayBuffer(str.length);
        let buf_view = new Uint8Array(buf);
        for (let i=0, strLen=str.length; i < strLen; i++) {
            buf_view[i] = str.charCodeAt(i);
        }
        return buf;
    }

    static ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    }
}