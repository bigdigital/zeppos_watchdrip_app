export class PumpData {
    constructor(reservoir, iob, bat) {
        this.reservoir = reservoir;
        this.iob = iob;
        this.bat = bat;
    }

    static createEmpty() {
        return new PumpData("", "", "");
    }
}