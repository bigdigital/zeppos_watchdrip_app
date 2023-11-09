export function getFileTransfer(fileTransfer) {
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
        const file = fileTransfer.inbox.getNextFile()
        cb && cb(file)
      })
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
        const file = fileTransfer.inbox.getNextFile()
        cb && cb(file)
      })
      return this
    },
    emitFile() {
      fileTransfer.inbox.emit('file')
      return this
    },
    offFile() {
      if (typeof fileTransfer === 'undefined') {
        return this
      }

      fileTransfer.inbox.off('newfile')
      fileTransfer.inbox.off('file')
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
