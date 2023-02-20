import { gettext as getText } from "i18n";
import {DEVICE_HEIGHT, DEVICE_WIDTH, DEVICE_SHAPE} from "./device";

import {Colors} from "./constants";

export const DEVICE_TYPE = DEVICE_SHAPE ? 'round' : 'square'

const STATUS_BAR_HEIGHT = 20;
var TEXT_SIZE = px(36);
if (DEVICE_WIDTH < 340){
  TEXT_SIZE = px(20)
}

var COMMON_BUTTON_PADDING = 0;
var SCROLL_ITEM_PADDING = 0;
export const MESSAGE_TEXT_SIZE = px(38);
export var MESSAGE_TEXT_WIDTH = DEVICE_WIDTH;
export var RADIO_ON = "radio_on_rect.png";
export var RADIO_OFF = "radio_off_rect.png";
var SCROL_PAGE_Y = STATUS_BAR_HEIGHT

if (DEVICE_TYPE === "round"){
  SCROL_PAGE_Y = px(90);
  COMMON_BUTTON_PADDING = px(50);
  SCROLL_ITEM_PADDING = px(30);
  RADIO_ON = "radio_on.png";
  RADIO_OFF = "radio_off.png";
  MESSAGE_TEXT_WIDTH = DEVICE_WIDTH - px(20)
}

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
  y: px(15),
  w: px(288),
  h: px(42),
  color: Colors.white,
  text_size: TEXT_SIZE,
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
}

export const MESSAGE_TEXT = {
  x: (DEVICE_WIDTH - MESSAGE_TEXT_WIDTH) / 2,
  y: px(90),
  w: MESSAGE_TEXT_WIDTH,
  h: px(38),
  color: Colors.white,
  text_size: MESSAGE_TEXT_SIZE,
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
}

export const COMMON_BUTTON_STYLES = {
  x: COMMON_BUTTON_PADDING,
  w: DEVICE_WIDTH - COMMON_BUTTON_PADDING*2,
  h: px(80),
  text_size: TEXT_SIZE,
  radius: px(44),
  normal_color: Colors.default,
  press_color: Colors.defaultTransparent,
};

export const COMMON_BUTTON_FETCH = {
  ...COMMON_BUTTON_STYLES,
  y: px(260),
  text: getText("fetch_data"),
};

export const COMMON_BUTTON_FETCH_IMG = {
  ...COMMON_BUTTON_STYLES,
  y: px(360),
  text: getText("fetch_img"),
};

export const COMMON_BUTTON_SETTINGS = {
  ...COMMON_BUTTON_STYLES,
  y: DEVICE_HEIGHT - px(100),
  text: getText("settings"),
};

export const COMMON_BUTTON_ADD_TREATMENT = {
  ...COMMON_BUTTON_STYLES,
  y: DEVICE_HEIGHT - px(0),
  text: getText("add_treatment"),
};

export const VERSION_TEXT = {
  x: (DEVICE_WIDTH - px(288)) / 2,
  y: DEVICE_HEIGHT + px(135),
  w: px(288),
  h: px(28),
  color: Colors.white,
  text_size: px(25),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
}

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
  h: TEXT_SIZE,
  color: Colors.white,
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

export const IMG_LOADING_PROGRESS = {
  x: (DEVICE_WIDTH - px(40)) / 2,
  y: (DEVICE_HEIGHT - px(40)) / 2,
  src: 'watchdrip/progress.png',
  angle:0,
  center_x: 20,
  center_y: 20,
  visible: false,
};



const STATE_IMG_WIDTH = 100;
const STATE_IMG_HEIGHT = 64;
const SCROLL_ITEM_HEIGHT = px(90);

export const CONFIG_PAGE_SCROLL_ITEM_CONFIG = [
  {
    type_id: 1,
    item_bg_color: Colors.black,
    item_bg_radius: px(12),
    text_view: [
      {
        x: px(15),
        y: px(15),
        w: DEVICE_WIDTH - SCROLL_ITEM_PADDING*2 - STATE_IMG_WIDTH - px(40),
        h: SCROLL_ITEM_HEIGHT - px(30),
        key: 'name',
        color: Colors.white,
        text_size: TEXT_SIZE,
        action: false
      }
    ],
    text_view_count: 1,
    image_view: [{
      x: DEVICE_WIDTH - SCROLL_ITEM_PADDING*2 - STATE_IMG_WIDTH - px(15),
      y: SCROLL_ITEM_HEIGHT/2 - STATE_IMG_HEIGHT/2 ,
      w: STATE_IMG_WIDTH,
      h: STATE_IMG_HEIGHT,
      key: "state_src",
      action: true
    }],
    image_view_count: 1,
    item_height: SCROLL_ITEM_HEIGHT
  }
]

export const CONFIG_PAGE_SCROLL = {
  x: SCROLL_ITEM_PADDING,
  y: SCROL_PAGE_Y,
  h: DEVICE_HEIGHT - px(20),
  w: DEVICE_WIDTH - SCROLL_ITEM_PADDING*2,
  item_space: px(10),
  item_config: CONFIG_PAGE_SCROLL_ITEM_CONFIG,
  item_config_count: CONFIG_PAGE_SCROLL_ITEM_CONFIG.length,
}

