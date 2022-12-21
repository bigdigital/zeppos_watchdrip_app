import {TEST_DATA} from "../../config/constants";

export class StatusData {
    constructor(now, isMgdl, bat) {
        this.now = now;
        this.isMgdl = isMgdl;
        this.bat = bat;
    }

    getBatVal() {
        if (this.bat === "") {
            return "--";
        }
        return this.bat + "%";
    }

    getUnitText() {
        if (this.isMgdl == null) {
            return "";
        }
        if (this.isMgdl) {
            return "mg/dl";
        }
        return "mmol";
    }

    static createEmpty() {
        if (TEST_DATA){
            return new StatusData(1668975954793, true,  58);
        }
        return new StatusData(null, null, "");
    }
}


//
// export const TREATMENT = {
//     insulin: 'insulin',
//     carbs: 'carbs',
//     timestamp: 'time',
// };
//
//