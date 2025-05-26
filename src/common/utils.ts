import { convertFileSrc } from "@tauri-apps/api/core";
import moment from "moment";
import { LocalFileSystem } from "../providers/storage/localFileSystem";

export function randomIntInRange(min: number, max: number) {
  if (min > max) {
    throw new Error(`min (${min}) can't be bigger than max (${max})`);
  }

  if (min === max) {
    return min;
  }

  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

export const KeyCodes = {
  comma: 188,
  enter: 13,
  backspace: 8,
  ctrl: 17,
  shift: 16,
  tab: 9,
};

export function encodeFileURI(path: string): string {
  const encodedURI = convertFileSrc(path);
  return encodedURI;
}

export function normalizeSlashes(path: string): string {
  return path.replace(/\\/g, "/");
}

export function formatTime(seconds: number): string {
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const ms = Math.round(100 * (seconds - Math.floor(seconds)));

  let msStr = "-";
  let sStr = "-.";
  let mStr = "-:";
  let hStr = "-:";
  if (!isNaN(seconds) && seconds !== Infinity) {
    hStr = h > 0 ? `${String(h)}:` : "";
    mStr = m < 10 ? `0${String(m)}:` : `${String(m)}:`;
    sStr = s < 10 ? `0${String(s)}.` : `${String(s)}.`;
    msStr = ms < 10 ? `0${String(ms)}` : String(ms);
  }

  return hStr + mStr + sStr + msStr;
}

export function convertDateFormat(date: string): string {
  const timezone = -moment().toDate().getTimezoneOffset() / 60;
  if (timezone === 0 || timezone === 1 || timezone === 2) {
    return moment(date, "YYYY/MM/DD").format("DD/MM/YYYY");
  } else {
    return date;
  }
}

export function getDateTimeString(
  dateSeparator: string = "",
  timeSeparator: string = ""
): string {
  const dateTime = new Date();

  const year = dateTime.getFullYear().toString();
  const month = ("0" + (1 + dateTime.getMonth()).toString()).slice(-2);
  const date = ("0" + dateTime.getDate().toString()).slice(-2);
  const hour = ("0" + dateTime.getHours().toString()).slice(-2);
  const minute = ("0" + dateTime.getMinutes().toString()).slice(-2);
  const second = ("0" + dateTime.getSeconds().toString()).slice(-2);
  return (
    [year, month, date].join(dateSeparator) +
    "_" +
    [hour, minute, second].join(timeSeparator)
  );
}

export async function writeLog(message: string, filePath: string) {
  const dateTime = getDateTimeString("/", ":");
  console.info(message);
  await LocalFileSystem.writeText(filePath, dateTime + " " + message + "\n", {
    append: true,
  });
}
