export class StatusData {
    constructor(now, isMgdl, bat) {
        this.now = now;
        this.isMgdl = isMgdl;
        this.bat = bat;
    }

    getUnitText(){
        if (this.isMgdl == null){
            return "";
        }
        if (this.isMgdl){
            return "mg/dl";
        }
        return "mmol";
    }

    static createEmpty() {
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