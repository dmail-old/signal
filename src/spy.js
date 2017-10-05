const nowMs = () => Number(new Date())

let id = 0
const createCall = () => {
	let called = false
	let thisValue
	let temporalOrder
	let value
	const argsValue = []
	let resolve
	const msCreated = nowMs()
	let msInvoked
	const promise = new Promise(res => {
		resolve = res
	})
	const then = fn => promise.then(fn)

	const call = {}
	const settle = ({ context, args, returnValue }) => {
		if (called) {
			throw new Error("can be settled only once")
		}
		called = true
		// duration is not enough in case call are settled on the same ms
		id++
		temporalOrder = id
		msInvoked = nowMs()
		thisValue = context
		argsValue.push(...args)
		value = returnValue
		resolve(call)
	}

	const getDuration = () => msInvoked - msCreated
	const getTemporalOrder = () => temporalOrder
	const getThis = () => thisValue
	const getArguments = () => argsValue
	const getValue = () => value
	const wasCalled = () => called
	const wasCalledBefore = otherCall => temporalOrder > otherCall.getTemporalOrder()

	Object.assign(call, {
		then,
		settle,
		getDuration,
		getTemporalOrder,
		getThis,
		getArguments,
		getValue,
		wasCalled,
		wasCalledBefore
	})

	return call
}

export const spy = fn => {
	const calls = []
	let callCount = 0
	let currentCall

	const getCall = index => {
		if (index in calls) {
			return calls[index]
		}
		const call = createCall()
		calls[index] = call
		return call
	}
	const getCallCount = () => callCount
	const getFirstCall = () => getCall(0)
	const getLastCall = () => calls.reverse().find(call => call.wasCalled()) || calls[0]

	const theSpy = function() {
		const theCall = currentCall
		callCount++
		currentCall = getCall(callCount) // create the next call right now so that we measure ms between each calls

		const context = this
		const args = arguments
		let returnValue
		if (fn && typeof fn === "function") {
			returnValue = fn.apply(context, args)
		}
		theCall.settle({
			context,
			args,
			returnValue
		})

		return returnValue
	}
	currentCall = getCall(0)

	const state = {
		calls
	}

	Object.assign(theSpy, {
		state,
		getCall,
		getCallCount,
		getFirstCall,
		getLastCall
	})

	return theSpy
}
