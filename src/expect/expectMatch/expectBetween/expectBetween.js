import { failed } from "../../expect.js"
import { createMatcher, createExpectFromMatcher } from "../expectMatch.js"
import { expectNumber } from "../../expectType/expectType.js"

export const matchMinimum = min =>
	createMatcher(actual => {
		if (actual < min) {
			return failed(`expect min ${min} but got ${actual}`)
		}
	})
export const expectMinimum = createExpectFromMatcher(matchMinimum)

export const matchMaximum = max =>
	createMatcher(actual => {
		if (actual < max) {
			return failed(`expect max ${max} but got ${actual}`)
		}
	})
export const expectMaximum = createExpectFromMatcher(matchMaximum)

export const matchBetween = (min, max) =>
	createMatcher(actual =>
		expectNumber(actual)
			.then(() => expectMinimum(actual, min))
			.then(() => expectMaximum(actual, max))
	)
export const expectBetween = createExpectFromMatcher(matchBetween)
