import { emitterFactory } from "./emitter/emitterFactory.js"
import { rightToLeftCreateIterator } from "./emitter/iterators.js"
import { syncTransformer, asyncTransformer } from "./emitter/transformers.js"
import {
  syncSerialVisitor,
  asyncSerialVisitor,
  asyncSimultaneousVisitor,
} from "./emitter/visitors.js"

export const createEmitter = (options) =>
  emitterFactory({
    transformer: syncTransformer,
    ...options,
  })

export const createAsyncEmitter = (options) =>
  emitterFactory({
    transformer: asyncTransformer,
    ...options,
  })

export const serialEmitter = createEmitter({
  visitor: syncSerialVisitor,
})

export const reverseSerialEmitter = createEmitter({
  createIterator: rightToLeftCreateIterator,
  visitor: syncSerialVisitor,
})

export const asyncSerialEmitter = createAsyncEmitter({
  visitor: asyncSerialVisitor,
})

export const asyncSimultaneousEmitter = createAsyncEmitter({
  visitor: asyncSimultaneousVisitor,
})
