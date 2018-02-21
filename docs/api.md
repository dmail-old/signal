# Signal api

* [listen(fn)](#listenfn)
* [listenOnce(fn)](#listenoncefn)
* [emit(...args)](#emitargs)
* [isListened()](#islistened)
* [createSignal({ listened })](#createsignal-listened-)
* [createSignal({ recursed })](#createsignal-recursed-)
* [createSignal({ smart })](#createsignal-smart-)

## listen(fn)

Listen expect exactly one argument, a function (called listener). The listener is called when
signal.emit is called. You can call listen() multiple times.

```javascript
import { createSignal } from "@dmail/signal"

const { listen } = createSignal()

const fnA = () => {}
const fnB = () => {}

listen(fnA)
listen(fnA) // this will return false because duplicate listener are ignored
listen(fnB)
```

## listenOnce(fn)

listenOnce register a listener that is autoremoved when called

```javascript
import { createSignal } from "@dmail/signal"

const { listenOnce, emit } = createSignal()

let callCount = 0
listenOnce(() => {
	callCount++
})
emit()
emit()

callCount // 1
```

## emit(...args)

Emit will call listeners with provided args

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()

let sentence = ""
listen((string) => {
	sentence += string
})
emit("hello") // call listeners with "foo"
emit("world") // call listeners with "bar"
// here sentence === "helloworld"
```

## isListened()

isListener returns if there is a listener on the signal

```javascript
import { createSignal } from "@dmail/signal"

const { listen, isListened } = createSignal()

isListened() // false
listen(() => {})
isListened() // true
```

## createSignal({ listened })

createSignal accepts a listened function. This function will be called every time isListened()
transit from false to true. Listened function can return an other function (called unlistened). The
unlistened function will be called when isListened() transit from true to false.

```javascript
import { createSignal } from "@dmail/signal"

let hasListener = false
const listened = () => {
	hasListener = true
	return () => {
		hasListener = false
	}
}
const { listen, emit } = createSignal({ listened })

// here hasListener === false
const removeListener = listen(() => {})
// here hasListener === true
removeListener()
// here hasListener === false
```

## createSignal({ recursed })

createSignal accepts a recursed function

```javascript
import { createSignal } from "@dmail/signal"

let containsRecursion = false
const recursed = () => {
	containsRecursion = true
}
const { listen, emit } = createSignal({ recursed })

listen(() => emit()) // calls recursed then throw because infinite recursion
```

By default recursed is a function that logs a warning in the console.

## createSignal({ smart })

createSignal accepts a smart boolean which is false by default. When true a listener function is
immediatly called if signal has previously emitted something

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal({ smart: true })

emit("foo")
let value
listen((arg) => {
	value = arg
})
// here listener is immediatly called so value === "foo"
```

## Removing a listener

Listen returns a function you can call to remove that listener

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()

let called = false
const removeListener = listen(() => {
	called = true
})
removeListener()
emit()

called // false
```
