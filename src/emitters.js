export const createEmitter = ({ invoke, unwrap }) => {
  return ({ listeners, args }) => {
    const start = () => {
      let callback
      let isDone = false
      let doneValue

      const done = (value) => {
        if (isDone) {
          return
        }
        isDone = true
        if (callback) {
          callback(value)
          callback = undefined
        } else {
          doneValue = value
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
            values.push(result.value)

            if (result.stopped) {
              done(values)
              return
            }

            if (result.removed === false) {
              index++
              visit()
            }
          },
        })
      }

      visit()

      const shortcircuit = (value) => {
        done(value)
      }

      const whenDone = (fn) => {
        if (isDone) {
          fn(doneValue)
          doneValue = undefined
        } else {
          callback = fn
        }
      }

      return {
        getIndex: () => index,
        isPending: () => isDone === false,
        getArguments: () => args,
        getReturnValue: () => values,
        shortcircuit,
        whenDone,
      }
    }

    return {
      start,
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
  invoke: ({ fn, done }) =>
    new Promise((resolve) => {
      resolve(fn())
    }).then((result) =>
      Promise.resolve(result.value).then((value) => {
        done({
          ...result,
          value,
        })
      }),
    ),
  unwrap: (callback) =>
    new Promise((resolve) => {
      callback(resolve)
    }),
})
