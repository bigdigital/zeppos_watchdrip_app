export const downloaderLib = {
  download(url, opts) {
    const task = network.downloader.downloadFile({
      url,
      ...opts,
    })

    return task
  },
}
