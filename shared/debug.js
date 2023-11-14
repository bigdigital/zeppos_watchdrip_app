import * as hmUI from "@zos/ui";
import { zeroPad } from "./date";
import {DEBUG_TEXT} from "../utils/config/styles";
import { log } from "@zos/utils";
import { Time } from "@zos/sensor";
import {objToString} from "../utils/helper";

//this helper allows to display logs on the screen
//Also you can use bridge mode to show logs from the app (need to enable logs inside zepp app development menu)

export class DebugText {
    constructor() {
        this.t = new Time();
        this.debugTextText = "";
        this.widget = hmUI.createWidget(hmUI.widget.TEXT, DEBUG_TEXT);
        this.lines = 0;
        // this.enabled = true;
        this.enabled = false;

        let loggerName = "watchdrip_app";
        this.logger = log.getLogger(loggerName);
    }

    setLines(lines) {
        this.lines = lines;
    }

    setEnabled(enabled){
        this.enabled = enabled;
        if (!enabled) {
            this.clean();
        }
    }

    log(text, logger = true) {
        let formatted = objToString(text);
        if (logger) {
            this.logger.log(formatted);
        }
        if (!this.enabled) {
            this.debugTextText = "";
            return;
        }
        this.debugTextText +=
            this.getTime() + ":" + formatted + "\r\n";
        let lines = this.debugTextText.split("\r\n");
        if (this.lines !== 0 && lines.length > this.lines) {
            // remove line, starting at the first position
            lines.splice(0, lines.length - 1 - this.lines);
        }
        // join the array back into a single string
        this.debugTextText = lines.join("\r\n");
        this.widget.setProperty(hmUI.prop.MORE, { text: this.debugTextText });
    }

    getTime() {
        return (
            zeroPad(this.t.getHours()) +
            ":" +
            zeroPad(this.t.getMinutes()) +
            ":" +
            zeroPad(this.t.getSeconds()) +
            "." +
            zeroPad(this.t.getTime() % 1000, 4)
        );
    }



    clean() {
        this.debugTextText = "";
        this.widget.setProperty(hmUI.prop.MORE, { text: this.debugTextText });
    }
}
