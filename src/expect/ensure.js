import { fromFunction } from "./expect.js"

const composeParams = (inputParams, params) => Object.assign({}, inputParams, params)
export const createFunctionComposingParams = (
	params = {},
	fnCalledWithComposedParams
) => inputParams => fnCalledWithComposedParams(composeParams(inputParams, params))
export const createFunctionComposingDynamicParams = (
	fnCreatingDynamicParams,
	fnCalledWithComposedParams
) => inputParams =>
	fnCalledWithComposedParams(composeParams(inputParams, fnCreatingDynamicParams(inputParams)))
export const createFunctionCalledBefore = (fn, fnCalledAfter) => (...args) => {
	fn(...args)
	return fnCalledAfter(...args)
}

export const fromFunctionWithAllocableMs = fn =>
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

export const ensure = (expectations, { allocatedMs = 100 } = {}) => {
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
