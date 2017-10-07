import { fromFunction } from "../../expect.js"

export const expectCalled = call =>
	fromFunction(({ fail, pass }) => {
		if (call.wasCalled() === false) {
			return fail(`expect ${call} to be called`)
		}
		return pass()
	})
