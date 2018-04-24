// https://github.com/dmail-old/notifier/blob/master/index.js
// https://github.com/cowboy/jquery-throttle-debounce/blob/master/jquery.ba-throttle-debounce.js
// https://github.com/kriskowal/gtor/blob/master/signals.md
// https://remysharp.com/2010/07/21/throttling-function-calls

import { serialEmitter, serialEmitterWithPromise } from "./emitters"

const recursiveMessage = `emit called recursively, its often the sign of an error.
You can disable his recursive check doing createSignal({ recursed: null })`

export const warnOnRecursed = () => console.warn(recursiveMessage)
export const throwOnRecursed = () => {
  throw new Error(recursiveMessage)
}

export const createSignal = (
  { recursed = warnOnRecursed, installer, smart = false, emitter = serialEmitter } = {},
) => {
  const signal = {}

  const listeners = []
  let emitExecution
  const isEmitting = () => Boolean(emitExecution)

  const getEmitExecution = () => emitExecution

  let lastEmittedArgs
  const emit = (...args) => {
    if (isEmitting() && recursed) {
      recursed()
    }
    if (smart) {
      lastEmittedArgs = args
    }

    const enabledListeners = []
    // create a new array in case listeners array gets mutated during emit by listener.remove()
    // we also push only enabled listener
    listeners.forEach((listener) => {
      if (listener.isEnabled()) {
        enabledListeners.push(listener)
      }
    })

    const emitExecutionFactory = emitter({
      listeners: enabledListeners,
      args,
    })
    emitExecution = emitExecutionFactory.fork()
    return emitExecutionFactory.unwrap((fn) => {
      emitExecution.start((value) => {
        emitExecution = undefined
        fn(value)
      })
    })
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

  const disableUntil = () => {
    const disabledListeners = listeners.map((listener) => {
      listener.disable()
      return listener
    })
    const someListenerDisabled = disabledListeners.length > 0
    if (installed) {
      uninstall()
    }

    return () => {
      if (someListenerDisabled) {
        if (installed === false && listeners.length > 0) {
          install()
        }
        disabledListeners.forEach((disabledListener) => {
          disabledListener.enable()
        })
      }
    }
  }

  const disableWhileCalling = (fn) => {
    const enable = disableUntil()
    fn()
    enable()
  }

  const isListened = () => listeners.length > 0

  const createListener = ({ fn, once = false }) => {
    const listener = {}

    let removed = false
    let disabled = false

    const remove = () => {
      if (removed) {
        return false
      }
      removed = true

      const index = listeners.indexOf(listener)
      // not being inside listeners is normally impossible
      // if it happens we should throw
      listeners.splice(index, 1)

      if (listeners.length === 0 && installed) {
        uninstall()
      }

      return true
    }

    const notify = (...args) => {
      if (once) {
        remove("once")
      }

      return fn(...args)
    }

    const disable = () => {
      disabled = true
    }

    const enable = () => {
      disabled = false
    }

    const isEnabled = () => disabled === false

    Object.assign(listener, {
      fn,
      remove,
      notify,
      isEnabled,
      disable,
      enable,
    })

    return Object.freeze(listener)
  }

  const createListenAPI = (createListener) => (fn) => {
    const existingListener = listeners.find((listener) => listener.fn === fn)
    if (existingListener) {
      throw new Error(`there is already a listener for that fn on this signal`)
    }

    const listener = createListener(fn)
    listeners.push(listener)
    if (installed === false) {
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
    disableWhileCalling,
  })

  return Object.freeze(signal)
}

export const createAsyncSignal = (options = {}) =>
  createSignal({
    emitter: serialEmitterWithPromise,
    ...options,
  })
