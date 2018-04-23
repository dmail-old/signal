// https://github.com/cowboy/jquery-throttle-debounce/blob/master/unit/unit.js

import { createSignal, warnOnRecursed, throwOnRecursed, createAsyncSignal } from "./signal.js"
import { createSpy, installSpy } from "@dmail/spy"
import { test } from "@dmail/test"
import {
  expectFunction,
  expectCalledOnceWith,
  expectCalledTwiceWith,
  expectCalledExactly,
  expectCalledOnceWithoutArgument,
  expectCalledTwiceWithoutArgument,
  expectChain,
  expectTrue,
  expectFalse,
  expectNotCalled,
  expectThrowWith,
  matchErrorWith,
  matchString,
  matchProperties,
  matchFunction,
  expectPropertiesDeep,
  expectResolveWith,
} from "@dmail/expect"
import assert from "assert"

test(() => expectFunction(createSignal))

// warn on recursed
test(() => {
  const warnSpy = createSpy()
  installSpy(warnSpy, console, "warn", warnOnRecursed)
  return expectCalledOnceWith(warnSpy, matchString())
})

// throw on recursed
test(() => {
  return expectThrowWith(
    throwOnRecursed,
    matchErrorWith({
      message: matchString(),
    }),
  )
})

// listen same function only once
test(() => {
  const { listen } = createSignal()
  const fn = () => {}
  const listener = listen(fn)
  return expectTrue(listener === listen(fn))
})

// installer/uninstaller behaviour
test(() => {
  const uninstaller = createSpy("uninstaller")
  const installer = createSpy(() => uninstaller)
  const signal = createSignal({
    installer,
  })
  const removeListener = signal.listen(() => {}).remove
  const expectedInstallerArgument = matchProperties({
    emit: matchFunction(),
    removeAllWhileCalling: matchFunction(),
    callWhen: matchFunction(),
  })

  return expectChain(
    () => expectCalledOnceWith(installer, expectedInstallerArgument),
    () => removeListener(),
    () => expectCalledOnceWith(uninstaller),
    () => signal.listen(() => {}),
    () => expectCalledTwiceWith(installer, expectedInstallerArgument),
  )
})

// recursed hook
test(() => {
  const recursedSpy = createSpy()
  const { listen, emit } = createSignal({
    recursed: recursedSpy,
  })
  let emitted = false
  listen(() => {
    if (emitted === false) {
      emitted = true
      emit()
    }
  })
  emit()

  return expectCalledOnceWithoutArgument(recursedSpy)
})

// listenOnce(fn) remove the listener before calling it
test(() => {
  const { listenOnce, emit } = createSignal()
  const spy = createSpy()
  listenOnce(spy)
  emit()
  emit()
  return expectCalledOnceWithoutArgument(spy)
})

// listenOnce return previous listener on already listened fn
test(() => {
  const { listenOnce } = createSignal()
  const fn = () => {}
  const listener = listenOnce(fn)
  return expectTrue(listener === listenOnce(fn))
})

// listenOnce indicates why listener was removed
test(() => {
  const { listenOnce, emit } = createSignal()
  listenOnce(() => "foo")
  return expectPropertiesDeep(emit(), ["foo"])
})

// "same function can be listen() and listenOnce() on two different signal
test(() => {
  const firstSignal = createSignal()
  const secondSignal = createSignal()
  const spy = createSpy()

  firstSignal.listen(spy)
  secondSignal.listenOnce(spy)

  return expectChain(
    () => expectNotCalled(spy),
    () => firstSignal.emit(),
    () => expectCalledExactly(spy, 1),
    () => secondSignal.emit(),
    () => expectCalledExactly(spy, 2),
    () => secondSignal.emit(),
    () => expectCalledExactly(spy, 2),
    () => firstSignal.emit(),
    () => expectCalledExactly(spy, 3),
  )
})

// emit(...args) call listener with args
test(() => {
  const { listen, emit } = createSignal()
  const spy = createSpy()
  const value = 1
  listen(spy)
  emit(value)

  return expectCalledOnceWith(spy, value)
})

// emit() call all listeners
test(() => {
  const { listen, emit } = createSignal()
  const value = 1
  const firstSpy = createSpy()
  const secondSpy = createSpy()
  listen(firstSpy)
  listen(secondSpy)
  emit(value)

  return expectChain(
    () => expectCalledOnceWith(firstSpy, value),
    () => expectCalledOnceWith(secondSpy, value),
  )
})

// removeListener() called on first listener during emit
test(() => {
  let removeFirstListener
  const a = createSpy(() => removeFirstListener())
  const b = createSpy()
  const { listen, emit } = createSignal()
  removeFirstListener = listen(a).remove
  listen(b)
  emit()
  emit()
  return expectChain(
    () => expectCalledOnceWithoutArgument(a),
    () => expectCalledTwiceWithoutArgument(b),
  )
})

// removeListener() called on last listener during emit
test(() => {
  let removeLastListener
  const a = createSpy()
  const b = createSpy(() => removeLastListener())
  const { listen, emit } = createSignal()
  listen(a)
  removeLastListener = listen(b).remove
  emit()
  emit()
  return expectChain(
    () => expectCalledTwiceWithoutArgument(a),
    () => expectCalledOnceWithoutArgument(b),
  )
})

// removeListener() called on middle listener during emit
test(() => {
  let removeMiddleListener
  const a = createSpy()
  const b = createSpy(() => removeMiddleListener())
  const c = createSpy()
  const { listen, emit } = createSignal()
  listen(a)
  removeMiddleListener = listen(b).remove
  listen(c)
  emit()
  emit()

  return expectChain(
    () => expectCalledTwiceWithoutArgument(a),
    () => expectCalledOnceWithoutArgument(b),
    () => expectCalledTwiceWithoutArgument(c),
  )
})

// removeListener() called on already removed listener
test(() => {
  const { listen } = createSignal()
  const { remove } = listen(() => {})
  return expectChain(() => expectTrue(remove()), () => expectFalse(remove()))
})

// fn returning false
test(() => {
  const { listen, emit } = createSignal()
  listen(() => false)
  listen(() => "foo")
  return expectPropertiesDeep(emit(), [false])
})

// smart option
test(() => {
  const spy = createSpy()
  const { emit, listen, listenOnce } = createSignal({ smart: true })
  const args = [0, 1]
  const listener = listen(spy)

  return expectChain(
    () => expectTrue(listener === listen(spy)),
    () => expectNotCalled(spy),
    () => emit(...args),
    () => expectCalledOnceWith(spy, ...args),
    () => {
      const nextSpy = createSpy()
      listen(nextSpy)
      return expectCalledOnceWith(nextSpy, ...args)
    },
    () => {
      const onceSpy = createSpy()
      const removeListenOnce = listenOnce(onceSpy).remove
      return expectCalledOnceWith(onceSpy, ...args).then(() => expectFalse(removeListenOnce()))
    },
  )
})

// removeAllWhileCalling must prevent listener call before function restore them after
// and installer/uninstaller are updated accordingly
test(() => {
  let installed
  const installer = () => {
    installed = true
    return () => {
      installed = false
    }
  }
  const { listen, emit, removeAllWhileCalling } = createSignal({
    installer,
  })

  const getEmitReturnValues = () => emit()

  const previousListeners = [listen(() => "a"), listen(() => "b"), listen(() => "c")]

  assert.equal(installed, true)
  removeAllWhileCalling(() => {
    assert.equal(installed, false)
    assert.deepEqual(getEmitReturnValues(), [])

    listen(() => "d")
    listen(() => "e")
    assert.equal(installed, true)
    assert.deepEqual(getEmitReturnValues(), ["d", "e"])

    previousListeners[1].remove()
  })
  assert.equal(installed, true)
  assert.deepEqual(getEmitReturnValues(), ["a", "c", "d", "e"])
})

test(() => {
  let installed
  const installer = () => {
    installed = true
    return () => {
      installed = false
    }
  }
  const { listen, emit, removeAllWhileCalling } = createSignal({
    installer,
  })

  listen(() => "a")
  removeAllWhileCalling(() => {})
  assert.equal(installed, true)
  assert.equal(emit()[0], "a")
})

// async signal emit() return a thenable resolved with resolved values of listeners
test(() => {
  const { listen, emit } = createAsyncSignal()

  listen((a) => Promise.resolve(a + 1))
  return expectResolveWith(emit(10), matchProperties([11]))
})

// async signal listener are executed in serie
test(() => {
  const { listen, emit } = createAsyncSignal()

  let resolved = false
  listen(() =>
    Promise.resolve().then(() => {
      resolved = true
    }),
  )
  listen(() => resolved)

  return expectResolveWith(emit(), matchProperties([undefined, true]))
})
