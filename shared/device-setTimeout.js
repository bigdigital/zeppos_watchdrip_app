import { _r } from '../core/common/common'

const _setTimeout = _r('@zos/timer').setTimeout
const _clearTimeout = _r('@zos/timer').clearTimeout

export { _setTimeout as setTimeout, _clearTimeout as clearTimeout }
