// https://github.com/cowboy/jquery-throttle-debounce/blob/master/unit/unit.js

import { createSignal, warnOnRecursed, throwOnRecursed, stop } from "./signal.js"
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
	listen(fn)
	return expectFalse(listen(fn))
})

// installer/uninstaller behaviour
test(() => {
	const uninstaller = createSpy("uninstaller")
	const installer = createSpy(() => uninstaller)
	const signal = createSignal({
		installer,
	})
	const removeListener = signal.listen(() => {})
	const expectedInstallerArgument = matchProperties({
		emit: matchFunction(),
		getListeners: matchFunction(),
		removeAllWhileCalling: matchFunction(),
	})

	return expectChain(
		() => expectCalledOnceWith(installer, expectedInstallerArgument),
		() => removeListener(),
		() => expectCalledOnceWith(uninstaller),
		() => signal.listen(() => {}),
		() => expectCalledTwiceWith(installer, expectedInstallerArgument),
	)
})

// install must not be called once installed
test(() => {
	const { install } = createSignal()
	install()
	return expectThrowWith(
		install,
		matchErrorWith({
			message: matchString(),
		}),
	)
})

// uninstall must not be called when not installed
test(() => {
	const { uninstall } = createSignal()
	return expectThrowWith(
		uninstall,
		matchErrorWith({
			message: matchString(),
		}),
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

// listenOnce return false on already listener fn
test(() => {
	const { listenOnce } = createSignal()
	const fn = () => {}
	listenOnce(fn)
	return expectFalse(listenOnce(fn))
})

// listenOnce indicates why listener was removed
test(() => {
	const { listenOnce, emit } = createSignal()
	listenOnce(() => {})
	return expectPropertiesDeep(emit(), [
		{
			removed: true,
			removeReason: "once",
			stopped: false,
			stopReason: undefined,
			returnValue: undefined,
		},
	])
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

// "removeListener(reason)"
test(() => {
	const { listen, emit } = createSignal()
	const remove = listen(() => {
		remove("reason")
	})
	return expectPropertiesDeep(emit(), [
		{
			removed: true,
			removeReason: "reason",
			stopped: false,
			stopReason: undefined,
			returnValue: undefined,
		},
	])
})

// removeListener() called on first listener during emit
test(() => {
	let removeFirstListener
	const a = createSpy(() => removeFirstListener())
	const b = createSpy()
	const { listen, emit } = createSignal()
	removeFirstListener = listen(a)
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
	removeLastListener = listen(b)
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
	removeMiddleListener = listen(b)
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
	const remove = listen(() => {})
	return expectChain(() => expectTrue(remove()), () => expectFalse(remove()))
})

// fn returning false
test(() => {
	const { listen, emit } = createSignal()
	listen(() => false)
	listen(() => {})
	return expectPropertiesDeep(emit(), [
		{
			removed: false,
			removeReason: undefined,
			stopped: true,
			stopReason: "returned false",
			returnValue: false,
		},
	])
})

// stop
test(() => {
	const { listen, emit } = createSignal()

	listen(() => stop("foo"))
	return expectPropertiesDeep(emit(), [
		{
			removed: false,
			removeReason: undefined,
			stopped: true,
			stopReason: "foo",
			returnValue: { instruction: "stop", reason: "foo" },
		},
	])
})

// smart option
test(() => {
	const spy = createSpy()
	const { emit, listen, listenOnce } = createSignal({ smart: true })
	const args = [0, 1]
	listen(spy)

	return expectChain(
		() => expectFalse(listen(spy)),
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
			const removeListenOnce = listenOnce(onceSpy)
			return expectCalledOnceWith(onceSpy, ...args).then(() => expectFalse(removeListenOnce()))
		},
	)
})

// callFunctionIgnoredBySignal with non listened signal & fn listening something
test(() => {
	const signal = createSignal()

	const calls = []
	signal.listen(() => {
		calls.push("a")
	})

	signal.removeAllWhileCalling(() => {
		signal.emit()
		assert.deepEqual(calls, [])

		signal.listen(() => calls.push("b"))
		signal.emit()

		assert.deepEqual(calls, ["b"])
	})

	signal.emit()
	assert.deepEqual(calls, ["b", "a", "b"])
})
