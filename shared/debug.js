import { DEBUG_TEXT } from "../utils/config/styles";
import { zeroPad } from "./date";

export class DebugText {
  constructor(screen) {
    this.t = hmSensor.createSensor(hmSensor.id.TIME);
    this.debugTextText = "";
    this.widget = screen.createWidget(hmUI.widget.TEXT, DEBUG_TEXT);

    this.screen = screen;
    this.lines = 0;
  }

  setLines(lines) {
    this.lines = lines;
  }

  log(text) {
    this.debugTextText +=
      this.getTime() + ":" + DebugText.objToString(text) + "\r\n";
    var lines = this.debugTextText.split("\r\n");
    if (this.lines != 0 && lines.length > this.lines) {
      // remove line, starting at the first position
      lines.splice(0, lines.length - 1 - this.lines);
    }
    // join the array back into a single string
    this.debugTextText = lines.join("\r\n");
    this.widget.setProperty(hmUI.prop.MORE, { text: this.debugTextText });
  }

  getTime() {
    return (
      zeroPad(this.t.hour) +
      ":" +
      zeroPad(this.t.minute) +
      ":" +
      zeroPad(this.t.second) +
      "." +
      zeroPad(this.t.utc % 1000, 4)
    );
  }

  static objToString(obj, ndeep) {
    if (obj == null) {
      return String(obj);
    }
    switch (typeof obj) {
      case "string":
        return obj;
      case "function":
        return obj.name || obj.toString();
      case "object":
        var indent = Array(ndeep || 1).join(" "),
          isArray = Array.isArray(obj);
        return (
          "{["[+isArray] +
          Object.keys(obj)
            .map(function (key) {
              return (
                "\r\n " +
                indent +
                key +
                ": " +
                DebugText.objToString(obj[key], (ndeep || 1) + 1)
              );
            })
            .join(",") +
          "\r\n" +
          indent +
          "}]"[+isArray]
        );
      default:
        return obj.toString();
    }
  }

  clean() {
    this.debugTextText = "";
    this.widget.setProperty(hmUI.prop.MORE, { text: this.debugTextText });
  }
}
