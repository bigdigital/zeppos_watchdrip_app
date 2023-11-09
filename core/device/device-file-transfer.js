import { getFileTransfer } from '../common/file-transfer'
import { _r } from '../common/common'

const TransferFile = _r('@zos/ble/TransferFile')
export const fileTransferLib = getFileTransfer(new TransferFile())
