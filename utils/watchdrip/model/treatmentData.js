export class TreatmentData {
    constructor(insulin, carbs, time) {
        this.insulin = insulin;
        this.carbs = carbs;
        this.time = time;
    }

    static createEmpty() {
        return new TreatmentData("", "", null);
    }
}