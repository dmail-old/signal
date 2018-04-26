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
