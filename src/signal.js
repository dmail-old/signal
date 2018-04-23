// https://github.com/dmail-old/notifier/blob/master/index.js
// https://github.com/cowboy/jquery-throttle-debounce/blob/master/jquery.ba-throttle-debounce.js
// https://github.com/kriskowal/gtor/blob/master/signals.md
// https://remysharp.com/2010/07/21/throttling-function-calls

import { emitterSerie, emitterSerieThenable } from "./emitters"

const recursiveMessage = `emit called recursively, its often the sign of an error.
You can disable his recursive check doing createSignal({ recursed: null })`

export const warnOnRecursed = () => console.warn(recursiveMessage)
export const throwOnRecursed = () => {
  throw new Error(recursiveMessage)
}

export const createSignal = (
  { recursed = warnOnRecursed, installer, smart = false, emitter = emitterSerie } = {},
) => {
  const signal = {}

  let listeners = []
  let emitExecution
  const isEmitting = () => emitExecution && emitExecution.isPending()

  const getEmitExecution = () => emitExecution

  let lastEmittedArgs
  const emit = (...args) => {
    if (isEmitting() && recursed) {
      recursed()
    }
    if (smart) {
      lastEmittedArgs = args
    }

    const emitExecutionFactory = emitter({
      // we slice here in case some listener are removed so that
      // emitExecution listeners array is not mutated
      listeners: listeners.slice(),
      args,
    })
    emitExecution = emitExecutionFactory.start()

    return emitExecutionFactory.unwrap((fn) =>
      emitExecution.whenDone((value) => {
        emitExecution = undefined
        fn(value)
      }),
    )
  }

  let installed = false
  let uninstaller
  const install = () => {
    installed = true
    if (installer) {
      uninstaller = installer(signal)
    }
  }

  const uninstall = () => {
    installed = false
    if (uninstaller) {
      uninstaller()
      uninstaller = null
    }
  }

  const removeAllWhileCalling = (fn) => {
    const beforeCallListeners = listeners.slice()
    listeners.length = 0
    uninstall()

    fn()

    if (beforeCallListeners.length > 0) {
      if (listeners.length === 0) {
        // no listeners added in between
        install()
        listeners = beforeCallListeners
      } else {
        // some listener added during fn() execution
        // no need to reinstall, it has been done by added listener
        let previousIndex = 0
        beforeCallListeners.forEach((listener) => {
          if (listener.isRemoved() === false) {
            listeners.splice(previousIndex, 0, listener)
            previousIndex++
          }
        })
      }
    }
  }

  const isListened = () => listeners.length > 0

  const createListener = ({ fn, once = false }) => {
    const listener = {}

    let removed = false
    let removeReason
    let returnValue
    let stopped = false
    let stopReason

    const isRemoved = () => removed

    const remove = (reason) => {
      if (removed) {
        return false
      }

      removed = true
      removeReason = reason

      const index = listeners.indexOf(listener)
      if (index > -1) {
        // not being part of listeners is allowed and happens
        // when remove() called during fn call wrapped by removeAllWhileCalling(fn)
        // in that case no need to remove it from listeners
        listeners.splice(index, 1)
      }

      if (listeners.length === 0 && installed) {
        uninstall()
      }

      return true
    }

    const notify = (...args) => {
      removeReason = undefined
      stopped = false
      stopReason = undefined

      if (once) {
        remove("once")
      }

      returnValue = fn(...args)
      if (returnValue === false) {
        stopped = true
        stopReason = "returned false"
      }

      return {
        removed,
        removeReason,
        stopped,
        stopReason,
        value: returnValue,
      }
    }

    Object.assign(listener, {
      fn,
      remove,
      isRemoved,
      notify,
    })

    return Object.freeze(listener)
  }

  const createListenAPI = (createListener) => (fn) => {
    const existingListener = listeners.find((listener) => listener.fn === fn)
    if (existingListener) {
      return existingListener
    }

    const listener = createListener(fn)
    listeners.push(listener)
    if (listeners.length === 1 && installed === false) {
      install()
    }
    if (smart && lastEmittedArgs) {
      listener.notify(...lastEmittedArgs)
    }

    return listener
  }

  const listen = createListenAPI((fn) => createListener({ fn }))

  const listenOnce = createListenAPI((fn) => createListener({ fn, once: true }))

  Object.assign(signal, {
    isListened,
    listen,
    listenOnce,
    isEmitting,
    emit,
    getEmitExecution,
    removeAllWhileCalling,
  })

  return Object.freeze(signal)
}

export const createAsyncSignal = (options = {}) =>
  createSignal({
    emitter: emitterSerieThenable,
    ...options,
  })
