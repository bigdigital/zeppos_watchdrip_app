import { gettext as getText } from "i18n";
import {DEVICE_HEIGHT, DEVICE_WIDTH} from "./device";

import {Colors} from "./constants";

export const COMMON_TITLE_TEXT = {
  x: px(96),
  y: px(100),
  w: px(288),
  h: px(46),
  color: Colors.white,
  text_size: px(36),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const DEBUG_TEXT = {
  x: 50,
  y: 50,
  w: 250,
  h: 450,
  text_size: 12,
  char_space: 0,
  color: Colors.white,
  text: "",
  text_style: hmUI.text_style.NONE,
  align_h: hmUI.align.LEFT,
  align_v: hmUI.align.TOP,
};

export const TITLE_TEXT = {
  x: (DEVICE_WIDTH - px(288)) / 2,
  y: px(45),
  w: px(288),
  h: px(42),
  color: Colors.white,
  text_size: px(36),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
  text: "Watchdrip+"
}

export const MESSAGE_TEXT = {
  x: (DEVICE_WIDTH - px(350)) / 2,
  y: px(90),
  w: px(350),
  h: px(38),
  color: Colors.white,
  text_size: px(28),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
}

export const MESSAGE_TEXT2 = {
  x: (DEVICE_WIDTH - px(350)) / 2,
  y: px(125),
  w: px(350),
  h: px(38),
  color: Colors.white,
  text_size: px(28),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
}

export const MESSAGE_TEXT3 = {
  x: (DEVICE_WIDTH - px(350)) / 2,
  y: px(160),
  w: px(350),
  h: px(38),
  color: Colors.white,
  text_size: px(28),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
}

export const VERSION_TEXT = {
  x: (DEVICE_WIDTH - px(288)) / 2,
  y: DEVICE_HEIGHT - px(40),
  w: px(288),
  h: px(28),
  color: Colors.white,
  text_size: px(25),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
}


export const COMMON_BUTTON_FETCH = {
  x: (DEVICE_WIDTH - px(400)) / 2,
  y: px(260),
  w: px(400),
  h: px(100),
  text_size: px(36),
  radius: px(12),
  normal_color: Colors.default,
  press_color: Colors.defaultTransparent,
  text: getText("fetch_data"),
};

export const COMMON_BUTTON_FETCH_IMG = {
  x: (DEVICE_WIDTH - px(400)) / 2,
  y: px(360),
  w: px(400),
  h: px(100),
  text_size: px(36),
  radius: px(12),
  normal_color: Colors.default,
  press_color: Colors.defaultTransparent,
  text: getText("fetch_img"),
};

export const BG_VALUE_TEXT = {
  x: (DEVICE_WIDTH - px(250)) / 2,
  y: px(80),
  w: px(250),
  h: px(85),
  color: Colors.white,
  text_size: px(75),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const BG_TIME_TEXT = {
  x: DEVICE_WIDTH/2 + px(90),
  y: px(126),
  w: px(200),
  h: px(32),
  color: Colors.white,
  text_size: px(25),
  align_h: hmUI.align.LEFT,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const BG_DELTA_TEXT = {
  x: (DEVICE_WIDTH - px(200)) / 2,
  y: px(230),
  w: px(200),
  h: px(36),
  color: Colors.defaultTransparent,
  text_size: px(28),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const BG_TREND_IMAGE = {
  src: 'watchdrip/arrows/None.png',
  x: (DEVICE_WIDTH - px(41)) / 2,
  y: px(180),
  w: px(41),
  h: px(39),
};

export const BG_STALE_RECT = {
  x: (DEVICE_WIDTH - px(180)) / 2,
  y: px(150),
  w: px(180),
  h: px(4),
  color: Colors.white,
  visible: false,
};