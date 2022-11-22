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