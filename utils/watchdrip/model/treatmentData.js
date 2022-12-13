export class TreatmentData {
    constructor(insulin, carbs, time, predictIOB, predictWPB) {
        this.insulin = insulin;
        this.carbs = carbs;
        this.time = time;
        this.predictIOB = predictIOB;
        this.predictWPB = predictWPB;
    }

    getPredictIOB() {
        if (this.predictIOB === "" || this.predictIOB === undefined) {
            return "";
        }
        return "IOB: " + this.predictIOB;
    }

    getPredictWPB() {
        if (this.predictWPB === "" || this.predictWPB === undefined) {
            return "";
        }
        return "WPB: " + this.predictWPB;
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


    /*static createEmpty() {
        return new TreatmentData("10", "20", 1668975954793, "10u" ,"20u");
    }*/

    static createEmpty() {
        return new TreatmentData("", "", null, "", "");
    }
}