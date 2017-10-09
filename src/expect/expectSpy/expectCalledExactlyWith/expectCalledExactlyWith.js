import { all } from "../../expect.js"

import { expectCalledExactly } from "../expectCalledExactly/expectCalledExactly.js"
import { expectCalledWith } from "../expectCalledWith/expectCalledWith.js"

export const expectCalledExactlyWith = (spy, expectedCallCount, ...expectedArgs) =>
	expectCalledExactly(spy, expectedCallCount).then(() =>
		all(spy.getCalls().map(call => expectCalledWith(call, ...expectedArgs)))
	)
export const expectCalledOnceWith = (spy, ...expectedArgs) =>
	expectCalledExactlyWith(spy, 1, ...expectedArgs)
export const expectCalledTwiceWith = (spy, ...expectedArgs) =>
	expectCalledExactlyWith(spy, 2, ...expectedArgs)
