import { isHmAppDefined } from '../../shared/js-module'

let _r = null

if (typeof __$$R$$__ !== 'undefined') {
  _r = __$$R$$__
} else {
  _r = () => {}
}

export { _r }


let getPackageInfo = null

if (isZeppOS1()) {
  getPackageInfo = hmApp.getPackageInfo
} else if (isZeppOS2()) {
  getPackageInfo = _r('@zos/app').getPackageInfo
}

export { getPackageInfo }

let ui = null

if (isZeppOS1()) {
  ui = hmUI
} else if (isZeppOS2()) {
  ui = _r('@zos/ui')
  // ui = uiModule
}

export { ui }

let getDeviceInfo = null

if (isZeppOS1()) {
  getDeviceInfo = hmSetting.getDeviceInfo
} else if (isZeppOS2()) {
  getDeviceInfo = _r('@zos/device').getDeviceInfo
}

export { getDeviceInfo }

let getText = null
if (isZeppOS1()) {
  getText =
    typeof __$$app$$__ !== 'undefined'
      ? __$$app$$__?.__globals__?.gettext
      : function () {
          throw new Error(`zeppos 1.0 required: import { gettext } from 'i18n'`)
        }
} else if (isZeppOS2()) {
  getText = _r('@zos/i18n').getText
}

export { getText }

let push = null

if (isZeppOS1()) {
  push = hmApp.gotoPage
} else if (isZeppOS2()) {
  push = _r('@zos/router').push
}

export { push }

let nativeBle = null

if (isZeppOS1()) {
  nativeBle = hmBle
} else if (isZeppOS2()) {
  nativeBle = _r('@zos/ble')
  // nativeBle = bleModule
}

export { nativeBle }

export function isZeppOS1() {
  return isZeppOS() && isAPILevel1()
}

export function isZeppOS2() {
  return isZeppOS() && isAPILevel2()
}

export function isAPILevel1() {
  return isHmAppDefined()
}

export function isAPILevel2() {
  return typeof __$$R$$__ !== 'undefined'
}

export function isZeppOS() {
  return isAPILevel1() || isAPILevel2()
}

export function isSideService() {
  return typeof messaging !== 'undefined'
}
