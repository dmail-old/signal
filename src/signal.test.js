// @dmail/test/src/actions.js is more or less equivalent to
// http://folktale.origamitower.com/api/v2.0.0/en/folktale.result.html
// it will be externalized in @dmail/action & @dmail/ensure
// will be renamed @dmail/expect and provide many expectation
// as shown below

// https://github.com/cowboy/jquery-throttle-debounce/blob/master/unit/unit.js

import { createSignal } from "./signal.js"
import { spy } from "@dmail/ensure"

import { all, fromFunction } from "@dmail/action"

const createFailedTypeMessage = (value, actual, expected) => {
	const prefix = type => {
		if (type === "null" || type === "undefined") {
			return type
		}
		const firstLetter = type[0].toLowerCase()
		if (["a", "e", "i", "o", "u"].includes(firstLetter)) {
			return `an ${type}`
		}
		return `a ${type}`
	}

	return `expect ${prefix(expected)} but got ${prefix(actual)}`
}
const expectType = (value, expectedType) =>
	fromFunction(({ fail, pass }) => {
		const actualType = typeof value
		if (actualType !== expectedType) {
			return fail(createFailedTypeMessage(value, actualType, expectedType))
		}
		return pass()
	})
const expectFunction = value => expectType(value, "function")
const expectObject = value => expectType(value, "object")

const createCalledExactlyFailedMessage = (spy, actual, expected) => {
	let message

	if (expected === 0) {
		message = `do not expect ${spy} to be called`
	} else if (expected === 1) {
		message = `expect ${spy} to be called once`
	} else if (expected === 2) {
		message = `expect ${spy} to be called twice`
	} else {
		message = `expect ${spy} to be called exactly ${expected} times`
	}

	if (actual === 0) {
		message += "but it was never called"
	} else if (actual === 1) {
		message += "but it was called once"
	} else if (actual === 2) {
		message += "but it was called twice"
	} else {
		message += `bit it was called ${actual} times`
	}

	return message
}

const expectIs = (actual, expected) =>
	fromFunction(({ fail, pass }) => {
		if (actual !== expected) {
			return fail(`expect ${actual} to be ${expected}`)
		}
		return pass()
	})
const expectTrue = actual => expectIs(actual, true)
const expectFalse = actual => expectIs(actual, false)
// const expectEmptyString = actual => expectIs(actual, '')
// const expectZero = actual => expectIs(actual, 0)
// const expectNull = actual => expectIs(actual, null)
// const expectUndefined = actual => expectIs(actual, undefined)

// think deepEquals
const expectEquals = (actual, expected) => fromFunction(({ fail, pass }) => {})

const expectCalledExactly = (spy, expectedCallCount) =>
	fromFunction(({ pass, fail }) => {
		const actualCallCount = spy.getCallCount()
		if (actualCallCount !== expectedCallCount) {
			return fail(createCalledExactlyFailedMessage(spy, actualCallCount, expectedCallCount))
		}
		return pass()
	})
const expectNotCalled = spy => expectCalledExactly(spy, 0)

const expectCalled = call =>
	fromFunction(({ fail, pass }) => {
		if (call.wasCalled() === false) {
			return fail(`expect ${call} to be called but was not`)
		}
		return pass()
	})

const createFailedArityMessage = (call, actual, expected) => {
	let message

	if (expected === 0) {
		message = `expect ${call} to be called without argument`
	} else if (expected === 1) {
		message = `expect ${call} to be called with one argument`
	} else if (expected === 2) {
		message = `expect ${call} to be called with two argument`
	} else {
		message = `expect ${call} to be called with exactly ${expected} argument`
	}

	if (actual === 0) {
		message += "but it was called without argument"
	} else if (actual === 1) {
		message += "but it was called with one argument"
	} else if (actual === 2) {
		message += "but it was called with two argument"
	} else {
		message += `but it was called with ${actual} argument`
	}

	return message
}
const expectArity = (call, expectedArity) =>
	fromFunction(({ fail, pass }) => {
		const actualArity = call.getArguments()
		if (actualArity !== expectedArity) {
			return fail(createFailedArityMessage(call, actualArity, expectedArity))
		}
		return pass()
	})

const expectCalledWithArity = (call, expectedArity) =>
	expectCalled(call).then(() => expectArity(call, expectedArity))
const expectCalledWithoutArgument = call => expectCalledWithArity(call, 0)

const expectCalledExactlyWithoutArgument = (spy, expectedCallCount) =>
	expectCalledExactly(spy, expectedCallCount).then(() =>
		all(spy.getCalls().map(call => expectCalledWithoutArgument(call)))
	)
const expectCalledOnceWithoutArgument = spy => expectCalledExactlyWithoutArgument(spy, 1)
const expectCalledTwiceWithoutArgument = spy => expectCalledExactlyWithoutArgument(spy, 2)

const expectCalledWith = (call, ...expectedArgs) =>
	expectCalled(call).then(() => {
		expectEquals(call.getArguments(), expectedArgs)
	})
const expectCalledExactlyWith = (spy, expectedCallCount, ...expectedArgs) =>
	expectCalledExactly(spy, expectedCallCount).then(() => {
		all(spy.getCalls().map(call => expectCalledWith(call, ...expectedArgs)))
	})
const expectCalledOnceWith = (spy, ...expectedArgs) =>
	expectCalledExactlyWith(spy, 0, ...expectedArgs)

export default ensure => {
	ensure("signal is a function", () => expectFunction(createSignal))

	ensure("listen returns an object", () => expectObject(createSignal().listen(() => {})))

	ensure("listen triggers listened", () => {
		const unlistened = spy()
		const listened = spy(() => unlistened)
		const source = createSignal({
			listened
		})
		const listener = source.listen(() => {})

		return expectCalledOnceWithoutArgument(listened)
			.then(() => {
				listener.remove()
				return expectCalledOnceWithoutArgument(unlistened)
			})
			.then(() => {
				source.listen(() => {})
				return expectCalledTwiceWithoutArgument(listened)
			})
	})

	ensure("listen call immeditaly previously emited args with memorize: true", () => {
		const listener = spy()
		const source = createSignal({
			memorize: true
		})
		const args = [0, 1]
		source.emit(...args)
		source.listen(listener)

		return expectCalledOnceWith(listener, ...args)
	})

	ensure("listenOnce remove the listener before calling it", () => {
		const source = createSignal()
		const fn = spy()
		source.listenOnce(fn)
		source.emit()
		source.emit()
		return expectCalledOnceWithoutArgument(fn)
	})

	ensure("emit call listener with args", () => {
		const source = createSignal()
		const fn = spy()
		const value = 1
		source.listen(fn)
		source.emit(value)

		return expectCalledOnceWith(fn, value)
	})

	ensure("emit call all listeners", () => {
		const source = createSignal()
		const value = 1
		const firstSpy = spy()
		const secondSpy = spy()
		source.listen(firstSpy)
		source.listen(secondSpy)
		source.emit(value)

		return all([expectCalledOnceWith(firstSpy, value), expectCalledOnceWith(secondSpy, value)])
	})

	// "emit returns a list of listener result"(signal),

	ensure("emit does not call disabled listener", () => {
		const source = createSignal()
		const fn = spy()
		const listener = source.listen(fn)
		listener.disable()

		return all([expectTrue(listener.isDisabled()), expectFalse(listener.isEnabled())]).then(() => {
			source.emit()
			return expectNotCalled(fn)
		})
	})

	// "execution state is prevented & stateReason is disabled for disabled listener"

	ensure("isListened", () => {
		const source = createSignal()

		return expectFalse(source.isListened()).then(() => {
			const listener = source.listen(() => {})
			return expectTrue(source.isListened()).then(() => {
				listener.disable()
				return expectFalse(source.isListened())
			})
		})
	})

	// "duplicate listener are ignored"(signal)

	// "error is thrown when recursively emiting"(signal)

	ensure("listener.remove called on first listener during emit", () => {
		let firstListener
		const a = spy(() => firstListener.remove())
		const b = spy()
		const source = createSignal()
		firstListener = source.listen(a)
		source.listen(b)
		source.emit()
		source.emit()

		return all([expectCalledOnceWithoutArgument(a), expectCalledTwiceWithoutArgument(b)])
	})

	ensure("listener.remove called on last listener during emit", () => {
		let lastListener
		const a = spy()
		const b = spy(() => lastListener.remove())
		const source = createSignal()
		source.listen(a)
		lastListener = source.listen(b)
		source.emit()
		source.emit()

		return all([expectCalledTwiceWithoutArgument(a), expectCalledOnceWithoutArgument(b)])
	})

	ensure("listener.remove called on middle listener during emit", () => {
		let middleListener
		const a = spy()
		const b = spy(() => middleListener.remove())
		const c = spy()
		const source = createSignal()
		source.listen(a)
		middleListener = source.listen(b)
		source.listen(c)
		source.emit()
		source.emit()

		return all([
			expectCalledTwiceWithoutArgument(a),
			expectCalledOnceWithoutArgument(b),
			expectCalledTwiceWithoutArgument(c)
		])
	})

	// "a listener can return false to prevent run of subsequent listener"(signal)

	// must test with two listeners

	// "stop() prevent call of subsequent listener"(signal)

	// "listenerExecution.stopped is true when calling stop() during listener execution"
}
