export const syncSerialVisitor = ({ start }) => {
  const resultValue = []
  const { next, end } = start(resultValue)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const entry = next()
    if (entry.done) {
      break
    }
    resultValue.push(entry.value())
  }

  return end(resultValue)
}

export const asyncSerialVisitor = ({ start }) => {
  const resultValue = []
  return new Promise((resolve, reject) => {
    const { next, end } = start(resultValue)

    const visit = () => {
      const entry = next()
      if (entry.done) {
        return resolve(end(resultValue))
      }

      Promise.resolve(entry.value())
        .then((value) => {
          resultValue.push(value)
          visit()
        })
        // we use catch instead ot then 2nd argument in case visit() throw
        .catch(reject)
    }

    visit()
  })
}

export const asyncSimultaneousVisitor = ({ start }) => {
  const resultValue = []
  return new Promise((resolve, reject) => {
    const { next, end } = start(resultValue)

    let visitCallCount = 0
    let passedCount = 0
    const visit = (index) => {
      const entry = next()
      if (entry.done) {
        // empty iteration
        if (index === 0) {
          return resolve(end(resultValue))
        }
        // else awaits for all pending iteration
        return
      }
      visitCallCount++

      // entry.value() must be called before next call to visit
      // so that getEmitExecution().getIndex() is the right one
      // and getEmitExecution().stop() can still prevent execution
      // of next listeners
      const returnValue = entry.value()
      visit(index + 1)
      Promise.resolve(returnValue).then((value) => {
        passedCount++
        resultValue[index] = value
        if (passedCount === visitCallCount) {
          resolve(end(resultValue))
        }
      }, reject)
    }

    visit(0)
  })
}

export const someAsyncListenerResolvesWith = (predicate) => ({ start }) => {
  return new Promise((resolve, reject) => {
    const { next, end } = start(false)

    const visit = () => {
      const entry = next()
      if (entry.done) {
        return resolve(end(false))
      }

      return Promise.resolve(entry.value())
        .then((value) => {
          if (predicate(value)) {
            return resolve(end(true))
          }
          visit()
        })
        .catch(reject)
    }

    visit()
  })
}
