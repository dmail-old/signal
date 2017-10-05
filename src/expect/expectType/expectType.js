import { fromFunction } from "../expect.js"

const createFailedTypeMessage = (value, actual, expected) => {
	const prefix = type => {
		if (type === "null" || type === "undefined") {
			return type
		}
		const firstLetter = type[0].toLowerCase()
		if (["a", "e", "i", "o", "u"].includes(firstLetter)) {
			return `an ${type}`
		}
		return `a ${type}`
	}

	return `expect ${prefix(expected)} but got ${prefix(actual)}`
}
export const expectType = (value, expectedType) =>
	fromFunction(({ fail, pass }) => {
		const actualType = typeof value
		if (actualType !== expectedType) {
			return fail(createFailedTypeMessage(value, actualType, expectedType))
		}
		return pass()
	})
export const expectFunction = value => expectType(value, "function")
export const expectObject = value => expectType(value, "object")
export const expectNumber = value => expectType(value, "number")
