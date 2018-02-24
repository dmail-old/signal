# Signal api

* [listen(fn)](#listenfn)
* [listenOnce(fn)](#listenoncefn)
* [emit(...args)](#emitargs)
* [isListened()](#islistened)
* [createSignal({ installer })](#createsignal-installer-)
* [createSignal({ recursed })](#createsignal-recursed-)
* [createSignal({ smart })](#createsignal-smart-)

## listen(fn)

Registers a function that will be called when emit is called.
You can listen unlimited amount of function.
Please note there is a duplicate check on fn as shown below.

```javascript
import { createSignal } from "@dmail/signal"

const { listen } = createSignal()

const fnA = () => {}
const fnB = () => {}

listen(fnA)
listen(fnA) // duplicate check: it returns false because fnA is already listening this signal
listen(fnB)
```

## listenOnce(fn)

listenOnce register a function that is autoremoved when called.

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

Emit will call listeners with provided args.

```javascript
import { createSignal } from "@dmail/signal"

const { listen, emit } = createSignal()

let sentence = ""
listen((string) => {
	sentence += string
})

emit("hello")
emit("world")

sentence // "helloworld"
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

## createSignal({ installer })

createSignal accepts an installer function.
This function will be called every time a first listener is added to signal.
Installer function can return an other function (called uninstaller).
The uninstaller function will be called when signal last listener is removed.

```javascript
import { createSignal } from "@dmail/signal"

const installer = ({ emit }) => {
	document.body.addEventListener("click", emit)
	return () => {
		document.body.removeEventListener("click", emit)
	}
}
const { listen } = createSignal({ installer })

let bodyClickCount = 0
const removeListener = listen(() => {
	bodyClickCount++
})
document.body.click()

bodyClickCount // 1

removeListener()

document.body.click()

bodyClickCount // 1
```

## createSignal({ recursed })

createSignal accepts a recursed function

```javascript
import { createSignal } from "@dmail/signal"

const recursed = () => {}
const { listen, emit } = createSignal({ recursed })

listen(() => emit()) // calls recursed then throw because infinite recursion
```

By default recursed is a function that logs a warning in the console.

## createSignal({ smart })

createSignal accepts a smart boolean which is false by default.
When true a listener function is immediatly called if signal has previously emitted something

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
