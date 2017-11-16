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

export const createSignal = ({ recursed = warnOnRecursed, listened, smart = false } = {}) => {
	const signal = {}

	const listeners = []
	let currentListenerRemoved
	let currentListenerRemovedReason
	let currentListenerPrevented
	let currentListenerPreventedReason
	let currentListenerStopped
	let currentListenerStoppedReason
	let previousEmitArgs

	let unlistened
	const createListener = ({ fn, once = false }) => {
		const listener = {}
		const getFunction = () => fn
		const remove = reason => {
			let index = listeners.indexOf(listener)
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
		const notify = (...args) => {
			if (once) {
				remove("once")
			}
			return fn(...args)
		}

		Object.assign(listener, {
			getFunction,
			remove,
			notify,
		})
		return listener
	}

	const addListener = listener => {
		listeners.push(listener)
		if (listeners.length === 1 && listened) {
			unlistened = listened(signal)
		}
		if (smart && previousEmitArgs) {
			listener.notify(...previousEmitArgs)
		}
	}

	const isListened = () => listeners.length > 0

	const has = fn => listeners.some(({ getFunction }) => getFunction() === fn)

	const listen = fn => {
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

	const listenOnce = fn => {
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

	const clear = () => {
		listeners.length = 0
	}

	const stop = reason => {
		currentListenerStopped = true
		currentListenerStoppedReason = reason
	}

	let dispatching = false
	const emit = (...args) => {
		previousEmitArgs = args
		if (dispatching && recursed) {
			recursed()
		}

		// we use dispatching to detect recursive emit() from listener callback
		// we use currentListenerRemoved to be able to remove a listener during loop execution
		// we use currentListenerPrevented just to track if the listener callback was actually called
		// we use currentListenerPreventNext to be able to stop the loop from a listener
		const executions = []
		let iterationIndex = 0
		let somePreviousListenedStopped = false
		dispatching = true
		while (iterationIndex < listeners.length) {
			currentListenerRemoved = false
			currentListenerRemovedReason = undefined
			currentListenerStopped = false
			currentListenerStoppedReason = undefined
			let currentListenerValue

			if (somePreviousListenedStopped) {
				currentListenerPrevented = true
				currentListenerPreventedReason = "a previous listener stopped"
			} else {
				currentListenerPrevented = false
				currentListenerPreventedReason = undefined

				const listener = listeners[iterationIndex]
				currentListenerValue = listener.notify(...args)

				if (currentListenerValue === false && currentListenerStopped === false) {
					currentListenerStopped = true
					currentListenerStoppedReason = "returned false"
				}

				if (currentListenerStopped) {
					somePreviousListenedStopped = true
				}
			}

			executions.push({
				removed: currentListenerRemoved,
				removedReason: currentListenerRemovedReason,
				stopped: currentListenerStopped,
				stoppedReason: currentListenerStoppedReason,
				prevented: currentListenerPrevented,
				preventedReason: currentListenerPreventedReason,
				value: currentListenerValue,
			})

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
		emit,
	})

	return signal
}
