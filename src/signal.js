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

export const stop = (reason) => {
	return {
		instruction: "stop",
		reason,
	}
}

const isStopInstruction = (value) => {
	return typeof value === "object" && value.instruction === "stop"
}

export const createSignal = ({ recursed = warnOnRecursed, installer, smart = false } = {}) => {
	const listeners = []

	let previousEmitArgs
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

	let addListener
	const removeAllWhileCalling = (fn) => {
		const beforeCallListeners = listeners.slice()

		beforeCallListeners.forEach((listener) => {
			listener.remove(`calling ${fn}`)
		})

		fn()

		beforeCallListeners.forEach((listener, index) => {
			addListener(listener, index)
		})
	}

	let installed = false
	let uninstaller
	const uninstall = () => {
		if (installed === false) {
			throw new Error("signal not installed")
		}
		installed = false
		if (uninstaller) {
			uninstaller()
			uninstaller = null
		}
	}

	const install = () => {
		if (installed) {
			throw new Error(`signal already installed`)
		}
		installed = true
		if (installer) {
			const getListeners = () => listeners.slice()

			uninstaller = installer({ getListeners, emit, removeAllWhileCalling })
		}
	}

	addListener = (listener, index = listeners.length) => {
		listeners.splice(index, 0, listener)
		if (listeners.length === 1 && installed === false) {
			install()
		}
		if (smart && previousEmitArgs) {
			listener.notify(...previousEmitArgs)
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
			if (listeners.length === 0 && installed) {
				uninstall()
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
			} else if (isStopInstruction(returnValue)) {
				stopped = true
				stopReason = returnValue.reason
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

	return Object.freeze({
		isListened,
		listen,
		listenOnce,
		emit,
		install,
		uninstall,
		removeAllWhileCalling,
	})
}
