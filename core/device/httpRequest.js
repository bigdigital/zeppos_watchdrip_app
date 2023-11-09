export function httpRequestPlugin(opts) {
  opts.httpRequest = function httpRequest(data, opts = {}) {
    return this.messaging.request(
      {
        method: 'http.request',
        params: data,
      },
      opts,
    )
  }
}
