export const createEmitter = ({ invoke, unwrap }) => {
  return ({ listeners, args }) => {
    const fork = () => {
      let callback
      let isDone = false
      let stopped = false

      const done = (value) => {
        if (isDone) {
          return
        }
        isDone = true
        if (callback) {
          callback(value)
          callback = undefined
        }
      }

      let index = 0
      const values = []
      const visit = () => {
        if (index >= listeners.length) {
          done(values)
          return
        }

        const listener = listeners[index]

        invoke({
          fn: () => listener.notify(...args),
          done: (result) => {
            if (isDone) {
              return
            }
            values.push(result)

            if (stopped) {
              done(values)
              return
            }

            index++
            visit()
          },
        })
      }

      const shortcircuit = (value) => {
        done(value)
      }

      const stop = () => {
        stopped = true
      }

      return {
        getIndex: () => index,
        getListeners: () => listeners,
        getArguments: () => args,
        getReturnValue: () => values,
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

export const emitterSerie = createEmitter({
  invoke: ({ fn, done }) => done(fn()),
  unwrap: (callback) => {
    let value
    callback((arg) => {
      value = arg
    })
    return value
  },
})

export const emitterSerieThenable = createEmitter({
  invoke: ({ fn, done }) => new Promise((resolve) => resolve(fn())).then(done),
  unwrap: (callback) => new Promise((resolve) => callback(resolve)),
})
