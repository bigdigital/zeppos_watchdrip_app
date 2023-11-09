const pluginService = {
  init() {
    this.plugins = []
    this.settings = {}
    this.mixins = []
  },
  set(setting, val) {
    if (arguments.length === 1) {
      return this.settings[setting]
    }

    this.settings[setting] = val
  },
  use(plugin, ...args) {
    if (typeof plugin === 'function') {
      this.plugins.push({
        handler: plugin,
        args,
      })
    } else if (typeof plugin === 'object') {
      this.mixins.push({
        handler: plugin,
        args: [],
      })
    }
    return this
  },
  handle(instance) {
    this.plugins.forEach((p) => {
      if (!p) return
      if (typeof p.handler === 'function') {
        p.handler.call(this, instance, ...p.args)
      }
    })

    this.mixins.forEach(
      ({
        handler: {
          onInit,
          onPause,
          build,
          onResume,
          onDestroy,
          onCreate,
          ...methods
        },
        args,
      }) => {
        Object.assign(instance, methods)
      },
    )
  },
}

export { pluginService }
