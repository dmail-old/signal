// https://github.com/cowboy/jquery-throttle-debounce/blob/master/unit/unit.js

import {createSignal} from './index.js'
import {
	ensure,
	expose,
	spy,
	assertEquals,
	assertCalls,
	assertCalledOnce,
	assertCalledTwice,
	assertNotCalled,
} from '@dmail/ensure'

const test = ensure('signal', {
	"signal is a function"() {
		assertEquals(typeof createSignal, 'function')
	},
	"listen(fn) returns an object"() {
		const source = createSignal()
		const listener = source.listen(() => {})
		assertEquals(typeof listener, 'object')
	},
	"emit(...args) call listener with passed args"() {
		const source = createSignal()
		const fn = spy()
		const value = 1
		source.listen(fn)
		source.emit(value)
		assertCalls(fn, [value])
	},
	// "emit returns a list of listener result"(signal),
	"disabled listener are not called"() {
		const source = createSignal()
		const fn = spy()
		const listener = source.listen(fn)
		listener.disable()
		assertEquals(listener.isDisabled(), true)
		assertEquals(listener.isEnabled(), false)
		source.emit()
		assertNotCalled(fn)
	},
	// "execution state is prevented & stateReason is disabled for disabled listener"
	"disabled listener ignored by isListened()"() {
		const source = createSignal()
		assertEquals(source.isListened(), false)
		const listener = source.listen(() => {})
		assertEquals(source.isListened(), true)
		listener.disable()
		assertEquals(source.isListened(), false)
	},
	"once: true remove the listener before calling it"() {
		const source = createSignal()
		const listener = source.listen(
			() => {
				assertEquals(source.isListened(), false)
				assertEquals(source.has(listener), false)
			},
			{once: true}
		)
		source.emit()
	},
	"can listen() multiple times"() {
		const source = createSignal()
		const value = 1
		const firstSpy = spy()
		const secondSpy = spy()
		source.listen(firstSpy)
		source.listen(secondSpy)
		source.emit(value)
		assertCalls(firstSpy, [value])
		assertCalls(secondSpy, [value])
	},
	"memorize: true call listener immediatly with any previously emitted arg"() {
		const listener = spy()
		const source = createSignal({
			memorize: true
		})
		const args = [0, 1]
		source.emit(...args)
		source.listen(listener)
		assertCalls(listener, args)
	},
	// "duplicate listener are ignored"(signal)
	"listened is called every time signal switch from 0->1 listener"() {
		const listened = spy()
		const source = createSignal({
			listened
		})
		const listener = source.listen(() => {})
		assertCalledOnce(listened)
		listener.remove()
		source.listen(() => {})
		assertCalledTwice(listened)
	},
	"function returned by listened called every time signal switch from 1->0 listener"() {
		const unlistened = spy()
		const source = createSignal({
			listened: () => unlistened
		})
		source.listen(() => {}).remove()
		assertCalledOnce(unlistened)
		source.listen(() => {}).remove()
		assertCalledTwice(unlistened, 2)
	},
	// "error is thrown when recursively emiting"(signal)
	"can remove a listener in the middle of emit()"() {
		// at the beginning
		{
			let listenerA
			let listenerB
			const a = spy(() => listenerA.remove())
			const b = spy()
			const source = createSignal()
			listenerA = source.listen(a)
			listenerB = source.listen(b)
			source.emit()
			assertCalledOnce(a)
			assertCalledOnce(b)
			assert(source.has(listenerA) === false)
			assert(source.has(listenerB) === true)
		}
		// at the end
		{
			let listenerA
			let listenerB
			const a = spy()
			const b = spy(() => listenerB.remove())
			const source = createSignal()
			listenerA = source.listen(a)
			listenerB = source.listen(b)
			source.emit()
			assertCalledOnce(a)
			assertCalledOnce(b)
			assert(source.has(listenerA) === true)
			assert(source.has(listenerB) === false)
		}
		// in the middle
		{
			let listenerA
			let listenerB
			let listenerC
			const a = spy()
			const b = spy(() => listenerB.remove())
			const c = spy()
			const source = createSignal()
			listenerA = source.listen(a)
			listenerB = source.listen(b)
			listenerC = source.listen(c)
			source.emit()
			assertCalledOnce(a)
			assertCalledOnce(b)
			assertCalledOnce(c)
			assert(source.has(listenerA) === true)
			assert(source.has(listenerB) === false)
			assert(source.has(listenerC) === true)
		}
	},
	// "a listener can return false to prevent run of subsequent listener"(signal)
	// must test with two listeners
	// "stop() prevent call of subsequent listener"(signal)
	// "listenerExecution.stopped is true when calling stop() during listener execution"
})
expose(test, module)
