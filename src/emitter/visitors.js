export const syncSerialVisitor = ({ start }) => {
  const resultValue = []
  const { next, stop } = start(resultValue)

  let entry
  // eslint-disable-next-line no-cond-assign
  while ((entry = next())) {
    if (entry.done) {
      break
    }
    resultValue.push(entry.value())
  }

  return stop(resultValue)
}

export const asyncSerialVisitor = ({ start }) => {
  const resultValue = []
  const { next, stop } = start(resultValue)

  const visit = () => {
    const entry = next()
    if (entry.done) {
      stop()
      return
    }

    return Promise.resolve(entry.value()).then((value) => {
      resultValue.push(value)
      return visit()
    })
  }

  return new Promise((resolve) => resolve(visit())).then(() => resultValue)
}

export const asyncSimultaneousVisitor = ({ start }) => {
  const resultValue = []
  return new Promise((resolve, reject) => {
    const { next, stop } = start(resultValue)
    let visitCallCount = 0
    let passedCount = 0

    const visit = (index) => {
      const result = next()
      if (result.done) {
        // empty iteration
        if (index === 0) {
          return resolve(stop(resultValue))
        }
        // else awaits for all pending iteration
        return
      }
      visitCallCount++

      const returnValue = result.value()
      visit(index + 1)
      Promise.resolve(returnValue).then((value) => {
        passedCount++
        resultValue[index] = value
        if (passedCount === visitCallCount) {
          resolve(stop(resultValue))
        }
      }, reject)
    }

    visit(0)
  })
}

export const someAsyncListenerResolvesWith = (predicate) => ({ start }) => {
  const { next, stop } = start(false)

  const visit = () => {
    const result = next()
    if (result.done) {
      return stop(false)
    }

    return Promise.resolve(result.value()).then((value) => {
      if (predicate(value)) {
        return stop(true)
      }
      return visit()
    })
  }

  return new Promise((resolve) => resolve(visit()))
}

// l'idée de ce truc ci-dessous c'est une série jusqu'à trouver une valeur
// lorsqu'on trouve cette valeur on la retourne, uniquement celle-ci
// export const createAsyncSerialVisitorUntil = () => {}
