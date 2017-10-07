import { fromFunction } from "../../expect.js"

export const createCalledExactlyFailedMessage = (spy, actual, expected) => {
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
		message += " but it was never called"
	} else if (actual === 1) {
		message += " but it was called once"
	} else if (actual === 2) {
		message += " but it was called twice"
	} else {
		message += ` but it was called ${actual} times`
	}

	return message
}
export const expectCalledExactly = (spy, expectedCallCount) =>
	fromFunction(({ pass, fail }) => {
		const actualCallCount = spy.getCallCount()
		if (actualCallCount !== expectedCallCount) {
			return fail(createCalledExactlyFailedMessage(spy, actualCallCount, expectedCallCount))
		}
		return pass()
	})
export const expectNotCalled = spy => expectCalledExactly(spy, 0)
