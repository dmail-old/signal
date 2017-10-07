import { expectMatch, createMatcher, createExpectFromMatcher } from "../expectMatch.js"
import { failed, all, any, passed } from "../../expect.js"
import { expectObject, expectFunction } from "../../expectType/expectType.js"

const compareProperties = (actual, expected, { allowExtra = false, allowMissing = false } = {}) =>
	any([expectObject(actual), expectFunction(actual)]).then(() => {
		const actualPropertyNames = Object.keys(actual)
		const expectedPropertyNames = Object.keys(expected)
		const propertyExpectations = []

		expectedPropertyNames.forEach(name => {
			if (actualPropertyNames.includes(name)) {
				propertyExpectations.push(expectMatch(actual[name], expected[name]))
			} else if (allowMissing === false) {
				propertyExpectations.push(failed(`missing ${name} property`))
			}
		})

		if (allowExtra === false) {
			actualPropertyNames.forEach(name => {
				if (expectedPropertyNames.includes(name) === false) {
					propertyExpectations.push(failed(`unexpected ${name} property`))
				}
			})
		}

		return all(propertyExpectations)
	})

const mapObject = (object, fn) => {
	const mappedObject = {}
	Object.keys(object).forEach((name, index) => {
		mappedObject[name] = fn(name, index, object[name], object)
	})
	return mappedObject
}
const matchAny = () => createMatcher(() => passed())

export const matchProperties = expected =>
	createMatcher(actual => compareProperties(actual, expected, { allowExtra: false }))
export const matchPropertiesAllowingExtra = expected =>
	createMatcher(actual => compareProperties(actual, expected, { allowExtra: true }))
export const matchPropertyNames = expected =>
	createMatcher(actual => {
		compareProperties(actual, mapObject(expected, matchAny), { allowExtra: false })
	})
export const expectProperties = createExpectFromMatcher(matchProperties)
export const expectPropertiesAllowingExtra = createExpectFromMatcher(matchPropertiesAllowingExtra)
export const expectPropertyNames = createExpectFromMatcher(matchPropertyNames)
// expectPropertyNamesAllowingExtra
