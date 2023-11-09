const hasOwnProperty = Object.prototype.hasOwnProperty

export function merge(dest, src) {
  Object.getOwnPropertyNames(src).forEach(
    function forEachOwnPropertyName(name) {
      if (hasOwnProperty.call(dest, name)) {
        return
      }

      var descriptor = Object.getOwnPropertyDescriptor(src, name)
      Object.defineProperty(dest, name, descriptor)
    },
  )

  return dest
}
