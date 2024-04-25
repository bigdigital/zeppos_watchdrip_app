const hasOwnProperty = Object.prototype.hasOwnProperty;

function merge(dest, src) {
  Object.getOwnPropertyNames(src).forEach(
    function forEachOwnPropertyName(name) {
      if (hasOwnProperty.call(dest, name)) {
        return
      }

      var descriptor = Object.getOwnPropertyDescriptor(src, name);
      Object.defineProperty(dest, name, descriptor);
    },
  );

  return dest
}

const pluginService = {
  init() {
    this.plugins = [];
    this.settings = {};
    this.mixins = [];
  },
  set(setting, val) {
    if (arguments.length === 1) {
      return this.settings[setting]
    }

    this.settings[setting] = val;
  },
  use(plugin, ...args) {
    if (typeof plugin === 'function') {
      this.plugins.push({
        handler: plugin,
        args,
      });
    } else if (typeof plugin === 'object') {
      this.mixins.push({
        handler: plugin,
        args: [],
      });
    }
    return this
  },
  handle(instance) {
    this.plugins.forEach((p) => {
      if (!p) return
      if (typeof p.handler === 'function') {
        const result = p.handler.call(this, instance, ...p.args);

        if (typeof result === 'object') {
          this.mixins.push({
            handler: result,
            args: [],
          });
        }
      }
    });

    this.mixins.forEach(
      ({
        handler: {
          onInit,
          onPause,
          build,
          onResume,
          onDestroy,
          onCreate,
          ...methods
        },
        args,
      }) => {
        Object.assign(instance, methods);
      },
    );
  },
};

Buffer;

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

function loggerPlugin() {
  return {
    onInit() {
      this.logger = logger.getLogger(this.name || 'Page');

      this.log = (...args) => {
        this.logger.log(...args);
      };

      this.error = (...args) => {
        if (args[0] instanceof Error) {
          this.logger.error(...args);
        } else {
          this.logger.error({}, ...args);
        }
      };

      this.debug = (...args) => {
        this.logger.debug(...args);
      };
    },
    onCreate() {
      this.logger = logger.getLogger(this.name || 'app.js');

      this.log = (...args) => {
        this.logger.log(...args);
      };

      this.error = (...args) => {
        if (args[0] instanceof Error) {
          this.logger.error(...args);
        } else {
          this.logger.error({}, ...args);
        }
      };

      this.debug = (...args) => {
        this.logger.debug(...args);
      };
    },
  }
}

function BasePage({
  state = {},
  onInit,
  onResume,
  onPause,
  build,
  onDestroy,
  ...other
} = {}) {
  const opts = {
    state,
    ...other,
    globalData: getApp()._options.globalData,
    onInit(...opts) {
      for (let i = 0; i <= BasePage.mixins.length - 1; i++) {
        const m = BasePage.mixins[i];
        m & m.handler.onInit?.apply(this, opts);
      }
      onInit?.apply(this, opts);
    },
    onResume(...opts) {
      for (let i = 0; i <= BasePage.mixins.length - 1; i++) {
        const m = BasePage.mixins[i];
        m & m.handler.onResume?.apply(this, opts);
      }
      onResume?.apply(this, opts);
    },
    onPause(...opts) {
      onPause?.apply(this, opts);
      for (let i = BasePage.mixins.length - 1; i >= 0; i--) {
        const m = BasePage.mixins[i];
        m & m.handler.onPause?.apply(this, opts);
      }
    },
    build(...opts) {
      for (let i = 0; i <= BasePage.mixins.length - 1; i++) {
        const m = BasePage.mixins[i];
        m & m.handler.build?.apply(this, opts);
      }
      build?.apply(this, opts);
    },
    onDestroy(...opts) {
      onDestroy?.apply(this, opts);

      for (let i = BasePage.mixins.length - 1; i >= 0; i--) {
        const m = BasePage.mixins[i];
        m & m.handler.onDestroy?.apply(this, opts);
      }
    },
  };

  BasePage.handle(opts);
  return opts
}

merge(BasePage, pluginService);

BasePage.init();

BasePage.use(loggerPlugin);

const MGR = '_$mgr$_';

class GlobalThis {
  constructor(global) {
    this.global = global;
  }

  getValue(key) {
    return this.global[key]
  }

  setValue(key, value) {
    return (this.global[key] = value)
  }

  deleteKey(key) {
    delete this.global[key];
  }
}
class AppGlobalThis extends GlobalThis {
  constructor() {
    super(__$$app$$__.__globals__.__scopedGlobals__);
  }
}

function getModuleId() {
  return __$$module$$__.id
}

function pagePlugin$2() {
  new AppGlobalThis().getValue(MGR)[getModuleId()] = {};
}

function httpRequest(data, opts = {}) {
  return this.messaging.request(
    {
      method: 'http.request',
      params: data,
    },
    opts,
  )
}

function getDeviceMessage() {
  const { messaging } = getApp()._options.globalData;
  return messaging
}

function pagePlugin$1(opts) {
  const messaging = getDeviceMessage();
  return {
    onInit() {
      this.messaging = this.state.messaging = messaging;
      this._onCall = this.onCall?.bind(this);
      this._onRequest = this.onRequest?.bind(this);
      this.messaging.onCall(this._onCall).onRequest(this._onRequest);
    },
    onDestroy() {
      if (this._onCall) {
        this.messaging.offOnCall(this._onCall);
      }

      if (this._onRequest) {
        this.messaging.offOnRequest(this._onRequest);
      }
    },
    request(data, opts = {}) {
      return this.messaging.request(data, opts)
    },
    call(data) {
      return this.messaging.call(data)
    },
    httpRequest,
  }
}

function getFileTransfer(fileTransfer) {
  /**
   *     start(newfile)------------finished(file)
   *     device supported newfile and file
   *     side supported file
   */
  return {
    canUseFileTransfer() {
      if (typeof fileTransfer === 'undefined') {
        console.log('WARNING: FileTransfer require API_LEVEL 3.0');
        return false
      }
      return true
    },
    onFile(cb) {
      if (!cb) {
        return this
      }

      if (!this.canUseFileTransfer()) {
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

      if (!this.canUseFileTransfer()) {
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
      if (!this.canUseFileTransfer()) {
        return this
      }

      fileTransfer.inbox.off('newfile');
      fileTransfer.inbox.off('file');
      return this
    },
    getFile() {
      if (!this.canUseFileTransfer()) {
        return null
      }

      return fileTransfer.inbox.getNextFile()
    },
    sendFile(path, opts) {
      if (!this.canUseFileTransfer()) {
        throw new Error('fileTransfer is not available')
      }

      return fileTransfer.outbox.enqueueFile(path, opts)
    },
  }
}

const TransferFile = _r('@zos/ble/TransferFile');
const fileTransferLib = getFileTransfer(
  TransferFile ? new TransferFile() : undefined,
);

function pagePlugin(opts) {
  return {
    onInit() {
      this._onReceivedFile = this.onReceivedFile?.bind(this);
      fileTransferLib.onFile(this._onReceivedFile);
    },
    onDestroy() {
      if (this._onReceivedFile) {
        fileTransferLib.offFile(this._onReceivedFile);
      }
    },
    sendFile(path, opts) {
      return fileTransferLib.sendFile(path, opts)
    },
  }
}

BasePage.use(pagePlugin$2).use(pagePlugin$1).use(pagePlugin);

export { BasePage };
