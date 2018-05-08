import { leftToRightCreateIterator, rightToLeftCreateIterator } from "./iterators.js"
import {
  syncSerialVisitor,
  asyncSerialVisitor,
  asyncSimultaneousVisitor,
  someAsyncListenerResolvesWith,
} from "./visitors.js"

export { leftToRightCreateIterator, rightToLeftCreateIterator }

export {
  syncSerialVisitor,
  asyncSerialVisitor,
  asyncSimultaneousVisitor,
  someAsyncListenerResolvesWith,
}

export const serialEmitter = (param) => ({
  iterator: leftToRightCreateIterator(param),
  visitor: syncSerialVisitor,
})

export const reverseSerialEmitter = (param) => ({
  iterator: rightToLeftCreateIterator(param),
  visitor: syncSerialVisitor,
})

export const asyncSerialEmitter = (param) => ({
  iterator: leftToRightCreateIterator(param),
  visitor: asyncSerialVisitor,
})

export const asyncSimultaneousEmitter = (param) => ({
  iterator: leftToRightCreateIterator(param),
  visitor: asyncSimultaneousVisitor,
})
