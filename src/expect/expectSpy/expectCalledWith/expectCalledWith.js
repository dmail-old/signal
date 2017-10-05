import { expectCalled } from "../expectCalled/expectCalled.js"
import { expectMatch } from "../../expectMatch/expectMatch.js"

export const expectCalledWith = (call, ...expectedArgs) =>
	expectCalled(call).then(() => expectMatch(call.getArguments(), expectedArgs))
