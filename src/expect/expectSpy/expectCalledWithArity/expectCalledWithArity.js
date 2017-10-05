import { fromFunction, all } from "../../expect.js"

import { expectCalledExactly } from "../expectCalledExactly/expectCalledExactly.js"
import { expectCalled } from "../expectCalled/expectCalled.js"

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

export const expectArity = (call, expectedArity) =>
	fromFunction(({ fail, pass }) => {
		const actualArity = call.getArguments()
		if (actualArity !== expectedArity) {
			return fail(createFailedArityMessage(call, actualArity, expectedArity))
		}
		return pass()
	})

export const expectCalledWithArity = (call, expectedArity) =>
	expectCalled(call).then(() => expectArity(call, expectedArity))
export const expectCalledWithoutArgument = call => expectCalledWithArity(call, 0)

export const expectCalledExactlyWithoutArgument = (spy, expectedCallCount) =>
	expectCalledExactly(spy, expectedCallCount).then(() =>
		all(spy.getCalls().map(call => expectCalledWithoutArgument(call)))
	)
export const expectCalledOnceWithoutArgument = spy => expectCalledExactlyWithoutArgument(spy, 1)
export const expectCalledTwiceWithoutArgument = spy => expectCalledExactlyWithoutArgument(spy, 2)
