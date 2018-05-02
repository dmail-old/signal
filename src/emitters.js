import { createEmitter } from "./emitter/createEmitter.js"
import { rightToLeftCreateIterator } from "./emitter/iterators.js"
import {
  syncSerialVisitor,
  asyncSerialVisitor,
  asyncSimultaneousVisitor,
} from "./emitter/visitors.js"

export const serialEmitter = createEmitter({
  visitor: syncSerialVisitor,
})

export const reverseSerialEmitter = createEmitter({
  createIterator: rightToLeftCreateIterator,
  visitor: syncSerialVisitor,
})

export const asyncSerialEmitter = createEmitter({
  visitor: asyncSerialVisitor,
})

export const asyncSimultaneousEmitter = createEmitter({
  visitor: asyncSimultaneousVisitor,
})
