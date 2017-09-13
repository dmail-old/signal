// https://github.com/dmail-old/notifier/blob/master/index.js
// https://github.com/cowboy/jquery-throttle-debounce/blob/master/jquery.ba-throttle-debounce.js
// https://github.com/kriskowal/gtor/blob/master/signals.md
// https://remysharp.com/2010/07/21/throttling-function-calls

const recursiveMessage = `emit called recursively, its often not desired.
If you know what you're doing pass recursiveRule: 'off' option to signal`
const defaultRecursiveRule = 'warn'

export const createSignal = ({
	memorize = false,
	recursiveRule = defaultRecursiveRule, // warn, error, off
	listened,
	args: curriedArgs = [],
} = {}) => {
	const signal = {}

	let memorizedArgs = null
	const remember = (...args) => {
		memorizedArgs = args
	}
	const forget = () => {
		memorizedArgs = null
	}

	let enabled = true
	const enable = () => {
		if (enabled === false) {
			enabled = true
		}
	}
	const disable = () => {
		if (enabled === true) {
			enabled = false
		}
	}
	const isEnabled = () => enabled
	const isDisabled = () => enabled === false

	const listeners = []
	let currentListenerRemoved
	let currentListenerRemovedReason
	let currentListenerPrevented
	let currentListenerPreventedReason
	let currentListenerPreventNext
	let currentListenerPreventNextReason
	const isListened = () => listeners.some(
		(listener) => listener.isEnabled()
	)
	const has = (listener) => listeners.includes(listener)
	let unlistened
	const listen = (fn, {once = false} = {}) => {
		// prevent duplicate
		if (listeners.some((listener) => listener.fn === fn)) {
			return false
		}

		const listener = {}

		let enabled = true
		const disable = () => {
			enabled = false
		}
		const enable = () => {
			enabled = true
		}
		const isEnabled = () => enabled
		const isDisabled = () => enabled === false
		const remove = (reason) => {
			let index = listeners.indexOf(listener)
			if (index > -1) {
				currentListenerRemoved = true
				currentListenerRemovedReason = reason
				listeners.splice(index, 1)
				if (listeners.length === 0 && unlistened) {
					unlistened(signal)
				}
				listener.remove = () => false
				return true
			}
			return false
		}
		const prevent = (reason) => {
			currentListenerPrevented = true
			currentListenerPreventedReason = reason
		}
		const preventNext = (reason) => {
			currentListenerPreventNext = true
			currentListenerPreventNextReason = reason
		}

		const run = (...args) => {
			if (isDisabled()) {
				prevent('disabled')
				return
			}
			if (once) {
				remove('once')
			}
			return fn(...args)
		}

		Object.assign(
			listener,
			{
				disable,
				enable,
				isEnabled,
				isDisabled,
				run,
				remove,
				prevent,
				preventNext,
			}
		)

		listeners.push(listener)
		if (listeners.length === 1 && listened) {
			unlistened = listened(signal)
		}
		if (memorize && memorizedArgs) {
			run(...memorizedArgs)
		}

		return listener
	}
	const listenOnce = (fn) => listen(fn, {once: true})
	const clear = () => {
		forget()
		listeners.length = 0
	}
	const stop = (reason) => {
		currentListenerPreventNext = true
		currentListenerPreventNextReason = reason
	}

	let dispatching = false
	const emit = (...args) => {
		if (isDisabled()) {
			return false
		}
		if (dispatching) {
			if (recursiveRule === 'warn') {
				console.warn(recursiveMessage)
			}
			else if (recursiveRule === 'error') {
				throw new Error(recursiveMessage)
			}
		}
		if (curriedArgs.length) {
			args = [...curriedArgs, ...args]
		}
		if (memorize) {
			remember(...args)
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
			const currentListenerValue = listener.run(...args)

			if (currentListenerValue === false && currentListenerPreventNext === false) {
				currentListenerPreventNext = true
				currentListenerPreventNextReason = 'returned false'
			}

			executions.push({
				removed: currentListenerRemoved,
				removedReason: currentListenerRemovedReason,
				prevented: currentListenerPrevented,
				preventedReason: currentListenerPreventedReason,
				preventNext: currentListenerPreventNext,
				preventNextReason: currentListenerPreventNextReason,
				value: currentListenerValue,
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

	Object.assign(
		signal,
		{
			remember,
			forget,
			enable,
			disable,
			isEnabled,
			isDisabled,
			isListened,
			has,
			listen,
			listenOnce,
			stop,
			clear,
			emit,
		}
	)

	return signal
}
