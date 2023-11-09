import { Logger } from '../../shared/logger'
import { isZeppOS } from './common'

const logger = Logger.getLogger('message-builder')

const shakeTimeout = 5000
const requestTimeout = 60000

const DEBUG = __DEBUG__

export function wrapperMessage(messageBuilder) {
  return {
    shakeTimeout,
    requestTimeout,
    onCall(cb) {
      if (!cb) return this
      messageBuilder.on('call', ({ payload }) => {
        const jsonRpc = messageBuilder.buf2Json(payload)
        cb && cb(jsonRpc)
      })

      return this
    },
    offOnCall(cb) {
      messageBuilder.off('call', cb)
      return this
    },
    call(data) {
      isZeppOS() && messageBuilder.fork(this.shakeTimeout)
      return messageBuilder.call({
        jsonrpc: 'hmrpcv1',
        ...data,
      })
    },
    onRequest(cb) {
      if (!cb) return this
      messageBuilder.on('request', (ctx) => {
        const jsonRpc = messageBuilder.buf2Json(ctx.request.payload)
        cb &&
          cb(jsonRpc, (error, data) => {
            if (error) {
              return ctx.response({
                data: {
                  error,
                },
              })
            }

            return ctx.response({
              data: {
                result: data,
              },
            })
          })
      })

      return this
    },
    cancelAllRequest() {
      messageBuilder.off('response')
      return this
    },
    offOnRequest(cb) {
      messageBuilder.off('request', cb)
      return this
    },
    request(data) {
      isZeppOS() && messageBuilder.fork(this.shakeTimeout)
      DEBUG &&
        logger.debug(
          'current request count=>%d',
          messageBuilder.getRequestCount(),
        )
      return messageBuilder
        .request(
          {
            jsonrpc: 'hmrpcv1',
            ...data,
          },
          {
            timeout: this.requestTimeout,
          },
        )
        .then(({ error, result }) => {
          if (error) {
            throw error
          }

          return result
        })
    },
    // 设备接口
    connect() {
      messageBuilder.connect(() => {
        DEBUG &&
          logger.debug('DeviceApp messageBuilder connect with SideService')
      })
      return this
    },
    disConnect() {
      this.cancelAllRequest()
      this.offOnRequest()
      this.offOnCall()
      messageBuilder.disConnect(() => {
        DEBUG && logger.debug('DeviceApp messageBuilder disconnect SideService')
      })
      return this
    },
    // 伴生服务接口
    start() {
      messageBuilder.listen(() => {
        DEBUG &&
          logger.debug(
            'SideService messageBuilder start to listen to DeviceApp',
          )
      })
      return this
    },
    stop() {
      this.cancelAllRequest()
      this.offOnRequest()
      this.offOnCall()
      messageBuilder.disConnect(() => {
        DEBUG &&
          logger.debug('SideService messageBuilder stop to listen to DeviceApp')
      })
      return this
    },
  }
}
