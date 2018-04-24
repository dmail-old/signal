const defaultCreateIterator = ({ listeners }) => {
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

const defaultInvoke = ({ fn, done }) => done(fn())

const defaultUnwrap = (callback) => {
  let value
  callback((arg) => {
    value = arg
  })
  return value
}

export const createSerialEmitter = ({
  createIterator = defaultCreateIterator,
  invoke = defaultInvoke,
  unwrap = defaultUnwrap,
}) => {
  return ({ listeners, args }) => {
    const fork = () => {
      let callback
      let isDone = false
      let stopped = false
      let returnValue = []

      const done = () => {
        isDone = true
        callback(returnValue)
        callback = undefined
      }

      const iterator = createIterator({ listeners })

      let index = 0
      const visit = () => {
        const nextResult = iterator.next()

        if (nextResult.done) {
          done(returnValue)
          return
        }

        const listener = nextResult.value
        invoke({
          fn: () => listener.notify(...args),
          done: (result) => {
            if (isDone) {
              return
            }
            returnValue.push(result)

            if (stopped) {
              done(returnValue)
              return
            }

            index++
            visit()
          },
        })
      }

      const shortcircuit = (value) => {
        returnValue = value
        done(value)
      }

      const stop = () => {
        stopped = true
      }

      return {
        getIndex: () => index,
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
      unwrap,
    }
  }
}

export const serialEmitter = createSerialEmitter({})

export const serialEmitterWithPromise = createSerialEmitter({
  invoke: ({ fn, done }) => new Promise((resolve) => resolve(fn())).then(done),
  unwrap: (callback) => new Promise((resolve) => callback(resolve)),
})
