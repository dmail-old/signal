export const leftToRightCreateIterator = ({ listeners }) => {
  let index = 0
  return {
    next: () => {
      if (index === listeners.length) {
        return {
          done: true,
          value: undefined,
        }
      }
      const listener = listeners[index]
      index++
      return {
        done: false,
        value: listener,
      }
    },
  }
}

export const rightToLeftCreateIterator = ({ listeners }) => {
  let index = listeners.length
  return {
    next: () => {
      if (index === 0) {
        return {
          done: true,
          value: undefined,
        }
      }
      index--
      return {
        done: false,
        value: listeners[index],
      }
    },
  }
}

const emitterFactory = ({ createIterator = leftToRightCreateIterator, visitor, transformer }) => {
  return ({ listeners, args }) => {
    const fork = () => {
      let callback
      let ended = false
      let stopped = false
      let stoppedAt
      let returnValue = []

      const end = () => {
        ended = true
        callback(returnValue)
        callback = undefined
      }

      const iterator = createIterator({ listeners })

      // we'll need 3 counter to know when we are done
      // because serial visitor are done when last next() is called
      // and simultaneous visitor when the last done() is called
      let visitorCallCount = 0
      let doneCallCount = 0
      let nextCallCount = 0

      const visit = () => {
        const nextResult = iterator.next()

        if (!nextResult.done) {
          const listener = nextResult.value
          const visitIndex = nextCallCount

          visitor({
            fn: () => listener.notify(...args),
            done: (result) => {
              doneCallCount++
              if (ended) {
                return
              }

              returnValue[visitIndex] = result
              if (stopped) {
                if (visitIndex === stoppedAt) {
                  end()
                }
                return
              }

              // last done() called by a simultaneous visitor
              if (doneCallCount === visitorCallCount && doneCallCount === nextCallCount) {
                end()
              }
            },
            next: () => {
              nextCallCount++
              if (ended) {
                return
              }
              if (stopped) {
                // il faut différencier simultanée et serie ici aussi ?
                return
              }
              visit()
            },
          })
          visitorCallCount++
        }

        // when a listener calls stop() or shortcircuit()
        if (ended) {
          return
        }
        // - when all listener calls done() synchronously
        // - there is no listener
        // - last next() called by a serial visitor
        if (doneCallCount === visitorCallCount && doneCallCount === nextCallCount) {
          end()
        }
      }

      const shortcircuit = (value) => {
        returnValue = value
        end()
      }

      const stop = () => {
        stopped = true
        stoppedAt = nextCallCount
      }

      return {
        getIndex: () => nextCallCount,
        getListeners: () => listeners,
        getArguments: () => args,
        getReturnValue: () => returnValue,
        shortcircuit,
        start: (fn) => {
          callback = fn
          visit()
        },
        stop,
      }
    }

    return {
      fork,
      unwrap: transformer,
    }
  }
}

export const syncTransformer = (callback) => {
  let returnValue
  callback((arg) => {
    returnValue = arg
  })
  return returnValue
}

export const asyncTransformer = (callback) => {
  return new Promise((resolve) => callback(resolve))
}

export const createEmitter = (options) =>
  emitterFactory({
    transformer: syncTransformer,
    ...options,
  })

export const createAsyncEmitter = (options) =>
  emitterFactory({
    transformer: asyncTransformer,
    ...options,
  })

export const syncSerialVisitor = ({ fn, done, next }) => {
  done(fn())
  next()
}

export const asyncSerialVisitor = ({ fn, done, next }) => {
  new Promise((resolve) => resolve(fn())).then((value) => {
    done(value)
    next()
  })
}

export const asyncSimultaneousVisitor = ({ fn, done, next }) => {
  new Promise((resolve) => resolve(fn())).then(done)
  next()
}

export const serialEmitter = createEmitter({
  visitor: syncSerialVisitor,
})

export const asyncSerialEmitter = createAsyncEmitter({
  visitor: asyncSerialVisitor,
})

export const asyncSimultaneousEmitter = createAsyncEmitter({
  visitor: asyncSimultaneousVisitor,
})

export const reverseSerialEmitter = createEmitter({
  createIterator: rightToLeftCreateIterator,
  visitor: syncSerialVisitor,
})
