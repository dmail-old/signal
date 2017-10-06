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
import { createSpy } from "./spy.js"
import { all, fromFunction } from "./action.js"

import {
	expectFunction,
	expectObject,
	expectCalledOnceWithoutArgument,
	expectCalledTwiceWithoutArgument,
	expectCalledOnceWith,
	expectNotCalled,
	expectTrue,
	expectFalse
} from "./expect/index.js"

const ensure = expectations => () =>
	fromFunction(({ fail, pass }) => {
		const expectationDescriptions = Object.keys(expectations)
		const report = {}
		let passedOrFailedCount = 0
		let someHasFailed = false

		const checkEnded = () => {
			passedOrFailedCount++
			if (passedOrFailedCount === expectationDescriptions.length) {
				if (someHasFailed) {
					fail(report)
				} else {
					pass(report)
				}
			}
		}

		expectationDescriptions.forEach(description => {
			console.log(description)
			fromFunction(expectations[description]).then(
				result => {
					report[description] = {
						state: "passed",
						result
					}
					console.log("passed: ", result)
					checkEnded()
				},
				result => {
					someHasFailed = true
					report[description] = {
						state: "failed",
						result
					}
					console.log("failed: ", result)
					checkEnded()
				}
			)
		})
	})

const test = ensure({
	"signal is a function": () => expectFunction(createSignal),
	"listen returns an object": () => expectObject(createSignal().listen(() => {})),
	"listen triggers listened": () => {
		const unlistened = createSpy()
		const listened = createSpy(() => unlistened)
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
	},
	"listen call immeditaly previously emited args with memorize: true": () => {
		const spy = createSpy()
		const source = createSignal({
			memorize: true
		})
		const args = [0, 1]
		source.emit(...args)
		source.listen(spy)

		return expectCalledOnceWith(spy, ...args)
	},
	"listenOnce remove the listener before calling it": () => {
		const source = createSignal()
		const spy = createSpy()
		source.listenOnce(spy)
		source.emit()
		source.emit()
		return expectCalledOnceWithoutArgument(spy)
	},
	"emit call listener with args": () => {
		const source = createSignal()
		const spy = createSpy()
		const value = 1
		source.listen(spy)
		source.emit(value)

		return expectCalledOnceWith(spy, value)
	},
	"emit call all listeners": () => {
		const source = createSignal()
		const value = 1
		const firstSpy = createSpy()
		const secondSpy = createSpy()
		source.listen(firstSpy)
		source.listen(secondSpy)
		source.emit(value)

		return all([expectCalledOnceWith(firstSpy, value), expectCalledOnceWith(secondSpy, value)])
	},
	// "emit returns a list of listener result"(signal),
	"emit does not call disabled listener": () => {
		const source = createSignal()
		const spy = createSpy()
		const listener = source.listen(spy)
		listener.disable()

		return all([expectTrue(listener.isDisabled()), expectFalse(listener.isEnabled())]).then(() => {
			source.emit()
			return expectNotCalled(spy)
		})
	},
	// "execution state is prevented & stateReason is disabled for disabled listener"
	isListened: () => {
		const source = createSignal()
		return expectFalse(source.isListened()).then(() => {
			const listener = source.listen(() => {})
			return expectTrue(source.isListened()).then(() => {
				listener.disable()
				return expectFalse(source.isListened())
			})
		})
	},
	// "duplicate listener are ignored"(signal)
	// "error is thrown when recursively emiting"(signal)
	"listener.remove called on first listener during emit": () => {
		let firstListener
		const a = createSpy(() => firstListener.remove())
		const b = createSpy()
		const source = createSignal()
		firstListener = source.listen(a)
		source.listen(b)
		source.emit()
		source.emit()
		return all([expectCalledOnceWithoutArgument(a), expectCalledTwiceWithoutArgument(b)])
	},
	"listener.remove called on last listener during emit": () => {
		let lastListener
		const a = createSpy()
		const b = createSpy(() => lastListener.remove())
		const source = createSignal()
		source.listen(a)
		lastListener = source.listen(b)
		source.emit()
		source.emit()
		return all([expectCalledTwiceWithoutArgument(a), expectCalledOnceWithoutArgument(b)])
	},
	"listener.remove called on middle listener during emit": () => {
		let middleListener
		const a = createSpy()
		const b = createSpy(() => middleListener.remove())
		const c = createSpy()
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
	}
	// "a listener can return false to prevent run of subsequent listener"(signal)
	// must test with two listeners
	// "stop() prevent call of subsequent listener"(signal)
	// "listenerExecution.stopped is true when calling stop() during listener execution"
})

test()

export default test
