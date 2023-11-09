import { getDeviceMessage } from './device-message'
import { fileTransferLib } from './device-file-transfer'
import { merge } from '../common/merge'
import { pluginService } from '../common/plugin-service'
import { httpRequestPlugin } from './httpRequest'

function BasePage({
  state = {},
  onInit,
  onResume,
  onPause,
  build,
  onDestroy,
  ...other
} = {}) {
  const messaging = getDeviceMessage()

  const opts = {
    state,
    ...other,
    globalData: getApp()._options.globalData,
    onInit(...opts) {
      this._onCall = this.onCall?.bind(this)
      this._onRequest = this.onRequest?.bind(this)
      this.messaging = messaging
      this.messaging.onCall(this._onCall).onRequest(this._onRequest)

      if (this.onReceivedFile) {
        this._onReceivedFile = this.onReceivedFile?.bind(this)
        fileTransferLib.onFile(this._onReceivedFile)
      }

      for (let i = 0; i <= BasePage.mixins.length - 1; i++) {
        const m = BasePage.mixins[i]
        m & m.handler.onInit?.apply(this, opts)
      }

      onInit?.apply(this, opts)
    },
    onResume(...opts) {
      for (let i = 0; i <= BasePage.mixins.length - 1; i++) {
        const m = BasePage.mixins[i]
        m & m.handler.onResume?.apply(this, opts)
      }
      onResume?.apply(this, opts)
    },
    onPause(...opts) {
      onPause?.apply(this, opts)
      for (let i = BasePage.mixins.length - 1; i >= 0; i--) {
        const m = BasePage.mixins[i]
        m & m.handler.onPause?.apply(this, opts)
      }
    },
    build(...opts) {
      for (let i = 0; i <= BasePage.mixins.length - 1; i++) {
        const m = BasePage.mixins[i]
        m & m.handler.build?.apply(this, opts)
      }
      build?.apply(this, opts)
    },
    onDestroy(...opts) {
      onDestroy?.apply(this, opts)

      for (let i = BasePage.mixins.length - 1; i >= 0; i--) {
        const m = BasePage.mixins[i]
        m & m.handler.onDestroy?.apply(this, opts)
      }

      if (this._onCall) {
        this.messaging.offOnCall(this._onCall)
      }

      if (this._onRequest) {
        this.messaging.offOnRequest(this._onRequest)
      }

      if (this._onReceivedFile) {
        fileTransferLib.offFile(this._onReceivedFile)
      }
    },
    request(data, opts = {}) {
      return this.messaging.request(data, opts)
    },
    call(data) {
      return this.messaging.call(data)
    },
    sendFile(path, opts) {
      return fileTransferLib.sendFile(path, opts)
    },
  }

  BasePage.handle(opts)

  return opts
}

merge(BasePage, pluginService)

BasePage.init()
BasePage.use(httpRequestPlugin)

export { BasePage, merge }
