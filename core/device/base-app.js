import { createDeviceMessage } from './device-message'
import { fileTransferLib } from './device-file-transfer'

export function BaseApp({ globalData = {}, onCreate, onDestroy, ...other } = {}) {
  return {
    globalData,
    ...other,
    onCreate(...opts) {
      const messaging = createDeviceMessage()
      this.globalData.messaging = messaging

      messaging
        .onCall(this.onCall?.bind(this))
        .onRequest(this.onRequest?.bind(this))
        .connect()

      fileTransferLib.onFile(this.onReceivedFile?.bind(this))

      onCreate?.apply(this, opts)
    },
    onDestroy(...opts) {
      const messaging = this.globalData.messaging
      messaging.offOnCall().offOnRequest().disConnect()

      fileTransferLib.offFile()
      onDestroy?.apply(this, opts)
    },
    httpRequest(data) {
      return messaging.request({
        method: 'http.request',
        params: data,
      })
    },
  }
}
