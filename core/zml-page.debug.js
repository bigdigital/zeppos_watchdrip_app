function isHmAppDefined() {
  return typeof hmApp !== 'undefined'
}

let _r = null;

if (typeof __$$R$$__ !== 'undefined') {
  _r = __$$R$$__;
} else {
  _r = () => {};
}

if (isZeppOS1()) {
  hmApp.getPackageInfo;
} else if (isZeppOS2()) {
  _r('@zos/app').getPackageInfo;
}

if (isZeppOS1()) {
  hmUI;
} else if (isZeppOS2()) {
  _r('@zos/ui');
  // ui = uiModule
}

if (isZeppOS1()) {
  hmSetting.getDeviceInfo;
} else if (isZeppOS2()) {
  _r('@zos/device').getDeviceInfo;
}
if (isZeppOS1()) {
  typeof __$$app$$__ !== 'undefined'
      ? __$$app$$__?.__globals__?.gettext
      : function () {
          throw new Error(`zeppos 1.0 required: import { gettext } from 'i18n'`)
        };
} else if (isZeppOS2()) {
  _r('@zos/i18n').getText;
}

if (isZeppOS1()) {
  hmApp.gotoPage;
} else if (isZeppOS2()) {
  _r('@zos/router').push;
}

if (isZeppOS1()) {
  hmBle;
} else if (isZeppOS2()) {
  _r('@zos/ble');
  // nativeBle = bleModule
}

function isZeppOS1() {
  return isZeppOS() && isAPILevel1()
}

function isZeppOS2() {
  return isZeppOS() && isAPILevel2()
}

function isAPILevel1() {
  return isHmAppDefined()
}

function isAPILevel2() {
  return typeof __$$R$$__ !== 'undefined'
}

function isZeppOS() {
  return isAPILevel1() || isAPILevel2()
}

function isSideService() {
  return typeof messaging !== 'undefined'
}

let logger = null;


if (isZeppOS1()) {
  // zeppos 1.0
  logger = DeviceRuntimeCore.HmLogger;
} else if (isZeppOS2()) {
  // zeppos 2.0
  logger = _r('@zos/utils').log;
} else if (isSideService()) {
  // side service 1.0
  if (typeof Logger !== 'undefined') {
    logger = Logger;
  }
}

_r('@zos/utils').EventBus;

_r('@zos/timer').setTimeout;
_r('@zos/timer').clearTimeout;

isZeppOS()
  ? logger.getLogger('device-message')
  : logger.getLogger('side-message');

logger.getLogger('message-builder');

function getDeviceMessage() {
  const { messaging } = getApp()._options.globalData;
  return messaging
}

function getFileTransfer(fileTransfer) {
  /**
   *     start(newfile)------------finished(file)
   *     device supported newfile and file
   *     side supported file
   */

  return {
    onFile(cb) {
      if (!cb) {
        return this
      }

      if (typeof fileTransfer === 'undefined') {
        return this
      }

      // at file task start
      fileTransfer.inbox.on('newfile', function () {
        const file = fileTransfer.inbox.getNextFile();
        cb && cb(file);
      });
      return this
    },
    onSideServiceFileFinished(cb) {
      if (!cb) {
        return this
      }

      if (typeof fileTransfer === 'undefined') {
        return this
      }

      // at file task finished
      fileTransfer.inbox.on('file', function () {
        const file = fileTransfer.inbox.getNextFile();
        cb && cb(file);
      });
      return this
    },
    emitFile() {
      fileTransfer.inbox.emit('file');
      return this
    },
    offFile() {
      if (typeof fileTransfer === 'undefined') {
        return this
      }

      fileTransfer.inbox.off('newfile');
      fileTransfer.inbox.off('file');
      return this
    },
    getFile() {
      if (typeof fileTransfer === 'undefined') {
        return null
      }

      return fileTransfer.inbox.getNextFile()
    },
    sendFile(path, opts) {
      if (typeof fileTransfer === 'undefined') {
        throw new Error('fileTransfer is not available')
      }

      return fileTransfer.outbox.enqueueFile(path, opts)
    },
  }
}

const TransferFile = _r('@zos/ble/TransferFile');
const fileTransferLib = getFileTransfer(new TransferFile());

function BasePage({ state = {}, onInit, onDestroy, ...other } = {}) {
  const messaging = getDeviceMessage();

  return {
    state,
    ...other,
    onInit(...opts) {
      this._onCall = this.onCall?.bind(this);
      this._onRequest = this.onRequest?.bind(this);
      messaging.onCall(this._onCall).onRequest(this._onRequest);

      if (this.onReceivedFile) {
        this._onReceivedFile = this.onReceivedFile?.bind(this);
        fileTransferLib.onFile(this._onReceivedFile);
      }

      onInit?.apply(this, opts);
    },
    onDestroy(...opts) {
      if (this._onCall) {
        messaging.offOnCall(this._onCall);
      }

      if (this._onRequest) {
        messaging.offOnRequest(this._onRequest);
      }

      if (this._onReceivedFile) {
        fileTransferLib.offFile(this._onReceivedFile);
      }

      onDestroy?.apply(this, opts);
    },
    request(data) {
      return messaging.request(data)
    },
    httpRequest(data) {
      return messaging.request({
        method: 'http.request',
        params: data,
      })
    },
    call(data) {
      return messaging.call(data)
    },
    sendFile(path, opts) {
      return fileTransferLib.sendFile(path, opts)
    },
  }
}

export { BasePage };
