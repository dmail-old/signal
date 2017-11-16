// https://github.com/cowboy/jquery-throttle-debounce/blob/master/unit/unit.js

import { createSignal, warnOnRecursed, errorOnRecursed } from "./signal.js"
import { createSpy, installSpy } from "@dmail/spy"
import { createTest } from "@dmail/test"
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
	expectPropertiesDeep,
} from "@dmail/expect"

export default createTest({
	"createSignal is a function": () => expectFunction(createSignal),
	"listen returns a function": () => expectFunction(createSignal().listen(() => {})),
	"warnOnRecursed behaviour": () => {
		const warnSpy = createSpy()
		installSpy(warnSpy, console, "warn", warnOnRecursed)
		return expectCalledOnceWith(warnSpy, matchString())
	},
	"errorOnRecursed behaviour": () =>
		expectThrowWith(
			errorOnRecursed,
			matchErrorWith({
				message: matchString(),
			}),
		),
	"listen(fn) twice": () => {
		const { listen } = createSignal()
		const fn = () => {}
		listen(fn)
		return expectFalse(listen(fn))
	},
	"listened called when signal is listened": () => {
		const unlistened = createSpy("unlistened")
		const listened = createSpy(() => unlistened)
		const signal = createSignal({
			listened,
		})
		const removeListener = signal.listen(() => {})

		return expectChain(
			() => expectCalledOnceWith(listened, signal),
			() => removeListener(),
			() => expectCalledOnceWith(unlistened, signal),
			() => signal.listen(() => {}),
			() => expectCalledTwiceWith(listened, signal),
		)
	},
	"clear()": () => {
		const { listen, clear, isListened } = createSignal()
		listen(() => {})
		clear()
		return expectFalse(isListened())
	},
	"recursed called when signal is recursively emitting": () => {
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
	},
	"listenOnce(fn) remove the listener before calling it": () => {
		const { listenOnce, emit } = createSignal()
		const spy = createSpy()
		listenOnce(spy)
		emit()
		emit()
		return expectCalledOnceWithoutArgument(spy)
	},
	"listenOnce return false on already listener fn": () => {
		const { listenOnce } = createSignal()
		const fn = () => {}
		listenOnce(fn)
		return expectFalse(listenOnce(fn))
	},
	"listenOnce indicates why listener was removed": () => {
		const { listenOnce, emit } = createSignal()
		listenOnce(() => {})
		return expectPropertiesDeep(emit(), [
			{
				removed: true,
				removedReason: "once",
				prevented: false,
				preventedReason: undefined,
				stopped: false,
				stoppedReason: undefined,
				value: undefined,
			},
		])
	},
	"same function can be listen() and listenOnce() on two different signal": () => {
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
	},
	"emit(...args) call listener with args": () => {
		const { listen, emit } = createSignal()
		const spy = createSpy()
		const value = 1
		listen(spy)
		emit(value)

		return expectCalledOnceWith(spy, value)
	},
	"emit() call all listeners": () => {
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
	},
	"isListened()": () => {
		const { isListened, listen } = createSignal()
		return expectChain(
			() => expectFalse(isListened()),
			() => {
				const removeListener = listen(() => {})
				return expectTrue(isListened()).then(() => {
					removeListener()
				})
			},
			() => expectFalse(isListened()),
		)
	},
	"removeListener(reason)": () => {
		const { listen, emit } = createSignal()
		let remove
		remove = listen(() => {
			remove("reason")
		})
		return expectPropertiesDeep(emit(), [
			{
				removed: true,
				removedReason: "reason",
				prevented: false,
				preventedReason: undefined,
				stopped: false,
				stoppedReason: undefined,
				value: undefined,
			},
		])
	},
	"removeListener() called on first listener during emit": () => {
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
	},
	"removeListener() called on last listener during emit": () => {
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
	},
	"removeListener() called on middle listener during emit": () => {
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
	},
	"removeListener() called on already removed listener": () => {
		const { listen } = createSignal()
		const remove = listen(() => {})
		return expectChain(() => expectTrue(remove()), () => expectFalse(remove()))
	},
	"stop(reason)": () => {
		const { stop, listen, emit } = createSignal()
		const reason = "foo"
		const value = 1
		listen(() => {
			stop(reason)
			return value
		})
		return expectPropertiesDeep(emit(), [
			{
				removed: false,
				removedReason: undefined,
				prevented: false,
				preventedReason: undefined,
				stopped: true,
				stoppedReason: reason,
				value,
			},
		])
	},
	"fn returning false": () => {
		const { listen, emit } = createSignal()
		listen(() => false)
		listen(() => {})
		return expectPropertiesDeep(emit(), [
			{
				removed: false,
				removedReason: undefined,
				stopped: true,
				stoppedReason: "returned false",
				prevented: false,
				preventedReason: undefined,
				value: false,
			},
			{
				removed: false,
				removedReason: undefined,
				stopped: false,
				stoppedReason: undefined,
				prevented: true,
				preventedReason: "a previous listener stopped",
				value: undefined,
			},
		])
	},
	"fn calling stop then returning false": () => {
		const { listen, emit, stop } = createSignal()
		listen(() => {
			stop("reason")
			return false
		})
		return expectPropertiesDeep(emit(), [
			{
				removed: false,
				removedReason: undefined,
				prevented: false,
				preventedReason: undefined,
				stopped: true,
				stoppedReason: "reason",
				value: false,
			},
		])
	},
	"smart option": () => {
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
	},
})
