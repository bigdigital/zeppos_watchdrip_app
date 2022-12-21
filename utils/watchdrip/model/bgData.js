import {TEST_DATA} from "../../config/constants";
import {MINUTE_IN_MS} from "../../../shared/date";

export class BgData {
    constructor(val, delta, trend, isHigh, isLow, time, isStale) {
        this.val = val;
        this.delta = delta;
        this.trend = trend;
        this.isHigh = isHigh;
        this.isLow = isLow;
        this.time = time;
        this.isStale = isStale;
    }

    getBGVal() {
        if (this.isHasData()) {
            return this.val;
        }
        return '';
    }

    isHasData() {
        return this.val !== ''
    }

    static createEmpty() {
        if (TEST_DATA){
            return new BgData("10.5", "+13.2", "Flat", true, false, Date.now()-2*MINUTE_IN_MS, false);
        }
        return new BgData("", "", "", false, false, null, true);
    }

    getArrowText() {
        switch (this.trend) {
            case 'FortyFiveDown':
                return '↘';
            case 'FortyFiveUp':
                return '↗';
            case 'Flat':
                return '→';
            case 'SingleDown':
                return '↓';
            case 'DoubleDown':
                return '↓↓';
            case 'SingleUp':
                return '↑';
            case 'DoubleUp':
                return '↑↑';
            default:
                return "";
        }
    }

    getArrowResource() {
        let fileName = this.trend;
        if (fileName === undefined || fileName === "") {
            fileName = "None";
        }
        return `watchdrip/arrows/${fileName}.png`;
    }
}