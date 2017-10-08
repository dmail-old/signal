// l'intérête principal de conserver un matcher et un expect séparé
// c'est de pouvoir, par la suite, exprimé qu'on souhaite matcher avec un matcher custom
// ce qui donne ceci :
// expectCalledWith(spy, 10)
// expectCalledWith(spy, matchClose(10))
// expectCalledWith(spy, matchBetween(5, 15))

import { fromFunction } from "../expect.js"
import { uneval } from "../uneval.js"

const matchSymbol = Symbol()

export const expectMatch = (actual, expected) =>
	fromFunction(({ fail, pass }) => {
		if (expected.hasOwnProperty(matchSymbol)) {
			return expected[matchSymbol](actual, fail, pass)
		}
		if (actual !== expected) {
			return fail(`${uneval(actual)} does not match ${uneval(expected)}`)
		}
		return pass()
	})

export const createMatcher = fn => {
	return {
		[matchSymbol]: fn
	}
}
export const createExpectFromMatcher = matcher => (actual, ...args) =>
	expectMatch(actual, matcher(...args))

export const expectTrue = actual => expectMatch(actual, true)
export const expectFalse = actual => expectMatch(actual, false)
// const expectEmptyString = actual => expectIs(actual, '')
// const expectZero = actual => expectIs(actual, 0)
// const expectNull = actual => expectIs(actual, null)
// const expectUndefined = actual => expectIs(actual, undefined)
