// https://github.com/cowboy/jquery-throttle-debounce/blob/master/unit/unit.js

import { createSignal, warnOnRecursed, errorOnRecursed } from "./signal.js"
import { createSpy, installSpy } from "@dmail/spy"
import { createTest } from "@dmail/test"
import {
	expectFunction,
	expectObject,
	expectCalledOnceWith,
	expectCalledTwiceWith,
	expectCalledOnceWithoutArgument,
	expectCalledTwiceWithoutArgument,
	expectChain,
	expectTrue,
	expectFalse,
	expectNotCalled,
	expectProperties,
	expectThrowWith,
	matchProperties,
	matchError,
	matchString
} from "@dmail/expect"

export default createTest({
	"signal is a function": () => expectFunction(createSignal),
	"listen returns an object": () => expectObject(createSignal().listen(() => {})),
	"warnOnRecursed behaviour": () => {
		const warnSpy = createSpy()
		installSpy(warnSpy, console, "warn", warnOnRecursed)
		return expectCalledOnceWith(warnSpy, matchString())
	},
	"errorOnRecursed behaviour": () =>
		expectThrowWith(
			errorOnRecursed,
			matchError(
				matchProperties({
					message: matchString()
				})
			)
		),
	"disable(), enable(), isEnabled(), isDisabled()": () => {
		const signal = createSignal()
		return expectChain(
			() => expectTrue(signal.isEnabled()),
			() => signal.disable(),
			() => expectTrue(signal.isDisabled()),
			() => signal.enable(),
			() => expectTrue(signal.isEnabled())
		)
	},
	"has(listener)": () => {
		const signal = createSignal()
		const listener = signal.listen(() => {})
		return expectChain(
			() => expectTrue(signal.has(listener)),
			() => listener.remove(),
			() => expectFalse(signal.has(listener))
		)
	},
	"listen(fn) twice": () => {
		const signal = createSignal()
		const fn = () => {}
		signal.listen(fn)
		return expectFalse(signal.listen(fn))
	},
	"listened called when signal is listened": () => {
		const unlistened = createSpy()
		const listened = createSpy(() => unlistened)
		const signal = createSignal({
			listened
		})
		const listener = signal.listen(() => {})

		return expectChain(
			() => expectCalledOnceWith(listened, signal),
			() => listener.remove(),
			() => expectCalledOnceWith(unlistened, signal),
			() => signal.listen(() => {}),
			() => expectCalledTwiceWith(listened, signal)
		)
	},
	"clear()": () => {
		const signal = createSignal()
		signal.listen(() => {})
		signal.clear()
		return expectFalse(signal.isListened())
	},
	"recursed called when signal is recursively emitting": () => {
		const recursedSpy = createSpy()
		const signal = createSignal({
			recursed: recursedSpy
		})
		let emitted = false
		signal.listen(() => {
			if (emitted === false) {
				emitted = true
				signal.emit()
			}
		})
		signal.emit()

		return expectCalledOnceWithoutArgument(recursedSpy)
	},
	"args options": () => {
		const signal = createSignal({
			args: [0]
		})
		const spy = createSpy()
		signal.listen(spy)
		signal.emit(1)
		return expectCalledOnceWith(spy, 0, 1)
	},
	"memorize options": () => {
		const spy = createSpy()
		const { emit, listen, forget } = createSignal({
			memorize: true
		})
		const args = [0, 1]
		emit(...args)
		listen(spy)

		return expectChain(
			() => expectCalledOnceWith(spy, ...args),
			() => {
				forget()
				const otherSpy = createSpy()
				listen(otherSpy)
				return expectNotCalled(otherSpy)
			}
		)
	},
	"listenOnce(fn) remove the listener before calling it": () => {
		const signal = createSignal()
		const spy = createSpy()
		signal.listenOnce(spy)
		signal.emit()
		signal.emit()
		return expectCalledOnceWithoutArgument(spy)
	},
	"emit() while disabled": () => {
		const { emit, disable } = createSignal()
		disable()
		return expectFalse(emit())
	},
	"emit(...args) call listener with args": () => {
		const signal = createSignal()
		const spy = createSpy()
		const value = 1
		signal.listen(spy)
		signal.emit(value)

		return expectCalledOnceWith(spy, value)
	},
	"emit() call all listeners": () => {
		const signal = createSignal()
		const value = 1
		const firstSpy = createSpy()
		const secondSpy = createSpy()
		signal.listen(firstSpy)
		signal.listen(secondSpy)
		signal.emit(value)

		return expectChain(
			() => expectCalledOnceWith(firstSpy, value),
			() => expectCalledOnceWith(secondSpy, value)
		)
	},
	"listener.enable(), listener.disable(), listener.isEnabled(), listener.isDisabled()": () => {
		const signal = createSignal()
		const listener = signal.listen(() => {})
		return expectChain(
			() => expectTrue(listener.isEnabled()),
			() => listener.disable(),
			() => expectTrue(listener.isDisabled()),
			() => listener.enable(),
			() => expectTrue(listener.isEnabled())
		)
	},
	"emit() does not call disabled listener": () => {
		const signal = createSignal()
		const spy = createSpy()
		const listener = signal.listen(spy)
		listener.disable()

		return expectChain(
			() => expectTrue(listener.isDisabled()),
			() => expectFalse(listener.isEnabled()),
			() => {
				signal.emit()
				return expectNotCalled(spy)
			}
		)
	},
	"isListened()": () => {
		const signal = createSignal()
		return expectChain(
			() => expectFalse(signal.isListened()),
			() => {
				const listener = signal.listen(() => {})
				return expectTrue(signal.isListened()).then(() => {
					listener.disable()
					return expectFalse(signal.isListened())
				})
			}
		)
	},
	"listener.remove() called on first listener during emit": () => {
		let firstListener
		const a = createSpy(() => firstListener.remove())
		const b = createSpy()
		const signal = createSignal()
		firstListener = signal.listen(a)
		signal.listen(b)
		signal.emit()
		signal.emit()
		return expectChain(
			() => expectCalledOnceWithoutArgument(a),
			() => expectCalledTwiceWithoutArgument(b)
		)
	},
	"listener.remove() called on last listener during emit": () => {
		let lastListener
		const a = createSpy()
		const b = createSpy(() => lastListener.remove())
		const signal = createSignal()
		signal.listen(a)
		lastListener = signal.listen(b)
		signal.emit()
		signal.emit()
		return expectChain(
			() => expectCalledTwiceWithoutArgument(a),
			() => expectCalledOnceWithoutArgument(b)
		)
	},
	"listener.remove() called on middle listener during emit": () => {
		let middleListener
		const a = createSpy()
		const b = createSpy(() => middleListener.remove())
		const c = createSpy()
		const signal = createSignal()
		signal.listen(a)
		middleListener = signal.listen(b)
		signal.listen(c)
		signal.emit()
		signal.emit()

		return expectChain(
			() => expectCalledTwiceWithoutArgument(a),
			() => expectCalledOnceWithoutArgument(b),
			() => expectCalledTwiceWithoutArgument(c)
		)
	},
	"listener.remove() called on already removed listener": () => {
		const { listen } = createSignal()
		const listener = listen(() => {})
		const { remove } = listener
		return expectChain(
			() => expectTrue(remove()),
			() => expectFalse(remove()),
			() => expectFalse(listener.remove())
		)
	},
	"stop(reason)": () => {
		const { stop, listen, emit } = createSignal()
		const reason = "foo"
		const value = 1
		listen(() => {
			stop(reason)
			return value
		})
		return expectProperties(emit(), [
			matchProperties({
				removed: false,
				removedReason: undefined,
				prevented: false,
				preventedReason: undefined,
				preventNext: true,
				preventNextReason: reason,
				value
			})
		])
	},
	"listener.preventNext(reason)": () => {
		const { listen, emit } = createSignal()
		let listenerA
		const reason = "foo"
		const value = 1
		const firstSpy = createSpy(() => {
			listenerA.preventNext(reason)
			return value
		})
		const secondSpy = createSpy()
		listenerA = listen(firstSpy)
		listen(secondSpy)

		return expectChain(
			() => emit(),
			executions =>
				expectProperties(executions, [
					matchProperties({
						removed: false,
						removedReason: undefined,
						prevented: false,
						preventedReason: undefined,
						preventNext: true,
						preventNextReason: reason,
						value
					})
				]),
			() => expectCalledOnceWithoutArgument(firstSpy),
			() => expectNotCalled(secondSpy)
		)
	},
	"fn returning false": () => {
		const signal = createSignal()
		signal.listen(() => false)
		return expectProperties(signal.emit(), [
			matchProperties({
				removed: false,
				removedReason: undefined,
				prevented: false,
				preventedReason: undefined,
				preventNext: true,
				preventNextReason: "returned false",
				value: false
			})
		])
	}
	// "execution state is prevented & stateReason is disabled for disabled listener"
	// "error is thrown when recursively emiting"(signal)
})
