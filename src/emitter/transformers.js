import { rejectedFlagger } from "./rejectedFlagger.js"

export const syncTransformer = (callback) => {
  let returnValue
  callback((arg) => {
    returnValue = arg
  })
  return returnValue
}

export const asyncTransformer = (callback) => {
  return new Promise((resolve, reject) => {
    callback((arg) => {
      const { flagged, value } = rejectedFlagger.inspect(arg)
      if (flagged) {
        reject(value)
      } else {
        resolve(value)
      }
    })
  })
}
