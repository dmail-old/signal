// @dmail/test/src/actions.js is more or less equivalent to
// http://folktale.origamitower.com/api/v2.0.0/en/folktale.result.html
// http://folktale.origamitower.com/api/v2.0.0/en/folktale.validation.html
// it will be externalized in @dmail/action & @dmail/ensure
// will be renamed @dmail/expect and provide many expectation
// as shown below

// https://github.com/cowboy/jquery-throttle-debounce/blob/master/unit/unit.js

// il faut encore créer deux helpers :
// describe qui permet de créer une liste de tests qu'on veut run et dont on va collect les failures
// ensuite on peut run juste en faisant const test = describe(); test()
// cela log comment se déroule les tests
// on se servira ensuite de ça tel quel lorsqu'on run plusieurs fichier

import { createSignal } from "./signal.js"
import { spy } from "./spy.js"
import { all } from "./action.js"

import {
	describe,
	ensure,
	expectFunction,
	expectObject,
	expectCalledOnceWithoutArgument,
	expectCalledTwiceWithoutArgument,
	expectCalledOnceWith,
	expectNotCalled,
	expectTrue,
	expectFalse
} from "./expect/index.js"

const test = describe(
	ensure("signal is a function", () => expectFunction(createSignal)),
	ensure("listen returns an object", () => expectObject(createSignal().listen(() => {}))),
	ensure("listen returns an object", () => expectObject(createSignal().listen(() => {}))),
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
	}),
	ensure("listen call immeditaly previously emited args with memorize: true", () => {
		const listener = spy()
		const source = createSignal({
			memorize: true
		})
		const args = [0, 1]
		source.emit(...args)
		source.listen(listener)

		return expectCalledOnceWith(listener, ...args)
	}),
	ensure("listenOnce remove the listener before calling it", () => {
		const source = createSignal()
		const fn = spy()
		source.listenOnce(fn)
		source.emit()
		source.emit()
		return expectCalledOnceWithoutArgument(fn)
	}),
	ensure("emit call listener with args", () => {
		const source = createSignal()
		const fn = spy()
		const value = 1
		source.listen(fn)
		source.emit(value)

		return expectCalledOnceWith(fn, value)
	}),
	ensure("emit call all listeners", () => {
		const source = createSignal()
		const value = 1
		const firstSpy = spy()
		const secondSpy = spy()
		source.listen(firstSpy)
		source.listen(secondSpy)
		source.emit(value)

		return all([expectCalledOnceWith(firstSpy, value), expectCalledOnceWith(secondSpy, value)])
	}),
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
	}),
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
	}),
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
	}),
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
	}),
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
)

export default test
