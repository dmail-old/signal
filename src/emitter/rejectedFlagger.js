const createFlagger = () => {
  const flagName = "flag"
  const valueName = "value"
  const flagValue = {}

  const flag = (value) => {
    return {
      [flagName]: flagValue,
      [valueName]: value,
    }
  }

  const inspect = (value) => {
    if (value === null) {
      return {
        flagged: false,
        value,
      }
    }
    if (typeof value !== "object") {
      return {
        flagged: false,
        value,
      }
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, flagName)
    if (descriptor === undefined) {
      return {
        flagged: false,
        value,
      }
    }
    const descriptorValue = descriptor.value
    if (descriptorValue !== flagValue) {
      return {
        flagged: false,
        value,
      }
    }
    return {
      flagged: true,
      value: value[valueName],
    }
  }

  return {
    flag,
    inspect,
  }
}

export const rejectedFlagger = createFlagger()
