// @dmail/test/src/actions.js is more or less equivalent to
// http://folktale.origamitower.com/api/v2.0.0/en/folktale.result.html
// http://folktale.origamitower.com/api/v2.0.0/en/folktale.validation.html
// it will be externalized in @dmail/action & @dmail/ensure
// will be renamed @dmail/expect and provide many expectation
// as shown below

// https://github.com/cowboy/jquery-throttle-debounce/blob/master/unit/unit.js

import { createSignal } from "./signal.js"
import { createSpy } from "./spy.js" // en faire un module
import { all } from "./action.js" // en faire un module

import {
	ensure,
	expectFunction,
	expectObject,
	expectCalledOnceWithoutArgument,
	expectCalledTwiceWithoutArgument,
	expectCalledOnceWith,
	expectCalledTwiceWith,
	expectNotCalled,
	expectTrue,
	expectFalse
} from "./expect/index.js" // en faire un module

const expectations = {
	"signal is a function": () => expectFunction(createSignal),
	"listen returns an object": () => expectObject(createSignal().listen(() => {})),
	"listen triggers listened": () => {
		const unlistened = createSpy()
		const listened = createSpy(() => unlistened)
		const signal = createSignal({
			listened
		})
		const listener = signal.listen(() => {})

		return expectCalledOnceWith(listened, signal)
			.then(() => {
				listener.remove()
				return expectCalledOnceWith(unlistened, signal)
			})
			.then(() => {
				signal.listen(() => {})
				return expectCalledTwiceWith(listened, signal)
			})
	},
	"listen calls immediatly previously emited args with memorize: true": () => {
		const spy = createSpy()
		const signal = createSignal({
			memorize: true
		})
		const args = [0, 1]
		signal.emit(...args)
		signal.listen(spy)

		return expectCalledOnceWith(spy, ...args)
	},
	"listenOnce remove the listener before calling it": () => {
		const signal = createSignal()
		const spy = createSpy()
		signal.listenOnce(spy)
		signal.emit()
		signal.emit()
		return expectCalledOnceWithoutArgument(spy)
	},
	"emit call listener with args": () => {
		const signal = createSignal()
		const spy = createSpy()
		const value = 1
		signal.listen(spy)
		signal.emit(value)

		return expectCalledOnceWith(spy, value)
	},
	"emit call all listeners": () => {
		const signal = createSignal()
		const value = 1
		const firstSpy = createSpy()
		const secondSpy = createSpy()
		signal.listen(firstSpy)
		signal.listen(secondSpy)
		signal.emit(value)

		return all([expectCalledOnceWith(firstSpy, value), expectCalledOnceWith(secondSpy, value)])
	},
	// "emit returns a list of listener result"(signal),
	"emit does not call disabled listener": () => {
		const signal = createSignal()
		const spy = createSpy()
		const listener = signal.listen(spy)
		listener.disable()

		return all([expectTrue(listener.isDisabled()), expectFalse(listener.isEnabled())]).then(() => {
			signal.emit()
			return expectNotCalled(spy)
		})
	},
	// "execution state is prevented & stateReason is disabled for disabled listener"
	"isListened behaviour": () => {
		const signal = createSignal()
		return expectFalse(signal.isListened()).then(() => {
			const listener = signal.listen(() => {})
			return expectTrue(signal.isListened()).then(() => {
				listener.disable()
				return expectFalse(signal.isListened())
			})
		})
	},
	// "duplicate listener are ignored"(signal)
	// "error is thrown when recursively emiting"(signal)
	"listener.remove called on first listener during emit": () => {
		let firstListener
		const a = createSpy(() => firstListener.remove())
		const b = createSpy()
		const signal = createSignal()
		firstListener = signal.listen(a)
		signal.listen(b)
		signal.emit()
		signal.emit()
		return all([expectCalledOnceWithoutArgument(a), expectCalledTwiceWithoutArgument(b)])
	},
	"listener.remove called on last listener during emit": () => {
		let lastListener
		const a = createSpy()
		const b = createSpy(() => lastListener.remove())
		const signal = createSignal()
		signal.listen(a)
		lastListener = signal.listen(b)
		signal.emit()
		signal.emit()
		return all([expectCalledTwiceWithoutArgument(a), expectCalledOnceWithoutArgument(b)])
	},
	"listener.remove called on middle listener during emit": () => {
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

		return all([
			expectCalledTwiceWithoutArgument(a),
			expectCalledOnceWithoutArgument(b),
			expectCalledTwiceWithoutArgument(c)
		])
	}
	// "a listener can return false to prevent run of subsequent listener"(signal)
	// must test with two listeners
	// "stop() prevent call of subsequent listener"(signal)
	// "listenerExecution.stopped is true when calling stop() during listener execution"
}

export default ensure(expectations)
