// https://github.com/dmail-old/notifier/blob/master/index.js
// https://github.com/cowboy/jquery-throttle-debounce/blob/master/jquery.ba-throttle-debounce.js
// https://github.com/kriskowal/gtor/blob/master/signals.md
// https://remysharp.com/2010/07/21/throttling-function-calls

const recursiveMessage = `emit called recursively, its often the sign of an error.
You can disable his recursive check doing createSignal({ recursed: null })`

export const warnOnRecursed = () => console.warn(recursiveMessage)
export const throwOnRecursed = () => {
	throw new Error(recursiveMessage)
}

export const createSignal = ({ recursed = warnOnRecursed, listened, smart = false } = {}) => {
	const signal = {}

	const listeners = []
	let previousEmitArgs

	let unlistened
	const triggerUnlistened = () => {
		if (unlistened) {
			unlistened(signal)
			unlistened = null
		}
	}

	const triggerListened = () => {
		if (listened) {
			unlistened = listened(signal)
		}
	}

	const createListener = ({ fn, once = false }) => {
		const listener = {}

		let removed
		let removeReason
		let returnValue
		let stopped
		let stopReason

		const remove = (reason) => {
			const index = listeners.indexOf(listener)
			if (index === -1) {
				return false
			}

			removed = true
			removeReason = reason

			listeners.splice(index, 1)
			if (listeners.length === 0) {
				triggerUnlistened()
			}

			return true
		}

		const notify = (...args) => {
			removed = false
			removeReason = undefined
			stopped = false
			stopReason = undefined

			if (once) {
				remove("once")
			}

			returnValue = fn(...args)
			if (returnValue === false) {
				stopped = true
				stopReason = "returned false"
			}

			return {
				removed,
				removeReason,
				stopped,
				stopReason,
				returnValue,
			}
		}

		Object.assign(listener, {
			fn,
			remove,
			notify,
		})

		return Object.freeze(listener)
	}

	const addListener = (listener) => {
		listeners.push(listener)
		if (listeners.length === 1) {
			triggerListened()
		}
		if (smart && previousEmitArgs) {
			listener.notify(...previousEmitArgs)
		}
	}

	const isListened = () => listeners.length > 0

	const has = (fn) => listeners.some(({ fn: listenerFn }) => listenerFn === fn)

	const listen = (fn) => {
		// prevent duplicate
		if (has(fn)) {
			return false
		}

		const listener = createListener({
			fn,
		})
		addListener(listener)

		return listener.remove
	}

	const listenOnce = (fn) => {
		// prevent duplicate
		if (has(fn)) {
			return false
		}

		const listener = createListener({
			fn,
			once: true,
		})
		addListener(listener)

		return listener.remove
	}

	const removeAllListeners = () => {
		const savedListeners = listeners.slice()
		listeners.length = 0
		triggerUnlistened()
		return () => {
			listeners.push(...savedListeners)
			triggerListened()
		}
	}

	let dispatching = false
	const emit = (...args) => {
		previousEmitArgs = args
		if (dispatching && recursed) {
			recursed()
		}

		// we use dispatching to detect recursive emit() from listener
		const executions = []
		let iterationIndex = 0
		dispatching = true
		while (iterationIndex < listeners.length) {
			const listener = listeners[iterationIndex]
			const result = listener.notify(...args)
			executions.push(result)

			if (result.stopped) {
				break
			}

			// in ['a', 'b', 'c', 'd'], removing 'b' at index 1
			// when iteration is at index 0, next index must be 1
			// when iteration is at index 1, next index must be 1
			// when iteration is at index 2, next index must be 2
			if (result.removed === false) {
				iterationIndex++
			}
		}
		dispatching = false

		return executions
	}

	const getListeners = () => listeners.slice()

	Object.assign(signal, {
		isListened,
		listen,
		listenOnce,
		removeAllListeners,
		emit,
		getListeners,
	})

	return Object.freeze(signal)
}

export const createFunctionNotDetectedBySignal = ({ removeAllListeners }, fn) => () => {
	const restoreListeners = removeAllListeners()
	fn()
	restoreListeners()
}
