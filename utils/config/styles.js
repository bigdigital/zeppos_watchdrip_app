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
  y: px(10),
  w: px(288),
  h: px(36),
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
  h: px(28),
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
  h: px(28),
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
  h: px(28),
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
  h: px(25),
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
  x: px(50),
  y: px(95),
  w: px(150),
  h: px(60),
  color: Colors.white,
  text_size: px(60),
  align_h: hmUI.align.RIGHT,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const BG_TIME_TEXT = {
  x: px(285),
  y: px(128),
  w: px(200),
  h: px(25),
  color: Colors.white,
  text_size: px(25),
  align_h: hmUI.align.LEFT,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const BG_DELTA_TEXT = {
  x: px(285),
  y: px(88),
  w: px(200),
  h: px(30),
  color: Colors.white,
  text_size: px(28),
  align_h: hmUI.align.LEFT,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const BG_TREND_IMAGE = {
  src: 'watchdrip/arrows/Flat.png',
  x: px(220),
  y: px(110),
};

export const BG_STALE_RECT = {
  x: px(80),
  y: px(130),
  w: px(120),
  h: px(4),
  color: Colors.white,
  visible: false,
};