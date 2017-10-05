const isAction = value => value && typeof value.then === "function"

export const createAction = () => {
	let state = "unknown"
	let result

	const action = {}
	const isPassing = () => state === "passing"
	const isFailing = () => state === "failing"
	const isPassed = () => state === "passed"
	const isFailed = () => state === "failed"
	const isRunning = () => state === "unknown" || isPassing() || isFailing()
	const isEnded = () => isPassed() || isFailed()
	const pendingActions = []

	const runPendingActions = () => {
		pendingActions.forEach(pendingAction => {
			pendingAction.fn(action, result)
		})
		pendingActions.length = 0
	}
	const handleResult = (value, passing) => {
		if (passing) {
			state = "passing"
			if (isAction(value)) {
				if (result === action) {
					throw new TypeError("an action cannot pass with itself")
				}
				value.then(
					value => {
						if (isRunning()) {
							handleResult(value, true)
						}
					},
					value => {
						if (isRunning()) {
							handleResult(value, false)
						}
					}
				)
			} else {
				state = "passed"
				result = value
				runPendingActions()
			}
		} else {
			state = "failed"
			result = value
			runPendingActions()
		}
	}
	const fail = value => {
		if (isFailed() || isFailing()) {
			throw new Error(`fail must be called once`)
		}
		if (isPassed()) {
			throw new Error(`fail must not be called after pass was called`)
		}
		handleResult(value, false)
	}
	const pass = value => {
		if (isPassing() || isPassed()) {
			throw new Error(`pass must be called once`)
		}
		if (isFailed()) {
			throw new Error(`pass must not be called after fail was called`)
		}
		handleResult(value, true)
	}
	const then = (onPassed, onFailed) => {
		const nextAction = createAction()
		const nextActionHandler = () => {
			let nextActionResult = result

			if (isFailed()) {
				if (onFailed) {
					nextActionResult = onFailed(result)
				}
				nextAction.fail(nextActionResult)
			} else {
				if (onPassed) {
					nextActionResult = onPassed(result)
				}
				nextAction.pass(nextActionResult)
			}
		}
		if (isRunning()) {
			pendingActions.push({
				fn: nextActionHandler
			})
		} else {
			nextActionHandler()
		}

		return nextAction
	}
	const getState = () => state
	const getResult = () => result

	Object.assign(action, {
		getState,
		getResult,
		isPassing,
		isFailing,
		isPassed,
		isFailed,
		isRunning,
		isEnded,
		pass,
		fail,
		then
	})

	return action
}

export const fromFunction = fn => {
	const action = createAction()
	const returnValue = fn(action)
	if (isAction(returnValue)) {
		returnValue.then(action.pass, action.fail)
	}
	return action
}

export const passed = value => fromFunction(({ pass }) => pass(value))

export const failed = value => fromFunction(({ fail }) => fail(value))

export const all = iterable =>
	fromFunction(({ fail, pass }) => {
		let callCount = 0
		let passedCount = 0
		const results = []

		const compositeOnPassed = (result, index) => {
			results[index] = result
			passedCount++
			if (passedCount === callCount) {
				pass(results)
			}
		}
		const run = (value, index) => {
			if (isAction(value)) {
				value.then(result => compositeOnPassed(result, index), fail)
			} else {
				compositeOnPassed(value, index)
			}
		}

		let index = 0
		for (const value of iterable) {
			run(value, index)
			callCount++
			index++
		}

		if (passedCount === callCount) {
			pass(results)
		}
	})
// all(["foo", "bar"]).then(console.log)

export const collect = iterable =>
	fromFunction(({ fail, pass }) => {
		const results = []
		let callCount = 0
		let passedOrFailedCount = 0
		let someHasFailed = false

		const checkEnded = () => {
			passedOrFailedCount++
			if (passedOrFailedCount === callCount) {
				if (someHasFailed) {
					fail(results)
				} else {
					pass(results)
				}
			}
		}
		const compositeOnPassed = (result, index) => {
			results[index] = {
				state: "passed",
				result
			}
			checkEnded()
		}
		const compositeOnFailed = (result, index) => {
			results[index] = {
				state: "failed",
				result
			}
			checkEnded()
		}
		const run = (value, index) => {
			if (isAction(value)) {
				value.then(
					result => compositeOnPassed(result, index),
					result => compositeOnFailed(result, index)
				)
			} else {
				compositeOnPassed(value, index)
			}
		}

		let index = 0
		for (const value of iterable) {
			run(value, index)
			callCount++
			index++
		}
		checkEnded()
	})

export const sequence = (iterable, fn = v => v) =>
	fromFunction(({ pass, fail }) => {
		const iterator = iterable[Symbol.iterator]()
		const results = []

		const iterate = () => {
			const { done, value } = iterator.next()
			if (done) {
				return pass(results)
			}
			const valueModified = fn(value)
			if (isAction(valueModified)) {
				valueModified.then(
					result => {
						results.push(result)
						iterate()
					},
					result => {
						fail(result)
					}
				)
			} else {
				results.push(valueModified)
				iterate()
			}
		}
		iterate()
	})
// sequence(["a", "b"]).then(console.log)

export const any = iterable =>
	fromFunction(({ fail, pass }) => {
		let running = true
		const compositePass = value => {
			if (running) {
				running = false
				pass(value)
			}
		}
		const compositeFail = value => {
			if (running) {
				running = false
				fail(value)
			}
		}

		for (const value of iterable) {
			if (isAction(value)) {
				value.then(compositePass, compositeFail)
			} else {
				compositePass(value)
			}

			if (running === false) {
				break
			}
		}
	})

export const aroundAction = (before, actionCreator, after) => {
	before()
	return actionCreator().then(
		result => {
			after(result, true)
			return result
		},
		result => {
			after(result, true)
			return result
		}
	)
}

export const fromPromise = promise =>
	fromFunction(({ pass, fail }) => {
		promise.then(value => setTimeout(pass, 0, value), reason => setTimeout(fail, 1, reason))
	})

export const fromNodeCallback = fn => (...args) =>
	fromFunction(({ pass }) => {
		fn(...args, (error, data) => {
			if (error) {
				throw error
			} else {
				pass(data)
			}
		})
	})

export const fromNodeCallbackRecoveringWhen = (fn, recoverWhen, recoverValue) => (...args) =>
	fromFunction(({ pass }) => {
		fn(...args, (error, data) => {
			if (error) {
				if (recoverWhen(error)) {
					pass(recoverValue)
				} else {
					throw error
				}
			} else {
				pass(data)
			}
		})
	})

// passed("foo").then(console.log)

// const fs = require("fs")
// const path = require("path")

// const readFile = path =>
// 	createAction(({ pass }) =>
// 		fs.readFile(path, (error, buffer) => {
// 			if (error) {
// 				throw error
// 			}
// 			pass(buffer)
// 		})
// 	)
// const readFileAsString = path => readFile(path).chain(String)
// readFileAsString(path.resolve(__dirname, "./test.js")).then(console.log)
