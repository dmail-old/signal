import { leftToRightCreateIterator } from "./iterators.js"

export const createEmitter = ({ createIterator = leftToRightCreateIterator, visitor }) => {
  return ({ listeners, args }) => {
    const fork = () => {
      let stopped = false
      let index = 0
      const stop = () => {
        stopped = true
      }
      let returnValue

      return {
        getIndex: () => index,
        getListeners: () => listeners,
        getArguments: () => args,
        getReturnValue: () => returnValue,
        start: (callback) =>
          visitor({
            start: (value) => {
              returnValue = value

              const iterator = createIterator({ listeners })

              const next = () => {
                if (stopped) {
                  return { done: true, value: undefined }
                }

                const result = iterator.next()
                if (result.done) {
                  return result
                }
                return {
                  done: false,
                  value: () => {
                    const returnValue = result.value.notify(...args)
                    index++
                    return returnValue
                  },
                }
              }

              const stop = (value) => {
                returnValue = value
                callback()
                return value
              }

              return { next, stop }
            },
          }),
        stop,
      }
    }

    return {
      fork,
    }
  }
}
