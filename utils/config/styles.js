import { gettext as getText } from "i18n";
import { DEFAULT_COLOR, DEFAULT_COLOR_TRANSPARENT } from "./constants";
import { DEVICE_WIDTH } from "./device";

export const COMMON_TITLE_TEXT = {
  x: px(96),
  y: px(100),
  w: px(288),
  h: px(46),
  color: 0xffffff,
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
  color: 0xffffff,
  text: "",
  text_style: hmUI.text_style.NONE,
  align_h: hmUI.align.LEFT,
  align_v: hmUI.align.TOP,
};

export const COMMON_BUTTON_FETCH = {
  x: (DEVICE_WIDTH - px(400)) / 2,
  y: px(260),
  w: px(400),
  h: px(100),
  text_size: px(36),
  radius: px(12),
  normal_color: DEFAULT_COLOR,
  press_color: DEFAULT_COLOR_TRANSPARENT,
  text: getText("fetch_data"),
};

export const COMMON_BUTTON_FETCH_IMG = {
  x: (DEVICE_WIDTH - px(400)) / 2,
  y: px(360),
  w: px(400),
  h: px(100),
  text_size: px(36),
  radius: px(12),
  normal_color: DEFAULT_COLOR,
  press_color: DEFAULT_COLOR_TRANSPARENT,
  text: getText("fetch_img"),
};
