import { mapFailed } from "../../expect.js"

import { expectCalled } from "../expectCalled/expectCalled.js"
import { expectMatch } from "../../expectMatch/expectMatch.js"
import { matchProperties } from "../../expectMatch/index.js"

export const expectCalledWith = (call, ...expectedArgs) =>
	expectCalled(call).then(() =>
		mapFailed(
			expectMatch(call.getArguments(), matchProperties(expectedArgs)),
			failureMessage => `${call} arguments mismatch: ${failureMessage}`
		)
	)
