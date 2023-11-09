import { MessageBuilder } from '../../shared/message'
import { wrapperMessage } from '../common/message'
import { getPackageInfo } from '../common/common'

const appDevicePort = 20
const appSidePort = 0

export function createDeviceMessage() {
  const messageBuilder = new MessageBuilder({
    appId: getPackageInfo().appId,
    appDevicePort,
    appSidePort,
  })

  return wrapperMessage(messageBuilder)
}

export function getDeviceMessage() {
  const { messaging } = getApp()._options.globalData
  return messaging
}
