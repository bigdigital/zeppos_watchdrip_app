import { device as messagingLib } from './side-message'
import { settingsLib } from './side-settings'
import { downloaderLib } from './side-download-file'
import { fileTransferLib } from './side-file-transfer'
import { merge } from '../common/merge'
import { pluginService } from '../common/plugin-service'

const DEBUG = __DEBUG__

function addBaseURL(opts) {
  const params = {
    timeout: 10000,
    ...opts,
  }

  params.url = new URL(opts.url, params.baseURL).toString()

  return params
}

const logger = Logger.getLogger(sideService.appInfo.app.appName)

function BaseSideService({
  state = {},
  onInit,
  onRun,
  onDestroy,
  ...other
} = {}) {
  const opts = {
    state,
    ...other,
    onInit(opts) {
      this._onCall = this.onCall?.bind(this)
      this._onRequest = this.onRequest?.bind(this)
      this.messaging = messagingLib
      this.messaging.onCall(this._onCall).onRequest(this.__onRequest.bind(this))

      this._onReceivedFile = this.onReceivedFile?.bind(this)
      fileTransferLib.onSideServiceFileFinished(this._onReceivedFile)

      this._onSettingsChange = this.onSettingsChange?.bind(this)
      settingsLib.onChange(this._onSettingsChange)

      this.messaging.start()

      for (let i = 0; i <= BaseSideService.mixins.length - 1; i++) {
        const m = BaseSideService.mixins[i]
        m & m.handler.onInit?.apply(this, opts)
      }

      onInit?.apply(this, opts)

      if (typeof sideService !== 'undefined') {
        DEBUG &&
          logger.log('sideService start launchArgs=>', sideService.launchArgs)
        if (sideService.launchReasons.settingsChanged) {
          this._onSettingsChange(sideService.launchArgs)
        }

        if (sideService.launchReasons.fileTransfer) {
          fileTransferLib.emitFile()
        }
      }
    },
    onRun(opts) {
      for (let i = 0; i <= BaseSideService.mixins.length - 1; i++) {
        const m = BaseSideService.mixins[i]
        m & m.handler.onRun?.apply(this, opts)
      }
      onRun?.apply(this, opts)
    },
    onDestroy(opts) {
      if (this._onCall) {
        this.messaging.offOnCall(this._onCall)
      }

      if (this._onRequest) {
        this.messaging.offOnRequest(this._onRequest)
      }

      this.messaging.stop()

      if (this._onReceivedFile) {
        fileTransferLib.offFile(this._onReceivedFile)
      }

      if (this._onSettingsChange) {
        settingsLib.offChange(this._onSettingsChange)
      }

      onDestroy?.apply(this, opts)

      for (let i = BaseSideService.mixins.length - 1; i >= 0; i--) {
        const m = BaseSideService.mixins[i]
        m & m.handler.onDestroy?.apply(this, opts)
      }
    },
    request(data, opts = {}) {
      return this.messaging.request(data, opts)
    },
    call(data) {
      return this.messaging.call(data)
    },
    fetch(opt) {
      return fetch(addBaseURL(opt))
    },
    sendFile(path, opts) {
      return fileTransferLib.sendFile(path, opts)
    },
    download(url, opts = {}) {
      return downloaderLib.download(url, opts)
    },
    __onRequest(req, res) {
      if (req.method === 'http.request') {
        return this.httpRequestHandler(req, res)
      } else {
        return this._onRequest(req, res)
      }
    },
    httpRequestHandler(req, res) {
      return this.fetch(req.params)
        .then((result) => {
          res(null, {
            status: result.status,
            statusText: result.statusText,
            headers: result.headers,
            body: result.body,
          })
        })
        .catch((e) => {
          return res({
            code: 1,
            message: e.message,
          })
        })
    },
  }

  BaseSideService.handle(opts)

  return opts
}

merge(BaseSideService, pluginService)

BaseSideService.init()

export { BaseSideService, merge }
