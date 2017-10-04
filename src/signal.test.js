// https://github.com/cowboy/jquery-throttle-debounce/blob/master/unit/unit.js

import { createSignal } from "./signal.js"
import {
	isNotTrue,
	isNotFalse,
	isNotAFunction,
	isNotAnObject,
	spy,
	wasCalled,
	wasNotCalledOnce,
	wasNotCalledTwice,
	wasCalledWithoutArguments,
	wasCalledWithArgumentsDifferentFrom
} from "@dmail/ensure"

export default ensure => {
	ensure("signal is a function", ({ fail, pass }) => {
		if (isNotAFunction(createSignal)) {
			return fail("createSignal must be a function")
		}
		return pass()
	})

	ensure("listen returns an object", ({ fail, pass }) => {
		const listener = createSignal().listen(() => {})
		if (isNotAnObject(listener)) {
			return fail("signal.listen must return an object")
		}
		return pass()
	})

	ensure("listen triggers listened", ({ fail, pass }) => {
		const unlistened = spy()
		const listened = spy(() => unlistened)
		const source = createSignal({
			listened
		})
		const listener = source.listen(() => {})
		if (wasNotCalledOnce(listened)) {
			return fail("listen must call listened when it's the first listener")
		}
		listener.remove()
		if (wasNotCalledOnce(unlistened)) {
			return fail("listen return function must be called when listener is removed")
		}
		source.listen(() => {})
		if (wasNotCalledTwice(listened)) {
			return fail("listen must call listened every time a first listener is added")
		}
		return pass()
	})

	ensure("listen call immeditaly previously emited args with memorize: true", ({ fail, pass }) => {
		const listener = spy()
		const source = createSignal({
			memorize: true
		})
		const args = [0, 1]
		source.emit(...args)
		source.listen(listener)
		if (wasNotCalledOnce(listener)) {
			return fail("listen must call listener with memorize option")
		}
		if (wasCalledWithArgumentsDifferentFrom(listener, ...args)) {
			return fail("listen must call listener with previous args with memorize option")
		}
		return pass()
	})

	ensure("listenOnce remove the listener before calling it", ({ fail, pass }) => {
		const source = createSignal()
		const fn = spy()
		source.listenOnce(fn)
		source.emit()
		source.emit()
		if (wasNotCalledOnce(fn)) {
			return fail("once must call listener once")
		}
		return pass()
	})

	ensure("emit call listener with args", ({ fail, pass }) => {
		const source = createSignal()
		const fn = spy()
		const value = 1
		source.listen(fn)
		source.emit(value)

		if (wasNotCalledOnce(fn)) {
			return fail("emit must call listener")
		}
		if (wasCalledWithoutArguments(fn)) {
			return fail("emit must propagate args to listener")
		}
		if (wasCalledWithArgumentsDifferentFrom(fn, value)) {
			return fail("emit must propagate emitted args to listener")
		}
		return pass()
	})

	ensure("emit call all listeners", ({ fail, pass }) => {
		const source = createSignal()
		const value = 1
		const firstSpy = spy()
		const secondSpy = spy()
		source.listen(firstSpy)
		source.listen(secondSpy)
		source.emit(value)

		if (wasNotCalledOnce(firstSpy) || wasNotCalledOnce(secondSpy)) {
			return fail("emit must call all listeners")
		}
		return pass()
	})

	// "emit returns a list of listener result"(signal),

	ensure("emit does not call disabled listener", ({ fail, pass }) => {
		const source = createSignal()
		const fn = spy()
		const listener = source.listen(fn)
		listener.disable()
		if (isNotTrue(listener.isDisabled())) {
			return fail("disabled listener.isDisabled() must return true")
		}
		if (isNotFalse(listener.isEnabled())) {
			return fail("disabled listener.isEnabled() must return false")
		}
		source.emit()
		if (wasCalled(fn)) {
			return fail("disabled listener must not be called")
		}
		return pass()
	})

	// "execution state is prevented & stateReason is disabled for disabled listener"

	ensure("isListened", ({ fail, pass }) => {
		const source = createSignal()
		if (isNotFalse(source.isListened())) {
			return fail("source.isListened must be false when not listened")
		}
		const listener = source.listen(() => {})
		if (isNotTrue(source.isListened())) {
			return fail("source.isListened must be true when listened")
		}
		listener.disable()
		if (isNotFalse(source.isListened())) {
			return fail("source.isListened must be false when listened by disabled listener")
		}
		return pass()
	})

	// "duplicate listener are ignored"(signal)

	// "error is thrown when recursively emiting"(signal)

	ensure("listener.remove called on first listener during emit", ({ fail, pass }) => {
		let firstListener
		const a = spy(() => firstListener.remove())
		const b = spy()
		const source = createSignal()
		firstListener = source.listen(a)
		source.listen(b)
		source.emit()
		source.emit()

		if (wasNotCalledOnce(a)) {
			return fail("first listener removed must be called once")
		}
		if (wasNotCalledTwice(b)) {
			return fail("listener after first listener must be called twice")
		}
		return pass()
	})

	ensure("listener.remove called on last listener during emit", ({ fail, pass }) => {
		let lastListener
		const a = spy()
		const b = spy(() => lastListener.remove())
		const source = createSignal()
		source.listen(a)
		lastListener = source.listen(b)
		source.emit()
		source.emit()

		if (wasNotCalledTwice(a)) {
			return fail("first listener must be called twice")
		}
		if (wasNotCalledOnce(b)) {
			return fail("last removed listener must be called once")
		}
		return pass()
	})

	ensure("listener.remove called on middle listener during emit", ({ fail, pass }) => {
		let middleListener
		const a = spy()
		const b = spy(() => middleListener.remove())
		const c = spy()
		const source = createSignal()
		source.listen(a)
		middleListener = source.listen(b)
		source.listen(c)
		source.emit()
		source.emit()

		if (wasNotCalledTwice(a)) {
			return fail("first listener must be called twice")
		}
		if (wasNotCalledOnce(b)) {
			return fail("middle remove listener must be called once")
		}
		if (wasNotCalledTwice(c)) {
			return fail("last listener must be called twice")
		}
		return pass()
	})

	// "a listener can return false to prevent run of subsequent listener"(signal)

	// must test with two listeners

	// "stop() prevent call of subsequent listener"(signal)

	// "listenerExecution.stopped is true when calling stop() during listener execution"
}
