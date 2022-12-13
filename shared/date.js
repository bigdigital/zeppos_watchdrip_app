export const SECOND_IN_MS = 1000;
export const MINUTE_IN_MS = 60000;

export function zeroPad(nr, base = 2) {
    let len = base - String(nr).length + 1;
    return len > 0 ? new Array(len).join("0") + nr : nr;
}

export function DateToHumanString(date) {
    let st =
        date.getHours() +
        ":" +
        zeroPad(date.getMinutes(), 2) +
        ":" +
        zeroPad(date.getSeconds(), 2) +
        " " +
        zeroPad(date.getDate(), 2) +
        "/" +
        zeroPad(date.getMonth() + 1, 2);

    return st;
}

export function getMinutesAgo(msSince) {
    let minutes = Math.trunc(msSince / MINUTE_IN_MS);
    if (minutes === 0) return "now";
    return minutes.toString() + " " + ((minutes === 1) ? "min" : "mins");
}

export function niceTime(t) {
    var unit = 'sec';
    t = t / 1000;
    if (t !== 1) unit = 'sec';
    if (t > 59) {
        unit = 'min';
        t = t / 60;
        if (t != 1) unit = 'mins';
        if (t > 59) {
            unit = 'hour';
            t = t / 60;
            if (t != 1) unit = 'hours';
            if (t > 24) {
                unit = 'day';
                t = t / 24;
                if (t != 1) unit = 'days';
                if (t > 28) {
                    unit = 'week';
                    t = t / 7;
                    if (t != 1) unit = 'weeks';
                }
            }
        }
    }else{
        return "now";
    }
    //if (t != 1) unit = unit + "s"; //implemented plurality in every step, because in other languages plurality of time is not every time adding the same character
    return Math.trunc(t) + " " + unit;
}