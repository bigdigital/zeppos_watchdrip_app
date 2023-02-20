import {TEST_DATA} from "../../config/constants";
import {MINUTE_IN_MS} from "../../../shared/date";

export class TreatmentData {
    constructor(insulin, carbs, time, predictIOB, predictBWP) {
        this.insulin = insulin;
        this.carbs = carbs;
        this.time = time;
        this.predictIOB = predictIOB;
        this.predictBWP = predictBWP;
    }

    getPredictIOB() {
        if (this.predictIOB === "" || this.predictIOB === undefined) {
            return "";
        }
        return "IOB: " + this.predictIOB;
    }

    getPredictBWP() {
        if (this.predictBWP === "" || this.predictBWP === undefined) {
            return "";
        }
        return "BWP: " + this.predictBWP;
    }

    getTreatments() {
        let treatmentText = "";
        if (this.insulin > 0) {
            let insText = this.insulin + "u";
            insText = insText.replace(".0u", "u");
            treatmentText = treatmentText + insText;
        } else if (this.carbs > 0) {
            let carbText = this.carbs + "g";
            carbText = carbText.replace(".0g", "g");
            treatmentText = treatmentText + carbText;
        }
        return treatmentText;
    }


    static createEmpty() {
        if (TEST_DATA){
            return new TreatmentData("10", "20", Date.now()-6*MINUTE_IN_MS, "10u" ,"20u");
        }
        return new TreatmentData("", "", null, "", "");
    }
}