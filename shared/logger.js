import { isZeppOS1, isZeppOS2, isSideService, _r } from '../core/common/common'

let logger = null

if (isZeppOS1()) {
  // zeppos 1.0
  logger = DeviceRuntimeCore.HmLogger
} else if (isZeppOS2()) {
  // zeppos 2.0
  logger = _r('@zos/utils').log
} else if (isSideService()) {
  // side service 1.0
  if (typeof Logger !== 'undefined') {
    logger = Logger
  }
}

export { logger as Logger }
