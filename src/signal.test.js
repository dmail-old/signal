// @dmail/test/src/actions.js is more or less equivalent to
// http://folktale.origamitower.com/api/v2.0.0/en/folktale.result.html
// http://folktale.origamitower.com/api/v2.0.0/en/folktale.validation.html
// it will be externalized in @dmail/action & @dmail/ensure
// will be renamed @dmail/expect and provide many expectation
// as shown below

// https://github.com/cowboy/jquery-throttle-debounce/blob/master/unit/unit.js

import { createSignal } from "./signal.js"
import { createSpy } from "./spy.js"
import { all, fromFunction } from "./action.js"

import {
	expectFunction,
	expectObject,
	expectCalledOnceWithoutArgument,
	expectCalledTwiceWithoutArgument,
	expectCalledOnceWith,
	expectCalledTwiceWith,
	expectNotCalled,
	expectTrue,
	expectFalse
} from "./expect/index.js"

const composeParams = (inputParams, params) => Object.assign({}, inputParams, params)
const createFunctionComposingParams = (params = {}, fnCalledWithComposedParams) => inputParams =>
	fnCalledWithComposedParams(composeParams(inputParams, params))
const createFunctionComposingDynamicParams = (
	fnCreatingDynamicParams,
	fnCalledWithComposedParams
) => inputParams =>
	fnCalledWithComposedParams(composeParams(inputParams, fnCreatingDynamicParams(inputParams)))
const createFunctionCalledBefore = (fn, fnCalledAfter) => (...args) => {
	fn(...args)
	return fnCalledAfter(...args)
}

const fromFunctionWithAllocableMs = fn =>
	fromFunction(
		createFunctionComposingDynamicParams(({ fail, then }) => {
			let timeoutid
			let allocatedMs = Infinity
			const cancelTimeout = () => {
				if (timeoutid !== undefined) {
					clearTimeout(timeoutid)
					timeoutid = undefined
				}
			}
			const allocateMs = ms => {
				allocatedMs = ms
				cancelTimeout()
				if (ms > -1 && ms !== Infinity) {
					timeoutid = setTimeout(
						() => fail(`must pass or fail in less than ${allocatedMs}ms`),
						allocatedMs
					)
				}
			}
			const getAllocatedMs = () => allocatedMs
			then(cancelTimeout, cancelTimeout)

			return { allocateMs, getAllocatedMs }
		}, fn)
	)

const ensure = (expectations, { allocatedMs = 100 } = {}) => {
	const runTest = ({ beforeEach, afterEach, allocateMs, getAllocatedMs } = {}) => {
		return fromFunction(({ fail, pass }) => {
			// give the allocateMs for ensure to fail/pass
			allocateMs(allocatedMs)

			const expectationDescriptions = Object.keys(expectations)
			const compositeReport = {}
			let passedOrFailedCount = 0
			let someHasFailed = false

			const checkEnded = () => {
				passedOrFailedCount++
				if (passedOrFailedCount === expectationDescriptions.length) {
					if (someHasFailed) {
						fail(compositeReport)
					} else {
						pass(compositeReport)
					}
				}
			}

			expectationDescriptions.forEach(description => {
				beforeEach(description)
				fromFunctionWithAllocableMs(
					// give expectation the ensure allocatedMs to fail/pass
					createFunctionCalledBefore(
						({ allocateMs }) => allocateMs(getAllocatedMs()),
						expectations[description]
					)
				).then(
					result => {
						const passedReport = {
							state: "passed",
							result
						}
						compositeReport[description] = passedReport
						afterEach(description, passedReport)
						checkEnded()
					},
					result => {
						someHasFailed = true
						const failedReport = {
							state: "failed",
							result
						}
						compositeReport[description] = failedReport
						afterEach(description, failedReport)
						checkEnded()
					}
				)
			})
		})
	}

	runTest["@@autorun"] = () =>
		fromFunctionWithAllocableMs(
			createFunctionComposingParams(
				{
					beforeEach: description => {
						console.log(description)
					},
					afterEach: (description, report) => {
						if (report.state === "passed") {
							console.log(`passed${report.result ? `: ${report.result}` : ""}`)
						} else {
							console.log(`failed${report.result ? `: ${report.result}` : ""}`)
						}
					}
				},
				runTest
			)
		)

	return runTest
}

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
