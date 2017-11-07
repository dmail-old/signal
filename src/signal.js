// https://github.com/dmail-old/notifier/blob/master/index.js
// https://github.com/cowboy/jquery-throttle-debounce/blob/master/jquery.ba-throttle-debounce.js
// https://github.com/kriskowal/gtor/blob/master/signals.md
// https://remysharp.com/2010/07/21/throttling-function-calls

const recursiveMessage = `emit called recursively, its often the sign of an error.
You can disable his recursive check doing createSignal({ recursed: null })`

export const warnOnRecursed = () => console.warn(recursiveMessage)
export const errorOnRecursed = () => {
	throw new Error(recursiveMessage)
}

export const createSignal = (
	{ recursed = warnOnRecursed, listened } = {}
) => {
	const signal = {}

	const listeners = []
	let currentListenerRemoved
	let currentListenerRemovedReason
	let currentListenerPrevented
	let currentListenerPreventedReason
	let currentListenerPreventNext
	let currentListenerPreventNextReason
	const isListened = () => listeners.length > 0
	const has = listener => listeners.includes(listener)
	let unlistened
	const listen = (fn) => {
		// prevent duplicate
		if (has(fn)) {
			return false
		}

		const remove = reason => {
			let index = listeners.indexOf(fn)
			if (index > -1) {
				currentListenerRemoved = true
				currentListenerRemovedReason = reason
				listeners.splice(index, 1)
				if (listeners.length === 0 && unlistened) {
					unlistened(signal)
				}
				return true
			}
			return false
		}

		listeners.push(fn)
		if (listeners.length === 1 && listened) {
			unlistened = listened(signal)
		}

		return remove
	}
	const listenOnce = fn => {
		if (has(fn)) {
			return false
		}
		let remove = listen(
			() => {
				remove('once')
				return fn(...args)
			}
		}
		return remove
	}
	const clear = () => {
		listeners.length = 0
	}
	const stop = reason => {
		currentListenerPreventNext = true
		currentListenerPreventNextReason = reason
	}

	let dispatching = false
	const emit = (...args) => {
		if (dispatching && recursed) {
			recursed()
		}

		// we use dispatching to detect recursive emit() from listener callback
		// we use currentListenerRemoved to be able to remove a listener during loop execution
		// we use currentListenerPrevented just to track if the listener callback was actually called
		// we use currentListenerPreventNext to be able to stop the loop from a listener
		const executions = []
		let iterationIndex = 0
		dispatching = true
		while (iterationIndex < listeners.length) {
			const listener = listeners[iterationIndex]
			currentListenerRemoved = false
			currentListenerRemovedReason = undefined
			currentListenerPrevented = false
			currentListenerPreventedReason = undefined
			currentListenerPreventNext = false
			currentListenerPreventNextReason = undefined
			const currentListenerValue = listener(...args)

			if (currentListenerValue === false && currentListenerPreventNext === false) {
				currentListenerPreventNext = true
				currentListenerPreventNextReason = "returned false"
			}

			executions.push({
				removed: currentListenerRemoved,
				removedReason: currentListenerRemovedReason,
				prevented: currentListenerPrevented,
				preventedReason: currentListenerPreventedReason,
				preventNext: currentListenerPreventNext,
				preventNextReason: currentListenerPreventNextReason,
				value: currentListenerValue
			})

			if (currentListenerPreventNext) {
				break
			}
			// in ['a', 'b', 'c', 'd'], removing 'b' at index 1
			// when iteration is at index 0, next index must be 1
			// when iteration is at index 1, next index must be 1
			// when iteration is at index 2, next index must be 2
			if (currentListenerRemoved === false) {
				iterationIndex++
			}
		}
		dispatching = false

		return executions
	}

	Object.assign(signal, {
		isListened,
		listen,
		listenOnce,
		stop,
		clear,
		emit
	})

	return signal
}

const addRetainTalent = ({listen, emit}) => {
	let retaining = false
	let retainedArgs
	const retain = (...args) => {
		retaining = true
	}
	const forget = () => {
		retaining = false
		retainedArgs = undefined
	}
	const listenWithRetainTalent = (fn) => {
		const returnValue = listen(fn)
		if (returnValue === false) {
			return false
		}
		if (retainedArgs) {
			fn(...retainedArgs)
		}
		return returnValue
	}
	const emitWithRetainTalent = (...args) => {
		if (retaining) {
			retainedArgs = args
		}
		return emit(...args)
	}
	return {
		retain,
		forget,
		listen: listenWithRetainTalent,
		listenOnce: (fn) => {
			if (retainedArgs) {
				fn(...retainedArgs)
				return () => {}
			}
			return listenOnce(fn)
		},
		emit: emitWithRetainTalent,
	}
}

const addDisableTalent = (fn) => {
	let enabled = true
	const enable = () => {
		enabled = true
	}
	const disable = () => {
		enabled = false
	}
	const isEnabled = () => enabled
	const isDisabled = () => enabled === false
	
	return {
		enable,
		disable,
		isEnabled,
		isDisabled,
		fn: () => {
			if (isDisabled()) {
				return false
			}
			return fn(...args)
		}
	}
}
