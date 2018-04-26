import { leftToRightCreateIterator } from "./iterators.js"

export const emitterFactory = ({
  createIterator = leftToRightCreateIterator,
  visitor,
  transformer,
}) => {
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

      const shortcircuit = (value) => {
        returnValue = value
        end()
      }

      // we'll need 3 counter to know when we are done
      // because serial visitor are done when last next() is called
      // and simultaneous visitor when the last done() is called
      let visitorCallCount = 0
      let doneCallCount = 0
      let nextCallCount = 0

      const stop = () => {
        stopped = true
        stoppedAt = nextCallCount
      }

      const visit = () => {
        const nextResult = iterator.next()

        if (!nextResult.done) {
          const listener = nextResult.value
          const visitIndex = nextCallCount

          visitor({
            shortcircuit,
            fn: () => {
              const value = listener.notify(...args)

              const next = () => {
                nextCallCount++
                if (ended) {
                  return
                }
                if (stopped) {
                  return
                }
                visit()
              }

              return { value, next }
            },
            done: (result) => {
              doneCallCount++
              if (ended) {
                return
              }

              returnValue[visitIndex] = result
              if (stopped) {
                // nan il manque le fait qu'on attend ce qui est avant ce qui est stop, je pense
                // donc pour qu'on ai fini il faut que tout ce qui est en startIndex (donc 0)
                // et stoppedAt soit done
                // ou alors on s'en fous, je dirais on s'en fous en fait
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
