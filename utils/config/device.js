import { getDeviceInfo } from "@zos/device";

export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT, screenShape: DEVICE_SHAPE } =
  getDeviceInfo();
