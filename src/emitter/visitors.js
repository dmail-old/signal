import { rejectedFlagger } from "./rejectedFlagger.js"

export const syncSerialVisitor = ({ fn, done }) => {
  const { next, value } = fn()
  done(value)
  next()
}

export const asyncSerialVisitor = ({ fn, done, shortcircuit }) => {
  let next
  new Promise((resolve) => {
    const result = fn()
    next = result.next
    resolve(result.value)
  }).then(
    (value) => {
      done(value)
      next()
    },
    (reason) => {
      shortcircuit(rejectedFlagger.flag(reason))
    },
  )
}

export const asyncSimultaneousVisitor = ({ fn, done, shortcircuit }) => {
  new Promise((resolve) => {
    const result = fn()
    result.next()
    resolve(result.value)
  }).then(done, (reason) => {
    shortcircuit(rejectedFlagger.flag(reason))
  })
}
