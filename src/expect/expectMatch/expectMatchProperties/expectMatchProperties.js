import { expectMatch, createMatcher, createExpectFromMatcher } from "../expectMatch.js"
import { failed, collect } from "../../expect.js"
import { expectType } from "../../expectType/expectType.js"

const isObject = value => value && (typeof value === "object" || typeof value === "function")

const createFailedPropertyCountMessage = (actual, expected) => {
	const actualPropertyNames = Object.keys(actual)
	const expectedPropertyNames = Object.keys(expected)
	const extra = []
	const missing = []

	actualPropertyNames.forEach(name => {
		if (expectedPropertyNames.includes(name) === false) {
			extra.push(name)
		}
	})
	expectedPropertyNames.forEach(name => {
		if (actualPropertyNames.includes(name) === false) {
			missing.push(name)
		}
	})

	// no extra property
	if (extra.length === 0) {
		if (missing.length === 1) {
			return `missing ${missing[0]} property`
		}
		return `missing ${missing} properties`
	}
	if (missing.length === 0) {
		if (extra.length === 1) {
			return `unexpected ${extra[0]} property`
		}
		return `unexpected ${extra} properties`
	}
	if (extra.length === 1 && missing.length === 1) {
		return `expect a property named ${missing[0]} but found ${extra[0]}`
	}
	return `missing ${missing} properties and unexpected ${extra} properties`
}
const compareProperties = (actual, expected, { exactly = true }) => {
	const actualIsObject = isObject(actual)
	const expectedIsObject = isObject(expected)

	// on a un objet mais on s'attendais à un primitif
	if (actualIsObject && !expectedIsObject) {
		return expectType(actual, expected === null ? "null" : typeof expected)
	}
	// on pas un object mais on s'attendais à en avoir un
	if (!actualIsObject && !expectedIsObject) {
		return expectType(actual, expected === null ? "null" : typeof expected)
	}

	const actualPropertyNames = Object.keys(actual)
	const expectedPropertyNames = Object.keys(expected)

	if (exactly) {
		const actualPropertyCount = actualPropertyNames.length
		const expectedPropertyCount = expectedPropertyNames.length
		if (actualPropertyCount !== expectedPropertyCount) {
			return failed(createFailedPropertyCountMessage(actual, expected))
		}
	}

	// maintenant on peut compare chaque propriété en utilisant
	// non pas all mais collect
	// pour s'assurer que toute les expectedProperties existent bien
	return collect([
		expectedPropertyNames.map(expectedPropertyName =>
			expectMatch(actual[expectedPropertyName], expected[expectedPropertyName])
		)
	])
}

export const matchProperties = expected =>
	createMatcher(actual => compareProperties(actual, expected))
export const matchPropertiesPartially = createMatcher((actual, expected) =>
	compareProperties(actual, expected, { exactly: false })
)
export const expectMatchProperties = createExpectFromMatcher(matchProperties)
export const expectMatchPropertiesPartially = createExpectFromMatcher(matchPropertiesPartially)
